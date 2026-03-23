import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DOCS_DIR = path.join(__dirname, "..", "..", "docs");

export default async function handler(req, res) {
  if (req.method !== "GET") return res.status(405).end("method not allowed");

  // Supabase から最新のキャッシュを確認
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
    // Supabase 失敗時はファイルフォールバック
  }

  // ローカルファイルにフォールバック
  for (const name of ["claude-code-current-features.md", "claude-code-features.md"]) {
    try {
      const content = await readFile(path.join(DOCS_DIR, name), "utf8");
      res.setHeader("content-type", "text/plain; charset=utf-8");
      return res.end(content);
    } catch {
      // 次のファイルを試す
    }
  }

  res.status(404).end("`npm run claude:update` を実行してください。");
}
