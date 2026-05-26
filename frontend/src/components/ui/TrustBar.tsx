import React, { useEffect, useRef } from 'react';
import gsap from 'gsap';

interface TrustBarProps {
  score: number;
  maxScore?: number;
  className?: string;
}

export const TrustBar: React.FC<TrustBarProps> = ({ score, maxScore = 2000, className = "" }) => {
  const barRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (barRef.current) {
      gsap.to(barRef.current, {
        width: `${Math.min((score / maxScore) * 100, 100)}%`,
        duration: 1.2,
        ease: 'power3.out'
      });
    }
  }, [score, maxScore]);

  return (
    <div className={`h-1 w-full overflow-hidden rounded-full bg-[var(--color-app-border-clean)] ${className}`}>
      <div ref={barRef} className="h-full bg-[var(--color-app-action)]" />
    </div>
  );
};
