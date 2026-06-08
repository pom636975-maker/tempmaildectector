import http from 'node:http';
import crypto from 'node:crypto';
import dns from 'node:dns/promises';
import { URL } from 'node:url';
import { createAdminClient, createClient } from '@insforge/sdk';

const PORT = Number(process.env.PORT || 8787);
const INSFORGE_URL = process.env.INSFORGE_URL || 'https://hp7mm277.us-east.insforge.app';
const INSFORGE_API_KEY = process.env.INSFORGE_API_KEY;
const INSFORGE_ANON_KEY = process.env.INSFORGE_ANON_KEY || '';
const ALLOWED_ORIGIN = process.env.ALLOWED_ORIGIN || '*';
const MAX_JSON_BYTES = Number(process.env.MAX_JSON_BYTES || 64 * 1024);

if (!INSFORGE_API_KEY) {
  console.warn('INSFORGE_API_KEY is not set. Backend DB requests will fail until it is provided.');
}

const admin = createAdminClient({ baseUrl: INSFORGE_URL, apiKey: INSFORGE_API_KEY || 'missing' });
const publicClient = createClient({ baseUrl: INSFORGE_URL, anonKey: INSFORGE_ANON_KEY });

const freeProviders = ['gmail.com', 'yahoo.com', 'outlook.com', 'hotmail.com', 'icloud.com'];
const protectedAreas = ['ai_credits', 'crm', 'email_list', 'analytics'];
const mxCache = new Map();
const disposableDomainHints = [
  '10minute', '20minute', 'temp-mail', 'tempmail', 'throwaway', 'trashmail',
  'guerrilla', 'guerrillamail', 'maildrop', 'mailinator', 'yopmail',
  'sharklasers', 'getairmail', 'fakeinbox', 'dispostable', 'burner',
  'spamgourmet', 'moakt', 'mytemp', 'tmpmail', 'tempm', 'emailondeck',
  'tempmailers', 'tempmails', 'temporarymail', 'mailtemp',
];
const disposableMxHints = [
  'mailinator', 'guerrillamail', 'yopmail', 'maildrop', 'tempmail',
  'temp-mail', 'tempmailo', 'snapmail', 'mail.tm', 'trashmail',
  'moakt', 'dispostable', 'spamgourmet',
];
const observedDisposableDomains = [
  'bncinema.com',
  'temp-mail.io',
  'tempmailo.com',
  'snapmail.in',
  'mail.tm',
  'internxt.com',
];
const higherRiskTlds = new Set(['click', 'monster', 'quest', 'rest', 'sbs', 'shop', 'site', 'space', 'top', 'work', 'xyz']);
const rateBuckets = new Map();
const ratePolicies = [
  { match: (req, url) => req.method === 'POST' && url.pathname === '/api/auth/signup', limit: 8, windowMs: 15 * 60 * 1000, name: 'signup' },
  { match: (req, url) => req.method === 'POST' && url.pathname === '/api/auth/login', limit: 20, windowMs: 15 * 60 * 1000, name: 'login' },
  { match: (req, url) => req.method === 'POST' && url.pathname === '/api/auth/verify-email', limit: 10, windowMs: 15 * 60 * 1000, name: 'verify-email' },
  { match: (req, url) => req.method === 'POST' && url.pathname === '/api/auth/resend-verification', limit: 4, windowMs: 15 * 60 * 1000, name: 'resend-verification' },
  { match: (req, url) => req.method === 'POST' && url.pathname === '/api/v1/check-signup', limit: 120, windowMs: 60 * 1000, name: 'signup-check' },
  { match: (req, url) => url.pathname.startsWith('/api/'), limit: 300, windowMs: 60 * 1000, name: 'api' },
];

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

function isListedDomain(domain, domains) {
  return domains.includes(domain) || domains.some((listed) => domain.endsWith(`.${listed}`));
}

function domainCandidates(domain) {
  const parts = domain.split('.').filter(Boolean);
  const candidates = [];
  for (let index = 0; index < parts.length - 1; index += 1) {
    candidates.push(parts.slice(index).join('.'));
  }
  return candidates;
}

async function hasDomainRow(tableName, domain, column = 'domain') {
  const candidates = domainCandidates(domain);
  if (!candidates.length) return false;
  const checks = await Promise.all(candidates.map(async (candidate) => {
    const { data, error } = await (await table(tableName)).select('id').eq(column, candidate);
    if (error) throw new Error(error.message);
    return Boolean(data?.length);
  }));
  return checks.some(Boolean);
}

