#!/usr/bin/env node
/**
 * fetch-claude-changelog.js — Claude Code のリリース情報を取得・追跡する
 * 使用方法:
 *   node scripts/fetch-claude-changelog.js        # 最新情報を取得
 *   node scripts/fetch-claude-changelog.js --force # バージョン変化なくても再生成
 * 出力:
 *   docs/claude-code-changelog.md  — 生のCHANGELOG (GitHubから取得)
 *   docs/claude-code-features.md   — 直近バージョンの機能概要
 *   docs/claude-code-diff.md       — 前回取得からの新着差分
 *   docs/.claude-code-version      — 最後に確認したバージョン記録
 */
import { writeFile, readFile, mkdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";
import https from "node:https";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.join(__dirname, "..");
const DOCS = path.join(ROOT, "docs");

const NPM_URL = "https://registry.npmjs.org/@anthropic-ai/claude-code/latest";
const CHANGELOG_URL =
  "https://raw.githubusercontent.com/anthropics/claude-code/main/CHANGELOG.md";
const VERSION_FILE = path.join(DOCS, ".claude-code-version");

const FORCE = process.argv.includes("--force");

function httpGet(url) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { "User-Agent": "dev-todo-watcher/1.0" } }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return httpGet(res.headers.location).then(resolve, reject);
      }
      if (res.statusCode !== 200) {
        return reject(new Error(`HTTP ${res.statusCode}: ${url}`));
      }
      const chunks = [];
      res.on("data", (c) => chunks.push(c));
      res.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
    }).on("error", reject);
  });
}

async function fetchText(url) { return httpGet(url); }
async function fetchJson(url) { return JSON.parse(await httpGet(url)); }

async function loadPreviousVersion() {
  try { return (await readFile(VERSION_FILE, "utf8")).trim(); } catch { return null; }
}

/** CHANGELOG.md を ## [x.y.z] セクション単位に分割 */
function parseChangelog(text) {
  const sections = [];
  let current = null;
  for (const line of text.split("\n")) {
    const m = line.match(/^## \[?v?([^\]\s]+)\]?/);
    if (m) {
      if (current) sections.push(current);
      current = { version: m[1], lines: [line] };
    } else if (current) {
      current.lines.push(line);
    }
  }
  if (current) sections.push(current);
  return sections;
}

async function main() {
  await mkdir(DOCS, { recursive: true });

  console.log("Claude Code の最新情報を取得中...");

  // npm から最新バージョン取得
  let latestVersion = "unknown";
  let npmInfo = null;
  try {
    npmInfo = await fetchJson(NPM_URL);
    latestVersion = npmInfo.version ?? "unknown";
    console.log(`  npm 最新バージョン: ${latestVersion}`);
  } catch (e) {
    console.error(`  [warn] npm 情報の取得に失敗: ${e.message}`);
  }

  const previousVersion = await loadPreviousVersion();

  // バージョン変化がなく --force でもない場合はスキップ
  if (!FORCE && previousVersion && previousVersion === latestVersion) {
    console.log(`  変更なし (${latestVersion})`);
    console.log("  最新情報に変化はありませんでした。--force で強制再生成できます。");
    return;
  }

  // GitHub から CHANGELOG.md 取得
  let changelogText = "";
  try {
    changelogText = await fetchText(CHANGELOG_URL);
    console.log("  CHANGELOG.md を取得しました");
  } catch (e) {
    console.error(`  [error] CHANGELOG の取得に失敗: ${e.message}`);
    process.exit(1);
  }

  const sections = parseChangelog(changelogText);
  const now = new Date().toISOString().slice(0, 10);

  // 生の CHANGELOG を保存
  await writeFile(path.join(DOCS, "claude-code-changelog.md"), changelogText, "utf8");
  console.log("✓ docs/claude-code-changelog.md を保存しました");

  // 前回バージョン以降の新着セクションを抽出
  let newSections = [];
  if (previousVersion) {
    const prevIdx = sections.findIndex(
      (s) => s.version === previousVersion || s.version.startsWith(previousVersion)
    );
    if (prevIdx > 0) newSections = sections.slice(0, prevIdx);
    else if (prevIdx === -1) newSections = sections; // 全部新しい
  }

  // 機能概要ドキュメント（直近 5 バージョン分）
  const recentSections = sections.slice(0, 5);
  const featuresDoc = [
    `# Claude Code — 機能概要`,
    ``,
    `> 最終更新: ${now} / 最新バージョン: \`${latestVersion}\``,
    `>`,
    `> このドキュメントは \`scripts/fetch-claude-changelog.js\` で自動更新されます。`,
    `> 更新コマンド: \`npm run claude:update\``,
    ``,
    `---`,
    ``,
    `## パッケージ情報`,
    ``,
    `- **パッケージ名**: \`@anthropic-ai/claude-code\``,
    `- **最新バージョン**: \`${latestVersion}\``,
    `- **前回確認バージョン**: \`${previousVersion ?? "（初回）"}\``,
    `- **npm**: https://www.npmjs.com/package/@anthropic-ai/claude-code`,
    `- **GitHub**: https://github.com/anthropics/claude-code`,
    ``,
    `---`,
    ``,
    `## 直近のリリース内容`,
    ``,
    recentSections.map((s) => s.lines.join("\n")).join("\n\n---\n\n"),
    ``,
    `---`,
    ``,
    `*完全な変更履歴は \`docs/claude-code-changelog.md\` を参照*`,
  ].join("\n");

  await writeFile(path.join(DOCS, "claude-code-features.md"), featuresDoc, "utf8");
  console.log("✓ docs/claude-code-features.md を更新しました");

  // 差分レポート生成
  if (newSections.length > 0) {
    const diffDoc = [
      `# Claude Code — 差分レポート`,
      ``,
      `> 生成日: ${now}`,
      `> 前回: \`${previousVersion}\` → 最新: \`${latestVersion}\``,
      ``,
      `## 新しいリリース（${newSections.length} 件）`,
      ``,
      newSections.map((s) => s.lines.join("\n")).join("\n\n---\n\n"),
    ].join("\n");

    await writeFile(path.join(DOCS, "claude-code-diff.md"), diffDoc, "utf8");
    console.log(`✓ docs/claude-code-diff.md を生成しました（${newSections.length} 件の新バージョン）`);

    console.log("\n🆕 新しいリリース:");
    for (const s of newSections) console.log(`  - v${s.version}`);
  } else {
    console.log("  前回からの差分なし（差分レポートは生成しません）");
  }

  // バージョン記録を更新
  await writeFile(VERSION_FILE, latestVersion, "utf8");
  console.log(`✓ バージョン記録を更新: ${previousVersion ?? "（なし）"} → ${latestVersion}`);
}

main().catch((e) => { console.error(e); process.exit(1); });
