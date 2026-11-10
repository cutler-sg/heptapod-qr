# Experimental smartphone-photo decode attempt

**Outcome: no checksum-valid text was recovered from the supplied tattoo photo.** This is a research script, not a supported camera decoder or a new app feature. The earlier seed-46 visual match is a separate result and must not be presented as optical decoding.

## What the reader actually does

The only input is the photograph plus explicit crop/threshold settings and, optionally, an assumed slot count. It does not accept or open an SVG, expected plaintext, seed, source template, dictionary, or saved project. For this run, no slot-count hint was supplied.

1. Crop out unrelated content, threshold dark ink, and retain the largest connected component.
2. Estimate an ellipse from structurally opened ink pixels and sample it in polar coordinates.
3. Locate an apparent ring gap and estimate inner/outer radial boundaries.
4. Search slot counts 10–96, both read directions, three angular phases, three gap expansions, three radial scales, and three tendril-detection heuristics.
5. Classify swelling/tendril marks, unpack the resulting decimal digits using the documented v1 format, and require valid packing/UTF-8 and CRC-16.

An invalid read stays invalid. There is no text prediction, phrase substitution, dictionary correction or search for the known phrase. Even a CRC hit would be returned as an **unverified candidate**: trying many interpretations can produce accidental checksum matches. Supporting readings are correlated, not independent statistical evidence.

## Actual results (10 November 2026)

Manual image crop: x=110, y=20, width=590, height=690 pixels. The crop excludes the studio card and much of the surrounding background. Thresholds are the maximum RGB-channel value allowed to count as ink.

| Ink threshold | Configurations | Readable slot sequences | Packing/UTF-8/CRC rejects | Valid candidates |
| --- | ---: | ---: | ---: | ---: |
| 75 | 14,094 | 14,094 | 14,094 | 0 |
| 95 | 14,094 | 14,094 | 14,094 | 0 |
| 115 | 14,094 | 108 | 108 | 0 |
| Total | 42,282 | 28,296 | 28,296 | 0 |

The remaining 13,986 configurations at threshold 115 sampled missing/gap regions and were rejected before unpacking. This threshold materially changed segmentation; it did not provide a usable alternative reading. Machine-readable run summaries are under `results/`. The photo and intermediate pixel arrays are not committed.

## Calibration and tests

Five focused tests passed: CRC-16 standard check value, compatibility with the upstream packing fixture, corrupt/invalid digit rejection, blank-image rejection, and recovery of `echo` from a clean synthetic raster **with known ellipse, slot count and start/span**.

That last test verifies only the mark-reading path under oracle geometry, not automatic optical decoding. In an exploratory four-control run using seeds 7–10 and known geometry, `echo` was recovered; `a`, `ORBIT 7` and `now?` were not. The prototype therefore has significant limitations even before perspective and skin deformation. No general photo-decoding capability is established.

## Reproduce locally

The Python script declares pinned optional analysis dependencies (NumPy, OpenCV and SciPy). They are not added to the browser app or its runtime. First dependency installation may require network access; processing itself is local. Use `--offline` after those dependencies are cached.

```sh
uv run --offline experiments/photo_decode/read_photo.py /path/to/photo.jpg \
  --crop 110,20,590,690 --threshold 95 --output /tmp/photo-reading.json

uv run --offline --no-project \
  --with numpy==2.5.4 --with opencv-python-headless==5.0.0.93 --with scipy==1.18.1 \
  python experiments/photo_decode/test_reader.py
```

`--trace-output /tmp/trace.npz` optionally saves local diagnostic pixel-derived data; treat it as private. `--slots N` explicitly narrows the search and is recorded as a hint. Do not describe a hinted run as recovering that count from pixels.

The packing/checksum implementation is adapted from the MIT-licensed upstream codec already preserved in `vendor/heptapod-ink/`; its license notice applies. `control.json` contains an original procedural test encoding of `echo`, seed 9.

## Why this does not settle photo decodability

The v1 decoder uses ordered SVG vertices and an exact point-count format header. Rasterization loses those. A photograph also merges overlapping ring/tendril polygons, changes apparent widths and bends angular spacing. Thin tips, spatter, shadows and curved skin complicate segmentation. Ellipse normalization only approximates that deformation. The CRC detects ordinary errors but is not an error-correcting code.

This bounded heuristic search failing does **not** prove decoding is impossible. A better frontal photo, calibrated nonlinear unwrapping, probabilistic mark extraction and independently validated error handling would be future work. They are not implemented or claimed here. No optical result changes the existing source-SVG decoding guarantees.
