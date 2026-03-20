#!/bin/sh
echo "▶ Running tests before push..."

# nvm が使える環境では Node 20 を使用
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"
nvm use 20 --silent 2>/dev/null || true

npm test
if [ $? -ne 0 ]; then
  echo "❌ Tests failed. Push aborted."
  exit 1
fi
echo "✅ Tests passed."
exit 0
