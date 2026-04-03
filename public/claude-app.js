// claude-app.js — Claude Code ドキュメントページ

const $ = (id) => document.getElementById(id);

// ---- Markdown renderer (same as app.js) ----
function escHtml(s) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
function mdInline(s) {
  s = escHtml(s);
  s = s.replace(/`([^`]+)`/g, "<code>$1</code>");
  s = s.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
  s = s.replace(/\*([^*]+)\*/g, "<em>$1</em>");
  s = s.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>');
  return s;
}
function renderMarkdown(md) {
  const lines = md.split("\n");
  let html = "";
  let inCode = false;
  let inTable = false;
  let inList = false;
  let codeLines = [];

  const flushList = () => { if (inList) { html += "</ul>"; inList = false; } };
  const flushTable = () => { if (inTable) { html += "</tbody></table>"; inTable = false; } };

  for (const line of lines) {
    if (line.startsWith("```")) {
      if (inCode) {
        html += `<pre><code>${codeLines.map(escHtml).join("\n")}</code></pre>`;
        codeLines = [];
        inCode = false;
      } else {
        flushList(); flushTable();
        inCode = true;
      }
      continue;
    }
    if (inCode) { codeLines.push(line); continue; }

    if (/^#{1,6} /.test(line)) {
      flushList(); flushTable();
      const level = line.match(/^(#+)/)[1].length;
      html += `<h${level}>${mdInline(line.replace(/^#+\s+/, ""))}</h${level}>`;
      continue;
    }
    if (line.trim() === "---") { flushList(); flushTable(); html += "<hr>"; continue; }
    if (line.startsWith("> ")) {
      flushList(); flushTable();
      html += `<blockquote>${mdInline(line.slice(2))}</blockquote>`;
      continue;
    }
    if (line.startsWith("- ") || line.startsWith("* ")) {
      flushTable();
      if (!inList) { html += "<ul>"; inList = true; }
      html += `<li>${mdInline(line.slice(2))}</li>`;
      continue;
    }
    if (line.startsWith("|")) {
      flushList();
      const cells = line.split("|").filter((_, ci, a) => ci > 0 && ci < a.length - 1);
      const isSep = cells.every((c) => /^[\s\-:]+$/.test(c));
      if (!inTable) {
        html += `<table><thead><tr>${cells.map((c) => `<th>${mdInline(c.trim())}</th>`).join("")}</tr></thead><tbody>`;
        inTable = true;
      } else if (!isSep) {
        html += `<tr>${cells.map((c) => `<td>${mdInline(c.trim())}</td>`).join("")}</tr>`;
      }
      continue;
    }
    flushTable();
    if (line.trim() === "") { flushList(); continue; }
    flushList();
    html += `<p>${mdInline(line)}</p>`;
  }
  flushList(); flushTable();
  return html;
}

// ---- API helpers ----
async function apiFetch(path) {
  const res = await fetch(path);
  if (!res.ok) throw new Error(await res.text());
  return res;
}

// ---- Entry type detection ----
function detectEntryType(text) {
  const t = text.trim().toLowerCase();
  if (t.startsWith("added") || t.startsWith("new ")) return "added";
  if (t.startsWith("fixed") || t.startsWith("fix ")) return "fixed";
  if (t.startsWith("improved") || t.startsWith("updated") || t.startsWith("simplified") || t.startsWith("reduced") || t.startsWith("enhanced")) return "improved";
  return "other";
}

function entryTagHTML(type) {
  const map = {
    added: ["追加", "tag-added"],
    fixed: ["修正", "tag-fixed"],
    improved: ["改善", "tag-improved"],
    other: ["変更", "tag-other"],
  };
  const [label, cls] = map[type] ?? map.other;
  return `<span class="diff-entry-tag ${cls}">${label}</span>`;
}

// ---- Render diff sections ----
function renderDiffSections(sections) {
  if (!sections || sections.length === 0) {
    return '<p class="state-msg">該当するバージョンがありません。</p>';
  }
  return sections.map((sec) => {
    const entries = (sec.entries ?? []).map((entry) => {
      const type = detectEntryType(entry);
      return `<li class="diff-entry">${entryTagHTML(type)}<span>${mdInline(entry)}</span></li>`;
    }).join("");
    return `
      <div class="diff-version-section">
        <h3 class="diff-version-title">
          <span class="version-tag">v${sec.version}</span>
        </h3>
        <ul class="diff-entries">${entries || '<li class="diff-entry"><span>（詳細なし）</span></li>'}</ul>
      </div>`;
  }).join("");
}

// ---- Tab switching ----
const tabs = document.querySelectorAll(".claude-tab");
tabs.forEach((tab) => {
  tab.addEventListener("click", () => {
    tabs.forEach((t) => t.classList.remove("active"));
    tab.classList.add("active");
    document.querySelectorAll(".tab-panel").forEach((p) => p.classList.remove("active"));
    $(`tab-${tab.dataset.tab}`).classList.add("active");
  });
});

