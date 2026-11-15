import {
  art,
  artSvg,
  bounds,
  crc,
  describe,
  FILES,
  fonts,
  ink,
  markAngle,
  marks,
  mm,
  page,
  polar,
  RADIUS,
  report,
  studies,
} from "./lib";

const HOT = 7;
// Swelling class → emission line. Colour exists only as hairlines.
const LINE = ["#8f8b80", "#49b9ea", "#73df6e", "#ff9340", "#ff5252"];
const NM = ["none", "486 nm", "546 nm", "615 nm", "656 nm"];
const dial = marks
  .map((m) => {
    const a = markAngle(m.order);
    const [x1, y1] = polar(a, 37.2);
    const [x2, y2] = polar(a, m.order === HOT ? 43.5 : 39.6 + (m.digit % 5) * 0.55);
    const [tx, ty] = polar(a, 46.4);
    const [d1, d2] = polar(a + 0.012, 37.2);
    const [d3, d4] = polar(a + 0.012, 41.4);
    const colour = m.order === HOT ? "var(--na)" : LINE[m.digit % 5];
    return `<path d="M${x1},${y1}L${x2},${y2}" stroke="${colour}"/>${m.digit >= 5 ? `<path d="M${d1},${d2}L${d3},${d4}" stroke="${colour}"/>` : ""}<text class="${m.order === HOT ? "hot" : ""}" x="${tx.toFixed(2)}" y="${(ty + 0.75).toFixed(2)}" text-anchor="middle">${m.digit}</text>`;
  })
  .join("");
const arc = (() => {
  const [x1, y1] = polar(markAngle(-1.2), 37.2);
  const [x2, y2] = polar(markAngle(marks.length + 0.2), 37.2);
  return `<path class="scale" d="M${x1},${y1}A37.2,37.2 0 1 1 ${x2},${y2}"/>`;
})();
const plate = `<svg class="plate" viewBox="-6 -6 102 102" role="img" aria-label="Reversed ring for Michael inside a reading dial of 22 digits">${arc}<g class="lines">${dial}</g><g class="ring">${ink(art.shapes)}</g>
<path class="cross" d="M45,41.5v7M41.5,45h7"/><text class="mid" x="45" y="53.4" text-anchor="middle">“Michael”</text><text class="mid dim" x="45" y="56.6" text-anchor="middle">read clockwise from the gap</text></svg>`;
const rail = marks
  .map((m) => {
    const cls = m.digit % 5;
    const h = [26, 44, 78, 44, 78][cls];
    const down = cls >= 3;
    const hot = m.order === HOT;
    return `<div class="l${hot ? " hot" : ""}" style="--c:${hot ? "var(--na)" : LINE[cls]};--h:${h}px"><i class="${down ? "down" : "up"}${m.digit >= 5 ? " dbl" : ""}"></i><b>${m.digit}</b><small>${String(m.order).padStart(2, "0")}</small></div>`;
  })
  .join("");
