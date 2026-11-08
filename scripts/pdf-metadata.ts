/** Keep PDF xref byte offsets unchanged while replacing volatile Chromium date strings. */
export function stablePdfDates(pdf: Buffer): Buffer {
  return Buffer.from(
    pdf
      .toString("latin1")
      .replace(
        /\/(CreationDate|ModDate) \(([^)]*)\)/g,
        (_match, key: string, date: string) =>
          `/${key} (${"D:20000101000000+00'00'".padEnd(date.length, " ").slice(0, date.length)})`,
      ),
    "latin1",
  );
}
