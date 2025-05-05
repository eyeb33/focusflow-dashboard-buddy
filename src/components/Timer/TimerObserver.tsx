
import React, { useEffect, useRef } from 'react';

interface TimerObserverProps {
  children: React.ReactNode;
}

const TimerObserver: React.FC<TimerObserverProps> = ({ children }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Use IntersectionObserver to detect if timer is visible in the DOM
  useEffect(() => {
    if (!containerRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          const isVisible = entry.isIntersecting;
          sessionStorage.setItem('timerVisible', isVisible ? 'true' : 'false');
        });
      },
      { threshold: 0.1 }
    );

    observer.observe(containerRef.current);
    
    return () => {
      if (containerRef.current) {
        observer.unobserve(containerRef.current);
      }
    };
  }, []);

  return (
    <div ref={containerRef} className="w-full h-full">
      {children}
    </div>
  );
};

export default TimerObserver;
