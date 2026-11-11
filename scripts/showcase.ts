import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { svgDataUrl } from "../src/exports";

const families = [
  {
    slug: "who-is-like-god",
    label: "Who is like God?",
    description: "Chosen meaning of Michael · explicitly selected phrase",
    short: "Meaning",
  },
  {
    slug: "Michael",
    label: "Michael",
    description: "Exact spelling · capital M preserved",
    short: "Michael",
  },
  {
    slug: "michael",
    label: "michael",
    description: "Exact lowercase spelling · a different payload",
    short: "michael",
  },
  {
    slug: "there-is-no-linear-time",
    label: "There is no linear time",
    description: "Original encoding of English text · not a reconstruction of the film glyph",
    short: "Time phrase",
  },
];
const asset = (path: string) => `./${path}`;
const cards = families
  .map(
    (family) =>
      `<section class="family" data-family="${family.slug}"><header><h2>${family.label}</h2><p>${family.description}</p></header><div class="grid">${Array.from(
        { length: 12 },
        (_, i) => {
          const seed = 42 + i;
          return `<button type="button" class="study" data-family="${family.slug}" data-seed="${seed}" data-label="${family.label}" aria-label="Enlarge ${family.label}, seed ${seed}" aria-pressed="${family.slug === "who-is-like-god" && seed === 42}"><span class="pictures"><img class="source" src="${asset(`${family.slug}/variants/seed-${seed}-source.svg`)}" alt="${family.label}, seed ${seed}, original source"><img class="artist" src="${asset(`${family.slug}/variants/seed-${seed}-artist.svg`)}" alt="${family.label}, seed ${seed}, artist derivative"></span><span class="seed">Seed ${seed}<span class="open">Enlarge</span></span></button>`;
        },
      ).join(
        "",
      )}</div><details class="treatments"><summary>Reversed & mirrored transfer · seed 42</summary><div class="treatment-grid"><figure><div class="sheet"><img src="${asset(`${family.slug}/reversed.svg`)}" alt="${family.label}, reversed artist derivative"></div><figcaption>Reversed artist study · white shapes on black</figcaption></figure><figure><div class="sheet"><img src="${asset(`${family.slug}/MIRRORED-TRANSFER.svg`)}" alt="${family.label}, mirrored transfer"></div><figcaption>Mirrored transfer only · not final orientation</figcaption></figure></div></details></section>`,
  )
  .join("");
