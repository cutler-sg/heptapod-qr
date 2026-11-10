# /// script
# requires-python = ">=3.12"
# dependencies = ["numpy==2.5.4", "opencv-python-headless==5.0.0.93", "scipy==1.18.1"]
# ///
"""Experimental image-only reader for the restored heptapod-ink v1 mark system.

Not a supported camera codec. No source SVG, seed, expected text, dictionary, project,
or reference template is accepted. A crop/slot-count hint is explicitly reported.
CRC matches after a search are candidates, not authenticated readings.
"""

from __future__ import annotations

import argparse
import hashlib
import itertools
import json
import math
from pathlib import Path

import cv2
import numpy as np
from scipy.ndimage import median_filter
from scipy.signal import find_peaks

CHARSET = " abcdefghijklmnopqrstuvwxyz0123456789.,?!'-:;\n"
TAU = 2 * math.pi
ANGLE_SAMPLES = 1440


def crc16(data: bytes) -> int:
    crc = 0xFFFF
    for byte in data:
        crc ^= byte << 8
        for _ in range(8):
            crc = ((crc << 1) ^ (0x1021 if crc & 0x8000 else 0)) & 0xFFFF
    return crc


def unpack_slots(slots: list[int]) -> str:
    if not slots or any(not isinstance(s, int) or not 0 <= s <= 9 for s in slots):
        raise ValueError("Invalid slot sequence")
    number = sum(digit * 10**i for i, digit in enumerate(slots))
    expected = number % 65536
    number //= 65536
    compact = number % 2 == 0
    number //= 2
    out = []
    base = len(CHARSET) + 1 if compact else 257
    while number:
        digit = number % base
        number //= base
        if digit == 0:
            raise ValueError("Invalid packing digit")
        out.append(CHARSET[digit - 1] if compact else digit - 1)
        if len(out) > 128:
            raise ValueError("Payload exceeds limit")
    text = "".join(out) if compact else bytes(out).decode("utf-8", errors="strict")
    if not text or crc16(text.encode("utf-8")) != expected:
        raise ValueError("Checksum failed")
    return text


def ink_mask(
    image: np.ndarray, crop: tuple[int, int, int, int] | None, threshold: int
) -> np.ndarray:
    mask = (np.max(image[:, :, :3], axis=2) < threshold).astype(np.uint8)
    if crop:
        x, y, width, height = crop
        if (
            min(x, y) < 0
            or min(width, height) < 1
            or x + width > image.shape[1]
            or y + height > image.shape[0]
        ):
            raise ValueError("Crop must lie within the photograph")
        bounded = np.zeros_like(mask)
        bounded[y : y + height, x : x + width] = mask[y : y + height, x : x + width]
        mask = bounded
    count, labels, stats, _centers = cv2.connectedComponentsWithStats(mask)
    if count < 2 or max(stats[1:, cv2.CC_STAT_AREA]) < 100:
        raise ValueError("No sufficiently large ink component detected")
    # Excludes detached spatter, hairs and the studio card if a proper crop is supplied.
    return (labels == 1 + np.argmax(stats[1:, cv2.CC_STAT_AREA])).astype(np.uint8)


def estimate_ellipse(mask: np.ndarray) -> tuple[float, ...]:
    opened = cv2.morphologyEx(
        mask, cv2.MORPH_OPEN, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (9, 9))
    )
    y, x = np.nonzero(opened)
    if len(x) < 20:
        raise ValueError("Insufficient structural ink for ellipse fit")
    (cx, cy), (width, height), angle = cv2.fitEllipse(
        np.column_stack([x, y]).astype(np.float32)
    )
    if min(width, height) < 30:
        raise ValueError("Ring is too small to sample")
    return cx, cy, width, height, angle


