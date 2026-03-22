# 調査レポート: Claude Agent SDK（Claudeをアプリに組み込む新機能）

**調査日:** 2026-03-22

## 概要

Anthropicは2025年後半に「Claude Code SDK」を「**Claude Agent SDK**」にリネームし、汎用的なAIエージェントランタイムとして再定義した。Python/TypeScriptのライブラリとして提供され、Claude Codeと同じツール・エージェントループ・コンテキスト管理をアプリケーションに組み込める。ファイル操作・コマンド実行・Web検索・MCP連携がビルトインで、独自のツールループ実装は不要。

## 詳細

### Claude Agent SDK とは

Claude Code の内部で使われているエージェント機能（ツール実行、サブエージェント、セッション管理等）を**ライブラリとして切り出したもの**。開発者は `query()` 関数を呼ぶだけで、Claudeが自律的にファイルを読み、コマンドを実行し、コードを編集するエージェントを構築できる。（出典: [Agent SDK overview](https://platform.claude.com/docs/en/agent-sdk/overview)）

```python
# Python: たった数行でエージェントが動く
from claude_agent_sdk import query, ClaudeAgentOptions

async for message in query(
    prompt="Find and fix the bug in auth.py",
    options=ClaudeAgentOptions(allowed_tools=["Read", "Edit", "Bash"]),
):
    print(message)
```

```typescript
// TypeScript
import { query } from "@anthropic-ai/claude-agent-sdk";

for await (const message of query({
  prompt: "Find and fix the bug in auth.py",
  options: { allowedTools: ["Read", "Edit", "Bash"] }
})) {
  console.log(message);
}
```

### 主要機能

| 機能 | 説明 |
|------|------|
| **ビルトインツール** | Read, Write, Edit, Bash, Glob, Grep, WebSearch, WebFetch, AskUserQuestion |
| **サブエージェント** | 専門エージェントを生成して並行作業。`Agent` ツールで委譲 |
| **セッション管理** | セッションIDで会話を再開・フォーク可能 |
| **Hooks** | PreToolUse, PostToolUse, Stop 等のライフサイクルにカスタムコードを挿入 |
| **MCP連携** | 外部MCPサーバー（DB、ブラウザ、API等）をそのまま接続 |
| **権限制御** | `allowed_tools` で使用可能なツールを制限 |
| **Skills/CLAUDE.md** | `setting_sources=["project"]` でプロジェクトのスキルやCLAUDE.mdを読み込み |

### Client SDK との違い

| | Client SDK（従来） | Agent SDK（新） |
|--|-------------------|----------------|
| ツール実行 | **自分で実装**（ツールループを書く） | **Claude が自律的に実行** |
| ファイル操作 | 自前で実装 | ビルトイン |
| 用途 | APIを直接叩く | エージェントとして動かす |
| コード量 | 多い | 少ない |

### 名前の変遷

- 2025年6月頃: **Claude Code SDK** として登場（出典: [InfoQ](https://www.infoq.com/news/2025/06/claude-code-sdk/)）
- 2025年9月頃: **Claude Agent SDK** にリネーム。コーディング以外の汎用エージェント用途を反映
- 2026年3月現在: Python v0.1.48, TypeScript v0.2.71

### dev_todo プロジェクトへの適用可能性

現在の `agent-runner.js` は Claude CLI をサブプロセスとして `spawn` しているが、Agent SDK を使えば以下が可能：

1. **CLIの spawn が不要** — `query()` を直接呼ぶだけでエージェントが動く
2. **ストリーミング** — 実行中のメッセージをリアルタイムに取得可能
3. **セッション管理** — タスクごとのコンテキストを保持・再開できる
4. **MCP連携** — 既存のMCPサーバー（mcp-todo等）をそのまま利用可能
5. **Hooks** — タスク完了時にDBを自動更新するフックを差し込める

### その他の関連新機能

- **Claude Code Channels**: TelegramやDiscordに直接Claude Codeを配置（出典: [Geek Metaverse](https://www.geekmetaverse.com/claude-code-channels-anthropics-bold-move-to-bring-ai-coding-to-telegram-and-discord/)）
- **Claude Code Remote Control**: モバイルからローカルのClaude Codeセッションを操作（2026年2月）
- **Xcode統合**: Xcode 26.3にClaude Agent SDKがネイティブ統合（出典: [Anthropic](https://www.anthropic.com/news/apple-xcode-claude-agent-sdk)）
- **Cowork**: プログラミング経験がなくてもClaude Codeの自動化を使えるようにした新機能（2026年1月）

## 情報源一覧

- [Agent SDK overview - Claude API Docs](https://platform.claude.com/docs/en/agent-sdk/overview)
- [GitHub - anthropics/claude-agent-sdk-python](https://github.com/anthropics/claude-agent-sdk-python)
- [npm - @anthropic-ai/claude-agent-sdk](https://www.npmjs.com/package/@anthropic-ai/claude-agent-sdk)
- [Building agents with the Claude Agent SDK](https://claude.com/blog/building-agents-with-the-claude-agent-sdk)
- [Anthropic Releases Claude Code SDK - InfoQ](https://www.infoq.com/news/2025/06/claude-code-sdk/)
- [Apple's Xcode now supports the Claude Agent SDK](https://www.anthropic.com/news/apple-xcode-claude-agent-sdk)
- [Claude Code Channels - Geek Metaverse](https://www.geekmetaverse.com/claude-code-channels-anthropics-bold-move-to-bring-ai-coding-to-telegram-and-discord/)
- [Inside the Claude Agent SDK - Build with AWS](https://buildwithaws.substack.com/p/inside-the-claude-agent-sdk-from)
