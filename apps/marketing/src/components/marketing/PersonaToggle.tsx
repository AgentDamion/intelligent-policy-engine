import React, { useState } from 'react';
import { cn } from '@/lib/utils';

type Persona = 'enterprise' | 'agency';

const PersonaToggle = () => {
  const [selectedPersona, setSelectedPersona] = useState<Persona>('enterprise');

  return (
    <div className="flex items-center bg-muted/50 rounded-full p-0.5">
      <button
        onClick={() => setSelectedPersona('enterprise')}
        className={cn(
          "px-3 py-1 text-xs font-medium rounded-full transition-all duration-150",
          selectedPersona === 'enterprise'
            ? "bg-background text-foreground shadow-sm"
            : "text-muted-foreground hover:text-foreground"
        )}
      >
        For Enterprises
      </button>
      <button
        onClick={() => setSelectedPersona('agency')}
        className={cn(
          "px-3 py-1 text-xs font-medium rounded-full transition-all duration-150",
          selectedPersona === 'agency'
            ? "bg-background text-foreground shadow-sm"
            : "text-muted-foreground hover:text-foreground"
        )}
      >
        For Agencies
      </button>
    </div>
  );
};

export default PersonaToggle;