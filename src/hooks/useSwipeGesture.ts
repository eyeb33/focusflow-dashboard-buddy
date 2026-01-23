import { useState, useRef, useCallback, TouchEvent } from 'react';

interface SwipeConfig {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  minSwipeDistance?: number;
  maxSwipeTime?: number;
}

interface SwipeHandlers {
  onTouchStart: (e: TouchEvent) => void;
  onTouchMove: (e: TouchEvent) => void;
  onTouchEnd: (e: TouchEvent) => void;
}

export const useSwipeGesture = ({
  onSwipeLeft,
  onSwipeRight,
  minSwipeDistance = 50,
  maxSwipeTime = 300,
}: SwipeConfig): SwipeHandlers => {
  const touchStartX = useRef<number>(0);
  const touchStartY = useRef<number>(0);
  const touchStartTime = useRef<number>(0);
  const isScrolling = useRef<boolean | null>(null);

  const onTouchStart = useCallback((e: TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
    touchStartTime.current = Date.now();
    isScrolling.current = null;
  }, []);

  const onTouchMove = useCallback((e: TouchEvent) => {
    if (isScrolling.current === null) {
      const deltaX = Math.abs(e.touches[0].clientX - touchStartX.current);
      const deltaY = Math.abs(e.touches[0].clientY - touchStartY.current);
      
      // Determine if this is a horizontal or vertical scroll
      // Only treat as horizontal swipe if deltaX is significantly larger than deltaY
      isScrolling.current = deltaY > deltaX;
    }
  }, []);

  const onTouchEnd = useCallback((e: TouchEvent) => {
    // Don't process swipe if user was scrolling vertically
    if (isScrolling.current === true) {
      return;
    }

    const touchEndX = e.changedTouches[0].clientX;
    const touchEndTime = Date.now();
    
    const deltaX = touchEndX - touchStartX.current;
    const deltaTime = touchEndTime - touchStartTime.current;
    
    // Check if swipe meets criteria
    if (Math.abs(deltaX) >= minSwipeDistance && deltaTime <= maxSwipeTime) {
      if (deltaX > 0 && onSwipeRight) {
        onSwipeRight();
      } else if (deltaX < 0 && onSwipeLeft) {
        onSwipeLeft();
      }
    }
  }, [minSwipeDistance, maxSwipeTime, onSwipeLeft, onSwipeRight]);

  return {
    onTouchStart,
    onTouchMove,
    onTouchEnd,
  };
};

export default useSwipeGesture;
