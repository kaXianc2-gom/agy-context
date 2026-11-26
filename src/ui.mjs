/**
 * agy-context v5.1 Frontend Client — Context Lens / 上下文透视
 * Native bilingual (EN + ZH) with live switcher, strict surface separation:
 * 1. Global Surface ("Context Lens" / "上下文透视"): Cross-session telemetry dashboard.
 * 2. Aux-Pane Surface ("Context" / "上下文"): In-chat responsive dual-column Context Anatomy.
 * 3. Inline Surface ("Context Snapshot" / "上下文快照"): Single-row micro-HUD bar.
 * Zero cartoon emojis — crisp 14px monochrome stroke SVG icons only.
 */

import { App, applyDocumentTheme, applyHostStyleVariables } from "@modelcontextprotocol/ext-apps";

const TOKEN_CAT_META = [
  { key: "sysPrompt", color: "#6366f1", zh: "系统提示词", en: "System Prompt" },
  { key: "toolDefs", color: "#f59e0b", zh: "工具定义", en: "Tool Schemas" },
  { key: "user", color: "#22c55e", zh: "用户消息", en: "User Messages" },
  { key: "injected", color: "#8b5cf6", zh: "注入内容", en: "Injected" },
  { key: "skill", color: "#f97316", zh: "技能注入", en: "Skill Loads" },
  { key: "tool", color: "#10b981", zh: "工具调用", en: "Tool Calls" },
  { key: "thinking", color: "#a855f7", zh: "模型思考", en: "Reasoning" },
  { key: "assistant", color: "#ec4899", zh: "模型回复", en: "Replies" },
];

const CAT_COLOR = Object.fromEntries(TOKEN_CAT_META.map((c) => [c.key, c.color]));
const ROW_PALETTE = ["#f97316", "#3b82f6", "#10b981", "#a855f7", "#ec4899", "#eab308", "#06b6d4"];
const EN_MONTHS = ["", "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const I18N = {
  zh: {
    brand: "上下文透视",
    loading: "正在加载统计数据...",
    noSession: "暂无会话记录",
    noData: "暂无记录",
    noMatchSes: "无匹配会话",
    noMatchNode: "当前筛选下无上下文条目",
    today: "今天",
    d7: "近 7 天",
    d30: "近 30 天",
    all: "全部",
    d14: "近 14 天",
    thisWeek: "本周",
    thisMonth: "本月",
    start: "开始",
    end: "结束",
    reset: "重置",
    applySpan: "应用区间",
    customDateTip: "自定义统计起止日期",
    copyReportTip: "复制统计摘要 (Markdown)",
    copiedReportTip: "已复制 Markdown 摘要",
    refreshTip: "刷新统计数据",
    refreshNowTip: "立即刷新",
    kpiSessions: "全部会话",
    kpiScanned: (n) => `共扫描 ${n} 个会话`,
    kpiTokens: "Token 消耗",
    kpiTurns: (n) => `轮次 ${n}`,
    kpiCost: "预估费用",
    kpiSaved: (s) => `缓存省 ${s}`,
    kpiCache: "缓存命中",
    kpiCacheSes: (n) => `含 ${n} 个会话`,
    kpiTools: "工具调用",
    kpiToolExec: (s) => `工具执行 ${s}`,
    kpiActive: "活跃时长",
    kpiReqs: (s) => `模型调用 ${s}`,
    recent7d: "近 7 天用量",
    spanDaily: (n) => `区间日用量 (${n}天)`,
    legendCost: "费用 (美元参考折算)",
    activity: "活跃度",
    filterByDate: "按日期筛选",
    sessionsLbl: "会话",
    tokUsageLbl: "Token 消耗",
    less: "少",
    more: "多",
    wds: ["", "星期一", "", "星期三", "", "星期五", ""],
    tokStats: "Token 统计",
    totalVol: "总用量",
    timingStats: "耗时统计",
    activeDur: "活跃时长",
    outSpeed: (v) => `输出速度 ${v} tok/s`,
    tmWait: "模型等待",
    tmThink: "模型思考",
    tmReply: "模型回复",
    tmToolArg: "工具参数",
    tmToolExec: "工具执行",
    tmOther: "其他开销",
    timesSuffix: "次",
    blocksSuffix: "个内容块",
    blocksShort: "块",
    schedOverhead: "调度开销",
    schedShort: "调度",
    modelTab: "模型",
    wsTab: "工作区",
    wsCount: (n) => `${n} 个工作区`,
    modelCount: (n, t) => `${n} 个模型 · ${t}`,
    skillTitle: "技能加载",
    skillMeta: (a, b) => `${a} 个技能 · ${b} 次加载`,
    toolTitle: "工具调用",
    toolMeta: (a, b) => `${a} 个工具 · ${b} 次调用`,
    cmdTitle: "命令执行",
    cmdMeta: (a, b) => `${a} 个程序 · ${b} 次执行`,
    searchSesPh: "搜索标题 / 模型 / 工作区 / 最后消息...",
    hideSub: (n) => `隐藏子任务 (${n})`,
    hiddenSub: (n) => `已隐藏子任务 (${n})`,
    sortRecent: "最近更新",
    sortTokens: "Token 总用量",
    sortWindow: "当前上下文",
    archived: "已归档",
    subagent: "子任务",
    running: "运行中",
    turnsRow: "轮次",
    turnsVal: (t, r) => `${t} 轮 ${r} 步`,
    totalTokRow: "Token 总用量",
    totalUsdRow: "总预估费用",
    lastMsg: "最后消息",
    pageInfo: (c, t) => `第 ${c} / ${t} 页`,
    backGlobal: "返回上下文透视",
    liveLbl: "实时",
    liveOnTip: "已开启 4 秒增量同步，点击暂停",
    liveOffTip: "已暂停自动刷新，点击开启",
    cacheHit: "缓存命中",
    ctxUsed: "上下文已用",
    ctxStats: "上下文统计",
    turnsLbl: "轮次",
    stepsLbl: "步数",
    repliesLbl: "模型回复",
    ctxEvents: "上下文事件",
    evInject: "注入",
    evCompact: "压缩",
    evDrop: "失效",
    fileIo: "文件读写",
    readLbl: "读取",
    writeLbl: "写入",
    subTeam: "子代理编队",
    mainAgent: "主 Agent",
    subAgentLbl: "子 Agent",
    curCtx: "当前上下文",
    snapTitle: (u, i) => `${u}${i} 上下文快照`,
    backLatest: "返回最新 ×",
    ctxTimeline: "上下文时间线",
    unitStep: "步骤",
    unitTurn: "轮次",
    modeFull: "全量",
    modeDelta: "增量",
    prevItem: "上一项 (←)",
    nextItem: "下一项 (→)",
    ctxBrowser: "上下文浏览器",
    scopeWin: "当前窗口",
    scopeStep: "比前步",
    scopeTurn: "比前轮",
    scopeAll: "全部",
    scopeWinTip: "仅显示最近一次压缩后仍留在当前窗口内的条目",
    scopeStepTip: "仅显示当前选中步骤新增的条目",
    scopeTurnTip: "仅显示本轮对话新增的条目",
    scopeAllTip: "显示整场会话全部历史条目",
    searchNodePh: "搜索工具输出 / 技能 / 思考内容...",
    sortSize: "大小",
    sortSeq: "顺序",
    onlyCat: (l) => `仅看: ${l} ×`,
    itemsCount: (n) => `${n} 项`,
    scopeHintStep: (n) => `步骤 #${n} 新增`,
    scopeHintTurn: (n) => `第 ${n} 轮新增`,
    scopeHintAll: "全会话历史",
    scopeHintWin: "当前活跃窗口",
    estSum: "估算",
    actualWin: "实际窗口",
    compactedTag: "已压缩",
    loadingFull: "正在加载完整原文...",
    charsMeta: (c, t, r) => `${c} 字符 · ≈${t} tok · 步 #${r}`,
    copyBtn: "复制",
    copiedBtn: "已复制",
    pluginBaseIntro: (sk, mcp) => `本机已启用插件固定目录占用（共 ${sk} 项技能 · ${mcp} 个 MCP 工具）：`,
    pluginRowMeta: (sk, u) => `(${sk} 技能 · 30天×${u})`,
    filterDayChip: (d) => `日期: ${d} ×`,
    filterModelChip: (v) => `模型: ${v} ×`,
    filterWsChip: (v) => `工作区: ${v} ×`,
    filterSkillChip: (v) => `技能: ${v} ×`,
    filterToolChip: (v) => `工具: ${v} ×`,
    filterProgChip: (v) => `程序: ${v} ×`,
    clickFilterDim: (n) => `点击筛选含 ${n} 的会话`,
    clickFilterCat: (l) => `点击在右侧浏览器中筛选「${l}」`,
    generalWs: "通用对话",
    justNow: "刚刚",
    minAgo: (n) => `${n} 分钟前`,
    hrAgo: (n) => `${n} 小时前`,
    dayAgo: (n) => `${n} 天前`,
    stepUnitPre: "#",
    turnUnitPre: "轮#",
    pickSession: "选择会话",
  },
  en: {
    brand: "Context Lens",
    loading: "Loading telemetry...",
    noSession: "No sessions found",
    noData: "No records",
    noMatchSes: "No matching sessions",
    noMatchNode: "No matching context entries",
    today: "Today",
    d7: "7D",
    d30: "30D",
    all: "All",
    d14: "Last 14D",
    thisWeek: "This Week",
    thisMonth: "This Month",
    start: "Start",
    end: "End",
    reset: "Reset",
    applySpan: "Apply",
    customDateTip: "Pick a custom date range",
    copyReportTip: "Copy Markdown summary",
    copiedReportTip: "Summary copied",
    refreshTip: "Refresh analytics",
    refreshNowTip: "Refresh now",
    kpiSessions: "Sessions",
    kpiScanned: (n) => `${n} scanned total`,
    kpiTokens: "Tokens",
    kpiTurns: (n) => `${n} turns`,
    kpiCost: "Est. Cost",
    kpiSaved: (s) => `Saved ${s}`,
    kpiCache: "Cache Hit",
    kpiCacheSes: (n) => `${n} cached`,
    kpiTools: "Tool Calls",
    kpiToolExec: (s) => `Exec ${s}`,
    kpiActive: "Active Time",
    kpiReqs: (s) => `${s} calls`,
    recent7d: "Last 7 Days",
    spanDaily: (n) => `Daily Spend (${n}d)`,
    legendCost: "Cost (USD est.)",
    activity: "Activity",
    filterByDate: "Filter by day",
    sessionsLbl: "Sessions",
    tokUsageLbl: "Tokens",
    less: "Less",
    more: "More",
    wds: ["", "Mon", "", "Wed", "", "Fri", ""],
    tokStats: "Token Breakdown",
    totalVol: "Total",
    timingStats: "Latency Breakdown",
    activeDur: "Active",
    outSpeed: (v) => `${v} tok/s`,
    tmWait: "TTFT Wait",
    tmThink: "Reasoning",
    tmReply: "Reply Gen",
    tmToolArg: "Tool Args",
    tmToolExec: "Tool Exec",
    tmOther: "Overhead",
    timesSuffix: " calls",
    blocksSuffix: " blocks",
    blocksShort: " blks",
    schedOverhead: "dispatch",
    schedShort: "sched",
    modelTab: "Models",
    wsTab: "Workspaces",
    wsCount: (n) => `${n} workspaces`,
    modelCount: (n, t) => `${n} models · ${t}`,
    skillTitle: "Skill Loads",
    skillMeta: (a, b) => `${a} skills · ${b} loads`,
    toolTitle: "Tool Calls",
    toolMeta: (a, b) => `${a} tools · ${b} calls`,
    cmdTitle: "Shell Commands",
    cmdMeta: (a, b) => `${a} bins · ${b} runs`,
    searchSesPh: "Search title, model, workspace, or last message...",
    hideSub: (n) => `Hide Subagents (${n})`,
    hiddenSub: (n) => `Subagents Hidden (${n})`,
    sortRecent: "Recent",
    sortTokens: "Total Tokens",
    sortWindow: "Context Size",
    archived: "Archived",
    subagent: "Subagent",
    running: "Running",
    turnsRow: "Turns",
    turnsVal: (t, r) => `${t}t · ${r} steps`,
    totalTokRow: "Total Tokens",
    totalUsdRow: "Est. Cost",
    lastMsg: "Last",
    pageInfo: (c, t) => `Page ${c} / ${t}`,
    backGlobal: "Back to Context Lens",
    liveLbl: "Live",
    liveOnTip: "4s incremental sync active (click to pause)",
    liveOffTip: "Auto-sync paused (click to resume)",
    cacheHit: "Cache",
    ctxUsed: "window used",
    ctxStats: "Session Summary",
    turnsLbl: "Turns",
    stepsLbl: "Steps",
    repliesLbl: "Replies",
    ctxEvents: "Context Events",
    evInject: "Injected",
    evCompact: "Compacted",
    evDrop: "Cache Miss",
    fileIo: "File I/O",
    readLbl: "Read",
    writeLbl: "Write",
    subTeam: "Agent Tree",
    mainAgent: "Main",
    subAgentLbl: "Sub",
    curCtx: "Active Context",
    snapTitle: (u, i) => `${u}${i} Snapshot`,
    backLatest: "Latest ×",
    ctxTimeline: "Context Timeline",
    unitStep: "Steps",
    unitTurn: "Turns",
    modeFull: "Total",
    modeDelta: "Delta",
    prevItem: "Previous (←)",
    nextItem: "Next (→)",
    ctxBrowser: "Context Browser",
    scopeWin: "Active",
    scopeStep: "Step Diff",
    scopeTurn: "Turn Diff",
    scopeAll: "All",
    scopeWinTip: "Items currently inside the active window (post-last compaction)",
    scopeStepTip: "Items added in the selected step only",
    scopeTurnTip: "Items added in the selected user turn only",
    scopeAllTip: "Full conversation history including compacted items",
    searchNodePh: "Search tool output, skills, reasoning...",
    sortSize: "Size",
    sortSeq: "Order",
    onlyCat: (l) => `Filter: ${l} ×`,
    itemsCount: (n) => `${n} items`,
    scopeHintStep: (n) => `Added in Step #${n}`,
    scopeHintTurn: (n) => `Added in Turn #${n}`,
    scopeHintAll: "Full history",
    scopeHintWin: "Active window",
    estSum: "Est.",
    actualWin: "Billed",
    compactedTag: "Compacted",
    loadingFull: "Loading full content...",
    charsMeta: (c, t, r) => `${c} chars · ≈${t} tok · Step #${r}`,
    copyBtn: "Copy",
    copiedBtn: "Copied",
    pluginBaseIntro: (sk, mcp) => `Installed plugin catalog footprint (${sk} skills · ${mcp} MCP tools):`,
    pluginRowMeta: (sk, u) => `(${sk} skills · 30d ×${u})`,
    filterDayChip: (d) => `Day: ${d} ×`,
    filterModelChip: (v) => `Model: ${v} ×`,
    filterWsChip: (v) => `Workspace: ${v} ×`,
    filterSkillChip: (v) => `Skill: ${v} ×`,
    filterToolChip: (v) => `Tool: ${v} ×`,
    filterProgChip: (v) => `Bin: ${v} ×`,
    clickFilterDim: (n) => `Filter sessions using ${n}`,
    clickFilterCat: (l) => `Filter browser by ${l}`,
    generalWs: "General",
    justNow: "Just now",
    minAgo: (n) => `${n}m ago`,
    hrAgo: (n) => `${n}h ago`,
    dayAgo: (n) => `${n}d ago`,
    stepUnitPre: "#",
    turnUnitPre: "T#",
    pickSession: "Select session",
  },
};

