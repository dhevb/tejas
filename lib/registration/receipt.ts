export type ReceiptExt = "pdf" | "jpg" | "png" | "webp";

export function detectReceipt(buf: Buffer, filename: string): ReceiptExt | null {
  const ext = filename.toLowerCase().split(".").pop() ?? "";
  if (buf.length < 12) return null;
  if (buf.subarray(0, 4).toString("utf8") === "%PDF" && ext === "pdf") return "pdf";
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff && (ext === "jpg" || ext === "jpeg")) return "jpg";
  if (buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47 && ext === "png") return "png";
  return null;
}
