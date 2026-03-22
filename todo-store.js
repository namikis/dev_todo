try { await import("dotenv/config"); } catch {}
import { randomUUID } from "node:crypto";

import { createClient } from "@supabase/supabase-js";
import { z } from "zod";

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY,
);

const SubtaskSchema = z.object({
  id: z.string(),
  title: z.string(),
  completed: z.boolean(),
});

export const TodoSchema = z.object({
  id: z.string(),
  title: z.string(),
  completed: z.boolean(),
  createdAt: z.string(),
  completedAt: z.string().nullable(),
  dueDate: z.string().nullable().optional().default(null),
  memo: z.string().nullable().optional().default(null),
  assignee: z.enum(["Claude", "Tairyu"]).nullable().optional().default(null),
  type: z.enum(["research", "implement"]).nullable().optional().default(null),
  project: z.string().nullable().optional().default(null),
  subtasks: z.array(SubtaskSchema).optional().default([]),
  status: z.enum(["open", "requested", "running", "blocked", "done", "error"]).default("open"),
  result: z.string().nullable().optional().default(null),
  reportUrl: z.string().nullable().optional().default(null),
  prUrl: z.string().nullable().optional().default(null),
  issueUrl: z.string().nullable().optional().default(null),
  requestedAt: z.string().nullable().optional().default(null),
});

function fromRow(row) {
  return {
    id: row.id,
    title: row.title,
    completed: row.completed,
    createdAt: row.created_at,
    completedAt: row.completed_at ?? null,
    dueDate: row.due_date ?? null,
    memo: row.memo ?? null,
    assignee: row.assignee ?? null,
    type: row.type ?? null,
    project: row.project ?? null,
    subtasks: row.subtasks ?? [],
    status: row.status ?? "open",
    result: row.result ?? null,
    reportUrl: row.report_url ?? null,
    prUrl: row.pr_url ?? null,
    issueUrl: row.issue_url ?? null,
    requestedAt: row.requested_at ?? null,
  };
}

export function formatTodo(todo) {
  const status = todo.completed ? "x" : " ";
  const due = todo.dueDate ? ` [期限: ${todo.dueDate}]` : "";
  const memo = todo.memo ? ` memo: ${todo.memo.slice(0, 40)}` : "";
  const assignee = todo.assignee ? ` @${todo.assignee}` : "";
  const project = todo.project ? ` [project: ${todo.project}]` : "";
  const subs = (todo.subtasks ?? []).length;
  const subsDone = (todo.subtasks ?? []).filter((s) => s.completed).length;
  const subsInfo = subs > 0 ? ` (subtasks: ${subsDone}/${subs})` : "";
  return `- [${status}] ${todo.title}${due}${assignee}${project}${memo}${subsInfo} (${todo.id})`;
}

export async function loadTodos() {
  const { data, error } = await supabase
    .from("todos")
    .select("*")
    .order("created_at", { ascending: true });
  if (error) throw new Error(error.message);
  return (data ?? []).map(fromRow);
}

export async function addTodo(title, { dueDate = null, memo = null, assignee = null, type = null, project = null } = {}) {
  const { data, error } = await supabase
    .from("todos")
    .insert({ title, due_date: dueDate || null, memo: memo || null, assignee: assignee || null, type: type || null, project: project || null })
    .select()
    .single();
  if (error) throw new Error(error.message);
  return fromRow(data);
}

export async function getTodo(id) {
  const { data, error } = await supabase.from("todos").select("*").eq("id", id).single();
  if (error) {
    if (error.code === "PGRST116") return null;
    throw new Error(error.message);
  }
  return fromRow(data);
}

export async function listTodos({ status = "all", limit = 50 } = {}) {
  let query = supabase
    .from("todos")
    .select("*")
    .order("due_date", { ascending: true, nullsFirst: false })
    .order("created_at", { ascending: false })
    .limit(limit);
  if (status === "open") query = query.eq("completed", false);
  if (status === "done") query = query.eq("completed", true);
  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return (data ?? []).map(fromRow);
}

