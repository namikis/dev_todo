# DEV TODO

開発・調査タスクを管理するローカルTODOアプリ。
GUIとMCPの2通りでデータ（`data/todos.json`）を操作できます。

## 機能

- タスクの追加・完了・削除
- **実施日（期限）** の設定・変更（期限超過は赤色表示）
- **サブタスク** の追加・完了・削除
- **メモ** の自由記述（自動保存）
- **MCP連携** によるAIエージェントからのタスク操作

## 必要要件

- Node.js **18以上**（推奨: 20）

`.nvmrc` 同梱のため、nvm環境なら以下で揃います。

```bash
nvm use
```

## セットアップ

```bash
npm install
```

## GUI（ブラウザ）

```bash
npm start
```

http://127.0.0.1:5177 にアクセス。

タスク名クリックで詳細パネルが開き、実施日・メモ・サブタスクを編集できます。

ポート変更は環境変数 `PORT` で指定可能です。

```bash
PORT=3000 npm start
```

## MCP（AIエージェント連携）

stdioベースのMCPサーバとして動作します。

```bash
npm run mcp
```

### 提供ツール

| ツール | 引数 | 説明 |
|--------|------|------|
| `todo_add` | `{ title, dueDate?, memo? }` | タスク追加 |
| `todo_list` | `{ status?, limit? }` | 一覧取得 |
| `todo_get` | `{ id }` | 1件取得（詳細） |
| `todo_update` | `{ id, title?, dueDate?, memo? }` | タスク更新 |
| `todo_complete` | `{ id, completed? }` | 完了/未完了の切り替え |
| `todo_delete` | `{ id }` | タスク削除 |
| `todo_clear_completed` | `{ confirm }` | 完了済みを一括削除 |
| `todo_add_subtask` | `{ todoId, title }` | サブタスク追加 |
| `todo_toggle_subtask` | `{ todoId, subtaskId, completed? }` | サブタスク完了切替 |
| `todo_delete_subtask` | `{ todoId, subtaskId }` | サブタスク削除 |

### MCP設定手順

Claude Code（CLI / VSCode拡張）からタスク操作するための設定手順です。

#### 1. 依存パッケージのインストール

```bash
cd /path/to/dev_todo
npm install
```

#### 2. 設定ファイルの編集

プロジェクトルートに `.mcp.json` を作成します（チーム共有する場合）。
個人環境のみで使う場合は `~/.claude/settings.json` に追記しても構いません。

**`.mcp.json`（推奨）**

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

> **nvm環境の場合**: MCPサーバはClaude Codeのプロセスから直接起動されるため、
> nvm管理のNodeパスが通らないことがあります。その場合はNodeの絶対パスを指定してください。
>
> ```bash
> # 使用するNodeの絶対パスを確認
> nvm which 20
> # 例: /Users/<user>/.nvm/versions/node/v20.x.x/bin/node
> ```
>
> ```json
> {
>   "mcpServers": {
>     "mcp-todo": {
>       "command": "/Users/<user>/.nvm/versions/node/v20.x.x/bin/node",
>       "args": ["./mcp-todo-server.js"]
>     }
>   }
> }
> ```

#### 3. 接続の確認

Claude Code を起動（またはセッションを再開）し、以下のように話しかけて動作を確認します。

```
TODOを一覧表示して
```

`todo_list` ツールが呼ばれ、タスク一覧が返ってくれば設定完了です。

#### トラブルシューティング

| 症状 | 対処 |
|------|------|
| ツールが見つからない | Claude Code を再起動して `.mcp.json` を再読み込み |
| `Cannot find module` エラー | `npm install` を実行済みか確認 |
| Node.js が見つからない | `command` にNodeの絶対パスを指定（上記nvm環境の項を参照） |

## データ

タスクは `data/todos.json` に保存されます。GUIとMCPで同一ファイルを共有します。
