-- ============================================================
-- DEV TODO - Supabase Schema
-- Supabase の SQL Editor で実行してください
-- ============================================================

-- todos テーブル
create table todos (
  id           uuid primary key default gen_random_uuid(),
  title        text not null,
  completed    boolean not null default false,
  created_at   timestamptz not null default now(),
  completed_at timestamptz,
  due_date     date,
  memo         text,
  assignee     text check (assignee in ('Claude', 'Tairyu')),
  type         text check (type in ('research', 'implement')),
  subtasks     jsonb not null default '[]',
  status       text not null default 'open'
               check (status in ('open', 'requested', 'running', 'done', 'error')),
  result       text,
  report_url   text,
  pr_url       text,
  requested_at timestamptz
);

-- RLS 有効化 (認証追加まで全許可)
alter table todos enable row level security;
create policy "allow all" on todos for all using (true) with check (true);

-- Realtime 有効化
alter publication supabase_realtime add table todos;

-- reports テーブル (調査結果)
create table reports (
  id         uuid primary key default gen_random_uuid(),
  todo_id    uuid references todos(id) on delete cascade,
  content    text not null,
  created_at timestamptz not null default now()
);

alter table reports enable row level security;
create policy "allow all" on reports for all using (true) with check (true);

-- ============================================================
-- Migration: project フィールド追加
-- ============================================================
alter table todos add column if not exists project text;

-- ============================================================
-- Migration: issue_url フィールド追加 + blocked ステータス
-- ============================================================
alter table todos add column if not exists issue_url text;
alter table todos drop constraint if exists todos_status_check;
alter table todos add constraint todos_status_check
  check (status in ('open', 'requested', 'running', 'blocked', 'done', 'error'));

-- ============================================================
-- claude_docs テーブル (Claude Code ドキュメントキャッシュ)
-- ============================================================
create table if not exists claude_docs (
  key        text primary key,         -- 'changelog' | 'features' | 'official'
  content    text not null,
  version    text,
  updated_at timestamptz not null default now()
);

alter table claude_docs enable row level security;
create policy "allow all" on claude_docs for all using (true) with check (true);

-- ============================================================
-- Migration: projects テーブル追加
-- ============================================================
create table if not exists projects (
  name       text primary key,
  created_at timestamptz not null default now()
);

alter table projects enable row level security;
create policy "allow all" on projects for all using (true) with check (true);

-- ============================================================
-- Migration: projects テーブルに repository カラム追加
-- ============================================================
alter table projects add column if not exists repository text;
