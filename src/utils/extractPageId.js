export function extractPageId(filePath) {
  const normalizedPath = filePath.replace(/\\/g, "/");
  const segments = normalizedPath.split("/");
  const fileName = segments[segments.length - 1] || "";
  return fileName.replace(/\.md$/i, "");
}
