import { describe, expect, test } from "bun:test";
import { analyzeGeometry } from "../src/geometry";
import type { GeometryConstraints, InkShape, Point } from "../src/geometry-types";

const constraints: GeometryConstraints = { diameter: 100, margin: 2, minWidth: 0.8, minGap: 1 };
const polygon = (id: string, points: Point[], extra: Partial<InkShape> = {}): InkShape => ({
  id,
  kind: "decoration",
  points,
  sections: [],
  ...extra,
});
const rectangle = (
  id: string,
  x: number,
  y: number,
  width: number,
  height: number,
  extra: Partial<InkShape> = {},
) =>
  polygon(
    id,
    [
      [x, y],
      [x + width, y],
      [x + width, y + height],
      [x, y + height],
    ],
    extra,
  );

describe("final millimetre polygon screening", () => {
  test("reports structural widths and terminal tips separately", () => {
    const shape = rectangle("stroke", 10, 10, 10, 1, {
      sections: [
        { left: [11, 10], right: [11, 10.5], terminal: false },
        { left: [19, 10], right: [19, 10.1], terminal: true },
      ],
    });
    const report = analyzeGeometry([shape], constraints);
    expect(report.minStructuralWidth).toBeCloseTo(0.5);
    expect(report.minTerminalWidth).toBeCloseTo(0.1);
    expect(report.issues.map((issue) => issue.kind)).toEqual(["width", "taper"]);
    expect(report.suggestedDiameter).toBe(160);
  });

  test("detects ink outside the safe inset", () => {
    const report = analyzeGeometry([rectangle("clipped", 1, 10, 5, 5)], constraints);
    expect(report.issues).toContainEqual(
      expect.objectContaining({ kind: "clipping", shapes: ["clipped"] }),
    );
    expect(report.bounds).toEqual({ minX: 1, minY: 10, maxX: 6, maxY: 15 });
    expect(report.suggestedDiameter).toBeGreaterThan(100);
  });

  test("reports a near-touching gap and accepts a gap above threshold", () => {
    const a = rectangle("a", 10, 10, 5, 5);
    const near = analyzeGeometry([a, rectangle("b", 15.4, 10, 5, 5)], constraints);
    expect(near.minGap).toBeCloseTo(0.4);
    expect(near.issues).toContainEqual(
      expect.objectContaining({ kind: "gap", shapes: ["a", "b"] }),
    );
    const safe = analyzeGeometry([a, rectangle("b", 16.1, 10, 5, 5)], constraints);
    expect(safe.minGap).toBeCloseTo(1.1);
    expect(safe.issues).toEqual([]);
  });

  test("detects crossings, contact, and complete containment", () => {
    const a = rectangle("a", 10, 10, 10, 10);
    for (const b of [
      rectangle("b", 19, 15, 5, 5),
      rectangle("b", 20, 10, 5, 5),
      rectangle("b", 12, 12, 2, 2),
    ]) {
      const report = analyzeGeometry([a, b], constraints);
      expect(report.issues).toContainEqual(
        expect.objectContaining({ kind: "collision", shapes: ["a", "b"] }),
      );
      expect(report.minGap).toBe(0);
    }
  });

  test("detects self-intersection even with a zero gap threshold", () => {
    const bow = polygon("bow", [
      [10, 10],
      [20, 20],
      [10, 20],
      [20, 10],
    ]);
    const report = analyzeGeometry([bow], { ...constraints, minGap: 0 });
    expect(report.issues).toContainEqual(
      expect.objectContaining({ kind: "self-intersection", shapes: ["bow"] }),
    );
  });

  test("detects a narrow exterior channel without treating solid ink as air", () => {
    const channel = polygon("channel", [
      [10, 10],
      [19, 10],
      [19, 19],
      [15.2, 19],
      [15.2, 12],
      [14.8, 12],
      [14.8, 19],
      [10, 19],
    ]);
    const report = analyzeGeometry([channel], constraints);
    expect(report.issues).toContainEqual(
      expect.objectContaining({ kind: "gap", shapes: ["channel"] }),
    );
    expect(report.minGap).toBeCloseTo(0.4);
    expect(analyzeGeometry([rectangle("solid", 10, 10, 10, 0.5)], constraints).issues).toEqual([]);
  });

  test("exempts only the ring/tendril overlap inside the explicit join circle", () => {
    const ring = rectangle("ring", 10, 10, 10, 10, { kind: "ring" });
    const tendril = rectangle("tendril", 18, 14, 12, 2, {
      kind: "data-tendril",
      join: { center: [20, 15], radius: 3 },
    });
    expect(analyzeGeometry([ring, tendril], constraints).issues).toEqual([]);
    const unrelated = {
      ...tendril,
      id: "decoration",
      kind: "decoration" as const,
      join: undefined,
    };
    expect(analyzeGeometry([ring, unrelated], constraints).issues).toContainEqual(
      expect.objectContaining({ kind: "collision" }),
    );
    const escaped = rectangle("escaped", 18, 14, 12, 5, {
      kind: "data-tendril",
      join: { center: [20, 15], radius: 3 },
    });
    expect(analyzeGeometry([ring, escaped], constraints).issues).toContainEqual(
      expect.objectContaining({ kind: "collision" }),
    );
  });

  test("a join does not hide a near miss elsewhere on the same pair", () => {
    const ring = rectangle("ring", 10, 10, 10, 10, { kind: "ring" });
    const tendril = polygon(
      "tendril",
      [
        [18, 14],
        [25, 14],
        [25, 24],
        [20.3, 24],
        [20.3, 19],
        [23, 19],
        [23, 16],
        [18, 16],
      ],
      { kind: "data-tendril", join: { center: [20, 15], radius: 3 } },
    );
    const report = analyzeGeometry([ring, tendril], constraints);
    expect(report.minGap).toBeCloseTo(0.3);
    expect(report.issues).toContainEqual(
      expect.objectContaining({ kind: "gap", shapes: ["ring", "tendril"] }),
    );
  });

  test("handles empty input and repeated closing points", () => {
    expect(analyzeGeometry([], constraints)).toEqual({
      issues: [],
      minStructuralWidth: null,
      minTerminalWidth: null,
      minGap: null,
      bounds: { minX: 0, minY: 0, maxX: 0, maxY: 0 },
      suggestedDiameter: 100,
    });
    const shape = polygon("closed", [
      [10, 10],
      [20, 10],
      [20, 20],
      [10, 20],
      [10, 10],
    ]);
    expect(analyzeGeometry([shape], constraints).issues).toEqual([]);
  });

  test("allows four-decimal coordinate rounding at nominal minima", () => {
    const a = rectangle("a", 10, 10, 5, 5, {
      sections: [{ left: [10, 10], right: [10, 10.7999], terminal: false }],
    });
    expect(analyzeGeometry([a, rectangle("b", 15.9999, 10, 5, 5)], constraints).issues).toEqual([]);
  });
});
