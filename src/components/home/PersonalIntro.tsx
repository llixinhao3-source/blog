'use client';

import { motion } from 'framer-motion';

export default function PersonalIntro() {
  return (
    <motion.div
      initial={{ opacity: 0, x: -30 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.7, ease: [0.25, 0.1, 0.25, 1] }}
      className="w-full"
      style={{
        background: 'rgba(30, 41, 59, 0.55)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        borderRadius: '1.25rem',
        padding: '1rem',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.25)',
        minHeight: '380px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
      }}
    >
      <div className="flex items-center gap-3 mb-4">
        <div
          className="w-11 h-11 rounded-full flex items-center justify-center text-lg font-semibold flex-shrink-0"
          style={{
            background: 'linear-gradient(135deg, #38bdf8, #818cf8)',
            color: '#fff',
          }}
        >
          S
        </div>
        <div>
          <h3
            className="text-sm font-semibold text-text-primary"
            style={{ fontFamily: "'JetBrains Mono', monospace" }}
          >
            hi，这里是 李心皓
          </h3>
          <p className="text-xs text-text-muted">欢迎参观我的 Blog</p>
        </div>
      </div>

      <div className="flex items-center gap-2 text-xs text-text-muted mb-4">
        <span
          className="w-2 h-2 rounded-full flex-shrink-0"
          style={{
            background: '#22c55e',
            boxShadow: '0 0 6px rgba(34, 197, 94, 0.5)',
          }}
        />
        <span>在线 · 正在编码中...</span>
      </div>

      <div className="text-xs text-text-muted leading-relaxed">
        <p>专注 OpenClaw 应用落地与 AI Agent 全链路开发。</p>
        <p className="mt-1">从智能体调教到企业级 AI 工作流部署，</p>
        <p>每一步都是技术深度的积累。</p>
      </div>
    </motion.div>
  );
}