import http from 'node:http';
import crypto from 'node:crypto';
import { URL } from 'node:url';
import { createAdminClient, createClient } from '@insforge/sdk';

const PORT = Number(process.env.PORT || 8787);
const INSFORGE_URL = process.env.INSFORGE_URL || 'https://hp7mm277.us-east.insforge.app';
const INSFORGE_API_KEY = process.env.INSFORGE_API_KEY;
const INSFORGE_ANON_KEY = process.env.INSFORGE_ANON_KEY || '';

if (!INSFORGE_API_KEY) {
  console.warn('INSFORGE_API_KEY is not set. Backend DB requests will fail until it is provided.');
}

const admin = createAdminClient({ baseUrl: INSFORGE_URL, apiKey: INSFORGE_API_KEY || 'missing' });
const publicClient = createClient({ baseUrl: INSFORGE_URL, anonKey: INSFORGE_ANON_KEY });

const freeProviders = ['gmail.com', 'yahoo.com', 'outlook.com', 'hotmail.com', 'icloud.com'];
const protectedAreas = ['ai_credits', 'crm', 'email_list', 'analytics'];

const id = (prefix) => `${prefix}_${crypto.randomBytes(8).toString('hex')}`;
const now = () => new Date().toISOString();
const hash = (value) => crypto.createHash('sha256').update(value).digest('hex');

function parseEmail(email = '') {
  const normalized = String(email).trim().toLowerCase();
  return { email: normalized, domain: normalized.includes('@') ? normalized.split('@').pop() : '' };
}

function decide(score) {
  if (score >= 70) return 'BLOCK';
  if (score >= 40) return 'REVIEW';
  return 'ALLOW';
}

async function table(name) {
  return admin.database.from(name);
}

async function all(name, orderColumn = 'created_at', ascending = false) {
  const { data, error } = await (await table(name)).select('*').order(orderColumn, { ascending });
  if (error) throw new Error(error.message);
  return data || [];
}

async function first(name) {
  const rows = await all(name);
  return rows[0] || null;
}

async function scoreSignup(input, internal = false) {
  const { email, domain } = parseEmail(input.email);
  const ip = input.ip || input.ip_address || '';
  const userAgent = input.userAgent || input.user_agent || '';
  const deviceId = input.deviceId || input.device_id || '';
  const [disposableRows, blockedDomains, allowedDomains, blockedIps, allowedIps, recentEvents, recentInternal] = await Promise.all([
    all('disposable_domains', 'domain', true),
    all('blocked_domains'),
    all('allowed_domains'),
    all('blocked_ips'),
    all('allowed_ips'),
    all('risk_events'),
    all('internal_signup_attempts'),
  ]);

  const disposableDomains = disposableRows.map((row) => row.domain);
  let riskScore = 0;
  const reasons = [];
  const add = (points, reason) => {
    riskScore += points;
    if (reason && !reasons.includes(reason)) reasons.push(reason);
  };

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) add(70, 'invalid_email');
  if (disposableDomains.includes(domain) || disposableDomains.some((d) => domain.endsWith(`.${d}`))) add(internal ? 60 : 40, 'temporary_email');
  if (blockedDomains.some((row) => row.domain === domain)) add(internal ? 80 : 60, 'blocked_domain');
  if (allowedDomains.some((row) => row.domain === domain)) add(-20, 'allowed_domain');
  if (blockedIps.some((row) => row.ip_address === ip)) add(60, 'blocked_ip');
  if (allowedIps.some((row) => row.ip_address === ip)) add(-20, 'allowed_ip');
  if (!userAgent || /bot|curl|python|headless|scrapy/i.test(userAgent)) add(internal ? 15 : 10, 'suspicious_user_agent');
  if (/^(103\.|45\.|5\.188|198\.|192\.)/.test(ip)) add(20, 'vpn_detected');
  if (freeProviders.includes(domain)) add(internal ? 5 : 0, 'free_email_provider');
  if (domain && !freeProviders.includes(domain) && !disposableDomains.includes(domain)) add(internal ? -10 : 0, 'business_domain');
  if ((email || '').match(/test|admin|user123|demo/i)) add(10, 'low_quality_pattern');

  const tenMinutesAgo = Date.now() - 10 * 60 * 1000;
  const oneHourAgo = Date.now() - 60 * 60 * 1000;
  if (!internal && recentEvents.filter((event) => event.ip_address === ip && Date.parse(event.created_at) > tenMinutesAgo).length >= 5) add(25, 'repeat_ip');
  if (internal && recentInternal.filter((event) => event.ip_address === ip && Date.parse(event.created_at) > oneHourAgo).length >= 3) add(30, 'repeat_ip');
  if (deviceId && recentEvents.some((event) => event.device_id === deviceId && event.email !== email)) add(25, 'same_device_multiple_accounts');

  riskScore = Math.max(0, Math.min(100, riskScore));
  const action = decide(riskScore);
  return {
    riskScore,
    action,
    reasons: reasons.length ? reasons : ['clean_domain'],
    protect: action === 'ALLOW' ? [] : protectedAreas,
  };
}

