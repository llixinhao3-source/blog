'use client';

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface CardItem {
  id: string;
  title: string;
  content: string;
  rarity?: 'common' | 'rare' | 'epic';
  type?: 'quote' | 'code';
  tags?: string[];
}

interface KnowledgeCardsProps {
  cards?: CardItem[];
}

const DEFAULT_CARDS: CardItem[] = [
  { id: '1', title: '今日金句', content: '> "自动化是工程师的浪漫"', rarity: 'rare', type: 'quote', tags: ['金句'] },
  { id: '2', title: '核心代码', content: '```python\nprint("hello mcp")\n```', rarity: 'common', type: 'code', tags: ['Python'] },
  { id: '3', title: '技术突破', content: '> "从命令行到 MCP，一步之遥"', rarity: 'epic', type: 'quote', tags: ['突破'] },
  { id: '4', title: '灵感闪现', content: '```tsx\nconst Future = () => <Wonder />\n```', rarity: 'rare', type: 'code', tags: ['React'] },
  { id: '5', title: '深夜顿悟', content: '> "协议是桥梁，自动化是目的"', rarity: 'common', type: 'quote', tags: ['金句'] },
];

const RARITY_CONFIG = {
  common: {
    border: 'rgba(148,163,184,0.2)',
    glow: 'rgba(148,163,184,0.05)',
    badge: '普通',
    badgeClass: 'bg-white/5 text-text-muted',
    particle: false,
  },
  rare: {
    border: 'rgba(56,189,248,0.3)',
    glow: 'rgba(56,189,248,0.12)',
    badge: '稀有',
    badgeClass: 'bg-sky-400/10 text-sky-400',
    particle: true,
  },
  epic: {
    border: 'rgba(251,191,36,0.4)',
    glow: 'rgba(251,191,36,0.15)',
    badge: '史诗',
    badgeClass: 'bg-amber-400/10 text-amber-400',
    particle: true,
  },
};

