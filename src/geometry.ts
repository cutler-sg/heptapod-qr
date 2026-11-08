import type {
  GeometryConstraints,
  GeometryIssue,
  GeometryReport,
  InkShape,
  Point,
} from "./geometry-types";

const EPS = 1e-8;
// Coordinates are serialized to four decimal places before this analysis.
const LIMIT_EPS = 0.0002;
type Segment = { a: Point; b: Point; start: number; length: number };
type Nearest = { distance: number; a: Point; b: Point };
type Join = NonNullable<InkShape["join"]>;

const distance = (a: Point, b: Point) => Math.hypot(a[0] - b[0], a[1] - b[1]);
const cross = (a: Point, b: Point, c: Point) =>
  (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0]);
const interpolate = (a: Point, b: Point, t: number): Point => [
  a[0] + (b[0] - a[0]) * t,
  a[1] + (b[1] - a[1]) * t,
];
const midpoint = (a: Point, b: Point) => interpolate(a, b, 0.5);

function closestPoint(p: Point, a: Point, b: Point): Point {
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  const lengthSquared = dx * dx + dy * dy;
  if (lengthSquared < EPS * EPS) return a;
  const t = Math.max(0, Math.min(1, ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / lengthSquared));
  return interpolate(a, b, t);
}

/** Includes collinear overlaps and boundary contact. */
function intersection(a: Point, b: Point, c: Point, d: Point): Point | null {
  const denominator = (b[0] - a[0]) * (d[1] - c[1]) - (b[1] - a[1]) * (d[0] - c[0]);
  if (Math.abs(denominator) > EPS) {
    const t = ((c[0] - a[0]) * (d[1] - c[1]) - (c[1] - a[1]) * (d[0] - c[0])) / denominator;
    const u = ((c[0] - a[0]) * (b[1] - a[1]) - (c[1] - a[1]) * (b[0] - a[0])) / denominator;
    if (t >= -EPS && t <= 1 + EPS && u >= -EPS && u <= 1 + EPS) {
      return interpolate(a, b, Math.max(0, Math.min(1, t)));
    }
    return null;
  }
  if (Math.abs(cross(a, b, c)) > EPS) return null;
  for (const p of [a, b]) if (distance(p, closestPoint(p, c, d)) <= EPS) return p;
  for (const p of [c, d]) if (distance(p, closestPoint(p, a, b)) <= EPS) return p;
  return null;
}

function nearest(a: Segment, b: Segment): Nearest {
  const hit = intersection(a.a, a.b, b.a, b.b);
  if (hit) return { distance: 0, a: hit, b: hit };
  const candidates: [Point, Point][] = [
    [a.a, closestPoint(a.a, b.a, b.b)],
    [a.b, closestPoint(a.b, b.a, b.b)],
    [closestPoint(b.a, a.a, a.b), b.a],
    [closestPoint(b.b, a.a, a.b), b.b],
  ];
  let best: Nearest = { distance: Infinity, a: a.a, b: b.a };
  for (const [p, q] of candidates) {
    const measured = distance(p, q);
    if (measured < best.distance) best = { distance: measured, a: p, b: q };
  }
  return best;
}

function segments(points: Point[]): Segment[] {
  const result: Segment[] = [];
  let start = 0;
  for (let i = 0; i < points.length; i++) {
    const a = points[i];
    const b = points[(i + 1) % points.length];
    const length = distance(a, b);
    if (length > EPS) result.push({ a, b, start, length });
    start += length;
  }
  return result;
}

function contains(p: Point, polygon: Point[]): boolean {
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const a = polygon[j];
    const b = polygon[i];
    if (distance(p, closestPoint(p, a, b)) <= EPS) return true;
    if (
      a[1] > p[1] !== b[1] > p[1] &&
      p[0] < ((b[0] - a[0]) * (p[1] - a[1])) / (b[1] - a[1]) + a[0]
    ) {
      inside = !inside;
    }
  }
  return inside;
}

function joinFor(a: InkShape, b: InkShape): Join | undefined {
  if (a.kind === "ring" && (b.kind === "data-tendril" || b.kind === "decoration")) return b.join;
  if (b.kind === "ring" && (a.kind === "data-tendril" || a.kind === "decoration")) return a.join;
  return undefined;
}

const inJoin = (p: Point, join: Join | undefined) =>
  join !== undefined && distance(p, join.center) <= join.radius + EPS;

