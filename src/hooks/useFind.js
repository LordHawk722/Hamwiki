import { useState } from "react";

export default function useFind() {
  const [keyword, setKeyword] = useState("");
  const [matchElements, setMatchElements] = useState([]);
  const [activeIndex, setActiveIndex] = useState(-1);
  return { keyword, setKeyword, matchElements, setMatchElements,  activeIndex, setActiveIndex };
}