const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Heptapod QR — complete design showcase</title><style>
:root{color-scheme:light dark}body{margin:0;padding:0;color:var(--foreground,#282a25);font-family:var(--font-sans,Arial,sans-serif);font-size:13px;line-height:1.5}*{box-sizing:border-box}button,select{font:inherit;color:inherit}button{cursor:pointer}button:focus-visible,select:focus-visible,summary:focus-visible{outline:2px solid var(--ring,#526e48);outline-offset:3px}p{margin:0}.intro{color:var(--muted-foreground,#64685d);margin-bottom:16px;font-size:12px}.intro strong{color:var(--foreground,#282a25)}.spotlight{margin-bottom:24px}.spot-heading{display:flex;align-items:baseline;justify-content:space-between;gap:12px;margin-bottom:12px}.spot-heading h2{font-family:Georgia,serif;font-size:24px;font-weight:400;margin:0}.spot-heading span{color:var(--muted-foreground,#64685d);font-size:12px}.featured{display:grid;grid-template-columns:1fr 1fr;gap:12px}figure{margin:0;min-width:0}.sheet{background:#fff;padding:16px;border-radius:var(--radius,8px);display:grid;place-items:center}.sheet img{width:100%;height:240px;object-fit:contain}.featured figcaption{margin-top:8px;font-size:12px}.status{display:block;color:var(--muted-foreground,#64685d);font-size:11px}.toolbar{display:flex;justify-content:space-between;gap:12px;flex-wrap:wrap;padding:12px 0;border-top:1px solid var(--border,#d7d8ce);border-bottom:1px solid var(--border,#d7d8ce)}.control{display:flex;gap:8px;align-items:center;font-size:12px}select{background:var(--card,#fff);border:1px solid var(--border,#d7d8ce);border-radius:5px;padding:7px;max-width:230px}.count{font-size:11px;color:var(--muted-foreground,#64685d);padding-top:10px}.family{margin-top:30px}.family header{margin-bottom:14px}.family h2{font-size:18px;margin:0 0 3px;font-weight:600}.family header p{font-size:12px;color:var(--muted-foreground,#64685d)}.grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px}.study{padding:0;border:1px solid var(--border,#d7d8ce);border-radius:var(--radius,8px);overflow:hidden;background:var(--card,#fff);text-align:left;min-width:0}.study[aria-pressed=true]{outline:2px solid var(--primary,#526e48);outline-offset:1px}.pictures{display:flex;background:#fff;padding:8px;min-height:160px}.pictures img{width:100%;height:160px;object-fit:contain;min-width:0}.pictures .artist{display:none}body[data-view=artist] .pictures .source{display:none}body[data-view=artist] .pictures .artist{display:block}body[data-view=both] .pictures img{display:block;width:50%}body[data-view=both] .pictures{padding:4px}.seed{display:flex;justify-content:space-between;padding:8px 10px;font-size:11px;font-variant-numeric:tabular-nums}.open{color:var(--muted-foreground,#64685d)}.treatments{margin-top:16px;font-size:12px}summary{cursor:pointer;color:var(--muted-foreground,#64685d);padding:5px 0}.treatment-grid{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-top:10px}.treatment-grid img{height:160px}.treatment-grid figcaption{font-size:11px;color:var(--muted-foreground,#64685d);padding-top:5px}.decoration .artist{display:block!important;width:100%!important}.foot{border-top:1px solid var(--border,#d7d8ce);margin-top:30px;padding-top:16px;color:var(--muted-foreground,#64685d);font-size:11px} [hidden]{display:none!important}@media(max-width:490px){.grid{grid-template-columns:repeat(2,minmax(0,1fr))}.sheet{padding:8px}.sheet img{height:170px}.pictures,.pictures img{min-height:140px;height:140px}.spot-heading h2{font-size:20px}.spot-heading{align-items:flex-start}.featured{gap:8px}.toolbar{gap:8px}.control{flex-wrap:wrap}.treatment-grid img{height:130px}}
</style></head><body data-view="source"><p class="intro"><strong>48 encoded studies + 1 decorative design.</strong> Each encoded study has an organic source and an artist-facing simplification. Original Arrival-inspired fan work, not an authentic Heptapod B translation.</p><section class="spotlight" aria-label="Enlarged selected design"><div class="spot-heading"><h2 id="selected-title">Who is like God?</h2><span id="selected-seed">Seed 42 · 90 mm canvas</span></div><div class="featured"><figure id="featured-source-figure"><div class="sheet"><img id="featured-source" src="${asset("who-is-like-god/encoded-source-v1.svg")}" alt="Who is like God? organic source, seed 42"></div><figcaption>Organic encoded source<span class="status">Original SVG geometry decodes · not camera-scannable</span></figcaption></figure><figure><div class="sheet"><img id="featured-artist" src="${asset("who-is-like-god/artist-stencil.svg")}" alt="Who is like God? artist study, seed 42"></div><figcaption id="featured-artist-caption">Artist-facing simplification<span class="status">No supported geometry decoder</span></figcaption></figure></div></section><div class="toolbar"><label class="control">Collection<select id="collection"><option value="all">All designs</option>${families.map((f) => `<option value="${f.slug}">${f.label}</option>`).join("")}<option value="decorative">Decorative Michael</option></select></label><label class="control">Gallery view<select id="view"><option value="source">Organic source</option><option value="artist">Artist study</option><option value="both">Source + artist</option></select></label></div><p class="count" id="count">49 studies · choose any seed to enlarge it above</p>${cards}<section class="family decoration" data-family="decorative"><header><h2>Decorative Michael</h2><p>Hash-derived artwork · non-reversible, no encoded text</p></header><div class="grid"><button type="button" class="study" data-family="decorative" data-seed="42" data-label="Decorative Michael" aria-label="Enlarge decorative Michael, seed 42" aria-pressed="false"><span class="pictures"><img class="artist" src="${asset("decorative-Michael.svg")}" alt="Decorative Michael, non-reversible"></span><span class="seed">Seed 42<span class="open">Enlarge</span></span></button></div></section><p class="foot">Previews are fitted for viewing, not true-scale templates. Reversed and mirrored treatments are available beneath each encoded collection. Use the separate scale-bar print sheets for physical review. These studies have not been certified for tattooing; an artist must review gaps, taper tips and placement. This gallery contains plaintext names and phrases. All assets are local, with no analytics or network requests.</p><script>
const cards=[...document.querySelectorAll('.study')];
const collection=document.getElementById('collection');
collection.addEventListener('change',()=>{const choice=collection.value;let count=0;document.querySelectorAll('.family').forEach(section=>{section.hidden=choice!=='all'&&section.dataset.family!==choice;if(!section.hidden)count+=section.querySelectorAll('.study').length});document.getElementById('count').textContent=count+' studies · choose any seed to enlarge it above';});
document.getElementById('view').addEventListener('change',event=>{document.body.dataset.view=event.target.value;});
cards.forEach(card=>card.addEventListener('click',()=>{cards.forEach(other=>other.setAttribute('aria-pressed',String(other===card)));const source=card.querySelector('.source');const artist=card.querySelector('.artist');const title=card.dataset.label;document.getElementById('selected-title').textContent=title;document.getElementById('selected-seed').textContent='Seed '+card.dataset.seed+' · 90 mm canvas';document.getElementById('featured-source-figure').hidden=!source;if(source){document.getElementById('featured-source').src=source.src;document.getElementById('featured-source').alt=source.alt;}document.getElementById('featured-artist').src=artist.src;document.getElementById('featured-artist').alt=artist.alt;const caption=document.getElementById('featured-artist-caption');caption.textContent=source?'Artist-facing simplification':'Non-reversible decoration';const status=document.createElement('span');status.className='status';status.textContent=source?'No supported geometry decoder':'No encoded text or reversible source';caption.append(status);document.querySelector('.spotlight').scrollIntoView({block:'start',behavior:'instant'});}));
</script></body></html>`;
await writeFile("examples/showcase-inline.html", html);
let portable = html;
for (const path of new Set([...html.matchAll(/src="([^"]+)"/g)].map((match) => match[1]))) {
  portable = portable.replaceAll(
    `src="${path}"`,
    `src="${svgDataUrl(await readFile(resolve("examples", path), "utf8"))}"`,
  );
}
await writeFile("examples/showcase.html", portable);
console.log(
  `Showcase: 49 selectable studies, 48 source/artist pairs, 8 reversal/transfer treatments. ${portable.length} standalone HTML bytes.`,
);
