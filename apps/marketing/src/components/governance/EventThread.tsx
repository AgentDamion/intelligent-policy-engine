import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { MessageSquare, ThumbsUp, AlertTriangle, Bot, ChevronDown, ChevronUp } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { type GovernanceEvent } from '@/lib/data/governance';
import { cn } from '@/lib/utils';

interface EventThreadProps {
  event: GovernanceEvent;
  onQuickAction?: (eventId: string, action: 'approve' | 'flag' | 'comment') => void;
}

interface AIComment {
  id: string;
  agent: 'PolicyCopilot' | 'DriftDetector' | 'ComplianceBot';
  message: string;
  confidence: number;
  timestamp: string;
}

export const EventThread: React.FC<EventThreadProps> = ({ event, onQuickAction }) => {
  const [expanded, setExpanded] = useState(false);
  const [selectedAction, setSelectedAction] = useState<string | null>(null);

  // Mock AI comments for demonstration
  const aiComments: AIComment[] = [
    {
      id: '1',
      agent: 'ComplianceBot',
      message: event.status === 'flagged' 
        ? 'This policy was flagged for training mode detection. Want to simulate mitigation?'
        : 'Policy validation passed all compliance checks. Safe to approve.',
      confidence: event.ai_confidence || 0.9,
      timestamp: new Date(Date.now() - 300000).toISOString(),
    }
  ];

  const handleQuickAction = (action: 'approve' | 'flag' | 'comment') => {
    setSelectedAction(action);
    setTimeout(() => setSelectedAction(null), 1000);
    onQuickAction?.(event.id, action);
  };

  const getAgentAvatar = (agent: string) => {
    const avatars = {
      PolicyCopilot: 'PC',
      DriftDetector: 'DD',
      ComplianceBot: 'CB',
    };
    return avatars[agent as keyof typeof avatars] || 'AI';
  };

  const getAgentColor = (agent: string) => {
    const colors = {
      PolicyCopilot: 'bg-primary',
      DriftDetector: 'bg-warning',
      ComplianceBot: 'bg-success',
    };
    return colors[agent as keyof typeof colors] || 'bg-muted';
  };

  return (
    <Card className="hover:shadow-md transition-all duration-300 group">
      <CardContent className="p-4 space-y-3">
        {/* Event Header */}
        <div className="flex items-start gap-3">
          <div className={cn(
            "h-10 w-10 rounded-full flex items-center justify-center shrink-0",
            event.status === 'approved' && "bg-success/10 text-success",
            event.status === 'pending' && "bg-warning/10 text-warning",
            event.status === 'flagged' && "bg-destructive/10 text-destructive"
          )}>
            {event.type === 'policy' && '📋'}
            {event.type === 'audit' && '🔍'}
            {event.type === 'tool_request' && '🛠️'}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div className="space-y-1 flex-1">
                <h3 className="font-semibold text-sm leading-tight">{event.title}</h3>
                <p className="text-xs text-muted-foreground line-clamp-2">{event.summary}</p>
              </div>

              <div className="flex flex-col items-end gap-1 shrink-0">
                <Badge variant={
                  event.status === 'approved' ? 'default' :
                  event.status === 'pending' ? 'secondary' :
                  'destructive'
                }>
                  {event.status}
                </Badge>
                {event.ai_confidence && (
                  <span className="text-xs text-muted-foreground">
                    AI {(event.ai_confidence * 100).toFixed(0)}%
                  </span>
                )}
              </div>
            </div>

            {/* Quick Action Chips */}
            <div className="flex items-center gap-2 mt-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleQuickAction('approve')}
                className={cn(
                  "h-7 text-xs transition-all",
                  selectedAction === 'approve' && "bg-success/10 border-success text-success"
                )}
              >
                <ThumbsUp className="h-3 w-3 mr-1" />
                Looks good!
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleQuickAction('flag')}
                className={cn(
                  "h-7 text-xs transition-all",
                  selectedAction === 'flag' && "bg-destructive/10 border-destructive text-destructive"
                )}
              >
                <AlertTriangle className="h-3 w-3 mr-1" />
                Review needed
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setExpanded(!expanded)}
                className="h-7 text-xs"
              >
                <MessageSquare className="h-3 w-3 mr-1" />
                {expanded ? 'Hide' : 'Thread'}
                {expanded ? <ChevronUp className="h-3 w-3 ml-1" /> : <ChevronDown className="h-3 w-3 ml-1" />}
              </Button>
            </div>
          </div>
        </div>

        {/* Expandable Thread */}
        <AnimatePresence>
          {expanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
              className="space-y-3 pt-3 border-t"
            >
              {aiComments.map((comment) => (
                <div key={comment.id} className="flex gap-3">
                  <Avatar className={cn("h-8 w-8", getAgentColor(comment.agent))}>
                    <AvatarFallback className="text-xs text-white">
                      {getAgentAvatar(comment.agent)}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium">{comment.agent}</span>
                      <Bot className="h-3 w-3 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">
                        {new Date(comment.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                    <p className="text-sm text-foreground/90 bg-muted/50 rounded-lg p-2">
                      {comment.message}
                    </p>
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="sm" className="h-6 text-xs">
                        Simulate
                      </Button>
                      <Button variant="ghost" size="sm" className="h-6 text-xs">
                        View Details
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
              
              {/* Additional metadata */}
              <div className="text-xs text-muted-foreground space-y-1 pt-2 border-t">
                {event.partner && <p>Partner: {event.partner}</p>}
                {event.policy_id && <p>Policy ID: {event.policy_id}</p>}
                {event.tool_name && <p>Tool: {event.tool_name}</p>}
                <p>Timestamp: {new Date(event.timestamp).toLocaleString()}</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </CardContent>
    </Card>
  );
};
