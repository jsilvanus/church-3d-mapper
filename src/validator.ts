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
        if (!['mesh', 'box', 'cylinder', 'polygon_wall', 'table'].includes(o.kind)) {
          issues.push({ path: `${prefix}.kind`, message: 'Kind must be mesh, box, cylinder, polygon_wall, or table', severity: 'error' });
        }
        if (o.kind === 'mesh' && (!o.meshUrl || typeof o.meshUrl !== 'string')) {
          issues.push({ path: `${prefix}.meshUrl`, message: 'Mesh occluder requires meshUrl (.glb/.gltf path)', severity: 'error' });
        }
        if (['box', 'cylinder', 'table'].includes(o.kind)) {
          if (!o.dimensions || typeof o.dimensions.width !== 'number' || typeof o.dimensions.height !== 'number') {
            issues.push({ path: `${prefix}.dimensions`, message: 'Parametric occluder requires width and height dimensions', severity: 'error' });
          }
        }
      }
    }
  }

  // Floors / Raised Platforms (Optional)
  if (v.floors !== undefined) {
    if (!Array.isArray(v.floors)) {
      issues.push({ path: 'floors', message: 'Floors must be an array', severity: 'error' });
    } else {
      for (let i = 0; i < v.floors.length; i++) {
        const f = v.floors[i]!;
        const prefix = `floors[${i}]`;
        if (!f.id || typeof f.id !== 'string') {
          issues.push({ path: `${prefix}.id`, message: 'Floor platform id is required', severity: 'error' });
        }
        if (typeof f.elevation !== 'number') {
          issues.push({ path: `${prefix}.elevation`, message: 'Floor elevation must be a number (meters)', severity: 'error' });
        }
        if (!Array.isArray(f.polygon) || f.polygon.length < 3) {
          issues.push({ path: `${prefix}.polygon`, message: 'Floor platform polygon must have at least 3 vertices', severity: 'error' });
        } else {
          const area = Math.abs(polygonSignedArea(f.polygon));
          if (area < 0.01) {
            issues.push({ path: `${prefix}.polygon`, message: 'Floor platform polygon area is effectively zero', severity: 'error' });
          }
        }
      }
    }
  }

  // Walls / Partitions / Arch Headers (Optional)
  if (v.walls !== undefined) {
    if (!Array.isArray(v.walls)) {
      issues.push({ path: 'walls', message: 'Walls must be an array', severity: 'error' });
    } else {
      for (let i = 0; i < v.walls.length; i++) {
        const w = v.walls[i]!;
        const prefix = `walls[${i}]`;
        if (!w.id || typeof w.id !== 'string') {
          issues.push({ path: `${prefix}.id`, message: 'Wall id is required', severity: 'error' });
        }
        if (!w.start || typeof w.start.x !== 'number' || typeof w.start.y !== 'number') {
          issues.push({ path: `${prefix}.start`, message: 'Wall start requires numeric x and y', severity: 'error' });
        }
        if (!w.end || typeof w.end.x !== 'number' || typeof w.end.y !== 'number') {
          issues.push({ path: `${prefix}.end`, message: 'Wall end requires numeric x and y', severity: 'error' });
        }
        if (typeof w.bottomZ !== 'number') {
          issues.push({ path: `${prefix}.bottomZ`, message: 'Wall bottomZ must be a number (0 for normal, >0 for open-bottom arch)', severity: 'error' });
        }
        if (typeof w.topZ !== 'number') {
          issues.push({ path: `${prefix}.topZ`, message: 'Wall topZ must be a number', severity: 'error' });
        }
        if (typeof w.bottomZ === 'number' && typeof w.topZ === 'number' && w.bottomZ >= w.topZ) {
          issues.push({ path: `${prefix}.bottomZ`, message: 'Wall bottomZ must be strictly less than topZ', severity: 'error' });
        }
        if (typeof w.thickness !== 'number' || w.thickness <= 0) {
          issues.push({ path: `${prefix}.thickness`, message: 'Wall thickness must be a positive number', severity: 'error' });
        }
      }
    }
  }

  validateMapElements(model as Record<string, unknown>, issues);

  const hasErrors = issues.some((i) => i.severity === 'error');
  return {
    valid: !hasErrors,
    issues,
  };
}

