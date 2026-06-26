import http from 'node:http';
import crypto from 'node:crypto';
import dns from 'node:dns/promises';
import { URL } from 'node:url';
import { createAdminClient, createClient } from '@insforge/sdk';

const PORT = Number(process.env.PORT || 8787);
const INSFORGE_URL = process.env.INSFORGE_URL || 'https://hp7mm277.us-east.insforge.app';
const INSFORGE_API_KEY = process.env.INSFORGE_API_KEY || process.env.API_KEY;
const INSFORGE_ANON_KEY = process.env.INSFORGE_ANON_KEY || process.env.ANON_KEY || '';
const ALLOWED_ORIGIN = process.env.ALLOWED_ORIGIN || '*';
const MAX_JSON_BYTES = Number(process.env.MAX_JSON_BYTES || 64 * 1024);
const defaultAllowedOrigins = [
  'https://stravotech.in',
  'https://www.stravotech.in',
  'https://tempmaildector.vercel.app',
  'https://tempmaildetector.vercel.app',
  'https://hoppscotch.io',
  'https://app.hoppscotch.io',
  'http://localhost:3000',
  'http://localhost:5173',
  'http://localhost:5500',
];
const securityHeaders = {
  'Content-Security-Policy': "default-src 'self'; base-uri 'self'; object-src 'none'; frame-ancestors 'none'; form-action 'self'; script-src 'self' https://www.googletagmanager.com https://www.google-analytics.com https://vercel.live; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com data:; img-src 'self' data: blob: https:; connect-src 'self' https://stravotech.in https://www.stravotech.in https://hp7mm277.us-east.insforge.app https://www.google-analytics.com https://*.google-analytics.com https://*.analytics.google.com https://vitals.vercel-insights.com https://vercel.live wss://*.insforge.app; frame-src 'self' https://accounts.google.com; manifest-src 'self'; media-src 'self'; worker-src 'self' blob:; upgrade-insecure-requests",
  'X-Frame-Options': 'DENY',
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'accelerometer=(), ambient-light-sensor=(), autoplay=(), bluetooth=(), camera=(), display-capture=(), encrypted-media=(), fullscreen=(self), geolocation=(), gyroscope=(), hid=(), idle-detection=(), local-fonts=(), magnetometer=(), microphone=(), midi=(), payment=(), picture-in-picture=(), publickey-credentials-get=(self), screen-wake-lock=(), serial=(), usb=(), web-share=(), xr-spatial-tracking=()',
  'Cross-Origin-Embedder-Policy': 'credentialless',
  'Cross-Origin-Opener-Policy': 'same-origin',
  'Cross-Origin-Resource-Policy': 'same-origin',
  'Strict-Transport-Security': 'max-age=63072000; includeSubDomains; preload',
};

if (!INSFORGE_API_KEY) {
  console.warn('INSFORGE_API_KEY/API_KEY is not set. Backend DB requests will fail until it is provided.');
}

const admin = createAdminClient({ baseUrl: INSFORGE_URL, apiKey: INSFORGE_API_KEY || 'missing' });
const publicClient = createClient({ baseUrl: INSFORGE_URL, anonKey: INSFORGE_ANON_KEY });

