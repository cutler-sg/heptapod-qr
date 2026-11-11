import assert from "node:assert/strict";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { chromium, type Page } from "playwright";
import { encodedSource } from "../src/codec";
import { printSheet } from "../src/exports";
import { DEFAULT_STATE } from "../src/model";

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({
  viewport: { width: 1440, height: 1100 },
  offline: true,
  acceptDownloads: true,
});
const requests: string[] = [];
const errors: string[] = [];
context.on("request", (request) => {
  if (/^https?:/.test(request.url())) requests.push(request.url());
});
const page = await context.newPage();
page.on("pageerror", (error) => errors.push(error.message));
const checks: string[] = [];
const checked = (name: string) => {
  checks.push(name);
  console.log(`PASS ${name}`);
};
async function download(selector: string) {
  const pending = page.waitForEvent("download");
  await page.locator(selector).click();
  const file = await pending;
  const path = await file.path();
  assert(path);
  return { name: file.suggestedFilename(), data: await readFile(path) };
}
async function ready(p: Page) {
  await p.locator(".variant").last().waitFor();
  assert.equal(await p.locator(".variant").count(), 12);
}
try {
  await mkdir("evidence/screenshots", { recursive: true });
  await page.goto(pathToFileURL(resolve(process.argv[2] ?? "dist/index.html")).href);
  await ready(page);
  assert((await page.title()).startsWith("Heptapod QR"));
  assert((await page.locator(".caveat").textContent())?.includes("QR scanners"));
  assert.equal(await page.locator("#input").inputValue(), "Michael");
  assert.equal(await page.locator("#payload").textContent(), '"Michael"');
  assert(await page.locator(".caveat").isVisible());
  assert(
    await page
      .locator("#tattoo-preview")
      .evaluate((img) => img instanceof HTMLImageElement && img.complete && img.naturalWidth > 0),
  );
  checked("standalone file boots offline with Michael, 12 variants and adjacent caveat");
  await page.screenshot({ path: "evidence/screenshots/desktop.png", fullPage: true });
  await page.locator('[aria-label="Select variant seed 47"]').click();
  const project = await download("#save-project");
  const parsed = JSON.parse(project.data.toString());
  assert.equal(parsed.state.seed, 47);
  const stencil = await download("#export-stencil");
  assert(stencil.data.toString().includes('width="90mm"'));
  await page.locator("#reset").click();
  await page
    .locator("#load-project")
    .setInputFiles({ name: "project.json", mimeType: "application/json", buffer: project.data });
  await ready(page);
  const restored = await download("#export-stencil");
  assert(stencil.data.equals(restored.data));
  checked("selected variant project download/import reproduces exact stencil bytes");
  await page.locator("#mode").selectOption("meaning");
  assert(await page.locator("#error").isVisible());
  assert(await page.locator("#export-stencil").isDisabled());
  await page.locator("#use-etymology").click();
  await ready(page);
  assert.equal(await page.locator("#input").inputValue(), "Michael");
  assert.equal(await page.locator("#payload").textContent(), '"Who is like God?"');
  await page.locator("#undo").click();
  assert(await page.locator("#error").isVisible());
  await page.locator("#reset").click();
  await ready(page);
  checked(
    "meaning phrase requires explicit choice; invalid state disables exports; undo/reset work",
  );
  await page.locator("#input").fill("michael");
  await page.locator("#input").blur();
  await ready(page);
  assert.equal(await page.locator("#payload").textContent(), '"michael"');
  const lower = await download("#export-source");
  assert(!lower.data.equals(Buffer.from(encodedSource(DEFAULT_STATE)?.svg ?? "")));
  await page.locator("#reset").click();
  await ready(page);
  checked("case is preserved in editor and exported geometry");
  await page.locator("#view-compare").click();
  assert(await page.locator("#source-figure").isVisible());
  assert(await page.locator("#tattoo-figure").isVisible());
  await page.locator("#transparent").check();
  assert((await page.locator("#stage").getAttribute("class"))?.includes("checker"));
  await page.locator("#view-source").click();
  assert((await page.locator("#measurements").textContent())?.startsWith("Source:"));
  checked("source/artist comparison, transparent preview and separate physical reports");
  await page.locator("#view-tattoo").click();
  for (const [id, value] of [
    ["diameter", "110"],
    ["minWidth", "1"],
    ["minGap", "1"],
    ["rotation", "25"],
    ["margin", "6"],
  ]) {
    await page.locator(`#${id}`).fill(value);
    await page.locator(`#${id}`).dispatchEvent("change");
    await ready(page);
  }
  const controlled = await download("#export-stencil");
  assert(controlled.data.toString().includes('width="110mm"'));
  await page.locator("#reset").click();
  await ready(page);
  checked("physical controls change final SVG millimetres");
  const source = await download("#export-source");
  const reverse = await download("#export-reversed");
  const transfer = await download("#export-transfer");
  assert(reverse.data.toString().includes('<g fill="#fff">'));
  for (const svg of [source.data, reverse.data, transfer.data, stencil.data]) {
    assert(
      await page.evaluate(
        (markup) =>
          new DOMParser().parseFromString(markup, "image/svg+xml").querySelector("parsererror") ===
          null,
        svg.toString(),
      ),
    );
  }
  assert(transfer.name.includes("MIRRORED"));
  assert(!transfer.data.equals(stencil.data));
  const png = await download("#export-png");
  assert.equal(png.data.subarray(1, 4).toString(), "PNG");
  assert.equal(png.data.readUInt32BE(16), 2126);
  assert.equal(png.data.readUInt32BE(20), 2126);
  const densityOffset = png.data.indexOf(Buffer.from("pHYs"));
  assert(densityOffset > 0);
  assert.equal(png.data.readUInt32BE(densityOffset + 4), 23622);
  assert.equal(png.data.readUInt32BE(densityOffset + 8), 23622);
  assert.equal(png.data[densityOffset + 12], 1);
  await writeFile("evidence/michael-preview.png", png.data);
  const provenance = JSON.parse((await download("#export-manifest")).data.toString());
  assert.equal(provenance.ir.normalizedInput, "Michael");
  const print = await download("#export-print");
  assert(print.data.toString().includes("100% / Actual size"));
  const comparison = await download("#export-comparison");
  assert(comparison.data.toString().includes("non-reversible"));
  checked("SVG/source/reverse/transfer, 2126px PNG, manifest, comparison and print downloads");
  await page.locator(".explanation summary").click();
  await page
    .locator("#decode-svg")
    .setInputFiles({ name: "source.svg", mimeType: "image/svg+xml", buffer: source.data });
  await page.waitForFunction(() =>
    document.getElementById("decode-result")?.textContent?.includes('"Michael"'),
  );
  await page.locator("#decode-svg").setInputFiles({
    name: "evil.svg",
    mimeType: "image/svg+xml",
    buffer: Buffer.from("<svg><script>window.__injected=true</script></svg>"),
  });
  await page.waitForFunction(
    () => !document.getElementById("decode-result")?.textContent?.includes("Geometry-decoded"),
  );
  assert.equal(await page.evaluate(() => Reflect.get(window, "__injected")), undefined);
  await page.locator("#load-project").setInputFiles({
    name: "evil.json",
    mimeType: "application/json",
    buffer: Buffer.from('{"__proto__":{"polluted":true}}'),
  });
  assert(await page.locator("#error").isVisible());
  assert.equal(await page.evaluate(() => Reflect.get(Object.prototype, "polluted")), undefined);
  checked("source import decodes geometry and hostile SVG/JSON cannot execute or pollute");
  await page.locator("#mode").selectOption("decorative");
  await ready(page);
  assert(await page.locator("#export-source").isDisabled());
  assert((await page.locator("#tattoo-caption").textContent())?.includes("non-reversible"));
  await page.locator("#reset").click();
  await ready(page);
  await page.locator(".explanation summary").click();
  await page.locator("#transparent").uncheck();
  checked("decorative mode disables source and exposes non-reversible status");
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({ path: "evidence/screenshots/mobile.png", fullPage: true });
  assert(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth));
  checked("390px mobile layout has no horizontal overflow");
  const printPath = resolve("evidence/test-print-sheet.html");
  await writeFile(printPath, printSheet(DEFAULT_STATE));
  const printPage = await context.newPage();
  await printPage.goto(pathToFileURL(printPath).href);
  await printPage.emulateMedia({ media: "print" });
  const printDimensions = await printPage.evaluate(() => ({
    art: document.querySelector(".art")?.getBoundingClientRect().width,
    bar: document.querySelector(".bar")?.getBoundingClientRect().width,
  }));
  assert(Math.abs((printDimensions.art ?? 0) - (90 * 96) / 25.4) < 0.1);
  assert(Math.abs((printDimensions.bar ?? 0) - (50 * 96) / 25.4) < 0.1);
  await printPage.pdf({
    path: "evidence/michael-true-scale.pdf",
    preferCSSPageSize: true,
    printBackground: true,
    scale: 1,
  });
  await printPage.close();
  checked("print CSS measures 90mm artwork and 50mm scale bar; A4 PDF generated at scale 1");
  assert.deepEqual(requests, []);
  assert.deepEqual(errors, []);
  assert.equal(await page.evaluate(() => localStorage.length), 0);
  checked("zero HTTP(S) requests, zero page errors, zero persistent local storage");
  await writeFile(
    "evidence/browser-tests.json",
    `${JSON.stringify(
      { checks, externalRequests: requests, pageErrors: errors, printDimensions },
      null,
      2,
    )}\n`,
  );
} finally {
  await context.close();
  await browser.close();
}
