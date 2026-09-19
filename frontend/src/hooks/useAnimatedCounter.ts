import { useEffect, useState, useRef } from "react";

export function useAnimatedCounter(end: number, duration: number = 1000): number {
  const [count, setCount] = useState(0);
  const countRef = useRef(0);

  useEffect(() => {
    let startTimestamp: number | null = null;
    let animationFrameId: number;
    const startValue = countRef.current;

    if (startValue === end) {
      setCount(end);
      return;
    }

    const step = (timestamp: number) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      // easeOutExpo
      const easeProgress = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
      const current = Math.round(startValue + easeProgress * (end - startValue));
      
      countRef.current = current;
      setCount(current);
      
      if (progress < 1) {
        animationFrameId = window.requestAnimationFrame(step);
      }
    };

    animationFrameId = window.requestAnimationFrame(step);

    return () => {
      if (animationFrameId) {
        window.cancelAnimationFrame(animationFrameId);
      }
    };
  }, [end, duration]);

  return count;
}
