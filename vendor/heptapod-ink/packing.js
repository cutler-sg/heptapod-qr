/**
 * Low-level text packing for heptapod-ink, moved out of the core package.
 * Must stay byte-compatible with the core codec: the checksums and slot
 * streams it produces are read back by heptapod-ink's decode().
 */
import { LogogramError } from "./core.js";

/** Version of the slot format. Files only decode with a library that shares this version. */
export const FORMAT_VERSION = 1;
/** Characters packed by the compact alphabet. Text using anything else falls back to UTF-8 bytes. */
export const CHARSET = " abcdefghijklmnopqrstuvwxyz0123456789.,?!'-:;\n";
const MIN_SLOTS = 10, STATES = 10;

function crc16(bytes) {
  let c = 0xFFFF;
  for (const b of bytes) {
    c ^= b << 8;
    for (let i = 0; i < 8; i++) c = c & 0x8000 ? ((c << 1) ^ 0x1021) & 0xFFFF : (c << 1) & 0xFFFF;
  }
  return c;
}

/**
 * Pack text into slot values (least significant first).
 * @param {string} text
 */
export function textToSlots(text) {
  const bytes = new TextEncoder().encode(text);
  const compact = [...text].every(ch => CHARSET.includes(ch));
  let v = 0n;
  if (compact) {
    const B = BigInt(CHARSET.length + 1), chars = [...text];
    for (let i = chars.length - 1; i >= 0; i--) v = v * B + BigInt(CHARSET.indexOf(chars[i]) + 1);
  } else {
    for (let i = bytes.length - 1; i >= 0; i--) v = v * 257n + BigInt(bytes[i] + 1);
  }
  const checksum = crc16(bytes);
  let V = (v * 2n + (compact ? 0n : 1n)) * 65536n + BigInt(checksum);
  const slots = [];
  while (V > 0n) { slots.push(Number(V % BigInt(STATES))); V /= BigInt(STATES); }
  while (slots.length < MIN_SLOTS) slots.push(0);
  return { slots, checksum, compact, bytes: bytes.length };
}

/**
 * Unpack slot values into text. Throws LogogramError("checksum") when they don't add up.
 * @param {number[]} slots
 */
export function slotsToText(slots) {
  let V = 0n;
  for (let i = slots.length - 1; i >= 0; i--) V = V * BigInt(STATES) + BigInt(slots[i]);
  const checksum = Number(V % 65536n); V /= 65536n;
  const compact = V % 2n === 0n; let v = V / 2n;
  let text;
  try {
    if (compact) {
      const B = BigInt(CHARSET.length + 1); let s = "";
      while (v > 0n) { const d = Number(v % B); v /= B; if (d === 0) throw 0; s += CHARSET[d - 1]; }
      text = s;
    } else {
      const out = [];
      while (v > 0n) { const d = Number(v % 257n); v /= 257n; if (d === 0) throw 0; out.push(d - 1); }
      text = new TextDecoder("utf-8", { fatal: true }).decode(new Uint8Array(out));
    }
  } catch {
    text = null;
  }
  if (text === null || crc16(new TextEncoder().encode(text)) !== checksum) {
    throw new LogogramError("checksum", "The marks don't add up: the checksum failed. The file may be damaged or edited.");
  }
  return { text, checksum };
}