const css = `${fonts.schibsted}
:root{--plate:#0c0d0f;--graphite:#151619;--ash:#1f2125;--ash-hi:#2b2e33;--rule:#3a3d43;--bone:#ebe6d9;--dim:#a6a295;--faint:#74726a;--na:#ffd23a}
body{background:var(--graphite);color:var(--bone);font:13px/1.5 "Schibsted Grotesk",sans-serif;width:1440px;position:relative}
::selection{background:var(--na);color:#000}
body::before{content:"";position:absolute;left:428px;top:0;bottom:0;width:1px;background:var(--rule)}
.caps{text-transform:uppercase;letter-spacing:.16em;font-weight:600}
.dim{color:var(--dim)}
.top{display:flex;height:52px;align-items:center;border-bottom:1px solid var(--rule)}
.top .l{width:428px;padding:0 20px 0 36px;display:flex;justify-content:space-between;align-items:center}.top .r{flex:1;padding:0 36px 0 24px;display:flex;gap:26px;align-items:center}
.top .r span:first-child{margin-right:auto}.act{border-bottom:1px solid var(--bone);padding-bottom:1px}
.main{display:grid;grid-template-columns:428px 1fr}
.left{padding:0 20px 30px 36px;text-align:right}
.tick{position:relative;padding:22px 0 0;margin-top:0}.tick::after{content:"";position:absolute;right:-20px;top:31px;width:12px;height:1px;background:var(--bone)}
.tick.open::after{width:20px;height:3px;top:30px;background:var(--na)}
.tick h2{font-size:13px;margin:0 0 10px}.tick.shut h2{color:var(--dim);font-weight:500;margin:0}
.say{font-size:13px;font-weight:600;margin:26px 0 0;text-align:right}.say+p{margin:4px 0 0 auto;color:var(--dim);max-width:34ch}
.field{background:var(--ash);padding:10px 14px;display:flex;justify-content:space-between;align-items:baseline;margin-bottom:1px}
.field b{font-weight:600}.field.big b{font-size:13px;letter-spacing:.34em;text-transform:none;font-weight:700}
.field .cur{display:inline-block;width:1px;height:14px;background:var(--na);vertical-align:-2px;margin-left:3px}
.opt{display:flex;justify-content:flex-end;gap:10px;align-items:center;padding:5px 0;color:var(--dim)}.opt i{width:22px;height:1px;background:var(--dim)}
.opt.on{color:var(--bone);font-weight:600}.opt.on i{height:3px;background:var(--bone)}.opt.off i{background:none;border-top:1px dashed var(--faint)}
.meter{display:grid;grid-template-columns:1fr auto;gap:6px 12px;padding:9px 0;align-items:center;text-align:left}.meter span{color:var(--dim)}.meter b{font-weight:600;font-variant-numeric:tabular-nums}
.meter div{grid-column:1/-1;height:9px;position:relative;background:linear-gradient(var(--rule),var(--rule)) 0 50%/100% 1px no-repeat}.meter div::after{content:"";position:absolute;left:var(--v);top:0;bottom:0;width:2px;background:var(--bone)}
.stage{padding:26px 36px 0 24px}
.view{display:flex;gap:24px;margin-bottom:6px}.view span{color:var(--dim)}.view b{font-weight:600;border-bottom:3px solid var(--bone);padding-bottom:3px}.view .r{margin-left:auto}
.frame{background:var(--plate);display:grid;grid-template-columns:1fr 264px;align-items:center;box-shadow:0 1px 0 var(--rule),0 -1px 0 var(--rule)}
.plate{width:100%;height:auto;max-height:620px}
.ring path{fill:var(--bone)}.lines path{stroke-width:.3;fill:none}.scale{fill:none;stroke:var(--rule);stroke-width:.18}
.plate text{font-family:"Schibsted Grotesk";font-size:2.5px;fill:var(--dim)}.plate text.hot{fill:var(--na);font-weight:700;font-size:3.3px}
.cross{stroke:var(--faint);stroke-width:.14;fill:none}.plate .mid{fill:var(--bone);font-size:2.3px;letter-spacing:.3px;font-weight:600}.plate .mid.dim{fill:var(--faint);font-weight:400;font-size:1.9px;letter-spacing:.1px}
.notes{padding:0 28px 0 0}.notes dl{margin:0}.notes div{padding:10px 0;border-top:1px solid var(--rule)}.notes dt{color:var(--dim)}.notes dd{margin:0;font-weight:600;font-variant-numeric:tabular-nums}
.notes .na dd{color:var(--na)}
.caveat{background:var(--ash);padding:14px 18px;margin-top:20px;display:grid;grid-template-columns:auto 1fr;gap:4px 22px}.caveat b{font-weight:600}.caveat span{color:var(--dim)}
.band{margin-top:22px;background:repeating-linear-gradient(90deg,#17181b 0 61px,#1c1e21 61px 63px,#191a1d 63px 150px,#141518 150px 212px);padding:0 24px;display:grid;grid-template-columns:repeat(22,1fr);height:214px;align-items:center;position:relative}
.band::before{content:"";position:absolute;left:0;right:0;top:107px;height:1px;background:var(--rule)}
.l{position:relative;height:100%;text-align:center}.l i{position:absolute;left:50%;width:1.5px;height:var(--h);background:var(--c)}
.l i.up{bottom:107px}.l i.down{top:107px}.l i.dbl{box-shadow:5px 0 0 var(--c)}
.l b{position:absolute;left:0;right:0;bottom:8px;font-weight:600;font-variant-numeric:tabular-nums}.l small{position:absolute;left:0;right:0;top:8px;font-size:10px;color:var(--faint);font-variant-numeric:tabular-nums}
.l.hot b,.l.hot small{color:var(--na)}.l.hot i{width:2.5px}
.key{display:flex;gap:20px;font-size:12px;padding:12px 0 0;color:var(--dim);flex-wrap:wrap}.key span{display:flex;gap:8px;align-items:center}.key i{width:1.5px;height:14px;display:block}
.sec{padding:34px 36px 0 24px}.sec h2{font-size:13px;margin:0 0 14px;display:flex;justify-content:space-between}.sec h2 span{color:var(--dim);font-weight:400;letter-spacing:0;text-transform:none}
.plates{display:grid;grid-template-columns:repeat(12,1fr);gap:1px;background:var(--rule)}.p{background:var(--plate);padding:6px 6px 0;position:relative}.p .art{width:100%;height:auto}.p path{fill:var(--bone)}
.p span{display:flex;justify-content:space-between;padding:6px 2px 8px;color:var(--dim);font-variant-numeric:tabular-nums;font-size:12px}
.p.on{box-shadow:inset 0 3px 0 var(--na)}.p.on span{color:var(--na);font-weight:600}
.files{display:grid;grid-template-columns:repeat(4,1fr);gap:1px;background:var(--rule);margin-bottom:44px}.f{background:var(--ash);padding:12px 14px}.f b{display:flex;justify-content:space-between;font-weight:600}.f b i{font-style:normal;font-weight:400;color:var(--faint);font-size:11px;letter-spacing:.1em}
.f span{color:var(--dim);font-size:12px}.f.go{background:var(--bone);color:#111}.f.go span,.f.go b i{color:#4b4a44}
`;
const meter = (label: string, value: string, pct: number) =>
  `<div class="meter"><span>${label}</span><b>${value}</b><div style="--v:${pct}%"></div></div>`;
