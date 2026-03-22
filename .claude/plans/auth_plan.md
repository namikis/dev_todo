**project: `auth`**

# Supabase Auth ログイン実装計画

## 概要

Vercel 上の TODO アプリに Supabase Auth を使ったログイン機能を追加し、未ログインユーザーは閲覧のみに制限する。

## 方針

- ログイン/ログアウトは Supabase Auth SDK（フロントエンド）で処理
- API の書き込み操作（POST/PATCH/DELETE）で JWT を検証し、未認証なら 401 を返す
- GET（閲覧）は認証不要
- 未ログイン時はフロントエンドで操作UIを非表示にする

## 実装タスク

### 1. サーバー側

- [ ] `api/_lib/auth.js` — 認証ヘルパー（JWT検証）
- [ ] `api/auth/config.js` — Supabase 公開設定エンドポイント
- [ ] 各 API ルート（Vercel）に認証チェック追加（POST/PATCH/DELETE）
- [ ] `gui-server.js` に認証チェック追加

### 2. フロントエンド

- [ ] `public/index.html` — Supabase JS SDK CDN 追加、ログインUI
- [ ] `public/app.js` — 認証状態管理、トークン送信、未ログイン時の操作制限

### 3. アカウント作成

- [ ] Tairyu のアカウントを Supabase Auth で作成（signUp API）

### 4. テスト・確認

- [ ] ローカルで動作確認
- [ ] Vercel にデプロイ & 動作確認