/** Split at the circle boundary: an attachment never exempts the rest of either polygon. */
function outsideJoin(edge: Segment, join: Join | undefined): Segment[] {
  if (!join || join.radius <= 0) return [edge];
  const dx = edge.b[0] - edge.a[0];
  const dy = edge.b[1] - edge.a[1];
  const ox = edge.a[0] - join.center[0];
  const oy = edge.a[1] - join.center[1];
  const aa = dx * dx + dy * dy;
  const bb = 2 * (ox * dx + oy * dy);
  const cc = ox * ox + oy * oy - join.radius * join.radius;
  const discriminant = bb * bb - 4 * aa * cc;
  const cuts = [0, 1];
  if (discriminant >= 0) {
    const root = Math.sqrt(discriminant);
    for (const t of [(-bb - root) / (2 * aa), (-bb + root) / (2 * aa)]) {
      if (t > EPS && t < 1 - EPS) cuts.push(t);
    }
  }
  cuts.sort((a, b) => a - b);
  const result: Segment[] = [];
  for (let i = 1; i < cuts.length; i++) {
    const lo = cuts[i - 1];
    const hi = cuts[i];
    if (hi - lo <= EPS || inJoin(interpolate(edge.a, edge.b, (lo + hi) / 2), join)) continue;
    result.push({
      a: interpolate(edge.a, edge.b, lo),
      b: interpolate(edge.a, edge.b, hi),
      start: edge.start + edge.length * lo,
      length: edge.length * (hi - lo),
    });
  }
  return result;
}

function boxDistance(a: Segment, b: Segment): number {
  return Math.hypot(
    Math.max(
      0,
      Math.min(a.a[0], a.b[0]) - Math.max(b.a[0], b.b[0]),
      Math.min(b.a[0], b.b[0]) - Math.max(a.a[0], a.b[0]),
    ),
    Math.max(
      0,
      Math.min(a.a[1], a.b[1]) - Math.max(b.a[1], b.b[1]),
      Math.min(b.a[1], b.b[1]) - Math.max(a.a[1], a.b[1]),
    ),
  );
}

/**
 * Conservative screening of filled, simple polygon contours in final print millimetres.
 * Section widths measure the supplied design samples, not a medial-axis proof. Self-gap
 * checks sample nearest boundary points and reject local neighbours by boundary distance.
 * minGap combines inter-polygon minima with failing self-channels; null means no such
 * eligible distance was measured, not a proof that every possible channel was inspected.
 * Terminal tips can therefore cause conservative warnings. No result guarantees healing
 * or printability; suggestedDiameter is a sizing estimate, never a geometry repair.
 */
