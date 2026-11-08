import { z } from "zod";

export const UPSTREAM_COMMIT = "34817c6f925a85ece2c80599148b70d96de578696bf4bb86e9cc8f0a8c12c49e";
export const CODEC_VERSION = "heptapod-ink/geometry-v1-restored";
export const RENDER_VERSION = "atelier/1";
export const MAX_BYTES = 128;

export const settingsSchema = z.object({
  diameter: z.number().min(30).max(180),
  minWidth: z.number().min(0.2).max(3),
  minGap: z.number().min(0.2).max(4),
  tendrilCount: z.number().int().min(0).max(24),
  tendrilLength: z.number().min(1).max(24),
  density: z.number().min(0).max(1),
  reduction: z.number().min(0).max(1),
  taper: z.number().min(0).max(0.7),
  spatter: z.boolean(),
  rotation: z.number().min(-180).max(180),
  margin: z.number().min(1).max(15),
}).strict();
export type Settings = z.infer<typeof settingsSchema>;

export const stateSchema = z.object({
  input: z.string().max(512),
  phrase: z.string().max(512),
  mode: z.enum(["spelling", "meaning", "decorative"]),
  normalization: z.enum(["none", "NFC"]),
  seed: z.number().int().min(0).max(4294967295),
  settings: settingsSchema,
}).strict();
export type State = z.infer<typeof stateSchema>;

export const DEFAULT_STATE: State = {
  input: "Michael", phrase: "", mode: "spelling", normalization: "none", seed: 42,
  settings: {diameter: 90, minWidth: 0.8, minGap: 0.8, tendrilCount: 5,
    tendrilLength: 10, density: 0.55, reduction: 0.35, taper: 0.3,
    spatter: false, rotation: 0, margin: 5},
};
export function selectedText(state: State): string {
  return state.mode === "meaning" ? state.phrase : state.input;
}
export function normalizedText(state: State): string {
  const text = selectedText(state);
  if (!text.length) throw new Error("Enter text first. Empty input is not encoded.");
  if (/\p{Surrogate}/u.test(text)) throw new Error("Input contains an unpaired Unicode surrogate.");
  const normalized = state.normalization === "NFC" ? text.normalize("NFC") : text;
  if (new TextEncoder().encode(normalized).length > MAX_BYTES) {
    throw new Error(`The payload exceeds ${MAX_BYTES} UTF-8 bytes. Shorten it explicitly; nothing has been discarded.`);
  }
  return normalized;
}
export function validateState(value: unknown): State {
  const state = stateSchema.parse(value);
  normalizedText(state);
  if (state.settings.margin * 2 + 10 >= state.settings.diameter) {
    throw new Error("The safe margins leave too little drawing space. Increase the canvas width or reduce margins.");
  }
  return state;
}
/** Stable noncryptographic style hash; never represented as reversible encoding. */
export function hash32(text: string): number {
  let hash = 2166136261;
  for (const byte of new TextEncoder().encode(text)) hash = Math.imul(hash ^ byte, 16777619);
  return hash >>> 0;
}
export function random(seed: number): () => number {
  let value = seed;
  return () => {
    value |= 0;
    value = (value + 0x6d2b79f5) | 0;
    let next = Math.imul(value ^ (value >>> 15), 1 | value);
    next = next + Math.imul(next ^ (next >>> 7), 61 | next) ^ next;
    return ((next ^ (next >>> 14)) >>> 0) / 4294967296;
  };
}
export const variantSeed = (base: number, index: number): number => (base + index) >>> 0;
