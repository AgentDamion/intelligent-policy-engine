import React from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { ShieldAlert } from 'lucide-react';

interface MustPassGateAlertProps {
  failedGates: string[];
  onViewDetails: () => void;
}

export function MustPassGateAlert({ failedGates, onViewDetails }: MustPassGateAlertProps) {
  if (failedGates.length === 0) return null;

  return (
    <Alert className="border-red-200 bg-red-50 dark:bg-red-900/20 dark:border-red-800">
      <ShieldAlert className="h-4 w-4 text-red-600 dark:text-red-400" />
      <div className="flex items-center justify-between w-full">
        <div>
          <AlertDescription className="text-red-700 dark:text-red-300">
            <span className="font-medium">Score capped due to gaps in:</span> {failedGates.join(', ')}
          </AlertDescription>
        </div>
        <Button 
          variant="outline" 
          size="sm"
          onClick={onViewDetails}
          className="ml-4 border-red-300 text-red-800 hover:bg-red-100 dark:border-red-600 dark:text-red-200 dark:hover:bg-red-800/30"
        >
          View details
        </Button>
      </div>
    </Alert>
  );
}