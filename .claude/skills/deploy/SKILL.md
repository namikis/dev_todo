---
name: deploy
description: ノンデグ確認・コミット・プッシュ・Vercelデプロイ検証までを実行するスキル。コミットまでは対話的に実施し、プッシュ後の検証はdeploy-verifierエージェントにバックグラウンド委譲する。「デプロイして」「本番に上げて」「リリースして」「deploy」「Vercelに反映して」などの指示で使用。DO NOT TRIGGER when: ローカルテストのみの場合、コミットだけの場合、Vercelの状態確認だけの場合（verify-vercelを使用）。
user-invocable: true
---

# デプロイ

ノンデグ確認 → コミット＆プッシュ（対話） → デプロイ検証（バックグラウンド）の流れで実行する。

## 前提

- Node.js 20 を使用。各コマンド実行前に `source ~/.nvm/nvm.sh && nvm use 20` を実行する
- Vercel CLI インストール済み・`vercel link` 済み

## ワークフロー

### Step 1: ノンデグ確認

ローカルサーバーを起動し、主要APIの疎通を確認する。ローカルで壊れているものをデプロイしないため。

```bash
source ~/.nvm/nvm.sh && nvm use 20
node gui-server.js &
sleep 2
curl -s -w "%{http_code}" -o /dev/null http://127.0.0.1:5177/api/todos
curl -s -w "%{http_code}" -o /dev/null http://127.0.0.1:5177/
kill $(lsof -ti:5177) 2>/dev/null
```

Playwright テストが存在する場合は実行する：

```bash
npx playwright test 2>&1 | tail -20
```

- **全パス**: Step 2 へ
- **失敗あり**: ユーザーに報告し、デプロイを中断する

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
   - **コミットメッセージと対象ファイルをユーザーに提示し、確認を取ってからコミットする**。意図しないコミットを防ぐため
   - 機密ファイル（.env等）が含まれていないか確認する
   - `git add` で対象ファイルをステージングする。`git add .` は使わない（機密ファイル混入防止）
   - コミット後、`git push origin HEAD` でプッシュする

### Step 3: デプロイ検証（バックグラウンド）

プッシュ完了後、**`deploy-verifier` エージェントをバックグラウンドで起動する**。デプロイ待ちで会話をブロックしないため。

```
Agent(subagent_type="deploy-verifier", prompt="プッシュ完了。Vercelデプロイの検証を実行してください。", run_in_background=true)
```

ユーザーには「デプロイ検証をバックグラウンドで実行中です。完了したら結果を報告します。」と伝え、他の作業に進む。

エージェントから結果が返ったら、結果テーブルをユーザーに報告する。

## 完了条件

deploy-verifierエージェントの結果テーブルをユーザーに報告した時点で完了。いずれかのステップで失敗した場合は、原因と修正案を提示する。
