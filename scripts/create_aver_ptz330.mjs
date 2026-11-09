import fs from 'node:fs';
import path from 'node:path';

// Polyfill FileReader for Three.js GLTFExporter in Node.js
if (typeof globalThis.FileReader === 'undefined') {
  globalThis.FileReader = class FileReader {
    readAsArrayBuffer(blob) {
      blob.arrayBuffer().then((buf) => {
        this.result = buf;
        if (this.onload) this.onload({ target: this });
        if (this.onloadend) this.onloadend({ target: this });
      });
    }
    readAsDataURL(blob) {
      blob.arrayBuffer().then((buf) => {
        this.result = `data:${blob.type || 'application/octet-stream'};base64,${Buffer.from(buf).toString('base64')}`;
        if (this.onload) this.onload({ target: this });
        if (this.onloadend) this.onloadend({ target: this });
      });
    }
  };
}

import * as THREE from 'three';
import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter.js';

// Create AVer PTZ330 Camera Model
// Real Dimensions: 180mm (W) x 145mm (D) x 183.5mm (H)
const root = new THREE.Group();
root.name = 'aver_ptz330';

// Materials
const matBody = new THREE.MeshStandardMaterial({
  name: 'PTZ_Body_DarkCharcoal',
  color: 0x22262c,
  roughness: 0.45,
  metalness: 0.4
});

const matMetalAccent = new THREE.MeshStandardMaterial({
  name: 'PTZ_Metal_Accent',
  color: 0x3e444e,
  roughness: 0.25,
  metalness: 0.75
});

const matLensBezel = new THREE.MeshStandardMaterial({
  name: 'PTZ_Lens_Bezel',
  color: 0x111317,
  roughness: 0.2,
  metalness: 0.8
});

const matLensGlass = new THREE.MeshStandardMaterial({
  name: 'PTZ_Lens_Optics',
  color: 0x0a121e,
  roughness: 0.05,
  metalness: 0.95
});

const matTallyLed = new THREE.MeshStandardMaterial({
  name: 'PTZ_Tally_LED',
  color: 0x22c55e,
  emissive: 0x16a34a,
  emissiveIntensity: 0.8,
  roughness: 0.1
});

const matRubberFeet = new THREE.MeshStandardMaterial({
  name: 'PTZ_Rubber_Feet',
  color: 0x111111,
  roughness: 0.9
});

// 1. Base Platform (180mm x 145mm x 34mm)
const baseGeo = new THREE.BoxGeometry(0.180, 0.145, 0.034);
const baseMesh = new THREE.Mesh(baseGeo, matBody);
baseMesh.position.set(0, 0, 0.017);
root.add(baseMesh);

// Tally / Status LED bar on front edge of base (+Y is facing forward for camera)
const tallyGeo = new THREE.BoxGeometry(0.050, 0.004, 0.005);
const tallyMesh = new THREE.Mesh(tallyGeo, matTallyLed);
tallyMesh.position.set(0, 0.073, 0.024);
root.add(tallyMesh);

// IR Sensor Window on front face
const irGeo = new THREE.BoxGeometry(0.016, 0.003, 0.008);
const irMat = new THREE.MeshStandardMaterial({ color: 0x1a0515, roughness: 0.1 });
const irMesh = new THREE.Mesh(irGeo, irMat);
irMesh.position.set(0.045, 0.073, 0.024);
root.add(irMesh);

// 4 Rubber feet underneath
const footGeo = new THREE.CylinderGeometry(0.008, 0.008, 0.004, 16);
footGeo.rotateX(Math.PI / 2);
for (const fx of [-0.07, 0.07]) {
  for (const fy of [-0.055, 0.055]) {
    const foot = new THREE.Mesh(footGeo, matRubberFeet);
    foot.position.set(fx, fy, -0.002);
    root.add(foot);
  }
}

// 2. Pan Turntable (Diameter 126mm, height 20mm)
const panGeo = new THREE.CylinderGeometry(0.063, 0.064, 0.020, 32);
panGeo.rotateX(Math.PI / 2);
const panMesh = new THREE.Mesh(panGeo, matBody);
panMesh.position.set(0, 0, 0.034 + 0.010);
root.add(panMesh);

// Swivel seam accent ring
const seamGeo = new THREE.CylinderGeometry(0.0645, 0.0645, 0.002, 32);
seamGeo.rotateX(Math.PI / 2);
const seamMesh = new THREE.Mesh(seamGeo, matMetalAccent);
seamMesh.position.set(0, 0, 0.034 + 0.019);
root.add(seamMesh);

// 3. Tilt Fork / Yoke Assembly
const yokeGroup = new THREE.Group();
yokeGroup.name = 'yoke';
root.add(yokeGroup);

