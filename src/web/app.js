// Church 3D Venue Mapper Canvas Application

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
      scale: { x: 1.0, y: 1.0, z: 1.0 }
    },
    {
      id: "altar_table",
      name: "Altar Table",
      kind: "box",
      position: { x: 0.0, y: 2.5, z: 0.4 },
      dimensions: { width: 3.2, depth: 1.2, height: 1.0 }
    }
  ]
};

let currentVenue = JSON.parse(JSON.stringify(KESKUSKIRKKO_TEMPLATE));

// State
let currentTool = "select";
let selectedItem = null; // { type: 'zone'|'camera'|'occluder', ref: object, key?: string }
let currentDraftPolygon = [];
let draggingVertex = null; // { zone, vertexIndex }
let isPanning = false;
let startPan = { x: 0, y: 0 };

// Viewport Transform: meters -> screen pixels
// World center (0, 0)
let scale = 25; // 25 pixels per meter
let originScreen = { x: 0, y: 0 };

const canvas = document.getElementById("mapCanvas");
const ctx = canvas.getContext("2d");

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
  drawZones();
  drawOccluders();
  drawCameras();
  drawDraftPolygon();
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
    ctx.fillStyle = isSelected ? "#f59e0b" : "#d97706";
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = isSelected ? 2 : 1;

    if (occ.kind === "box" && occ.dimensions) {
      const bw = occ.dimensions.width * scale;
      const bd = occ.dimensions.depth * scale;
      ctx.fillRect(p.x - bw / 2, p.y - bd / 2, bw, bd);
      ctx.strokeRect(p.x - bw / 2, p.y - bd / 2, bw, bd);
    } else {
      ctx.beginPath();
      ctx.arc(p.x, p.y, 8, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }

    ctx.fillStyle = "#ffffff";
    ctx.font = "10px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(`🛡 ${occ.name}`, p.x, p.y - 12);
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

// Interaction
canvas.addEventListener("mousemove", (e) => {
  const rect = canvas.getBoundingClientRect();
  const sx = e.clientX - rect.left;
  const sy = e.clientY - rect.top;
  const w = screenToWorld(sx, sy);

  document.getElementById("coordsDisplay").innerText = `X: ${w.x.toFixed(2)} m, Y: ${w.y.toFixed(2)} m`;

  if (isPanning) {
    originScreen.x += sx - startPan.x;
    originScreen.y += sy - startPan.y;
    startPan = { x: sx, y: sy };
    render();
    return;
  }

  if (draggingVertex) {
    draggingVertex.zone.polygon[draggingVertex.vertexIndex].x = Math.round(w.x * 10) / 10;
    draggingVertex.zone.polygon[draggingVertex.vertexIndex].y = Math.round(w.y * 10) / 10;
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

  if (currentTool === "select") {
    // Check if clicked vertex handle
    if (selectedItem?.type === "zone") {
      for (let i = 0; i < selectedItem.ref.polygon.length; i++) {
        const vp = worldToScreen(selectedItem.ref.polygon[i].x, selectedItem.ref.polygon[i].y);
        if (Math.hypot(vp.x - sx, vp.y - sy) < 8) {
          draggingVertex = { zone: selectedItem.ref, vertexIndex: i };
          return;
        }
      }
    }

    // Hit test zones
    for (const z of currentVenue.zones) {
      if (pointInPoly(w, z.polygon)) {
        selectItem({ type: "zone", ref: z });
        render();
        return;
      }
    }

    // Hit test cameras
    for (const [k, cam] of Object.entries(currentVenue.cameras)) {
      const cp = worldToScreen(cam.position.x, cam.position.y);
      if (Math.hypot(cp.x - sx, cp.y - sy) < 12) {
        selectItem({ type: "camera", ref: cam, key: k });
        render();
        return;
      }
    }

    selectItem(null);
    render();
  } else if (currentTool === "add-zone") {
    currentDraftPolygon.push({ x: Math.round(w.x * 10) / 10, y: Math.round(w.y * 10) / 10 });
    render();
  } else if (currentTool === "add-camera") {
    const camId = `cam${Object.keys(currentVenue.cameras).length + 1}`;
    currentVenue.cameras[camId] = {
      id: camId,
      name: `Camera ${Object.keys(currentVenue.cameras).length + 1}`,
      position: { x: Math.round(w.x * 10) / 10, y: Math.round(w.y * 10) / 10, z: 3.5 },
      baseOrientation: { pan: 0, tilt: -10, roll: 0 }
    };
    setTool("select");
    selectItem({ type: "camera", ref: currentVenue.cameras[camId], key: camId });
    render();
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
  document.querySelectorAll(".tool-btn").forEach((b) => b.classList.toggle("active", b.getAttribute("data-tool") === tool));
  document.getElementById("modeDisplay").innerText = `Mode: ${tool.toUpperCase()}`;
}

// Selection & Inspector Binding
function selectItem(item) {
  selectedItem = item;
  const editor = document.getElementById("itemEditor");
  const emptyHint = document.querySelector(".empty-hint");

  if (!item) {
    editor.style.display = "none";
    emptyHint.style.display = "block";
    return;
  }

  editor.style.display = "block";
  emptyHint.style.display = "none";

  document.getElementById("zoneFields").style.display = item.type === "zone" ? "block" : "none";
  document.getElementById("cameraFields").style.display = item.type === "camera" ? "block" : "none";
  document.getElementById("occluderFields").style.display = item.type === "occluder" ? "block" : "none";

  document.getElementById("itemId").value = item.ref.id;
  document.getElementById("itemName").value = item.ref.name;

  if (item.type === "zone") {
    document.getElementById("zoneFloor").value = item.ref.floorHeight;
    document.getElementById("zoneCeiling").value = item.ref.ceilingHeight;
    document.getElementById("zoneColor").value = item.ref.color || "#3b82f6";
    document.getElementById("zoneTags").value = (item.ref.tags || []).join(", ");
  } else if (item.type === "camera") {
    document.getElementById("camHeight").value = item.ref.position.z;
    document.getElementById("camPan").value = item.ref.baseOrientation.pan;
    document.getElementById("camTilt").value = item.ref.baseOrientation.tilt;
  }
}

// Form Field Updaters
document.getElementById("itemId").addEventListener("input", (e) => {
  if (selectedItem) selectedItem.ref.id = e.target.value;
});
document.getElementById("itemName").addEventListener("input", (e) => {
  if (selectedItem) { selectedItem.ref.name = e.target.value; render(); }
});
document.getElementById("zoneFloor").addEventListener("input", (e) => {
  if (selectedItem?.type === "zone") { selectedItem.ref.floorHeight = Number(e.target.value); render(); }
});
document.getElementById("zoneCeiling").addEventListener("input", (e) => {
  if (selectedItem?.type === "zone") selectedItem.ref.ceilingHeight = Number(e.target.value);
});
document.getElementById("zoneColor").addEventListener("input", (e) => {
  if (selectedItem?.type === "zone") { selectedItem.ref.color = e.target.value; render(); }
});
document.getElementById("camPan").addEventListener("input", (e) => {
  if (selectedItem?.type === "camera") { selectedItem.ref.baseOrientation.pan = Number(e.target.value); render(); }
});
document.getElementById("camTilt").addEventListener("input", (e) => {
  if (selectedItem?.type === "camera") selectedItem.ref.baseOrientation.tilt = Number(e.target.value);
});
document.getElementById("camHeight").addEventListener("input", (e) => {
  if (selectedItem?.type === "camera") selectedItem.ref.position.z = Number(e.target.value);
});

// Delete Item
document.getElementById("btnDeleteItem").addEventListener("click", () => {
  if (!selectedItem) return;
  if (selectedItem.type === "zone") {
    currentVenue.zones = currentVenue.zones.filter((z) => z !== selectedItem.ref);
  } else if (selectedItem.type === "camera") {
    delete currentVenue.cameras[selectedItem.key];
  }
  selectItem(null);
  render();
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

// Initial boot
resizeCanvas();
render();
