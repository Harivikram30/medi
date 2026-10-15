create table if not exists public.medconnect_records (
  collection text not null,
  id text not null,
  data jsonb not null,
  updated_at timestamptz not null default now(),
  primary key (collection, id)
);

alter table public.medconnect_records enable row level security;

create policy "Allow app access to MedConnect records"
  on public.medconnect_records
  for all
  to anon, authenticated
  using (true)
  with check (true);