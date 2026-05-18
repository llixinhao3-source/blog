'use client';

import { useRef, useEffect, useCallback, useState } from 'react';

export default function MaskRevealHeading() {
  const containerRef = useRef<HTMLDivElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const [edgeX, setEdgeX] = useState(0);

  const updateEdge = useCallback(() => {
    const overlay = overlayRef.current;
    const container = containerRef.current;
    if (!overlay || !container) return;
    const cp = overlay.style.clipPath;
    const match = cp.match(/inset\(0\s+([\d.]+)%/);
    const pct = match ? 100 - parseFloat(match[1]) : 0;
    const rect = container.getBoundingClientRect();
    setEdgeX((pct / 100) * rect.width);
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    const overlay = overlayRef.current;
    if (!container || !overlay) return;

    let raf = 0;
    const onMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      overlay.style.clipPath = `inset(0 ${100 - x}% 0 0)`;
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(updateEdge);
    };

    const onLeave = () => {
      overlay.style.clipPath = 'inset(0 100% 0 0)';
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(updateEdge);
    };

    container.addEventListener('mousemove', onMove);
    container.addEventListener('mouseleave', onLeave);

    return () => {
      container.removeEventListener('mousemove', onMove);
      container.removeEventListener('mouseleave', onLeave);
      cancelAnimationFrame(raf);
    };
  }, [updateEdge]);

  return (
    <div
      ref={containerRef}
      className="relative w-full px-4 cursor-ew-resize select-none overflow-hidden"
      style={{ minHeight: 110, fontSize: 'clamp(2.25rem, 5vw, 4.5rem)' }}
    >
      {/* Invisible spacer: establishes exact height and prevents layout shift */}
      <div
        className="font-serif font-bold tracking-wider text-center"
        style={{
          whiteSpace: 'nowrap',
          visibility: 'hidden',
          fontSize: 'inherit',
          lineHeight: 1.2,
        }}
      >
        hi，我是李心皓
      </div>

      {/* Layer 1 (base) — "hi，我是sevik" breathing glow background-clip */}
      <div
        className="absolute inset-0 flex items-center justify-center pointer-events-none"
        style={{ whiteSpace: 'nowrap', fontSize: 'inherit', lineHeight: 1.2 }}
      >
        <span
          className="font-serif font-bold tracking-wider breathe-text"
          style={{
            fontSize: 'inherit',
            background: 'linear-gradient(135deg, #c084fc, #a78bfa, #e879f9, #c084fc)',
            backgroundSize: '300% 300%',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            filter: 'brightness(0.8)',
            animation: 'breatheShift 4s ease-in-out infinite',
          }}
        >
          hi，我是sevik
        </span>
      </div>

      <style>{`
        @keyframes breatheShift {
          0%, 100% {
            background-position: 0% 50%;
            filter: brightness(0.7);
            opacity: 0.35;
          }
          25% {
            background-position: 100% 0%;
            filter: brightness(1.0);
            opacity: 0.5;
          }
          50% {
            background-position: 100% 100%;
            filter: brightness(1.2);
            opacity: 0.55;
          }
          75% {
            background-position: 0% 100%;
            filter: brightness(0.9);
            opacity: 0.45;
          }
        }
      `}</style>

      {/* Layer 2 (overlay) — "hi，我是李心皓" clipped from right */}
      <div
        ref={overlayRef}
        className="absolute inset-0 flex items-center justify-center pointer-events-none"
        style={{
          whiteSpace: 'nowrap',
          fontSize: 'inherit',
          lineHeight: 1.2,
          clipPath: 'inset(0 100% 0 0)',
          transition: 'clip-path 0.06s ease-out',
        }}
      >
        <span
          className="font-serif font-bold tracking-wider"
          style={{
            fontSize: 'inherit',
            color: '#ffffff',
            textShadow: '0 0 50px rgba(192,132,252,0.5), 0 0 100px rgba(167,139,250,0.25)',
          }}
        >
          hi，我是李心皓
        </span>
      </div>

      {/* Knife-edge glow line */}
      <div
        className="absolute top-0 bottom-0 pointer-events-none"
        style={{
          width: 3,
          left: edgeX,
          opacity: edgeX > 1 ? 1 : 0,
          background:
            'linear-gradient(to bottom, transparent, rgba(192,132,252,0.6), rgba(192,132,252,0.9), rgba(167,139,250,0.6), transparent)',
          boxShadow: '0 0 16px rgba(192,132,252,0.5), 0 0 32px rgba(167,139,250,0.2)',
        }}
      />

      <style>{`
        @keyframes breathingShimmer {
          0%, 100% {
            background-position: 200% center;
            filter: brightness(1) drop-shadow(0 0 8px rgba(192,132,252,0.3));
          }
          50% {
            background-position: -100% center;
            filter: brightness(1.25) drop-shadow(0 0 18px rgba(192,132,252,0.55));
          }
        }
        .breathing-glow-text {
          animation: breathingShimmer 3.5s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}