export default function KnowledgeCards({ cards = DEFAULT_CARDS }: KnowledgeCardsProps) {
  const [flipped, setFlipped] = useState<Record<string, boolean>>({});
  const [activeId, setActiveId] = useState<string | null>(null);
  const [pulling, setPulling] = useState(false);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width - 0.5) * 2;
    const y = ((e.clientY - rect.top) / rect.height - 0.5) * 2;
    setTilt({ x: -y * 10, y: x * 10 });
  }, []);

  const handleMouseLeave = useCallback(() => {
    setTilt({ x: 0, y: 0 });
  }, []);

  const handleFlip = useCallback((id: string) => {
    const isCurrentlyFlipped = flipped[id];
    if (isCurrentlyFlipped) {
      setFlipped((prev) => ({ ...prev, [id]: false }));
      setActiveId(null);
    } else {
      setActiveId(id);
      setFlipped((prev) => ({ ...prev, [id]: true }));
    }
  }, [flipped]);

  const drawCard = useCallback(() => {
    setPulling(true);
    const unflipped = cards.filter((c) => !flipped[c.id]);
    if (unflipped.length === 0) {
      setTimeout(() => {
        setFlipped({});
        setActiveId(null);
        setPulling(false);
      }, 600);
      return;
    }
    const picked = unflipped[Math.floor(Math.random() * unflipped.length)];
    setActiveId(picked.id);
    setTimeout(() => {
      setFlipped((prev) => ({ ...prev, [picked.id]: true }));
      setPulling(false);
    }, 600);
  }, [cards, flipped]);

  const flippedCount = Object.values(flipped).filter(Boolean).length;
  const allFlipped = flippedCount === cards.length;

  return (
    <div className="w-full">
      <h3 className="hover-target text-text-muted text-xs tracking-wider uppercase mb-4 text-center">🃏 知识卡牌 · 点击抽取</h3>

      <div
        className="relative mx-auto flex items-center justify-center"
        style={{ width: '100%', height: 340, perspective: 1000 }}
      >
        {/* ─── Card Stack (background) ─── */}
        <div className="relative" style={{ width: 144, height: 192 }}>
          {cards.map((_, i) => {
            const stackZ = cards.length - i;
            return (
              <motion.div
                key={`stack-${i}`}
                className="absolute inset-0 rounded-xl border border-white/10"
                style={{
                  background: 'linear-gradient(145deg, #1e293b, #0f172a)',
                  zIndex: allFlipped ? -1 : stackZ,
                  boxShadow: '0 4px 24px rgba(0,0,0,0.3)',
                }}
                animate={allFlipped
                  ? {
                      x: (i - 2) * 60,
                      y: -80 - i * 8,
                      opacity: 0,
                      scale: 0.8,
                    }
                  : {
                      x: -(i * 2),
                      y: -(i * 2),
                      opacity: 0.92 - i * 0.08,
                      scale: 1,
                    }
                }
                transition={{ duration: 0.45, ease: [0.25, 0.1, 0.25, 1] }}
              >
                <div className="w-full h-full flex items-center justify-center flex-col gap-1">
                  <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center">
                    <span className="text-xl">✦</span>
                  </div>
                  <span className="text-text-muted text-[10px] mt-1">SEVIK</span>
                </div>
              </motion.div>
            );
          })}

          {/* ─── Flipped Cards (foreground, always on top) ─── */}
          <AnimatePresence>
            {cards.map((card) => {
              const isFlipped = flipped[card.id];
              const isActive = activeId === card.id;
              if (!isFlipped && !isActive) return null;
              const cfg = RARITY_CONFIG[card.rarity || 'common'];

              return (
                <motion.div
                  key={`face-${card.id}`}
                  className="absolute inset-0"
                  initial={{
                    opacity: 0,
                    scale: 0.4,
                    y: 40,
                    rotateY: 180,
                    x: 0,
                    zIndex: 20,
                  }}
                  animate={isFlipped
                    ? {
                        opacity: 1,
                        scale: isActive ? 1.08 : 1,
                        y: -30,
                        x: 0,
                        rotateX: isActive ? tilt.x : 0,
                        rotateY: isActive ? tilt.y : 0,
                        zIndex: isActive ? 50 : 20,
                        boxShadow: isActive
                          ? `0 0 60px ${cfg.glow}, 0 16px 48px rgba(0,0,0,0.4)`
                          : `0 0 20px ${cfg.glow}, 0 8px 24px rgba(0,0,0,0.3)`,
                      }
                    : {
                        opacity: 0,
                        scale: 0.4,
                        y: 40,
                        x: 0,
                        rotateY: 180,
                        zIndex: 20,
                      }
                  }
                  exit={{
                    opacity: 0,
                    scale: 0.4,
                    y: 40,
                    rotateY: 180,
                    transition: { duration: 0.3, ease: 'easeIn' },
                  }}
                  transition={{
                    type: 'spring',
                    stiffness: 160,
                    damping: 18,
                    mass: 0.8,
                  }}
                  onMouseMove={handleMouseMove}
                  onMouseLeave={handleMouseLeave}
                  style={{
                    transformStyle: 'preserve-3d',
                    pointerEvents: 'auto',
                  }}
                >
                  <div
                    className="w-full h-full rounded-xl border"
                    style={{
                      background: 'linear-gradient(145deg, #1a2440, #0f172a)',
                      borderColor: cfg.border,
                    }}
                  >
                    {/* Particles */}
                    {cfg.particle && isFlipped && (
                      <div className="absolute inset-0 overflow-hidden rounded-xl pointer-events-none">
                        {Array.from({ length: 10 }).map((_, pi) => (
                          <motion.div
                            key={pi}
                            className="absolute w-1.5 h-1.5 rounded-full"
                            style={{
                              background: card.rarity === 'epic'
                                ? `hsl(${40 + Math.random() * 20}, 90%, ${55 + Math.random() * 25}%)`
                                : '#38bdf8',
                              left: `${10 + Math.random() * 80}%`,
                              top: `${10 + Math.random() * 80}%`,
                            }}
                            initial={{ opacity: 0.9, scale: 1 }}
                            animate={{
                              opacity: 0,
                              scale: 0,
                              x: (Math.random() - 0.5) * 60,
                              y: (Math.random() - 0.5) * 60 - 30,
                            }}
                            transition={{
                              duration: 1.2 + Math.random() * 1.5,
                              repeat: Infinity,
                              delay: Math.random() * 2.5,
                            }}
                          />
                        ))}
                      </div>
                    )}

                    {/* Back face */}
                    <motion.div
                      className="absolute inset-0 rounded-xl flex items-center justify-center flex-col gap-1"
                      style={{
                        background: 'linear-gradient(145deg, #1a2440, #0f172a)',
                        backfaceVisibility: 'hidden',
                        transform: 'rotateY(180deg)',
                      }}
                    >
                      <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center">
                        <span className="text-xl">✦</span>
                      </div>
                      <span className="text-text-muted text-[10px] mt-1">SEVIK</span>
                    </motion.div>

                    {/* Front face */}
                    <div
                      className="w-full h-full rounded-xl overflow-hidden flex flex-col justify-center"
                      style={{
                        backfaceVisibility: 'hidden',
                        padding: '0.9rem',
                      }}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className={`text-[9px] px-1.5 py-0.5 rounded ${cfg.badgeClass}`}>
                          {cfg.badge}
                        </span>
                        <span className="text-[9px] text-text-muted">
                          {card.type === 'code' ? '</>' : '❝'}
                        </span>
                      </div>

                      <h4 className="text-xs font-semibold text-text-primary mb-2">{card.title}</h4>

                      {card.type === 'code' ? (
                        <pre className="text-[10px] text-text-secondary bg-black/20 rounded-lg p-2 overflow-x-auto font-mono leading-relaxed">
                          <code>{card.content.replace(/```\w*\n?/g, '')}</code>
                        </pre>
                      ) : (
                        <p className="text-[11px] text-text-secondary leading-relaxed italic">
                          {card.content.replace(/^>\s*"/, '').replace(/"$/, '')}
                        </p>
                      )}

                      {card.tags && (
                        <div className="flex gap-1 mt-2 flex-wrap">
                          {card.tags.map((t) => (
                            <span key={t} className="text-[8px] text-text-muted bg-white/5 px-1 py-0.5 rounded">{t}</span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      </div>

      {/* Draw button */}
      <div className="flex justify-center mt-3">
        <button
          onClick={drawCard}
          disabled={pulling}
          className="hover-target text-xs text-text-muted hover:text-accent transition-colors flex items-center gap-2 disabled:opacity-50"
        >
          <motion.span
            animate={pulling ? { rotate: 360 } : { rotate: 0 }}
            transition={{ duration: 0.6, ease: 'easeInOut' }}
          >
            🎴
          </motion.span>
          {pulling ? '抽取中...' : flippedCount === 0 ? '点击抽取卡牌' : `已翻开 ${flippedCount}/${cards.length}`}
        </button>
      </div>
    </div>
  );
}
