import { createIR, type ProjectIR, pointPath, svgRoot } from "./codec";
import type { InkShape, Point } from "./geometry-types";
import { hash32, random, type State } from "./model";

const TAU = Math.PI * 2;
const q = (n: number): number => Number(n.toFixed(4));
const point = (x: number, y: number): Point => [q(x), q(y)];
export interface Artwork {
  svg: string;
  shapes: InkShape[];
  ir: ProjectIR;
}
export interface SvgAppearance {
  background?: "white" | "transparent";
  reversed?: boolean;
  mirrored?: boolean;
}

export function shapesSvg(
  shapes: InkShape[],
  diameter: number,
  appearance: SvgAppearance = {},
): string {
  const { background = "transparent", reversed = false, mirrored = false } = appearance;
  const bg = reversed ? "#000" : "#fff";
  const ink = reversed ? "#fff" : "#000";
  const paths = shapes
    .map(
      (s) =>
        `<path d="${pointPath(mirrored ? s.points.map(([x, y]) => point(diameter - x, y)) : s.points)}"/>`,
    )
    .join("");
  // Reversed exports are white cutout shapes on a black square, not transparent white ink.
  return `${svgRoot(diameter)}${background === "white" || reversed ? `<path fill="${bg}" d="M0,0 L${diameter},0 L${diameter},${diameter} L0,${diameter} Z"/>` : ""}<g fill="${ink}">${paths}</g></svg>`;
}

