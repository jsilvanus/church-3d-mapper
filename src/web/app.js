// Church 3D Venue Mapper Canvas & WebGL 3D Application
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

const KESKUSKIRKKO_TEMPLATE = {
  name: "Riihimäen Keskuskirkko",
  description: "Sanctuary layout with Chancel, Altar, Pulpit, Lectern, Choir, and Organ Gallery",
  dimensions: { widthMeters: 16.0, lengthMeters: 30.0, heightMeters: 14.0 },
  originDescription: "Sanctuary floor at center of the communion rail curve (0, 0, 0)",
  cameras: {
    cam1: {
      id: "cam1",
      name: "Cam 1 (Side Wall / Chancel Pillar)",
      position: { x: 5.2, y: 1.5, z: 3.6 },
      baseOrientation: { pan: 250.0, tilt: -12.0, roll: 0.0 }
    },
    cam2: {
      id: "cam2",
      name: "Cam 2 (Organ Gallery / Balcony)",
      position: { x: 0.0, y: -14.5, z: 5.0 },
      baseOrientation: { pan: 0.0, tilt: -8.0, roll: 0.0 }
    }
  },
  zones: [
    {
      id: "pulpit",
      name: "Saarnastuoli (Pulpit)",
      floorHeight: 1.3,
      ceilingHeight: 4.5,
      color: "#e74c3c",
      tags: ["speaker", "sermon", "liturgy"],
      polygon: [
        { x: -4.5, y: -0.5 },
        { x: -2.6, y: -0.5 },
        { x: -2.6, y: 1.8 },
        { x: -4.5, y: 1.8 }
      ]
    },
    {
      id: "lectern",
      name: "Lukupulpetti (Lectern)",
      floorHeight: 0.4,
      ceilingHeight: 3.5,
      color: "#f39c12",
      tags: ["reader", "readings", "prayers"],
      polygon: [
        { x: 1.8, y: -0.5 },
        { x: 3.5, y: -0.5 },
        { x: 3.5, y: 1.6 },
        { x: 1.8, y: 1.6 }
      ]
    },
    {
      id: "altar",
      name: "Alttari (Altar Chancel)",
      floorHeight: 0.4,
      ceilingHeight: 12.0,
      color: "#9b59b6",
      tags: ["liturgy", "eucharist", "blessing"],
      polygon: [
        { x: -2.8, y: 0.6 },
        { x: 2.8, y: 0.6 },
        { x: 2.8, y: 5.2 },
        { x: -2.8, y: 5.2 }
      ]
    },
    {
      id: "communion_rail",
      name: "Alttarikaide (Communion Rail)",
      floorHeight: 0.4,
      ceilingHeight: 3.0,
      color: "#3498db",
      tags: ["communion"],
      polygon: [
        { x: -3.2, y: -0.8 },
        { x: 3.2, y: -0.8 },
        { x: 3.2, y: 0.5 },
        { x: -3.2, y: 0.5 }
      ]
    },
    {
      id: "choir",
      name: "Kuorotila (Choir Area)",
      floorHeight: 0.4,
      ceilingHeight: 8.0,
      color: "#2ecc71",
      tags: ["music", "choir"],
      polygon: [
        { x: 3.2, y: 0.6 },
        { x: 6.5, y: 0.6 },
        { x: 6.5, y: 4.5 },
        { x: 3.2, y: 4.5 }
      ]
    },
    {
      id: "organ_loft",
      name: "Urkuparvi (Organ Gallery)",
      floorHeight: 4.5,
      ceilingHeight: 12.0,
      color: "#1abc9c",
      tags: ["music", "organist"],
      polygon: [
        { x: -6.0, y: -20.0 },
        { x: 6.0, y: -20.0 },
        { x: 6.0, y: -13.5 },
        { x: -6.0, y: -13.5 }
      ]
    },
    {
      id: "nave",
      name: "Kirkkosali (Nave / Pews)",
      floorHeight: 0.0,
      ceilingHeight: 12.0,
      color: "#7f8c8d",
      tags: ["congregation"],
      polygon: [
        { x: -7.0, y: -14.0 },
        { x: 7.0, y: -14.0 },
        { x: 7.0, y: -1.0 },
        { x: -7.0, y: -1.0 }
      ]
    }
  ],
  occluders: [
    {
      id: "pulpit_facade",
      name: "Pulpit Wooden Balustrade & Desk",
      kind: "mesh",
      meshUrl: "models/pulpit-facade.glb",
      position: { x: -3.5, y: 0.5, z: 1.3 },
      rotation: { x: 0, y: 0, z: 0 },
      scale: { x: 1.0, y: 1.0, z: 1.0 },
      dimensions: { width: 1.8, depth: 1.4, height: 1.2 }
    },
    {
      id: "altar_table",
      name: "Alttaripöytä (4-Legged Table)",
      kind: "table",
      position: { x: 0.0, y: 2.5, z: 0.4 },
      dimensions: { width: 3.2, depth: 1.2, height: 0.95 }
    }
  ],
  floors: [
    {
      id: "altar_chancel_dais",
      name: "Alttarikoroke (Chancel Dais +0.40m)",
      elevation: 0.40,
      thickness: 0.40,
      color: "#252e3d",
      polygon: [
        { x: -5.0, y: 0.0 },
        { x: 5.0, y: 0.0 },
        { x: 5.0, y: 5.6 },
        { x: -5.0, y: 5.6 }
      ]
    },
    {
      id: "organ_gallery_floor",
      name: "Urkuparven Lattia (Organ Gallery +4.50m)",
      elevation: 4.50,
      thickness: 0.50,
      color: "#1e293b",
      polygon: [
        { x: -7.5, y: -14.8 },
        { x: 7.5, y: -14.8 },
        { x: 7.5, y: -10.5 },
        { x: -7.5, y: -10.5 }
      ]
    }
  ],
  walls: [
    {
      id: "north_arcade_header",
      name: "North Arcade Wall (Open Bottom Arch)",
      start: { x: -4.8, y: -10.5 },
      end: { x: -4.8, y: 5.5 },
      bottomZ: 3.8,
      topZ: 14.0,
      thickness: 0.45,
      color: "#475569"
    },
    {
      id: "south_arcade_header",
      name: "South Arcade Wall (Open Bottom Arch)",
      start: { x: 4.8, y: -10.5 },
      end: { x: 4.8, y: 5.5 },
      bottomZ: 3.8,
      topZ: 14.0,
      thickness: 0.45,
      color: "#475569"
    },
    {
      id: "chancel_arch_header",
      name: "Chancel Triumphal Arch (Open Bottom)",
      start: { x: -4.8, y: 0.1 },
      end: { x: 4.8, y: 0.1 },
      bottomZ: 5.2,
      topZ: 14.0,
      thickness: 0.5,
      color: "#526071"
    },
    {
      id: "north_side_wall",
      name: "North Side Aisle Wall (Lower Ceiling 4.2m)",
      start: { x: -8.0, y: -14.8 },
      end: { x: -8.0, y: 5.8 },
      bottomZ: 0.0,
      topZ: 4.2,
      thickness: 0.4,
      color: "#334155",
      seeThrough: true
    },
    {
      id: "south_side_wall",
      name: "South Side Aisle Wall (Lower Ceiling 4.2m)",
      start: { x: 8.0, y: -14.8 },
      end: { x: 8.0, y: 5.8 },
      bottomZ: 0.0,
      topZ: 4.2,
      thickness: 0.4,
      color: "#334155",
      seeThrough: true
    },
    {
      id: "east_altar_wall",
      name: "East Altar Wall",
      start: { x: -5.0, y: 5.8 },
      end: { x: 5.0, y: 5.8 },
      bottomZ: 0.0,
      topZ: 14.0,
      thickness: 0.5,
      color: "#334155"
    }
  ]
};

let currentVenue = JSON.parse(JSON.stringify(KESKUSKIRKKO_TEMPLATE));

// State
let currentTool = "select";
let selectedItem = null; // { type: 'zone'|'camera'|'occluder'|'floor'|'wall', ref: object, key?: string }
let currentDraftPolygon = [];
let currentWallStart = null;
let currentMouseWorld = { x: 0, y: 0 };
let draggingVertex = null; // { zone, vertexIndex }
let isPanning = false;
let startPan = { x: 0, y: 0 };

// View Mode: "2d" (CAD Floorplan) or "3d" (WebGL Perspective Orbit)
let viewMode = "2d";
let threeRenderer = null;
let threeScene = null;
let threeCamera = null;
let threeControls = null;
let threeObjectsGroup = null;
let globalGhostWalls = false;
let isMovingObject = false;
let moveStartWorld = { x: 0, y: 0 };
const threeRaycaster = new THREE.Raycaster();
const threeMouse = new THREE.Vector2();

