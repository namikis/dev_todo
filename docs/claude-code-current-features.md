# Claude Code — 現行機能カタログ (v2.1.80)

> 最終更新: 2026-03-20 / バージョン: `2.1.80`
>
> このドキュメントは `docs/claude-code-changelog.md` を解析して生成されました。
> 更新: `npm run claude:update` → サーバー再起動

---

## 1. 基本動作モード

**インタラクティブモード**
ターミナルで双方向の対話式セッションを実行。デフォルトモード。

**プリントモード（`-p` / `--print`）**
ワンショットモードで標準入力を処理し、JSON または構造化出力で結果を返す。パイプ入力対応。

**シンプルモード（`CLAUDE_CODE_SIMPLE` 環境変数）**
MCP ツール、スキル、セッションメモリ、カスタムエージェント、CLAUDE.md を除外した最小限の実行。

**ヘッドレスモード（SDK）**
プログラマティック API として実行。コールバックベースのカスタムツール対応。

**リモートコントロール（`/remote-control`）**
`claude.ai/code` から継続して作業可能なブリッジセッション。モバイルやブラウザから再開可能。

---

## 2. 認証・接続

**OAuth 認証**
claude.ai アカウントとの同期対応。管理されたゲートウェイ経由でのトークン更新。

**API キー認証**
Anthropic Console（`--console` フラグ）経由の API 請求アカウント認証。

**Bedrock / Vertex / Microsoft Foundry サポート**
AWS、Google Cloud、Azure などのクラウドプロバイダー認証対応。
- Bedrock: IAM ロール、AWS ログイン、`AWS_BEARER_TOKEN_BEDROCK`
- Vertex: 標準認証、EU/APAC クロスリージョン推論対応
- Foundry: Azure AI Foundry 統合

**MCP OAuth 認証**
MCP サーバーの OAuth 認証をサポート。Dynamic Client Registration または事前設定クレデンシャル対応。Slack など非標準サーバー対応。

**認証キャッシュ・プロアクティブリフレッシュ**
OAuth トークンは有効期限切れ前にプロアクティブにリフレッシュ。回線断時は自動再接続。

**カスタム認証ヘルパー**
`apiKeyHelper` / `awsAuthRefresh` / `awsCredentialExport` 設定で動的クレデンシャル生成。

**企業 SSL 証明書対応**
`NODE_EXTRA_CA_CERTS` / `CLAUDE_CODE_CUSTOM_CA_CERTS` で mTLS・企業プロキシに対応。

---

## 3. エージェント・タスク実行

**カスタムエージェント（Agent）**
`.claude/agents/*.md` に定義したエージェント。`/agents` で一覧表示・招待。

**サブエージェント（Task ツール）**
メインスレッドから並行実行される背景エージェント。`isolation: worktree` でイソレーション。

**Agent Teams（実験的機能・マルチエージェント）**
複数エージェント協調作業。`Shift+↓` でナビゲート。リーダー/メンバー分離。

**ワーカーツリー（`--worktree` / `-w`）**
イソレートされた git ワーカーツリーで実行。`worktree.sparsePaths` で疎チェックアウト対応。

**エージェント設定フロントマター**
`model:`, `tools:`, `skills:`, `background: true`, `isolation: worktree`, `memory`, `permissionMode` フィールド。

**背景タスク（Ctrl+B）**
bash / エージェントを背景実行。メインスレッドは別の作業継続。`CLAUDE_CODE_DISABLE_BACKGROUND_TASKS` で無効化可。

**背景タスク出力（TaskOutput / TaskStop）**
背景タスク完了時に通知・結果表示。transcript / stdout ファイル参照。

---

## 4. MCP (Model Context Protocol)

**MCP サーバー接続**
stdio / HTTP / SSE / streamable HTTP トランスポート対応。

**MCP サーバー管理**
- `/mcp` コマンドで有効化・無効化・再接続・OAuth 認証
- `--mcp-config` で複数設定ファイル指定（`.mcp.json` / `--mcp-config file1.json file2.json`）
- プロジェクト・ユーザー・ローカルスコープ

**プラグイン付属 MCP**
プラグインから MCP サーバー配布。`settings.json` でデフォルト設定配布可。

**claude.ai MCP コネクタ**
claude.ai のカスタム MCP サーバーを Claude Code から利用。`ENABLE_CLAUDEAI_MCP_SERVERS=false` で無効化。

