import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createMapperServer } from '../src/server.js';
import { createStandardHallTemplate } from '../src/templates/standard-hall.js';

test('local venue folder: read venue and meshes, refuse escapes, save validated JSON', async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'c3m-'));
  fs.mkdirSync(path.join(dir, 'models'));
  fs.writeFileSync(path.join(dir, 'models', 'scan.glb'), 'glTF');
  fs.writeFileSync(path.join(dir, 'secret.txt'), 'x');
  const venuePath = path.join(dir, 'venue.json');
  const venue = createStandardHallTemplate();
  fs.writeFileSync(venuePath, JSON.stringify(venue));
  const app = createMapperServer();
  const q = (file?: string) => `/api/local/file?venue=${encodeURIComponent(venuePath)}${file ? `&file=${encodeURIComponent(file)}` : ''}`;
  const local = { remoteAddress: '127.0.0.1' };

  const v = await app.inject({ method: 'GET', url: q(), ...local });
  assert.equal(v.statusCode, 200);
  assert.equal(v.json().name, venue.name);

  const glb = await app.inject({ method: 'GET', url: q('models/scan.glb'), ...local });
  assert.equal(glb.statusCode, 200);
  assert.equal(glb.headers['content-type'], 'model/gltf-binary');

  assert.equal((await app.inject({ method: 'GET', url: q('../../etc/passwd.json'), ...local })).statusCode, 400);
  assert.equal((await app.inject({ method: 'GET', url: q('secret.txt'), ...local })).statusCode, 400);
  assert.equal((await app.inject({ method: 'GET', url: q('models/scan.glb'), remoteAddress: '192.168.1.50' })).statusCode, 403);

  const bad = await app.inject({ method: 'PUT', url: `/api/local/venue?venue=${encodeURIComponent(venuePath)}`, payload: { name: 'x' }, ...local });
  assert.equal(bad.statusCode, 400);
  const saved = await app.inject({ method: 'PUT', url: `/api/local/venue?venue=${encodeURIComponent(venuePath)}`, payload: { ...venue, description: 'edited' }, ...local });
  assert.equal(saved.statusCode, 200);
  assert.equal(JSON.parse(fs.readFileSync(venuePath, 'utf8')).description, 'edited');
  await app.close();
});

test('default venue route: serves venue configured in options or env', async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'c3m-def-'));
  const venuePath = path.join(dir, 'default-venue.json');
  const venue = createStandardHallTemplate();
  venue.name = 'Configured Hall';
  fs.writeFileSync(venuePath, JSON.stringify(venue));

  const app = createMapperServer({ venueFile: venuePath });
  const res = await app.inject({ method: 'GET', url: '/api/default-venue' });
  assert.equal(res.statusCode, 200);
  const data = res.json();
  assert.equal(data.venuePath, venuePath);
  assert.equal(data.venue.name, 'Configured Hall');
  await app.close();
});
