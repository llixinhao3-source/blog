'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const NAV_ITEMS = [
  { label: '首页', href: '/', heading: 'hi，我是sevik', sub: 'OpenClaw 应用工程师 & AI Agent 开发工程师' },
  { label: '文章', href: '/posts', heading: '技术沉淀', sub: '从智能体调教到企业级 AI 工作流部署的深度记录' },
  { label: '项目', href: '/projects', heading: 'OpenClaw', sub: 'ESP32-S3 驱动的 AI Agent 硬件生态' },
  { label: '关于', href: '/about', heading: '李心皓', sub: '专注 AI 工程化，追求技术深度与产品美学的交汇' },
];

export default function NavCarousel() {
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const startTimer = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setActive((prev) => (prev + 1) % NAV_ITEMS.length);
    }, 6000);
  }, []);

  const stopTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (!paused) startTimer();
    else stopTimer();
    return () => stopTimer();
  }, [paused, startTimer, stopTimer]);

  const handleClick = (index: number) => {
    setActive(index);
    setPaused(true);
    setTimeout(() => setPaused(false), 15000);
  };

  const current = NAV_ITEMS[active];

  return (
    <div className="w-full">
      <nav className="flex items-center justify-center gap-1">
        {NAV_ITEMS.map((item, i) => (
          <button
            key={item.label}
            onClick={() => handleClick(i)}
            onMouseEnter={() => setPaused(true)}
            onMouseLeave={() => setPaused(false)}
            className="relative px-4 py-2 text-sm font-medium tracking-wide transition-colors duration-300"
            style={{ color: i === active ? 'var(--color-text-primary)' : 'var(--color-text-muted)' }}
          >
            {i === active && (
              <motion.div
                layoutId="nav-highlight"
                className="absolute inset-0 rounded-full"
                style={{
                  background: 'rgba(192, 132, 252, 0.08)',
                  border: '0.5px solid rgba(192, 132, 252, 0.15)',
                }}
                transition={{ type: 'spring', stiffness: 380, damping: 30 }}
              />
            )}
            <span className="relative z-10">{item.label}</span>
          </button>
        ))}
      </nav>

      <div className="mt-6 text-center" style={{ minHeight: 80 }}>
        <AnimatePresence mode="wait">
          <motion.div
            key={active}
            initial={{ opacity: 0, y: 12, filter: 'blur(6px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            exit={{ opacity: 0, y: -12, filter: 'blur(6px)' }}
            transition={{ duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
          >
            <h2
              className="font-serif font-bold tracking-wider"
              style={{
                fontSize: 'clamp(1.5rem, 3.5vw, 3rem)',
                background: 'linear-gradient(135deg, #c084fc, #a78bfa, #e879f9)',
                backgroundSize: '200% 200%',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              {current.heading}
            </h2>
            <p className="text-sm text-text-secondary/70 mt-2 max-w-md mx-auto leading-relaxed">
              {current.sub}
            </p>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
