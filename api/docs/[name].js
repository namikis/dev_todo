import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DOCS_DIR = path.join(__dirname, "..", "..", "docs");

const fileMap = {
  spec: "spec.md",
  claude: "claude-code-features.md",
  diff: "diff-report.md",
};

export default async function handler(req, res) {
  try {
    if (req.method !== "GET") return res.status(405).end("method not allowed");
    const { name } = req.query;
    const filename = fileMap[name];
    if (!filename) return res.status(404).end("not found");
    const content = await readFile(path.join(DOCS_DIR, filename), "utf8");
    res.setHeader("content-type", "text/plain; charset=utf-8");
    res.end(content);
  } catch {
    res.status(404).end("file not found");
  }
}
