'use client';

import { useEffect, useRef } from 'react';

/* ─── 微米级数字网配置 ─── */

const PARTICLE_COUNT = 450;
const CORNER_RATIO = 0.72;
const CORNER_CENTER_X = 0.88;
const CORNER_CENTER_Y = 0.88;
const CORNER_SPREAD = 0.22;

const REPULSION_RADIUS = 140;
const REPULSION_STRENGTH = 0.06;
const RETURN_LERP = 0.018;

/* 内容避让区：Hero 文字区域 */
const CONTENT_ZONE = { x: 0.5, y: 0.32, radius: 0.24 };
const CONTENT_FADE_OPACITY = 0.025;

/* 项目避让区：ESP32-S3 硬件展示区域 */
const PROJECT_ZONE = { x: 0.5, y: 0.62, radius: 0.30 };
const PROJECT_FADE_OPACITY = 0.03;

/* 薄荷绿主色 */
const MINT = { r: 167, g: 255, b: 235 };
const DARK_VIOLET = { r: 55, g: 38, b: 92 };
const DEEP_BLUE = { r: 22, g: 40, b: 82 };

const DARK_MATTER_RATIO = 0.78;
const HIGHLIGHT_CHANCE = 0.025;

/* 连线：极细 + 指数衰减 */
const CONNECTION_DIST = 55;
const CONNECTION_MAX_ALPHA = 0.14;
const LINE_WIDTH = 0.25;

/* 1px 内部微光 */
const GLOW_RADIUS = 1;

/* ─── helpers ─── */

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

function gaussianRandom() {
  let u = 0, v = 0;
  while (u === 0) u = Math.random();
  while (v === 0) v = Math.random();
  return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
}

/* ─── particle type ─── */

interface DustParticle {
  x: number;
  y: number;
  originX: number;
  originY: number;
  vx: number;
  vy: number;
  size: number;
  baseAlpha: number;
  color: { r: number; g: number; b: number };
  driftPhase: number;
  driftSpeed: number;
  wobblePhase: number;
  wobbleSpeed: number;
  isDarkMatter: boolean;
}

/* ─── main component ─── */

