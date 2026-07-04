-- Talk to Kita: persisted conversation messages per user

create table public.kita_chat_messages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  role text not null check (role in ('user', 'assistant', 'system')),
  content text not null,
  created_at timestamptz not null default now()
);

create index kita_chat_messages_user_created_idx
  on public.kita_chat_messages (user_id, created_at);

alter table public.kita_chat_messages enable row level security;

create policy "Users manage own chat messages"
  on public.kita_chat_messages for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