export async function updateTodo(id, updates) {
  const dbUpdates = {};
  if ("title" in updates && updates.title != null) dbUpdates.title = updates.title;
  if ("dueDate" in updates) dbUpdates.due_date = updates.dueDate || null;
  if ("memo" in updates) dbUpdates.memo = updates.memo || null;
  if ("assignee" in updates) dbUpdates.assignee = updates.assignee || null;
  if ("type" in updates) dbUpdates.type = updates.type || null;
  if ("project" in updates) dbUpdates.project = updates.project || null;
  if ("issueUrl" in updates) dbUpdates.issue_url = updates.issueUrl || null;
  if (Object.keys(dbUpdates).length === 0) return await getTodo(id);
  const { data, error } = await supabase.from("todos").update(dbUpdates).eq("id", id).select().single();
  if (error) {
    if (error.code === "PGRST116") return null;
    throw new Error(error.message);
  }
  return fromRow(data);
}

export async function setCompleted(id, completed = true) {
  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from("todos")
    .update({ completed, completed_at: completed ? now : null })
    .eq("id", id)
    .select()
    .single();
  if (error) {
    if (error.code === "PGRST116") return null;
    throw new Error(error.message);
  }
  return fromRow(data);
}

export async function deleteTodo(id) {
  const { error, count } = await supabase.from("todos").delete({ count: "exact" }).eq("id", id);
  if (error) throw new Error(error.message);
  return (count ?? 0) > 0;
}

export async function clearCompleted() {
  const { error, count } = await supabase.from("todos").delete({ count: "exact" }).eq("completed", true);
  if (error) throw new Error(error.message);
  return count ?? 0;
}

export async function requestTodo(id) {
  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from("todos")
    .update({ status: "requested", requested_at: now })
    .eq("id", id)
    .select()
    .single();
  if (error) {
    if (error.code === "PGRST116") return null;
    throw new Error(error.message);
  }
  return fromRow(data);
}

// --- Subtask operations (stored as jsonb in todos.subtasks) ---

export async function addSubtask(todoId, title) {
  const todo = await getTodo(todoId);
  if (!todo) return null;
  const subtask = { id: randomUUID(), title, completed: false };
  const subtasks = [...(todo.subtasks ?? []), subtask];
  const { data, error } = await supabase.from("todos").update({ subtasks }).eq("id", todoId).select().single();
  if (error) throw new Error(error.message);
  return { todo: fromRow(data), subtask };
}

export async function toggleSubtask(todoId, subtaskId, completed) {
  const todo = await getTodo(todoId);
  if (!todo) return null;
  const subs = [...(todo.subtasks ?? [])];
  const si = subs.findIndex((s) => s.id === subtaskId);
  if (si === -1) return null;
  subs[si] = { ...subs[si], completed };
  const { data, error } = await supabase.from("todos").update({ subtasks: subs }).eq("id", todoId).select().single();
  if (error) throw new Error(error.message);
  return { todo: fromRow(data), subtask: subs[si] };
}

export async function updateSubtask(todoId, subtaskId, updates) {
  const todo = await getTodo(todoId);
  if (!todo) return null;
  const subs = [...(todo.subtasks ?? [])];
  const si = subs.findIndex((s) => s.id === subtaskId);
  if (si === -1) return null;
  if ("title" in updates && updates.title) subs[si].title = updates.title;
  if ("completed" in updates) subs[si].completed = updates.completed;
  const { data, error } = await supabase.from("todos").update({ subtasks: subs }).eq("id", todoId).select().single();
  if (error) throw new Error(error.message);
  return { todo: fromRow(data), subtask: subs[si] };
}

export async function deleteSubtask(todoId, subtaskId) {
  const todo = await getTodo(todoId);
  if (!todo) return null;
  const before = (todo.subtasks ?? []).length;
  const subtasks = (todo.subtasks ?? []).filter((s) => s.id !== subtaskId);
  if (subtasks.length === before) return null;
  const { data, error } = await supabase.from("todos").update({ subtasks }).eq("id", todoId).select().single();
  if (error) throw new Error(error.message);
  return fromRow(data);
}
