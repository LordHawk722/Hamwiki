export const wikiCatalog = [
  {
    id: "law-and-policy",
    title: "法律法规",
    children: [
        { pageId: "cn-radio-control-regulations", title: "中华人民共和国无线电管制规定" }
    ]
  },
  {
    id: "station-technology",
    title: "电台技术",
    children: [
      {
        id: "circuit-and-rf",
        title: "电路与射频",
        children: [
          { pageId: "electronics-foundation", title: "电子学基础" },
          { pageId: "antenna-feedline", title: "天线与馈线" }
        ]
      }
    ]
  },
  {
    id: "station-practice",
    title: "通联实操",
    children: [
      {
        id: "qso-practice",
        title: "通联实务",
        children: [{ pageId: "operating-procedure", title: "操作规程" }]
      }
    ]
  },
  {
    id: "operation-standards",
    title: "通联规范",
    children: [
      {
        id: "safe-and-emergency",
        title: "安全与应急",
        children: [{ pageId: "emc-safety" }, { pageId: "emergency-comm" }]
      }
    ]
  },
  {
    id: "radio-principles",
    title: "无线电原理",
    children: [
      {
        id: "propagation-basics",
        title: "传播基础",
        children: [{ pageId: "radio-propagation-principles", title: "无线电传播基本原理" }]
      }
    ]
  }
];
