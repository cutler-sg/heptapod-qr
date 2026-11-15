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
  studies,
} from "./lib";

const HOT = 7;
const arrow = (deg = 0, size = 30) =>
  `<svg class="arrow" width="${size}" height="${size}" viewBox="0 0 30 30" style="transform:rotate(${deg}deg)" aria-hidden="true"><path d="M3,15h20M14,5l10,10-10,10" fill="none" stroke="currentColor" stroke-width="4.4" stroke-linejoin="miter"/></svg>`;
const picto = (inner: string) => `<span class="picto">${inner}</span>`;
const icons = {
  ring: artSvg(art.shapes),
  text: `<svg viewBox="0 0 30 30"><path d="M6,8h18M15,8v15" stroke="#fff" stroke-width="3.6" fill="none"/></svg>`,
  ruler: `<svg viewBox="0 0 30 30"><path d="M4,19h22M4,19v-6M11.3,19v-4M18.6,19v-6M26,19v-4" stroke="#fff" stroke-width="2.6" fill="none"/></svg>`,
  grid: `<svg viewBox="0 0 30 30"><path d="M6,6h7v7h-7zM17,6h7v7h-7zM6,17h7v7h-7zM17,17h7v7h-7z" fill="#fff"/></svg>`,
  out: `<svg viewBox="0 0 30 30"><path d="M15,5v13M9,13l6,6 6-6M6,24h18" stroke="#fff" stroke-width="3" fill="none"/></svg>`,
  info: `<svg viewBox="0 0 30 30"><path d="M15,13v10" stroke="#111" stroke-width="3.6"/><circle cx="15" cy="8" r="2.2" fill="#111"/></svg>`,
};
const css = `${fonts.overpass}${fonts.overpassMono}
:root{--y:#ffd400;--y-deep:#e3bb00;--k:#0e0e0e;--w:#fff;--floor:#eeeeeb;--line:#cfcfca;--soft:#55554f}
body{background:var(--floor);color:var(--k);font:500 15px/1.4 Overpass,sans-serif;width:1440px}
::selection{background:var(--k);color:var(--y)}
.num{font-family:"Overpass Mono",monospace}
.picto{width:46px;height:46px;background:var(--k);display:grid;place-items:center;flex:none}.picto svg{width:30px;height:30px}.picto .art path{fill:#fff}
.overhead{background:var(--y);border-top:10px solid var(--k);display:flex;align-items:stretch;height:98px;padding:0 32px}
.overhead>div{display:flex;align-items:center;gap:14px;padding-right:30px;margin-right:30px;border-right:3px solid var(--k);margin-block:20px}
.overhead>div:last-child{border:0;margin-left:auto;margin-right:0;padding-right:0}
.name{font-size:30px;font-weight:800;letter-spacing:-.01em;line-height:1}.name small{display:block;font-size:13px;font-weight:600;letter-spacing:0;margin-top:4px}
.way{font-size:20px;font-weight:700;line-height:1.05}.way small{display:block;font-size:13px;font-weight:500}
.here{border-bottom:5px solid var(--k);padding-bottom:3px}
.overhead .ghost{background:none;border:3px solid var(--k);padding:7px 14px;font-weight:700;font-size:15px}
.main{display:grid;grid-template-columns:440px 1fr;gap:0}
.col{padding:30px 32px;border-right:1px solid var(--line)}
h1{font-size:54px;font-weight:800;line-height:.96;letter-spacing:-.022em;margin:0 0 12px;text-wrap:balance}
.lede{font-size:16px;color:var(--soft);margin:0 0 24px;max-width:32ch}
.band{background:var(--w);border:3px solid var(--k);margin-bottom:10px}
.band header{display:flex;align-items:center;gap:12px;background:var(--y);padding:0 14px 0 0;border-bottom:3px solid var(--k)}
.band header b{font-size:19px;font-weight:800}.band header>span:last-child{margin-left:auto;font-size:14px;font-weight:600}
.band .in{padding:14px}
.text{font-size:34px;font-weight:800;line-height:1;display:flex;align-items:center;border-bottom:3px solid var(--k);padding-bottom:8px}.text i{width:3px;height:32px;background:var(--k);margin-left:3px}.text small{margin-left:auto;font-size:12px;font-weight:600;color:var(--soft)}
.radio{display:flex;gap:10px;align-items:center;padding:8px 0 0;font-size:15px}.radio i{width:16px;height:16px;border:3px solid var(--k);border-radius:50%;flex:none}.radio.on{font-weight:800}.radio.on i{background:var(--k);box-shadow:inset 0 0 0 2.5px #fff}
.set{display:grid;grid-template-columns:1fr auto;gap:5px 10px;padding:6px 0;align-items:center}.set b{font-size:20px;font-weight:800}.set div{grid-column:1/-1;height:10px;background:var(--line);position:relative}.set div::before{content:"";position:absolute;inset:0 auto 0 0;width:var(--v);background:var(--k)}
.band.next header{background:var(--w)}.band.next{border-color:var(--k)}
.go{padding:28px 32px 0}
.gate{display:grid;grid-template-columns:230px 1fr;gap:26px;align-items:stretch}
.gateno{background:var(--y);border:3px solid var(--k);padding:14px 16px;display:flex;flex-direction:column}
.gateno span{font-size:18px;font-weight:700}.gateno b{font-size:176px;font-weight:900;line-height:.8;letter-spacing:-.05em;margin:18px 0 auto -6px}
.gateno .nav{display:flex;justify-content:space-between;align-items:center;font-size:17px;font-weight:700;border-top:3px solid var(--k);padding-top:10px;margin-top:14px}.gateno .nav span{display:flex;gap:8px;align-items:center;font-size:17px}
.gateno p{margin:10px 0 0;font-size:13px;font-weight:600;line-height:1.3}
.panel{background:var(--w);border:3px solid var(--k);position:relative}
.tabs{display:flex;border-bottom:3px solid var(--k)}.tabs span{padding:9px 16px;font-size:15px;font-weight:700;border-right:3px solid var(--k)}.tabs .on{background:var(--k);color:#fff}.tabs .r{margin-left:auto;border:0;font-weight:500;color:var(--soft)}
.panel .art{width:66%;height:auto;margin:0 auto}.panel .art path{fill:var(--k)}
.dims{position:absolute;left:16px;bottom:14px;font-size:13px;font-weight:600}.dims b{display:block;font-size:22px;font-weight:800}
.notice{background:var(--k);color:#fff;display:grid;grid-template-columns:auto 1fr 1fr;gap:0 22px;padding:14px 18px;margin-top:10px;align-items:center}
.notice .picto{background:var(--y)}.notice p{margin:0;font-size:14.5px;font-weight:600;line-height:1.3}.notice p span{display:block;font-weight:400;color:#c9c9c4}
.board{margin-top:26px}h2{font-size:22px;font-weight:800;margin:0 0 12px;display:flex;align-items:center;gap:12px}h2 small{font-size:14px;font-weight:500;color:var(--soft);margin-left:auto}
.flaps{background:var(--k);padding:12px;display:grid;grid-template-columns:repeat(22,1fr);gap:4px}
.flap{background:#222;text-align:center;padding:5px 0 6px;position:relative}.flap::after{content:"";position:absolute;left:0;right:0;top:50%;height:1px;background:#000}
.flap rect,.flap path{fill:#fff}.flap svg{margin:auto}.flap b{display:block;font:700 22px/1 "Overpass Mono";color:#fff;margin-top:3px}.flap small{font:500 9.5px "Overpass Mono";color:#8a8a84}
.flap.hot{background:var(--y)}.flap.hot rect,.flap.hot path{fill:var(--k)}.flap.hot b{color:var(--k)}.flap.hot small{color:#5c4d00}
.flapkey{font-size:14px;color:var(--soft);margin:10px 0 0}.flapkey b{color:var(--k)}
.wide{padding:30px 32px 0}
.gates{display:grid;grid-template-columns:repeat(12,1fr);gap:8px}.g{background:var(--w);border:3px solid var(--k)}.g .art{width:100%;height:auto;padding:5px}.g .art path{fill:var(--k)}
.g b{display:block;border-top:3px solid var(--k);font:800 24px/1 "Overpass Mono";padding:6px 8px 5px}.g.on b{background:var(--y)}.g.on{box-shadow:0 0 0 4px var(--y)}
.duo{display:grid;grid-template-columns:440px 1fr;gap:32px;padding:30px 32px 44px}
.tab{background:var(--w);border:3px solid var(--k)}.tab div{display:flex;justify-content:space-between;align-items:baseline;padding:9px 14px;border-bottom:1px solid var(--line);font-size:15px}.tab div b{font:700 17px "Overpass Mono"}
.tab p{margin:0;padding:11px 14px;font-size:13.5px;color:var(--soft)}.tab p b{display:block;color:var(--k);font-size:17px;font-weight:800}
.files{display:grid;grid-template-columns:1fr 1fr;gap:8px}.f{background:var(--w);border:3px solid var(--k);padding:9px 12px;display:grid;grid-template-columns:auto 1fr auto;gap:0 12px;align-items:center}
.f b{font-size:17px;font-weight:800;line-height:1.15}.f span{display:block;font-size:12.5px;font-weight:500;color:var(--soft)}.f i{font:700 12px "Overpass Mono";font-style:normal}
.f.go{background:var(--y)}.f.go span{color:#3d3300}.f .arrow{width:22px;height:22px}
`;
const set = (label: string, value: string, pct: number) =>
  `<div class="set"><span>${label}</span><b class="num">${value}</b><div style="--v:${pct}%"></div></div>`;
