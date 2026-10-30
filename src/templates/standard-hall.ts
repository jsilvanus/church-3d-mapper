import type { VenueModel } from '../types.js';

export function createStandardHallTemplate(name = 'New Sanctuary'): VenueModel {
  return {
    name,
    description: 'Rectangular church hall template with Chancel, Pulpit, and Lectern',
    dimensions: {
      widthMeters: 14.0,
      lengthMeters: 24.0,
      heightMeters: 10.0,
    },
    originDescription: 'Sanctuary floor at communion rail center (0, 0, 0)',
    cameras: {
      cam1: {
        id: 'cam1',
        name: 'Cam 1 (Side Wall)',
        position: { x: 4.5, y: 1.0, z: 3.2 },
        baseOrientation: { pan: 250.0, tilt: -10.0, roll: 0.0 },
      },
      cam2: {
        id: 'cam2',
        name: 'Cam 2 (Rear Center Overview)',
        position: { x: 0.0, y: -12.0, z: 4.0 },
        baseOrientation: { pan: 0.0, tilt: -8.0, roll: 0.0 },
      },
    },
    zones: [
      {
        id: 'altar',
        name: 'Altar Chancel',
        floorHeight: 0.4,
        ceilingHeight: 10.0,
        color: '#9b59b6',
        tags: ['liturgy', 'eucharist'],
        polygon: [
          { x: -2.5, y: 0.5 },
          { x: 2.5, y: 0.5 },
          { x: 2.5, y: 4.5 },
          { x: -2.5, y: 4.5 },
        ],
      },
      {
        id: 'pulpit',
        name: 'Pulpit',
        floorHeight: 1.2,
        ceilingHeight: 4.0,
        color: '#e74c3c',
        tags: ['speaker', 'sermon'],
        polygon: [
          { x: -4.0, y: -0.5 },
          { x: -2.2, y: -0.5 },
          { x: -2.2, y: 1.5 },
          { x: -4.0, y: 1.5 },
        ],
      },
      {
        id: 'lectern',
        name: 'Lectern',
        floorHeight: 0.4,
        ceilingHeight: 3.5,
        color: '#f39c12',
        tags: ['reader', 'readings'],
        polygon: [
          { x: 1.5, y: -0.5 },
          { x: 3.0, y: -0.5 },
          { x: 3.0, y: 1.5 },
          { x: 1.5, y: 1.5 },
        ],
      },
      {
        id: 'nave',
        name: 'Nave / Pews',
        floorHeight: 0.0,
        ceilingHeight: 10.0,
        color: '#7f8c8d',
        tags: ['congregation'],
        polygon: [
          { x: -6.0, y: -12.0 },
          { x: 6.0, y: -12.0 },
          { x: 6.0, y: -1.0 },
          { x: -6.0, y: -1.0 },
        ],
      },
    ],
    occluders: [
      {
        id: 'pulpit_desk',
        name: 'Pulpit Front Balustrade',
        kind: 'box',
        position: { x: -3.1, y: 0.5, z: 1.2 },
        dimensions: { width: 1.2, depth: 0.8, height: 1.1 },
      },
    ],
  };
}
