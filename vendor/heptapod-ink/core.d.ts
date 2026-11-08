/**
 * heptapod-ink core: the trimmed public API is exactly
 * { encode, decode, LogogramError }.
 *
 * The pieces removed from the core (parse(), the low-level textToSlots /
 * slotsToText / renderSlots helpers, and SMIL animation) live in the add-on
 * package `heptapod-ink-extras`.
 */

export interface EncodeOptions {
  /** Rough ink-edge filter. Default true. */
  ink?: boolean;
  /** Fill colour of the ink. Default "currentColor". */
  color?: string;
  /** Background fill, or "none". Default "none". */
  background?: string;
  /** Decoration seed. Default is derived from the text, so output is stable. */
  seed?: number;
  /** Prefix for the ink-filter id inside the SVG. Default is derived from the seed. */
  idPrefix?: string;
}

export interface EncodeResult {
  /** The logogram as a standalone SVG document string. */
  svg: string;
  /** Number of slots around the ring. */
  slots: number;
  /** Ring radius in SVG units. */
  radius: number;
  /** Width and height of the viewBox. */
  size: number;
  /** CRC-16/CCITT of the UTF-8 text. */
  checksum: number;
  /** True when the compact alphabet was used. */
  compact: boolean;
}

export interface DecodeResult {
  text: string;
  checksum: number;
  slots: number;
}

export type LogogramErrorCode = "not_svg" | "no_viewbox" | "no_strokes" | "unknown_format" | "checksum";

export declare class LogogramError extends Error {
  readonly name: "LogogramError";
  readonly code: LogogramErrorCode;
  constructor(code: LogogramErrorCode, message: string);
}

/** Write text as a logogram SVG. Same text and options give the same SVG. */
export declare function encode(text: string, options?: EncodeOptions): EncodeResult;
/** Read text back from a logogram SVG made by this library. Throws LogogramError. */
export declare function decode(svg: string): DecodeResult;
