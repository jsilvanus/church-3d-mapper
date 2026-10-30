import test from 'node:test';
import assert from 'node:assert/strict';
import { createStandardHallTemplate } from '../src/templates/standard-hall.js';

test('createStandardHallTemplate returns complete venue model', () => {
  const t = createStandardHallTemplate('Test Chapel');
  assert.equal(t.name, 'Test Chapel');
  assert.equal(t.dimensions.widthMeters, 14.0);
  assert.ok(t.cameras.cam1);
  assert.ok(t.cameras.cam2);
  assert.ok(t.zones.some((z) => z.id === 'altar'));
  assert.ok(t.zones.some((z) => z.id === 'pulpit'));
  assert.ok(t.zones.some((z) => z.id === 'lectern'));
});
