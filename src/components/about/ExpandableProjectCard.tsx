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
  link?: string;
}

const projects: ProjectDetail[] = [
  {
    id: 'edu-island',
    title: '学职圈圈 2.0 · AI 教育平台',
    subtitle: 'GPT + DeepSeek 多模型教学系统',
    description: '调用 GPT 与 DeepSeek 等主流大模型接口，将 AI 与传统教育结合。通过微调大模型优化课程推荐逻辑，AI 老师智能体 7×24 实时答疑。基于学生登录行为数据在云教室中生成个性化形象，打造沉浸式课堂体验。',
    metrics: [
      { label: '课堂参与率', value: '+20%' },
      { label: '课程点击率', value: '+46%' },
      { label: '课堂到课率', value: '+35%' },
    ],
    techStack: ['Python', 'Java', 'GPT API', 'DeepSeek', 'WebSocket'],
    architectureNote: '大模型 API → AI 老师 Agent → 知识图谱推荐 → 云教室形象渲染 → 学生互动终端',
  },
  {
    id: 'ecommerce',
    title: '电商运营自动化平台',
    subtitle: 'OpenClaw 多 Agent 全链路',
    description: '基于 OpenClaw 多 Agent 编排实现选品→生图→文案→上架全流程自动化。影刀 RPA 接管平台发布层，gpt-image 负责商品图生成，Node.js 构建调度中台。实现一人管理全店铺日常运营。',
    metrics: [
      { label: '全流程自动化', value: '100%' },
      { label: 'Agent 数量', value: '4+' },
      { label: '覆盖平台', value: '多店铺' },
    ],
    techStack: ['OpenClaw', '影刀RPA', 'Playwright', 'gpt-image', 'Node.js'],
    architectureNote: '选品 Agent → 生图 Agent → 文案 Agent → 上架 Agent → 影刀 RPA 发布层',
    link: 'https://github.com/llixinhao3-source/dianshang_promote',
  },
  {
    id: 'sentiment',
    title: '泡泡玛特 · 舆情情感分析',
    subtitle: '微博 / 小红书 10 万+ 数据',
    description: '爬取并清洗超 10 万条社交媒体用户评论，构建情感分析模型洞察品牌口碑。识别 KOL 正向内容在负面舆情期转发量提升 60%，为企业舆情应对提供数据支撑。',
    metrics: [
      { label: '数据量', value: '10万+' },
      { label: 'KOL 转发增幅', value: '+60%' },
      { label: '情感模型准确率', value: '87%' },
    ],
    techStack: ['Python', 'MySQL', '爬虫', '情感分析', 'NLP'],
    architectureNote: '分布式爬虫 → 数据清洗 → NLP 情感分类 → 可视化报告',
  },
  {
    id: 'finance',
    title: '股票策略自动化交易',
    subtitle: '双轮驱动量化平台',
    description: '"新闻+技术面"双轮驱动：抓取宏观/个股新闻做情感打分，叠加斐波那契、KDJ、MACD、RSI 等 8 项技术指标进行多因素分析。WebSocket 实时推送资金曲线至企业微信，2% 回撤自动降半仓，4% 清仓，三年回测最大回撤仅 7.1%。',
    metrics: [
      { label: '最大回撤', value: '7.1%' },
      { label: '技术指标', value: '8项' },
      { label: '回测周期', value: '3年' },
    ],
    techStack: ['Python', 'Java', 'Vue2', 'Node.js', 'WebSocket', 'Navicat'],
    architectureNote: '新闻爬虫 → 情感打分 → 技术指标计算 → 策略引擎 → WebSocket 推送 → 企业微信',
    link: 'https://github.com/llixinhao3-source/finance',
  },
  {
    id: 'vibe-coding',
    title: 'Vibe-Coding · 个人 AI 形象',
    subtitle: 'PyQt6 + GenericAgent 对话系统',
    description: '基于 PyQt6 开发桌面 AI 对话应用，集成自研 GenericAgent 引擎，实现多轮上下文理解的智能对话。支持流式文本生成、像素动画反馈及实时交互，打造个人技术品牌 IP。',
    metrics: [
      { label: '对话轮次', value: '多轮' },
      { label: '技术栈', value: 'PyQt6' },
      { label: '开源', value: 'GitHub' },
    ],
    techStack: ['Python', 'PyQt6', 'GenericAgent', '流式生成'],
    architectureNote: 'GenericAgent 引擎 → 上下文管理 → 流式文本 → 像素动画 → PyQt6 UI',
    link: 'https://github.com/llixinhao3-source/claw-ga',
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

                      <div className="mb-3">
                        <span className="text-xs text-text-muted block mb-1.5">架构流</span>
                        <div
                          className="text-xs p-3 rounded-xl bg-accent/5 border border-accent/15"
                          style={{ fontFamily: "'JetBrains Mono', monospace", color: '#38bdf8', lineHeight: '1.8' }}
                        >
                          {project.architectureNote}
                        </div>
                      </div>

                      {project.link && (
                        <div className="mt-3">
                          <a
                            href={project.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-accent hover:underline inline-flex items-center gap-1"
                          >
                            查看项目 →
                          </a>
                        </div>
                      )}
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
