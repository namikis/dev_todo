#!/usr/bin/env node
/**
 * fetch-claude-docs.js — Anthropic 公式 Claude Code ドキュメントを取得・追跡する
 * 使用方法: node scripts/fetch-claude-docs.js
 * 出力:
 *   docs/claude-code-official-docs.md  — 取得した公式ドキュメント（Markdown化）
 *   docs/claude-code-official-diff.md  — 前回との差分（変化があった場合のみ）
 *   docs/.claude-docs-hash             — ページ別ハッシュ記録
 */
import { writeFile, readFile, mkdir } from "node:fs/promises";
import { createHash } from "node:crypto";
import { fileURLToPath } from "node:url";
import path from "node:path";
import https from "node:https";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.join(__dirname, "..");
const DOCS = path.join(ROOT, "docs");
const HASH_FILE = path.join(DOCS, ".claude-docs-hash");

// 取得対象ページ
const DOC_PAGES = [
  { key: "overview",       url: "https://docs.anthropic.com/en/docs/claude-code/overview",        title: "概要 (Overview)" },
  { key: "quickstart",     url: "https://docs.anthropic.com/en/docs/claude-code/quickstart",       title: "クイックスタート" },
  { key: "cli-reference",  url: "https://docs.anthropic.com/en/docs/claude-code/cli-reference",    title: "CLI リファレンス" },
  { key: "settings",       url: "https://docs.anthropic.com/en/docs/claude-code/settings",         title: "設定 (Settings)" },
  { key: "hooks",          url: "https://docs.anthropic.com/en/docs/claude-code/hooks",             title: "フック (Hooks)" },
  { key: "mcp",            url: "https://docs.anthropic.com/en/docs/claude-code/mcp",              title: "MCP" },
  { key: "memory",         url: "https://docs.anthropic.com/en/docs/claude-code/memory",           title: "メモリ (Memory)" },
  { key: "github-actions", url: "https://docs.anthropic.com/en/docs/claude-code/github-actions",   title: "GitHub Actions" },
  { key: "troubleshooting",url: "https://docs.anthropic.com/en/docs/claude-code/troubleshooting",  title: "トラブルシューティング" },
  { key: "bedrock-vertex", url: "https://docs.anthropic.com/en/docs/claude-code/bedrock-and-vertex",title: "Bedrock / Vertex" },
];

// llms.txt (LLM向け公式インデックス) も取得する
const LLMS_TXT_URL = "https://docs.anthropic.com/llms.txt";

function httpGet(url, maxRedirects = 5) {
  return new Promise((resolve, reject) => {
    if (maxRedirects === 0) return reject(new Error("Too many redirects"));
    https.get(url, { headers: { "User-Agent": "dev-todo-docs-watcher/1.0" } }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        const next = res.headers.location.startsWith("http")
          ? res.headers.location
          : new URL(res.headers.location, url).href;
        return httpGet(next, maxRedirects - 1).then(resolve, reject);
      }
      if (res.statusCode === 404) return resolve(null); // ページなしは null
      if (res.statusCode !== 200) return reject(new Error(`HTTP ${res.statusCode}: ${url}`));
      const chunks = [];
      res.on("data", (c) => chunks.push(c));
      res.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
    }).on("error", reject);
  });
}

