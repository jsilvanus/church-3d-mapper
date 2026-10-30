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
