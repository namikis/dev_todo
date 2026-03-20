import "dotenv/config";
import { spawn } from "node:child_process";
import process from "node:process";

import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY,
);

async function updateStatus(id, status, { result = null, reportUrl = null, prUrl = null } = {}) {
  const updates = { status };
  if (result !== null) updates.result = result;
  if (reportUrl !== null) updates.report_url = reportUrl;
  if (prUrl !== null) updates.pr_url = prUrl;
  const { error } = await supabase.from("todos").update(updates).eq("id", id);
  if (error) console.error(`[runner] DB update error:`, error.message);
}

function buildPrompt(todo) {
  const body = todo.memo ? `\n\n${todo.memo}` : "";
  if (todo.type === "research") {
    return `以下のタスクについて調査し、詳細なレポートをMarkdown形式で出力してください。\n\n# ${todo.title}${body}`;
  }
  if (todo.type === "implement") {
    return `以下のタスクを実装してください。ブランチを切り、変更をコミットして、PRを作成するところまで行ってください。\n\n# ${todo.title}${body}`;
  }
  return `以下のタスクを実行してください。\n\n# ${todo.title}${body}`;
}

function runClaude(prompt) {
  return new Promise((resolve, reject) => {
    const proc = spawn("claude", ["-p", prompt], {
      env: process.env,
      timeout: 10 * 60 * 1000,
    });
    let stdout = "";
    let stderr = "";
    proc.stdout.on("data", (d) => { stdout += d.toString(); });
    proc.stderr.on("data", (d) => { stderr += d.toString(); });
    proc.on("close", (code) => {
      if (code === 0) resolve(stdout.trim());
      else reject(new Error(`claude exited with code ${code}\n${stderr.slice(0, 500)}`));
    });
    proc.on("error", reject);
  });
}

function extractPrUrl(output) {
  const match = output.match(/https:\/\/github\.com\/[^\s]+\/pull\/\d+/);
  return match ? match[0] : null;
}

async function processTask(row) {
  const id = row.id;
  console.log(`[runner] Start: ${id} "${row.title}"`);
  await updateStatus(id, "running");

  try {
    const prompt = buildPrompt(row);
    const result = await runClaude(prompt);

    if (row.type === "research") {
      await supabase.from("reports").insert({ todo_id: id, content: result });
      await updateStatus(id, "done", { result, reportUrl: `/reports/${id}` });
    } else if (row.type === "implement") {
      const prUrl = extractPrUrl(result);
      await updateStatus(id, "done", { result, prUrl });
    } else {
      await updateStatus(id, "done", { result });
    }
    console.log(`[runner] Done: ${id}`);
  } catch (err) {
    console.error(`[runner] Error: ${id}`, err.message);
    await updateStatus(id, "error", { result: err.message });
  }
}

// 起動時に既存の requested タスクを処理
async function checkExisting() {
  const { data, error } = await supabase.from("todos").select("*").eq("status", "requested");
  if (error) { console.error("[runner] checkExisting error:", error.message); return; }
  for (const row of data ?? []) await processTask(row);
}

// Supabase Realtime で status=requested の変更を監視
supabase
  .channel("agent-runner")
  .on(
    "postgres_changes",
    { event: "UPDATE", schema: "public", table: "todos" },
    async (payload) => {
      if (payload.new.status === "requested") {
        await processTask(payload.new);
      }
    },
  )
  .subscribe((status) => {
    console.log(`[runner] Realtime: ${status}`);
  });

console.log("[runner] Listening for tasks...");
checkExisting().catch(console.error);
