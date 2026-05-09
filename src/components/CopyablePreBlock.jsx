import { Children, isValidElement, useState } from 'react'

export function CopyablePreBlock({ children, ...props }) {
  const [copied, setCopied] = useState(false);
  const firstChild = Children.toArray(children)[0];
  const rawCode = isValidElement(firstChild) ? firstChild.props.children : "";
  const codeText = String(rawCode ?? "").replace(/\n$/, "");

  async function copyCode() {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(codeText);
      } else {
        const textArea = document.createElement("textarea");
        textArea.value = codeText;
        textArea.setAttribute("readonly", "");
        textArea.style.position = "fixed";
        textArea.style.opacity = "0";
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand("copy");
        textArea.remove();
      }

      setCopied(true);
      window.setTimeout(() => setCopied(false), 1200);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className="markdown-code-block">
      <button
        type="button"
        className={copied ? "copy-code-btn copied" : "copy-code-btn"}
        onClick={copyCode}
        aria-label="复制代码"
      >
        {copied ? "已复制" : "复制"}
      </button>
      <pre {...props}>{children}</pre>
    </div>
  );
}
