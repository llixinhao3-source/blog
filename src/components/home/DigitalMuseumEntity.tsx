'use client';

import { useRef, useState, useEffect, useCallback } from 'react';
import {
  motion,
  useScroll,
  useSpring,
  useTransform,
  useMotionValue,
  AnimatePresence,
  type MotionValue,
} from 'framer-motion';
import * as THREE from 'three';

const SVG_W = 500;
const SVG_H = 600;
const CX = SVG_W / 2;
const CY = SVG_H / 2;

const clamp01 = (v: number) => Math.max(0, Math.min(1, v));

/* ───── spring configs ───── */

const SCROLL_SPRING = { stiffness: 55, damping: 18, mass: 0.3 };
const CURSOR_SPRING = { stiffness: 160, damping: 24, mass: 0.5 };
const CURSOR_DOT_SPRING = { stiffness: 600, damping: 28, mass: 0.15 };
const MAGNETIC_RADIUS = 80;
const MAGNETIC_STRENGTH = 0.45;

/* ───── part config ───── */

interface PartConfig {
  id: string;
  label: string;
  image: string;
  backImage?: string;
  x: number;
  y: number;
  rotate: number;
  scale: number;
  opacity: number;
  labelSide: 'left' | 'right';
  description: string;
  width: number;
  zIndex: number;
}

const PARTS: PartConfig[] = [
  {
    id: 'upper-shell', label: '上壳体',
    image: '/xiaozhi/xiaozhi1.jpeg',
    x: -60, y: -200, rotate: -15, scale: 1, opacity: 1,
    labelSide: 'left', description: '3D 打印 PETG 外壳 · 圆润 Q 版造型',
    width: 200, zIndex: 10,
  },
  {
    id: 'faceplate', label: '面板',
    image: '/xiaozhi/xiaozhi1.jpeg',
    x: 0, y: -100, rotate: 0, scale: 1.05, opacity: 0.85,
    labelSide: 'right', description: 'IPS 1.54" 128×128 表情显示屏',
    width: 130, zIndex: 8,
  },
  {
    id: 'pcb', label: 'PCB 主板',
    image: '/xiaozhi/xiaozhi1.jpeg',
    backImage: '/xiaozhi/xiaozhi2.jpeg',
    x: 0, y: 0, rotate: 0, scale: 1, opacity: 1,
    labelSide: 'right', description: '嵌入式开发：主控 ESP32-S3N16R8，支持 WiFi 蓝牙与模型加速',
    width: 160, zIndex: 5,
  },
  {
    id: 'servo', label: '舵机',
    image: '/xiaozhi/xiaozhi2.jpeg',
    x: -100, y: 150, rotate: 12, scale: 0.95, opacity: 1,
    labelSide: 'left', description: 'SG90 微型舵机 · 头部旋转 180°',
    width: 100, zIndex: 3,
  },
  {
    id: 'mic-array', label: '麦克风阵列',
    image: '/xiaozhi/xiaozhi1.jpeg',
    x: 100, y: 150, rotate: -10, scale: 0.95, opacity: 1,
    labelSide: 'right', description: 'INMP441 × 2 · I2S 数字麦克风 · 波束成形',
    width: 110, zIndex: 3,
  },
  {
    id: 'speaker', label: '扬声器',
    image: '/xiaozhi/xiaozhi2.jpeg',
    x: 80, y: 200, rotate: 8, scale: 0.9, opacity: 1,
    labelSide: 'right', description: '28mm 全频喇叭 · I2S 功放 · 3W 输出',
    width: 100, zIndex: 3,
  },
  {
    id: 'battery', label: '电池',
    image: '/xiaozhi/xiaozhi1.jpeg',
    x: -80, y: 200, rotate: -5, scale: 0.85, opacity: 1,
    labelSide: 'left', description: 'LiPo 3.7V 1000mAh · TP4056 充电保护',
    width: 90, zIndex: 3,
  },
  {
    id: 'lower-shell', label: '下壳体',
    image: '/xiaozhi/xiaozhi2.jpeg',
    x: 60, y: 230, rotate: 10, scale: 0.9, opacity: 1,
    labelSide: 'right', description: '底座壳体 · USB-C 接口 · 扬声器格栅',
    width: 180, zIndex: 2,
  },
];

