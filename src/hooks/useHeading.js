import { useEffect, useRef, useState } from "react";
import { useView } from './useView'
import { usePage } from './usePage'

export function useHeading() {
  const { hasTocView, activeView } = useView()
  const { selectedPageId } = usePage();

  /**
   * @type {[Array<HeadingNode>, Function]}
   * articleHeadings - 文内标题对象数组
   */
  const [articleHeadings, setArticleHeadings] = useState([]);

  /**
   * @type {[string, Function]}
   * activeHeadingId - 活动文内标题
   */
  const [activeHeadingId, setActiveHeadingId] = useState("");

  /**
   * @description 正在跳转到文内标题
   * @type {React.RefObject<boolean>}
   */
  const isHeadingJumpingRef = useRef(false);

  /**
   * @description 跳转目标标题的id
   * @type {React.RefObject<string>}
   */
  const jumpTargetHeadingIdRef = useRef("");

  /**
   * @description 跳转计时器实例
   * @type {React.RefObject<null>}
   */
  const jumpLockTimerRef = useRef(null);

  /**
   * @description 清除跳转操作
   */
  function clearHeadingJumpLock() {
    if (jumpLockTimerRef.current) {
      window.clearTimeout(jumpLockTimerRef.current);
      jumpLockTimerRef.current = null;
    }

    isHeadingJumpingRef.current = false;
    jumpTargetHeadingIdRef.current = "";
  }

  /**
   * @description 跳转到目标文内标题
   * @param {string} id - 目标文内标题id
   */
  function jumpToHeading(id) {
    const element = document.getElementById(id);
    if (!element) {
      return;
    }

    isHeadingJumpingRef.current = true;
    jumpTargetHeadingIdRef.current = id;
    if (jumpLockTimerRef.current) {
      window.clearTimeout(jumpLockTimerRef.current);
    }
    jumpLockTimerRef.current = window.setTimeout(() => {
      clearHeadingJumpLock();
    }, 1500);

    setActiveHeadingId(id);
    element.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  /**
   * 初始化
   */
  useEffect(() => {
    clearHeadingJumpLock();
  }, []);

  useEffect(() => {
    if (!hasTocView) clearHeadingJumpLock();
  }, [hasTocView]);

  /**
   *
   */
  useEffect(() => {
    if (!selectedPageId) {
      clearHeadingJumpLock();
      setArticleHeadings([]);
      setActiveHeadingId("");
    }
  }, [activeView, selectedPageId]) // 还要补充pre、collab的

  return { clearHeadingJumpLock, jumpToHeading, articleHeadings, setArticleHeadings, activeHeadingId, setActiveHeadingId, isHeadingJumpingRef }
}