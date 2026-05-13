'use client';

import { useState, useRef, useEffect, useCallback } from 'react';

interface PostItem {
  slug: string;
  title: string;
  description: string;
  tags: string[];
  category: string;
  date: string;
}

interface Props {
  posts: PostItem[];
}

export default function SearchBox({ posts }: Props) {
  const [query, setQuery] = useState('');
  const [focused, setFocused] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  const results = query.trim().length >= 1
    ? posts.filter((p) => {
        const q = query.toLowerCase();
        return (
          p.title.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q) ||
          p.tags.some((t) => t.toLowerCase().includes(q))
        );
      }).slice(0, 8)
    : [];

  useEffect(() => {
    setActiveIndex(-1);
  }, [query]);

  useEffect(() => {
    if (activeIndex >= 0 && resultsRef.current) {
      const el = resultsRef.current.children[activeIndex] as HTMLElement;
      if (el) el.scrollIntoView({ block: 'nearest' });
    }
  }, [activeIndex]);

  const onKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((prev) => Math.min(prev + 1, results.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((prev) => Math.max(prev - 1, -1));
    } else if (e.key === 'Enter' && activeIndex >= 0) {
      e.preventDefault();
      window.location.href = `/posts/${results[activeIndex].slug}`;
    } else if (e.key === 'Escape') {
      inputRef.current?.blur();
      setFocused(false);
    }
  }, [activeIndex, results]);

  const showDropdown = focused && query.trim().length >= 1;

  return (
    <div className="relative w-full max-w-lg mx-auto">
      <div
        className={[
          'flex items-center gap-3 px-4 py-3 rounded-2xl border transition-all duration-300',
          focused
            ? 'border-accent/50 bg-white/[0.06] shadow-lg shadow-accent/5'
            : 'border-white/10 bg-white/[0.03] hover:border-white/15',
        ].join(' ')}
      >
        <svg
          className="w-4 h-4 flex-shrink-0 text-text-muted"
          fill="none" stroke="currentColor" viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setTimeout(() => setFocused(false), 200)}
          onKeyDown={onKeyDown}
          placeholder="搜索文章标题、描述或标签..."
          className="flex-1 bg-transparent text-sm text-text-primary placeholder-text-muted outline-none"
        />
        {query.length > 0 && (
          <button
            onClick={() => { setQuery(''); inputRef.current?.focus(); }}
            className="text-text-muted hover:text-text-primary text-xs flex-shrink-0"
          >
            ✕
          </button>
        )}
      </div>

      {showDropdown && (
        <div
          ref={resultsRef}
          className="absolute top-full left-0 right-0 mt-2 z-30 rounded-xl border border-white/10 overflow-hidden"
          style={{
            background: 'rgba(15, 23, 42, 0.95)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            maxHeight: 320,
            overflowY: 'auto',
          }}
        >
          {results.length > 0 ? (
            results.map((post, i) => (
              <a
                key={post.slug}
                href={`/posts/${post.slug}`}
                className={[
                  'flex items-start gap-3 px-4 py-3 border-b border-white/5 last:border-b-0 transition-colors',
                  i === activeIndex
                    ? 'bg-accent/10'
                    : 'hover:bg-white/[0.04]',
                ].join(' ')}
              >
                <span className="flex-shrink-0 text-xl mt-0.5">
                  {post.category === 'ai' ? '🧠' :
                   post.category === 'hardware' ? '🔌' :
                   post.category === 'cuda' ? '⚡' : '📖'}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-sm font-medium text-text-primary truncate">
                      {post.title}
                    </span>
                    <span className="text-[10px] text-text-muted flex-shrink-0">
                      {post.date.slice(0, 10)}
                    </span>
                  </div>
                  <p className="text-xs text-text-muted line-clamp-1">
                    {post.description}
                  </p>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {post.tags.slice(0, 3).map((tag) => (
                      <span
                        key={tag}
                        className="text-[9px] px-1.5 py-0.5 rounded-md border border-accent/15 text-accent bg-accent/5"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </a>
            ))
          ) : (
            <div className="px-4 py-6 text-center text-text-muted text-sm">
              未找到匹配的文章
            </div>
          )}
        </div>
      )}
    </div>
  );
}
