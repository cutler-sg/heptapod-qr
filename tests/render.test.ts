import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { encodedSource } from "../src/codec";
import { comparisonSheet } from "../src/comparison";
import { manifest, printSheet, sha256 } from "../src/exports";
import { analyzeGeometry } from "../src/geometry";
import { DEFAULT_STATE, type State } from "../src/model";
import { renderArtwork, shapesSvg } from "../src/render";
import { decode } from "../vendor/heptapod-ink/core.js";

describe("artist derivative contract", () => {
  test("deterministic 12 seeds retain every mandatory mark; never claimed v1", () => {
    for (let i = 0; i < 12; i++) {
      const state = { ...structuredClone(DEFAULT_STATE), seed: 42 + i };
      const art = renderArtwork(state);
      expect(art.svg).toBe(renderArtwork(state).svg);
      expect(art.shapes.filter((s) => s.kind === "data-tendril").length).toBe(
        art.ir.marks.filter((m) => m.tendril).length,
      );
      expect(() => decode(art.svg)).toThrow();
      expect(art.svg).not.toMatch(/<image|<filter|<metadata|<text|transform=|opacity=/);
      expect(art.svg).toContain('width="90mm" height="90mm" viewBox="0 0 90 90"');
      const report = analyzeGeometry(art.shapes, state.settings);
      expect(report.issues.filter((v) => v.kind === "clipping")).toEqual([]);
    }
  });
  test("mark classes persist under physical settings and decoration reduction", () => {
    const base = renderArtwork(DEFAULT_STATE);
    for (const settings of [
      { ...DEFAULT_STATE.settings, reduction: 1, tendrilCount: 0, density: 0, taper: 0 },
      { ...DEFAULT_STATE.settings, diameter: 150, rotation: 120, spatter: true, tendrilLength: 5 },
    ]) {
      const art = renderArtwork({ ...DEFAULT_STATE, settings });
      expect(art.ir.marks).toEqual(base.ir.marks);
      expect(art.shapes.filter((s) => s.kind === "data-tendril").length).toBe(
        base.shapes.filter((s) => s.kind === "data-tendril").length,
      );
    }
  });
  test("bad dimensions produce warnings without dropping encoded marks", () => {
    const state = {
      ...DEFAULT_STATE,
      input: "There is no linear time",
      settings: {
        ...DEFAULT_STATE.settings,
        diameter: 30,
        margin: 2,
        tendrilLength: 24,
        minWidth: 2,
        minGap: 3,
      },
    };
    const art = renderArtwork(state),
      report = analyzeGeometry(art.shapes, state.settings);
    expect(report.issues.some((i) => i.kind === "clipping")).toBe(true);
    expect(report.issues.some((i) => i.kind === "collision" || i.kind === "gap")).toBe(true);
    expect(art.shapes.filter((s) => s.kind === "data-tendril").length).toBe(
      art.ir.marks.filter((m) => m.tendril).length,
    );
  });
  test("decorative mode is deterministic and has no encoded source or checksum", () => {
    const state: State = { ...DEFAULT_STATE, mode: "decorative" };
    const art = renderArtwork(state);
    expect(art.svg).toBe(renderArtwork(state).svg);
    expect(art.ir.checksum).toBeNull();
    expect(art.ir.codecVersion).toBe("non-reversible-style-hash/1");
    expect(encodedSource(state)).toBeNull();
    expect(art.svg).not.toBe(renderArtwork({ ...state, input: "michael" }).svg);
  });
  test("mirroring explicitly reflects coordinates and reversal swaps ink/background", () => {
    const art = renderArtwork(DEFAULT_STATE);
    const transfer = shapesSvg(art.shapes, 90, { mirrored: true });
    const first = art.shapes[0].points[0];
    expect(transfer).toContain(`M${(90 - first[0]).toFixed(4)},${first[1].toFixed(4)}`);
    expect(transfer).not.toBe(art.svg);
    expect(art.svg).toBe(renderArtwork(DEFAULT_STATE).svg);
    const reverse = shapesSvg(art.shapes, 90, { reversed: true });
    expect(reverse).toContain('<path fill="#000"');
    expect(reverse).toContain('<g fill="#fff">');
  });
  test("manifest hashes exact files without timestamps and print sheet uses mm", async () => {
    const art = renderArtwork(DEFAULT_STATE);
    const json = JSON.parse(await manifest(DEFAULT_STATE));
    expect(json.contentHashes.stencil).toBe(await sha256(art.svg));
    expect(json.contentHashes.source).toBe(await sha256(encodedSource(DEFAULT_STATE)?.svg ?? ""));
    expect(await manifest(DEFAULT_STATE)).toBe(await manifest(DEFAULT_STATE));
    expect(json.timestamp).toBeUndefined();
    expect(json.ir.originalInput).toBe("Michael");
    const sheet = printSheet(DEFAULT_STATE);
    expect(sheet).toContain("width:90mm;height:90mm");
    expect(sheet).toContain("width:50mm");
    expect(sheet).toContain("100% / Actual size");
    expect(sheet).toContain("size:A4");
    expect(sheet).not.toContain("Michael");
    expect(printSheet(DEFAULT_STATE, { mirrored: true })).toContain("MIRRORED TRANSFER");
  });
  test("comparison contains all three modes and escapes user text", () => {
    const sheet = comparisonSheet({ ...DEFAULT_STATE, input: '<script>alert("x")</script>' });
    expect(sheet).toContain("Chosen meaning");
    expect(sheet).toContain("Exact spelling");
    expect(sheet).toContain("non-reversible");
    expect(sheet).not.toContain("<script>alert");
    expect(sheet).toContain("&lt;script&gt;");
  });
  test("committed golden SVG bytes do not drift", () => {
    const golden = JSON.parse(readFileSync("fixtures/golden.json", "utf8")) as {
      state: State;
      source: string | null;
      stencil: string;
    }[];
    for (const item of golden) {
      expect(encodedSource(item.state)?.svg ?? null).toBe(item.source);
      expect(renderArtwork(item.state).svg).toBe(item.stencil);
    }
  });
});
