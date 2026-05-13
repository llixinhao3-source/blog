'use client';

import { motion, useInView } from 'framer-motion';
import { useRef } from 'react';

interface TimelineEntry {
  period: string;
  title: string;
  company: string;
  description: string;
  techStack: string[];
  highlight?: string;
}

const timelineData: TimelineEntry[] = [
  {
    period: '2025.03 — 至今',
    title: 'Python 开发工程师',
    company: '上海织画',
    description:
      '负责后端架构重构，接入 Redis 缓存层，将 API 响应时间优化 60%。主导数据库查询优化与微服务拆分，建立完善的接口文档与自动化测试体系。',
    techStack: ['Python', 'FastAPI', 'Redis', 'MySQL', 'Docker'],
    highlight: 'API 响应优化 60%',
  },
  {
    period: '2023.06 — 2025.02',
    title: '数据运营实习生',
    company: '广东益丰源',
    description:
      '利用 RFM 模型对用户进行分层分析，设计精准营销策略，助力支付转化率提升 25%。搭建自动化数据看板，实现核心指标的实时监控与异常预警。',
    techStack: ['Python', 'Pandas', 'SQL', 'RFM 模型', '数据可视化'],
    highlight: '支付转化率 +25%',
  },
  {
    period: '2022.09 — 2026.06',
    title: '大数据专业（本科）',
    company: '广东海洋大学寸金学院',
    description:
      '系统学习大数据技术栈，成绩保持专业前 10%。参与多个数据挖掘与机器学习课程项目，自建个人技术博客记录学习路径。',
    techStack: ['Python', 'SQL', '机器学习', '数据挖掘', '统计学'],
    highlight: '专业前 10%',
  },
];

function TimelineItem({ entry, index }: { entry: TimelineEntry; index: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: '-60px' });

  return (
    <div ref={ref} className="relative pl-10 sm:pl-0">
      <div className={`sm:w-1/2 ${index % 2 === 0 ? 'sm:ml-auto sm:pl-10' : 'sm:pr-10'}`}>
        <motion.div
          className="relative glass-card !rounded-2xl p-5 !scale-100 hover:!scale-[1.01]"
          initial={{ opacity: 0, x: index % 2 === 0 ? 40 : -40 }}
          animate={inView ? { opacity: 1, x: 0 } : {}}
          transition={{ duration: 0.5, delay: 0.1, ease: [0.25, 0.1, 0.25, 1] }}
        >
          <motion.span
            className="text-xs text-text-muted block mb-2 tabular-nums"
            style={{ fontFamily: "'JetBrains Mono', monospace" }}
            initial={{ opacity: 0 }}
            animate={inView ? { opacity: 1 } : {}}
            transition={{ delay: 0.3, duration: 0.3 }}
          >
            {entry.period}
          </motion.span>

          <h3 className="text-base font-semibold text-text-primary mb-1">{entry.title}</h3>
          <p className="text-sm text-accent mb-2">{entry.company}</p>
          <p className="text-sm text-text-secondary leading-relaxed mb-3">{entry.description}</p>

          <div className="flex flex-wrap gap-1.5 mb-3">
            {entry.techStack.map((t) => (
              <span key={t} className="text-xs text-text-muted bg-white/5 px-2 py-0.5 rounded-lg">{t}</span>
            ))}
          </div>

          {entry.highlight && (
            <div className="inline-block text-xs text-accent bg-accent/10 px-2.5 py-1 rounded-lg">
              {entry.highlight}
            </div>
          )}
        </motion.div>
      </div>

      <motion.div
        className="absolute left-[5px] sm:left-1/2 top-6 w-4 h-4 rounded-full border-2 border-accent bg-bg-base -translate-x-1/2 z-10"
        initial={{ scale: 0 }}
        animate={inView ? { scale: 1 } : {}}
        transition={{ delay: 0.2, duration: 0.3 }}
      />
      <motion.div
        className="absolute left-[11px] sm:left-1/2 top-10 bottom-0 w-px bg-white/10 -translate-x-1/2"
        initial={{ scaleY: 0 }}
        animate={inView ? { scaleY: 1 } : {}}
        transition={{ delay: 0.4, duration: 0.5 }}
        style={{ transformOrigin: 'top' }}
      />
    </div>
  );
}

export default function CareerTimeline() {
  return (
    <div className="relative">
      <div className="absolute left-[11px] sm:left-1/2 top-0 bottom-0 w-px bg-white/5 -translate-x-1/2 hidden sm:block" />
      <div className="space-y-8">
        {timelineData.map((entry, i) => (
          <TimelineItem key={i} entry={entry} index={i} />
        ))}
      </div>
    </div>
  );
}