import React, { useEffect, useState } from 'react';
import { Keyboard, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';

interface Shortcut {
  key: string;
  description: string;
  action: () => void;
}

interface KeyboardShortcutsProps {
  shortcuts: Shortcut[];
}

export const KeyboardShortcuts: React.FC<KeyboardShortcutsProps> = ({ shortcuts }) => {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Show shortcuts help with Ctrl/Cmd + /
      if ((event.ctrlKey || event.metaKey) && event.key === '/') {
        event.preventDefault();
        setIsOpen(true);
        return;
      }

      // Process registered shortcuts
      shortcuts.forEach(shortcut => {
        const keys = shortcut.key.toLowerCase().split('+');
        const hasCtrl = keys.includes('ctrl') || keys.includes('cmd');
        const hasShift = keys.includes('shift');
        const hasAlt = keys.includes('alt');
        const mainKey = keys[keys.length - 1];

        const ctrlPressed = event.ctrlKey || event.metaKey;
        const shiftPressed = event.shiftKey;
        const altPressed = event.altKey;
        const keyPressed = event.key.toLowerCase();

        if (
          (hasCtrl === ctrlPressed) &&
          (hasShift === shiftPressed) &&
          (hasAlt === altPressed) &&
          (mainKey === keyPressed)
        ) {
          event.preventDefault();
          shortcut.action();
        }
      });
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [shortcuts]);

  const formatShortcutKey = (key: string) => {
    return key
      .split('+')
      .map(k => k.charAt(0).toUpperCase() + k.slice(1))
      .join(' + ');
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="text-muted-foreground hover:text-foreground"
          title="Keyboard shortcuts (Ctrl+/)"
        >
          <Keyboard className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Keyboard className="h-5 w-5" />
            <span>Keyboard Shortcuts</span>
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {shortcuts.map((shortcut, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 rounded-lg border bg-background/50"
              >
                <span className="text-sm">{shortcut.description}</span>
                <Badge variant="outline" className="font-mono text-xs">
                  {formatShortcutKey(shortcut.key)}
                </Badge>
              </div>
            ))}
          </div>
          <div className="pt-4 border-t">
            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
              <span className="text-sm font-medium">Show this help</span>
              <Badge variant="outline" className="font-mono text-xs">
                Ctrl + /
              </Badge>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

// Hook for registering shortcuts
export const useKeyboardShortcuts = (shortcuts: Shortcut[]) => {
  return <KeyboardShortcuts shortcuts={shortcuts} />;
};