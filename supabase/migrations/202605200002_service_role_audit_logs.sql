-- Service-role operational audit log for closed-beta admin/server exceptions.
-- Service role bypasses RLS; authenticated users receive no direct grants.

create table if not exists public.service_role_audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor text not null,
  route text not null,
  target_type text not null,
  target_id text,
  action text not null,
  ts timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index if not exists service_role_audit_logs_ts_idx
  on public.service_role_audit_logs(ts desc);

create index if not exists service_role_audit_logs_target_idx
  on public.service_role_audit_logs(target_type, target_id, ts desc);

alter table public.service_role_audit_logs enable row level security;

comment on table public.service_role_audit_logs is
  'Server-side audit log for service-role access. Written through service-role helpers; no authenticated direct grants.';
