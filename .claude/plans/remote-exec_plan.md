# DEV TODO リモート実行 & Vercel デプロイ計画

**project: `remote-exec`**

## 概要

TODO アプリを Vercel にデプロイし、タスクに Claude をアサインして「リクエスト」ボタンを押すと、ローカル PC 上の Claude Code が自動で作業を実行する仕組みを構築する。

## アーキテクチャ

```
┌──────────────────────────────────┐
│  Vercel (TODO App)               │
│  - Next.js or 静的 + API Routes  │
│  - Supabase にタスク書き込み      │
│  - 閲覧: 誰でも / 操作: Tairyu のみ │
└──────────┬───────────────────────┘
           │
     ┌─────▼──────┐
     │  Supabase   │  DB (Postgres) + Realtime (WebSocket)
     └─────┬──────┘
           │  Realtime Subscribe（ローカル → Supabase 方向の常時接続）
           │
┌──────────▼──────────────────────┐
│  ローカル PC (Agent Runner)     │
│  - Supabase Realtime を購読     │
│  - status: "requested" を即時検知│
│  - claude -p で実行             │
│  - 結果を Supabase に書き戻し   │
└─────────────────────────────────┘
```

## フェーズ

### Phase 1: Supabase 移行

- [ ] Supabase プロジェクト作成（ブラウザで手動）
- [ ] todos テーブル設計（既存フィールド + status, result, requestedAt）
- [ ] todo-store.js を Supabase クライアントに置き換え
- [ ] gui-server.js の API はそのまま、ストア層だけ差し替え
- [ ] ローカルで動作確認

### Phase 2: Agent Runner（ローカル常駐プロセス）

- [ ] agent-runner.js 作成
  - Supabase Realtime で `status = "requested"` の変更を購読
  - タスク情報からプロンプトを組み立て
  - `claude -p` を child_process で実行
  - 実行結果を Supabase に書き戻し（status: "done", result: stdout）
- [ ] 実行中ステータス管理（requested → running → done / error）
- [ ] エラーハンドリング（タイムアウト、Claude 異常終了）
- [ ] ローカルで動作確認

### Phase 3: GUI 対応

- [ ] タスクタイプ（調査/実装）の選択 UI 追加
- [ ] Request ボタン追加（Claude アサイン済みタスクに表示）
- [ ] ステータス表示（requested: スピナー、running: 実行中、done: 結果表示）
- [ ] 結果リンク表示（調査 → レポートページリンク、実装 → PR リンク）
- [ ] レポートページ（`/reports/:taskId`）— 調査結果を Markdown 表示
- [ ] 実行ログ・エラー表示

### Phase 4: Vercel デプロイ

- [ ] プロジェクトを Vercel 用に構成（API Routes or Edge Functions）
- [ ] 認証追加（Tairyu のみ操作可能、それ以外は閲覧のみ）
  - Vercel Authentication or Supabase Auth
- [ ] 環境変数設定（Supabase URL, Key）
- [ ] デプロイ & 動作確認

### Phase 5: 安定化・運用

- [ ] Agent Runner のデーモン化（launchd or pm2）
- [ ] Claude に渡すプロンプトのテンプレート管理
- [ ] 同時実行制御（1タスクずつ or 並列上限）
- [ ] 通知（完了時にブラウザ通知 etc.）

## タスクタイプ（タグ）

タスクには `type` タグを設定し、Claude の実行フローをタイプごとに分岐させる。

### 調査（research）

- Claude がタスク内容に基づいて調査を実施
- 調査結果は **TODO アプリの別ページ（レポートページ）にアップロード**
  - `/reports/:taskId` のような URL で閲覧可能
  - Supabase に `reports` テーブルを用意し、Markdown 形式で保存
- タスク完了時、結果ページへのリンクをタスクに紐付け

### 実装（implement）

- Claude が **ブランチを切ってコード変更を行い、PR を作成**するところまで自動実行
- フロー: `git checkout -b` → コード変更 → `git commit` → `git push` → `gh pr create`
- タスク完了時、PR URL をタスクに紐付け

### プロンプト構成

- **タスクの `title`** → 何をするかの概要
- **タスクの `memo`** → 詳細な指示・条件・制約など（Claude はここを読んで具体的な作業内容を判断する）

### Agent Runner の分岐イメージ

```js
if (task.type === "research") {
  // claude -p "以下を調査して結果をまとめて:\n# {title}\n{memo}"
  // → 結果を reports テーブルに INSERT
  // → タスクに report_url を設定
} else if (task.type === "implement") {
  // claude -p "以下を実装して。ブランチを切ってPRを作成すること:\n# {title}\n{memo}"
  // → 結果から PR URL を抽出
  // → タスクに pr_url を設定
}
```

## データモデル（Supabase todos テーブル）

| カラム        | 型                    | 説明                           |
| ------------- | --------------------- | ------------------------------ |
| id            | uuid (PK)             | タスク ID                      |
| title         | text                  | タスク名                       |
| completed     | boolean               | 完了フラグ                     |
| created_at    | timestamptz           | 作成日時                       |
| completed_at  | timestamptz?          | 完了日時                       |
| due_date      | date?                 | 実施日                         |
| memo          | text?                 | メモ                           |
| assignee      | text? (Claude/Tairyu) | 担当者                         |
| type          | text? (research/implement) | タスクタイプ                |
| subtasks      | jsonb                 | サブタスク配列                 |
| status        | text                  | open/requested/running/done/error |
| result        | text?                 | Claude 実行結果                |
| report_url    | text?                 | 調査結果ページURL              |
| project       | text?                 | プロジェクト名                 |
| pr_url        | text?                 | 作成された PR の URL           |
| requested_at  | timestamptz?          | リクエスト日時                 |

## 技術選定

| 項目              | 選定             | 理由                                    |
| ----------------- | ---------------- | --------------------------------------- |
| DB / Realtime     | Supabase         | Postgres + WebSocket Realtime、Vercel 連携 |
| ホスティング      | Vercel           | ユーザー指定                            |
| Claude 実行       | claude CLI (-p)  | ローカル環境をそのまま活用              |
| 認証              | Supabase Auth    | 簡易かつ Supabase と統合済み            |
| Agent Runner      | Node.js スクリプト | 既存技術スタックと統一                  |

## Supabase 追加テーブル

### reports テーブル（調査結果）

| カラム      | 型              | 説明                   |
| ----------- | --------------- | ---------------------- |
| id          | uuid (PK)       | レポート ID            |
| todo_id     | uuid (FK→todos) | 紐付くタスク           |
| content     | text            | Markdown 形式の調査結果 |
| created_at  | timestamptz     | 作成日時               |
