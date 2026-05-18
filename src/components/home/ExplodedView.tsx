'use client';

import { useRef, useState, useEffect } from 'react';
import {
  motion,
  useScroll,
  useTransform,
  AnimatePresence,
  type MotionValue,
} from 'framer-motion';

interface PartConfig {
  id: string;
  label: string;
  image: string;
  backImage?: string;
  x: number;
  y: number;
  rotate: number;
  scale: number;
  opacity: number;
  labelSide: 'left' | 'right';
  description: string;
  width: number;
  zIndex: number;
}

const PARTS: PartConfig[] = [
  {
    id: 'upper-shell',
    label: '上壳体',
    image: '/xiaozhi/xiaozhi1.jpeg',
    x: -60,
    y: -200,
    rotate: -15,
    scale: 1,
    opacity: 1,
    labelSide: 'left',
    description: '3D 打印 PETG 外壳 · 圆润 Q 版造型',
    width: 200,
    zIndex: 10,
  },
  {
    id: 'faceplate',
    label: '面板',
    image: '/xiaozhi/xiaozhi1.jpeg',
    x: 0,
    y: -100,
    rotate: 0,
    scale: 1.05,
    opacity: 0.85,
    labelSide: 'right',
    description: 'IPS 1.54" 128×128 表情显示屏',
    width: 130,
    zIndex: 8,
  },
  {
    id: 'pcb',
    label: 'PCB 主板',
    image: '/xiaozhi/xiaozhi1.jpeg',
    backImage: '/xiaozhi/xiaozhi2.jpeg',
    x: 0,
    y: 0,
    rotate: 0,
    scale: 1,
    opacity: 1,
    labelSide: 'right',
    description: '嵌入式开发：主控 ESP32-S3N16R8，支持 WiFi 蓝牙与模型加速',
    width: 160,
    zIndex: 5,
  },
  {
    id: 'servo',
    label: '舵机',
    image: '/xiaozhi/xiaozhi2.jpeg',
    x: -100,
    y: 150,
    rotate: 12,
    scale: 0.95,
    opacity: 1,
    labelSide: 'left',
    description: 'SG90 微型舵机 · 头部旋转 180°',
    width: 100,
    zIndex: 3,
  },
  {
    id: 'mic-array',
    label: '麦克风阵列',
    image: '/xiaozhi/xiaozhi1.jpeg',
    x: 100,
    y: 150,
    rotate: -10,
    scale: 0.95,
    opacity: 1,
    labelSide: 'right',
    description: 'INMP441 × 2 · I2S 数字麦克风 · 波束成形',
    width: 110,
    zIndex: 3,
  },
  {
    id: 'speaker',
    label: '扬声器',
    image: '/xiaozhi/xiaozhi2.jpeg',
    x: 80,
    y: 200,
    rotate: 8,
    scale: 0.9,
    opacity: 1,
    labelSide: 'right',
    description: '28mm 全频喇叭 · I2S 功放 · 3W 输出',
    width: 100,
    zIndex: 3,
  },
  {
    id: 'battery',
    label: '电池',
    image: '/xiaozhi/xiaozhi1.jpeg',
    x: -80,
    y: 200,
    rotate: -5,
    scale: 0.85,
    opacity: 1,
    labelSide: 'left',
    description: 'LiPo 3.7V 1000mAh · TP4056 充电保护',
    width: 90,
    zIndex: 3,
  },
  {
    id: 'lower-shell',
    label: '下壳体',
    image: '/xiaozhi/xiaozhi2.jpeg',
    x: 60,
    y: 230,
    rotate: 10,
    scale: 0.9,
    opacity: 1,
    labelSide: 'right',
    description: '底座壳体 · USB-C 接口 · 扬声器格栅',
    width: 180,
    zIndex: 2,
  },
];

const SVG_W = 500;
const SVG_H = 600;
const CX = SVG_W / 2;
const CY = SVG_H / 2;

const clamp01 = (v: number) => Math.max(0, Math.min(1, v));

