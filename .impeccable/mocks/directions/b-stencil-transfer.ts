import {
  art,
  artSvg,
  bounds,
  FILES,
  fonts,
  marks,
  mm,
  page,
  report,
  slotGlyph,
  source,
  studies,
} from "./lib";

const HOT = 7;
const perf = `<div class="perf">${"<i></i>".repeat(17)}</div>`;
const css = `${fonts.besley}${fonts.hanken}
:root{--table:#e7ebf1;--lamp:#f8fafd;--paper:#fff;--violet:#4c22c4;--violet-deep:#2f1291;--violet-wash:#ece7fb;--violet-line:#b9a9ec;--backing:#f5c62f;--backing-deep:#b98a00;--ink:#17141f;--soft:#514c5e}
body{background:var(--table);color:var(--ink);font:14px/1.5 "Hanken Grotesk",sans-serif;width:1440px}
::selection{background:var(--violet);color:#fff}
header{display:flex;align-items:center;gap:18px;padding:22px 44px 0}
.mark{font:800 21px/1 Besley,serif;letter-spacing:-.01em;display:flex;align-items:center;gap:10px}.mark .art{width:26px;height:26px}.mark path{fill:var(--violet)}
header p{margin:0 0 0 auto;color:var(--soft);font-size:13px}
.btn{background:var(--paper);border:1px solid #c9cfd9;border-radius:999px;padding:7px 15px;font-size:13px;font-weight:600}
.btn.go{background:var(--violet);border-color:var(--violet);color:#fff}
.hero{display:grid;grid-template-columns:392px 1fr;gap:20px 40px;padding:34px 44px 0;align-items:start}
h1{font:700 58px/.98 Besley,serif;letter-spacing:-.022em;margin:6px 0 16px;text-wrap:balance}
h1 em{font-style:normal;color:var(--violet)}
.lede{font-size:16px;color:var(--soft);margin:0 0 26px;max-width:34ch}
label,.lab{display:block;font-size:12px;font-weight:700;margin:0 0 7px}
.text{background:var(--paper);border:1.5px solid var(--ink);border-radius:10px;padding:11px 15px;font:600 30px/1.1 Besley,serif;display:flex;align-items:center}
.text i{width:2px;height:30px;background:var(--violet);margin-left:2px}.text small{margin-left:auto;font:500 11px "Hanken Grotesk";color:var(--soft)}
.chips{display:flex;gap:6px;margin:10px 0 22px;flex-wrap:wrap}.chip{border:1.5px solid #c1c7d2;border-radius:999px;padding:6px 13px;font-size:13px;font-weight:600;background:var(--lamp)}
.chip.on{background:var(--violet);border-color:var(--violet);color:#fff}
.row{display:grid;grid-template-columns:1fr auto;align-items:baseline;gap:4px 10px;margin-bottom:16px}.row b{font-size:13px;font-weight:700}.row output{font-size:13px;font-variant-numeric:tabular-nums;color:var(--violet-deep);font-weight:700}
.track{grid-column:1/-1;height:6px;border-radius:3px;background:#cfd5e0;position:relative}.track::before{content:"";position:absolute;left:0;top:0;bottom:0;width:var(--v);background:var(--violet);border-radius:3px}
.track::after{content:"";position:absolute;left:var(--v);top:50%;width:18px;height:18px;border-radius:50%;background:var(--paper);border:2px solid var(--violet);transform:translate(-50%,-50%);box-shadow:0 2px 5px rgba(47,18,145,.25)}
.weights{grid-column:2;background:var(--paper);border-radius:14px;padding:16px 22px;display:grid;grid-template-columns:auto auto auto auto;justify-content:space-between;gap:20px;align-items:center}
.weights p{margin:0;font-size:13px;font-weight:700}.weights div{display:flex;align-items:center;gap:12px;font-size:13px;font-variant-numeric:tabular-nums}
.weights b{white-space:nowrap}.weights p{white-space:nowrap}.weights span{white-space:nowrap}.weights i{display:block;width:56px;background:var(--violet);border-radius:2px;flex:none}.weights span{color:var(--soft)}
.table{background:radial-gradient(120% 90% at 50% 40%,#fff 0,var(--lamp) 45%,#dfe5ee 100%);border-radius:16px;padding:30px 34px 22px;box-shadow:inset 0 0 0 1px #d5dbe5,inset 0 2px 30px rgba(120,140,170,.18)}
.sheets{display:grid;grid-template-columns:1fr 60px 1fr;align-items:center}
.sheet{position:relative}.sheet .paper{background:var(--paper);position:relative;box-shadow:0 14px 24px -14px rgba(40,50,80,.4),0 1px 3px rgba(40,50,80,.18)}
.stencil .paper{background:rgba(255,255,255,.86)}
.stencil::before{content:"";position:absolute;inset:14px -12px -12px 12px;background:var(--backing);box-shadow:0 14px 24px -14px rgba(40,50,80,.4)}
.perf{display:flex;justify-content:space-between;padding:9px 16px 8px;border-bottom:1px dashed #c9cfd9}.perf i{width:7px;height:7px;border-radius:50%;background:var(--table);box-shadow:inset 0 1px 1px rgba(40,50,80,.25)}
.sheet .art{width:100%;height:auto;padding:4px 10px}.master path{fill:var(--ink)}.stencil path{fill:var(--violet)}
.tag{display:flex;justify-content:space-between;align-items:baseline;padding:0 16px 14px;gap:10px}.tag b{font:700 17px Besley,serif}.tag span{font-size:12px;font-weight:600}
.master .tag span{color:var(--ink)}.stencil .tag span{color:var(--violet-deep)}
.arrow{text-align:center;font-size:11.5px;color:var(--soft);line-height:1.3;font-weight:600}.arrow svg{margin:0 auto 6px}
.under{display:flex;gap:20px;align-items:center;margin-top:26px}.under p{margin:0;font-size:12.5px;color:var(--soft);max-width:74ch}.under p b{color:var(--ink)}
.flip{margin-left:auto;display:flex;gap:9px;align-items:center;font-size:13px;font-weight:600;white-space:nowrap}.sw{width:34px;height:20px;border-radius:10px;background:#c1c7d2;position:relative}.sw::after{content:"";position:absolute;left:2px;top:2px;width:16px;height:16px;border-radius:50%;background:#fff}
section{padding:40px 44px 0}h2{font:700 26px/1.1 Besley,serif;letter-spacing:-.012em;margin:0 0 4px}.sub{color:var(--soft);margin:0 0 18px;font-size:14px}
.strip{background:var(--paper);border-radius:14px;padding:18px 20px 14px;display:grid;grid-template-columns:repeat(22,1fr) 300px;gap:0;align-items:end}
.s{text-align:center;padding:6px 0;border-radius:8px}.s svg{margin:auto}.s rect,.s path{fill:var(--violet)}.s b{display:block;font:700 15px Besley,serif}.s small{font-size:10px;color:var(--soft);font-variant-numeric:tabular-nums}
.s.hot{background:var(--violet)}.s.hot rect,.s.hot path{fill:#fff}.s.hot b,.s.hot small{color:#fff}
.legend{padding:0 0 4px 26px;font-size:12.5px;color:var(--soft);border-left:1px solid #d5dbe5;margin-left:14px;align-self:stretch;display:flex;flex-direction:column;justify-content:center}.legend b{color:var(--ink)}
.grid{display:grid;grid-template-columns:repeat(6,1fr);gap:22px 20px}
.card{position:relative}.card .paper{background:rgba(255,255,255,.9);position:relative;box-shadow:0 8px 16px -10px rgba(40,50,80,.4),0 1px 2px rgba(40,50,80,.16)}.card path{fill:var(--violet)}
.card .art{width:100%;height:auto;padding:6px}.card p{margin:0;padding:0 10px 8px;font-size:12px;font-weight:600;display:flex;justify-content:space-between;font-variant-numeric:tabular-nums}.card p span{color:var(--soft);font-weight:500}
.card.on::before{content:"";position:absolute;inset:8px -7px -7px 7px;background:var(--backing)}.card.on .paper{outline:2.5px solid var(--violet)}.card.on p span{color:var(--violet-deep);font-weight:700}
.duo{display:grid;grid-template-columns:420px 1fr;gap:40px;padding-bottom:48px}
.check{background:var(--paper);border-radius:14px;padding:6px 18px 14px}.check div{display:flex;justify-content:space-between;padding:10px 0;border-bottom:1px solid #e3e7ee;font-size:13.5px}.check div b{font-variant-numeric:tabular-nums}
.check p{margin:12px 0 0;font-size:12.5px;color:var(--soft)}.check p b{color:var(--ink);display:block;font-size:14px}
.files{display:grid;grid-template-columns:1fr 1fr;gap:8px}.f{background:var(--paper);border-radius:12px;padding:11px 15px;display:grid;grid-template-columns:1fr auto;gap:0 10px}
.f b{font-size:14.5px}.f i{font-style:normal;font-size:11px;font-weight:700;color:var(--soft)}.f span{grid-column:1/-1;font-size:12px;color:var(--soft)}
.f.go{background:var(--violet);color:#fff}.f.go span,.f.go i{color:#dcd3fa}
`;
const row = (label: string, value: string, pct: number) =>
  `<div class="row"><b>${label}</b><output>${value}</output><div class="track" style="--v:${pct}%"></div></div>`;
