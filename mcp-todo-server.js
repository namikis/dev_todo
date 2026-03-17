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
} from "./todo-store.js";

function textResult(text) {
  return { content: [{ type: "text", text }] };
}

const server = new McpServer(
  { name: "mcp-todo", version: "0.1.0" },
  {
    instructions:
      "Simple TODO manager. Use tools: todo_add, todo_list, todo_get, todo_complete, todo_delete, todo_clear_completed.",
  }
);

server.registerTool(
  "todo_add",
  {
    title: "Add TODO",
    description: "Add a new todo item.",
    inputSchema: {
      title: z.string().min(1),
    },
  },
  async ({ title }) => {
    const todo = await addTodo(title);
    return textResult(`Added.\n${formatTodo(todo)}`);
  }
);

server.registerTool(
  "todo_list",
  {
    title: "List TODOs",
    description: "List todo items.",
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

server.registerTool(
  "todo_get",
  {
    title: "Get TODO",
    description: "Get a single todo by id.",
    inputSchema: {
      id: z.string().min(1),
    },
  },
  async ({ id }) => {
    const todo = await getTodo(id);
    if (!todo) return textResult(`Not found: ${id}`);
    return textResult(
      JSON.stringify(
        {
          id: todo.id,
          title: todo.title,
          completed: todo.completed,
          createdAt: todo.createdAt,
          completedAt: todo.completedAt,
        },
        null,
        2
      )
    );
  }
);

server.registerTool(
  "todo_complete",
  {
    title: "Complete TODO",
    description: "Mark a todo as completed (or uncompleted).",
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

server.registerTool(
  "todo_delete",
  {
    title: "Delete TODO",
    description: "Delete a todo by id.",
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

server.registerTool(
  "todo_clear_completed",
  {
    title: "Clear completed TODOs",
    description: "Delete all completed todos.",
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

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error(err);
  process.exitCode = 1;
});