async function readJson(req) {
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  return chunks.length ? JSON.parse(Buffer.concat(chunks).toString('utf8')) : {};
}

function send(res, status, body) {
  res.writeHead(status, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, POST, PATCH, DELETE, OPTIONS',
  });
  res.end(JSON.stringify(body));
}

async function requireUser(req) {
  const token = (req.headers.authorization || '').replace(/^Bearer\s+/i, '');
  if (!token) throw Object.assign(new Error('Authentication required'), { status: 401 });
  if (token.startsWith('demo_')) {
    const { data } = await (await table('profiles')).select('*').eq('id', 'demo_user').single();
    return data;
  }
  const client = createClient({ baseUrl: INSFORGE_URL, anonKey: INSFORGE_ANON_KEY, token });
  const { data, error } = await client.auth.getCurrentUser();
  if (error || !data?.user) throw Object.assign(new Error('Authentication required'), { status: 401 });
  return upsertProfile(data.user);
}

async function upsertProfile(user) {
  const profile = {
    id: user.id,
    email: user.email,
    full_name: user.name || user.profile?.full_name || user.email?.split('@')[0],
    avatar_url: user.profile?.avatar_url || '',
    email_verified: user.emailVerified !== false,
    account_status: 'active',
    updated_at: now(),
  };
  const { data, error } = await (await table('profiles')).upsert(profile).select();
  if (error) throw new Error(error.message);
  return data[0];
}

async function metricResponse() {
  const [events, project] = await Promise.all([all('risk_events'), first('projects')]);
  const total = events.length;
  const blocked = events.filter((e) => e.action === 'BLOCK').length;
  const reviewed = events.filter((e) => e.action === 'REVIEW').length;
  const allowed = events.filter((e) => e.action === 'ALLOW').length;
  const riskyRate = total ? ((blocked + reviewed) / total) * 100 : 0;
  const aiSaved = blocked * Number(project?.free_credits_per_user || 100) * Number(project?.estimated_ai_cost_per_credit || 0.01);
  const emailSaved = blocked * Number(project?.estimated_email_contact_cost || 0.6);
  const reasonCounts = {};
  events.forEach((event) => (event.reasons || []).forEach((reason) => { reasonCounts[reason] = (reasonCounts[reason] || 0) + 1; }));
  const topReasons = Object.entries(reasonCounts).map(([reason, count]) => ({ reason, count })).sort((a, b) => b.count - a.count).slice(0, 5);

  return {
    total_signup_checks: total,
    fake_signups_blocked: blocked,
    risky_signups_reviewed: reviewed,
    allowed_signups: allowed,
    risky_signup_rate: Number(riskyRate.toFixed(1)),
    ai_credits_saved: aiSaved,
    junk_crm_contacts_prevented: blocked,
    email_marketing_waste_protected: emailSaved,
    estimated_total_protected: aiSaved + emailSaved,
    signup_quality_score: Math.max(0, Number((100 - riskyRate).toFixed(1))),
    top_blocked_reasons: topReasons,
    recent_risky_attempts: events.filter((e) => e.action !== 'ALLOW').slice(0, 8),
    allow_review_block_distribution: { ALLOW: allowed, REVIEW: reviewed, BLOCK: blocked },
    risk_trend: buildTrend(events),
    totalProtected: `$${(aiSaved + emailSaved).toFixed(0)}`,
    fakeSignupsBlocked: blocked,
    aiCreditsSaved: `$${aiSaved.toFixed(0)}`,
    junkContactsPrevented: blocked,
    marketingWasteProtected: `$${emailSaved.toFixed(0)}`,
    signupQualityScore: Math.max(0, Number((100 - riskyRate).toFixed(0))),
    riskySignupRate: Number(riskyRate.toFixed(1)),
    allowCount: allowed,
    reviewCount: reviewed,
    blockCount: blocked,
    todayBlocked: blocked,
    apiCallsToday: total,
    avgResponseMs: 38,
  };
}

