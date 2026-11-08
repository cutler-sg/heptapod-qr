/**
 * heptapod-ink: write text as Arrival-style circular logograms (SVG) and read them back.
 *
 * Format overview (v1, restored — byte-identical to published heptapod-ink@0.1.1)
 *   The text, a mode bit and a CRC-16 are packed into one big integer, written in base 10.
 *   Each base-10 digit is a "slot" on the ring: slot % 5 is the swelling
 *   (0 none, 1 small out, 2 large out, 3 small in, 4 large in) and slot >= 5 adds an outward tendril.
 *   Reading starts at the gap and runs clockwise, following the order of the stroke's points.
 *   Decoding reads geometry from the SVG's path data only, so styling, filters, masks,
 *   transforms and SMIL animation never affect it.
 *
 *   The ring's point count is the format header: a v1 ring holds 2 * (29 + 8N) points
 *   (outer ring run 29 + 8N = 2*LEAD + N*PTS + 1 points, then the inner ring reversed).
 *   Tendrils are closed 122-point outlines (2 * (TENDRIL_STEPS + 1) = 122).
 *
 *   The brief v2 era (releases 0.1.2/0.1.3) used rings of 2 * (8N + 28) points and
 *   12-point tendrils. Those files are NOT readable here and fail loudly: for a v2
 *   ring, N = (outerN - 29) / 8 = N' + (7/8 - ... ) is never an integer, so decode
 *   throws LogogramError("unknown_format") — never a wrong text, never a silent decode.
 */

// The core public API is exactly { encode, decode, LogogramError }. Everything
// else (parse, the low-level packing/drawing helpers, SMIL animation) lives in
// the add-on package packages/heptapod-ink-extras.

// ---------- format constants (changing any of these breaks existing files) ----------
const CHARSET = " abcdefghijklmnopqrstuvwxyz0123456789.,?!'-:;\n";
const PTS = 8, LEAD = 14, MIN_SLOTS = 10, SLOT_PX = 30, BASE_W = 12, MARGIN = 150, STATES = 10;
const SWELL = [0, 16, 36];
const TENDRIL_STEPS = 60;
const TAU = Math.PI * 2;
const ENCODER = new TextEncoder(), B10 = BigInt(STATES), BC = BigInt(CHARSET.length + 1);
const { cos, sin, exp, pow, min, max, floor, round, hypot, atan2, imul } = Math;

const radiusFor = n => max(130, n * SLOT_PX / (TAU * 0.88));

export class LogogramError extends Error {
  /**
   * @param {"not_svg"|"no_viewbox"|"no_strokes"|"unknown_format"|"checksum"} code
   * @param {string} message
   */
  constructor(code, message) {
    super(message);
    this.name = "LogogramError";
    this.code = code;
  }
}

const crc16 = bytes => {
  let c = 0xFFFF;
  for (const b of bytes) {
    c ^= b << 8;
    for (let i = 0; i < 8; i++) c = c & 0x8000 ? ((c << 1) ^ 0x1021) & 0xFFFF : (c << 1) & 0xFFFF;
  }
  return c;
};

// ---------- text <-> slots ----------

/** Pack text into slot values (least significant first). @param {string} text */
function textToSlots(text) {
  const bytes = ENCODER.encode(text);
  const compact = [...text].every(ch => CHARSET.includes(ch));
  let v = 0n;
  if (compact) {
    const chars = [...text];
    for (let i = chars.length - 1; i >= 0; i--) v = v * BC + BigInt(CHARSET.indexOf(chars[i]) + 1);
  } else {
    for (let i = bytes.length - 1; i >= 0; i--) v = v * 257n + BigInt(bytes[i] + 1);
  }
  const checksum = crc16(bytes);
  let V = (v * 2n + (compact ? 0n : 1n)) * 65536n + BigInt(checksum);
  const slots = [];
  while (V > 0n) { slots.push(Number(V % B10)); V /= B10; }
  while (slots.length < MIN_SLOTS) slots.push(0);
  return { slots, checksum, compact };
}

