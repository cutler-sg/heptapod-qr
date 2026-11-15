import {
  art,
  bounds,
  describe,
  crc,
  FILES,
  fonts,
  ink,
  artSvg,
  markAngle,
  marks,
  mm,
  page,
  polar,
  RADIUS,
  report,
  slotGlyph,
  studies,
} from "./lib";

const HOT = 7; // highlighted slot, as if hovered in the read-out
const ticks = Array.from({ length: 91 }, (_, i) => {
  const len = i % 10 === 0 ? 2.6 : i % 5 === 0 ? 1.7 : 0.9;
  return `<path d="M${i},-3.2v${-len}M-3.2,${i}h${-len}"/>${i % 10 === 0 ? `<text x="${i + 0.5}" y="-4.6">${i}</text><text x="-4.2" y="${i + 2.3}" text-anchor="end">${i}</text>` : ""}`;
}).join("");
const crop = [
  [0, 0, -1, -1],
  [90, 0, 1, -1],
  [0, 90, -1, 1],
  [90, 90, 1, 1],
]
  .map(([x, y, sx, sy]) => `<path d="M${x + sx * 2.5},${y}h${sx * 7}M${x},${y + sy * 2.5}v${sy * 7}"/>`)
  .join("");
const centre = [
  [45, 95.5],
  [95.5, 45],
]
  .map(
    ([x, y]) =>
      `<circle cx="${x}" cy="${y}" r="1.5"/><path d="M${x - 2.6},${y}h5.2M${x},${y - 2.6}v5.2"/>`,
  )
  .join("");
const b = report.bounds;
const [hx, hy] = polar(markAngle(HOT), RADIUS);
const [lx, ly] = polar(markAngle(HOT), RADIUS + 13);
const slotDots = marks
  .map((m) => {
    const [x, y] = polar(markAngle(m.order), RADIUS - 5.2);
    return `<text class="idx${m.order === HOT ? " hot" : ""}" x="${x.toFixed(2)}" y="${(y + 0.6).toFixed(2)}" text-anchor="middle">${m.digit}</text>`;
  })
  .join("");
const sheet = `<svg class="plate" viewBox="-13 -11 140 122" role="img" aria-label="Artist study of Michael on a 90 millimetre canvas with rulers and crop marks">
<g class="rule">${ticks}</g>
<g class="trim">${crop}${centre}</g>
<rect class="safe" x="5" y="5" width="80" height="80"/>
<rect class="inkbox" x="${b.minX}" y="${b.minY}" width="${b.maxX - b.minX}" height="${b.maxY - b.minY}"/>
<text class="note" x="${b.maxX}" y="${b.minY - 1.1}" text-anchor="end">ink ${bounds} mm</text>
<text class="note" x="5.8" y="84">safe margin 5 mm</text>
<g class="ink">${ink(art.shapes)}</g>
<g class="digits">${slotDots}</g>
<path class="leader" d="M${hx},${hy}L${lx},${ly}h9"/><circle class="leader-dot" cx="${hx}" cy="${hy}" r="1.1"/>
<text class="callout" x="${lx + 10}" y="${ly - 0.6}">slot 07 · digit ${marks[HOT].digit}</text><text class="callout sub" x="${lx + 10}" y="${ly + 2.6}">${describe(marks[HOT].digit)}</text>
<g class="bar"><path d="M0,102h50M0,100.6v2.8M25,101.2v1.6M50,100.6v2.8"/><text x="0" y="106.4">50 mm · measure this bar on paper before use</text></g>
</svg>`;

