import "dotenv/config";
import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import {
  addTodo,
  clearCompleted,
  deleteTodo,
  listTodos,
  setCompleted,
  updateTodo,
  requestTodo,
  addSubtask,
  toggleSubtask,
  updateSubtask,
  deleteSubtask,
} from "./todo-store.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PUBLIC_DIR = path.join(__dirname, "public");
const DOCS_DIR = path.join(__dirname, "docs");

// ---- Changelog parser (for /api/claude/* endpoints) ----
let _changelogCache = null;
let _changelogMtime = 0;

async function getChangelogSections() {
  const filePath = path.join(DOCS_DIR, "claude-code-changelog.md");
  let stat;
  try { stat = await import("node:fs/promises").then((m) => m.stat(filePath)); } catch { return []; }
  if (_changelogCache && stat.mtimeMs === _changelogMtime) return _changelogCache;

  const text = await readFile(filePath, "utf8");
  const sections = [];
  let current = null;
  for (const line of text.split("\n")) {
    const m = line.match(/^## \[?v?([^\]\s\]]+)\]?/);
    if (m) {
      if (current) sections.push(current);
      current = { version: m[1], entries: [] };
    } else if (current && line.startsWith("- ")) {
      current.entries.push(line.slice(2).trim());
    }
  }
  if (current) sections.push(current);
  _changelogCache = sections;
  _changelogMtime = stat.mtimeMs;
  return sections;
}

const AddSchema = z.object({
  title: z.string().min(1),
  dueDate: z.string().nullable().optional(),
  memo: z.string().nullable().optional(),
  assignee: z.enum(["Claude", "Tairyu"]).nullable().optional(),
  type: z.enum(["research", "implement"]).nullable().optional(),
  project: z.string().nullable().optional(),
});
const PatchSchema = z.object({
  completed: z.boolean().optional(),
  title: z.string().min(1).optional(),
  dueDate: z.string().nullable().optional(),
  memo: z.string().nullable().optional(),
  assignee: z.enum(["Claude", "Tairyu"]).nullable().optional(),
  type: z.enum(["research", "implement"]).nullable().optional(),
  project: z.string().nullable().optional(),
});
const ClearSchema = z.object({ confirm: z.boolean().optional().default(false) });
const SubtaskAddSchema = z.object({ title: z.string().min(1) });
const SubtaskPatchSchema = z.object({
  completed: z.boolean().optional(),
  title: z.string().min(1).optional(),
});

async function requireAuth(req, res) {
  const auth = req.headers.authorization ?? "";
  const token = auth.replace("Bearer ", "");
  if (!token) { json(res, 401, { error: "unauthorized" }); return null; }
  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);
  const { data: { user }, error } = await supabase.auth.getUser(token);
  if (error || !user) { json(res, 401, { error: "unauthorized" }); return null; }
  return user;
}

function json(res, status, body) {
  const data = JSON.stringify(body);
  res.writeHead(status, {
    "content-type": "application/json; charset=utf-8",
    "content-length": Buffer.byteLength(data),
    "cache-control": "no-store",
  });
  res.end(data);
}

function text(res, status, body) {
  res.writeHead(status, {
    "content-type": "text/plain; charset=utf-8",
    "cache-control": "no-store",
  });
  res.end(body);
}

async function readJson(req) {
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  const raw = Buffer.concat(chunks).toString("utf8").trim();
  if (!raw) return {};
  return JSON.parse(raw);
}

function safeParseUrl(reqUrl) {
  const base = "http://localhost";
  return new URL(reqUrl ?? "/", base);
}

function contentTypeFor(filePath) {
  const ext = path.extname(filePath);
  if (ext === ".html") return "text/html; charset=utf-8";
  if (ext === ".css") return "text/css; charset=utf-8";
  if (ext === ".js") return "text/javascript; charset=utf-8";
  if (ext === ".svg") return "image/svg+xml";
  if (ext === ".png") return "image/png";
  if (ext === ".ico") return "image/x-icon";
  return "application/octet-stream";
}

