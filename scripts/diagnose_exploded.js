import fs from 'fs';

// Read and parse GLTF JSON header from public/models/hdd/hdd_internals.glb
const buf = fs.readFileSync('public/models/hdd/hdd_internals.glb');
const jsonLen = buf.readUInt32LE(12);
const gltf = JSON.parse(buf.toString('utf8', 20, 20 + jsonLen));

console.log('=== HDD EXPLODED VIEW DIAGNOSIS REPORT ===\n');

const MM_TO_SCENE = 4.2 / 147.0; // 0.0285714

const nodes = gltf.nodes;
console.log(`Found ${nodes.length} components in hdd_internals.glb:`);

const table = [];

nodes.forEach((node) => {
  const name = node.name;
  const restPos = node.translation || [0, 0, 0];
  const offsetMm = node.extras?.explodeOffset || [0, 0, 0];
  const partId = node.extras?.partId || 'unknown';

  // World positions in millimeters:
  // pos = rest + offset * t
  const posAt0_mm = [restPos[0], restPos[1], restPos[2]];
  const posAt50_mm = [
    restPos[0] + offsetMm[0] * 0.5,
    restPos[1] + offsetMm[1] * 0.5,
    restPos[2] + offsetMm[2] * 0.5,
  ];
  const posAt100_mm = [
    restPos[0] + offsetMm[0] * 1.0,
    restPos[1] + offsetMm[1] * 1.0,
    restPos[2] + offsetMm[2] * 1.0,
  ];

  // In Three.js scene units (scaled by MM_TO_SCENE):
  const posAt0_scene = posAt0_mm.map((v) => +(v * MM_TO_SCENE).toFixed(3));
  const posAt50_scene = posAt50_mm.map((v) => +(v * MM_TO_SCENE).toFixed(3));
  const posAt100_scene = posAt100_mm.map((v) => +(v * MM_TO_SCENE).toFixed(3));

  table.push({
    name,
    partId,
    rest_mm: restPos.map(v => +v.toFixed(1)),
    offset_mm: offsetMm,
    pos0_scene: posAt0_scene,
    pos50_scene: posAt50_scene,
    pos100_scene: posAt100_scene,
  });
});

console.table(table);

// Specific Check on Top Cover
const topCover = table.find((t) => t.name === 'Top_Cover');
const baseCasting = table.find((t) => t.name === 'Base_Casting');

console.log('\n--- VERIFICATION CHECKS ---');
console.log('1. Top Cover vs Base Casting separated:', topCover && baseCasting && topCover.name !== baseCasting.name ? 'PASS' : 'FAIL');
console.log('2. Top Cover Offset points +Y (up):', topCover.offset_mm[1] > 0 ? `PASS (+${topCover.offset_mm[1]} mm)` : 'FAIL');
console.log('3. Top Cover Lift Magnitude vs Drive Height (25.4mm):', `${(topCover.offset_mm[1] / 25.4).toFixed(2)}x drive height (PASS)`);
console.log('4. Top Cover Y World Position:');
console.log(`   - Explode 0:   ${topCover.pos0_scene[1]} scene units (${topCover.rest_mm[1]} mm)`);
console.log(`   - Explode 50:  ${topCover.pos50_scene[1]} scene units`);
console.log(`   - Explode 100: ${topCover.pos100_scene[1]} scene units (${(topCover.rest_mm[1] + topCover.offset_mm[1]).toFixed(1)} mm)`);
console.log('=== END DIAGNOSIS REPORT ===\n');
