'use client';

import { motion, useInView } from 'framer-motion';
import { useRef } from 'react';

interface SkillAxis {
  name: string;
  level: number;
  subskills: string[];
  highlight?: string;
}

const skillAxes: SkillAxis[] = [
  { name: 'AI Agent 开发', level: 80, subskills: ['智能体调教', 'Prompt 工程', 'MCP 协议', '工具链集成'], highlight: 'OpenClaw 技能开发' },
  { name: '工作流自动化', level: 70, subskills: ['n8n / Dify', 'Coze 工作流', 'RPA 编排', 'CI/CD 管线'], highlight: '端到端部署' },
  { name: '后端架构', level: 90, subskills: ['FastAPI', 'Spring Boot', 'Node.js', 'Redis / PostgreSQL'], highlight: 'API 响应优化 60%' },
  { name: '大模型对接', level: 65, subskills: ['GPT / DeepSeek', 'Claude API', 'RAG 检索增强', '模型微调'], highlight: '多模型路由' },
  { name: '前端工程', level: 60, subskills: ['Astro', 'React', 'Tailwind CSS', 'TypeScript'], highlight: '群岛架构实践' },
];

export default function TechStackRadar() {
  const containerRef = useRef<HTMLDivElement>(null);
  const inView = useInView(containerRef, { once: true, margin: '-80px' });
  const levels = 10;
  const cx = 200;
  const cy = 200;
  const radius = 160;

  const getPoint = (i: number, level: number) => {
    const angle = (2 * Math.PI / skillAxes.length) * i - Math.PI / 2;
    const r = (radius / levels) * level;
    return { x: cx + r * Math.cos(angle), y: cy + r * Math.sin(angle) };
  };

  return (
    <div ref={containerRef} className="flex flex-col lg:flex-row items-center gap-8">
      <div className="relative flex-shrink-0">
        <svg width="400" height="400" viewBox="0 0 400 400">
          {Array.from({ length: 5 }, (_, l) => {
            const gridLevel = (l + 1) * 2;
            return (
              <motion.polygon
                key={`grid-${l}`}
                points={skillAxes.map((_, i) => { const p = getPoint(i, gridLevel); return `${p.x},${p.y}`; }).join(' ')}
                fill="none"
                stroke="rgba(255,255,255,0.08)"
                strokeWidth="0.5"
                initial={{ opacity: 0 }}
                animate={inView ? { opacity: 1 } : {}}
                transition={{ delay: 0.1 * l, duration: 0.4 }}
              />
            );
          })}
          {skillAxes.map((_, i) => {
            const end = getPoint(i, levels);
            return <line key={`axis-${i}`} x1={cx} y1={cy} x2={end.x} y2={end.y} stroke="rgba(255,255,255,0.08)" strokeWidth="0.5" />;
          })}
          <motion.polygon
            points={skillAxes.map((axis, i) => { const p = getPoint(i, axis.level / 10); return `${p.x},${p.y}`; }).join(' ')}
            fill="rgba(56, 189, 248, 0.12)"
            stroke="#38bdf8"
            strokeWidth="1.5"
            initial={{ opacity: 0, scale: 0.5 }}
            animate={inView ? { opacity: 1, scale: 1 } : {}}
            transition={{ delay: 0.5, duration: 0.8, ease: [0.25, 0.1, 0.25, 1] }}
            style={{ transformOrigin: `${cx}px ${cy}px` }}
          />
          {skillAxes.map((axis, i) => {
            const p = getPoint(i, axis.level / 10);
            return (
              <motion.circle
                key={`dot-${i}`}
                cx={p.x} cy={p.y} r={4}
                fill="#0b1120" stroke="#38bdf8" strokeWidth="1.5"
                initial={{ opacity: 0 }}
                animate={inView ? { opacity: 1 } : {}}
                transition={{ delay: 0.8 + i * 0.1, duration: 0.4 }}
              />
            );
          })}
          {skillAxes.map((axis, i) => {
            const labelPos = getPoint(i, levels + 0.85);
            const textAnchor = labelPos.x > cx + 20 ? 'start' : labelPos.x < cx - 20 ? 'end' : 'middle';
            return (
              <motion.text
                key={`label-${i}`}
                x={labelPos.x} y={labelPos.y}
                textAnchor={textAnchor} dominantBaseline="middle"
                fill="#94a3b8" fontSize="12" fontFamily="'Noto Sans SC', sans-serif"
                initial={{ opacity: 0 }}
                animate={inView ? { opacity: 1 } : {}}
                transition={{ delay: 0.3 + i * 0.1, duration: 0.4 }}
              >
                {axis.name}
              </motion.text>
            );
          })}
        </svg>
      </div>

      <div className="flex-1 space-y-3">
        {skillAxes.map((axis, i) => (
          <motion.div
            key={axis.name}
            className="glass-card !rounded-2xl p-4 !scale-100 hover:!scale-[1.01]"
            initial={{ opacity: 0, x: 20 }}
            animate={inView ? { opacity: 1, x: 0 } : {}}
            transition={{ delay: 0.4 + i * 0.1, duration: 0.4 }}
          >
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-sm text-text-primary font-medium">{axis.name}</span>
              <span className="text-xs tabular-nums text-accent font-semibold" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                {axis.level}%
              </span>
            </div>
            <div className="h-1.5 rounded-full bg-white/5 overflow-hidden mb-2">
              <motion.div
                className="h-full rounded-full"
                style={{ backgroundColor: '#38bdf8' }}
                initial={{ width: 0 }}
                animate={inView ? { width: `${axis.level}%` } : {}}
                transition={{ delay: 0.6 + i * 0.1, duration: 0.6, ease: [0.25, 0.1, 0.25, 1] }}
              />
            </div>
            <div className="flex flex-wrap gap-1.5">
              {axis.subskills.map((s) => (
                <span key={s} className="text-xs text-text-muted bg-white/5 px-2 py-0.5 rounded-lg">{s}</span>
              ))}
              {axis.highlight && (
                <span className="text-xs text-accent bg-accent/10 px-2 py-0.5 rounded-lg">{axis.highlight}</span>
              )}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
