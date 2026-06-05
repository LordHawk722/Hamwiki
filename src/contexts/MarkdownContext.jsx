import { createContext } from "react";
import CopyablePreBlock from "../components/CopyablePreBlock.jsx";

export const MarkdownContext = createContext(() => ({
  pre({ children, ...props }) {
    return (
      <CopyablePreBlock {...props}>
        {children}
      </CopyablePreBlock>
    );
  }
}));
