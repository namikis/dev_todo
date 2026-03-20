# 調査レポート: スマートフォンからClaude Codeをリモート操作する方法

**調査日:** 2026-03-20

## 概要

**実現可能です。** Anthropicは2026年2月に **Remote Control** 機能を正式リリースし、スマートフォン（iOS/Android）からClaude Codeセッションを操作できるようになりました。確認プロンプトへの応答も含め、PCのターミナルで実行中のセッションをスマホから継続できます。Pro/Max/Team/Enterpriseプランが対象で、Claude Code v2.1.51以降が必要です。

---

## 詳細

### 方法1: 公式 Remote Control（推奨）

**仕組み:**
- PCのターミナルで `claude remote-control` を実行するとQRコードとセッションURLが表示される
- スマホのClaude公式アプリ（iOS/Android）でQRコードをスキャン → セッションに接続
- PC側でClaudeはローカル実行のまま、スマホはその「窓口」になる

**確認プロンプトへの対応:**
- セッションはスマホとPCで完全同期されるため、**スマホからも確認応答（`y/n`など）が可能**
- ターミナル・ブラウザ・スマホを併用して使えます

**セットアップ手順:**
```bash
# バージョン確認（v2.1.51以上が必要）
claude --version

# Remote Controlセッション開始
claude remote-control
# → QRコードが表示されるのでスマホでスキャン

# または既存セッションから有効化
/remote-control
```

**主な制限:**
- ターミナルを閉じるとセッション終了（PCは起動し続ける必要あり）
- ネットワーク断が10分以上続くとタイムアウト
- APIキー認証では使えない（claude.aiのOAuth認証が必要）

（出典: [Claude Code Docs - Remote Control](https://code.claude.com/docs/en/remote-control)）

---

### 方法2: SSH + Tailscale（パワーユーザー向け）

- TailscaleでVPN構築 → スマホのSSHクライアント（Blink Shell等）でPCに接続
- ターミナルをフル操作できるが、スマホでの確認プロンプト操作はUIが不便
- セットアップに20〜40分かかる

---

### 方法3: サードパーティアプリ（Happy Coder等）

- QRコードペアリングで接続、プッシュ通知でClaudeが確認待ちになったら通知が来る
- ネットワーク設定不要でシンプル

（出典: [Sealos Blog - Claude Code on Phone](https://sealos.io/blog/claude-code-on-phone/)）

---

## 方法の比較

| 方法 | 確認応答 | セットアップ | 信頼性 |
|------|---------|------------|--------|
| **公式 Remote Control** | ◎ スマホから可能 | 簡単（5分以内） | 公式・安定 |
| SSH + Tailscale | △ ターミナルで手動 | やや複雑 | 高い |
| Happy Coder | ◎ プッシュ通知あり | 簡単 | 非公式 |

---

## 結論

**公式 Remote Control が最も現実的な選択肢です。** 現在リリース済みの機能で、Pro以上のプランがあれば今すぐ使えます。スマホからの確認プロンプト応答も問題なく対応できます。

---

## 情報源一覧

- [Claude Code Docs - Remote Control（公式）](https://code.claude.com/docs/en/remote-control)
- [VentureBeat - Anthropic just released Remote Control](https://venturebeat.com/orchestration/anthropic-just-released-a-mobile-version-of-claude-code-called-remote)
- [Sealos Blog - Claude Code Mobile: iPhone, Android & SSH](https://sealos.io/blog/claude-code-on-phone/)
- [Medium - Claude Code Remote Control: Code From Your Phone](https://medium.com/@richardhightower/claude-code-remote-control-code-from-your-phone-3c7059c3b5de)
- [GitHub - JessyTsui/Claude-Code-Remote（サードパーティ）](https://github.com/JessyTsui/Claude-Code-Remote)