/** Unpack slot values into text. Throws LogogramError("checksum") when they don't add up. @param {number[]} slots */
function slotsToText(slots) {
  let V = 0n;
  for (let i = slots.length - 1; i >= 0; i--) V = V * B10 + BigInt(slots[i]);
  const checksum = Number(V % 65536n); V /= 65536n;
  const compact = V % 2n === 0n; let v = V / 2n;
  let text;
  try {
    if (compact) {
      let s = "";
      while (v > 0n) { const d = Number(v % BC); v /= BC; if (d === 0) throw 0; s += CHARSET[d - 1]; }
      text = s;
    } else {
      const out = [];
      while (v > 0n) { const d = Number(v % 257n); v /= 257n; if (d === 0) throw 0; out.push(d - 1); }
      text = new TextDecoder("utf-8", { fatal: true }).decode(new Uint8Array(out));
    }
  } catch {
    text = null;
  }
  if (text === null || crc16(ENCODER.encode(text)) !== checksum) {
    throw new LogogramError("checksum", "The marks don't add up: the checksum failed. The file may be damaged or edited.");
  }
  return { text, checksum };
}

// ---------- seeded randomness (decoration only; decoding never uses it) ----------
const hash32 = s => { let h = 0x811c9dc5; for (const ch of s) { h ^= ch.codePointAt(0); h = imul(h, 16777619); } return h >>> 0; };
function mulberry32(a) {
  return () => {
    a |= 0; a = a + 0x6D2B79F5 | 0; let t = imul(a ^ a >>> 15, 1 | a);
    t = t + imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}
const gauss = rng => Math.sqrt(-2 * Math.log(rng() || 1e-9)) * Math.cos(TAU * rng());
function makeNoise(rng, oct) {
  const terms = []; let norm = 0;
  for (let i = 0; i < oct; i++) { const a = 1 / (i + 1.4); norm += a; terms.push([1 + floor(rng() * 3 * (i + 1)), rng() * TAU, a]); }
  return t => terms.reduce((s, [f, p, a]) => s + a * sin(f * t + p), 0) / norm;
}

// ---------- rendering ----------
const f2 = n => n.toFixed(2);
const polyD = pts => "M" + pts.map(([x, y]) => f2(x) + "," + f2(y)).join(" L") + " Z";
const escAttr = s => String(s).replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");

/** Closed 122-point tendril outline: left edge out, right edge back, tapering to 0.4 px at the tip. */
function tendrilPts(x, y, heading, len, width, curl) {
  const ds = len / TENDRIL_STEPS, L = [], Rt = [];
  for (let i = 0; i <= TENDRIL_STEPS; i++) {
    const s = i / TENDRIL_STEPS, w = width * pow(1 - s, 1.3) + 0.4;
    const nx = -sin(heading), ny = cos(heading);
    L.push([x + nx * w / 2, y + ny * w / 2]); Rt.push([x - nx * w / 2, y - ny * w / 2]);
    heading += curl * pow(s, 1.6) * ds;
    x += cos(heading) * ds; y += sin(heading) * ds;
  }
  return L.concat(Rt.reverse());
}

/**
 * Write text as a logogram SVG. The same text and options always produce the same SVG.
 * (SMIL animation is not baked in here; heptapod-ink-extras can add it
 * to the returned SVG without changing what it decodes to.)
 * @param {string} text
 * @param {import("./index").EncodeOptions} [options]
 */
export function encode(text, options = {}) {
  if (typeof text !== "string" || text.length === 0) throw new TypeError("encode() needs a non-empty string");
  const { slots, checksum, compact } = textToSlots(text);
  const seed = options.seed ?? (hash32(text) ^ checksum) >>> 0;
  const rng = mulberry32(seed);
  const N = slots.length, R = radiusFor(N), S = round(2 * (R + MARGIN)), C = S / 2;
  // v1 format header: the ring holds 2*outerN points with
  // outerN = 2*LEAD + N*PTS + 1 = 29 + 8N.
  const outerN = 2 * LEAD + N * PTS + 1;
  const fg = escAttr(options.color ?? "currentColor");
  const span = TAU - (0.28 + rng() * 0.2);
  const a0 = rng() * TAU;
  const ang = j => a0 + span * j / (outerN - 1);
  const cj = i => LEAD + i * PTS + PTS / 2;
  const thick = makeNoise(rng, 6), wob = makeNoise(rng, 4);
  const sigma = PTS * 0.52;

  const outer = [], inner = [];
  for (let j = 0; j < outerN; j++) {
    const t = ang(j);
    const taper = pow(min(1, (j + 1.5) / LEAD), 0.5) * pow(min(1, (outerN - 1 - j) / LEAD), 1.3);
    let w = BASE_W * (1 + 0.28 * thick(t)), bias = 0.5;
    const k = round((j - LEAD - PTS / 2) / PTS);
    for (let i = k - 1; i <= k + 1; i++) {
      if (i < 0 || i >= N) continue;
      const s = slots[i] % 5; if (!s) continue;
      const g = exp(-(((j - cj(i)) / sigma) ** 2));
      w += SWELL[s === 1 || s === 3 ? 1 : 2] * g;
      bias += (s <= 2 ? 1 : -1) * 0.42 * g;
    }
    w = max(w * taper, 0.5);
    const r = R + 2 * wob(t), ro = r + w * bias, ri = r - w * (1 - bias);
    outer.push([C + ro * cos(t), C + ro * sin(t)]);
    inner.push([C + ri * cos(t), C + ri * sin(t)]);
  }
  let ink = `<path d="${polyD(outer.concat(inner.reverse()))}"/>`;

  for (let i = 0; i < N; i++) {
    const td = floor(slots[i] / 5), sw = slots[i] % 5, t = ang(cj(i));
    if (td) {
      const hook = rng() < 0.45;
      const len = max(40, hook ? 35 + rng() * 30 : 60 + rng() * 75);
      const curl = (rng() < 0.5 ? -1 : 1) * (hook ? 0.08 + rng() * 0.07 : 0.006 + rng() * 0.025);
      const heading = t + (rng() - 0.5);
      const pts = tendrilPts(C + R * cos(t), C + R * sin(t), heading, len, 10 + rng() * 11, curl);
      ink += `<path d="${polyD(pts)}"/>`;
    }
    // ink spatter: decoration only, ignored by the decoder
    if ((sw || td) && rng() < 0.22) {
      const dir = sw >= 3 ? -1 : 1, n = 3 + floor(rng() * 9);
      for (let k = 0; k < n; k++) {
        const a = t + gauss(rng) * 0.1, r = R + dir * (16 + rng() * 40), rad = Math.abs(gauss(rng)) * 2 + 0.6;
        ink += `<circle cx="${f2(C + r * cos(a))}" cy="${f2(C + r * sin(a))}" r="${f2(rad)}"/>`;
      }
    }
  }

  const id = escAttr(options.idPrefix ?? "hp" + (seed >>> 0).toString(36));
  let defs = "", gattr = "";
  if (options.ink ?? true) {
    defs = `<defs><filter id="${id}-ink" x="-10%" y="-10%" width="120%" height="120%"><feTurbulence type="fractalNoise" baseFrequency="0.035" numOctaves="3" seed="${floor(rng() * 999)}"></feTurbulence><feDisplacementMap in="SourceGraphic" scale="${f2(4 * S / 600)}"/><feGaussianBlur stdDeviation="0.4"/></filter></defs>`;
    gattr = ` filter="url(#${id}-ink)"`;
  }
  const bg = options.background && options.background !== "none" ? `<rect width="100%" height="100%" fill="${escAttr(options.background)}"/>` : "";
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${S} ${S}" width="${S}" height="${S}">${defs}${bg}<g fill="${fg}"${gattr}>${ink}</g></svg>`;
  return { svg, slots: N, radius: R, size: S, checksum, compact };
}

// ---------- reading ----------

function parsePts(d) {
  const nums = (d.match(/-?(?:\d+\.?\d*|\.\d+)(?:e[-+]?\d+)?/gi) || []).map(Number);
  const pts = []; for (let i = 0; i + 1 < nums.length; i += 2) pts.push([nums[i], nums[i + 1]]);
  return pts;
}

function attr(tag, name) {
  const m = tag.match(new RegExp(`\\s${name}\\s*=\\s*(["'])(.*?)\\1`, "is"));
  return m ? m[2] : null;
}

/**
 * Extract the drawable geometry of an SVG string: its viewBox and every path as a
 * point list, ignoring <defs>/<mask>. Internal: heptapod-ink-extras has a fuller
 * version that also returns circles. Uses plain string parsing, so it runs in
 * browsers, workers and Node alike.
 * @param {string} svg
 */
function parse(svg) {
  if (typeof svg !== "string" || !/<svg\b/i.test(svg)) throw new LogogramError("not_svg", "That isn't an SVG file.");
  const root = svg.match(/<svg\b[^>]*>/i)[0];
  const vb = (attr(root, "viewBox") || "").trim().split(/[\s,]+/).map(Number);
  if (vb.length !== 4 || vb.some(n => !Number.isFinite(n))) throw new LogogramError("no_viewbox", "The SVG has no viewBox, so its centre can't be found.");
  const body = svg.replace(/<!--.*?-->/gs, "").replace(/<(defs|mask)\b.*?<\/\1\s*>/gis, "");
  return [...body.matchAll(/<path\b[^>]*>/gi)].map(m => parsePts(attr(m[0], "d") || "")).filter(p => p.length);
}

const BAD = "This logogram wasn't made by heptapod-ink, or an editor has rewritten its paths.";

/**
 * Read the text back out of a logogram SVG made by this library (animated, rotated about its
 * centre, restyled or not). Throws {@link LogogramError} if it can't.
 * @param {string} svg
 */
export function decode(svg) {
  if (typeof svg !== "string" || !/<svg\b/i.test(svg)) throw new LogogramError("not_svg", "That isn't an SVG file.");
  const root = svg.match(/<svg\b[^>]*>/i)[0];
  const vb = (attr(root, "viewBox") || "").trim().split(/[\s,]+/).map(Number);
  if (vb.length !== 4 || vb.some(n => !Number.isFinite(n))) throw new LogogramError("no_viewbox", "The SVG has no viewBox, so its centre can't be found.");
  const body = svg.replace(/<!--.*?-->/gs, "").replace(/<(defs|mask)\b.*?<\/\1\s*>/gis, "");
  const paths = [...body.matchAll(/<path\b[^>]*>/gi)].map(m => parsePts(attr(m[0], "d") || "")).filter(p => p.length);
  if (!paths.length) throw new LogogramError("no_strokes", "No ink strokes found in this SVG.");
  const cx = vb[0] + vb[2] / 2, cy = vb[1] + vb[3] / 2;
  const ring = paths.reduce((a, b) => b.length > a.length ? b : a);
  // v1 format header: ring holds 2*outerN points, outerN = 2*LEAD + N*PTS + 1 = 29 + 8N.
  // The v2 era (0.1.2/0.1.3) used rings of 2*(8N+28) points; for those,
  // (outerN - 29) / 8 is never an integer, so v2 files fail loudly below
  // with unknown_format instead of decoding to garbage.
  const outerN = ring.length / 2, N = (outerN - 1 - 2 * LEAD) / PTS;
  if (!Number.isInteger(N) || N < 1) throw new LogogramError("unknown_format", BAD);
  const R = radiusFor(N);
  const polar = ([x, y]) => [hypot(x - cx, y - cy), atan2(y - cy, x - cx)];
  const outer = ring.slice(0, outerN), inner = ring.slice(outerN).reverse();
  const a0 = polar(outer[0])[1];
  const span = ((polar(outer[outerN - 1])[1] - a0) % TAU + TAU) % TAU;

  const slots = new Array(N).fill(0);
  for (let i = 0; i < N; i++) {
    const j = LEAD + i * PTS + PTS / 2;
    const ro = polar(outer[j])[0], ri = polar(inner[j])[0], w = ro - ri, mid = (ro + ri) / 2 - R;
    // absolute stroke width classes: < 20 px -> plain, < 38 px -> small swell, else large;
    // the sign of the midline offset gives the bulge direction
    const size = w < 20 ? 0 : w < 38 ? 1 : 2;
    slots[i] = size === 0 ? 0 : mid > 0 ? size : size + 2;
  }
  // every non-ring path with exactly 2*(TENDRIL_STEPS+1) = 122 points is a tendril;
  // the tip (points at index 20 from each end) sits further out than the base -> tendril present
  for (const p of paths) {
    if (p === ring || p.length !== 2 * (TENDRIL_STEPS + 1)) continue;
    const s = [(p[0][0] + p[p.length - 1][0]) / 2, (p[0][1] + p[p.length - 1][1]) / 2];
    const m = 20, mp = [(p[m][0] + p[p.length - 1 - m][0]) / 2, (p[m][1] + p[p.length - 1 - m][1]) / 2];
    const [r0, th] = polar(s), r1 = polar(mp)[0];
    const j = (((th - a0) % TAU + TAU) % TAU) / span * (outerN - 1);
    const i = round((j - LEAD - PTS / 2) / PTS);
    if (i >= 0 && i < N && r1 > r0) slots[i] = slots[i] % 5 + 5;
  }
  const { text, checksum } = slotsToText(slots);
  return { text, checksum, slots: N };
}
