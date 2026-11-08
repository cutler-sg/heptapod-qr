import { type EncodedSource, encodedSource } from "./codec";
import { comparisonSheet } from "./comparison";
import { exportPng, manifest, printSheet, saveFile, svgDataUrl } from "./exports";
import { analyzeGeometry } from "./geometry";
import type { GeometryReport } from "./geometry-types";
import { decodeSourceSvg } from "./import-svg";
import {
  CODEC_VERSION,
  DEFAULT_STATE,
  normalizedText,
  type Settings,
  type State,
  selectedText,
  UPSTREAM_COMMIT,
  validateState,
  variantSeed,
} from "./model";
import { loadProject, saveProject } from "./project";
import { type Artwork, renderArtwork, shapesSvg } from "./render";

const element = <T extends HTMLElement>(id: string): T => {
  const found = document.getElementById(id);
  if (!found) throw new Error(`Missing interface element: ${id}`);
  return found as T;
};
let state: State = structuredClone(DEFAULT_STATE);
let selection = 0;
let view: "tattoo" | "source" | "compare" = "tattoo";
let transparent = false;
let current: {
  art: Artwork;
  source: EncodedSource | null;
  report: GeometryReport;
  state: State;
} | null = null;
const history: { state: State; selection: number }[] = [];
const numericControls: {
  key: Exclude<keyof Settings, "spatter">;
  label: string;
  min: number;
  max: number;
  step: number;
  unit: string;
  detail?: boolean;
}[] = [
  { key: "diameter", label: "Canvas width / diameter", min: 30, max: 180, step: 1, unit: "mm" },
  { key: "minWidth", label: "Persistent line minimum", min: 0.2, max: 3, step: 0.1, unit: "mm" },
  { key: "minGap", label: "Negative-space minimum", min: 0.2, max: 4, step: 0.1, unit: "mm" },
  { key: "margin", label: "Safe margin", min: 1, max: 15, step: 1, unit: "mm" },
  { key: "rotation", label: "Rotation", min: -180, max: 180, step: 1, unit: "°" },
  {
    key: "tendrilCount",
    label: "Extra tendril count",
    min: 0,
    max: 24,
    step: 1,
    unit: "",
    detail: true,
  },
  {
    key: "tendrilLength",
    label: "Tendril length",
    min: 1,
    max: 24,
    step: 0.5,
    unit: "mm",
    detail: true,
  },
  { key: "density", label: "Ornament density", min: 0, max: 1, step: 0.05, unit: "", detail: true },
  {
    key: "reduction",
    label: "Detail reduction",
    min: 0,
    max: 1,
    step: 0.05,
    unit: "",
    detail: true,
  },
  { key: "taper", label: "Terminal taper", min: 0, max: 0.7, step: 0.05, unit: "", detail: true },
];
for (const control of numericControls) {
  const wrapper = document.createElement("div");
  wrapper.className = "range-control";
  const label = document.createElement("label");
  label.htmlFor = control.key;
  label.className = "range-label";
  label.append(document.createTextNode(control.label));
  const output = document.createElement("output");
  output.id = `${control.key}-value`;
  output.htmlFor = control.key;
  label.append(output);
  const input = document.createElement("input");
  input.type = "range";
  input.id = control.key;
  input.min = String(control.min);
  input.max = String(control.max);
  input.step = String(control.step);
  input.addEventListener("input", () => {
    output.textContent = `${input.value} ${control.unit}`;
  });
  input.addEventListener("change", () =>
    commit({ ...state, settings: { ...state.settings, [control.key]: Number(input.value) } }),
  );
  wrapper.append(label, input);
  element(control.detail ? "detail-controls" : "physical-controls").append(wrapper);
}
const reportError = (error: unknown) => {
  const el = element("error");
  el.textContent = error instanceof Error ? error.message : String(error);
  el.hidden = false;
};
const selectedState = (): State => ({ ...state, seed: variantSeed(state.seed, selection) });
function syncForm() {
  for (const key of ["input", "phrase", "mode", "normalization", "seed"] as const)
    element<HTMLInputElement | HTMLSelectElement>(key).value = String(state[key]);
  for (const control of numericControls) {
    element<HTMLInputElement>(control.key).value = String(state.settings[control.key]);
    element(`${control.key}-value`).textContent = `${state.settings[control.key]} ${control.unit}`;
  }
  element<HTMLInputElement>("spatter").checked = state.settings.spatter;
  element("meaning-controls").hidden = state.mode !== "meaning";
  element<HTMLButtonElement>("undo").disabled = history.length === 0;
}
function updatePreview() {
  if (!current) return;
  const { art, source } = current;
  const tattoo = element<HTMLImageElement>("tattoo-preview"),
    encoded = element<HTMLImageElement>("source-preview");
  tattoo.src = svgDataUrl(
    shapesSvg(art.shapes, current.state.settings.diameter, {
      background: transparent ? "transparent" : "white",
    }),
  );
  if (source) encoded.src = svgDataUrl(source.svg);
  else encoded.removeAttribute("src");
  if (!source && view !== "tattoo") view = "tattoo";
  element("tattoo-figure").hidden = view === "source";
  element("source-figure").hidden = view === "tattoo" || !source;
  element("stage").classList.toggle("checker", transparent);
  element("stage").classList.toggle("compare", view === "compare");
  for (const key of ["tattoo", "source", "compare"] as const) {
    element<HTMLButtonElement>(`view-${key}`).setAttribute("aria-pressed", String(view === key));
    element<HTMLButtonElement>(`view-${key}`).disabled = key !== "tattoo" && !source;
  }
  element("tattoo-caption").textContent =
    state.mode === "decorative"
      ? "Decorative art · non-reversible; no encoded text"
      : "Artist study · no supported geometry decoding";
  showReport(
    view === "source" && source
      ? analyzeGeometry(source.shapes, current.state.settings)
      : current.report,
    view === "source" ? "Source" : "Artist study",
  );
}
function showReport(report: GeometryReport, label: string) {
  const problems = report.issues.filter((i) => i.kind !== "taper");
  element("inspection-status").textContent = problems.length
    ? `${problems.length} items for review`
    : `No screened structural violations`;
  const fmt = (v: number | null) => (v === null ? "not measured" : `${v.toFixed(2)} mm`);
  const b = report.bounds;
  element("measurements").textContent =
    `${label}: structural width ${fmt(report.minStructuralWidth)}; terminal minimum ${fmt(report.minTerminalWidth)}; screened gap ${fmt(report.minGap)}. Ink bounds ${(b.maxX - b.minX).toFixed(1)} × ${(b.maxY - b.minY).toFixed(1)} mm.`;
  const list = element("issues");
  list.replaceChildren();
  for (const issue of report.issues) {
    const li = document.createElement("li");
    li.textContent = `${issue.shapes.join(" / ")}: ${issue.message}${issue.measured === undefined ? "" : ` (${issue.measured.toFixed(3)} mm)`}`;
    list.append(li);
  }
  if (problems.length) {
    const li = document.createElement("li");
    li.textContent = `Consider a larger design (estimated ${Math.ceil(report.suggestedDiameter)} mm canvas where scaling can help), less ornament, or artist simplification. Scaling cannot repair crossings or overlaps. No marks were discarded.`;
    list.append(li);
  }
}
function render() {
  element("error").hidden = true;
  try {
    validateState(state);
    const selected = selectedState(),
      art = renderArtwork(selected),
      source = encodedSource(selected);
    current = {
      state: selected,
      art,
      source,
      report: analyzeGeometry(art.shapes, selected.settings),
    };
    element("selected-input").textContent = JSON.stringify(selectedText(state));
    element("payload").textContent = JSON.stringify(normalizedText(state));
    element("stage-measure").textContent =
      `${state.settings.diameter} × ${state.settings.diameter} mm canvas · seed ${selected.seed}`;
    element("variant-label").textContent = `Seed ${selected.seed} selected`;
    element("codec-info").textContent =
      `${CODEC_VERSION}; ${art.ir.marks.length} ordered slots; CRC ${art.ir.checksum === null ? "not applicable" : art.ir.checksum.toString(16).padStart(4, "0")}. Pinned upstream ${UPSTREAM_COMMIT}.`;
    const grid = element("variants");
    grid.replaceChildren();
    for (let i = 0; i < 12; i++) {
      const variant = { ...state, seed: variantSeed(state.seed, i) };
      // Verify every generated source variant, not only the selected preview.
      if (i !== selection) encodedSource(variant);
      const thumbnail = i === selection ? art : renderArtwork(variant);
      const button = document.createElement("button");
      button.className = "variant";
      button.type = "button";
      button.setAttribute("aria-label", `Select variant seed ${variant.seed}`);
      button.setAttribute("aria-pressed", String(i === selection));
      const img = document.createElement("img");
      img.alt = "";
      img.src = svgDataUrl(thumbnail.svg);
      const span = document.createElement("span");
      span.textContent = `Seed ${variant.seed}`;
      button.append(img, span);
      button.addEventListener("click", () => {
        history.push({ state: structuredClone(state), selection });
        selection = i;
        syncForm();
        render();
      });
      grid.append(button);
    }
    element<HTMLButtonElement>("export-source").disabled = !source;
    for (const button of document.querySelectorAll<HTMLButtonElement>(".exports button"))
      if (button.id !== "export-source") button.disabled = false;
    element<HTMLButtonElement>("save-project").disabled = false;
    updatePreview();
  } catch (error) {
    current = null;
    reportError(error);
    element("selected-input").textContent = JSON.stringify(selectedText(state));
    element("payload").textContent = "No valid payload · preview/export cleared";
    element<HTMLImageElement>("tattoo-preview").removeAttribute("src");
    element<HTMLImageElement>("source-preview").removeAttribute("src");
    element("variants").replaceChildren();
    element("issues").replaceChildren();
    element("measurements").textContent = "No geometry to measure.";
    for (const button of document.querySelectorAll<HTMLButtonElement>(".exports button"))
      button.disabled = true;
    element<HTMLButtonElement>("save-project").disabled = true;
  }
}
function commit(next: State) {
  if (JSON.stringify(next) === JSON.stringify(state) && selection === 0) return;
  history.push({ state: structuredClone(state), selection });
  if (history.length > 50) history.shift();
  state = next;
  selection = 0;
  syncForm();
  render();
}
for (const key of ["input", "phrase", "mode", "normalization", "seed"] as const) {
  element<HTMLInputElement | HTMLSelectElement>(key).addEventListener("change", (event) => {
    const value = (event.target as HTMLInputElement).value;
    commit({ ...state, [key]: key === "seed" ? Number(value) : value });
  });
}
element("use-etymology").addEventListener("click", () =>
  commit({ ...state, mode: "meaning", phrase: "Who is like God?" }),
);
element<HTMLInputElement>("spatter").addEventListener("change", (event) =>
  commit({
    ...state,
    settings: { ...state.settings, spatter: (event.target as HTMLInputElement).checked },
  }),
);
element("undo").addEventListener("click", () => {
  const previous = history.pop();
  if (previous) {
    state = previous.state;
    selection = previous.selection;
    syncForm();
    render();
  }
});
element("reset").addEventListener("click", () => commit(structuredClone(DEFAULT_STATE)));
for (const key of ["tattoo", "source", "compare"] as const)
  element(`view-${key}`).addEventListener("click", () => {
    view = key;
    updatePreview();
  });
