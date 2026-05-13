'use client';

import { useEffect, useState } from 'react';
import { SITE_CONFIG } from '../../data/site';

const START_DATE = SITE_CONFIG.startDate;

export default function UptimeCounter() {
  const [days, setDays] = useState(0);

  useEffect(() => {
    const calc = () => Math.floor((Date.now() - START_DATE.getTime()) / 86400000);
    setDays(calc());
    const interval = setInterval(() => setDays(calc()), 60000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="glass-card !rounded-2xl text-center py-4 !scale-100">
      <span className="text-xs text-text-muted tracking-wide">
        已运行{' '}
        <span className="text-accent tabular-nums font-semibold" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
          {days}
        </span>
        {' '}天，见证每一天的技术积累
      </span>
    </div>
  );
}