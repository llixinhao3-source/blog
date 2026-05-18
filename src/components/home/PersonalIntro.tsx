'use client';

import { useState, useCallback } from 'react';
import { motion } from 'framer-motion';

export default function PersonalIntro() {
  const [tilt, setTilt] = useState({ x: 0, y: 0, glareX: 50, glareY: 50 });

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width - 0.5) * 2;
    const y = ((e.clientY - rect.top) / rect.height - 0.5) * 2;
    setTilt({ x: -y * 8, y: x * 8, glareX: ((e.clientX - rect.left) / rect.width) * 100, glareY: ((e.clientY - rect.top) / rect.height) * 100 });
  }, []);

  const handleMouseLeave = useCallback(() => {
    setTilt({ x: 0, y: 0, glareX: 50, glareY: 50 });
  }, []);

  const cardStyle = {
    background: 'rgba(30, 41, 59, 0.45)',
    backdropFilter: 'blur(20px) saturate(120%)',
    WebkitBackdropFilter: 'blur(20px) saturate(120%)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    borderRadius: '1.25rem',
    padding: '1rem',
    boxShadow:
      '0 4px 24px -2px rgba(0, 0, 0, 0.35), 0 16px 48px -8px rgba(0, 0, 0, 0.4), inset 0 0.5px 0 rgba(255, 255, 255, 0.04)',
    minHeight: '380px',
    display: 'flex',
    flexDirection: 'column' as const,
    justifyContent: 'center',
    transformStyle: 'preserve-3d' as const,
    transition: 'box-shadow 0.6s ease, border-color 0.6s ease',
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -30 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.7, ease: [0.25, 0.1, 0.25, 1] }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className="w-full relative overflow-hidden"
      style={{
        ...cardStyle,
        perspective: 1000,
        rotateX: tilt.x,
        rotateY: tilt.y,
        transition: 'rotateX 0.8s cubic-bezier(0.23, 1, 0.32, 1), rotateY 0.8s cubic-bezier(0.23, 1, 0.32, 1), box-shadow 0.6s ease, border-color 0.6s ease',
      }}
      whileHover={{
        borderColor: 'rgba(192,132,252,0.12)',
        boxShadow:
          '0 6px 32px -2px rgba(0,0,0,0.4), 0 20px 60px -12px rgba(0,0,0,0.5), 0 0 50px -8px rgba(192,132,252,0.08), inset 0 0.5px 0 rgba(255,255,255,0.06)',
      }}
    >
      <div
        className="absolute inset-0 pointer-events-none rounded-[1.25rem]"
        style={{
          zIndex: 0,
          background: `radial-gradient(circle at ${tilt.glareX}% ${tilt.glareY}%, rgba(192,132,252,0.10) 0%, transparent 60%)`,
        }}
      />
      <div className="flex items-center gap-3 mb-4" style={{ zIndex: 1, position: 'relative' }}>
        <div
          className="w-11 h-11 rounded-full flex items-center justify-center text-lg font-semibold flex-shrink-0"
          style={{
            background: 'linear-gradient(135deg, #c084fc, #a78bfa)',
            color: '#fff',
          }}
        >
          S
        </div>
        <div>
          <h3
            className="hover-target text-sm font-semibold text-text-primary"
            style={{ fontFamily: "'JetBrains Mono', monospace" }}
          >
            hi，这里是 李心皓
          </h3>
          <p className="text-xs text-text-muted">欢迎参观我的 Blog</p>
        </div>
      </div>

      <div className="flex items-center gap-2 text-xs text-text-muted mb-4" style={{ zIndex: 1, position: 'relative' }}>
        <span
          className="w-2 h-2 rounded-full flex-shrink-0"
          style={{
            background: '#22c55e',
            boxShadow: '0 0 6px rgba(34, 197, 94, 0.5)',
          }}
        />
        <span>在线 · 正在编码中...</span>
      </div>

      <div className="text-xs text-text-muted leading-relaxed" style={{ zIndex: 1, position: 'relative' }}>
        <p>专注 OpenClaw 应用落地与 AI Agent 全链路开发。</p>
        <p className="mt-1">从智能体调教到企业级 AI 工作流部署，</p>
        <p>每一步都是技术深度的积累。</p>
      </div>
    </motion.div>
  );
}