**MCP OAuth・認証**
- Dynamic Client Registration
- 事前設定クレデンシャル（Slack など非標準サーバー）
- カスタムメタデータ探索 URL（`oauth.authServerMetadataUrl`）
- OAuth トークンプロアクティブリフレッシュ

**MCP ツールサーチ（Tool Search）**
ツール説明が 10% 以上コンテキスト占有時、MCPSearch ツールで遅延ロード。自動有効化（`--tools disallowedTools` で無効化可）。

**MCP リソース**
リソース結果、リソースリンク、バイナリコンテンツ対応（PDF/Office/オーディオを自動保存）。

**MCP 動的更新（`list_changed` 通知）**
MCP サーバーが `list_changed` 通知でツール・プロンプト・リソースを動的更新。再接続不要。

**MCP デバッグ**
`--mcp-debug` フラグで詳細ログ。`/doctor` でサーバー状態診断。

---

## 5. プラグイン・スキル・スラッシュコマンド

### プラグインシステム

**プラグイン管理**
- `/plugin install` / `/plugin enable` / `/plugin disable` / `/plugin uninstall`
- `/plugin marketplace add/remove/update` でマーケットプレイスを管理
- プロジェクト・ユーザースコープの選択

**プラグインソース**
- Git リポジトリ（`owner/repo` / `#branch` / `@SHA` 対応）
- npm（バージョン固定対応）
- ファイルベース（相対パス）
- `git-subdir` で git リポジトリ内のサブディレクトリ指定
- `source: 'settings'` でインライン定義

**プラグイン配布物**
カスタムスラッシュコマンド、カスタムエージェント、MCP サーバー、フック、出力スタイル、`settings.json` デフォルト設定

**プラグイン検証**
`claude plugin validate` で SKILL.md / 設定 / hooks.json を検証。

### スキル・スラッシュコマンド

**スキル定義（`.claude/skills/*.md`）**
YAML フロントマターでメタデータ。ホットリロード対応。

**スキルフロントマター**
`name`, `description`, `argument-hint`, `allowed-tools`, `disallowed-tools`, `effort`, `model`, `agent`, `memory`, `user-invocable`, `context: fork`, `once: true`

**主なビルトインスラッシュコマンド**

| コマンド | 説明 |
|---------|------|
| `/model` / `/effort` | モデル・努力度変更 |
| `/config` | 設定メニュー |
| `/memory` | メモリ管理 |
| `/permissions` | パーミッション管理 |
| `/mcp` | MCP サーバー管理 |
| `/resume` | セッション再開 |
| `/fork` / `/branch` | セッション分岐 |
| `/compact` | セッション圧縮 |
| `/plan` | プランモード |
| `/sandbox` | サンドボックス管理 |
| `/voice` | ボイスモード |
| `/plugins` / `/skills` | プラグイン・スキル一覧 |
| `/remote-control` | リモートコントロール |
| `/doctor` | 診断 |
| `/usage` / `/cost` / `/stats` | 使用量・コスト |

---

## 6. パーミッション・セキュリティ

**パーミッションモード**
`acceptEdits` / `plan` / `ask` / `bypassPermissions`（危険）

**権限規則（Permission Rules）**
- `allow` / `deny` / `ask` ポリシー
- Bash, Read, Write, Edit, Glob, Grep, WebFetch, MCP ツール対応
- ワイルドカード `*` パターン（`Bash(npm *)`, `Bash(git * main)` など）

**Sandbox モード（Linux/macOS）**
- `/sandbox` で有効化
- `sandbox.enabled`, `sandbox.filesystem.allowWrite/allowRead/denyRead` 設定
- `sandbox.enableWeakerNetworkIsolation` で TLS 検証カスタマイズ

**企業管理ポリシー**
- `remote-settings.json` からの管理設定
- `permissions.defaultMode` / `permissions.denyPermissions` / `permissions.allowPermissions`
- `disallowedTools` ポリシー

**PermissionRequest フック**
カスタムロジックで自動許可・拒否。

---

## 7. セッション管理

**セッション保存・再開**
- `/resume` で過去セッション再開（50 件デフォルト）
- `--resume <session-id>` / `--continue <session-id>`
- セッション ID・タイトル検索・フィルタリング
- git ブランチ表示・フィルタリング
- `--from-pr` で PR リンク再開

**セッション名・タグ**
`/rename` で自動生成・カスタムタイトル設定。`/tag` でタグ追加。

**セッション分岐**
`/fork` / `/branch` でセッション複製。`--fork-session` / `--session-id` でカスタム ID 設定。