export default function BackgroundDust() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);

  const mouseRef = useRef({ x: -999, y: -999 });
  const visibleRef = useRef(false);
  const particlesRef = useRef<DustParticle[]>([]);

  /* ─── mouse tracking ─── */

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      mouseRef.current = { x: e.clientX, y: e.clientY };
      visibleRef.current = true;
    };
    const onLeave = () => { visibleRef.current = false; };

    window.addEventListener('mousemove', onMove);
    document.addEventListener('mouseleave', onLeave);

    return () => {
      window.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseleave', onLeave);
    };
  }, []);

  /* ─── Canvas dust ─── */

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      initParticles();
    };

    function initParticles() {
      const w = canvas.width;
      const h = canvas.height;
      const particles: DustParticle[] = [];

      const darkCount = Math.floor(PARTICLE_COUNT * DARK_MATTER_RATIO);

      for (let i = 0; i < PARTICLE_COUNT; i++) {
        const isCorner = i < PARTICLE_COUNT * CORNER_RATIO;
        let ox: number, oy: number;

        if (isCorner) {
          ox = w * CORNER_CENTER_X + gaussianRandom() * w * CORNER_SPREAD;
          oy = h * CORNER_CENTER_Y + gaussianRandom() * h * CORNER_SPREAD;
        } else {
          ox = Math.random() * w;
          oy = Math.random() * h;
        }

        const isDarkMatter = i < darkCount;
        const isHighlight = !isDarkMatter && Math.random() < HIGHLIGHT_CHANCE;

        let color: { r: number; g: number; b: number };
        let baseAlpha: number;
        let size: number;

        if (isDarkMatter) {
          color = Math.random() > 0.5 ? DARK_VIOLET : DEEP_BLUE;
          baseAlpha = 0.05 + Math.random() * 0.08;
          size = 0.3 + Math.random() * 0.3;
        } else {
          color = isHighlight ? MINT : DARK_VIOLET;
          baseAlpha = 0.18 + Math.random() * 0.08;
          size = 0.5 + Math.random() * 0.3;
        }

        particles.push({
          x: ox,
          y: oy,
          originX: ox,
          originY: oy,
          vx: 0,
          vy: 0,
          size,
          baseAlpha,
          color,
          driftPhase: Math.random() * Math.PI * 2,
          driftSpeed: 0.00012 + Math.random() * 0.00035,
          wobblePhase: Math.random() * Math.PI * 2,
          wobbleSpeed: 0.0008 + Math.random() * 0.0025,
          isDarkMatter,
        });
      }

      particlesRef.current = particles;
    }

    resize();
    window.addEventListener('resize', resize);

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const w = canvas.width;
      const h = canvas.height;
      const mx = mouseRef.current.x;
      const my = mouseRef.current.y;

      const particles = particlesRef.current;
      const contentCx = w * CONTENT_ZONE.x;
      const contentCy = h * CONTENT_ZONE.y;
      const contentR = Math.min(w, h) * CONTENT_ZONE.radius;
      const projectCx = w * PROJECT_ZONE.x;
      const projectCy = h * PROJECT_ZONE.y;
      const projectR = Math.min(w, h) * PROJECT_ZONE.radius;

      /* ── draw particles ── */
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];

        /* ── liquid wobble: 液体中悬浮的微小抖动 ── */
        p.wobblePhase += p.wobbleSpeed;
        const wobbleX = Math.sin(p.wobblePhase) * 0.35 + Math.sin(p.wobblePhase * 1.6) * 0.18;
        const wobbleY = Math.cos(p.wobblePhase * 0.7) * 0.25 + Math.cos(p.wobblePhase * 1.9) * 0.12;

        /* ── gentle drift ── */
        p.driftPhase += p.driftSpeed;
        const driftX = Math.sin(p.driftPhase) * 0.06;
        const driftY = Math.cos(p.driftPhase * 0.45) * 0.05;

        /* ── mild repulsion from mouse ── */
        let fx = 0, fy = 0;
        if (visibleRef.current) {
          const dx = p.x - mx;
          const dy = p.y - my;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < REPULSION_RADIUS && dist > 1) {
            const strength = (1 - dist / REPULSION_RADIUS) * REPULSION_STRENGTH;
            fx = (dx / dist) * strength;
            fy = (dy / dist) * strength;
          }
        }

        /* ── shape memory: slow return ── */
        p.vx += (p.originX - p.x) * RETURN_LERP + fx;
        p.vy += (p.originY - p.y) * RETURN_LERP + fy;
        p.vx *= 0.96;
        p.vy *= 0.96;

        p.x += p.vx + driftX + wobbleX;
        p.y += p.vy + driftY + wobbleY;

        /* ── content zone fade ── */
        const cdx = p.x - contentCx;
        const cdy = p.y - contentCy;
        const cDist = Math.sqrt(cdx * cdx + cdy * cdy);
        let contentFade = 1;
        if (cDist < contentR) {
          contentFade = CONTENT_FADE_OPACITY / p.baseAlpha;
        } else if (cDist < contentR * 1.6) {
          const t = (cDist - contentR) / (contentR * 0.6);
          contentFade = lerp(CONTENT_FADE_OPACITY / p.baseAlpha, 1, t);
        }

        /* ── project zone fade (ESP32-S3 区域) ── */
        const pdx = p.x - projectCx;
        const pdy = p.y - projectCy;
        const pDist = Math.sqrt(pdx * pdx + pdy * pdy);
        let projectFade = 1;
        if (pDist < projectR) {
          projectFade = PROJECT_FADE_OPACITY / p.baseAlpha;
        } else if (pDist < projectR * 1.5) {
          const t = (pDist - projectR) / (projectR * 0.5);
          projectFade = lerp(PROJECT_FADE_OPACITY / p.baseAlpha, 1, t);
        }

        /* ── edge feather ── */
        const edgeDist = Math.min(p.x, w - p.x, p.y, h - p.y);
        const edgeFade = Math.min(1, edgeDist / 60);
        if (edgeFade < 0.01) continue;

        const alpha = p.baseAlpha * contentFade * projectFade * edgeFade;
        if (alpha < 0.002) continue;

        /* ── 1px internal glow only: 无外部 shadowBlur ── */
        if (!p.isDarkMatter) {
          const glowR = Math.min(GLOW_RADIUS, p.size * 1.5);
          const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, glowR);
          grad.addColorStop(0, `rgba(${p.color.r},${p.color.g},${p.color.b},${alpha * 0.5})`);
          grad.addColorStop(1, 'transparent');

          ctx.beginPath();
          ctx.arc(p.x, p.y, glowR, 0, Math.PI * 2);
          ctx.fillStyle = grad;
          ctx.fill();
        }

        /* ── core dot: micron solder point ── */
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${p.color.r},${p.color.g},${p.color.b},${alpha})`;
        ctx.fill();
      }

      /* ── connections: exponential decay, only active particles ── */
      ctx.lineWidth = LINE_WIDTH;
      ctx.lineCap = 'round';

      for (let i = 0; i < particles.length; i++) {
        const a = particles[i];
        if (a.isDarkMatter) continue;

        for (let j = i + 1; j < particles.length; j++) {
          const b = particles[j];
          if (b.isDarkMatter) continue;

          const cdx = b.x - a.x;
          const cdy = b.y - a.y;
          const cdist = Math.sqrt(cdx * cdx + cdy * cdy);
          if (cdist < CONNECTION_DIST && cdist > 0) {
            const ratio = cdist / CONNECTION_DIST;
            /* 指数衰减：距离越大 opacity 越低 */
            const lineAlpha = CONNECTION_MAX_ALPHA * Math.exp(-ratio * ratio * 3.5);
            if (lineAlpha < 0.003) continue;

            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.strokeStyle = `rgba(${MINT.r},${MINT.g},${MINT.b},${lineAlpha})`;
            ctx.stroke();
          }
        }
      }

      animRef.current = requestAnimationFrame(draw);
    };

    animRef.current = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(animRef.current);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none"
      style={{ zIndex: -1 }}
    />
  );
}
