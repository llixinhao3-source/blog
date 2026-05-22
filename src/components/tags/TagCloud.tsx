'use client';

import { motion } from 'framer-motion';

interface TagItem {
  name: string;
  count: number;
}

interface Props {
  tags: TagItem[];
  baseUrl?: string;
}

export default function TagCloud({ tags, baseUrl = '' }: Props) {
  const prefix = baseUrl.replace(/\/$/, '');
  const maxCount = Math.max(...tags.map((t) => t.count), 1);
  const minCount = Math.min(...tags.map((t) => t.count), 1);

  const getSize = (count: number) => {
    const ratio = (count - minCount) / (maxCount - minCount || 1);
    return 0.75 + ratio * 1.25;
  };

  const sortedTags = [...tags].sort((a, b) => b.count - a.count);

  return (
    <div className="flex flex-wrap gap-3 justify-center">
      {sortedTags.map((tag, i) => (
        <motion.a
          key={tag.name}
          href={`${prefix}/tags/${tag.name}`}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: i * 0.05, duration: 0.3 }}
          className="text-text-secondary hover:text-accent transition-colors inline-block"
          style={{
            fontSize: `${getSize(tag.count)}rem`,
            lineHeight: '1.5',
          }}
        >
          {tag.name}
          <span className="text-text-muted text-[0.5em] align-super ml-0.5">
            {tag.count}
          </span>
        </motion.a>
      ))}
    </div>
  );
}