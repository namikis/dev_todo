import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { join, extname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { randomUUID } from 'node:crypto';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const PORT = Number(process.env.TEST_PORT ?? 5178);

// ---- In-memory store ----
let todos = [];

function resetStore() {
  todos = [
    {
      id: 'todo-1',
      title: 'テストタスク',
      completed: false,
      createdAt: new Date().toISOString(),
      completedAt: null,
      dueDate: null,
      memo: null,
      assignee: 'Claude',
      type: null,
      project: null,
      subtasks: [{ id: 'sub-1', title: 'サブタスク1', completed: false }],
      status: 'open',
      result: null,
      reportUrl: null,
      prUrl: null,
      requestedAt: null,
    },
  ];
}

resetStore();

// ---- MIME types ----
const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js':   'text/javascript; charset=utf-8',
  '.css':  'text/css; charset=utf-8',
  '.json': 'application/json',
  '.ico':  'image/x-icon',
};

// ---- Helpers ----
function send(res, status, body) {
  const json = JSON.stringify(body);
  res.writeHead(status, { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(json) });
  res.end(json);
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', (chunk) => (data += chunk));
    req.on('end', () => {
      try { resolve(data ? JSON.parse(data) : {}); }
      catch (e) { reject(e); }
    });
    req.on('error', reject);
  });
}

async function serveStatic(res, urlPath) {
  const filePath = urlPath === '/' ? '/index.html' : urlPath;
  const abs = join(__dirname, 'public', filePath);
  try {
    const content = await readFile(abs);
    const ext = extname(abs);
    res.writeHead(200, { 'Content-Type': MIME[ext] ?? 'application/octet-stream' });
    res.end(content);
  } catch {
    res.writeHead(404);
    res.end('Not Found');
  }
}

