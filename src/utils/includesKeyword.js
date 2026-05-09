export function includesKeyword(page, keyword) {
  const normalizedKeyword = keyword.trim().toLowerCase();
  if (!normalizedKeyword) {
    return true;
  }

  const content = [page.title, page.content].join(" ").toLowerCase();

  return content.includes(normalizedKeyword);
}
