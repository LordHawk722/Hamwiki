export function toHeadingId(text) {
  const normalized = text
    .toLowerCase()
    .trim()
    .replace(/[\\`*_~\[\](){}<>#.:,;!?/"'|]+/g, "")
    .replace(/\s+/g, "-");

  return normalized || "section";
}
