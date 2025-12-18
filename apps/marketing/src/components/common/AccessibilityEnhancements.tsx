import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Eye, 
  EyeOff, 
  Type, 
  Contrast, 
  Volume2, 
  VolumeX,
  Keyboard,
  MousePointer,
  Focus
} from 'lucide-react';

interface AccessibilitySettings {
  highContrast: boolean;
  largeText: boolean;
  reducedMotion: boolean;
  screenReader: boolean;
  keyboardNavigation: boolean;
  focusIndicators: boolean;
}

export const AccessibilityEnhancements: React.FC = () => {
  const [settings, setSettings] = useState<AccessibilitySettings>({
    highContrast: false,
    largeText: false,
    reducedMotion: false,
    screenReader: false,
    keyboardNavigation: true,
    focusIndicators: true
  });

  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Load saved accessibility preferences
    const saved = localStorage.getItem('accessibility-settings');
    if (saved) {
      try {
        const parsedSettings = JSON.parse(saved);
        setSettings(parsedSettings);
        applySettings(parsedSettings);
      } catch (error) {
        console.warn('Failed to load accessibility settings:', error);
      }
    }

    // Check for system preferences
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const prefersHighContrast = window.matchMedia('(prefers-contrast: high)').matches;
    
    if (prefersReducedMotion || prefersHighContrast) {
      const systemSettings = {
        ...settings,
        reducedMotion: prefersReducedMotion,
        highContrast: prefersHighContrast
      };
      setSettings(systemSettings);
      applySettings(systemSettings);
    }
  }, []);

  const applySettings = (newSettings: AccessibilitySettings) => {
    const root = document.documentElement;
    
    // High contrast
    if (newSettings.highContrast) {
      root.classList.add('high-contrast');
    } else {
      root.classList.remove('high-contrast');
    }

    // Large text
    if (newSettings.largeText) {
      root.classList.add('large-text');
    } else {
      root.classList.remove('large-text');
    }

    // Reduced motion
    if (newSettings.reducedMotion) {
      root.classList.add('reduce-motion');
    } else {
      root.classList.remove('reduce-motion');
    }

    // Enhanced focus indicators
    if (newSettings.focusIndicators) {
      root.classList.add('enhanced-focus');
    } else {
      root.classList.remove('enhanced-focus');
    }

    // Screen reader optimizations
    if (newSettings.screenReader) {
      root.classList.add('screen-reader-optimized');
    } else {
      root.classList.remove('screen-reader-optimized');
    }
  };

  const updateSetting = (key: keyof AccessibilitySettings, value: boolean) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
    applySettings(newSettings);
    localStorage.setItem('accessibility-settings', JSON.stringify(newSettings));
  };

  const togglePanel = () => {
    setIsVisible(!isVisible);
  };

  return (
    <>
      {/* Floating accessibility button */}
      <Button
        variant="outline"
        size="sm"
        className="fixed bottom-4 right-4 z-40 h-12 w-12 rounded-full shadow-lg"
        onClick={togglePanel}
        aria-label="Open accessibility options"
      >
        <Eye className="h-4 w-4" />
      </Button>

      {/* Accessibility panel */}
      {isVisible && (
        <Card className="fixed bottom-20 right-4 z-40 w-80 shadow-xl">
          <CardContent className="p-4 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-sm">Accessibility Options</h3>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0"
                onClick={togglePanel}
              >
                <EyeOff className="h-3 w-3" />
              </Button>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Contrast className="h-4 w-4" />
                  <span className="text-sm">High Contrast</span>
                </div>
                <Button
                  variant={settings.highContrast ? "default" : "outline"}
                  size="sm"
                  onClick={() => updateSetting('highContrast', !settings.highContrast)}
                >
                  {settings.highContrast ? 'On' : 'Off'}
                </Button>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Type className="h-4 w-4" />
                  <span className="text-sm">Large Text</span>
                </div>
                <Button
                  variant={settings.largeText ? "default" : "outline"}
                  size="sm"
                  onClick={() => updateSetting('largeText', !settings.largeText)}
                >
                  {settings.largeText ? 'On' : 'Off'}
                </Button>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <MousePointer className="h-4 w-4" />
                  <span className="text-sm">Reduced Motion</span>
                </div>
                <Button
                  variant={settings.reducedMotion ? "default" : "outline"}
                  size="sm"
                  onClick={() => updateSetting('reducedMotion', !settings.reducedMotion)}
                >
                  {settings.reducedMotion ? 'On' : 'Off'}
                </Button>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Focus className="h-4 w-4" />
                  <span className="text-sm">Enhanced Focus</span>
                </div>
                <Button
                  variant={settings.focusIndicators ? "default" : "outline"}
                  size="sm"
                  onClick={() => updateSetting('focusIndicators', !settings.focusIndicators)}
                >
                  {settings.focusIndicators ? 'On' : 'Off'}
                </Button>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Volume2 className="h-4 w-4" />
                  <span className="text-sm">Screen Reader</span>
                </div>
                <Button
                  variant={settings.screenReader ? "default" : "outline"}
                  size="sm"
                  onClick={() => updateSetting('screenReader', !settings.screenReader)}
                >
                  {settings.screenReader ? 'On' : 'Off'}
                </Button>
              </div>
            </div>

            <div className="pt-2 border-t">
              <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                <Keyboard className="h-3 w-3" />
                <span>Press Alt+A to toggle this panel</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </>
  );
};

// Keyboard shortcut hook
export const useAccessibilityShortcuts = () => {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Alt + A to toggle accessibility panel
      if (event.altKey && event.key === 'a') {
        event.preventDefault();
        const button = document.querySelector('[aria-label="Open accessibility options"]') as HTMLButtonElement;
        if (button) {
          button.click();
        }
      }

      // Alt + C for high contrast toggle
      if (event.altKey && event.key === 'c') {
        event.preventDefault();
        const root = document.documentElement;
        root.classList.toggle('high-contrast');
      }

      // Alt + T for large text toggle
      if (event.altKey && event.key === 't') {
        event.preventDefault();
        const root = document.documentElement;
        root.classList.toggle('large-text');
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);
};