**project: `github-actions`**

# GitHub Actions リモートタスク実行 + PRレビュー対応

## Context

現在のタスク自動実行はローカルPCの `agent-runner.js` に依存しており、PCがオフだと動作しない。
外出先からスマホでリクエスト → Claude が実装/調査 → PR作成 → レビュー対応まで完結させたい。
GitHub Actions + claude-code-action で実現する。

## アーキテクチャ

```
[スマホ/ブラウザ] → リクエストボタン
    ↓
[Vercel API] POST /api/todos/:id/request
    ↓ DB status="requested" + workflow_dispatch トリガー
[GitHub Actions: run-task.yml]
    ↓ checkout → claude-code-action → ブランチ作成 → PR
    ↓ Supabase DB 更新 (status="done", prUrl=...)
[GitHub PR]
    ↓ レビュー (changes_requested)
[GitHub Actions: review-fix.yml]
    ↓ checkout 同ブランチ → claude-code-action → 修正 → push
[PR 更新]
```

## 実装タスク

### 1. GitHub Actions ヘルパースクリプト
- `.github/scripts/update-status.mjs` — Supabase REST API で status 更新
- `.github/scripts/finalize-task.mjs` — 完了時に result/prUrl/reportUrl を DB に書き戻す
- 依存ゼロ（fetch で Supabase REST API を直接叩く）

### 2. タスク実行用 Workflow
- `.github/workflows/run-task.yml`
- `workflow_dispatch` トリガー（inputs: task_id, title, memo, type）
- `anthropics/claude-code-action@v1` で Claude 実行
- ステップ: checkout → status=running → Claude実行 → finalize

### 3. PRレビュー対応用 Workflow
- `.github/workflows/review-fix.yml`
- `pull_request_review` トリガー（types: [submitted]）
- `github.event.review.state == 'changes_requested'` の場合のみ実行
- 同じブランチを checkout → claude-code-action で修正 → push

### 4. Vercel API 拡張（workflow_dispatch トリガー）
- `api/todos/[id]/request.js` に `triggerGitHubWorkflow()` 追加
- GitHub REST API: `POST /repos/namikis/dev_todo/actions/workflows/run-task.yml/dispatches`
- `GITHUB_PAT` 環境変数で認証
- dispatch 失敗してもステータス更新は維持（手動リトライ可能にする）

### 5. gui-server.js のローカル対応
- `gui-server.js` の request ハンドラにも同じ dispatch ロジック追加
- `GITHUB_PAT` がセットされている場合のみトリガー（なければ agent-runner.js に任せる）

### 6. Secrets & 環境変数の設定（手動作業）
- **GitHub Secrets**: `ANTHROPIC_API_KEY`, `SUPABASE_URL`, `SUPABASE_SERVICE_KEY`
- **Vercel 環境変数**: `GITHUB_PAT`（repo + actions:write スコープ）
- **Supabase service_role key**: ダッシュボードから取得

### 7. .env.example & README 更新
- `.env.example` に `GITHUB_PAT` 追記
- `README.md` に GitHub Actions セクション追加

### 8. 動作確認
- リクエストボタン → Actions 起動 → PR 作成 → DB 更新の E2E 確認
- PR にレビューコメント → 自動修正 → push の確認

## 二重実行の防止

- GitHub Actions の最初のステップで `status="running"` に更新
- agent-runner.js は `status="requested"` のみ処理
- Actions が先に running にすれば agent-runner.js は検知しない

## 対象ファイル

| ファイル | 変更内容 |
|---------|---------|
| `.github/workflows/run-task.yml` | 新規作成 |
| `.github/workflows/review-fix.yml` | 新規作成 |
| `.github/scripts/update-status.mjs` | 新規作成 |
| `.github/scripts/finalize-task.mjs` | 新規作成 |
| `api/todos/[id]/request.js` | workflow_dispatch トリガー追加 |
| `gui-server.js` | dispatch ロジック追加（GITHUB_PAT がある場合） |
| `.env.example` | GITHUB_PAT 追記 |
| `README.md` | GitHub Actions セクション追加 |

## 検証方法

1. `run-task.yml` を手動で workflow_dispatch してActions が起動するか
2. Vercel API からの dispatch が動作するか（リクエストボタン経由）
3. Claude が PR を作成し、DB が更新されるか
4. PR にレビュー → review-fix.yml が起動 → 修正コミットが push されるか
