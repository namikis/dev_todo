# レスポンス改善 設計メモ

## 現状の問題点

| # | 問題 | 詳細 |
|---|------|------|
| 1 | **全アクションでフルリフレッシュ** | チェックボックス・タイトル編集・サブタスク操作など、あらゆる書き込みで `await refresh()` を呼び、API 2本（todos + projects）を叩いてから DOM 全体を再構築している |
| 2 | **楽観的更新なし** | API レスポンスを待ってから画面が変わるため、ネットワーク遅延がそのまま体感速度に直結 |
| 3 | **タイトルクリック 220ms 遅延** | シングル/ダブルクリック判定のために毎回 220ms 待ってから詳細パネルを開閉している |
| 4 | **DOM 全破棄＆全再構築** | `innerHTML = ""` で全消しして毎回全要素を作り直している（問題 1・2 を解消すれば体感上は問題にならなくなるため、今回は対応しない） |

## 実装方針

### 変更1: キャッシュ操作ヘルパー関数の追加（変更2の土台）

```js
updateCachedTodo(id, patch)       // todo を部分更新して rerender
removeCachedTodo(id)              // todo を削除して rerender
addCachedTodo(todo)               // todo を先頭に追加して rerender
updateCachedSubtask(todoId, subtaskId, patch)
removeCachedSubtask(todoId, subtaskId)
addCachedSubtask(todoId, subtask)
```

### 変更2: 全書き込み操作を「楽観的更新 + バックグラウンド API」に変更（問題 1・2 対応）

`await refresh()` の代わりに以下のパターンで統一する:

```
1. キャッシュを即座に書き換えて rerender（ユーザーに即時フィードバック）
2. API をバックグラウンドで送信
3. 失敗時だけキャッシュを revert してエラー表示 or full refresh
```

対象操作:

| 操作 | 楽観的更新内容 | 失敗時 |
|------|--------------|--------|
| todo チェックボックス | `completed` 更新 | revert |
| todo タイトルインライン編集 | `title` 更新 | revert |
| 実施日・担当・タイプ変更 | 各フィールド更新 | revert |
| PJ 変更（debounce） | `project` 更新 | revert |
| サブタスク チェックボックス | `completed` 更新 | revert |
| サブタスク タイトル編集 | `title` 更新 | revert |
| サブタスク 削除 | リストから除去 | full refresh |
| サブタスク 追加 | API レスポンスの subtask をキャッシュに追加 | エラー表示 |
| todo 追加 | API レスポンスの todo をキャッシュ先頭に追加 | full refresh |
| todo 削除 | リストから即除去 | full refresh |
| リクエストボタン | `status: "requested"` | エラー表示 |
| リセットボタン | `status: "open"` | full refresh |

### 変更3: タイトルクリック遅延 220ms → 150ms（問題 3 対応）

## 期待効果

- ほぼ全ての操作でネットワーク往復待ちがゼロになる
- 失敗時のみ revert されるため、操作感は Google Tasks に近づく
- DOM 再構築（数 ms）は引き続き発生するが、待ち時間が消えるため体感上は問題にならない
