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
  - Export self-contained `venue.json` files or push directly to a running `pispace` daemon (`PUT /api/v1/venue`). PiSpace answers 403 unless it runs with `PISPACE_EDIT_KEY`; start the mapper with the same `PISPACE_EDIT_KEY` (and `PISPACE_URL`, default `http://127.0.0.1:3203`) and it sends the key as a Bearer token. A pushed model lives in PiSpace's memory only: save it to the venue file too.
- **Map elements**: furniture (pews, altar, pulpit, organ...), stairs and ramps, exits and side rooms are drawn in 2D and 3D, selectable, movable (Move tool, `R` / `Shift+R` rotates 15°) and edited as JSON in the inspector. The **Pew** and **Exit** tools place new ones. The level picker shows one storey (e.g. ground floor or gallery) and fades the rest.
- **Movable objects and layouts**: things that move between or during services (altar rail sections, lectern, chairs, a Christmas tree) are object types in the **Movable Objects** library. Select a piece of furniture and press **Make movable** to create a type, then **Place** to click copies onto the plan. Placements belong to the layout chosen in the header (**＋ New layout** copies the current one, e.g. "Christmas" from "Normal"). **Use layout live** switches PiSpace to the shown layout without pushing the whole model (preflight or during a service); PiSpace also takes single moves at `PATCH /api/v1/venue/placements/:id`.
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
PISPACE_EDIT_KEY=... npx church-3d-mapper push venue.json --pispace-url http://127.0.0.1:3203
```

---

## Placing cameras exactly

The venue's `cameras` are the single source of camera positions: pispace builds every camera's view from `position` and `baseOrientation` (pan 0° = +Y towards the altar, clockwise towards +X; tilt negative = down). Set them here, then **Save local** (the site file) and **Push to PiSpace**.

- **Move:** drag a camera in the 2D plan or the 3D view. In 3D, Shift-drag changes its height.
- **Aim:** drag the yellow dot in front of the selected camera, or Alt-drag the camera, to the point it should look at. Pan and tilt follow, with tilt aimed at head height (1.5 m) of a person standing there; hold Shift to keep the tilt. The Altar / Pulpit / Lectern buttons aim at those zones of the venue.
- **Exact values:** type X, Y, height, pan and tilt (0.01 m and 0.1° steps), or with a camera selected: Alt+arrows move 1 cm, PageUp/PageDown change height 1 cm, `[` `]` pan 0.1°, `-` `=` tilt 0.1°; hold Shift for 10×.

## Site files outside this repo

Real venue data and scans stay in the site's own private checkout, not here. In the editor:

- **Open local** asks for the path of the venue JSON on this computer (for example `../<site>/apps/pispace/<venue>.json`). The path is kept only in this browser's localStorage. Meshes the venue names (`modelUrl`, `meshUrl`, e.g. `models/church.glb`) then load from the same folder.
- **Save local** writes the edited venue back to that file after validating it.

The server serves these files only to requests from the same machine and only `.json`, `.glb` and `.gltf` inside the venue's folder. `models/` in this repo holds generic models only (`aver-ptz330.glb`).

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