element<HTMLInputElement>("transparent").addEventListener("change", (event) => {
  transparent = (event.target as HTMLInputElement).checked;
  updatePreview();
});
function download(action: () => void | Promise<void>) {
  void Promise.resolve()
    .then(action)
    .then(() => {
      element("export-status").textContent =
        "File prepared locally. Check your browser’s downloads.";
    })
    .catch(reportError);
}
element("save-project").addEventListener("click", () =>
  download(() =>
    saveFile("arrival-project.json", saveProject(selectedState()), "application/json"),
  ),
);
element<HTMLInputElement>("load-project").addEventListener("change", async (event) => {
  const target = event.target as HTMLInputElement;
  const file = target.files?.[0];
  if (!file) return;
  try {
    if (file.size > 100_000) throw new Error("Project exceeds the 100 KB import limit.");
    commit(loadProject(await file.text()));
  } catch (error) {
    reportError(error);
  } finally {
    target.value = "";
  }
});
element<HTMLInputElement>("decode-svg").addEventListener("change", async (event) => {
  const target = event.target as HTMLInputElement;
  const file = target.files?.[0];
  if (!file) return;
  try {
    if (file.size > 1_000_000) throw new Error("SVG exceeds the 1 MB import limit.");
    const decoded = decodeSourceSvg(await file.text());
    element("decode-result").textContent =
      `Geometry-decoded payload: ${JSON.stringify(decoded.text)} · CRC ${decoded.checksum.toString(16)}. No metadata recovery used.`;
  } catch (error) {
    element("decode-result").textContent = error instanceof Error ? error.message : String(error);
  } finally {
    target.value = "";
  }
});
const onExport = (
  id: string,
  action: (value: NonNullable<typeof current>) => void | Promise<void>,
) =>
  element(id).addEventListener("click", () =>
    download(() => {
      if (!current) throw new Error("Resolve input errors before export.");
      return action(current);
    }),
  );
