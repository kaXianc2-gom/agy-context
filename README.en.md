# Context Lens (`agy-context`)

[English](README.md) | [简体中文](README.zh-CN.md)

**Context Lens** is a zero-cloud, local-first Antigravity MCP App plugin for cross-session token telemetry and live in-conversation context window anatomy.

Both **English (`main` branch)** and **Simplified Chinese (`zh-CN` branch)** official editions are provided, and both include an instant in-app **`EN / 中`** language switcher.

---

## Key Features

### 1. Global **Context Lens** Dashboard (Left Sidebar Entrypoint)
- **2×3 Executive KPI Grid**: Active sessions, total tokens & turns, estimated USD API-equivalent spend & cache savings, prefix cache hit rate, tool calls & deduplicated wall-clock execution time, and calibrated active duration.
- **Last 7 Days / Custom Date Range Dual-Axis Chart**: Paired Token (blue) and USD Cost (green) bars with an interactive date-range picker (`Today`, `7D`, `30D`, `All`, `Last 14D`, `This Week`, `This Month`, or custom start/end dates).
- **8-Week Activity Calendar**: Blue-scale heatmap with `Sessions / Tokens` toggle and click-to-drill single-day filtering.
- **8-Category Token & 6-Category Latency Donuts**:
  - Tokens: `System Prompt`, `Tool Schemas` (calibrated from real installed plugin skill/MCP catalogs), `User Messages`, `Injected`, `Skill Loads`, `Tool Calls`, `Reasoning`, and `Replies`.
  - Latency: `TTFT Wait`, `Reasoning`, `Reply Gen`, `Tool Args`, `Tool Exec` (interval-merged across parallel tool calls), and `Overhead`, plus calibrated output velocity (`tok/s`).
- **4-Column Cross-Filter Rankings**: `[Models | Workspaces]`, `Skill Loads`, `Tool Calls`, and `Shell Commands` — click any row to cross-filter the session cards below.
- **Session Card Matrix**: Dominant model badge (`+N` when multi-model), inferred workspace badge, live running indicator, mini composition donut, and click-to-drill full session anatomy.

### 2. In-Conversation **Context** Anatomy (Right Side-Pane `aux_pane`)
- **Sticky Real-Time Micro-HUD**: Always-visible top bar showing output speed (`tok/s`), cache hit rate, mini circular window progress (`%`), estimated cost, and a 4-second `mtime` incremental `Live` sync toggle (`~2ms` idle check; never interrupts IME typing or inner scroll).
- **Responsive Dual-Column Layout**: Compact single-column at `380px` side-pane width; expands automatically into a full dual-column layout when widened (`>= 840px`) or drilled from a session card.
- **Session Summary & Agent Tree**: Turn/step/skill/reply counts, context events (`Injected / Compacted / Cache Miss`), File I/O, and parent-child subagent rollups.
- **Active Context Window Bar & Timeline**: Multi-color stacked window utilization bar plus `[Steps | Turns] × [Total | Delta]` timeline with compaction, model-switch, and cache-miss inflection markers and `← / →` keyboard scrubbing.
- **Grouped Context Browser (`Active | Step Diff | Turn Diff | All`)**: Collapsible category accordion that isolates post-compaction active-window items by default, supports single-step and single-turn diffs, reads full untruncated logs on demand, and provides one-click copy.

### 3. Inline Micro-HUD (`show_context_snapshot`)
- Single-row compact status bar rendered directly inside the chat stream.

---

## Installation

### Option 1: Install Directly via Antigravity CLI (Recommended)

**English Edition (`Context Lens`):**
```bash
agy plugin install https://github.com/kaXianc2-gom/agy-context
```

**Chinese Edition (`上下文透视`):**
Download `agy-context-v5.1.0-zh-CN.zip` from [GitHub Releases](https://github.com/kaXianc2-gom/agy-context/releases) or clone the `zh-CN` branch into `~/.gemini/config/plugins/agy-context`:
```bash
git clone -b zh-CN https://github.com/kaXianc2-gom/agy-context.git ~/.gemini/config/plugins/agy-context
```

### Option 2: Manual Install from Release Archives
1. Download either `agy-context-v5.1.0-en.zip` (English) or `agy-context-v5.1.0-zh-CN.zip` (Chinese) from [Releases](https://github.com/kaXianc2-gom/agy-context/releases).
2. Extract into `~/.gemini/config/plugins/agy-context/`.
3. Antigravity discovers the plugin automatically (Node.js 20+ required; zero external runtime dependencies).

---

## Local Development & Building

```bash
npm install
npm run build:en   # Build English edition (bin/server.cjs + assets/app.html)
npm run build:zh   # Build Chinese edition (bin/server.cjs + assets/app.html)
agy plugin validate .
```

## Privacy & Security

- **100% Local**: Reads only your local `~/.gemini/antigravity/brain/` transcripts, local plugin skill/MCP manifests, and local Antigravity `ConversationService` (`localhost`).
- **Zero External Network Calls**: No telemetry, no analytics beacons, and strict MCP App CSP (`default-src 'none'`).

## License

[MIT](LICENSE)