// ---- Load features ----
async function loadFeatures() {
  const el = $("featuresContent");
  try {
    const res = await apiFetch("/api/claude/features");
    const text = await res.text();
    el.innerHTML = renderMarkdown(text);
  } catch (e) {
    el.innerHTML = `<p class="state-msg">機能カタログが見つかりません。<br><code>npm run claude:update</code> を実行してください。<br><small>${e.message}</small></p>`;
  }
}

// ---- Load versions ----
async function loadVersions() {
  const badge = $("versionBadge");
  const fromSel = $("fromVersion");
  const toSel = $("toVersion");
  try {
    const res = await apiFetch("/api/claude/versions");
    const { versions, latest } = await res.json();

    badge.textContent = `v${latest}`;

    fromSel.innerHTML = "";
    toSel.innerHTML = "";
    versions.forEach((v, i) => {
      const o1 = new Option(`v${v}`, v);
      const o2 = new Option(`v${v}`, v);
      // Default: from = second latest, to = latest
      if (i === 1) o1.selected = true;
      if (i === 0) o2.selected = true;
      fromSel.append(o1);
      toSel.append(o2);
    });
  } catch (e) {
    badge.textContent = "—";
    fromSel.innerHTML = `<option>取得失敗</option>`;
    toSel.innerHTML = `<option>取得失敗</option>`;
  }
}

// ---- Load diff ----
async function loadDiff() {
  const from = $("fromVersion").value;
  const to = $("toVersion").value;
  const resultEl = $("diffResult");

  if (from === to) {
    resultEl.innerHTML = '<p class="state-msg">From と To が同じバージョンです。</p>';
    return;
  }

  resultEl.innerHTML = '<p class="state-msg">差分を取得中…</p>';
  try {
    const res = await apiFetch(`/api/claude/diff?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`);
    const { sections } = await res.json();
    resultEl.innerHTML = `<div class="diff-result">${renderDiffSections(sections)}</div>`;
  } catch (e) {
    resultEl.innerHTML = `<p class="state-msg">取得に失敗: ${e.message}</p>`;
  }
}

$("showDiffBtn").addEventListener("click", loadDiff);

// ---- Update docs ----
async function updateDocs() {
  const btn = $("updateBtn");
  const tsEl = $("updatedAt");
  btn.disabled = true;
  btn.textContent = "更新中…";
  try {
    const res = await fetch("/api/claude/update", { method: "POST" });
    if (!res.ok) throw new Error(await res.text());
    const { version, features, updatedAt } = await res.json();

    // バージョンバッジ更新
    $("versionBadge").textContent = `v${version}`;

    // 機能カタログを最新内容で差し替え
    $("featuresContent").innerHTML = renderMarkdown(features);

    // タイムスタンプ表示
    const d = new Date(updatedAt);
    tsEl.textContent = `更新: ${d.toLocaleString("ja-JP", { month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit" })}`;

    // バージョン一覧も再読込
    await loadVersions();
  } catch (e) {
    alert(`更新に失敗しました: ${e.message}`);
  } finally {
    btn.disabled = false;
    btn.textContent = "更新";
  }
}

$("updateBtn").addEventListener("click", updateDocs);

// ---- Load official docs ----
let officialDocsLoaded = false;
async function loadOfficialDocs() {
  if (officialDocsLoaded) return;
  officialDocsLoaded = true;
  const el = $("officialContent");
  try {
    const res = await apiFetch("/api/claude/official-docs");
    const text = await res.text();
    el.innerHTML = renderMarkdown(text);
  } catch (e) {
    el.innerHTML = `<p class="state-msg">公式ドキュメントが見つかりません。<br><code>npm run docs:official</code> を実行してください。<br><small>${e.message}</small></p>`;
  }
}

// ---- Load releases (日本語リリースノート) ----
let releasesLoaded = false;
async function loadReleases() {
  if (releasesLoaded) return;
  releasesLoaded = true;
  const el = $("releasesContent");
  try {
    const res = await apiFetch("/api/claude/releases-ja");
    const text = await res.text();
    el.innerHTML = renderMarkdown(text);
  } catch (e) {
    el.innerHTML = `<p class="state-msg">日本語リリースノートが見つかりません。<br><code>npm run claude:update</code> を実行してください。<br><small>${e.message}</small></p>`;
  }
}

// 公式ドキュメント・リリースノートタブが選択されたときに遅延ロード
tabs.forEach((tab) => {
  if (tab.dataset.tab === "official") {
    tab.addEventListener("click", loadOfficialDocs);
  }
  if (tab.dataset.tab === "releases") {
    tab.addEventListener("click", loadReleases);
  }
});

// ---- Init ----
loadFeatures();
loadVersions();
