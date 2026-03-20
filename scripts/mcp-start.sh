#!/bin/bash
# MCP サーバー起動スクリプト（.env を読み込んでから起動）
set -a
source /Users/tairyu/Desktop/program/dev_todo/.env
set +a
exec /Users/tairyu/.nvm/versions/node/v20.20.1/bin/node /Users/tairyu/Desktop/program/dev_todo/mcp-todo-server.js
