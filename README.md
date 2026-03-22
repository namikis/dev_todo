# DEV TODO

開発・調査タスクを管理する TODO アプリ。
Supabase をバックエンドに、GUI / MCP / Vercel デプロイに対応。

**本番URL**: https://dev-todo-three.vercel.app

## アーキテクチャ

```
┌──────────────────────────────┐
│  Vercel (フロントエンド + API) │
│  - public/ → 静的配信         │
│  - api/   → Serverless Functions │
└──────────┬───────────────────┘
           │
     ┌─────▼──────┐
     │  Supabase   │  DB (Postgres) + Realtime
     └─────┬──────┘
           │
┌──────────▼──────────────────┐
│  ローカル PC                 │
│  - gui-server.js (開発用)    │
│  - mcp-todo-server.js (AI連携) │
│  - agent-runner.js (自動実行)  │
└─────────────────────────────┘
```

## 主要ファイル

| ファイル | 役割 |
|---------|------|
| `todo-store.js` | データ層（Supabase CRUD） |
| `gui-server.js` | ローカル開発用 REST API サーバー (port 5177) |
| `mcp-todo-server.js` | MCP Server（AI エージェント連携） |
| `agent-runner.js` | Supabase Realtime 購読 → Claude 自動実行 |
| `api/` | Vercel Serverless Functions |
| `public/` | フロントエンド（バニラ JS） |
| `vercel.json` | Vercel ルーティング設定 |

## 機能

- タスクの追加・完了・削除
- **プロジェクト** 別グルーピング・フィルター
- **実施日** の設定・変更（期限超過は赤色表示）
- **担当者**（Tairyu / Claude）のアサインとフィルター
- **タスクタイプ**（調査 / 実装）の分類
- **サブタスク** の追加・完了・削除
- **メモ** の自由記述（自動保存）
- **検索** によるタスク絞り込み
- **MCP連携** によるAIエージェントからのタスク操作
- **Claude リクエスト** ボタンで自動実行トリガー

## 必要要件

- Node.js **20 以上**
- Supabase プロジェクト（環境変数に URL と Key を設定）

## セットアップ

```bash
npm install
cp .env.example .env
# .env に SUPABASE_URL と SUPABASE_ANON_KEY を設定
```

## ローカル開発

```bash
npm start
```

http://127.0.0.1:5177 にアクセス。ポート変更は `PORT` 環境変数で指定可能。

## Vercel デプロイ

Vercel にデプロイ済み。GitHub push で自動デプロイされる。

```bash
vercel ls          # デプロイ状況確認
vercel inspect URL --logs  # ビルドログ確認
```

### 環境変数（Vercel に設定済み）

| 変数 | 説明 |
|------|------|
| `SUPABASE_URL` | Supabase プロジェクト URL |
| `SUPABASE_ANON_KEY` | Supabase Anon Key |
| `GITHUB_PAT` | GitHub PAT（GitHub Actions トリガー用、任意） |

## MCP（AI エージェント連携）

stdio ベースの MCP サーバーとして動作。

```bash
npm run mcp
```

### 提供ツール

| ツール | 説明 |
|--------|------|
| `todo_add` | タスク追加 |
| `todo_list` | 一覧取得 |
| `todo_get` | 1件取得（詳細） |
| `todo_update` | タスク更新（タイトル・日付・メモ・担当・タイプ・プロジェクト） |
| `todo_complete` | 完了/未完了の切り替え |
| `todo_delete` | タスク削除 |
| `todo_clear_completed` | 完了済みを一括削除 |
| `todo_add_subtask` | サブタスク追加 |
| `todo_toggle_subtask` | サブタスク完了切替 |
| `todo_delete_subtask` | サブタスク削除 |

### MCP 設定

`.mcp.json`（プロジェクトルート）:

```json
{
  "mcpServers": {
    "mcp-todo": {
      "command": "node",
      "args": ["./mcp-todo-server.js"]
    }
  }
}
```

> **nvm 環境の場合**: Node の絶対パスを指定してください。
> ```bash
> nvm which 20
> ```

## REST API

| メソッド | パス | 説明 |
|---------|------|------|
| GET | `/api/todos?status=all\|open\|done&limit=50` | 一覧取得 |
| POST | `/api/todos` | タスク追加 |
| PATCH | `/api/todos/:id` | タスク更新 |
| DELETE | `/api/todos/:id` | タスク削除 |
| POST | `/api/todos/:id/request` | Claude 実行リクエスト |
| POST | `/api/todos/clear-completed` | 完了済み一括削除 |
| POST | `/api/todos/:id/subtasks` | サブタスク追加 |
| PATCH | `/api/todos/:id/subtasks/:subtaskId` | サブタスク更新 |
| DELETE | `/api/todos/:id/subtasks/:subtaskId` | サブタスク削除 |

## テスト

```bash
npm test              # ユニット + E2E
npm run test:unit     # ユニットのみ
npm run test:e2e      # Playwright E2E のみ
```

## GitHub Actions（リモートタスク実行）

PCがオフでもスマホからタスクをリクエストし、GitHub Actions 上で Claude が自動実行 → PR作成まで行う仕組み。

### フロー

```
リクエストボタン → Vercel API (status=requested + workflow_dispatch)
  → GitHub Actions (run-task.yml) → Claude 実行 → PR作成 → DB更新
PR レビュー (changes_requested)
  → GitHub Actions (review-fix.yml) → Claude 修正 → push
```

### ワークフロー

| ファイル | トリガー | 内容 |
|---------|---------|------|
| `.github/workflows/run-task.yml` | `workflow_dispatch` | タスク実行 → PR作成 |
| `.github/workflows/review-fix.yml` | `pull_request_review` | レビュー修正対応 |

### 必要な Secrets（GitHub リポジトリに設定）

| Secret | 説明 |
|--------|------|
| `ANTHROPIC_API_KEY` | Claude API キー |
| `SUPABASE_URL` | Supabase プロジェクト URL |
| `SUPABASE_SERVICE_KEY` | Supabase service_role キー |

### 必要な環境変数（Vercel に設定）

| 変数 | 説明 |
|------|------|
| `GITHUB_PAT` | GitHub PAT（repo + actions:write スコープ） |

### 二重実行の防止

- GitHub Actions の最初のステップで `status="running"` に更新
- `agent-runner.js` は `status="requested"` のみ処理
- Actions が先に running にすれば agent-runner.js は検知しない

## プロジェクト管理

- 大掛かりな実装は `.claude/plans/[プロジェクト名]_plan.md` に計画を記載
- タスクの `project` フィールドは plan ファイル単位で付与
