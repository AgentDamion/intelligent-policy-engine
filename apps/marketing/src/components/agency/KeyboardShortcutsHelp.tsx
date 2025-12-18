import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface KeyboardShortcutsHelpProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const ShortcutRow: React.FC<{ keys: string[]; action: string }> = ({ keys, action }) => (
  <div className="flex items-center justify-between py-2 border-b last:border-0">
    <span className="text-sm text-muted-foreground">{action}</span>
    <div className="flex gap-1">
      {keys.map((key, index) => (
        <React.Fragment key={index}>
          {index > 0 && <span className="text-muted-foreground mx-1">+</span>}
          <kbd className="px-2 py-1 bg-muted rounded text-xs font-mono">{key}</kbd>
        </React.Fragment>
      ))}
    </div>
  </div>
);

export const KeyboardShortcutsHelp: React.FC<KeyboardShortcutsHelpProps> = ({
  open,
  onOpenChange,
}) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent aria-labelledby="shortcuts-title" aria-describedby="shortcuts-description">
        <DialogHeader>
          <DialogTitle id="shortcuts-title">Keyboard Shortcuts</DialogTitle>
          <DialogDescription id="shortcuts-description">
            Navigate faster with these keyboard shortcuts
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-1">
          <ShortcutRow keys={['Ctrl', '←']} action="Previous question" />
          <ShortcutRow keys={['Ctrl', '→']} action="Next question" />
          <ShortcutRow keys={['Ctrl', 'S']} action="Save answer" />
          <ShortcutRow keys={['Ctrl', 'G']} action="Generate AI answer" />
          <ShortcutRow keys={['?']} action="Show this help" />
        </div>
        <div className="text-xs text-muted-foreground mt-4">
          Tip: Use ⌘ (Command) on Mac instead of Ctrl
        </div>
      </DialogContent>
    </Dialog>
  );
};
