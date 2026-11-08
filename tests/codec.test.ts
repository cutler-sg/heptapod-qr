import { describe, expect, test } from "bun:test";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { gunzipSync } from "node:zlib";
import { createIR, encodedSource } from "../src/codec";
import { decodeSourceSvg } from "../src/import-svg";
import { DEFAULT_STATE, normalizedText, validateState, variantSeed } from "../src/model";
import { loadProject, saveProject } from "../src/project";
import { renderArtwork } from "../src/render";
import { decode, encode, LogogramError } from "../vendor/heptapod-ink/core.js";
import { slotsToText, textToSlots } from "../vendor/heptapod-ink/packing.js";
import { renderSlots } from "../vendor/heptapod-ink/render.js";

const stateFor = (input: string) => ({ ...structuredClone(DEFAULT_STATE), input });
describe("audited v1 interface", () => {
  test("exact Michael, case, Unicode, punctuation and whitespace round trips", () => {
    for (const text of [
      "Michael",
      "michael",
      "Who is like God?",
      "There is no linear time",
      "日本語 🙂",
      "e\u0301",
      "é",
      "  Michael \n\t",
      " ",
      ".,?!:;-'\"<>&",
    ]) {
      const state = stateFor(text),
        source = encodedSource(state);
      expect(source).not.toBeNull();
      expect(decodeSourceSvg(source?.svg ?? "").text).toBe(text);
      expect(slotsToText(textToSlots(text).slots).text).toBe(text);
      expect(decode(renderSlots(textToSlots(text).slots, 42).svg).text).toBe(text);
    }
    expect(encodedSource(stateFor("Michael"))?.svg).not.toBe(
      encodedSource(stateFor("michael"))?.svg,
    );
    expect(textToSlots("Michael").compact).toBe(false);
    expect(textToSlots("michael").compact).toBe(true);
  });
  test("all twelve source variants preserve payload and mark classes", () => {
    for (const text of ["Michael", "michael", "Who is like God?", "There is no linear time"]) {
      const marks = createIR(stateFor(text)).marks;
      const drawings = new Set<string>();
      for (let i = 0; i < 12; i++) {
        const state = { ...stateFor(text), seed: variantSeed(42, i) };
        const svg = encodedSource(state)?.svg ?? "";
        expect(decodeSourceSvg(svg).text).toBe(text);
        expect(createIR(state).marks).toEqual(marks);
        expect(svg).not.toContain("metadata");
        expect(svg).not.toContain(text);
        drawings.add(svg);
      }
      expect(drawings.size).toBe(12);
    }
  });
  test("physical width, symmetric padding and baked rotations preserve path decoding", () => {
    for (const diameter of [30, 90, 180])
      for (const rotation of [-180, -37, 0, 91, 180]) {
        const state = {
          ...stateFor("Michael"),
          settings: { ...DEFAULT_STATE.settings, diameter, rotation },
        };
        const source = encodedSource(state);
        expect(source?.svg).toContain(`width="${diameter}mm" height="${diameter}mm"`);
        expect(source?.svg).not.toContain("transform=");
        expect(decodeSourceSvg(source?.svg ?? "").text).toBe("Michael");
        const coordinates = source?.shapes.flatMap((s) => s.points).flat() ?? [];
        expect(Math.min(...coordinates)).toBeGreaterThanOrEqual(state.settings.margin - 0.001);
        expect(Math.max(...coordinates)).toBeLessThanOrEqual(
          diameter - state.settings.margin + 0.001,
        );
      }
  });
  test("checksum detects corruption and legacy v2 fails explicitly", () => {
    const raw = encode("Michael", { ink: false }).svg;
    const damaged = raw.replace(
      / d="([^"]+)"/,
      (_all, d: string) =>
        ` d="${d.replace(/(-?[\d.]+),(-?[\d.]+)/g, (_pair, x: string, y: string) => `${Number(x) * 0.5},${Number(y) * 0.5}`)}"`,
    );
    expect(() => decodeSourceSvg(damaged)).toThrow(LogogramError);
    const fixture = readFileSync("fixtures/legacy-v2.svg", "utf8");
    expect(() => decode(fixture)).toThrow(LogogramError);
    expect(() =>
      decodeSourceSvg(
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 10"><path d="M1,1 L2,2 L3,1 Z"/></svg>',
      ),
    ).toThrow();
  });
  test("stripping optional plaintext metadata does not affect core decoding", () => {
    const svg = encode("Michael", { ink: false }).svg;
    const withMetadata = svg.replace("</svg>", "<metadata>NOT THE PAYLOAD</metadata></svg>");
    expect(decode(withMetadata).text).toBe("Michael");
    expect(decode(withMetadata.replace(/<metadata>.*<\/metadata>/, "")).text).toBe("Michael");
  });
  test("committed upstream hash corpus still matches unmodified encoder", () => {
    const entries = gunzipSync(readFileSync("fixtures/upstream-entries.jsonl.gz"))
      .toString()
      .trim()
      .split("\n")
      .map((line) => JSON.parse(line) as { text: string; sha256: string | null });
    for (const entry of entries) {
      if (entry.sha256 === null) {
        expect(() => encode(entry.text)).toThrow();
        continue;
      }
      const svg = encode(entry.text).svg;
      expect(createHash("sha256").update(svg).digest("hex")).toBe(entry.sha256);
      expect(decode(svg).text).toBe(entry.text);
    }
    expect(entries.length).toBeGreaterThan(2000);
  }, 60000);
});
describe("input and project boundaries", () => {
  test("normalization is explicit, case and whitespace never change", () => {
    const raw = stateFor("  e\u0301 MICHAEL\n");
    expect(normalizedText(raw)).toBe(raw.input);
    expect(normalizedText({ ...raw, normalization: "NFC" })).toBe("  é MICHAEL\n");
    const meaning = { ...raw, mode: "meaning" as const, phrase: "Who is like God?" };
    const ir = createIR(meaning);
    expect(ir.originalInput).toBe(raw.input);
    expect(ir.normalizedInput).toBe(meaning.phrase);
    expect(() => createIR({ ...meaning, phrase: "" })).toThrow("Empty");
  });
  test("empty, malformed Unicode, excessive byte length and invalid controls reject", () => {
    for (const text of ["", "\ud800", "a".repeat(129), "🙂".repeat(33)])
      expect(() => validateState(stateFor(text))).toThrow();
    expect(normalizedText(stateFor("a".repeat(128))).length).toBe(128);
    expect(() => validateState({ ...DEFAULT_STATE, seed: -1 })).toThrow();
    expect(() =>
      validateState({ ...DEFAULT_STATE, settings: { ...DEFAULT_STATE.settings, diameter: 20 } }),
    ).toThrow();
    expect(() => validateState({ ...DEFAULT_STATE, input: 123 })).toThrow();
  });
  test("project JSON reproduces byte-identical source and derivative", () => {
    const state = {
      ...stateFor("Michael"),
      seed: 53,
      settings: { ...DEFAULT_STATE.settings, rotation: 43, spatter: true },
    };
    const restored = loadProject(saveProject(state));
    expect(encodedSource(restored)?.svg).toBe(encodedSource(state)?.svg);
    expect(renderArtwork(restored).svg).toBe(renderArtwork(state).svg);
    expect(saveProject(restored)).toBe(saveProject(state));
    expect(() =>
      loadProject(saveProject(state).replace("atelier-ir/1", "atelier-ir/99")),
    ).toThrow();
    const damaged = JSON.parse(saveProject(state));
    damaged.ir.marks[0].digit = 77;
    expect(() => loadProject(JSON.stringify(damaged))).toThrow();
    expect(() => loadProject('{"__proto__":{"polluted":true}}')).toThrow();
    expect(() => loadProject(" ".repeat(100001))).toThrow();
  });
  test("hostile SVGs and ignored presentation tricks fail before decoding", () => {
    const svg = encodedSource(DEFAULT_STATE)?.svg ?? "";
    for (const insert of [
      "<script>alert(1)</script>",
      "<foreignObject/>",
      '<image href="https://example.com/x"/>',
      '<use href="#x"/>',
      '<g transform="scale(0)"></g>',
      "<style>path{display:none}</style>",
    ]) {
      expect(() => decodeSourceSvg(svg.replace("</svg>", `${insert}</svg>`))).toThrow();
    }
    for (const candidate of [
      svg.replace('<g fill="#000">', '<g fill="#000" onload="alert(1)">'),
      svg.replace("</svg>", ""),
      svg + svg,
      "<svg",
      "x".repeat(1000001),
    ])
      expect(() => decodeSourceSvg(candidate)).toThrow();
    expect(() => decodeSourceSvg(svg.replace('<g fill="#000">', '<g fill="#fff">'))).toThrow();
  });
});
