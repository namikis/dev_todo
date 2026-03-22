# プロジェクトスコープ設定

- タスクを実施する際は進捗をこまめにユーザーに報告すること。
- 以下の「プロジェクト構成」セクションは実装変更時に必ず最新状態に更新すること。

## プロジェクト管理ルール

- 大掛かりな実装を行う場合は `.claude/plans/[プロジェクト名]_plan.md` を作成し、計画・設計メモをそこに記載する。
- 各タスクに付与する `project` 名は plan ファイル単位とする（1つの plan = 1つのプロジェクト名）。
- plan ファイルの先頭に `project: <プロジェクト名>` を明記すること。

## プロジェクト構成

### 技術スタック

| 領域 | 技術 |
|------|------|
| フロントエンド | バニラ JavaScript（フレームワークなし） |
| バックエンド | Node.js + Vercel Serverless Functions |
| データベース | Supabase (PostgreSQL) |
| 認証 | Supabase Auth (メール・パスワード / Bearer Token) |
| デプロイ | Vercel + GitHub Actions |
| テスト | Playwright (E2E) |
| AI連携 | MCP Server + GitHub Actions (Claude自動実行) |

### ディレクトリ構成

```
dev_todo/
├── public/                  # フロントエンド（静的ファイル）
│   ├── index.html           # メインUI
│   ├── claude.html          # Claude用UI
│   ├── app.js               # メインロジック（API通信・状態管理・DOM操作）
│   ├── claude-app.js        # Claude用スクリプト
│   └── style.css            # スタイル（ダーク/ライトテーマ対応）
├── api/                     # Vercel Serverless Functions
│   ├── _lib/auth.js         # 認証ヘルパー（Bearer Token検証）
│   ├── auth/config.js       # GET /api/auth/config
│   ├── todos/index.js       # GET/POST /api/todos
│   ├── todos/[id]/index.js  # PATCH/DELETE /api/todos/:id
│   ├── todos/[id]/request.js # POST /api/todos/:id/request
│   ├── todos/[id]/subtasks/ # サブタスク CRUD
│   └── docs/                # 仕様書API
├── todo-store.js            # Supabase CRUD処理（全APIの共通データ層）
├── gui-server.js            # ローカル開発用サーバー (port 5177)
├── mcp-todo-server.js       # MCP Server（Claude Code連携）
├── agent-runner.js          # Supabase Realtime → GitHub Actions自動実行
├── supabase-schema.sql      # DBスキーマ定義
└── tests/                   # E2E + ユニットテスト
```

### フロントエンド設計 (public/app.js)

- **状態管理**: グローバル変数 (`cachedTodos`, `openDetails`, `showCompleted`, `isLoggedIn`)
- **API通信**: `api(path, options)` 関数で全API呼び出しを統一（Bearer Token自動付与）
- **ローディング**: `withLoading(btn, fn)` ヘルパーでボタン無効化+スピナー表示
- **キャッシュ**: `cachedTodos` でローカルキャッシュし、フィルター/検索/詳細開閉は `rerender()` で再取得なし再描画
- **レンダリング**: `render(todos)` でDOM全体を再構築。プロジェクト→実施日のグループ表示
- **ディバウンス**: 検索(200ms)、メモ(500ms)、プロジェクト(500ms)

### REST API

```
GET    /api/auth/config                    # Supabase設定取得
GET    /api/todos?status=all|open|done     # タスク一覧（limit対応）
POST   /api/todos                          # タスク追加
PATCH  /api/todos/:id                      # タスク更新
DELETE /api/todos/:id                      # タスク削除
POST   /api/todos/:id/request             # Claude実行リクエスト
POST   /api/todos/clear-completed         # 完了済み一括削除
POST   /api/todos/:id/subtasks            # サブタスク追加
PATCH  /api/todos/:id/subtasks/:sid       # サブタスク更新
DELETE /api/todos/:id/subtasks/:sid       # サブタスク削除
GET    /api/docs/spec|claude|diff         # ドキュメント取得
```

### DBスキーマ (todos テーブル)

主要カラム: `id(uuid)`, `title`, `completed`, `due_date`, `memo`, `assignee(Claude|Tairyu)`, `type(research|implement)`, `project`, `subtasks(jsonb)`, `status(open|requested|running|blocked|done|error)`, `result`, `report_url`, `pr_url`, `issue_url`

### GitHub Actions ワークフロー

#### run-task.yml — Claude自動タスク実行

UIの「リクエスト」ボタンから `workflow_dispatch` で起動される。

