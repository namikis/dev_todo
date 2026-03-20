import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page, request }) => {
  await request.post('/reset');
  await page.goto('/');
  // 初期タスクが表示されるのを待つ
  await expect(page.locator('.todo-title').first()).toBeVisible();
});

// 1. 追加フォームの「今日」ボタンで今日の日付がセットされる
test('追加フォームの今日ボタンで今日の日付がセットされる', async ({ page }) => {
  const today = new Date().toLocaleDateString("sv-SE");

  await page.click('#todayBtn');

  await expect(page.locator('#dueDate')).toHaveValue(today);
});

// 2. detailパネルの「今日」ボタンで実施日がセットされる
test('detailパネルの今日ボタンで実施日がセットされる', async ({ page }) => {
  const today = new Date().toLocaleDateString("sv-SE");

  // 詳細パネルを開く（シングルクリック + 220ms待機）
  await page.locator('.todo-title').first().click();
  await page.waitForTimeout(300);

  const detailPanel = page.locator('.todo-detail').first();
  await expect(detailPanel).toBeVisible();

  // detailパネル内の今日ボタンをクリック
  const todayBtn = detailPanel.locator('.today-btn').first();
  await expect(todayBtn).toBeVisible();
  await todayBtn.click();

  // 実施日inputが今日の日付になっていることを確認
  const dueInput = detailPanel.locator('input[type="date"]').first();
  await expect(dueInput).toHaveValue(today);
});

// 3. IDコピーボタンクリックで「コピー済」テキストになる
test('IDコピーボタンクリックでコピー済テキストになる', async ({ page, context }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);

  // 詳細パネルを開く
  await page.locator('.todo-title').first().click();
  await page.waitForTimeout(300);

  const detailPanel = page.locator('.todo-detail').first();
  await expect(detailPanel).toBeVisible();

  // コピーボタンをクリック
  const copyBtn = detailPanel.locator('.copy-btn').first();
  await expect(copyBtn).toBeVisible();
  await expect(copyBtn).toHaveText('コピー');
  await copyBtn.click();

  // ボタンテキストが「コピー済」になることを確認
  await expect(copyBtn).toHaveText('コピー済');
});

// 4. Claude担当タスクにリクエストボタンが表示される
test('Claude担当タスクにリクエストボタンが表示される', async ({ page }) => {
  // 初期データにはassignee: 'Claude', status: 'open' のタスクが含まれる
  const requestBtn = page.locator('.request-btn');
  await expect(requestBtn).toBeVisible();
  await expect(requestBtn).toHaveText('リクエスト');
});

// 5. ステータスフィルタで「未完了」のみ表示できる
test('ステータスフィルタで未完了のみ表示できる', async ({ page, request }) => {
  // タスクを追加してから完了させる
  const res = await request.post('/api/todos', {
    data: { title: '完了タスク' },
  });
  const todo = await res.json();
  await request.patch(`/api/todos/${todo.id}`, {
    data: { completed: true },
  });

  // フィルタを「未完了」に設定
  await page.selectOption('#filter', 'open');
  await page.waitForTimeout(200);

  // 未完了タスク（テストタスク）が表示されている
  await expect(page.locator('.todo-title', { hasText: 'テストタスク' })).toBeVisible();

  // 完了済みタスクは completedSection に移動しているため #list には表示されない
  await expect(page.locator('#list .todo-title', { hasText: '完了タスク' })).not.toBeVisible();
});

// 6. 検索でタイトルを絞り込める
test('検索でタイトルを絞り込める', async ({ page, request }) => {
  // 追加タスクを用意
  await request.post('/api/todos', { data: { title: 'ユニークなタスク名' } });
  await page.reload();
  await expect(page.locator('.todo-title').first()).toBeVisible();

  // 検索入力
  await page.fill('#search', 'ユニーク');
  await page.waitForTimeout(300);

  // ユニークなタスクが表示される
  await expect(page.locator('.todo-title', { hasText: 'ユニークなタスク名' })).toBeVisible();

  // 初期タスクは非表示になる
  await expect(page.locator('.todo-title', { hasText: 'テストタスク' })).not.toBeVisible();
});

// 7. 実施日未設定のグループセパレーター「実施日未設定」が表示される
test('実施日未設定のグループセパレーターが表示される', async ({ page }) => {
  // 初期タスクは dueDate: null なので「実施日未設定」セパレーターが表示されるはず
  const separator = page.locator('.date-separator.unset');
  await expect(separator).toBeVisible();
  await expect(separator).toHaveText('実施日未設定');
});
