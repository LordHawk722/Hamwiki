const wikiCatalog = [
  {
    id: "law-and-policy",
    title: "法律法规",
    children: [
      { pageId: "cn-radio-control-regulations", title: "中华人民共和国无线电管制规定" },
      { pageId: "cn-radio-management-regulations", title: "中华人民共和国无线电管理条例" },
      { pageId: "cn-amateur-radio-station-management-measures", title: "业余无线电台管理办法" },
      { pageId: "cn-amateur-radio-callsign-requirements", title: "业余无线电台呼号编制和核发要求" },
      { pageId: "cn-radio-frequency-allocation-regulations", title: "中华人民共和国无线电频率划分规定" },
      { pageId: "domestic-and-international-organizations", title: "国内外组织机构简介" }
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
          { pageId: "electronics-foundation", title: "电子学基础" }
        ]
      },
      {
        id: "antenna-systems",
        title: "天线系统",
        children: [
          { pageId: "antenna-wavelength-and-size", title: "波长与天线尺寸" },
          { pageId: "antenna-radiation", title: "天线如何辐射" },
          { pageId: "antenna-impedance-and-swr", title: "阻抗、驻波比与匹配" },
          { pageId: "antenna-gain-and-pattern", title: "增益、方向图与效率" },
          { pageId: "antenna-polarization-and-erp", title: "极化与有效辐射功率" },
          { pageId: "antenna-height-and-takeoff", title: "高度、地面与辐射仰角" },
          { pageId: "feedline-and-coax", title: "传输线与同轴电缆" },
          { pageId: "balun-and-common-mode", title: "巴伦与共模电流" },
          { pageId: "atu-and-measurement", title: "天调与驻波测量" },
          { pageId: "wire-antennas", title: "线天线" },
          { pageId: "vertical-antennas", title: "垂直天线与地网" },
          { pageId: "directional-antennas", title: "定向天线与八木" },
          { pageId: "antennas-in-limited-space", title: "空间受限时的天线" },
          { pageId: "antenna-installation-safety", title: "架设、防雷与安全" },
          { pageId: "antenna-selection-and-troubleshooting", title: "选型与故障排查" },
          { pageId: "antenna-terms", title: "天线术语与缩语" }
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
        children: [
          { pageId: "emc-safety", title: "电磁兼容与安全" },
          { pageId: "emergency-comm", title: "应急通信基本原则" }
        ]
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

export default wikiCatalog;