const body = `<div class="overhead"><div>${picto(icons.ring)}<span class="name">Heptapod QR<small>Alien QR codes for humans</small></span></div>
<div><span class="way here">Words<small>You are here</small></span></div><div>${arrow(0)}<span class="way">Form<small>size and line limits</small></span></div><div>${arrow(0)}<span class="way">Studies<small>12 ahead</small></span></div><div>${arrow(90)}<span class="way">Hand-off<small>8 files</small></span></div>
<div><span style="font-size:13px;font-weight:600;line-height:1.25;text-align:right">Runs from this file.<br>Nothing is transmitted.</span><button class="ghost">Open</button><button class="ghost">Save</button></div></div>
<div class="main"><div class="col"><h1>Make your own alien QR code.</h1><p class="lede">Type a name. Follow the signs to a ring of ink your tattoo artist can work from.</p>
<div class="band"><header>${picto(icons.text)}<b>Words</b><span>1 of 4</span></header><div class="in"><div class="text">Michael<i></i><small>7 of 128 bytes</small></div>
<div class="radio on"><i></i>Exact spelling, case kept</div><div class="radio"><i></i>A phrase you choose</div><div class="radio"><i></i>Decoration only, no text</div></div></div>
<div class="band"><header>${picto(icons.ruler)}<b>Form</b><span>2 of 4</span></header><div class="in">${set("Canvas width", "90 mm", 40)}${set("Thinnest line", "0.8 mm", 21)}${set("Narrowest gap", "0.8 mm", 16)}</div></div>
</div>
<div class="go"><div class="gate"><div class="gateno"><span>Study</span><b class="num">42</b><p>First of twelve.<br>Same digits, different hand.</p><div class="nav"><span style="color:#8a7400">${arrow(180, 22)}41</span><span>43${arrow(0, 22)}</span></div></div>
<div class="panel"><div class="tabs"><span class="on">Artist study</span><span>Encoded source</span><span>Side by side</span><span class="r">Transparent off</span></div>${artSvg(art.shapes)}<div class="dims">Canvas<b class="num">90 × 90 mm</b>ink ${bounds} mm</div></div></div>
<div class="notice">${picto(icons.info)}<p>Original fan encoding. Not Heptapod B.<span>“QR” is an analogy. Phone scanners cannot read it.</span></p><p>This artist study has no decoder.<span>Only the encoded source’s exact SVG geometry reads back.</span></p></div>
<div class="board"><h2>Read-out<small>22 marks, clockwise from the gap</small></h2><div class="flaps">${marks.map((m) => `<div class="flap${m.order === HOT ? " hot" : ""}">${slotGlyph(m.digit, 24, 34)}<b>${m.digit}</b><small>${String(m.order + 1).padStart(2, "0")}</small></div>`).join("")}</div>
<p class="flapkey"><b>Bump</b> out or in, small or large: a digit 0 to 4. <b>Tendril</b>: add 5. One number carries the text and its checksum.</p></div></div></div>
<div class="wide"><h2>${picto(icons.grid)}Studies 42–53<small>choose one to put it on the panel</small></h2><div class="gates">${studies.map((s, i) => `<div class="g${i === 0 ? " on" : ""}">${artSvg(s.shapes)}<b>${s.seed}</b></div>`).join("")}</div></div>
<div class="duo"><div><h2>${picto(icons.ruler)}At 90 mm</h2><div class="tab"><div>Thinnest structure<b>${mm(report.minStructuralWidth)} mm</b></div><div>Narrowest gap<b>${mm(report.minGap)} mm</b></div><div>Finest taper tip<b>${mm(report.minTerminalWidth)} mm</b></div><p><b>Nothing below your limits.</b>A geometry check, not a promise about healing. Your artist decides.</p></div></div>
<div><h2>${picto(icons.out)}Hand-off<small>made in this tab, saved by you</small></h2><div class="files">${FILES.map(([n, t, s], i) => `<div class="f${i === 1 ? " go" : ""}">${arrow(90, 22)}<b>${n}<span>${s}</span></b><i>${t}</i></div>`).join("")}</div></div></div>`;
export const terminalYellow = page("Terminal yellow", css, body);