function ExplodedPart({
  part,
  index,
  explodeProgress,
  labelsVisible,
  pcbFlipped,
  onPcbClick,
}: {
  part: PartConfig;
  index: number;
  explodeProgress: MotionValue<number>;
  labelsVisible: MotionValue<number>;
  pcbFlipped: boolean;
  onPcbClick: () => void;
}) {
  const x = useTransform(explodeProgress, (v) => part.x * clamp01(v));
  const y = useTransform(explodeProgress, (v) => part.y * clamp01(v));
  const rotate = useTransform(explodeProgress, (v) => part.rotate * clamp01(v));
  const scale = useTransform(explodeProgress, (v) => 1 + (part.scale - 1) * clamp01(v));
  const opacity = useTransform(explodeProgress, (v) => 1 - (1 - part.opacity) * clamp01(v));

  const isPcb = part.id === 'pcb';

  return (
    <motion.div
      className="absolute"
      style={{
        left: '50%',
        top: '50%',
        transform: 'translate(-50%, -50%)',
        zIndex: part.zIndex,
        x,
        y,
        rotate,
        scale,
        opacity,
      }}
    >
      {isPcb ? (
        <div style={{ perspective: 800 }}>
          <motion.div
            animate={{ rotateY: pcbFlipped ? 180 : 0 }}
            transition={{ duration: 0.8, ease: [0.23, 1, 0.32, 1] }}
            style={{ transformStyle: 'preserve-3d' }}
          >
            <motion.img
              src={part.image}
              alt={part.label}
              className="select-none"
              style={{
                width: part.width,
                height: 'auto',
                objectFit: 'contain',
                backfaceVisibility: 'hidden',
                borderRadius: 8,
                cursor: 'pointer',
              }}
              animate={
                !pcbFlipped
                  ? {
                      filter: [
                        'drop-shadow(0 0 12px rgba(192,132,252,0.4)) drop-shadow(0 0 24px rgba(167,139,250,0.2))',
                        'drop-shadow(0 0 16px rgba(56,189,248,0.5)) drop-shadow(0 0 28px rgba(56,189,248,0.25))',
                        'drop-shadow(0 0 14px rgba(232,121,249,0.45)) drop-shadow(0 0 26px rgba(232,121,249,0.2))',
                        'drop-shadow(0 0 12px rgba(192,132,252,0.4)) drop-shadow(0 0 24px rgba(167,139,250,0.2))',
                      ],
                    }
                  : {
                      filter: 'drop-shadow(0 0 12px rgba(56,189,248,0.4)) drop-shadow(0 0 24px rgba(56,189,248,0.2))',
                    }
              }
              transition={
                !pcbFlipped
                  ? { duration: 4, repeat: Infinity, ease: 'easeInOut' }
                  : { duration: 0.4 }
              }
              onClick={onPcbClick}
              whileTap={{ scale: 0.97 }}
            />
            <img
              src={part.backImage}
              alt=""
              style={{
                position: 'absolute',
                inset: 0,
                width: part.width,
                height: 'auto',
                objectFit: 'contain',
                backfaceVisibility: 'hidden',
                transform: 'rotateY(180deg)',
                borderRadius: 8,
                pointerEvents: 'none',
              }}
            />
          </motion.div>
        </div>
      ) : (
        <img
          src={part.image}
          alt={part.label}
          className="select-none pointer-events-auto"
          style={{
            width: part.width,
            height: 'auto',
            objectFit: 'contain',
            borderRadius: 8,
          }}
        />
      )}

      <motion.div
        className="absolute pointer-events-none"
        style={{
          opacity: labelsVisible,
          [part.labelSide === 'left' ? 'right' : 'left']: '100%',
          top: '50%',
          transform: 'translateY(-50%)',
          marginLeft: part.labelSide === 'right' ? 12 : 0,
          marginRight: part.labelSide === 'left' ? 12 : 0,
          whiteSpace: 'nowrap',
        }}
      >
        <svg
          className="absolute pointer-events-none"
          style={{
            top: '50%',
            [part.labelSide === 'left' ? 'right' : 'left']: 0,
            width: 36,
            height: 2,
            overflow: 'visible',
          }}
        >
          <motion.line
            x1={part.labelSide === 'left' ? 36 : 0}
            y1={0}
            x2={part.labelSide === 'left' ? 0 : 36}
            y2={0}
            stroke="rgba(192,132,252,0.4)"
            strokeWidth="1"
            style={{ opacity: labelsVisible }}
          />
        </svg>

        <motion.div
          className="text-xs font-medium px-2 py-1 rounded-md"
          style={{
            [part.labelSide === 'left' ? 'marginRight' : 'marginLeft']: 32,
            background: 'rgba(30,41,59,0.7)',
            backdropFilter: 'blur(8px)',
            border: '1px solid rgba(192,132,252,0.15)',
            fontFamily: "'JetBrains Mono', monospace",
          }}
          animate={{ y: [0, -3, 0] }}
          transition={{
            duration: 2.5,
            repeat: Infinity,
            ease: 'easeInOut',
            delay: index * 0.2,
          }}
        >
          <span
            style={{
              background: 'linear-gradient(90deg, #e879f9, #34d399)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            {part.label}
          </span>
        </motion.div>
      </motion.div>
    </motion.div>
  );
}

function MobileExplodedView() {
  return (
    <div className="py-6">
      <h3
        className="text-sm font-semibold mb-5 text-center"
        style={{
          fontFamily: "'JetBrains Mono', monospace",
          background: 'linear-gradient(90deg, #e879f9, #34d399)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
        }}
      >
        小智拆解图
      </h3>
      <div className="flex flex-col items-center gap-3">
        {PARTS.map((part, i) => (
          <motion.div
            key={part.id}
            className="flex items-center gap-3 w-full max-w-xs"
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{
              delay: i * 0.08,
              duration: 0.5,
              ease: [0.23, 1, 0.32, 1],
            }}
          >
            <div
              className="shrink-0 rounded-lg overflow-hidden flex items-center justify-center"
              style={{
                width: 52,
                height: 52,
                background: 'rgba(30,41,59,0.6)',
                border: '1px solid rgba(255,255,255,0.08)',
              }}
            >
              <img
                src={part.image}
                alt={part.label}
                style={{ width: 36, height: 36, objectFit: 'contain' }}
              />
            </div>
            <div className="min-w-0">
              <span
                className="text-xs font-medium block"
                style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  background: 'linear-gradient(90deg, #e879f9, #34d399)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}
              >
                {part.label}
              </span>
              <span
                className="text-[10px] block mt-0.5 truncate"
                style={{ color: '#64748b' }}
              >
                {part.description}
              </span>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

export default function ExplodedView() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [pcbFlipped, setPcbFlipped] = useState(false);
  const [showPcbModal, setShowPcbModal] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 1024);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start end', 'end start'],
  });

  const explodeProgress = useTransform(scrollYProgress, [0.1, 0.45], [0, 1]);
  const labelsVisible = useTransform(scrollYProgress, [0.3, 0.4], [0, 1]);
  const leaderLineProgress = useTransform(scrollYProgress, [0.12, 0.45], [0, 1]);
  const hintOpacity = useTransform(
    scrollYProgress,
    [0.05, 0.15, 0.4, 0.5],
    [0, 1, 1, 0],
  );

  const handlePcbClick = () => {
    if (!pcbFlipped) {
      setPcbFlipped(true);
      setTimeout(() => setShowPcbModal(true), 600);
    } else {
      setPcbFlipped(false);
      setShowPcbModal(false);
    }
  };

  if (isMobile) {
    return <MobileExplodedView />;
  }

  return (
    <div ref={containerRef} className="relative" style={{ height: 800 }}>
      <div className="sticky top-0 h-screen flex items-center justify-center overflow-hidden">
        <div className="relative" style={{ width: SVG_W, height: SVG_H }}>
          <svg
            className="absolute inset-0 w-full h-full pointer-events-none"
            viewBox={`0 0 ${SVG_W} ${SVG_H}`}
            style={{ zIndex: 1 }}
          >
            <defs>
              {PARTS.map((part) => {
                const endX = CX + part.x;
                const endY = CY + part.y;
                return (
                  <linearGradient
                    key={`grad-${part.id}`}
                    id={`grad-${part.id}`}
                    gradientUnits="userSpaceOnUse"
                    x1={CX}
                    y1={CY}
                    x2={endX}
                    y2={endY}
                  >
                    <stop offset="0%" stopColor="#c084fc" stopOpacity="0" />
                    <stop offset="40%" stopColor="#c084fc" stopOpacity="0.15" />
                    <stop offset="100%" stopColor="#34d399" stopOpacity="0.4" />
                  </linearGradient>
                );
              })}
            </defs>
            {PARTS.map((part) => {
              const endX = CX + part.x;
              const endY = CY + part.y;
              const d = `M ${CX} ${CY} L ${endX} ${endY}`;
              return (
                <motion.path
                  key={`line-${part.id}`}
                  d={d}
                  stroke={`url(#grad-${part.id})`}
                  strokeWidth={1}
                  fill="none"
                  strokeLinecap="round"
                  style={{ pathLength: leaderLineProgress }}
                />
              );
            })}
          </svg>

          {PARTS.map((part, i) => (
            <ExplodedPart
              key={part.id}
              part={part}
              index={i}
              explodeProgress={explodeProgress}
              labelsVisible={labelsVisible}
              pcbFlipped={pcbFlipped}
              onPcbClick={handlePcbClick}
            />
          ))}

          <AnimatePresence>
            {showPcbModal && (
              <motion.div
                className="absolute inset-0 flex items-center justify-center"
                style={{ zIndex: 50 }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => {
                  setShowPcbModal(false);
                  setPcbFlipped(false);
                }}
              >
                <motion.div
                  className="p-6 rounded-2xl max-w-sm"
                  style={{
                    background: 'rgba(15, 23, 42, 0.75)',
                    backdropFilter: 'blur(24px) saturate(180%)',
                    WebkitBackdropFilter: 'blur(24px) saturate(180%)',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    boxShadow:
                      '0 8px 32px rgba(0, 0, 0, 0.4), 0 0 80px rgba(192, 132, 252, 0.08)',
                  }}
                  initial={{ scale: 0.85, y: 20 }}
                  animate={{ scale: 1, y: 0 }}
                  exit={{ scale: 0.85, y: 20 }}
                  transition={{ duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <h3
                    className="text-sm font-semibold mb-2"
                    style={{
                      fontFamily: "'JetBrains Mono', monospace",
                      background: 'linear-gradient(90deg, #c084fc, #38bdf8)',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                    }}
                  >
                    ESP32-S3N16R8
                  </h3>
                  <p
                    className="text-xs leading-relaxed"
                    style={{ color: '#94a3b8' }}
                  >
                    嵌入式开发：主控 ESP32-S3N16R8，支持 WiFi
                    蓝牙与模型加速。 16MB Flash + 8MB PSRAM，Xtensa LX7 双核
                    240MHz。
                  </p>
                  <div className="mt-3 flex gap-2 flex-wrap">
                    {['WiFi 6', 'BLE 5.0', '向量指令', '8MB PSRAM'].map(
                      (tag) => (
                        <span
                          key={tag}
                          className="text-[10px] px-2 py-0.5 rounded-full"
                          style={{
                            background: 'rgba(192,132,252,0.1)',
                            color: '#c084fc',
                            border: '1px solid rgba(192,132,252,0.15)',
                          }}
                        >
                          {tag}
                        </span>
                      ),
                    )}
                  </div>
                  <button
                    className="mt-4 text-xs transition-opacity hover:opacity-80"
                    style={{ color: '#64748b' }}
                    onClick={() => {
                      setShowPcbModal(false);
                      setPcbFlipped(false);
                    }}
                  >
                    关闭
                  </button>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          <motion.div
            className="absolute bottom-4 left-1/2 -translate-x-1/2 text-xs z-20"
            style={{
              opacity: hintOpacity,
              color: '#64748b',
              fontFamily: "'JetBrains Mono', monospace",
            }}
          >
            ↓ 滚动拆解 · 点击 PCB 翻转
          </motion.div>
        </div>
      </div>
    </div>
  );
}
