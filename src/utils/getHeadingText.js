export function getHeadingText(rawText) {
  return rawText
    .replace(/\[(.*?)\]\((.*?)\)/g, "$1")
    .replace(/[`*_~]+/g, "")
    .trim();
}
