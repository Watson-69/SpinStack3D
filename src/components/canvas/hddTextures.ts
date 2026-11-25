import * as THREE from 'three';

// Procedural Canvas Texture Generators for HDD Top Cover Decal and PCB Silkscreen
export function createHddCoverDecalTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 1024;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    return new THREE.CanvasTexture(canvas);
  }

  // Background brushed metal label plate
  ctx.fillStyle = '#0f172a';
  ctx.fillRect(0, 0, 1024, 1024);

  // Border frame
  ctx.strokeStyle = '#38bdf8';
  ctx.lineWidth = 6;
  ctx.strokeRect(40, 40, 944, 944);

  // Header band
  ctx.fillStyle = '#0284c7';
  ctx.fillRect(40, 40, 944, 130);

  // Brand / Series Title
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 54px "JetBrains Mono", monospace';
  ctx.fillText('HECKS ULTRA-ENTERPRISE', 70, 120);

  ctx.fillStyle = '#bae6fd';
  ctx.font = '24px "JetBrains Mono", monospace';
  ctx.fillText('MODEL: ST8000NM0055 // 7200 RPM // SATA 6Gb/s PMR', 70, 155);

  // Specs Matrix
  ctx.fillStyle = '#94a3b8';
  ctx.font = 'bold 28px "Manrope Variable", system-ui, sans-serif';
  ctx.fillText('SERIAL: WX12A4598471', 80, 240);
  ctx.fillText('CAPACITY: 8.0 TB (6 PLATTERS / 12 HEADS)', 80, 285);
  ctx.fillText('SECTOR SIZE: 4096e / 512e ADVANCED FORMAT', 80, 330);
  ctx.fillText('FIRMWARE: SN05 // DATE CODE: 2642', 80, 375);
  ctx.fillText('RATED VOLTAGE: +5V 0.55A / +12V 0.37A', 80, 420);

  // Barcode visualization
  ctx.fillStyle = '#ffffff';
  const startX = 80;
  const startY = 470;
  const barcodeHeight = 90;
  let currentX = startX;
  const barPattern = [4, 2, 6, 2, 8, 3, 2, 5, 2, 7, 3, 4, 2, 6, 4, 3, 7, 2, 4, 3, 8, 2, 3, 6, 2, 5, 4, 2, 7, 3, 2, 6, 3, 4, 8, 2, 4, 3, 6];
  for (let i = 0; i < barPattern.length; i++) {
    const width = barPattern[i] * 3;
    if (i % 2 === 0) {
      ctx.fillRect(currentX, startY, width, barcodeHeight);
    }
    currentX += width;
  }
  ctx.fillStyle = '#94a3b8';
  ctx.font = '20px "JetBrains Mono", monospace';
  ctx.fillText('*ST8000NM0055-PMR-2026*', 140, 590);

  // Warning Notice Box
  ctx.strokeStyle = '#f59e0b';
  ctx.lineWidth = 3;
  ctx.strokeRect(80, 625, 864, 180);
  ctx.fillStyle = 'rgba(245, 158, 11, 0.08)';
  ctx.fillRect(80, 625, 864, 180);

  ctx.fillStyle = '#f59e0b';
  ctx.font = 'bold 28px "Manrope Variable", system-ui, sans-serif';
  ctx.fillText('CAUTION: CLASS 100 CLEANROOM AIR BUFFERED SYSTEM', 105, 668);

  ctx.fillStyle = '#e2e8f0';
  ctx.font = '22px "Manrope Variable", system-ui, sans-serif';
  ctx.fillText('• DO NOT COVER BREATHER HOLE (AERODYNAMIC FLY HEIGHT DISTURBANCE)', 105, 710);
  ctx.fillText('• WARRANTY VOID IF REMOVED OR TOP HOUSING SCREWS TAMPERED', 105, 745);
  ctx.fillText('• OPERATING TEMPERATURE RANGE: 5°C TO 60°C', 105, 780);

  // Regulatory Icons / Badges
  ctx.strokeStyle = '#475569';
  ctx.lineWidth = 2;
  const certs = ['CE', 'FC', 'RoHS', 'WEEE', 'TUV', 'cULus'];
  certs.forEach((c, i) => {
    const bx = 80 + i * 145;
    const by = 835;
    ctx.strokeRect(bx, by, 125, 55);
    ctx.fillStyle = '#cbd5e1';
    ctx.font = 'bold 22px "JetBrains Mono", monospace';
    ctx.textAlign = 'center';
    ctx.fillText(c, bx + 62, by + 36);
  });
  ctx.textAlign = 'start';

  // HEPA Filter Indicator Circle
  ctx.strokeStyle = '#00f0ff';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.arc(840, 310, 50, 0, Math.PI * 2);
  ctx.stroke();
  ctx.fillStyle = 'rgba(0, 240, 255, 0.15)';
  ctx.fill();

  ctx.fillStyle = '#38bdf8';
  ctx.font = 'bold 16px "JetBrains Mono", monospace';
  ctx.textAlign = 'center';
  ctx.fillText('BREATHER', 840, 305);
  ctx.fillText('PORT', 840, 325);
  ctx.textAlign = 'start';

  const texture = new THREE.CanvasTexture(canvas);
  texture.anisotropy = 8;
  texture.needsUpdate = true;
  return texture;
}
