---
name: update-claude-docs
description: Claude Code の最新リリースを取得し、差分レポートを生成してドキュメントに反映する。「claude更新」「リリース確認」「changelog確認」「差分反映」などの指示で使用。
argument-hint: "[--force] バージョン変化なくても強制再生成する場合は --force を付ける"
allowed-tools: Bash, Read, Write
---

# Claude Code ドキュメント差分反映スキル

このスキルは Claude Code の最新リリース情報を取得し、差分をレポートして `docs/` 配下のドキュメントを最新状態に保つ。

## 実行手順

### Step 1: 現在のバージョンを確認

まず `docs/.claude-code-version` を読んで前回確認バージョンを把握する。

### Step 2: 差分取得スクリプトを実行

```bash
cd /Users/tairyu/Desktop/program/dev_todo
node scripts/fetch-claude-changelog.js $ARGUMENTS
```

- 新バージョンがあれば `docs/claude-code-diff.md` が生成される
- `docs/claude-code-features.md` が最新バージョンで更新される
- `docs/claude-code-changelog.md` が全CHANGELOGで上書きされる

### Step 2b: 公式ドキュメントも更新

```bash
cd /Users/tairyu/Desktop/program/dev_todo
node scripts/fetch-claude-docs.js
```

- `docs/claude-code-official-docs.md` が更新される
- ページ内容に変化があれば `docs/claude-code-official-diff.md` が生成される

### Step 3: 差分があった場合の追加処理

`docs/claude-code-diff.md` が生成されていた場合（新バージョンあり）：

1. `docs/claude-code-diff.md` を読んで新機能・変更点を把握する
2. `docs/claude-code-current-features.md` を読んで現在の機能カタログを確認する
3. 差分内容を分析し、現行の機能カタログ（`docs/claude-code-current-features.md`）を更新する：
   - 新機能（`Added`）→ 対応カテゴリに追記
   - 削除・廃止機能 → カタログから削除
   - 改善（`Improved`）→ 既存説明を更新
   - ヘッダーのバージョン番号と日付を更新

### Step 4: 結果をユーザーに報告

以下の形式でまとめて報告する：

```
## Claude Code アップデート結果

- 前回バージョン: vX.X.X
- 最新バージョン: vX.X.X
- 新バージョン数: N件

### 主な変更点
- （新機能・修正・改善を箇条書き）

### 更新したファイル
- docs/claude-code-diff.md（新着差分）
- docs/claude-code-features.md（直近5バージョン概要）
- docs/claude-code-current-features.md（機能カタログ）← 新バージョンがあった場合のみ
- docs/claude-code-official-docs.md（公式ドキュメント）
- docs/claude-code-official-diff.md（公式ドキュメント変更分）← 変化があった場合のみ
```

差分がなかった場合は「最新バージョン vX.X.X、変更なし」と報告する。
