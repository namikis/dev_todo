#!/usr/bin/env node
/**
 * diff-report.js — docs/spec.md の差分レポートを生成する
 * 使用方法:
 *   node scripts/diff-report.js                  # HEAD~1 vs HEAD
 *   node scripts/diff-report.js <from> <to>       # 任意の2コミットを比較
 * 出力: docs/diff-report.md
 */
import { writeFile, mkdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { execSync } from "node:child_process";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.join(__dirname, "..");

function git(cmd) {
  try { return execSync(cmd, { cwd: ROOT }).toString().trim(); } catch { return null; }
}

async function main() {
  const args = process.argv.slice(2);
  const fromRef = args[0] || "HEAD~1";
  const toRef = args[1] || "HEAD";

  const now = new Date().toISOString().slice(0, 10);
  const fromHash = git(`git rev-parse --short ${fromRef}`);
  const toHash = git(`git rev-parse --short ${toRef}`);
  const fromDate = git(`git log -1 --format=%ci ${fromRef}`)?.slice(0, 10) ?? "—";
  const toDate = git(`git log -1 --format=%ci ${toRef}`)?.slice(0, 10) ?? "—";

  if (!fromHash || !toHash) {
    console.error(`Error: 有効なコミットが見つかりません (from=${fromRef}, to=${toRef})`);
    console.error("使用方法: node scripts/diff-report.js [<from>] [<to>]");
    process.exit(1);
  }

  const specDiff = git(`git diff ${fromRef}..${toRef} -- docs/spec.md`);
  const changedFiles = git(`git diff --name-only ${fromRef}..${toRef}`);
  const commitLog = git(`git log --oneline ${fromRef}..${toRef}`);

  let addedLines = [];
  let removedLines = [];
  if (specDiff) {
    const lines = specDiff.split("\n");
    addedLines = lines.filter((l) => l.startsWith("+") && !l.startsWith("+++"));
    removedLines = lines.filter((l) => l.startsWith("-") && !l.startsWith("---"));
  }

  let report = `# 差分レポート

> 生成日: ${now}

## 比較対象

| | コミット | 日時 |
|--|---------|------|
| From | \`${fromHash}\` (${fromRef}) | ${fromDate} |
| To | \`${toHash}\` (${toRef}) | ${toDate} |

## コミット一覧

${commitLog ? commitLog.split("\n").map((l) => `- \`${l}\``).join("\n") : "（コミットなし）"}

## 変更ファイル

${changedFiles ? changedFiles.split("\n").map((l) => `- \`${l}\``).join("\n") : "（変更なし）"}

`;

  if (specDiff) {
    report += `## 仕様書 (docs/spec.md) の差分

**追加: ${addedLines.length}行 / 削除: ${removedLines.length}行**

### 追加された内容

\`\`\`diff
${addedLines.join("\n")}
\`\`\`

### 削除された内容

\`\`\`diff
${removedLines.join("\n")}
\`\`\`

### 完全な差分

\`\`\`diff
${specDiff}
\`\`\`
`;
  } else {
    report += `## 仕様書 (docs/spec.md) の差分

仕様書に変更はありません。
`;
  }

  await mkdir(path.join(ROOT, "docs"), { recursive: true });
  await writeFile(path.join(ROOT, "docs", "diff-report.md"), report, "utf8");
  console.log("✓ docs/diff-report.md を生成しました");
  if (specDiff) {
    console.log(`  仕様書の変更: +${addedLines.length}行 / -${removedLines.length}行`);
  } else {
    console.log("  仕様書に変更はありません");
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
