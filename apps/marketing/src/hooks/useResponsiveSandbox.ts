import { useState, useEffect } from 'react';
import { useIsMobile } from './use-mobile';

export function useResponsiveSandbox() {
  const isMobile = useIsMobile(); // <768px
  const [isTablet, setIsTablet] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    const checkBreakpoints = () => {
      const width = window.innerWidth;
      setIsTablet(width >= 768 && width < 1280);
      setIsDesktop(width >= 1280);
    };

    checkBreakpoints();
    window.addEventListener('resize', checkBreakpoints);
    return () => window.removeEventListener('resize', checkBreakpoints);
  }, []);

  return {
    isMobile,
    isTablet,
    isDesktop,
    shouldUseMobileDrawer: isMobile,
    shouldCollapseLeftPanel: isMobile || isTablet,
    shouldUseBottomSheet: isMobile,
  };
}
