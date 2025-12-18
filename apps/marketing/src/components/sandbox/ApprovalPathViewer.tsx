import { CheckCircle2, Clock, XCircle, User } from 'lucide-react';
import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

interface ApprovalStage {
  id: string;
  name: string;
  status: 'completed' | 'pending' | 'rejected' | 'current';
  approver?: string;
  timestamp?: string;
  reason?: string;
}

interface ApprovalPathViewerProps {
  stages: ApprovalStage[];
}

export const ApprovalPathViewer = ({ stages }: ApprovalPathViewerProps) => {
  const getStatusIcon = (status: ApprovalStage['status']) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="w-5 h-5 text-success" />;
      case 'current':
        return (
          <motion.div
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ repeat: Infinity, duration: 1.5 }}
          >
            <Clock className="w-5 h-5 text-primary" />
          </motion.div>
        );
      case 'rejected':
        return <XCircle className="w-5 h-5 text-destructive" />;
      case 'pending':
        return <Clock className="w-5 h-5 text-muted-foreground" />;
    }
  };

  return (
    <Card className="p-4">
      <h3 className="font-semibold mb-4">Approval Path</h3>
      <div className="space-y-4">
        {stages.map((stage, index) => (
          <div key={stage.id} className="relative">
            {/* Connector line */}
            {index < stages.length - 1 && (
              <div className="absolute left-[18px] top-[40px] w-0.5 h-[calc(100%+16px)] bg-border" />
            )}
            
            <div className="flex items-start gap-3">
              <div className="relative z-10 bg-background">
                {getStatusIcon(stage.status)}
              </div>
              
              <div className="flex-1 space-y-1">
                <div className="flex items-center gap-2">
                  <span className={`text-sm font-medium ${
                    stage.status === 'completed' ? 'text-success' :
                    stage.status === 'current' ? 'text-primary' :
                    stage.status === 'rejected' ? 'text-destructive' :
                    'text-muted-foreground'
                  }`}>
                    {stage.name}
                  </span>
                </div>
                
                {stage.approver && (
                  <div className="flex items-center gap-2">
                    <Avatar className="w-5 h-5">
                      <AvatarFallback className="text-xs">
                        <User className="w-3 h-3" />
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-xs text-muted-foreground">
                      {stage.approver}
                    </span>
                  </div>
                )}
                
                {stage.timestamp && (
                  <span className="text-xs text-muted-foreground">
                    {new Date(stage.timestamp).toLocaleString()}
                  </span>
                )}
                
                {stage.reason && (
                  <p className="text-xs text-destructive">{stage.reason}</p>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
};
