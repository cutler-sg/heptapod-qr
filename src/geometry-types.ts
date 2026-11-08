export type Point = readonly [number, number];
export interface CrossSection {
  left: Point;
  right: Point;
  terminal: boolean;
}
/** All coordinates are in final print millimetres; no CSS or transforms. */
export interface InkShape {
  id: string;
  kind: "ring" | "data-tendril" | "decoration" | "spatter";
  points: Point[];
  sections: CrossSection[];
  /** Only a tendril's first portion may intentionally join the ring here. */
  join?: { center: Point; radius: number };
}
export interface GeometryConstraints {
  diameter: number;
  margin: number;
  minWidth: number;
  minGap: number;
}
export interface GeometryIssue {
  kind: "clipping" | "width" | "gap" | "collision" | "self-intersection" | "taper";
  shapes: string[];
  message: string;
  measured?: number;
  at?: Point;
}
export interface GeometryReport {
  issues: GeometryIssue[];
  minStructuralWidth: number | null;
  minTerminalWidth: number | null;
  minGap: number | null;
  bounds: { minX: number; minY: number; maxX: number; maxY: number };
  suggestedDiameter: number;
}