const isNum = (x: unknown): x is number => typeof x === 'number' && Number.isFinite(x);

function isPolygon(poly: unknown): boolean {
  return Array.isArray(poly) && poly.length >= 3 && poly.every((p) => p && isNum(p.x) && isNum(p.y));
}

function isPoint3(p: unknown): boolean {
  const q = p as Record<string, unknown> | undefined;
  return !!q && isNum(q.x) && isNum(q.y) && isNum(q.z);
}

/** Optional map elements, same rules as pispace's validateVenueModel. */
function validateMapElements(v: Record<string, unknown>, issues: ValidationIssue[]): void {
  const checks: Record<string, (item: Record<string, unknown>) => string | null> = {
    levels: (i) => (isNum(i.elevation) ? null : 'elevation must be a number'),
    furniture: (i) => {
      if (!isPoint3(i.center)) return 'center needs numeric x, y, z';
      const s = i.size as Record<string, unknown> | undefined;
      if (!s || !isNum(s.width) || !isNum(s.depth) || !isNum(s.height)) return 'size needs width, depth, height';
      return null;
    },
    stairs: (i) => (!isNum(i.fromZ) || !isNum(i.toZ) ? 'fromZ and toZ must be numbers' : isPolygon(i.polygon) ? null : 'polygon needs at least 3 vertices'),
    exits: (i) => (isPoint3(i.position) ? null : 'position needs numeric x, y, z'),
    rooms: (i) => (!isNum(i.floorZ) ? 'floorZ must be a number' : isPolygon(i.polygon) ? null : 'polygon needs at least 3 vertices'),
  };
  checks.objectTypes = (i) => {
    const s = i.size as Record<string, unknown> | undefined;
    return s && isNum(s.width) && isNum(s.depth) && isNum(s.height) ? null : 'size needs width, depth, height';
  };
  const typeIds = new Set(Array.isArray(v.objectTypes) ? (v.objectTypes as Array<{ id?: unknown }>).map((t) => t?.id) : []);
  checks.layouts = (i) => {
    if (!Array.isArray(i.placements)) return 'placements must be an array';
    const seen = new Set<unknown>();
    for (const p of i.placements as Array<Record<string, unknown>>) {
      if (!p || typeof p.id !== 'string') return 'every placement needs an id';
      if (seen.has(p.id)) return `duplicate placement id "${p.id}"`;
      seen.add(p.id);
      if (!typeIds.has(p.typeId)) return `placement ${p.id} uses unknown object type "${String(p.typeId)}"`;
      if (!isPoint3(p.center)) return `placement ${p.id} needs center x, y, z`;
    }
    return null;
  };
  if (v.activeLayout !== undefined && !(Array.isArray(v.layouts) && v.layouts.some((l: { id?: unknown }) => l?.id === v.activeLayout))) {
    issues.push({ path: 'activeLayout', message: 'activeLayout must be one of the layout ids', severity: 'error' });
  }
  for (const [key, check] of Object.entries(checks)) {
    const arr = v[key];
    if (arr === undefined) continue;
    if (!Array.isArray(arr)) {
      issues.push({ path: key, message: `${key} must be an array`, severity: 'error' });
      continue;
    }
    const seen = new Set<string>();
    arr.forEach((item: Record<string, unknown>, i) => {
      const prefix = `${key}[${i}]`;
      if (!item || typeof item.id !== 'string' || !item.id) {
        issues.push({ path: `${prefix}.id`, message: 'id is required', severity: 'error' });
        return;
      }
      if (seen.has(item.id)) issues.push({ path: `${prefix}.id`, message: `Duplicate id "${item.id}"`, severity: 'error' });
      seen.add(item.id);
      const problem = check(item);
      if (problem) issues.push({ path: prefix, message: problem, severity: 'error' });
    });
  }
}
