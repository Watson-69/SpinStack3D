import fs from 'fs';
const glb = fs.readFileSync('public/models/hdd/hdd_internals.glb');
const jsonLen = glb.readUInt32LE(12);
const jsonBuf = glb.subarray(20, 20 + jsonLen);
const gltf = JSON.parse(jsonBuf.toString('utf8'));
console.log('Nodes count:', gltf.nodes.length);
gltf.nodes.forEach((n, i) => {
  console.log(`${i}: name="${n.name}" mesh=${n.mesh} children=${JSON.stringify(n.children)} extras=${JSON.stringify(n.extras)}`);
});