const body = `<div class="top"><div class="l"><span class="caps">Heptapod QR</span><span class="dim">0.1.0</span></div><div class="r"><span class="dim">Runs from this file. Nothing is transmitted.</span><span class="act">Open project</span><span class="act">Save project</span></div></div>
<div class="main"><div class="left">
<p class="say">Make your own alien QR code.</p><p>A name becomes 22 marks on a ring. The ring becomes a study for your tattoo artist.</p>
<div class="tick open"><h2 class="caps">Words</h2><div class="field big"><span class="dim">Text</span><b>Michael<span class="cur"></span></b></div><div class="field"><span class="dim">Payload</span><b>"Michael" · 7 bytes · CRC ${crc}</b></div>
<div style="padding-top:10px"><div class="opt on">Exact spelling<i></i></div><div class="opt">A phrase you choose<i></i></div><div class="opt">Decoration only, no text<i></i></div></div></div>
<div class="tick open"><h2 class="caps">Form</h2>${meter("Canvas", "90 mm", 40)}${meter("Thinnest line", "0.8 mm", 21)}${meter("Narrowest gap", "0.8 mm", 16)}${meter("Rotation", "0°", 50)}</div>
<div class="tick shut"><h2 class="caps">Linework and ornament</h2></div><div class="tick shut"><h2 class="caps">Studies · 42 of 42–53</h2></div><div class="tick shut"><h2 class="caps">Measure</h2></div><div class="tick shut"><h2 class="caps">Hand-off · 8 files</h2></div>
</div>
<div><div class="stage"><div class="view"><b>Artist study</b><span>Encoded source</span><span>Both</span><span class="r">Ink on white</span><b style="border:0">Reversed plate</b></div>
<div class="frame">${plate}<div class="notes"><dl><div class="na"><dt>Slot 07 under the line</dt><dd>Digit ${marks[HOT].digit} · ${describe(marks[HOT].digit)}</dd></div><div><dt>Thinnest structure</dt><dd>${mm(report.minStructuralWidth)} mm</dd></div><div><dt>Narrowest gap</dt><dd>${mm(report.minGap)} mm</dd></div><div><dt>Finest taper tip</dt><dd>${mm(report.minTerminalWidth)} mm</dd></div><div><dt>Ink bounds on a 90 mm canvas</dt><dd>${bounds} mm</dd></div><div><dt>Screen</dt><dd>No structural violations</dd></div></dl></div></div>
<div class="caveat"><b>Original fan encoding, not Heptapod B.</b><span>“QR” is an analogy. Phone scanners cannot read it.</span><b>This artist study has no supported decoder.</b><span>Only the encoded source’s exact SVG geometry reads back as text.</span></div>
<div class="band">${rail}</div>
<div class="key"><span><i style="background:${LINE[0]}"></i>plain</span>${[1, 2, 3, 4].map((c) => `<span><i style="background:${LINE[c]};height:${c % 2 ? 9 : 16}px"></i>${c % 2 ? "small" : "large"} swelling ${c <= 2 ? "out" : "in"} · ${NM[c]}</span>`).join("")}<span><i style="background:var(--bone);box-shadow:5px 0 0 var(--bone);margin-right:5px"></i>doubled: tendril, +5</span></div></div>
<div class="sec"><h2 class="caps">Twelve studies <span>same digits, different hand</span></h2><div class="plates">${studies.map((s, i) => `<div class="p${i === 0 ? " on" : ""}">${artSvg(s.shapes)}<span>${s.seed}</span></div>`).join("")}</div></div>
<div class="sec"><h2 class="caps">Hand-off <span>made in this tab, saved by you</span></h2><div class="files">${FILES.map(([n, t, s], i) => `<div class="f${i === 1 ? " go" : ""}"><b>${n}<i>${t}</i></b><span>${s}</span></div>`).join("")}</div></div>
</div></div>`;
export const glassPlate = page("Glass plate", css, body);
