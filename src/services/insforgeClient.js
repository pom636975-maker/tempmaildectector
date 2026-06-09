import { createClient } from '@insforge/sdk';

const INSFORGE_URL = import.meta.env.VITE_INSFORGE_URL || 'https://hp7mm277.us-east.insforge.app';

export const insforgeBrowserClient = createClient({
  baseUrl: INSFORGE_URL,
});

export function getInsForgeAccessToken() {
  return insforgeBrowserClient.tokenManager?.getAccessToken?.() || '';
}
