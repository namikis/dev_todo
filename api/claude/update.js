import https from "node:https";
import { createClient } from "@supabase/supabase-js";
import { requireAuth } from "../_lib/auth.js";

const NPM_URL = "https://registry.npmjs.org/@anthropic-ai/claude-code/latest";
const CHANGELOG_URL =
  "https://raw.githubusercontent.com/anthropics/claude-code/main/CHANGELOG.md";

function httpGet(url, maxRedirects = 5) {
  return new Promise((resolve, reject) => {
    if (maxRedirects === 0) return reject(new Error("Too many redirects"));
    https
      .get(url, { headers: { "User-Agent": "dev-todo-watcher/1.0" } }, (res) => {
        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          const next = res.headers.location.startsWith("http")
            ? res.headers.location
            : new URL(res.headers.location, url).href;
          return httpGet(next, maxRedirects - 1).then(resolve, reject);
        }
        if (res.statusCode !== 200)
          return reject(new Error(`HTTP ${res.statusCode}: ${url}`));
        const chunks = [];
        res.on("data", (c) => chunks.push(c));
        res.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
      })
      .on("error", reject);
  });
}

function parseChangelogSections(text) {
  const sections = [];
  let current = null;
  for (const line of text.split("\n")) {
    const m = line.match(/^## \[?v?([^\]\s]+)\]?/);
    if (m) {
      if (current) sections.push(current);
      current = { version: m[1], entries: [] };
    } else if (current && line.startsWith("- ")) {
      current.entries.push(line.slice(2).trim());
    }
  }
  if (current) sections.push(current);
  return sections;
}

/** 直近 N バージョンの機能概要 Markdown を生成 */
function buildFeaturesDoc(sections, latestVersion, count = 5) {
  const now = new Date().toISOString().slice(0, 10);
  const recent = sections.slice(0, count);
  return [
    `# Claude Code — 機能概要`,
    ``,
    `> 最終更新: ${now} / 最新バージョン: \`${latestVersion}\``,
    `>`,
    `> このドキュメントは UI の「更新」ボタンで自動更新されます。`,
    ``,
    `---`,
    ``,
    `## パッケージ情報`,
    ``,
    `- **パッケージ名**: \`@anthropic-ai/claude-code\``,
    `- **最新バージョン**: \`${latestVersion}\``,
    `- **npm**: https://www.npmjs.com/package/@anthropic-ai/claude-code`,
    `- **GitHub**: https://github.com/anthropics/claude-code`,
    ``,
    `---`,
    ``,
    `## 直近のリリース内容`,
    ``,
    recent
      .map((s) =>
        [`## ${s.version}`, ``, ...s.entries.map((e) => `- ${e}`)].join("\n")
      )
      .join("\n\n---\n\n"),
    ``,
    `---`,
    ``,
    `*完全な変更履歴は CHANGELOG を参照してください*`,
  ].join("\n");
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end("method not allowed");

  const user = await requireAuth(req, res);
  if (!user) return;

  try {
    // npm から最新バージョン取得
    const npmInfo = JSON.parse(await httpGet(NPM_URL));
    const latestVersion = npmInfo.version ?? "unknown";

    // GitHub から CHANGELOG.md 取得
    const changelogText = await httpGet(CHANGELOG_URL);
    const sections = parseChangelogSections(changelogText);
    const featuresDoc = buildFeaturesDoc(sections, latestVersion);

    // Supabase にキャッシュ保存
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_KEY
    );
    const now = new Date().toISOString();

    await supabase.from("claude_docs").upsert([
      { key: "changelog", content: changelogText, version: latestVersion, updated_at: now },
      { key: "features", content: featuresDoc, version: latestVersion, updated_at: now },
    ]);

    res.setHeader("content-type", "application/json; charset=utf-8");
    res.end(
      JSON.stringify({
        version: latestVersion,
        features: featuresDoc,
        updatedAt: now,
      })
    );
  } catch (e) {
    res.status(500).end(JSON.stringify({ error: e.message }));
  }
}