**フロー:**
```
UI「リクエスト」→ POST /api/todos/:id/request
  → DB: status="requested" + GitHub API workflow_dispatch 発火
  → run-task.yml 実行開始
    1. npm ci
    2. update-status.mjs → DB: status="running", report_url=Actions URL
    3. タスクの type に応じたプロンプトを構築（Issue作成の指示を含む）
    4. anthropics/claude-code-action@v1 で Claude 実行
    5. 品質チェック（permission_denials 検出）
    6. Issue 作成の検出: task-question ラベル付きIssueを検索
       - Issue あり → status="blocked", issue_url 保存して終了
       - Issue なし → 通常フローへ
    7. implement の場合: npm test でノンデグ確認
    8. gh pr list で最新PR URL を取得
    9. finalize-task.mjs → DB: status="done"/"error", pr_url, report_url, result
```

**入力パラメータ:** `task_id`, `title`, `memo`, `type(research|implement)`

**プロンプト生成ルール:**
- `research`: 調査 → Markdownレポート出力を指示
- `implement`: 実装 → ブランチ作成・コミット・PR作成を指示。PRのbodyに `Task: <task_id>` を含めるよう指示
- その他: 汎用実行
- 全タイプ共通: 不明点がある場合は `gh issue create` で Issue を作成し実装を中断する指示を含む

**Claude に許可されたツール:** `Bash Read Write Edit Glob Grep WebSearch WebFetch`

#### issue-response.yml — Issue コメントによるタスク再開

`task-question` ラベル付き Issue へのユーザーコメントで Claude を再開する。複数往復のディスカッションに対応。

**トリガー:** `issue_comment` (created) — bot コメントは除外

**フロー:**
```
ユーザーが Issue にコメント
  → issue-response.yml 実行開始
    1. Issue タイトルから task_id を抽出（[Task: <id>] パターン）
    2. DB からタスク詳細を取得
    3. Issue の全コメント履歴を取得
    4. 元タスク + 会話履歴を含むプロンプトを構築
    5. Claude 実行
    6. Claude が追加質問をした場合 → status="blocked" で終了（再びユーザー回答待ち）
    7. 完了した場合 → Issue を close、テスト実行、status="done"
```

**Issue フォーマット（Claude が作成）:**
```
タイトル: [Task: <task_id>] <質問の要約>
ラベル: task-question
本文: 質問内容
```

#### review-fix.yml — PRレビュー自動修正

PRに `changes_requested` レビューが付くとトリガーされる。

**フロー:**
```
PRレビュー(changes_requested)
  → review-fix.yml 実行開始
    1. PRブランチをチェックアウト（fetch-depth: 0）
    2. npm ci
    3. レビューコメントを含むプロンプトを構築
    4. anthropics/claude-code-action@v1 で修正実行
    5. npm test でノンデグ確認
```

#### ヘルパースクリプト (.github/scripts/)

| スクリプト | 用途 |
|-----------|------|
| `update-status.mjs` | タスクの status / report_url / issue_url を Supabase REST API で更新 |
| `finalize-task.mjs` | タスク完了時に status / pr_url / report_url / issue_url / result を書き戻し |

両スクリプトとも依存ゼロ（Node.js 組み込み fetch のみ）、`SUPABASE_URL` + `SUPABASE_SERVICE_KEY` 環境変数を使用。

#### ローカル agent-runner.js（代替実行経路）

GitHub Actions の代わりにローカルで Claude を直接実行する仕組み。

- Supabase Realtime で `status=requested` の変更を監視
- `claude -p <prompt>` コマンドで Claude CLI を直接起動（タイムアウト10分）
- 出力から PR URL を正規表現で抽出
- research タイプは `reports` テーブルにレポートを保存

### タスクステータスの遷移

```
open → requested → running → done
                          → error
                          → blocked → (ユーザー回答) → running → ...
```

| 遷移 | トリガー | 更新箇所 |
|------|---------|---------|
| open → requested | UI「リクエスト」ボタン / MCP | POST /api/todos/:id/request |
| requested → running | Actions 開始 / agent-runner | update-status.mjs / agent-runner.js |
| running → blocked | Claude が Issue を作成 | finalize-task.mjs (issue_url 付与) |
| blocked → running | ユーザーが Issue にコメント | issue-response.yml → update-status.mjs |
| running → done | Actions 成功 | finalize-task.mjs (pr_url, report_url 付与) |
| running → error | Actions 失敗 / テスト失敗 | finalize-task.mjs (result にエラー内容) |

### 必要な Secrets（GitHub Actions）

| Secret | 用途 |
|--------|------|
| `ANTHROPIC_API_KEY` | Claude API キー |
| `SUPABASE_URL` | Supabase プロジェクト URL |
| `SUPABASE_SERVICE_KEY` | Supabase サービスロールキー（RLS バイパス） |
