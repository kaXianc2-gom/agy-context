/**
 * Portable build script for agy-context v5.1 (Context Lens / 上下文透视)
 * Zero hardcoded machine paths; supports --out-dir=<path> and --lang=en|zh.
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as esbuild from "esbuild";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.resolve(__dirname, "..");

const cliArgs = process.argv.slice(2);
function getArg(prefix, fallback) {
  const hit = cliArgs.find((a) => a.startsWith(prefix));
  return hit ? hit.slice(prefix.length) : fallback;
}

const OUT_DIR = path.resolve(getArg("--out-dir=", PROJECT_ROOT));
const BUILD_LANG = getArg("--lang=", "en").toLowerCase().startsWith("zh") ? "zh" : "en";
const HTML_TITLE = BUILD_LANG === "zh" ? "上下文透视" : "Context Lens";

const STYLES = `
:root, :root[data-theme="dark"], .dark {
  color-scheme: dark;
  --bg: #121214;
  --card: #19191c;
  --card-hover: #202024;
  --row-bg: #202025;
  --subtle: #25252b;
  --border: #2a2a30;
  --grid-line: rgba(255, 255, 255, 0.07);
  --hover: rgba(255, 255, 255, 0.06);
  --stripe: repeating-linear-gradient(-45deg, rgba(255,255,255,0.03), rgba(255,255,255,0.03) 4px, transparent 4px, transparent 8px);
  --fg: #f4f4f6;
  --muted: #9ca3af;
  --faint: #6b7280;
  --pill-on-bg: #f4f4f6;
  --pill-on-fg: #121214;
  --heat-0: #26262b;
  --heat-1: #1e3a8a;
  --heat-2: #1d4ed8;
  --heat-3: #2563eb;
  --heat-4: #3b82f6;
  --font: var(--font-sans, "Google Sans Flex", "Segoe UI", system-ui, -apple-system, sans-serif);
  --mono: var(--editor-font-family, "Google Sans Code", ui-monospace, SFMono-Regular, Consolas, monospace);
}

:root[data-theme="light"], .light {
  color-scheme: light;
  --bg: #f5f5f7;
  --card: #ffffff;
  --card-hover: #f9fafb;
  --row-bg: #f3f4f6;
  --subtle: #e5e7eb;
  --border: #e2e5e9;
  --grid-line: rgba(15, 23, 42, 0.07);
  --hover: rgba(15, 23, 42, 0.05);
  --stripe: repeating-linear-gradient(-45deg, rgba(15,23,42,0.04), rgba(15,23,42,0.04) 4px, transparent 4px, transparent 8px);
  --fg: #111827;
  --muted: #4b5563;
  --faint: #6b7280;
  --pill-on-bg: #18181b;
  --pill-on-fg: #ffffff;
  --heat-0: #ebedf0;
  --heat-1: #bfdbfe;
  --heat-2: #60a5fa;
  --heat-3: #2563eb;
  --heat-4: #1d4ed8;
}

* { box-sizing: border-box; scrollbar-width: thin; scrollbar-color: var(--border) transparent; }
html, body {
  margin: 0; padding: 0; width: 100%; max-width: 100vw; overflow-x: clip;
  background: var(--bg); color: var(--fg);
  font-family: var(--font); font-size: 13px; line-height: 1.45;
  -webkit-font-smoothing: antialiased;
}
button, input { font: inherit; color: inherit; }
button { cursor: pointer; }
:focus { outline: none; }

.num { font-family: var(--mono); font-variant-numeric: tabular-nums; }
.muted { color: var(--muted); }
.faint { color: var(--faint); }
.text-xs { font-size: 12px; }
.truncate { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; min-width: 0; }
.min-w-0 { min-width: 0; }
.shrink-0 { flex-shrink: 0; }
.row-gap { display: flex; align-items: center; gap: 8px; min-width: 0; }
.wrap { flex-wrap: wrap; }

.ic {
  width: 14px; height: 14px; flex: none;
  fill: none; stroke: currentColor; stroke-width: 1.5;
  stroke-linecap: round; stroke-linejoin: round; color: var(--muted);
}
.ic.sm { width: 12px; height: 12px; }

.dash-wrap {
  padding: 14px 16px 28px;
  max-width: 1420px; width: 100%; min-width: 0; margin: 0 auto;
  display: flex; flex-direction: column; gap: 12px;
}

.dash-topbar {
  display: flex; align-items: center; justify-content: space-between;
  gap: 10px; flex-wrap: wrap; margin-bottom: 2px;
}
.dash-h1 { margin: 0; font-size: 18px; font-weight: 700; letter-spacing: -0.2px; }

.top-chip, .date-span {
  display: inline-flex; align-items: center; gap: 5px; height: 28px; padding: 0 11px;
  border-radius: 7px; border: 1px solid var(--border);
  background: var(--card); color: var(--muted); font-size: 12px;
  white-space: nowrap; flex: none;
}
button.top-chip:hover, button.date-span:hover { color: var(--fg); background: var(--card-hover); }
.active-chip { color: #38bdf8; border-color: rgba(56, 189, 248, 0.4); }
.live-dot { width: 6px; height: 6px; border-radius: 50%; background: var(--faint); display: inline-block; }
.live-on { color: var(--fg); }
.live-on .live-dot { background: #22c55e; box-shadow: 0 0 0 2px rgba(34, 197, 94, 0.25); }

.date-pop {
  position: absolute; top: calc(100% + 5px); right: 0; width: 256px; z-index: 70;
  background: var(--card); border: 1px solid var(--border); border-radius: 9px;
  padding: 10px 12px; box-shadow: 0 12px 30px rgba(0, 0, 0, 0.42);
}
.dp-row { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
.dp-row label { display: flex; flex-direction: column; gap: 3px; font-size: 11px; color: var(--muted); }
.dp-row input[type="date"] {
  height: 28px; padding: 0 6px; border-radius: 6px; font-size: 11.5px;
  background: var(--bg); border: 1px solid var(--border); color: var(--fg); font-family: var(--mono);
}

.seg-pill {
  display: inline-flex; align-items: center; gap: 2px; padding: 2px;
  border-radius: 8px; background: var(--card); border: 1px solid var(--border);
}
.seg-pill button {
  height: 24px; padding: 0 10px; border: 0; border-radius: 6px;
  background: transparent; color: var(--muted); font-size: 12px; white-space: nowrap;
}
.seg-pill.sm button { height: 21px; padding: 0 8px; font-size: 11.5px; display: inline-flex; align-items: center; justify-content: center; }
.seg-pill.xs button { height: 19px; padding: 0 7px; font-size: 11px; }
.seg-pill button:disabled { opacity: 0.35; cursor: default; }
.seg-pill button:hover { color: var(--fg); }
.seg-pill button.white-on { background: var(--pill-on-bg); color: var(--pill-on-fg); font-weight: 600; }

.icon-btn {
  width: 28px; height: 28px; border: 1px solid var(--border); border-radius: 7px;
  background: var(--card); display: inline-flex; align-items: center; justify-content: center; flex: none;
}
.icon-btn.lang-btn { width: auto; min-width: 28px; padding: 0 7px; font-size: 11px; font-weight: 600; color: var(--muted); }
.icon-btn.lang-btn:hover { color: var(--fg); }
.icon-btn:hover { background: var(--card-hover); }
.icon-btn.is-loading .ic { animation: agy-spin 0.8s linear infinite; color: var(--fg); }
@keyframes agy-spin { to { transform: rotate(360deg); } }

/* Sticky Micro-HUD & Inline HUD */
.micro-hud, .inline-hud {
  display: flex; align-items: center; flex-wrap: wrap; gap: 8px 10px;
  padding: 7px 12px; border-radius: 9px;
  background: var(--card); border: 1px solid var(--border); font-size: 12px;
}
.micro-hud { position: sticky; top: 0; z-index: 40; box-shadow: 0 4px 16px rgba(0, 0, 0, 0.22); }
.inline-hud { margin: 2px 0; }
.hud-metric { display: inline-flex; align-items: center; gap: 5px; white-space: nowrap; }
.hud-sep { width: 1px; height: 12px; background: var(--border); flex: none; }

