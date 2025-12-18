import React from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { AlertTriangle } from 'lucide-react';

interface ProvisionalBannerProps {
  completionRate: number;
  evidenceCount: number;
  onResumeAssessment: () => void;
}

export function ProvisionalBanner({ 
  completionRate, 
  evidenceCount, 
  onResumeAssessment 
}: ProvisionalBannerProps) {
  const isProvisional = completionRate < 0.8 || evidenceCount === 0;

  if (!isProvisional) return null;

  return (
    <Alert className="border-yellow-200 bg-yellow-50 dark:bg-yellow-900/20 dark:border-yellow-800">
      <AlertTriangle className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
      <div className="flex items-center justify-between w-full">
        <div>
          <h4 className="font-medium text-yellow-800 dark:text-yellow-200">
            Provisional Score
          </h4>
          <AlertDescription className="text-yellow-700 dark:text-yellow-300">
            Your score is based on partial responses. Add more answers and (optionally) redacted evidence links to increase confidence and unlock more precise recommendations.
          </AlertDescription>
        </div>
        <Button 
          variant="outline" 
          size="sm"
          onClick={onResumeAssessment}
          className="ml-4 border-yellow-300 text-yellow-800 hover:bg-yellow-100 dark:border-yellow-600 dark:text-yellow-200 dark:hover:bg-yellow-800/30"
        >
          Resume assessment
        </Button>
      </div>
    </Alert>
  );
}