import { z } from "zod";
import { addSubtask } from "../../../../todo-store.js";
import { requireAuth } from "../../../_lib/auth.js";

const SubtaskAddSchema = z.object({ title: z.string().min(1) });

export default async function handler(req, res) {
  try {
    if (req.method !== "POST") return res.status(405).end("method not allowed");
    const user = await requireAuth(req, res);
    if (!user) return;
    const { id } = req.query;
    const body = SubtaskAddSchema.parse(req.body);
    const result = await addSubtask(id, body.title);
    if (!result) return res.status(404).end("todo not found");
    res.json({ todo: result.todo, subtask: result.subtask });
  } catch (err) {
    res.status(500).end(err.message);
  }
}
