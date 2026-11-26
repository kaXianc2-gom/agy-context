/**
 * agy-context v5.1 MCP Server — Context Lens / 上下文透视
 * Global Context Lens Dashboard + Dual-Column In-Chat Context Anatomy Engine.
 * Supports both English (--lang=en) and Chinese (--lang=zh) editions cleanly.
 */

import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import http from "node:http";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

const APP_URI = "ui://agy-context/app.html";
const MIME_MCP_APP = "text/html;profile=mcp-app";

const args = process.argv.slice(2);
function getFlag(prefix, fallback) {
  const hit = args.find((a) => a.startsWith(prefix));
  return hit ? hit.slice(prefix.length) : fallback;
}

const DEFAULT_LANG = getFlag("--lang=", process.env.AGY_CONTEXT_LANG || "en").toLowerCase().startsWith("zh") ? "zh" : "en";
const IS_ZH = DEFAULT_LANG === "zh";

const HOME = os.homedir();
const BRAIN_DIR = path.join(HOME, ".gemini", "antigravity", "brain");
const PLUGINS_ROOT = path.join(HOME, ".gemini", "config", "plugins");
const BUILTIN_SKILLS_ROOT = path.join(HOME, ".gemini", "antigravity", "builtin", "skills");
const MCP_SCHEMAS_ROOT = path.join(HOME, ".gemini", "antigravity", "mcp");
const DEFAULT_PLUGIN_ROOT = path.join(PLUGINS_ROOT, "agy-context");
const PLUGIN_ROOT = getFlag("--plugin-root=", process.env.PLUGIN_ROOT || DEFAULT_PLUGIN_ROOT);
const DATA_DIR = getFlag("--data-dir=", process.env.PLUGIN_DATA || path.join(PLUGIN_ROOT, ".data"));
const APP_HTML_PATH = path.join(PLUGIN_ROOT, "assets", "app.html");

const MODEL_CATALOG = [
  { match: /gemini-4-hydrogen/i, label: "Gemini 4 Hydrogen", window: 1_000_000, inRate: 2.50, cacheRate: 0.25, outRate: 15.00 },
  { match: /gemini-4-carbon/i, label: "Gemini 4 Carbon", window: 1_000_000, inRate: 1.25, cacheRate: 0.125, outRate: 10.00 },
  { match: /gemini-4-neon/i, label: "Gemini 4 Neon", window: 1_000_000, inRate: 0.50, cacheRate: 0.05, outRate: 3.00 },
  { match: /gemini-3\.8-flash/i, label: "Gemini 3.8 Flash", window: 1_000_000, inRate: 0.30, cacheRate: 0.03, outRate: 2.50 },
  { match: /gemini-3(?:\b|-|$)/i, label: "Gemini 3", window: 1_000_000, inRate: 1.00, cacheRate: 0.10, outRate: 6.00 },
  { match: /claude-opus-5-5/i, label: "Claude Opus 5.5", window: 200_000, inRate: 5.00, cacheRate: 0.50, outRate: 25.00 },
  { match: /claude-opus-4/i, label: "Claude Opus 4", window: 200_000, inRate: 5.00, cacheRate: 0.50, outRate: 25.00 },
  { match: /claude-opus/i, label: "Claude Opus", window: 200_000, inRate: 5.00, cacheRate: 0.50, outRate: 25.00 },
  { match: /claude-sonnet-4-6/i, label: "Claude Sonnet 4.6", window: 200_000, inRate: 3.00, cacheRate: 0.30, outRate: 15.00 },
  { match: /claude-sonnet-4/i, label: "Claude Sonnet 4", window: 200_000, inRate: 3.00, cacheRate: 0.30, outRate: 15.00 },
  { match: /claude-sonnet/i, label: "Claude Sonnet", window: 200_000, inRate: 3.00, cacheRate: 0.30, outRate: 15.00 },
];

const COMP_KEYS = ["sysPrompt", "toolDefs", "user", "injected", "skill", "tool", "thinking", "assistant"];
const FAST_IO_TOOLS = new Set([
  "read_file", "view_file", "write_file", "write_to_file", "edit_file",
  "replace_file_content", "list_dir", "find_by_name", "update_steps", "update_focus",
]);
const READ_TOOLS = new Set(["read_file", "view_file", "list_dir", "find_by_name"]);
const WRITE_TOOLS = new Set(["write_file", "write_to_file", "edit_file", "replace_file_content"]);

function emptyComp() {
  return { sysPrompt: 0, toolDefs: 0, user: 0, injected: 0, skill: 0, tool: 0, thinking: 0, assistant: 0 };
}

function prettifyModelSlug(slug) {
  return slug
    .split("-")
    .map((w) => (/^(xhigh|high|medium|low|max)$/i.test(w) ? `(${w.toUpperCase()})` : w.charAt(0).toUpperCase() + w.slice(1)))
    .join(" ");
}

export function getModelMeta(rawModel) {
  if (!rawModel || rawModel === "unknown" || rawModel === "legacy-unspecified") {
    return { id: "legacy-unspecified", label: "历史默认模型", shortGroup: "历史默认模型", window: 1_000_000, inRate: 0.50, cacheRate: 0.05, outRate: 3.00 };
  }
  const effortMatch = rawModel.match(/-(xhigh|high|medium|low|max)$/i);
  const effort = effortMatch ? effortMatch[1].toUpperCase() : "";
  for (const entry of MODEL_CATALOG) {
    if (entry.match.test(rawModel)) {
      return {
        id: rawModel,
        label: effort ? `${entry.label} (${effort})` : entry.label,
        shortGroup: entry.label,
        window: entry.window,
        inRate: entry.inRate,
        cacheRate: entry.cacheRate,
        outRate: entry.outRate,
      };
    }
  }
  const isClaude = /claude/i.test(rawModel);
  const label = prettifyModelSlug(rawModel);
  return {
    id: rawModel,
    label,
    shortGroup: label.replace(/\s*\([^)]+\)$/, ""),
    window: isClaude ? 200_000 : 1_000_000,
    inRate: isClaude ? 3.0 : 0.75,
    cacheRate: isClaude ? 0.3 : 0.075,
    outRate: isClaude ? 15.0 : 4.0,
  };
}

function calcCost(meta, inputTokens, cacheReadTokens, outputTokens) {
  const usd =
    (inputTokens / 1e6) * meta.inRate +
    (cacheReadTokens / 1e6) * meta.cacheRate +
    (outputTokens / 1e6) * meta.outRate;
  const uncached =
    ((inputTokens + cacheReadTokens) / 1e6) * meta.inRate +
    (outputTokens / 1e6) * meta.outRate;
  return { usd, savedUsd: Math.max(0, uncached - usd) };
}

