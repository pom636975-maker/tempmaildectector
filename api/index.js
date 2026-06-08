import { router } from '../server/index.mjs';

export default function handler(req, res) {
  const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  const path = url.searchParams.get('path');
  if (path) {
    url.searchParams.delete('path');
    req.url = `/api/${path}${url.search}`;
  }
  return router(req, res);
}
