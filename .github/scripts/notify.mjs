/**
 * ワークフロー完了時のメール通知ヘルパー。
 * 依存ゼロ — Node.js 組み込みの fetch のみ使用。
 * Resend API を使用してメール送信。
 *
 * Usage:
 *   node notify.mjs <task_id> <status> [--title=TEXT] [--issue-url=URL] [--pr-url=URL] [--report-url=URL] [--result=TEXT]
 *
 * 環境変数: RESEND_API_KEY, NOTIFICATION_EMAIL
 * 未設定時はスキップ（exit 0）。
 */

const args = process.argv.slice(2);
const taskId = args[0] || "unknown";
const status = args[1] || "unknown";

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const NOTIFICATION_EMAIL = process.env.NOTIFICATION_EMAIL;

if (!RESEND_API_KEY || !NOTIFICATION_EMAIL) {
  console.log("RESEND_API_KEY or NOTIFICATION_EMAIL not set, skipping notification");
  process.exit(0);
}

function getFlag(name) {
  const prefix = `--${name}=`;
  const arg = args.find((a) => a.startsWith(prefix));
  return arg ? arg.slice(prefix.length) : null;
}

const title = getFlag("title") || "Unknown task";
const issueUrl = getFlag("issue-url");
const prUrl = getFlag("pr-url");
const reportUrl = getFlag("report-url");
const result = getFlag("result");

const statusLabel = {
  running: "PRマージ待ち",
  blocked: "ユーザー対応待ち",
  done: "完了",
  error: "エラー",
  "review-fixed": "レビュー修正完了",
}[status] || status;

const statusColor = {
  running: "#2563eb",
  blocked: "#f59e0b",
  done: "#16a34a",
  error: "#dc2626",
  "review-fixed": "#8b5cf6",
}[status] || "#6b7280";

const links = [
  reportUrl && `<a href="${reportUrl}">Actions ログ</a>`,
  issueUrl && `<a href="${issueUrl}">Issue</a>`,
  prUrl && `<a href="${prUrl}">Pull Request</a>`,
].filter(Boolean).join(" | ");

const html = `
<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 480px;">
  <h2 style="margin: 0 0 12px 0; font-size: 16px; color: #1a1a1a;">${title}</h2>
  <p style="margin: 0 0 12px 0;">
    <span style="display: inline-block; padding: 4px 12px; border-radius: 12px; background: ${statusColor}; color: white; font-size: 13px; font-weight: 600;">
      ${statusLabel}
    </span>
  </p>
  ${result ? `<p style="margin: 0 0 12px 0; color: #4a4a4a; font-size: 14px;">${result}</p>` : ""}
  ${links ? `<p style="margin: 0; font-size: 13px; color: #6b7280;">${links}</p>` : ""}
  <hr style="margin: 16px 0; border: none; border-top: 1px solid #e5e7eb;" />
  <p style="margin: 0; font-size: 11px; color: #9ca3af;">Task ID: ${taskId}</p>
</div>
`;

const subject = `[dev_todo] ${title} → ${statusLabel}`;

try {
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: "dev_todo <onboarding@resend.dev>",
      to: [NOTIFICATION_EMAIL],
      subject,
      html,
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    console.error(`Notification failed: ${res.status} ${body}`);
  } else {
    console.log(`Notification sent: ${subject}`);
  }
} catch (err) {
  console.error(`Notification error: ${err.message}`);
}
