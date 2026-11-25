import fs from 'fs';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

const glbBuf = fs.readFileSync('public/models/hdd/hdd_internals.glb');
const loader = new GLTFLoader();

loader.parse(glbBuf.buffer.slice(glbBuf.byteOffset, glbBuf.byteOffset + glbBuf.byteLength), '', (gltf) => {
  console.log('Parsed GLTF successfully!');
  gltf.scene.traverse((c) => {
    if (c.isMesh) {
      const box = new THREE.Box3().setFromObject(c);
      console.log(
        `${c.name.padEnd(20)} pos: (${c.position.x.toFixed(1)}, ${c.position.y.toFixed(1)}, ${c.position.z.toFixed(1)}) ` +
        `min: (${box.min.x.toFixed(1)}, ${box.min.y.toFixed(1)}, ${box.min.z.toFixed(1)}) ` +
        `max: (${box.max.x.toFixed(1)}, ${box.max.y.toFixed(1)}, ${box.max.z.toFixed(1)}) ` +
        `size: (${(box.max.x - box.min.x).toFixed(1)}, ${(box.max.y - box.min.y).toFixed(1)}, ${(box.max.z - box.min.z).toFixed(1)})`
      );
    }
  });
}, (err) => console.error('Error:', err));
