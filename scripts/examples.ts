import { mkdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { chromium } from "playwright";
import { encodedSource } from "../src/codec";
import { comparisonSheet } from "../src/comparison";
import { manifest, printSheet, svgDataUrl } from "../src/exports";
import { analyzeGeometry } from "../src/geometry";
import { DEFAULT_STATE, type State } from "../src/model";
import { withPngDensity } from "../src/png";
import { saveProject } from "../src/project";
import { renderArtwork, shapesSvg } from "../src/render";
import { stablePdfDates } from "./pdf-metadata";

const examples: { slug: string; state: State }[] = [
  { slug: "Michael", state: structuredClone(DEFAULT_STATE) },
  { slug: "michael", state: { ...structuredClone(DEFAULT_STATE), input: "michael" } },
  {
    slug: "who-is-like-god",
    state: { ...structuredClone(DEFAULT_STATE), mode: "meaning", phrase: "Who is like God?" },
  },
  {
    slug: "there-is-no-linear-time",
    state: { ...structuredClone(DEFAULT_STATE), input: "There is no linear time" },
  },
];
await mkdir("examples", { recursive: true });
const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({ offline: true });
try {
  const page = await context.newPage();
  for (const { slug, state } of examples) {
    const dir = `examples/${slug}`;
    await mkdir(`${dir}/variants`, { recursive: true });
    const source = encodedSource(state),
      art = renderArtwork(state),
      report = analyzeGeometry(art.shapes, state.settings);
    if (!source) throw new Error("Expected encoded example");
    const files: Record<string, string> = {
      "encoded-source-v1.svg": source.svg,
      "artist-stencil.svg": art.svg,
      "reversed.svg": shapesSvg(art.shapes, state.settings.diameter, { reversed: true }),
      "MIRRORED-TRANSFER.svg": shapesSvg(art.shapes, state.settings.diameter, { mirrored: true }),
      "project.json": saveProject(state),
      "manifest.json": await manifest(state, report),
      "print-at-100-percent.html": printSheet(state),
    };
    for (const [filename, data] of Object.entries(files))
      await writeFile(`${dir}/${filename}`, data);
    for (let index = 0; index < 12; index++) {
      const variant = { ...state, seed: state.seed + index };
      await writeFile(
        `${dir}/variants/seed-${variant.seed}-source.svg`,
        encodedSource(variant)?.svg ?? "",
      );
      await writeFile(
        `${dir}/variants/seed-${variant.seed}-artist.svg`,
        renderArtwork(variant).svg,
      );
    }
    await page.goto(pathToFileURL(resolve(`${dir}/print-at-100-percent.html`)).href);
    await page.pdf({
      path: `${dir}/print-at-100-percent.pdf`,
      preferCSSPageSize: true,
      printBackground: true,
      scale: 1,
    });
    await writeFile(
      `${dir}/print-at-100-percent.pdf`,
      stablePdfDates(await readFile(`${dir}/print-at-100-percent.pdf`)),
    );
    const uri = svgDataUrl(shapesSvg(art.shapes, state.settings.diameter, { background: "white" }));
    const png = await page.evaluate(
      async ({ uri, pixels }) => {
        const img = new Image();
        img.src = uri;
        await img.decode();
        const canvas = document.createElement("canvas");
        canvas.width = pixels;
        canvas.height = pixels;
        const ctx = canvas.getContext("2d");
        if (!ctx) throw new Error("No canvas context");
        ctx.drawImage(img, 0, 0, pixels, pixels);
        return canvas.toDataURL("image/png").split(",")[1];
      },
      { uri, pixels: Math.round((state.settings.diameter / 25.4) * 600) },
    );
    await writeFile(`${dir}/preview-600dpi.png`, withPngDensity(Buffer.from(png, "base64"), 600));
    console.log(`${slug}: source + artist exports, 12 variants, 600dpi PNG and scale-1 A4 PDF`);
  }
  const comparison = comparisonSheet();
  await writeFile("examples/comparison.html", comparison);
  await page.goto(pathToFileURL(resolve("examples/comparison.html")).href);
  await page.pdf({
    path: "examples/comparison.pdf",
    preferCSSPageSize: true,
    printBackground: true,
  });
  await writeFile(
    "examples/comparison.pdf",
    stablePdfDates(await readFile("examples/comparison.pdf")),
  );
  const decorative = { ...structuredClone(DEFAULT_STATE), mode: "decorative" as const };
  await writeFile("examples/decorative-Michael.svg", renderArtwork(decorative).svg);
  await writeFile("examples/decorative-project.json", saveProject(decorative));
} finally {
  await context.close();
  await browser.close();
}
