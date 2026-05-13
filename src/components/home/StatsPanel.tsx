'use client';

import AnimatedCounter from '../ui/AnimatedCounter';
import type { SiteStats } from '../../types';

interface Props {
  stats: SiteStats;
}

export default function StatsPanel({ stats }: Props) {
  return (
    <div className="grid grid-cols-3 gap-3 w-full">
      <div className="glass-card !rounded-2xl text-center py-6 !scale-100 hover:!scale-[1.02]">
        <div className="text-2xl sm:text-3xl font-bold text-accent mb-1">
          <AnimatedCounter end={stats.postCount} />
        </div>
        <div className="text-xs text-text-muted tracking-wide">篇文章</div>
      </div>
      <div className="glass-card !rounded-2xl text-center py-6 !scale-100 hover:!scale-[1.02]">
        <div className="text-2xl sm:text-3xl font-bold text-accent-warm mb-1">
          <AnimatedCounter end={stats.tagCount} />
        </div>
        <div className="text-xs text-text-muted tracking-wide">个标签</div>
      </div>
      <div className="glass-card !rounded-2xl text-center py-6 !scale-100 hover:!scale-[1.02]">
        <div className="text-2xl sm:text-3xl font-bold text-text-primary mb-1">
          <AnimatedCounter end={stats.totalWords} suffix="字" />
        </div>
        <div className="text-xs text-text-muted tracking-wide">字总量</div>
      </div>
    </div>
  );
}