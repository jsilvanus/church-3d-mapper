# church-3d-mapper

Visual 3D venue authoring and validation tool for **PiSpace** in the Pi production ecosystem.

`church-3d-mapper` provides an interactive browser-based 2D/3D floorplan CAD editor and CLI utility to create, inspect, validate, and export venue-specific 3D JSON models compliant with the `pispace` venue schema.

---

## Features

- **Interactive 2D/3D Floorplan Canvas**:
  - Metric coordinate grid with zooming, panning, and $(0, 0, 0)$ origin crosshairs.
  - Draw polygonal spatial zones (`altar`, `pulpit`, `lectern`, `choir`, `nave`) with custom floor and ceiling heights.
  - Place PTZ cameras (e.g. AVer PTZ330), adjust base pan/tilt angles, and visualize live optical field-of-view (FOV) cones.
  - Define 3D occluders (`.glb` mesh assets or parametric boxes/cylinders) for broadcast AR keymasking.
- **Strict PiSpace Validation**:
  - Checks for degenerate polygons, self-intersections, floor/ceiling inversions, missing coordinates, and ID collisions.
- **Direct PiSpace Synchronization**:
  - Export self-contained `venue.json` files or push directly to a running `pispace` daemon (`PUT /api/v1/venue`).
- **Templates Included**:
  - Preloaded with *Riihimäen Keskuskirkko* and standard rectangular church hall templates.

---

## Quick Start

### 1. Launch Visual Web Editor

```bash
npm install
npm run dev     # or: npx church-3d-mapper editor
```

Open your browser at **`http://localhost:3109`**.

### 2. CLI Commands

```bash
# Validate a venue JSON file against the PiSpace schema
npx church-3d-mapper validate path/to/venue.json

# Initialize a new template venue model
npx church-3d-mapper init "Hämeenlinnan Kirkko" --out hml-church.json

# Push venue model directly to PiSpace
npx church-3d-mapper push venue.json --pispace-url http://127.0.0.1:3108
```

---

## Venue Model Output Format

Produces `venue.json` conforming to `pispace/venues/venue-schema.json`:

```json
{
  "name": "Riihimäen Keskuskirkko",
  "dimensions": { "widthMeters": 16.0, "lengthMeters": 30.0, "heightMeters": 14.0 },
  "originDescription": "Sanctuary floor at center of communion rail (0, 0, 0)",
  "cameras": {
    "cam1": {
      "id": "cam1",
      "name": "Cam 1 (Side Wall)",
      "position": { "x": 5.2, "y": 1.5, "z": 3.6 },
      "baseOrientation": { "pan": 250.0, "tilt": -12.0, "roll": 0.0 }
    }
  },
  "zones": [
    {
      "id": "pulpit",
      "name": "Saarnastuoli",
      "floorHeight": 1.3,
      "ceilingHeight": 4.5,
      "polygon": [
        { "x": -4.5, "y": -0.5 },
        { "x": -2.6, "y": -0.5 },
        { "x": -2.6, "y": 1.8 },
        { "x": -4.5, "y": 1.8 }
      ]
    }
  ],
  "occluders": [
    {
      "id": "pulpit_facade",
      "name": "Pulpit Wooden Balustrade",
      "kind": "mesh",
      "meshUrl": "models/pulpit-facade.glb",
      "position": { "x": -3.5, "y": 0.5, "z": 1.3 }
    }
  ]
}
```

---

## Development & Testing

```bash
# Install dependencies
npm install

# Run unit tests
npm test

# Build TypeScript to dist/
npm run build
```
