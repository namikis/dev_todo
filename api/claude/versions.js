import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DOCS_DIR = path.join(__dirname, "..", "..", "docs");

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

async function getChangelogText() {
  // Supabase から最新キャッシュを確認
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

  // ローカルファイルにフォールバック
  return readFile(path.join(DOCS_DIR, "claude-code-changelog.md"), "utf8");
}

export default async function handler(req, res) {
  if (req.method !== "GET") return res.status(405).end("method not allowed");

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
