import { useState, useEffect, useRef } from 'react';

const AnimatedCounter = ({ 
  end, 
  duration = 2000, 
  prefix = '', 
  suffix = '',
  className = '',
  formatNumber = true,
  startDelay = 0 
}) => {
  const [count, setCount] = useState(0);
  const [hasStarted, setHasStarted] = useState(false);
  const counterRef = useRef(null);
  const frameRef = useRef();
  const hasStartedRef = useRef(false);

  // Intersection Observer para activar cuando entre en viewport
  useEffect(() => {
    // Reset state when component re-mounts with new props
    hasStartedRef.current = false;
    setHasStarted(false);
    setCount(0);
    
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasStartedRef.current) {
          hasStartedRef.current = true;
          setTimeout(() => {
            startAnimation();
            setHasStarted(true);
          }, startDelay);
        }
      },
      { threshold: 0.3 }
    );

    if (counterRef.current) {
      observer.observe(counterRef.current);
    }

    return () => {
      if (counterRef.current) {
        observer.unobserve(counterRef.current);
      }
      if (frameRef.current) {
        cancelAnimationFrame(frameRef.current);
      }
    };
  }, [end, startDelay]);

  // Ya no necesitamos este useEffect porque usamos keys en el parent

  const startAnimation = () => {
    const startTime = Date.now();
    const startValue = 0;
    const endValue = end;

    // Si el valor final es 0, simplemente mostrarlo
    if (endValue === 0) {
      setCount(0);
      return;
    }

    const animate = () => {
      const now = Date.now();
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Easing function (ease-out)
      const easeOut = 1 - Math.pow(1 - progress, 3);
      const currentValue = Math.floor(startValue + (endValue - startValue) * easeOut);

      setCount(currentValue);

      if (progress < 1) {
        frameRef.current = requestAnimationFrame(animate);
      }
    };

    frameRef.current = requestAnimationFrame(animate);
  };

  const formatDisplayValue = (value) => {
    let formatted = value;
    if (formatNumber && value >= 1000) {
      formatted = value.toLocaleString();
    }
    return `${prefix}${formatted}${suffix}`;
  };

  return (
    <span 
      ref={counterRef}
      className={`inline-block transition-all duration-300 ${className}`}
      style={{
        transform: hasStarted ? 'scale(1)' : 'scale(0.9)',
        opacity: hasStarted ? 1 : 0.7
      }}
    >
      {formatDisplayValue(count)}
    </span>
  );
};

export default AnimatedCounter;