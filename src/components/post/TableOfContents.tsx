'use client';

import { useEffect, useState } from 'react';

interface Heading {
  depth: number;
  text: string;
  id: string;
}

export default function TableOfContents() {
  const [headings, setHeadings] = useState<Heading[]>([]);
  const [activeId, setActiveId] = useState('');

  useEffect(() => {
    const elements = document.querySelectorAll<HTMLHeadingElement>(
      '.prose-custom h2, .prose-custom h3'
    );
    const items: Heading[] = [];

    elements.forEach((el) => {
      const id = el.id || el.textContent?.toLowerCase().replace(/\s+/g, '-') || '';
      if (!el.id) el.id = id;
      items.push({ depth: parseInt(el.tagName[1]), text: el.textContent || '', id });
    });

    setHeadings(items);

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
          }
        });
      },
      { rootMargin: '-80px 0px -80% 0px' }
    );

    elements.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  if (headings.length === 0) return null;

  return (
    <nav style={{
      background: 'rgba(30, 41, 59, 0.5)',
      backdropFilter: 'blur(16px)',
      WebkitBackdropFilter: 'blur(16px)',
      border: '1px solid rgba(255, 255, 255, 0.08)',
      borderRadius: '1.5rem',
      padding: '1.25rem',
      boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)',
    }}>
      <p className="text-xs font-semibold text-text-muted mb-3 tracking-wider uppercase">
        目录
      </p>
      <div className="space-y-0.5">
        {headings.map((heading) => (
          <a
            key={heading.id}
            href={`#${heading.id}`}
            className={`block text-sm py-1.5 transition-colors border-l-2 ${
              activeId === heading.id
                ? 'text-accent border-accent pl-3'
                : 'text-text-muted border-transparent pl-[14px] hover:text-text-secondary hover:border-white/20'
            }`}
            style={{ paddingLeft: heading.depth === 3 ? '24px' : undefined }}
          >
            {heading.text}
          </a>
        ))}
      </div>
    </nav>
  );
}