'use client';

import { useEffect, useRef, useState } from 'react';

/* ─── constants ─── */

const TRAIL_LENGTH = 24;
const LERP_FACTOR = 0.25;
const ACCENT_LERP_SPEED = 0.12;
const BREATH_RADIUS = 20;

const MINT = { r: 255, g: 255, b: 255 };
const MAGENTA = { r: 200, g: 200, b: 255 };

/* ─── helpers ─── */

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

function lerpColor(
  a: { r: number; g: number; b: number },
  b: { r: number; g: number; b: number },
  t: number,
) {
  return {
    r: Math.round(lerp(a.r, b.r, t)),
    g: Math.round(lerp(a.g, b.g, t)),
    b: Math.round(lerp(a.b, b.b, t)),
  };
}

/* ─── main component ─── */

export default function CustomCursor() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);

  const mouseRef = useRef({ x: -100, y: -100 });
  const smoothRef = useRef({ x: -100, y: -100 });
  const accentRef = useRef(0);
  const isHoveringRef = useRef(false);
  const visibleRef = useRef(false);

  const trailRef = useRef<{ x: number; y: number }[]>([]);
  const breathPhaseRef = useRef(0);

  const [fingerPos, setFingerPos] = useState({ x: -100, y: -100 });

  /* ─── global mouseover + MutationObserver ─── */

  useEffect(() => {
    const onMouseOver = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      isHoveringRef.current = !!(target?.closest('.hover-target'));
    };

    window.addEventListener('mouseover', onMouseOver);

    const observer = new MutationObserver(() => {});
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['class'],
    });

    const onMove = (e: MouseEvent) => {
      mouseRef.current = { x: e.clientX, y: e.clientY };
      visibleRef.current = true;
    };

    const onLeave = () => {
      visibleRef.current = false;
      accentRef.current = 0;
      isHoveringRef.current = false;
    };

    window.addEventListener('mousemove', onMove);
    document.addEventListener('mouseleave', onLeave);

    return () => {
      window.removeEventListener('mouseover', onMouseOver);
      window.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseleave', onLeave);
      observer.disconnect();
    };
  }, []);

  /* ─── finger icon position lerp ─── */

  useEffect(() => {
    let rafId = 0;
    const tick = () => {
      const sm = smoothRef.current;
      const ms = mouseRef.current;
      sm.x += (ms.x - sm.x) * LERP_FACTOR;
      sm.y += (ms.y - sm.y) * LERP_FACTOR;
      setFingerPos({ x: sm.x, y: sm.y });
      rafId = requestAnimationFrame(tick);
    };
    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, []);

  /* ─── Canvas silk streamer ─── */

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    const draw = () => {
      /* ── clear completely every frame ── */
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      if (!visibleRef.current) {
        animRef.current = requestAnimationFrame(draw);
        return;
      }

      const sm = smoothRef.current;
      const mx = sm.x;
      const my = sm.y;

      const vx = mouseRef.current.x - sm.x;
      const vy = mouseRef.current.y - sm.y;
      const speed = Math.sqrt(vx * vx + vy * vy);

      /* ── hover accent lerp ── */
      const targetAccent = isHoveringRef.current ? 1 : 0;
      accentRef.current += (targetAccent - accentRef.current) * ACCENT_LERP_SPEED;
      const accent = accentRef.current;

      /* ── update trail ── */
      const trail = trailRef.current;
      trail.unshift({ x: mx, y: my });
      if (trail.length > TRAIL_LENGTH) trail.pop();

      /* ── idle breathing ring ── */
      const isIdle = speed < 0.5;
      breathPhaseRef.current += isIdle ? 0.04 : 0.01;
      const breathPhase = breathPhaseRef.current;

      let points: { x: number; y: number }[] = [];

      if (isIdle && trail.length >= 3) {
        const r = BREATH_RADIUS + Math.sin(breathPhase) * 3;
        for (let i = 0; i < TRAIL_LENGTH; i++) {
          const a = (Math.PI * 2 * i) / TRAIL_LENGTH + breathPhase * 0.4;
          const t = i / TRAIL_LENGTH;
          points.push({
            x: mx + Math.cos(a) * r * (0.3 + 0.7 * t),
            y: my + Math.sin(a) * r * (0.3 + 0.7 * t),
          });
        }
      } else if (trail.length >= 2) {
        points = trail.slice();
      }

      if (points.length < 2) {
        animRef.current = requestAnimationFrame(draw);
        return;
      }

      /* ── draw single clean silk curve ── */
      const baseColor = accent > 0.05
        ? lerpColor(MINT, MAGENTA, accent * 0.3)
        : MINT;

      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.setLineDash([]);

      for (let i = 0; i < points.length - 1; i++) {
        const p1 = points[i];
        const p2 = points[i + 1];
        const t = 1 - i / (points.length - 1);

        const width = lerp(0.1, 3, t);
        const alpha = lerp(0.08, 1, t);

        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);
        ctx.strokeStyle = `rgba(${baseColor.r},${baseColor.g},${baseColor.b},${alpha})`;
        ctx.lineWidth = width;
        ctx.stroke();
      }

      /* ── head glow ── */
      if (points.length > 0) {
        const head = points[0];
        ctx.beginPath();
        ctx.arc(head.x, head.y, 4, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${baseColor.r},${baseColor.g},${baseColor.b},0.3)`;
        ctx.fill();
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
    <>
      <canvas
        ref={canvasRef}
        className="fixed inset-0 pointer-events-none"
        style={{ zIndex: 9998, mixBlendMode: 'screen' as React.CSSProperties['mixBlendMode'] }}
      />

      {fingerPos.x > 0 && fingerPos.y > 0 && (
        <div
          className="fixed pointer-events-none"
          style={{
            left: fingerPos.x,
            top: fingerPos.y,
            transform: 'translate(-50%, -50%)',
            zIndex: 9999,
            fontSize: 20,
            lineHeight: 1,
            filter: 'drop-shadow(0 0 8px rgba(255,255,255,0.6))',
          }}
        >
          👆
        </div>
      )}
    </>
  );
}