onExport("export-source", ({ source }) => {
  if (source) saveFile("arrival-encoded-source-v1.svg", source.svg, "image/svg+xml");
});
onExport("export-stencil", ({ art }) =>
  saveFile("arrival-artist-derivative-stencil.svg", art.svg, "image/svg+xml"),
);
onExport("export-reversed", ({ art, state: selected }) =>
  saveFile(
    "arrival-reversed-derivative.svg",
    shapesSvg(art.shapes, selected.settings.diameter, { reversed: true }),
    "image/svg+xml",
  ),
);
onExport("export-transfer", ({ art, state: selected }) =>
  saveFile(
    "arrival-MIRRORED-TRANSFER.svg",
    shapesSvg(art.shapes, selected.settings.diameter, { mirrored: true }),
    "image/svg+xml",
  ),
);
onExport("export-png", async ({ art, state: selected }) =>
  saveFile(
    "arrival-preview-600dpi.png",
    await exportPng(
      shapesSvg(art.shapes, selected.settings.diameter, {
        background: transparent ? "transparent" : "white",
      }),
      selected.settings.diameter,
    ),
    "image/png",
  ),
);
onExport("export-print", ({ state: selected }) =>
  saveFile("arrival-print-at-100-percent.html", printSheet(selected), "text/html"),
);
onExport("export-manifest", async ({ state: selected, report }) =>
  saveFile("arrival-encoding-manifest.json", await manifest(selected, report), "application/json"),
);
onExport("export-comparison", ({ state: selected }) =>
  saveFile("arrival-comparison.html", comparisonSheet(selected), "text/html"),
);
syncForm();
render();
// No persistent storage or network API. All project state exists only in this closure.
