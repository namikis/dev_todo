import { randomUUID } from "node:crypto";
import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";

import { z } from "zod";

const DATA_DIR = path.join(process.cwd(), "data");
const DATA_FILE = path.join(DATA_DIR, "todos.json");

export const TodoSchema = z.object({
  id: z.string(),
  title: z.string(),
  completed: z.boolean(),
  createdAt: z.string(),
  completedAt: z.string().nullable(),
});

const TodosSchema = z.array(TodoSchema);

async function readTodosUnsafe() {
  const raw = await readFile(DATA_FILE, "utf8");
  return JSON.parse(raw);
}

export async function loadTodos() {
  try {
    const parsed = await readTodosUnsafe();
    return TodosSchema.parse(parsed);
  } catch (err) {
    if (err && typeof err === "object" && "code" in err && err.code === "ENOENT") return [];
    throw err;
  }
}

async function saveTodos(todos) {
  await mkdir(DATA_DIR, { recursive: true });
  const tmp = `${DATA_FILE}.${Date.now()}.tmp`;
  await writeFile(tmp, JSON.stringify(todos, null, 2) + "\n", "utf8");
  await rename(tmp, DATA_FILE);
}

export function formatTodo(todo) {
  const status = todo.completed ? "x" : " ";
  return `- [${status}] ${todo.title} (${todo.id})`;
}

export async function addTodo(title) {
  const todos = await loadTodos();
  const now = new Date().toISOString();
  const todo = {
    id: randomUUID(),
    title,
    completed: false,
    createdAt: now,
    completedAt: null,
  };
  todos.push(todo);
  await saveTodos(todos);
  return todo;
}

export async function getTodo(id) {
  const todos = await loadTodos();
  return todos.find((t) => t.id === id) ?? null;
}

export async function listTodos({ status = "all", limit = 50 } = {}) {
  const todos = await loadTodos();
  const filtered = todos.filter((t) => {
    if (status === "open") return !t.completed;
    if (status === "done") return t.completed;
    return true;
  });
  return filtered.slice(0, limit);
}

export async function setCompleted(id, completed = true) {
  const todos = await loadTodos();
  const idx = todos.findIndex((t) => t.id === id);
  if (idx === -1) return null;
  const now = new Date().toISOString();
  const next = {
    ...todos[idx],
    completed,
    completedAt: completed ? now : null,
  };
  todos[idx] = next;
  await saveTodos(todos);
  return next;
}

export async function deleteTodo(id) {
  const todos = await loadTodos();
  const before = todos.length;
  const next = todos.filter((t) => t.id !== id);
  if (next.length === before) return false;
  await saveTodos(next);
  return true;
}

export async function clearCompleted() {
  const todos = await loadTodos();
  const remaining = todos.filter((t) => !t.completed);
  const removed = todos.length - remaining.length;
  await saveTodos(remaining);
  return removed;
}