/* ───── data cards config ───── */

const RADAR_AXES = [
  { name: '嵌入式开发', level: 85 },
  { name: 'AI Agent', level: 80 },
  { name: '硬件结构', level: 70 },
  { name: '模型微调', level: 65 },
  { name: '后端架构', level: 90 },
];

const SKILL_MODULES = [
  { category: 'AI Agent', color: '#c084fc', skills: ['LangChain', 'MCP 协议', 'Agent 编排', 'RAG 检索'] },
  { category: '嵌入式', color: '#38bdf8', skills: ['ESP32-S3', 'I2S 音频', 'FreeRTOS', 'GPIO 驱动'] },
  { category: '后端', color: '#a78bfa', skills: ['Python 异步', 'MQTT 消息', 'WebSocket', '流式推理'] },
  { category: '大模型', color: '#e879f9', skills: ['LoRA 微调', '提示工程', '向量嵌入', 'Sentence-BERT'] },
];

/* ───── Three.js starfield ───── */

function createHeartTexture(): THREE.CanvasTexture {
  const size = 64;
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const ctx = c.getContext('2d')!;
  ctx.fillStyle = '#fff';
  ctx.beginPath();
  const cx2 = size / 2, cy2 = size / 2 + 8;
  ctx.moveTo(cx2, cy2 + 10);
  ctx.bezierCurveTo(cx2 - 14, cy2 + 3, cx2 - 24, cy2 - 14, cx2, cy2 - 20);
  ctx.bezierCurveTo(cx2 + 24, cy2 - 14, cx2 + 14, cy2 + 3, cx2, cy2 + 10);
  ctx.fill();
  const tex = new THREE.CanvasTexture(c);
  tex.needsUpdate = true;
  return tex;
}

interface ParticleData {
  scattered: THREE.Vector3;
  converged: THREE.Vector3;
}

function useStarfield(
  containerRef: React.RefObject<HTMLDivElement | null>,
  convergence: MotionValue<number>,
) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const particlesRef = useRef<ParticleData[]>([]);
  const bgPositionsRef = useRef<Float32Array | null>(null);
  const bgColorsRef = useRef<Float32Array | null>(null);
  const bgGeoRef = useRef<THREE.BufferGeometry | null>(null);
  const animIdRef = useRef<number>(0);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = container.getBoundingClientRect();
    let w = rect.width;
    let h = rect.height;
    if (w === 0) w = SVG_W;
    if (h === 0) h = SVG_H;

    const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: false });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(w, h, false);

    const scene = new THREE.Scene();
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(38, w / h, 0.5, 40);
    camera.position.z = 7;
    camera.lookAt(0, 0, 0);

    const COUNT = 5000;
    const positions = new Float32Array(COUNT * 3);
    const colors = new Float32Array(COUNT * 3);
    const particles: ParticleData[] = [];

    const palettes = [
      [0xc0, 0x84, 0xfc],
      [0xa7, 0x8b, 0xfa],
      [0x38, 0xbd, 0xf8],
      [0xe8, 0x79, 0xf9],
    ];

    for (let i = 0; i < COUNT; i++) {
      const scattered = new THREE.Vector3(
        (Math.random() - 0.5) * 7,
        (Math.random() - 0.5) * 7,
        (Math.random() - 0.5) * 6,
      );
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const r = 0.4 + Math.random() * 1.2;
      const converged = new THREE.Vector3(
        r * Math.sin(phi) * Math.cos(theta),
        r * Math.sin(phi) * Math.sin(theta),
        r * Math.cos(phi),
      );
      particles.push({ scattered, converged });

      positions[i * 3] = scattered.x;
      positions[i * 3 + 1] = scattered.y;
      positions[i * 3 + 2] = scattered.z;

      const [pr, pg, pb] = palettes[Math.floor(Math.random() * palettes.length)];
      colors[i * 3] = pr / 255;
      colors[i * 3 + 1] = pg / 255;
      colors[i * 3 + 2] = pb / 255;
    }

    particlesRef.current = particles;
    bgPositionsRef.current = positions;
    bgColorsRef.current = colors;

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    bgGeoRef.current = geo;

    const heartTex = createHeartTexture();
    const mat = new THREE.PointsMaterial({
      size: 0.06,
      map: heartTex,
      vertexColors: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      opacity: 0.55,
      transparent: true,
    });

    const points = new THREE.Points(geo, mat);
    scene.add(points);

    let convergenceVal = 0;
    const unsub = convergence.on('change', (v: number) => {
      convergenceVal = clamp01(v);
    });

    const clock = new THREE.Clock();

    function animate() {
      const t = clock.getElapsedTime();
      const c = convergenceVal;
      const posArr = bgPositionsRef.current;
      const ptcls = particlesRef.current;

      if (posArr && ptcls) {
        for (let i = 0; i < COUNT; i++) {
          const { scattered, converged } = ptcls[i];
          const sc = scattered;
          const cv = converged;

          const rotAngle = t * 0.15 * (1 - c);
          const rx = sc.x * Math.cos(rotAngle) - sc.z * Math.sin(rotAngle);
          const rz = sc.x * Math.sin(rotAngle) + sc.z * Math.cos(rotAngle);

          const fromX = rx;
          const fromY = sc.y + Math.sin(t * 0.8 + i * 0.01) * 0.3 * (1 - c);
          const fromZ = rz;

          posArr[i * 3] = fromX + (cv.x - fromX) * c;
          posArr[i * 3 + 1] = fromY + (cv.y - fromY) * c;
          posArr[i * 3 + 2] = fromZ + (cv.z - fromZ) * c;
        }
        geo.attributes.position.needsUpdate = true;
      }

      mat.opacity = 0.2 + c * 0.35 + (1 - c) * 0.15;
      camera.position.y = Math.sin(t * 0.12) * 0.3 * (1 - c);

      renderer.render(scene, camera);
      animIdRef.current = requestAnimationFrame(animate);
    }

    animate();

    return () => {
      unsub();
      cancelAnimationFrame(animIdRef.current);
      renderer.dispose();
      geo.dispose();
      mat.dispose();
      heartTex.dispose();
    };
  }, [containerRef, convergence]);

  return canvasRef;
}