/** HTML → Markdown (メインコンテンツのみ抽出) */
function htmlToMarkdown(html) {
  // Mintlify: id="page-title" で本文開始位置、"Was this page helpful" で終了を特定
  let t;
  const pageTitleIdx = html.indexOf('id="page-title"');
  const feedbackIdx = html.indexOf("Was this page helpful");
  if (pageTitleIdx !== -1) {
    const h1Start = html.lastIndexOf("<h1", pageTitleIdx);
    const end = feedbackIdx !== -1 && feedbackIdx > h1Start ? feedbackIdx : html.length;
    t = html.slice(h1Start, end);
  } else {
    // フォールバック: article > main > 全HTML
    const articleMatch = html.match(/<article[^>]*>([\s\S]*?)<\/article>/i);
    const mainMatch = html.match(/<main[^>]*>([\s\S]*?)<\/main>/i);
    t = articleMatch ? articleMatch[1] : (mainMatch ? mainMatch[1] : html);
    if (feedbackIdx !== -1) t = t.slice(0, t.indexOf("Was this page helpful"));
  }

  // ノイズ除去
  t = t.replace(/<script[\s\S]*?<\/script>/gi, "");
  t = t.replace(/<style[\s\S]*?<\/style>/gi, "");
  t = t.replace(/<nav[\s\S]*?<\/nav>/gi, "");
  t = t.replace(/<header[\s\S]*?<\/header>/gi, "");
  t = t.replace(/<footer[\s\S]*?<\/footer>/gi, "");
  t = t.replace(/<aside[\s\S]*?<\/aside>/gi, "");
  t = t.replace(/<!--[\s\S]*?-->/g, "");
  // Mintlify の UI ボタン類・ノイズ文字列を除去
  t = t.replace(/Copy page/g, "");
  t = t.replace(/Report incorrect code/g, "");
  t = t.replace(/CopyAsk AI/gi, "");
  t = t.replace(/Copy\s*Ask AI/gi, "");
  t = t.replace(/Ask AI/g, "");
  t = t.replace(/Skip to main content/g, "");
  t = t.replace(/On this page/g, "");
  t = t.replace(/Edit this page/g, "");
  t = t.replace(/Previous|Next\s*→/g, "");

  // コードブロック（先に処理）
  t = t.replace(/<pre[^>]*><code[^>]*>([\s\S]*?)<\/code><\/pre>/gi, (_, c) => {
    const code = decodeEntities(c).trim();
    return `\n\`\`\`\n${code}\n\`\`\`\n`;
  });
  t = t.replace(/<code[^>]*>([\s\S]*?)<\/code>/gi, (_, c) => `\`${decodeEntities(stripTags(c))}\``);

  // 見出し
  t = t.replace(/<h1[^>]*>([\s\S]*?)<\/h1>/gi, (_, c) => `\n# ${cleanText(c)}\n`);
  t = t.replace(/<h2[^>]*>([\s\S]*?)<\/h2>/gi, (_, c) => `\n## ${cleanText(c)}\n`);
  t = t.replace(/<h3[^>]*>([\s\S]*?)<\/h3>/gi, (_, c) => `\n### ${cleanText(c)}\n`);
  t = t.replace(/<h4[^>]*>([\s\S]*?)<\/h4>/gi, (_, c) => `\n#### ${cleanText(c)}\n`);

  // リスト（ネストを平坦化）
  t = t.replace(/<ul[^>]*>/gi, "\n").replace(/<\/ul>/gi, "\n");
  t = t.replace(/<ol[^>]*>/gi, "\n").replace(/<\/ol>/gi, "\n");
  t = t.replace(/<li[^>]*>([\s\S]*?)<\/li>/gi, (_, c) => `- ${cleanText(c)}\n`);

  // リンク（外部リンクのみ保持）
  t = t.replace(/<a[^>]*href="([^"#][^"]*)"[^>]*>([\s\S]*?)<\/a>/gi, (_, href, text) => {
    const clean = cleanText(text);
    if (!clean) return "";
    const fullHref = href.startsWith("/") ? `https://docs.anthropic.com${href}` : href;
    return `[${clean}](${fullHref})`;
  });
  t = t.replace(/<a[^>]*>([\s\S]*?)<\/a>/gi, (_, c) => cleanText(c));

  // 強調
  t = t.replace(/<strong[^>]*>([\s\S]*?)<\/strong>/gi, (_, c) => `**${cleanText(c)}**`);
  t = t.replace(/<b[^>]*>([\s\S]*?)<\/b>/gi, (_, c) => `**${cleanText(c)}**`);
  t = t.replace(/<em[^>]*>([\s\S]*?)<\/em>/gi, (_, c) => `*${cleanText(c)}*`);

  // 段落・改行
  t = t.replace(/<br\s*\/?>/gi, "\n");
  t = t.replace(/<p[^>]*>([\s\S]*?)<\/p>/gi, (_, c) => `\n${cleanText(c)}\n`);
  t = t.replace(/<div[^>]*>([\s\S]*?)<\/div>/gi, (_, c) => `${c}\n`);
  t = t.replace(/<section[^>]*>([\s\S]*?)<\/section>/gi, (_, c) => `${c}\n`);

  // 残タグ除去
  t = t.replace(/<[^>]+>/g, "");

  // エンティティデコード
  t = decodeEntities(t);

  // 空白正規化
  t = t.replace(/[ \t]+/g, " ").replace(/\n{3,}/g, "\n\n").trim();
  return t;
}

function stripTags(html) { return html.replace(/<[^>]+>/g, ""); }
function cleanText(html) { return decodeEntities(stripTags(html)).trim(); }
function decodeEntities(s) {
  return s
    .replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&nbsp;/g, " ")
    .replace(/&#x27;/g, "'").replace(/&#x2F;/g, "/").replace(/&#(\d+);/g, (_, n) => String.fromCharCode(n));
}

