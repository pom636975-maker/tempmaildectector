import crypto from 'node:crypto';
import { createAdminClient } from '@insforge/sdk';

const INSFORGE_URL = process.env.INSFORGE_URL || 'https://hp7mm277.us-east.insforge.app';
const INSFORGE_API_KEY = process.env.INSFORGE_API_KEY;

const sources = [
  'https://disposable.github.io/disposable-email-domains/domains_mx.txt',
  'https://disposable.github.io/disposable-email-domains/domains_strict.txt',
  'https://raw.githubusercontent.com/disposable-email-domains/disposable-email-domains/main/disposable_email_blocklist.conf',
];

const hotfixDomains = [
  'bncinema.com',
  'temp-mail.io',
  'tempmailo.com',
  'snapmail.in',
  'mail.tm',
  'internxt.com',
];

if (!INSFORGE_API_KEY) {
  console.error('INSFORGE_API_KEY is required.');
  process.exit(1);
}

function normalizeDomain(value) {
  return String(value)
    .trim()
    .toLowerCase()
    .replace(/^@/, '')
    .replace(/^https?:\/\//, '')
    .replace(/^www\./, '')
    .split(/[/?#\s]/)[0];
}

function isValidDomain(domain) {
  return /^[a-z0-9][a-z0-9.-]*\.[a-z]{2,}$/.test(domain) && !domain.includes('..');
}

async function fetchDomains(url) {
  const response = await fetch(url, { headers: { 'User-Agent': 'stravotech-disposable-domain-sync' } });
  if (!response.ok) throw new Error(`Failed to fetch ${url}: ${response.status}`);
  const text = await response.text();
  return text
    .split(/\r?\n/)
    .map((line) => line.replace(/#.*$/, ''))
    .map(normalizeDomain)
    .filter(isValidDomain);
}

function chunk(rows, size) {
  const chunks = [];
  for (let index = 0; index < rows.length; index += size) chunks.push(rows.slice(index, index + size));
  return chunks;
}

const fetched = await Promise.all(sources.map(fetchDomains));
const domains = [...new Set([...fetched.flat(), ...hotfixDomains.map(normalizeDomain)].filter(isValidDomain))].sort();

const admin = createAdminClient({ baseUrl: INSFORGE_URL, apiKey: INSFORGE_API_KEY });
const { data: existingRows, error: existingError } = await admin.database.from('disposable_domains').select('domain');
if (existingError) throw new Error(existingError.message);

const existing = new Set((existingRows || []).map((row) => normalizeDomain(row.domain)));
const newDomains = domains.filter((domain) => !existing.has(domain));
const rows = newDomains.map((domain) => ({
  id: `disp_${crypto.randomBytes(8).toString('hex')}`,
  domain,
}));

let inserted = 0;
for (const batch of chunk(rows, 500)) {
  const { error } = await admin.database.from('disposable_domains').insert(batch);
  if (error) throw new Error(error.message);
  inserted += batch.length;
}

console.log(JSON.stringify({
  sources: sources.length,
  fetched: domains.length,
  already_present: domains.length - newDomains.length,
  inserted,
}, null, 2));
