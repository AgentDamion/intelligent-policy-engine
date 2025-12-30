import React from 'react';
import { ChevronUp, ChevronDown, X } from 'lucide-react';
import { EdgeCard } from '../ui/edge-card';
import { cn } from '@/lib/utils';
import { DEFAULT_ROLE_ARCHETYPES } from '@/services/workflow/roleArchetypeService';
import * as LucideIcons from 'lucide-react';

interface ApprovalChainStepProps {
  stepNumber: number;
  roleArchetypeId: string;
  roleName?: string;
  isSelected?: boolean;
  isParallel?: boolean;
  canMoveUp: boolean;
  canMoveDown: boolean;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onRemove: () => void;
  onSelect?: () => void;
}

// Icon mapping for lucide-react icons
const getIconComponent = (iconName: string) => {
  const IconComponent = (LucideIcons as any)[iconName] || LucideIcons.User;
  return IconComponent;
};

export const ApprovalChainStep: React.FC<ApprovalChainStepProps> = ({
  stepNumber,
  roleArchetypeId,
  roleName,
  isSelected = false,
  isParallel = false,
  canMoveUp,
  canMoveDown,
  onMoveUp,
  onMoveDown,
  onRemove,
  onSelect,
}) => {
  const archetype = DEFAULT_ROLE_ARCHETYPES[roleArchetypeId] || {
    name: roleName || roleArchetypeId,
    icon: 'user',
    color: 'stone',
  };

  const IconComponent = getIconComponent(archetype.icon);

  return (
    <div className="relative">
      <EdgeCard
        variant={isSelected ? 'selected' : 'default'}
        className={cn(
          'cursor-pointer transition-all',
          isSelected && 'ring-2 ring-aicomplyr-yellow ring-offset-2'
        )}
        onClick={onSelect}
      >
        <div className="px-4 py-3 flex items-center justify-between gap-3">
          {/* Left side: Step number and role info */}
          <div className="flex items-center gap-3 flex-1">
            <div className="flex-shrink-0 w-8 h-8 bg-neutral-100 border-2 border-aicomplyr-black flex items-center justify-center font-bold text-sm">
              {stepNumber}
            </div>

            <div className="flex items-center gap-2 flex-1">
              <IconComponent className="w-5 h-5 text-aicomplyr-black" />
              <div>
                <div className="font-semibold text-sm text-aicomplyr-black">
                  {roleName || archetype.name}
                </div>
                {isParallel && (
                  <div className="text-xs text-neutral-500 uppercase tracking-wider">
                    Parallel
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right side: Controls */}
          <div className="flex items-center gap-1">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onMoveUp();
              }}
              disabled={!canMoveUp}
              className={cn(
                'p-1.5 hover:bg-neutral-100 transition-colors',
                !canMoveUp && 'opacity-30 cursor-not-allowed'
              )}
              aria-label="Move up"
            >
              <ChevronUp className="w-4 h-4 text-neutral-600" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onMoveDown();
              }}
              disabled={!canMoveDown}
              className={cn(
                'p-1.5 hover:bg-neutral-100 transition-colors',
                !canMoveDown && 'opacity-30 cursor-not-allowed'
              )}
              aria-label="Move down"
            >
              <ChevronDown className="w-4 h-4 text-neutral-600" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onRemove();
              }}
              className="p-1.5 hover:bg-red-50 text-red-600 transition-colors"
              aria-label="Remove step"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </EdgeCard>

      {/* Connector to next step */}
      {!isParallel && (
        <div className="flex justify-center py-2">
          <div className="w-0.5 h-4 bg-neutral-300" />
        </div>
      )}
    </div>
  );
};

