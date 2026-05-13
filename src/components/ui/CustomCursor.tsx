'use client';

import { useEffect, useRef } from 'react';

const LERP_FACTOR = 0.35;
const RING_RADIUS = 40;
const PARTICLE_COUNT = 24;
const MAX_STRETCH = 40;
const STRETCH_LERP = 0.15;
const LINK_DIST = 30;
const SCALE_LERP = 0.06;
const MIN_SCALE = 0.55;
const MAX_SCALE = 2.2;
const SPEED_SCALE_FACTOR = 0.004;

const COLORS = [
  '#5eead4', '#6ee7b7', '#a7f3d0', '#d1fae5',
  '#fbcfe8', '#f9a8d4', '#e9d5ff', '#c4b5fd',
  '#a5b4fc', '#93c5fd', '#7dd3fc', '#67e8f9',
  '#5eead4', '#6ee7b7', '#a7f3d0', '#d1fae5',
  '#fbcfe8', '#f9a8d4', '#e9d5ff', '#c4b5fd',
  '#a5b4fc', '#93c5fd', '#7dd3fc', '#67e8f9',
];

interface ParticleData {
  angle: number;
  x: number; y: number;
}

function drawHeart(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.scale(r / 6, r / 6);
  ctx.beginPath();
  ctx.moveTo(0, -1.5);
  ctx.bezierCurveTo(-2.5, -4, -6, -1.5, 0, 4);
  ctx.bezierCurveTo(6, -1.5, 2.5, -4, 0, -1.5);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

export default function CustomCursor() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const charRef = useRef<HTMLDivElement>(null);
  const bubbleRef = useRef<HTMLDivElement>(null);

  const posRef = useRef({ x: -100, y: -100 });
  const velRef = useRef({ x: 0, y: 0 });
  const smoothRef = useRef({ x: -100, y: -100 });
  const stretchRef = useRef({ x: 0, y: 0 });
  const hoveringRef = useRef(false);
  const isHoverTargetRef = useRef(false);
  const showBubbleRef = useRef(false);
  const hoverLeaveTimerRef = useRef<ReturnType<typeof setTimeout>>();
  const animFrameRef = useRef(0);
  const timestampRef = useRef(0);
  const globalAngleRef = useRef(0);
  const particleScaleRef = useRef(1);

  const particlesRef = useRef<ParticleData[]>(
    Array.from({ length: PARTICLE_COUNT }, (_, i) => ({
      angle: (i / PARTICLE_COUNT) * Math.PI * 2,
      x: 0, y: 0,
    }))
  );

  useEffect(() => {
    const charEl = charRef.current;
    const bubbleEl = bubbleRef.current;
    const canvas = canvasRef.current;
    if (!canvas || !charEl || !bubbleEl) return;
    const ctx = canvas.getContext('2d')!;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    const onMove = (e: MouseEvent) => {
      const px = e.clientX;
      const py = e.clientY;
      velRef.current.x = px - posRef.current.x;
      velRef.current.y = py - posRef.current.y;
      posRef.current.x = px;
      posRef.current.y = py;

      const target = e.target as HTMLElement;
      const isTarget = !!(target && (
        target.tagName === 'A' || target.tagName === 'BUTTON' ||
        target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' ||
        target.closest('a, button, [role="button"], input, textarea')
      ));

      if (isTarget && !isHoverTargetRef.current) {
        isHoverTargetRef.current = true;
        hoveringRef.current = true;
        showBubbleRef.current = true;
        bubbleEl.style.display = '';
        clearTimeout(hoverLeaveTimerRef.current);
      } else if (!isTarget && isHoverTargetRef.current) {
        isHoverTargetRef.current = false;
        hoveringRef.current = false;
        hoverLeaveTimerRef.current = setTimeout(() => {
          showBubbleRef.current = false;
          bubbleEl.style.display = 'none';
        }, 600);
      }
    };

    const onLeave = () => {
      posRef.current.x = -100;
      posRef.current.y = -100;
      velRef.current.x = 0;
      velRef.current.y = 0;
      isHoverTargetRef.current = false;
      hoveringRef.current = false;
      hoverLeaveTimerRef.current = setTimeout(() => {
        showBubbleRef.current = false;
        bubbleEl.style.display = 'none';
      }, 600);
    };

    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseleave', onLeave);

    const draw = (ts: number) => {
      animFrameRef.current = requestAnimationFrame(draw);
      const dt = Math.min((ts - (timestampRef.current || ts)) / 1000, 0.05);
      timestampRef.current = ts;

      const px = posRef.current.x;
      const py = posRef.current.y;
      const sx = smoothRef.current.x;
      const sy = smoothRef.current.y;

      smoothRef.current.x = sx + (px - sx) * LERP_FACTOR;
      smoothRef.current.y = sy + (py - sy) * LERP_FACTOR;

      const tSX = -velRef.current.x * 0.8;
      const tSY = -velRef.current.y * 0.8;
      const cSX = Math.max(-MAX_STRETCH, Math.min(MAX_STRETCH, tSX));
      const cSY = Math.max(-MAX_STRETCH, Math.min(MAX_STRETCH, tSY));
      stretchRef.current.x += (cSX - stretchRef.current.x) * STRETCH_LERP;
      stretchRef.current.y += (cSY - stretchRef.current.y) * STRETCH_LERP;

      const speed = Math.sqrt(velRef.current.x ** 2 + velRef.current.y ** 2);
      const targetScale = Math.max(MIN_SCALE, Math.min(MAX_SCALE, 1 + speed * SPEED_SCALE_FACTOR));
      particleScaleRef.current += (targetScale - particleScaleRef.current) * SCALE_LERP;

      const curX = smoothRef.current.x;
      const curY = smoothRef.current.y;
      const strX = stretchRef.current.x;
      const strY = stretchRef.current.y;

      // Update character position via direct DOM for perf
      charEl.style.left = `${curX}px`;
      charEl.style.top = `${curY}px`;

      const hov = hoveringRef.current;
      const s = particleScaleRef.current;

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      globalAngleRef.current += dt * 1.8;

      const particles = particlesRef.current;
      const ringR = (hov ? RING_RADIUS * 1.35 : RING_RADIUS) * s;

      for (let i = 0; i < PARTICLE_COUNT; i++) {
        const p = particles[i];
        const a = p.angle + globalAngleRef.current;
        p.x = curX + Math.cos(a) * ringR + strX;
        p.y = curY + Math.sin(a) * ringR + strY;
      }

      // Radial glow
      const glowR = ringR * 1.8;
      const glow = ctx.createRadialGradient(curX, curY, ringR * 0.3, curX, curY, glowR);
      glow.addColorStop(0, 'rgba(129,203,248,0.1)');
      glow.addColorStop(0.5, 'rgba(86,189,248,0.05)');
      glow.addColorStop(1, 'rgba(56,189,248,0)');
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(curX, curY, glowR, 0, Math.PI * 2);
      ctx.fill();

      // Links when particles < LINK_DIST apart
      const linkD = (hov ? LINK_DIST * 1.2 : LINK_DIST) * s;
      for (let i = 0; i < PARTICLE_COUNT; i++) {
        for (let j = i + 1; j < PARTICLE_COUNT; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < linkD) {
            const alpha = (1 - dist / linkD) * 0.18;
            ctx.strokeStyle = `rgba(56,189,248,${alpha})`;
            ctx.lineWidth = 0.6;
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.stroke();
          }
        }
      }

      // Draw heart particles
      for (let i = 0; i < PARTICLE_COUNT; i++) {
        const p = particles[i];
        const baseR = hov ? 3.2 : 2.5;
        const r = baseR * s;
        ctx.fillStyle = COLORS[i];
        drawHeart(ctx, p.x, p.y, r);

        ctx.fillStyle = 'rgba(255,255,255,0.6)';
        drawHeart(ctx, p.x, p.y, r * 0.65);
      }
    };
    animFrameRef.current = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(animFrameRef.current);
      window.removeEventListener('resize', resize);
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseleave', onLeave);
    };
  }, []);

  return (
    <>
      <canvas
        ref={canvasRef}
        className="fixed inset-0 z-[9998]"
        style={{ pointerEvents: 'none' }}
      />

      <div
        ref={charRef}
        className="fixed z-[9999]"
        style={{
          transform: 'translate(-50%, -50%)',
          pointerEvents: 'none',
          width: 32,
          height: 44,
          display: posRef.current.x < 0 ? 'none' : '',
        }}
      >
        {/* Character */}
        <div className="absolute inset-x-0 top-0 flex flex-col items-center">
          {/* Head */}
          <div className="relative" style={{ width: 15, height: 14 }}>
            <div
              className="absolute inset-0 rounded-full transition-all duration-300"
              style={{
                background: hoveringRef.current
                  ? 'linear-gradient(180deg, #f9a8d4 0%, #fbcfe8 60%, #fce7f3 100%)'
                  : 'linear-gradient(180deg, #e2e8f0 0%, #f1f5f9 50%, #f8fafc 100%)',
                boxShadow: hoveringRef.current
                  ? '0 0 7px rgba(244,114,182,0.6)'
                  : '0 0 3px rgba(148,163,184,0.3)',
              }}
            />
            {/* Eyes */}
            <div
              className="absolute flex gap-0.5 transition-all duration-300"
              style={{ top: 4, left: '50%', transform: 'translateX(-50%)' }}
            >
              {hoveringRef.current ? (
                <>
                  <div
                    className="w-2.5 h-2.5 rounded-full flex items-center justify-center"
                    style={{ background: '#fbbf24', boxShadow: '0 0 5px #fbbf24' }}
                  >
                    <span className="text-[5px]">★</span>
                  </div>
                  <div
                    className="w-2.5 h-2.5 rounded-full flex items-center justify-center"
                    style={{ background: '#fbbf24', boxShadow: '0 0 5px #fbbf24' }}
                  >
                    <span className="text-[5px]">★</span>
                  </div>
                </>
              ) : (
                <>
                  <div className="w-1.5 h-1.5 rounded-full bg-slate-700" />
                  <div className="w-1.5 h-1.5 rounded-full bg-slate-700" />
                </>
              )}
            </div>
            {/* Pink blush on hover */}
            {hoveringRef.current && (
              <>
                <div
                  className="absolute w-2 h-1 rounded-full"
                  style={{ left: 0, top: 5, background: 'rgba(244,114,182,0.4)' }}
                />
                <div
                  className="absolute w-2 h-1 rounded-full"
                  style={{ right: 0, top: 5, background: 'rgba(244,114,182,0.4)' }}
                />
              </>
            )}
          </div>

          {/* Body */}
          <div className="relative" style={{ width: 13, height: 8, marginTop: 1 }}>
            <div
              className="absolute inset-0 rounded-sm transition-all duration-300"
              style={{
                background: hoveringRef.current
                  ? 'linear-gradient(180deg, #fbcfe8, #f9a8d4)'
                  : 'linear-gradient(180deg, #64748b, #475569)',
              }}
            />
            {/* Left arm */}
            <div
              className="absolute rounded-full transition-all duration-300"
              style={{
                left: -4, top: 1, width: 3, height: 6,
                background: hoveringRef.current ? '#f9a8d4' : '#94a3b8',
                transformOrigin: 'top center',
                animation: hoveringRef.current
                  ? 'armWave 0.5s ease-in-out infinite'
                  : 'armRun 0.35s ease-in-out infinite',
              }}
            />
            {/* Right arm */}
            <div
              className="absolute rounded-full transition-all duration-300"
              style={{
                right: -4, top: 1, width: 3, height: 6,
                background: hoveringRef.current ? '#f9a8d4' : '#94a3b8',
                transformOrigin: 'top center',
                animation: hoveringRef.current
                  ? 'armWave 0.5s ease-in-out 0.25s infinite'
                  : 'armRun 0.35s ease-in-out 0.175s infinite',
              }}
            />
          </div>

          {/* Legs */}
          <div className="flex gap-2" style={{ marginTop: 1 }}>
            <div
              className="w-2 h-5 rounded-sm bg-slate-500 transition-all duration-300"
              style={{
                transformOrigin: 'top center',
                animation: hoveringRef.current
                  ? 'legIdle 0.5s ease-in-out infinite'
                  : 'legRun 0.35s ease-in-out infinite',
              }}
            />
            <div
              className="w-2 h-5 rounded-sm bg-slate-500 transition-all duration-300"
              style={{
                transformOrigin: 'top center',
                animation: hoveringRef.current
                  ? 'legIdle 0.5s ease-in-out 0.25s infinite'
                  : 'legRun 0.35s ease-in-out 0.175s infinite',
              }}
            />
          </div>
        </div>

        {/* Smoke particles under feet — only when running */}
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 flex gap-1">
          <div
            className="w-2 h-2 rounded-full bg-white/30 blur-[1px]"
            style={{
              animation: hoveringRef.current ? 'none' : 'smoke 0.6s ease-out 0s infinite',
              display: hoveringRef.current ? 'none' : '',
            }}
          />
          <div
            className="w-2.5 h-2.5 rounded-full bg-white/20 blur-[1px]"
            style={{
              animation: hoveringRef.current ? 'none' : 'smoke 0.6s ease-out 0.2s infinite',
              display: hoveringRef.current ? 'none' : '',
            }}
          />
          <div
            className="w-1.5 h-1.5 rounded-full bg-white/25 blur-[1px]"
            style={{
              animation: hoveringRef.current ? 'none' : 'smoke 0.6s ease-out 0.35s infinite',
              display: hoveringRef.current ? 'none' : '',
            }}
          />
        </div>

        {/* Speech bubble */}
        <div
          ref={bubbleRef}
          className="absolute left-1/2 -translate-x-1/2 whitespace-nowrap text-white font-bold px-2 py-0.5 rounded-full animate-bounce"
          style={{
            bottom: '100%',
            marginBottom: 6,
            fontSize: 10,
            background: 'linear-gradient(135deg, #f472b6, #818cf8)',
            boxShadow: '0 0 10px rgba(244,114,182,0.5)',
            display: 'none',
          }}
        >
          gogogo!.
        </div>
      </div>

      <style>{`
        @keyframes armRun {
          0%, 100% { transform: rotate(-20deg); }
          50% { transform: rotate(20deg); }
        }
        @keyframes legRun {
          0%, 100% { transform: rotate(15deg); }
          50% { transform: rotate(-15deg); }
        }
        @keyframes armWave {
          0%, 100% { transform: rotate(-70deg); }
          50% { transform: rotate(-25deg); }
        }
        @keyframes legIdle {
          0%, 100% { transform: rotate(4deg); }
          50% { transform: rotate(-4deg); }
        }
        @keyframes smoke {
          0% { opacity: 0.5; transform: translateY(0) scale(0.6); }
          100% { opacity: 0; transform: translateY(-8px) scale(2); }
        }
      `}</style>
    </>
  );
}
