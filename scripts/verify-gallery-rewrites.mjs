// Self-contained same-origin proxy check. No database, storage, or patient data.
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { createServer } from 'node:http';
import { mkdtemp, rm } from 'node:fs/promises';
import { createServer as createTCPServer } from 'node:net';
import { dirname, join, basename } from 'node:path';
import { fileURLToPath } from 'node:url';

const frontendDir = dirname(dirname(fileURLToPath(import.meta.url)));
const buildDir = await mkdtemp(join(frontendDir, '.next-gallery-rewrite-'));
const seen = [];
const upstream = createServer((request, response) => {
  seen.push(request.url);
  response.setHeader('Cache-Control', 'private, no-store');
  response.setHeader('X-Gallery-Rewrite-Probe', 'upstream');
  if (request.url === '/api/v1/gallery?page=1&page_size=5') {
    response.setHeader('Content-Type', 'application/json');
    response.end('{"data":[],"page":1,"page_size":5,"total":0}');
  } else if (request.url === '/api/v1/gallery-content?lang=ar') {
    response.setHeader('Content-Type', 'application/json');
    response.end('{"data":[]}');
  } else if (request.url === '/api/v1/gallery/synthetic-id/media/display') {
    response.setHeader('Content-Type', 'image/webp');
    response.end('synthetic derivative bytes');
  } else if (request.url === '/api/v1/gallery/synthetic-id/media/thumbnail') {
    response.statusCode = 404;
    response.end('revoked');
  } else {
    response.statusCode = 418;
    response.end('unexpected route');
  }
});

async function freePort() {
  const server = createTCPServer();
  await new Promise((resolve, reject) => server.once('error', reject).listen(0, '127.0.0.1', resolve));
  const port = server.address().port;
  await new Promise(resolve => server.close(resolve));
  return port;
}

let next;
try {
  await new Promise((resolve, reject) => upstream.once('error', reject).listen(0, '127.0.0.1', resolve));
  const upstreamPort = upstream.address().port;
  const nextPort = await freePort();
  next = spawn(process.execPath, ['node_modules/next/dist/bin/next', 'dev', '--hostname', '127.0.0.1', '--port', String(nextPort)], {
    cwd: frontendDir,
    env: {
      ...process.env,
      API_BASE_URL: `http://127.0.0.1:${upstreamPort}`,
      GALLERY_REWRITE_VERIFY_DIST_DIR: basename(buildDir),
      NEXT_TELEMETRY_DISABLED: '1',
    },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  let output = '';
  for (const stream of [next.stdout, next.stderr]) {
    stream.on('data', chunk => { output = (output + chunk.toString()).slice(-2000); });
  }

  const base = `http://127.0.0.1:${nextPort}`;
  let ready = false;
  for (let attempt = 0; attempt < 90; attempt++) {
    if (next.exitCode !== null) throw new Error(`Next exited before startup: ${output}`);
    try {
      const response = await fetch(`${base}/api/v1/gallery?page=1&page_size=5`, { signal: AbortSignal.timeout(3000) });
      if (response.headers.get('x-gallery-rewrite-probe') === 'upstream') {
        ready = true;
        break;
      }
    } catch { /* Next has not started listening yet. */ }
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  assert.ok(ready, `Next did not forward the gallery list within 90 seconds: ${output}`);

  for (const [path, status, body] of [
    ['/api/v1/gallery?page=1&page_size=5', 200, '{"data":[],"page":1,"page_size":5,"total":0}'],
    ['/api/v1/gallery-content?lang=ar', 200, '{"data":[]}'],
    ['/api/v1/gallery/synthetic-id/media/display', 200, 'synthetic derivative bytes'],
    ['/api/v1/gallery/synthetic-id/media/thumbnail', 404, 'revoked'],
  ]) {
    const response = await fetch(`${base}${path}`);
    assert.equal(response.status, status, `${path}: status`);
    assert.equal(response.headers.get('cache-control'), 'private, no-store', `${path}: no-store`);
    assert.equal(response.headers.get('x-gallery-rewrite-probe'), 'upstream', `${path}: upstream marker`);
    assert.equal(await response.text(), body, `${path}: body`);
    assert.ok(seen.includes(path), `${path}: exact upstream path and query`);
  }
  console.log('Gallery rewrites passed: list, content, derivative bytes, revoked status and no-store headers.');
} finally {
  if (next && next.exitCode === null) {
    next.kill('SIGTERM');
    await Promise.race([
      new Promise(resolve => next.once('exit', resolve)),
      new Promise(resolve => setTimeout(resolve, 5000)),
    ]);
    if (next.exitCode === null) next.kill('SIGKILL');
  }
  await new Promise(resolve => upstream.close(resolve));
  await rm(buildDir, { recursive: true, force: true });
}
