import React, { useState } from 'react';
import { Send } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface VERAChatInputProps {
  onSend?: (message: string) => void;
  disabled?: boolean;
  placeholder?: string;
}

export const VERAChatInput = ({
  onSend,
  disabled = false,
  placeholder = "Ask VERA about governance, policies, or compliance..."
}: VERAChatInputProps) => {
  const [input, setInput] = useState('');

  const handleSend = () => {
    if (!input.trim() || disabled) return;
    onSend?.(input);
    setInput('');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="sticky bottom-0 bg-background border-t border-border px-6 py-4">
      <div className="max-w-3xl mx-auto">
        <div className="flex gap-3 items-center bg-muted/50 rounded-full px-4 py-2 border border-border focus-within:border-primary/50 focus-within:ring-2 focus-within:ring-primary/20 transition-all">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={placeholder}
            disabled={disabled}
            className="flex-1 border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 placeholder:text-muted-foreground/60"
          />
          <Button 
            onClick={handleSend} 
            disabled={!input.trim() || disabled}
            size="icon"
            className="rounded-full bg-primary hover:bg-primary/90 h-10 w-10 flex-shrink-0"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default VERAChatInput;










