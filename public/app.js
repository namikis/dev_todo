const $ = (id) => document.getElementById(id);

const els = {
  addForm: $("addForm"),
  title: $("title"),
  list: $("list"),
  filter: $("filter"),
  refresh: $("refresh"),
  summary: $("summary"),
  clearCompleted: $("clearCompleted"),
  error: $("error"),
};

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

function render(todos) {
  els.list.innerHTML = "";
  const open = todos.filter((t) => !t.completed).length;
  const done = todos.filter((t) => t.completed).length;
  els.summary.textContent = `未完了 ${open} / 完了 ${done}（合計 ${todos.length}）`;

  for (const t of todos) {
    const li = document.createElement("li");
    li.className = `todo ${t.completed ? "done" : ""}`;

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
    title.title = t.title;

    const right = document.createElement("div");
    right.className = "row";

    const pill = document.createElement("span");
    pill.className = "pill";
    pill.textContent = t.id.slice(0, 8);

    const del = document.createElement("button");
    del.className = "button danger";
    del.textContent = "削除";
    del.addEventListener("click", async () => {
      if (!confirm("削除しますか？")) return;
      try {
        showError("");
        await api(`/api/todos/${encodeURIComponent(t.id)}`, { method: "DELETE" });
        await refresh();
      } catch (e) {
        showError(e.message);
      }
    });

    right.append(pill, del);
    li.append(cb, title, right);
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
  try {
    showError("");
    await api("/api/todos", { method: "POST", body: JSON.stringify({ title }) });
    els.title.value = "";
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