def sample_ring(mask: np.ndarray, ellipse: tuple[float, ...]) -> dict:
    cx, cy, width, height, degrees = ellipse
    angle = degrees * math.pi / 180
    radii = np.arange(0.58, 1.60, 0.002, dtype=np.float32)
    angles = np.arange(ANGLE_SAMPLES, dtype=np.float32) * TAU / ANGLE_SAMPLES
    x = (
        cx
        + width / 2 * radii[:, None] * np.cos(angles)[None, :] * math.cos(angle)
        - height / 2 * radii[:, None] * np.sin(angles)[None, :] * math.sin(angle)
    )
    y = (
        cy
        + width / 2 * radii[:, None] * np.cos(angles)[None, :] * math.sin(angle)
        + height / 2 * radii[:, None] * np.sin(angles)[None, :] * math.cos(angle)
    )
    polar = (
        cv2.remap(
            mask.astype(np.float32),
            x.astype(np.float32),
            y.astype(np.float32),
            cv2.INTER_LINEAR,
        )
        > 0.4
    )
    inner = np.full(ANGLE_SAMPLES, np.nan)
    outer = np.full(ANGLE_SAMPLES, np.nan)
    for index in range(ANGLE_SAMPLES):
        boundaries = np.flatnonzero(np.diff(np.r_[False, polar[:, index], False]))
        runs = list(zip(boundaries[::2], boundaries[1::2]))
        if not runs:
            continue
        lo, hi = min(
            runs, key=lambda run: abs((radii[run[0]] + radii[run[1] - 1]) / 2 - 1)
        )
        if abs((radii[lo] + radii[hi - 1]) / 2 - 1) < 0.25:
            inner[index], outer[index] = radii[lo], radii[hi - 1]
    missing = ~np.isfinite(inner)
    if not missing.any() or missing.all():
        raise ValueError("An open ring gap could not be identified")
    # Circular runs handle a gap crossing angle zero.
    boundaries = np.flatnonzero(np.diff(np.r_[False, np.tile(missing, 2), False]))
    gaps = [
        (lo, hi)
        for lo, hi in zip(boundaries[::2], boundaries[1::2])
        if lo < ANGLE_SAMPLES
    ]
    lo, hi = max(gaps, key=lambda run: run[1] - run[0])
    start = hi % ANGLE_SAMPLES * TAU / ANGLE_SAMPLES
    span = (lo % ANGLE_SAMPLES * TAU / ANGLE_SAMPLES - start) % TAU
    if not 4.5 < span < TAU - 0.02:
        raise ValueError("Detected gap is outside the experimental range")
    # Interpolation is only for filtering; slot reads in the missing arc are rejected below.
    good = np.flatnonzero(~missing)
    for values in (inner, outer):
        values[missing] = np.interp(
            np.flatnonzero(missing), good, values[good], period=ANGLE_SAMPLES
        )
    return {
        "inner": inner,
        "outer": outer,
        "missing": missing,
        "polar": polar,
        "start": start,
        "span": span,
    }


def read_slots(
    trace: dict,
    count: int,
    direction: int,
    phase: float,
    gap_expansion: float,
    radial_scale: float,
    tip_method: int,
) -> list[int] | None:
    radius = max(130, count * 30 / (TAU * 0.88))
    start = trace["start"] + gap_expansion / 2
    span = trace["span"] - gap_expansion
    if direction < 0:
        start += span
    positions = (
        start
        + phase
        + direction * span * (18 + np.arange(count) * 8) / (28 + count * 8)
    ) % TAU
    indices = np.rint(positions / TAU * ANGLE_SAMPLES).astype(int) % ANGLE_SAMPLES
    if np.any(trace["missing"][indices]):
        return None
    window = max(3, int(ANGLE_SAMPLES / count * 0.32) | 1)
    inner = median_filter(trace["inner"], size=5, mode="wrap")
    outer = median_filter(trace["outer"], size=window, mode="wrap")
    ro, ri = (
        outer[indices] * radial_scale * radius,
        inner[indices] * radial_scale * radius,
    )
    widths, offsets = ro - ri, (ro + ri) / 2 - radius
    classes = np.where(widths < 20, 0, np.where(widths < 38, 1, 2))
    classes = np.where((classes > 0) & (offsets < 0), classes + 2, classes)
    # Thin radial protrusions are candidates for tendril bases, assigned to the nearest slot.
    baseline = median_filter(
        trace["outer"], size=max(3, int(ANGLE_SAMPLES / count * 1.2) | 1), mode="wrap"
    )
    if tip_method == 0:
        signal = (trace["outer"] - baseline) * radius
        prominence = 10
    else:
        signal = (trace["outer"] * radial_scale - 1) * radius
        prominence = 26 if tip_method == 1 else 40
    peaks, _properties = find_peaks(
        np.tile(signal, 3),
        height=prominence,
        distance=max(2, int(ANGLE_SAMPLES / count * 0.5)),
    )
    peaks = (
        peaks[(peaks >= ANGLE_SAMPLES) & (peaks < ANGLE_SAMPLES * 2)] - ANGLE_SAMPLES
    )
    for peak in peaks:
        theta = peak * TAU / ANGLE_SAMPLES
        distances = np.abs((positions - theta + math.pi) % TAU - math.pi)
        slot = int(np.argmin(distances))
        if distances[slot] < span / count * 0.55:
            classes[slot] = classes[slot] % 5 + 5
    return classes.astype(int).tolist()


