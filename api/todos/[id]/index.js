import { z } from "zod";
import { updateTodo, setCompleted, deleteTodo } from "../../../todo-store.js";

const PatchSchema = z.object({
  completed: z.boolean().optional(),
  title: z.string().min(1).optional(),
  dueDate: z.string().nullable().optional(),
  memo: z.string().nullable().optional(),
  assignee: z.enum(["Claude", "Tairyu"]).nullable().optional(),
  type: z.enum(["research", "implement"]).nullable().optional(),
  project: z.string().nullable().optional(),
});

export default async function handler(req, res) {
  try {
    const { id } = req.query;
    if (req.method === "PATCH") {
      const body = PatchSchema.parse(req.body);
      if ("completed" in body) {
        const todo = await setCompleted(id, body.completed);
        if (!todo) return res.status(404).end("not found");
        const rest = { ...body };
        delete rest.completed;
        if (Object.keys(rest).length > 0) {
          const updated = await updateTodo(id, rest);
          if (updated) return res.json({ todo: updated });
        }
        return res.json({ todo });
      }
      const todo = await updateTodo(id, body);
      if (!todo) return res.status(404).end("not found");
      return res.json({ todo });
    }
    if (req.method === "DELETE") {
      const ok = await deleteTodo(id);
      if (!ok) return res.status(404).end("not found");
      return res.json({ ok: true });
    }
    res.status(405).end("method not allowed");
  } catch (err) {
    res.status(500).end(err.message);
  }
}