const ICONS = {
  db: `<svg class="ic" viewBox="0 0 16 16"><ellipse cx="8" cy="3.5" rx="5.5" ry="2"/><path d="M2.5 3.5v9c0 1.1 2.46 2 5.5 2s5.5-.9 5.5-2v-9"/><path d="M2.5 8c0 1.1 2.46 2 5.5 2s5.5-.9 5.5-2"/></svg>`,
  gauge: `<svg class="ic" viewBox="0 0 16 16"><path d="M2.8 11.5a6 6 0 1 1 10.4 0"/><path d="M8 8.5 10.8 5.7"/><circle cx="8" cy="8.5" r="1"/></svg>`,
  clock: `<svg class="ic" viewBox="0 0 16 16"><circle cx="8" cy="8" r="6"/><path d="M8 4.5V8l2.5 1.5"/></svg>`,
  folder: `<svg class="ic" viewBox="0 0 16 16"><path d="M2 4.5A1.5 1.5 0 0 1 3.5 3h2.6l1.4 1.5h5A1.5 1.5 0 0 1 14 6v6a1.5 1.5 0 0 1-1.5 1.5h-9A1.5 1.5 0 0 1 2 12V4.5Z"/></svg>`,
  book: `<svg class="ic" viewBox="0 0 16 16"><path d="M2.5 3.5h4.2a1.8 1.8 0 0 1 1.3.6 1.8 1.8 0 0 1 1.3-.6h4.2v9H9.3a1.8 1.8 0 0 0-1.3.6 1.8 1.8 0 0 0-1.3-.6H2.5v-9Z"/><path d="M8 4.1v9"/></svg>`,
  code: `<svg class="ic" viewBox="0 0 16 16"><path d="m5.2 5-3 3 3 3M10.8 5l3 3-3 3M9 3.5l-2 9"/></svg>`,
  term: `<svg class="ic" viewBox="0 0 16 16"><path d="m3.5 5 3 3-3 3M8 11h4.5"/></svg>`,
  search: `<svg class="ic" viewBox="0 0 16 16"><circle cx="7" cy="7" r="4.3"/><path d="m10.3 10.3 3.2 3.2"/></svg>`,
  refresh: `<svg class="ic" viewBox="0 0 16 16"><path d="M13.2 8a5.2 5.2 0 1 1-1.5-3.7"/><path d="M13.2 2.8v2.7h-2.7"/></svg>`,
  copy: `<svg class="ic" viewBox="0 0 16 16"><rect x="5.5" y="5.5" width="8" height="8" rx="1.5"/><path d="M10.5 5.5V4A1.5 1.5 0 0 0 9 2.5H4A1.5 1.5 0 0 0 2.5 4v5A1.5 1.5 0 0 0 4 10.5h1.5"/></svg>`,
  check: `<svg class="ic" viewBox="0 0 16 16" style="color:#22c55e"><path d="m3.5 8.5 3 3 6-6.5"/></svg>`,
  layers: `<svg class="ic" viewBox="0 0 16 16"><path d="m8 2 6 3.5L8 9 2 5.5 8 2Z"/><path d="m2 8.5 6 3.5 6-3.5"/><path d="m2 11.5 6 3.5 6-3.5"/></svg>`,
  back: `<svg class="ic" viewBox="0 0 16 16"><path d="M10 3.5 5.5 8l4.5 4.5"/></svg>`,
  chevLeft: `<svg class="ic sm" viewBox="0 0 16 16"><path d="m10 4-4 4 4 4"/></svg>`,
  chevRight: `<svg class="ic sm" viewBox="0 0 16 16"><path d="m6 4 4 4-4 4"/></svg>`,
  chevDown: `<svg class="ic sm" viewBox="0 0 16 16"><path d="m4 6 4 4 4-4"/></svg>`,
};

const state = {
  lang: (document.documentElement.lang || "").toLowerCase().startsWith("zh") ? "zh" : "en",
  langManual: false,
  surface: "global",
  drillSession: false,
  heatMetric: "tokens",
  rank1Mode: "model",
  range: "30d",
  filterDay: "",
  startDay: "",
  endDay: "",
  modelGroupFilter: "",
  workspaceFilter: "",
  skillFilter: "",
  toolFilter: "",
  programFilter: "",
  hideSubagents: false,
  sessionSearch: "",
  sessionSort: "recent",
  sessionPage: 1,
  timelineUnit: "step",
  timelineMode: "total",
  pinnedIdx: null,
  browserScope: "window",
  catFilter: "all",
  nodeSearch: "",
  nodeSort: "tokens",
  expandedGroups: new Set(),
  expandedNodes: new Set(),
  fullTexts: {},
  loadingNodeId: null,
  copiedKey: "",
  liveSync: true,
  lastMtimeMs: 0,
  lastFileSize: 0,
  openDd: null,
  usage: null,
  session: null,
  sessionList: [],
  loading: false,
};

let imeComposing = false;
let copyTimer = null;
let pollInFlight = false;
const app = new App({ name: "agy-context", version: "5.1.0" }, {});

function L() {
  return I18N[state.lang] || I18N.en;
}

function getTokenCats() {
  const isZh = state.lang === "zh";
  return TOKEN_CAT_META.map((c) => ({ key: c.key, color: c.color, label: isZh ? c.zh : c.en }));
}

function fmtWs(ws) {
  if (!ws || ws === "通用对话") return L().generalWs;
  return ws;
}

function fmtTok(n) {
  const v = Number(n || 0);
  const sign = v < 0 ? "-" : "";
  const a = Math.abs(v);
  if (a >= 1e6) return `${sign}${(a / 1e6).toFixed(1)}M`;
  if (a >= 1e3) return `${sign}${(a / 1e3).toFixed(1)}k`;
  return `${sign}${Math.round(a)}`;
}

function fmtUsd(n) {
  const v = Number(n || 0);
  if (v === 0) return "$0.00";
  if (v < 0.01) return `$${v.toFixed(4)}`;
  return `$${v.toFixed(2)}`;
}

function fmtDur(ms) {
  const s = Math.max(0, Math.round((ms || 0) / 1000));
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  const remS = s % 60;
  if (m < 60) return remS > 0 ? `${m}m${remS}s` : `${m}m`;
  const h = Math.floor(m / 60);
  const remM = m % 60;
  return `${h}h${remM}m`;
}

function fmtRelDay(iso) {
  const t = L();
  if (!iso) return { rel: "", day: "" };
  const d = Date.parse(iso);
  if (Number.isNaN(d)) return { rel: "", day: iso.slice(0, 10) };
  const dt = new Date(d);
  const dayStr = `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}-${String(dt.getDate()).padStart(2, "0")}`;
  const diffM = Math.round((Date.now() - d) / 60000);
  let rel = t.justNow;
  if (diffM >= 1 && diffM < 60) rel = t.minAgo(diffM);
  else if (diffM >= 60 && diffM < 1440) rel = t.hrAgo(Math.round(diffM / 60));
  else if (diffM >= 1440) rel = t.dayAgo(Math.round(diffM / 1440));
  return { rel, day: dayStr };
}

function fmtIsoLocal(dt) {
  return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}-${String(dt.getDate()).padStart(2, "0")}`;
}

function esc(s) {
  return String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function copyText(text, key) {
  const done = () => {
    state.copiedKey = key;
    if (copyTimer) clearTimeout(copyTimer);
    if (key.startsWith("node:")) updateBrowserOnly();
    else render();
    copyTimer = setTimeout(() => {
      state.copiedKey = "";
      if (key.startsWith("node:")) updateBrowserOnly();
      else render();
    }, 1600);
  };
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(text).then(done).catch(() => { fallbackCopy(text); done(); });
  } else {
    fallbackCopy(text);
    done();
  }
}

function fallbackCopy(text) {
  const ta = document.createElement("textarea");
  ta.value = text;
  ta.style.position = "fixed";
  ta.style.opacity = "0";
  document.body.appendChild(ta);
  ta.select();
  try { document.execCommand("copy"); } catch {}
  document.body.removeChild(ta);
}

function buildUsageMarkdownReport(u) {
  const k = u.kpi;
  if (state.lang === "en") {
    return [
      `# Antigravity Context Lens Summary (${u.spanStart} to ${u.spanEnd})`,
      "",
      `- **Active Sessions**: ${k.activeSessions} (${k.totalSessions} scanned)`,
      `- **Total Tokens**: ${fmtTok(k.totalTokens)} (${k.turns} turns / ${k.requests} steps, ${k.cacheHitPct}% cache hit)`,
      `- **Est. Cost**: ${fmtUsd(k.usd)} (saved ${fmtUsd(k.savedUsd)} via cache)`,
      `- **Tools & Latency**: ${k.toolCalls} tool calls · ${fmtDur(k.activeMs)} active (${k.tokPerSec} tok/s)`,
      "",
      "## Models",
      ...(u.models || []).slice(0, 8).map((m) => `- ${m.label}: ${fmtTok(m.totalTokens)} (${m.sessionCount} sessions · ${fmtUsd(m.usd)})`),
      "",
      "## Top Sessions",
      ...(u.sessions || []).slice(0, 8).map((s) => `- ${s.title} [${fmtWs(s.workspace)}]: ${fmtTok(s.totalTokens)} · window ${fmtTok(s.currentPromptTokens)} (${s.windowPct}%) · ${fmtUsd(s.usd)}`),
    ].join("\n");
  }
  return [
    `# Antigravity 上下文透视摘要 (${u.spanStart} ~ ${u.spanEnd})`,
    "",
    `- **活跃会话**: ${k.activeSessions}（共扫描 ${k.totalSessions}）`,
    `- **Token 总消耗**: ${fmtTok(k.totalTokens)}（${k.turns} 轮 / ${k.requests} 步，缓存命中 ${k.cacheHitPct}%）`,
    `- **参考费用**: ${fmtUsd(k.usd)}（缓存节省 ${fmtUsd(k.savedUsd)}）`,
    `- **工具调用 / 活跃时长**: ${k.toolCalls} 次 · ${fmtDur(k.activeMs)}（输出速度 ${k.tokPerSec} tok/s）`,
    "",
    "## 模型分布",
    ...(u.models || []).slice(0, 8).map((m) => `- ${m.label}: ${fmtTok(m.totalTokens)} (${m.sessionCount} 会话 · ${fmtUsd(m.usd)})`),
    "",
    "## 主要会话",
    ...(u.sessions || []).slice(0, 8).map((s) => `- ${s.title} [${fmtWs(s.workspace)}]: ${fmtTok(s.totalTokens)} · 窗口 ${fmtTok(s.currentPromptTokens)} (${s.windowPct}%) · ${fmtUsd(s.usd)}`),
  ].join("\n");
}

function getTipEl() {
  let el = document.getElementById("agy-tip");
  if (!el) {
    el = document.createElement("div");
    el.id = "agy-tip";
    el.className = "agy-tip";
    document.body.appendChild(el);
  }
  return el;
}

function hideTip() {
  const el = document.getElementById("agy-tip");
  if (el) el.classList.remove("show");
}

function showTip(text, clientX, clientY) {
  if (!text) return hideTip();
  const el = getTipEl();
  el.textContent = text;
  el.classList.add("show");
  const rect = el.getBoundingClientRect();
  const pad = 10;
  let left = clientX + 12;
  let top = clientY + 14;
  if (left + rect.width > window.innerWidth - pad) left = Math.max(pad, clientX - rect.width - 12);
  if (top + rect.height > window.innerHeight - pad) top = Math.max(pad, clientY - rect.height - 12);
  el.style.left = `${Math.round(left)}px`;
  el.style.top = `${Math.round(top)}px`;
}

// ---------------------------------------------------------------------------
// Server Calls
// ---------------------------------------------------------------------------

function resetSessionViewState() {
  state.expandedGroups = new Set();
  state.expandedNodes = new Set();
  state.fullTexts = {};
  state.loadingNodeId = null;
  state.catFilter = "all";
  state.nodeSearch = "";
  state.pinnedIdx = null;
  state.browserScope = "window";
}

