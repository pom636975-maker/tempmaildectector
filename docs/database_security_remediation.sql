-- STRAVOTECH database security/performance remediation
-- Apply this in the InsForge/Postgres SQL editor or migration runner.
-- It fixes all 35 InsForge Backend Advisor findings from the pasted report:
-- 1. Tables publicly accessible: ENABLE + FORCE RLS on 18 tables.
-- 2. Foreign-key columns missing indexes: 17 FK indexes.
--
-- Note: CREATE INDEX CONCURRENTLY cannot run inside a transaction block.
-- Run this file as a standalone SQL script, not wrapped in BEGIN/COMMIT.

-- Foreign-key indexes
create index concurrently if not exists idx_workspaces_owner_id on public.workspaces (owner_id);
create index concurrently if not exists idx_workspace_members_user_id on public.workspace_members (user_id);
create index concurrently if not exists idx_workspace_members_workspace_id on public.workspace_members (workspace_id);
create index concurrently if not exists idx_projects_workspace_id on public.projects (workspace_id);
create index concurrently if not exists idx_api_keys_project_id on public.api_keys (project_id);
create index concurrently if not exists idx_risk_events_api_key_id on public.risk_events (api_key_id);
create index concurrently if not exists idx_rules_project_id on public.rules (project_id);
create index concurrently if not exists idx_blocked_domains_project_id on public.blocked_domains (project_id);
create index concurrently if not exists idx_allowed_domains_project_id on public.allowed_domains (project_id);
create index concurrently if not exists idx_blocked_ips_project_id on public.blocked_ips (project_id);
create index concurrently if not exists idx_allowed_ips_project_id on public.allowed_ips (project_id);
create index concurrently if not exists idx_integrations_project_id on public.integrations (project_id);
create index concurrently if not exists idx_alerts_project_id on public.alerts (project_id);
create index concurrently if not exists idx_billing_usage_workspace_id on public.billing_usage (workspace_id);
create index concurrently if not exists idx_reports_project_id on public.reports (project_id);
create index concurrently if not exists idx_audit_logs_project_id on public.audit_logs (project_id);
create index concurrently if not exists idx_audit_logs_workspace_id on public.audit_logs (workspace_id);

-- Extra indexes used heavily by the STRAVOTECH backend.
create index concurrently if not exists idx_risk_events_project_id on public.risk_events (project_id);
create index concurrently if not exists idx_disposable_domains_domain on public.disposable_domains (domain);
create index concurrently if not exists idx_blocked_domains_domain on public.blocked_domains (domain);
create index concurrently if not exists idx_allowed_domains_domain on public.allowed_domains (domain);
create index concurrently if not exists idx_blocked_ips_ip_address on public.blocked_ips (ip_address);
create index concurrently if not exists idx_allowed_ips_ip_address on public.allowed_ips (ip_address);
create index concurrently if not exists idx_api_keys_key_hash on public.api_keys (key_hash);
create index concurrently if not exists idx_risk_events_created_at on public.risk_events (created_at desc);
create index concurrently if not exists idx_internal_signup_attempts_created_at on public.internal_signup_attempts (created_at desc);
create index concurrently if not exists idx_internal_signup_attempts_email_domain on public.internal_signup_attempts (email_domain);

-- Lock down app tables from direct public/browser database access.
-- The Node backend uses the InsForge admin API key, so it can continue to read/write.
alter table public.internal_signup_attempts enable row level security;
alter table public.profiles enable row level security;
alter table public.workspaces enable row level security;
alter table public.workspace_members enable row level security;
alter table public.projects enable row level security;
alter table public.api_keys enable row level security;
alter table public.risk_events enable row level security;
alter table public.rules enable row level security;
alter table public.disposable_domains enable row level security;
alter table public.blocked_domains enable row level security;
alter table public.allowed_domains enable row level security;
alter table public.blocked_ips enable row level security;
alter table public.allowed_ips enable row level security;
alter table public.integrations enable row level security;
alter table public.alerts enable row level security;
alter table public.billing_usage enable row level security;
alter table public.reports enable row level security;
alter table public.audit_logs enable row level security;

alter table public.internal_signup_attempts force row level security;
alter table public.profiles force row level security;
alter table public.workspaces force row level security;
alter table public.workspace_members force row level security;
alter table public.projects force row level security;
alter table public.api_keys force row level security;
alter table public.risk_events force row level security;
alter table public.rules force row level security;
alter table public.disposable_domains force row level security;
alter table public.blocked_domains force row level security;
alter table public.allowed_domains force row level security;
alter table public.blocked_ips force row level security;
alter table public.allowed_ips force row level security;
alter table public.integrations force row level security;
alter table public.alerts force row level security;
alter table public.billing_usage force row level security;
alter table public.reports force row level security;
alter table public.audit_logs force row level security;

revoke all on table public.internal_signup_attempts from anon, authenticated;
revoke all on table public.profiles from anon, authenticated;
revoke all on table public.workspaces from anon, authenticated;
revoke all on table public.workspace_members from anon, authenticated;
revoke all on table public.projects from anon, authenticated;
revoke all on table public.api_keys from anon, authenticated;
revoke all on table public.risk_events from anon, authenticated;
revoke all on table public.rules from anon, authenticated;
revoke all on table public.disposable_domains from anon, authenticated;
revoke all on table public.blocked_domains from anon, authenticated;
revoke all on table public.allowed_domains from anon, authenticated;
revoke all on table public.blocked_ips from anon, authenticated;
revoke all on table public.allowed_ips from anon, authenticated;
revoke all on table public.integrations from anon, authenticated;
revoke all on table public.alerts from anon, authenticated;
revoke all on table public.billing_usage from anon, authenticated;
revoke all on table public.reports from anon, authenticated;
revoke all on table public.audit_logs from anon, authenticated;
