import { z } from "zod";
import { updateSubtask, deleteSubtask } from "../../../../todo-store.js";
import { requireAuth } from "../../../_lib/auth.js";

const SubtaskPatchSchema = z.object({
  completed: z.boolean().optional(),
  title: z.string().min(1).optional(),
});

export default async function handler(req, res) {
  try {
    const { id, subtaskId } = req.query;
    const user = await requireAuth(req, res);
    if (!user) return;
    if (req.method === "PATCH") {
      const body = SubtaskPatchSchema.parse(req.body);
      const result = await updateSubtask(id, subtaskId, body);
      if (!result) return res.status(404).end("not found");
      return res.json({ todo: result.todo, subtask: result.subtask });
    }
    if (req.method === "DELETE") {
      const todo = await deleteSubtask(id, subtaskId);
      if (!todo) return res.status(404).end("not found");
      return res.json({ todo });
    }
    res.status(405).end("method not allowed");
  } catch (err) {
    res.status(500).end(err.message);
  }
}
