import WikiPicker from "./WikiPicker.jsx";
import WikiMain from "./WikiMain.jsx";
import TocPanel from "./TocPanel.jsx";
import { useRef, useState } from "react";
import { CategoryContext } from "../contexts/CategoryContext.jsx";
import { PagesProvider } from "../contexts/PagesContext.jsx";
import { PageIdContext } from "../contexts/PageIdContext.js";

export default function WikiView({ category }) {
  const contentRef = useRef(null);
  const [pageId, setPageId] = useState();

  const text = {
    title: "default",
    subtitle: "default",
    ariaLabel: "default"
  };

  if (category === "wiki") {
    text.title = "考点汇总与解析";
    text.subtitle = "基于新版题库和《业余无线电通信》整理";
    text.ariaLabel = "知识点分层导航";
  } else if (category === "preknowledge") {
    text.title = "前置知识";
    text.subtitle = "考试题目相关的基础学科知识";
    text.ariaLabel = "前置知识模块导航";
  }

  return (
    <div className="app-shell">
      <CategoryContext.Provider value={category}>
        <PagesProvider>
          <PageIdContext.Provider value={[pageId, setPageId]}>
            <WikiPicker text={text}/>
            <WikiMain contentRef={contentRef}/>
            <TocPanel contentRef={contentRef}/>
          </PageIdContext.Provider>
        </PagesProvider>
      </CategoryContext.Provider>
    </div>
  );
}