function hasDisposableDomainHint(domain) {
  const compact = domain.replace(/[^a-z0-9]/g, '');
  return disposableDomainHints.some((hint) => compact.includes(hint.replace(/[^a-z0-9]/g, '')));
}

function hasLowQualityLocalPart(email) {
  const [local = ''] = email.split('@');
  if (local.length < 10) return false;
  const digits = (local.match(/\d/g) || []).length;
  const letters = (local.match(/[a-z]/gi) || []).length;
  const mixedRandom = /[a-z]{3,}\d{3,}|\d{3,}[a-z]{3,}/i.test(local);
  return digits >= 4 && letters >= 4 && mixedRandom;
}

function emailSeriesKey(email) {
  const { email: normalized, domain } = parseEmail(email);
  const [local = ''] = normalized.split('@');
  const base = local.replace(/\d+$/g, '');
  return base && domain ? `${base}@${domain}` : '';
}

function domainAgeRisk(domain) {
  const labels = domain.split('.');
  const root = labels.length > 1 ? labels[labels.length - 2] : domain;
  const compact = root.replace(/[^a-z0-9]/g, '');
  let score = 0;
  if (compact.length >= 9 && /[a-z]{3,}\d{2,}|\d{2,}[a-z]{3,}/i.test(compact)) score += 15;
  if (compact.length >= 11 && !/[aeiou]{2}/i.test(compact)) score += 10;
  if (/cinema|movie|stream|video|game|deal|coupon|bonus|free/.test(compact)) score += 10;
  return score;
}

async function inspectDomain(domain) {
  if (!domain) return { hasMx: false, mxHosts: [], mxDisposableHint: false };
  const cached = mxCache.get(domain);
  if (cached && cached.expiresAt > Date.now()) return cached.value;

  let value;
  try {
    const records = await dns.resolveMx(domain);
    const mxHosts = records.map((record) => record.exchange.toLowerCase());
    value = {
      hasMx: mxHosts.length > 0,
      mxHosts,
      mxDisposableHint: mxHosts.some((host) => disposableMxHints.some((hint) => host.includes(hint))),
    };
  } catch {
    value = { hasMx: false, mxHosts: [], mxDisposableHint: false };
  }

  mxCache.set(domain, { value, expiresAt: Date.now() + 6 * 60 * 60 * 1000 });
  return value;
}

function authUserFrom(data) {
  return data?.user || data?.data?.user || (data?.id && data?.email ? data : null);
}

function validateSignupCheckPayload(input) {
  const { email } = parseEmail(input.email);
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw Object.assign(new Error('A valid email is required.'), { status: 400 });
  }
  if (input.ip && !/^[a-f0-9:.]{3,45}$/i.test(String(input.ip))) {
    throw Object.assign(new Error('IP address is invalid.'), { status: 400 });
  }
  if (input.deviceId && String(input.deviceId).length > 128) {
    throw Object.assign(new Error('Device ID is too long.'), { status: 400 });
  }
  if (input.userAgent && String(input.userAgent).length > 512) {
    throw Object.assign(new Error('User agent is too long.'), { status: 400 });
  }
  return {
    email,
    ip: input.ip ? String(input.ip) : '',
    deviceId: input.deviceId ? String(input.deviceId) : '',
    userAgent: input.userAgent ? String(input.userAgent) : '',
    event: input.event ? String(input.event).slice(0, 64) : 'signup',
    metadata: typeof input.metadata === 'object' && input.metadata !== null ? input.metadata : {},
  };
}

function hasScope(keyRow, scope) {
  return Array.isArray(keyRow.scopes) && keyRow.scopes.includes(scope);
}

function getClientIp(req) {
  const forwarded = req.headers['x-forwarded-for'];
  return String(Array.isArray(forwarded) ? forwarded[0] : forwarded || req.socket.remoteAddress || '')
    .split(',')[0]
    .trim();
}

function rateLimitKey(req, policy) {
  const token = (req.headers.authorization || '').replace(/^Bearer\s+/i, '');
  const tokenPart = token ? hash(token).slice(0, 16) : getClientIp(req);
  return `${policy.name}:${tokenPart}`;
}

function checkRateLimit(req, url) {
  const policy = ratePolicies.find((candidate) => candidate.match(req, url));
  if (!policy) return null;

  const key = rateLimitKey(req, policy);
  const currentTime = Date.now();
  const bucket = rateBuckets.get(key);
  if (!bucket || bucket.resetAt <= currentTime) {
    rateBuckets.set(key, { count: 1, resetAt: currentTime + policy.windowMs });
    return null;
  }

  bucket.count += 1;
  if (bucket.count <= policy.limit) return null;

  const retryAfter = Math.ceil((bucket.resetAt - currentTime) / 1000);
  return {
    status: 429,
    retryAfter,
    message: `Too many ${policy.name} requests. Try again in ${retryAfter} seconds.`,
  };
}

