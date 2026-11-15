// Shared, truthful data for the direction mockups: real artwork, slots and measurements.
import { encodedSource } from "../../../src/codec";
import { analyzeGeometry } from "../../../src/geometry";
import type { InkShape } from "../../../src/geometry-types";
import { DEFAULT_STATE, random } from "../../../src/model";
import { renderArtwork } from "../../../src/render";

export const state = DEFAULT_STATE;
export const art = renderArtwork(state);
const encoded = encodedSource(state);
if (!encoded) throw new Error("no source");
export const source = encoded;
export const report = analyzeGeometry(art.shapes, state.settings);
export const marks = art.ir.marks;
export const crc = (art.ir.checksum ?? 0).toString(16).toUpperCase().padStart(4, "0");
export const studies = Array.from({ length: 12 }, (_, i) => ({
  seed: state.seed + i,
  shapes: renderArtwork({ ...state, seed: state.seed + i }).shapes,
}));

const TAU = Math.PI * 2;
const start = -Math.PI / 2 + (random(state.seed)() - 0.5) * 1.2;
const step = (TAU - 0.43) / (marks.length + 2);
export const RADIUS = (state.settings.diameter - 2 * state.settings.margin) * 0.335;
export const markAngle = (i: number) => start + step * (i + 1.5);
export const polar = (angle: number, r: number): [number, number] => [
  45 + Math.cos(angle) * r,
  45 + Math.sin(angle) * r,
];

const d = (shape: InkShape) =>
  `M${shape.points.map(([x, y]) => `${x.toFixed(2)},${y.toFixed(2)}`).join("L")}Z`;
export const ink = (shapes: InkShape[]) =>
  shapes.map((s) => `<path class="k-${s.kind}" d="${d(s)}"/>`).join("");
export const artSvg = (shapes: InkShape[], cls = "") =>
  `<svg class="art ${cls}" viewBox="0 0 90 90" aria-hidden="true">${ink(shapes)}</svg>`;

/** One slot of the read-out: baseline = ring, bump = swelling class, stem = tendril. */
export function slotGlyph(digit: number, w = 26, h = 40): string {
  const swelling = digit % 5;
  const tendril = digit >= 5;
  const base = h * 0.56;
  const size = swelling === 0 ? 0 : swelling % 2 === 1 ? h * 0.13 : h * 0.27;
  const outward = swelling <= 2;
  const peak = outward ? base - 1.5 - size * 2 : base + 1.5 + size * 2;
  const bump = swelling
    ? `<path d="M${w * 0.12},${base} Q${w / 2},${peak} ${w * 0.88},${base}Z"/>`
    : "";
  const top = outward ? base - size : base;
  const stem = tendril
    ? `<path class="stem" d="M${w / 2 - 1.1},${top} L${w / 2 - 0.6},3 L${w / 2 + 0.6},3 L${w / 2 + 1.1},${top}Z"/>`
    : "";
  return `<svg class="slot-glyph" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" aria-hidden="true"><rect x="0" y="${base - 1.5}" width="${w}" height="3"/>${bump}${stem}</svg>`;
}

const font = (family: string, file: string, extra = "") =>
  `@font-face{font-family:"${family}";src:url("file:///tmp/hq-fonts/node_modules/@fontsource-variable/${file}") format("woff2");font-weight:100 900;font-display:block;${extra}}`;
export const fonts = {
  archivo: font("Archivo", "archivo/files/archivo-latin-wdth-normal.woff2", "font-stretch:62% 125%;"),
  martian: font(
    "Martian Mono",
    "martian-mono/files/martian-mono-latin-wdth-normal.woff2",
    "font-stretch:75% 112.5%;",
  ),
  besley: font("Besley", "besley/files/besley-latin-wght-normal.woff2"),
  hanken: font("Hanken Grotesk", "hanken-grotesk/files/hanken-grotesk-latin-wght-normal.woff2"),
  schibsted: font(
    "Schibsted Grotesk",
    "schibsted-grotesk/files/schibsted-grotesk-latin-wght-normal.woff2",
  ),
  overpass: font("Overpass", "overpass/files/overpass-latin-wght-normal.woff2"),
  overpassMono: font("Overpass Mono", "overpass-mono/files/overpass-mono-latin-wght-normal.woff2"),
};
export function describe(digit: number): string {
  const c = digit % 5;
  const swelling = c === 0 ? "no swelling" : `${c % 2 ? "small" : "large"} swelling ${c <= 2 ? "out" : "in"}`;
  return `${swelling}, ${digit >= 5 ? "with tendril" : "no tendril"}`;
}
export const mm = (v: number | null) => (v === null ? "n/a" : v.toFixed(2));
export const bounds = `${(report.bounds.maxX - report.bounds.minX).toFixed(1)} × ${(report.bounds.maxY - report.bounds.minY).toFixed(1)}`;
export const page = (title: string, css: string, body: string) =>
  `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${title}</title><style>*{box-sizing:border-box}body{margin:0}button,input,select{font:inherit;color:inherit}svg{display:block}${css}</style></head><body>${body}</body></html>`;
export const FILES: [string, string, string][] = [
  ["Encoded source", "SVG", "Geometry decodes back to the text"],
  ["Stencil", "SVG", "Artist study. No supported decoder"],
  ["Reversed", "SVG", "White shapes on a black field"],
  ["Mirrored transfer", "SVG", "Flipped for transfer only, never final"],
  ["Preview", "PNG", "600 dpi, 2,126 px at 90 mm"],
  ["Print sheet", "HTML", "True scale. Print at 100%, check the 50 mm bar"],
  ["Manifest", "JSON", "Input, seed, versions, SHA-256 hashes"],
  ["Comparison sheet", "HTML", "Spelling, meaning, decoration. Includes your text"],
];
