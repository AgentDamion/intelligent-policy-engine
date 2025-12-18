// Accessibility utilities for consistent focus management and ARIA attributes

// Generate unique IDs for form elements
export const generateId = (prefix: string = 'id'): string => {
  return `${prefix}-${Math.random().toString(36).substr(2, 9)}`;
};

// Focus ring classes (consistent 2px blue ring as specified)
export const focusRingClasses = 'focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500';

// Screen reader only text utility
export const srOnly = 'sr-only';

// Announce message to screen readers
export const announce = (message: string, priority: 'polite' | 'assertive' = 'polite') => {
  const announcement = document.createElement('div');
  announcement.setAttribute('role', 'status');
  announcement.setAttribute('aria-live', priority);
  announcement.setAttribute('aria-atomic', 'true');
  announcement.className = srOnly;
  announcement.textContent = message;
  
  document.body.appendChild(announcement);
  
  // Remove after announcement
  setTimeout(() => {
    document.body.removeChild(announcement);
  }, 1000);
};

// Trap focus within a container (useful for modals)
export const trapFocus = (container: HTMLElement) => {
  const focusableElements = container.querySelectorAll(
    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
  );
  
  const firstFocusable = focusableElements[0] as HTMLElement;
  const lastFocusable = focusableElements[focusableElements.length - 1] as HTMLElement;
  
  const handleTabKey = (e: KeyboardEvent) => {
    if (e.key !== 'Tab') return;
    
    if (e.shiftKey) {
      if (document.activeElement === firstFocusable) {
        e.preventDefault();
        lastFocusable?.focus();
      }
    } else {
      if (document.activeElement === lastFocusable) {
        e.preventDefault();
        firstFocusable?.focus();
      }
    }
  };
  
  container.addEventListener('keydown', handleTabKey);
  
  // Focus first element
  firstFocusable?.focus();
  
  // Return cleanup function
  return () => {
    container.removeEventListener('keydown', handleTabKey);
  };
};

// Restore focus to a previous element (useful after closing modals)
export const restoreFocus = (element: HTMLElement | null) => {
  if (element && 'focus' in element) {
    element.focus();
  }
};

// Get ARIA label for form validation state
export const getAriaValidation = (error?: string) => {
  return {
    'aria-invalid': error ? 'true' : undefined,
    'aria-errormessage': error ? generateId('error') : undefined,
  };
};

// Keyboard navigation helpers
export const handleArrowNavigation = (
  e: KeyboardEvent,
  currentIndex: number,
  totalItems: number,
  onChange: (newIndex: number) => void
) => {
  let newIndex = currentIndex;
  
  switch (e.key) {
    case 'ArrowUp':
    case 'ArrowLeft':
      e.preventDefault();
      newIndex = currentIndex > 0 ? currentIndex - 1 : totalItems - 1;
      break;
    case 'ArrowDown':
    case 'ArrowRight':
      e.preventDefault();
      newIndex = currentIndex < totalItems - 1 ? currentIndex + 1 : 0;
      break;
    case 'Home':
      e.preventDefault();
      newIndex = 0;
      break;
    case 'End':
      e.preventDefault();
      newIndex = totalItems - 1;
      break;
    default:
      return;
  }
  
  onChange(newIndex);
};

// Live region for dynamic content updates
export const createLiveRegion = (priority: 'polite' | 'assertive' = 'polite') => {
  const region = document.createElement('div');
  region.setAttribute('aria-live', priority);
  region.setAttribute('aria-atomic', 'true');
  region.className = srOnly;
  document.body.appendChild(region);
  
  return {
    announce: (message: string) => {
      region.textContent = message;
    },
    destroy: () => {
      document.body.removeChild(region);
    },
  };
};

// Skip to main content link
export const skipToMainId = 'main-content';

// ARIA labels for common UI patterns
export const ariaLabels = {
  closeModal: 'Close dialog',
  togglePassword: 'Toggle password visibility',
  loading: 'Loading',
  required: 'Required field',
  expandMenu: 'Expand menu',
  collapseMenu: 'Collapse menu',
  previousPage: 'Go to previous page',
  nextPage: 'Go to next page',
  sortAscending: 'Sort ascending',
  sortDescending: 'Sort descending',
} as const;

// Ensure interactive elements are keyboard accessible
export const ensureKeyboardAccessible = (element: HTMLElement) => {
  if (!element.hasAttribute('tabindex')) {
    element.setAttribute('tabindex', '0');
  }
  
  // Add keyboard event listeners if not a native button/link
  if (!['BUTTON', 'A', 'INPUT', 'SELECT', 'TEXTAREA'].includes(element.tagName)) {
    element.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        element.click();
      }
    });
  }
};
