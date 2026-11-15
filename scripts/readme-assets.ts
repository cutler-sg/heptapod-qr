import assert from "node:assert/strict";
import { mkdir, readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { chromium } from "playwright";

// Presentation uses the committed artwork verbatim; never regenerate codec fixtures here.
const output = resolve("docs/assets");
await mkdir(output, { recursive: true });
const paper = "#f5f3ee";
const ink = "#282a25";
const muted = "#606257";
const line = "#d7d8ce";
const source = "examples/who-is-like-god/variants/seed-46-source.svg";
const artist = "examples/who-is-like-god/variants/seed-46-artist.svg";
const artwork = async (file: string, x: number, y: number, size: number) => {
  const svg = await readFile(file, "utf8");
  const viewBox = svg.match(/viewBox="([^"]+)"/)?.[1];
  assert(viewBox, `Missing viewBox: ${file}`);
  return `<svg x="${x}" y="${y}" width="${size}" height="${size}" viewBox="${viewBox}">${svg.slice(svg.indexOf(">") + 1, svg.lastIndexOf("</svg>"))}</svg>`;
};
const canvas = (height: number, body: string) =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="1600" height="${height}" viewBox="0 0 1600 ${height}"><style>text{fill:${ink};font-family:Arial,Helvetica,sans-serif}.serif{font-family:Georgia,'Times New Roman',serif}.muted{fill:${muted}}</style><rect width="1600" height="${height}" fill="${paper}"/>${body}</svg>`;

const hero = canvas(
  660,
  `<text class="serif" x="72" y="208" font-size="100" letter-spacing="-3">Heptapod QR</text>
  <text class="serif" x="76" y="300" font-size="58" font-style="italic">A name, in ink.</text>
  <path d="M76 352H630" stroke="${line}"/>
  <text x="76" y="408" font-size="28">Text becomes a ring of marks.</text>
  <text x="76" y="450" font-size="28">You choose the hand it takes.</text>
  <text class="muted" x="76" y="568" font-size="22">Offline. Reproducible. Yours to export.</text>
  ${await artwork(source, 890, 30, 620)}`,
);

const studies: string[] = [];
for (let i = 0; i < 12; i++) {
  const seed = 42 + i;
  const x = 48 + (i % 4) * 384;
  const y = 38 + Math.floor(i / 4) * 380;
  studies.push(
    `<rect x="${x}" y="${y}" width="352" height="352" fill="#fff"/>
    ${await artwork(`examples/who-is-like-god/variants/seed-${seed}-source.svg`, x + 18, y + 8, 316)}
    <text x="${x + 18}" y="${y + 329}" font-size="23" class="muted">Seed ${seed}</text>`,
  );
}
const contact = canvas(1178, studies.join(""));
const comparison = canvas(
  920,
  `<rect x="48" y="48" width="736" height="824" fill="#fff"/>
  <rect x="816" y="48" width="736" height="824" fill="#fff"/>
  <text class="serif" x="88" y="122" font-size="46">Encoded source</text>
  <text class="serif" x="856" y="122" font-size="46">Artist study</text>
  ${await artwork(source, 106, 150, 620)}
  ${await artwork(artist, 874, 150, 620)}
  <path d="M88 786H744M856 786H1512" stroke="${line}"/>
  <text x="88" y="830" font-size="25">Original SVG geometry decodes to text.</text>
  <text x="856" y="830" font-size="25">Simplified linework. No supported decoder.</text>`,
);

const browser = await chromium.launch();
try {
  const context = await browser.newContext({
    viewport: { width: 1600, height: 1200 },
    deviceScaleFactor: 1,
    offline: true,
    reducedMotion: "reduce",
  });
  const page = await context.newPage();
  for (const [name, svg] of [
    ["hero", hero],
    ["studies", contact],
    ["source-and-study", comparison],
  ]) {
    await page.setContent(`<html><body style="margin:0">${svg}</body></html>`);
    await page.evaluate(() => document.fonts.ready);
    await page.locator("body > svg").screenshot({ path: resolve(output, `${name}.png`) });
  }
  await page.setViewportSize({ width: 1440, height: 1100 });
  await page.goto(pathToFileURL(resolve("dist/index.html")).href);
  await page.locator(".variant").first().waitFor();
  await page.screenshot({ path: resolve(output, "workbench.png") });
} finally {
  await browser.close();
}
console.log("Rendered four README images from committed artwork and the built workbench.");
