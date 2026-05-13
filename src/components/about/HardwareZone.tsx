'use client';

import { motion } from 'framer-motion';

const openClawFeatures = [
  { title: 'OpenClaw 技能开发', desc: '基于 OpenClaw 框架开发定制化 Agent 技能，涵盖代码审查、自动化运维、知识检索等多种场景，实现从 Prompt 设计到工具链串联的完整闭环。', tags: ['OpenClaw', '技能模板', 'MCP 协议', '工具注册'] },
  { title: 'AI Agent 编排引擎', desc: '构建多 Agent 协作编排系统，通过 Dify / n8n 等工作流引擎将多个智能体串联为自动化管线，实现端到端的业务任务执行。', tags: ['Dify', 'n8n', '多Agent协作', '事件驱动'] },
  { title: '大模型接入网关', desc: '设计统一的大模型接入层，支持 GPT-4、Claude、DeepSeek 等多模型动态路由与负载均衡，结合 RAG 检索增强提升回答准确率。', tags: ['API 网关', 'RAG', '向量数据库', '语义路由'] },
];

export default function HardwareZone() {
  return (
    <div className="glass-card !rounded-3xl p-6 sm:p-8 !scale-100 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-32 h-32 opacity-[0.03]">
        <svg viewBox="0 0 100 100" fill="none">
          <circle cx="50" cy="45" r="30" stroke="#38bdf8" strokeWidth="1.5" />
          <circle cx="50" cy="45" r="15" stroke="#818cf8" strokeWidth="1" />
          <circle cx="50" cy="45" r="5" fill="#38bdf8" />
        </svg>
      </div>

      <div className="flex items-center gap-2 mb-4">
        <span className="text-lg">🤖</span>
        <h2 className="text-sm font-semibold text-accent tracking-wider uppercase">OpenClaw · AI Agent 专区</h2>
      </div>

      <p className="text-sm text-text-secondary mb-5 leading-relaxed">
        OpenClaw 是本博客的技术灵魂。以下展示如何通过工程化能力构建可复用的 AI Agent 体系——从技能开发、Agent 编排到大模型网关，全链路贯通。
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {openClawFeatures.map((f, i) => (
          <motion.div
            key={f.title}
            className="rounded-2xl p-4 bg-white/5 border border-white/5 hover:border-accent/20 transition-all"
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.1, duration: 0.4 }}
          >
            <h3 className="text-sm font-medium text-text-primary mb-2">{f.title}</h3>
            <p className="text-xs text-text-secondary leading-relaxed mb-3">{f.desc}</p>
            <div className="flex flex-wrap gap-1">
              {f.tags.map((t) => <span key={t} className="text-[10px] text-text-muted bg-white/5 px-1.5 py-0.5 rounded">{t}</span>)}
            </div>
          </motion.div>
        ))}
      </div>

      <div className="mt-5 pt-4 border-t border-white/10">
        <a href="/projects" className="text-xs text-accent hover:opacity-80 transition-colors inline-flex items-center gap-1">
          查看完整项目详情 →
        </a>
      </div>
    </div>
  );
}
