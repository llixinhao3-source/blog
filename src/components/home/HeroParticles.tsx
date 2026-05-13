'use client';

import { useEffect, useRef } from 'react';

interface Particle {
  x: number;
  y: number;
  originX: number;
  originY: number;
  vx: number;
  vy: number;
  size: number;
}

export default function HeroParticles() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const mouseRef = useRef({ x: -1000, y: -1000 });
  const animationRef = useRef(0);
  const initializedRef = useRef(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const lines = ['从硬件到底层', '构建技术深度'];
    const repulsionRadius = 90;
    const returnSpeed = 0.06;
    const repulsionForce = 4;

    function sampleText() {
      const parent = canvas.parentElement;
      if (!parent) return false;
      const rect = parent.getBoundingClientRect();
      const w = rect.width;
      const h = rect.height;
      if (w === 0 || h === 0) return false;

      const dpr = window.devicePixelRatio || 1;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);

      ctx!.clearRect(0, 0, w, h);

      const fontSize = w < 480 ? 28 : w < 640 ? 36 : 50;
      ctx!.fillStyle = '#ffffff';
      ctx!.font = `600 ${fontSize}px "JetBrains Mono", monospace`;
      ctx!.textAlign = 'left';
      ctx!.textBaseline = 'middle';

      const lineHeight = fontSize * 1.5;
      const lineWidths = lines.map((line) => ctx!.measureText(line).width);
      const totalHeight = lines.length * lineHeight;
      const startY = (h - totalHeight) / 2 + lineHeight / 2;

      lines.forEach((line, i) => {
        const startX = (w - lineWidths[i]) / 2;
        ctx!.fillText(line, startX, startY + i * lineHeight);
      });

      const imageData = ctx!.getImageData(0, 0, w, h);
      const pixels = imageData.data;
      const newParticles: Particle[] = [];
      const gap = 3;

      for (let y = 0; y < h; y += gap) {
        for (let x = 0; x < w; x += gap) {
          const index = (y * w + x) * 4;
          if (pixels[index + 3] > 100) {
            newParticles.push({
              x, y, originX: x, originY: y,
              vx: 0, vy: 0,
              size: Math.random() * 2 + 1.2,
            });
          }
        }
      }

      particlesRef.current = newParticles;
      return true;
    }

    function animate() {
      const dpr = window.devicePixelRatio || 1;
      const w = canvas.width / dpr;
      const h = canvas.height / dpr;
      const mouse = mouseRef.current;
      const particles = particlesRef.current;

      ctx!.clearRect(0, 0, w * dpr, h * dpr);

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        const dx = mouse.x - p.x;
        const dy = mouse.y - p.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < repulsionRadius && dist > 0) {
          const force = (repulsionRadius - dist) / repulsionRadius;
          const angle = Math.atan2(dy, dx);
          p.vx -= Math.cos(angle) * force * repulsionForce;
          p.vy -= Math.sin(angle) * force * repulsionForce;
        }

        p.vx += (p.originX - p.x) * returnSpeed;
        p.vy += (p.originY - p.y) * returnSpeed;
        p.vx *= 0.88;
        p.vy *= 0.88;
        p.x += p.vx;
        p.y += p.vy;

        ctx!.fillStyle = '#38bdf8';
        ctx!.beginPath();
        ctx!.arc(p.x * dpr, p.y * dpr, p.size * dpr, 0, Math.PI * 2);
        ctx!.fill();
      }

      animationRef.current = requestAnimationFrame(animate);
    }

    function tryInit() {
      if (initializedRef.current) return;
      const ok = sampleText();
      if (ok) initializedRef.current = true;
    }

    function handleResize() {
      if (initializedRef.current) sampleText();
    }

    function handleMouseMove(e: MouseEvent) {
      const rect = canvas.getBoundingClientRect();
      mouseRef.current = { x: e.clientX - rect.left, y: e.clientY - rect.top };
    }

    function handleMouseLeave() {
      mouseRef.current = { x: -1000, y: -1000 };
    }

    const parent = canvas.parentElement;
    if (parent) {
      const observer = new ResizeObserver(() => tryInit());
      observer.observe(parent);
      tryInit();

      window.addEventListener('resize', handleResize);
      canvas.addEventListener('mousemove', handleMouseMove);
      canvas.addEventListener('mouseleave', handleMouseLeave);
      animate();

      return () => {
        cancelAnimationFrame(animationRef.current);
        observer.disconnect();
        window.removeEventListener('resize', handleResize);
        canvas.removeEventListener('mousemove', handleMouseMove);
        canvas.removeEventListener('mouseleave', handleMouseLeave);
      };
    }

    tryInit();
    animate();

    window.addEventListener('resize', handleResize);
    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      cancelAnimationFrame(animationRef.current);
      window.removeEventListener('resize', handleResize);
      canvas.removeEventListener('mousemove', handleMouseMove);
      canvas.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, []);

  return (
    <canvas ref={canvasRef} className="w-full h-full cursor-pointer" style={{ display: 'block' }} />
  );
}