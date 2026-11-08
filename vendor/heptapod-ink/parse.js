/**
 * SVG geometry parsing for heptapod-ink files, moved out of the core package.
 * Plain string parsing, so it runs in browsers, workers and Node alike.
 */
import { LogogramError } from "./core.js";

export function parsePts(d) {
  const nums = (d.match(/-?(?:\d+\.?\d*|\.\d+)(?:e[-+]?\d+)?/gi) || []).map(Number);
  const pts = []; for (let i = 0; i + 1 < nums.length; i += 2) pts.push([nums[i], nums[i + 1]]);
  return pts;
}

function attr(tag, name) {
  const m = tag.match(new RegExp(`\\s${name}\\s*=\\s*(["'])(.*?)\\1`, "is"));
  return m ? m[2] : null;
}

/**
 * Extract the drawable geometry of an SVG string: its viewBox, every path as a point list,
 * and every circle outside <defs>/<mask>. Useful for drawing a safe preview of an untrusted file.
 * @param {string} svg
 */
export function parse(svg) {
  if (typeof svg !== "string" || !/<svg\b/i.test(svg)) throw new LogogramError("not_svg", "That isn't an SVG file.");
  const root = svg.match(/<svg\b[^>]*>/i)[0];
  const vb = (attr(root, "viewBox") || "").trim().split(/[\s,]+/).map(Number);
  if (vb.length !== 4 || vb.some(n => !Number.isFinite(n))) throw new LogogramError("no_viewbox", "The SVG has no viewBox, so its centre can't be found.");
  const body = svg.replace(/<!--.*?-->/gs, "").replace(/<(defs|mask)\b.*?<\/\1\s*>/gis, "");
  const paths = [...body.matchAll(/<path\b[^>]*>/gi)].map(m => parsePts(attr(m[0], "d") || "")).filter(p => p.length);
  const circles = [...body.matchAll(/<circle\b[^>]*>/gi)]
    .map(m => ["cx", "cy", "r"].map(a => Number(attr(m[0], a) ?? 0)))
    .filter(c => c.every(Number.isFinite));
  return { viewBox: vb, paths, circles };
}
