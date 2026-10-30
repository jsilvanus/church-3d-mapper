import type { VenueModel, ValidationResult, ValidationIssue, Point2D } from './types.js';

function polygonSignedArea(polygon: Point2D[]): number {
  let area = 0;
  for (let i = 0; i < polygon.length; i++) {
    const p1 = polygon[i]!;
    const p2 = polygon[(i + 1) % polygon.length]!;
    area += p1.x * p2.y - p2.x * p1.y;
  }
  return area / 2;
}

export function validateVenueModel(model: unknown): ValidationResult {
  const issues: ValidationIssue[] = [];

  if (!model || typeof model !== 'object') {
    return {
      valid: false,
      issues: [{ path: '', message: 'Model must be a valid JSON object', severity: 'error' }],
    };
  }

  const v = model as Partial<VenueModel>;

  // Basic info
  if (!v.name || typeof v.name !== 'string' || !v.name.trim()) {
    issues.push({ path: 'name', message: 'Venue name is required', severity: 'error' });
  }

  // Dimensions
  if (!v.dimensions || typeof v.dimensions !== 'object') {
    issues.push({ path: 'dimensions', message: 'Venue dimensions object is required', severity: 'error' });
  } else {
    const { widthMeters, lengthMeters, heightMeters } = v.dimensions;
    if (typeof widthMeters !== 'number' || widthMeters <= 0) {
      issues.push({ path: 'dimensions.widthMeters', message: 'widthMeters must be a positive number', severity: 'error' });
    }
    if (typeof lengthMeters !== 'number' || lengthMeters <= 0) {
      issues.push({ path: 'dimensions.lengthMeters', message: 'lengthMeters must be a positive number', severity: 'error' });
    }
    if (typeof heightMeters !== 'number' || heightMeters <= 0) {
      issues.push({ path: 'dimensions.heightMeters', message: 'heightMeters must be a positive number', severity: 'error' });
    }
  }

  // Origin
  if (!v.originDescription || typeof v.originDescription !== 'string') {
    issues.push({ path: 'originDescription', message: 'originDescription is recommended to define (0,0,0)', severity: 'warning' });
  }

  // Cameras
  if (!v.cameras || typeof v.cameras !== 'object') {
    issues.push({ path: 'cameras', message: 'Cameras dictionary is required', severity: 'error' });
  } else {
    const cameraEntries = Object.entries(v.cameras);
    if (cameraEntries.length === 0) {
      issues.push({ path: 'cameras', message: 'At least one camera is recommended', severity: 'warning' });
    }

    for (const [camKey, cam] of cameraEntries) {
      if (!cam.id || typeof cam.id !== 'string') {
        issues.push({ path: `cameras.${camKey}.id`, message: 'Camera id is required', severity: 'error' });
      }
      if (!cam.position || typeof cam.position.x !== 'number' || typeof cam.position.y !== 'number' || typeof cam.position.z !== 'number') {
        issues.push({ path: `cameras.${camKey}.position`, message: 'Camera requires 3D position (x, y, z)', severity: 'error' });
      }
      if (!cam.baseOrientation || typeof cam.baseOrientation.pan !== 'number' || typeof cam.baseOrientation.tilt !== 'number') {
        issues.push({ path: `cameras.${camKey}.baseOrientation`, message: 'Camera requires baseOrientation (pan, tilt, roll)', severity: 'error' });
      } else {
        if (cam.baseOrientation.tilt < -90 || cam.baseOrientation.tilt > 90) {
          issues.push({ path: `cameras.${camKey}.baseOrientation.tilt`, message: 'Tilt is usually between -90 and +90 degrees', severity: 'warning' });
        }
      }
    }
  }

  // Zones
  if (!Array.isArray(v.zones)) {
    issues.push({ path: 'zones', message: 'Zones array is required', severity: 'error' });
  } else {
    const seenZoneIds = new Set<string>();

    for (let i = 0; i < v.zones.length; i++) {
      const z = v.zones[i]!;
      const prefix = `zones[${i}]`;

      if (!z.id || typeof z.id !== 'string') {
        issues.push({ path: `${prefix}.id`, message: 'Zone id is required', severity: 'error' });
      } else if (seenZoneIds.has(z.id)) {
        issues.push({ path: `${prefix}.id`, message: `Duplicate zone id: "${z.id}"`, severity: 'error' });
      } else {
        seenZoneIds.add(z.id);
      }

      if (!z.name || typeof z.name !== 'string') {
        issues.push({ path: `${prefix}.name`, message: 'Zone name is required', severity: 'error' });
      }

      if (typeof z.floorHeight !== 'number') {
        issues.push({ path: `${prefix}.floorHeight`, message: 'floorHeight must be a number', severity: 'error' });
      }
      if (typeof z.ceilingHeight !== 'number') {
        issues.push({ path: `${prefix}.ceilingHeight`, message: 'ceilingHeight must be a number', severity: 'error' });
      }
      if (typeof z.floorHeight === 'number' && typeof z.ceilingHeight === 'number') {
        if (z.floorHeight >= z.ceilingHeight) {
          issues.push({ path: `${prefix}.floorHeight`, message: 'floorHeight must be strictly less than ceilingHeight', severity: 'error' });
        }
      }

      if (!Array.isArray(z.polygon) || z.polygon.length < 3) {
        issues.push({ path: `${prefix}.polygon`, message: 'Polygon must have at least 3 vertices', severity: 'error' });
      } else {
        for (let vi = 0; vi < z.polygon.length; vi++) {
          const pt = z.polygon[vi]!;
          if (typeof pt.x !== 'number' || typeof pt.y !== 'number') {
            issues.push({ path: `${prefix}.polygon[${vi}]`, message: 'Vertex requires numeric x and y', severity: 'error' });
          }
        }
        const area = Math.abs(polygonSignedArea(z.polygon));
        if (area < 0.01) {
          issues.push({ path: `${prefix}.polygon`, message: 'Polygon area is effectively zero or degenerate', severity: 'error' });
        }
      }
    }
  }

  // Occluders (Optional)
  if (v.occluders !== undefined) {
    if (!Array.isArray(v.occluders)) {
      issues.push({ path: 'occluders', message: 'Occluders must be an array', severity: 'error' });
    } else {
      for (let i = 0; i < v.occluders.length; i++) {
        const o = v.occluders[i]!;
        const prefix = `occluders[${i}]`;

        if (!o.id || typeof o.id !== 'string') {
          issues.push({ path: `${prefix}.id`, message: 'Occluder id is required', severity: 'error' });
        }
        if (!['mesh', 'box', 'cylinder', 'polygon_wall'].includes(o.kind)) {
          issues.push({ path: `${prefix}.kind`, message: 'Kind must be mesh, box, cylinder, or polygon_wall', severity: 'error' });
        }
        if (o.kind === 'mesh' && (!o.meshUrl || typeof o.meshUrl !== 'string')) {
          issues.push({ path: `${prefix}.meshUrl`, message: 'Mesh occluder requires meshUrl (.glb/.gltf path)', severity: 'error' });
        }
        if (['box', 'cylinder'].includes(o.kind)) {
          if (!o.dimensions || typeof o.dimensions.width !== 'number' || typeof o.dimensions.height !== 'number') {
            issues.push({ path: `${prefix}.dimensions`, message: 'Parametric occluder requires width and height dimensions', severity: 'error' });
          }
        }
      }
    }
  }

  const hasErrors = issues.some((i) => i.severity === 'error');
  return {
    valid: !hasErrors,
    issues,
  };
}
