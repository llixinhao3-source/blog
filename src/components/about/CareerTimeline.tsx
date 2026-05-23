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
    period: '2026.01 — 至今',
    title: 'AI 开发工程师',
    company: '广州市乐百畅厨具有限责任公司',
    description:
      '基于 OpenClaw 与 Hermes 双框架设计多 Agent 任务编排调度脚本，实现技能统一管理与流程闭环。编写 Python/影刀 RPA 自动化脚本，设计 Vue3 + Python 生图软件与全品库业务系统。集成 Cron 定时调度与心跳机制，保障自动化流程 7×24 稳定运行。',
    techStack: ['OpenClaw', 'Hermes', 'Python', 'Vue3', '影刀RPA', 'Cron'],
    highlight: '多Agent统一编排',
  },
  {
    period: '2025.03 — 至今',
    title: 'Python 开发工程师',
    company: '上海织画信息科技有限公司',
    description:
      '用 Vue2 全新搭建单页登录应用，登录成功率从 92% 提升至 99%。Java Spring Boot 重构后端并接入 Redis 缓存名单，登录耗时从 5s 降至 0.8s，30s 内全系统同步。实现素材一键下载、内容抓取审核发布全流程自动化，为自媒体创作者提效增能。',
    techStack: ['Vue2', 'Java', 'Spring Boot', 'Redis', 'Navicat', 'Node.js'],
    highlight: '登录耗时 5s → 0.8s',
  },
  {
    period: '2023.06 — 2024.01',
    title: '数据运营',
    company: '广东益丰源实业有限公司',
    description:
      '搭建 Python 日报自动化脚本并集成至 Coze 工作流，用 Tableau / Power BI 实现订单数据可视化。基于 RFM 模型微调圈选高潜人群，精准投放优惠券，支付转化率提升 25%。清洗 7 日订单数据，汇报效果一目了然。',
    techStack: ['Python', 'Pandas', 'Tableau', 'Power BI', 'Coze', 'SQL'],
    highlight: '支付转化率 +25%',
  },
  {
    period: '2022.09 — 2026.06',
    title: '大数据专业（本科）',
    company: '广东海洋大学寸金学院',
    description:
      '专业排名前 10%，系统学习大数据可视化、客户关系管理、市场调查与预测、Python 爬虫、Spring Boot、Java EE 等核心课程。获大学生新文科实践创新大赛三等奖、中国国际"互联网+"大学生创新创业大赛三等奖。持工信部数据分析师证书。',
    techStack: ['Python', 'SQL', 'Java', 'Spring Boot', '大数据', '机器学习'],
    highlight: '专业前 10% · 双竞赛三等奖',
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