// Viewport Transform: meters -> screen pixels
// World center (0, 0)
let scale = 25; // 25 pixels per meter
let originScreen = { x: 0, y: 0 };

const canvas = document.getElementById("mapCanvas");
const ctx = canvas.getContext("2d");
const viewport3d = document.getElementById("viewport3d");
const view3dControls = document.getElementById("view3dControls");
const btnView2D = document.getElementById("btnView2D");
const btnView3D = document.getElementById("btnView3D");

// Zoom and Pan Controls (+, 1:1, -)
document.getElementById("btnZoomIn")?.addEventListener("click", () => {
  if (viewMode === "2d") {
    scale = Math.min(100, Math.round(scale * 1.25));
    render();
  } else if (threeCamera && threeControls) {
    threeCamera.position.sub(threeControls.target).multiplyScalar(0.8).add(threeControls.target);
  }
});

document.getElementById("btnZoomOut")?.addEventListener("click", () => {
  if (viewMode === "2d") {
    scale = Math.max(5, Math.round(scale * 0.8));
    render();
  } else if (threeCamera && threeControls) {
    threeCamera.position.sub(threeControls.target).multiplyScalar(1.25).add(threeControls.target);
  }
});

document.getElementById("btnZoomReset")?.addEventListener("click", () => {
  if (viewMode === "2d") {
    scale = 25;
    originScreen.x = canvas.width / 2;
    originScreen.y = canvas.height * 0.4;
    render();
  } else if (threeCamera && threeControls) {
    threeCamera.position.set(0, -22, 14);
    threeControls.target.set(0, 2, 1);
  }
});

function resizeCanvas() {
  canvas.width = canvas.parentElement.clientWidth;
  canvas.height = canvas.parentElement.clientHeight;
  if (originScreen.x === 0 && originScreen.y === 0) {
    originScreen.x = canvas.width / 2;
    originScreen.y = canvas.height * 0.4;
  }
  render();
}

window.addEventListener("resize", resizeCanvas);

// Coordinate transforms
function worldToScreen(wx, wy) {
  // In world: +X is right, +Y is forward (up on floorplan)
  return {
    x: originScreen.x + wx * scale,
    y: originScreen.y - wy * scale
  };
}

function screenToWorld(sx, sy) {
  return {
    x: (sx - originScreen.x) / scale,
    y: (originScreen.y - sy) / scale
  };
}

// Rendering
function render() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  drawGrid();
  drawSanctuaryEnvelope();
  drawFloors();
  drawWalls();
  drawZones();
  drawOccluders();
  drawCameras();
  drawDraftPolygon();
  drawDraftWall();
  updateObjectList();
}

function drawGrid() {
  ctx.save();
  ctx.strokeStyle = "#1a1f28";
  ctx.lineWidth = 1;

  const left = screenToWorld(0, canvas.height);
  const right = screenToWorld(canvas.width, 0);

  const startX = Math.floor(left.x);
  const endX = Math.ceil(right.x);
  const startY = Math.floor(left.y);
  const endY = Math.ceil(right.y);

  for (let x = startX; x <= endX; x++) {
    const isMajor = x % 5 === 0;
    ctx.strokeStyle = isMajor ? "#262d3d" : "#161b24";
    const p1 = worldToScreen(x, startY);
    const p2 = worldToScreen(x, endY);
    ctx.beginPath();
    ctx.moveTo(p1.x, p1.y);
    ctx.lineTo(p2.x, p2.y);
    ctx.stroke();
  }

  for (let y = startY; y <= endY; y++) {
    const isMajor = y % 5 === 0;
    ctx.strokeStyle = isMajor ? "#262d3d" : "#161b24";
    const p1 = worldToScreen(startX, y);
    const p2 = worldToScreen(endX, y);
    ctx.beginPath();
    ctx.moveTo(p1.x, p1.y);
    ctx.lineTo(p2.x, p2.y);
    ctx.stroke();
  }

  // World Origin (0, 0) Crosshairs
  const o = worldToScreen(0, 0);
  ctx.strokeStyle = "#e74c3c";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(o.x, o.y, 6, 0, Math.PI * 2);
  ctx.stroke();

  ctx.restore();
}

function drawSanctuaryEnvelope() {
  const w = currentVenue.dimensions.widthMeters;
  const l = currentVenue.dimensions.lengthMeters;

  const halfW = w / 2;
  const pTopLeft = worldToScreen(-halfW, l * 0.3);
  const pBottomRight = worldToScreen(halfW, -l * 0.7);

  ctx.save();
  ctx.strokeStyle = "#3b82f6";
  ctx.lineWidth = 1;
  ctx.setLineDash([4, 4]);
  ctx.strokeRect(pTopLeft.x, pTopLeft.y, pBottomRight.x - pTopLeft.x, pBottomRight.y - pTopLeft.y);
  ctx.restore();
}

function drawFloors() {
  if (!currentVenue.floors) return;

  for (const floor of currentVenue.floors) {
    if (!floor.polygon || floor.polygon.length < 3) continue;

    ctx.save();
    const isSelected = selectedItem?.ref === floor;
    ctx.fillStyle = hexToRgba(floor.color || "#2c3e50", isSelected ? 0.6 : 0.35);
    ctx.strokeStyle = isSelected ? "#ffffff" : "#64748b";
    ctx.lineWidth = isSelected ? 2.5 : 1.5;

    ctx.beginPath();
    const p0 = worldToScreen(floor.polygon[0].x, floor.polygon[0].y);
    ctx.moveTo(p0.x, p0.y);
    for (let i = 1; i < floor.polygon.length; i++) {
      const pi = worldToScreen(floor.polygon[i].x, floor.polygon[i].y);
      ctx.lineTo(pi.x, pi.y);
    }
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Centroid Label
    let cx = 0, cy = 0;
    for (const pt of floor.polygon) { cx += pt.x; cy += pt.y; }
    cx /= floor.polygon.length;
    cy /= floor.polygon.length;
    const centerScreen = worldToScreen(cx, cy);

    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 10px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(`🪜 ${floor.name}`, centerScreen.x, centerScreen.y - 4);
    ctx.fillStyle = "#94a3b8";
    ctx.font = "9px monospace";
    ctx.fillText(`Elev: +${floor.elevation}m (Thick: ${floor.thickness || 0.4}m)`, centerScreen.x, centerScreen.y + 8);

    ctx.restore();
  }
}

function drawWalls() {
  if (!currentVenue.walls) return;

  for (const wall of currentVenue.walls) {
    const isSelected = selectedItem?.ref === wall;
    const isOpen = (wall.bottomZ || 0) > 0;
    const p1 = worldToScreen(wall.start.x, wall.start.y);
    const p2 = worldToScreen(wall.end.x, wall.end.y);

    ctx.save();
    ctx.lineWidth = Math.max(3, (wall.thickness || 0.4) * scale);
    ctx.lineCap = "round";

    if (isOpen) {
      // Open-bottom arch header: dashed architectural representation
      ctx.strokeStyle = isSelected ? "#38bdf8" : "#94a3b8";
      ctx.setLineDash([8, 4]);
    } else {
      ctx.strokeStyle = isSelected ? "#38bdf8" : (wall.color || "#475569");
    }

    ctx.beginPath();
    ctx.moveTo(p1.x, p1.y);
    ctx.lineTo(p2.x, p2.y);
    ctx.stroke();

    // Midpoint label
    const midX = (p1.x + p2.x) / 2;
    const midY = (p1.y + p2.y) / 2;
    ctx.fillStyle = "#ffffff";
    ctx.font = "9px sans-serif";
    ctx.textAlign = "center";
    if (isOpen) {
      ctx.fillText(`⇡ Arch Lintel (${wall.bottomZ}m–${wall.topZ}m)`, midX, midY - 6);
    } else {
      ctx.fillText(`🧱 ${wall.name}`, midX, midY - 6);
    }

    ctx.restore();
  }
}