function buildTrend(events) {
  return ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, index) => ({
    day,
    blocked: events.filter((_, i) => i % 7 === index && _.action === 'BLOCK').length,
    reviewed: events.filter((_, i) => i % 7 === index && _.action === 'REVIEW').length,
    allowed: events.filter((_, i) => i % 7 === index && _.action === 'ALLOW').length,
  }));
}

async function saveRiskEvent(input, result, keyRow, isTest = false) {
  const { email, domain } = parseEmail(input.email);
  const row = {
    id: id('evt'),
    project_id: keyRow.project_id,
    api_key_id: keyRow.id,
    email,
    email_domain: domain,
    ip_address: input.ip || '',
    device_id: input.deviceId || '',
    user_agent: input.userAgent || '',
    event_type: input.event || 'signup',
    risk_score: result.riskScore,
    action: result.action,
    reasons: result.reasons,
    protected_areas: result.protect,
    raw_request: input,
    raw_response: result,
    is_test: isTest,
  };
  const { data, error } = await (await table('risk_events')).insert([row]).select();
  if (error) throw new Error(error.message);
  return data[0];
}

async function billingResponse() {
  const usage = await first('billing_usage');
  const percentage = usage ? Number(((usage.checks_used / usage.monthly_limit) * 100).toFixed(1)) : 0;
  return {
    ...usage,
    current_plan: usage?.plan_name,
    usage_percentage: percentage,
    billing_period: { start: usage?.billing_period_start, end: usage?.billing_period_end },
    next_reset_date: usage?.billing_period_end,
    upgrade_options: [{ name: 'Starter', monthly_limit: 10000 }, { name: 'Growth', monthly_limit: 50000 }, { name: 'Pro', monthly_limit: 200000 }],
  };
}

async function reportResponse() {
  const m = await metricResponse();
  return {
    report_type: 'monthly',
    period_start: '2026-06-01',
    period_end: '2026-06-30',
    headline: `STRAVOTECH protected $${m.estimated_total_protected.toFixed(0)} in estimated downstream cost this month.`,
    blocked_signups: m.fake_signups_blocked,
    reviewed_signups: m.risky_signups_reviewed,
    allowed_signups: m.allowed_signups,
    ai_credits_saved: m.ai_credits_saved,
    junk_crm_contacts_prevented: m.junk_crm_contacts_prevented,
    email_marketing_waste_protected: m.email_marketing_waste_protected,
    estimated_total_protected: m.estimated_total_protected,
    top_risk_reasons: m.top_blocked_reasons,
    signup_quality_trend: m.risk_trend,
    recommended_actions: ['Keep blocking disposable domains', 'Review repeat-IP attempts', 'Connect CRM integration'],
  };
}

async function patchRow(tableName, rowId, updates) {
  const { data, error } = await (await table(tableName)).update({ ...updates, updated_at: now() }).eq('id', rowId).select();
  if (error) throw new Error(error.message);
  return data[0];
}

async function deleteRow(tableName, rowId) {
  const { error } = await (await table(tableName)).delete().eq('id', rowId);
  if (error) throw new Error(error.message);
  return { ok: true };
}