export function analyzeGeometry(
  shapes: InkShape[],
  constraints: GeometryConstraints,
): GeometryReport {
  const { diameter, margin, minWidth, minGap } = constraints;
  const issues: GeometryIssue[] = [];
  const bounds = { minX: Infinity, minY: Infinity, maxX: -Infinity, maxY: -Infinity };
  let minStructuralWidth = Infinity;
  let minTerminalWidth = Infinity;
  let actualGap = Infinity;
  const contours = shapes.map((shape) => segments(shape.points));

  for (let s = 0; s < shapes.length; s++) {
    const shape = shapes[s];
    let clipped: Point | undefined;
    for (const p of shape.points) {
      bounds.minX = Math.min(bounds.minX, p[0]);
      bounds.minY = Math.min(bounds.minY, p[1]);
      bounds.maxX = Math.max(bounds.maxX, p[0]);
      bounds.maxY = Math.max(bounds.maxY, p[1]);
      if (
        p[0] < margin - LIMIT_EPS ||
        p[1] < margin - LIMIT_EPS ||
        p[0] > diameter - margin + LIMIT_EPS ||
        p[1] > diameter - margin + LIMIT_EPS
      )
        clipped = p;
    }
    if (clipped)
      issues.push({
        kind: "clipping",
        shapes: [shape.id],
        at: clipped,
        message: "Ink crosses the canvas safe margin.",
      });
    for (const terminal of [false, true]) {
      let width = Infinity;
      let at: Point | undefined;
      for (const section of shape.sections) {
        if (section.terminal !== terminal) continue;
        const measured = distance(section.left, section.right);
        if (measured < width) {
          width = measured;
          at = midpoint(section.left, section.right);
        }
      }
      if (terminal) minTerminalWidth = Math.min(minTerminalWidth, width);
      else minStructuralWidth = Math.min(minStructuralWidth, width);
      if (width < minWidth - LIMIT_EPS)
        issues.push({
          kind: terminal ? "taper" : "width",
          shapes: [shape.id],
          measured: width,
          at,
          message: terminal
            ? "Terminal tip is below the requested minimum width; inspect its taper separately."
            : "Structural cross-section is below the requested minimum width.",
        });
    }

    const edges = contours[s];
    const perimeter = edges.reduce((sum, edge) => sum + edge.length, 0);
    const ordered = edges
      .map((edge, index) => ({
        edge,
        index,
        minX: Math.min(edge.a[0], edge.b[0]),
        maxX: Math.max(edge.a[0], edge.b[0]),
      }))
      .sort((a, b) => a.minX - b.minX);
    let crossing: Point | undefined;
    let narrow: Nearest | undefined;
    for (let i = 0; i < ordered.length; i++) {
      for (let j = i + 1; j < ordered.length; j++) {
        if (ordered[j].minX > ordered[i].maxX + Math.max(EPS, minGap)) break;
        const indexDistance = Math.abs(ordered[i].index - ordered[j].index);
        if (indexDistance === 1 || indexDistance === edges.length - 1) continue;
        const a = ordered[i].edge;
        const b = ordered[j].edge;
        if (boxDistance(a, b) > EPS && boxDistance(a, b) >= minGap) {
          // A positive box distance also rules out a crossing.
          continue;
        }
        const hit = intersection(a.a, a.b, b.a, b.b);
        if (hit) {
          crossing ??= hit;
          continue;
        }
        if (boxDistance(a, b) >= (narrow?.distance ?? minGap)) continue;
        const near = nearest(a, b);
        const posA = a.start + distance(a.a, near.a);
        const posB = b.start + distance(b.a, near.b);
        const around = Math.abs(posA - posB);
        if (Math.min(around, perimeter - around) < 3 * Math.max(minWidth, minGap)) continue;
        // The midpoint must be air; opposite sides of a solid stroke measure ink width.
        if (
          near.distance > EPS &&
          near.distance < minGap - LIMIT_EPS &&
          !contains(midpoint(near.a, near.b), shape.points)
        )
          narrow = near;
      }
    }
    if (crossing)
      issues.push({
        kind: "self-intersection",
        shapes: [shape.id],
        at: crossing,
        measured: 0,
        message: "Nonadjacent polygon edges intersect or touch.",
      });
    if (narrow) {
      actualGap = Math.min(actualGap, narrow.distance);
      issues.push({
        kind: "gap",
        shapes: [shape.id],
        measured: narrow.distance,
        at: midpoint(narrow.a, narrow.b),
        message: "A nonlocal channel within this polygon is below the requested minimum gap.",
      });
    }
  }

  for (let i = 0; i < shapes.length; i++) {
    for (let j = i + 1; j < shapes.length; j++) {
      const a = shapes[i];
      const b = shapes[j];
      const join = joinFor(a, b);
      const aEdges = contours[i].flatMap((edge) => outsideJoin(edge, join));
      const bEdges = contours[j].flatMap((edge) => outsideJoin(edge, join));
      let closest: Nearest | undefined;
      let collision: Point | undefined;
      for (const [shape, other] of [
        [a, b],
        [b, a],
      ]) {
        collision ??= shape.points.find((p) => !inJoin(p, join) && contains(p, other.points));
      }
      for (const aa of aEdges) {
        for (const bb of bEdges) {
          if (boxDistance(aa, bb) > (closest?.distance ?? Infinity)) continue;
          const near = nearest(aa, bb);
          if (!closest || near.distance < closest.distance) closest = near;
          // Contact exactly on the circle is exempt, but arbitrarily close exterior
          // segments still deserve a conservative gap warning.
          if (near.distance <= EPS && !inJoin(near.a, join)) collision ??= near.a;
        }
      }
      if (collision) {
        actualGap = 0;
        issues.push({
          kind: "collision",
          shapes: [a.id, b.id],
          measured: 0,
          at: collision,
          message: "Filled polygons overlap or touch outside an intentional attachment.",
        });
      } else if (closest) {
        actualGap = Math.min(actualGap, closest.distance);
        if (closest.distance < minGap - LIMIT_EPS)
          issues.push({
            kind: "gap",
            shapes: [a.id, b.id],
            measured: closest.distance,
            at: midpoint(closest.a, closest.b),
            message: "Polygon boundaries are below the requested minimum gap.",
          });
      }
    }
  }

  const hasInk = Number.isFinite(bounds.minX);
  if (!hasInk) Object.assign(bounds, { minX: 0, minY: 0, maxX: 0, maxY: 0 });
  const extent = hasInk
    ? Math.max(
        diameter / 2 - bounds.minX,
        diameter / 2 - bounds.minY,
        bounds.maxX - diameter / 2,
        bounds.maxY - diameter / 2,
      )
    : 0;
  const scale = Math.max(
    1,
    minStructuralWidth > EPS && Number.isFinite(minStructuralWidth)
      ? minWidth / minStructuralWidth
      : 1,
    actualGap > EPS && Number.isFinite(actualGap) ? minGap / actualGap : 1,
  );
  return {
    issues,
    minStructuralWidth: Number.isFinite(minStructuralWidth) ? minStructuralWidth : null,
    minTerminalWidth: Number.isFinite(minTerminalWidth) ? minTerminalWidth : null,
    minGap: Number.isFinite(actualGap) ? actualGap : null,
    bounds,
    suggestedDiameter: Math.ceil(Math.max(diameter * scale, 2 * (extent + margin))),
  };
}