**セッションメモリ・オートメモリ**
- `/memory` で管理
- `autoMemoryDirectory` でカスタムディレクトリ
- user / project / local スコープ

**セッション統計**
`/stats` で使用統計（7 日 / 30 日 / 全期間）。日数グラフ・連続記録・好み分析。

**セッションコンパクション**
- `/compact` で手動圧縮（自動: 80% 閾値）
- `PreCompact` / `PostCompact` フック

---

## 8. UI・インターフェース

**テーマ・カラーカスタマイズ**
`/theme` で構文ハイライト・カラーテーマ（Ctrl+T で切り替え）。`/color` でセッション色設定。

**Vim モード**
`/config` で有効化。基本操作（hjkl, yy, dd, p）、モーション（f/F/t/T）、テキストオブジェクト（iw, aw, i"/a" など）対応。

**キーバインド・カスタマイズ**
`/keybindings` で設定。コンテキストごと・コード順序対応。`voice:pushToTalk` でボイス起動キー設定。

**AskUserQuestion**
単一選択・複数選択・テキスト入力・複数行（Shift+Enter）・外部エディタ（Ctrl+G）・MCP Elicitation（フォーム・ブラウザ URL）。

**画像・アタッチメント**
- `[Image #N]` クリッカブルリンク
- イメージプレビュー表示
- ドラッグ＆ドロップ（IDE）、Cmd+V (iTerm2)、Alt+V (Windows)

**VSCode 統合**
- ネイティブ拡張機能
- セッションエディタ表示・計画プレビュー（編集可・コメント対応・リアルタイム更新）

---

## 9. ステータス・モニタリング

**レート制限情報**
`rate_limits` フィールド（5 時間・7 日ウィンドウ）。`used_percentage`, `resets_at` 表示。

**使用量・コスト表示**
- `/usage` でプラン使用率・グラフ表示
- `/cost` でコスト表示
- `/stats` で長期統計
- `--max-budget-usd` で予算制限（SDK）

**ステータスライン**
`/statusline` でカスタマイズ。Git branch、背景タスク数、MCP サーバー、rate_limits、session cost info、カスタムスクリプト対応。

**診断**
`/doctor` で状態診断。許可ルール到達不可警告、plugin validate、MCP サーバー状態確認。

**OpenTelemetry**
`OTEL_*` 環境変数でデータ送信（無効化・ファイル出力可）。

---

## 10. ボイスモード

**ボイス入力・出力**
`/voice` で有効化。音声を自動テキスト化（STT）。20 言語対応（英語、日本語、中国語、スペイン語など）。言語自動検出・`language` 設定で指定。

**プッシュトゥートーク**
空白キー（デフォルト）または `voice:pushToTalk` でカスタマイズ。修飾子コンボ（Ctrl+K など）対応。

**互換性**
- macOS: native binary（マイク権限内蔵）
- Windows 11: WSL2 + WSLg サポート
- Linux: 非対応

---

## 11. リモート・エンタープライズ

**リモートコントロール**
- `/remote-control [name]` / `claude remote-control [name]`
- claude.ai/code でセッション接続・継続
- モバイル・ブラウザから再開可

**Bridge Sessions**
ローカルスレッド ↔ claude.ai web。`--sdk-url` で URL 指定（SDK）。

**企業管理設定（Managed Settings）**
- macOS plist / Windows Registry
- `remote-settings.json` キャッシュ
- `enabledPlugins`, `permissions.defaultMode`, policy env vars
- `pluginTrustMessage` でカスタムメッセージ

**エンタープライズセキュリティ**
- `disableAllHooks` で全フック無効化
- `permissions.disableBypassPermissionsMode`
- MCP allowlist / denylist
- `strictKnownMarketplaces`

---

## 12. フック (Hooks)

**フックイベント**

| イベント | タイミング |
|---------|-----------|
| `SessionStart` / `SessionEnd` | セッション開始・終了 |
| `Stop` / `SubagentStop` | エージェント停止 |
| `StopFailure` | API エラー終了 |
| `PreToolUse` / `PostToolUse` | ツール実行前後 |
| `PermissionRequest` | パーミッション確認時 |
| `Notification` | 通知表示時 |
| `UserPromptSubmit` | プロンプト送信時 |
| `PreCompact` / `PostCompact` | 圧縮前後 |
| `InstructionsLoaded` | CLAUDE.md 読込時 |
| `ConfigChange` | 設定変更時 |
| `WorktreeCreate` / `WorktreeRemove` | ワーカーツリー管理 |

