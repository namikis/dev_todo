project: issue-discussion

# Issue連携によるClaude↔ユーザー対話機能

## 概要

GitHub Actionsワークフローで実行中のClaudeが、方針確認や不明点についてGitHub Issueを作成し、ユーザーとの複数往復のディスカッションを行えるようにする。

## ステータス遷移

```
open → requested → running → blocked → (ユーザー回答) → running → blocked → ... → done/error
```

`blocked` = Claudeが質問中、ユーザーの回答待ち

## 変更対象

### 1. DB (supabase-schema.sql)
- `status` CHECK に `blocked` を追加
- `issue_url` カラム追加 (text, nullable)

### 2. バックエンド (todo-store.js)
- `fromRow` / `TodoSchema` に `issueUrl` 追加

### 3. API (api/todos/[id]/index.js)
- PATCH で `issueUrl` の更新を受付

### 4. フロントエンド (public/app.js)
- `blocked` ステータスの表示（パルスアニメーション付き）
- Issue リンク表示（全ステータスで、存在する場合に表示）
- PR リンク表示（既存だが blocked 時も表示）

### 5. GitHub Actions
- **run-task.yml 修正**: Claude に Issue 作成権限・指示を追加。終了コード or 出力から blocked 判定
- **issue-response.yml 新規**: `issue_comment` トリガー。ラベル `task-question` のIssueへのコメントで再開
- **.github/scripts/update-status.mjs 修正**: `--issue-url` フラグ対応

### 6. ヘルパースクリプト
- `.github/scripts/parse-blocked.mjs` 新規: Claude出力から blocked/issue_url を検出

### 7. CLAUDE.md 更新

## Issue フォーマット

```
タイトル: [Task: <task_id>] <質問の要約>
ラベル: task-question
本文:
  ## タスク情報
  - タイトル: ...
  - ID: ...

  ## 質問内容
  Claudeの質問文

  ---
  このIssueに返信すると、Claudeが回答を受けて作業を再開します。
```

## 再開フロー（issue-response.yml）

1. `issue_comment` created トリガー
2. ラベル `task-question` の Issue のみ対象
3. Issue タイトルから task_id を抽出
4. DB status を `running` に更新
5. Claude に「元タスク + Issue全コメント履歴」をプロンプトとして渡す
6. Claude が追加質問 → 再び blocked / 回答得て完了 → done
