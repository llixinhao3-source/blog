'use client';

import { motion } from 'framer-motion';

const hermEsFeatures = [
  {
    title: 'OpenClaw 技能开发',
    desc: '基于 OpenClaw 框架开发定制化 Agent 技能，涵盖自动化运维、代码审查、知识检索等场景。实现从 Prompt 设计到 MCP 工具链串联的完整闭环，所有技能在 OpenClaw 生态中可复用。',
    tags: ['OpenClaw', 'MCP 协议', '技能模板', '工具注册'],
  },
  {
    title: 'Hermes 多 Agent 编排',
    desc: '在 Hermes 框架中设计统领调度脚本，实现多 Agent 任务编排、技能统一管理与流程闭环。集成 Cron / 心跳机制，支持自然语言定时与跨时区任务调度，保障自动化流程 7×24 稳定运行。',
    tags: ['Hermes', '任务编排', 'Cron', '心跳机制'],
  },
  {
    title: '影刀 RPA + Coze 工作流',
    desc: '将 Python 自动化脚本集成至 Coze 工作流，影刀 RPA 接管平台日常操作。结合 ComfyUI 工作流实现图像生成管线，从数据采集到内容发布全链路自动化。',
    tags: ['影刀RPA', 'Coze', 'ComfyUI', '自动化'],
  },
];

export default function HardwareZone({ baseUrl }: { baseUrl?: string }) {
  const prefix = baseUrl?.replace(/\/$/, '') || '';

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
        <h2 className="text-sm font-semibold text-accent tracking-wider uppercase">OpenClaw · Hermes 双引擎</h2>
      </div>

      <p className="text-sm text-text-secondary mb-5 leading-relaxed">
        基于 OpenClaw 与 Hermes 两大主流开源 AI Agent 框架进行业务级落地。从技能开发、多 Agent 编排到大模型网关，全链路贯穿——以下展示三个核心实践方向。
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {hermEsFeatures.map((f, i) => (
          <motion.div
            key={f.title}
            className="rounded-2xl p-4 bg-white/5 border border-white/5 hover:border-accent/20 transition-all"
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.1, duration: 0.4 }}
          >
            <h3 className="hover-target text-sm font-medium text-text-primary mb-2">{f.title}</h3>
            <p className="text-xs text-text-secondary leading-relaxed mb-3">{f.desc}</p>
            <div className="flex flex-wrap gap-1">
              {f.tags.map((t) => (
                <span key={t} className="text-[10px] text-text-muted bg-white/5 px-1.5 py-0.5 rounded">{t}</span>
              ))}
            </div>
          </motion.div>
        ))}
      </div>

      <div className="mt-5 pt-4 border-t border-white/10">
        <a href={`${prefix}/projects`} className="hover-target text-xs text-accent hover:opacity-80 transition-colors inline-flex items-center gap-1">
          查看完整项目详情 →
        </a>
      </div>
    </div>
  );
}
