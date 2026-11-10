import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import type { AddressInfo } from 'node:net';
import { createMapperServer } from '../src/server.js';

test('/pispace/ passes only the live-view paths through to pispace', async () => {
  const seen: string[] = [];
  const fake = http.createServer((req, res) => {
    seen.push(`${req.method} ${req.url}`);
    if (req.url === '/web/live-view.js') {
      res.writeHead(200, { 'content-type': 'text/javascript' });
      res.end('export const ok = 1;');
      return;
    }
    if (req.url === '/api/v1/solve-ptz') {
      let body = '';
      req.on('data', (c) => (body += c));
      req.on('end', () => {
        res.writeHead(200, { 'content-type': 'application/json' });
        res.end(JSON.stringify({ echo: JSON.parse(body) }));
      });
      return;
    }
    res.writeHead(200, { 'content-type': 'application/json' });
    res.end('{}');
  });
  await new Promise<void>((r) => fake.listen(0, '127.0.0.1', r));
  const port = (fake.address() as AddressInfo).port;
  const app = createMapperServer({ port: 0, pispaceUrl: `http://127.0.0.1:${port}` });
  try {
    const mod = await app.inject({ method: 'GET', url: '/pispace/web/live-view.js' });
    assert.equal(mod.statusCode, 200);
    assert.match(mod.headers['content-type'] as string, /javascript/);
    assert.equal(mod.body, 'export const ok = 1;');

    const solve = await app.inject({ method: 'POST', url: '/pispace/api/v1/solve-ptz', payload: { cameraId: 'cam1' } });
    assert.deepEqual(solve.json(), { echo: { cameraId: 'cam1' } });

    // Not on the list, or wrong method: never reaches pispace.
    assert.equal((await app.inject({ method: 'POST', url: '/pispace/api/v1/venue', payload: {} })).statusCode, 404);
    assert.equal((await app.inject({ method: 'GET', url: '/pispace/api/v1/solve-ptz' })).statusCode, 404);
    assert.equal((await app.inject({ method: 'GET', url: '/pispace/../package.json' })).statusCode, 404);
    assert.deepEqual(seen, ['GET /web/live-view.js', 'POST /api/v1/solve-ptz']);
  } finally {
    await app.close();
    fake.close();
  }
});
