import { useEffect, useRef, useState } from "react";
import getHeadings from "../utils/getHeadings.js";

export function useHeading() {
  const [content, setContent] = useState(null);
  const [activeHeadingId, setActiveHeadingId] = useState("");
  const [articleHeadings, setArticleHeadings] = useState([]);
  useEffect(() => {
    if (!content) return;
    const updateHeadings = () => {
      const headings = getHeadings(content);
      setArticleHeadings(headings);
    };
    updateHeadings();
    const observer = new MutationObserver(updateHeadings);
    observer.observe(content, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, [content]);

  const jumpTargetRef = useRef("");
  const jumpTimerRef = useRef(null);

  function clearJump() {
    if (jumpTimerRef.current) {
      clearTimeout(jumpTimerRef.current);
      jumpTimerRef.current = null;
    }
    jumpTargetRef.current = "";
  }

  function jumpToHeading(id) {
    const element = document.getElementById(id);
    if (!element) return;
    jumpTargetRef.current = id;
    if (jumpTimerRef.current) clearTimeout(jumpTimerRef.current);
    jumpTimerRef.current = setTimeout(() => {
      clearJump();
    }, 1500);
    element.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  const observerRef = useRef(null);
  useEffect(() => {
    setActiveHeadingId(articleHeadings[0]?.id);

    const observer = new IntersectionObserver(
      (entries) => {
        const visibleEntry = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];

        if (visibleEntry?.target?.id) {
          const visibleHeadingId = visibleEntry.target.id;
          setActiveHeadingId(visibleHeadingId);
        }
      },
      {
        root: content ?? null,
        rootMargin: "0px 0px -90% 0px",
        threshold: 0
      }
    );
    for (const heading of articleHeadings) {
      const element = document.getElementById(heading.id);
      if (element) {
        observer.observe(element);
      }
    }
    observerRef.current = observer;

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
        observerRef.current = null;
      }
    };
  }, [articleHeadings]);

  useEffect(() => {
    return () => {
      clearJump();
    };
  });

  return {
    setContent,
    articleHeadings,
    activeHeadingId,
    jumpToHeading
  };
}