function pruneRateBuckets() {
  const currentTime = Date.now();
  for (const [key, bucket] of rateBuckets) {
    if (bucket.resetAt <= currentTime) rateBuckets.delete(key);
  }
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

async function insertRows(tableName, rows) {
  const { data, error } = await (await table(tableName)).insert(rows).select();
  if (error) throw new Error(error.message);
  return data || [];
}

async function scoreSignup(input, internal = false) {
  const { email, domain } = parseEmail(input.email);
  const ip = input.ip || input.ip_address || '';
  const userAgent = input.userAgent || input.user_agent || '';
  const deviceId = input.deviceId || input.device_id || '';
  const [isDisposableDomain, isBlockedDomain, isAllowedDomain, blockedIps, allowedIps, recentEvents, recentInternal] = await Promise.all([
    hasDomainRow('disposable_domains', domain),
    hasDomainRow('blocked_domains', domain),
    hasDomainRow('allowed_domains', domain),
    all('blocked_ips'),
    all('allowed_ips'),
    all('risk_events'),
    all('internal_signup_attempts'),
  ]);

  const fallbackDisposableDomains = observedDisposableDomains;
  const domainIntel = await inspectDomain(domain);
  let riskScore = 0;
  const reasons = [];
  const add = (points, reason) => {
    riskScore += points;
    if (reason && !reasons.includes(reason)) reasons.push(reason);
  };

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) add(70, 'invalid_email');
  if (isDisposableDomain || isListedDomain(domain, fallbackDisposableDomains)) add(internal ? 70 : 45, 'temporary_email');
  if (hasDisposableDomainHint(domain)) add(internal ? 45 : 30, 'temporary_email_pattern');
  if (domainIntel.mxDisposableHint) add(internal ? 55 : 35, 'temporary_email_mx');
  if (domain && !domainIntel.hasMx) add(25, 'missing_mx_record');
  const domainPatternRisk = domainAgeRisk(domain);
  if (domainPatternRisk) add(domainPatternRisk, 'suspicious_domain_pattern');
  if (higherRiskTlds.has(domain.split('.').pop())) add(8, 'higher_risk_tld');
  if (isBlockedDomain) add(internal ? 80 : 60, 'blocked_domain');
  if (isAllowedDomain) add(-20, 'allowed_domain');
  if (blockedIps.some((row) => row.ip_address === ip)) add(60, 'blocked_ip');
  if (allowedIps.some((row) => row.ip_address === ip)) add(-20, 'allowed_ip');
  if (!userAgent || /bot|curl|python|headless|scrapy/i.test(userAgent)) add(internal ? 15 : 10, 'suspicious_user_agent');
  if (/^(103\.|45\.|5\.188|198\.|192\.)/.test(ip)) add(20, 'vpn_detected');
  if (freeProviders.includes(domain)) add(internal ? 5 : 0, 'free_email_provider');
  if (domain && !freeProviders.includes(domain) && !isDisposableDomain && !isListedDomain(domain, fallbackDisposableDomains) && domainIntel.hasMx && !hasDisposableDomainHint(domain)) add(internal ? -10 : 0, 'business_domain');
  if ((email || '').match(/test|admin|user123|demo/i)) add(10, 'low_quality_pattern');
  if (hasLowQualityLocalPart(email)) add(10, 'random_email_pattern');

  const tenMinutesAgo = Date.now() - 10 * 60 * 1000;
  const threeMinutesAgo = Date.now() - 3 * 60 * 1000;
  const twoMinutesAgo = Date.now() - 2 * 60 * 1000;
  const oneHourAgo = Date.now() - 60 * 60 * 1000;
  const recentByIp = recentEvents.filter((event) => event.ip_address === ip);
  const recentInternalByIp = recentInternal.filter((event) => event.ip_address === ip);
  if (!internal && recentByIp.filter((event) => Date.parse(event.created_at) > twoMinutesAgo).length >= 5) add(30, 'ip_velocity_2m');
  if (!internal && recentByIp.filter((event) => Date.parse(event.created_at) > tenMinutesAgo).length >= 20) add(55, 'ip_velocity_10m');
  if (internal && recentInternalByIp.filter((event) => Date.parse(event.created_at) > twoMinutesAgo).length >= 5) add(30, 'ip_velocity_2m');
  if (internal && recentInternalByIp.filter((event) => Date.parse(event.created_at) > tenMinutesAgo).length >= 20) add(55, 'ip_velocity_10m');
  if (internal && recentInternalByIp.filter((event) => Date.parse(event.created_at) > oneHourAgo).length >= 3) add(20, 'repeat_ip');
  if (deviceId && recentEvents.filter((event) => event.device_id === deviceId && event.email !== email).length >= 2) add(35, 'same_device_multiple_accounts');
  const series = emailSeriesKey(email);
  const seriesEvents = recentEvents.filter((event) => emailSeriesKey(event.email) === series && event.email !== email && Date.parse(event.created_at) > threeMinutesAgo);
  const seriesInternal = recentInternal.filter((event) => emailSeriesKey(event.email) === series && event.email !== email && Date.parse(event.created_at) > threeMinutesAgo);
  if (series && [...seriesEvents, ...seriesInternal].length >= 3) add(25, 'email_series_velocity');

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
  let size = 0;
  for await (const chunk of req) {
    size += chunk.length;
    if (size > MAX_JSON_BYTES) {
      throw Object.assign(new Error('Request body too large'), { status: 413 });
    }
    chunks.push(chunk);
  }
  return chunks.length ? JSON.parse(Buffer.concat(chunks).toString('utf8')) : {};
}

