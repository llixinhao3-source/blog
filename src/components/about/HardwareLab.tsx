'use client';

import { motion, useInView } from 'framer-motion';
import { useRef } from 'react';

const bizParams = [
  { label: 'DB', value: 'Navicat Premium', detail: 'PostgreSQL · MySQL · Redis · 全品库数据管理' },
  { label: 'Backend', value: 'Python + Java', detail: 'FastAPI 异步 · Spring Boot · Node.js 微服务' },
  { label: 'Frontend', value: 'Vue2 / Vue3', detail: '单页登录 · 生图软件 · 业务系统仪表盘' },
  { label: 'Agent', value: 'OpenClaw · Hermes', detail: '多 Agent 编排 · 技能管理 · Cron 定时调度' },
  { label: 'BI', value: 'Tableau + Power BI', detail: '自动化仪表盘 · 实时监控 · 订单数据可视化' },
  { label: 'RPA', value: '影刀 + Coze', detail: '流程自动化 · 平台操作 · 全链路无人值守' },
];

export default function HardwareLab() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: '-60px' });

  return (
    <div ref={ref} className="mb-6">
      <div className="flex items-center gap-2 mb-4 px-1">
        <span className="text-accent-purple text-lg">⚡</span>
        <h3 className="hover-target text-sm font-semibold text-text-muted tracking-wider uppercase">业务系统技术栈</h3>
      </div>

      <div
        className="rounded-2xl overflow-hidden"
        style={{
          background: 'rgba(15, 23, 42, 0.8)',
          border: '1px solid rgba(192,132,252,0.12)',
          fontFamily: "'JetBrains Mono', monospace",
        }}
      >
        <div className="flex items-center gap-2 px-4 py-2.5 border-b" style={{ borderColor: 'rgba(192,132,252,0.1)' }}>
          <div className="w-2.5 h-2.5 rounded-full" style={{ background: '#ef4444' }} />
          <div className="w-2.5 h-2.5 rounded-full" style={{ background: '#fbbf24' }} />
          <div className="w-2.5 h-2.5 rounded-full" style={{ background: '#22c55e' }} />
          <span className="text-[10px] text-text-muted ml-2">tech-stack.config.ts</span>
        </div>

        <div className="overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
          <div className="flex gap-0 min-w-max">
            {bizParams.map((hw, i) => (
              <motion.div
                key={hw.label}
                className="px-5 py-4 border-r last:border-r-0 flex-shrink-0"
                style={{ borderColor: 'rgba(192,132,252,0.06)', minWidth: 180 }}
                initial={{ opacity: 0, x: 20 }}
                animate={inView ? { opacity: 1, x: 0 } : {}}
                transition={{ delay: 0.3 + i * 0.08, duration: 0.4 }}
              >
                <div className="text-[10px] text-text-muted mb-1">
                  <span style={{ color: '#c084fc' }}>const</span>{' '}
                  <span style={{ color: '#e879f9' }}>{hw.label.toLowerCase()}</span>
                  <span style={{ color: '#64748b' }}> = </span>
                </div>
                <div className="text-sm text-text-primary font-semibold mb-1" style={{ color: '#a78bfa' }}>
                  &quot;{hw.value}&quot;
                </div>
                <div className="text-[10px] text-text-muted leading-relaxed">
                  <span style={{ color: '#64748b' }}>{'// '}</span>{hw.detail}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
