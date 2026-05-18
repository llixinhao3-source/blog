'use client';

import { motion, useInView } from 'framer-motion';
import { useRef } from 'react';

const hardwareParams = [
  { label: 'MCU', value: 'ESP32-S3N16R8', detail: 'Xtensa LX7 · 240MHz · 16MB Flash · 8MB PSRAM' },
  { label: 'Audio', value: 'Dual Mic Array', detail: 'INMP441 × 2 · I2S · Beamforming · 16kHz' },
  { label: 'Serial', value: 'CH341 UART', detail: 'USB-to-UART Bridge · 921600 baud · Auto-Reset' },
  { label: 'Display', value: 'SSD1306 OLED', detail: '128×64 · I2C @ 0x3C · 3.3V Logic' },
  { label: 'Power', value: 'TP4056 + DW01A', detail: 'LiPo 3.7V 1000mAh · USB-C Charging · Protection' },
  { label: 'GPIO', value: 'Expander PCF8574', detail: 'I2C 8-bit · 0x20 · Button Matrix · LED Control' },
];

export default function HardwareLab() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: '-60px' });

  return (
    <div ref={ref} className="mb-6">
      <div className="flex items-center gap-2 mb-4 px-1">
        <span className="text-accent-purple text-lg">⚡</span>
        <h3 className="hover-target text-sm font-semibold text-text-muted tracking-wider uppercase">Hardware Lab</h3>
      </div>

      <div
        className="rounded-2xl overflow-hidden"
        style={{
          background: 'rgba(15, 23, 42, 0.8)',
          border: '1px solid rgba(192,132,252,0.12)',
          fontFamily: "'JetBrains Mono', monospace",
        }}
      >
        <div className="flex items-center gap-2 px-4 py-2.5 border-b" style={{ borderColor: 'rgba(192,132,252,0.1)' }}>
          <div className="w-2.5 h-2.5 rounded-full" style={{ background: '#ef4444' }} />
          <div className="w-2.5 h-2.5 rounded-full" style={{ background: '#fbbf24' }} />
          <div className="w-2.5 h-2.5 rounded-full" style={{ background: '#22c55e' }} />
          <span className="text-[10px] text-text-muted ml-2">openclaw.config.ts</span>
        </div>

        <div className="overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
          <div className="flex gap-0 min-w-max">
            {hardwareParams.map((hw, i) => (
              <motion.div
                key={hw.label}
                className="px-5 py-4 border-r last:border-r-0 flex-shrink-0"
                style={{ borderColor: 'rgba(192,132,252,0.06)', minWidth: 180 }}
                initial={{ opacity: 0, x: 20 }}
                animate={inView ? { opacity: 1, x: 0 } : {}}
                transition={{ delay: 0.3 + i * 0.08, duration: 0.4 }}
              >
                <div className="text-[10px] text-text-muted mb-1">
                  <span style={{ color: '#c084fc' }}>const</span>{' '}
                  <span style={{ color: '#e879f9' }}>{hw.label.toLowerCase()}</span>
                  <span style={{ color: '#64748b' }}> = </span>
                </div>
                <div className="text-sm text-text-primary font-semibold mb-1" style={{ color: '#a78bfa' }}>
                  &quot;{hw.value}&quot;
                </div>
                <div className="text-[10px] text-text-muted leading-relaxed">
                  <span style={{ color: '#64748b' }}>{'// '}</span>{hw.detail}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
