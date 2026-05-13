'use client';

import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';

interface ParticleData {
  x: number; y: number; z: number;
  ox: number; oy: number; oz: number;
  vx: number; vy: number; vz: number;
}

function sampleTextPixels(text: string, canvasW: number, canvasH: number, fontSize: number): [number, number][] {
  const canvas = document.createElement('canvas');
  canvas.width = canvasW;
  canvas.height = canvasH;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, canvasW, canvasH);
  ctx.fillStyle = '#fff';
  ctx.font = `bold ${fontSize}px "Georgia", "Times New Roman", serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, canvasW / 2, canvasH / 2);

  const imageData = ctx.getImageData(0, 0, canvasW, canvasH);
  const pixels: [number, number][] = [];
  const step = 4;

  for (let py = 0; py < canvasH; py += step) {
    for (let px = 0; px < canvasW; px += step) {
      const alpha = imageData.data[(py * canvasW + px) * 4 + 3];
      if (alpha > 80) {
        pixels.push([px, py]);
      }
    }
  }

  return pixels;
}

export default function ArmExplodedView() {
  const mountRef = useRef<HTMLDivElement>(null);
  const [particleSize, setParticleSize] = useState(1);
  const [diffusion, setDiffusion] = useState(1);
  const [rotSpeed, setRotSpeed] = useState(1);
  const [showControls, setShowControls] = useState(false);
  const paramsRef = useRef({ particleSize: 1, diffusion: 1, rotSpeed: 1 });

  paramsRef.current = { particleSize, diffusion, rotSpeed };

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const rect = mount.getBoundingClientRect();
    const w = rect.width || 600;
    const h = rect.height || 700;

    const scene = new THREE.Scene();
    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(w, h, false);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    mount.appendChild(renderer.domElement);

    const camera = new THREE.PerspectiveCamera(38, w / h, 0.5, 40);
    camera.position.set(0, 0, 7.5);
    camera.lookAt(0, 0, 0);

    const ambient = new THREE.AmbientLight('#38bdf8', 0.3);
    scene.add(ambient);

    const allParticles: ParticleData[] = [];

    // ---- Ultra-sparse text "sevik" particles ----
    const textCanvasW = 960;
    const textCanvasH = 200;
    const textPixels = sampleTextPixels('sevik', textCanvasW, textCanvasH, 160);
    const txtScaleX = 3.0;
    const txtScaleY = txtScaleX * (textCanvasH / textCanvasW);

    for (const [px, py] of textPixels) {
      const ox = ((px / textCanvasW) - 0.5) * txtScaleX;
      const oy = -((py / textCanvasH) - 0.5) * txtScaleY * 0.7;
      const oz = (Math.random() - 0.5) * 0.12;
      allParticles.push({ x: ox, y: oy, z: oz, ox, oy, oz, vx: 0, vy: 0, vz: 0 });
    }

    // ---- Background particles: Gaussian density (dense center, sparse edges) ----
    const bgCount = 28000;
    const camZ = 7.5;
    const zMin = -3.0, zMax = 3.0;
    const halfVFov = (38 / 2) * Math.PI / 180;
    const tanHalfVFov = Math.tan(halfVFov);
    const tanHalfHFov = tanHalfVFov * camera.aspect;
    for (let i = 0; i < bgCount; i++) {
      const oz = zMin + Math.random() * (zMax - zMin);
      const dist = camZ - oz;
      const halfW = dist * tanHalfHFov;
      const halfH = dist * tanHalfVFov;

      // Gaussian-distributed X: dense center, sparse edges
      let gaussX: number;
      do {
        // Box-Muller: mean=0, sigma = halfW/2.5
        const u1 = Math.random() || 1e-6;
        const u2 = Math.random();
        gaussX = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2) * (halfW / 2.5);
      } while (Math.abs(gaussX) > halfW);

      const ox = gaussX;
      const oy = (Math.random() - 0.5) * 2 * halfH;
      allParticles.push({ x: ox, y: oy, z: oz, ox, oy, oz, vx: 0, vy: 0, vz: 0 });
    }

    const N = allParticles.length;
    const textN = textPixels.length;

    const textColors = [
      new THREE.Color('#ff7eb3'), new THREE.Color('#ff65a3'), new THREE.Color('#d8b4fe'),
      new THREE.Color('#c084fc'), new THREE.Color('#ffb3d9'), new THREE.Color('#e9b8ff'),
    ];

    // ---- Heart-shaped alpha texture for particles ----
    const hCanvas = document.createElement('canvas');
    hCanvas.width = 64;
    hCanvas.height = 64;
    const hCtx = hCanvas.getContext('2d')!;
    hCtx.translate(32, 28);
    hCtx.beginPath();
    hCtx.moveTo(0, -6);
    hCtx.bezierCurveTo(-10, -16, -24, -5, 0, 16);
    hCtx.bezierCurveTo(24, -5, 10, -16, 0, -6);
    hCtx.closePath();
    hCtx.fillStyle = '#ffffff';
    hCtx.fill();
    const heartTexture = new THREE.CanvasTexture(hCanvas);
    heartTexture.needsUpdate = true;

    // ---- Build two separate point clouds: text (big hearts) + background (small dots) ----

    // Glow ring
    const ringGeo = new THREE.TorusGeometry(2.4, 0.008, 8, 160);
    const ringMat = new THREE.MeshBasicMaterial({ color: '#38bdf8', transparent: true, opacity: 0.08 });
    const glowRing = new THREE.Mesh(ringGeo, ringMat);
    glowRing.rotation.x = Math.PI / 2;
    scene.add(glowRing);

    // ---- Mouse state ----
    const mouseNDC = { x: 0, y: 0 };
    const smoothMouse = { x: 0, y: 0 };
    const raycaster = new THREE.Raycaster();
    const plane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);

    function updateMouse(e: MouseEvent) {
      const r = mount!.getBoundingClientRect();
      mouseNDC.x = ((e.clientX - r.left) / r.width) * 2 - 1;
      mouseNDC.y = -((e.clientY - r.top) / r.height) * 2 + 1;
    }

    function onTouchMove(e: TouchEvent) {
      const r = mount!.getBoundingClientRect();
      mouseNDC.x = ((e.touches[0].clientX - r.left) / r.width) * 2 - 1;
      mouseNDC.y = -((e.touches[0].clientY - r.top) / r.height) * 2 + 1;
    }

    function onLeave() {
      mouseNDC.x = -999;
      mouseNDC.y = -999;
      smoothMouse.x = -999;
      smoothMouse.y = -999;
    }

    mount.addEventListener('mousemove', updateMouse);
    mount.addEventListener('touchmove', onTouchMove, { passive: true });
    mount.addEventListener('mouseleave', onLeave);
    mount.addEventListener('touchend', onLeave);

    let animationId: number;
    const clock = new THREE.Clock();
    // ---- Build two separate point clouds: text (big hearts) + background (small dots) ----

    // Text particles — larger pink hearts
    const textPositions = new Float32Array(textN * 3);
    const textColorsArr = new Float32Array(textN * 3);
    for (let i = 0; i < textN; i++) {
      textPositions[i * 3] = allParticles[i].x;
      textPositions[i * 3 + 1] = allParticles[i].y;
      textPositions[i * 3 + 2] = allParticles[i].z;
      const c = textColors[Math.floor(Math.random() * textColors.length)].clone()
        .offsetHSL(0, 0, (Math.random() - 0.5) * 0.1);
      textColorsArr[i * 3] = c.r;
      textColorsArr[i * 3 + 1] = c.g;
      textColorsArr[i * 3 + 2] = c.b;
    }

    const textGeo = new THREE.BufferGeometry();
    textGeo.setAttribute('position', new THREE.BufferAttribute(textPositions, 3));
    textGeo.setAttribute('color', new THREE.BufferAttribute(textColorsArr, 3));

    const textMat = new THREE.PointsMaterial({
      size: 0.12,
      map: heartTexture,
      alphaMap: heartTexture,
      alphaTest: 0.3,
      vertexColors: true,
      blending: THREE.NormalBlending,
      depthWrite: false,
      transparent: true,
      opacity: 0.95,
      sizeAttenuation: true,
    });
    const textPoints = new THREE.Points(textGeo, textMat);
    scene.add(textPoints);

    // Background particles — smaller blue dots
    const bgN = N - textN;
    const bgPositions = new Float32Array(bgN * 3);
    const bgColorsArr = new Float32Array(bgN * 3);
    const bgColorLight = new THREE.Color('#93c5fd');
    const bgColorDim = new THREE.Color('#60a5fa');

    for (let i = textN; i < N; i++) {
      const j = i - textN;
      bgPositions[j * 3] = allParticles[i].x;
      bgPositions[j * 3 + 1] = allParticles[i].y;
      bgPositions[j * 3 + 2] = allParticles[i].z;
      const t = Math.abs(allParticles[i].ox) / 5;
      const c = bgColorLight.clone().lerp(bgColorDim, Math.min(t, 1))
        .offsetHSL(0, 0, (Math.random() - 0.5) * 0.15);
      bgColorsArr[j * 3] = c.r;
      bgColorsArr[j * 3 + 1] = c.g;
      bgColorsArr[j * 3 + 2] = c.b;
    }

    const bgGeo = new THREE.BufferGeometry();
    bgGeo.setAttribute('position', new THREE.BufferAttribute(bgPositions, 3));
    bgGeo.setAttribute('color', new THREE.BufferAttribute(bgColorsArr, 3));

    const bgMat = new THREE.PointsMaterial({
      size: 0.04,
      map: heartTexture,
      alphaMap: heartTexture,
      alphaTest: 0.3,
      vertexColors: true,
      blending: THREE.NormalBlending,
      depthWrite: false,
      transparent: true,
      opacity: 0.6,
      sizeAttenuation: true,
    });
    const bgPoints = new THREE.Points(bgGeo, bgMat);
    scene.add(bgPoints);

    const noisePhase = new Float32Array(N);
    for (let i = 0; i < N; i++) noisePhase[i] = Math.random() * Math.PI * 2;

    const textArr = textGeo.attributes.position.array as Float32Array;
    const bgArr = bgGeo.attributes.position.array as Float32Array;

    function animate() {
      animationId = requestAnimationFrame(animate);
      const t = clock.getElapsedTime();
      const dt = Math.min(clock.getDelta(), 0.1);
      const { rotSpeed: rs, diffusion: df, particleSize: ps } = paramsRef.current;

      const rotAngle = t * 0.35 * rs;
      const cosA = Math.cos(rotAngle);
      const sinA = Math.sin(rotAngle);

      raycaster.setFromCamera(mouseNDC, camera);
      const mouseOnPlane = new THREE.Vector3();
      raycaster.ray.intersectPlane(plane, mouseOnPlane);
      const rawX = mouseOnPlane ? mouseOnPlane.x : -999;
      const rawY = mouseOnPlane ? mouseOnPlane.y : -999;

      // lerp mouse position to match CustomCursor character lag
      smoothMouse.x += (rawX - smoothMouse.x) * 0.35;
      smoothMouse.y += (rawY - smoothMouse.y) * 0.35;
      const mx = smoothMouse.x;
      const my = smoothMouse.y;

      const influenceRadius = 2.0 * df;
      const force = 2.5 * df;

      for (let i = 0; i < N; i++) {
        const p = allParticles[i];
        const rx = p.ox * cosA - p.oz * sinA;
        const rz = p.ox * sinA + p.oz * cosA;
        const ry = p.oy;

        const dx = rx - mx;
        const dy = ry - my;
        const dist = Math.sqrt(dx * dx + dy * dy);

        let fx = 0, fy = 0;
        if (dist < influenceRadius && dist > 0.01) {
          const strength = (1 - dist / influenceRadius) * force;
          fx = (dx / dist) * strength;
          fy = (dy / dist) * strength;
        }

        const noise = Math.sin(t * 1.5 + noisePhase[i]) * 0.003;

        p.vx += (rx - p.x) * 3 * dt + fx * dt * 3;
        p.vy += (ry - p.y) * 3 * dt + fy * dt * 3;
        p.vz += (rz - p.z) * 3 * dt;

        p.vx *= 0.9;
        p.vy *= 0.9;
        p.vz *= 0.9;

        p.x += p.vx + noise;
        p.y += p.vy + noise * 0.5;
        p.z += p.vz;

        if (i < textN) {
          textArr[i * 3] = p.x;
          textArr[i * 3 + 1] = p.y;
          textArr[i * 3 + 2] = p.z;
        } else {
          const j = i - textN;
          bgArr[j * 3] = p.x;
          bgArr[j * 3 + 1] = p.y;
          bgArr[j * 3 + 2] = p.z;
        }
      }

      textGeo.attributes.position.needsUpdate = true;
      bgGeo.attributes.position.needsUpdate = true;
      textMat.size = ps * 0.12;
      bgMat.size = ps * 0.06;

      glowRing.rotation.z += dt * 0.3 * rs;
      const ringAlpha = 0.06 + Math.sin(t * 1.5) * 0.04;
      (glowRing.material as THREE.MeshBasicMaterial).opacity = ringAlpha;

      camera.position.x = Math.sin(t * 0.12) * 0.3;
      camera.position.y = Math.cos(t * 0.15) * 0.15;
      camera.lookAt(0, 0, 0);

      renderer.render(scene, camera);
    }
    animate();

    function onResize() {
      const r = mount.getBoundingClientRect();
      if (r.width === 0) return;
      renderer.setSize(r.width, r.height, false);
      camera.aspect = r.width / r.height;
      camera.updateProjectionMatrix();
    }
    window.addEventListener('resize', onResize);

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('resize', onResize);
      mount.removeEventListener('mousemove', updateMouse);
      mount.removeEventListener('touchmove', onTouchMove);
      mount.removeEventListener('mouseleave', onLeave);
      mount.removeEventListener('touchend', onLeave);
      mount.removeChild(renderer.domElement);
      textGeo.dispose();
      textMat.dispose();
      bgGeo.dispose();
      bgMat.dispose();
      heartTexture.dispose();
      scene.clear();
      renderer.dispose();
    };
  }, []);

  return (
    <div
      ref={mountRef}
      className="w-full h-full cursor-crosshair relative"
      onDoubleClick={() => setShowControls(!showControls)}
    >
      {showControls && (
        <div
          className="absolute top-2 right-2 z-10 p-3 space-y-3"
          style={{
            background: 'rgba(15, 23, 42, 0.9)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            border: '1px solid rgba(56, 189, 248, 0.2)',
            borderRadius: '1rem',
            minWidth: 180,
            fontSize: '11px',
          }}
        >
          <div className="flex items-center justify-between text-text-muted">
            <span>⚙ 参数控制</span>
            <button
              onClick={() => setShowControls(false)}
              className="text-text-muted hover:text-text-primary text-xs"
            >
              ✕
            </button>
          </div>

          <div>
            <div className="flex justify-between text-text-muted mb-1">
              <span>粒子大小</span>
              <span className="text-accent tabular-nums">{particleSize.toFixed(1)}</span>
            </div>
            <input
              type="range" min="0.2" max="3" step="0.1" value={particleSize}
              onChange={(e) => setParticleSize(parseFloat(e.target.value))}
              className="w-full h-1 bg-white/10 rounded-full appearance-none cursor-pointer"
              style={{ accentColor: '#38bdf8' }}
            />
          </div>

          <div>
            <div className="flex justify-between text-text-muted mb-1">
              <span>扩散强度</span>
              <span className="text-accent tabular-nums">{diffusion.toFixed(1)}</span>
            </div>
            <input
              type="range" min="0.1" max="3" step="0.1" value={diffusion}
              onChange={(e) => setDiffusion(parseFloat(e.target.value))}
              className="w-full h-1 bg-white/10 rounded-full appearance-none cursor-pointer"
              style={{ accentColor: '#38bdf8' }}
            />
          </div>

          <div>
            <div className="flex justify-between text-text-muted mb-1">
              <span>旋转速度</span>
              <span className="text-accent tabular-nums">{rotSpeed.toFixed(1)}</span>
            </div>
            <input
              type="range" min="0" max="4" step="0.1" value={rotSpeed}
              onChange={(e) => setRotSpeed(parseFloat(e.target.value))}
              className="w-full h-1 bg-white/10 rounded-full appearance-none cursor-pointer"
              style={{ accentColor: '#38bdf8' }}
            />
          </div>

          <p className="text-text-muted text-[10px] opacity-60">
            双击空白处隐藏面板
          </p>
        </div>
      )}
    </div>
  );
}