export function toLocalDayKey(isoOrDate) {
  if (!isoOrDate) return "";
  const d = isoOrDate instanceof Date ? isoOrDate : new Date(isoOrDate);
  if (Number.isNaN(d.getTime())) return String(isoOrDate).slice(0, 10);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function estTokens(text) {
  if (!text) return 0;
  const s = typeof text === "string" ? text : JSON.stringify(text);
  let cjk = 0;
  for (let i = 0; i < s.length; i++) {
    const code = s.charCodeAt(i);
    if (code >= 0x2e80 && code <= 0x9fff) cjk++;
  }
  return Math.max(1, Math.round(cjk * 0.65 + (s.length - cjk) / 3.7));
}

function unquoteArg(val) {
  if (typeof val !== "string") return val;
  if (val.length >= 2 && val.startsWith('"') && val.endsWith('"')) {
    try {
      return JSON.parse(val);
    } catch {
      return val.slice(1, -1);
    }
  }
  return val;
}

function extractUserParts(raw) {
  if (!raw) return { userText: "", injectedText: "" };
  const reqMatch = raw.match(/<USER_REQUEST>\s*([\s\S]*?)\s*<\/USER_REQUEST>/);
  const userText = (reqMatch ? reqMatch[1] : raw).trim();
  const injectedChunks = [];
  for (const tag of ["ADDITIONAL_METADATA", "USER_SETTINGS_CHANGE", "SYSTEM_MESSAGE", "CONTEXT_SUMMARY"]) {
    const re = new RegExp(`<${tag}>([\\s\\S]*?)<\\/${tag}>`, "g");
    for (const m of raw.matchAll(re)) injectedChunks.push(m[0]);
  }
  return { userText, injectedText: injectedChunks.join("\n").trim() };
}

function parseGenericTimestamps(content) {
  if (!content) return null;
  const cMatch = content.match(/Created At:\s*([^\r\n]+)/);
  const eMatch = content.match(/Completed At:\s*([^\r\n]+)/);
  if (!cMatch || !eMatch) return null;
  const t0 = Date.parse(cMatch[1].trim());
  const t1 = Date.parse(eMatch[1].trim());
  if (Number.isNaN(t0) || Number.isNaN(t1) || t1 < t0) return null;
  return { startMs: t0, endMs: t1, durationMs: t1 - t0 };
}

function extractWorkspaceTag(rawStr) {
  if (!rawStr) return null;
  const norm = String(rawStr).replace(/\\/g, "/");
  const m1 = norm.match(/\/antigravity\/scratch\/([^/"'\s;]+)/i);
  if (m1) return m1[1];
  const m2 = norm.match(/\/config\/plugins\/([^/"'\s;]+)/i);
  if (m2) return `plugin:${m2[1]}`;
  const m3 = norm.match(/\/Desktop\/([^/"'\s;]+)/i);
  if (m3) return `Desktop/${m3[1].replace(/\.[a-z0-9]+$/i, "")}`;
  const m4 = norm.match(/\/Documents\/([^/"'\s;]+)/i);
  if (m4) return `Documents/${m4[1]}`;
  return null;
}

export function inferProgram(cmdLine) {
  if (!cmdLine) return "pwsh";
  const raw = String(cmdLine).trim();
  if (!raw) return "pwsh";

  const herePipe = raw.match(/['"]@\s*\|\s*(?:&\s*)?(?:"([^"]+)"|'([^']+)'|([^\s|;&]+))/i);
  if (herePipe) {
    const exe = herePipe[1] || herePipe[2] || herePipe[3] || "";
    const b = path.basename(exe).replace(/\.(exe|cmd|ps1|bat)$/i, "").toLowerCase();
    if (b === "python" && /\s-m\s+pytest\b/i.test(raw)) return "pytest";
    if (/^[a-z0-9][a-z0-9._-]{0,30}$/.test(b)) return b;
  }

  let cleaned = raw
    .replace(/^\s*#[^\r\n]*[\r\n]+/gm, "")
    .replace(/^\s*\$[a-zA-Z0-9_]+\s*=\s*@\([\s\S]*?\)\s*;?\s*/m, "")
    .trim();

  let changed = true;
  while (changed) {
    changed = false;
    const next = cleaned
      .replace(/^(?:Set-Location|cd|Push-Location)\s+(?:"[^"]*"|'[^']*'|[^;&\r\n]+)[;&\r\n]+\s*/i, "")
      .replace(/^\$env:[a-zA-Z0-9_]+\s*=\s*[^;&\r\n]+[;&\r\n]+\s*/i, "")
      .replace(/^\[[a-zA-Z0-9_.:]+\]::[a-zA-Z0-9_]+\s*=\s*[^;&\r\n]+[;&\r\n]+\s*/i, "")
      .replace(/^\$[a-zA-Z0-9_]+\s*=\s*[^\r\n]+[\r\n]+\s*/, "")
      .replace(/^\$[a-zA-Z0-9_]+\s*=\s*[^;]+;\s*/, "")
      .trim();
    if (next !== cleaned && next.length > 0) {
      cleaned = next;
      changed = true;
    }
  }

  const quotedCall = cleaned.match(/^(?:&\s*)?["']([^"']+\.(?:exe|cmd|bat|ps1))["']/i);
  if (quotedCall) {
    const b = path.basename(quotedCall[1]).replace(/\.(exe|cmd|ps1|bat)$/i, "").toLowerCase();
    if (/^[a-z0-9][a-z0-9._-]{0,30}$/.test(b)) return b;
  }

  const unprefixed = cleaned.replace(/^[&(\s]+/, "");
  const firstTok = unprefixed.split(/[\s|;&()\r\n]+/)[0] || "";
  const base = path
    .basename(firstTok.replace(/^['"]+|['"]+$/g, ""))
    .replace(/\.(exe|cmd|ps1|bat)$/i, "")
    .toLowerCase();

  const PS_KEYWORDS = new Set(["if", "else", "elseif", "foreach", "for", "while", "switch", "try", "catch", "function", "return", "param", "exit", "do"]);
  if (!base || PS_KEYWORDS.has(base) || !/^[a-z][a-z0-9._-]{0,30}$/.test(base)) {
    if (/\bmsedge(?:\.exe)?\b/i.test(raw)) return "msedge";
    if (/\bpytest\b/i.test(raw)) return "pytest";
    if (/\bpython(?:3)?(?:\.exe)?\b/i.test(raw)) return "python";
    if (/\bnode(?:\.exe)?\b/i.test(raw)) return "node";
    if (/\bnpm(?:\.cmd)?\b/i.test(raw)) return "npm";
    if (/\bnpx(?:\.cmd)?\b/i.test(raw)) return "npx";
    if (/\bgit(?:\.exe)?\b/i.test(raw)) return "git";
    if (/\buv(?:\.exe)?\b/i.test(raw)) return "uv";
    if (/\bInvoke-(?:WebRequest|RestMethod)\b/i.test(raw)) return "invoke-webrequest";
    if (/\bRemove-Item\b/i.test(raw)) return "remove-item";
    if (/\bGet-ChildItem\b/i.test(raw)) return "get-childitem";
    return "pwsh";
  }

  if (base === "python" && /\s-m\s+pytest\b/i.test(raw)) return "pytest";
  return base;
}

function extractSkillName(filePath) {
  if (!filePath) return null;
  const norm = filePath.replace(/\\/g, "/");
  const m = norm.match(/\/skills\/([^/]+)\/(SKILL\.md|references\/)/i);
  if (m) return m[1];
  if (/\/skills\/SKILL\.md$/i.test(norm)) {
    const p2 = norm.match(/\/plugins\/([^/]+)\/skills\/SKILL\.md$/i);
    return p2 ? p2[1] : "skill";
  }
  return null;
}

function ensureDaySlice(byDay, dayKey) {
  if (!byDay[dayKey]) {
    byDay[dayKey] = {
      input: 0,
      cache: 0,
      output: 0,
      requests: 0,
      turns: 0,
      toolCalls: 0,
      usd: 0,
      savedUsd: 0,
      waitMs: 0,
      thinkMs: 0,
      replyMs: 0,
      toolArgMs: 0,
      toolExecMs: 0,
      otherMs: 0,
      thinkingBlocks: 0,
      replyBlocks: 0,
      toolArgBlocks: 0,
      models: {},
      skills: {},
      tools: {},
      programs: {},
      comp: emptyComp(),
    };
  }
  return byDay[dayKey];
}

// ---------------------------------------------------------------------------
// Real Static Catalog Baseline Measurement (cached 60s)
// ---------------------------------------------------------------------------

function walkSkillFiles(dir, out = []) {
  if (!fs.existsSync(dir)) return out;
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const fp = path.join(dir, ent.name);
    if (ent.isDirectory()) walkSkillFiles(fp, out);
    else if (ent.isFile() && ent.name === "SKILL.md") out.push(fp);
  }
  return out;
}

function parseSkillCatalogCost(filePath) {
  let raw = "";
  try {
    raw = fs.readFileSync(filePath, "utf-8");
  } catch {
    return { name: path.basename(path.dirname(filePath)), dirTokens: 0 };
  }
  let name = path.basename(path.dirname(filePath));
  let desc = "";
  const fm = raw.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (fm) {
    const nMatch = fm[1].match(/^name:\s*(.+)$/m);
    const dMatch = fm[1].match(/^description:\s*([\s\S]*?)(?:\r?\n[a-zA-Z0-9_-]+:|$)/m);
    if (nMatch) name = nMatch[1].trim().replace(/^['"]|['"]$/g, "");
    if (dMatch) desc = dMatch[1].replace(/\s+/g, " ").trim();
  }
  return { name, dirTokens: estTokens(`- ${name} (${filePath}): ${desc}`) };
}

let catalogCache = { ts: 0, data: null };

function getStaticCatalogSummary() {
  if (catalogCache.data && Date.now() - catalogCache.ts < 60_000) {
    return catalogCache.data;
  }
  const mcpToolCounts = new Map();
  let totalMcpTools = 0;
  if (fs.existsSync(MCP_SCHEMAS_ROOT)) {
    for (const ent of fs.readdirSync(MCP_SCHEMAS_ROOT, { withFileTypes: true })) {
      if (!ent.isDirectory()) continue;
      const cnt = fs.readdirSync(path.join(MCP_SCHEMAS_ROOT, ent.name)).filter((f) => f.endsWith(".json")).length;
      mcpToolCounts.set(ent.name, cnt);
      totalMcpTools += cnt;
    }
  }

  const builtinSkills = walkSkillFiles(BUILTIN_SKILLS_ROOT).map(parseSkillCatalogCost);
  let totalSkills = builtinSkills.length;
  let measuredToolDefTokens = 5_200 + builtinSkills.reduce((s, x) => s + x.dirTokens, 0); // ~5.2k core builtin tool JSON schemas

  const pluginRows = [];
  if (fs.existsSync(PLUGINS_ROOT)) {
    for (const ent of fs.readdirSync(PLUGINS_ROOT, { withFileTypes: true })) {
      if (!ent.isDirectory()) continue;
      const dir = ent.name;
      const pDir = path.join(PLUGINS_ROOT, dir);
      let displayName = dir, pluginName = dir, disabled = false;
      const pj = path.join(pDir, "plugin.json");
      if (fs.existsSync(pj)) {
        try {
          const parsed = JSON.parse(fs.readFileSync(pj, "utf-8"));
          pluginName = parsed.name || dir;
          displayName = parsed.displayName || pluginName;
          disabled = Boolean(parsed.disabled);
        } catch {}
      }
      if (disabled) continue;

      const skills = walkSkillFiles(path.join(pDir, "skills")).map(parseSkillCatalogCost);
      totalSkills += skills.length;
      let tokens = skills.reduce((s, x) => s + x.dirTokens, 0);
      const rulesDir = path.join(pDir, "rules");
      if (fs.existsSync(rulesDir)) {
        for (const rf of fs.readdirSync(rulesDir)) {
          if (rf.toUpperCase() === "AGENTS.MD") tokens += estTokens(fs.readFileSync(path.join(rulesDir, rf), "utf-8"));
          else if (rf.endsWith(".md")) tokens += 45;
        }
      }
      let mcpTools = 0;
      for (const [sName, cnt] of mcpToolCounts.entries()) {
        if (sName.startsWith(`${pluginName}_`) || sName.startsWith(`${dir}_`)) {
          mcpTools += cnt;
          tokens += 12 + cnt * 8;
        }
      }
      measuredToolDefTokens += tokens;
      pluginRows.push({ name: displayName, dir, skillNames: skills.map((x) => x.name), skills: skills.length, mcpTools, tokens });
    }
  }

  pluginRows.sort((a, b) => b.tokens - a.tokens);
  const data = { totalSkills, totalMcpTools, measuredToolDefTokens, pluginRows };
  catalogCache = { ts: Date.now(), data };
  return data;
}

export function computeBaselineBreakdown(entries) {
  const cat = getStaticCatalogSummary();
  const d30 = new Date();
  d30.setDate(d30.getDate() - 29);
  const cutoff = toLocalDayKey(d30);
  const skillUses30d = {};
  for (const e of entries) {
    for (const [day, slice] of Object.entries(e.summary.byDay)) {
      if (day < cutoff) continue;
      for (const [sk, cnt] of Object.entries(slice.skills || {})) {
        skillUses30d[sk] = (skillUses30d[sk] || 0) + cnt;
      }
    }
  }
  const rows = cat.pluginRows.map((p) => ({
    name: p.name,
    dir: p.dir,
    skills: p.skills,
    mcpTools: p.mcpTools,
    tokens: p.tokens,
    uses30d: p.skillNames.reduce((s, n) => s + (skillUses30d[n] || 0), 0),
  }));
  return { totalSkills: cat.totalSkills, totalMcpTools: cat.totalMcpTools, measuredToolDefTokens: cat.measuredToolDefTokens, rows };
}

// ---------------------------------------------------------------------------
// Antigravity ConversationService Sync (15s TTL cache + pagination)
// ---------------------------------------------------------------------------

const projectionCache = new Map();
let lsCache = { ts: 0, map: new Map() };

function fetchLsPage(urlObj, token, pageToken = "") {
  return new Promise((resolve) => {
    const payload = { pageSize: 100, includeArchived: true };
    if (pageToken) payload.pageToken = pageToken;
    const body = JSON.stringify(payload);
    const req = http.request(
      {
        hostname: urlObj.hostname,
        port: Number(urlObj.port),
        path: "/product.v1.ConversationService/ListConversations",
        method: "POST",
        timeout: 3500,
        headers: {
          "Content-Type": "application/json",
          "Connect-Protocol-Version": "1",
          "x-antigravity-csrf-token": token,
          "Content-Length": Buffer.byteLength(body),
        },
      },
      (res) => {
        const chunks = [];
        res.on("data", (c) => chunks.push(c));
        res.on("end", () => {
          try {
            resolve(JSON.parse(Buffer.concat(chunks).toString("utf-8")));
          } catch {
            resolve(null);
          }
        });
      }
    );
    req.on("error", () => resolve(null));
    req.on("timeout", () => {
      req.destroy();
      resolve(null);
    });
    req.write(body);
    req.end();
  });
}

async function fetchLsConversations(forceRefresh = false) {
  if (!forceRefresh && Date.now() - lsCache.ts < 15_000 && lsCache.map.size > 0) {
    return lsCache.map;
  }
  const addr = process.env.ANTIGRAVITY_LS_ADDRESS;
  const token = process.env.ANTIGRAVITY_CSRF_TOKEN;
  if (!addr || !token) return lsCache.map;
  let urlObj;
  try {
    urlObj = new URL(`http://${addr}`);
  } catch {
    return lsCache.map;
  }
  const map = new Map();
  let pageToken = "";
  for (let page = 0; page < 5; page++) {
    const parsed = await fetchLsPage(urlObj, token, pageToken);
    if (!parsed || !Array.isArray(parsed.conversations)) break;
    for (const c of parsed.conversations) {
      map.set(c.id, {
        title: c.annotations?.title || c.state?.summary || "",
        projectId: c.metadata?.projectId || "",
        parentConversationId: c.metadata?.parentConversationId || "",
        rootConversationId: c.metadata?.rootConversationId || "",
        archived: Boolean(c.annotations?.archived),
        pinned: Boolean(c.annotations?.pinned),
        runState: c.state?.runState || "",
      });
    }
    if (!parsed.nextPageToken) break;
    pageToken = parsed.nextPageToken;
  }
  if (map.size > 0) {
    lsCache = { ts: Date.now(), map };
  }
  return map.size > 0 ? map : lsCache.map;
}

// ---------------------------------------------------------------------------
// Transcript Parser (Single-pass with epoch, diffing, workspace & subagent links)
// ---------------------------------------------------------------------------

function resolveTranscriptPath(convId) {
  const logsDir = path.join(BRAIN_DIR, convId, ".system_generated", "logs");
  const fullPath = path.join(logsDir, "transcript_full.jsonl");
  if (fs.existsSync(fullPath)) return fullPath;
  const compactPath = path.join(logsDir, "transcript.jsonl");
  if (fs.existsSync(compactPath)) return compactPath;
  return null;
}

export function parseTranscript(convId, transcriptPath, stat) {
  const cached = projectionCache.get(convId);
  if (cached && cached.mtimeMs === stat.mtimeMs && cached.size === stat.size) {
    return cached;
  }

  const staticCat = getStaticCatalogSummary();
  const lines = fs.readFileSync(transcriptPath, "utf-8").split(/\r?\n/);

  let firstUserText = "";
  let lastUserText = "";
  let firstAssistantText = "";
  let createdAt = "";
  let updatedAt = "";
  let lastModel = "";
  let sysPromptBase = 0;
  let toolDefsBase = 0;
  let inferredParentId = "";
  const spawnedChildIds = new Set();
  const workspaceVotes = {};

  let totalInput = 0;
  let totalCacheRead = 0;
  let totalOutput = 0;
  let totalCostUsd = 0;
  let totalSavedUsd = 0;
  let turnCount = 0;
  let requestCount = 0;
  let toolCallCount = 0;
  let cmdExecCount = 0;
  let skillLoadCount = 0;
  let replyCount = 0;
  let readFileCount = 0;
  let writeFileCount = 0;

  // Context events
  let injectionEvents = 0;
  let compactionEvents = 0;
  let cacheDropEvents = 0;
  let modelSwitchEvents = 0;
  let compactionEpoch = 0;

  // Timing breakdown
  let waitMs = 0, thinkMs = 0, replyMs = 0, toolArgMs = 0, otherMs = 0;
  let thinkingBlocks = 0, replyBlocks = 0, toolArgBlocks = 0;
  const toolIntervals = [];
  const dayToolIntervals = {};

  const byDay = {};
  const nodes = [];
  const requests = [];
  const sessionCompTotals = emptyComp();
  const sessionModels = {};
  const sessionTools = {};
  const sessionSkills = {};
  const sessionPrograms = {};

  // Surface token estimators for current window composition
  let rawUserEst = 0;
  let rawInjectedEst = 0;
  let rawSkillEst = 0;
  let rawToolEst = 0;
  let rawThinkEst = 0;
  let rawReplyEst = 0;

  let prevPromptTokens = 0;
  let prevCacheRatio = null;
  let prevModelId = "";
  let pendingMarker = null;
  let pendingToolQueue = [];
  let lastStepTimeMs = null;
  let nodeCounter = 0;

  for (let idx = 0; idx < lines.length; idx++) {
    const rawLine = lines[idx];
    if (!rawLine) continue;
    let step;
    try {
      step = JSON.parse(rawLine);
    } catch {
      continue;
    }

    const lineNo = idx + 1;
    const stepSeq = step.step_index ?? idx;
    const stepTime = step.created_at || "";
    const stepMs = stepTime ? Date.parse(stepTime) : NaN;
    const dayKey = toLocalDayKey(stepTime);
    const hasTruncated = Array.isArray(step.truncated_fields) && step.truncated_fields.length > 0;

    if (!createdAt && stepTime) createdAt = stepTime;
    if (stepTime) updatedAt = stepTime;

    const srcType = `${step.source}:${step.type}`;

    if (srcType === "USER_EXPLICIT:USER_INPUT") {
      const rawContent = step.content || "";
      const mChange = rawContent.match(/changed setting `Model Selection` from [^\r\n]+? to ([^\r\n.]+)\./i);
      if (mChange) {
        const slug = mChange[1].trim().toLowerCase().replace(/[\s()]+/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "");
        if (slug) lastModel = slug;
      }
      for (const mAt of rawContent.matchAll(/@\[([^\]]+)\]/g)) {
        const ws = extractWorkspaceTag(mAt[1]);
        if (ws) workspaceVotes[ws] = (workspaceVotes[ws] || 0) + 2;
      }

      const { userText, injectedText } = extractUserParts(rawContent);
      if (userText) {
        if (!firstUserText) firstUserText = userText;
        lastUserText = userText;
      }
      turnCount++;
      if (dayKey) ensureDaySlice(byDay, dayKey).turns += 1;

      const uTok = estTokens(userText || rawContent);
      rawUserEst += uTok;
      if (!Number.isNaN(stepMs)) lastStepTimeMs = stepMs;

      nodes.push({
        id: `n-${++nodeCounter}`,
        lineNo,
        seq: stepSeq,
        turn: turnCount,
        reqIndex: requestCount + 1,
        epoch: compactionEpoch,
        cat: "user",
        kindLabel: "用户消息",
        title: (userText || "用户输入").replace(/\s+/g, " ").slice(0, 100),
        tokens: uTok,
        truncated: hasTruncated || (userText || rawContent).length > 1000,
        preview: (userText || rawContent).slice(0, 1000),
      });

      if (injectedText) {
        const injTok = estTokens(injectedText);
        rawInjectedEst += injTok;
        injectionEvents++;
        nodes.push({
          id: `n-${++nodeCounter}`,
          lineNo,
          seq: stepSeq,
          turn: turnCount,
          reqIndex: requestCount + 1,
          epoch: compactionEpoch,
          cat: "injected",
          kindLabel: "上下文注入",
          title: injectedText.includes("USER_SETTINGS_CHANGE") ? "模型/环境配置变更注入" : "元数据与环境上下文注入",
          tokens: injTok,
          truncated: injectedText.length > 1000,
          preview: injectedText.slice(0, 1000),
        });
      }
      continue;
    }

    if (srcType === "SYSTEM:SYSTEM_MESSAGE") {
      const content = step.content || "";
      if (!inferredParentId) {
        const sm = content.match(/sender=([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})/i);
        if (sm && sm[1] !== convId) inferredParentId = sm[1];
      }
      const tok = estTokens(content);
      rawInjectedEst += tok;
      injectionEvents++;
      nodes.push({
        id: `n-${++nodeCounter}`,
        lineNo,
        seq: stepSeq,
        turn: Math.max(turnCount, 1),
        reqIndex: requestCount + 1,
        epoch: compactionEpoch,
        cat: "injected",
        kindLabel: "系统注入",
        title: content.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim().slice(0, 96) || "系统事件注入",
        tokens: tok,
        truncated: hasTruncated || content.length > 1000,
        preview: content.slice(0, 1000),
      });
      continue;
    }

    if (srcType === "SYSTEM:CHECKPOINT") {
      compactionEvents++;
      compactionEpoch++;
      const afterTotal = (step.input_tokens || 0) + (step.cache_read_tokens || 0) + (step.output_tokens || 0);
      const prevDyn = rawUserEst + rawInjectedEst + rawSkillEst + rawToolEst + rawThinkEst + rawReplyEst;
      const baseSum = sysPromptBase + toolDefsBase;
      if (prevDyn > 0 && afterTotal > 0) {
        const keepRatio = Math.min(1, Math.max(1000, afterTotal - baseSum) / prevDyn);
        rawUserEst = Math.round(rawUserEst * keepRatio);
        rawInjectedEst = Math.round(rawInjectedEst * keepRatio);
        rawSkillEst = Math.round(rawSkillEst * keepRatio);
        rawToolEst = Math.round(rawToolEst * keepRatio);
        rawThinkEst = Math.round(rawThinkEst * keepRatio);
        rawReplyEst = Math.round(rawReplyEst * keepRatio);
      }
      pendingMarker = "compaction";
      const sumTok = step.output_tokens || estTokens(step.content || "");
      rawInjectedEst += sumTok;
      nodes.push({
        id: `n-${++nodeCounter}`,
        lineNo,
        seq: stepSeq,
        turn: Math.max(turnCount, 1),
        reqIndex: requestCount + 1,
        epoch: compactionEpoch,
        cat: "injected",
        kindLabel: "压缩摘要",
        title: `上下文自动压缩检查点 #${compactionEvents}`,
        tokens: sumTok,
        truncated: hasTruncated || (step.content || "").length > 1000,
        preview: (step.content || "").slice(0, 1000),
      });
      continue;
    }

    if (srcType === "MODEL:GENERIC") {
      const content = step.content || "";
      const matched = pendingToolQueue.shift() || null;

      if (matched?.name === "invoke_subagent") {
        const cm = content.match(/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})/i);
        if (cm && cm[1] !== convId) spawnedChildIds.add(cm[1]);
      }

      const timing = parseGenericTimestamps(content);
      if (timing) {
        const maxToolMs = matched && FAST_IO_TOOLS.has(matched.name) ? 15_000 : 90_000;
        const cappedEnd = Math.min(timing.endMs, timing.startMs + maxToolMs);
        toolIntervals.push([timing.startMs, cappedEnd]);
        const dKey = toLocalDayKey(new Date(timing.startMs));
        if (dKey) {
          if (!dayToolIntervals[dKey]) dayToolIntervals[dKey] = [];
          dayToolIntervals[dKey].push([timing.startMs, cappedEnd]);
        }
      }
      if (!Number.isNaN(stepMs)) lastStepTimeMs = stepMs;

      const tok = estTokens(content);
      if (matched?.skillName) {
        rawSkillEst += tok;
        nodes.push({
          id: `n-${++nodeCounter}`,
          lineNo,
          seq: stepSeq,
          turn: Math.max(turnCount, 1),
          reqIndex: requestCount,
          epoch: compactionEpoch,
          cat: "skill",
          kindLabel: "技能注入",
          title: matched.skillName,
          tokens: tok,
          truncated: hasTruncated || content.length > 1000,
          preview: content.slice(0, 1000),
        });
      } else {
        rawToolEst += tok;
        nodes.push({
          id: `n-${++nodeCounter}`,
          lineNo,
          seq: stepSeq,
          turn: Math.max(turnCount, 1),
          reqIndex: requestCount,
          epoch: compactionEpoch,
          cat: "tool",
          kindLabel: matched ? matched.name : "工具结果",
          title: matched?.targetLabel || (matched ? `${matched.name} 返回` : "工具输出"),
          tokens: tok,
          truncated: hasTruncated || content.length > 1000,
          preview: content.slice(0, 1000),
        });
      }
      continue;
    }

    if (srcType === "MODEL:PLANNER_RESPONSE") {
      requestCount++;
      const modelId = step.model || lastModel || "legacy-unspecified";
      const meta = getModelMeta(modelId);
      if (prevModelId && modelId !== prevModelId) {
        modelSwitchEvents++;
        if (!pendingMarker) pendingMarker = "model_switch";
      }
      prevModelId = modelId;
      lastModel = modelId;

      const inp = step.input_tokens || 0;
      const cac = step.cache_read_tokens || 0;
      const out = step.output_tokens || 0;
      const promptTotal = inp + cac;
      const costObj = calcCost(meta, inp, cac, out);

      // Detect cache-drop inflection (hit ratio plunges >=40pp from >=55%)
      const curCacheRatio = promptTotal > 0 ? cac / promptTotal : null;
      let cacheDrop = false;
      if (requestCount >= 3 && promptTotal > 10_000 && prevCacheRatio !== null && prevCacheRatio >= 0.55 && curCacheRatio !== null && curCacheRatio <= prevCacheRatio - 0.40) {
        cacheDrop = true;
        cacheDropEvents++;
      }
      if (promptTotal > 2000 && curCacheRatio !== null) prevCacheRatio = curCacheRatio;

      totalInput += inp;
      totalCacheRead += cac;
      totalOutput += out;
      totalCostUsd += costObj.usd;
      totalSavedUsd += costObj.savedUsd;

      if (!sessionModels[modelId]) {
        sessionModels[modelId] = { id: modelId, label: meta.label, shortGroup: meta.shortGroup, totalTokens: 0, requests: 0, usd: 0 };
      }
      sessionModels[modelId].totalTokens += promptTotal + out;
      sessionModels[modelId].requests += 1;
      sessionModels[modelId].usd += costObj.usd;

      if (requestCount === 1 && promptTotal > 0) {
        const totalBase = Math.min(48_000, Math.max(2000, promptTotal - rawUserEst - rawInjectedEst));
        // Calibrate toolDefsBase from real local plugin/skill/MCP catalog scan!
        toolDefsBase = Math.min(Math.round(totalBase * 0.80), Math.max(1200, staticCat.measuredToolDefTokens));
        sysPromptBase = Math.max(600, totalBase - toolDefsBase);
        if (promptTotal - rawUserEst - rawInjectedEst > 48_000) {
          rawUserEst += promptTotal - rawUserEst - rawInjectedEst - 48_000;
        }
        nodes.unshift(
          {
            id: "n-sys-base",
            lineNo: 1,
            seq: 0,
            turn: 1,
            reqIndex: 1,
            epoch: -1, // always in current window
            cat: "sysPrompt",
            kindLabel: "系统提示词",
            title: "核心系统指令与安全策略基线",
            tokens: sysPromptBase,
            truncated: false,
            preview: `首轮固定系统提示词约 ${sysPromptBase.toLocaleString()} tokens（随每轮前缀缓存复用）。`,
          },
          {
            id: "n-baseline",
            lineNo: 1,
            seq: 0,
            turn: 1,
            reqIndex: 1,
            epoch: -1, // always in current window
            cat: "toolDefs",
            kindLabel: "工具与技能目录",
            title: `${staticCat.totalSkills} 项技能目录 + ${staticCat.totalMcpTools} 项 MCP 工具定义`,
            tokens: toolDefsBase,
            truncated: false,
            preview: `按本机已启用插件实测标定：工具定义与技能目录固定基线约 ${toolDefsBase.toLocaleString()} tokens。`,
          }
        );
      }

      const thinkEst = estTokens(step.thinking || "");
      const ansEst = estTokens(step.content || "");
      const tCalls = Array.isArray(step.tool_calls) ? step.tool_calls : [];
      const callEst = tCalls.reduce((s, tc) => s + estTokens(tc.args || "") + 10, 0);
      const outEstTotal = Math.max(1, thinkEst + ansEst + callEst);
      const outScale = out > 0 ? out / outEstTotal : 1;

      const stepThinkTok = Math.round(thinkEst * outScale);
      const stepAnsTok = Math.round(ansEst * outScale);
      const stepCallTok = Math.max(0, out - stepThinkTok - stepAnsTok);

      rawThinkEst += stepThinkTok;
      rawReplyEst += stepAnsTok;
      rawToolEst += stepCallTok;

      // Calibrated model generation duration within physical envelope
      const minGenMs = Math.max(350, Math.round(out * 6.0));
      const maxGenMs = Math.max(45_000, Math.round(out * 40.0));
      let stepDurMs = Math.max(1200, Math.round(out * 11.5));
      if (!Number.isNaN(stepMs) && lastStepTimeMs !== null) {
        const gap = stepMs - lastStepTimeMs;
        if (gap > 200 && gap < 300_000) {
          stepDurMs = Math.min(maxGenMs, Math.max(minGenMs, gap));
        }
      }
      if (!Number.isNaN(stepMs)) lastStepTimeMs = stepMs;

      const stepWait = Math.min(1800, Math.max(180, Math.round(stepDurMs * 0.14)));
      const sOtherMs = Math.min(450, Math.max(45, Math.round(stepDurMs * 0.015)));
      const genMs = Math.max(120, stepDurMs - stepWait - sOtherMs);
      const sThinkMs = Math.round(genMs * (thinkEst / outEstTotal));
      const sReplyMs = Math.round(genMs * (ansEst / outEstTotal));
      const sArgMs = Math.max(0, genMs - sThinkMs - sReplyMs);

      waitMs += stepWait;
      thinkMs += sThinkMs;
      replyMs += sReplyMs;
      toolArgMs += sArgMs;
      otherMs += sOtherMs;
      if (step.thinking) thinkingBlocks++;
      if (step.content) {
        replyBlocks++;
        replyCount++;
      }
      if (tCalls.length > 0) toolArgBlocks += tCalls.length;

      const daySlice = dayKey ? ensureDaySlice(byDay, dayKey) : null;
      if (daySlice) {
        daySlice.input += inp;
        daySlice.cache += cac;
        daySlice.output += out;
        daySlice.requests += 1;
        daySlice.usd += costObj.usd;
        daySlice.savedUsd += costObj.savedUsd;
        daySlice.waitMs += stepWait;
        daySlice.thinkMs += sThinkMs;
        daySlice.replyMs += sReplyMs;
        daySlice.toolArgMs += sArgMs;
        daySlice.otherMs += sOtherMs;
        if (step.thinking) daySlice.thinkingBlocks += 1;
        if (step.content) daySlice.replyBlocks += 1;
        daySlice.toolArgBlocks += tCalls.length;

        if (!daySlice.models[modelId]) {
          daySlice.models[modelId] = { id: modelId, label: meta.label, shortGroup: meta.shortGroup, requests: 0, input: 0, cache: 0, output: 0, usd: 0 };
        }
        const dm = daySlice.models[modelId];
        dm.requests += 1;
        dm.input += inp;
        dm.cache += cac;
        dm.output += out;
        dm.usd += costObj.usd;
      }

      if (step.thinking) {
        nodes.push({
          id: `n-${++nodeCounter}`,
          lineNo,
          seq: stepSeq,
          turn: Math.max(turnCount, 1),
          reqIndex: requestCount,
          epoch: compactionEpoch,
          cat: "thinking",
          kindLabel: "模型思考",
          title: step.thinking.trim().replace(/\s+/g, " ").slice(0, 96) || "模型推理",
          tokens: stepThinkTok,
          truncated: hasTruncated || step.thinking.length > 1000,
          preview: step.thinking.slice(0, 1000),
        });
      }

      pendingToolQueue = [];
      const calledNames = [];

      for (const tc of tCalls) {
        const tName = tc.name || "tool";
        calledNames.push(tName);
        toolCallCount++;
        sessionTools[tName] = (sessionTools[tName] || 0) + 1;
        if (READ_TOOLS.has(tName)) readFileCount++;
        if (WRITE_TOOLS.has(tName)) writeFileCount++;
        if (daySlice) {
          daySlice.toolCalls += 1;
          daySlice.tools[tName] = (daySlice.tools[tName] || 0) + 1;
        }

        const normArgs = {};
        for (const [k, v] of Object.entries(tc.args || {})) normArgs[k] = unquoteArg(v);
        for (const k of ["Path", "TargetFile", "File", "DirectoryPath", "SearchDirectory", "CommandLine"]) {
          if (normArgs[k]) {
            const ws = extractWorkspaceTag(normArgs[k]);
            if (ws) workspaceVotes[ws] = (workspaceVotes[ws] || 0) + 1;
          }
        }

        const targetPath = String(normArgs.Path || normArgs.TargetFile || normArgs.File || "");
        const isRead = tName === "read_file" || tName === "view_file";
        const skillName = isRead && targetPath ? extractSkillName(targetPath) : null;
        if (skillName) {
          skillLoadCount++;
          sessionSkills[skillName] = (sessionSkills[skillName] || 0) + 1;
          if (daySlice) daySlice.skills[skillName] = (daySlice.skills[skillName] || 0) + 1;
        }
        if (tName === "run_command") {
          cmdExecCount++;
          const prog = inferProgram(String(normArgs.CommandLine || ""));
          sessionPrograms[prog] = (sessionPrograms[prog] || 0) + 1;
          if (daySlice) daySlice.programs[prog] = (daySlice.programs[prog] || 0) + 1;
        }

        const targetLabel = targetPath
          ? path.basename(targetPath)
          : String(normArgs.toolSummary || normArgs.query || "").slice(0, 60);

        pendingToolQueue.push({ name: tName, skillName, targetLabel });
      }

      if (step.content) {
        if (!firstAssistantText) firstAssistantText = step.content.trim();
        nodes.push({
          id: `n-${++nodeCounter}`,
          lineNo,
          seq: stepSeq,
          turn: Math.max(turnCount, 1),
          reqIndex: requestCount,
          epoch: compactionEpoch,
          cat: "assistant",
          kindLabel: "模型回复",
          title: step.content.trim().replace(/\s+/g, " ").slice(0, 100) || "助手回复",
          tokens: stepAnsTok,
          truncated: hasTruncated || step.content.length > 1000,
          preview: step.content.slice(0, 1000),
        });
      }

      const baseTotal = sysPromptBase + toolDefsBase;
      const dynActual = Math.max(0, promptTotal - baseTotal);
      const dynSum = Math.max(1, rawUserEst + rawInjectedEst + rawSkillEst + rawToolEst + rawThinkEst + rawReplyEst);
      const dynScale = dynActual / dynSum;

      const comp = {
        sysPrompt: Math.min(promptTotal, sysPromptBase),
        toolDefs: Math.max(0, Math.min(promptTotal - sysPromptBase, toolDefsBase)),
        user: Math.round(rawUserEst * dynScale),
        injected: Math.round(rawInjectedEst * dynScale),
        skill: Math.round(rawSkillEst * dynScale),
        tool: Math.round(rawToolEst * dynScale),
        thinking: Math.round(rawThinkEst * dynScale),
        assistant: Math.round(rawReplyEst * dynScale),
      };

      // Attribute cumulative tokens for both daily slices and session totals
      const cSum = Object.values(comp).reduce((a, b) => a + b, 0) || 1;
      for (const k of COMP_KEYS) {
        const portion = Math.round((comp[k] / cSum) * promptTotal);
        sessionCompTotals[k] += portion;
        if (daySlice) daySlice.comp[k] += portion;
      }
      sessionCompTotals.thinking += stepThinkTok;
      sessionCompTotals.assistant += stepAnsTok;
      sessionCompTotals.tool += stepCallTok;
      if (daySlice) {
        daySlice.comp.thinking += stepThinkTok;
        daySlice.comp.assistant += stepAnsTok;
        daySlice.comp.tool += stepCallTok;
      }

      const delta = requestCount === 1 ? promptTotal : promptTotal - prevPromptTokens;
      prevPromptTokens = promptTotal;

      requests.push({
        reqIndex: requestCount,
        seq: stepSeq,
        turn: Math.max(turnCount, 1),
        epoch: compactionEpoch,
        time: stepTime,
        modelLabel: meta.label,
        promptTokens: promptTotal,
        inputTokens: inp,
        cacheReadTokens: cac,
        outputTokens: out,
        deltaTokens: delta,
        marker: pendingMarker,
        cacheDrop,
        comp,
        summary: step.content ? step.content.trim().replace(/\s+/g, " ").slice(0, 80) : calledNames.join(", "),
      });
      pendingMarker = null;
    }
  }

  function mergeIntervals(ivList) {
    if (!ivList || ivList.length === 0) return 0;
    ivList.sort((a, b) => a[0] - b[0]);
    let sum = 0, cs = -1, ce = -1;
    for (const [s, e] of ivList) {
      if (s > ce) {
        if (ce > cs) sum += ce - cs;
        cs = s;
        ce = e;
      } else if (e > ce) ce = e;
    }
    if (ce > cs) sum += ce - cs;
    return sum;
  }

  const toolExecMs = mergeIntervals(toolIntervals);
  for (const [dKey, ivs] of Object.entries(dayToolIntervals)) {
    ensureDaySlice(byDay, dKey).toolExecMs = mergeIntervals(ivs);
  }

  // Last request with non-zero promptTokens
  let latestReq = null;
  for (let i = requests.length - 1; i >= 0; i--) {
    if (requests[i].promptTokens > 0) {
      latestReq = requests[i];
      break;
    }
  }
  if (!latestReq && requests.length > 0) latestReq = requests[requests.length - 1];

  const latestMeta = getModelMeta(lastModel);
  const currentPrompt = latestReq ? latestReq.promptTokens : 0;
  const currentComp = latestReq ? latestReq.comp : emptyComp();
  const cacheHitPct =
    totalInput + totalCacheRead > 0
      ? Number(((totalCacheRead / (totalInput + totalCacheRead)) * 100).toFixed(2))
      : 0;

  // Build turn-level timeline (carries epoch & lastReqIndex so pinning a turn works identically in Context Browser!)
  const turnsMap = new Map();
  let prevTurnPrompt = 0;
  for (const r of requests) {
    const t = r.turn || 1;
    if (!turnsMap.has(t)) {
      turnsMap.set(t, {
        reqIndex: t,
        turn: t,
        epoch: r.epoch,
        lastReqIndex: r.reqIndex,
        modelLabel: r.modelLabel,
        promptTokens: r.promptTokens,
        inputTokens: 0,
        cacheReadTokens: 0,
        outputTokens: 0,
        deltaTokens: 0,
        marker: null,
        cacheDrop: false,
        comp: r.comp,
      });
    }
    const tr = turnsMap.get(t);
    tr.modelLabel = r.modelLabel;
    tr.epoch = r.epoch;
    tr.lastReqIndex = r.reqIndex;
    if (r.promptTokens > 0) {
      tr.promptTokens = r.promptTokens;
      tr.comp = r.comp;
    }
    tr.inputTokens += r.inputTokens;
    tr.cacheReadTokens += r.cacheReadTokens;
    tr.outputTokens += r.outputTokens;
    if (r.marker === "compaction") tr.marker = "compaction";
    else if (r.marker === "model_switch" && !tr.marker) tr.marker = "model_switch";
    if (r.cacheDrop) tr.cacheDrop = true;
  }
  const turnsTimeline = [...turnsMap.values()].map((tr, idx) => {
    const delta = idx === 0 ? tr.promptTokens : tr.promptTokens - prevTurnPrompt;
    prevTurnPrompt = tr.promptTokens;
    return { ...tr, deltaTokens: delta };
  });

  // Mark active-window membership (post-last-compaction) and keep up to 900 nodes compact
  const latestEpoch = compactionEpoch;
  const annotatedNodes = nodes.map((n) => ({
    ...n,
    inCurrentWindow: n.epoch === -1 || n.epoch === latestEpoch,
  }));
  let keptNodes = annotatedNodes;
  if (annotatedNodes.length > 900) {
    const pinnedBases = annotatedNodes.filter((n) => n.epoch === -1);
    const rest = annotatedNodes.filter((n) => n.epoch !== -1).slice(-(900 - pinnedBases.length));
    keptNodes = [...pinnedBases, ...rest];
  }
  if (keptNodes.length > 240) {
    keptNodes = keptNodes.map((n) =>
      n.preview && n.preview.length > 420
        ? { ...n, truncated: true, preview: n.preview.slice(0, 420) }
        : n
    );
  }

  // Dominant model by token volume
  const modelGroupTotals = {};
  for (const m of Object.values(sessionModels)) {
    modelGroupTotals[m.shortGroup] = (modelGroupTotals[m.shortGroup] || 0) + m.totalTokens;
  }
  const sortedGroups = Object.entries(modelGroupTotals).sort((a, b) => b[1] - a[1]);
  const dominantModelGroup = sortedGroups[0]?.[0] || latestMeta.shortGroup || latestMeta.label;
  const inferredWorkspace = Object.entries(workspaceVotes).sort((a, b) => b[1] - a[1])[0]?.[0] || "通用对话";

  const isSubagent = turnCount === 0 && requestCount > 0;
  const cleanFirstAssist = firstAssistantText.replace(/[#*`>\r\n]+/g, " ").replace(/\s+/g, " ").trim();
  const fallbackTitle = firstUserText
    ? firstUserText.replace(/\s+/g, " ").slice(0, 80)
    : isSubagent && cleanFirstAssist
    ? `子任务: ${cleanFirstAssist.slice(0, 68)}`
    : `会话 ${convId.slice(0, 8)}`;

  const activeMs = waitMs + thinkMs + replyMs + toolArgMs + toolExecMs + otherMs;
  const genTimeSec = Math.max(1, (thinkMs + replyMs + toolArgMs) / 1000);
  const tokPerSec = Math.round(totalOutput / genTimeSec);

  const toTop = (obj) =>
    Object.entries(obj)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);

  const summary = {
    id: convId,
    defaultTitle: fallbackTitle,
    lastUser: (lastUserText || firstUserText || cleanFirstAssist || "").replace(/\s+/g, " ").slice(0, 100),
    isSubagent,
    inferredParentId,
    spawnedChildIds: [...spawnedChildIds],
    inferredWorkspace,
    createdAt,
    updatedAt,
    lastModelLabel: latestMeta.label,
    modelGroup: latestMeta.shortGroup || latestMeta.label,
    dominantModelGroup,
    modelGroupCount: sortedGroups.length || 1,
    windowLimit: latestMeta.window,
    currentPromptTokens: currentPrompt,
    windowPct: Number(((currentPrompt / latestMeta.window) * 100).toFixed(1)),
    turns: turnCount > 0 ? turnCount : requestCount > 0 ? 1 : 0,
    requests: requestCount,
    toolCalls: toolCallCount,
    cmdExecs: cmdExecCount,
    skillLoads: skillLoadCount,
    replyCount,
    readFileCount,
    writeFileCount,
    events: {
      injections: injectionEvents,
      compactions: compactionEvents,
      cacheDrops: cacheDropEvents,
      modelSwitches: modelSwitchEvents,
    },
    latestEpoch,
    inputTokens: totalInput,
    cacheReadTokens: totalCacheRead,
    outputTokens: totalOutput,
    totalTokens: totalInput + totalCacheRead + totalOutput,
    cacheHitPct,
    usd: Number(totalCostUsd.toFixed(4)),
    savedUsd: Number(totalSavedUsd.toFixed(4)),
    comp: currentComp,
    compTotals: sessionCompTotals,
    timing: { waitMs, thinkMs, replyMs, toolArgMs, toolExecMs, otherMs, activeMs, tokPerSec, thinkingBlocks, replyBlocks, toolArgBlocks },
    topTools: toTop(sessionTools),
    topSkills: toTop(sessionSkills),
    topPrograms: toTop(sessionPrograms),
    mtimeMs: stat.mtimeMs,
    fileSize: stat.size,
    byDay,
  };

  const detail = { summary, requests, turnsTimeline, nodes: keptNodes };
  const rec = { mtimeMs: stat.mtimeMs, size: stat.size, summary, detail };
  projectionCache.set(convId, rec);
  return rec;
}

export async function scanAllConversations(forceRefresh = false) {
  const lsMap = await fetchLsConversations(forceRefresh);
  if (!fs.existsSync(BRAIN_DIR)) return [];
  const entries = [];
  for (const d of fs.readdirSync(BRAIN_DIR, { withFileTypes: true })) {
    if (!d.isDirectory()) continue;
    const convId = d.name;
    const tPath = resolveTranscriptPath(convId);
    if (!tPath) continue;
    let stat;
    try {
      stat = fs.statSync(tPath);
    } catch {
      continue;
    }
    const rec = parseTranscript(convId, tPath, stat);
    const ls = lsMap.get(convId);
    const lsProj = ls?.projectId && ls.projectId !== "outside-of-project" ? ls.projectId : "";
    const workspace = lsProj || rec.summary.inferredWorkspace || "通用对话";
    const parentId =
      ls?.parentConversationId ||
      (ls?.rootConversationId && ls.rootConversationId !== convId ? ls.rootConversationId : "") ||
      rec.summary.inferredParentId ||
      "";
    entries.push({
      convId,
      summary: {
        ...rec.summary,
        title: ls?.title || rec.summary.defaultTitle,
        workspace,
        parentId,
        archived: Boolean(ls?.archived),
        pinned: Boolean(ls?.pinned),
        runState: ls?.runState || "",
      },
      detail: rec.detail,
    });
  }

  // Link child subagents to their parent sessions for "子代理编队" rollup
  const byId = new Map(entries.map((e) => [e.convId, e]));
  for (const e of entries) {
    e.summary.subagents = { count: 0, totalTokens: 0, usd: 0, items: [] };
  }
  for (const e of entries) {
    for (const childId of e.summary.spawnedChildIds || []) {
      const ch = byId.get(childId);
      if (ch && !ch.summary.parentId) ch.summary.parentId = e.convId;
    }
  }
  for (const e of entries) {
    const pId = e.summary.parentId;
    if (pId && byId.has(pId) && pId !== e.convId) {
      const parent = byId.get(pId);
      parent.summary.subagents.count += 1;
      parent.summary.subagents.totalTokens += e.summary.totalTokens;
      parent.summary.subagents.usd = Number((parent.summary.subagents.usd + e.summary.usd).toFixed(4));
      parent.summary.subagents.items.push({
        id: e.convId,
        title: e.summary.title,
        totalTokens: e.summary.totalTokens,
        usd: e.summary.usd,
      });
    }
  }

  entries.sort((a, b) => String(b.summary.updatedAt).localeCompare(String(a.summary.updatedAt)));
  return entries;
}

export function buildUsagePayload(entries, range = "30d", filterDay = "", startDay = "", endDay = "") {
  const now = new Date();
  const todayLocal = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const todayStr = toLocalDayKey(todayLocal);
  const dayRe = /^\d{4}-\d{2}-\d{2}$/;
  const hasCustomSpan = !filterDay && dayRe.test(startDay) && dayRe.test(endDay);
  const customStart = hasCustomSpan ? (startDay <= endDay ? startDay : endDay) : "";
  const customEnd = hasCustomSpan ? (startDay <= endDay ? endDay : startDay) : "";

  const cutoffDate = new Date(todayLocal);
  if (range === "7d") cutoffDate.setDate(cutoffDate.getDate() - 6);
  else if (range === "30d") cutoffDate.setDate(cutoffDate.getDate() - 29);
  else if (range === "all") cutoffDate.setFullYear(2000);
  const cutoffStr = hasCustomSpan ? customStart : range === "today" ? todayStr : toLocalDayKey(cutoffDate);
  const endBoundStr = filterDay || (hasCustomSpan ? customEnd : todayStr);

  const heatmapDays = {};
  for (const e of entries) {
    for (const [day, st] of Object.entries(e.summary.byDay)) {
      if (!heatmapDays[day]) {
        heatmapDays[day] = { day, input: 0, cache: 0, output: 0, tokens: 0, requests: 0, sessions: 0, usd: 0 };
      }
      const hd = heatmapDays[day];
      hd.input += st.input;
      hd.cache += st.cache;
      hd.output += st.output;
      hd.tokens += st.input + st.cache + st.output;
      hd.requests += st.requests;
      hd.sessions += 1;
      hd.usd += st.usd;
    }
  }

  const anchorDate = new Date(`${endBoundStr}T00:00:00`);
  let spanDayCount = 7;
  if (hasCustomSpan) {
    const sDt = new Date(`${customStart}T00:00:00`);
    const diffDays = Math.round((anchorDate - sDt) / 86_400_000) + 1;
    if (diffDays >= 2 && diffDays <= 14) spanDayCount = diffDays;
  }
  const recent7Days = [];
  for (let i = spanDayCount - 1; i >= 0; i--) {
    const dt = new Date(anchorDate);
    dt.setDate(anchorDate.getDate() - i);
    const key = toLocalDayKey(dt);
    const rec = heatmapDays[key];
    recent7Days.push({
      day: key,
      tokens: rec ? rec.tokens : 0,
      usd: rec ? Number(rec.usd.toFixed(3)) : 0,
      requests: rec ? rec.requests : 0,
    });
  }

  const jsDay = todayLocal.getDay();
  const monOffset = jsDay === 0 ? 6 : jsDay - 1;
  const startMon = new Date(todayLocal);
  startMon.setDate(todayLocal.getDate() - monOffset - 7 * 7);

  const calendarWeeks = [];
  for (let w = 0; w < 8; w++) {
    const days = [];
    let monthNum = 0;
    for (let r = 0; r < 7; r++) {
      const cellDate = new Date(startMon);
      cellDate.setDate(startMon.getDate() + w * 7 + r);
      const key = toLocalDayKey(cellDate);
      if ((cellDate.getDate() <= 7 || w === 0) && r === 0) monthNum = cellDate.getMonth() + 1;
      const rec = heatmapDays[key];
      days.push({
        day: key,
        isFuture: cellDate > todayLocal,
        tokens: rec ? rec.tokens : 0,
        sessions: rec ? rec.sessions : 0,
        requests: rec ? rec.requests : 0,
        usd: rec ? Number(rec.usd.toFixed(3)) : 0,
      });
    }
    calendarWeeks.push({ monthNum, monthLabel: monthNum ? `${monthNum}月` : "", days });
  }

  let kpiInput = 0, kpiCache = 0, kpiOutput = 0, kpiUsd = 0, kpiSavedUsd = 0;
  let kpiTurns = 0, kpiRequests = 0, kpiToolCalls = 0, activeSessions = 0, archivedCount = 0, cacheSessions = 0;
  let waitMs = 0, thinkMs = 0, replyMs = 0, toolArgMs = 0, toolExecMs = 0, otherMs = 0;
  let thinkingBlocks = 0, replyBlocks = 0, toolArgBlocks = 0;

  const compTotals = emptyComp();
  const modelsMap = {};
  const workspacesMap = {};
  const skillsMap = {};
  const toolsMap = {};
  const programsMap = {};
  const sessions = [];

  for (const e of entries) {
    const s = e.summary;
    const matchingDays = Object.entries(s.byDay).filter(([d]) =>
      filterDay ? d === filterDay : hasCustomSpan ? d >= customStart && d <= customEnd : d >= cutoffStr
    );
    if (matchingDays.length === 0) continue;

    let sIn = 0, sCac = 0, sOut = 0, sUsd = 0, sReq = 0, sTurns = 0;
    let dSavedUsd = 0, dToolCalls = 0;
    for (const [, st] of matchingDays) {
      sIn += st.input;
      sCac += st.cache;
      sOut += st.output;
      sUsd += st.usd;
      sReq += st.requests;
      sTurns += st.turns || 0;
      dSavedUsd += st.savedUsd;
      dToolCalls += st.toolCalls || 0;
    }
    if (sReq === 0 && sIn + sCac + sOut === 0) continue;

    activeSessions++;
    if (s.archived) archivedCount++;
    kpiSavedUsd += dSavedUsd;
    kpiToolCalls += dToolCalls;

    const sesModelGroupTotals = {};
    const sesSkills = new Set();
    const sesTools = new Set();
    const sesPrograms = new Set();

    for (const [, st] of matchingDays) {
      waitMs += st.waitMs || 0;
      thinkMs += st.thinkMs || 0;
      replyMs += st.replyMs || 0;
      toolArgMs += st.toolArgMs || 0;
      toolExecMs += st.toolExecMs || 0;
      otherMs += st.otherMs || 0;
      thinkingBlocks += st.thinkingBlocks || 0;
      replyBlocks += st.replyBlocks || 0;
      toolArgBlocks += st.toolArgBlocks || 0;

      for (const k of COMP_KEYS) compTotals[k] += st.comp?.[k] || 0;

      for (const [mId, mObj] of Object.entries(st.models || {})) {
        if (!modelsMap[mId]) {
          modelsMap[mId] = { id: mId, label: mObj.label, shortGroup: mObj.shortGroup, requests: 0, sessions: new Set(), input: 0, cache: 0, output: 0, usd: 0 };
        }
        const mm = modelsMap[mId];
        mm.requests += mObj.requests;
        mm.sessions.add(s.id);
        mm.input += mObj.input;
        mm.cache += mObj.cache;
        mm.output += mObj.output;
        mm.usd += mObj.usd;
        if (mObj.shortGroup) {
          sesModelGroupTotals[mObj.shortGroup] = (sesModelGroupTotals[mObj.shortGroup] || 0) + mObj.input + mObj.cache + mObj.output;
        }
      }
      for (const [sk, cnt] of Object.entries(st.skills || {})) {
        skillsMap[sk] = (skillsMap[sk] || 0) + cnt;
        sesSkills.add(sk);
      }
      for (const [tl, cnt] of Object.entries(st.tools || {})) {
        toolsMap[tl] = (toolsMap[tl] || 0) + cnt;
        sesTools.add(tl);
      }
      for (const [pr, cnt] of Object.entries(st.programs || {})) {
        programsMap[pr] = (programsMap[pr] || 0) + cnt;
        sesPrograms.add(pr);
      }
    }

    const sesTotalTok = sIn + sCac + sOut;
    const wsName = s.workspace || "通用对话";
    if (!workspacesMap[wsName]) workspacesMap[wsName] = { name: wsName, sessionCount: 0, totalTokens: 0, usd: 0 };
    workspacesMap[wsName].sessionCount += 1;
    workspacesMap[wsName].totalTokens += sesTotalTok;
    workspacesMap[wsName].usd += sUsd;

    const sortedSesGroups = Object.entries(sesModelGroupTotals).sort((a, b) => b[1] - a[1]);
    const sesModelGroups = sortedSesGroups.length ? sortedSesGroups.map((x) => x[0]) : [s.dominantModelGroup || s.modelGroup];
    const sliceDominantModel = sesModelGroups[0];

    const effTurns = sTurns > 0 ? sTurns : sReq > 0 ? 1 : 0;
    if (sCac > 0) cacheSessions++;
    kpiInput += sIn;
    kpiCache += sCac;
    kpiOutput += sOut;
    kpiUsd += sUsd;
    kpiRequests += sReq;
    kpiTurns += effTurns;

    sessions.push({
      id: s.id,
      title: s.title,
      lastUser: s.lastUser,
      workspace: wsName,
      archived: s.archived,
      pinned: s.pinned,
      runState: s.runState,
      isSubagent: s.isSubagent,
      subagentCount: s.subagents?.count || 0,
      updatedAt: s.updatedAt,
      modelLabel: s.lastModelLabel,
      modelGroup: sliceDominantModel,
      modelGroups: sesModelGroups,
      skills: [...sesSkills],
      tools: [...sesTools],
      programs: [...sesPrograms],
      turns: effTurns,
      requests: sReq,
      currentPromptTokens: s.currentPromptTokens,
      windowLimit: s.windowLimit,
      windowPct: s.windowPct,
      totalTokens: sesTotalTok,
      usd: Number(sUsd.toFixed(4)),
      comp: s.comp,
    });
  }

  const models = Object.values(modelsMap)
    .map((m) => ({
      id: m.id,
      label: m.label,
      shortGroup: m.shortGroup,
      sessionCount: m.sessions.size,
      requests: m.requests,
      totalTokens: m.input + m.cache + m.output,
      usd: Number(m.usd.toFixed(3)),
    }))
    .sort((a, b) => b.totalTokens - a.totalTokens);

  const workspaces = Object.values(workspacesMap)
    .map((w) => ({
      name: w.name,
      sessionCount: w.sessionCount,
      totalTokens: w.totalTokens,
      usd: Number(w.usd.toFixed(3)),
    }))
    .sort((a, b) => b.totalTokens - a.totalTokens);

  const toRanked = (obj) =>
    Object.entries(obj)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);

  const cacheHitPct =
    kpiInput + kpiCache > 0 ? Number(((kpiCache / (kpiInput + kpiCache)) * 100).toFixed(2)) : 0;

  const genTimeSec = Math.max(1, (thinkMs + replyMs + toolArgMs) / 1000);
  const tokPerSec = Math.round(kpiOutput / genTimeSec);

  return {
    range: hasCustomSpan ? "custom" : range,
    filterDay,
    startDay: customStart,
    endDay: customEnd,
    spanStart: filterDay || (cutoffStr === "2000-01-01" ? (Object.keys(heatmapDays).sort()[0] || todayStr) : cutoffStr),
    spanEnd: endBoundStr,
    kpi: {
      activeSessions,
      archivedCount,
      cacheSessions,
      totalSessions: entries.length,
      turns: kpiTurns,
      requests: kpiRequests,
      toolCalls: kpiToolCalls,
      totalTokens: kpiInput + kpiCache + kpiOutput,
      inputTokens: kpiInput,
      cacheReadTokens: kpiCache,
      outputTokens: kpiOutput,
      cacheHitPct,
      usd: Number(kpiUsd.toFixed(2)),
      savedUsd: Number(kpiSavedUsd.toFixed(2)),
      activeMs: waitMs + thinkMs + replyMs + toolArgMs + toolExecMs + otherMs,
      toolExecMs,
      tokPerSec,
    },
    timing: {
      waitMs,
      thinkMs,
      replyMs,
      toolArgMs,
      toolExecMs,
      otherMs,
      thinkingBlocks,
      replyBlocks,
      toolArgBlocks,
    },
    compTotals,
    recent7Days,
    calendarWeeks,
    models,
    workspaces,
    skills: toRanked(skillsMap),
    tools: toRanked(toolsMap),
    programs: toRanked(programsMap),
    sessions,
  };
}

export function readFullNodeText(convId, lineNo, stepSeq, nodeCat = "") {
  const convDir = path.join(BRAIN_DIR, convId);
  const fullJsonlPath = path.join(convDir, ".system_generated", "logs", "transcript_full.jsonl");
  const compactJsonlPath = path.join(convDir, ".system_generated", "logs", "transcript.jsonl");
  const stepOutPath = path.join(convDir, ".system_generated", "steps", String(stepSeq), "output.txt");

  let jsonlText = "";
  const srcPath = fs.existsSync(fullJsonlPath) ? fullJsonlPath : compactJsonlPath;
  if (fs.existsSync(srcPath) && lineNo > 0) {
    try {
      const raw = fs.readFileSync(srcPath, "utf-8").split(/\r?\n/)[lineNo - 1];
      if (raw) {
        const parsed = JSON.parse(raw);
        if (nodeCat === "thinking") {
          jsonlText = parsed.thinking || parsed.content || "";
        } else if (nodeCat === "assistant") {
          jsonlText = parsed.content || parsed.thinking || "";
        } else if (nodeCat === "user") {
          jsonlText = extractUserParts(parsed.content || "").userText;
        } else if (nodeCat === "injected") {
          const parts = extractUserParts(parsed.content || "");
          jsonlText = parts.injectedText || parsed.content || "";
        } else if (nodeCat === "tool" || nodeCat === "skill" || nodeCat === "sysPrompt") {
          jsonlText = parsed.content || (parsed.tool_calls?.length ? JSON.stringify(parsed.tool_calls, null, 2) : "");
        } else {
          jsonlText = parsed.content || parsed.thinking || (parsed.tool_calls?.length ? JSON.stringify(parsed.tool_calls, null, 2) : "");
        }
      }
    } catch {}
  }

  let stepText = "";
  if ((nodeCat === "tool" || nodeCat === "skill" || !jsonlText) && fs.existsSync(stepOutPath)) {
    try {
      stepText = fs.readFileSync(stepOutPath, "utf-8");
    } catch {}
  }

  const best = stepText.length > jsonlText.length ? stepText : jsonlText;
  return best.slice(0, 36_000);
}

function loadPrefs() {
  try {
    const p = path.join(DATA_DIR, "prefs.json");
    if (fs.existsSync(p)) return JSON.parse(fs.readFileSync(p, "utf-8"));
  } catch {}
  return { defaultRange: "30d", timelineMode: "total", timelineUnit: "step" };
}

function savePrefs(nextPrefs) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  const merged = { ...loadPrefs(), ...nextPrefs };
  fs.writeFileSync(path.join(DATA_DIR, "prefs.json"), JSON.stringify(merged, null, 2), "utf-8");
  return merged;
}

function pickActiveConversation(entries, requestedId) {
  if (requestedId) {
    const exact = entries.find((e) => e.convId === requestedId);
    if (exact) return exact;
  }
  const envConv = process.env.ANTIGRAVITY_CONVERSATION_ID;
  if (envConv) {
    const byEnv = entries.find((e) => e.convId === envConv);
    if (byEnv) return byEnv;
  }
  const running = entries.find((e) => e.summary.runState === "RUN_STATE_RUNNING" && !e.summary.isSubagent);
  if (running) return running;
  return entries.find((e) => !e.summary.isSubagent && e.summary.requests > 0) || entries[0] || null;
}

async function assemblePayload({ surface, inline = false, conversationId, range }) {
  const prefs = loadPrefs();
  const entries = await scanAllConversations();
  const effRange = range || prefs.defaultRange || "30d";
  const usage = surface === "global" ? buildUsagePayload(entries, effRange, "") : null;
  const baselineBreakdown = computeBaselineBreakdown(entries);

  const chosen = pickActiveConversation(entries, conversationId);
  const session = chosen ? { ...chosen.detail, summary: chosen.summary, baselineBreakdown } : null;

  const s = session?.summary;
  const textSummary =
    surface === "global" && usage
      ? IS_ZH
        ? `上下文透视（${usage.spanStart} ~ ${usage.spanEnd}）：${usage.kpi.activeSessions} 个活跃会话，共 ${(usage.kpi.totalTokens / 1e6).toFixed(1)}M tokens，缓存命中 ${usage.kpi.cacheHitPct}%，参考费用 $${usage.kpi.usd}。`
        : `Context Lens (${usage.spanStart} to ${usage.spanEnd}): ${usage.kpi.activeSessions} active sessions, ${(usage.kpi.totalTokens / 1e6).toFixed(1)}M tokens, ${usage.kpi.cacheHitPct}% cache hit, est. $${usage.kpi.usd}.`
      : s
      ? IS_ZH
        ? `当前会话窗口 ${(s.currentPromptTokens / 1000).toFixed(1)}k / ${(s.windowLimit / 1000).toFixed(0)}k (${s.windowPct}%)，缓存命中 ${s.cacheHitPct}%，输出速度 ${s.timing.tokPerSec} tok/s，共 ${s.requests} 步。`
        : `Active context window ${(s.currentPromptTokens / 1000).toFixed(1)}k / ${(s.windowLimit / 1000).toFixed(0)}k (${s.windowPct}%), ${s.cacheHitPct}% cache hit, ${s.timing.tokPerSec} tok/s across ${s.requests} steps.`
      : IS_ZH
      ? "暂无会话日志。"
      : "No conversation transcripts found.";

  return {
    textSummary,
    structuredContent: {
      surface, // "global" | "aux_pane" | "inline"
      inline,
      defaultLang: DEFAULT_LANG,
      prefs,
      usage,
      session: surface === "global" ? null : session,
      sessionList: entries
        .filter((e) => e.summary.requests > 0 || e.summary.totalTokens > 0)
        .map((e) => ({
          id: e.convId,
          title: e.summary.title,
          totalTokens: e.summary.totalTokens,
          runState: e.summary.runState,
          isSubagent: e.summary.isSubagent,
        })),
    },
  };
}

export function createMcpServer() {
  const mcp = new McpServer({ name: "agy-context", version: "5.1.0" });

  mcp.registerResource(
    "Context Lens",
    APP_URI,
    {
      title: IS_ZH ? "上下文透视" : "Context Lens",
      description: "Context Lens — Cross-Session Telemetry & In-Chat Context Anatomy for Antigravity",
      mimeType: MIME_MCP_APP,
      _meta: { ui: { prefersBorder: false } },
    },
    async (uri) => {
      const html = fs.existsSync(APP_HTML_PATH)
        ? fs.readFileSync(APP_HTML_PATH, "utf-8")
        : "<!DOCTYPE html><html><body></body></html>";
      return {
        contents: [{ uri: uri.href, mimeType: MIME_MCP_APP, text: html, _meta: { ui: { prefersBorder: false } } }],
      };
    }
  );

  mcp.registerTool(
    "open_session_hud",
    {
      title: IS_ZH ? "上下文" : "Context",
      description: IS_ZH
        ? "在当前对话右侧栏打开单会话上下文深度剖析（实时状态条、Token/耗时双环、当前上下文堆叠条、时间线与分组上下文浏览器）。"
        : "Open the in-conversation Context Anatomy side pane (live micro-HUD, Token & Timing Donuts, stacked window bar, step/turn timeline, and grouped context browser).",
      inputSchema: {
        conversationId: z.string().optional().describe(IS_ZH ? "可选会话 ID，默认自动锁定当前活跃会话。" : "Optional conversation ID; defaults to the active running session."),
      },
      _meta: {
        ui: { resourceUri: APP_URI },
        "com.google.antigravity/ui": {
          entrypoints: [{ type: "aux_pane", title: IS_ZH ? "上下文" : "Context" }],
        },
      },
    },
    async (input = {}) => {
      const res = await assemblePayload({ surface: "aux_pane", conversationId: input.conversationId });
      return { content: [{ type: "text", text: res.textSummary }], structuredContent: res.structuredContent };
    }
  );

  mcp.registerTool(
    "open_context_dashboard",
    {
      title: IS_ZH ? "上下文透视" : "Context Lens",
      description: IS_ZH
        ? "打开跨会话全局「上下文透视」看板（KPI、近 7 天双轴柱图、活跃度日历、8 维 Token 与 6 维耗时双环、模型/工作区/技能/工具/程序交叉排行及会话卡片矩阵）。"
        : "Open the global Context Lens dashboard (KPIs, 7-day Token/Cost dual-axis chart, activity calendar, 8-category Token & 6-category Timing Donuts, cross-filter rankings, and session card grid).",
      inputSchema: {
        range: z.enum(["today", "7d", "30d", "all"]).optional(),
      },
      _meta: {
        ui: { resourceUri: APP_URI },
        "com.google.antigravity/ui": {
          entrypoints: [{ type: "global", title: IS_ZH ? "上下文透视" : "Context Lens" }],
        },
      },
    },
    async (input = {}) => {
      const res = await assemblePayload({ surface: "global", range: input.range });
      return { content: [{ type: "text", text: res.textSummary }], structuredContent: res.structuredContent };
    }
  );

  mcp.registerTool(
    "show_context_snapshot",
    {
      title: IS_ZH ? "上下文快照" : "Context Snapshot",
      description: IS_ZH
        ? "在对话流内嵌显示单行紧凑实时上下文状态条（输出速度、缓存命中率、已用窗口占比环与费用）。"
        : "Render a compact single-row live context HUD bar inline inside the conversation.",
      inputSchema: { conversationId: z.string().optional() },
      _meta: { ui: { resourceUri: APP_URI } },
    },
    async (input = {}) => {
      const res = await assemblePayload({ surface: "inline", inline: true, conversationId: input.conversationId });
      return { content: [{ type: "text", text: res.textSummary }], structuredContent: res.structuredContent };
    }
  );

  mcp.registerTool(
    "app_get_usage",
    {
      title: "Load Usage",
      inputSchema: {
        range: z.enum(["today", "7d", "30d", "all", "custom"]).optional(),
        filterDay: z.string().optional(),
        startDay: z.string().optional(),
        endDay: z.string().optional(),
        forceRefresh: z.boolean().optional(),
      },
      _meta: { ui: { visibility: ["app"] } },
    },
    async (input = {}) => {
      const range = input.range || "30d";
      if (input.range && input.range !== "custom" && !input.filterDay) savePrefs({ defaultRange: range });
      const entries = await scanAllConversations(Boolean(input.forceRefresh));
      const usage = buildUsagePayload(entries, range, input.filterDay || "", input.startDay || "", input.endDay || "");
      return { content: [{ type: "text", text: "ok" }], structuredContent: { usage } };
    }
  );

  mcp.registerTool(
    "app_get_session",
    {
      title: "Load Session",
      inputSchema: {
        conversationId: z.string(),
        forceRefresh: z.boolean().optional(),
      },
      _meta: { ui: { visibility: ["app"] } },
    },
    async (input) => {
      const entries = await scanAllConversations(Boolean(input.forceRefresh));
      const baselineBreakdown = computeBaselineBreakdown(entries);
      const chosen = pickActiveConversation(entries, input.conversationId);
      const session = chosen ? { ...chosen.detail, summary: chosen.summary, baselineBreakdown } : null;
      const sessionList = entries
        .filter((e) => e.summary.requests > 0 || e.summary.totalTokens > 0)
        .map((e) => ({ id: e.convId, title: e.summary.title, totalTokens: e.summary.totalTokens, runState: e.summary.runState, isSubagent: e.summary.isSubagent }));
      return { content: [{ type: "text", text: "ok" }], structuredContent: { session, sessionList } };
    }
  );

  mcp.registerTool(
    "app_poll_meta",
    {
      title: "Poll Session File Meta",
      inputSchema: { conversationId: z.string() },
      _meta: { ui: { visibility: ["app"] } },
    },
    async (input) => {
      const tPath = resolveTranscriptPath(input.conversationId);
      let mtimeMs = 0, fileSize = 0;
      if (tPath) {
        try {
          const st = fs.statSync(tPath);
          mtimeMs = st.mtimeMs;
          fileSize = st.size;
        } catch {}
      }
      return { content: [{ type: "text", text: "ok" }], structuredContent: { mtimeMs, fileSize } };
    }
  );

  mcp.registerTool(
    "app_read_node_full",
    {
      title: "Read Full Text",
      inputSchema: {
        conversationId: z.string(),
        lineNo: z.number(),
        stepSeq: z.number(),
        cat: z.string().optional(),
      },
      _meta: { ui: { visibility: ["app"] } },
    },
    async (input) => {
      const fullText = readFullNodeText(input.conversationId, input.lineNo, input.stepSeq, input.cat || "");
      return { content: [{ type: "text", text: "ok" }], structuredContent: { fullText } };
    }
  );

  mcp.registerTool(
    "app_save_prefs",
    {
      title: "Save Prefs",
      inputSchema: {
        defaultRange: z.enum(["today", "7d", "30d", "all"]).optional(),
        timelineMode: z.enum(["total", "delta"]).optional(),
        timelineUnit: z.enum(["step", "turn"]).optional(),
        lang: z.enum(["en", "zh"]).optional(),
      },
      _meta: { ui: { visibility: ["app"] } },
    },
    async (input = {}) => {
      const prefs = savePrefs(input);
      return { content: [{ type: "text", text: "ok" }], structuredContent: { prefs } };
    }
  );

  return mcp;
}

const isMain = process.argv[1] && path.resolve(process.argv[1]).toLowerCase().includes("server");
if (isMain) {
  const mcp = createMcpServer();
  const transport = new StdioServerTransport();
  mcp.connect(transport).catch((err) => {
    process.stderr.write(`[agy-context] ${err?.stack || err}\n`);
    process.exit(1);
  });
}
