import { clearCompleted } from "../../todo-store.js";
import { requireAuth } from "../_lib/auth.js";

export default async function handler(req, res) {
  try {
    if (req.method !== "POST") return res.status(405).end("method not allowed");
    const user = await requireAuth(req, res);
    if (!user) return;
    const { confirm } = req.body ?? {};
    if (!confirm) return res.status(400).end("confirm required");
    const removed = await clearCompleted();
    res.json({ removed });
  } catch (err) {
    res.status(500).end(err.message);
  }
}
