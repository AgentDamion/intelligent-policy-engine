import React from 'react';
import { Link } from 'react-router-dom';
import { Home, ChevronRight, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface VERAConversationHeaderProps {
  shadowMode?: boolean;
  onToggleShadowMode?: () => void;
}

export const VERAConversationHeader = ({ 
  shadowMode = true,
  onToggleShadowMode 
}: VERAConversationHeaderProps) => {
  return (
    <header className="sticky top-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border">
      <div className="flex items-center justify-between px-6 py-3">
        {/* Breadcrumb Navigation */}
        <nav className="flex items-center gap-2 text-sm">
          <Link 
            to="/" 
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <Home className="w-4 h-4" />
          </Link>
          <ChevronRight className="w-3 h-3 text-muted-foreground" />
          <span className="font-semibold text-foreground">VERA</span>
          <ChevronRight className="w-3 h-3 text-muted-foreground" />
          <span className="text-muted-foreground">Conversation</span>
        </nav>

        {/* Shadow Mode Toggle */}
        <Button
          variant={shadowMode ? "default" : "outline"}
          size="sm"
          className={`rounded-full gap-2 ${shadowMode ? 'bg-orange-500 hover:bg-orange-600 text-white' : ''}`}
          onClick={onToggleShadowMode}
        >
          <Eye className="w-4 h-4" />
          Shadow Mode
        </Button>
      </div>

      {/* Subtle gradient line */}
      <div className="h-0.5 bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
    </header>
  );
};

export default VERAConversationHeader;














