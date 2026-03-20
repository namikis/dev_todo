#!/usr/bin/env node
/**
 * gen-spec.js — DEV TODO の仕様書を自動生成する
 * 使用方法: node scripts/gen-spec.js
 * 出力: docs/spec.md
 */
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { execSync } from "node:child_process";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.join(__dirname, "..");

async function readSrc(filename) {
  return readFile(path.join(ROOT, filename), "utf8");
}

function parseMcpTools(src) {
  const tools = [];
  let idx = 0;
  while (true) {
    const pos = src.indexOf("server.registerTool(", idx);
    if (pos === -1) break;
    const nameMatch = src.slice(pos).match(/server\.registerTool\(\s*["'](\w+)["']/);
    if (!nameMatch) { idx = pos + 1; continue; }
    const optStart = src.indexOf("{", pos + nameMatch[0].length);
    const titleMatch = src.slice(optStart).match(/title:\s*["']([^"']+)["']/);
    const descMatch = src.slice(optStart).match(/description:\s*["']([^"']+)["']/);
    tools.push({
      name: nameMatch[1],
      title: titleMatch ? titleMatch[1] : "",
      description: descMatch ? descMatch[1] : "",
    });
    idx = pos + 1;
  }
  return tools;
}

function parseTodoSchemaFields(src) {
  const start = src.indexOf("export const TodoSchema");
  if (start === -1) return [];
  const endPos = src.indexOf("});", start);
  const block = src.slice(start, endPos + 3);
  const fields = [];
  const re = /^\s{2}(\w+):\s*z\.(\w+)/gm;
  let m;
  while ((m = re.exec(block)) !== null) {
    // Detect nullable/optional modifiers on the same line
    const lineEnd = block.indexOf("\n", re.lastIndex);
    const lineRest = block.slice(m.index, lineEnd === -1 ? undefined : lineEnd);
    const nullable = lineRest.includes(".nullable()");
    const optional = lineRest.includes(".optional()");
    let type = m[2];
    if (nullable && optional) type += "?";
    else if (nullable) type += " | null";
    fields.push({ name: m[1], type });
  }
  return fields;
}

function git(cmd) {
  try { return execSync(cmd, { cwd: ROOT }).toString().trim(); } catch { return ""; }
}

async function main() {
  const [mcpSrc, storeSrc] = await Promise.all([
    readSrc("mcp-todo-server.js"),
    readSrc("todo-store.js"),
  ]);

  const tools = parseMcpTools(mcpSrc);
  const schemaFields = parseTodoSchemaFields(storeSrc);

  const now = new Date().toISOString().slice(0, 10);
  const commitHash = git("git rev-parse --short HEAD");
  const commitDate = git("git log -1 --format=%ci HEAD").slice(0, 10);
  const recentLog = git("git log --oneline -8");

  const spec = `# DEV TODO — 仕様書

> 最終更新: ${now} / コミット: \`${commitHash}\` (${commitDate})
>
> このドキュメントは \`scripts/gen-spec.js\` で自動生成されます。再生成: \`npm run docs\`

---

## 概要

Claude Code × Supabase で動く開発タスク管理アプリ。GUIとMCPサーバーの両方からタスクを操作でき、エージェントランナーがClaudeに割り当てられたタスクを自動実行する。

---

## アーキテクチャ

\`\`\`
ブラウザ GUI (public/)
  ↕ HTTP REST API
gui-server.js  ←→  todo-store.js  ←→  Supabase (PostgreSQL)
                                            ↑
mcp-todo-server.js (MCP/Stdio)  ←→  ────── ┤
                                            ↑
agent-runner.js (Supabase Realtime → claude CLI)
\`\`\`

---

## データモデル

### todos テーブル

| フィールド | 型 | 説明 |
|-----------|-----|------|
${schemaFields.map((f) => `| \`${f.name}\` | \`${f.type}\` | |`).join("\n")}

### reports テーブル

| フィールド | 型 | 説明 |
|-----------|-----|------|
| \`id\` | \`uuid\` | プライマリキー |
| \`todo_id\` | \`uuid\` | 対応するタスクID |
| \`content\` | \`text\` | 調査レポート (Markdown) |
| \`created_at\` | \`timestamptz\` | 作成日時 |

---

## REST API

ベースURL: \`http://127.0.0.1:5177\`

| メソッド | パス | 説明 |
|---------|------|------|
| GET | \`/api/todos\` | タスク一覧。クエリ: \`status=all|open|done\`, \`limit\` |
| POST | \`/api/todos\` | タスク追加。Body: \`{ title, dueDate?, memo?, assignee?, type? }\` |
| PATCH | \`/api/todos/:id\` | タスク更新。Body: \`{ completed?, title?, dueDate?, memo?, assignee?, type? }\` |
| DELETE | \`/api/todos/:id\` | タスク削除 |
| POST | \`/api/todos/clear-completed\` | 完了済みを一括削除。Body: \`{ confirm: true }\` |
| POST | \`/api/todos/:id/request\` | エージェントへリクエスト（status → requested） |
| POST | \`/api/todos/:id/subtasks\` | サブタスク追加。Body: \`{ title }\` |
| PATCH | \`/api/todos/:id/subtasks/:subtaskId\` | サブタスク更新。Body: \`{ completed?, title? }\` |
| DELETE | \`/api/todos/:id/subtasks/:subtaskId\` | サブタスク削除 |
| GET | \`/api/docs/spec\` | この仕様書 (Markdown) |
| GET | \`/api/docs/diff\` | 差分レポート (Markdown) |

---

## MCP ツール

Claude Code から使用できるMCPツール（Stdio transport）。

| ツール名 | タイトル | 説明 |
|---------|---------|------|
${tools.map((t) => `| \`${t.name}\` | ${t.title} | ${t.description} |`).join("\n")}

