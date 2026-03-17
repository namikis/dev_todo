# TODO App (GUI + MCP)

同じTODOデータ（`data/todos.json`）を、次の2通りで操作できます。

- **GUI**: ブラウザで操作するローカルWebアプリ
- **MCP**: Cursorなどからツール呼び出しで操作するstdioサーバ

## 必要要件

- Node.js **18以上**（推奨: 20）

このリポジトリには `.nvmrc` があるので、nvm環境なら次で揃えられます。

```bash
cd "/Users/tairyu/Desktop/program/dev_todo"
nvm use
node -v
```

## GUIとして使う（ブラウザ）

依存関係を入れて起動します（デフォルトでGUIが起動します）。

```bash
npm install
npm start
```

起動後、ブラウザで次を開きます。

- `http://127.0.0.1:5177`

TODOは `data/todos.json` に保存されます。

## MCPとして使う（Cursor等）

MCPサーバ（stdio）を起動するコマンドは次です。

```bash
npm run mcp
```

### 提供ツール

- `todo_add` `{ title }`
- `todo_list` `{ status?: "all" | "open" | "done", limit?: number }`
- `todo_get` `{ id }`
- `todo_complete` `{ id, completed?: boolean }`
- `todo_delete` `{ id }`
- `todo_clear_completed` `{ confirm?: boolean }`

## Cursor（MCP）設定例

CursorのMCP設定に、stdioサーバとして登録します（例）。

```json
{
  "mcpServers": {
    "mcp-todo": {
      "command": "zsh",
      "args": ["-lc", "set -e; export NVM_DIR=\"$HOME/.nvm\"; source /opt/homebrew/opt/nvm/nvm.sh >/dev/null 2>&1; nvm use 20 >/dev/null 2>&1; cd \"/Users/tairyu/Desktop/program/dev_todo\"; exec node ./mcp-todo-server.js"]
    }
  }
}
```

その後、Cursorからツール一覧に `todo_*` が見えればOKです。

