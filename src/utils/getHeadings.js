import { getHeadingText } from "./getHeadingText.js";
import { toHeadingId } from "./toHeadingId.js";

/**
 * @param element
 * @returns {Array<{id: string, level: number, text: string}>}
 */
export default function getHeadings(element) {
  const rawHeadings = element
    ? Array.from(element.querySelectorAll(".markdown-body h2, .markdown-body h3, .markdown-body h4"))
    : [];
  const counter = new Map();
  return rawHeadings.map((heading) => {
    /**
     * @description 标题等级
     * @type {number}
     */
    const level = Number(heading.tagName.replace("H", ""));

    /**
     * @description 标题文本
     * @type {string}
     */
    const text = getHeadingText(heading.textContent || "");

    /**
     * @description 标题id
     * @type {string}
     */
    const baseId = toHeadingId(text);

    /**
     * @description 标题出现计数
     * @type {number}
     */
    const count = (counter.get(baseId) || 0) + 1;
    counter.set(baseId, count);

    const id = count === 1 ? baseId : `${baseId}-${count}`;
    heading.id = id;

    return { id, level, text };
  });
}
