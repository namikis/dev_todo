---
name: verify-vercel
description: Vercelデプロイの動作確認・エラー診断を行うスキル。デプロイ状況確認、ビルドログ取得、API疎通テスト、フロントエンド配信確認、エラー原因特定を実施する。「Vercel確認」「デプロイ確認」「Vercel動作確認」「verify vercel」「デプロイ失敗」「Vercelエラー」などの指示で使用。DO NOT TRIGGER when: ローカルサーバーの起動・停止、Vercel以外のホスティング、コードの実装作業の場合。
---

# Vercel デプロイ動作確認

Vercel にデプロイしたアプリの状態確認・エラー診断を行う。

## 前提

- Vercel CLI インストール済み
- `vercel link` でプロジェクトリンク済み
- Node.js 20 を使用するため、各コマンド実行前に `source ~/.nvm/nvm.sh && nvm use 20` を実行する

## ワークフロー

### Step 1: デプロイ状況確認

`vercel ls` で最新デプロイのステータスを確認する。

```bash
source ~/.nvm/nvm.sh && nvm use 20 && vercel ls 2>&1 | head -10
```

- **Ready**: デプロイ成功 → Step 3 へ
- **Error**: デプロイ失敗 → Step 2 へ
- **Building**: ビルド中 → 少し待って再確認

### Step 2: エラー診断（デプロイ失敗時のみ）

最新のエラーデプロイの URL を使い、ビルドログを取得する。

```bash
source ~/.nvm/nvm.sh && nvm use 20 && vercel inspect <deployment-url> --logs 2>&1
```

ログからエラー原因を特定し、修正案を提示する。よくある原因：

| エラー | 原因 | 対処 |
|--------|------|------|
| `Function Runtimes must have a valid version` | vercel.json の runtime 指定が不正 | runtime 指定を削除またはバージョン修正 |
| `Module not found` | import パスの誤り | 相対パスを確認 |
| `Cannot find module 'dotenv'` | 依存が devDependencies にある | dependencies に移動 |
| `SUPABASE_URL is not defined` | 環境変数未設定 | `vercel env add` で設定 |

### Step 3: API 疎通確認

デプロイ URL に対して API エンドポイントをテストする。

```bash
curl -s -w "\nHTTP_STATUS: %{http_code}" '<deployment-url>/api/todos?limit=1' | head -10
```

確認ポイント：
- **200**: 正常
- **401/403**: Deployment Protection が有効 → ダッシュボードで無効化を案内
- **500**: サーバーエラー → `vercel logs <deployment-url>` でランタイムログ確認
- **404**: ルーティング不備 → vercel.json の rewrites を確認

### Step 4: フロントエンド配信確認

```bash
curl -s -w "\nHTTP_STATUS: %{http_code}" '<deployment-url>/' | head -5
```

- HTML が返れば正常
- 404 の場合は `public/` ディレクトリの構成を確認

### Step 5: 結果報告

以下の形式でユーザーに報告する：

```
| チェック項目 | 結果 | 備考 |
|------------|------|------|
| デプロイステータス | OK / NG | Ready / Error |
| API疎通 | OK / NG | ステータスコード |
| フロントエンド | OK / NG | ステータスコード |
```

エラーがあった場合は原因と修正案を併記する。

## 完了条件

全チェック項目の結果をテーブル形式で報告し、エラーがあれば原因と修正案を提示した時点で完了。
