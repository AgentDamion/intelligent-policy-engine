import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';
import { scrollToSection } from '@/utils/scrollToSection';

export const StickyCTA = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const scrollPercent = (window.scrollY / (document.documentElement.scrollHeight - window.innerHeight)) * 100;
      setIsVisible(scrollPercent > 25 && window.innerWidth < 768);
    };

    window.addEventListener('scroll', handleScroll);
    window.addEventListener('resize', handleScroll);
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleScroll);
    };
  }, []);

  const handleClick = () => {
    scrollToSection('proof-bundle-spotlight');
    window.dispatchEvent(new CustomEvent('analytics', {
      detail: { event: 'sticky_mobile_demo_clicked' }
    }));
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed bottom-0 left-0 right-0 z-50 md:hidden"
        >
          <div className="bg-background border-t border-border shadow-lg p-4 pb-safe">
            <Button 
              onClick={handleClick}
              className="w-full"
              size="lg"
            >
              See a Proof Bundle (2-min demo)
            </Button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
