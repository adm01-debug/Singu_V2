-- Tabela genérica de preferências de UI por usuário (escopadas por chave)
create table if not exists public.user_ui_preferences (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  scope text not null,
  preferences jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, scope)
);

create index if not exists idx_user_ui_preferences_user_scope
  on public.user_ui_preferences (user_id, scope);

alter table public.user_ui_preferences enable row level security;

drop policy if exists "Users select own ui prefs" on public.user_ui_preferences;
create policy "Users select own ui prefs"
  on public.user_ui_preferences for select
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists "Users insert own ui prefs" on public.user_ui_preferences;
create policy "Users insert own ui prefs"
  on public.user_ui_preferences for insert
  to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "Users update own ui prefs" on public.user_ui_preferences;
create policy "Users update own ui prefs"
  on public.user_ui_preferences for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users delete own ui prefs" on public.user_ui_preferences;
create policy "Users delete own ui prefs"
  on public.user_ui_preferences for delete
  to authenticated
  using (auth.uid() = user_id);

-- Trigger updated_at (reusa função existente se houver, senão cria)
create or replace function public.set_user_ui_preferences_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists trg_user_ui_preferences_updated_at on public.user_ui_preferences;
create trigger trg_user_ui_preferences_updated_at
  before update on public.user_ui_preferences
  for each row execute function public.set_user_ui_preferences_updated_at();