const css = `${fonts.archivo}${fonts.martian}
:root{--booth:#c5c6c7;--booth-lo:#b3b4b6;--booth-hi:#d3d4d5;--sheet:#fff;--ink:#0b0b0c;--soft:#3d3e41;--blue:#0f67b3;--blue-line:#4aa8e0;--blue-wash:#e6f2fb}
body{background:var(--booth);color:var(--ink);font:13px/1.45 Archivo,sans-serif;font-stretch:100%;width:1440px}
.mono{font-family:"Martian Mono",monospace;font-stretch:87%;font-size:10.5px;letter-spacing:.01em}
.slug{display:flex;align-items:center;gap:28px;height:48px;padding:0 28px;background:var(--ink);color:#fff}
.mark{font-weight:800;font-stretch:125%;font-size:15px;letter-spacing:.06em;text-transform:uppercase;display:flex;gap:10px;align-items:center}
.mark svg{width:22px;height:22px}.mark .k-ring,.mark path{fill:#fff}
.job{display:flex;gap:22px;margin:0;color:#c9cacc}.job div{display:flex;gap:7px}.job dt{color:#8e9093}.job dd{margin:0;color:#fff}
.local{margin-left:auto;color:#c9cacc;font-size:12px}
.slug button{background:none;border:1px solid #5b5d61;padding:5px 12px;font-size:12px;color:#fff}
.slug button+button{margin-left:-20px}
.booth{display:grid;grid-template-columns:316px 1fr 356px;gap:0;align-items:start}
.ticket{padding:30px 28px 28px;border-right:1px solid var(--booth-lo)}
h1{font-size:46px;line-height:.94;font-weight:800;font-stretch:68%;letter-spacing:-.012em;margin:0 0 12px;text-wrap:balance}
.lede{font-size:13.5px;color:var(--soft);margin:0 0 26px;max-width:30ch}
h2{font-size:11px;font-weight:700;font-stretch:112%;letter-spacing:.09em;text-transform:uppercase;margin:0 0 10px;display:flex;justify-content:space-between;align-items:baseline}
h2 small{font:inherit;font-weight:500;letter-spacing:.02em;text-transform:none;color:var(--soft);font-stretch:100%}
.group{border-top:2px solid var(--ink);padding:10px 0 20px}
.field{background:var(--sheet);border:1px solid var(--ink);padding:9px 11px;font-size:24px;font-weight:600;font-stretch:88%;line-height:1.1;display:flex;justify-content:space-between;align-items:center}
.field i{width:1.5px;height:24px;background:var(--blue);margin-left:2px;margin-right:auto}
.field small{font-size:10px;font-weight:500;color:var(--soft)}
.opts{list-style:none;margin:10px 0 0;padding:0}.opts li{display:flex;gap:9px;align-items:center;padding:4px 0;font-size:13px}
.box{width:13px;height:13px;border:1.5px solid var(--ink);flex:none;position:relative;background:var(--sheet)}
.on .box::after{content:"";position:absolute;inset:2px;background:var(--ink)}.on{font-weight:700}
.payload{margin-top:10px;color:var(--soft)}.payload b{color:var(--ink);font-weight:500}
.dial{display:grid;grid-template-columns:1fr auto;gap:2px 10px;align-items:end;padding:7px 0}
.dial label{font-size:12.5px}.dial output{font-family:"Martian Mono";font-size:11px;font-stretch:87%}
.scale{grid-column:1/-1;height:15px;position:relative;background:repeating-linear-gradient(90deg,var(--ink) 0 1px,transparent 1px 10%) 0 100%/100% 5px no-repeat,linear-gradient(var(--ink),var(--ink)) 0 100%/100% 1px no-repeat;border-right:1px solid var(--ink)}
.scale i{position:absolute;bottom:0;width:0;height:0;border:5px solid transparent;border-bottom:9px solid var(--ink);border-top:0;transform:translateX(-50%)}
.sample{grid-column:1/-1;display:flex;gap:10px;align-items:center;color:var(--soft);font-size:11px}.sample i{display:block;width:74px;background:var(--ink)}
.acts{display:flex;gap:8px;margin-top:4px}.acts button{background:none;border:1px solid var(--ink);padding:6px 12px;font-size:12px}.acts button:first-child{color:#77797c;border-color:#8f9193;text-decoration:line-through}
.proof{padding:22px 34px 34px}
.tabs{display:flex;align-items:center;gap:22px;margin-bottom:14px;font-size:13px}
.tabs b{font-weight:700;border-bottom:3px solid var(--ink);padding-bottom:3px}.tabs span{color:var(--soft);padding-bottom:6px}
.tabs .right{margin-left:auto;display:flex;gap:16px;color:var(--soft);font-size:12px;align-items:center}.tabs .right .box{width:11px;height:11px}
.tabs .right span{display:flex;gap:7px;align-items:center;padding:0}.tabs .right .on{color:var(--ink);font-weight:500}
.sheet{background:var(--sheet);box-shadow:0 1px 0 #fff inset,0 18px 30px -18px rgba(20,22,26,.45),0 2px 4px rgba(20,22,26,.12);padding:18px 22px 20px;position:relative}
.plate{width:100%;height:auto}
.plate text{font-family:"Martian Mono";font-stretch:87%;font-size:2.05px;fill:var(--blue)}
.rule path{stroke:var(--blue-line);stroke-width:.16;fill:none}.trim path,.trim circle{stroke:var(--ink);stroke-width:.2;fill:none}
.safe{fill:none;stroke:var(--blue-line);stroke-width:.2;stroke-dasharray:1.2 .9}.inkbox{fill:none;stroke:var(--blue-line);stroke-width:.14}
.ink path{fill:var(--ink)}.digits text{font-size:2.2px;fill:var(--blue-line)}.digits .hot{fill:var(--blue);font-weight:700;font-size:2.9px}
.leader{fill:none;stroke:var(--blue);stroke-width:.24}.leader-dot{fill:none;stroke:var(--blue);stroke-width:.3}
.plate .callout{font-size:2.5px;font-weight:600;fill:var(--blue)}.plate .callout.sub{font-weight:400;font-size:2.1px}
.bar path{stroke:var(--ink);stroke-width:.3;fill:none}.plate .bar text{fill:var(--ink);font-size:2px}
.sheetslug{display:flex;justify-content:space-between;border-top:1px solid var(--ink);margin-top:10px;padding-top:7px;text-transform:uppercase}
.stamp{position:absolute;right:24px;bottom:52px;width:236px;border:1.5px solid var(--ink);background:var(--sheet)}
.stamp p{margin:0;padding:6px 9px;font-size:11px;font-weight:600;font-stretch:88%;line-height:1.25;text-transform:uppercase;letter-spacing:.02em}
.stamp p+p{border-top:1px solid var(--ink)}.stamp p:first-child{background:var(--ink);color:#fff;font-stretch:112%;font-size:10px;letter-spacing:.1em}
.rail{padding:30px 28px 28px;border-left:1px solid var(--booth-lo)}
.slots{display:grid;grid-template-columns:repeat(11,1fr);gap:1px;background:var(--ink);border:1px solid var(--ink);margin-bottom:8px}
.slots div{background:var(--sheet);padding:3px 0 4px;text-align:center}.slots svg{margin:auto}.slots rect,.slots path{fill:var(--ink)}
.slots b{display:block;font-family:"Martian Mono";font-size:11px;font-weight:500;line-height:1.3}.slots small{display:block;font-family:"Martian Mono";font-size:7.5px;color:#77797c}
.slots .hot{background:var(--blue-wash);box-shadow:inset 0 0 0 1.5px var(--blue)}.slots .hot b{color:var(--blue)}
.key{font-size:11.5px;color:var(--soft);margin:0 0 22px}.key b{color:var(--ink)}
table{border-collapse:collapse;width:100%;font-size:12px}td,th{border-top:1px solid var(--ink);padding:6px 0;text-align:left;vertical-align:baseline;font-weight:400}
td.n,th.n{text-align:right;font-family:"Martian Mono";font-size:10.5px;font-stretch:87%;white-space:nowrap}th{font-size:10px;color:var(--soft)}
.pass{display:inline-block;width:8px;height:8px;background:var(--ink);margin-right:6px}.info{display:inline-block;width:8px;height:8px;border:1.5px solid var(--ink);margin-right:6px}
.verdict{border-top:2px solid var(--ink);padding-top:9px;margin:0;font-weight:700;font-size:13px}.fine{font-size:11.5px;color:var(--soft);margin:6px 0 0}
.band{border-top:1px solid var(--booth-lo);padding:26px 28px 30px}
.band h2{font-size:13px;margin-bottom:14px}
.contact{display:grid;grid-template-columns:repeat(12,1fr);background:var(--ink);padding:10px 10px 6px;gap:6px}
.frame{background:var(--sheet);position:relative;padding:4px}.frame .art path{fill:var(--ink)}
.contact figure{margin:0}.contact figcaption{color:#fff;font-family:"Martian Mono";font-size:10px;padding:5px 2px 2px;display:flex;justify-content:space-between}
.sel .frame{outline:2.5px solid var(--blue-line);outline-offset:2px}.sel figcaption{color:var(--blue-line);font-weight:600}
.files{display:grid;grid-template-columns:repeat(4,1fr);gap:0;border-top:2px solid var(--ink);border-left:1px solid var(--ink)}
.file{border-right:1px solid var(--ink);border-bottom:1px solid var(--ink);padding:11px 13px 12px;background:var(--booth-hi);display:grid;grid-template-columns:1fr auto;gap:2px 8px}
.file b{font-size:15px;font-weight:700;font-stretch:88%}.file i{font-style:normal;font-family:"Martian Mono";font-size:9.5px;align-self:center;border:1px solid var(--ink);padding:1px 5px}
.file span{grid-column:1/-1;font-size:11.5px;color:var(--soft)}
.file.main{background:var(--ink);color:#fff}.file.main span{color:#c9cacc}.file.main i{border-color:#fff}
`;
const dial = (label: string, value: string, pct: number, sample = "") =>
  `<div class="dial"><label>${label}</label><output>${value}</output><div class="scale"><i style="left:${pct}%"></i></div>${sample}</div>`;