async function fetchUsage(range = state.range, filterDay = state.filterDay, forceRefresh = false, startDay = "", endDay = "") {
  hideTip();
  state.loading = true;
  state.range = range;
  state.filterDay = filterDay;
  state.startDay = startDay;
  state.endDay = endDay;
  state.sessionPage = 1;
  render();
  try {
    const res = await app.callServerTool({
      name: "app_get_usage",
      arguments: {
        range,
        filterDay: filterDay || undefined,
        startDay: startDay || undefined,
        endDay: endDay || undefined,
        forceRefresh: forceRefresh || undefined,
      },
    });
    if (res?.structuredContent?.usage) state.usage = res.structuredContent.usage;
  } finally {
    state.loading = false;
    render();
  }
}

async function fetchSession(convId, { drill = false, forceRefresh = false, silent = false } = {}) {
  if (!silent) hideTip();
  const prevId = state.session?.summary?.id;
  if (convId && convId !== prevId) resetSessionViewState();
  const savedScroll = silent ? window.scrollY : 0;
  const savedGrpScrolls = {};
  const savedPreScrolls = {};
  if (silent) {
    document.querySelectorAll(".grp-body[data-grp]").forEach((el) => { savedGrpScrolls[el.dataset.grp] = el.scrollTop; });
    document.querySelectorAll("pre[data-node]").forEach((el) => { savedPreScrolls[el.dataset.node] = el.scrollTop; });
  }
  if (drill) state.drillSession = true;
  if (!silent) {
    state.loading = true;
    render();
  }
  try {
    const res = await app.callServerTool({
      name: "app_get_session",
      arguments: { conversationId: convId, forceRefresh: forceRefresh || undefined },
    });
    if (res?.structuredContent?.session) {
      state.session = res.structuredContent.session;
      state.lastMtimeMs = state.session.summary?.mtimeMs || 0;
      state.lastFileSize = state.session.summary?.fileSize || 0;
    }
    if (res?.structuredContent?.sessionList) state.sessionList = res.structuredContent.sessionList;
  } finally {
    if (!silent) state.loading = false;
    render();
    if (silent) {
      if (savedScroll > 0) window.scrollTo(0, savedScroll);
      for (const [k, top] of Object.entries(savedGrpScrolls)) {
        const el = document.querySelector(`.grp-body[data-grp="${k}"]`);
        if (el) el.scrollTop = top;
      }
      for (const [k, top] of Object.entries(savedPreScrolls)) {
        const el = document.querySelector(`pre[data-node="${k}"]`);
        if (el) el.scrollTop = top;
      }
    }
  }
}

async function toggleNodeExpand(node) {
  const convId = state.session?.summary?.id || "";
  const cacheKey = `${convId}:${node.id}`;
  if (state.expandedNodes.has(node.id)) {
    state.expandedNodes.delete(node.id);
    updateBrowserOnly();
    return;
  }
  state.expandedNodes.add(node.id);
  updateBrowserOnly();
  if (node.truncated && !state.fullTexts[cacheKey] && state.session) {
    state.loadingNodeId = node.id;
    updateBrowserOnly();
    try {
      const res = await app.callServerTool({
        name: "app_read_node_full",
        arguments: { conversationId: convId, lineNo: Number(node.lineNo), stepSeq: Number(node.seq), cat: node.cat || "" },
      });
      if (res?.structuredContent?.fullText) state.fullTexts[cacheKey] = res.structuredContent.fullText;
    } finally {
      state.loadingNodeId = null;
      updateBrowserOnly();
    }
  }
}

// ---------------------------------------------------------------------------
// Chart Primitives
// ---------------------------------------------------------------------------

function buildDonutRing(segments, centerTop, centerBot, size = 104, strokeW = 11) {
  const valid = segments.filter((s) => s.val > 0);
  const total = valid.reduce((acc, s) => acc + s.val, 0);
  const cx = size / 2, cy = size / 2, r = (size - strokeW - 4) / 2, circ = 2 * Math.PI * r;
  let arcs = "";
  if (total <= 0) {
    arcs = `<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="var(--border)" stroke-width="${strokeW}"/>`;
  } else {
    let offset = 0;
    arcs = valid
      .map((s) => {
        const len = (s.val / total) * circ;
        const drawLen = Math.max(0.5, len - (valid.length > 1 && len > 3 ? 1.2 : 0));
        const tip = `${s.label}: ${s.valFormatted || fmtTok(s.val)} (${((s.val / total) * 100).toFixed(1)}%)`;
        const seg = `<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${s.color}" stroke-width="${strokeW}"
          stroke-dasharray="${drawLen.toFixed(2)} ${(circ - drawLen).toFixed(2)}"
          stroke-dashoffset="${(-offset).toFixed(2)}" transform="rotate(-90 ${cx} ${cy})"
          class="donut-seg" data-tip="${esc(tip)}"/>`;
        offset += len;
        return seg;
      })
      .join("");
  }
  const topFontSize = size <= 72 ? 11.5 : 13.5;
  const botFontSize = size <= 72 ? 9.5 : 10.5;
  return `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" class="donut-svg">
    ${arcs}
    <text x="${cx}" y="${cy - 2}" text-anchor="middle" fill="var(--fg)" font-size="${topFontSize}" font-weight="700" class="num">${esc(centerTop)}</text>
    <text x="${cx}" y="${cy + 12}" text-anchor="middle" fill="var(--muted)" font-size="${botFontSize}">${esc(centerBot)}</text>
  </svg>`;
}

function buildMiniProgressRing(pct, size = 18) {
  const clamped = Math.max(0, Math.min(100, Number(pct || 0)));
  const r = (size - 3) / 2, circ = 2 * Math.PI * r, fill = (clamped / 100) * circ;
  const color = clamped >= 80 ? "#ef4444" : clamped >= 55 ? "#f59e0b" : "#3b82f6";
  return `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" style="flex:none">
    <circle cx="${size / 2}" cy="${size / 2}" r="${r}" fill="none" stroke="var(--border)" stroke-width="2.2"/>
    <circle cx="${size / 2}" cy="${size / 2}" r="${r}" fill="none" stroke="${color}" stroke-width="2.2"
      stroke-dasharray="${fill.toFixed(2)} ${(circ - fill).toFixed(2)}" transform="rotate(-90 ${size / 2} ${size / 2})" stroke-linecap="round"/>
  </svg>`;
}

function buildPaired7DayChart(days) {
  const t = L();
  const W = 450, H = 172, leftPad = 42, rightPad = 42, topPad = 18, botPad = 24;
  const plotW = W - leftPad - rightPad, plotH = H - topPad - botPad;
  const maxTok = Math.max(...days.map((d) => d.tokens), 1000);
  const maxUsd = Math.max(...days.map((d) => d.usd), 0.01);

  let grid = "";
  for (let i = 0; i <= 4; i++) {
    const frac = i / 4, y = topPad + plotH * (1 - frac);
    grid += `
      <line x1="${leftPad}" y1="${y.toFixed(1)}" x2="${W - rightPad}" y2="${y.toFixed(1)}" stroke="var(--grid-line)" stroke-dasharray="${i === 0 ? "" : "2 3"}"/>
      <text x="${leftPad - 6}" y="${(y + 3.5).toFixed(1)}" text-anchor="end" fill="var(--muted)" font-size="9.5" class="num">${frac === 0 ? "0" : fmtTok(maxTok * frac)}</text>
      <text x="${W - rightPad + 6}" y="${(y + 3.5).toFixed(1)}" text-anchor="start" fill="var(--muted)" font-size="9.5" class="num">${frac === 0 ? "0" : `$${(maxUsd * frac).toFixed(2)}`}</text>`;
  }

  const slotW = plotW / Math.max(1, days.length);
  const barW = days.length > 10 ? 6 : days.length > 7 ? 8 : 10;
  const xFont = days.length > 10 ? 8.2 : 9.5;
  let bars = "";

  days.forEach((d, idx) => {
    const cx = leftPad + idx * slotW + slotW / 2;
    const hTok = d.tokens > 0 ? Math.max(3, (d.tokens / maxTok) * plotH) : 0;
    const hUsd = d.usd > 0 ? Math.max(3, (d.usd / maxUsd) * plotH) : 0;
    const yTok = topPad + plotH - hTok, yUsd = topPad + plotH - hUsd;
    const topBarY = Math.min(hTok > 0 ? yTok : topPad + plotH, hUsd > 0 ? yUsd : topPad + plotH);
    const isSel = state.filterDay === d.day;
    const tip = state.lang === "en"
      ? `${d.day}\nTokens: ${fmtTok(d.tokens)} (${d.requests} calls)\nEst. Cost: ${fmtUsd(d.usd)}\nClick to filter day`
      : `${d.day}\nToken 消耗: ${fmtTok(d.tokens)} (${d.requests} 次请求)\n参考费用: ${fmtUsd(d.usd)}\n点击按该日筛选`;
    const showValLabel = d.tokens > 0 && (days.length <= 9 || hTok > 12);

    bars += `<g class="bar-pair" data-action="day-filter" data-val="${d.day}" data-tip="${esc(tip)}">
      <rect x="${(leftPad + idx * slotW + 2).toFixed(1)}" y="${topPad - 8}" width="${(slotW - 4).toFixed(1)}" height="${plotH + 24}" rx="4" fill="${isSel ? "var(--hover)" : "transparent"}"/>
      ${hTok > 0 ? `<rect x="${(cx - barW - 1.2).toFixed(1)}" y="${yTok.toFixed(1)}" width="${barW}" height="${hTok.toFixed(1)}" rx="2.2" fill="#2563eb"/>` : ""}
      ${hUsd > 0 ? `<rect x="${(cx + 1.2).toFixed(1)}" y="${yUsd.toFixed(1)}" width="${barW}" height="${hUsd.toFixed(1)}" rx="2.2" fill="#22c55e"/>` : ""}
      ${showValLabel ? `<text x="${cx.toFixed(1)}" y="${Math.max(11, topBarY - 5).toFixed(1)}" text-anchor="middle" fill="var(--fg)" font-size="${days.length > 9 ? 8 : 9}" class="num">${fmtTok(d.tokens)}</text>` : ""}
      <text x="${cx.toFixed(1)}" y="${H - 6}" text-anchor="middle" fill="${isSel ? "var(--fg)" : "var(--muted)"}" font-weight="${isSel ? "700" : "400"}" font-size="${xFont}" class="num">${d.day.slice(5)}</text>
    </g>`;
  });

  return `<svg class="paired-svg" viewBox="0 0 ${W} ${H}">${grid}${bars}</svg>
    <div class="paired-legend">
      <span><i class="sq" style="background:#2563eb"></i>Token</span>
      <span><i class="sq" style="background:#22c55e"></i>${esc(t.legendCost)}</span>
    </div>`;
}

function buildRankedListCard(iconSvg, titleHtml, rightMeta, items, unitSuffix = "") {
  const t = L();
  const maxCnt = Math.max(...items.map((x) => x.val), 1);
  const rows = items
    .slice(0, 8)
    .map((it, idx) => {
      const color = ROW_PALETTE[idx % ROW_PALETTE.length];
      const w = Math.max(4, Math.round((it.val / maxCnt) * 100));
      let isActive = false;
      if (it.filterType === "model") isActive = state.modelGroupFilter === it.filterVal;
      else if (it.filterType === "workspace") isActive = state.workspaceFilter === it.filterVal;
      else if (it.filterType === "skill") isActive = state.skillFilter === it.filterVal;
      else if (it.filterType === "tool") isActive = state.toolFilter === it.filterVal;
      else if (it.filterType === "program") isActive = state.programFilter === it.filterVal;
      const clickAttr = it.filterType
        ? `data-action="dim-filter" data-dim="${it.filterType}" data-val="${esc(it.filterVal)}" style="cursor:pointer" data-tip="${esc(t.clickFilterDim(it.name))}"`
        : "";
      return `<div class="rank-row ${isActive ? "active-row" : ""}" ${clickAttr}>
        <div class="rank-top">
          <span class="rank-name truncate"><i class="dot" style="background:${color}"></i>${esc(it.name)}</span>
          <span class="rank-val num">${esc(it.rightText || `×${it.val}${unitSuffix}`)}</span>
        </div>
        <div class="rank-track"><div class="rank-fill" style="width:${w}%;background:${color}"></div></div>
      </div>`;
    })
    .join("");

  return `<div class="card">
    <div class="card-hd">
      <span class="hd-title">${iconSvg}${titleHtml}</span>
      <span class="muted text-xs num">${esc(rightMeta)}</span>
    </div>
    <div class="rank-list">${rows || `<div class="empty-sm">${esc(t.noData)}</div>`}</div>
  </div>`;
}

function renderDropdown(id, currentVal, options) {
  const t = L();
  const cur = options.find((o) => o.value === currentVal) || options[0] || { label: t.pickSession, value: "" };
  const open = state.openDd === id;
  return `<div class="dd">
    <button type="button" class="dd-btn" data-action="dd-toggle" data-dd="${id}">
      <span class="truncate">${esc(cur.label)}</span>
      ${ICONS.chevDown}
    </button>
    ${
      open
        ? `<div class="dd-menu">
            ${options
              .map(
                (o) => `<button type="button" class="dd-opt ${o.value === currentVal ? "on" : ""}" data-action="dd-pick" data-dd="${id}" data-val="${esc(o.value)}">
                  <span class="truncate">${o.running ? `<i class="run-dot"></i>` : ""}${esc(o.label)}</span>
                  ${o.meta ? `<span class="num muted">${esc(o.meta)}</span>` : ""}
                </button>`
              )
              .join("")}
          </div>`
        : ""
    }
  </div>`;
}

function renderLangToggleBtn() {
  return `<button type="button" class="icon-btn lang-btn num" data-action="toggle-lang" data-tip="${state.lang === "zh" ? "Switch to English" : "切换为中文"}">${state.lang === "zh" ? "EN" : "中"}</button>`;
}

// ---------------------------------------------------------------------------
// SURFACE 1: Global "Context Lens" / "上下文透视"
// ---------------------------------------------------------------------------

