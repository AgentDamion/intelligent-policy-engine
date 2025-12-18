import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Lock, Unlock, Clock } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface EditorLockBadgeProps {
  lockedBy: string;
  expiresAt?: string;
  isLockedByMe: boolean;
}

export const EditorLockBadge: React.FC<EditorLockBadgeProps> = ({
  lockedBy,
  expiresAt,
  isLockedByMe
}) => {
  const timeUntilExpiry = expiresAt 
    ? formatDistanceToNow(new Date(expiresAt), { addSuffix: true })
    : null;

  if (isLockedByMe) {
    return (
      <Badge variant="secondary" className="flex items-center gap-1">
        <Unlock className="h-3 w-3" />
        Editing
        {timeUntilExpiry && (
          <span className="text-xs">({timeUntilExpiry})</span>
        )}
      </Badge>
    );
  }

  return (
    <Badge variant="destructive" className="flex items-center gap-1">
      <Lock className="h-3 w-3" />
      Locked by {lockedBy}
      {timeUntilExpiry && (
        <span className="text-xs">({timeUntilExpiry})</span>
      )}
    </Badge>
  );
};