export function renderArtwork(state: State, appearance: SvgAppearance = {}): Artwork {
  const ir = createIR(state);
  const settings = state.settings;
  const { diameter, margin, minWidth, reduction, taper } = settings;
  const center = diameter / 2;
  const rng = random(state.seed ^ (ir.mode === "decorative" ? hash32(ir.normalizedInput) : 0));
  const radius = (diameter - 2 * margin) * 0.335;
  const start = -Math.PI / 2 + (rng() - 0.5) * 1.2 + (settings.rotation * Math.PI) / 180;
  const span = TAU - 0.43;
  const count = ir.marks.length;
  const step = span / (count + 2);
  const markAngle = (i: number) => start + step * (i + 1.5);
  const base = Math.max(minWidth + 0.04, diameter * 0.014);
  const phases = [rng() * TAU, rng() * TAU, rng() * TAU];
  const radial = (angle: number) =>
    radius +
    (0.2 + 0.25 * (1 - reduction)) *
      (Math.sin(angle * 3 + phases[0]) + 0.4 * Math.sin(angle * 7 + phases[1]));
  const polar = (angle: number, r: number): Point =>
    point(center + Math.cos(angle) * r, center + Math.sin(angle) * r);
  // Deliberately not a v1 point-count header. This is an artist derivative, never a codec.
  let samples = Math.max(120, count * 5, Math.round(240 - reduction * 100));
  while ((samples + 1 - 29) % 8 === 0) samples++;
  const outer: Point[] = [],
    inner: Point[] = [];
  const sections: InkShape["sections"] = [];
  const edgeAt = (angle: number) => {
    const slotPosition = (angle - start) / step - 1.5;
    const nearest = Math.round(slotPosition);
    let out = base / 2,
      inside = base / 2;
    for (let k = nearest - 1; k <= nearest + 1; k++) {
      if (k < 0 || k >= count) continue;
      const type = ir.marks[k].swelling;
      const amount =
        (type === 1 || type === 3 ? 1.1 : type === 2 || type === 4 ? 2.6 : 0) *
        Math.exp(-(((angle - markAngle(k)) / (step * 0.4)) ** 2)) *
        (0.85 + diameter / 600);
      if (type <= 2) out += amount;
      else inside += amount;
    }
    const progress = (angle - start) / span;
    const terminal = progress < 0.025 || progress > 0.975;
    const end = Math.min(1, progress / 0.025, (1 - progress) / 0.025);
    const endScale = 1 - taper * (1 - Math.max(0, end));
    return {
      outer: radial(angle) + out * endScale,
      inner: radial(angle) - inside * endScale,
      terminal,
    };
  };
  for (let j = 0; j <= samples; j++) {
    const angle = start + (span * j) / samples;
    const edge = edgeAt(angle);
    const left = polar(angle, edge.outer),
      right = polar(angle, edge.inner);
    outer.push(left);
    inner.push(right);
    sections.push({ left, right, terminal: edge.terminal });
  }
  const shapes: InkShape[] = [
    { id: "ring", kind: "ring", points: [...outer, ...inner.reverse()], sections },
  ];

  const addTendril = (
    angle: number,
    length: number,
    outward: boolean,
    id: string,
    mandatory: boolean,
  ) => {
    const edge = edgeAt(angle);
    const rootRadius = radial(angle);
    const root = polar(angle, rootRadius);
    let x = root[0],
      y = root[1];
    let heading = angle + (outward ? 0 : Math.PI) + (rng() - 0.5) * 0.28;
    const curl = (rng() - 0.5) * 1.8;
    const steps = Math.round(24 - reduction * 8);
    const width = Math.max(minWidth + 0.04, base * (0.95 + rng() * 0.35));
    const left: Point[] = [],
      right: Point[] = [];
    const widths: InkShape["sections"] = [];
    for (let j = 0; j <= steps; j++) {
      const progress = j / steps;
      // Only the last 12% is a terminal tip. Structural cross-sections meet the requested floor.
      const w =
        progress <= 0.88
          ? width * (1 - 0.12 * progress) + minWidth * 0.12 * progress
          : (width * 0.8944 + minWidth * 0.1056) * (1 - (taper * (progress - 0.88)) / 0.12);
      const normalX = -Math.sin(heading),
        normalY = Math.cos(heading);
      const l = point(x + (normalX * w) / 2, y + (normalY * w) / 2),
        r = point(x - (normalX * w) / 2, y - (normalY * w) / 2);
      left.push(l);
      right.push(r);
      widths.push({ left: l, right: r, terminal: progress > 0.88 });
      heading += (curl * Math.sin(progress * Math.PI)) / steps;
      x += (Math.cos(heading) * length) / steps;
      y += (Math.sin(heading) * length) / steps;
    }
    shapes.push({
      id,
      kind: mandatory ? "data-tendril" : "decoration",
      points: [...left, ...right.reverse()],
      sections: widths,
      join: {
        center: root,
        radius: Math.max(edge.outer - rootRadius, rootRadius - edge.inner) + width * 1.5,
      },
    });
  };
  for (const mark of ir.marks) {
    if (mark.tendril)
      addTendril(
        markAngle(mark.order),
        settings.tendrilLength * (0.7 + rng() * 0.3),
        true,
        `mark-${mark.order}`,
        ir.mode !== "decorative",
      );
  }
  const decorations = Math.round(settings.tendrilCount * settings.density * (1 - reduction * 0.6));
  for (let i = 0; i < decorations; i++) {
    const angle = start + span * (0.1 + (0.8 * (i + 0.3 + rng() * 0.4)) / Math.max(1, decorations));
    addTendril(
      angle,
      settings.tendrilLength * (0.35 + rng() * 0.35),
      false,
      `ornament-${i}`,
      false,
    );
  }
  if (settings.spatter) {
    const dots = Math.round(14 * settings.density * (1 - reduction));
    for (let i = 0; i < dots; i++) {
      const angle = start + span * (0.06 + 0.88 * rng());
      const r = radial(angle) + (rng() < 0.5 ? -1 : 1) * (4 + rng() * 3);
      const p = polar(angle, r),
        dotRadius = Math.max(minWidth / 2, 0.35 + rng() * 0.3);
      const pts = Array.from({ length: 12 }, (_v, j) =>
        point(
          p[0] + Math.cos((j * TAU) / 12) * dotRadius,
          p[1] + Math.sin((j * TAU) / 12) * dotRadius,
        ),
      );
      shapes.push({
        id: `spatter-${i}`,
        kind: "spatter",
        points: pts,
        sections: [
          {
            left: point(p[0] - dotRadius, p[1]),
            right: point(p[0] + dotRadius, p[1]),
            terminal: false,
          },
        ],
      });
    }
  }
  return { svg: shapesSvg(shapes, diameter, appearance), shapes, ir };
}
