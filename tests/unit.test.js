import { test } from 'node:test';
import assert from 'node:assert/strict';

// ---- テスト対象関数（app.js からコピー） ----

function isOverdue(dateStr) {
  if (!dateStr) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return new Date(dateStr) < today;
}

function sortTodos(todos) {
  return [...todos].sort((a, b) => {
    if (a.dueDate && b.dueDate) return a.dueDate.localeCompare(b.dueDate);
    if (a.dueDate && !b.dueDate) return -1;
    if (!a.dueDate && b.dueDate) return 1;
    return b.createdAt.localeCompare(a.createdAt);
  });
}

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

// ---- isOverdue ----

test('isOverdue: 過去日付 → true', () => {
  assert.equal(isOverdue('2000-01-01'), true);
});

test('isOverdue: 未来日付 → false', () => {
  assert.equal(isOverdue('2099-12-31'), false);
});

test('isOverdue: null → false', () => {
  assert.equal(isOverdue(null), false);
});

test('isOverdue: undefined → false', () => {
  assert.equal(isOverdue(undefined), false);
});

test('isOverdue: 空文字 → false', () => {
  assert.equal(isOverdue(''), false);
});

// ---- sortTodos ----

test('sortTodos: dueDate 昇順に並ぶ', () => {
  const todos = [
    { id: 'b', dueDate: '2025-02-01', createdAt: '2025-01-01T00:00:00Z' },
    { id: 'a', dueDate: '2025-01-01', createdAt: '2025-01-01T00:00:00Z' },
    { id: 'c', dueDate: '2025-03-01', createdAt: '2025-01-01T00:00:00Z' },
  ];
  const sorted = sortTodos(todos);
  assert.deepEqual(sorted.map((t) => t.id), ['a', 'b', 'c']);
});

test('sortTodos: dueDate なしは最後に来る', () => {
  const todos = [
    { id: 'no-date', dueDate: null, createdAt: '2025-01-01T00:00:00Z' },
    { id: 'has-date', dueDate: '2025-01-01', createdAt: '2025-01-01T00:00:00Z' },
  ];
  const sorted = sortTodos(todos);
  assert.equal(sorted[0].id, 'has-date');
  assert.equal(sorted[1].id, 'no-date');
});

test('sortTodos: 同一 dueDate の場合は createdAt 降順（新しい順）', () => {
  const todos = [
    { id: 'older', dueDate: null, createdAt: '2025-01-01T00:00:00Z' },
    { id: 'newer', dueDate: null, createdAt: '2025-06-01T00:00:00Z' },
  ];
  const sorted = sortTodos(todos);
  assert.equal(sorted[0].id, 'newer');
  assert.equal(sorted[1].id, 'older');
});

test('sortTodos: 元の配列を変更しない', () => {
  const todos = [
    { id: 'b', dueDate: '2025-02-01', createdAt: '2025-01-01T00:00:00Z' },
    { id: 'a', dueDate: '2025-01-01', createdAt: '2025-01-01T00:00:00Z' },
  ];
  const original = [...todos];
  sortTodos(todos);
  assert.deepEqual(todos.map((t) => t.id), original.map((t) => t.id));
});

// ---- groupByDueDate ----

test('groupByDueDate: 複数日付でグループ化される', () => {
  const todos = [
    { id: '1', dueDate: '2025-01-01' },
    { id: '2', dueDate: '2025-02-01' },
    { id: '3', dueDate: '2025-01-01' },
  ];
  const groups = groupByDueDate(todos);
  assert.equal(groups.length, 2);
  assert.equal(groups[0].date, '2025-01-01');
  assert.equal(groups[0].items.length, 2);
  assert.equal(groups[1].date, '2025-02-01');
  assert.equal(groups[1].items.length, 1);
});

test('groupByDueDate: null（未設定）のグループが最後に来る', () => {
  const todos = [
    { id: 'no-date', dueDate: null },
    { id: 'has-date', dueDate: '2025-01-01' },
  ];
  const groups = groupByDueDate(todos);
  assert.equal(groups[0].date, '2025-01-01');
  assert.equal(groups[groups.length - 1].date, null);
});

test('groupByDueDate: 日付グループは昇順に並ぶ', () => {
  const todos = [
    { id: 'c', dueDate: '2025-03-01' },
    { id: 'a', dueDate: '2025-01-01' },
    { id: 'b', dueDate: '2025-02-01' },
  ];
  const groups = groupByDueDate(todos);
  assert.deepEqual(groups.map((g) => g.date), ['2025-01-01', '2025-02-01', '2025-03-01']);
});

test('groupByDueDate: 全要素が null の場合グループが1つ', () => {
  const todos = [
    { id: '1', dueDate: null },
    { id: '2', dueDate: null },
  ];
  const groups = groupByDueDate(todos);
  assert.equal(groups.length, 1);
  assert.equal(groups[0].date, null);
  assert.equal(groups[0].items.length, 2);
});
