import { router } from '../server/index.mjs';

export default function handler(req, res) {
  return router(req, res);
}
