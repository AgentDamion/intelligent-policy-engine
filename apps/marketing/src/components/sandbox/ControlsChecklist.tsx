import { CheckCircle2, AlertTriangle, XCircle, Lightbulb } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface Control {
  id: string;
  name: string;
  status: 'pass' | 'partial' | 'fail';
  description: string;
  aiSuggestion?: string;
  expectedImpact?: number; // Percentage risk reduction
}

interface ControlsChecklistProps {
  controls: Control[];
  onApplyFix?: (controlId: string) => void;
}

export const ControlsChecklist = ({ controls, onApplyFix }: ControlsChecklistProps) => {
  const getStatusIcon = (status: Control['status']) => {
    switch (status) {
      case 'pass':
        return <CheckCircle2 className="w-5 h-5 text-success" />;
      case 'partial':
        return <AlertTriangle className="w-5 h-5 text-warning" />;
      case 'fail':
        return <XCircle className="w-5 h-5 text-destructive" />;
    }
  };

  const getStatusBadge = (status: Control['status']) => {
    switch (status) {
      case 'pass':
        return <Badge variant="default" className="bg-success text-success-foreground">Pass</Badge>;
      case 'partial':
        return <Badge variant="default" className="bg-warning text-warning-foreground">Partial</Badge>;
      case 'fail':
        return <Badge variant="destructive">Fail</Badge>;
    }
  };

  return (
    <div className="space-y-3">
      <AnimatePresence mode="popLayout">
        {controls.map((control) => (
          <motion.div
            key={control.id}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            layout
          >
            <Card className="p-4 space-y-3 hover-scale">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3 flex-1">
                  <motion.div
                    key={control.status}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                  >
                    {getStatusIcon(control.status)}
                  </motion.div>
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{control.name}</span>
                      {getStatusBadge(control.status)}
                    </div>
                    <p className="text-sm text-muted-foreground">{control.description}</p>
                  </div>
                </div>
                {control.expectedImpact && (
                  <Badge variant="outline" className="ml-2">
                    -{control.expectedImpact}%
                  </Badge>
                )}
              </div>

              {control.aiSuggestion && control.status !== 'pass' && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  className="rounded-md border border-primary/20 bg-primary/5 p-3 space-y-2"
                >
                  <div className="flex items-center gap-2">
                    <Lightbulb className="w-4 h-4 text-primary" />
                    <span className="text-xs font-semibold">AI Suggestion</span>
                  </div>
                  <p className="text-xs">{control.aiSuggestion}</p>
                  <div className="flex gap-2">
                    <Button 
                      size="sm" 
                      variant="default"
                      onClick={() => onApplyFix?.(control.id)}
                    >
                      Apply Fix
                    </Button>
                    <Button size="sm" variant="ghost">
                      Details
                    </Button>
                  </div>
                </motion.div>
              )}
            </Card>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};
