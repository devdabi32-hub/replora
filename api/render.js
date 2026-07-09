// Vercel Node.js serverless function — SSR adapter for TanStack Start
import { readdir } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const serverAssetsDir = join(__dirname, '..', 'dist', 'server', 'assets');

export const config = {
  api: { bodyParser: false },
};

let cachedServer;

async function loadServer() {
  if (cachedServer) return cachedServer;
  const files = await readdir(serverAssetsDir);
  const serverFile = files.find((f) => /^server-[A-Za-z0-9_-]+\.js$/.test(f));
  if (!serverFile) throw new Error(`No server bundle in ${serverAssetsDir}`);
  const mod = await import(join(serverAssetsDir, serverFile));
  cachedServer = mod.default ?? mod;
  return cachedServer;
}

export default async function handler(req, res) {
  const server = await loadServer();

  const proto = req.headers['x-forwarded-proto'] || 'https';
  const host = req.headers['x-forwarded-host'] || req.headers.host || 'localhost';
  const url = `${proto}://${host}${req.url}`;

  const headers = new Headers(
    Object.entries(req.headers)
      .filter(([, v]) => v != null)
      .map(([k, v]) => [k, Array.isArray(v) ? v.join(', ') : String(v)]),
  );

  let body;
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    const chunks = [];
    for await (const chunk of req) chunks.push(chunk);
    body = Buffer.concat(chunks);
  }

  const response = await server.fetch(
    new Request(url, {
      method: req.method,
      headers,
      body: body?.length ? body : undefined,
    }),
  );

  res.statusCode = response.status;
  response.headers.forEach((v, k) => res.setHeader(k, v));
  res.end(Buffer.from(await response.arrayBuffer()));
}
