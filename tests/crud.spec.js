import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page, request }) => {
  await request.post('/reset');
  await page.goto('/');
  // 初期タスクが表示されるのを待つ
  await expect(page.locator('.todo-title').first()).toBeVisible();
});

// 1. タスクを追加できる
test('タスクを追加できる', async ({ page }) => {
  await page.fill('#title', '新しいタスク');
  await page.click('#addForm button[type="submit"]');

  // リストに表示されることを確認
  await expect(page.locator('.todo-title', { hasText: '新しいタスク' })).toBeVisible();
});

// 2. タスクを完了できる
test('タスクを完了できる', async ({ page }) => {
  // 最初のタスクのチェックボックスをクリック
  const checkbox = page.locator('.todo:not(.done) input[type="checkbox"]').first();
  await checkbox.click();

  // 完了済みセクションに移動する（toggleCompleted ボタンをクリックして表示）
  await page.click('#toggleCompleted');
  await expect(page.locator('#completedList .todo.done').first()).toBeVisible();
});

// 3. タスクを削除できる
test('タスクを削除できる', async ({ page }) => {
  // 削除前のタイトルを取得
  const titleText = await page.locator('.todo-title').first().textContent();

  // 削除ボタンをクリック（confirm ダイアログを自動承認）
  page.on('dialog', (dialog) => dialog.accept());
  await page.locator('.todo-row .button.danger').first().click();

  // リストから消えていることを確認
  await expect(page.locator('.todo-title', { hasText: titleText })).not.toBeVisible();
});

// 4. サブタスクを追加できる
test('サブタスクを追加できる', async ({ page }) => {
  // 詳細パネルを開く（シングルクリック、220ms待機）
  await page.locator('.todo-title').first().click();
  await page.waitForTimeout(300);

  const detailPanel = page.locator('.todo-detail').first();
  await expect(detailPanel).toBeVisible();

  // サブタスク追加フォームに入力
  const subtaskInput = detailPanel.locator('.subtask-add input');
  await subtaskInput.fill('新しいサブタスク');

  // + ボタンをクリック
  await detailPanel.locator('.subtask-add button').click();

  // サブタスクがリストに表示されることを確認
  await expect(page.locator('.subtask-title', { hasText: '新しいサブタスク' })).toBeVisible();
});

// 5. サブタスクを完了できる
test('サブタスクを完了できる', async ({ page }) => {
  // 詳細パネルを開く
  await page.locator('.todo-title').first().click();
  await page.waitForTimeout(300);

  const detailPanel = page.locator('.todo-detail').first();
  await expect(detailPanel).toBeVisible();

  // 既存サブタスク（サブタスク1）のチェックボックスをクリック
  const subtaskCheckbox = page.locator('.subtask-item input[type="checkbox"]').first();
  await expect(subtaskCheckbox).toBeVisible();
  await subtaskCheckbox.click();

  // チェックが入っていることを確認（refresh後も）
  await expect(page.locator('.subtask-item.done')).toBeVisible();
});

// 6. サブタスクを削除できる
test('サブタスクを削除できる', async ({ page }) => {
  // 詳細パネルを開く
  await page.locator('.todo-title').first().click();
  await page.waitForTimeout(300);

  const detailPanel = page.locator('.todo-detail').first();
  await expect(detailPanel).toBeVisible();

  // 既存サブタスクの × ボタンをクリック
  await expect(page.locator('.subtask-title', { hasText: 'サブタスク1' })).toBeVisible();
  await page.locator('.subtask-item .button.danger').first().click();

  // サブタスクが消えていることを確認
  await expect(page.locator('.subtask-title', { hasText: 'サブタスク1' })).not.toBeVisible();
});