async function serveStatic(req, res, url) {
  let pathname = decodeURIComponent(url.pathname);
  if (pathname === "/") pathname = "/index.html";
  if (pathname === "/claude") pathname = "/claude.html";
  if (pathname === "/favicon.svg") pathname = "/favicon-dev.svg";

  const candidate = path.normalize(path.join(PUBLIC_DIR, pathname));
  if (!candidate.startsWith(PUBLIC_DIR)) {
    return text(res, 400, "bad path");
  }

  try {
    const data = await readFile(candidate);
    res.writeHead(200, {
      "content-type": contentTypeFor(candidate),
      "content-length": data.length,
      "cache-control": "no-store",
    });
    res.end(data);
  } catch {
    text(res, 404, "not found");
  }
}

async function triggerGitHubWorkflow(todo) {
  const pat = process.env.GITHUB_PAT;
  if (!pat) return;

  const url = "https://api.github.com/repos/namikis/dev_todo/actions/workflows/run-task.yml/dispatches";
  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${pat}`,
      Accept: "application/vnd.github.v3+json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      ref: "main",
      inputs: {
        task_id: todo.id,
        title: todo.title,
        memo: todo.memo ?? "",
        type: todo.type ?? "implement",
      },
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    console.error(`[gui] workflow_dispatch failed: ${res.status} ${body}`);
  }
}

async function handleApi(req, res, url) {
  const { pathname, searchParams } = url;

  // GET /api/auth/config — Supabase公開設定
  if (req.method === "GET" && pathname === "/api/auth/config") {
    return json(res, 200, {
      supabaseUrl: process.env.SUPABASE_URL,
      supabaseAnonKey: process.env.SUPABASE_ANON_KEY,
    });
  }

  // GET /api/claude/versions — バージョン一覧
  if (req.method === "GET" && pathname === "/api/claude/versions") {
    const sections = await getChangelogSections();
    const versions = sections.map((s) => s.version);
    return json(res, 200, { versions, latest: versions[0] ?? null });
  }

  // GET /api/claude/diff?from=X&to=Y — バージョン間差分
  if (req.method === "GET" && pathname === "/api/claude/diff") {
    const from = searchParams.get("from");
    const to = searchParams.get("to");
    if (!from || !to) return text(res, 400, "from and to are required");
    const sections = await getChangelogSections();
    const fromIdx = sections.findIndex((s) => s.version === from);
    const toIdx = sections.findIndex((s) => s.version === to);
    if (fromIdx === -1 || toIdx === -1) return json(res, 200, { sections: [] });
    // newer versions have smaller index; "from" should be older (larger idx)
    const start = Math.min(fromIdx, toIdx);
    const end = Math.max(fromIdx, toIdx);
    const result = sections.slice(start, end); // excludes "from" version itself
    return json(res, 200, { sections: result });
  }

  // GET /api/claude/official-docs — Anthropic 公式ドキュメント
  if (req.method === "GET" && pathname === "/api/claude/official-docs") {
    const p = path.join(DOCS_DIR, "claude-code-official-docs.md");
    try {
      return text(res, 200, await readFile(p, "utf8"));
    } catch {
      return text(res, 404, "`npm run docs:official` を実行してください。");
    }
  }

  // GET /api/claude/features — 機能カタログ
  if (req.method === "GET" && pathname === "/api/claude/features") {
    const p = path.join(DOCS_DIR, "claude-code-current-features.md");
    try {
      return text(res, 200, await readFile(p, "utf8"));
    } catch {
      // fallback to features overview
      try {
        return text(res, 200, await readFile(path.join(DOCS_DIR, "claude-code-features.md"), "utf8"));
      } catch {
        return text(res, 404, "`npm run claude:update` を実行してください。");
      }
    }
  }

  // GET /api/claude/releases-ja — 日本語リリースノート
  if (req.method === "GET" && pathname === "/api/claude/releases-ja") {
    const p = path.join(DOCS_DIR, "claude-code-releases-ja.md");
    try {
      return text(res, 200, await readFile(p, "utf8"));
    } catch {
      return text(res, 404, "`npm run claude:update` を実行してください。");
    }
  }

  // GET /api/docs/spec
  if (req.method === "GET" && pathname === "/api/docs/spec") {
    const specPath = path.join(DOCS_DIR, "spec.md");
    try {
      const content = await readFile(specPath, "utf8");
      return text(res, 200, content);
    } catch {
      return text(res, 404, "docs/spec.md が見つかりません。`npm run docs` を実行してください。");
    }
  }

  // GET /api/docs/diff
  if (req.method === "GET" && pathname === "/api/docs/diff") {
    const diffPath = path.join(DOCS_DIR, "diff-report.md");
    try {
      const content = await readFile(diffPath, "utf8");
      return text(res, 200, content);
    } catch {
      return text(res, 404, "docs/diff-report.md が見つかりません。`npm run docs:diff` を実行してください。");
    }
  }

  // GET /api/docs/claude
  if (req.method === "GET" && pathname === "/api/docs/claude") {
    const claudePath = path.join(DOCS_DIR, "claude-code-features.md");
    try {
      const content = await readFile(claudePath, "utf8");
      return text(res, 200, content);
    } catch {
      return text(res, 404, "docs/claude-code-features.md が見つかりません。`npm run claude:update` を実行してください。");
    }
  }

  // GET /api/projects
  if (req.method === "GET" && pathname === "/api/projects") {
    const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);
    const { data, error } = await supabase.from("projects").select("*").order("name", { ascending: true });
    if (error) return text(res, 500, error.message);
    return json(res, 200, { projects: data ?? [] });
  }

  // POST /api/projects
  if (req.method === "POST" && pathname === "/api/projects") {
    const user = await requireAuth(req, res);
    if (!user) return;
    const body = await readJson(req);
    const name = (body.name ?? "").trim();
    if (!name) return text(res, 400, "name is required");
    const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);
    const { data, error } = await supabase.from("projects").upsert({ name }, { onConflict: "name" }).select().single();
    if (error) return text(res, 500, error.message);
    return json(res, 200, { project: data });
  }

  // DELETE /api/projects/:name
  const projMatch = pathname.match(/^\/api\/projects\/([^/]+)$/);
  if (projMatch && req.method === "DELETE") {
    const user = await requireAuth(req, res);
    if (!user) return;
    const name = decodeURIComponent(projMatch[1]);
    const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);
    const { error, count } = await supabase.from("projects").delete({ count: "exact" }).eq("name", name);
    if (error) return text(res, 500, error.message);
    return json(res, 200, { deleted: (count ?? 0) > 0 });
  }

  // GET /api/todos
  if (req.method === "GET" && pathname === "/api/todos") {
    const status = searchParams.get("status") ?? "all";
    const limit = Number(searchParams.get("limit") ?? "50");
    const todos = await listTodos({
      status: status === "open" || status === "done" || status === "all" ? status : "all",
      limit: Number.isFinite(limit) ? Math.max(1, Math.min(200, Math.trunc(limit))) : 50,
    });
    return json(res, 200, { todos });
  }

  // POST /api/todos
  if (req.method === "POST" && pathname === "/api/todos") {
    const user = await requireAuth(req, res);
    if (!user) return;
    const body = AddSchema.parse(await readJson(req));
    const todo = await addTodo(body.title, {
      dueDate: body.dueDate ?? null,
      memo: body.memo ?? null,
      assignee: body.assignee ?? null,
      type: body.type ?? null,
      project: body.project ?? null,
    });
    return json(res, 200, { todo });
  }

  // POST /api/todos/clear-completed
  if (req.method === "POST" && pathname === "/api/todos/clear-completed") {
    const user = await requireAuth(req, res);
    if (!user) return;
    const body = ClearSchema.parse(await readJson(req));
    if (!body.confirm) return text(res, 400, "confirm required");
    const removed = await clearCompleted();
    return json(res, 200, { removed });
  }

  // Subtask routes: /api/todos/:id/subtasks[/:subtaskId]
  const subMatch = pathname.match(/^\/api\/todos\/([^/]+)\/subtasks(?:\/([^/]+))?$/);
  if (subMatch) {
    const todoId = decodeURIComponent(subMatch[1]);
    const subtaskId = subMatch[2] ? decodeURIComponent(subMatch[2]) : null;

    // POST /api/todos/:id/subtasks
    if (req.method === "POST" && !subtaskId) {
      const user = await requireAuth(req, res);
      if (!user) return;
      const body = SubtaskAddSchema.parse(await readJson(req));
      const result = await addSubtask(todoId, body.title);
      if (!result) return text(res, 404, "todo not found");
      return json(res, 200, { todo: result.todo, subtask: result.subtask });
    }

    // PATCH /api/todos/:id/subtasks/:subtaskId
    if (req.method === "PATCH" && subtaskId) {
      const user = await requireAuth(req, res);
      if (!user) return;
      const body = SubtaskPatchSchema.parse(await readJson(req));
      const result = await updateSubtask(todoId, subtaskId, body);
      if (!result) return text(res, 404, "not found");
      return json(res, 200, { todo: result.todo, subtask: result.subtask });
    }

    // DELETE /api/todos/:id/subtasks/:subtaskId
    if (req.method === "DELETE" && subtaskId) {
      const user = await requireAuth(req, res);
      if (!user) return;
      const todo = await deleteSubtask(todoId, subtaskId);
      if (!todo) return text(res, 404, "not found");
      return json(res, 200, { todo });
    }
  }

  // POST /api/todos/:id/request
  const reqMatch = pathname.match(/^\/api\/todos\/([^/]+)\/request$/);
  if (reqMatch && req.method === "POST") {
    const user = await requireAuth(req, res);
    if (!user) return;
    const id = decodeURIComponent(reqMatch[1]);
    const todo = await requestTodo(id);
    if (!todo) return text(res, 404, "not found");

    // GITHUB_PAT がセットされている場合、GitHub Actions workflow をトリガー
    if (process.env.GITHUB_PAT) {
      triggerGitHubWorkflow(todo).catch((err) => {
        console.error(`[gui] triggerGitHubWorkflow error:`, err.message);
      });
    }

    return json(res, 200, { todo });
  }

  // Single todo routes: /api/todos/:id
  const m = pathname.match(/^\/api\/todos\/([^/]+)$/);
  if (m && req.method === "PATCH") {
    const user = await requireAuth(req, res);
    if (!user) return;
    const id = decodeURIComponent(m[1]);
    const body = PatchSchema.parse(await readJson(req));
    if ("completed" in body) {
      const todo = await setCompleted(id, body.completed);
      if (!todo) return text(res, 404, "not found");
      // Also apply other updates if present
      const rest = { ...body };
      delete rest.completed;
      if (Object.keys(rest).length > 0) {
        const updated = await updateTodo(id, rest);
        if (updated) return json(res, 200, { todo: updated });
      }
      return json(res, 200, { todo });
    }
    const todo = await updateTodo(id, body);
    if (!todo) return text(res, 404, "not found");
    return json(res, 200, { todo });
  }
  if (m && req.method === "DELETE") {
    const user = await requireAuth(req, res);
    if (!user) return;
    const id = decodeURIComponent(m[1]);
    const ok = await deleteTodo(id);
    if (!ok) return text(res, 404, "not found");
    return json(res, 200, { ok: true });
  }

  text(res, 404, "not found");
}

const port = Number(process.env.PORT ?? "5177");

const server = createServer(async (req, res) => {
  try {
    const url = safeParseUrl(req.url);
    if (url.pathname.startsWith("/api/")) return await handleApi(req, res, url);
    return await serveStatic(req, res, url);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    text(res, 500, message);
  }
});

server.listen(port, "127.0.0.1", () => {
  // eslint-disable-next-line no-console
  console.log(`GUI running on http://127.0.0.1:${port}`);
});
