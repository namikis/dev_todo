import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

import { z } from "zod";
import {
  addTodo,
  clearCompleted,
  deleteTodo,
  listTodos,
  setCompleted,
  updateTodo,
  addSubtask,
  toggleSubtask,
  deleteSubtask,
} from "./todo-store.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PUBLIC_DIR = path.join(__dirname, "public");

const AddSchema = z.object({
  title: z.string().min(1),
  dueDate: z.string().nullable().optional(),
  memo: z.string().nullable().optional(),
});
const PatchSchema = z.object({
  completed: z.boolean().optional(),
  title: z.string().min(1).optional(),
  dueDate: z.string().nullable().optional(),
  memo: z.string().nullable().optional(),
});
const ClearSchema = z.object({ confirm: z.boolean().optional().default(false) });
const SubtaskAddSchema = z.object({ title: z.string().min(1) });
const SubtaskPatchSchema = z.object({ completed: z.boolean() });

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

async function handleApi(req, res, url) {
  const { pathname, searchParams } = url;

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
    const body = AddSchema.parse(await readJson(req));
    const todo = await addTodo(body.title, {
      dueDate: body.dueDate ?? null,
      memo: body.memo ?? null,
    });
    return json(res, 200, { todo });
  }

  // POST /api/todos/clear-completed
  if (req.method === "POST" && pathname === "/api/todos/clear-completed") {
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
      const body = SubtaskAddSchema.parse(await readJson(req));
      const result = await addSubtask(todoId, body.title);
      if (!result) return text(res, 404, "todo not found");
      return json(res, 200, { todo: result.todo, subtask: result.subtask });
    }

    // PATCH /api/todos/:id/subtasks/:subtaskId
    if (req.method === "PATCH" && subtaskId) {
      const body = SubtaskPatchSchema.parse(await readJson(req));
      const result = await toggleSubtask(todoId, subtaskId, body.completed);
      if (!result) return text(res, 404, "not found");
      return json(res, 200, { todo: result.todo, subtask: result.subtask });
    }

    // DELETE /api/todos/:id/subtasks/:subtaskId
    if (req.method === "DELETE" && subtaskId) {
      const todo = await deleteSubtask(todoId, subtaskId);
      if (!todo) return text(res, 404, "not found");
      return json(res, 200, { todo });
    }
  }

  // Single todo routes: /api/todos/:id
  const m = pathname.match(/^\/api\/todos\/([^/]+)$/);
  if (m && req.method === "PATCH") {
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
