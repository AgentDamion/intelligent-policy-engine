import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Link, Plus } from 'lucide-react';

interface LikertScaleProps {
  question: string;
  helpText?: string;
  value: number;
  onChange: (value: number) => void;
  onEvidenceChange?: (evidence: string) => void;
}

const scaleLabels = [
  'Not at all',
  'Minimal',
  'Basic',
  'Good',
  'Strong',
  'Fully operational'
];

export function LikertScale({ question, helpText, value, onChange, onEvidenceChange }: LikertScaleProps) {
  const [showEvidence, setShowEvidence] = useState(false);
  const [evidence, setEvidence] = useState('');

  const handleEvidenceSubmit = () => {
    onEvidenceChange?.(evidence);
    setShowEvidence(false);
  };

  return (
    <div className="border border-border rounded-lg p-4 space-y-4">
      <div>
        <h4 className="font-medium text-foreground mb-1">{question}</h4>
        {helpText && (
          <p className="text-sm text-muted-foreground mb-3">{helpText}</p>
        )}
        
        {/* Likert Scale */}
        <div className="flex items-center space-x-2 mb-3">
          {[0, 1, 2, 3, 4, 5].map((score) => (
            <button
              key={score}
              onClick={() => onChange(score)}
              className={cn(
                'w-10 h-10 rounded-full border-2 text-sm font-medium transition-all',
                'hover:scale-110 hover:shadow-md',
                value === score
                  ? 'bg-brand-teal text-primary-foreground border-brand-teal shadow-lg'
                  : 'bg-background border-border text-muted-foreground hover:border-brand-teal/50'
              )}
            >
              {score}
            </button>
          ))}
        </div>
        
        {/* Scale Labels */}
        <div className="flex justify-between text-xs text-muted-foreground mb-3">
          <span>{scaleLabels[0]}</span>
          <span>{scaleLabels[5]}</span>
        </div>
        
        {/* Selected Label */}
        {value > 0 && (
          <div className="text-sm text-primary font-medium">
            Selected: {scaleLabels[value]}
          </div>
        )}
      </div>
      
      {/* Evidence Section */}
      <div className="border-t border-border pt-3">
        {!showEvidence ? (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowEvidence(true)}
            className="text-xs"
          >
            <Plus className="w-3 h-3 mr-1" />
            Attach Evidence
          </Button>
        ) : (
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-foreground mb-1">
                Evidence URL (optional)
              </label>
              <div className="flex space-x-2">
                <div className="flex-1 relative">
                  <Link className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    type="url"
                    value={evidence}
                    onChange={(e) => setEvidence(e.target.value)}
                    placeholder="https://docs.example.com/policy"
                    className="w-full pl-10 pr-3 py-2 text-xs border border-input rounded-md bg-background"
                  />
                </div>
                <Button size="sm" onClick={handleEvidenceSubmit} className="text-xs">
                  Add
                </Button>
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={() => setShowEvidence(false)}
                  className="text-xs"
                >
                  Cancel
                </Button>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              Link to documentation, policies, or other evidence supporting this capability.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}