import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { chromium } from "playwright";

const out = resolve(import.meta.dir, "out");
await mkdir(out, { recursive: true });
const only = process.argv[2];
const mocks: Record<string, () => Promise<string>> = {
  "a-press-proof": async () => (await import("./a-press-proof")).pressProof,
  "b-stencil-transfer": async () => (await import("./b-stencil-transfer")).stencilTransfer,
  "c-glass-plate": async () => (await import("./c-glass-plate")).glassPlate,
  "d-terminal-yellow": async () => (await import("./d-terminal-yellow")).terminalYellow,
};
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2 });
for (const [name, load] of Object.entries(mocks)) {
  if (only && !name.startsWith(only)) continue;
  const file = resolve(out, `${name}.html`);
  await writeFile(file, await load());
  await page.goto(pathToFileURL(file).href);
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({ path: resolve(out, `${name}.png`), fullPage: true });
  await page.screenshot({ path: resolve(out, `${name}-fold.png`) });
  console.log(name, await page.evaluate(() => document.documentElement.scrollHeight), await page.evaluate(() => [...document.fonts].map((f) => `${f.family}:${f.status}`).join(" ")));
}
await browser.close();
