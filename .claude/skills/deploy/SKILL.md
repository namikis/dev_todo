---
name: deploy
description: ノンデグ確認・コミット・プッシュ・Vercelデプロイ・デプロイ検証までを一括実行するスキル。「デプロイして」「本番に上げて」「リリースして」「deploy」「Vercelに反映して」などの指示で使用。DO NOT TRIGGER when: ローカルテストのみの場合、コミットだけの場合、Vercelの状態確認だけの場合（verify-vercelを使用）。
user-invocable: true
---

# デプロイ

ノンデグ確認 → コミット＆プッシュ → Vercelデプロイ → デプロイ検証 の一連のフローを実行する。

## 前提

- Node.js 20 を使用。各コマンド実行前に `source ~/.nvm/nvm.sh && nvm use 20` を実行する
- Vercel CLI インストール済み・`vercel link` 済み
- GitHub CLI (`gh`) インストール済み・認証済み

## ワークフロー

### Step 1: ノンデグ確認

ローカルサーバーを起動し、主要APIの疎通を確認する。

```bash
source ~/.nvm/nvm.sh && nvm use 20
node gui-server.js &
sleep 2
# GETが200を返すこと
curl -s -w "%{http_code}" -o /dev/null http://127.0.0.1:5177/api/todos
# フロントエンドが200を返すこと
curl -s -w "%{http_code}" -o /dev/null http://127.0.0.1:5177/
kill $(lsof -ti:5177) 2>/dev/null
```

Playwright テストが存在する場合は実行する：

```bash
npx playwright test 2>&1 | tail -20
```

- **全パス**: Step 2 へ
- **失敗あり**: ユーザーに報告し、修正を優先する。デプロイは中断

### Step 2: コミット＆プッシュ

`git status` と `git diff` で変更内容を確認し、コミットメッセージを作成する。

```bash
git status
git diff --staged
git diff
git log --oneline -5
```

1. 変更がなければ「コミット対象なし」と報告し、Step 3 へスキップ
2. 変更がある場合：
   - 変更内容を分析し、簡潔なコミットメッセージを作成する
   - **コミットメッセージと対象ファイルをユーザーに提示し、確認を取ってからコミットする**
   - 機密ファイル（.env等）が含まれていないか確認する
   - `git add` で対象ファイルをステージング（`git add .` は使わない）
   - コミット後、`git push origin HEAD` でプッシュする

### Step 3: Vercelデプロイ確認

プッシュ後、Vercelが自動デプロイを開始する。ステータスを確認する。

```bash
source ~/.nvm/nvm.sh && nvm use 20 && vercel ls 2>&1 | head -10
```

- **Building**: 20秒待って再確認（最大3回）
- **Ready**: Step 4 へ
- **Error**: `vercel inspect <url> --logs` でログを取得し、原因を報告して中断

### Step 4: デプロイ検証

デプロイURLに対してAPI疎通とフロントエンド配信を確認する。

```bash
# API疎通
curl -s -w "\nHTTP: %{http_code}" '<deployment-url>/api/todos?limit=1' | tail -3
# フロントエンド
curl -s -w "\nHTTP: %{http_code}" '<deployment-url>/' | head -5
```

### Step 5: 結果報告

以下の形式で報告する：

```
| チェック項目 | 結果 | 備考 |
|------------|------|------|
| ノンデグ（API） | OK / NG | ステータスコード |
| ノンデグ（テスト） | OK / NG / SKIP | テスト結果 |
| コミット＆プッシュ | OK / SKIP | コミットハッシュ |
| デプロイステータス | OK / NG | Ready / Error |
| 本番API疎通 | OK / NG | ステータスコード |
| 本番フロントエンド | OK / NG | ステータスコード |
```

## 完了条件

全チェック項目の結果をテーブル形式で報告した時点で完了。いずれかのステップで失敗した場合は、原因と修正案を提示して中断する。
