/**
 * タスク完了時に result / prUrl / reportUrl を DB に書き戻すヘルパー。
 * 依存ゼロ — Node.js 組み込みの fetch のみ使用。
 *
 * Usage:
 *   node finalize-task.mjs <task_id> <status> [--pr-url=URL] [--report-url=URL] [--result=TEXT]
 *
 * 環境変数: SUPABASE_URL, SUPABASE_SERVICE_KEY
 */

const args = process.argv.slice(2);
const taskId = args[0];
const status = args[1];

if (!taskId || !status) {
  console.error("Usage: node finalize-task.mjs <task_id> <status> [--pr-url=URL] [--report-url=URL] [--result=TEXT]");
  process.exit(1);
}

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error("SUPABASE_URL and SUPABASE_SERVICE_KEY are required");
  process.exit(1);
}

function getFlag(name) {
  const prefix = `--${name}=`;
  const arg = args.find((a) => a.startsWith(prefix));
  return arg ? arg.slice(prefix.length) : null;
}

const updates = { status };
const prUrl = getFlag("pr-url");
const reportUrl = getFlag("report-url");
const result = getFlag("result");
const issueUrl = getFlag("issue-url");

if (prUrl) updates.pr_url = prUrl;
if (reportUrl) updates.report_url = reportUrl;
if (result) updates.result = result;
if (issueUrl) updates.issue_url = issueUrl;

const url = `${SUPABASE_URL}/rest/v1/todos?id=eq.${encodeURIComponent(taskId)}`;
const res = await fetch(url, {
  method: "PATCH",
  headers: {
    apikey: SUPABASE_KEY,
    Authorization: `Bearer ${SUPABASE_KEY}`,
    "Content-Type": "application/json",
    Prefer: "return=minimal",
  },
  body: JSON.stringify(updates),
});

if (!res.ok) {
  const body = await res.text();
  console.error(`Failed to finalize task: ${res.status} ${body}`);
  process.exit(1);
}

console.log(`Task ${taskId} finalized: status=${status}` +
  (prUrl ? ` prUrl=${prUrl}` : "") +
  (reportUrl ? ` reportUrl=${reportUrl}` : "") +
  (issueUrl ? ` issueUrl=${issueUrl}` : "") +
  (result ? ` result=(set)` : ""));