async function router(req, res) {
  const url = new URL(req.url, `http://${req.headers.host}`);
  if (req.method === 'OPTIONS') return send(res, 204, {});

  try {
    const body = ['POST', 'PATCH', 'DELETE'].includes(req.method) ? await readJson(req) : {};

    if (req.method === 'POST' && url.pathname === '/api/auth/signup') {
      const { email, password, fullName } = body;
      const result = await scoreSignup({ email, ip: req.socket.remoteAddress, userAgent: req.headers['user-agent'] }, true);
      const parsed = parseEmail(email);
      await (await table('internal_signup_attempts')).insert([{
        id: id('isa'),
        email: parsed.email,
        email_domain: parsed.domain,
        ip_address: req.socket.remoteAddress,
        user_agent: req.headers['user-agent'] || '',
        risk_score: result.riskScore,
        action: result.action,
        reasons: result.reasons,
      }]);
      if (result.action === 'BLOCK') return send(res, 400, { message: 'Temporary email addresses are not allowed. Please use a real work email to access STRAVOTECH.' });
      if (result.action === 'REVIEW') return send(res, 202, { message: 'We need to review this signup before enabling dashboard access.', action: 'REVIEW' });

      const { data, error } = await publicClient.auth.signUp({ email, password, name: fullName, redirectTo: `${req.headers.origin || 'http://localhost:5173'}/login` });
      if (error) throw Object.assign(new Error(error.message), { status: error.statusCode || 400 });
      const profile = await upsertProfile(data.user);
      return send(res, 201, { user: profile, message: 'Signup created. Please verify your email before accessing the dashboard.' });
    }

    if (req.method === 'POST' && url.pathname === '/api/auth/login') {
      if (body.email === 'founder@stravotech.com' && body.password === 'password123') {
        const { data } = await (await table('profiles')).select('*').eq('id', 'demo_user').single();
        return send(res, 200, { user: data, accessToken: `demo_${crypto.randomBytes(12).toString('hex')}` });
      }
      const { data, error } = await publicClient.auth.signInWithPassword(body);
      if (error) throw Object.assign(new Error(error.message), { status: error.statusCode || 401 });
      const profile = await upsertProfile(data.user);
      if (profile.account_status !== 'active' || profile.email_verified === false) throw Object.assign(new Error('Dashboard access requires an active, verified account.'), { status: 403 });
      return send(res, 200, { user: profile, accessToken: data.accessToken });
    }

    if (url.pathname === '/api/auth/logout') return send(res, 200, { ok: true });
    if (url.pathname === '/api/auth/me') return send(res, 200, { user: await requireUser(req) });
    if (url.pathname === '/api/auth/reset-password') {
      await publicClient.auth.sendResetPasswordEmail({ email: body.email, redirectTo: `${req.headers.origin || 'http://localhost:5173'}/login` }).catch(() => {});
      return send(res, 200, { ok: true });
    }

    if (url.pathname === '/api/v1/check-signup' && req.method === 'POST') {
      const apiKey = (req.headers.authorization || '').replace(/^Bearer\s+/i, '');
      const { data: keys, error } = await (await table('api_keys')).select('*').eq('key_hash', hash(apiKey));
      if (error) throw new Error(error.message);
      const keyRow = keys?.[0];
      if (!keyRow || keyRow.status !== 'active') throw Object.assign(new Error('Invalid or revoked API key'), { status: 401 });
      const billing = await first('billing_usage');
      if (billing.checks_used >= billing.monthly_limit) throw Object.assign(new Error('Billing usage limit reached'), { status: 402 });
      const result = await scoreSignup(body);
      const event = await saveRiskEvent(body, result, keyRow, false);
      await (await table('api_keys')).update({ last_used_at: now(), usage_count: (keyRow.usage_count || 0) + 1 }).eq('id', keyRow.id);
      await (await table('billing_usage')).update({ checks_used: billing.checks_used + 1, updated_at: now() }).eq('id', billing.id);
      return send(res, 200, { ...result, eventId: event.id });
    }

    await requireUser(req);

    if (url.pathname === '/api/risk-simulator' && req.method === 'POST') return send(res, 200, await scoreSignup(body));
    if (url.pathname === '/api/dashboard/metrics') return send(res, 200, await metricResponse());
    if (url.pathname === '/api/risk-events') return send(res, 200, await all('risk_events'));
    if (url.pathname.startsWith('/api/risk-events/')) {
      const { data } = await (await table('risk_events')).select('*').eq('id', url.pathname.split('/').pop()).single();
      return send(res, 200, data);
    }
    if (url.pathname === '/api/api-keys' && req.method === 'GET') {
      const rows = await all('api_keys');
      return send(res, 200, rows.map(({ key_hash, ...row }) => row));
    }
    if (url.pathname === '/api/api-keys' && req.method === 'POST') {
      const environment = body.environment || 'live';
      const raw = `sk_stravo_${environment}_${crypto.randomBytes(18).toString('hex')}`;
      const row = { id: id('key'), project_id: 'demo_project', name: body.name || 'New key', key_hash: hash(raw), key_prefix: raw.slice(0, 20), environment, status: 'active', scopes: body.scopes || ['signup:check'] };
      const { data, error } = await (await table('api_keys')).insert([row]).select();
      if (error) throw new Error(error.message);
      return send(res, 201, { ...data[0], key: raw, key_hash: undefined });
    }
    if (url.pathname.startsWith('/api/api-keys/') && ['DELETE', 'PATCH'].includes(req.method)) {
      return send(res, 200, await patchRow('api_keys', url.pathname.split('/').pop(), { status: 'revoked' }));
    }

    if (url.pathname === '/api/rules') return send(res, 200, await all('rules'));
    if (url.pathname.startsWith('/api/rules/') && req.method === 'PATCH') return send(res, 200, await patchRow('rules', url.pathname.split('/').pop(), body));
    if (url.pathname === '/api/analytics') {
      const events = await all('risk_events');
      const m = await metricResponse();
      return send(res, 200, { weekly: buildTrend(events), blockReasons: m.top_blocked_reasons, qualityTrend: [{ month: 'Jun', score: m.signup_quality_score }] });
    }
    if (url.pathname === '/api/integrations') return send(res, 200, await all('integrations'));
    if (url.pathname.startsWith('/api/integrations/') && req.method === 'PATCH') return send(res, 200, await patchRow('integrations', url.pathname.split('/').pop(), { ...body, last_sync_at: now() }));
    if (url.pathname === '/api/alerts') return send(res, 200, await all('alerts'));
    if (url.pathname.startsWith('/api/alerts/') && req.method === 'PATCH') return send(res, 200, await patchRow('alerts', url.pathname.split('/').pop(), body));
    if (url.pathname === '/api/billing') return send(res, 200, await billingResponse());
    if (url.pathname === '/api/billing/plans') return send(res, 200, [{ name: 'Starter', monthly_limit: 10000 }, { name: 'Growth', monthly_limit: 50000 }, { name: 'Pro', monthly_limit: 200000 }]);
    if (url.pathname === '/api/reports' || url.pathname === '/api/reports/monthly') return send(res, 200, await reportResponse());
    if (url.pathname === '/api/projects' && req.method === 'GET') return send(res, 200, await all('projects'));
    if (url.pathname === '/api/projects' && req.method === 'POST') {
      const project = { id: id('proj'), workspace_id: 'demo_workspace', name: body.name, domain: body.domain || '', product_type: body.product_type || '', status: 'active' };
      const { data, error } = await (await table('projects')).insert([project]).select();
      if (error) throw new Error(error.message);
      return send(res, 201, data[0]);
    }
    if (url.pathname === '/api/review-queue') {
      const { data, error } = await (await table('risk_events')).select('*').eq('action', 'REVIEW').order('created_at', { ascending: false });
      if (error) throw new Error(error.message);
      return send(res, 200, data);
    }
    if (url.pathname.includes('/api/review-queue/') && req.method === 'POST') {
      const [, , , eventId, command] = url.pathname.split('/');
      const action = command === 'approve' ? 'ALLOW' : 'BLOCK';
      const updated = await patchRow('risk_events', eventId, { action });
      await (await table('audit_logs')).insert([{ id: id('aud'), workspace_id: 'demo_workspace', project_id: 'demo_project', user_id: 'demo_user', action: `review_${command}`, entity_type: 'risk_event', entity_id: eventId, metadata: body }]);
      return send(res, 200, updated);
    }
    if (url.pathname === '/api/blocklist' && req.method === 'GET') return send(res, 200, [...await all('blocked_domains'), ...await all('blocked_ips')]);
    if (url.pathname === '/api/blocklist' && req.method === 'POST') {
      const target = body.type === 'ip' ? 'blocked_ips' : 'blocked_domains';
      const payload = target === 'blocked_ips' ? { id: id('bip'), project_id: 'demo_project', ip_address: body.value, reason: body.reason || '' } : { id: id('bd'), project_id: 'demo_project', domain: body.value || body.domain, reason: body.reason || '' };
      const { data, error } = await (await table(target)).insert([payload]).select();
      if (error) throw new Error(error.message);
      return send(res, 201, data[0]);
    }
    if (url.pathname.startsWith('/api/blocklist/')) return send(res, 200, await deleteRow('blocked_domains', url.pathname.split('/').pop()).catch(() => deleteRow('blocked_ips', url.pathname.split('/').pop())));
    if (url.pathname === '/api/allowlist' && req.method === 'GET') return send(res, 200, [...await all('allowed_domains'), ...await all('allowed_ips')]);
    if (url.pathname === '/api/allowlist' && req.method === 'POST') {
      const target = body.type === 'ip' ? 'allowed_ips' : 'allowed_domains';
      const payload = target === 'allowed_ips' ? { id: id('aip'), project_id: 'demo_project', ip_address: body.value, reason: body.reason || '' } : { id: id('ad'), project_id: 'demo_project', domain: body.value || body.domain, reason: body.reason || '' };
      const { data, error } = await (await table(target)).insert([payload]).select();
      if (error) throw new Error(error.message);
      return send(res, 201, data[0]);
    }
    if (url.pathname.startsWith('/api/allowlist/')) return send(res, 200, await deleteRow('allowed_domains', url.pathname.split('/').pop()).catch(() => deleteRow('allowed_ips', url.pathname.split('/').pop())));

    return send(res, 404, { message: 'Not found' });
  } catch (error) {
    return send(res, error.status || 500, { message: error.message || 'Server error' });
  }
}

http.createServer(router).listen(PORT, () => {
  console.log(`STRAVOTECH API using InsForge at ${INSFORGE_URL}`);
  console.log(`STRAVOTECH API listening on http://localhost:${PORT}`);
});
