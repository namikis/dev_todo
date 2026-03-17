import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

import {
  addTodo,
  clearCompleted,
  deleteTodo,
  formatTodo,
  getTodo,
  listTodos,
  setCompleted,
  updateTodo,
  addSubtask,
  toggleSubtask,
  deleteSubtask,
} from "./todo-store.js";

function textResult(text) {
  return { content: [{ type: "text", text }] };
}

const server = new McpServer(
  { name: "mcp-todo", version: "0.2.0" },
  {
    instructions:
      "開発タスク管理ツール。タスクの追加・一覧・更新・削除、サブタスク管理、メモ・実施日の設定が可能。\n" +
      "Tools: todo_add, todo_list, todo_get, todo_update, todo_complete, todo_delete, todo_clear_completed, " +
      "todo_add_subtask, todo_toggle_subtask, todo_delete_subtask.",
  }
);

// --- Add ---
server.registerTool(
  "todo_add",
  {
    title: "Add TODO",
    description: "新しいタスクを追加する。タイトル必須。実施日・メモはオプション。",
    inputSchema: {
      title: z.string().min(1).describe("タスクのタイトル"),
      dueDate: z.string().nullable().optional().describe("実施日 (YYYY-MM-DD)"),
      memo: z.string().nullable().optional().describe("メモ"),
    },
  },
  async ({ title, dueDate, memo }) => {
    const todo = await addTodo(title, { dueDate, memo });
    return textResult(`Added.\n${formatTodo(todo)}`);
  }
);

// --- List ---
server.registerTool(
  "todo_list",
  {
    title: "List TODOs",
    description: "タスク一覧を表示する。",
    inputSchema: {
      status: z.enum(["all", "open", "done"]).default("all").optional(),
      limit: z.number().int().min(1).max(200).default(50).optional(),
    },
  },
  async ({ status = "all", limit = 50 } = {}) => {
    const sliced = await listTodos({ status, limit });
    if (sliced.length === 0) return textResult("No todos.");
    return textResult(sliced.map(formatTodo).join("\n"));
  }
);

// --- Get ---
server.registerTool(
  "todo_get",
  {
    title: "Get TODO",
    description: "IDを指定して1件のタスク詳細を取得する。サブタスク・メモも含む。",
    inputSchema: {
      id: z.string().min(1),
    },
  },
  async ({ id }) => {
    const todo = await getTodo(id);
    if (!todo) return textResult(`Not found: ${id}`);
    return textResult(JSON.stringify(todo, null, 2));
  }
);

// --- Update ---
server.registerTool(
  "todo_update",
  {
    title: "Update TODO",
    description: "タスクのタイトル・実施日・メモを更新する。",
    inputSchema: {
      id: z.string().min(1),
      title: z.string().min(1).optional().describe("新しいタイトル"),
      dueDate: z.string().nullable().optional().describe("実施日 (YYYY-MM-DD)。nullで解除"),
      memo: z.string().nullable().optional().describe("メモ。nullで解除"),
    },
  },
  async ({ id, ...updates }) => {
    const todo = await updateTodo(id, updates);
    if (!todo) return textResult(`Not found: ${id}`);
    return textResult(`Updated.\n${formatTodo(todo)}`);
  }
);

// --- Complete ---
server.registerTool(
  "todo_complete",
  {
    title: "Complete TODO",
    description: "タスクの完了/未完了を切り替える。",
    inputSchema: {
      id: z.string().min(1),
      completed: z.boolean().default(true).optional(),
    },
  },
  async ({ id, completed = true }) => {
    const next = await setCompleted(id, completed);
    if (!next) return textResult(`Not found: ${id}`);
    return textResult(`Updated.\n${formatTodo(next)}`);
  }
);

// --- Delete ---
server.registerTool(
  "todo_delete",
  {
    title: "Delete TODO",
    description: "タスクを削除する。",
    inputSchema: {
      id: z.string().min(1),
    },
  },
  async ({ id }) => {
    const ok = await deleteTodo(id);
    if (!ok) return textResult(`Not found: ${id}`);
    return textResult(`Deleted: ${id}`);
  }
);

// --- Clear completed ---
server.registerTool(
  "todo_clear_completed",
  {
    title: "Clear completed TODOs",
    description: "完了済みタスクをすべて削除する。",
    inputSchema: {
      confirm: z.boolean().default(false).optional(),
    },
  },
  async ({ confirm = false } = {}) => {
    if (!confirm) {
      return textResult(
        "Refusing to clear completed todos without confirmation. Call again with { confirm: true }."
      );
    }
    const removed = await clearCompleted();
    return textResult(`Cleared ${removed} completed todo(s).`);
  }
);

// --- Add subtask ---
server.registerTool(
  "todo_add_subtask",
  {
    title: "Add Subtask",
    description: "タスクにサブタスクを追加する。",
    inputSchema: {
      todoId: z.string().min(1).describe("親タスクのID"),
      title: z.string().min(1).describe("サブタスクのタイトル"),
    },
  },
  async ({ todoId, title }) => {
    const result = await addSubtask(todoId, title);
    if (!result) return textResult(`Todo not found: ${todoId}`);
    return textResult(`Subtask added: ${result.subtask.title}\n${formatTodo(result.todo)}`);
  }
);

// --- Toggle subtask ---
server.registerTool(
  "todo_toggle_subtask",
  {
    title: "Toggle Subtask",
    description: "サブタスクの完了/未完了を切り替える。",
    inputSchema: {
      todoId: z.string().min(1).describe("親タスクのID"),
      subtaskId: z.string().min(1).describe("サブタスクのID"),
      completed: z.boolean().default(true).optional(),
    },
  },
  async ({ todoId, subtaskId, completed = true }) => {
    const result = await toggleSubtask(todoId, subtaskId, completed);
    if (!result) return textResult(`Not found: todoId=${todoId}, subtaskId=${subtaskId}`);
    return textResult(`Subtask updated.\n${formatTodo(result.todo)}`);
  }
);

// --- Delete subtask ---
server.registerTool(
  "todo_delete_subtask",
  {
    title: "Delete Subtask",
    description: "サブタスクを削除する。",
    inputSchema: {
      todoId: z.string().min(1).describe("親タスクのID"),
      subtaskId: z.string().min(1).describe("サブタスクのID"),
    },
  },
  async ({ todoId, subtaskId }) => {
    const todo = await deleteSubtask(todoId, subtaskId);
    if (!todo) return textResult(`Not found: todoId=${todoId}, subtaskId=${subtaskId}`);
    return textResult(`Subtask deleted.\n${formatTodo(todo)}`);
  }
);

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error(err);
  process.exitCode = 1;
});