### 設定例 (.claude.json)

\`\`\`json
{
  "mcpServers": {
    "mcp-todo": {
      "type": "stdio",
      "command": "node",
      "args": ["/path/to/dev_todo/mcp-todo-server.js"]
    }
  }
}
\`\`\`

---

## エージェントランナー

\`agent-runner.js\` は Supabase Realtime で \`status=requested\` の変化を監視し、Claude CLI で自動実行する。

| タスクタイプ | 挙動 |
|------------|------|
| \`research\` | 調査レポートをMarkdownで生成、\`reports\`テーブルに保存 |
| \`implement\` | ブランチ作成・実装・PR作成まで自動実行 |
| （未設定） | 汎用プロンプトで実行 |

### タスクステータス遷移

\`open\` → \`requested\` → \`running\` → \`done\` / \`error\`

---

## GUI 機能

| 機能 | 説明 |
|------|------|
| タスク一覧 | 実施日でグループ化、期限切れをハイライト |
| フィルタ | ステータス・担当者で絞り込み |
| 検索 | タイトル・メモ・サブタスクをインクリメンタル検索 |
| タスク追加 | タイトル・実施日・担当・タイプをフォームから入力 |
| 詳細パネル | クリックで開閉、各フィールドをインライン編集 |
| サブタスク | 追加・チェック・編集・削除 |
| エージェントリクエスト | Claude担当タスクを「リクエスト」ボタンで送信 |
| ステータス表示 | 待機中・実行中・完了・エラーをUIで表示 |
| 仕様書ビュー | ヘッダーの「仕様書」ボタンで本ドキュメントをGUI内表示 |

---

## npm スクリプト

| コマンド | 説明 |
|---------|------|
| \`npm run gui\` | GUIサーバー起動 (port 5177) |
| \`npm run mcp\` | MCPサーバー起動 |
| \`npm run agent\` | エージェントランナー起動 |
| \`npm run docs\` | 仕様書を再生成 (docs/spec.md) |
| \`npm run docs:diff\` | 差分レポート生成 (docs/diff-report.md) |
| \`npm test\` | ユニット + E2Eテスト実行 |

---

## 環境変数

| 変数名 | 必須 | 説明 |
|-------|------|------|
| \`SUPABASE_URL\` | ✅ | SupabaseプロジェクトURL |
| \`SUPABASE_ANON_KEY\` | ✅ | Supabase anon key |
| \`PORT\` | — | GUIサーバーのポート（デフォルト: 5177） |

---

## 最近のコミット

${recentLog ? recentLog.split("\n").map((l) => `- \`${l}\``).join("\n") : "（なし）"}
`;

  await mkdir(path.join(ROOT, "docs"), { recursive: true });
  await writeFile(path.join(ROOT, "docs", "spec.md"), spec, "utf8");
  console.log(`✓ docs/spec.md を生成しました`);
}

main().catch((e) => { console.error(e); process.exit(1); });
