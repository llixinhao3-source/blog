'use client';

import { useState, useCallback, useRef } from 'react';

interface CardData {
  id: number;
  title: string;
  icon: string;
  desc: string;
  color: string;
}

const CARDS: CardData[] = [
  { id: 1, title: 'AI 算法', icon: '🧠', desc: '深度学习与模型部署', color: '#38bdf8' },
  { id: 2, title: '嵌入式开发', icon: '🔌', desc: 'ESP32-S3 / MCU', color: '#818cf8' },
  { id: 3, title: '前端工程', icon: '🎨', desc: 'React / TypeScript', color: '#f472b6' },
  { id: 4, title: '后端架构', icon: '⚙️', desc: 'API 设计与优化', color: '#34d399' },
  { id: 5, title: 'CUDA 并行', icon: '⚡', desc: 'GPU 高性能计算', color: '#fbbf24' },
  { id: 6, title: 'DevOps', icon: '🚀', desc: 'CI/CD 自动化部署', color: '#fb923c' },
  { id: 7, title: '计算机视觉', icon: '👁️', desc: 'OpenCV / 图像处理', color: '#a78bfa' },
  { id: 8, title: '机器人学', icon: '🤖', desc: 'ROS / 运动规划', color: '#22d3ee' },
];

type Phase = 'idle' | 'lifting' | 'flipping' | 'settled';

