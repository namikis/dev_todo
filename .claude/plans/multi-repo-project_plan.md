project: multi-repo-project

# プロジェクトにリポジトリを紐づけ、他リポジトリのタスクも管理可能にする

## Context

現在 dev_todo は自リポジトリ（namikis/dev_todo）のタスクのみを管理している。
他の ~/Desktop/program/ 配下のリポジトリ（namikis/ai-poc, namikis/trypick 等）のタスクも
このTODOリストで管理したい。プロジェクトにリポジトリ（`owner/repo`）を紐づける形で実現する。
リポジトリ紐づきプロジェクトとそうでないプロジェクトが混在する。
リポジトリ紐づきプロジェクトのタスクでは、リクエストボタン（GitHub Actions dispatch）は
一旦非表示にする（対象リポジトリのワークフロー未対応のため）。
他リポジトリの Claude CLI から MCP 経由でタスク操作する想定。

## 変更一覧

### 1. DB スキーマ (`supabase-schema.sql`)
- `projects` テーブルに `repository text` カラム追加（nullable）
- マイグレーション SQL を末尾に追記

### 2. API: `api/projects/index.js`
- GET: `repository` を含めて返却（既に `select("*")` なのでカラム追加のみで対応）
- POST: `repository` を受け取り upsert に含める

### 3. API: `api/projects/[name].js`
- PATCH メソッド追加: `repository` の更新

### 4. データ層: `todo-store.js`
- `listTodos()` に `project` フィルターオプション追加
- `listProjects()` 関数を新規追加（projects テーブルから全件取得）

### 5. MCP サーバー: `mcp-todo-server.js`
- `todo_list` に `project` パラメータ追加（特定プロジェクトのタスクだけ一覧）
- `todo_project_list` ツール新規追加（プロジェクト一覧取得。リポジトリ情報も返す）

### 6. フロントエンド: `public/app.js`
- `cachedProjects` を `string[]` → `{ name, repository }[]` に変更
- `fetchProjects()`: オブジェクト配列をそのままキャッシュ
- プロジェクト名の参照箇所を `.map(p => p.name)` に修正
- **リクエストボタン表示制御**: タスクの project が リポジトリ紐づきプロジェクトなら非表示
- **プロジェクト管理モーダル**: リポジトリ入力欄を追加（owner/repo 形式）、PATCH で更新

### 7. ドキュメント: `CLAUDE.md`
- DBスキーマ（projects テーブル）に `repository` カラムを追記
- REST API に PATCH /api/projects/:name を追記
- MCP ツール一覧に todo_project_list を追記

## 変更対象ファイル
- `supabase-schema.sql`
- `api/projects/index.js`
- `api/projects/[name].js`
- `todo-store.js`
- `mcp-todo-server.js`
- `public/app.js`
- `CLAUDE.md`

## 検証方法
1. Supabase SQL Editor でマイグレーション実行
2. GUI: プロジェクト管理モーダルでリポジトリ設定 → 保存確認
3. GUI: リポジトリ紐づきプロジェクトのClaude担当タスクでリクエストボタンが非表示を確認
4. GUI: リポジトリなしプロジェクトのタスクではリクエストボタンが従来通り表示を確認
5. MCP: `todo_project_list` でリポジトリ情報が返ることを確認
6. MCP: `todo_list` に `project` フィルターが効くことを確認