function drawDraftWall() {
  if (!currentWallStart) return;
  const p1 = worldToScreen(currentWallStart.x, currentWallStart.y);
  const p2 = worldToScreen(currentMouseWorld.x, currentMouseWorld.y);

  ctx.save();
  ctx.strokeStyle = "#38bdf8";
  ctx.lineWidth = 3;
  ctx.setLineDash([6, 6]);
  ctx.beginPath();
  ctx.moveTo(p1.x, p1.y);
  ctx.lineTo(p2.x, p2.y);
  ctx.stroke();

  ctx.fillStyle = "#38bdf8";
  ctx.beginPath();
  ctx.arc(p1.x, p1.y, 4, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawZones() {
  for (const zone of currentVenue.zones) {
    if (!zone.polygon || zone.polygon.length < 3) continue;

    ctx.save();
    const isSelected = selectedItem?.ref === zone;
    ctx.fillStyle = hexToRgba(zone.color || "#3b82f6", isSelected ? 0.45 : 0.25);
    ctx.strokeStyle = isSelected ? "#ffffff" : (zone.color || "#3b82f6");
    ctx.lineWidth = isSelected ? 2.5 : 1.5;

    ctx.beginPath();
    const p0 = worldToScreen(zone.polygon[0].x, zone.polygon[0].y);
    ctx.moveTo(p0.x, p0.y);
    for (let i = 1; i < zone.polygon.length; i++) {
      const pi = worldToScreen(zone.polygon[i].x, zone.polygon[i].y);
      ctx.lineTo(pi.x, pi.y);
    }
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Centroid Label
    let cx = 0, cy = 0;
    for (const pt of zone.polygon) { cx += pt.x; cy += pt.y; }
    cx /= zone.polygon.length;
    cy /= zone.polygon.length;
    const centerScreen = worldToScreen(cx, cy);

    ctx.fillStyle = "#ffffff";
    ctx.font = "11px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(zone.name, centerScreen.x, centerScreen.y);
    ctx.fillStyle = "#94a3b8";
    ctx.font = "9px monospace";
    ctx.fillText(`Z: ${zone.floorHeight}m - ${zone.ceilingHeight}m`, centerScreen.x, centerScreen.y + 12);

    // Draw vertex handles if selected
    if (isSelected) {
      for (let i = 0; i < zone.polygon.length; i++) {
        const vp = worldToScreen(zone.polygon[i].x, zone.polygon[i].y);
        ctx.fillStyle = "#ffffff";
        ctx.beginPath();
        ctx.arc(vp.x, vp.y, 4, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    ctx.restore();
  }
}

function drawOccluders() {
  if (!currentVenue.occluders) return;

  for (const occ of currentVenue.occluders) {
    const p = worldToScreen(occ.position.x, occ.position.y);
    const isSelected = selectedItem?.ref === occ;

    ctx.save();
    ctx.fillStyle = isSelected ? "rgba(239, 68, 68, 0.4)" : "rgba(217, 119, 6, 0.35)";
    ctx.strokeStyle = isSelected ? "#ffffff" : "#f59e0b";
    ctx.lineWidth = isSelected ? 2.5 : 1.5;

    if (occ.kind === "cylinder") {
      const rad = (occ.dimensions?.radius || 0.8) * scale;
      ctx.beginPath();
      ctx.arc(p.x, p.y, rad, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    } else if (occ.kind === "table") {
      const bw = (occ.dimensions?.width || 2.2) * scale;
      const bd = (occ.dimensions?.depth || 1.1) * scale;
      ctx.fillRect(p.x - bw / 2, p.y - bd / 2, bw, bd);
      ctx.strokeRect(p.x - bw / 2, p.y - bd / 2, bw, bd);

      // Draw 4 table legs
      const legSize = Math.max(3, 0.08 * scale);
      const legInsetX = Math.max(legSize, 0.12 * scale);
      const legInsetY = Math.max(legSize, 0.12 * scale);
      ctx.fillStyle = "#ffffff";
      const corners = [
        { x: p.x - bw / 2 + legInsetX, y: p.y - bd / 2 + legInsetY },
        { x: p.x + bw / 2 - legInsetX, y: p.y - bd / 2 + legInsetY },
        { x: p.x - bw / 2 + legInsetX, y: p.y + bd / 2 - legInsetY },
        { x: p.x + bw / 2 - legInsetX, y: p.y + bd / 2 - legInsetY },
      ];
      for (const c of corners) {
        ctx.fillRect(c.x - legSize / 2, c.y - legSize / 2, legSize, legSize);
      }
    } else {
      const bw = (occ.dimensions?.width || 1.6) * scale;
      const bd = (occ.dimensions?.depth || 1.0) * scale;
      ctx.fillRect(p.x - bw / 2, p.y - bd / 2, bw, bd);
      ctx.strokeRect(p.x - bw / 2, p.y - bd / 2, bw, bd);
    }

    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 10px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(`🛡 ${occ.name}`, p.x, p.y - 12);
    ctx.fillStyle = "#fcd34d";
    ctx.font = "9px monospace";
    let badgeText = "[Keymask]";
    if (occ.kind === "table") badgeText = "[4-Leg Table]";
    else if (occ.kind === "mesh") badgeText = "[GLB Holdout]";
    ctx.fillText(badgeText, p.x, p.y + 16);
    ctx.restore();
  }
}

function drawCameras() {
  for (const [camKey, cam] of Object.entries(currentVenue.cameras)) {
    const p = worldToScreen(cam.position.x, cam.position.y);
    const isSelected = selectedItem?.ref === cam;

    ctx.save();
    // Camera Body
    ctx.fillStyle = isSelected ? "#3b82f6" : "#60a5fa";
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = isSelected ? 2 : 1;
    ctx.beginPath();
    ctx.arc(p.x, p.y, 7, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Optical viewing cone (FOV = 67°)
    const panDeg = cam.baseOrientation.pan;
    const hfovDeg = 67;
    const coneDist = 7 * scale;

    const radCenter = ((90 - panDeg) * Math.PI) / 180;
    const radLeft = radCenter - (hfovDeg / 2 * Math.PI) / 180;
    const radRight = radCenter + (hfovDeg / 2 * Math.PI) / 180;

    ctx.fillStyle = "rgba(96, 165, 250, 0.15)";
    ctx.strokeStyle = "rgba(96, 165, 250, 0.5)";
    ctx.beginPath();
    ctx.moveTo(p.x, p.y);
    ctx.lineTo(p.x + Math.cos(radLeft) * coneDist, p.y - Math.sin(radLeft) * coneDist);
    ctx.arc(p.x, p.y, coneDist, -radLeft, -radRight, true);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Camera Label
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 11px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(`📷 ${cam.name}`, p.x, p.y + 18);
    ctx.restore();
  }
}

function drawDraftPolygon() {
  if (currentDraftPolygon.length === 0) return;

  ctx.save();
  ctx.strokeStyle = "#38bdf8";
  ctx.lineWidth = 2;
  ctx.setLineDash([4, 4]);

  ctx.beginPath();
  const p0 = worldToScreen(currentDraftPolygon[0].x, currentDraftPolygon[0].y);
  ctx.moveTo(p0.x, p0.y);
  for (let i = 1; i < currentDraftPolygon.length; i++) {
    const pi = worldToScreen(currentDraftPolygon[i].x, currentDraftPolygon[i].y);
    ctx.lineTo(pi.x, pi.y);
  }
  ctx.stroke();

  for (const pt of currentDraftPolygon) {
    const sp = worldToScreen(pt.x, pt.y);
    ctx.fillStyle = "#38bdf8";
    ctx.beginPath();
    ctx.arc(sp.x, sp.y, 4, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function hexToRgba(hex, alpha) {
  let c = hex.replace("#", "");
  if (c.length === 3) c = c.split("").map((x) => x + x).join("");
  const num = parseInt(c, 16);
  return `rgba(${(num >> 16) & 255}, ${(num >> 8) & 255}, ${num & 255}, ${alpha})`;
}

function distToSegment(p, v, w) {
  const l2 = (v.x - w.x) ** 2 + (v.y - w.y) ** 2;
  if (l2 === 0) return Math.hypot(p.x - v.x, p.y - v.y);
  let t = ((p.x - v.x) * (w.x - v.x) + (p.y - v.y) * (w.y - v.y)) / l2;
  t = Math.max(0, Math.min(1, t));
  return Math.hypot(p.x - (v.x + t * (w.x - v.x)), p.y - (v.y + t * (w.y - v.y)));
}

function findItemAt(sx, sy, w) {
  // 1. Cameras
  for (const [k, cam] of Object.entries(currentVenue.cameras || {})) {
    const cp = worldToScreen(cam.position.x, cam.position.y);
    if (Math.hypot(cp.x - sx, cp.y - sy) < 14) return { type: "camera", ref: cam, key: k };
  }
  // 2. Occluders
  for (const occ of currentVenue.occluders || []) {
    const op = worldToScreen(occ.position.x, occ.position.y);
    if (Math.hypot(op.x - sx, op.y - sy) < 16) return { type: "occluder", ref: occ };
    if ((occ.kind === "box" || occ.kind === "table") && occ.dimensions) {
      const bw = occ.dimensions.width;
      const bd = occ.dimensions.depth;
      if (Math.abs(w.x - occ.position.x) <= bw / 2 && Math.abs(w.y - occ.position.y) <= bd / 2) {
        return { type: "occluder", ref: occ };
      }
    }
  }
  // 3. Walls
  for (const wall of currentVenue.walls || []) {
    const p1 = worldToScreen(wall.start.x, wall.start.y);
    const p2 = worldToScreen(wall.end.x, wall.end.y);
    if (distToSegment({ x: sx, y: sy }, p1, p2) < 12) return { type: "wall", ref: wall };
  }
  // 4. Zones
  for (const z of currentVenue.zones || []) {
    if (pointInPoly(w, z.polygon)) return { type: "zone", ref: z };
  }
  // 5. Floors
  for (const f of currentVenue.floors || []) {
    if (pointInPoly(w, f.polygon)) return { type: "floor", ref: f };
  }
  return null;
}

// Interaction
canvas.addEventListener("mousemove", (e) => {
  const rect = canvas.getBoundingClientRect();
  const sx = e.clientX - rect.left;
  const sy = e.clientY - rect.top;
  const w = screenToWorld(sx, sy);
  currentMouseWorld = w;

  document.getElementById("coordsDisplay").innerText = `X: ${w.x.toFixed(2)} m, Y: ${w.y.toFixed(2)} m`;

  if (isPanning) {
    originScreen.x += sx - startPan.x;
    originScreen.y += sy - startPan.y;
    startPan = { x: sx, y: sy };
    render();
    return;
  }

  if (isMovingObject && selectedItem) {
    const dx = w.x - moveStartWorld.x;
    const dy = w.y - moveStartWorld.y;
    moveStartWorld = { x: w.x, y: w.y };

    if (selectedItem.type === "camera" || selectedItem.type === "occluder") {
      selectedItem.ref.position.x += dx;
      selectedItem.ref.position.y += dy;
    } else if (selectedItem.type === "zone" || selectedItem.type === "floor") {
      for (const pt of selectedItem.ref.polygon) {
        pt.x += dx;
        pt.y += dy;
      }
    } else if (selectedItem.type === "wall") {
      selectedItem.ref.start.x += dx;
      selectedItem.ref.start.y += dy;
      selectedItem.ref.end.x += dx;
      selectedItem.ref.end.y += dy;
    }
    render();
    if (viewMode === "3d") update3DScene();
    return;
  }

  if (draggingVertex) {
    draggingVertex.zone.polygon[draggingVertex.vertexIndex].x = Math.round(w.x * 10) / 10;
    draggingVertex.zone.polygon[draggingVertex.vertexIndex].y = Math.round(w.y * 10) / 10;
    render();
    return;
  }

  if (currentWallStart) {
    render();
  }
});

canvas.addEventListener("mousedown", (e) => {
  const rect = canvas.getBoundingClientRect();
  const sx = e.clientX - rect.left;
  const sy = e.clientY - rect.top;
  const w = screenToWorld(sx, sy);

  if (e.button === 1 || e.shiftKey) {
    isPanning = true;
    startPan = { x: sx, y: sy };
    return;
  }

  if (currentTool === "move") {
    const item = findItemAt(sx, sy, w) || selectedItem;
    if (item) {
      selectItem(item);
      isMovingObject = true;
      moveStartWorld = { x: w.x, y: w.y };
      canvas.style.cursor = "grabbing";
    }
    return;
  }

  if (currentTool === "select") {
    // 1. Check if clicked vertex handle
    if (selectedItem?.type === "zone" || selectedItem?.type === "floor") {
      for (let i = 0; i < selectedItem.ref.polygon.length; i++) {
        const vp = worldToScreen(selectedItem.ref.polygon[i].x, selectedItem.ref.polygon[i].y);
        if (Math.hypot(vp.x - sx, vp.y - sy) < 8) {
          draggingVertex = { zone: selectedItem.ref, vertexIndex: i };
          return;
        }
      }
    }

    const item = findItemAt(sx, sy, w);
    selectItem(item);
    render();
  } else if (currentTool === "add-zone") {
    currentDraftPolygon.push({ x: Math.round(w.x * 10) / 10, y: Math.round(w.y * 10) / 10 });
    render();
  } else if (currentTool === "add-floor") {
    currentDraftPolygon.push({ x: Math.round(w.x * 10) / 10, y: Math.round(w.y * 10) / 10 });
    render();
  } else if (currentTool === "add-wall") {
    const pt = { x: Math.round(w.x * 10) / 10, y: Math.round(w.y * 10) / 10 };
    if (!currentWallStart) {
      currentWallStart = pt;
      render();
    } else {
      currentVenue.walls = currentVenue.walls || [];
      const wallId = `wall_${Date.now().toString().slice(-4)}`;
      const newWall = {
        id: wallId,
        name: `Wall Segment`,
        start: { x: currentWallStart.x, y: currentWallStart.y },
        end: pt,
        bottomZ: 0.0,
        topZ: currentVenue.dimensions?.heightMeters || 14.0,
        thickness: 0.45,
        color: "#475569"
      };
      currentVenue.walls.push(newWall);
      currentWallStart = null;
      setTool("select");
      selectItem({ type: "wall", ref: newWall });
      render();
      if (viewMode === "3d") update3DScene();
    }
  } else if (currentTool === "add-camera") {
    const camId = `cam${Object.keys(currentVenue.cameras || {}).length + 1}`;
    currentVenue.cameras = currentVenue.cameras || {};
    currentVenue.cameras[camId] = {
      id: camId,
      name: `Camera ${Object.keys(currentVenue.cameras).length + 1}`,
      position: { x: Math.round(w.x * 10) / 10, y: Math.round(w.y * 10) / 10, z: 3.5 },
      baseOrientation: { pan: 0, tilt: -10, roll: 0 }
    };
    setTool("select");
    selectItem({ type: "camera", ref: currentVenue.cameras[camId], key: camId });
    render();
    if (viewMode === "3d") update3DScene();
  } else if (currentTool === "add-occluder") {
    currentVenue.occluders = currentVenue.occluders || [];
    const occId = `occ_${Date.now().toString().slice(-4)}`;
    const newOcc = {
      id: occId,
      name: `Occluder ${currentVenue.occluders.length + 1}`,
      kind: "box",
      position: { x: Math.round(w.x * 10) / 10, y: Math.round(w.y * 10) / 10, z: 0.0 },
      dimensions: { width: 1.6, depth: 1.0, height: 1.2 }
    };
    currentVenue.occluders.push(newOcc);
    setTool("select");
    selectItem({ type: "occluder", ref: newOcc });
    render();
    if (viewMode === "3d") update3DScene();
  }
});

canvas.addEventListener("dblclick", () => {
  if (currentTool === "add-zone" && currentDraftPolygon.length >= 3) {
    const newZone = {
      id: `zone_${Date.now().toString().slice(-4)}`,
      name: `New Zone`,
      floorHeight: 0.4,
      ceilingHeight: 4.0,
      color: "#3b82f6",
      tags: [],
      polygon: [...currentDraftPolygon]
    };
    currentVenue.zones.push(newZone);
    currentDraftPolygon = [];
    setTool("select");
    selectItem({ type: "zone", ref: newZone });
    render();
    if (viewMode === "3d") update3DScene();
  } else if (currentTool === "add-floor" && currentDraftPolygon.length >= 3) {
    currentVenue.floors = currentVenue.floors || [];
    const newFloor = {
      id: `floor_${Date.now().toString().slice(-4)}`,
      name: `Raised Platform (+0.40m)`,
      elevation: 0.40,
      thickness: 0.40,
      color: "#2c3e50",
      polygon: [...currentDraftPolygon]
    };
    currentVenue.floors.push(newFloor);
    currentDraftPolygon = [];
    setTool("select");
    selectItem({ type: "floor", ref: newFloor });
    render();
    if (viewMode === "3d") update3DScene();
  }
});

window.addEventListener("mouseup", () => {
  isPanning = false;
  draggingVertex = null;
});

canvas.addEventListener("wheel", (e) => {
  e.preventDefault();
  const zoomFactor = e.deltaY < 0 ? 1.1 : 0.9;
  scale = Math.max(5, Math.min(100, scale * zoomFactor));
  render();
});

function pointInPoly(p, poly) {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const pi = poly[i], pj = poly[j];
    const intersect = (pi.y > p.y) !== (pj.y > p.y) && p.x < ((pj.x - pi.x) * (p.y - pi.y)) / (pj.y - pi.y) + pi.x;
    if (intersect) inside = !inside;
  }
  return inside;
}

// Tool Switching
document.querySelectorAll(".tool-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    setTool(btn.getAttribute("data-tool"));
  });
});

function setTool(tool) {
  currentTool = tool;
  if (tool !== "add-wall") currentWallStart = null;
  if (tool !== "add-zone" && tool !== "add-floor") currentDraftPolygon = [];
  document.querySelectorAll(".tool-btn").forEach((b) => b.classList.toggle("active", b.getAttribute("data-tool") === tool));
  document.getElementById("modeDisplay").innerText = `Mode: ${tool.toUpperCase()}`;
  render();
}

// Selection & Inspector Binding
function selectItem(item) {
  selectedItem = item;
  const editor = document.getElementById("itemEditor");
  const emptyHint = document.querySelector(".empty-hint");

  if (!item) {
    editor.style.display = "none";
    emptyHint.style.display = "block";
    updateObjectList();
    if (viewMode === "3d") update3DScene();
    return;
  }

  editor.style.display = "block";
  emptyHint.style.display = "none";

  document.getElementById("zoneFields").style.display = item.type === "zone" ? "block" : "none";
  document.getElementById("cameraFields").style.display = item.type === "camera" ? "block" : "none";
  document.getElementById("floorFields").style.display = item.type === "floor" ? "block" : "none";
  document.getElementById("wallFields").style.display = item.type === "wall" ? "block" : "none";
  document.getElementById("occluderFields").style.display = item.type === "occluder" ? "block" : "none";

  document.getElementById("itemId").value = item.ref.id || "";
  document.getElementById("itemName").value = item.ref.name || "";

  if (item.type === "zone") {
    document.getElementById("zoneFloor").value = item.ref.floorHeight ?? 0;
    document.getElementById("zoneCeiling").value = item.ref.ceilingHeight ?? 3.5;
    document.getElementById("zoneColor").value = item.ref.color || "#3b82f6";
    document.getElementById("zoneTags").value = (item.ref.tags || []).join(", ");
  } else if (item.type === "camera") {
    document.getElementById("camHeight").value = item.ref.position?.z ?? 3.5;
    document.getElementById("camPan").value = item.ref.baseOrientation?.pan ?? 0;
    document.getElementById("camTilt").value = item.ref.baseOrientation?.tilt ?? -10;
  } else if (item.type === "floor") {
    document.getElementById("floorElevation").value = item.ref.elevation ?? 0.4;
    document.getElementById("floorThickness").value = item.ref.thickness ?? 0.4;
    document.getElementById("floorColor").value = item.ref.color || "#2c3e50";
  } else if (item.type === "wall") {
    document.getElementById("wallBottomZ").value = item.ref.bottomZ ?? 0.0;
    document.getElementById("wallTopZ").value = item.ref.topZ ?? 14.0;
    document.getElementById("wallThickness").value = item.ref.thickness ?? 0.45;
    document.getElementById("wallColor").value = item.ref.color || "#475569";
    const stBox = document.getElementById("wallSeeThrough");
    if (stBox) stBox.checked = !!item.ref.seeThrough;
  } else if (item.type === "occluder") {
    document.getElementById("occKind").value = item.ref.kind || "box";
    document.getElementById("occMeshUrl").value = item.ref.meshUrl || "";
    document.getElementById("occWidth").value = item.ref.dimensions?.width ?? 1.5;
    document.getElementById("occDepth").value = item.ref.dimensions?.depth ?? 1.0;
    document.getElementById("occHeight").value = item.ref.dimensions?.height ?? 1.2;
    document.getElementById("occBaseZ").value = item.ref.position?.z ?? 0.0;
  }

  updateObjectList();
  if (viewMode === "3d") update3DScene();
}

// Scene Hierarchy Outliner List
function updateObjectList() {
  const container = document.getElementById("sceneObjectList");
  if (!container) return;
  container.innerHTML = "";

  let totalCount = 0;

  function addCategory(title, items, type, getLabel, getBadge) {
    if (!items || items.length === 0) return;
    const catTitle = document.createElement("div");
    catTitle.className = "obj-category-title";
    catTitle.innerText = `${title} (${items.length})`;
    container.appendChild(catTitle);

    for (const it of items) {
      totalCount++;
      const row = document.createElement("div");
      row.className = "obj-item";
      const isSelected = selectedItem?.ref === it || (type === "camera" && selectedItem?.key === it._key);
      if (isSelected) row.classList.add("active");

      const left = document.createElement("div");
      left.className = "obj-item-left";
      left.innerText = getLabel(it);

      const badge = document.createElement("span");
      badge.className = "obj-badge";
      badge.innerText = getBadge(it);

      row.appendChild(left);
      row.appendChild(badge);

      row.addEventListener("click", () => {
        if (type === "camera") {
          selectItem({ type: "camera", ref: it, key: it._key });
        } else {
          selectItem({ type, ref: it });
        }
        render();
        if (viewMode === "3d") update3DScene();
      });

      container.appendChild(row);
    }
  }

  // Cameras
  const cams = Object.entries(currentVenue.cameras || {}).map(([k, c]) => ({ ...c, _key: k }));
  addCategory("📷 Cameras", cams, "camera", (c) => c.name || c.id, (c) => `Z: ${c.position.z}m`);

  // Zones
  addCategory("⬡ Zones", currentVenue.zones || [], "zone", (z) => z.name || z.id, (z) => `+${z.floorHeight}m to ${z.ceilingHeight}m`);

  // Floors / Raised Platforms
  addCategory("🪜 Floors & Dais", currentVenue.floors || [], "floor", (f) => f.name || f.id, (f) => `Elev: +${f.elevation}m`);

  // Walls & Open Arches
  addCategory("🧱 Walls & Arches", currentVenue.walls || [], "wall", (w) => w.name || w.id, (w) => {
    return w.bottomZ > 0 ? `Open: ${w.bottomZ}m–${w.topZ}m` : `Wall: 0–${w.topZ}m`;
  });

  // Occluders
  addCategory("🛡 Occluders (Keymasks)", currentVenue.occluders || [], "occluder", (o) => o.name || o.id, (o) => o.kind.toUpperCase());

  const countBadge = document.getElementById("objectCountBadge");
  if (countBadge) countBadge.innerText = totalCount.toString();
}

// Form Field Updaters
document.getElementById("itemId").addEventListener("input", (e) => {
  if (selectedItem) {
    selectedItem.ref.id = e.target.value;
    updateObjectList();
    if (viewMode === "3d") update3DScene();
  }
});
document.getElementById("itemName").addEventListener("input", (e) => {
  if (selectedItem) {
    selectedItem.ref.name = e.target.value;
    render();
    updateObjectList();
    if (viewMode === "3d") update3DScene();
  }
});
document.getElementById("zoneFloor").addEventListener("input", (e) => {
  if (selectedItem?.type === "zone") {
    selectedItem.ref.floorHeight = Number(e.target.value);
    render();
    updateObjectList();
    if (viewMode === "3d") update3DScene();
  }
});
document.getElementById("zoneCeiling").addEventListener("input", (e) => {
  if (selectedItem?.type === "zone") {
    selectedItem.ref.ceilingHeight = Number(e.target.value);
    render();
    updateObjectList();
    if (viewMode === "3d") update3DScene();
  }
});
document.getElementById("zoneColor").addEventListener("input", (e) => {
  if (selectedItem?.type === "zone") {
    selectedItem.ref.color = e.target.value;
    render();
    if (viewMode === "3d") update3DScene();
  }
});
document.getElementById("floorElevation").addEventListener("input", (e) => {
  if (selectedItem?.type === "floor") {
    selectedItem.ref.elevation = Number(e.target.value);
    render();
    updateObjectList();
    if (viewMode === "3d") update3DScene();
  }
});
document.getElementById("floorThickness").addEventListener("input", (e) => {
  if (selectedItem?.type === "floor") {
    selectedItem.ref.thickness = Number(e.target.value);
    render();
    if (viewMode === "3d") update3DScene();
  }
});
document.getElementById("floorColor").addEventListener("input", (e) => {
  if (selectedItem?.type === "floor") {
    selectedItem.ref.color = e.target.value;
    render();
    if (viewMode === "3d") update3DScene();
  }
});
document.getElementById("wallBottomZ").addEventListener("input", (e) => {
  if (selectedItem?.type === "wall") {
    selectedItem.ref.bottomZ = Number(e.target.value);
    render();
    updateObjectList();
    if (viewMode === "3d") update3DScene();
  }
});
document.getElementById("wallTopZ").addEventListener("input", (e) => {
  if (selectedItem?.type === "wall") {
    selectedItem.ref.topZ = Number(e.target.value);
    render();
    updateObjectList();
    if (viewMode === "3d") update3DScene();
  }
});
document.getElementById("wallThickness").addEventListener("input", (e) => {
  if (selectedItem?.type === "wall") {
    selectedItem.ref.thickness = Number(e.target.value);
    render();
    if (viewMode === "3d") update3DScene();
  }
});
document.getElementById("wallColor").addEventListener("input", (e) => {
  if (selectedItem?.type === "wall") {
    selectedItem.ref.color = e.target.value;
    render();
    if (viewMode === "3d") update3DScene();
  }
});
document.getElementById("wallSeeThrough")?.addEventListener("change", (e) => {
  if (selectedItem?.type === "wall") {
    selectedItem.ref.seeThrough = e.target.checked;
    render();
    if (viewMode === "3d") update3DScene();
  }
});
document.getElementById("camPan").addEventListener("input", (e) => {
  if (selectedItem?.type === "camera") {
    selectedItem.ref.baseOrientation.pan = Number(e.target.value);
    render();
    if (viewMode === "3d") update3DScene();
  }
});
document.getElementById("camTilt").addEventListener("input", (e) => {
  if (selectedItem?.type === "camera") {
    selectedItem.ref.baseOrientation.tilt = Number(e.target.value);
    render();
    if (viewMode === "3d") update3DScene();
  }
});
document.getElementById("camHeight").addEventListener("input", (e) => {
  if (selectedItem?.type === "camera") {
    selectedItem.ref.position.z = Number(e.target.value);
    render();
    updateObjectList();
    if (viewMode === "3d") update3DScene();
  }
});
document.getElementById("occKind").addEventListener("change", (e) => {
  if (selectedItem?.type === "occluder") {
    selectedItem.ref.kind = e.target.value;
    render();
    updateObjectList();
    if (viewMode === "3d") update3DScene();
  }
});
document.getElementById("occMeshUrl").addEventListener("input", (e) => {
  if (selectedItem?.type === "occluder") {
    selectedItem.ref.meshUrl = e.target.value;
  }
});
document.getElementById("occWidth").addEventListener("input", (e) => {
  if (selectedItem?.type === "occluder") {
    selectedItem.ref.dimensions = selectedItem.ref.dimensions || {};
    selectedItem.ref.dimensions.width = Number(e.target.value);
    render();
    if (viewMode === "3d") update3DScene();
  }
});
document.getElementById("occDepth").addEventListener("input", (e) => {
  if (selectedItem?.type === "occluder") {
    selectedItem.ref.dimensions = selectedItem.ref.dimensions || {};
    selectedItem.ref.dimensions.depth = Number(e.target.value);
    render();
    if (viewMode === "3d") update3DScene();
  }
});
document.getElementById("occHeight").addEventListener("input", (e) => {
  if (selectedItem?.type === "occluder") {
    selectedItem.ref.dimensions = selectedItem.ref.dimensions || {};
    selectedItem.ref.dimensions.height = Number(e.target.value);
    render();
    if (viewMode === "3d") update3DScene();
  }
});
document.getElementById("occBaseZ").addEventListener("input", (e) => {
  if (selectedItem?.type === "occluder") {
    selectedItem.ref.position = selectedItem.ref.position || { x: 0, y: 0, z: 0 };
    selectedItem.ref.position.z = Number(e.target.value);
    render();
    if (viewMode === "3d") update3DScene();
  }
});

// Delete Item
document.getElementById("btnDeleteItem").addEventListener("click", () => {
  if (!selectedItem) return;
  if (selectedItem.type === "zone") {
    currentVenue.zones = (currentVenue.zones || []).filter((z) => z !== selectedItem.ref);
  } else if (selectedItem.type === "camera") {
    delete currentVenue.cameras[selectedItem.key];
  } else if (selectedItem.type === "occluder") {
    currentVenue.occluders = (currentVenue.occluders || []).filter((o) => o !== selectedItem.ref);
  } else if (selectedItem.type === "floor") {
    currentVenue.floors = (currentVenue.floors || []).filter((f) => f !== selectedItem.ref);
  } else if (selectedItem.type === "wall") {
    currentVenue.walls = (currentVenue.walls || []).filter((w) => w !== selectedItem.ref);
  }
  selectItem(null);
  render();
  if (viewMode === "3d") update3DScene();
});

// Export JSON
document.getElementById("btnExport").addEventListener("click", () => {
  const json = JSON.stringify(currentVenue, null, 2);
  const blob = new Blob([json], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${currentVenue.name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-venue.json`;
  a.click();
  URL.revokeObjectURL(url);
});

// Collapsible Venue Properties Section
const venuePropsHeader = document.getElementById("venuePropsHeader");
const venuePropsBody = document.getElementById("venuePropsBody");
const venuePropsToggleIcon = document.getElementById("venuePropsToggleIcon");

venuePropsHeader?.addEventListener("click", () => {
  const isCollapsed = venuePropsBody?.classList.toggle("collapsed");
  if (venuePropsToggleIcon) {
    venuePropsToggleIcon.innerText = isCollapsed ? "▶" : "▼";
  }
});

// Template loading
document.getElementById("templateSelect")?.addEventListener("change", async (e) => {
  const val = e.target.value;
  if (!val) return;
  if (val === "keskuskirkko") {
    currentVenue = JSON.parse(JSON.stringify(KESKUSKIRKKO_TEMPLATE));
  } else if (val === "standard-hall") {
    try {
      const res = await fetch("/api/templates/standard-hall");
      if (res.ok) currentVenue = await res.json();
    } catch {
      // fallback
    }
  }
  selectItem(null);
  render();
  if (viewMode === "3d") update3DScene();
});

// Load JSON File
const fileInput = document.getElementById("fileInput");
document.getElementById("btnLoadFile")?.addEventListener("click", () => fileInput?.click());
fileInput?.addEventListener("change", (e) => {
  const file = e.target.files?.[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (event) => {
    try {
      const parsed = JSON.parse(event.target.result);
      currentVenue = parsed;
      selectItem(null);
      render();
      if (viewMode === "3d") update3DScene();
    } catch (err) {
      alert(`Invalid JSON file: ${err.message}`);
    }
  };
  reader.readAsText(file);
});

// Validate Button
document.getElementById("btnValidate")?.addEventListener("click", async () => {
  try {
    const res = await fetch("/api/validate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(currentVenue)
    });
    const result = await res.json();
    const statusBadge = document.getElementById("validationStatus");
    const issuesList = document.getElementById("validationIssuesList");
    issuesList.innerHTML = "";
    if (result.valid) {
      statusBadge.className = "status-badge ok";
      statusBadge.innerText = "Model Valid (No issues)";
    } else {
      statusBadge.className = "status-badge error";
      statusBadge.innerText = `Invalid (${result.errors.length} errors)`;
      for (const err of result.errors) {
        const li = document.createElement("li");
        li.innerText = `• ${err}`;
        issuesList.appendChild(li);
      }
    }
  } catch (err) {
    alert(`Validation check failed: ${err.message}`);
  }
});

// Push to PiSpace
document.getElementById("btnPushPiSpace").addEventListener("click", async () => {
  try {
    const res = await fetch("http://127.0.0.1:3108/api/v1/venue", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(currentVenue)
    });
    if (res.ok) {
      alert("Successfully pushed venue model to PiSpace!");
    } else {
      alert(`PiSpace rejected venue model: HTTP ${res.status}`);
    }
  } catch (err) {
    alert(`Failed to reach PiSpace on port 3108: ${err.message}`);
  }
});

// ==========================================
// 3D WebGL Perspective Orbit Implementation
// ==========================================

function init3D() {
  if (threeRenderer) return;

  const width = viewport3d.clientWidth || 800;
  const height = viewport3d.clientHeight || 600;

  threeScene = new THREE.Scene();
  threeScene.background = new THREE.Color(0x121418);

  threeCamera = new THREE.PerspectiveCamera(45, width / height, 0.1, 500);
  threeCamera.up.set(0, 0, 1); // +Z is UP in Church Space
  threeCamera.position.set(0, -22, 14);

  threeRenderer = new THREE.WebGLRenderer({ antialias: true });
  threeRenderer.setSize(width, height);
  threeRenderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  viewport3d.appendChild(threeRenderer.domElement);

  threeControls = new OrbitControls(threeCamera, threeRenderer.domElement);
  threeControls.target.set(0, 2, 1);
  threeControls.enableDamping = true;
  threeControls.dampingFactor = 0.05;
  threeControls.maxDistance = 150;
  threeControls.minDistance = 2;

  // Lighting
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
  threeScene.add(ambientLight);

  const mainLight = new THREE.DirectionalLight(0xffffff, 1.2);
  mainLight.position.set(12, 18, 25);
  threeScene.add(mainLight);

  const fillLight = new THREE.DirectionalLight(0x7090b0, 0.5);
  fillLight.position.set(-12, -18, 12);
  threeScene.add(fillLight);

  threeObjectsGroup = new THREE.Group();
  threeScene.add(threeObjectsGroup);

  // Raycasting for 3D Click Selection
  viewport3d.addEventListener("click", (e) => {
    const rect = viewport3d.getBoundingClientRect();
    threeMouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    threeMouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
    threeRaycaster.setFromCamera(threeMouse, threeCamera);

    const intersects = threeRaycaster.intersectObjects(threeObjectsGroup.children, true);
    const itemHits = [];
    for (const hit of intersects) {
      let curr = hit.object;
      while (curr && !curr.userData?.item) curr = curr.parent;
      if (curr?.userData?.item && !itemHits.some((h) => h.item.ref === curr.userData.item.ref)) {
        itemHits.push({ item: curr.userData.item, distance: hit.distance });
      }
    }

    if (itemHits.length > 0) {
      // Prioritize smaller objects like cameras, occluders, and walls over giant enclosing zone/floor volumes!
      const prio = { camera: 1, occluder: 2, wall: 3, zone: 4, floor: 5 };
      itemHits.sort((a, b) => {
        const pa = prio[a.item.type] || 99;
        const pb = prio[b.item.type] || 99;
        if (pa !== pb) return pa - pb;
        return a.distance - b.distance;
      });
      selectItem(itemHits[0].item);
      render();
      update3DScene();
    }
  });

  animate3D();
}

function onResize3D() {
  if (!threeRenderer || !threeCamera) return;
  const width = viewport3d.clientWidth || 800;
  const height = viewport3d.clientHeight || 600;
  threeCamera.aspect = width / height;
  threeCamera.updateProjectionMatrix();
  threeRenderer.setSize(width, height);
}

function animate3D() {
  requestAnimationFrame(animate3D);
  if (viewMode === "3d" && threeControls && threeRenderer && threeScene && threeCamera) {
    threeControls.update();
    threeRenderer.render(threeScene, threeCamera);
  }
}

function createHumanAvatar() {
  const avatarGroup = new THREE.Group();
  const mat = new THREE.MeshStandardMaterial({ color: 0xecf0f1, roughness: 0.6 });

  // Torso / body (1.35m)
  const bodyGeo = new THREE.CylinderGeometry(0.18, 0.18, 1.35, 12);
  bodyGeo.rotateX(Math.PI / 2);
  const bodyMesh = new THREE.Mesh(bodyGeo, mat);
  bodyMesh.position.set(0, 0, 0.675);
  avatarGroup.add(bodyMesh);

  // Head (0.24m diameter)
  const headGeo = new THREE.SphereGeometry(0.12, 12, 12);
  const headMesh = new THREE.Mesh(headGeo, mat);
  headMesh.position.set(0, 0, 1.55);
  avatarGroup.add(headMesh);

  return avatarGroup;
}

function update3DScene() {
  if (!threeObjectsGroup) return;

  // Clear previous meshes
  while (threeObjectsGroup.children.length > 0) {
    const obj = threeObjectsGroup.children[0];
    threeObjectsGroup.remove(obj);
    if (obj.geometry) obj.geometry.dispose();
  }

  const dims = currentVenue.dimensions || { widthMeters: 16, lengthMeters: 30, heightMeters: 14 };

  // 1. Nave Floor Plane & Grid
  const gridHelper = new THREE.GridHelper(Math.max(dims.widthMeters, dims.lengthMeters) + 4, 34, 0x3b82f6, 0x222938);
  gridHelper.rotation.x = Math.PI / 2; // Flat on XY plane
  threeObjectsGroup.add(gridHelper);

  // Sanctuary Origin Ring (0, 0, 0)
  const ringGeo = new THREE.TorusGeometry(0.35, 0.04, 16, 32);
  const ringMat = new THREE.MeshStandardMaterial({ color: 0xf1c40f, roughness: 0.3, metalness: 0.8 });
  const ringMesh = new THREE.Mesh(ringGeo, ringMat);
  ringMesh.position.set(0, 0, 0.02);
  threeObjectsGroup.add(ringMesh);

  // Axis Indicators (+X Red = South, +Y Blue = Altar, +Z Green = Up)
  const axes = new THREE.AxesHelper(3.0);
  axes.position.set(0, 0, 0.02);
  threeObjectsGroup.add(axes);

  // 2. Floors & Dais Platforms (Elevated surfaces)
  if (currentVenue.floors) {
    for (const floor of currentVenue.floors) {
      if (!floor.polygon || floor.polygon.length < 3) continue;

      const shape = new THREE.Shape();
      shape.moveTo(floor.polygon[0].x, floor.polygon[0].y);
      for (let i = 1; i < floor.polygon.length; i++) {
        shape.lineTo(floor.polygon[i].x, floor.polygon[i].y);
      }
      shape.closePath();

      const elev = floor.elevation ?? 0.4;
      const thick = floor.thickness ?? 0.4;
      const extrudeGeo = new THREE.ExtrudeGeometry(shape, { depth: thick, bevelEnabled: false });

      const isSelected = selectedItem?.ref === floor;
      const floorMat = new THREE.MeshStandardMaterial({
        color: floor.color ? parseInt(floor.color.replace("#", "0x")) : 0x2c3e50,
        roughness: 0.8,
        metalness: 0.1
      });

      const floorMesh = new THREE.Mesh(extrudeGeo, floorMat);
      floorMesh.position.set(0, 0, elev - thick);
      floorMesh.userData = { item: { type: "floor", ref: floor } };

      const wireGeo = new THREE.EdgesGeometry(extrudeGeo);
      const wireMat = new THREE.LineBasicMaterial({
        color: isSelected ? 0x38bdf8 : 0x64748b,
        linewidth: isSelected ? 2 : 1
      });
      floorMesh.add(new THREE.LineSegments(wireGeo, wireMat));

      threeObjectsGroup.add(floorMesh);
    }
  }

  // 3. Walls & Open Arches (Partitions & Open clearance archways)
  if (currentVenue.walls) {
    for (const wall of currentVenue.walls) {
      const isSelected = selectedItem?.ref === wall;
      const dx = wall.end.x - wall.start.x;
      const dy = wall.end.y - wall.start.y;
      const len = Math.hypot(dx, dy);
      if (len < 0.05) continue;
      const angle = Math.atan2(dy, dx);

      const bZ = wall.bottomZ ?? 0.0;
      const tZ = wall.topZ ?? 14.0;
      const h = Math.max(0.1, tZ - bZ);
      const thick = wall.thickness ?? 0.45;

      const boxGeo = new THREE.BoxGeometry(len, thick, h);
      const isOpen = bZ > 0;
      const isSeeThrough = wall.seeThrough || globalGhostWalls;
      const wallMat = new THREE.MeshStandardMaterial({
        color: isSeeThrough ? 0x93c5fd : (isOpen ? 0x64748b : 0x334155),
        transparent: isSeeThrough || isOpen,
        opacity: isSeeThrough ? 0.22 : (isOpen ? 0.85 : 0.95),
        roughness: 0.7,
        depthWrite: !isSeeThrough
      });

      const wallMesh = new THREE.Mesh(boxGeo, wallMat);
      wallMesh.rotation.z = angle;
      wallMesh.position.set(
        (wall.start.x + wall.end.x) / 2,
        (wall.start.y + wall.end.y) / 2,
        bZ + h / 2
      );
      wallMesh.userData = { item: { type: "wall", ref: wall } };

      const wireGeo = new THREE.EdgesGeometry(boxGeo);
      const wireMat = new THREE.LineBasicMaterial({
        color: isSelected ? 0x38bdf8 : (isSeeThrough ? 0x93c5fd : (isOpen ? 0x94a3b8 : 0x1e293b)),
        linewidth: isSelected ? 2 : 1
      });
      wallMesh.add(new THREE.LineSegments(wireGeo, wireMat));

      threeObjectsGroup.add(wallMesh);
    }
  }

  // 4. Extruded 3D Zones
  for (const zone of currentVenue.zones) {
    if (!zone.polygon || zone.polygon.length < 3) continue;

    const shape = new THREE.Shape();
    shape.moveTo(zone.polygon[0].x, zone.polygon[0].y);
    for (let i = 1; i < zone.polygon.length; i++) {
      shape.lineTo(zone.polygon[i].x, zone.polygon[i].y);
    }
    shape.closePath();

    const floorZ = zone.floorHeight ?? 0;
    const ceilingZ = zone.ceilingHeight ?? (floorZ + 3.0);
    const height = Math.max(0.15, ceilingZ - floorZ);

    const extrudeGeo = new THREE.ExtrudeGeometry(shape, {
      depth: height,
      bevelEnabled: false
    });

    const isSelected = selectedItem?.ref === zone;
    const zoneMat = new THREE.MeshStandardMaterial({
      color: zone.color || "#3b82f6",
      transparent: true,
      opacity: isSelected ? 0.65 : 0.35,
      roughness: 0.4
    });

    const zoneMesh = new THREE.Mesh(extrudeGeo, zoneMat);
    zoneMesh.position.set(0, 0, floorZ);
    zoneMesh.userData = { item: { type: "zone", ref: zone } };

    // Wireframe outline
    const edgesGeo = new THREE.EdgesGeometry(extrudeGeo);
    const edgesMat = new THREE.LineBasicMaterial({
      color: isSelected ? 0xffffff : (zone.color || 0x3b82f6),
      linewidth: isSelected ? 2 : 1
    });
    const edgesMesh = new THREE.LineSegments(edgesGeo, edgesMat);
    zoneMesh.add(edgesMesh);

    threeObjectsGroup.add(zoneMesh);

    // Human avatar in zone center
    let cx = 0, cy = 0;
    for (const pt of zone.polygon) { cx += pt.x; cy += pt.y; }
    cx /= zone.polygon.length;
    cy /= zone.polygon.length;

    const avatar = createHumanAvatar();
    avatar.position.set(cx, cy, floorZ);
    avatar.userData = { item: { type: "zone", ref: zone } };
    threeObjectsGroup.add(avatar);
  }

  // 3. PTZ Cameras
  for (const [key, cam] of Object.entries(currentVenue.cameras)) {
    const camGroup = new THREE.Group();
    camGroup.position.set(cam.position.x, cam.position.y, cam.position.z);
    camGroup.userData = { item: { type: "camera", key, ref: cam } };

    const isSelected = selectedItem?.ref === cam;

    // Camera body dome
    const domeMat = new THREE.MeshStandardMaterial({
      color: isSelected ? 0x3b82f6 : 0xecf0f1,
      metalness: 0.5,
      roughness: 0.3
    });
    const domeGeo = new THREE.SphereGeometry(0.22, 16, 16);
    const domeMesh = new THREE.Mesh(domeGeo, domeMat);
    camGroup.add(domeMesh);

    // Look Vector & Wireframe Frustum
    const panRad = (cam.baseOrientation.pan * Math.PI) / 180;
    const tiltRad = (cam.baseOrientation.tilt * Math.PI) / 180;
    const dx = Math.sin(panRad) * Math.cos(tiltRad);
    const dy = Math.cos(panRad) * Math.cos(tiltRad);
    const dz = Math.sin(tiltRad);

    const forward = new THREE.Vector3(dx, dy, dz).normalize();
    const coneLen = 7.0;

    // Sighting ray
    const rayPoints = [
      new THREE.Vector3(0, 0, 0),
      forward.clone().multiplyScalar(coneLen)
    ];
    const rayGeo = new THREE.BufferGeometry().setFromPoints(rayPoints);
    const rayMat = new THREE.LineBasicMaterial({
      color: isSelected ? 0x60a5fa : 0xf59e0b,
      linewidth: 2
    });
    const rayLine = new THREE.Line(rayGeo, rayMat);
    camGroup.add(rayLine);

    // Frustum cone
    const coneGeo = new THREE.ConeGeometry(2.5, coneLen, 4, 1, true);
    coneGeo.rotateX(Math.PI / 2);
    const coneMat = new THREE.MeshBasicMaterial({
      color: isSelected ? 0x3b82f6 : 0xf59e0b,
      wireframe: true,
      transparent: true,
      opacity: 0.4
    });
    const coneMesh = new THREE.Mesh(coneGeo, coneMat);
    coneMesh.position.copy(forward.clone().multiplyScalar(coneLen / 2));
    coneMesh.lookAt(forward.clone().multiplyScalar(coneLen * 2));
    camGroup.add(coneMesh);

    threeObjectsGroup.add(camGroup);
  }

  // 4. Occluders (Keymask Holdout Geometry)
  if (currentVenue.occluders) {
    for (const occ of currentVenue.occluders) {
      const isSelected = selectedItem?.ref === occ;
      const occMat = new THREE.MeshStandardMaterial({
        color: isSelected ? 0xef4444 : 0x475569,
        roughness: 0.7,
        metalness: 0.2
      });

      let occMesh;
      if (occ.kind === "table") {
        const w = occ.dimensions?.width ?? 2.2;
        const d = occ.dimensions?.depth ?? 1.1;
        const totalH = occ.dimensions?.height ?? 0.85;
        const topThick = 0.08;
        const legThick = 0.08;
        const legH = Math.max(0.1, totalH - topThick);
        const bZ = occ.position?.z ?? 0.0;

        const tableGroup = new THREE.Group();

        // 1. Tabletop slab
        const topGeo = new THREE.BoxGeometry(w, d, topThick);
        const topMesh = new THREE.Mesh(topGeo, occMat);
        topMesh.position.set(0, 0, bZ + totalH - topThick / 2);
        tableGroup.add(topMesh);

        const wireTop = new THREE.EdgesGeometry(topGeo);
        topMesh.add(new THREE.LineSegments(wireTop, new THREE.LineBasicMaterial({
          color: isSelected ? 0xef4444 : 0xf59e0b,
          linewidth: 2
        })));

        // 2. Four Legs (Open air underneath between legs!)
        const xOffsets = [w / 2 - 0.12, -w / 2 + 0.12];
        const yOffsets = [d / 2 - 0.12, -d / 2 + 0.12];
        const legGeo = new THREE.BoxGeometry(legThick, legThick, legH);

        for (const lx of xOffsets) {
          for (const ly of yOffsets) {
            const legMesh = new THREE.Mesh(legGeo, occMat);
            legMesh.position.set(lx, ly, bZ + legH / 2);
            tableGroup.add(legMesh);
          }
        }

        tableGroup.position.set(occ.position.x, occ.position.y, 0);
        tableGroup.userData = { item: { type: "occluder", ref: occ } };
        threeObjectsGroup.add(tableGroup);
        continue;
      } else if (occ.kind === "cylinder") {
        const rad = occ.dimensions?.radius ?? 0.8;
        const h = occ.dimensions?.height ?? 1.5;
        const cylGeo = new THREE.CylinderGeometry(rad, rad, h, 20);
        cylGeo.rotateX(Math.PI / 2);
        occMesh = new THREE.Mesh(cylGeo, occMat);
        occMesh.position.set(occ.position.x, occ.position.y, occ.position.z + h / 2);
      } else {
        const w = occ.dimensions?.width ?? 2.0;
        const d = occ.dimensions?.depth ?? 1.2;
        const h = occ.dimensions?.height ?? 1.0;
        const boxGeo = new THREE.BoxGeometry(w, d, h);
        occMesh = new THREE.Mesh(boxGeo, occMat);
        occMesh.position.set(occ.position.x, occ.position.y, occ.position.z + h / 2);
      }

      occMesh.userData = { item: { type: "occluder", ref: occ } };
      threeObjectsGroup.add(occMesh);
    }
  }
}

function switchToView(mode) {
  viewMode = mode;
  if (mode === "3d") {
    btnView3D.classList.add("active");
    btnView2D.classList.remove("active");
    canvas.style.display = "none";
    viewport3d.style.display = "block";
    view3dControls.style.display = "flex";
    init3D();
    onResize3D();
    update3DScene();
  } else {
    btnView2D.classList.add("active");
    btnView3D.classList.remove("active");
    canvas.style.display = "block";
    viewport3d.style.display = "none";
    view3dControls.style.display = "none";
    resizeCanvas();
    render();
  }
}

btnView2D.addEventListener("click", () => switchToView("2d"));
btnView3D.addEventListener("click", () => switchToView("3d"));

// 3D Camera Presets
document.getElementById("btn3dFocusAltar")?.addEventListener("click", () => {
  if (!threeCamera || !threeControls) return;
  threeCamera.position.set(0, -6, 5);
  threeControls.target.set(0, 2.8, 0.6);
});

document.getElementById("btn3dFocusPulpit")?.addEventListener("click", () => {
  if (!threeCamera || !threeControls) return;
  threeCamera.position.set(-1.0, -3.5, 3.5);
  threeControls.target.set(-3.5, 0.5, 1.8);
});

document.getElementById("btn3dFocusChoir")?.addEventListener("click", () => {
  if (!threeCamera || !threeControls) return;
  threeCamera.position.set(1.5, -3.0, 3.0);
  threeControls.target.set(4.5, 2.0, 1.0);
});

document.getElementById("btn3dGhostWalls")?.addEventListener("click", () => {
  globalGhostWalls = !globalGhostWalls;
  const btn = document.getElementById("btn3dGhostWalls");
  if (btn) btn.classList.toggle("active", globalGhostWalls);
  update3DScene();
});

document.getElementById("btn3dReset")?.addEventListener("click", () => {
  if (!threeCamera || !threeControls) return;
  threeCamera.position.set(0, -22, 14);
  threeControls.target.set(0, 2, 1);
});

// Update on resize
window.addEventListener("resize", () => {
  if (viewMode === "3d") onResize3D();
});

// Initial boot
resizeCanvas();
render();