function renderInsightsDashboard() {
  const t = L();
  const u = state.usage;
  if (!u) return `<div class="empty">${esc(t.loading)}</div>`;
  const k = u.kpi;
  const ranges = [["today", t.today], ["7d", t.d7], ["30d", t.d30], ["all", t.all]];
  const cats = getTokenCats();

  const weeks = u.calendarWeeks || [];
  const metricKey = state.heatMetric === "sessions" ? "sessions" : "tokens";
  const maxHeat = Math.max(...weeks.flatMap((w) => w.days.map((d) => d[metricKey] || 0)), 1);

  const calendarHtml = `<div class="cal-box">
    <div class="cal-grid-wrap">
      <div class="cal-wds"><span class="cal-m-space"></span>${t.wds.map((w) => `<span>${w}</span>`).join("")}</div>
      <div class="cal-cols">
        ${weeks
          .map((w) => {
            const mLbl = w.monthNum ? (state.lang === "zh" ? `${w.monthNum}月` : EN_MONTHS[w.monthNum] || "") : w.monthLabel || "";
            return `<div class="cal-col">
              <span class="cal-m">${esc(mLbl)}</span>
              ${w.days
                .map((c) => {
                  if (c.isFuture) return `<span class="cal-cell future"></span>`;
                  const v = c[metricKey] || 0;
                  const lv = v <= 0 ? 0 : v < maxHeat * 0.18 ? 1 : v < maxHeat * 0.42 ? 2 : v < maxHeat * 0.72 ? 3 : 4;
                  const sel = state.filterDay === c.day;
                  const tip = state.lang === "en"
                    ? `${c.day}\nTokens: ${fmtTok(c.tokens)}\nSessions: ${c.sessions} (${c.requests} steps)\nEst. Cost: ${fmtUsd(c.usd)}`
                    : `${c.day}\nToken 消耗: ${fmtTok(c.tokens)}\n活跃会话: ${c.sessions} 个 (${c.requests} 步)\n参考费用: ${fmtUsd(c.usd)}`;
                  return `<button type="button" class="cal-cell lv-${lv} ${sel ? "sel" : ""}" data-action="day-filter" data-val="${c.day}" data-tip="${esc(tip)}"></button>`;
                })
                .join("")}
            </div>`;
          })
          .join("")}
      </div>
    </div>
    <div class="cal-legend">
      <span>${esc(t.less)}</span><i class="cal-cell lv-0"></i><i class="cal-cell lv-1"></i><i class="cal-cell lv-2"></i><i class="cal-cell lv-3"></i><i class="cal-cell lv-4"></i><span>${esc(t.more)}</span>
    </div>
  </div>`;

  const tokenSegs = cats.map((c) => ({ ...c, val: Math.max(0, u.compTotals?.[c.key] || 0) }));
  const compSum = tokenSegs.reduce((a, b) => a + b.val, 0) || 1;
  const tokenBreakdownCells = tokenSegs
    .map((c) => {
      const pct = ((c.val / compSum) * 100).toFixed(1);
      const scaledTok = Math.round((c.val / compSum) * k.totalTokens);
      return `<div class="bd-item">
        <div class="bd-top">
          <span class="bd-name"><i class="sq" style="background:${c.color}"></i>${esc(c.label)}</span>
          <strong class="num">${pct}%</strong>
        </div>
        <div class="bd-bar"><div style="width:${Math.min(100, Number(pct))}%;background:${c.color}"></div></div>
        <div class="bd-sub num">≈${fmtTok(scaledTok)}</div>
      </div>`;
    })
    .join("");

  const tm = u.timing || {};
  const timingItems = [
    { key: "waitMs", label: t.tmWait, color: "#3b82f6", val: tm.waitMs || 0, valFormatted: fmtDur(tm.waitMs), sub: `${fmtDur(tm.waitMs)} · ${k.requests}${t.timesSuffix}` },
    { key: "thinkMs", label: t.tmThink, color: "#a855f7", val: tm.thinkMs || 0, valFormatted: fmtDur(tm.thinkMs), sub: `${fmtDur(tm.thinkMs)} · ${tm.thinkingBlocks || 0}${t.blocksSuffix}` },
    { key: "replyMs", label: t.tmReply, color: "#ec4899", val: tm.replyMs || 0, valFormatted: fmtDur(tm.replyMs), sub: `${fmtDur(tm.replyMs)} · ${tm.replyBlocks || 0}${t.blocksSuffix}` },
    { key: "toolArgMs", label: t.tmToolArg, color: "#f59e0b", val: tm.toolArgMs || 0, valFormatted: fmtDur(tm.toolArgMs), sub: `${fmtDur(tm.toolArgMs)} · ${tm.toolArgBlocks || 0}${t.blocksSuffix}` },
    { key: "toolExecMs", label: t.tmToolExec, color: "#10b981", val: tm.toolExecMs || 0, valFormatted: fmtDur(tm.toolExecMs), sub: `${fmtDur(tm.toolExecMs)} · ${k.toolCalls}${t.timesSuffix}` },
    { key: "otherMs", label: t.tmOther, color: "#64748b", val: tm.otherMs || 0, valFormatted: fmtDur(tm.otherMs), sub: `${fmtDur(tm.otherMs)} · ${t.schedOverhead}` },
  ];
  const tmSum = timingItems.reduce((a, b) => a + b.val, 0) || 1;
  const timingCells = timingItems
    .map((ti) => {
      const pct = ((ti.val / tmSum) * 100).toFixed(1);
      return `<div class="bd-item">
        <div class="bd-top">
          <span class="bd-name"><i class="sq" style="background:${ti.color}"></i>${esc(ti.label)}</span>
          <strong class="num">${pct}%</strong>
        </div>
        <div class="bd-bar"><div style="width:${Math.min(100, Number(pct))}%;background:${ti.color}"></div></div>
        <div class="bd-sub num">${esc(ti.sub)}</div>
      </div>`;
    })
    .join("");

  const isWsMode = state.rank1Mode === "workspace";
  const rank1Items = isWsMode
    ? (u.workspaces || []).map((w) => ({
        name: fmtWs(w.name),
        val: w.totalTokens,
        rightText: `×${w.sessionCount} · ${fmtTok(w.totalTokens)}`,
        filterType: "workspace",
        filterVal: w.name,
      }))
    : (u.models || []).map((m) => ({
        name: m.label,
        val: m.totalTokens,
        rightText: `×${m.sessionCount} · ${fmtTok(m.totalTokens)}`,
        filterType: "model",
        filterVal: m.shortGroup,
      }));
  const rank1ToggleHtml = `<div class="seg-pill xs">
    <button type="button" class="${!isWsMode ? "white-on" : ""}" data-action="rank1-mode" data-val="model">${esc(t.modelTab)}</button>
    <button type="button" class="${isWsMode ? "white-on" : ""}" data-action="rank1-mode" data-val="workspace">${esc(t.wsTab)}</button>
  </div>`;
  const rank1Meta = isWsMode ? t.wsCount((u.workspaces || []).length) : t.modelCount((u.models || []).length, fmtTok(k.totalTokens));

  const skillRankItems = (u.skills || []).map((x) => ({ name: x.name, val: x.count, filterType: "skill", filterVal: x.name }));
  const toolRankItems = (u.tools || []).map((x) => ({ name: x.name, val: x.count, filterType: "tool", filterVal: x.name }));
  const progRankItems = (u.programs || []).map((x) => ({ name: x.name, val: x.count, filterType: "program", filterVal: x.name }));
  const totalSkillLoads = (u.skills || []).reduce((s, x) => s + x.count, 0);
  const totalProgRuns = (u.programs || []).reduce((s, x) => s + x.count, 0);
  const subagentCount = (u.sessions || []).filter((s) => s.isSubagent).length;
  const sesZone = buildSessionResultsHtml(u);
  const dateOpen = state.openDd === "date-picker";
  const barTitle = u.range === "custom" ? t.spanDaily((u.recent7Days || []).length) : t.recent7d;

  return `<div class="dash-wrap">
    <div class="dash-topbar">
      <div class="row-gap wrap">
        <h1 class="dash-h1">${esc(t.brand)}</h1>
        ${state.filterDay ? `<button type="button" class="top-chip active-chip" data-action="clear-day">${esc(t.filterDayChip(state.filterDay))}</button>` : ""}
        ${state.modelGroupFilter ? `<button type="button" class="top-chip active-chip" data-action="dim-filter" data-dim="model" data-val="">${esc(t.filterModelChip(state.modelGroupFilter))}</button>` : ""}
        ${state.workspaceFilter ? `<button type="button" class="top-chip active-chip" data-action="dim-filter" data-dim="workspace" data-val="">${esc(t.filterWsChip(fmtWs(state.workspaceFilter)))}</button>` : ""}
        ${state.skillFilter ? `<button type="button" class="top-chip active-chip" data-action="dim-filter" data-dim="skill" data-val="">${esc(t.filterSkillChip(state.skillFilter))}</button>` : ""}
        ${state.toolFilter ? `<button type="button" class="top-chip active-chip" data-action="dim-filter" data-dim="tool" data-val="">${esc(t.filterToolChip(state.toolFilter))}</button>` : ""}
        ${state.programFilter ? `<button type="button" class="top-chip active-chip" data-action="dim-filter" data-dim="program" data-val="">${esc(t.filterProgChip(state.programFilter))}</button>` : ""}
      </div>
      <div class="row-gap wrap">
        <div class="dd">
          <button type="button" class="date-span num ${u.range === "custom" ? "active-chip" : ""}" data-action="dd-toggle" data-dd="date-picker" data-tip="${esc(t.customDateTip)}">
            <span>${esc(u.spanStart)} → ${esc(u.spanEnd)}</span>${ICONS.chevDown}
          </button>
          ${
            dateOpen
              ? `<div class="date-pop">
                  <div class="row-gap wrap" style="margin-bottom:8px">
                    <button type="button" class="pill-filter" data-action="quick-span" data-val="14d">${esc(t.d14)}</button>
                    <button type="button" class="pill-filter" data-action="quick-span" data-val="week">${esc(t.thisWeek)}</button>
                    <button type="button" class="pill-filter" data-action="quick-span" data-val="month">${esc(t.thisMonth)}</button>
                  </div>
                  <div class="dp-row">
                    <label><span>${esc(t.start)}</span><input id="dp-start" type="date" value="${esc(u.spanStart)}" /></label>
                    <label><span>${esc(t.end)}</span><input id="dp-end" type="date" value="${esc(u.spanEnd)}" /></label>
                  </div>
                  <div class="row-gap" style="justify-content:flex-end;margin-top:10px">
                    <button type="button" class="top-chip" style="height:24px" data-action="range" data-val="30d">${esc(t.reset)}</button>
                    <button type="button" class="pill-filter white-on" data-action="apply-dates">${esc(t.applySpan)}</button>
                  </div>
                </div>`
              : ""
          }
        </div>
        <div class="seg-pill">
          ${ranges
            .map(([id, lbl]) => `<button type="button" class="${state.range === id && !state.filterDay ? "white-on" : ""}" data-action="range" data-val="${id}">${esc(lbl)}</button>`)
            .join("")}
        </div>
        ${renderLangToggleBtn()}
        <button type="button" class="icon-btn" data-action="copy-report" data-tip="${esc(state.copiedKey === "report" ? t.copiedReportTip : t.copyReportTip)}">${state.copiedKey === "report" ? ICONS.check : ICONS.copy}</button>
        <button type="button" class="icon-btn ${state.loading ? "is-loading" : ""}" data-action="refresh" data-tip="${esc(t.refreshTip)}">${ICONS.refresh}</button>
      </div>
    </div>

    <div class="row1-grid">
      <div class="kpi-6-grid">
        <div class="card kpi-box"><div class="kpi-lbl">${esc(t.kpiSessions)}</div><div class="kpi-big num">${k.activeSessions}</div><div class="kpi-sub">${esc(t.kpiScanned(k.totalSessions))}</div></div>
        <div class="card kpi-box"><div class="kpi-lbl">${esc(t.kpiTokens)}</div><div class="kpi-big num">${fmtTok(k.totalTokens)}</div><div class="kpi-sub">${esc(t.kpiTurns(k.turns))}</div></div>
        <div class="card kpi-box"><div class="kpi-lbl">${esc(t.kpiCost)}</div><div class="kpi-big num">${fmtUsd(k.usd)}</div><div class="kpi-sub">${esc(t.kpiSaved(fmtUsd(k.savedUsd)))}</div></div>
        <div class="card kpi-box"><div class="kpi-lbl">${esc(t.kpiCache)}</div><div class="kpi-big num">${k.cacheHitPct}%</div><div class="kpi-sub">${esc(t.kpiCacheSes(k.cacheSessions))}</div></div>
        <div class="card kpi-box"><div class="kpi-lbl">${esc(t.kpiTools)}</div><div class="kpi-big num">${fmtTok(k.toolCalls)}</div><div class="kpi-sub">${esc(t.kpiToolExec(fmtDur(k.toolExecMs)))}</div></div>
        <div class="card kpi-box"><div class="kpi-lbl">${esc(t.kpiActive)}</div><div class="kpi-big num">${fmtDur(k.activeMs)}</div><div class="kpi-sub">${esc(t.kpiReqs(fmtTok(k.requests)))}</div></div>
      </div>

      <div class="card">
        <div class="card-hd"><span class="hd-title">${ICONS.db}<span>${esc(barTitle)}</span></span></div>
        ${buildPaired7DayChart(u.recent7Days || [])}
      </div>

      <div class="card">
        <div class="card-hd">
          <span class="hd-title">${ICONS.gauge}<span>${esc(t.activity)}</span></span>
          <div class="row-gap">
            <span class="muted text-xs">${esc(t.filterByDate)}</span>
            <div class="seg-pill sm">
              <button type="button" class="${state.heatMetric === "sessions" ? "white-on" : ""}" data-action="heat-metric" data-val="sessions">${esc(t.sessionsLbl)}</button>
              <button type="button" class="${state.heatMetric === "tokens" ? "white-on" : ""}" data-action="heat-metric" data-val="tokens">${esc(t.tokUsageLbl)}</button>
            </div>
          </div>
        </div>
        ${calendarHtml}
      </div>
    </div>

    <div class="row2-grid">
      <div class="card">
        <div class="card-hd"><span class="hd-title">${ICONS.db}<span>${esc(t.tokStats)}</span></span></div>
        <div class="donut-split">
          ${buildDonutRing(tokenSegs, fmtTok(k.totalTokens), t.totalVol, 108, 12)}
          <div class="bd-grid">${tokenBreakdownCells}</div>
        </div>
      </div>

      <div class="card">
        <div class="card-hd">
          <span class="hd-title">${ICONS.clock}<span>${esc(t.timingStats)}</span></span>
          <span class="muted text-xs num">${esc(t.outSpeed(k.tokPerSec))}</span>
        </div>
        <div class="donut-split">
          ${buildDonutRing(timingItems, fmtDur(k.activeMs), t.activeDur, 108, 12)}
          <div class="bd-grid">${timingCells}</div>
        </div>
      </div>
    </div>

    <div class="row3-grid">
      ${buildRankedListCard(ICONS.folder, rank1ToggleHtml, rank1Meta, rank1Items)}
      ${buildRankedListCard(ICONS.book, `<span>${esc(t.skillTitle)}</span>`, t.skillMeta((u.skills || []).length, totalSkillLoads), skillRankItems)}
      ${buildRankedListCard(ICONS.code, `<span>${esc(t.toolTitle)}</span>`, t.toolMeta((u.tools || []).length, fmtTok(k.toolCalls)), toolRankItems)}
      ${buildRankedListCard(ICONS.term, `<span>${esc(t.cmdTitle)}</span>`, t.cmdMeta((u.programs || []).length, totalProgRuns), progRankItems)}
    </div>

    <div class="ses-section">
      <div class="ses-header-bar">
        <div class="row-gap">
          <strong style="font-size:14px">${esc(t.sessionsLbl)}</strong>
          <span id="ses-count-pill" class="count-pill num">${sesZone.count}</span>
        </div>
        <label class="search-box">
          ${ICONS.search}
          <input id="ses-search" type="search" placeholder="${esc(t.searchSesPh)}" value="${esc(state.sessionSearch)}" autocomplete="off" />
        </label>
        ${
          subagentCount > 0
            ? `<button type="button" class="top-chip ${state.hideSubagents ? "active-chip" : ""}" data-action="toggle-subagents">${esc(state.hideSubagents ? t.hiddenSub(subagentCount) : t.hideSub(subagentCount))}</button>`
            : ""
        }
        <div class="seg-pill">
          <button type="button" class="${state.sessionSort === "recent" ? "white-on" : ""}" data-action="ses-sort" data-val="recent">${esc(t.sortRecent)}</button>
          <button type="button" class="${state.sessionSort === "tokens" ? "white-on" : ""}" data-action="ses-sort" data-val="tokens">${esc(t.sortTokens)}</button>
          <button type="button" class="${state.sessionSort === "window" ? "white-on" : ""}" data-action="ses-sort" data-val="window">${esc(t.sortWindow)}</button>
        </div>
      </div>

      <div id="ses-results-zone">${sesZone.html}</div>
    </div>
  </div>`;
}

