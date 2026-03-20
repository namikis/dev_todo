// scripts/install-hooks.js
import { copyFileSync, chmodSync, existsSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const hooksDir = join(root, '.git', 'hooks');
const srcHook = join(root, 'scripts', 'pre-push.sh');
const destHook = join(hooksDir, 'pre-push');

if (!existsSync(hooksDir)) {
  console.log('Not a git repository or .git/hooks not found, skipping hook installation.');
  process.exit(0);
}

copyFileSync(srcHook, destHook);
chmodSync(destHook, 0o755);
console.log('pre-push hook installed.');
