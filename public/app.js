const $ = (id) => document.getElementById(id);

const els = {
  addForm: $("addForm"),
  title: $("title"),
  dueDate: $("dueDate"),
  list: $("list"),
  filter: $("filter"),
  refresh: $("refresh"),
  summary: $("summary"),
  clearCompleted: $("clearCompleted"),
  error: $("error"),
};

// Track which todo detail panels are open
const openDetails = new Set();

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
  const res = await fetch(path, {
    headers: { "content-type": "application/json" },
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
    cb.addEventListener("change", async () => {
      try {
        await api(`/api/todos/${encodeURIComponent(todo.id)}/subtasks/${encodeURIComponent(sub.id)}`, {
          method: "PATCH",
          body: JSON.stringify({ completed: cb.checked }),
        });
        await refresh();
      } catch (e) {
        showError(e.message);
      }
    });

    const span = document.createElement("span");
    span.textContent = sub.title;

    const del = document.createElement("button");
    del.className = "button small danger";
    del.textContent = "×";
    del.addEventListener("click", async () => {
      try {
        await api(`/api/todos/${encodeURIComponent(todo.id)}/subtasks/${encodeURIComponent(sub.id)}`, {
          method: "DELETE",
        });
        await refresh();
      } catch (e) {
        showError(e.message);
      }
    });

    li.append(cb, span, del);
    ul.append(li);
  }

  container.append(ul);

  // Add subtask form
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
  };

  addBtn.addEventListener("click", doAdd);
  input.addEventListener("keydown", (e) => {
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
  dueRow.append(dueLabel, dueInput);

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

  detailEl.append(dueRow, memoRow);

  // Subtasks
  const subtaskSection = document.createElement("div");
  subtaskSection.className = "subtask-section";
  renderSubtasks(todo, subtaskSection);
  detailEl.append(subtaskSection);
}

function render(todos) {
  els.list.innerHTML = "";
  const open = todos.filter((t) => !t.completed).length;
  const done = todos.filter((t) => t.completed).length;
  els.summary.textContent = `未完了 ${open} / 完了 ${done}（合計 ${todos.length}）`;

  for (const t of todos) {
    const li = document.createElement("li");
    li.className = `todo ${t.completed ? "done" : ""}`;

    // Main row
    const row = document.createElement("div");
    row.className = "todo-row";

    const cb = document.createElement("input");
    cb.type = "checkbox";
    cb.checked = !!t.completed;
    cb.addEventListener("change", async () => {
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
      }
    });

    const title = document.createElement("div");
    title.className = "todo-title";
    title.textContent = t.title;
    title.title = "クリックで詳細を開閉";
    title.addEventListener("click", () => {
      if (openDetails.has(t.id)) {
        openDetails.delete(t.id);
      } else {
        openDetails.add(t.id);
      }
      refresh();
    });

    const meta = document.createElement("div");
    meta.className = "todo-meta";

    if (t.dueDate) {
      const duePill = document.createElement("span");
      duePill.className = `pill ${isOverdue(t.dueDate) && !t.completed ? "overdue" : "due"}`;
      duePill.textContent = t.dueDate;
      meta.append(duePill);
    }

    const subsCount = (t.subtasks ?? []).length;
    if (subsCount > 0) {
      const subsDone = (t.subtasks ?? []).filter((s) => s.completed).length;
      const subPill = document.createElement("span");
      subPill.className = "pill";
      subPill.textContent = `${subsDone}/${subsCount}`;
      meta.append(subPill);
    }

    if (t.memo) {
      const memoPill = document.createElement("span");
      memoPill.className = "pill";
      memoPill.textContent = "memo";
      meta.append(memoPill);
    }

    const del = document.createElement("button");
    del.className = "button small danger";
    del.textContent = "削除";
    del.addEventListener("click", async () => {
      if (!confirm("削除しますか？")) return;
      try {
        showError("");
        await api(`/api/todos/${encodeURIComponent(t.id)}`, { method: "DELETE" });
        openDetails.delete(t.id);
        await refresh();
      } catch (e) {
        showError(e.message);
      }
    });
    meta.append(del);

    row.append(cb, title, meta);
    li.append(row);

    // Detail panel (collapsible)
    if (openDetails.has(t.id)) {
      const detail = document.createElement("div");
      detail.className = "todo-detail";
      renderDetail(t, detail);
      li.append(detail);
    }

    els.list.append(li);
  }
}

async function refresh() {
  const status = els.filter.value;
  const data = await api(`/api/todos?status=${encodeURIComponent(status)}&limit=200`);
  render(data.todos);
}

els.addForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const title = els.title.value.trim();
  if (!title) return;
  const dueDate = els.dueDate.value || null;
  try {
    showError("");
    await api("/api/todos", {
      method: "POST",
      body: JSON.stringify({ title, dueDate }),
    });
    els.title.value = "";
    els.dueDate.value = "";
    await refresh();
  } catch (err) {
    showError(err.message);
  }
});

els.filter.addEventListener("change", () => refresh().catch((e) => showError(e.message)));
els.refresh.addEventListener("click", () => refresh().catch((e) => showError(e.message)));
els.clearCompleted.addEventListener("click", async () => {
  if (!confirm("完了済みTODOをすべて削除しますか？")) return;
  try {
    showError("");
    await api("/api/todos/clear-completed", { method: "POST", body: JSON.stringify({ confirm: true }) });
    await refresh();
  } catch (e) {
    showError(e.message);
  }
});

refresh().catch((e) => showError(e.message));
