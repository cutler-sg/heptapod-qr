import { createIR, encodedSource } from "./codec";
import type { GeometryReport } from "./geometry-types";
import { type State, UPSTREAM_COMMIT } from "./model";
import { withPngDensity } from "./png";
import { renderArtwork, type SvgAppearance, shapesSvg } from "./render";

export const escapeHtml = (text: string): string =>
  text.replace(
    /[&<>"']/g,
    (ch) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[ch] ?? ch,
  );
export async function sha256(text: string): Promise<string> {
  const hash = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return Array.from(new Uint8Array(hash), (v) => v.toString(16).padStart(2, "0")).join("");
}
export function saveFile(name: string, bytes: BlobPart, type: string): void {
  const url = URL.createObjectURL(new Blob([bytes], { type }));
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
export function svgDataUrl(svg: string): string {
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}
export async function exportPng(svg: string, diameter: number, dpi = 600): Promise<Blob> {
  const pixels = Math.round((diameter / 25.4) * dpi);
  const img = new Image();
  img.src = svgDataUrl(svg);
  await img.decode();
  const canvas = document.createElement("canvas");
  canvas.width = pixels;
  canvas.height = pixels;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("This browser cannot create a PNG preview.");
  ctx.drawImage(img, 0, 0, pixels, pixels);
  const png = await new Promise<Blob>((resolve, reject) =>
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("PNG export failed."))),
      "image/png",
    ),
  );
  return new Blob([withPngDensity(new Uint8Array(await png.arrayBuffer()), dpi)], {
    type: "image/png",
  });
}
export function exportSvg(state: State, appearance: SvgAppearance = {}): string {
  const artwork = renderArtwork(state);
  return shapesSvg(artwork.shapes, state.settings.diameter, appearance);
}
export async function manifest(state: State, report?: GeometryReport): Promise<string> {
  const source = encodedSource(state),
    tattoo = renderArtwork(state);
  const versions = {
    source: source?.svg ?? null,
    stencil: tattoo.svg,
    reversed: shapesSvg(tattoo.shapes, state.settings.diameter, { reversed: true }),
    transfer: shapesSvg(tattoo.shapes, state.settings.diameter, { mirrored: true }),
  };
  const hashes = Object.fromEntries(
    await Promise.all(
      Object.entries(versions).map(async ([name, svg]) => [name, svg ? await sha256(svg) : null]),
    ),
  );
  return `${JSON.stringify(
    {
      format: "arrival-atelier-manifest/1",
      ir: createIR(state),
      settings: state.settings,
      upstream: {
        url: "https://tangled.org/mads.havmand.eu/heptapod-ink",
        commit: UPSTREAM_COMMIT,
        packageVersion: "0.1.3",
        geometryFormat: "restored-v1",
        license: "MIT",
      },
      status: {
        source: source
          ? "Verified serialized path-geometry round trip; no plaintext metadata."
          : "Unavailable: non-reversible decoration.",
        stencil:
          state.mode === "decorative"
            ? "Non-reversible decorative art."
            : "Artistic derivative; no supported geometric decoding.",
        reversed:
          "White shapes on a black field; ink and negative space exchange roles. Artistic derivative.",
        transfer:
          "Horizontally reflected stencil for transfer only; do not mistake it for final artwork.",
      },
      contentHashAlgorithm: "SHA-256 of exact UTF-8 SVG bytes",
      contentHashes: hashes,
      privacy:
        "Artwork contains no plaintext metadata. Project and manifest contain private input. Reversible geometry is not encryption.",
      constraints: report ?? null,
      limitation:
        "No claim of decodability after edits, photographs, tattooing or aging; artist judgment required.",
    },
    null,
    2,
  )}\n`;
}
export function printSheet(state: State, appearance: SvgAppearance = {}): string {
  const svg = exportSvg(state, appearance),
    d = state.settings.diameter;
  const transfer = appearance.mirrored === true;
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src data:; style-src 'unsafe-inline'; base-uri 'none'; form-action 'none'"><title>Heptapod QR — ${transfer ? "MIRRORED TRANSFER" : "print sheet"}</title><style>
@page{size:A4;margin:12mm}*{box-sizing:border-box}body{margin:0;color:#000;background:#fff;font:11pt Arial,sans-serif}h1{font-size:17pt}p{max-width:180mm;line-height:1.5}.art{display:block;width:${d}mm;height:${d}mm;max-width:none;max-height:none;margin:8mm auto}.bar{width:50mm;height:4mm;border:0.35mm solid #000;border-top:0}.caption{font-size:9pt}.notice{border:0.3mm solid;padding:3mm} @media print{body{-webkit-print-color-adjust:exact;print-color-adjust:exact}.screen{display:none}}
</style></head><body><h1>${transfer ? "MIRRORED TRANSFER — not final artwork" : "Heptapod QR · artist review sheet"}</h1><p class="notice">Print at <b>100% / Actual size</b>. Disable “Fit to page”, headers and footers. Measure the 50 mm bar before use. Canvas: ${d} × ${d} mm. A4 paper.</p><img class="art" width="${d}" height="${d}" alt="Original fan design; artistic derivative" src="${svgDataUrl(svg)}"><div class="bar"></div><p class="caption">50 mm verification bar · canvas ${d} mm · seed ${state.seed}</p><p>Original Arrival-inspired fan ${state.mode === "decorative" ? "decoration" : "encoding derivative"}; not an authentic Heptapod B translation. No supported machine decoding for this artist-facing version. ${appearance.reversed ? "Reversed: white shapes define negative space in a black field." : "Black areas indicate proposed ink."} ${transfer ? "Horizontally mirrored for transfer only." : "Unmirrored final orientation."}</p><p>Artist to review line widths, gaps, small terminal tips, placement and final dimensions. No width guarantees healing, longevity or safety. Source SVG and project remain separate.</p><p class="screen">Use your browser’s Print command to print or save a PDF. This sheet intentionally omits your plaintext payload.</p></body></html>`;
}
