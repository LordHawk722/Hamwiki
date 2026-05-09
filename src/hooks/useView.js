import { useMemo, useState } from "react";

const tocViewOwners = ['preknowledge', 'wiki', 'collaboration']

/**
 * @description 视图状态
 * @returns {{activeView: string, setActiveView: (value: (((prevState: string) => string) | string)) => void}}
 */
export function useView() {
  /**
   * @type {[("home" | "preknowledge" | "wiki" | "collaboration"), Function]}
   * activeView - 当前视图
   */
  const [activeView, setActiveView] = useState("home");

  const hasTocView = useMemo(() => {
    return tocViewOwners.includes(activeView);
  }, [activeView])

  return { activeView, setActiveView, hasTocView };
}