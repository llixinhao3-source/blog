'use client';

import { motion, useInView } from 'framer-motion';
import { useRef } from 'react';

const skillAxes = [
  { name: '嵌入式开发', level: 85, subskills: ['ESP32-S3', 'FreeRTOS', 'IDF', 'PCB 设计'], highlight: 'OpenClaw 硬件' },
  { name: 'AI Agent 编排', level: 80, subskills: ['智能体调教', 'MCP 协议', '工具链集成', 'Dify/n8n'], highlight: '端到端部署' },
  { name: '硬件结构设计', level: 70, subskills: ['3D 建模', '外壳设计', '散热方案', '接口规划'], highlight: '双麦克风阵列' },
  { name: '模型微调', level: 65, subskills: ['LoRA', 'RAG 检索', 'DeepSeek', '多模型路由'], highlight: '语义路由' },
  { name: '后端架构', level: 90, subskills: ['FastAPI', 'Node.js', 'Redis', 'PostgreSQL'], highlight: 'API 优化 60%' },
];

export default function TechStackRadar() {
  const containerRef = useRef<HTMLDivElement>(null);
  const inView = useInView(containerRef, { once: true, margin: '-80px' });
  const levels = 10;
  const cx = 180;
  const cy = 180;
  const radius = 140;

  const getPoint = (i: number, level: number) => {
    const angle = (2 * Math.PI / skillAxes.length) * i - Math.PI / 2;
    const r = (radius / levels) * level;
    return { x: cx + r * Math.cos(angle), y: cy + r * Math.sin(angle) };
  };

  return (
    <div ref={containerRef} className="flex justify-center">
      <div className="relative flex-shrink-0">
        <svg width="360" height="360" viewBox="0 0 360 360">
          {Array.from({ length: 5 }, (_, l) => {
            const gridLevel = (l + 1) * 2;
            return (
              <motion.polygon
                key={`grid-${l}`}
                points={skillAxes.map((_, i) => { const p = getPoint(i, gridLevel); return `${p.x},${p.y}`; }).join(' ')}
                fill="none"
                stroke="rgba(192,132,252,0.08)"
                strokeWidth="0.5"
                initial={{ opacity: 0 }}
                animate={inView ? { opacity: 1 } : {}}
                transition={{ delay: 0.1 * l, duration: 0.4 }}
              />
            );
          })}
          {skillAxes.map((_, i) => {
            const end = getPoint(i, levels);
            return <line key={`axis-${i}`} x1={cx} y1={cy} x2={end.x} y2={end.y} stroke="rgba(192,132,252,0.1)" strokeWidth="0.5" />;
          })}
          <motion.polygon
            points={skillAxes.map((axis, i) => { const p = getPoint(i, axis.level / 10); return `${p.x},${p.y}`; }).join(' ')}
            fill="rgba(192, 132, 252, 0.1)"
            stroke="#c084fc"
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
                fill="#0b1120" stroke="#c084fc" strokeWidth="1.5"
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
                fill="#a78bfa" fontSize="11" fontFamily="'Noto Sans SC', sans-serif"
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
    </div>
  );
}
