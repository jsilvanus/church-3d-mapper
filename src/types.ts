export interface Point2D {
  x: number;
  y: number;
}

export interface Point3D {
  x: number;
  y: number;
  z: number;
}

export interface SpatialZone {
  id: string;
  name: string;
  polygon: Point2D[];
  floorHeight: number;
  ceilingHeight: number;
  color?: string | undefined;
  tags?: string[] | undefined;
}

export interface CameraMount {
  id: string;
  name: string;
  position: Point3D;
  baseOrientation: {
    pan: number;
    tilt: number;
    roll: number;
  };
}

export interface SpatialOccluder {
  id: string;
  name: string;
  kind: 'mesh' | 'box' | 'cylinder' | 'polygon_wall';
  meshUrl?: string | undefined;
  position: Point3D;
  rotation?: { x: number; y: number; z: number } | undefined;
  scale?: { x: number; y: number; z: number } | undefined;
  dimensions?: { width: number; height: number; depth: number } | undefined;
  polygon?: Point2D[] | undefined;
}

export interface FloorPlatform {
  id: string;
  name: string;
  /** Elevation in meters above nave floor ground (Z = 0) */
  elevation: number;
  /** Thickness of the platform slab in meters (default 0.25) */
  thickness?: number | undefined;
  /** 2D boundary of the raised floor platform */
  polygon: Point2D[];
  color?: string | undefined;
}

export interface VenueWall {
  id: string;
  name: string;
  start: Point2D;
  end: Point2D;
  /** Base elevation of the wall. 0 for normal wall, or > 0 (e.g. 3.8m) for OPEN-BOTTOM wall / arch header! */
  bottomZ: number;
  /** Top elevation of the wall (e.g. 14.0m for ceiling or 4.0m for side aisle) */
  topZ: number;
  /** Wall thickness in meters (e.g. 0.4) */
  thickness: number;
  color?: string | undefined;
}

export interface VenueModel {
  name: string;
  description: string;
  dimensions: {
    widthMeters: number;
    lengthMeters: number;
    heightMeters: number;
  };
  originDescription: string;
  cameras: Record<string, CameraMount>;
  zones: SpatialZone[];
  occluders?: SpatialOccluder[] | undefined;
  floors?: FloorPlatform[] | undefined;
  walls?: VenueWall[] | undefined;
}

export interface ValidationIssue {
  path: string;
  message: string;
  severity: 'error' | 'warning';
}

export interface ValidationResult {
  valid: boolean;
  issues: ValidationIssue[];
}
