import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ChevronDown, ChevronUp, Bot, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AgentActivityCardProps {
  agentName: string;
  action: string;
  status: 'running' | 'complete' | 'error';
  confidence?: number;
  reasoning?: string;
  metadata?: any;
}

const agentColors = {
  DocumentAgent: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
  ComplianceAgent: 'bg-green-500/10 text-green-600 border-green-500/20',
  KnowledgeAgent: 'bg-purple-500/10 text-purple-600 border-purple-500/20',
  PartnerAgent: 'bg-orange-500/10 text-orange-600 border-orange-500/20',
};

const agentIcons = {
  DocumentAgent: '📝',
  ComplianceAgent: '✓',
  KnowledgeAgent: '📚',
  PartnerAgent: '🤝',
};

export const AgentActivityCard: React.FC<AgentActivityCardProps> = ({
  agentName,
  action,
  status,
  confidence,
  reasoning,
  metadata,
}) => {
  const [expanded, setExpanded] = useState(false);

  const getStatusIcon = () => {
    switch (status) {
      case 'running':
        return <Loader2 className="h-4 w-4 animate-spin" />;
      case 'complete':
        return <CheckCircle2 className="h-4 w-4 text-success" />;
      case 'error':
        return <AlertCircle className="h-4 w-4 text-destructive" />;
    }
  };

  const getStatusBadge = () => {
    switch (status) {
      case 'running':
        return <Badge variant="outline" className="bg-primary/10">Running</Badge>;
      case 'complete':
        return <Badge variant="outline" className="bg-success/10 text-success">Complete</Badge>;
      case 'error':
        return <Badge variant="outline" className="bg-destructive/10 text-destructive">Error</Badge>;
    }
  };

  const colorClass = agentColors[agentName as keyof typeof agentColors] || 'bg-muted text-muted-foreground';
  const icon = agentIcons[agentName as keyof typeof agentIcons] || '🤖';

  return (
    <Card className={cn(
      'transition-all duration-300 border-2',
      colorClass,
      status === 'running' && 'animate-pulse'
    )}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3 flex-1">
            <div className="text-2xl">{icon}</div>
            <div className="flex-1 space-y-2">
              <div className="flex items-center gap-2">
                <h4 className="font-semibold">{agentName}</h4>
                {getStatusIcon()}
                {getStatusBadge()}
              </div>
              <p className="text-sm text-muted-foreground">
                {action.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
              </p>
              
              {confidence !== undefined && (
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Confidence</span>
                    <span className="font-medium">{Math.round(confidence * 100)}%</span>
                  </div>
                  <Progress value={confidence * 100} className="h-2" />
                </div>
              )}

              {metadata && (
                <div className="text-xs text-muted-foreground">
                  {metadata.score !== undefined && (
                    <span>Score: {metadata.score}%</span>
                  )}
                  {metadata.documents_found !== undefined && (
                    <span>Documents: {metadata.documents_found}</span>
                  )}
                  {metadata.answer_length !== undefined && (
                    <span>Length: {metadata.answer_length} chars</span>
                  )}
                </div>
              )}
            </div>
          </div>

          {reasoning && (
            <button
              onClick={() => setExpanded(!expanded)}
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </button>
          )}
        </div>

        {reasoning && expanded && (
          <div className="mt-4 pt-4 border-t border-border">
            <p className="text-sm text-muted-foreground">{reasoning}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
