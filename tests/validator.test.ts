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

test('catches invalid wall elevation (bottomZ >= topZ)', () => {
  const model = createStandardHallTemplate();
  model.walls = [{
    id: 'broken_wall',
    name: 'Broken Wall',
    start: { x: 0, y: 0 },
    end: { x: 5, y: 0 },
    bottomZ: 10,
    topZ: 5,
    thickness: 0.3,
  }];

  const res = validateVenueModel(model);
  assert.equal(res.valid, false);
  assert.ok(res.issues.some((i) => i.path.includes('bottomZ')));
});

test('validates valid open-bottom wall', () => {
  const model = createStandardHallTemplate();
  model.walls = [{
    id: 'arch_header',
    name: 'Arch Header',
    start: { x: -3, y: 0 },
    end: { x: 3, y: 0 },
    bottomZ: 3.5, // 3.5m open clearance underneath!
    topZ: 12.0,
    thickness: 0.4,
    seeThrough: true,
  }];

  const res = validateVenueModel(model);
  assert.equal(res.valid, true);
});

test('validates 4-legged table occluder', () => {
  const model = createStandardHallTemplate();
  model.occluders = [{
    id: 'altar_table',
    name: 'Altar Table',
    kind: 'table',
    position: { x: 0, y: 2, z: 0.4 },
    dimensions: { width: 2.2, depth: 1.1, height: 0.9 },
  }];

  const res = validateVenueModel(model);
  assert.equal(res.valid, true);
});
