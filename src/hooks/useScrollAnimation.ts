import { useEffect, useRef, useState, useCallback } from 'react';

interface ScrollAnimationState {
  [key: string]: {
    scale: number;
    opacity: number;
  };
}

export const useScrollAnimation = (itemIds: string[]) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [animationStates, setAnimationStates] = useState<ScrollAnimationState>({});
  const [isScrolling, setIsScrolling] = useState(false);
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const prefersReducedMotion = useRef(false);

  // Check for reduced motion preference
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    prefersReducedMotion.current = mediaQuery.matches;
    
    const handler = (e: MediaQueryListEvent) => {
      prefersReducedMotion.current = e.matches;
    };
    
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  const calculateAnimationState = useCallback(() => {
    if (!containerRef.current || prefersReducedMotion.current) return;

    const container = containerRef.current;
    const containerRect = container.getBoundingClientRect();
    const containerCenter = containerRect.top + containerRect.height / 2;
    const containerHeight = containerRect.height;

    const newStates: ScrollAnimationState = {};

    itemIds.forEach((id) => {
      const element = container.querySelector(`[data-task-id="${id}"]`);
      if (!element) {
        newStates[id] = { scale: 1, opacity: 1 };
        return;
      }

      const rect = element.getBoundingClientRect();
      const elementCenter = rect.top + rect.height / 2;
      
      // Calculate distance from container center (normalized 0-1)
      const distanceFromCenter = Math.abs(elementCenter - containerCenter) / (containerHeight / 2);
      const normalizedDistance = Math.min(distanceFromCenter, 1);

      // Scale: 0.98 at edges, 1.0 at center
      const scale = 1 - (normalizedDistance * 0.02);
      
      // Opacity: 0.85 at edges, 1.0 at center
      const opacity = 1 - (normalizedDistance * 0.15);

      newStates[id] = {
        scale: Math.max(0.98, scale),
        opacity: Math.max(0.85, opacity)
      };
    });

    setAnimationStates(newStates);
  }, [itemIds]);

  const handleScroll = useCallback(() => {
    if (prefersReducedMotion.current) return;

    setIsScrolling(true);
    calculateAnimationState();

    // Reset scrolling state after scroll ends
    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current);
    }
    scrollTimeoutRef.current = setTimeout(() => {
      setIsScrolling(false);
    }, 150);
  }, [calculateAnimationState]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Initial calculation
    calculateAnimationState();

    container.addEventListener('scroll', handleScroll, { passive: true });
    
    // Also recalculate on resize
    const resizeObserver = new ResizeObserver(() => {
      calculateAnimationState();
    });
    resizeObserver.observe(container);

    return () => {
      container.removeEventListener('scroll', handleScroll);
      resizeObserver.disconnect();
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, [handleScroll, calculateAnimationState]);

  // Recalculate when items change
  useEffect(() => {
    calculateAnimationState();
  }, [itemIds, calculateAnimationState]);

  const getItemStyle = useCallback((id: string): React.CSSProperties => {
    if (prefersReducedMotion.current) {
      return {};
    }

    const state = animationStates[id] || { scale: 1, opacity: 1 };
    
    return {
      transform: `scale3d(${state.scale}, ${state.scale}, 1)`,
      opacity: state.opacity,
      transition: isScrolling 
        ? 'transform 0.15s ease-out, opacity 0.15s ease-out' 
        : 'transform 0.3s ease-out, opacity 0.3s ease-out',
      willChange: 'transform, opacity'
    };
  }, [animationStates, isScrolling]);

  return {
    containerRef,
    getItemStyle,
    isScrolling
  };
};
