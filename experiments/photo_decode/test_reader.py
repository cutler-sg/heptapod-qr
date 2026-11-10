"""Narrow tests; synthetic recovery uses explicitly known geometry, not auto-discovery."""

import json
import math
import unittest
from pathlib import Path

import cv2
import numpy as np
import read_photo as reader


class ReaderTests(unittest.TestCase):
    def setUp(self):
        self.fixture = json.loads(Path(__file__).with_name("control.json").read_text())

    def test_crc_standard_check_value(self):
        self.assertEqual(reader.crc16(b"123456789"), 0x29B1)

    def test_packing_matches_vendored_codec(self):
        self.assertEqual(
            reader.unpack_slots(self.fixture["slots"]), self.fixture["text"]
        )

    def test_corruption_and_invalid_digits_fail(self):
        slots = self.fixture["slots"].copy()
        slots[0] = (slots[0] + 1) % 10
        with self.assertRaisesRegex(ValueError, "Checksum"):
            reader.unpack_slots(slots)
        for invalid in ([], [10], [-1], [1.5]):
            with self.assertRaises(ValueError):
                reader.unpack_slots(invalid)

    def test_blank_image_rejected(self):
        with self.assertRaisesRegex(ValueError, "ink component"):
            reader.ink_mask(np.full((100, 100, 3), 255, np.uint8), None, 95)

    def test_clean_raster_with_known_geometry_recovers_echo(self):
        # Oracle geometry is deliberate: this verifies mark sampling, not the
        # ability to infer ellipse, slot count or start from an arbitrary photo.
        fixture = self.fixture
        size, radius = fixture["size"], fixture["radius"]
        center, scale = size / 2, 2
        mask = np.zeros((size * scale, size * scale), np.uint8)
        for path in fixture["geometry"]["paths"]:
            cv2.fillPoly(mask, [np.rint(np.array(path) * scale).astype(np.int32)], 1)
        trace = reader.sample_ring(
            mask,
            (center * scale, center * scale, radius * 2 * scale, radius * 2 * scale, 0),
        )
        ring = np.array(fixture["geometry"]["paths"][0])
        half = len(ring) // 2
        trace["start"] = math.atan2(ring[0, 1] - center, ring[0, 0] - center)
        end = math.atan2(ring[half - 1, 1] - center, ring[half - 1, 0] - center)
        trace["span"] = (end - trace["start"]) % (2 * math.pi)
        slots = reader.read_slots(trace, len(fixture["slots"]), 1, 0, 0, 1, 0)
        self.assertEqual(reader.unpack_slots(slots), fixture["text"])


if __name__ == "__main__":
    unittest.main(verbosity=2)