/* Cards */
.card {
  background: var(--card); border: 1px solid var(--border);
  border-radius: 10px; padding: 13px 14px; min-width: 0; width: 100%;
}
.card-hd {
  display: flex; align-items: center; justify-content: space-between;
  gap: 8px; flex-wrap: wrap; margin-bottom: 10px;
}
.hd-title { display: inline-flex; align-items: center; gap: 6px; font-size: 13px; font-weight: 600; }

/* Global Row 1: KPI 2x3 + 7-Day Paired Chart + Calendar */
.row1-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(290px, 1fr)); gap: 12px; align-items: stretch; }
@media (min-width: 1060px) { .row1-grid { grid-template-columns: 1.02fr 1.26fr 1fr; } }
.kpi-6-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); grid-auto-rows: 1fr; gap: 10px; height: 100%; }
@media (max-width: 440px) { .kpi-6-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
.kpi-box { display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; padding: 12px 8px; }
.kpi-lbl { font-size: 11.5px; color: var(--muted); }
.kpi-big { font-size: 20px; font-weight: 700; margin: 4px 0 3px; color: var(--fg); }
.kpi-sub { font-size: 11px; color: var(--faint); }

/* Paired 7-Day Chart */
.paired-svg { width: 100%; height: 158px; display: block; }
.bar-pair { cursor: pointer; }
.paired-legend { display: flex; justify-content: center; gap: 14px; font-size: 11.5px; color: var(--muted); margin-top: 2px; }
.paired-legend > span { display: inline-flex; align-items: center; gap: 5px; }
.sq { width: 8px; height: 8px; border-radius: 2px; display: inline-block; flex: none; }
.dot { width: 6px; height: 6px; border-radius: 50%; display: inline-block; flex: none; }

/* Activity Calendar */
.cal-box { display: flex; flex-direction: column; align-items: center; gap: 8px; padding-top: 2px; }
.cal-grid-wrap { display: flex; gap: 6px; align-items: flex-start; }
.cal-wds { display: flex; flex-direction: column; gap: 4px; font-size: 11px; color: var(--muted); padding-right: 2px; }
.cal-wds > span { height: 16px; line-height: 16px; text-align: right; }
.cal-m-space { height: 16px !important; }
.cal-cols { display: flex; gap: 4px; }
.cal-col { display: flex; flex-direction: column; gap: 4px; }
.cal-m { height: 16px; font-size: 11px; color: var(--muted); white-space: nowrap; }
.cal-cell { width: 16px; height: 16px; padding: 0; border: 0; border-radius: 3.5px; background: var(--heat-0); display: inline-block; }
.cal-cell.future { opacity: 0.2; cursor: default; }
.cal-cell.lv-1 { background: var(--heat-1); }
.cal-cell.lv-2 { background: var(--heat-2); }
.cal-cell.lv-3 { background: var(--heat-3); }
.cal-cell.lv-4 { background: var(--heat-4); }
.cal-cell.sel { outline: 2px solid var(--fg); outline-offset: 1px; }
.cal-legend { width: 100%; display: flex; align-items: center; justify-content: flex-end; gap: 3px; font-size: 11px; color: var(--muted); }
.cal-legend .cal-cell { width: 10px; height: 10px; border-radius: 2px; cursor: default; }

/* Row 2: Token Donut + Timing Donut */
.row2-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(310px, 1fr)); gap: 12px; }
.donut-split { display: flex; align-items: center; gap: 16px; flex-wrap: wrap; }
.donut-svg { flex: none; }
.donut-seg { cursor: pointer; transition: opacity 0.12s ease; }
.donut-seg:hover { opacity: 0.82; }
.bd-grid { flex: 1 1 210px; min-width: 0; display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 8px 12px; }
@media (max-width: 560px) { .bd-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
.bd-item { display: flex; flex-direction: column; gap: 3px; min-width: 0; }
.bd-top { display: flex; align-items: center; justify-content: space-between; gap: 6px; font-size: 12px; }
.bd-name { display: inline-flex; align-items: center; gap: 5px; font-weight: 500; white-space: nowrap; }
.bd-bar { height: 4px; width: 100%; border-radius: 999px; background: var(--subtle); overflow: hidden; }
.bd-bar > div { height: 100%; border-radius: 999px; }
.bd-sub { font-size: 11px; color: var(--muted); }

/* Row 3: 4 Ranked Lists */
.row3-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 12px; }
@media (min-width: 1040px) { .row3-grid { grid-template-columns: repeat(4, minmax(0, 1fr)); } }
.rank-list { display: flex; flex-direction: column; gap: 6px; }
.rank-row {
  background: var(--row-bg); border: 1px solid transparent; border-radius: 6px;
  padding: 6px 9px 0; overflow: hidden; display: flex; flex-direction: column; gap: 5px; min-width: 0;
  transition: border-color 0.12s ease, background-color 0.12s ease;
}
.rank-row.active-row { border-color: #3b82f6; background: var(--card-hover); }
.rank-top { display: flex; align-items: center; justify-content: space-between; gap: 8px; font-size: 12px; }
.rank-name { display: inline-flex; align-items: center; gap: 6px; font-family: var(--mono); min-width: 0; }
.rank-val { color: var(--muted); flex: none; font-size: 11.5px; }
.rank-track { width: calc(100% + 18px); margin: 0 -9px; height: 2px; background: transparent; overflow: hidden; }
.rank-fill { height: 100%; border-radius: 999px; }

/* Row 4: Session Cards Grid */
.ses-section { margin-top: 4px; }
.ses-header-bar { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
.count-pill { padding: 1px 7px; border-radius: 999px; background: var(--subtle); color: var(--muted); font-size: 11.5px; }
.search-box {
  flex: 1 1 180px; min-width: 0; height: 32px; padding: 0 10px;
  display: flex; align-items: center; gap: 8px;
  border-radius: 8px; background: var(--card); border: 1px solid var(--border);
}
.search-box input { flex: 1; min-width: 0; height: 100%; border: 0; outline: none; background: transparent; font-size: 12px; color: var(--fg); }
.search-box input::placeholder { color: var(--faint); }
.pill-filter {
  height: 25px; padding: 0 10px; border-radius: 999px; border: 1px solid var(--border);
  background: var(--card); color: var(--muted); font-size: 12px; display: inline-flex; align-items: center; gap: 5px;
}
.pill-filter:hover { color: var(--fg); background: var(--card-hover); }
.pill-filter.white-on { background: var(--pill-on-bg); color: var(--pill-on-fg); border-color: transparent; font-weight: 600; }

.ses-cards-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(268px, 1fr)); gap: 12px; }
@media (min-width: 1180px) { .ses-cards-grid { grid-template-columns: repeat(4, minmax(0, 1fr)); } }
.ses-card {
  background: var(--card); border: 1px solid var(--border); border-radius: 10px;
  padding: 13px 14px; display: flex; flex-direction: column; gap: 9px;
  cursor: pointer; transition: border-color 0.12s ease, background-color 0.12s ease; min-width: 0;
}
.ses-card:hover { background: var(--card-hover); border-color: #3b82f6; }
.ses-card-top { display: flex; align-items: flex-start; justify-content: space-between; gap: 8px; }
.ses-card-title { font-weight: 600; font-size: 13.5px; line-height: 1.35; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
.ses-card-time { font-size: 11px; color: var(--muted); text-align: right; flex: none; }
.tag-archived, .tag-group, .tag-ws, .ctx-tag {
  display: inline-block; padding: 1px 6px; border-radius: 4px;
  background: var(--subtle); color: var(--muted); font-size: 11px; white-space: nowrap; flex: none;
}
.tag-ws { color: #38bdf8; background: rgba(56, 189, 248, 0.1); max-width: 150px; }
.run-dot { display: inline-block; width: 6px; height: 6px; border-radius: 50%; background: #22c55e; margin-right: 5px; vertical-align: middle; box-shadow: 0 0 0 2px rgba(34, 197, 94, 0.22); }
.ses-card-mid { display: flex; align-items: center; gap: 12px; margin-top: auto; }
.ses-kv { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 4px; font-size: 12px; }
.kv-row { display: flex; align-items: center; justify-content: space-between; gap: 6px; }
.kv-row > span { color: var(--muted); white-space: nowrap; }
.ses-card-foot { padding-top: 8px; border-top: 1px solid var(--border); font-size: 11.5px; color: var(--muted); }
.pager { display: flex; align-items: center; justify-content: center; gap: 10px; margin-top: 14px; font-size: 12px; color: var(--muted); }
.page-btn { width: 26px; height: 26px; border-radius: 6px; border: 1px solid var(--border); background: var(--card); color: var(--fg); }
.page-btn:disabled { opacity: 0.35; cursor: default; }

/* Single-Session Deep Anatomy (Screenshot 2 Responsive Dual-Column!) */
.stat5-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 8px; margin-bottom: 10px; }
@media (max-width: 719px) { .ev-tile { grid-column: 1 / -1; } }
@media (min-width: 720px) { .stat5-grid { grid-template-columns: 1fr 1fr 1fr 1fr 1.9fr; } }
.stat-tile { background: var(--row-bg); border: 1px solid var(--border); border-radius: 8px; padding: 9px 11px; min-width: 0; }
.stat-num { font-size: 19px; font-weight: 700; line-height: 1.2; }
.stat-lbl { font-size: 11px; color: var(--muted); margin-top: 2px; }
.ev-tile { display: flex; flex-direction: column; justify-content: center; }
.ev-row { display: flex; align-items: center; flex-wrap: wrap; gap: 5px; font-size: 12px; font-weight: 600; }

.meta4-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 8px 16px; border-top: 1px solid var(--border); padding-top: 10px; }
.meta-cell { display: flex; flex-direction: column; gap: 3px; min-width: 0; }
.meta-top { display: flex; align-items: center; justify-content: space-between; font-size: 12px; }
.meta-top > span { color: var(--muted); }
.meta-sub { font-size: 11px; color: var(--faint); display: flex; align-items: center; gap: 5px; }

.timing-strip-wrap { margin-top: 10px; padding-top: 8px; border-top: 1px solid var(--border); }
.mini-stack-bar { display: flex; width: 100%; height: 6px; border-radius: 999px; overflow: hidden; background: var(--subtle); gap: 1px; margin-bottom: 8px; }
.mini-stack-bar.lg { height: 9px; margin-bottom: 4px; }

.ses-bottom-grid { display: grid; grid-template-columns: 1fr; gap: 12px; align-items: start; }
@media (min-width: 840px) { .ses-bottom-grid { grid-template-columns: 1fr 1.12fr; } }
.col-stack { display: flex; flex-direction: column; gap: 12px; min-width: 0; }

.win-head { display: flex; align-items: baseline; justify-content: space-between; gap: 8px; flex-wrap: wrap; margin-bottom: 8px; }
.win-stack-bar {
  display: flex; width: 100%; height: 12px; border-radius: 6px; overflow: hidden;
  background: var(--subtle); background-image: var(--stripe); border: 1px solid var(--border);
  margin-bottom: 10px; gap: 1px;
}
.ctx-leg-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(175px, 1fr)); gap: 6px; }
.ctx-leg-btn {
  display: flex; align-items: center; justify-content: space-between; gap: 6px;
  padding: 5px 8px; border-radius: 6px; border: 1px solid transparent;
  background: var(--row-bg); font-size: 11.5px; text-align: left; min-width: 0;
}
.ctx-leg-btn .num { white-space: nowrap; flex: none; }
.ctx-leg-btn:hover { background: var(--card-hover); }
.ctx-leg-btn.on { border-color: #3b82f6; background: var(--card-hover); }

/* Grouped Context Browser */
.grp-list { display: flex; flex-direction: column; gap: 6px; }
.grp-card { border: 1px solid var(--border); border-radius: 8px; background: var(--row-bg); overflow: hidden; }
.grp-hd {
  width: 100%; display: flex; align-items: center; justify-content: space-between; gap: 8px;
  padding: 8px 10px; border: 0; background: transparent; text-align: left; font-size: 12.5px;
}
.grp-hd:hover { background: var(--hover); }
.grp-body { padding: 4px 8px 8px; border-top: 1px solid var(--border); background: var(--card); display: flex; flex-direction: column; gap: 5px; max-height: 360px; overflow-y: auto; }

/* Dropdown, Timeline & Node Rows */
.dd { position: relative; min-width: 0; max-width: 100%; }
.dd-btn {
  display: inline-flex; align-items: center; gap: 6px; max-width: 100%;
  height: 30px; padding: 0 10px; border-radius: 7px;
  border: 1px solid var(--border); background: var(--card); font-weight: 600;
}
.dd-menu {
  position: absolute; top: calc(100% + 4px); left: 0;
  width: min(340px, calc(100vw - 32px)); max-height: 280px; overflow-y: auto;
  z-index: 60; background: var(--card); border: 1px solid var(--border);
  border-radius: 8px; padding: 4px; box-shadow: 0 10px 28px rgba(0, 0, 0, 0.4);
}
.dd-opt { width: 100%; display: flex; align-items: center; justify-content: space-between; gap: 8px; padding: 6px 8px; border: 0; border-radius: 5px; background: transparent; font-size: 12px; text-align: left; }
.dd-opt:hover { background: var(--hover); }
.dd-opt.on { background: var(--subtle); font-weight: 600; }

.step-svg { width: 100%; height: 96px; display: block; border-bottom: 1px solid var(--border); }
.axis-ticks { display: flex; justify-content: space-between; padding-top: 4px; font-size: 10.5px; color: var(--faint); }

.ctx-item { border-bottom: 1px solid var(--border); padding-bottom: 5px; }
.ctx-item:last-child { border-bottom: 0; padding-bottom: 0; }
.ctx-head { width: 100%; display: flex; flex-direction: column; gap: 4px; padding: 4px; border: 0; border-radius: 5px; background: transparent; text-align: left; }
.ctx-head .rank-track { width: 100%; margin: 0; background: var(--subtle); }
.ctx-head:hover { background: var(--hover); }
.ctx-top { display: flex; align-items: center; justify-content: space-between; gap: 8px; font-size: 12px; min-width: 0; }
.node-expand { padding: 6px 4px 4px 16px; }
.pre-bar { display: flex; align-items: center; justify-content: space-between; gap: 8px; margin-bottom: 4px; font-size: 11px; }
.mini-copy { height: 20px; padding: 0 8px; border-radius: 5px; font-size: 11px; border: 1px solid var(--border); background: var(--subtle); color: var(--muted); }
.mini-copy:hover { color: var(--fg); background: var(--card-hover); }
pre {
  margin: 0; padding: 9px 11px; border-radius: 7px;
  background: var(--bg); border: 1px solid var(--border); color: var(--muted);
  font-family: var(--mono); font-size: 11.5px; line-height: 1.55;
  white-space: pre-wrap; word-break: break-word; max-height: 240px; overflow-y: auto;
}

.empty { padding: 24px; text-align: center; color: var(--muted); }
.empty-sm { padding: 12px 0; text-align: center; color: var(--faint); font-size: 12px; }

.agy-tip {
  position: fixed; z-index: 9999; pointer-events: none;
  opacity: 0; transition: opacity 0.08s ease;
  max-width: 290px; padding: 7px 10px; border-radius: 7px;
  background: var(--card); border: 1px solid var(--border);
  color: var(--fg); font-size: 11.5px; line-height: 1.45;
  white-space: pre-line; box-shadow: 0 8px 24px rgba(0, 0, 0, 0.36);
}
.agy-tip.show { opacity: 1; }
`;

async function main() {
  fs.mkdirSync(path.join(OUT_DIR, "bin"), { recursive: true });
  fs.mkdirSync(path.join(OUT_DIR, "assets"), { recursive: true });

  await esbuild.build({
    entryPoints: [path.join(__dirname, "server.mjs")],
    bundle: true,
    platform: "node",
    target: "node20",
    format: "cjs",
    outfile: path.join(OUT_DIR, "bin", "server.cjs"),
    logLevel: "info",
  });

  const uiRes = await esbuild.build({
    entryPoints: [path.join(__dirname, "ui.mjs")],
    bundle: true,
    platform: "browser",
    target: "es2022",
    format: "iife",
    charset: "utf8",
    write: false,
    minify: true,
  });

  const safeJs = uiRes.outputFiles[0].text.replace(/<\/script>/gi, "<\\/script>");
  const html = `<!DOCTYPE html>
<html lang="${BUILD_LANG === "zh" ? "zh-CN" : "en"}">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${HTML_TITLE}</title>
  <style>${STYLES}</style>
</head>
<body>
  <div id="app"></div>
  <script>${safeJs}</script>
</body>
</html>`;

  fs.writeFileSync(path.join(OUT_DIR, "assets", "app.html"), html, "utf-8");
  console.log(`Built agy-context v5.1 (${BUILD_LANG}) -> ${OUT_DIR} (app.html ${(Buffer.byteLength(html) / 1024).toFixed(1)} KB)`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
