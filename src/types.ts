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
