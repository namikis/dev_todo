#!/bin/bash
# gui-server を再起動するスクリプト
# 既存のポート5177プロセスを停止してから新しいサーバーを起動する

# nvm で Node.js 20 を使用
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
nvm use 20 --silent

PORT=5177

echo "ポート $PORT のプロセスを停止中..."
lsof -ti:$PORT | xargs kill -9 2>/dev/null
sleep 1

echo "サーバーを起動中..."
node "$(dirname "$0")/gui-server.js" &
sleep 2

if lsof -ti:$PORT > /dev/null 2>&1; then
  echo "サーバー起動完了: http://127.0.0.1:$PORT"
else
  echo "サーバー起動に失敗しました"
  exit 1
fi