// ---- Server ----
const server = createServer(async (req, res) => {
  const url = new URL(req.url, `http://127.0.0.1:${PORT}`);
  const pathname = url.pathname;
  const method = req.method;

  // CORS for tests
  res.setHeader('Access-Control-Allow-Origin', '*');

  try {
    // POST /reset — テスト用リセット
    if (method === 'POST' && pathname === '/reset') {
      resetStore();
      return send(res, 200, { ok: true });
    }

    // GET /api/auth/config — テスト用: 空のconfig返却
    if (method === 'GET' && pathname === '/api/auth/config') {
      return send(res, 200, { supabaseUrl: null, supabaseAnonKey: null });
    }

    // GET /api/todos
    if (method === 'GET' && pathname === '/api/todos') {
      const status = url.searchParams.get('status') ?? 'all';
      let result = todos;
      if (status === 'open') result = todos.filter((t) => !t.completed);
      if (status === 'done') result = todos.filter((t) => t.completed);
      return send(res, 200, { todos: result });
    }

    // POST /api/todos
    if (method === 'POST' && pathname === '/api/todos') {
      const body = await readBody(req);
      const todo = {
        id: randomUUID(),
        title: body.title,
        completed: false,
        createdAt: new Date().toISOString(),
        completedAt: null,
        dueDate: body.dueDate ?? null,
        memo: body.memo ?? null,
        assignee: body.assignee ?? null,
        type: body.type ?? null,
        project: body.project ?? null,
        subtasks: [],
        status: 'open',
        result: null,
        reportUrl: null,
        prUrl: null,
        requestedAt: null,
      };
      todos.push(todo);
      return send(res, 201, todo);
    }

    // POST /api/todos/clear-completed
    if (method === 'POST' && pathname === '/api/todos/clear-completed') {
      const before = todos.length;
      todos = todos.filter((t) => !t.completed);
      return send(res, 200, { deleted: before - todos.length });
    }

    // Routes with :id
    const idMatch = pathname.match(/^\/api\/todos\/([^/]+)$/);
    const requestMatch = pathname.match(/^\/api\/todos\/([^/]+)\/request$/);
    const subtasksMatch = pathname.match(/^\/api\/todos\/([^/]+)\/subtasks$/);
    const subtaskMatch = pathname.match(/^\/api\/todos\/([^/]+)\/subtasks\/([^/]+)$/);

    // POST /api/todos/:id/request
    if (method === 'POST' && requestMatch) {
      const id = decodeURIComponent(requestMatch[1]);
      const idx = todos.findIndex((t) => t.id === id);
      if (idx === -1) return send(res, 404, { error: 'Not found' });
      todos[idx] = { ...todos[idx], status: 'requested', requestedAt: new Date().toISOString() };
      return send(res, 200, todos[idx]);
    }

    // POST /api/todos/:id/subtasks
    if (method === 'POST' && subtasksMatch) {
      const id = decodeURIComponent(subtasksMatch[1]);
      const idx = todos.findIndex((t) => t.id === id);
      if (idx === -1) return send(res, 404, { error: 'Not found' });
      const body = await readBody(req);
      const subtask = { id: randomUUID(), title: body.title, completed: false };
      todos[idx] = { ...todos[idx], subtasks: [...(todos[idx].subtasks ?? []), subtask] };
      return send(res, 201, { todo: todos[idx], subtask });
    }

    // PATCH /api/todos/:id/subtasks/:subtaskId
    if (method === 'PATCH' && subtaskMatch) {
      const id = decodeURIComponent(subtaskMatch[1]);
      const subtaskId = decodeURIComponent(subtaskMatch[2]);
      const idx = todos.findIndex((t) => t.id === id);
      if (idx === -1) return send(res, 404, { error: 'Not found' });
      const body = await readBody(req);
      const subs = [...(todos[idx].subtasks ?? [])];
      const si = subs.findIndex((s) => s.id === subtaskId);
      if (si === -1) return send(res, 404, { error: 'Subtask not found' });
      if ('title' in body && body.title) subs[si] = { ...subs[si], title: body.title };
      if ('completed' in body) subs[si] = { ...subs[si], completed: body.completed };
      todos[idx] = { ...todos[idx], subtasks: subs };
      return send(res, 200, { todo: todos[idx], subtask: subs[si] });
    }

    // DELETE /api/todos/:id/subtasks/:subtaskId
    if (method === 'DELETE' && subtaskMatch) {
      const id = decodeURIComponent(subtaskMatch[1]);
      const subtaskId = decodeURIComponent(subtaskMatch[2]);
      const idx = todos.findIndex((t) => t.id === id);
      if (idx === -1) return send(res, 404, { error: 'Not found' });
      todos[idx] = { ...todos[idx], subtasks: (todos[idx].subtasks ?? []).filter((s) => s.id !== subtaskId) };
      return send(res, 200, todos[idx]);
    }

    // PATCH /api/todos/:id
    if (method === 'PATCH' && idMatch) {
      const id = decodeURIComponent(idMatch[1]);
      const idx = todos.findIndex((t) => t.id === id);
      if (idx === -1) return send(res, 404, { error: 'Not found' });
      const body = await readBody(req);
      const updates = {};
      if ('title' in body && body.title) updates.title = body.title;
      if ('completed' in body) {
        updates.completed = body.completed;
        updates.completedAt = body.completed ? new Date().toISOString() : null;
      }
      if ('dueDate' in body) updates.dueDate = body.dueDate;
      if ('memo' in body) updates.memo = body.memo;
      if ('assignee' in body) updates.assignee = body.assignee;
      if ('type' in body) updates.type = body.type;
      if ('project' in body) updates.project = body.project;
      if ('status' in body) updates.status = body.status;
      todos[idx] = { ...todos[idx], ...updates };
      return send(res, 200, todos[idx]);
    }

    // DELETE /api/todos/:id
    if (method === 'DELETE' && idMatch) {
      const id = decodeURIComponent(idMatch[1]);
      const before = todos.length;
      todos = todos.filter((t) => t.id !== id);
      if (todos.length === before) return send(res, 404, { error: 'Not found' });
      return send(res, 200, { deleted: true });
    }

    // Static files
    if (method === 'GET') {
      return await serveStatic(res, pathname);
    }

    send(res, 404, { error: 'Not found' });
  } catch (err) {
    console.error(err);
    send(res, 500, { error: String(err) });
  }
});

server.listen(PORT, '127.0.0.1', () => {
  console.log(`Test server listening on http://127.0.0.1:${PORT}`);
});
