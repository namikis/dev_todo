import { z } from "zod";
import { addTodo, listTodos } from "../../todo-store.js";
import { requireAuth } from "../_lib/auth.js";

const AddSchema = z.object({
  title: z.string().min(1),
  dueDate: z.string().nullable().optional(),
  memo: z.string().nullable().optional(),
  assignee: z.enum(["Claude", "Tairyu"]).nullable().optional(),
  type: z.enum(["research", "implement"]).nullable().optional(),
  project: z.string().nullable().optional(),
});

export default async function handler(req, res) {
  try {
    if (req.method === "GET") {
      const status = req.query.status ?? "all";
      const limit = Number(req.query.limit ?? "50");
      const todos = await listTodos({
        status: ["open", "done", "all"].includes(status) ? status : "all",
        limit: Number.isFinite(limit) ? Math.max(1, Math.min(200, Math.trunc(limit))) : 50,
      });
      return res.json({ todos });
    }
    if (req.method === "POST") {
      const user = await requireAuth(req, res);
      if (!user) return;
      const body = AddSchema.parse(req.body);
      const todo = await addTodo(body.title, {
        dueDate: body.dueDate ?? null,
        memo: body.memo ?? null,
        assignee: body.assignee ?? null,
        type: body.type ?? null,
        project: body.project ?? null,
      });
      return res.json({ todo });
    }
    res.status(405).end("method not allowed");
  } catch (err) {
    res.status(500).end(err.message);
  }
}
