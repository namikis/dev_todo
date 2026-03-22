import { requestTodo, getTodo } from "../../../todo-store.js";
import { requireAuth } from "../../_lib/auth.js";

async function triggerGitHubWorkflow(todo) {
  const pat = process.env.GITHUB_PAT;
  if (!pat) return { dispatched: false, reason: "GITHUB_PAT not set" };

  const url = "https://api.github.com/repos/namikis/dev_todo/actions/workflows/run-task.yml/dispatches";
  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${pat}`,
      Accept: "application/vnd.github.v3+json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      ref: "main",
      inputs: {
        task_id: todo.id,
        title: todo.title,
        memo: todo.memo ?? "",
        type: todo.type ?? "implement",
      },
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    console.error(`[request] workflow_dispatch failed: ${res.status} ${body}`);
    return { dispatched: false, reason: `GitHub API ${res.status}: ${body}` };
  }
  return { dispatched: true };
}

export default async function handler(req, res) {
  try {
    if (req.method !== "POST") return res.status(405).end("method not allowed");
    const user = await requireAuth(req, res);
    if (!user) return;
    const { id } = req.query;
    const todo = await requestTodo(id);
    if (!todo) return res.status(404).end("not found");

    const dispatch = await triggerGitHubWorkflow(todo);
    res.json({ todo, dispatch });
  } catch (err) {
    res.status(500).end(err.message);
  }
}
