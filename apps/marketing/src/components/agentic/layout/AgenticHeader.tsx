import { clsx } from 'clsx';
import { Share2, Settings, Inbox, Gauge, FileCheck, Cog, FlaskConical, Network, TestTube } from 'lucide-react';
import { ACButton } from '@/components/agentic/ac/ACButton';
import { toast } from '@/hooks/use-toast';
import { BrandLogo } from '@/components/brand/BrandLogo';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const tabs = [
  { id: 'inbox', label: 'Inbox' },
  { id: 'weave', label: 'Weave' },
  { id: 'decisions', label: 'Decisions' },
  { id: 'configuration', label: 'Configuration' },
  { id: 'workbench', label: 'Workbench' },
  { id: 'middleware', label: 'Middleware' },
  { id: 'test', label: 'Test' },
];

interface AgenticHeaderProps {
  active: 'inbox' | 'weave' | 'decisions' | 'configuration' | 'workbench' | 'middleware' | 'test';
  onTabChange: (tab: string) => void;
}

export const AgenticHeader = ({ active, onTabChange }: AgenticHeaderProps) => {
  const navigationItems = [
    { id: 'inbox', label: 'Inbox', icon: Inbox, description: 'Task and approval queue' },
    { id: 'weave', label: 'Weave', icon: Network, description: 'Policy simulation sandbox' },
    { id: 'decisions', label: 'Decisions', icon: FileCheck, description: 'Decision attestation' },
    { id: 'configuration', label: 'Configuration', icon: Cog, description: 'Asset registry' },
    { id: 'workbench', label: 'Workbench', icon: FlaskConical, description: 'Policy studio' },
    { id: 'middleware', label: 'Middleware', icon: Gauge, description: 'Enforcement monitoring' },
    { id: 'test', label: 'Test', icon: TestTube, description: 'Testing environment' },
  ];

  const handleShare = () => {
    toast({
      title: "Share workspace",
      description: "Sharing options will be available soon.",
    });
  };

  return (
    <header
      className="h-[64px] border-b border-ink-100 bg-surface-0 flex items-center justify-between px-s4"
      role="banner"
    >
      <div className="flex items-center gap-s3">
        <BrandLogo size="small" variant="light" showIcon={true} />
        <div>
          <p className="text-[14px] font-semibold text-ink-900">
            GlobalMed Therapeutics
          </p>
          <p className="text-[12px] font-mono text-ink-500">
            ONCAVEX™ Workspace
          </p>
        </div>
      </div>

      <nav role="tablist" aria-label="Main navigation" className="flex">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            role="tab"
            aria-selected={active === tab.id}
            onClick={() => onTabChange(tab.id)}
            className={clsx(
              'px-s4 py-s2 text-[14px] font-medium relative outline-none transition-colors',
              'focus:shadow-focus-ring',
              active === tab.id
                ? 'text-primary'
                : 'text-ink-500 hover:text-ink-700'
            )}
          >
            {tab.label}
            {active === tab.id && (
              <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-primary" />
            )}
          </button>
        ))}
      </nav>

      <div className="flex items-center gap-s2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <ACButton variant="secondary" data-action="navigate">
              <Settings className="h-4 w-4 mr-s2" />
              Navigate
            </ACButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-64">
            <DropdownMenuLabel>Go to Section</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {navigationItems.map((item) => {
              const IconComponent = item.icon;
              return (
                <DropdownMenuItem
                  key={item.id}
                  onClick={() => onTabChange(item.id)}
                  className="cursor-pointer"
                >
                  <IconComponent className="h-4 w-4 mr-2" />
                  <div className="flex flex-col">
                    <span className="font-medium">{item.label}</span>
                    <span className="text-xs text-muted-foreground">{item.description}</span>
                  </div>
                </DropdownMenuItem>
              );
            })}
          </DropdownMenuContent>
        </DropdownMenu>
        <ACButton variant="primary" data-action="share" onClick={handleShare}>
          <Share2 className="h-4 w-4 mr-s2" />
          Share
        </ACButton>
      </div>
    </header>
  );
};
