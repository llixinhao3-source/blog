'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface ProjectDetail {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  metrics: { label: string; value: string }[];
  techStack: string[];
  architectureNote: string;
}

const projects: ProjectDetail[] = [
  {
    id: 'edu-island',
    title: '智能教育岛屿',
    subtitle: '学职圈圈 2.0',
    description: '利用 AI 智能体构建教育交互系统，通过个性化学习路径推荐与实时课堂反馈机制，将课堂参与率提升 20%。基于大模型的智能问答系统，为学生提供 7×24 的学业支持。',
    metrics: [
      { label: '课堂参与率', value: '+20%' },
      { label: '问答响应', value: '<1s' },
      { label: '日活用户', value: '500+' },
    ],
    techStack: ['Python', 'FastAPI', 'GPT API', 'WebSocket', 'PostgreSQL'],
    architectureNote: 'AI Agent → 知识图谱 → 个性化推荐引擎 → WebSocket 实时推送 → 学生端 Dashboard',
  },
  {
    id: 'quant-lab',
    title: '量化交易实验室',
    subtitle: 'WebSocket 实时推送系统',
    description: '研发基于 WebSocket 的实时行情推送系统，结合多因子选股策略与动态止盈止损，回测最大回撤仅 7.1%。支持毫秒级行情数据推送，资金曲线可视化展示。',
    metrics: [
      { label: '最大回撤', value: '7.1%' },
      { label: '推送延迟', value: '<50ms' },
      { label: '策略胜率', value: '62%' },
    ],
    techStack: ['Node.js', 'WebSocket', 'Redis', 'React', 'Canvas'],
    architectureNote: '行情源 → WebSocket Server → Redis 缓存 → 策略引擎 → 信号分发 → 前端资金曲线',
  },
  {
    id: 'sentiment-radar',
    title: '舆情监控雷达',
    subtitle: '10 万+数据情感分析',
    description: '构建分布式爬虫系统清洗 10 万+社交媒体数据，通过 NLP 情感分析模型洞察品牌口碑走向。实时监控舆情波动，异常预警响应时间缩短至 3 分钟。',
    metrics: [
      { label: '清洗数据量', value: '10万+' },
      { label: '预警响应', value: '<3min' },
      { label: '情感准确率', value: '87%' },
    ],
    techStack: ['Python', 'Scrapy', 'BERT', 'Elasticsearch', 'Grafana'],
    architectureNote: '分布式爬虫 → 数据清洗管线 → BERT 情感分类 → Elasticsearch → Grafana 可视化大屏',
  },
];

export default function ExpandableProjectCards() {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const toggle = (id: string) => setExpandedId(expandedId === id ? null : id);

  return (
    <div className="space-y-4">
      {projects.map((project, i) => {
        const isExpanded = expandedId === project.id;
        return (
          <motion.div
            key={project.id}
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ delay: i * 0.1, duration: 0.4 }}
          >
            <div
              onClick={() => toggle(project.id)}
              className={`glass-card !rounded-2xl transition-all cursor-pointer !scale-100 hover:!scale-[1.01] ${
                isExpanded ? 'border-accent/30' : ''
              }`}
            >
              <div className="p-5 flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <h3 className="text-base font-semibold text-text-primary mb-1">{project.title}</h3>
                  <p className="text-xs text-accent mb-2">{project.subtitle}</p>
                  <p className="text-sm text-text-secondary line-clamp-2">{project.description}</p>
                </div>
                <motion.div
                  animate={{ rotate: isExpanded ? 180 : 0 }}
                  transition={{ duration: 0.3 }}
                  className="text-text-muted flex-shrink-0 ml-4"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="m6 9 6 6 6-6" />
                  </svg>
                </motion.div>
              </div>

              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
                    className="overflow-hidden"
                  >
                    <div className="px-5 pb-5 border-t border-white/10 pt-4">
                      <div className="grid grid-cols-3 gap-3 mb-4">
                        {project.metrics.map((m) => (
                          <div key={m.label} className="text-center p-3 rounded-2xl bg-white/5 border border-white/5">
                            <div className="text-lg font-bold tabular-nums text-accent" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                              {m.value}
                            </div>
                            <div className="text-xs text-text-muted mt-1">{m.label}</div>
                          </div>
                        ))}
                      </div>

                      <div className="mb-3">
                        <span className="text-xs text-text-muted block mb-1.5">技术栈</span>
                        <div className="flex flex-wrap gap-1.5">
                          {project.techStack.map((t) => (
                            <span key={t} className="text-xs text-text-secondary bg-white/5 px-2 py-0.5 rounded-lg">{t}</span>
                          ))}
                        </div>
                      </div>

                      <div>
                        <span className="text-xs text-text-muted block mb-1.5">架构流</span>
                        <div
                          className="text-xs p-3 rounded-xl bg-accent/5 border border-accent/15"
                          style={{ fontFamily: "'JetBrains Mono', monospace", color: '#38bdf8', lineHeight: '1.8' }}
                        >
                          {project.architectureNote}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}