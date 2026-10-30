import test from 'node:test';
import assert from 'node:assert/strict';
import { validateVenueModel } from '../src/validator.js';
import { createStandardHallTemplate } from '../src/templates/standard-hall.js';

test('validates standard hall template without errors', () => {
  const model = createStandardHallTemplate();
  const res = validateVenueModel(model);

  assert.equal(res.valid, true);
  const errors = res.issues.filter((i) => i.severity === 'error');
  assert.equal(errors.length, 0);
});

test('catches missing name and negative dimensions', () => {
  const invalid = {
    dimensions: { widthMeters: -5, lengthMeters: 20, heightMeters: 0 },
    cameras: {},
    zones: [],
  };
  const res = validateVenueModel(invalid);

  assert.equal(res.valid, false);
  assert.ok(res.issues.some((i) => i.path === 'name'));
  assert.ok(res.issues.some((i) => i.path === 'dimensions.widthMeters'));
  assert.ok(res.issues.some((i) => i.path === 'dimensions.heightMeters'));
});

test('catches invalid zone elevation (floorHeight >= ceilingHeight)', () => {
  const model = createStandardHallTemplate();
  model.zones[0]!.floorHeight = 5.0;
  model.zones[0]!.ceilingHeight = 2.0;

  const res = validateVenueModel(model);
  assert.equal(res.valid, false);
  assert.ok(res.issues.some((i) => i.path.includes('floorHeight')));
});

test('catches degenerate polygon (< 3 vertices)', () => {
  const model = createStandardHallTemplate();
  model.zones[0]!.polygon = [{ x: 0, y: 0 }, { x: 1, y: 1 }];

  const res = validateVenueModel(model);
  assert.equal(res.valid, false);
  assert.ok(res.issues.some((i) => i.path.includes('polygon')));
});
