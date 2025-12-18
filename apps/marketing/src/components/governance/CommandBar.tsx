import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useHotkeys } from 'react-hotkeys-hook';
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command';
import {
  Sparkles,
  ShieldCheck,
  FileCheck2,
  Workflow,
  Download,
  Search,
  Play,
  BarChart3,
  Settings,
  HelpCircle,
} from 'lucide-react';

interface CommandAction {
  id: string;
  label: string;
  icon: React.ReactNode;
  shortcut?: string;
  action: () => void;
  keywords?: string[];
  group: 'navigation' | 'actions' | 'search' | 'help';
}

interface CommandBarProps {
  onRunSimulation?: () => void;
  onExport?: () => void;
  onRequestTool?: () => void;
}

export const CommandBar: React.FC<CommandBarProps> = ({
  onRunSimulation,
  onExport,
  onRequestTool,
}) => {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  // Register global keyboard shortcut
  useHotkeys('mod+k', (e) => {
    e.preventDefault();
    setOpen((prev) => !prev);
  }, { enableOnFormTags: true });

  // Also support Cmd/Ctrl + /
  useHotkeys('mod+/', (e) => {
    e.preventDefault();
    setOpen((prev) => !prev);
  }, { enableOnFormTags: true });

  // Close on escape
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false);
      }
    };
    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, []);

  const commands: CommandAction[] = [
    // Navigation
    {
      id: 'nav-inbox',
      label: 'Go to Governance Inbox',
      icon: <Sparkles className="h-4 w-4" />,
      action: () => {
        navigate('/governance/inbox');
        setOpen(false);
      },
      keywords: ['inbox', 'governance', 'events', 'activity'],
      group: 'navigation',
    },
    {
      id: 'nav-policies',
      label: 'Go to Policies',
      icon: <ShieldCheck className="h-4 w-4" />,
      action: () => {
        navigate('/governance/policies');
        setOpen(false);
      },
      keywords: ['policies', 'compliance', 'rules'],
      group: 'navigation',
    },
    {
      id: 'nav-audits',
      label: 'Go to Audits',
      icon: <FileCheck2 className="h-4 w-4" />,
      action: () => {
        navigate('/governance/audits');
        setOpen(false);
      },
      keywords: ['audits', 'logs', 'history'],
      group: 'navigation',
    },
    {
      id: 'nav-sandbox',
      label: 'Go to Policy Sandbox',
      icon: <Play className="h-4 w-4" />,
      action: () => {
        navigate('/enterprise/sandbox');
        setOpen(false);
      },
      keywords: ['sandbox', 'simulate', 'test', 'run'],
      group: 'navigation',
    },
    {
      id: 'nav-analytics',
      label: 'Go to Analytics',
      icon: <BarChart3 className="h-4 w-4" />,
      action: () => {
        navigate('/governance/analytics');
        setOpen(false);
      },
      keywords: ['analytics', 'metrics', 'reports', 'dashboard'],
      group: 'navigation',
    },

    // Actions
    {
      id: 'action-simulate',
      label: 'Run Policy Simulation',
      icon: <Play className="h-4 w-4" />,
      action: () => {
        if (onRunSimulation) {
          onRunSimulation();
        } else {
          navigate('/enterprise/sandbox');
        }
        setOpen(false);
      },
      keywords: ['run', 'simulate', 'test', 'sandbox', 'policy'],
      group: 'actions',
      shortcut: '⌘S',
    },
    {
      id: 'action-export',
      label: 'Export Governance Data',
      icon: <Download className="h-4 w-4" />,
      action: () => {
        if (onExport) {
          onExport();
        }
        setOpen(false);
      },
      keywords: ['export', 'download', 'csv', 'data'],
      group: 'actions',
      shortcut: '⌘E',
    },
    {
      id: 'action-request-tool',
      label: 'Request New AI Tool',
      icon: <Workflow className="h-4 w-4" />,
      action: () => {
        if (onRequestTool) {
          onRequestTool();
        }
        setOpen(false);
      },
      keywords: ['request', 'tool', 'new', 'ai', 'add'],
      group: 'actions',
      shortcut: '⌘T',
    },

    // Search examples (natural language)
    {
      id: 'search-flagged-eu',
      label: 'Show flagged tools for EU data',
      icon: <Search className="h-4 w-4" />,
      action: () => {
        navigate('/governance/inbox?status=flagged&region=eu');
        setOpen(false);
      },
      keywords: ['flagged', 'eu', 'europe', 'gdpr', 'data'],
      group: 'search',
    },
    {
      id: 'search-pending',
      label: 'Show all pending approvals',
      icon: <Search className="h-4 w-4" />,
      action: () => {
        navigate('/governance/inbox?status=pending');
        setOpen(false);
      },
      keywords: ['pending', 'approvals', 'waiting', 'review'],
      group: 'search',
    },
    {
      id: 'search-recent',
      label: 'Show recent policy changes',
      icon: <Search className="h-4 w-4" />,
      action: () => {
        navigate('/governance/policies?sort=recent');
        setOpen(false);
      },
      keywords: ['recent', 'changes', 'new', 'updated', 'policies'],
      group: 'search',
    },

    // Help
    {
      id: 'help-docs',
      label: 'Open Documentation',
      icon: <HelpCircle className="h-4 w-4" />,
      action: () => {
        window.open('https://docs.aicomplyr.io', '_blank');
        setOpen(false);
      },
      keywords: ['help', 'docs', 'documentation', 'guide'],
      group: 'help',
    },
    {
      id: 'help-settings',
      label: 'Go to Settings',
      icon: <Settings className="h-4 w-4" />,
      action: () => {
        navigate('/settings');
        setOpen(false);
      },
      keywords: ['settings', 'preferences', 'config'],
      group: 'help',
    },
  ];

  const groupLabels = {
    navigation: 'Navigation',
    actions: 'Quick Actions',
    search: 'Smart Search',
    help: 'Help & Settings',
  };

  const groupedCommands = {
    navigation: commands.filter((c) => c.group === 'navigation'),
    actions: commands.filter((c) => c.group === 'actions'),
    search: commands.filter((c) => c.group === 'search'),
    help: commands.filter((c) => c.group === 'help'),
  };

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput 
        placeholder="Ask a question or search for commands..." 
        className="text-base"
      />
      <CommandList>
        <CommandEmpty>
          <div className="flex flex-col items-center gap-2 py-6 text-center">
            <Sparkles className="h-8 w-8 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              No results found. Try a different query.
            </p>
            <p className="text-xs text-muted-foreground">
              Try: "run simulation", "show flagged tools", or "export data"
            </p>
          </div>
        </CommandEmpty>

        {Object.entries(groupedCommands).map(([groupKey, items], index) => {
          if (items.length === 0) return null;
          
          return (
            <React.Fragment key={groupKey}>
              {index > 0 && <CommandSeparator />}
              <CommandGroup heading={groupLabels[groupKey as keyof typeof groupLabels]}>
                {items.map((command) => (
                  <CommandItem
                    key={command.id}
                    value={`${command.label} ${command.keywords?.join(' ') ?? ''}`}
                    onSelect={command.action}
                    className="flex items-center gap-2 py-3"
                  >
                    <div className="flex items-center gap-3 flex-1">
                      {command.icon}
                      <span>{command.label}</span>
                    </div>
                    {command.shortcut && (
                      <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">
                        {command.shortcut}
                      </kbd>
                    )}
                  </CommandItem>
                ))}
              </CommandGroup>
            </React.Fragment>
          );
        })}
      </CommandList>
    </CommandDialog>
  );
};
