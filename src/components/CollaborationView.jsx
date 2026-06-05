import collaborationGuidelinesContent from "../content/collaboration/collaboration-guidelines.md?raw";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import TocPanel from "./TocPanel.jsx";
import { useRef, useContext } from "react";
import { MarkdownContext } from "../contexts/MarkdownContext.jsx";

const collaborationPage = {
  id: "collaboration-guidelines",
  title: "Ham Wiki 文章创作规则与参考模板",
  content: String(collaborationGuidelinesContent).trim()
};

export default function CollaborationView() {
  const markdownComponents = useContext(MarkdownContext);
  const contentRef = useRef(null);

  return (
    <div className="collaboration-shell">
      <main className="content panel" ref={contentRef}>
        <header className="content-header">
          <h2>{collaborationPage.title}</h2>
        </header>

        <article className="markdown-body">
          <ReactMarkdown
            remarkPlugins={[remarkGfm, remarkMath]}
            rehypePlugins={[rehypeKatex]}
            components={markdownComponents}
          >
            {collaborationPage.content}
          </ReactMarkdown>
        </article>
      </main>

      <TocPanel contentRef={contentRef}/>

    </div>);
}