// Left Fork Arm
const armGeo = new THREE.BoxGeometry(0.022, 0.060, 0.082);
const leftArm = new THREE.Mesh(armGeo, matBody);
leftArm.position.set(-0.058, 0, 0.054 + 0.041);
yokeGroup.add(leftArm);

// Right Fork Arm
const rightArm = new THREE.Mesh(armGeo, matBody);
rightArm.position.set(0.058, 0, 0.054 + 0.041);
yokeGroup.add(rightArm);

// Circular Pivot caps on sides
const pivotCapGeo = new THREE.CylinderGeometry(0.020, 0.020, 0.004, 24);
pivotCapGeo.rotateZ(Math.PI / 2);
const leftPivot = new THREE.Mesh(pivotCapGeo, matMetalAccent);
leftPivot.position.set(-0.070, 0, 0.120);
yokeGroup.add(leftPivot);

const rightPivot = new THREE.Mesh(pivotCapGeo, matMetalAccent);
rightPivot.position.set(0.070, 0, 0.120);
yokeGroup.add(rightPivot);

// 4. Optical Camera Head & Lens Barrel
// Pivot center is at Z = 0.120m (120mm above base), looking forward (+Y)
const headGroup = new THREE.Group();
headGroup.name = 'camera_head';
headGroup.position.set(0, 0, 0.120);
root.add(headGroup);

// Main housing block
const housingGeo = new THREE.CylinderGeometry(0.044, 0.044, 0.088, 32);
housingGeo.rotateZ(Math.PI / 2);
const housingMesh = new THREE.Mesh(housingGeo, matBody);
headGroup.add(housingMesh);

// Lens barrel protruding forward (+Y)
const barrelGeo = new THREE.CylinderGeometry(0.037, 0.039, 0.075, 32);
barrelGeo.rotateX(Math.PI / 2);
const barrelMesh = new THREE.Mesh(barrelGeo, matBody);
barrelMesh.position.set(0, 0.035, 0);
headGroup.add(barrelMesh);

// Front Lens Bezel Ring
const bezelGeo = new THREE.CylinderGeometry(0.040, 0.040, 0.012, 32);
bezelGeo.rotateX(Math.PI / 2);
const bezelMesh = new THREE.Mesh(bezelGeo, matLensBezel);
bezelMesh.position.set(0, 0.075, 0);
headGroup.add(bezelMesh);

// Inner Lens Cone / Step
const innerStepGeo = new THREE.CylinderGeometry(0.032, 0.037, 0.008, 32);
innerStepGeo.rotateX(Math.PI / 2);
const innerStepMesh = new THREE.Mesh(innerStepGeo, matMetalAccent);
innerStepMesh.position.set(0, 0.077, 0);
headGroup.add(innerStepMesh);

// Curved Glass Front Optical Element
const lensGeo = new THREE.SphereGeometry(0.032, 32, 16, 0, Math.PI * 2, 0, Math.PI * 0.35);
lensGeo.rotateX(-Math.PI / 2);
const lensMesh = new THREE.Mesh(lensGeo, matLensGlass);
lensMesh.position.set(0, 0.078, 0);
headGroup.add(lensMesh);

// Rear Connector Plate (SDI, HDMI, LAN, Power, RS232)
const rearGeo = new THREE.BoxGeometry(0.060, 0.010, 0.050);
const rearMesh = new THREE.Mesh(rearGeo, matMetalAccent);
rearMesh.position.set(0, -0.048, 0);
headGroup.add(rearMesh);

// Small SDI BNC connector on rear
const bncGeo = new THREE.CylinderGeometry(0.005, 0.005, 0.012, 16);
bncGeo.rotateX(Math.PI / 2);
const bncMesh = new THREE.Mesh(bncGeo, matMetalAccent);
bncMesh.position.set(-0.018, -0.055, -0.010);
headGroup.add(bncMesh);

// HDMI port on rear
const hdmiGeo = new THREE.BoxGeometry(0.015, 0.008, 0.006);
const hdmiMesh = new THREE.Mesh(hdmiGeo, matLensBezel);
hdmiMesh.position.set(0.012, -0.053, -0.010);
headGroup.add(hdmiMesh);

// Export to Binary GLTF (.glb)
const exporter = new GLTFExporter();
exporter.parse(
  root,
  (glb) => {
    const buffer = Buffer.from(glb);
    const destPaths = [
      'C:/Users/jsilv/Code/church-3d-mapper/models/aver-ptz330.glb',
      'D:/pispace/models/aver-ptz330.glb',
      'C:/Users/jsilv/Code/pispace/models/aver-ptz330.glb'
    ];

    for (const p of destPaths) {
      fs.mkdirSync(path.dirname(p), { recursive: true });
      fs.writeFileSync(p, buffer);
      console.log(`Saved AVer PTZ330 GLB (${buffer.length} bytes) to ${p}`);
    }
  },
  (err) => {
    console.error('GLTF export error:', err);
  },
  { binary: true }
);
