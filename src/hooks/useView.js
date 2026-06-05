import { useState } from "react";

export function useView() {
  /**
   * @type {[("home" | "preknowledge" | "wiki" | "collaboration"), Function]}
   */
  const [activeView, setActiveView] = useState("home");

  return { activeView, setActiveView };
}
