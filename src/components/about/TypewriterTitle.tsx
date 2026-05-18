'use client';

import { useState, useEffect, useRef } from 'react';

const titles = [
  'OpenClaw 应用工程师',
  'AI Agent 开发工程师',
  '嵌入式硬件爱好者',
  '全栈工程实践者',
];

export default function TypewriterTitle() {
  const [currentTitle, setCurrentTitle] = useState(0);
  const [displayText, setDisplayText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const title = titles[currentTitle];

    if (!isDeleting) {
      if (displayText.length < title.length) {
        timeoutRef.current = setTimeout(() => {
          setDisplayText(title.slice(0, displayText.length + 1));
        }, 80);
      } else {
        timeoutRef.current = setTimeout(() => setIsDeleting(true), 2000);
      }
    } else {
      if (displayText.length > 0) {
        timeoutRef.current = setTimeout(() => {
          setDisplayText(displayText.slice(0, -1));
        }, 40);
      } else {
        setIsDeleting(false);
        setCurrentTitle((prev) => (prev + 1) % titles.length);
      }
    }

    return () => { if (timeoutRef.current) clearTimeout(timeoutRef.current); };
  }, [displayText, isDeleting, currentTitle]);

  return (
    <span
      className="text-sm"
      style={{
        background: 'linear-gradient(135deg, #c084fc, #a78bfa, #e879f9)',
        backgroundSize: '200% 200%',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        backgroundClip: 'text',
        animation: 'gradientShift 4s ease-in-out infinite',
      }}
    >
      {displayText}
      <span
        className="inline-block w-[2px] h-[14px] ml-0.5 align-middle"
        style={{
          background: '#c084fc',
          animation: 'cursorBlink 1s step-end infinite',
        }}
      />
      <style>{`
        @keyframes cursorBlink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0; }
        }
        @keyframes gradientShift {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
      `}</style>
    </span>
  );
}
