'use client';

import { motion, useInView } from 'framer-motion';
import { useRef } from 'react';

const techModules = [
  {
    category: '数据 & SQL',
    color: '#38bdf8',
    items: [
      { name: 'MySQL / PostgreSQL', level: 88 },
      { name: 'Tableau', level: 82 },
      { name: 'Power BI', level: 80 },
      { name: 'RFM 模型分析', level: 78 },
    ],
  },
  {
    category: 'Python 全栈',
    color: '#c084fc',
    items: [
      { name: 'Pandas / NumPy', level: 90 },
      { name: 'FastAPI 异步', level: 85 },
      { name: 'Scikit-learn', level: 72 },
      { name: '影刀 RPA 自动化', level: 80 },
    ],
  },
  {
    category: '前端 & 后端',
    color: '#a78bfa',
    items: [
      { name: 'Vue2 / Vue3', level: 82 },
      { name: 'Java Spring Boot', level: 80 },
      { name: 'Redis / Navicat', level: 85 },
      { name: 'Node.js', level: 75 },
    ],
  },
  {
    category: 'AI Agent 编排',
    color: '#e879f9',
    items: [
      { name: 'OpenClaw 技能开发', level: 88 },
      { name: 'Hermes Agent', level: 82 },
      { name: 'Coze / ComfyUI 工作流', level: 80 },
      { name: 'GPT / DeepSeek API', level: 85 },
    ],
  },
];

export default function TechStackCards() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: '-60px' });

  return (
    <div ref={ref} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {techModules.map((mod, mi) => (
        <motion.div
          key={mod.category}
          className="rounded-2xl p-4"
          style={{
            background: 'rgba(30, 41, 59, 0.45)',
            backdropFilter: 'blur(10px)',
            WebkitBackdropFilter: 'blur(10px)',
            border: '1px solid rgba(255,255,255,0.1)',
          }}
          initial={{ opacity: 0, y: 16 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.2 + mi * 0.1, duration: 0.5 }}
        >
          <div className="flex items-center gap-2 mb-3">
            <div className="w-2 h-2 rounded-full" style={{ background: mod.color, boxShadow: `0 0 6px ${mod.color}40` }} />
            <span className="text-sm font-semibold text-text-primary">{mod.category}</span>
          </div>
          <div className="space-y-2.5">
            {mod.items.map((item, ii) => (
              <div key={item.name}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-text-secondary">{item.name}</span>
                  <span
                    className="text-xs font-semibold tabular-nums"
                    style={{ color: mod.color, fontFamily: "'JetBrains Mono', monospace" }}
                  >
                    {item.level}%
                  </span>
                </div>
                <div className="h-1 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.05)' }}>
                  <motion.div
                    className="h-full rounded-full"
                    style={{ background: `linear-gradient(90deg, ${mod.color}80, ${mod.color})` }}
                    initial={{ width: 0 }}
                    animate={inView ? { width: `${item.level}%` } : {}}
                    transition={{ delay: 0.5 + mi * 0.1 + ii * 0.05, duration: 0.6, ease: [0.25, 0.1, 0.25, 1] }}
                  />
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      ))}
    </div>
  );
}
