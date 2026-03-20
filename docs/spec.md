# DEV TODO — 仕様書

> 最終更新: 2026-03-20 / コミット: `1184c28` (2026-03-18)
>
> このドキュメントは `scripts/gen-spec.js` で自動生成されます。再生成: `npm run docs`

---

## 概要

Claude Code × Supabase で動く開発タスク管理アプリ。GUIとMCPサーバーの両方からタスクを操作でき、エージェントランナーがClaudeに割り当てられたタスクを自動実行する。

---

## アーキテクチャ

```
ブラウザ GUI (public/)
  ↕ HTTP REST API
gui-server.js  ←→  todo-store.js  ←→  Supabase (PostgreSQL)
                                            ↑
mcp-todo-server.js (MCP/Stdio)  ←→  ────── ┤
                                            ↑
agent-runner.js (Supabase Realtime → claude CLI)
```

---

## データモデル

### todos テーブル

| フィールド | 型 | 説明 |
|-----------|-----|------|
| `id` | `string` | |
| `title` | `string` | |
| `completed` | `boolean` | |
| `createdAt` | `string` | |
| `completedAt` | `string | null` | |
| `dueDate` | `string?` | |
| `memo` | `string?` | |
| `assignee` | `enum?` | |
| `type` | `enum?` | |
| `subtasks` | `array` | |
| `status` | `enum` | |
| `result` | `string?` | |
| `reportUrl` | `string?` | |
| `prUrl` | `string?` | |
| `requestedAt` | `string?` | |

### reports テーブル

| フィールド | 型 | 説明 |
|-----------|-----|------|
| `id` | `uuid` | プライマリキー |
| `todo_id` | `uuid` | 対応するタスクID |
| `content` | `text` | 調査レポート (Markdown) |
| `created_at` | `timestamptz` | 作成日時 |

---

## REST API

ベースURL: `http://127.0.0.1:5177`

| メソッド | パス | 説明 |
|---------|------|------|
| GET | `/api/todos` | タスク一覧。クエリ: `status=all|open|done`, `limit` |
| POST | `/api/todos` | タスク追加。Body: `{ title, dueDate?, memo?, assignee?, type? }` |
| PATCH | `/api/todos/:id` | タスク更新。Body: `{ completed?, title?, dueDate?, memo?, assignee?, type? }` |
| DELETE | `/api/todos/:id` | タスク削除 |
| POST | `/api/todos/clear-completed` | 完了済みを一括削除。Body: `{ confirm: true }` |
| POST | `/api/todos/:id/request` | エージェントへリクエスト（status → requested） |
| POST | `/api/todos/:id/subtasks` | サブタスク追加。Body: `{ title }` |
| PATCH | `/api/todos/:id/subtasks/:subtaskId` | サブタスク更新。Body: `{ completed?, title? }` |
| DELETE | `/api/todos/:id/subtasks/:subtaskId` | サブタスク削除 |
| GET | `/api/docs/spec` | この仕様書 (Markdown) |
| GET | `/api/docs/diff` | 差分レポート (Markdown) |

---

## MCP ツール

Claude Code から使用できるMCPツール（Stdio transport）。

| ツール名 | タイトル | 説明 |
|---------|---------|------|
| `todo_add` | Add TODO | 新しいタスクを追加する。タイトル必須。実施日・メモはオプション。 |
| `todo_list` | List TODOs | タスク一覧を表示する。 |
| `todo_get` | Get TODO | IDを指定して1件のタスク詳細を取得する。サブタスク・メモも含む。 |
| `todo_update` | Update TODO | タスクのタイトル・実施日・メモを更新する。 |
| `todo_complete` | Complete TODO | タスクの完了/未完了を切り替える。 |
| `todo_delete` | Delete TODO | タスクを削除する。 |
| `todo_clear_completed` | Clear completed TODOs | 完了済みタスクをすべて削除する。 |
| `todo_add_subtask` | Add Subtask | タスクにサブタスクを追加する。 |
| `todo_toggle_subtask` | Toggle Subtask | サブタスクの完了/未完了を切り替える。 |
| `todo_delete_subtask` | Delete Subtask | サブタスクを削除する。 |

### 設定例 (.claude.json)

```json
{
  "mcpServers": {
    "mcp-todo": {
      "type": "stdio",
      "command": "node",
      "args": ["/path/to/dev_todo/mcp-todo-server.js"]
    }
  }
}
```

---

## エージェントランナー

`agent-runner.js` は Supabase Realtime で `status=requested` の変化を監視し、Claude CLI で自動実行する。

| タスクタイプ | 挙動 |
|------------|------|
| `research` | 調査レポートをMarkdownで生成、`reports`テーブルに保存 |
| `implement` | ブランチ作成・実装・PR作成まで自動実行 |
| （未設定） | 汎用プロンプトで実行 |

### タスクステータス遷移

`open` → `requested` → `running` → `done` / `error`

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
| `npm run gui` | GUIサーバー起動 (port 5177) |
| `npm run mcp` | MCPサーバー起動 |
| `npm run agent` | エージェントランナー起動 |
| `npm run docs` | 仕様書を再生成 (docs/spec.md) |
| `npm run docs:diff` | 差分レポート生成 (docs/diff-report.md) |
| `npm test` | ユニット + E2Eテスト実行 |

---

## 環境変数

| 変数名 | 必須 | 説明 |
|-------|------|------|
| `SUPABASE_URL` | ✅ | SupabaseプロジェクトURL |
| `SUPABASE_ANON_KEY` | ✅ | Supabase anon key |
| `PORT` | — | GUIサーバーのポート（デフォルト: 5177） |

---

## 最近のコミット

- `1184c28 feat: add Claude Code agents and skills for Miro-to-TODO workflow`
- `32f0887 docs: update README for new features and MCP setup`
- `205d5c1 feat: add detail panel, subtasks, and dueDate to GUI`
- `6fc0ee1 feat: extend MCP server with update, subtask, and dueDate tools`
- `1825b3c feat: add dueDate, memo, and subtask support to todo store`
- `b37096c chore: gitignore todo data file and untrack it`
- `15489f6 Initial commit: dev_todo project`
