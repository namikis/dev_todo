import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import https from "node:https";
import { createClient } from "@supabase/supabase-js";
import { requireAuth } from "../_lib/auth.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DOCS_DIR = path.join(__dirname, "..", "..", "docs");

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

async function getChangelogText() {
  try {
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_KEY
    );
    const { data } = await supabase
      .from("claude_docs")
      .select("content")
      .eq("key", "changelog")
      .single();
    if (data?.content) return data.content;
  } catch {
    // フォールバック
  }
  return readFile(path.join(DOCS_DIR, "claude-code-changelog.md"), "utf8");
}

// --- ハンドラ ---

async function handleFeatures(req, res) {
  try {
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_KEY
    );
    const { data } = await supabase
      .from("claude_docs")
      .select("content")
      .eq("key", "features")
      .single();
    if (data?.content) {
      res.setHeader("content-type", "text/plain; charset=utf-8");
      return res.end(data.content);
    }
  } catch {
    // ファイルフォールバック
  }

  for (const name of ["claude-code-current-features.md", "claude-code-features.md"]) {
    try {
      const content = await readFile(path.join(DOCS_DIR, name), "utf8");
      res.setHeader("content-type", "text/plain; charset=utf-8");
      return res.end(content);
    } catch {
      // 次を試す
    }
  }
  res.status(404).end("`npm run claude:update` を実行してください。");
}

async function handleVersions(req, res) {
  try {
    const text = await getChangelogText();
    const sections = parseChangelogSections(text);
    const versions = sections.map((s) => s.version);
    res.setHeader("content-type", "application/json; charset=utf-8");
    return res.end(JSON.stringify({ versions, latest: versions[0] ?? null }));
  } catch {
    res.status(404).end("`npm run claude:update` を実行してください。");
  }
}

async function handleDiff(req, res) {
  const from = req.query.from;
  const to = req.query.to;
  if (!from || !to) return res.status(400).end("from and to are required");

  try {
    const text = await getChangelogText();
    const sections = parseChangelogSections(text);

    const fromIdx = sections.findIndex((s) => s.version === from);
    const toIdx = sections.findIndex((s) => s.version === to);
    if (fromIdx === -1 || toIdx === -1) {
      res.setHeader("content-type", "application/json; charset=utf-8");
      return res.end(JSON.stringify({ sections: [] }));
    }

    const start = Math.min(fromIdx, toIdx);
    const end = Math.max(fromIdx, toIdx);
    const result = sections.slice(start, end);

    res.setHeader("content-type", "application/json; charset=utf-8");
    return res.end(JSON.stringify({ sections: result }));
  } catch {
    res.status(404).end("`npm run claude:update` を実行してください。");
  }
}

async function handleOfficialDocs(req, res) {
  try {
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_KEY
    );
    const { data } = await supabase
      .from("claude_docs")
      .select("content")
      .eq("key", "official")
      .single();
    if (data?.content) {
      res.setHeader("content-type", "text/plain; charset=utf-8");
      return res.end(data.content);
    }
  } catch {
    // ファイルフォールバック
  }

  try {
    const content = await readFile(
      path.join(DOCS_DIR, "claude-code-official-docs.md"),
      "utf8"
    );
    res.setHeader("content-type", "text/plain; charset=utf-8");
    return res.end(content);
  } catch {
    res.status(404).end("`npm run docs:official` を実行してください。");
  }
}

async function handleUpdate(req, res) {
  const user = await requireAuth(req, res);
  if (!user) return;

  try {
    const npmInfo = JSON.parse(await httpGet(NPM_URL));
    const latestVersion = npmInfo.version ?? "unknown";

    const changelogText = await httpGet(CHANGELOG_URL);
    const sections = parseChangelogSections(changelogText);
    const featuresDoc = buildFeaturesDoc(sections, latestVersion);

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

export default async function handler(req, res) {
  const { name } = req.query;

  if (req.method === "GET") {
    if (name === "features") return handleFeatures(req, res);
    if (name === "versions") return handleVersions(req, res);
    if (name === "diff") return handleDiff(req, res);
    if (name === "official-docs") return handleOfficialDocs(req, res);
  }

  if (req.method === "POST" && name === "update") return handleUpdate(req, res);

  res.status(404).end("not found");
}
