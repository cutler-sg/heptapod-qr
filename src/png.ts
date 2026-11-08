function crc32(bytes: Uint8Array): number {
  let crc = 0xffffffff;
  for (const byte of bytes) {
    crc ^= byte;
    for (let bit = 0; bit < 8; bit++) crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0);
  }
  return (crc ^ 0xffffffff) >>> 0;
}
/** Add/replace PNG pixel-density metadata. This does not resize or alter any image data. */
export function withPngDensity(png: Uint8Array, dpi: number): Uint8Array<ArrayBuffer> {
  if (
    png.length < 33 ||
    png.slice(0, 8).some((v, i) => v !== [137, 80, 78, 71, 13, 10, 26, 10][i]) ||
    !Number.isFinite(dpi) ||
    dpi <= 0 ||
    dpi > 2400
  )
    throw new Error("Invalid PNG or density.");
  const chunk = new Uint8Array(21);
  const data = new DataView(chunk.buffer);
  data.setUint32(0, 9);
  chunk.set([112, 72, 89, 115], 4); // pHYs
  const pixelsPerMetre = Math.round(dpi / 0.0254);
  data.setUint32(8, pixelsPerMetre);
  data.setUint32(12, pixelsPerMetre);
  chunk[16] = 1;
  data.setUint32(17, crc32(chunk.subarray(4, 17)));
  const pieces: Uint8Array[] = [png.subarray(0, 8)];
  let offset = 8;
  while (offset < png.length) {
    if (offset + 12 > png.length) throw new Error("Truncated PNG chunk.");
    const length = new DataView(png.buffer, png.byteOffset + offset, 4).getUint32(0);
    const end = offset + 12 + length;
    if (end > png.length) throw new Error("Invalid PNG chunk length.");
    const type = String.fromCharCode(...png.subarray(offset + 4, offset + 8));
    if (type !== "pHYs") pieces.push(png.subarray(offset, end));
    if (type === "IHDR") pieces.push(chunk);
    offset = end;
  }
  const result = new Uint8Array(pieces.reduce((sum, p) => sum + p.length, 0));
  let position = 0;
  for (const piece of pieces) {
    result.set(piece, position);
    position += piece.length;
  }
  return result;
}