**フック実行方法**
Shell コマンド（bash / zsh）/ HTTP フック（POST JSON）

**フック制御**
`"allow"` / `"deny"` / `"ask"` 返却。`"continue": false` で停止制御。`updatedInput` 返却で middleware 化。

---

## 13. 設定・カスタマイズ

**設定ファイル**
- `~/.claude/settings.json` / `.claude/settings.json`（推奨）
- `~/.claude/settings.local.json`（プロジェクト限定）
- `--settings` で JSON ファイル指定
- ホットリロード対応

**主要設定フィールド**

| フィールド | 説明 |
|-----------|------|
| `enabledPlugins` | プラグイン有効化 |
| `permissions.defaultMode` | デフォルトパーミッションモード |
| `sandbox.*` | Sandbox 設定 |
| `language` | Claude の応答言語 |
| `autoMemoryDirectory` | メモリディレクトリ |
| `spinnerTipsEnabled` | スピナー tips 無効化 |
| `showTurnDuration` | ターンタイムスタンプ表示 |
| `plansDirectory` | 計画ファイルディレクトリ |

**主要 CLI フラグ**

| フラグ | 説明 |
|-------|------|
| `-p / --print` | Print モード |
| `-w / --worktree` | Git worktree isolation |
| `--resume <id>` | セッション再開 |
| `--agent <name>` | エージェント指定 |
| `--model <model>` | モデル指定 |
| `--effort <low/medium/high>` | 努力度 |
| `--add-dir <path>` | 追加ディレクトリ |
| `--mcp-config <path>` | MCP 設定ファイル |
| `--channels` | MCP message channels（preview） |

**主要環境変数**

| 変数 | 説明 |
|-----|------|
| `ANTHROPIC_API_KEY` | API キー |
| `ANTHROPIC_BASE_URL` | カスタムエンドポイント |
| `ANTHROPIC_DEFAULT_MODEL` | デフォルトモデル |
| `CLAUDE_CODE_SIMPLE` | シンプルモード |
| `CLAUDE_CODE_DISABLE_BACKGROUND_TASKS` | 背景タスク無効化 |
| `CLAUDE_CODE_PLUGIN_SEED_DIR` | プラグインシードディレクトリ |
| `BASH_DEFAULT_TIMEOUT_MS` | Bash タイムアウト |
| `MCP_TIMEOUT` / `MCP_TOOL_TIMEOUT` | MCP タイムアウト |
| `HTTP_PROXY` / `HTTPS_PROXY` / `NO_PROXY` | プロキシ設定 |

---

## 14. パフォーマンス・メモリ

**メモリ最適化**
- 起動時メモリ削減（~400KB+）
- 大規模リポジトリ起動メモリ削減（~80MB @250k ファイル）
- 長セッション GC 最適化
- React Compiler による render 最適化

**トークン効率**
- Prompt cache 最適化
- 大型ツール出力ディスク保存（50K+ 文字）
- 圧縮時に image 保持（prompt cache 再利用）

**API 効率**
- Non-streaming fallback 2 分タイムアウト
- MCP OAuth token proactive refresh
- Esc abort mid-flight non-streaming

**UI レンダリング性能**
- 新しい terminal renderer（smooth）
- message render 削減（~74%）
- CJK wide character 最適化

---

## まとめ

Claude Code v2.1.80 は 14 領域にわたる 200+ の機能を装備したエンタープライズグレードの AI コーディングアシスタント。

| 領域 | 代表機能 |
|-----|---------|
| 動作モード | interactive / print / simple / headless / remote |
| 認証 | OAuth / API key / Bedrock / Vertex / Foundry |
| エージェント | custom agents / subagents / teams / worktree |
| MCP | stdio・HTTP・SSE / tool search / OAuth / dynamic updates |
| プラグイン | marketplace / skills / hot reload |
| 権限 | fine-grained rules / sandbox / enterprise policy |
| セッション | 保存・再開・分岐・コンパクション / auto memory |
| UI | vim mode / voice / custom colors / streaming |
| 監視 | rate limits / usage / diagnostics / OTEL |
| ボイス | STT / 20 言語 / push-to-talk |
| リモート | remote control / managed settings / team features |
| フック | 11+ イベント型 / shell / HTTP / middleware |
| 設定 | settings.json / env vars / CLI flags / hot reload |
| パフォーマンス | memory / token / API / UI 最適化 |
