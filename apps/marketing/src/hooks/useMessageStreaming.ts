import { useState, useEffect } from 'react';

export const useMessageStreaming = (message: string, isActive: boolean, speed: number = 1) => {
  const [displayedText, setDisplayedText] = useState('');
  
  useEffect(() => {
    if (!isActive) {
      setDisplayedText('');
      return;
    }
    
    let currentIndex = 0;
    const charDelay = 30 / speed; // Adjust speed: 30ms baseline
    
    const interval = setInterval(() => {
      if (currentIndex <= message.length) {
        setDisplayedText(message.slice(0, currentIndex));
        currentIndex++;
      } else {
        clearInterval(interval);
      }
    }, charDelay);
    
    return () => clearInterval(interval);
  }, [message, isActive, speed]);
  
  return displayedText;
};

export const useCountUp = (target: number, duration: number = 2000, isActive: boolean = true) => {
  const [count, setCount] = useState(0);
  
  useEffect(() => {
    if (!isActive) {
      setCount(0);
      return;
    }
    
    const increment = target / (duration / 16);
    let current = 0;
    
    const timer = setInterval(() => {
      current += increment;
      if (current >= target) {
        setCount(target);
        clearInterval(timer);
      } else {
        setCount(Math.floor(current));
      }
    }, 16);
    
    return () => clearInterval(timer);
  }, [target, duration, isActive]);
  
  return count;
};