export default function CardStack() {
  const [drawnIds, setDrawnIds] = useState<number[]>([]);
  const [phase, setPhase] = useState<Phase>('idle');
  const [activeCard, setActiveCard] = useState<CardData | null>(null);
  const [showFront, setShowFront] = useState(false);
  const [flyOut, setFlyOut] = useState(false);
  const [collect, setCollect] = useState(false);
  const drawTriggered = useRef(false);

  const remaining = CARDS.filter((c) => !drawnIds.includes(c.id));

  const handleDraw = useCallback(() => {
    if (drawTriggered.current || phase !== 'idle') return;
    if (remaining.length === 0) {
      setDrawnIds([]);
      setActiveCard(null);
      setShowFront(false);
      setFlyOut(false);
      setCollect(false);
      return;
    }

    drawTriggered.current = true;
    const idx = Math.floor(Math.random() * remaining.length);
    const card = remaining[idx];

    setActiveCard(card);
    setPhase('lifting');
    requestAnimationFrame(() => {
      requestAnimationFrame(() => setFlyOut(true));
    });

    setTimeout(() => {
      setPhase('flipping');
      setShowFront(true);
    }, 400);

    setTimeout(() => {
      setPhase('settled');
      setDrawnIds((prev) => [...prev, card.id]);
    }, 1000);

    setTimeout(() => {
      setPhase('idle');
      setActiveCard(null);
      setShowFront(false);
      setFlyOut(false);
      setCollect(false);
      drawTriggered.current = false;
    }, 1400);
  }, [phase, remaining]);

  const allDrawn = remaining.length === 0;

  return (
    <div className="w-full">
      <h3 className="text-text-muted text-xs tracking-wider uppercase mb-4 text-center">
        🃏 知识卡牌 · 点击抽取
      </h3>

      <div
        className="relative mx-auto"
        style={{ width: 240, height: 200, perspective: '900px' }}
        onClick={handleDraw}
      >
        {/* Card pile */}
        <div className="absolute inset-0 flex items-center justify-center">
          {remaining.slice(0, 6).map((card, i) => {
            const stackIndex = allDrawn ? 6 - i : Math.min(remaining.length, 6) - i;
            return (
              <div
                key={card.id}
                className="absolute w-36 h-48 rounded-xl border border-white/5"
                style={{
                  background: 'linear-gradient(145deg, #1a2440, #0f172a)',
                  transform: `translateY(${i * -3}px) translateX(${i * -3}px)`,
                  zIndex: stackIndex,
                  transition: 'transform 0.4s ease, opacity 0.4s ease',
                  opacity: allDrawn ? 0 : 0.9 - i * 0.08,
                }}
              >
                <div className="w-full h-full flex items-center justify-center flex-col gap-1">
                  <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center">
                    <span className="text-xl">✦</span>
                  </div>
                  <span className="text-text-muted text-[10px] mt-1">SEVIK</span>
                </div>
              </div>
            );
          })}

          {allDrawn && (
            <div className="absolute inset-0 flex items-center justify-center z-10">
              <button
                className="px-4 py-2 rounded-xl text-sm text-accent border border-accent/30 hover:bg-accent/10 transition-colors"
                onClick={(e) => { e.stopPropagation(); handleDraw(); }}
              >
                🔄 重新开始
              </button>
            </div>
          )}
        </div>

        {/* Active drawing card */}
        {activeCard && (
          <div
            className="absolute inset-0 flex items-center justify-center"
            style={{ zIndex: 20, pointerEvents: 'none' }}
          >
            <div
              className="w-36 h-48"
              style={{
                transformStyle: 'preserve-3d',
                transform: flyOut
                  ? 'translateY(-60px) scale(1.05)'
                  : 'translateY(0) scale(1)',
                transition: 'transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
              }}
            >
            {/* Front face */}
            <div
              className="absolute inset-0 rounded-xl border p-3 flex flex-col items-center justify-center text-center"
              style={{
                backfaceVisibility: 'hidden',
                WebkitBackfaceVisibility: 'hidden',
                transform: showFront ? 'rotateY(0deg)' : 'rotateY(180deg)',
                transition: 'transform 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
                background: `linear-gradient(145deg, ${activeCard.color}15, #0f172a)`,
                borderColor: `${activeCard.color}40`,
              }}
            >
              <span className="text-3xl mb-2">{activeCard.icon}</span>
              <span
                className="text-sm font-bold mb-1"
                style={{ color: activeCard.color }}
              >
                {activeCard.title}
              </span>
              <span className="text-text-muted text-[11px]">{activeCard.desc}</span>
            </div>

            {/* Back face */}
            <div
              className="absolute inset-0 rounded-xl border border-white/5 flex items-center justify-center"
              style={{
                backfaceVisibility: 'hidden',
                WebkitBackfaceVisibility: 'hidden',
                background: 'linear-gradient(145deg, #1a2440, #0f172a)',
                transform: showFront ? 'rotateY(-180deg)' : 'rotateY(0deg)',
                transition: 'transform 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
              }}
            >
              <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center">
                <span className="text-xl">✦</span>
              </div>
            </div>
          </div>
          </div>
        )}
      </div>

      {/* Drawn cards display row */}
      {drawnIds.length > 0 && (
        <div
          className="flex flex-wrap justify-center gap-2 mt-5"
          style={{
            opacity: collect ? 1 : 0,
            transition: 'opacity 0.3s ease',
          }}
          ref={(el) => {
            if (el) {
              requestAnimationFrame(() => el.style.opacity = '1');
            }
          }}
        >
          {drawnIds.map((id, i) => {
            const card = CARDS.find((c) => c.id === id)!;
            return (
              <div
                key={id}
                className="w-16 h-20 rounded-lg border p-1.5 flex flex-col items-center justify-center text-center"
                style={{
                  background: `linear-gradient(135deg, ${card.color}10, transparent)`,
                  borderColor: `${card.color}25`,
                  animation: `cardPopIn 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) ${i * 0.08}s both`,
                }}
              >
                <span className="text-base">{card.icon}</span>
                <span className="text-[8px] text-text-muted mt-0.5 leading-tight">
                  {card.title}
                </span>
              </div>
            );
          })}
        </div>
      )}

      <style>{`
        @keyframes cardPopIn {
          0% { opacity: 0; transform: scale(0.3) translateY(30px); }
          100% { opacity: 1; transform: scale(1) translateY(0); }
        }
      `}</style>
    </div>
  );
}
