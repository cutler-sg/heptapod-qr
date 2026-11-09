import assert from "node:assert/strict";
import { writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { chromium } from "playwright";

const browser = await chromium.launch({ headless: true });
try {
  const context = await browser.newContext({
    offline: true,
    viewport: { width: 728, height: 1000 },
  });
  const page = await context.newPage();
  const errors: string[] = [],
    requests: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("request", (request) => {
    if (/^https?:/.test(request.url())) requests.push(request.url());
  });
  await page.goto(pathToFileURL(resolve("examples/showcase.html")).href);
  await page.waitForFunction(() =>
    [...document.images].every((img) => img.complete && img.naturalWidth > 0),
  );
  assert.equal(await page.locator(".study").count(), 49);
  await page.locator("#collection").selectOption("who-is-like-god");
  assert.equal(await page.locator(".study:visible").count(), 12);
  await page.locator("#view").selectOption("both");
  await page
    .getByRole("button", { name: "Enlarge Who is like God?, seed 53", exact: true })
    .click();
  assert((await page.locator("#selected-seed").textContent())?.includes("53"));
  await page.locator("#collection").selectOption("decorative");
  await page.locator(".study:visible").click();
  assert.equal(await page.locator("#featured-source-figure").isVisible(), false);
  await page.locator("#collection").selectOption("all");
  await page.setViewportSize({ width: 390, height: 844 });
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
  assert.deepEqual(errors, []);
  assert.deepEqual(requests, []);
  const result = {
    studies: 49,
    images: await page.locator("img").count(),
    loadedImages: true,
    filters: true,
    selection: true,
    decorativeStatus: true,
    mobileOverflow: false,
    externalRequests: requests,
    pageErrors: errors,
  };
  await writeFile("evidence/showcase-checks.json", `${JSON.stringify(result, null, 2)}\n`);
  console.log(result);
  await context.close();
} finally {
  await browser.close();
}
