import test from 'node:test';
import assert from 'node:assert/strict';
import { createMapperServer } from '../src/server.js';
import { createStandardHallTemplate } from '../src/templates/standard-hall.js';

test('church-3d-mapper server routes', async () => {
  const app = createMapperServer({ port: 3109 });

  // Health
  const resHealth = await app.inject({ method: 'GET', url: '/health' });
  assert.equal(resHealth.statusCode, 200);
  assert.equal(resHealth.json().ok, true);

  // Serve index.html
  const resIndex = await app.inject({ method: 'GET', url: '/' });
  assert.equal(resIndex.statusCode, 200);
  assert.ok(resIndex.body.includes('Church 3D Mapper'));

  // Serve CSS
  const resCss = await app.inject({ method: 'GET', url: '/style.css' });
  assert.equal(resCss.statusCode, 200);
  assert.ok(resCss.body.includes('--bg-dark'));

  // Serve app.js
  const resJs = await app.inject({ method: 'GET', url: '/app.js' });
  assert.equal(resJs.statusCode, 200);
  assert.ok(resJs.body.includes('three'));

  // Serve Three.js vendor module offline
  await app.ready();
  const resThree = await app.inject({ method: 'GET', url: '/vendor/three/build/three.module.js' });
  assert.equal(resThree.statusCode, 200);
  assert.ok(resThree.body.length > 500000);

  // Validate API
  const model = createStandardHallTemplate();
  const resVal = await app.inject({
    method: 'POST',
    url: '/api/validate',
    payload: model,
  });
  assert.equal(resVal.statusCode, 200);
  assert.equal(resVal.json().valid, true);

  // Get Template API
  const resTpl = await app.inject({
    method: 'GET',
    url: '/api/templates/standard-hall',
  });
  assert.equal(resTpl.statusCode, 200);
  assert.equal(resTpl.json().name, 'New Sanctuary');

  await app.close();
});
