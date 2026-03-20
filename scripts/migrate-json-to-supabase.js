import "dotenv/config";
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY,
);

const todos = JSON.parse(
  readFileSync(new URL("../data/todos.json", import.meta.url), "utf-8"),
);

const rows = todos.map((t) => ({
  id: t.id,
  title: t.title,
  completed: t.completed,
  created_at: t.createdAt,
  completed_at: t.completedAt ?? null,
  due_date: t.dueDate ?? null,
  memo: t.memo ?? null,
  assignee: t.assignee ?? null,
  type: t.type ?? null,
  subtasks: t.subtasks ?? [],
  status: t.status ?? "open",
  result: t.result ?? null,
  report_url: t.reportUrl ?? null,
  pr_url: t.prUrl ?? null,
  requested_at: t.requestedAt ?? null,
}));

const { error } = await supabase.from("todos").insert(rows);
if (error) {
  console.error("移行失敗:", error.message);
  process.exit(1);
}
console.log(`移行完了: ${rows.length} 件`);