function sha256(text) {
  return createHash("sha256").update(text).digest("hex").slice(0, 12);
}

async function loadHashes() {
  try { return JSON.parse(await readFile(HASH_FILE, "utf8")); } catch { return {}; }
}

async function main() {
  await mkdir(DOCS, { recursive: true });
  const now = new Date().toISOString().slice(0, 10);
  const prevHashes = await loadHashes();
  const newHashes = {};
  const sections = [];
  const changedPages = [];
  const failedPages = [];

  console.log("Anthropic 公式ドキュメントを取得中...");

  // llms.txt 取得（存在すれば）
  let llmsTxt = "";
  try {
    const raw = await httpGet(LLMS_TXT_URL);
    if (raw) {
      llmsTxt = raw.trim();
      console.log("  llms.txt を取得しました");
    }
  } catch (e) {
    console.log(`  llms.txt は取得できませんでした (${e.message})`);
  }

  // 各ドキュメントページを取得
  for (const page of DOC_PAGES) {
    try {
      process.stdout.write(`  ${page.title}... `);
      const html = await httpGet(page.url);
      if (!html) {
        console.log("スキップ (404)");
        failedPages.push(page);
        continue;
      }
      const md = htmlToMarkdown(html);
      const hash = sha256(md);
      newHashes[page.key] = hash;

      const changed = prevHashes[page.key] !== hash;
      if (changed) changedPages.push(page);
      console.log(changed ? "変更あり ✓" : "変更なし");

      sections.push({ page, md, changed });
    } catch (e) {
      console.log(`失敗 (${e.message})`);
      failedPages.push(page);
    }
  }

  if (sections.length === 0) {
    console.error("  すべてのページの取得に失敗しました。");
    process.exit(1);
  }

  // 公式ドキュメントをまとめて保存
  const officialDoc = [
    `# Claude Code — 公式ドキュメント`,
    ``,
    `> 取得日: ${now}`,
    `> ソース: https://docs.anthropic.com/en/docs/claude-code/`,
    `> このファイルは \`scripts/fetch-claude-docs.js\` で自動更新されます。`,
    ``,
    llmsTxt ? [`---`, ``, `## llms.txt (公式LLMインデックス)`, ``, "```", llmsTxt.slice(0, 3000), "```", ``].join("\n") : "",
    `---`,
    ``,
    ...sections.map(({ page, md }) => [
      `## ${page.title}`,
      ``,
      `> ソース: ${page.url}`,
      ``,
      md.slice(0, 8000), // 1ページあたり最大8000文字
      ``,
      `---`,
      ``,
    ].join("\n")),
    failedPages.length > 0
      ? `\n*取得できなかったページ: ${failedPages.map((p) => p.title).join(", ")}*`
      : "",
  ].filter(Boolean).join("\n");

  await writeFile(path.join(DOCS, "claude-code-official-docs.md"), officialDoc, "utf8");
  console.log(`✓ docs/claude-code-official-docs.md を保存しました (${sections.length}ページ)`);

  // 差分レポート生成（変化があった場合）
  if (changedPages.length > 0) {
    const diffSections = sections.filter((s) => s.changed);
    const diffDoc = [
      `# Claude Code — 公式ドキュメント差分レポート`,
      ``,
      `> 生成日: ${now}`,
      `> 変更ページ数: ${changedPages.length}/${sections.length}`,
      ``,
      `## 変更されたページ`,
      ``,
      changedPages.map((p) => `- [${p.title}](${p.url})`).join("\n"),
      ``,
      `---`,
      ``,
      ...diffSections.map(({ page, md }) => [
        `## ${page.title}`,
        ``,
        `> ${page.url}`,
        ``,
        md.slice(0, 5000),
        ``,
        `---`,
        ``,
      ].join("\n")),
    ].join("\n");

    await writeFile(path.join(DOCS, "claude-code-official-diff.md"), diffDoc, "utf8");
    console.log(`✓ docs/claude-code-official-diff.md を生成しました (${changedPages.length}件変更)`);
    console.log("\n📄 変更されたページ:");
    for (const p of changedPages) console.log(`  - ${p.title}`);
  } else {
    console.log("  前回から変更なし");
  }

  // ハッシュ記録を更新
  await writeFile(HASH_FILE, JSON.stringify(newHashes, null, 2), "utf8");
  console.log("✓ ハッシュ記録を更新しました");
}

main().catch((e) => { console.error(e); process.exit(1); });
