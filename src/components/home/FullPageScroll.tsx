'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

interface Section {
  id: string;
  label: string;
}

interface FullPageScrollProps {
  sections: Section[];
  baseUrl?: string;
}

const XIAOMI_EASE = 'cubic-bezier(0.645, 0.045, 0.355, 1)';
const TRANSITION_DURATION = '0.8s';

export default function FullPageScroll({ sections, baseUrl = '' }: FullPageScrollProps) {
  const [current, setCurrent] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const touchStartY = useRef(0);
  const initialized = useRef(false);
  const wheelAccumRef = useRef(0);
  const wheelTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const goTo = useCallback((index: number) => {
    if (isTransitioning || index < 0 || index >= sections.length || index === current) return;

    const targetSection = sections[index];
    if (targetSection.id === 'about') {
      const prefix = baseUrl.replace(/\/$/, '');
      window.location.href = `${prefix}/about/`;
      return;
    }

    setIsTransitioning(true);
    setCurrent(index);
    wheelAccumRef.current = 0;
    setTimeout(() => setIsTransitioning(false), 900);
  }, [current, isTransitioning, sections]);

  const goNext = useCallback(() => goTo(current + 1), [current, goTo]);
  const goPrev = useCallback(() => goTo(current - 1), [current, goTo]);

  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      const sectionEl = document.getElementById(`section-${sections[current].id}`);
      if (sectionEl) {
        const scrollable = sectionEl.querySelector('.section-scroll') as HTMLElement;
        if (scrollable) {
          const atTop = scrollable.scrollTop <= 2;
          const atBottom = scrollable.scrollTop + scrollable.clientHeight >= scrollable.scrollHeight - 2;
          const canScrollDown = !atBottom;
          const canScrollUp = !atTop;

          if (e.deltaY > 0 && canScrollDown) {
            return;
          }
          if (e.deltaY < 0 && canScrollUp) {
            return;
          }
        }
      }

      e.preventDefault();

      if (wheelTimeoutRef.current) clearTimeout(wheelTimeoutRef.current);
      wheelTimeoutRef.current = setTimeout(() => { wheelAccumRef.current = 0; }, 200);

      wheelAccumRef.current += e.deltaY;
      if (Math.abs(wheelAccumRef.current) < 80) return;

      if (wheelAccumRef.current > 0) goNext();
      else goPrev();
    };

    window.addEventListener('wheel', handleWheel, { passive: false });
    return () => window.removeEventListener('wheel', handleWheel);
  }, [goNext, goPrev, current, sections]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown' || e.key === 'PageDown') { e.preventDefault(); goNext(); }
      if (e.key === 'ArrowUp' || e.key === 'PageUp') { e.preventDefault(); goPrev(); }
      if (e.key === 'Home') { e.preventDefault(); goTo(0); }
      if (e.key === 'End') { e.preventDefault(); goTo(sections.length - 1); }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [goNext, goPrev, goTo, sections.length]);

  useEffect(() => {
    const handleTouchStart = (e: TouchEvent) => { touchStartY.current = e.touches[0].clientY; };
    const handleTouchEnd = (e: TouchEvent) => {
      const diff = touchStartY.current - e.changedTouches[0].clientY;
      if (Math.abs(diff) > 60) { diff > 0 ? goNext() : goPrev(); }
    };
    const el = containerRef.current;
    if (!el) return;
    el.addEventListener('touchstart', handleTouchStart, { passive: true });
    el.addEventListener('touchend', handleTouchEnd, { passive: true });
    return () => { el.removeEventListener('touchstart', handleTouchStart); el.removeEventListener('touchend', handleTouchEnd); };
  }, [goNext, goPrev]);

  useEffect(() => {
    const handleNavRequest = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      const idx = sections.findIndex(s => s.id === detail);
      if (idx >= 0) goTo(idx);
    };
    const handleNavNext = () => goNext();
    window.addEventListener('navigate-section', handleNavRequest);
    window.addEventListener('navigate-next', handleNavNext);
    return () => {
      window.removeEventListener('navigate-section', handleNavRequest);
      window.removeEventListener('navigate-next', handleNavNext);
    };
  }, [goTo, goNext, sections]);

  useEffect(() => {
    window.dispatchEvent(new CustomEvent('section-changed', { detail: { index: current, id: sections[current].id } }));

    sections.forEach((section, i) => {
      const el = document.getElementById(`section-${section.id}`);
      if (!el) return;
      if (i === current) {
        el.style.opacity = '1';
        el.style.transform = 'scale(1) translateY(0)';
        el.style.filter = 'blur(0px)';
        el.style.pointerEvents = 'auto';
        el.style.zIndex = '10';
      } else {
        el.style.opacity = '0';
        el.style.transform = i < current ? 'scale(0.96) translateY(-30px)' : 'scale(0.96) translateY(30px)';
        el.style.filter = 'blur(8px)';
        el.style.pointerEvents = 'none';
        el.style.zIndex = '0';
      }
    });
  }, [current, sections]);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;
    sections.forEach((section, i) => {
      const el = document.getElementById(`section-${section.id}`);
      if (!el) return;
      el.style.transition = `opacity ${TRANSITION_DURATION} ${XIAOMI_EASE}, transform ${TRANSITION_DURATION} ${XIAOMI_EASE}, filter ${TRANSITION_DURATION} ${XIAOMI_EASE}`;
      el.style.position = 'absolute';
      el.style.inset = '0';
      el.style.width = '100%';
      el.style.height = '100%';
      el.style.overflow = 'hidden';
      if (i === 0) {
        el.style.opacity = '1';
        el.style.transform = 'scale(1) translateY(0)';
        el.style.filter = 'blur(0px)';
        el.style.pointerEvents = 'auto';
        el.style.zIndex = '10';
      } else {
        el.style.opacity = '0';
        el.style.transform = 'scale(0.96) translateY(30px)';
        el.style.filter = 'blur(8px)';
        el.style.pointerEvents = 'none';
        el.style.zIndex = '0';
      }
    });
  }, [sections]);

  const parallaxX = current * -6;
  const parallaxY = current * -12;

  return (
    <div ref={containerRef} className="relative w-full h-screen overflow-hidden" style={{ cursor: 'none' }}>
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          transform: `translate(${parallaxX}px, ${parallaxY}px)`,
          transition: `transform ${TRANSITION_DURATION} ${XIAOMI_EASE}`,
          zIndex: 0,
        }}
      />

      <div className="absolute right-4 top-1/2 -translate-y-1/2 z-40 flex flex-col items-center gap-3">
        {sections.map((section, i) => (
          <button
            key={section.id}
            onClick={() => goTo(i)}
            className="rounded-full transition-all duration-500 group relative"
            title={section.label}
            style={{
              width: i === current ? 8 : 6,
              height: i === current ? 24 : 6,
              background: i === current ? 'rgba(192,132,252,0.7)' : 'rgba(255,255,255,0.15)',
              boxShadow: i === current ? '0 0 10px rgba(192,132,252,0.3)' : 'none',
            }}
          >
            <span
              className="absolute right-full mr-3 top-1/2 -translate-y-1/2 whitespace-nowrap text-xs opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
              style={{ color: 'rgba(192,132,252,0.6)' }}
            >
              {section.label}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