const body = `<header><span class="mark">${artSvg(art.shapes)}Heptapod QR</span><p>Works offline. Nothing you type is sent anywhere.</p><button class="btn">Open project</button><button class="btn">Save project</button></header>
<div class="hero"><div style="grid-row:span 2"><h1>Make your own alien <em>QR code.</em></h1><p class="lede">Type a name. Get a ring of ink that holds it, and a stencil your tattoo artist can work from.</p>
<span class="lab">Your text</span><div class="text">Michael<i></i><small>7 of 128 bytes</small></div>
<div class="chips"><span class="chip on">Exact spelling</span><span class="chip">A phrase I choose</span><span class="chip">Decoration only</span></div>
${row("Size on paper", "90 mm", 40)}${row("Thinnest line", "0.8 mm", 21)}${row("Narrowest gap", "0.8 mm", 16)}
</div>
<div class="table"><div class="sheets">
<div class="sheet master"><div class="paper">${perf}${artSvg(source.shapes)}<div class="tag"><b>Master</b><span>Reads back as “Michael”</span></div></div></div>
<div class="arrow"><svg width="40" height="16" viewBox="0 0 40 16"><path d="M0,8h34M28,2l7,6-7,6" fill="none" stroke="#514c5e" stroke-width="2"/></svg>redrawn<br>for skin</div>
<div class="sheet stencil"><div class="paper">${perf}${artSvg(art.shapes)}<div class="tag"><b>Stencil</b><span>Artist study. Can’t be read back</span></div></div></div>
</div><div class="under"><p><b>“QR” is an analogy.</b> This is an original fan encoding, not Heptapod B, and phone scanners can’t read it. Only the master’s exact SVG geometry decodes. Keep it with the stencil.</p><span class="flip"><span class="sw"></span>Flip for transfer</span></div></div>
<div class="weights"><p>Line weights, drawn at 4×</p><div><i style="height:${(report.minStructuralWidth ?? 1) * 15}px"></i><b>${mm(report.minStructuralWidth)} mm</b><span>thinnest structure</span></div><div><i style="height:${(report.minTerminalWidth ?? 1) * 15}px"></i><b>${mm(report.minTerminalWidth)} mm</b><span>finest taper tip</span></div><div><i style="height:12px"></i><b>0.80 mm</b><span>your limit</span></div></div></div>
<section><h2>How the ring holds “Michael”</h2><p class="sub">22 marks, read clockwise from the gap. Point at one to find it on the ring.</p>
<div class="strip">${marks.map((m) => `<div class="s${m.order === HOT ? " hot" : ""}">${slotGlyph(m.digit, 28, 44)}<b>${m.digit}</b><small>${m.order + 1}</small></div>`).join("")}<p class="legend"><span><b>A bump</b>, out or in, small or large, is a digit from 0 to 4.</span><span><b>A tendril</b> adds 5.</span><span>All 22 digits make one number that carries the text and its checksum.</span></p></div></section>
<section><h2>Twelve stencils, same name</h2><p class="sub">Each seed redraws the hand, never the digits.</p>
<div class="grid">${studies.map((s, i) => `<div class="card${i === 0 ? " on" : ""}"><div class="paper">${artSvg(s.shapes)}<p>Seed ${s.seed}<span>${i === 0 ? "On the table" : ""}</span></p></div></div>`).join("")}</div></section>
<section class="duo"><div><h2>At 90 mm</h2><p class="sub">Measured on the final vector shapes.</p><div class="check"><div>Thinnest structure<b>${mm(report.minStructuralWidth)} mm</b></div><div>Narrowest gap<b>${mm(report.minGap)} mm</b></div><div>Finest taper tip<b>${mm(report.minTerminalWidth)} mm</b></div><div>Ink area<b>${bounds} mm</b></div><p><b>Nothing below your limits.</b>A geometry check, not a promise about healing. Your artist has the final say.</p></div></div>
<div><h2>Take it to your artist</h2><p class="sub">Eight files, made in this tab.</p><div class="files">${FILES.map(([n, t, s], i) => `<div class="f${i === 1 ? " go" : ""}"><b>${n}</b><i>${t}</i><span>${s}</span></div>`).join("")}</div></div></section>`;
export const stencilTransfer = page("Stencil transfer", css, body);
