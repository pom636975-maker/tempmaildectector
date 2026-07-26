import { createAdminClient } from '@insforge/sdk';

const INSFORGE_URL = process.env.INSFORGE_URL || 'https://hp7mm277.us-east.insforge.app';
const INSFORGE_API_KEY = process.env.INSFORGE_API_KEY || 'missing';

console.log('Connecting to InsForge:', INSFORGE_URL);
const admin = createAdminClient({ baseUrl: INSFORGE_URL, apiKey: INSFORGE_API_KEY });

async function test() {
  try {
    console.log('Querying profiles...');
    const pRes = await admin.database.from('profiles').select('*').order('created_at', { ascending: false });
    if (pRes.error) console.error('Profiles Error:', pRes.error);
    else console.log('Profiles success, count:', pRes.data?.length);

    console.log('Querying subscriptions...');
    const sRes = await admin.database.from('subscriptions').select('*').order('created_at', { ascending: false });
    if (sRes.error) console.error('Subscriptions Error:', sRes.error);
    else console.log('Subscriptions success, count:', sRes.data?.length);

    console.log('Querying risk_events...');
    const rRes = await admin.database.from('risk_events').select('id').order('created_at', { ascending: false }).limit(500);
    if (rRes.error) console.error('Risk Events Error:', rRes.error);
    else console.log('Risk Events success, count:', rRes.data?.length);
  } catch (err) {
    console.error('Catch error:', err);
  }
}

test();
