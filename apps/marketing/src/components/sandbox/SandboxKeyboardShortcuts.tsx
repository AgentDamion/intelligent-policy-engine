import { useEffect, useState } from 'react';
import { useHotkeys } from 'react-hotkeys-hook';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Keyboard } from 'lucide-react';

interface SandboxKeyboardShortcutsProps {
  onCreateSimulation: () => void;
  onToggleLeftSidebar?: () => void;
  onToggleInspector?: () => void;
  onToggleTimeline: () => void;
  onExport?: () => void;
  onEscape?: () => void;
}

export function SandboxKeyboardShortcuts({
  onCreateSimulation,
  onToggleLeftSidebar,
  onToggleInspector,
  onToggleTimeline,
  onExport,
  onEscape,
}: SandboxKeyboardShortcutsProps) {
  const [showHelp, setShowHelp] = useState(false);

  // Global keyboard shortcuts
  useHotkeys('ctrl+n, cmd+n', (e) => {
    e.preventDefault();
    onCreateSimulation();
    toast.success('Opening Create Simulation');
  });

  useHotkeys('ctrl+b, cmd+b', (e) => {
    e.preventDefault();
    onToggleLeftSidebar?.();
    toast.success('Toggled sidebar');
  });

  useHotkeys('ctrl+i, cmd+i', (e) => {
    e.preventDefault();
    onToggleInspector?.();
    toast.success('Toggled inspector');
  });

  useHotkeys('ctrl+t, cmd+t', (e) => {
    e.preventDefault();
    onToggleTimeline();
    toast.success('Toggled timeline');
  });

  useHotkeys('ctrl+e, cmd+e', (e) => {
    e.preventDefault();
    onExport?.();
  });

  useHotkeys('ctrl+/, cmd+/', (e) => {
    e.preventDefault();
    setShowHelp(true);
  });

  useHotkeys('escape', (e) => {
    e.preventDefault();
    onEscape?.();
  });

  return (
    <Dialog open={showHelp} onOpenChange={setShowHelp}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Keyboard className="h-5 w-5" />
            Keyboard Shortcuts
          </DialogTitle>
          <DialogDescription>
            Navigate the Sandbox faster with these keyboard shortcuts
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid grid-cols-2 gap-4 py-4">
          <ShortcutItem 
            keys={['Ctrl', 'N']} 
            description="Create new simulation" 
          />
          <ShortcutItem 
            keys={['Ctrl', 'B']} 
            description="Toggle left sidebar" 
          />
          <ShortcutItem 
            keys={['Ctrl', 'I']} 
            description="Toggle inspector panel" 
          />
          <ShortcutItem 
            keys={['Ctrl', 'T']} 
            description="Toggle timeline drawer" 
          />
          <ShortcutItem 
            keys={['Ctrl', 'E']} 
            description="Export simulation proof" 
          />
          <ShortcutItem 
            keys={['Ctrl', '/']} 
            description="Show this help dialog" 
          />
          <ShortcutItem 
            keys={['Esc']} 
            description="Close open dialogs" 
          />
          <ShortcutItem 
            keys={['↑', '↓']} 
            description="Navigate simulation list" 
          />
          <ShortcutItem 
            keys={['Enter']} 
            description="Open selected simulation" 
          />
          <ShortcutItem 
            keys={['Tab']} 
            description="Navigate interactive elements" 
          />
        </div>

        <div className="text-xs text-muted-foreground border-t pt-4">
          <p>Note: Use <kbd className="px-1.5 py-0.5 bg-muted rounded text-xs">Cmd</kbd> instead of <kbd className="px-1.5 py-0.5 bg-muted rounded text-xs">Ctrl</kbd> on macOS</p>
        </div>
      </DialogContent>
    </Dialog>
  );
}

interface ShortcutItemProps {
  keys: string[];
  description: string;
}

function ShortcutItem({ keys, description }: ShortcutItemProps) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-sm text-muted-foreground">{description}</span>
      <div className="flex items-center gap-1">
        {keys.map((key, idx) => (
          <kbd 
            key={idx} 
            className="px-2 py-1 bg-muted rounded text-xs font-mono border border-border"
          >
            {key}
          </kbd>
        ))}
      </div>
    </div>
  );
}