const freeProviders = ['gmail.com', 'yahoo.com', 'outlook.com', 'hotmail.com', 'icloud.com'];
const trustedConsumerProviders = new Set(freeProviders);
const protectedAreas = ['ai_credits', 'crm', 'email_list', 'analytics'];
const mxCache = new Map();
const lookupCache = new Map();
const LOOKUP_CACHE_MS = 5 * 60 * 1000;
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
  'emailondeck.com',
  'guerrillamail.com',
  'guerrillamail.net',
  'sharklasers.com',
  'grr.la',
  'guerrillamailblock.com',
  'pokemail.net',
  'spam4.me',
  'mailinator.com',
  'yopmail.com',
  'maildrop.cc',
  '10minutemail.com',
  '10minutemail.net',
  'tempmail.dev',
  'tempmail.plus',
  'tempmail.email',
  'temp-mail.org',
  'dispostable.com',
  'moakt.com',
];
const higherRiskTlds = new Set(['click', 'monster', 'quest', 'rest', 'sbs', 'shop', 'site', 'space', 'top', 'work', 'xyz']);
const rateBuckets = new Map();
const ratePolicies = [
  { match: (req, url) => req.method === 'POST' && url.pathname === '/api/early-access', limit: 5, windowMs: 15 * 60 * 1000, name: 'early-access' },
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

function apiError(code, message, status = 400, details = {}) {
  return Object.assign(new Error(message), { code, status, details });
}

function maskApiKey(key = '') {
  const value = String(key);
  if (!value) return '';
  return `${value.slice(0, 15)}********${value.slice(-4)}`;
}

function parseEmail(email = '') {
  const normalized = String(email).trim().toLowerCase();
  return { email: normalized, domain: normalized.includes('@') ? normalized.split('@').pop() : '' };
}

function decide(score) {
  if (score >= 70) return 'BLOCK';
  if (score >= 40) return 'REVIEW';
  return 'ALLOW';
}

const signalCatalog = {
  invalid_email: ['email', 'critical', 'Email format is invalid.'],
  temporary_email: ['email', 'critical', 'Domain is listed as a disposable email provider.'],
  temporary_email_pattern: ['email', 'high', 'Domain name resembles known disposable email services.'],
  temporary_email_mx: ['email', 'high', 'Mail infrastructure is associated with disposable email services.'],
  missing_mx_record: ['email', 'high', 'Domain has no working MX mail record.'],
  suspicious_domain_pattern: ['domain', 'medium', 'Domain naming pattern has low-reputation characteristics.'],
  higher_risk_tld: ['domain', 'low', 'Domain uses a TLD with elevated abuse frequency.'],
  blocked_domain: ['policy', 'critical', 'Domain is explicitly blocked by this project.'],
  allowed_domain: ['policy', 'trusted', 'Domain is explicitly trusted by this project.'],
  blocked_ip: ['network', 'critical', 'IP address is explicitly blocked by this project.'],
  allowed_ip: ['network', 'trusted', 'IP address is explicitly trusted by this project.'],
  suspicious_user_agent: ['device', 'medium', 'Request appears automated or is missing a normal browser user agent.'],
  vpn_detected: ['network', 'medium', 'IP pattern resembles a proxy, VPN, or non-residential network.'],
  free_email_provider: ['email', 'info', 'Email uses a common consumer mailbox provider.'],
  trusted_consumer_email: ['email', 'trusted', 'Domain is a trusted consumer mailbox provider.'],
  business_domain: ['email', 'trusted', 'Domain has valid mail infrastructure and business-domain characteristics.'],
  low_quality_pattern: ['email', 'low', 'Mailbox name contains a generic test or placeholder pattern.'],
  random_email_pattern: ['email', 'low', 'Mailbox name contains a high mix of letters and digits.'],
  ip_velocity_2m: ['velocity', 'high', 'At least five signup checks came from this IP within two minutes.'],
  ip_velocity_10m: ['velocity', 'critical', 'At least twenty signup checks came from this IP within ten minutes.'],
  repeat_ip: ['velocity', 'medium', 'This IP has repeatedly attempted signups within one hour.'],
  same_device_multiple_accounts: ['device', 'high', 'The same device attempted at least five different accounts within one hour.'],
  email_series_velocity: ['identity', 'high', 'Several sequential mailbox variants were attempted within three minutes.'],
  clean_domain: ['email', 'trusted', 'No meaningful abuse indicators were detected.'],
};

function enrichRiskResult(riskScore, action, reasons, signalPoints = {}) {
  const signals = reasons.map((code) => {
    const [category, severity, detail] = signalCatalog[code] || ['other', 'info', code.replace(/_/g, ' ')];
    return { code, category, severity, scoreImpact: signalPoints[code] || 0, detail };
  });
  const recommendation = action === 'BLOCK'
    ? 'Reject signup before account creation and do not grant credits or product access.'
    : action === 'REVIEW'
      ? 'Require email verification or CAPTCHA, hold free credits, and approve automatically only after the challenge succeeds.'
      : 'Continue signup normally. Keep monitoring post-signup velocity and credit usage.';
  const nextStep = action === 'BLOCK' ? 'deny_signup' : action === 'REVIEW' ? 'manual_review_or_limited_access' : 'create_account';
  const confidence = Math.min(99, Math.max(55, Math.round(58 + Math.abs(riskScore - 40) * 0.7 + signals.filter((signal) => ['high', 'critical'].includes(signal.severity)).length * 6)));
  const summary = action === 'ALLOW'
    ? 'Low-risk signup with no strong abuse indicators.'
    : `${action === 'BLOCK' ? 'High-risk' : 'Uncertain'} signup triggered ${signals.filter((signal) => signal.scoreImpact > 0).length} risk signal(s).`;
  return { riskScore, action, confidence, reasons, signals, summary, recommendation, nextStep, protect: action === 'ALLOW' ? [] : protectedAreas };
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
  const cacheKey = `${tableName}:${column}:${domain}`;
  const cached = lookupCache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) return cached.value;
  const candidates = domainCandidates(domain);
  if (!candidates.length) return false;
  const checks = await Promise.all(candidates.map(async (candidate) => {
    const { data, error } = await (await table(tableName)).select('id').eq(column, candidate);
    if (error) throw new Error(error.message);
    return Boolean(data?.length);
  }));
  const value = checks.some(Boolean);
  lookupCache.set(cacheKey, { value, expiresAt: Date.now() + LOOKUP_CACHE_MS });
  return value;
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

function knownDomainIntel(domain) {
  if (trustedConsumerProviders.has(domain)) return { hasMx: true, mxHosts: [], mxDisposableHint: false };
  if (isListedDomain(domain, observedDisposableDomains) || hasDisposableDomainHint(domain)) {
    return { hasMx: true, mxHosts: [], mxDisposableHint: true };
  }
  return null;
}

function normalizeTrustedConsumerResult(row, response) {
  const { domain } = parseEmail(row.email);
  if (!trustedConsumerProviders.has(domain)) return response;

  const falsePositiveReasons = new Set(['missing_mx_record', 'free_email_provider']);
  const normalizedReasons = response.reasons.filter((reason) => !falsePositiveReasons.has(reason));
  const remainingPositiveReasons = normalizedReasons.filter((reason) => reason !== 'trusted_consumer_email');
  const onlySoftSignals = remainingPositiveReasons.every((reason) => ['repeat_ip', 'low_quality_pattern', 'random_email_pattern'].includes(reason));

  if (!onlySoftSignals) {
    return { ...response, reasons: normalizedReasons.length ? normalizedReasons : ['trusted_consumer_email'] };
  }

  const riskScore = Math.min(response.riskScore || 0, remainingPositiveReasons.includes('repeat_ip') ? 25 : 15);
  const reasons = normalizedReasons.includes('trusted_consumer_email')
    ? normalizedReasons
    : ['trusted_consumer_email', ...normalizedReasons];
  return {
    ...response,
    riskScore,
    decision: 'ALLOW',
    status: 'approved',
    reasons,
    summary: 'Trusted consumer mailbox with no strong abuse indicators.',
    recommendation: 'Continue signup normally unless later behavior becomes abusive.',
    nextStep: 'create_account',
  };
}

function authUserFrom(data) {
  return data?.user
    || data?.data?.user
    || data?.session?.user
    || data?.data?.session?.user
    || (data?.id && data?.email ? data : null);
}

function accessTokenFrom(data) {
  return data?.accessToken
    || data?.access_token
    || data?.data?.accessToken
    || data?.data?.access_token
    || data?.session?.accessToken
    || data?.session?.access_token
    || data?.data?.session?.accessToken
    || data?.data?.session?.access_token
    || '';
}

function decodeJwtPayload(token) {
  try {
    const [, payload] = String(token).split('.');
    if (!payload) return null;
    const normalized = payload.replace(/-/g, '+').replace(/_/g, '/');
    const padded = normalized.padEnd(normalized.length + ((4 - normalized.length % 4) % 4), '=');
    return JSON.parse(Buffer.from(padded, 'base64').toString('utf8'));
  } catch {
    return null;
  }
}

function authUserFromToken(token) {
  const payload = decodeJwtPayload(token);
  if (!payload) return null;
  const id = payload.sub || payload.user_id || payload.id;
  const email = payload.email || payload.user?.email;
  if (!id || !email) return null;
  return {
    id,
    email,
    name: payload.name || payload.full_name || payload.user_metadata?.name || email.split('@')[0],
    emailVerified: payload.email_verified ?? payload.emailVerified ?? true,
    providers: payload.providers || payload.provider ? [payload.provider].filter(Boolean) : [],
    profile: {
      full_name: payload.full_name || payload.name || payload.user_metadata?.full_name || payload.user_metadata?.name,
      avatar_url: payload.avatar_url || payload.picture || payload.user_metadata?.avatar_url || payload.user_metadata?.picture || '',
    },
  };
}

function validateSignupCheckPayload(input) {
  const { email } = parseEmail(input.email);
  if (!String(input.email || '').trim()) {
    throw apiError('EMAIL_REQUIRED', 'email is required.', 400);
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw apiError('INVALID_EMAIL', 'Please provide a valid email address.', 400);
  }
  if (input.ip && !/^[a-f0-9:.]{3,45}$/i.test(String(input.ip))) {
    throw apiError('INVALID_IP', 'IP address is invalid.', 400);
  }
  if (input.deviceId && String(input.deviceId).length > 128) {
    throw apiError('DEVICE_ID_TOO_LONG', 'Device ID is too long.', 400);
  }
  if (input.userAgent && String(input.userAgent).length > 512) {
    throw apiError('USER_AGENT_TOO_LONG', 'User agent is too long.', 400);
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

function getSignupApiKey(req, body = {}) {
  const bearer = (req.headers.authorization || '').replace(/^Bearer\s+/i, '').trim();
  const headerKey = String(req.headers['x-api-key'] || '').trim();
  const bodyKey = String(body.apiKey || '').trim();
  const apiKey = bearer || headerKey || bodyKey;

  if (!apiKey) {
    throw apiError('AUTH_REQUIRED', 'Valid STRAVOTECH API key is required.', 401);
  }
  if (!/^sk_stravo_(test|live)_[a-z0-9]+$/i.test(apiKey)) {
    throw apiError('INVALID_API_KEY_FORMAT', 'API key must start with sk_stravo_test_ or sk_stravo_live_.', 401);
  }
  if (bodyKey && !/^sk_stravo_test_/i.test(bodyKey)) {
    throw apiError('INVALID_API_KEY_FORMAT', 'Body apiKey is only allowed for sk_stravo_test_ keys. Use Authorization or X-API-Key for live keys.', 401);
  }

  return {
    apiKey,
    mode: /^sk_stravo_test_/i.test(apiKey) ? 'test' : 'live',
    source: bearer ? 'authorization' : headerKey ? 'x-api-key' : 'body',
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

async function cachedRows(name, select = '*') {
  const cacheKey = `rows:${name}:${select}`;
  const cached = lookupCache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) return cached.value;
  const { data, error } = await (await table(name)).select(select);
  if (error) throw new Error(error.message);
  const value = data || [];
  lookupCache.set(cacheKey, { value, expiresAt: Date.now() + LOOKUP_CACHE_MS });
  return value;
}

async function recentRows(name, since, select) {
  const { data, error } = await (await table(name))
    .select(select)
    .gte('created_at', since)
    .order('created_at', { ascending: false })
    .limit(500);
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
  const oneHourAgoIso = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  const [isDisposableDomain, isBlockedDomain, isAllowedDomain, blockedIps, allowedIps, recentEvents, recentInternal] = await Promise.all([
    hasDomainRow('disposable_domains', domain),
    hasDomainRow('blocked_domains', domain),
    hasDomainRow('allowed_domains', domain),
    cachedRows('blocked_ips', 'ip_address'),
    cachedRows('allowed_ips', 'ip_address'),
    recentRows('risk_events', oneHourAgoIso, 'email,ip_address,device_id,created_at'),
    recentRows('internal_signup_attempts', oneHourAgoIso, 'email,ip_address,created_at'),
  ]);

  const fallbackDisposableDomains = observedDisposableDomains;
  const domainIntel = knownDomainIntel(domain) || await inspectDomain(domain);
  const isTrustedConsumerEmail = trustedConsumerProviders.has(domain);
  let riskScore = 0;
  const reasons = [];
  const signalPoints = {};
  const add = (points, reason) => {
    riskScore += points;
    if (reason) {
      signalPoints[reason] = (signalPoints[reason] || 0) + points;
      if (!reasons.includes(reason)) reasons.push(reason);
    }
  };

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) add(70, 'invalid_email');
  if (isDisposableDomain || isListedDomain(domain, fallbackDisposableDomains)) add(75, 'temporary_email');
  if (hasDisposableDomainHint(domain)) add(internal ? 45 : 30, 'temporary_email_pattern');
  if (domainIntel.mxDisposableHint) add(internal ? 55 : 35, 'temporary_email_mx');
  if (domain && !domainIntel.hasMx && !isTrustedConsumerEmail) add(35, 'missing_mx_record');
  const domainPatternRisk = isTrustedConsumerEmail ? 0 : domainAgeRisk(domain);
  if (domainPatternRisk) add(domainPatternRisk, 'suspicious_domain_pattern');
  if (!isTrustedConsumerEmail && higherRiskTlds.has(domain.split('.').pop())) add(8, 'higher_risk_tld');
  if (isBlockedDomain) add(internal ? 80 : 60, 'blocked_domain');
  if (isAllowedDomain) add(-20, 'allowed_domain');
  if (blockedIps.some((row) => row.ip_address === ip)) add(60, 'blocked_ip');
  if (allowedIps.some((row) => row.ip_address === ip)) add(-20, 'allowed_ip');
  if (!userAgent || /bot|curl|python|headless|scrapy/i.test(userAgent)) add(internal ? 15 : 10, 'suspicious_user_agent');
  if (/^(103\.|45\.|5\.188|198\.|192\.)/.test(ip)) add(20, 'vpn_detected');
  if (isTrustedConsumerEmail) add(-15, 'trusted_consumer_email');
  if (!isTrustedConsumerEmail && domain && !isDisposableDomain && !isListedDomain(domain, fallbackDisposableDomains) && domainIntel.hasMx && !hasDisposableDomainHint(domain)) add(internal ? -10 : 0, 'business_domain');
  if (!isTrustedConsumerEmail && (email || '').match(/test|admin|user123|demo/i)) add(10, 'low_quality_pattern');
  if (!isTrustedConsumerEmail && hasLowQualityLocalPart(email)) add(10, 'random_email_pattern');

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
  if (internal && !isTrustedConsumerEmail && recentInternalByIp.filter((event) => Date.parse(event.created_at) > oneHourAgo).length >= 3) add(20, 'repeat_ip');
  const recentDeviceEvents = deviceId
    ? recentEvents.filter((event) => (
      event.device_id === deviceId
      && event.email !== email
      && Date.parse(event.created_at) > oneHourAgo
    ))
    : [];
  if (recentDeviceEvents.length >= 5) add(35, 'same_device_multiple_accounts');
  const series = emailSeriesKey(email);
  const seriesEvents = recentEvents.filter((event) => emailSeriesKey(event.email) === series && event.email !== email && Date.parse(event.created_at) > threeMinutesAgo);
  const seriesInternal = recentInternal.filter((event) => emailSeriesKey(event.email) === series && event.email !== email && Date.parse(event.created_at) > threeMinutesAgo);
  if (series && [...seriesEvents, ...seriesInternal].length >= 3) add(25, 'email_series_velocity');

  riskScore = Math.max(0, Math.min(100, riskScore));
  const action = decide(riskScore);
  const finalReasons = reasons.length ? reasons : ['clean_domain'];
  return enrichRiskResult(riskScore, action, finalReasons, signalPoints);
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
  if (!chunks.length) return {};
  try {
    return JSON.parse(Buffer.concat(chunks).toString('utf8'));
  } catch {
    throw apiError('INVALID_JSON', 'Request body must be valid JSON.', 400);
  }
}

function corsOriginFor(origin = '', projectOrigins = []) {
  const isProduction = process.env.VERCEL || process.env.NODE_ENV === 'production';
  if (ALLOWED_ORIGIN === '*' && !isProduction) return '*';
  const configured = ALLOWED_ORIGIN.split(',').map((value) => value.trim()).filter(Boolean);
  const allowed = new Set([...defaultAllowedOrigins, ...configured, ...projectOrigins]);
  if (origin && allowed.has(origin)) return origin;
  return configured[0] || defaultAllowedOrigins[0];
}

function send(res, status, body, extraHeaders = {}) {
  const requestId = res.stravoRequestId || id('req');
  const isJsonObject = body && typeof body === 'object' && !Array.isArray(body);
  const responseBody = isJsonObject && !body.requestId ? { ...body, requestId } : body;
  res.writeHead(status, {
    'Content-Type': 'application/json',
    ...securityHeaders,
    'Access-Control-Allow-Origin': corsOriginFor(res.stravoOrigin, res.stravoProjectOrigins || []),
    'Vary': 'Origin',
    'Access-Control-Allow-Headers': 'Authorization, Content-Type, X-API-Key',
    'Access-Control-Allow-Methods': 'GET, POST, PATCH, DELETE, OPTIONS',
    'X-Request-Id': requestId,
    'Cache-Control': 'no-store',
    ...extraHeaders,
  });
  res.end(JSON.stringify(responseBody));
}

function sendError(res, error) {
  const status = error.status || 500;
  const code = error.code || (status === 401 ? 'AUTH_REQUIRED' : status === 404 ? 'NOT_FOUND' : 'INTERNAL_SERVER_ERROR');
  const message = status >= 500 ? 'Internal server error.' : (error.message || 'Request failed.');
  return send(res, status, {
    success: false,
    error: {
      code,
      message,
      details: error.details || {},
    },
  });
}

async function requireUser(req) {
  const token = (req.headers.authorization || '').replace(/^Bearer\s+/i, '');
  if (!token) throw apiError('AUTH_REQUIRED', 'Authentication required', 401);
  const client = createClient({ baseUrl: INSFORGE_URL, anonKey: INSFORGE_ANON_KEY });
  client.setAccessToken(token);
  const { data, error } = await client.auth.getCurrentUser();
  const currentUser = authUserFrom(data) || authUserFromToken(token);
  if (!currentUser) {
    console.warn('Unable to resolve authenticated user', { sdkError: error?.message || error?.error || '' });
    throw apiError('AUTH_REQUIRED', 'Authentication required', 401);
  }
  return upsertProfile(currentUser);
}

async function upsertProfile(user) {
  const providers = Array.isArray(user.providers) ? user.providers : [];
  const providerVerified = providers.some((provider) => {
    const value = typeof provider === 'string' ? provider : provider?.provider || provider?.name || provider?.id || '';
    return ['google', 'github'].includes(String(value).toLowerCase());
  });
  const profile = {
    id: user.id,
    email: user.email,
    full_name: user.name || user.profile?.full_name || user.email?.split('@')[0],
    avatar_url: user.profile?.avatar_url || '',
    email_verified: providerVerified || user.emailVerified !== false,
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

function apiKeyResponse(row, rawKey = '') {
  const { key_hash, ...safeRow } = row;
  const environment = safeRow.environment || safeRow.env || 'live';
  return {
    ...safeRow,
    key: rawKey || safeRow.key_prefix || '',
    key_preview: safeRow.key_prefix || '',
    environment,
    env: environment,
    calls: safeRow.usage_count || safeRow.calls || 0,
    lastUsed: safeRow.last_used_at ? safeRow.last_used_at.slice(0, 10) : 'Never',
  };
}

async function insertApiKey(row) {
  const tableRef = await table('api_keys');
  let result = await tableRef.insert([row]).select();
  if (!result.error) return result;

  const message = result.error.message || '';
  if (!/environment/i.test(message)) return result;

  const { environment, ...fallbackRow } = row;
  result = await (await table('api_keys')).insert([{ ...fallbackRow, env: environment }]).select();
  return result;
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

function riskEventResponse(row) {
  const detail = row.raw_response || {};
  const decision = String(row.action || detail.action || 'ALLOW').toUpperCase();
  const response = {
    ...row,
    riskScore: row.risk_score ?? detail.riskScore ?? 0,
    decision,
    reasons: row.reasons || detail.reasons || [],
    signals: detail.signals || [],
    confidence: detail.confidence || 0,
    summary: detail.summary || '',
    recommendation: detail.recommendation || '',
    nextStep: detail.nextStep || '',
    protect: row.protected_areas || detail.protect || [],
    ip: row.ip_address || '',
    deviceId: row.device_id || '',
    userAgent: row.user_agent || '',
    timestamp: row.created_at,
    submittedAt: row.created_at,
    status: decision === 'REVIEW' ? 'pending' : decision === 'ALLOW' ? 'approved' : 'blocked',
  };
  return normalizeTrustedConsumerResult(row, response);
}

function internalSignupAttemptResponse(row) {
  const decision = String(row.action || 'REVIEW').toUpperCase();
  const response = {
    ...row,
    source: 'early_access',
    riskScore: row.risk_score ?? 0,
    decision,
    reasons: row.reasons || [],
    signals: [],
    confidence: 0,
    summary: 'Early-access signup waiting for review.',
    recommendation: decision === 'REVIEW' ? 'Review this early-access request before granting access.' : '',
    nextStep: decision === 'REVIEW' ? 'manual_review' : '',
    protect: [],
    ip: row.ip_address || '',
    deviceId: row.device_id || '',
    userAgent: row.user_agent || '',
    timestamp: row.created_at,
    submittedAt: row.created_at,
    status: decision === 'REVIEW' ? 'pending' : decision === 'ALLOW' ? 'approved' : 'blocked',
  };
  return normalizeTrustedConsumerResult(row, response);
}

function isReviewQueueCandidate(row) {
  const detail = row.raw_response || {};
  const decision = String(row.action || detail.action || '').toUpperCase();
  const score = Number(row.risk_score ?? detail.riskScore ?? 0);
  return decision === 'REVIEW' || (score >= 40 && score < 80);
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
  const tableRef = await table(tableName);
  const timestampedUpdates = { ...updates, updated_at: now() };
  let { data, error } = await tableRef
    .update(timestampedUpdates)
    .eq('id', rowId)
    .eq('project_id', projectId)
    .select();

  if (error && /updated_at.*schema cache/i.test(error.message || '')) {
    ({ data, error } = await tableRef
      .update(updates)
      .eq('id', rowId)
      .eq('project_id', projectId)
      .select());
  }

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

export async function router(req, res) {
  const startedAt = Date.now();
  const url = new URL(req.url, `http://${req.headers.host}`);
  res.stravoOrigin = req.headers.origin || '';
  const requestId = id('req');
  res.stravoRequestId = requestId;
  if (req.method === 'OPTIONS') return send(res, 204, {});

  try {
    pruneRateBuckets();
    const limited = checkRateLimit(req, url);
    if (limited) {
      return send(res, limited.status, {
        success: false,
        error: {
          code: 'RATE_LIMITED',
          message: limited.message,
          details: { retryAfter: limited.retryAfter },
        },
      }, { 'Retry-After': String(limited.retryAfter) });
    }

    const contentLength = Number(req.headers['content-length'] || 0);
    if (contentLength > MAX_JSON_BYTES) throw apiError('REQUEST_TOO_LARGE', 'Request body too large', 413);

    const body = ['POST', 'PATCH', 'DELETE'].includes(req.method) ? await readJson(req) : {};

    if (url.pathname === '/api/health' && req.method === 'GET') {
      return send(res, 200, {
        success: true,
        status: 'ok',
        service: 'STRAVOTECH API',
        timestamp: now(),
      });
    }

    if (url.pathname === '/api/v1/check-signup' && req.method === 'GET') {
      throw apiError('METHOD_NOT_ALLOWED', 'Use POST /api/v1/check-signup to run a signup risk check.', 405);
    }

    if (req.method === 'POST' && url.pathname === '/api/early-access') {
      const parsed = parseEmail(body.email);
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(parsed.email)) {
        throw apiError('INVALID_EMAIL', 'Enter a valid email address.', 400);
      }
      const result = await scoreSignup({
        email: parsed.email,
        ip: getClientIp(req),
        userAgent: req.headers['user-agent'] || '',
        deviceId: '',
      }, true);
      if (result.action === 'BLOCK') {
        throw apiError('TEMPORARY_EMAIL_BLOCKED', 'Please use a real Gmail or work email for early access.', 400);
      }
      const { data: existing, error: existingError } = await (await table('internal_signup_attempts'))
        .select('id')
        .eq('email', parsed.email)
        .eq('action', 'REVIEW');
      if (existingError) throw new Error(existingError.message);
      if (!existing?.length) {
        const { error } = await (await table('internal_signup_attempts')).insert([{
          id: id('wait'),
          email: parsed.email,
          email_domain: parsed.domain,
          ip_address: getClientIp(req),
          user_agent: req.headers['user-agent'] || '',
          risk_score: result.riskScore,
          action: 'REVIEW',
          reasons: ['beta_waitlist'],
        }]);
        if (error) throw new Error(error.message);
      }
      return send(res, 201, { ok: true, message: "You're on the STRAVOTECH beta early-access list." });
    }

    if (req.method === 'POST' && url.pathname === '/api/auth/signup') {
      return send(res, 403, { success: false, error: { code: 'CLOSED_BETA', message: 'STRAVOTECH is currently in closed beta. Join early access instead.', details: {} } });
    }

    if (false && req.method === 'POST' && url.pathname === '/api/auth/signup') {
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
      const accessToken = accessTokenFrom(data);
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
      const password = typeof body.password === 'string' ? body.password : '';
      if (password.length < 8 || password.length > 72) {
        throw Object.assign(new Error('Password must be between 8 and 72 characters.'), { status: 400 });
      }
      const { data, error } = await publicClient.auth.signInWithPassword(body);
      if (error) throw Object.assign(new Error(error.message), { status: error.statusCode || 401 });
      const signedInUser = authUserFrom(data);
      if (!signedInUser) throw Object.assign(new Error('Could not read signed-in user from InsForge.'), { status: 502 });
      const profile = await upsertProfile(signedInUser);
      if (profile.account_status !== 'active' || profile.email_verified === false) throw Object.assign(new Error('Dashboard access requires an active, verified account.'), { status: 403 });
      await ensureUserContext(profile);
      return send(res, 200, { user: profile, accessToken: accessTokenFrom(data) });
    }

    if (url.pathname === '/api/auth/logout') return send(res, 200, { ok: true });
    if (url.pathname === '/api/auth/me') return send(res, 200, { user: await requireUser(req) });
    if (url.pathname === '/api/auth/reset-password') {
      await publicClient.auth.sendResetPasswordEmail({ email: body.email, redirectTo: `${req.headers.origin || 'http://localhost:5173'}/login` }).catch(() => {});
      return send(res, 200, { ok: true });
    }

    if (url.pathname === '/api/v1/check-signup' && req.method === 'POST') {
      const { apiKey, mode, source: authSource } = getSignupApiKey(req, body);
      const { data: keys, error } = await (await table('api_keys')).select('*').eq('key_hash', hash(apiKey));
      if (error) throw new Error(error.message);
      const keyRow = keys?.[0];
      if (!keyRow || keyRow.status !== 'active') throw apiError('AUTH_REQUIRED', 'Valid STRAVOTECH API key is required.', 401);
      if (!hasScope(keyRow, 'signup:check')) throw apiError('MISSING_SCOPE', 'API key is missing signup:check scope.', 403);
      const { data: keyProject, error: projectError } = await (await table('projects')).select('*').eq('id', keyRow.project_id).single();
      if (projectError) throw new Error(projectError.message);
      if (keyProject.domain) {
        const domain = String(keyProject.domain).replace(/^https?:\/\//i, '').replace(/\/.*$/, '');
        res.stravoProjectOrigins = [`https://${domain}`, `https://www.${domain}`];
      }
      const { data: billing, error: billingError } = await (await table('billing_usage')).select('*').eq('workspace_id', keyProject.workspace_id).single();
      if (billingError) throw new Error(billingError.message);
      if (billing.checks_used >= billing.monthly_limit) throw apiError('BILLING_LIMIT_REACHED', 'Billing usage limit reached.', 402);
      const payload = validateSignupCheckPayload(body);
      const result = await scoreSignup(payload);
      const [event] = await Promise.all([
        saveRiskEvent(payload, result, keyRow, mode === 'test'),
        (async () => {
          const { error: usageError } = await (await table('api_keys')).update({ last_used_at: now(), usage_count: (keyRow.usage_count || 0) + 1 }).eq('id', keyRow.id);
          if (usageError) throw new Error(usageError.message);
        })(),
        (async () => {
          const { error: billingUpdateError } = await (await table('billing_usage')).update({ checks_used: billing.checks_used + 1, updated_at: now() }).eq('id', billing.id);
          if (billingUpdateError) throw new Error(billingUpdateError.message);
        })(),
      ]);
      const latencyMs = Date.now() - startedAt;
      console.log('[signup-check]', {
        requestId,
        projectId: keyRow.project_id,
        status: 200,
        latencyMs,
        riskScore: result.riskScore,
        action: result.action,
        mode,
        authSource,
        apiKey: maskApiKey(apiKey),
      });
      return send(res, 200, {
        success: true,
        ...result,
        signals: result.signals.map((signal) => ({ ...signal, explanation: signal.explanation || signal.detail || '' })),
        eventId: event.id,
        latencyMs,
        mode,
      });
    }

    const user = await requireUser(req);
    const context = await ensureUserContext(user);
    const { workspace, project } = context;

    if (url.pathname === '/api/risk-simulator' && req.method === 'POST') return send(res, 200, await scoreSignup(body));
    if (url.pathname === '/api/dashboard/metrics') return send(res, 200, await metricResponse(project));
    if (url.pathname === '/api/risk-events') {
      const { data, error } = await (await table('risk_events')).select('*').eq('project_id', project.id).order('created_at', { ascending: false });
      if (error) throw new Error(error.message);
      return send(res, 200, data.map(riskEventResponse));
    }
    if (url.pathname.startsWith('/api/risk-events/')) {
      const { data } = await (await table('risk_events')).select('*').eq('id', url.pathname.split('/').pop()).eq('project_id', project.id).single();
      return send(res, 200, riskEventResponse(data));
    }
    if (url.pathname === '/api/api-keys' && req.method === 'GET') {
      const { data: rows, error } = await (await table('api_keys')).select('*').eq('project_id', project.id).order('created_at', { ascending: false });
      if (error) throw new Error(error.message);
      return send(res, 200, rows.map((row) => apiKeyResponse(row)));
    }
    if (url.pathname === '/api/api-keys' && req.method === 'POST') {
      const environment = body.environment || 'live';
      const raw = `sk_stravo_${environment}_${crypto.randomBytes(18).toString('hex')}`;
      const row = { id: id('key'), project_id: project.id, name: body.name || 'New key', key_hash: hash(raw), key_prefix: raw.slice(0, 20), environment, status: 'active', scopes: body.scopes || ['signup:check'] };
      const { data, error } = await insertApiKey(row);
      if (error) throw new Error(error.message);
      console.log('[api-keys] created', { requestId, projectId: project.id, keyId: data[0]?.id, environment });
      return send(res, 201, apiKeyResponse(data[0], raw));
    }
    if (url.pathname.startsWith('/api/api-keys/') && ['DELETE', 'PATCH'].includes(req.method)) {
      const keyId = url.pathname.split('/').pop();
      const revoked = await patchProjectRow('api_keys', keyId, project.id, { status: 'revoked' });
      console.log('[api-keys] revoked', { requestId, projectId: project.id, keyId });
      return send(res, 200, apiKeyResponse(revoked));
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
      const [riskEvents, internalAttempts] = await Promise.all([
        (await table('risk_events')).select('*').eq('project_id', project.id).order('created_at', { ascending: false }).limit(200),
        (await table('internal_signup_attempts')).select('*').order('created_at', { ascending: false }).limit(200),
      ]);
      if (riskEvents.error) throw new Error(riskEvents.error.message);
      if (internalAttempts.error) throw new Error(internalAttempts.error.message);
      const reviewItems = [
        ...(riskEvents.data || []).filter(isReviewQueueCandidate).map(riskEventResponse),
        ...(internalAttempts.data || []).map(internalSignupAttemptResponse),
      ].sort((a, b) => new Date(b.submittedAt || 0) - new Date(a.submittedAt || 0));
      return send(res, 200, reviewItems);
    }
    if (url.pathname.includes('/api/review-queue/') && req.method === 'POST') {
      const [, , , eventId, command] = url.pathname.split('/');
      const action = command === 'approve' ? 'ALLOW' : 'BLOCK';
      const isInternalAttempt = eventId.startsWith('wait_') || eventId.startsWith('isa_');
      let updated;
      if (isInternalAttempt) {
        const { data, error } = await (await table('internal_signup_attempts')).update({ action }).eq('id', eventId).select();
        if (error) throw new Error(error.message);
        if (!data?.length) throw Object.assign(new Error('Not found'), { status: 404 });
        updated = internalSignupAttemptResponse(data[0]);
      } else {
        updated = await patchProjectRow('risk_events', eventId, project.id, { action });
      }
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

    throw apiError('NOT_FOUND', 'Not found', 404);
  } catch (error) {
    const status = error.status || 500;
    const errorCode = error.code || (status === 404 ? 'NOT_FOUND' : status === 401 ? 'AUTH_REQUIRED' : 'INTERNAL_SERVER_ERROR');
    console.error('[api] request failed', {
      requestId,
      method: req.method,
      path: url.pathname,
      status,
      latencyMs: Date.now() - startedAt,
      errorCode,
      message: error.message || 'Server error',
    });
    return sendError(res, error);
  }
}

if (!process.env.VERCEL) {
  http.createServer(router).listen(PORT, () => {
    console.log(`STRAVOTECH API using InsForge at ${INSFORGE_URL}`);
    console.log(`STRAVOTECH API listening on http://localhost:${PORT}`);
  });
}