const body = `<header class="slug"><span class="mark">${artSvg(art.shapes)}Heptapod QR</span>
<dl class="job mono"><div><dt>JOB</dt><dd>“Michael”</dd></div><div><dt>SEED</dt><dd>42</dd></div><div><dt>SHEET</dt><dd>90 × 90 mm</dd></div><div><dt>CODEC</dt><dd>geometry-v1</dd></div><div><dt>CRC</dt><dd>${crc}</dd></div></dl>
<span class="local">Local file. Nothing leaves this machine.</span><button>Open job</button><button>Save job</button></header>
<main class="booth">
<aside class="ticket"><h1>Make your own alien QR code.</h1><p class="lede">Text in, ink out. A measured ring for you and your tattoo artist.</p>
<div class="group"><h2>Text <small>case and spaces kept</small></h2><div class="field">Michael<i></i><small class="mono">7 / 128 bytes</small></div>
<ul class="opts"><li class="on"><span class="box"></span>Exact spelling</li><li><span class="box"></span>A phrase you choose</li><li><span class="box"></span>Decoration only, no text</li></ul>
<p class="payload mono">payload <b>"Michael"</b> · no normalization</p></div>
<div class="group"><h2>Sheet</h2>${dial("Canvas width", "90 mm", 40)}${dial("Safe margin", "5 mm", 29)}${dial("Rotation", "0°", 50)}</div>
<div class="group"><h2>Ink limits <small>shown at 4×</small></h2>${dial("Thinnest line", "0.8 mm", 21, `<div class="sample"><i style="height:${0.8 * 4 * 3.78}px"></i>0.8 mm line</div>`)}${dial("Narrowest gap", "0.8 mm", 16)}</div>
<div class="acts"><button>Undo</button><button>Reset to Michael</button></div></aside>
<section class="proof"><div class="tabs"><b>Artist study</b><span>Encoded source</span><span>Overlay both</span><div class="right"><span class="on"><span class="box" style="background:var(--blue-line);border-color:var(--blue)"></span>Guides</span><span><span class="box"></span>Transparent</span></div></div>
<div class="sheet">${sheet}<div class="stamp"><p>Read before inking</p><p>Fan encoding, not Heptapod B</p><p>Artist study: no supported decoder</p><p>“QR” is an analogy. Scanners can’t read it</p></div>
<div class="sheetslug mono"><span>Heptapod QR · artist study · seed 42</span><span>blue is guide, black is ink</span><span>atelier/1 · proof 01 of 12</span></div></div></section>
<aside class="rail"><h2>Read-out <small>22 slots, clockwise from the gap</small></h2>
<div class="slots">${marks.map((m) => `<div${m.order === HOT ? ' class="hot"' : ""}>${slotGlyph(m.digit, 22, 34)}<b>${m.digit}</b><small>${String(m.order).padStart(2, "0")}</small></div>`).join("")}</div>
<p class="key"><b>Bump</b> out or in, small or large, gives the digit mod 5. A <b>tendril</b> adds 5. Together the digits are one number holding the text and its CRC.</p>
<h2>Proof check <small>artist study at 90 mm</small></h2>
<table><tr><th>Screened</th><th class="n">Measured</th><th class="n">Limit</th></tr>
<tr><td><span class="pass"></span>Structural width</td><td class="n">${mm(report.minStructuralWidth)} mm</td><td class="n">≥ 0.80</td></tr>
<tr><td><span class="pass"></span>Negative-space gap</td><td class="n">${mm(report.minGap)} mm</td><td class="n">≥ 0.80</td></tr>
<tr><td><span class="info"></span>Terminal taper tips</td><td class="n">${mm(report.minTerminalWidth)} mm</td><td class="n">reported</td></tr>
<tr><td><span class="pass"></span>Ink inside safe margin</td><td class="n">${bounds}</td><td class="n">≤ 80 × 80</td></tr></table>
<p class="verdict">No screened structural violations.</p><p class="fine">A geometry screen, not a healing guarantee. Your artist decides final size and simplification.</p></aside>
</main>
<section class="band"><h2>Twelve studies, one payload <small>seeds 42 to 53 · same digits, different hand</small></h2>
<div class="contact">${studies.map((s, i) => `<figure${i === 0 ? ' class="sel"' : ""}><div class="frame">${artSvg(s.shapes)}</div><figcaption><span>${s.seed}</span><span>${i === 0 ? "on proof" : `${String(i + 1).padStart(2, "0")}/12`}</span></figcaption></figure>`).join("")}</div></section>
<section class="band"><h2>Hand-off <small>made in this tab, saved by you</small></h2>
<div class="files">${FILES.map(([n, t, s], i) => `<div class="file${i === 1 ? " main" : ""}"><b>${n}</b><i>${t}</i><span>${s}</span></div>`).join("")}</div></section>`;
export const pressProof = page("Press proof", css, body);