function send(res, status, body, extraHeaders = {}) {
  res.writeHead(status, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': ALLOWED_ORIGIN,
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, POST, PATCH, DELETE, OPTIONS',
    'X-Content-Type-Options': 'nosniff',
    'Referrer-Policy': 'no-referrer',
    'Cache-Control': 'no-store',
    ...extraHeaders,
  });
  res.end(JSON.stringify(body));
}

async function requireUser(req) {
  const token = (req.headers.authorization || '').replace(/^Bearer\s+/i, '');
  if (!token) throw Object.assign(new Error('Authentication required'), { status: 401 });
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

async function ensureUserContext(user) {
  const workspaceQuery = await (await table('workspaces')).select('*').eq('owner_id', user.id);
  if (workspaceQuery.error) throw new Error(workspaceQuery.error.message);
  let workspace = workspaceQuery.data?.[0];

  if (!workspace) {
    [workspace] = await insertRows('workspaces', [{
      id: id('ws'),
      name: `${user.full_name || user.email}'s Workspace`,
      owner_id: user.id,
      plan_name: 'Starter',
      billing_status: 'active',
    }]);
    await insertRows('workspace_members', [{
      id: id('mem'),
      workspace_id: workspace.id,
      user_id: user.id,
      role: 'owner',
    }]);
    await insertRows('billing_usage', [{
      id: id('bill'),
      workspace_id: workspace.id,
      plan_name: 'Starter',
      checks_used: 0,
      monthly_limit: 10000,
      billing_period_start: firstDayOfMonth(),
      billing_period_end: lastDayOfMonth(),
    }]);
  }

  const projectQuery = await (await table('projects')).select('*').eq('workspace_id', workspace.id).order('created_at', { ascending: true });
  if (projectQuery.error) throw new Error(projectQuery.error.message);
  let project = projectQuery.data?.[0];
  if (!project) {
    [project] = await insertRows('projects', [{
      id: id('proj'),
      workspace_id: workspace.id,
      name: 'Production Project',
      domain: '',
      product_type: '',
      free_credits_per_user: 100,
      estimated_ai_cost_per_credit: 0.01,
      estimated_email_contact_cost: 0.60,
      default_currency: 'USD',
      status: 'active',
    }]);
    await createDefaultProjectData(project.id);
  }

  return { user, workspace, project };
}

async function createDefaultProjectData(projectId) {
  const defaultRules = [
    ['Block disposable emails', 'disposable_email', 'BLOCK', 40, {}],
    ['Review VPN/proxy users', 'vpn_proxy', 'REVIEW', 20, {}],
    ['Block repeat IP after 5 signups in 10 minutes', 'repeat_ip', 'BLOCK', 25, { threshold: 5, window_minutes: 10 }],
    ['Review high signup velocity', 'velocity', 'REVIEW', 20, {}],
    ['Review suspicious user agent', 'user_agent', 'REVIEW', 10, {}],
    ['Block same device multiple accounts', 'device_abuse', 'BLOCK', 25, {}],
    ['Blocklisted domains', 'blocked_domain', 'BLOCK', 60, {}],
    ['Allowlisted domains', 'allowed_domain', 'ALLOW', -20, {}],
  ].map(([name, type, action, impact, config]) => ({
    id: id('rule'),
    project_id: projectId,
    name,
    type,
    enabled: true,
    action,
    risk_score_impact: impact,
    config,
  }));
  await insertRows('rules', defaultRules);

  const providers = ['mailchimp', 'brevo', 'hubspot', 'convertkit', 'slack', 'webhook', 'supabase', 'firebase', 'clerk', 'auth0'];
  await insertRows('integrations', providers.map((provider) => ({
    id: id('int'),
    project_id: projectId,
    provider,
    status: 'disconnected',
    config: provider === 'webhook'
      ? { events: ['signup.allowed', 'signup.reviewed', 'signup.blocked', 'risk.high', 'api.limit.warning'] }
      : {},
  })));
}

function firstDayOfMonth() {
  const date = new Date();
  return new Date(date.getFullYear(), date.getMonth(), 1).toISOString().slice(0, 10);
}

function lastDayOfMonth() {
  const date = new Date();
  return new Date(date.getFullYear(), date.getMonth() + 1, 0).toISOString().slice(0, 10);
}

async function metricResponse(project) {
  const { data: events, error } = await (await table('risk_events')).select('*').eq('project_id', project.id).order('created_at', { ascending: false });
  if (error) throw new Error(error.message);
  const total = events.length;
  const blocked = events.filter((e) => e.action === 'BLOCK').length;
  const reviewed = events.filter((e) => e.action === 'REVIEW').length;
  const allowed = events.filter((e) => e.action === 'ALLOW').length;
  const riskyRate = total ? ((blocked + reviewed) / total) * 100 : 0;
  const aiSaved = blocked * Number(project.free_credits_per_user || 100) * Number(project.estimated_ai_cost_per_credit || 0.01);
  const emailSaved = blocked * Number(project.estimated_email_contact_cost || 0.6);
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

async function billingResponse(workspace) {
  const { data, error } = await (await table('billing_usage')).select('*').eq('workspace_id', workspace.id).single();
  if (error) throw new Error(error.message);
  const usage = data;
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

async function reportResponse(project) {
  const m = await metricResponse(project);
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

async function patchProjectRow(tableName, rowId, projectId, updates) {
  const { data, error } = await (await table(tableName))
    .update({ ...updates, updated_at: now() })
    .eq('id', rowId)
    .eq('project_id', projectId)
    .select();
  if (error) throw new Error(error.message);
  if (!data?.length) throw Object.assign(new Error('Not found'), { status: 404 });
  return data[0];
}

async function deleteProjectRow(tableName, rowId, projectId) {
  const { data, error } = await (await table(tableName))
    .delete()
    .eq('id', rowId)
    .eq('project_id', projectId)
    .select();
  if (error) throw new Error(error.message);
  return Boolean(data?.length);
}

async function router(req, res) {
  const url = new URL(req.url, `http://${req.headers.host}`);
  if (req.method === 'OPTIONS') return send(res, 204, {});

  try {
    pruneRateBuckets();
    const limited = checkRateLimit(req, url);
    if (limited) {
      return send(res, limited.status, { message: limited.message }, { 'Retry-After': String(limited.retryAfter) });
    }

    const contentLength = Number(req.headers['content-length'] || 0);
    if (contentLength > MAX_JSON_BYTES) throw Object.assign(new Error('Request body too large'), { status: 413 });

    const body = ['POST', 'PATCH', 'DELETE'].includes(req.method) ? await readJson(req) : {};

    if (req.method === 'POST' && url.pathname === '/api/auth/signup') {
      const { email, password, fullName } = body;
      const result = await scoreSignup({ email, ip: getClientIp(req), userAgent: req.headers['user-agent'], deviceId: body.deviceId }, true);
      const parsed = parseEmail(email);
      await (await table('internal_signup_attempts')).insert([{
        id: id('isa'),
        email: parsed.email,
        email_domain: parsed.domain,
        ip_address: getClientIp(req),
        user_agent: req.headers['user-agent'] || '',
        risk_score: result.riskScore,
        action: result.action,
        reasons: result.reasons,
      }]);
      if (result.action === 'BLOCK') return send(res, 400, { message: 'Temporary email addresses are not allowed. Please use a real work email to access STRAVOTECH.' });
      if (result.action === 'REVIEW') return send(res, 202, { message: 'We need to review this signup before enabling dashboard access.', action: 'REVIEW' });

      const { data, error } = await publicClient.auth.signUp({ email, password, name: fullName, redirectTo: `${req.headers.origin || 'http://localhost:5173'}/login` });
      if (error) throw Object.assign(new Error(error.message), { status: error.statusCode || 400 });
      const signedUpUser = authUserFrom(data);
      if (signedUpUser) {
        const profile = await upsertProfile(signedUpUser);
        await ensureUserContext(profile);
      }
      return send(res, 201, {
        email: parsed.email,
        needsVerification: true,
        message: 'Verification code sent. Enter the newest 6-digit code from your email within 15 minutes.',
      });
    }

    if (req.method === 'POST' && url.pathname === '/api/auth/verify-email') {
      const { email, otp } = body;
      const { data, error } = await publicClient.auth.verifyEmail({ email, otp });
      if (error) throw Object.assign(new Error(error.message), { status: error.statusCode || 400 });
      const verifiedUser = authUserFrom(data);
      const accessToken = data?.accessToken || data?.data?.accessToken;
      if (!verifiedUser || !accessToken) throw Object.assign(new Error('Email verified. Please sign in to continue.'), { status: 202 });
      const profile = await upsertProfile({ ...verifiedUser, emailVerified: true });
      await ensureUserContext(profile);
      return send(res, 200, { user: profile, accessToken, message: 'Email verified. Dashboard access enabled.' });
    }

    if (req.method === 'POST' && url.pathname === '/api/auth/resend-verification') {
      await publicClient.auth.resendVerificationEmail({ email: body.email, redirectTo: `${req.headers.origin || 'http://localhost:5173'}/login` });
      return send(res, 200, { ok: true, message: 'Verification code sent again. Use the newest code; older codes are invalid.' });
    }

    if (req.method === 'POST' && url.pathname === '/api/auth/login') {
      const { data, error } = await publicClient.auth.signInWithPassword(body);
      if (error) throw Object.assign(new Error(error.message), { status: error.statusCode || 401 });
      const signedInUser = authUserFrom(data);
      if (!signedInUser) throw Object.assign(new Error('Could not read signed-in user from InsForge.'), { status: 502 });
      const profile = await upsertProfile(signedInUser);
      if (profile.account_status !== 'active' || profile.email_verified === false) throw Object.assign(new Error('Dashboard access requires an active, verified account.'), { status: 403 });
      await ensureUserContext(profile);
      return send(res, 200, { user: profile, accessToken: data.accessToken || data?.data?.accessToken });
    }

    if (url.pathname === '/api/auth/logout') return send(res, 200, { ok: true });
    if (url.pathname === '/api/auth/me') return send(res, 200, { user: await requireUser(req) });
    if (url.pathname === '/api/auth/reset-password') {
      await publicClient.auth.sendResetPasswordEmail({ email: body.email, redirectTo: `${req.headers.origin || 'http://localhost:5173'}/login` }).catch(() => {});
      return send(res, 200, { ok: true });
    }

    if (url.pathname === '/api/v1/check-signup' && req.method === 'POST') {
      const apiKey = (req.headers.authorization || '').replace(/^Bearer\s+/i, '');
      if (!apiKey.startsWith('sk_stravo_')) throw Object.assign(new Error('Invalid API key format'), { status: 401 });
      const { data: keys, error } = await (await table('api_keys')).select('*').eq('key_hash', hash(apiKey));
      if (error) throw new Error(error.message);
      const keyRow = keys?.[0];
      if (!keyRow || keyRow.status !== 'active') throw Object.assign(new Error('Invalid or revoked API key'), { status: 401 });
      if (!hasScope(keyRow, 'signup:check')) throw Object.assign(new Error('API key is missing signup:check scope'), { status: 403 });
      const { data: keyProject, error: projectError } = await (await table('projects')).select('*').eq('id', keyRow.project_id).single();
      if (projectError) throw new Error(projectError.message);
      const { data: billing, error: billingError } = await (await table('billing_usage')).select('*').eq('workspace_id', keyProject.workspace_id).single();
      if (billingError) throw new Error(billingError.message);
      if (billing.checks_used >= billing.monthly_limit) throw Object.assign(new Error('Billing usage limit reached'), { status: 402 });
      const payload = validateSignupCheckPayload(body);
      const result = await scoreSignup(payload);
      const event = await saveRiskEvent(payload, result, keyRow, false);
      await (await table('api_keys')).update({ last_used_at: now(), usage_count: (keyRow.usage_count || 0) + 1 }).eq('id', keyRow.id);
      await (await table('billing_usage')).update({ checks_used: billing.checks_used + 1, updated_at: now() }).eq('id', billing.id);
      return send(res, 200, { ...result, eventId: event.id });
    }

    const user = await requireUser(req);
    const context = await ensureUserContext(user);
    const { workspace, project } = context;

    if (url.pathname === '/api/risk-simulator' && req.method === 'POST') return send(res, 200, await scoreSignup(body));
    if (url.pathname === '/api/dashboard/metrics') return send(res, 200, await metricResponse(project));
    if (url.pathname === '/api/risk-events') {
      const { data, error } = await (await table('risk_events')).select('*').eq('project_id', project.id).order('created_at', { ascending: false });
      if (error) throw new Error(error.message);
      return send(res, 200, data);
    }
    if (url.pathname.startsWith('/api/risk-events/')) {
      const { data } = await (await table('risk_events')).select('*').eq('id', url.pathname.split('/').pop()).eq('project_id', project.id).single();
      return send(res, 200, data);
    }
    if (url.pathname === '/api/api-keys' && req.method === 'GET') {
      const { data: rows, error } = await (await table('api_keys')).select('*').eq('project_id', project.id).order('created_at', { ascending: false });
      if (error) throw new Error(error.message);
      return send(res, 200, rows.map(({ key_hash, ...row }) => row));
    }
    if (url.pathname === '/api/api-keys' && req.method === 'POST') {
      const environment = body.environment || 'live';
      const raw = `sk_stravo_${environment}_${crypto.randomBytes(18).toString('hex')}`;
      const row = { id: id('key'), project_id: project.id, name: body.name || 'New key', key_hash: hash(raw), key_prefix: raw.slice(0, 20), environment, status: 'active', scopes: body.scopes || ['signup:check'] };
      const { data, error } = await (await table('api_keys')).insert([row]).select();
      if (error) throw new Error(error.message);
      return send(res, 201, { ...data[0], key: raw, key_hash: undefined });
    }
    if (url.pathname.startsWith('/api/api-keys/') && ['DELETE', 'PATCH'].includes(req.method)) {
      return send(res, 200, await patchProjectRow('api_keys', url.pathname.split('/').pop(), project.id, { status: 'revoked' }));
    }

    if (url.pathname === '/api/rules') {
      const { data, error } = await (await table('rules')).select('*').eq('project_id', project.id).order('created_at', { ascending: true });
      if (error) throw new Error(error.message);
      return send(res, 200, data);
    }
    if (url.pathname.startsWith('/api/rules/') && req.method === 'PATCH') return send(res, 200, await patchProjectRow('rules', url.pathname.split('/').pop(), project.id, body));
    if (url.pathname === '/api/analytics') {
      const { data: events, error } = await (await table('risk_events')).select('*').eq('project_id', project.id).order('created_at', { ascending: false });
      if (error) throw new Error(error.message);
      const m = await metricResponse(project);
      return send(res, 200, { weekly: buildTrend(events), blockReasons: m.top_blocked_reasons, qualityTrend: [{ month: 'Jun', score: m.signup_quality_score }] });
    }
    if (url.pathname === '/api/integrations') {
      const { data, error } = await (await table('integrations')).select('*').eq('project_id', project.id).order('created_at', { ascending: true });
      if (error) throw new Error(error.message);
      return send(res, 200, data);
    }
    if (url.pathname.startsWith('/api/integrations/') && req.method === 'PATCH') return send(res, 200, await patchProjectRow('integrations', url.pathname.split('/').pop(), project.id, { ...body, last_sync_at: now() }));
    if (url.pathname === '/api/alerts') {
      const { data, error } = await (await table('alerts')).select('*').eq('project_id', project.id).order('created_at', { ascending: false });
      if (error) throw new Error(error.message);
      return send(res, 200, data);
    }
    if (url.pathname.startsWith('/api/alerts/') && req.method === 'PATCH') return send(res, 200, await patchProjectRow('alerts', url.pathname.split('/').pop(), project.id, body));
    if (url.pathname === '/api/billing') return send(res, 200, await billingResponse(workspace));
    if (url.pathname === '/api/billing/plans') return send(res, 200, [{ name: 'Starter', monthly_limit: 10000 }, { name: 'Growth', monthly_limit: 50000 }, { name: 'Pro', monthly_limit: 200000 }]);
    if (url.pathname === '/api/reports' || url.pathname === '/api/reports/monthly') return send(res, 200, await reportResponse(project));
    if (url.pathname === '/api/projects' && req.method === 'GET') {
      const { data, error } = await (await table('projects')).select('*').eq('workspace_id', workspace.id).order('created_at', { ascending: false });
      if (error) throw new Error(error.message);
      return send(res, 200, data);
    }
    if (url.pathname === '/api/projects' && req.method === 'POST') {
      const nextProject = { id: id('proj'), workspace_id: workspace.id, name: body.name, domain: body.domain || '', product_type: body.product_type || '', status: 'active' };
      const { data, error } = await (await table('projects')).insert([nextProject]).select();
      if (error) throw new Error(error.message);
      await createDefaultProjectData(data[0].id);
      return send(res, 201, data[0]);
    }
    if (url.pathname === '/api/review-queue') {
      const { data, error } = await (await table('risk_events')).select('*').eq('project_id', project.id).eq('action', 'REVIEW').order('created_at', { ascending: false });
      if (error) throw new Error(error.message);
      return send(res, 200, data);
    }
    if (url.pathname.includes('/api/review-queue/') && req.method === 'POST') {
      const [, , , eventId, command] = url.pathname.split('/');
      const action = command === 'approve' ? 'ALLOW' : 'BLOCK';
      const updated = await patchProjectRow('risk_events', eventId, project.id, { action });
      await (await table('audit_logs')).insert([{ id: id('aud'), workspace_id: workspace.id, project_id: project.id, user_id: user.id, action: `review_${command}`, entity_type: 'risk_event', entity_id: eventId, metadata: body }]);
      return send(res, 200, updated);
    }
    if (url.pathname === '/api/blocklist' && req.method === 'GET') {
      const [domains, ips] = await Promise.all([
        (await table('blocked_domains')).select('*').eq('project_id', project.id),
        (await table('blocked_ips')).select('*').eq('project_id', project.id),
      ]);
      if (domains.error) throw new Error(domains.error.message);
      if (ips.error) throw new Error(ips.error.message);
      return send(res, 200, [...domains.data, ...ips.data]);
    }
    if (url.pathname === '/api/blocklist' && req.method === 'POST') {
      const target = body.type === 'ip' ? 'blocked_ips' : 'blocked_domains';
      const payload = target === 'blocked_ips' ? { id: id('bip'), project_id: project.id, ip_address: body.value, reason: body.reason || '' } : { id: id('bd'), project_id: project.id, domain: body.value || body.domain, reason: body.reason || '' };
      const { data, error } = await (await table(target)).insert([payload]).select();
      if (error) throw new Error(error.message);
      return send(res, 201, data[0]);
    }
    if (url.pathname.startsWith('/api/blocklist/')) {
      const rowId = url.pathname.split('/').pop();
      const deleted = await deleteProjectRow('blocked_domains', rowId, project.id) || await deleteProjectRow('blocked_ips', rowId, project.id);
      if (!deleted) throw Object.assign(new Error('Not found'), { status: 404 });
      return send(res, 200, { ok: true });
    }
    if (url.pathname === '/api/allowlist' && req.method === 'GET') {
      const [domains, ips] = await Promise.all([
        (await table('allowed_domains')).select('*').eq('project_id', project.id),
        (await table('allowed_ips')).select('*').eq('project_id', project.id),
      ]);
      if (domains.error) throw new Error(domains.error.message);
      if (ips.error) throw new Error(ips.error.message);
      return send(res, 200, [...domains.data, ...ips.data]);
    }
    if (url.pathname === '/api/allowlist' && req.method === 'POST') {
      const target = body.type === 'ip' ? 'allowed_ips' : 'allowed_domains';
      const payload = target === 'allowed_ips' ? { id: id('aip'), project_id: project.id, ip_address: body.value, reason: body.reason || '' } : { id: id('ad'), project_id: project.id, domain: body.value || body.domain, reason: body.reason || '' };
      const { data, error } = await (await table(target)).insert([payload]).select();
      if (error) throw new Error(error.message);
      return send(res, 201, data[0]);
    }
    if (url.pathname.startsWith('/api/allowlist/')) {
      const rowId = url.pathname.split('/').pop();
      const deleted = await deleteProjectRow('allowed_domains', rowId, project.id) || await deleteProjectRow('allowed_ips', rowId, project.id);
      if (!deleted) throw Object.assign(new Error('Not found'), { status: 404 });
      return send(res, 200, { ok: true });
    }

    return send(res, 404, { message: 'Not found' });
  } catch (error) {
    return send(res, error.status || 500, { message: error.message || 'Server error' });
  }
}

http.createServer(router).listen(PORT, () => {
  console.log(`STRAVOTECH API using InsForge at ${INSFORGE_URL}`);
  console.log(`STRAVOTECH API listening on http://localhost:${PORT}`);
});
