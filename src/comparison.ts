import { encodedSource } from "./codec";
import { escapeHtml, svgDataUrl } from "./exports";
import { DEFAULT_STATE, type State } from "./model";
import { renderArtwork } from "./render";

export function comparisonSheet(base: State = DEFAULT_STATE): string {
  const entries: { label: string; state: State }[] = [
    { label: "Exact spelling", state: { ...base, mode: "spelling" } },
    {
      label: "Chosen meaning · explicit example phrase",
      state: { ...base, mode: "meaning", phrase: base.phrase || "Who is like God?" },
    },
    { label: "Decorative art · non-reversible", state: { ...base, mode: "decorative" } },
  ];
  const rows = entries
    .map(({ label, state }) => {
      const source = encodedSource(state),
        art = renderArtwork(state);
      return `<section><div><h2>${escapeHtml(label)}</h2><p>${escapeHtml(JSON.stringify(art.ir.normalizedInput))}</p><p>${state.mode === "meaning" ? "This sheet explicitly selects the displayed phrase for comparison; it does not change the editor’s payload." : "Case and whitespace preserved."}</p></div><figure>${source ? `<img alt="Geometry-encoded source" src="${svgDataUrl(source.svg)}">` : '<div class="empty">No reversible source</div>'}<figcaption>${source ? "Preserved v1 source · serialized geometry decoding" : "One-way hash-derived art"}</figcaption></figure><figure><img alt="Artist-facing derivative" src="${svgDataUrl(art.svg)}"><figcaption>${state.mode === "decorative" ? "Decoration · no encoded payload" : "Artist derivative · no supported geometry decoder"}</figcaption></figure></section>`;
    })
    .join("");
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta http-equiv="Content-Security-Policy" content="default-src 'none';img-src data:;style-src 'unsafe-inline';base-uri 'none';form-action 'none'"><title>Heptapod QR — comparison</title><style>body{max-width:1100px;margin:35px auto;padding:0 24px;background:#f5f3ee;color:#292b25;font:14px/1.5 Arial,sans-serif}h1{font:38px Georgia,serif}h2{font-size:17px}section{display:grid;grid-template-columns:1fr 1fr 1fr;align-items:center;border-top:1px solid #ccd0c3;gap:24px;padding:18px 0}figure{margin:0;text-align:center}img{width:100%;height:230px;object-fit:contain;background:#fff}figcaption{font-size:11px;margin-top:8px}.empty{height:230px;display:grid;place-content:center;color:#606257}p{overflow-wrap:anywhere}footer{padding:25px 0}a{color:#3d5138}@media(max-width:650px){section{grid-template-columns:1fr 1fr}section>div:first-child{grid-column:1/-1}img,.empty{height:175px}}@page{size:A4 landscape;margin:10mm}@media print{body{margin:0;font-size:10px}h1{font-size:24px}section{padding:5px 0;break-inside:avoid}img,.empty{height:43mm}}</style></head><body><h1>Three ways to make a mark.</h1><p>Original Arrival-inspired fan work. <strong>Not an authentic Heptapod B translation.</strong> No canonical Michael glyph is verified.</p><p>Seed ${base.seed} · canvas ${base.settings.diameter} mm · ${escapeHtml(base.normalization)} normalization. Comparison images are fitted for viewing, not true-scale templates; use the separate print sheet.</p>${rows}<footer>Traditional etymology: <a href="https://www.behindthename.com/name/michael" rel="noreferrer">Behind the Name</a>. “Protector” is not the literal etymology. Film glyphs and film-derived assets were not used. Geometric encoding is reversible and is not encryption.</footer></body></html>`;
}