def search(trace: dict, counts: list[int]) -> dict:
    trials, rejections, unreadable = 0, 0, 0
    matches: dict[str, dict] = {}
    configurations = itertools.product(
        counts,
        (1, -1),
        (-0.04, 0.0, 0.04),
        (0.0, 0.12, 0.24),
        (0.96, 1.0, 1.04),
        (0, 1, 2),
    )
    for count, direction, phase, expansion, scale, method in configurations:
        slots = read_slots(trace, count, direction, phase, expansion, scale, method)
        if slots is None:
            unreadable += 1
            continue
        trials += 1
        try:
            text = unpack_slots(slots)
        except (ValueError, UnicodeDecodeError):
            rejections += 1
            continue
        record = matches.setdefault(
            text,
            {
                "text": text,
                "supportingReadings": 0,
                "firstParameters": {
                    "slotCount": count,
                    "direction": direction,
                    "phaseRadians": phase,
                    "gapExpansionRadians": expansion,
                    "radialScale": scale,
                    "tendrilMethod": method,
                },
                "slots": slots,
            },
        )
        record["supportingReadings"] += 1
    return {
        "status": "unverified_crc_candidates"
        if matches
        else "no_checksum_valid_decode",
        "testedReadings": trials,
        "rejectedReadings": rejections,
        "unreadableConfigurations": unreadable,
        "candidates": list(matches.values()),
    }


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("image", type=Path)
    parser.add_argument(
        "--crop", help="x,y,width,height; excludes unrelated background/text"
    )
    parser.add_argument("--threshold", type=int, default=95)
    parser.add_argument(
        "--slots", type=int, help="Optional assumed slot count; reported as a hint"
    )
    parser.add_argument("--output", type=Path, required=True)
    parser.add_argument(
        "--trace-output",
        type=Path,
        help="Optional local diagnostic NPZ; contains image-derived data",
    )
    args = parser.parse_args()
    if (
        not 1 <= args.threshold <= 254
        or args.slots is not None
        and not 10 <= args.slots <= 96
    ):
        raise ValueError("Threshold must be 1..254 and slot hint 10..96")
    data = args.image.read_bytes()
    if len(data) > 20_000_000:
        raise ValueError("Image exceeds 20 MB")
    image = cv2.imdecode(np.frombuffer(data, np.uint8), cv2.IMREAD_COLOR)
    if image is None or image.shape[0] * image.shape[1] > 20_000_000:
        raise ValueError("Unreadable image or image exceeds 20 megapixels")
    crop = tuple(map(int, args.crop.split(","))) if args.crop else None
    if crop and len(crop) != 4:
        raise ValueError("Crop needs four integers")
    mask = ink_mask(image, crop, args.threshold)
    ellipse = estimate_ellipse(mask)
    trace = sample_ring(mask, ellipse)
    counts = [args.slots] if args.slots else list(range(10, 97))
    result = search(trace, counts)
    result.update(
        {
            "experimentVersion": "optical-attempt/1",
            "imageSha256": hashlib.sha256(data).hexdigest(),
            "crop": crop,
            "threshold": args.threshold,
            "slotCountHint": args.slots,
            "slotCountsSearched": counts,
            "ellipse": ellipse,
            "detectedStartRadians": trace["start"],
            "detectedSpanRadians": trace["span"],
            "noExpectedTextOrSourceTemplate": True,
            "limitation": "Raster heuristic only. A CRC match after searching many interpretations is not proof of an optical decode. Do not select a candidate merely because it matches a previously known phrase.",
        }
    )
    args.output.write_text(json.dumps(result, indent=2) + "\n")
    if args.trace_output:
        np.savez_compressed(args.trace_output, **trace)
    print(
        json.dumps(
            {
                key: result[key]
                for key in (
                    "status",
                    "testedReadings",
                    "rejectedReadings",
                    "unreadableConfigurations",
                    "candidates",
                )
            },
            indent=2,
        )
    )


if __name__ == "__main__":
    main()
