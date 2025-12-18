import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { List, BarChart3, Info, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SandboxMobileNavProps {
  activeView: 'list' | 'canvas' | 'detail' | 'settings';
  onViewChange: (view: 'list' | 'canvas' | 'detail' | 'settings') => void;
  listContent?: React.ReactNode;
  detailContent?: React.ReactNode;
  settingsContent?: React.ReactNode;
}

export function SandboxMobileNav({
  activeView,
  onViewChange,
  listContent,
  detailContent,
  settingsContent,
}: SandboxMobileNavProps) {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-background border-t border-border">
      <nav className="flex items-center justify-around h-16 px-2">
        {/* Simulations List */}
        <Sheet>
          <SheetTrigger asChild>
            <Button
              variant="ghost"
              className={cn(
                'flex-1 flex flex-col items-center justify-center h-full gap-1',
                activeView === 'list' && 'text-primary bg-accent'
              )}
              onClick={() => onViewChange('list')}
            >
              <List className="h-5 w-5" />
              <span className="text-xs">List</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="bottom" className="h-[80vh]">
            <SheetHeader>
              <SheetTitle>Simulations</SheetTitle>
            </SheetHeader>
            <div className="mt-4">
              {listContent}
            </div>
          </SheetContent>
        </Sheet>

        {/* Canvas View */}
        <Button
          variant="ghost"
          className={cn(
            'flex-1 flex flex-col items-center justify-center h-full gap-1',
            activeView === 'canvas' && 'text-primary bg-accent'
          )}
          onClick={() => onViewChange('canvas')}
        >
          <BarChart3 className="h-5 w-5" />
          <span className="text-xs">Canvas</span>
        </Button>

        {/* Detail Inspector */}
        <Sheet>
          <SheetTrigger asChild>
            <Button
              variant="ghost"
              className={cn(
                'flex-1 flex flex-col items-center justify-center h-full gap-1',
                activeView === 'detail' && 'text-primary bg-accent'
              )}
              onClick={() => onViewChange('detail')}
            >
              <Info className="h-5 w-5" />
              <span className="text-xs">Detail</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="bottom" className="h-[80vh]">
            <SheetHeader>
              <SheetTitle>Inspector</SheetTitle>
            </SheetHeader>
            <div className="mt-4">
              {detailContent}
            </div>
          </SheetContent>
        </Sheet>

        {/* Settings */}
        <Sheet>
          <SheetTrigger asChild>
            <Button
              variant="ghost"
              className={cn(
                'flex-1 flex flex-col items-center justify-center h-full gap-1',
                activeView === 'settings' && 'text-primary bg-accent'
              )}
              onClick={() => onViewChange('settings')}
            >
              <Settings className="h-5 w-5" />
              <span className="text-xs">Settings</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="bottom" className="h-[80vh]">
            <SheetHeader>
              <SheetTitle>Settings</SheetTitle>
            </SheetHeader>
            <div className="mt-4">
              {settingsContent}
            </div>
          </SheetContent>
        </Sheet>
      </nav>
    </div>
  );
}
