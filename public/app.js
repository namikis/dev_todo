const $ = (id) => document.getElementById(id);

// --- Auth ---
let supabase = null;
let accessToken = null;
let isLoggedIn = false;

async function initAuth() {
  try {
    const res = await fetch("/api/auth/config");
    const { supabaseUrl, supabaseAnonKey } = await res.json();
    if (!supabaseUrl || !supabaseAnonKey) {
      // テスト環境など、Supabase未設定の場合は全機能有効
      isLoggedIn = true;
      updateAuthUI();
      return;
    }
    supabase = window.supabase.createClient(supabaseUrl, supabaseAnonKey);

    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      accessToken = session.access_token;
      isLoggedIn = true;
    }

    supabase.auth.onAuthStateChange((_event, session) => {
      accessToken = session?.access_token ?? null;
      isLoggedIn = !!session;
      updateAuthUI();
      refresh().catch(() => {});
    });
  } catch {
    // auth unavailable — read-only mode
  }
  updateAuthUI();
}

function updateAuthUI() {
  $("authLoading").hidden = true;
  $("authLoggedOut").hidden = isLoggedIn;
  $("authLoggedIn").hidden = !isLoggedIn;
  if (isLoggedIn && supabase) {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) $("userEmail").textContent = user.email;
    });
  }
  // Hide/show write controls
  const addForm = $("addForm");
  if (addForm) addForm.style.display = isLoggedIn ? "" : "none";
}

$("loginForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const email = $("loginEmail").value.trim();
  const password = $("loginPassword").value;
  const errEl = $("loginError");
  const loginBtn = e.target.querySelector('button[type="submit"]');
  errEl.hidden = true;
  await withLoading(loginBtn, async () => {
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        errEl.textContent = error.message;
        errEl.hidden = false;
      }
    } catch (err) {
      errEl.textContent = err.message;
      errEl.hidden = false;
    }
  });
});

$("logoutBtn").addEventListener("click", async () => {
  await supabase.auth.signOut();
});

