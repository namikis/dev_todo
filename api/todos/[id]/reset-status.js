import { requireAuth } from "../../_lib/auth.js";
import { resetTodoStatus } from "../../../todo-store.js";

export default async function handler(req, res) {
  try {
    if (req.method !== "POST") return res.status(405).end("method not allowed");
    const user = await requireAuth(req, res);
    if (!user) return;
    const { id } = req.query;
    const todo = await resetTodoStatus(id);
    if (!todo) return res.status(404).end("not found");
    res.json({ todo });
  } catch (err) {
    res.status(500).end(err.message);
  }
}
