/**
 * Low-level renderer for heptapod-ink slot values, moved out of the core
 * package (with the SMIL animation machinery that the trimmed core dropped).
 * The geometry it draws is read back by heptapod-ink's decode().
 */

// ---------- format constants (must match the core renderer's v1 geometry) ----------
const PTS = 8, LEAD = 14, SLOT_PX = 30, BASE_W = 12, MARGIN = 150;
const SWELL = [0, 16, 36];
const TENDRIL_STEPS = 60;
const TAU = Math.PI * 2;

const radiusFor = n => Math.max(130, n * SLOT_PX / (TAU * 0.88));

// ---------- seeded randomness (decoration only; decoding never uses it) ----------
function hash32(s) { let h = 0x811c9dc5; for (const ch of s) { h ^= ch.codePointAt(0); h = Math.imul(h, 16777619); } return h >>> 0; }
function mulberry32(a) {
  return () => {
    a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}
function gauss(rng) { return Math.sqrt(-2 * Math.log(rng() || 1e-9)) * Math.cos(TAU * rng()); }
function makeNoise(rng, oct) {
  const terms = []; let norm = 0;
  for (let i = 0; i < oct; i++) { const a = 1 / (i + 1.4); norm += a; terms.push([1 + Math.floor(rng() * 3 * (i + 1)), rng() * TAU, a]); }
  return t => terms.reduce((s, [f, p, a]) => s + a * Math.sin(f * t + p), 0) / norm;
}

// ---------- rendering ----------
const f2 = n => n.toFixed(2);
const polyD = pts => "M" + pts.map(([x, y]) => f2(x) + "," + f2(y)).join(" L") + " Z";
const escAttr = s => String(s).replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");

/** Closed 122-point tendril outline: left edge out, right edge back, tapering to 0.4 px at the tip. */
function tendrilPts(x, y, heading, len, width, curl) {
  const ds = len / TENDRIL_STEPS, L = [], Rt = [];
  for (let i = 0; i <= TENDRIL_STEPS; i++) {
    const s = i / TENDRIL_STEPS, w = width * Math.pow(1 - s, 1.3) + 0.4;
    const nx = -Math.sin(heading), ny = Math.cos(heading);
    L.push([x + nx * w / 2, y + ny * w / 2]); Rt.push([x - nx * w / 2, y - ny * w / 2]);
    heading += curl * Math.pow(s, 1.6) * ds;
    x += Math.cos(heading) * ds; y += Math.sin(heading) * ds;
  }
  return L.concat(Rt.reverse());
}

/**
 * Draw slot values as a logogram. Most callers want heptapod-ink's encode()
 * plus {@link animate} instead.
 * @param {number[]} slots
 * @param {number} seed decoration seed (uint32)
 * @param {import("./index").RenderOptions} [opt]
 */
export function renderSlots(slots, seed, opt = {}) {
  const rng = mulberry32(seed);
  const N = slots.length, R = radiusFor(N), S = Math.round(2 * (R + MARGIN)), C = S / 2;
  // v1 format header: the ring holds 2*outerN points with
  // outerN = 2*LEAD + N*PTS + 1 = 29 + 8N.
  const outerN = 2 * LEAD + N * PTS + 1;
  const gap = opt.gap ?? 0.28 + rng() * 0.2, span = TAU - gap;
  const a0 = opt.start ?? rng() * TAU;
  const ang = j => a0 + span * j / (outerN - 1);
  const cj = i => LEAD + i * PTS + PTS / 2;
  const thick = makeNoise(rng, 6), wob = makeNoise(rng, 4);
  const sigma = PTS * 0.52, tScale = opt.tendrilScale ?? 1;

  const outer = [], inner = [];
  for (let j = 0; j < outerN; j++) {
    const t = ang(j);
    const taper = Math.pow(Math.min(1, (j + 1.5) / LEAD), 0.5) * Math.pow(Math.min(1, (outerN - 1 - j) / LEAD), 1.3);
    let w = BASE_W * (1 + 0.28 * thick(t)), bias = 0.5;
    const k = Math.round((j - LEAD - PTS / 2) / PTS);
    for (let i = k - 1; i <= k + 1; i++) {
      if (i < 0 || i >= N) continue;
      const s = slots[i] % 5; if (!s) continue;
      const g = Math.exp(-(((j - cj(i)) / sigma) ** 2));
      w += SWELL[s === 1 || s === 3 ? 1 : 2] * g;
      bias += (s <= 2 ? 1 : -1) * 0.42 * g;
    }
    w = Math.max(w * taper, 0.5);
    const r = R + 2 * wob(t), ro = r + w * bias, ri = r - w * (1 - bias);
    outer.push([C + ro * Math.cos(t), C + ro * Math.sin(t)]);
    inner.push([C + ri * Math.cos(t), C + ri * Math.sin(t)]);
  }
  const shapes = [`<path d="${polyD(outer.concat(inner.reverse()))}"/>`];

  for (let i = 0; i < N; i++) {
    const td = Math.floor(slots[i] / 5), sw = slots[i] % 5, t = ang(cj(i));
    if (td) {
      const hook = rng() < 0.45;
      let len = hook ? 35 + rng() * 30 : 60 + rng() * 75;
      len = Math.max(40, len * tScale);
      const curl = (rng() < 0.5 ? -1 : 1) * (hook ? 0.08 + rng() * 0.07 : 0.006 + rng() * 0.025);
      const heading = t + (rng() - 0.5);
      const pts = tendrilPts(C + R * Math.cos(t), C + R * Math.sin(t), heading, len, 10 + rng() * 11, curl);
      shapes.push(`<path d="${polyD(pts)}"/>`);
    }
    // ink spatter: decoration only, ignored by the decoder
    if ((sw || td) && !opt.plain && rng() < 0.22) {
      const dir = sw >= 3 ? -1 : 1, n = 3 + Math.floor(rng() * 9);
      for (let k = 0; k < n; k++) {
        const a = t + gauss(rng) * 0.1, r = R + dir * (16 + rng() * 40), rad = Math.abs(gauss(rng)) * 2 + 0.6;
        shapes.push(`<circle cx="${f2(C + r * Math.cos(a))}" cy="${f2(C + r * Math.sin(a))}" r="${f2(rad)}"/>`);
      }
    }
  }

  const fg = escAttr(opt.color ?? "currentColor");
  const vb = opt.viewBox ?? `0 0 ${S} ${S}`;
  const size = opt.viewBox ? "" : ` width="${S}" height="${S}"`;
  // ids are per-logogram so several inline SVGs on one page don't share a filter or mask
  const id = escAttr(opt.idPrefix ?? "hp" + (seed >>> 0).toString(36));

  // Animation is SMIL so a standalone file animates on its own. It never touches path data.
  const A = opt.animate || {};
  let defs = "", gattr = "", open = "", close = "";
  if (opt.ink) {
    const drift = A.drift ? `<animate attributeName="baseFrequency" values="0.035;0.05;0.028;0.035" dur="9s" repeatCount="indefinite"/>` : "";
    defs += `<filter id="${id}-ink" x="-10%" y="-10%" width="120%" height="120%"><feTurbulence type="fractalNoise" baseFrequency="0.035" numOctaves="3" seed="${Math.floor(rng() * 999)}">${drift}</feTurbulence><feDisplacementMap in="SourceGraphic" scale="${f2(4 * S / 600)}"/><feGaussianBlur stdDeviation="0.4"/></filter>`;
    gattr = ` filter="url(#${id}-ink)"`;
  }
  if (A.draw) {
    // a ring-shaped mask stroke sweeps clockwise from the head of the brush stroke
    const rr = (R + MARGIN) / 2, dur = A.drawDuration ?? 3.5;
    defs += `<mask id="${id}-reveal"><circle cx="${C}" cy="${C}" r="${f2(rr)}" fill="none" stroke="#fff" stroke-width="${f2(2 * rr + 2)}" pathLength="1" stroke-dasharray="1 1" stroke-dashoffset="1" transform="rotate(${f2(a0 * 180 / Math.PI)} ${C} ${C})"><animate attributeName="stroke-dashoffset" from="1" to="0" dur="${dur}s" fill="freeze" calcMode="spline" keyTimes="0;1" keySplines="0.45 0 0.25 1"/></circle></mask>`;
    open = `<g mask="url(#${id}-reveal)">`; close = `</g>`;
  }
  if (A.spin) {
    const dur = A.spinDuration ?? 90;
    open = `<g><animateTransform attributeName="transform" type="rotate" from="0 ${C} ${C}" to="360 ${C} ${C}" dur="${dur}s" repeatCount="indefinite"/>` + open;
    close += `</g>`;
  }
  defs = defs ? `<defs>${defs}</defs>` : "";
  const bg = opt.background && opt.background !== "none" ? `<rect width="100%" height="100%" fill="${escAttr(opt.background)}"/>` : "";
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${vb}"${size}>${defs}${bg}${open}<g fill="${fg}"${gattr}>${shapes.join("")}</g>${close}</svg>`;
  return { svg, slots: N, radius: R, size: S };
}

export { hash32 };
