import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page, request }) => {
  // データをリセット
  await request.post('/reset');
  await page.goto('/');
  // todoが表示されるのを待つ
  await expect(page.locator('.todo-title').first()).toBeVisible();
});

test('タスクタイトル編集: ダブルクリックでインライン編集できる', async ({ page }) => {
  // タイトル要素を取得
  const titleEl = page.locator('.todo-title').first();
  await expect(titleEl).toHaveText('テストタスク');

  // ダブルクリックで編集モードに入る（シングルクリックタイマー220msより前に素早くダブルクリック）
  await titleEl.dblclick();

  // 220ms以上待ってからinline-edit inputを確認する
  await page.waitForTimeout(300);

  // inline-edit inputが現れる
  const input = page.locator('input.inline-edit').first();
  await expect(input).toBeVisible();
  await expect(input).toHaveValue('テストタスク');

  // タイトルを変更してEnter
  await input.fill('変更後のタスク名');
  await input.press('Enter');

  // 更新後にタイトルが変わっていることを確認
  await expect(page.locator('.todo-title').first()).toHaveText('変更後のタスク名');
});

test('サブタスクタイトル編集: ダブルクリックでインライン編集できる', async ({ page }) => {
  // 詳細パネルを開く（タイトルをシングルクリック、220ms後に開く）
  const titleEl = page.locator('.todo-title').first();
  await titleEl.click();

  // シングルクリックタイマーが220msなので300ms待つ
  await page.waitForTimeout(300);

  // サブタスクが表示されるのを待つ
  const subtaskTitle = page.locator('.subtask-title').first();
  await expect(subtaskTitle).toBeVisible();
  await expect(subtaskTitle).toHaveText('サブタスク1');

  // ダブルクリックで編集モードに入る
  await subtaskTitle.dblclick();

  // 少し待ってから確認
  await page.waitForTimeout(100);

  // inline-edit inputが現れる
  const input = page.locator('.subtask-item input.inline-edit').first();
  await expect(input).toBeVisible();
  await expect(input).toHaveValue('サブタスク1');

  // タイトルを変更してEnter
  await input.fill('変更後のサブタスク');
  await input.press('Enter');

  // 更新後にサブタスクタイトルが変わっていることを確認
  await expect(page.locator('.subtask-title').first()).toHaveText('変更後のサブタスク');
});

test('今日ボタン(追加フォーム): 今日の日付をdueDateにセットする', async ({ page }) => {
  // 今日の日付をYYYY-MM-DD形式で取得
  const today = new Date().toLocaleDateString("sv-SE");

  // #todayBtnをクリック
  await page.click('#todayBtn');

  // #dueDateが今日の日付になっていることを確認
  const dueDate = page.locator('#dueDate');
  await expect(dueDate).toHaveValue(today);
});

test('今日ボタン(detailパネル): 詳細パネル内の今日ボタンで実施日がセットされる', async ({ page }) => {
  // 詳細パネルを開く（シングルクリック）
  const titleEl = page.locator('.todo-title').first();
  await titleEl.click();

  // シングルクリックタイマーが220msなので300ms待つ
  await page.waitForTimeout(300);

  // detailパネルが表示されるのを待つ
  const detailPanel = page.locator('.todo-detail').first();
  await expect(detailPanel).toBeVisible();

  // 今日の日付をYYYY-MM-DD形式で取得
  const today = new Date().toLocaleDateString("sv-SE");

  // detailパネル内の「今日」ボタンをクリック
  const todayBtnInDetail = detailPanel.locator('.today-btn').first();
  await expect(todayBtnInDetail).toBeVisible();
  await todayBtnInDetail.click();

  // detailパネル内の実施日inputが今日の日付になっていることを確認
  const detailDueInput = detailPanel.locator('input[type="date"]').first();
  await expect(detailDueInput).toHaveValue(today);
});

test('二重保存バグの回帰テスト: サブタスクをダブルクリック編集後、テキストが1回だけ保存されること', async ({ page }) => {
  // 詳細パネルを開く（シングルクリック）
  const titleEl = page.locator('.todo-title').first();
  await titleEl.click();

  // シングルクリックタイマーが220msなので300ms待つ
  await page.waitForTimeout(300);

  // サブタスクが表示されるのを待つ
  const subtaskTitle = page.locator('.subtask-title').first();
  await expect(subtaskTitle).toBeVisible();
  await expect(subtaskTitle).toHaveText('サブタスク1');

  // ダブルクリックで編集モードに入る
  await subtaskTitle.dblclick();

  // 少し待ってから確認
  await page.waitForTimeout(100);

  // inline-edit inputが現れる
  const input = page.locator('.subtask-item input.inline-edit').first();
  await expect(input).toBeVisible();

  // 全選択してから「編集後テキスト」と入力
  await input.selectText();
  await input.type('編集後テキスト');

  // Enter を押して確定（blur → refresh → DOM削除が発生）
  await input.press('Enter');

  // refresh後に .subtask-title が「編集後テキスト」と一致すること（二重にならないこと）
  await expect(page.locator('.subtask-title').first()).toHaveText('編集後テキスト');
});

// IME Enterの回帰テスト:
// compositionstart → compositionend → Enter の順で押してもサブタスクが作成されないこと
// Playwrightでは実際のIME入力イベント（compositionstart/compositionend）の
// シミュレーションが難しいため、このテストはスキップとする
test.skip('IME Enterの回帰テスト: compositionstart → compositionend → Enter でサブタスクが作成されないこと', () => {
  // TODO: Playwrightが実際のIMEイベントシミュレーションをサポートした場合に実装する
});

test('IDコピーボタン: コピーボタンをクリックするとコピー済テキストになる', async ({ page, context }) => {
  // クリップボードのパーミッションを付与
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);

  // 詳細パネルを開く（シングルクリック）
  const titleEl = page.locator('.todo-title').first();
  await titleEl.click();

  // シングルクリックタイマーが220msなので300ms待つ
  await page.waitForTimeout(300);

  // detailパネルが表示されるのを待つ
  const detailPanel = page.locator('.todo-detail').first();
  await expect(detailPanel).toBeVisible();

  // コピーボタンが表示されるのを待つ
  const copyBtn = detailPanel.locator('.copy-btn').first();
  await expect(copyBtn).toBeVisible();
  await expect(copyBtn).toHaveText('コピー');

  // コピーボタンをクリック
  await copyBtn.click();

  // ボタンのテキストが「コピー済」になっていることを確認
  await expect(copyBtn).toHaveText('コピー済');
});
