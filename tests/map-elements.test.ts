import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import type { AddressInfo } from 'node:net';
import { createMapperServer } from '../src/server.js';
import { validateVenueModel } from '../src/validator.js';
import { createStandardHallTemplate } from '../src/templates/standard-hall.js';

test('validator accepts map elements and reports bad ones', () => {
  const model = {
    ...createStandardHallTemplate(),
    levels: [{ id: 'ground', name: 'Ground', elevation: 0 }],
    furniture: [{ id: 'pew1', name: 'Pew', kind: 'pew', center: { x: 0, y: -3, z: 0 }, size: { width: 4, depth: 0.5, height: 0.9 } }],
    stairs: [{ id: 's1', name: 'Stair', fromZ: 0, toZ: 4, polygon: [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 1, y: 1 }] }],
    exits: [{ id: 'e1', name: 'Door', position: { x: 0, y: -8, z: 0 } }],
    rooms: [{ id: 'r1', name: 'Sacristy', floorZ: 0, polygon: [{ x: 3, y: 3 }, { x: 4, y: 3 }, { x: 4, y: 4 }] }],
  };
  assert.equal(validateVenueModel(model).valid, true);
  const bad = { ...model, exits: [{ id: 'e1', name: 'Door', position: { x: 0 } }, { id: 'e1', name: 'x', position: { x: 0, y: 0, z: 0 } }] };
  const res = validateVenueModel(bad);
  assert.equal(res.valid, false);
  assert.ok(res.issues.some((i) => i.path === 'exits[0]'));
  assert.ok(res.issues.some((i) => /Duplicate id "e1"/.test(i.message)));

  const withLayouts = {
    ...model,
    objectTypes: [{ id: 'chair', name: 'Tuoli', kind: 'other', size: { width: 0.5, depth: 0.5, height: 0.9 } }],
    layouts: [{ id: 'normal', name: 'Normal', placements: [{ id: 'c1', typeId: 'chair', center: { x: 1, y: 1, z: 0 } }] }],
    activeLayout: 'normal',
  };
  assert.equal(validateVenueModel(withLayouts).valid, true);
  const badType = { ...withLayouts, layouts: [{ id: 'normal', name: 'N', placements: [{ id: 'c1', typeId: 'sofa', center: { x: 0, y: 0, z: 0 } }] }] };
  assert.ok(validateVenueModel(badType).issues.some((i) => /unknown object type "sofa"/.test(i.message)));
  assert.ok(validateVenueModel({ ...withLayouts, activeLayout: 'x' }).issues.some((i) => i.path === 'activeLayout'));
});

test('push and live layout switch send the edit key to pispace', async () => {
  const seen: Array<{ method?: string; url?: string; auth?: string; body: string }> = [];
  const fake = http.createServer((req, res) => {
    let body = '';
    req.on('data', (c) => (body += c));
    req.on('end', () => {
      seen.push({ method: req.method, url: req.url, auth: req.headers.authorization, body });
      res.writeHead(200, { 'Content-Type': 'application/json' }).end('{"ok":true}');
    });
  });
  await new Promise<void>((r) => fake.listen(0, '127.0.0.1', r));
  const url = `http://127.0.0.1:${(fake.address() as AddressInfo).port}`;
  const app = createMapperServer({ pispaceUrl: url, editKey: 'k1' });
  try {
    const push = await app.inject({ method: 'POST', url: '/api/push', payload: createStandardHallTemplate() });
    assert.equal(push.statusCode, 200);
    const live = await app.inject({ method: 'POST', url: '/api/pispace-layout', payload: { layoutId: 'christmas' } });
    assert.equal(live.statusCode, 200);
    assert.equal((await app.inject({ method: 'POST', url: '/api/pispace-layout', payload: {} })).statusCode, 400);
    assert.deepEqual(seen.map((s) => [s.method, s.url, s.auth]), [
      ['PUT', '/api/v1/venue', 'Bearer k1'],
      ['POST', '/api/v1/venue/layout', 'Bearer k1'],
    ]);
    assert.equal(JSON.parse(seen[1]!.body).layoutId, 'christmas');
  } finally {
    await app.close();
    fake.close();
  }
});