// --- Markdown renderer ---
function escHtml(s) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
function mdInline(s) {
  s = escHtml(s);
  s = s.replace(/`([^`]+)`/g, "<code>$1</code>");
  s = s.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
  s = s.replace(/\*([^*]+)\*/g, "<em>$1</em>");
  s = s.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank">$1</a>');
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

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

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
    if (line.trim() === "---" || line.trim() === "***") {
      flushList(); flushTable();
      html += "<hr>";
      continue;
    }
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
    if (line.trim() === "") {
      flushList();
      html += "";
      continue;
    }
    flushList();
    html += `<p>${mdInline(line)}</p>`;
  }
  flushList(); flushTable();
  return html;
}

// --- Docs modal ---
let docsOverlay = null;
let docsActiveTab = "spec";

function createDocsModal() {
  const overlay = document.createElement("div");
  overlay.className = "docs-overlay";
  overlay.addEventListener("click", (e) => { if (e.target === overlay) closeDocsModal(); });

  const modal = document.createElement("div");
  modal.className = "docs-modal";

  const header = document.createElement("div");
  header.className = "docs-modal-header";

  const tabsEl = document.createElement("div");
  tabsEl.className = "docs-modal-tabs";

  const tabs = [
    { id: "spec", label: "プロジェクト仕様書" },
    { id: "claude", label: "Claude Code 機能" },
    { id: "diff", label: "差分レポート" },
  ];

  const body = document.createElement("div");
  body.className = "docs-modal-body";

  function setTab(tabId) {
    docsActiveTab = tabId;
    tabsEl.querySelectorAll(".docs-tab").forEach((t) => {
      t.classList.toggle("active", t.dataset.tab === tabId);
    });
    loadDocsContent(tabId, body);
  }

  for (const tab of tabs) {
    const btn = document.createElement("button");
    btn.className = "docs-tab" + (tab.id === docsActiveTab ? " active" : "");
    btn.dataset.tab = tab.id;
    btn.textContent = tab.label;
    btn.addEventListener("click", () => setTab(tab.id));
    tabsEl.append(btn);
  }

  const closeBtn = document.createElement("button");
  closeBtn.className = "docs-close";
  closeBtn.textContent = "✕";
  closeBtn.addEventListener("click", closeDocsModal);

  header.append(tabsEl, closeBtn);
  modal.append(header, body);
  overlay.append(modal);

  document.addEventListener("keydown", onDocsKeydown);
  loadDocsContent(docsActiveTab, body);
  return overlay;
}

function onDocsKeydown(e) {
  if (e.key === "Escape") closeDocsModal();
}

function closeDocsModal() {
  if (docsOverlay) {
    docsOverlay.remove();
    docsOverlay = null;
    document.removeEventListener("keydown", onDocsKeydown);
  }
}

async function loadDocsContent(tab, bodyEl) {
  const pathMap = {
    spec: "/api/docs/spec",
    claude: "/api/docs/claude",
    diff: "/api/docs/diff",
  };
  bodyEl.innerHTML = '<div class="docs-loading">読み込み中...</div>';
  try {
    const res = await fetch(pathMap[tab]);
    const content = await res.text();
    const wrapper = document.createElement("div");
    wrapper.className = "md-content";
    wrapper.innerHTML = renderMarkdown(content);
    bodyEl.innerHTML = "";
    bodyEl.append(wrapper);
  } catch (e) {
    bodyEl.innerHTML = `<div class="docs-loading">取得に失敗しました: ${e.message}</div>`;
  }
}

const els = {
  addForm: $("addForm"),
  title: $("title"),
  dueDate: $("dueDate"),
  assignee: $("assignee"),
  type: $("type"),
  project: $("project"),
  projectList: $("projectList"),
  list: $("list"),
  filter: $("filter"),
  assigneeFilter: $("assigneeFilter"),
  projectFilter: $("projectFilter"),
  search: $("search"),
  refresh: $("refresh"),
  summary: $("summary"),
  completedSection: $("completedSection"),
  toggleCompleted: $("toggleCompleted"),
  completedList: $("completedList"),
  error: $("error"),
};

// Track which todo detail panels are open
const openDetails = new Set();
let showCompleted = false;
let cachedTodos = null;

// Loading helper: disables button, shows spinner, re-enables on completion
async function withLoading(btn, fn) {
  if (!btn) return fn();
  btn.disabled = true;
  btn.classList.add("loading");
  try {
    return await fn();
  } finally {
    btn.disabled = false;
    btn.classList.remove("loading");
  }
}

// Re-render from cache (no API call)
function rerender() {
  if (cachedTodos) render(cachedTodos);
}

function showError(message) {
  if (!message) {
    els.error.hidden = true;
    els.error.textContent = "";
    return;
  }
  els.error.hidden = false;
  els.error.textContent = message;
}

async function api(path, options) {
  const headers = { "content-type": "application/json" };
  if (accessToken) headers["authorization"] = `Bearer ${accessToken}`;
  const res = await fetch(path, {
    headers,
    ...options,
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(text || `${res.status} ${res.statusText}`);
  }
  return await res.json();
}

function isOverdue(dateStr) {
  if (!dateStr) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return new Date(dateStr) < today;
}

// Sort: dueDate ascending (nulls last), then createdAt descending
function sortTodos(todos) {
  return [...todos].sort((a, b) => {
    // Both have dueDate
    if (a.dueDate && b.dueDate) return a.dueDate.localeCompare(b.dueDate);
    // Only one has dueDate — it comes first
    if (a.dueDate && !b.dueDate) return -1;
    if (!a.dueDate && b.dueDate) return 1;
    // Neither has dueDate — newer first
    return b.createdAt.localeCompare(a.createdAt);
  });
}

// Group by project, alphabetical, null last
function groupByProject(todos) {
  const map = new Map();
  for (const t of todos) {
    const key = t.project ?? null;
    if (!map.has(key)) map.set(key, []);
    map.get(key).push(t);
  }
  const entries = [...map.entries()].sort(([a], [b]) => {
    if (a && b) return a.localeCompare(b);
    if (a && !b) return -1;
    return 1;
  });
  return entries.map(([project, items]) => ({ project, items }));
}

// Group sorted todos by dueDate, dates ascending, null last
function groupByDueDate(todos) {
  const map = new Map();
  for (const t of todos) {
    const key = t.dueDate ?? null;
    if (!map.has(key)) map.set(key, []);
    map.get(key).push(t);
  }
  const entries = [...map.entries()].sort(([a], [b]) => {
    if (a && b) return a.localeCompare(b);
    if (a && !b) return -1;
    return 1;
  });
  return entries.map(([date, items]) => ({ date, items }));
}

function renderSubtasks(todo, container) {
  container.innerHTML = "";

  const header = document.createElement("div");
  header.className = "subtask-header";
  header.textContent = `サブタスク (${(todo.subtasks ?? []).filter((s) => s.completed).length}/${(todo.subtasks ?? []).length})`;
  container.append(header);

  const ul = document.createElement("ul");
  ul.className = "subtask-list";

  for (const sub of todo.subtasks ?? []) {
    const li = document.createElement("li");
    li.className = `subtask-item ${sub.completed ? "done" : ""}`;

    const cb = document.createElement("input");
    cb.type = "checkbox";
    cb.checked = sub.completed;
    cb.disabled = !isLoggedIn;
    cb.addEventListener("change", async () => {
      cb.disabled = true;
      try {
        await api(`/api/todos/${encodeURIComponent(todo.id)}/subtasks/${encodeURIComponent(sub.id)}`, {
          method: "PATCH",
          body: JSON.stringify({ completed: cb.checked }),
        });
        await refresh();
      } catch (e) {
        showError(e.message);
        cb.checked = !cb.checked;
      } finally {
        cb.disabled = false;
      }
    });

    const span = document.createElement("span");
    span.className = "subtask-title";
    span.textContent = sub.title;
    span.addEventListener("dblclick", () => {
      if (!isLoggedIn) return;
      const input = document.createElement("input");
      input.type = "text";
      input.className = "inline-edit";
      input.value = sub.title;
      span.replaceWith(input);
      input.focus();
      input.select();
      let saved = false;
      const save = async () => {
        if (saved) return;
        saved = true;
        const newTitle = input.value.trim();
        if (newTitle && newTitle !== sub.title) {
          try {
            await api(`/api/todos/${encodeURIComponent(todo.id)}/subtasks/${encodeURIComponent(sub.id)}`, {
              method: "PATCH",
              body: JSON.stringify({ title: newTitle }),
            });
          } catch (e) {
            showError(e.message);
          }
        }
        await refresh();
      };
      input.addEventListener("blur", save);
      input.addEventListener("keydown", (e) => {
        if (e.isComposing) return;
        if (e.key === "Enter") { e.preventDefault(); input.blur(); }
        if (e.key === "Escape") { input.value = sub.title; input.blur(); }
      });
    });

    if (isLoggedIn) {
      const del = document.createElement("button");
      del.className = "button small danger";
      del.textContent = "×";
      del.addEventListener("click", async () => {
        await withLoading(del, async () => {
          try {
            await api(`/api/todos/${encodeURIComponent(todo.id)}/subtasks/${encodeURIComponent(sub.id)}`, {
              method: "DELETE",
            });
            await refresh();
          } catch (e) {
            showError(e.message);
          }
        });
      });
      li.append(cb, span, del);
    } else {
      li.append(cb, span);
    }
    ul.append(li);
  }

  container.append(ul);

  // Add subtask form (only for logged-in users)
  if (!isLoggedIn) return;
  const addRow = document.createElement("div");
  addRow.className = "subtask-add";
  const input = document.createElement("input");
  input.type = "text";
  input.placeholder = "サブタスクを追加...";
  const addBtn = document.createElement("button");
  addBtn.className = "button small primary";
  addBtn.textContent = "+";
  addBtn.type = "button";

  const doAdd = async () => {
    const title = input.value.trim();
    if (!title) return;
    await withLoading(addBtn, async () => {
      try {
        await api(`/api/todos/${encodeURIComponent(todo.id)}/subtasks`, {
          method: "POST",
          body: JSON.stringify({ title }),
        });
        input.value = "";
        await refresh();
      } catch (e) {
        showError(e.message);
      }
    });
  };

  addBtn.addEventListener("click", doAdd);
  input.addEventListener("keydown", (e) => {
    if (e.isComposing) return;
    if (e.key === "Enter") {
      e.preventDefault();
      doAdd();
    }
  });

  addRow.append(input, addBtn);
  container.append(addRow);
}

function renderDetail(todo, detailEl) {
  detailEl.innerHTML = "";

  // Due date
  const dueRow = document.createElement("div");
  dueRow.className = "detail-row";
  const dueLabel = document.createElement("span");
  dueLabel.className = "detail-label";
  dueLabel.textContent = "実施日";
  const dueInput = document.createElement("input");
  dueInput.type = "date";
  dueInput.className = "detail-input";
  dueInput.value = todo.dueDate ?? "";
  dueInput.disabled = !isLoggedIn;
  dueInput.addEventListener("change", async () => {
    try {
      await api(`/api/todos/${encodeURIComponent(todo.id)}`, {
        method: "PATCH",
        body: JSON.stringify({ dueDate: dueInput.value || null }),
      });
      await refresh();
    } catch (e) {
      showError(e.message);
    }
  });
  if (isLoggedIn) {
    const todayBtn = document.createElement("button");
    todayBtn.className = "button small today-btn";
    todayBtn.type = "button";
    todayBtn.textContent = "今日";
    todayBtn.addEventListener("click", () => {
      dueInput.value = new Date().toLocaleDateString("sv-SE");
      dueInput.dispatchEvent(new Event("change"));
    });
    dueRow.append(dueLabel, dueInput, todayBtn);
  } else {
    dueRow.append(dueLabel, dueInput);
  }

  // Assignee
  const assigneeRow = document.createElement("div");
  assigneeRow.className = "detail-row";
  const assigneeLabel = document.createElement("span");
  assigneeLabel.className = "detail-label";
  assigneeLabel.textContent = "担当";
  const assigneeSelect = document.createElement("select");
  assigneeSelect.className = "detail-input";
  for (const [val, label] of [["", "なし"], ["Tairyu", "Tairyu"], ["Claude", "Claude"]]) {
    const opt = document.createElement("option");
    opt.value = val;
    opt.textContent = label;
    if ((todo.assignee ?? "") === val) opt.selected = true;
    assigneeSelect.append(opt);
  }
  assigneeSelect.disabled = !isLoggedIn;
  assigneeSelect.addEventListener("change", async () => {
    try {
      await api(`/api/todos/${encodeURIComponent(todo.id)}`, {
        method: "PATCH",
        body: JSON.stringify({ assignee: assigneeSelect.value || null }),
      });
      await refresh();
    } catch (e) {
      showError(e.message);
    }
  });
  assigneeRow.append(assigneeLabel, assigneeSelect);

  // Memo
  const memoRow = document.createElement("div");
  memoRow.className = "detail-row";
  const memoLabel = document.createElement("span");
  memoLabel.className = "detail-label";
  memoLabel.textContent = "メモ";
  const memoInput = document.createElement("textarea");
  memoInput.className = "detail-input";
  memoInput.placeholder = "メモを入力...";
  memoInput.value = todo.memo ?? "";
  memoInput.disabled = !isLoggedIn;
  let memoTimer = null;
  memoInput.addEventListener("input", () => {
    clearTimeout(memoTimer);
    memoTimer = setTimeout(async () => {
      try {
        await api(`/api/todos/${encodeURIComponent(todo.id)}`, {
          method: "PATCH",
          body: JSON.stringify({ memo: memoInput.value || null }),
        });
      } catch (e) {
        showError(e.message);
      }
    }, 500);
  });
  memoRow.append(memoLabel, memoInput);

  // Type
  const typeRow = document.createElement("div");
  typeRow.className = "detail-row";
  const typeLabel = document.createElement("span");
  typeLabel.className = "detail-label";
  typeLabel.textContent = "タイプ";
  const typeSelect = document.createElement("select");
  typeSelect.className = "detail-input";
  for (const [val, label] of [["", "なし"], ["research", "調査"], ["implement", "実装"]]) {
    const opt = document.createElement("option");
    opt.value = val;
    opt.textContent = label;
    if ((todo.type ?? "") === val) opt.selected = true;
    typeSelect.append(opt);
  }
  typeSelect.disabled = !isLoggedIn;
  typeSelect.addEventListener("change", async () => {
    try {
      await api(`/api/todos/${encodeURIComponent(todo.id)}`, {
        method: "PATCH",
        body: JSON.stringify({ type: typeSelect.value || null }),
      });
      await refresh();
    } catch (e) {
      showError(e.message);
    }
  });
  typeRow.append(typeLabel, typeSelect);

  // Project
  const projectRow = document.createElement("div");
  projectRow.className = "detail-row";
  const projectLabel = document.createElement("span");
  projectLabel.className = "detail-label";
  projectLabel.textContent = "PJ";
  const projectInput = document.createElement("input");
  projectInput.type = "text";
  projectInput.className = "detail-input";
  projectInput.placeholder = "プロジェクト名";
  projectInput.value = todo.project ?? "";
  projectInput.disabled = !isLoggedIn;
  projectInput.setAttribute("list", "projectList");
  let projectTimer = null;
  projectInput.addEventListener("input", () => {
    clearTimeout(projectTimer);
    projectTimer = setTimeout(async () => {
      try {
        await api(`/api/todos/${encodeURIComponent(todo.id)}`, {
          method: "PATCH",
          body: JSON.stringify({ project: projectInput.value || null }),
        });
        await refresh();
      } catch (e) {
        showError(e.message);
      }
    }, 500);
  });
  projectRow.append(projectLabel, projectInput);

  detailEl.append(dueRow, assigneeRow, typeRow, projectRow, memoRow);

  // Subtasks
  const subtaskSection = document.createElement("div");
  subtaskSection.className = "subtask-section";
  renderSubtasks(todo, subtaskSection);
  detailEl.append(subtaskSection);

  // Task ID copy
  const idRow = document.createElement("div");
  idRow.className = "detail-id-row";
  const idLabel = document.createElement("span");
  idLabel.className = "detail-id-label";
  idLabel.textContent = `ID: ${todo.id}`;
  const copyBtn = document.createElement("button");
  copyBtn.className = "button small copy-btn";
  copyBtn.textContent = "コピー";
  copyBtn.addEventListener("click", async () => {
    await navigator.clipboard.writeText(todo.id);
    copyBtn.textContent = "コピー済";
    setTimeout(() => { copyBtn.textContent = "コピー"; }, 1500);
  });
  idRow.append(idLabel, copyBtn);
  detailEl.append(idRow);
}

function renderTodoItem(t, listEl) {
  const li = document.createElement("li");
  li.className = `todo ${t.completed ? "done" : ""}`;

  // Main row
  const row = document.createElement("div");
  row.className = "todo-row";

  const cb = document.createElement("input");
  cb.type = "checkbox";
  cb.checked = !!t.completed;
  cb.disabled = !isLoggedIn;
  cb.addEventListener("change", async () => {
    cb.disabled = true;
    try {
      showError("");
      await api(`/api/todos/${encodeURIComponent(t.id)}`, {
        method: "PATCH",
        body: JSON.stringify({ completed: cb.checked }),
      });
      await refresh();
    } catch (e) {
      showError(e.message);
      cb.checked = !cb.checked;
    } finally {
      cb.disabled = false;
    }
  });

  const title = document.createElement("div");
  title.className = "todo-title";
  title.textContent = t.title;
  title.title = "クリックで詳細を開閉 / ダブルクリックで編集";
  let clickTimer = null;
  title.addEventListener("click", () => {
    clearTimeout(clickTimer);
    clickTimer = setTimeout(() => {
      if (openDetails.has(t.id)) {
        openDetails.delete(t.id);
      } else {
        openDetails.add(t.id);
      }
      rerender();
    }, 220);
  });
  title.addEventListener("dblclick", (e) => {
    if (!isLoggedIn) return;
    e.stopPropagation();
    clearTimeout(clickTimer);
    const input = document.createElement("input");
    input.type = "text";
    input.className = "inline-edit";
    input.value = t.title;
    title.replaceWith(input);
    input.focus();
    input.select();
    let saved = false;
    const save = async () => {
      if (saved) return;
      saved = true;
      const newTitle = input.value.trim();
      if (newTitle && newTitle !== t.title) {
        try {
          await api(`/api/todos/${encodeURIComponent(t.id)}`, {
            method: "PATCH",
            body: JSON.stringify({ title: newTitle }),
          });
        } catch (e) {
          showError(e.message);
        }
      }
      await refresh();
    };
    input.addEventListener("blur", save);
    input.addEventListener("keydown", (ev) => {
      if (ev.isComposing) return;
      if (ev.key === "Enter") { ev.preventDefault(); input.blur(); }
      if (ev.key === "Escape") { input.value = t.title; input.blur(); }
    });
  });

  const meta = document.createElement("div");
  meta.className = "todo-meta";

  if (t.assignee) {
    const assigneePill = document.createElement("span");
    assigneePill.className = `pill assignee-pill ${t.assignee.toLowerCase()}`;
    assigneePill.textContent = t.assignee;
    meta.append(assigneePill);
  }

  // Status indicator
  if (t.assignee === "Claude" && !t.completed) {
    const status = t.status ?? "open";
    if (status === "open" && isLoggedIn) {
      const reqBtn = document.createElement("button");
      reqBtn.className = "button small request-btn";
      reqBtn.textContent = "リクエスト";
      reqBtn.addEventListener("click", async (e) => {
        e.stopPropagation();
        await withLoading(reqBtn, async () => {
          try {
            await api(`/api/todos/${encodeURIComponent(t.id)}/request`, { method: "POST" });
            await refresh();
          } catch (err) {
            showError(err.message);
          }
        });
      });
      meta.append(reqBtn);
    } else if (status === "requested") {
      const pill = document.createElement("span");
      pill.className = "pill status-pill requested";
      pill.textContent = "⏳ 待機中";
      meta.append(pill);
    } else if (status === "running") {
      const pill = document.createElement("span");
      pill.className = "pill status-pill running";
      pill.textContent = "⚙ 実行中";
      meta.append(pill);
      if (t.reportUrl) {
        const link = document.createElement("a");
        link.className = "pill status-link";
        link.href = t.reportUrl;
        link.target = "_blank";
        link.textContent = "Actions";
        meta.append(link);
      }
    } else if (status === "done") {
      const pill = document.createElement("span");
      pill.className = "pill status-pill done";
      pill.textContent = "✓ 完了";
      meta.append(pill);
      if (t.prUrl) {
        const link = document.createElement("a");
        link.className = "pill status-link";
        link.href = t.prUrl;
        link.target = "_blank";
        link.textContent = "PR";
        meta.append(link);
      }
      if (t.reportUrl) {
        const link = document.createElement("a");
        link.className = "pill status-link";
        link.href = t.reportUrl;
        link.target = "_blank";
        link.textContent = t.prUrl ? "Actions" : "レポート";
        meta.append(link);
      }
    } else if (status === "error") {
      const pill = document.createElement("span");
      pill.className = "pill status-pill error";
      pill.textContent = "✕ エラー";
      pill.title = t.result ?? "";
      meta.append(pill);
      if (t.reportUrl) {
        const link = document.createElement("a");
        link.className = "pill status-link";
        link.href = t.reportUrl;
        link.target = "_blank";
        link.textContent = "ログ";
        meta.append(link);
      }
    }
  }

  const subsCount = (t.subtasks ?? []).length;
  if (subsCount > 0) {
    const subsDone = (t.subtasks ?? []).filter((s) => s.completed).length;
    const subPill = document.createElement("span");
    subPill.className = "pill sub-pill";
    subPill.textContent = `${subsDone}/${subsCount}`;
    meta.append(subPill);
  }

  if (isLoggedIn) {
    const del = document.createElement("button");
    del.className = "button small danger";
    del.textContent = "削除";
    del.addEventListener("click", async () => {
      if (!confirm("削除しますか？")) return;
      await withLoading(del, async () => {
        try {
          showError("");
          await api(`/api/todos/${encodeURIComponent(t.id)}`, { method: "DELETE" });
          openDetails.delete(t.id);
          await refresh();
        } catch (e) {
          showError(e.message);
        }
      });
    });
    meta.append(del);
  }

  const dateEl = document.createElement("div");
  dateEl.className = `todo-date${!t.dueDate ? " unset" : isOverdue(t.dueDate) && !t.completed ? " overdue" : " due"}`;
  dateEl.textContent = t.dueDate ?? "—";
  row.append(cb, dateEl, title, meta);
  li.append(row);

  // Detail panel (collapsible)
  if (openDetails.has(t.id)) {
    const detail = document.createElement("div");
    detail.className = "todo-detail";
    renderDetail(t, detail);
    li.append(detail);
  }

  listEl.append(li);
}

function render(todos) {
  els.list.innerHTML = "";
  els.completedList.innerHTML = "";

  const searchTerm = els.search.value.trim().toLowerCase();
  const assigneeFilter = els.assigneeFilter.value;

  const projectFilter = els.projectFilter.value;

  // Build project list for datalist and filter dropdown
  const projects = [...new Set(todos.map((t) => t.project).filter(Boolean))].sort();
  els.projectList.innerHTML = "";
  for (const p of projects) {
    const opt = document.createElement("option");
    opt.value = p;
    els.projectList.append(opt);
  }
  // Update project filter dropdown (preserve selection)
  const currentOptions = new Set([...els.projectFilter.options].map((o) => o.value));
  const desiredOptions = new Set(["all", ...projects]);
  if ([...currentOptions].join(",") !== [...desiredOptions].join(",")) {
    els.projectFilter.innerHTML = "";
    const allOpt = document.createElement("option");
    allOpt.value = "all";
    allOpt.textContent = "すべて";
    els.projectFilter.append(allOpt);
    for (const p of projects) {
      const opt = document.createElement("option");
      opt.value = p;
      opt.textContent = p;
      els.projectFilter.append(opt);
    }
    if (desiredOptions.has(projectFilter)) els.projectFilter.value = projectFilter;
  }

  // Apply search, assignee & project filter
  let filtered = todos;
  if (searchTerm) {
    filtered = filtered.filter(
      (t) =>
        t.title.toLowerCase().includes(searchTerm) ||
        (t.memo ?? "").toLowerCase().includes(searchTerm) ||
        (t.project ?? "").toLowerCase().includes(searchTerm) ||
        (t.subtasks ?? []).some((s) => s.title.toLowerCase().includes(searchTerm))
    );
  }
  if (assigneeFilter !== "all") {
    filtered = filtered.filter((t) => t.assignee === assigneeFilter);
  }
  if (projectFilter !== "all") {
    filtered = filtered.filter((t) => t.project === projectFilter);
  }

  const openTodos = sortTodos(filtered.filter((t) => !t.completed));
  const doneTodos = filtered.filter((t) => t.completed);

  const openCount = todos.filter((t) => !t.completed).length;
  const doneCount = todos.filter((t) => t.completed).length;
  els.summary.textContent = `未完了 ${openCount} / 完了 ${doneCount}（合計 ${todos.length}）`;

  // Group by project, then by dueDate within each project
  const projectGroups = groupByProject(openTodos);
  for (const pg of projectGroups) {
    // Project header
    const projHeader = document.createElement("li");
    projHeader.className = `project-separator${pg.project ? "" : " unset"}`;
    projHeader.textContent = pg.project ?? "プロジェクト未設定";
    els.list.append(projHeader);

    const dateGroups = groupByDueDate(pg.items);
    for (const dg of dateGroups) {
      const sep = document.createElement("li");
      sep.className = `date-separator${dg.date ? "" : " unset"}`;
      sep.textContent = dg.date ?? "実施日未設定";
      els.list.append(sep);
      for (const t of dg.items) renderTodoItem(t, els.list);
    }
  }

  // Completed section
  if (doneCount > 0) {
    els.completedSection.hidden = false;
    els.toggleCompleted.textContent = showCompleted
      ? `完了済みを隠す (${doneTodos.length})`
      : `完了済みを表示 (${doneTodos.length})`;
    els.completedList.hidden = !showCompleted;
    if (showCompleted) {
      for (const t of doneTodos) {
        renderTodoItem(t, els.completedList);
      }
    }
  } else {
    els.completedSection.hidden = true;
  }
}

async function refresh() {
  els.list.classList.add("loading");
  try {
    const status = els.filter.value;
    const data = await api(`/api/todos?status=${encodeURIComponent(status)}&limit=200`);
    cachedTodos = data.todos;
    render(cachedTodos);
  } finally {
    els.list.classList.remove("loading");
  }
}

els.addForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const title = els.title.value.trim();
  if (!title) return;
  const dueDate = els.dueDate.value || null;
  const assignee = els.assignee.value || null;
  const type = els.type.value || null;
  const project = els.project.value.trim() || null;
  const submitBtn = els.addForm.querySelector('button[type="submit"]');
  await withLoading(submitBtn, async () => {
    try {
      showError("");
      await api("/api/todos", {
        method: "POST",
        body: JSON.stringify({ title, dueDate, assignee, type, project }),
      });
      els.title.value = "";
      els.dueDate.value = "";
      els.assignee.value = "";
      els.type.value = "";
      els.project.value = "";
      await refresh();
    } catch (err) {
      showError(err.message);
    }
  });
});

$("todayBtn").addEventListener("click", () => {
  els.dueDate.value = new Date().toLocaleDateString("sv-SE");
});

els.filter.addEventListener("change", () => refresh().catch((e) => showError(e.message)));
els.assigneeFilter.addEventListener("change", () => rerender());
els.projectFilter.addEventListener("change", () => rerender());
els.refresh.addEventListener("click", () => withLoading(els.refresh, () => refresh()).catch((e) => showError(e.message)));

els.toggleCompleted.addEventListener("click", () => {
  showCompleted = !showCompleted;
  rerender();
});

let searchTimer = null;
els.search.addEventListener("input", () => {
  clearTimeout(searchTimer);
  searchTimer = setTimeout(() => {
    rerender();
  }, 200);
});

$("docsBtn").addEventListener("click", () => {
  if (docsOverlay) { closeDocsModal(); return; }
  docsOverlay = createDocsModal();
  document.body.append(docsOverlay);
});

initAuth().then(() => refresh().catch((e) => showError(e.message)));
