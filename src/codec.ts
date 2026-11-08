import { decode, encode } from "../vendor/heptapod-ink/core.js";
import { textToSlots } from "../vendor/heptapod-ink/packing.js";
import { parse } from "../vendor/heptapod-ink/parse.js";
import type { InkShape, Point } from "./geometry-types";
import {
  CODEC_VERSION,
  hash32,
  normalizedText,
  RENDER_VERSION,
  random,
  type State,
  selectedText,
  UPSTREAM_COMMIT,
  validateState,
} from "./model";

export interface Mark {
  order: number;
  digit: number;
  swelling: number;
  tendril: boolean;
}
export interface ProjectIR {
  version: "atelier-ir/1";
  originalInput: string;
  selectedInput: string;
  normalizedInput: string;
  normalization: State["normalization"];
  mode: State["mode"];
  codecVersion: string;
  marks: Mark[];
  checksum: number | null;
  compact: boolean | null;
  orientation: string;
  styleSeed: number;
  renderVersion: typeof RENDER_VERSION;
  upstreamCommit: typeof UPSTREAM_COMMIT;
  dimensions: { widthMm: number; heightMm: number };
  constraints: State["settings"];
}
export function createIR(raw: State): ProjectIR {
  const state = validateState(raw);
  const text = normalizedText(state);
  const packed = textToSlots(text);
  const decor = state.mode === "decorative";
  const rng = random(hash32(text));
  const digits: number[] = decor
    ? Array.from({ length: 20 }, () => Math.floor(rng() * 10))
    : packed.slots;
  return {
    version: "atelier-ir/1",
    originalInput: state.input,
    selectedInput: selectedText(state),
    normalizedInput: text,
    normalization: state.normalization,
    mode: state.mode,
    codecVersion: decor ? "non-reversible-style-hash/1" : CODEC_VERSION,
    marks: digits.map((digit, order) => ({
      order,
      digit,
      swelling: digit % 5,
      tendril: digit >= 5,
    })),
    checksum: decor ? null : packed.checksum,
    compact: decor ? null : packed.compact,
    orientation:
      "Source: first outer-path point beside gap, clockwise in SVG coordinates, then reversed inner run. Tattoo derivative: same ordered classes; no supported decoder.",
    styleSeed: state.seed,
    renderVersion: RENDER_VERSION,
    upstreamCommit: UPSTREAM_COMMIT,
    dimensions: { widthMm: state.settings.diameter, heightMm: state.settings.diameter },
    constraints: { ...state.settings },
  };
}
export function pointPath(points: readonly Point[], decimals = 4): string {
  return `M${points.map(([x, y]) => `${x.toFixed(decimals)},${y.toFixed(decimals)}`).join(" L")} Z`;
}
export const svgRoot = (diameter: number, viewBox = `0 0 ${diameter} ${diameter}`): string =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="${diameter}mm" height="${diameter}mm" viewBox="${viewBox}">`;

export interface EncodedSource {
  svg: string;
  shapes: InkShape[];
  checksum: number;
}
export function encodedSource(state: State): EncodedSource | null {
  const ir = createIR(state);
  if (ir.mode === "decorative") return null;
  const raw = encode(ir.normalizedInput, { seed: state.seed, ink: false, color: "#000" });
  if (decode(raw.svg).text !== ir.normalizedInput)
    throw new Error("Upstream source round trip failed.");
  const parsed = parse(raw.svg);
  const center = raw.size / 2;
  const radians = (state.settings.rotation * Math.PI) / 180;
  const rotate = ([x, y]: number[]): Point => [
    center + (x - center) * Math.cos(radians) - (y - center) * Math.sin(radians),
    center + (x - center) * Math.sin(radians) + (y - center) * Math.cos(radians),
  ];
  // Zero rotation preserves the original upstream path data exactly.
  let svg = raw.svg;
  if (state.settings.rotation !== 0) {
    svg = svg.replace(
      / d="([^"]*)"/g,
      (_match, data: string) =>
        ` d="${data.replace(/(-?[\d.]+),(-?[\d.]+)/g, (_pair, x: string, y: string) =>
          rotate([Number(x), Number(y)])
            .map((v) => v.toFixed(4))
            .join(","),
        )}"`,
    );
    svg = svg.replace(/<circle cx="([^"]+)" cy="([^"]+)"/g, (_match, x: string, y: string) => {
      const p = rotate([Number(x), Number(y)]);
      return `<circle cx="${p[0].toFixed(4)}" cy="${p[1].toFixed(4)}"`;
    });
  }
  const rotated = parse(svg);
  const radius = Math.max(
    ...rotated.paths.flatMap((p: number[][]) =>
      p.map(([x, y]: number[]) => Math.hypot(x - center, y - center)),
    ),
    ...rotated.circles.map(([x, y, r]: number[]) => Math.hypot(x - center, y - center) + r),
  );
  const { diameter, margin } = state.settings;
  const box = Math.max(raw.size, (2 * radius) / (1 - (2 * margin) / diameter));
  const origin = center - box / 2;
  svg = svg.replace(/<svg[^>]*>/, svgRoot(diameter, `${origin} ${origin} ${box} ${box}`));
  const result = decode(svg);
  if (result.text !== ir.normalizedInput)
    throw new Error("Physical source transformation did not preserve decoding.");
  const scale = diameter / box;
  const toMm = ([x, y]: number[]): Point => [(x - origin) * scale, (y - origin) * scale];
  const shapes: InkShape[] = rotated.paths.map((path: number[][], i: number) => {
    const pts = path.map(toMm);
    const count = pts.length / 2;
    return {
      id: i === 0 ? "source-ring" : `source-tendril-${i}`,
      kind: i === 0 ? "ring" : "data-tendril",
      points: pts,
      sections: pts.slice(0, count).map((left: Point, j: number) => ({
        left,
        right: pts[pts.length - 1 - j],
        terminal: i === 0 ? j < 14 || j >= count - 14 : j > count * 0.85,
      })),
      ...(i
        ? {
            join: {
              center: [
                (pts[0][0] + pts[pts.length - 1][0]) / 2,
                (pts[0][1] + pts[pts.length - 1][1]) / 2,
              ] as Point,
              radius: 25 * scale,
            },
          }
        : {}),
    };
  });
  rotated.circles.forEach(([x, y, r]: number[], i: number) => {
    const pts = Array.from({ length: 16 }, (_v, j) =>
      toMm([x + r * Math.cos((j * Math.PI) / 8), y + r * Math.sin((j * Math.PI) / 8)]),
    );
    shapes.push({
      id: `source-spatter-${i}`,
      kind: "spatter",
      points: pts,
      sections: [{ left: toMm([x - r, y]), right: toMm([x + r, y]), terminal: false }],
    });
  });
  // Parsed here to establish the untouched geometry before any physical layout.
  if (parsed.paths.length !== rotated.paths.length) throw new Error("Source path count changed.");
  return { svg, shapes, checksum: result.checksum };
}
