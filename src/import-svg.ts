import { decode } from "../vendor/heptapod-ink/core.js";

/** Deliberately narrow import grammar: inert, generated v1 SVGs only. No DOM insertion. */
export function decodeSourceSvg(svg: string): ReturnType<typeof decode> {
  if (typeof svg !== "string" || svg.length > 1_000_000) throw new Error("SVG import exceeds the 1 MB limit.");
  const clean = svg.trim();
  const stack: string[] = [];
  let position = 0;
  let roots = 0;
  const allowed: Record<string, readonly string[]> = {
    svg: ["xmlns", "viewBox", "width", "height"], g: ["fill"],
    path: ["d", "fill"], circle: ["cx", "cy", "r", "fill"],
  };
  const number = "-?(?:\\d+\\.?\\d*|\\.\\d+)(?:e[-+]?\\d+)?";
  const pathPattern = new RegExp(`^M${number},${number}(?: L${number},${number})+ Z$`, "i");
  for (const token of clean.matchAll(/<[^>]*>/g)) {
    if (clean.slice(position, token.index).trim()) throw new Error("Unsupported text or malformed SVG.");
    position = token.index + token[0].length;
    const tag = /^<(\/?)([A-Za-z]+)([\s\S]*?)(\/?)>$/.exec(token[0]);
    if (!tag) throw new Error("Unsupported SVG declaration or comment.");
    const [, closing, name, tail, self] = tag;
    if (!(name in allowed)) throw new Error(`Unsupported SVG element: ${name}. Import a preserved source SVG.`);
    if (closing) {
      if (tail.trim() || self || stack.pop() !== name) throw new Error("Unbalanced SVG elements.");
      continue;
    }
    if (!stack.length) {
      if (name !== "svg" || ++roots !== 1) throw new Error("Expected one SVG root.");
    } else if (name === "svg" || !["svg", "g"].includes(stack[stack.length-1])) throw new Error("Invalid nested SVG element.");
    const attrs: Record<string, string> = {};
    let consumed = 0;
    for (const attribute of tail.matchAll(/\s+([A-Za-z]+)="([^"]*)"/g)) {
      if (tail.slice(consumed, attribute.index).trim()) throw new Error("Malformed SVG attribute.");
      consumed = attribute.index + attribute[0].length;
      const [, key, value] = attribute;
      if (!allowed[name].includes(key) || Object.hasOwn(attrs,key)) throw new Error(`Unsupported SVG attribute: ${key}.`);
      if (/[<>&]/.test(value)) throw new Error("SVG entities and markup in attributes are unsupported.");
      attrs[key] = value;
    }
    if (tail.slice(consumed).trim()) throw new Error("Malformed SVG attributes.");
    if (attrs.fill && !["#000", "black", "currentColor"].includes(attrs.fill)) throw new Error("Import requires visible black ink without presentation transforms.");
    if (name === "path" && (!attrs.d || !pathPattern.test(attrs.d) || attrs.d.length > 250_000)) throw new Error("Unsupported path syntax or size.");
    if (name === "svg") {
      if (attrs.xmlns !== "http://www.w3.org/2000/svg") throw new Error("Missing SVG namespace.");
      const vb = attrs.viewBox?.split(/\s+/).map(Number);
      if (!vb || vb.length !== 4 || vb.some(v => !Number.isFinite(v) || Math.abs(v) > 100_000) || vb[2] <= 0 || vb[3] <= 0) throw new Error("Invalid SVG viewBox.");
    }
    if (name === "circle" && ["cx","cy","r"].some(k => !Object.hasOwn(attrs,k) || !Number.isFinite(Number(attrs[k])) || Math.abs(Number(attrs[k])) > 100_000)) throw new Error("Invalid circle geometry.");
    if (!self) stack.push(name);
  }
  if (stack.length || roots !== 1 || clean.slice(position).trim()) throw new Error("Incomplete SVG document.");
  const result = decode(clean);
  if (new TextEncoder().encode(result.text).length > 128) throw new Error("Decoded payload exceeds the app's 128-byte limit.");
  return result;
}