function buildSessionResultsHtml(u) {
  const t = L();
  const cats = getTokenCats();
  const baseSessions = (u.sessions || []).filter((s) => !(state.hideSubagents && s.isSubagent));
  const groupCounts = {};
  for (const s of baseSessions) {
    const groups = Array.isArray(s.modelGroups) && s.modelGroups.length ? s.modelGroups : [s.modelGroup];
    for (const g of groups) groupCounts[g] = (groupCounts[g] || 0) + 1;
  }
  const groupChips = Object.entries(groupCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(
      ([g, cnt]) =>
        `<button type="button" class="pill-filter ${state.modelGroupFilter === g ? "white-on" : ""}" data-action="dim-filter" data-dim="model" data-val="${esc(g)}">${esc(g)} <span class="num">${cnt}</span></button>`
    )
    .join("");

  let filteredSessions = baseSessions.slice();
  if (state.modelGroupFilter) {
    filteredSessions = filteredSessions.filter((s) =>
      Array.isArray(s.modelGroups) ? s.modelGroups.includes(state.modelGroupFilter) : s.modelGroup === state.modelGroupFilter
    );
  }
  if (state.workspaceFilter) filteredSessions = filteredSessions.filter((s) => s.workspace === state.workspaceFilter);
  if (state.skillFilter) filteredSessions = filteredSessions.filter((s) => Array.isArray(s.skills) && s.skills.includes(state.skillFilter));
  if (state.toolFilter) filteredSessions = filteredSessions.filter((s) => Array.isArray(s.tools) && s.tools.includes(state.toolFilter));
  if (state.programFilter) filteredSessions = filteredSessions.filter((s) => Array.isArray(s.programs) && s.programs.includes(state.programFilter));
  if (state.sessionSearch.trim()) {
    const q = state.sessionSearch.trim().toLowerCase();
    filteredSessions = filteredSessions.filter(
      (s) =>
        s.title.toLowerCase().includes(q) ||
        s.lastUser.toLowerCase().includes(q) ||
        fmtWs(s.workspace).toLowerCase().includes(q) ||
        s.modelLabel.toLowerCase().includes(q) ||
        (Array.isArray(s.modelGroups) && s.modelGroups.some((g) => g.toLowerCase().includes(q)))
    );
  }
  filteredSessions.sort((a, b) => {
    if (state.sessionSort === "tokens") return b.totalTokens - a.totalTokens;
    if (state.sessionSort === "window") return b.currentPromptTokens - a.currentPromptTokens;
    return String(b.updatedAt).localeCompare(String(a.updatedAt));
  });

  const pageSize = 12;
  const totalPages = Math.max(1, Math.ceil(filteredSessions.length / pageSize));
  const curPage = Math.min(state.sessionPage, totalPages);
  const pagedSessions = filteredSessions.slice((curPage - 1) * pageSize, curPage * pageSize);

  const sessionCardsHtml = pagedSessions
    .map((s) => {
      const { rel, day } = fmtRelDay(s.updatedAt);
      const sSegs = cats.map((c) => ({ ...c, val: Math.max(0, s.comp?.[c.key] || 0) }));
      const isRunning = s.runState === "RUN_STATE_RUNNING";
      const extraModels = (s.modelGroups?.length || 1) - 1;
      return `<div class="ses-card" data-action="open-session" data-id="${s.id}">
        <div class="ses-card-top">
          <div class="ses-card-title">${esc(s.title)}</div>
          <div class="ses-card-time num">
            <div>${isRunning ? `<i class="run-dot" data-tip="${esc(t.running)}"></i>` : ""}${s.archived ? `<span class="tag-archived">${esc(t.archived)}</span> ` : ""}${s.isSubagent ? `<span class="tag-archived">${esc(t.subagent)}</span> ` : ""}${esc(rel)}</div>
            <div class="faint">${esc(day)}</div>
          </div>
        </div>
        <div class="row-gap wrap" style="gap:5px">
          <span class="tag-group">${esc(s.modelGroup)}${extraModels > 0 ? ` +${extraModels}` : ""}</span>
          ${s.workspace && s.workspace !== "通用对话" ? `<span class="tag-ws truncate">${esc(fmtWs(s.workspace))}</span>` : ""}
        </div>
        <div class="ses-card-mid">
          ${buildDonutRing(sSegs, fmtTok(s.currentPromptTokens), `${s.windowPct}%`, 64, 7)}
          <div class="ses-kv">
            <div class="kv-row"><span>${esc(t.turnsRow)}</span><strong class="num">${esc(t.turnsVal(s.turns, s.requests))}</strong></div>
            <div class="kv-row"><span>${esc(t.totalTokRow)}</span><strong class="num">${fmtTok(s.totalTokens)}</strong></div>
            <div class="kv-row"><span>${esc(t.totalUsdRow)}</span><strong class="num">${fmtUsd(s.usd)}</strong></div>
          </div>
        </div>
        <div class="ses-card-foot truncate">
          <span class="faint">${esc(t.lastMsg)}</span> ${esc(s.lastUser || s.title)}
        </div>
      </div>`;
    })
    .join("");

  const html = `
    <div class="row-gap wrap" style="margin: 10px 0 12px">
      <button type="button" class="pill-filter ${!state.modelGroupFilter ? "white-on" : ""}" data-action="dim-filter" data-dim="model" data-val="">${esc(t.all)} <span class="num">${baseSessions.length}</span></button>
      ${groupChips}
    </div>
    <div class="ses-cards-grid">${sessionCardsHtml || `<div class="empty">${esc(t.noMatchSes)}</div>`}</div>
    ${
      totalPages > 1
        ? `<div class="pager num">
            <button type="button" class="page-btn" data-action="page" data-val="${Math.max(1, curPage - 1)}" ${curPage <= 1 ? "disabled" : ""}>‹</button>
            <span>${esc(t.pageInfo(curPage, totalPages))}</span>
            <button type="button" class="page-btn" data-action="page" data-val="${Math.min(totalPages, curPage + 1)}" ${curPage >= totalPages ? "disabled" : ""}>›</button>
          </div>`
        : ""
    }`;

  return { count: filteredSessions.length, html };
}

function updateSessionResultsOnly() {
  if (!state.usage) return;
  const zone = document.getElementById("ses-results-zone");
  const pill = document.getElementById("ses-count-pill");
  if (!zone) return;
  const res = buildSessionResultsHtml(state.usage);
  zone.innerHTML = res.html;
  if (pill) pill.textContent = String(res.count);
}

// ---------------------------------------------------------------------------
// SURFACE 2: Single-Session Dual-Column Context Anatomy
// ---------------------------------------------------------------------------

function buildTimelineSvg(series, pinnedIdx, mode, unitLabel) {
  const t = L();
  const cats = getTokenCats();
  if (!series || series.length === 0) return `<div class="empty-sm">${esc(t.noData)}</div>`;
  const W = 560, H = 98, topY = 10, botY = 92, chartH = botY - topY, n = series.length;
  const slotW = W / n, barW = Math.max(2.2, Math.min(16, slotW * 0.72));

  let out = "";
  if (mode === "total") {
    const maxVal = Math.max(...series.map((r) => r.promptTokens), 1);
    series.forEach((r, i) => {
      const x = i * slotW + (slotW - barW) / 2;
      const colH = Math.max(3, (r.promptTokens / maxVal) * chartH);
      const cSum = cats.reduce((s, c) => s + (r.comp?.[c.key] || 0), 0) || 1;
      let y = botY, rects = "";
      for (const c of cats) {
        const v = r.comp?.[c.key] || 0;
        if (v <= 0) continue;
        const sh = (v / cSum) * colH;
        y -= sh;
        rects += `<rect x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${barW.toFixed(1)}" height="${Math.max(0.6, sh).toFixed(1)}" fill="${c.color}"/>`;
      }
      const isPin = i === pinnedIdx;
      const tags = [];
      if (r.marker === "compaction") tags.push(state.lang === "en" ? "Compacted" : "上下文压缩");
      if (r.marker === "model_switch") tags.push(state.lang === "en" ? "Model Switch" : "切换模型");
      if (r.cacheDrop) tags.push(state.lang === "en" ? "Cache Miss" : "缓存命中骤降");
      const tagStr = tags.length ? ` [${tags.join(" · ")}]` : "";
      const tip = state.lang === "en"
        ? `${unitLabel}${r.reqIndex} (${r.modelLabel})${tagStr}\nWindow: ${fmtTok(r.promptTokens)} (${r.deltaTokens >= 0 ? "+" : ""}${fmtTok(r.deltaTokens)})\nIn ${fmtTok(r.inputTokens)} · Cache ${fmtTok(r.cacheReadTokens)} · Out ${fmtTok(r.outputTokens)}\nClick to pin snapshot (←/→)`
        : `${unitLabel}${r.reqIndex} (${r.modelLabel})${tagStr}\n窗口: ${fmtTok(r.promptTokens)} (${r.deltaTokens >= 0 ? "+" : ""}${fmtTok(r.deltaTokens)})\n新输入 ${fmtTok(r.inputTokens)} · 缓存 ${fmtTok(r.cacheReadTokens)} · 输出 ${fmtTok(r.outputTokens)}\n点击固定快照 (支持 ←/→ 切换)`;
      const markerSvg =
        r.marker === "compaction"
          ? `<line x1="${(i * slotW).toFixed(1)}" y1="${topY}" x2="${(i * slotW).toFixed(1)}" y2="${botY}" stroke="#f59e0b" stroke-width="1.2" stroke-dasharray="2 2"/>`
          : r.marker === "model_switch"
          ? `<line x1="${(i * slotW).toFixed(1)}" y1="${topY}" x2="${(i * slotW).toFixed(1)}" y2="${botY}" stroke="#38bdf8" stroke-width="1" stroke-dasharray="2 2"/>`
          : "";
      const dropDot = r.cacheDrop ? `<circle cx="${(x + barW / 2).toFixed(1)}" cy="4.5" r="2.6" fill="#f43f5e"/>` : "";
      out += `<g class="bar-pair" data-action="pin-step" data-idx="${i}" data-tip="${esc(tip)}">
        <rect x="${(i * slotW).toFixed(1)}" y="0" width="${slotW.toFixed(1)}" height="${H}" fill="${isPin ? "var(--hover)" : "transparent"}"/>
        ${markerSvg}${dropDot}${rects}
      </g>`;
    });
  } else {
    const maxAbs = Math.max(...series.map((r) => Math.abs(r.deltaTokens)), 1);
    const midY = topY + chartH * 0.55;
    out += `<line x1="0" y1="${midY}" x2="${W}" y2="${midY}" stroke="var(--grid-line)"/>`;
    series.forEach((r, i) => {
      const x = i * slotW + (slotW - barW) / 2, d = r.deltaTokens;
      const bh = Math.max(2, (Math.abs(d) / maxAbs) * (chartH * 0.42));
      const y = d >= 0 ? midY - bh : midY;
      const tip = `${unitLabel}${r.reqIndex} (${r.modelLabel})\nDelta: ${d >= 0 ? "+" : ""}${fmtTok(d)} · Window ${fmtTok(r.promptTokens)}`;
      out += `<g class="bar-pair" data-action="pin-step" data-idx="${i}" data-tip="${esc(tip)}">
        <rect x="${(i * slotW).toFixed(1)}" y="0" width="${slotW.toFixed(1)}" height="${H}" fill="${i === pinnedIdx ? "var(--hover)" : "transparent"}"/>
        <rect x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${barW.toFixed(1)}" height="${bh.toFixed(1)}" rx="1.5" fill="${d >= 0 ? "#3b82f6" : "#f59e0b"}"/>
      </g>`;
    });
  }

  const ticks = n === 1 ? [1] : [1, Math.round(n * 0.25), Math.round(n * 0.5), Math.round(n * 0.75), n].filter((v, idx, a) => v >= 1 && a.indexOf(v) === idx);
  return `<div>
    <svg class="step-svg" viewBox="0 0 ${W} ${H}" preserveAspectRatio="none">${out}</svg>
    <div class="axis-ticks num">${ticks.map((tk) => `<span>${unitLabel}${tk}</span>`).join("")}</div>
  </div>`;
}

function buildGroupedBrowserHtml(ses, activeReq) {
  const t = L();
  const cats = getTokenCats();
  const convId = ses.summary.id;
  const latestReq = ses.requests?.[ses.requests.length - 1] || activeReq;
  const refReq = state.pinnedIdx !== null && activeReq ? activeReq : latestReq;
  const refStepNum = refReq ? (refReq.lastReqIndex || refReq.reqIndex) : 0;
  const refEpoch = refReq && typeof refReq.epoch === "number" ? refReq.epoch : ses.summary.latestEpoch;

  let nodes = (ses.nodes || []).slice();
  if (state.browserScope === "window") {
    if (state.pinnedIdx !== null && activeReq) {
      nodes = nodes.filter((n) => n.epoch === -1 || (n.epoch === refEpoch && n.reqIndex <= refStepNum));
    } else {
      nodes = nodes.filter((n) => n.inCurrentWindow);
    }
  } else if (state.browserScope === "prev_step" && refReq) {
    nodes = nodes.filter((n) => n.reqIndex === refStepNum && n.epoch !== -1);
  } else if (state.browserScope === "prev_turn" && refReq) {
    nodes = nodes.filter((n) => n.turn === refReq.turn && n.epoch !== -1);
  }

  if (state.catFilter !== "all") nodes = nodes.filter((n) => n.cat === state.catFilter);
  const hasQuery = Boolean(state.nodeSearch.trim());
  if (hasQuery) {
    const q = state.nodeSearch.trim().toLowerCase();
    nodes = nodes.filter((n) => n.title.toLowerCase().includes(q) || n.preview.toLowerCase().includes(q) || n.kindLabel.toLowerCase().includes(q));
  }

  const grouped = new Map(cats.map((c) => [c.key, { cat: c, items: [], tokens: 0 }]));
  for (const n of nodes) {
    const bucket = grouped.get(n.cat) || grouped.get("tool");
    bucket.items.push(n);
    bucket.tokens += n.tokens || 0;
  }

  const totalEst = [...grouped.values()].reduce((s, g) => s + g.tokens, 0) || 1;
  const autoOpen = hasQuery || state.catFilter !== "all" || state.browserScope === "prev_step" || state.browserScope === "prev_turn";

  const topBarSegs = [...grouped.values()]
    .filter((g) => g.tokens > 0)
    .map((g) => `<div style="width:${((g.tokens / totalEst) * 100).toFixed(2)}%;background:${g.cat.color}" data-tip="${esc(g.cat.label)}: ≈${fmtTok(g.tokens)} (${((g.tokens / totalEst) * 100).toFixed(1)}%)"></div>`)
    .join("");

  const groupsHtml = [...grouped.values()]
    .filter((g) => g.items.length > 0)
    .map((g) => {
      const isOpen = autoOpen || state.expandedGroups.has(g.cat.key);
      const pct = ((g.tokens / totalEst) * 100).toFixed(1);
      const sortedItems = g.items.slice().sort((a, b) => (state.nodeSort === "tokens" ? b.tokens - a.tokens : b.seq - a.seq));
      const maxItemTok = Math.max(...sortedItems.map((x) => x.tokens), 1);

      const itemsHtml = isOpen
        ? `<div class="grp-body" data-grp="${g.cat.key}">
            ${sortedItems
              .map((n) => {
                const open = state.expandedNodes.has(n.id);
                const barW = Math.max(3, Math.round((n.tokens / maxItemTok) * 100));
                let expandHtml = "";
                if (open) {
                  if (n.id === "n-baseline" && ses.baselineBreakdown?.rows?.length) {
                    const bd = ses.baselineBreakdown;
                    expandHtml = `<div class="node-expand">
                      <div class="muted text-xs" style="margin-bottom:6px">${esc(t.pluginBaseIntro(bd.totalSkills, bd.totalMcpTools))}</div>
                      ${bd.rows
                        .slice(0, 12)
                        .map((p, i) => {
                          const c = ROW_PALETTE[i % ROW_PALETTE.length];
                          const pw = Math.max(4, Math.round((p.tokens / Math.max(1, bd.rows[0].tokens)) * 100));
                          return `<div class="rank-row" style="margin-bottom:5px">
                            <div class="rank-top">
                              <span class="rank-name truncate"><i class="dot" style="background:${c}"></i>${esc(p.name)} <span class="faint">${esc(t.pluginRowMeta(p.skills, p.uses30d))}</span></span>
                              <span class="rank-val num">${fmtTok(p.tokens)}</span>
                            </div>
                            <div class="rank-track"><div class="rank-fill" style="width:${pw}%;background:${c}"></div></div>
                          </div>`;
                        })
                        .join("")}
                    </div>`;
                  } else {
                    const txt = state.fullTexts[`${convId}:${n.id}`] || n.preview;
                    const cKey = `node:${n.id}`;
                    const isCopied = state.copiedKey === cKey;
                    expandHtml = `<div class="node-expand">
                      <div class="pre-bar">
                        <span class="faint num">${state.loadingNodeId === n.id ? esc(t.loadingFull) : esc(t.charsMeta(txt.length.toLocaleString(), fmtTok(n.tokens), n.reqIndex))}</span>
                        <button type="button" class="mini-copy" data-action="copy-node" data-id="${n.id}">${esc(isCopied ? t.copiedBtn : t.copyBtn)}</button>
                      </div>
                      <pre data-node="${n.id}">${esc(txt)}</pre>
                    </div>`;
                  }
                }
                const compactedBadge = !n.inCurrentWindow && state.browserScope === "all" ? `<span class="tag-archived">${esc(t.compactedTag)}</span>` : "";
                return `<div class="ctx-item">
                  <button type="button" class="ctx-head" data-action="toggle-node" data-id="${n.id}">
                    <div class="ctx-top">
                      <span class="row-gap min-w-0">
                        ${open ? ICONS.chevDown : ICONS.chevRight}
                        <span class="ctx-tag">${esc(n.kindLabel)}</span>
                        ${compactedBadge}
                        <span class="truncate">${esc(n.title)}</span>
                      </span>
                      <span class="num shrink-0">${fmtTok(n.tokens)}</span>
                    </div>
                    <div class="rank-track"><div class="rank-fill" style="width:${barW}%;background:${g.cat.color}"></div></div>
                  </button>
                  ${expandHtml}
                </div>`;
              })
              .join("")}
          </div>`
        : "";

      return `<div class="grp-card">
        <button type="button" class="grp-hd" data-action="toggle-grp" data-val="${g.cat.key}">
          <span class="row-gap min-w-0">
            ${isOpen ? ICONS.chevDown : ICONS.chevRight}
            <i class="sq" style="background:${g.cat.color}"></i>
            <strong>${esc(g.cat.label)}</strong>
            <span class="faint text-xs num">${esc(t.itemsCount(g.items.length))}</span>
          </span>
          <span class="row-gap shrink-0 num text-xs">
            <span class="muted">≈${fmtTok(g.tokens)}</span>
            <strong style="min-width:38px;text-align:right">${pct}%</strong>
          </span>
        </button>
        ${itemsHtml}
      </div>`;
    })
    .join("");

  const scopeHint =
    state.browserScope === "prev_step" && refReq
      ? t.scopeHintStep(refStepNum)
      : state.browserScope === "prev_turn" && refReq
      ? t.scopeHintTurn(refReq.turn)
      : state.browserScope === "all"
      ? t.scopeHintAll
      : t.scopeHintWin;

  const actualWinTok = state.pinnedIdx !== null && activeReq?.promptTokens > 0 ? activeReq.promptTokens : ses.summary.currentPromptTokens;
  const actualLabel = state.browserScope === "window" ? ` · ${t.actualWin} ${fmtTok(actualWinTok)}` : "";

  const html = `
    <div class="row-gap" style="justify-content:space-between;margin-bottom:6px;font-size:11.5px">
      <span class="muted">${esc(scopeHint)} · ${esc(t.itemsCount(nodes.length))}</span>
      <span class="muted num">${esc(t.estSum)} ≈${fmtTok(totalEst === 1 && nodes.length === 0 ? 0 : totalEst)}${esc(actualLabel)}</span>
    </div>
    <div class="mini-stack-bar">${topBarSegs}</div>
    <div class="grp-list">${groupsHtml || `<div class="empty-sm">${esc(t.noMatchNode)}</div>`}</div>`;

  return { count: nodes.length, html };
}

function updateBrowserOnly() {
  const ses = state.session;
  if (!ses) return;
  const zone = document.getElementById("ctx-browser-zone");
  if (!zone) return;
  const series = state.timelineUnit === "turn" ? ses.turnsTimeline || [] : ses.requests || [];
  const activeReq = state.pinnedIdx !== null ? series[state.pinnedIdx] : series[series.length - 1];
  zone.innerHTML = buildGroupedBrowserHtml(ses, activeReq).html;
}

function renderSessionAnatomyView() {
  const t = L();
  const cats = getTokenCats();
  const ses = state.session;
  if (!ses) return `<div class="empty">${esc(t.noSession)}</div>`;
  const s = ses.summary;
  const isDrill = state.surface === "global" && state.drillSession;
  const series = state.timelineUnit === "turn" ? ses.turnsTimeline || [] : ses.requests || [];
  const unitLbl = state.timelineUnit === "turn" ? t.turnUnitPre : t.stepUnitPre;
  const clampedPin = state.pinnedIdx !== null && state.pinnedIdx < series.length ? state.pinnedIdx : null;
  const activeReq = clampedPin !== null ? series[clampedPin] : series[series.length - 1];
  const isPinned = clampedPin !== null && Boolean(activeReq);
  const activeIdx = clampedPin !== null ? clampedPin : Math.max(0, series.length - 1);

  const ddOpts = (state.sessionList || []).map((c) => ({
    value: c.id,
    label: c.title.slice(0, 42),
    meta: fmtTok(c.totalTokens),
    running: c.runState === "RUN_STATE_RUNNING",
  }));

  const activeComp = isPinned && activeReq.promptTokens > 0 ? activeReq.comp : s.comp;
  const activePromptTok = isPinned && activeReq.promptTokens > 0 ? activeReq.promptTokens : s.currentPromptTokens;
  const activeWinPct = Number(((activePromptTok / Math.max(1, s.windowLimit)) * 100).toFixed(1));

  const winBarSegs = cats
    .map((c) => {
      const v = Math.max(0, activeComp?.[c.key] || 0);
      const wPct = (v / Math.max(1, s.windowLimit)) * 100;
      if (wPct <= 0) return "";
      return `<div style="width:${wPct.toFixed(3)}%;background:${c.color}" data-tip="${esc(c.label)}: ≈${fmtTok(v)} (${wPct.toFixed(1)}%)"></div>`;
    })
    .join("");

  const compActiveSum = cats.reduce((acc, c) => acc + Math.max(0, activeComp?.[c.key] || 0), 0) || 1;
  const curCtxLegend = cats
    .map((c) => {
      const v = Math.max(0, activeComp?.[c.key] || 0);
      const pct = ((v / compActiveSum) * 100).toFixed(0);
      const on = state.catFilter === c.key;
      return `<button type="button" class="ctx-leg-btn ${on ? "on" : ""}" data-action="cat-toggle" data-val="${c.key}" data-tip="${esc(t.clickFilterCat(c.label))}">
        <span class="row-gap min-w-0" style="gap:5px"><i class="sq" style="background:${c.color}"></i><span class="truncate">${esc(c.label)}</span></span>
        <span class="num muted">≈${fmtTok(v)} <strong style="color:var(--fg)">${pct}%</strong></span>
      </button>`;
    })
    .join("");

  const sesTokSegs = cats.map((c) => ({ ...c, val: Math.max(0, s.compTotals?.[c.key] || 0) }));
  const sesTokSum = sesTokSegs.reduce((a, b) => a + b.val, 0) || 1;
  const sesTokCells = sesTokSegs
    .map((c) => {
      const pct = ((c.val / sesTokSum) * 100).toFixed(1);
      const scaled = Math.round((c.val / sesTokSum) * s.totalTokens);
      return `<div class="bd-item">
        <div class="bd-top">
          <span class="bd-name"><i class="sq" style="background:${c.color}"></i>${esc(c.label)}</span>
          <strong class="num">${pct}%</strong>
        </div>
        <div class="bd-bar"><div style="width:${Math.min(100, Number(pct))}%;background:${c.color}"></div></div>
        <div class="bd-sub num">≈${fmtTok(scaled)}</div>
      </div>`;
    })
    .join("");

  const tm = s.timing || {};
  const sesTimingItems = [
    { key: "waitMs", label: t.tmWait, color: "#3b82f6", val: tm.waitMs || 0, valFormatted: fmtDur(tm.waitMs), sub: `${fmtDur(tm.waitMs)} · ${s.requests}${t.timesSuffix}` },
    { key: "thinkMs", label: t.tmThink, color: "#a855f7", val: tm.thinkMs || 0, valFormatted: fmtDur(tm.thinkMs), sub: `${fmtDur(tm.thinkMs)} · ${tm.thinkingBlocks || 0}${t.blocksShort}` },
    { key: "replyMs", label: t.tmReply, color: "#ec4899", val: tm.replyMs || 0, valFormatted: fmtDur(tm.replyMs), sub: `${fmtDur(tm.replyMs)} · ${tm.replyBlocks || 0}${t.blocksShort}` },
    { key: "toolArgMs", label: t.tmToolArg, color: "#f59e0b", val: tm.toolArgMs || 0, valFormatted: fmtDur(tm.toolArgMs), sub: `${fmtDur(tm.toolArgMs)} · ${tm.toolArgBlocks || 0}${t.blocksShort}` },
    { key: "toolExecMs", label: t.tmToolExec, color: "#10b981", val: tm.toolExecMs || 0, valFormatted: fmtDur(tm.toolExecMs), sub: `${fmtDur(tm.toolExecMs)} · ${s.toolCalls}${t.timesSuffix}` },
    { key: "otherMs", label: t.tmOther, color: "#64748b", val: tm.otherMs || 0, valFormatted: fmtDur(tm.otherMs), sub: `${fmtDur(tm.otherMs)} · ${t.schedShort}` },
  ];
  const sesTmSum = sesTimingItems.reduce((a, b) => a + b.val, 0) || 1;
  const sesTimingCells = sesTimingItems
    .map((ti) => {
      const pct = ((ti.val / sesTmSum) * 100).toFixed(1);
      return `<div class="bd-item">
        <div class="bd-top">
          <span class="bd-name"><i class="sq" style="background:${ti.color}"></i>${esc(ti.label)}</span>
          <strong class="num">${pct}%</strong>
        </div>
        <div class="bd-bar"><div style="width:${Math.min(100, Number(pct))}%;background:${ti.color}"></div></div>
        <div class="bd-sub num">${esc(ti.sub)}</div>
      </div>`;
    })
    .join("");
  const timingBarSegs = sesTimingItems
    .filter((ti) => ti.val > 0)
    .map((ti) => `<div style="width:${((ti.val / sesTmSum) * 100).toFixed(2)}%;background:${ti.color}" data-tip="${esc(ti.label)}: ${fmtDur(ti.val)} (${((ti.val / sesTmSum) * 100).toFixed(1)}%)"></div>`)
    .join("");

  const ev = s.events || {};
  const sub = s.subagents || { count: 0, totalTokens: 0, usd: 0, items: [] };
  const browserZone = buildGroupedBrowserHtml(ses, activeReq);
  const wsDisp = fmtWs(s.workspace);

  return `<div class="dash-wrap">
    <div class="dash-topbar">
      <div class="row-gap min-w-0" style="flex:1">
        ${
          isDrill
            ? `<button type="button" class="top-chip" data-action="back-global">${ICONS.back}<span>${esc(t.backGlobal)}</span></button>
               <strong class="truncate" style="font-size:15px">${esc(s.title)}</strong>
               ${s.workspace && s.workspace !== "通用对话" ? `<span class="tag-ws">${esc(wsDisp)}</span>` : ""}`
            : `${renderDropdown("ses-picker", s.id, ddOpts)}`
        }
      </div>
      <div class="row-gap shrink-0">
        ${
          !isDrill
            ? `<button type="button" class="top-chip ${state.liveSync ? "live-on" : ""}" data-action="toggle-live" data-tip="${esc(state.liveSync ? t.liveOnTip : t.liveOffTip)}"><i class="live-dot"></i>${esc(t.liveLbl)}</button>`
            : ""
        }
        ${renderLangToggleBtn()}
        <button type="button" class="icon-btn ${state.loading ? "is-loading" : ""}" data-action="refresh" data-tip="${esc(t.refreshNowTip)}">${ICONS.refresh}</button>
      </div>
    </div>

    <div class="micro-hud num">
      <span class="hud-metric">${ICONS.gauge}<span>${tm.tokPerSec || 0} tok/s</span></span>
      <span class="hud-sep"></span>
      <span class="hud-metric">${ICONS.db}<span>${esc(t.cacheHit)} <strong>${s.cacheHitPct}%</strong></span></span>
      <span class="hud-sep"></span>
      <span class="hud-metric">${buildMiniProgressRing(activeWinPct, 16)}<span><strong>${activeWinPct}%</strong> <span class="muted">(${fmtTok(activePromptTok)})</span></span></span>
      <span class="hud-sep"></span>
      <span class="hud-metric muted">${fmtUsd(s.usd)}</span>
    </div>

    <div class="card">
      <div class="card-hd">
        <span class="hd-title">${ICONS.layers}<span>${esc(t.ctxStats)}</span></span>
        <span class="muted text-xs num">${esc(s.lastModelLabel)} · ${esc(wsDisp)}</span>
      </div>
      <div class="stat5-grid">
        <div class="stat-tile"><div class="stat-num num" style="color:#22c55e">${s.turns}</div><div class="stat-lbl">${esc(t.turnsLbl)}</div></div>
        <div class="stat-tile"><div class="stat-num num" style="color:#6366f1">${s.requests}</div><div class="stat-lbl">${esc(t.stepsLbl)}</div></div>
        <div class="stat-tile"><div class="stat-num num" style="color:#a855f7">${s.skillLoads || 0}</div><div class="stat-lbl">${esc(t.skillTitle)}</div></div>
        <div class="stat-tile"><div class="stat-num num" style="color:#10b981">${s.replyCount || 0}</div><div class="stat-lbl">${esc(t.repliesLbl)}</div></div>
        <div class="stat-tile ev-tile">
          <div class="stat-lbl" style="margin-bottom:4px">${esc(t.ctxEvents)}</div>
          <div class="ev-row num">
            <span style="color:#22c55e">${esc(t.evInject)} ${ev.injections || 0}</span>
            <span class="faint">/</span>
            <span style="color:#f59e0b">${esc(t.evCompact)} ${ev.compactions || 0}</span>
            <span class="faint">/</span>
            <span style="color:#f43f5e">${esc(t.evDrop)} ${ev.cacheDrops || 0}</span>
          </div>
        </div>
      </div>
      <div class="meta4-grid">
        <div class="meta-cell">
          <div class="meta-top"><span>${esc(t.fileIo)}</span><strong class="num">${(s.readFileCount || 0) + (s.writeFileCount || 0)}</strong></div>
          <div class="meta-sub num"><i class="dot" style="background:#3b82f6"></i>${esc(t.readLbl)} ${s.readFileCount || 0} &nbsp;<i class="dot" style="background:#22c55e"></i>${esc(t.writeLbl)} ${s.writeFileCount || 0}</div>
        </div>
        <div class="meta-cell">
          <div class="meta-top"><span>${esc(t.toolTitle)}</span><strong class="num">${s.toolCalls}</strong></div>
          <div class="meta-sub truncate num">${(s.topTools || []).slice(0, 3).map((x) => `${x.name}×${x.count}`).join(" · ") || esc(t.noData)}</div>
        </div>
        <div class="meta-cell">
          <div class="meta-top"><span>${esc(t.cmdTitle)}</span><strong class="num">${s.cmdExecs || 0}</strong></div>
          <div class="meta-sub truncate num">${(s.topPrograms || []).slice(0, 3).map((p) => `${p.name}×${p.count}`).join(" · ") || esc(t.noData)}</div>
        </div>
        <div class="meta-cell">
          <div class="meta-top"><span>${esc(t.subTeam)}</span><strong class="num">${fmtTok(s.totalTokens + sub.totalTokens)} / ${fmtUsd(s.usd + sub.usd)}</strong></div>
          <div class="meta-sub num">${esc(t.mainAgent)} ${fmtTok(s.totalTokens)} · ${esc(t.subAgentLbl)} ×${sub.count}${sub.count > 0 ? ` (${fmtTok(sub.totalTokens)})` : ""}</div>
        </div>
      </div>
    </div>

    <div class="row2-grid">
      <div class="card">
        <div class="card-hd">
          <span class="hd-title">${ICONS.db}<span>${esc(t.tokStats)}</span></span>
          <span class="muted text-xs num">${esc(t.cacheHit)} ${s.cacheHitPct}%</span>
        </div>
        <div class="donut-split">
          ${buildDonutRing(sesTokSegs, fmtTok(s.totalTokens), t.totalVol, 102, 11)}
          <div class="bd-grid">${sesTokCells}</div>
        </div>
      </div>

      <div class="card">
        <div class="card-hd">
          <span class="hd-title">${ICONS.clock}<span>${esc(t.timingStats)}</span></span>
          <span class="muted text-xs num">${esc(t.outSpeed(tm.tokPerSec || 0))}</span>
        </div>
        <div class="donut-split">
          ${buildDonutRing(sesTimingItems, fmtDur(tm.activeMs), t.activeDur, 102, 11)}
          <div class="bd-grid">${sesTimingCells}</div>
        </div>
        <div class="timing-strip-wrap">
          <div class="mini-stack-bar lg">${timingBarSegs}</div>
          <div class="axis-ticks num"><span>0</span><span>${fmtDur((tm.activeMs || 0) * 0.5)}</span><span>${fmtDur(tm.activeMs)}</span></div>
        </div>
      </div>
    </div>

    <div class="ses-bottom-grid">
      <div class="col-stack">
        <div class="card">
          <div class="card-hd">
            <span class="hd-title">${ICONS.gauge}<span>${esc(isPinned ? t.snapTitle(unitLbl, activeReq.reqIndex) : t.curCtx)}</span></span>
            <div class="row-gap">
              ${isPinned ? `<button type="button" class="top-chip active-chip" style="height:22px;padding:0 8px" data-action="clear-pin">${esc(t.backLatest)}</button>` : ""}
              <span class="muted text-xs num">${esc(isPinned ? activeReq.modelLabel : s.lastModelLabel)}</span>
            </div>
          </div>
          <div class="win-head num">
            <div><strong style="font-size:17px">${fmtTok(activePromptTok)}</strong> <span class="muted">/ ${fmtTok(s.windowLimit)} tokens</span></div>
            <div><strong style="font-size:16px">${activeWinPct}%</strong> <span class="muted text-xs">${esc(t.ctxUsed)}</span></div>
          </div>
          <div class="win-stack-bar">${winBarSegs}</div>
          <div class="ctx-leg-grid">${curCtxLegend}</div>
        </div>

        <div class="card">
          <div class="card-hd">
            <span class="hd-title">${ICONS.clock}<span>${esc(t.ctxTimeline)}</span></span>
            <div class="row-gap wrap" style="gap:6px">
              ${
                series.length > 1
                  ? `<div class="seg-pill sm">
                      <button type="button" data-action="step-delta" data-val="-1" ${activeIdx <= 0 ? "disabled" : ""} data-tip="${esc(t.prevItem)}">${ICONS.chevLeft}</button>
                      <button type="button" data-action="step-delta" data-val="1" ${activeIdx >= series.length - 1 ? "disabled" : ""} data-tip="${esc(t.nextItem)}">${ICONS.chevRight}</button>
                    </div>`
                  : ""
              }
              <div class="seg-pill sm">
                <button type="button" class="${state.timelineUnit === "step" ? "white-on" : ""}" data-action="tl-unit" data-val="step">${esc(t.unitStep)}</button>
                <button type="button" class="${state.timelineUnit === "turn" ? "white-on" : ""}" data-action="tl-unit" data-val="turn">${esc(t.unitTurn)}</button>
              </div>
              <div class="seg-pill sm">
                <button type="button" class="${state.timelineMode === "total" ? "white-on" : ""}" data-action="tl-mode" data-val="total">${esc(t.modeFull)}</button>
                <button type="button" class="${state.timelineMode === "delta" ? "white-on" : ""}" data-action="tl-mode" data-val="delta">${esc(t.modeDelta)}</button>
              </div>
            </div>
          </div>
          ${
            activeReq
              ? `<div class="muted text-xs num" style="margin-bottom:6px">${unitLbl}${activeReq.reqIndex} · ${fmtTok(activeReq.promptTokens)} · +${fmtTok(activeReq.inputTokens)} in · ${fmtTok(activeReq.cacheReadTokens)} cache · ${fmtTok(activeReq.outputTokens)} out</div>`
              : ""
          }
          ${buildTimelineSvg(series, clampedPin, state.timelineMode, unitLbl)}
        </div>
      </div>

      <div class="card">
        <div class="card-hd">
          <span class="hd-title">${ICONS.code}<span>${esc(t.ctxBrowser)}</span></span>
          <div class="seg-pill sm">
            <button type="button" class="${state.browserScope === "window" ? "white-on" : ""}" data-action="b-scope" data-val="window" data-tip="${esc(t.scopeWinTip)}">${esc(t.scopeWin)}</button>
            <button type="button" class="${state.browserScope === "prev_step" ? "white-on" : ""}" data-action="b-scope" data-val="prev_step" data-tip="${esc(t.scopeStepTip)}">${esc(t.scopeStep)}</button>
            <button type="button" class="${state.browserScope === "prev_turn" ? "white-on" : ""}" data-action="b-scope" data-val="prev_turn" data-tip="${esc(t.scopeTurnTip)}">${esc(t.scopeTurn)}</button>
            <button type="button" class="${state.browserScope === "all" ? "white-on" : ""}" data-action="b-scope" data-val="all" data-tip="${esc(t.scopeAllTip)}">${esc(t.scopeAll)}</button>
          </div>
        </div>
        <div class="row-gap" style="margin-bottom:9px">
          <label class="search-box" style="flex:1">
            ${ICONS.search}
            <input id="node-search" type="search" placeholder="${esc(t.searchNodePh)}" value="${esc(state.nodeSearch)}" autocomplete="off" />
          </label>
          <div class="seg-pill sm shrink-0">
            <button type="button" class="${state.nodeSort === "tokens" ? "white-on" : ""}" data-action="node-sort" data-val="tokens">${esc(t.sortSize)}</button>
            <button type="button" class="${state.nodeSort === "seq" ? "white-on" : ""}" data-action="node-sort" data-val="seq">${esc(t.sortSeq)}</button>
          </div>
        </div>
        ${
          state.catFilter !== "all"
            ? `<div class="row-gap" style="margin-bottom:8px">
                <button type="button" class="top-chip active-chip" style="height:22px;padding:0 8px" data-action="cat-toggle" data-val="${state.catFilter}">${esc(t.onlyCat(cats.find((c) => c.key === state.catFilter)?.label || state.catFilter))}</button>
              </div>`
            : ""
        }
        <div id="ctx-browser-zone">${browserZone.html}</div>
      </div>
    </div>
  </div>`;
}

// ---------------------------------------------------------------------------
// SURFACE 3: Inline Micro-HUD
// ---------------------------------------------------------------------------

function renderInlineMicroHud() {
  const t = L();
  const s = state.session?.summary;
  if (!s) return `<div class="empty-sm">${esc(t.noData)}</div>`;
  const tm = s.timing || {};
  return `<div class="inline-hud num">
    <span class="tag-group">${esc(s.lastModelLabel)}</span>
    <span class="hud-metric">${ICONS.gauge}<span>${tm.tokPerSec || 0} tok/s</span></span>
    <span class="hud-sep"></span>
    <span class="hud-metric">${ICONS.db}<span>${esc(t.cacheHit)} <strong>${s.cacheHitPct}%</strong></span></span>
    <span class="hud-sep"></span>
    <span class="hud-metric">${buildMiniProgressRing(s.windowPct, 16)}<span><strong>${s.windowPct}%</strong> <span class="muted">(${fmtTok(s.currentPromptTokens)} / ${fmtTok(s.windowLimit)})</span></span></span>
    <span class="hud-sep"></span>
    <span class="muted">${esc(t.turnsVal(s.turns, s.requests))} · ${fmtUsd(s.usd)}</span>
  </div>`;
}

// ---------------------------------------------------------------------------
// Render Dispatch & Events
// ---------------------------------------------------------------------------

export function render() {
  const root = document.getElementById("app");
  if (!root) return;
  if (state.surface === "inline") {
    root.innerHTML = renderInlineMicroHud();
    return;
  }
  const showSession = state.surface === "aux_pane" || (state.surface === "global" && state.drillSession);
  root.innerHTML = showSession ? renderSessionAnatomyView() : renderInsightsDashboard();
  bindInputs();
}

function bindInputs() {
  const ss = document.getElementById("ses-search");
  if (ss) {
    ss.addEventListener("compositionstart", () => { imeComposing = true; });
    ss.addEventListener("compositionend", (e) => {
      imeComposing = false;
      state.sessionSearch = e.target.value;
      state.sessionPage = 1;
      updateSessionResultsOnly();
    });
    ss.addEventListener("input", (e) => {
      if (imeComposing || e.isComposing) return;
      state.sessionSearch = e.target.value;
      state.sessionPage = 1;
      updateSessionResultsOnly();
    });
  }
  const ns = document.getElementById("node-search");
  if (ns) {
    ns.addEventListener("compositionstart", () => { imeComposing = true; });
    ns.addEventListener("compositionend", (e) => {
      imeComposing = false;
      state.nodeSearch = e.target.value;
      updateBrowserOnly();
    });
    ns.addEventListener("input", (e) => {
      if (imeComposing || e.isComposing) return;
      state.nodeSearch = e.target.value;
      updateBrowserOnly();
    });
  }
}

document.addEventListener("mousemove", (ev) => {
  const t = ev.target && ev.target.closest ? ev.target.closest("[data-tip]") : null;
  if (t && t.dataset.tip) showTip(t.dataset.tip, ev.clientX, ev.clientY);
  else hideTip();
});
document.addEventListener("mouseleave", hideTip);
window.addEventListener("scroll", hideTip, true);

document.addEventListener("keydown", (ev) => {
  const tag = ev.target?.tagName || "";
  const inInput = tag === "INPUT" || tag === "TEXTAREA";
  const inSessionView = state.surface === "aux_pane" || (state.surface === "global" && state.drillSession);
  if (ev.key === "Escape") {
    hideTip();
    if (state.openDd) {
      state.openDd = null;
      render();
    } else if (inSessionView && state.pinnedIdx !== null) {
      state.pinnedIdx = null;
      render();
    }
    return;
  }
  if (!inInput && inSessionView && (ev.key === "ArrowLeft" || ev.key === "ArrowRight")) {
    const series = state.timelineUnit === "turn" ? state.session?.turnsTimeline || [] : state.session?.requests || [];
    if (series.length <= 1) return;
    ev.preventDefault();
    const cur = state.pinnedIdx !== null ? state.pinnedIdx : series.length - 1;
    state.pinnedIdx = Math.max(0, Math.min(series.length - 1, cur + (ev.key === "ArrowLeft" ? -1 : 1)));
    render();
  }
});

document.addEventListener("click", (ev) => {
  hideTip();
  const el = ev.target.closest("[data-action]");
  if (!el) {
    if (state.openDd && !ev.target.closest(".date-pop")) {
      state.openDd = null;
      render();
    }
    return;
  }
  const action = el.dataset.action;
  const val = el.dataset.val;
  if (!["dd-toggle", "dd-pick", "quick-span", "apply-dates"].includes(action) && state.openDd) {
    state.openDd = null;
  }

  switch (action) {
    case "toggle-lang":
      state.lang = state.lang === "zh" ? "en" : "zh";
      state.langManual = true;
      app.callServerTool({ name: "app_save_prefs", arguments: { lang: state.lang } }).catch(() => {});
      render();
      break;
    case "dd-toggle":
      state.openDd = state.openDd === el.dataset.dd ? null : el.dataset.dd;
      render();
      break;
    case "dd-pick":
      state.openDd = null;
      fetchSession(val);
      break;
    case "back-global":
      state.drillSession = false;
      render();
      break;
    case "rank1-mode":
      state.rank1Mode = val;
      render();
      break;
    case "quick-span": {
      const today = new Date();
      const start = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      if (val === "14d") start.setDate(start.getDate() - 13);
      else if (val === "week") {
        const d = start.getDay();
        start.setDate(start.getDate() - (d === 0 ? 6 : d - 1));
      } else if (val === "month") start.setDate(1);
      state.openDd = null;
      fetchUsage("custom", "", false, fmtIsoLocal(start), fmtIsoLocal(today));
      break;
    }
    case "apply-dates": {
      const sInp = document.getElementById("dp-start")?.value;
      const eInp = document.getElementById("dp-end")?.value;
      if (sInp && eInp) {
        state.openDd = null;
        fetchUsage("custom", "", false, sInp, eInp);
      }
      break;
    }
    case "copy-report":
      if (state.usage) copyText(buildUsageMarkdownReport(state.usage), "report");
      break;
    case "copy-node": {
      const node = (state.session?.nodes || []).find((n) => n.id === el.dataset.id);
      if (node) {
        const txt = state.fullTexts[`${state.session.summary.id}:${node.id}`] || node.preview;
        copyText(txt, `node:${node.id}`);
      }
      break;
    }
    case "toggle-live":
      state.liveSync = !state.liveSync;
      render();
      break;
    case "refresh": {
      const inSessionView = state.surface === "aux_pane" || (state.surface === "global" && state.drillSession);
      if (inSessionView && state.session) fetchSession(state.session.summary.id, { forceRefresh: true });
      else fetchUsage(state.range, state.filterDay, true, state.startDay, state.endDay);
      break;
    }
    case "range":
      state.openDd = null;
      fetchUsage(val, "", false, "", "");
      break;
    case "day-filter":
      fetchUsage(state.range === "custom" ? "30d" : state.range, state.filterDay === val ? "" : val, false, "", "");
      break;
    case "clear-day":
      fetchUsage(state.range === "custom" ? "30d" : state.range, "", false, "", "");
      break;
    case "heat-metric":
      state.heatMetric = val;
      render();
      break;
    case "toggle-subagents":
      state.hideSubagents = !state.hideSubagents;
      state.sessionPage = 1;
      render();
      break;
    case "dim-filter": {
      const dim = el.dataset.dim;
      if (dim === "model") state.modelGroupFilter = !val || state.modelGroupFilter === val ? "" : val;
      else if (dim === "workspace") state.workspaceFilter = !val || state.workspaceFilter === val ? "" : val;
      else if (dim === "skill") state.skillFilter = !val || state.skillFilter === val ? "" : val;
      else if (dim === "tool") state.toolFilter = !val || state.toolFilter === val ? "" : val;
      else if (dim === "program") state.programFilter = !val || state.programFilter === val ? "" : val;
      state.sessionPage = 1;
      render();
      break;
    }
    case "ses-sort":
      state.sessionSort = val;
      render();
      break;
    case "page":
      state.sessionPage = Number(val);
      updateSessionResultsOnly();
      break;
    case "open-session":
      fetchSession(el.dataset.id, { drill: state.surface === "global" });
      break;
    case "tl-unit":
      state.timelineUnit = val;
      state.pinnedIdx = null;
      app.callServerTool({ name: "app_save_prefs", arguments: { timelineUnit: val } }).catch(() => {});
      render();
      break;
    case "tl-mode":
      state.timelineMode = val;
      app.callServerTool({ name: "app_save_prefs", arguments: { timelineMode: val } }).catch(() => {});
      render();
      break;
    case "step-delta": {
      const series = state.timelineUnit === "turn" ? state.session?.turnsTimeline || [] : state.session?.requests || [];
      if (series.length <= 1) break;
      const cur = state.pinnedIdx !== null ? state.pinnedIdx : series.length - 1;
      state.pinnedIdx = Math.max(0, Math.min(series.length - 1, cur + Number(val)));
      render();
      break;
    }
    case "pin-step": {
      const idx = Number(el.dataset.idx);
      state.pinnedIdx = state.pinnedIdx === idx ? null : idx;
      render();
      break;
    }
    case "clear-pin":
      state.pinnedIdx = null;
      render();
      break;
    case "b-scope":
      state.browserScope = val;
      render();
      break;
    case "cat-toggle":
      state.catFilter = state.catFilter === val ? "all" : val;
      render();
      break;
    case "node-sort":
      state.nodeSort = val;
      updateBrowserOnly();
      break;
    case "toggle-grp":
      if (state.expandedGroups.has(val)) state.expandedGroups.delete(val);
      else state.expandedGroups.add(val);
      updateBrowserOnly();
      break;
    case "toggle-node": {
      const node = (state.session?.nodes || []).find((n) => n.id === el.dataset.id);
      if (node) toggleNodeExpand(node);
      break;
    }
  }
});

app.ontoolinput = () => {
  state.loading = true;
  render();
};

app.ontoolresult = (result) => {
  state.loading = false;
  hideTip();
  const sc = result?.structuredContent;
  if (sc) {
    if (!state.langManual) {
      if (sc.prefs?.lang === "en" || sc.prefs?.lang === "zh") state.lang = sc.prefs.lang;
      else if (sc.defaultLang === "en" || sc.defaultLang === "zh") state.lang = sc.defaultLang;
    }
    state.surface = sc.inline ? "inline" : sc.surface || (sc.usage ? "global" : "aux_pane");
    if (state.surface === "global") state.drillSession = false;
    if (sc.prefs?.timelineMode) state.timelineMode = sc.prefs.timelineMode;
    if (sc.prefs?.timelineUnit) state.timelineUnit = sc.prefs.timelineUnit;
    if (sc.prefs?.defaultRange) state.range = sc.prefs.defaultRange;
    if (sc.usage) {
      state.usage = sc.usage;
      state.range = sc.usage.range || state.range;
      state.filterDay = sc.usage.filterDay || "";
    }
    if (sc.session) {
      const prevId = state.session?.summary?.id;
      if (prevId && sc.session.summary?.id !== prevId) resetSessionViewState();
      state.session = sc.session;
      state.lastMtimeMs = sc.session.summary?.mtimeMs || 0;
      state.lastFileSize = sc.session.summary?.fileSize || 0;
    }
    if (sc.sessionList) state.sessionList = sc.sessionList;
  }
  render();
};

setInterval(async () => {
  if (typeof window !== "undefined" && window.__AGY_PREVIEW__) return;
  const activeTag = document.activeElement?.tagName || "";
  if (document.hidden || !state.liveSync || state.surface !== "aux_pane" || state.loading || pollInFlight || imeComposing || activeTag === "INPUT" || activeTag === "TEXTAREA" || state.openDd) {
    return;
  }
  const convId = state.session?.summary?.id;
  if (!convId) return;
  pollInFlight = true;
  try {
    const res = await app.callServerTool({ name: "app_poll_meta", arguments: { conversationId: convId } });
    const sc = res?.structuredContent;
    if (sc && (sc.mtimeMs !== state.lastMtimeMs || sc.fileSize !== state.lastFileSize) && sc.mtimeMs > 0) {
      await fetchSession(convId, { silent: true });
    }
  } catch {
  } finally {
    pollInFlight = false;
  }
}, 4000);

app.onhostcontextchanged = (ctx) => {
  if (ctx?.theme) applyDocumentTheme(ctx.theme);
  if (ctx?.styles?.variables) applyHostStyleVariables(ctx.styles.variables);
};

async function boot() {
  if (typeof window !== "undefined" && window.__AGY_PREVIEW__) {
    if (window.__AGY_PREVIEW_THEME__) applyDocumentTheme(window.__AGY_PREVIEW_THEME__);
    if (window.__AGY_PREVIEW_LANG__) {
      state.lang = window.__AGY_PREVIEW_LANG__;
      state.langManual = true;
    }
    app.ontoolresult({ structuredContent: window.__AGY_PREVIEW__ });
    return;
  }
  render();
  try {
    await app.connect();
    const ctx = app.getHostContext();
    if (ctx?.theme) applyDocumentTheme(ctx.theme);
    if (ctx?.styles?.variables) applyHostStyleVariables(ctx.styles.variables);
    render();
  } catch {}
}

boot();