/* ───── exploded part sub-component ───── */

function ExplodedPart({
  part,
  index,
  explodeProgress,
  labelsVisible,
  pcbFlipped,
  setPcbFlipped,
  pcbGlow,
}: {
  part: PartConfig;
  index: number;
  explodeProgress: MotionValue<number>;
  labelsVisible: MotionValue<number>;
  pcbFlipped: boolean;
  setPcbFlipped: (v: boolean) => void;
  pcbGlow: MotionValue<number>;
}) {
  const x = useTransform(explodeProgress, (v) => part.x * clamp01(v));
  const y = useTransform(explodeProgress, (v) => part.y * clamp01(v));
  const rotate = useTransform(explodeProgress, (v) => part.rotate * clamp01(v));
  const scale = useTransform(explodeProgress, (v) => 1 + (part.scale - 1) * clamp01(v));
  const opacity = useTransform(explodeProgress, (v) => 1 - (1 - part.opacity) * clamp01(v));

  const isPcb = part.id === 'pcb';

  const glowAlpha = useTransform(pcbGlow, (v) => v);
  const glowColor = useTransform(
    pcbGlow,
    (v: number) => `drop-shadow(0 0 ${8 + v * 20}px rgba(192,132,252,${0.2 + v * 0.6})) drop-shadow(0 0 ${16 + v * 36}px rgba(167,139,250,${0.1 + v * 0.4}))`,
  );

  return (
    <motion.div
      className="absolute"
      style={{
        left: '50%',
        top: '50%',
        transform: 'translate(-50%, -50%)',
        zIndex: part.zIndex,
        x,
        y,
        rotate,
        scale,
        opacity,
      }}
    >
      {isPcb ? (
        <div style={{ perspective: 800 }}>
          <motion.div
            animate={{ rotateY: pcbFlipped ? 180 : 0 }}
            transition={{ duration: 0.8, ease: [0.23, 1, 0.32, 1] }}
            style={{ transformStyle: 'preserve-3d' }}
          >
            <motion.img
              src={part.image}
              alt={part.label}
              className="select-none"
              style={{
                width: part.width,
                height: 'auto',
                objectFit: 'contain',
                backfaceVisibility: 'hidden',
                borderRadius: 8,
                cursor: 'pointer',
                filter: glowColor,
              }}
              onClick={() => setPcbFlipped(!pcbFlipped)}
              whileTap={{ scale: 0.97 }}
            />
            {part.backImage && (
              <img
                src={part.backImage}
                alt=""
                style={{
                  position: 'absolute',
                  inset: 0,
                  width: part.width,
                  height: 'auto',
                  objectFit: 'contain',
                  backfaceVisibility: 'hidden',
                  transform: 'rotateY(180deg)',
                  borderRadius: 8,
                  pointerEvents: 'none',
                }}
              />
            )}
          </motion.div>
        </div>
      ) : (
        <img
          src={part.image}
          alt={part.label}
          className="select-none pointer-events-auto"
          style={{
            width: part.width,
            height: 'auto',
            objectFit: 'contain',
            borderRadius: 8,
          }}
        />
      )}

      <motion.div
        className="absolute pointer-events-none"
        style={{
          opacity: labelsVisible,
          [part.labelSide === 'left' ? 'right' : 'left']: '100%',
          top: '50%',
          transform: 'translateY(-50%)',
          marginLeft: part.labelSide === 'right' ? 12 : 0,
          marginRight: part.labelSide === 'left' ? 12 : 0,
          whiteSpace: 'nowrap',
        }}
      >
        <motion.div
          className="text-xs font-medium px-2 py-1 rounded-md"
          style={{
            background: 'rgba(15,23,42,0.7)',
            backdropFilter: 'blur(8px)',
            border: '1px solid rgba(192,132,252,0.15)',
            fontFamily: "'JetBrains Mono', monospace",
          }}
          animate={{ y: [0, -3, 0] }}
          transition={{
            duration: 2.5,
            repeat: Infinity,
            ease: 'easeInOut',
            delay: index * 0.2,
          }}
        >
          <span
            style={{
              background: 'linear-gradient(90deg, #e879f9, #34d399)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            {part.label}
          </span>
        </motion.div>
      </motion.div>
    </motion.div>
  );
}

/* ───── data cards sub-components ───── */

function RadarCard({
  isVisible,
  dataProgress,
  sceneOffset,
}: {
  isVisible: MotionValue<number>;
  dataProgress: MotionValue<number>;
  sceneOffset: { x: number; y: number };
}) {
  const R = 70;
  const RCX = 90;
  const RCY = 90;
  const levels = 5;

  const axisEndpoints = RADAR_AXES.map((axis, i) => {
    const angle = (Math.PI * 2 * i) / RADAR_AXES.length - Math.PI / 2;
    return {
      x: RCX + Math.cos(angle) * R * (axis.level / 100),
      y: RCY + Math.sin(angle) * R * (axis.level / 100),
      ax: RCX + Math.cos(angle) * R,
      ay: RCY + Math.sin(angle) * R,
      angle,
      name: axis.name,
      level: axis.level,
    };
  });

  const polygonPoints = axisEndpoints.map((ep) => `${ep.x},${ep.y}`).join(' ');

  const gridPolygons = Array.from({ length: levels }, (_, lv) => {
    const r = (R * (lv + 1)) / levels;
    return RADAR_AXES.map((_, i) => {
      const a = (Math.PI * 2 * i) / RADAR_AXES.length - Math.PI / 2;
      return `${RCX + Math.cos(a) * r},${RCY + Math.sin(a) * r}`;
    }).join(' ');
  });

  const cardScale = useTransform(dataProgress, (v) => 0.7 + clamp01(v) * 0.3);

  return (
    <motion.div
      className="absolute pointer-events-auto"
      style={{
        left: '50%',
        top: '50%',
        x: sceneOffset.x,
        y: sceneOffset.y - 40,
        opacity: isVisible,
        scale: cardScale,
        zIndex: 15,
      }}
      data-magnetic="radar"
    >
      <div
        className="p-4 rounded-2xl"
        style={{
          background: 'rgba(15,23,42,0.65)',
          backdropFilter: 'blur(16px) saturate(140%)',
          WebkitBackdropFilter: 'blur(16px) saturate(140%)',
          border: '1px solid rgba(192,132,252,0.12)',
          boxShadow: '0 4px 32px rgba(0,0,0,0.3), 0 0 40px rgba(192,132,252,0.06)',
          width: 190,
        }}
      >
        <div
          className="text-[10px] font-medium mb-2 text-center"
          style={{
            fontFamily: "'JetBrains Mono', monospace",
            color: '#94a3b8',
          }}
        >
          技能雷达
        </div>
        <svg viewBox="0 0 180 190" style={{ width: '100%', height: 'auto' }}>
          {gridPolygons.map((pts, lv) => (
            <polygon
              key={`g-${lv}`}
              points={pts}
              fill="none"
              stroke="rgba(255,255,255,0.06)"
              strokeWidth={0.5}
            />
          ))}
          {RADAR_AXES.map((_, i) => {
            const a = (Math.PI * 2 * i) / RADAR_AXES.length - Math.PI / 2;
            return (
              <line
                key={`ax-${i}`}
                x1={RCX}
                y1={RCY}
                x2={RCX + Math.cos(a) * R}
                y2={RCY + Math.sin(a) * R}
                stroke="rgba(255,255,255,0.06)"
                strokeWidth={0.5}
              />
            );
          })}
          <motion.polygon
            points={polygonPoints}
            fill="rgba(192,132,252,0.08)"
            stroke="#c084fc"
            strokeWidth={1}
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{
              delay: 0.6,
              duration: 0.8,
              ease: [0.25, 0.1, 0.25, 1],
            }}
            style={{ transformOrigin: `${RCX}px ${RCY}px` }}
          />
          {axisEndpoints.map((ep, i) => (
            <circle
              key={`dot-${i}`}
              cx={ep.x}
              cy={ep.y}
              r={3}
              fill="#c084fc"
              opacity={0.8}
            />
          ))}
          {axisEndpoints.map((ep, i) => (
            <text
              key={`lbl-${i}`}
              x={ep.ax + Math.cos(ep.angle) * 14}
              y={ep.ay + Math.sin(ep.angle) * 14}
              textAnchor="middle"
              dominantBaseline="middle"
              fill="#94a3b8"
              fontSize={8}
              fontFamily="'JetBrains Mono', monospace"
            >
              {ep.name}
            </text>
          ))}
        </svg>
        <div className="flex flex-wrap justify-center gap-1 mt-2">
          {axisEndpoints.map((ep) => (
            <span
              key={ep.name}
              className="text-[9px] px-1.5 py-0.5 rounded"
              style={{
                background: 'rgba(192,132,252,0.08)',
                color: '#c084fc',
                fontFamily: "'JetBrains Mono', monospace",
              }}
            >
              {ep.name}:{ep.level}%
            </span>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

function SkillMatrixCard({
  isVisible,
  dataProgress,
  sceneOffset,
}: {
  isVisible: MotionValue<number>;
  dataProgress: MotionValue<number>;
  sceneOffset: { x: number; y: number };
}) {
  const cardScale = useTransform(dataProgress, (v) => 0.7 + clamp01(v) * 0.3);

  return (
    <motion.div
      className="absolute pointer-events-auto"
      style={{
        left: '50%',
        top: '50%',
        x: sceneOffset.x,
        y: sceneOffset.y - 60,
        opacity: isVisible,
        scale: cardScale,
        zIndex: 16,
      }}
      data-magnetic="skills"
    >
      <div
        className="p-4 rounded-2xl"
        style={{
          background: 'rgba(15,23,42,0.65)',
          backdropFilter: 'blur(16px) saturate(140%)',
          WebkitBackdropFilter: 'blur(16px) saturate(140%)',
          border: '1px solid rgba(56,189,248,0.12)',
          boxShadow: '0 4px 32px rgba(0,0,0,0.3), 0 0 40px rgba(56,189,248,0.06)',
          width: 210,
        }}
      >
        <div
          className="text-[10px] font-medium mb-2 text-center"
          style={{
            fontFamily: "'JetBrains Mono', monospace",
            color: '#94a3b8',
          }}
        >
          技能矩阵
        </div>
        <div className="flex flex-col gap-2">
          {SKILL_MODULES.map((mod) => (
            <div key={mod.category}>
              <div className="flex items-center gap-1.5 mb-1">
                <span
                  className="w-1.5 h-1.5 rounded-full shrink-0"
                  style={{ background: mod.color }}
                />
                <span
                  className="text-[9px] font-medium"
                  style={{ color: mod.color, fontFamily: "'JetBrains Mono', monospace" }}
                >
                  {mod.category}
                </span>
              </div>
              <div className="flex flex-wrap gap-1">
                {mod.skills.map((sk) => (
                  <span
                    key={sk}
                    className="text-[8px] px-1.5 py-0.5 rounded"
                    style={{
                      background: `${mod.color}14`,
                      color: '#94a3b8',
                      border: `1px solid ${mod.color}22`,
                      fontFamily: "'JetBrains Mono', monospace",
                    }}
                  >
                    {sk}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

/* ───── frosted cursor ───── */

function FrostedCursor({ containerRef }: { containerRef: React.RefObject<HTMLDivElement | null> }) {
  const [inside, setInside] = useState(false);
  const [hoveringMagnetic, setHoveringMagnetic] = useState(false);
  const [magneticCenter, setMagneticCenter] = useState({ x: 0, y: 0 });

  const rawX = useMotionValue(-100);
  const rawY = useMotionValue(-100);
  const springX = useSpring(rawX, CURSOR_SPRING);
  const springY = useSpring(rawY, CURSOR_SPRING);
  const dotX = useSpring(rawX, CURSOR_DOT_SPRING);
  const dotY = useSpring(rawY, CURSOR_DOT_SPRING);

  const ringSize = useTransform(
    useMotionValue(hoveringMagnetic ? 1 : 0),
    (v: number) => 40 + v * 24,
  );

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const onMove = (e: MouseEvent) => {
      rawX.set(e.clientX);
      rawY.set(e.clientY);

      const target = e.target as HTMLElement;
      const magnetEl = target?.closest('[data-magnetic]') as HTMLElement | null;
      if (magnetEl) {
        const rect = magnetEl.getBoundingClientRect();
        setMagneticCenter({
          x: rect.left + rect.width / 2,
          y: rect.top + rect.height / 2,
        });
        setHoveringMagnetic(true);
      } else {
        setHoveringMagnetic(false);
      }
    };

    const onEnter = () => setInside(true);
    const onLeave = () => {
      setInside(false);
      setHoveringMagnetic(false);
    };

    container.addEventListener('mouseenter', onEnter);
    container.addEventListener('mouseleave', onLeave);
    window.addEventListener('mousemove', onMove);

    return () => {
      container.removeEventListener('mouseenter', onEnter);
      container.removeEventListener('mouseleave', onLeave);
      window.removeEventListener('mousemove', onMove);
    };
  }, [containerRef, rawX, rawY]);

  const x = useTransform(() => {
    if (hoveringMagnetic) {
      return springX.get() + (magneticCenter.x - springX.get()) * MAGNETIC_STRENGTH;
    }
    return springX.get();
  });

  const y = useTransform(() => {
    if (hoveringMagnetic) {
      return springY.get() + (magneticCenter.y - springY.get()) * MAGNETIC_STRENGTH;
    }
    return springY.get();
  });

  if (!inside) return null;

  return (
    <>
      <motion.div
        className="fixed pointer-events-none"
        style={{
          x,
          y,
          zIndex: 10000,
          width: ringSize,
          height: ringSize,
          borderRadius: '50%',
          marginLeft: useTransform(ringSize, (s) => -s / 2),
          marginTop: useTransform(ringSize, (s) => -s / 2),
        }}
      >
        <div
          style={{
            width: '100%',
            height: '100%',
            borderRadius: '50%',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            border: '1.5px solid transparent',
            borderImage: 'linear-gradient(135deg, #e879f9, #38bdf8) 1',
            boxShadow: '0 0 30px rgba(192,132,252,0.15), inset 0 0 20px rgba(255,255,255,0.03)',
          }}
        />
        <motion.div
          className="absolute rounded-full"
          style={{
            left: '50%',
            top: '50%',
            width: 6,
            height: 6,
            marginLeft: -3,
            marginTop: -3,
            background: 'radial-gradient(circle, #c084fc, #38bdf8)',
            boxShadow: '0 0 12px rgba(192,132,252,0.6), 0 0 4px rgba(192,132,252,0.4)',
          }}
          animate={{
            x: useTransform(() => (rawX.get() - springX.get()) * 0.5),
            y: useTransform(() => (rawY.get() - springY.get()) * 0.5),
          }}
          transition={{ type: 'spring', stiffness: 300, damping: 25 }}
        />
      </motion.div>
    </>
  );
}

/* ───── main component ───── */

export default function DigitalMuseumEntity() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [pcbFlipped, setPcbFlipped] = useState(false);
  const [showPcbModal, setShowPcbModal] = useState(false);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start end', 'end start'],
  });

  const smoothScroll = useSpring(scrollYProgress, SCROLL_SPRING);

  /* ── phase progressions ── */
  const convergenceProgress = useTransform(smoothScroll, [0.0, 0.2], [0, 1]);
  const explodeProgress = useTransform(smoothScroll, [0.18, 0.50], [0, 1]);
  const pcbGlowIntensity = useTransform(smoothScroll, [0.2, 0.6], [0, 1]);
  const dataProgress = useTransform(smoothScroll, [0.50, 0.78], [0, 1]);
  const dataVisible = useTransform(smoothScroll, [0.52, 0.60], [0, 1]);
  const labelsVisible = useTransform(smoothScroll, [0.30, 0.42], [0, 1]);
  const leaderLinePartProgress = useTransform(smoothScroll, [0.22, 0.50], [0, 1]);
  const leaderLineDataProgress = useTransform(smoothScroll, [0.52, 0.78], [0, 1]);
  const hintOpacity = useTransform(smoothScroll, [0.02, 0.10, 0.40, 0.52], [0, 1, 1, 0]);

  const canvasRef = useStarfield(containerRef, convergenceProgress);

  const handlePcbClick = useCallback(() => {
    if (!pcbFlipped) {
      setPcbFlipped(true);
      setTimeout(() => setShowPcbModal(true), 600);
    } else {
      setPcbFlipped(false);
      setShowPcbModal(false);
    }
  }, [pcbFlipped]);

  return (
    <div ref={containerRef} className="relative" style={{ height: 900 }}>
      <div
        className="sticky top-0 flex items-center justify-center overflow-hidden"
        style={{ height: '100vh' }}
      >
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full pointer-events-none"
          style={{ zIndex: 0 }}
        />

        <div className="relative" style={{ width: SVG_W, height: SVG_H, zIndex: 1 }}>
          {/* ── leader lines: parts ── */}
          <svg
            className="absolute inset-0 w-full h-full pointer-events-none"
            viewBox={`0 0 ${SVG_W} ${SVG_H}`}
            style={{ zIndex: 2 }}
          >
            <defs>
              {PARTS.map((part) => (
                <linearGradient
                  key={`pg-${part.id}`}
                  id={`pg-${part.id}`}
                  gradientUnits="userSpaceOnUse"
                  x1={CX} y1={CY}
                  x2={CX + part.x} y2={CY + part.y}
                >
                  <stop offset="0%" stopColor="#c084fc" stopOpacity="0" />
                  <stop offset="60%" stopColor="#c084fc" stopOpacity="0.12" />
                  <stop offset="100%" stopColor="#34d399" stopOpacity="0.35" />
                </linearGradient>
              ))}
              {/* data leader gradients */}
              <linearGradient id="ldg-radar" gradientUnits="userSpaceOnUse" x1={CX - 100} y1={CY + 150} x2={-140 + CX} y2={20 + CY}>
                <stop offset="0%" stopColor="#c084fc" stopOpacity="0" />
                <stop offset="50%" stopColor="#c084fc" stopOpacity="0.3" />
                <stop offset="100%" stopColor="#c084fc" stopOpacity="0.6" />
              </linearGradient>
              <linearGradient id="ldg-skills" gradientUnits="userSpaceOnUse" x1={CX + 100} y1={CY + 150} x2={130 + CX} y2={(-60 + CY)}>
                <stop offset="0%" stopColor="#38bdf8" stopOpacity="0" />
                <stop offset="50%" stopColor="#38bdf8" stopOpacity="0.25" />
                <stop offset="100%" stopColor="#38bdf8" stopOpacity="0.55" />
              </linearGradient>
            </defs>
            {PARTS.map((part) => (
              <motion.path
                key={`pl-${part.id}`}
                d={`M ${CX} ${CY} L ${CX + part.x} ${CY + part.y}`}
                stroke={`url(#pg-${part.id})`}
                strokeWidth={0.8}
                fill="none"
                strokeLinecap="round"
                style={{ pathLength: leaderLinePartProgress }}
              />
            ))}
            <motion.path
              d={`M ${CX - 100} ${CY + 150} L ${-140 + CX} ${20 + CY}`}
              stroke="url(#ldg-radar)"
              strokeWidth={0.8}
              fill="none"
              strokeLinecap="round"
              style={{ pathLength: leaderLineDataProgress }}
            />
            <motion.path
              d={`M ${CX + 100} ${CY + 150} L ${130 + CX} ${-40 + CY}`}
              stroke="url(#ldg-skills)"
              strokeWidth={0.8}
              fill="none"
              strokeLinecap="round"
              style={{ pathLength: leaderLineDataProgress }}
            />
          </svg>

          {/* ── parts ── */}
          {PARTS.map((part, i) => (
            <ExplodedPart
              key={part.id}
              part={part}
              index={i}
              explodeProgress={explodeProgress}
              labelsVisible={labelsVisible}
              pcbFlipped={pcbFlipped}
              setPcbFlipped={setPcbFlipped}
              pcbGlow={pcbGlowIntensity}
            />
          ))}

          {/* ── data cards ── */}
          <RadarCard
            isVisible={dataVisible}
            dataProgress={dataProgress}
            sceneOffset={{ x: -140, y: 20 }}
          />
          <SkillMatrixCard
            isVisible={dataVisible}
            dataProgress={dataProgress}
            sceneOffset={{ x: 130, y: -60 }}
          />

          {/* ── PCB modal ── */}
          <AnimatePresence>
            {showPcbModal && (
              <motion.div
                className="absolute inset-0 flex items-center justify-center"
                style={{ zIndex: 50 }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => {
                  setShowPcbModal(false);
                  setPcbFlipped(false);
                }}
              >
                <motion.div
                  className="p-6 rounded-2xl max-w-sm"
                  style={{
                    background: 'rgba(15,23,42,0.75)',
                    backdropFilter: 'blur(24px) saturate(180%)',
                    WebkitBackdropFilter: 'blur(24px) saturate(180%)',
                    border: '1px solid rgba(255,255,255,0.12)',
                    boxShadow: '0 8px 32px rgba(0,0,0,0.4), 0 0 80px rgba(192,132,252,0.08)',
                  }}
                  initial={{ scale: 0.85, y: 20 }}
                  animate={{ scale: 1, y: 0 }}
                  exit={{ scale: 0.85, y: 20 }}
                  transition={{ duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <h3
                    className="text-sm font-semibold mb-2"
                    style={{
                      fontFamily: "'JetBrains Mono', monospace",
                      background: 'linear-gradient(90deg, #c084fc, #38bdf8)',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                    }}
                  >
                    ESP32-S3N16R8
                  </h3>
                  <p className="text-xs leading-relaxed" style={{ color: '#94a3b8' }}>
                    嵌入式开发：主控 ESP32-S3N16R8，支持 WiFi 蓝牙与模型加速。
                    16MB Flash + 8MB PSRAM，Xtensa LX7 双核 240MHz。
                  </p>
                  <div className="mt-3 flex gap-2 flex-wrap">
                    {['WiFi 6', 'BLE 5.0', '向量指令', '8MB PSRAM'].map((tag) => (
                      <span
                        key={tag}
                        className="text-[10px] px-2 py-0.5 rounded-full"
                        style={{
                          background: 'rgba(192,132,252,0.1)',
                          color: '#c084fc',
                          border: '1px solid rgba(192,132,252,0.15)',
                        }}
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                  <button
                    className="mt-4 text-xs transition-opacity hover:opacity-80"
                    style={{ color: '#64748b' }}
                    onClick={() => {
                      setShowPcbModal(false);
                      setPcbFlipped(false);
                    }}
                  >
                    关闭
                  </button>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── hint ── */}
          <motion.div
            className="absolute bottom-4 left-1/2 -translate-x-1/2 text-xs z-20"
            style={{
              opacity: hintOpacity,
              color: '#64748b',
              fontFamily: "'JetBrains Mono', monospace",
            }}
          >
            ↓ 滚动探索 · 点击 PCB 翻转
          </motion.div>
        </div>
      </div>

      <FrostedCursor containerRef={containerRef} />
    </div>
  );
}
