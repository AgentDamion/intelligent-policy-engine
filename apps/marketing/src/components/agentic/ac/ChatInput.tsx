import { useState, useEffect, KeyboardEvent } from 'react';
import { Send } from 'lucide-react';

interface ChatInputProps {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  disabled: boolean;
  maxLength?: number;
}

export const ChatInput = ({ 
  value, 
  onChange, 
  onSend, 
  disabled, 
  maxLength = 500 
}: ChatInputProps) => {
  const [showCount, setShowCount] = useState(false);

  useEffect(() => {
    setShowCount(value.length > 400);
  }, [value.length]);

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (value.trim() && !disabled) {
        onSend();
      }
    }
  };

  const isOverLimit = value.length > 490;
  const canSend = value.trim().length > 0 && !disabled;

  return (
    <div className="relative flex items-center gap-s2">
      <div className="relative flex-1">
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          maxLength={maxLength}
          placeholder="Type message..."
          className="w-full h-[40px] px-s3 py-s2 text-[14px] border border-ink-200 rounded-r2 bg-surface-0 text-ink-900 placeholder:text-ink-500 focus:border-ink-500 focus:shadow-focus-ring outline-none disabled:bg-surface-50 disabled:text-ink-500"
          autoFocus
        />
        
        {showCount && (
          <span 
            className={`absolute top-s1 right-s1 font-mono text-[10px] ${
              isOverLimit ? 'text-destructive' : 'text-ink-500'
            }`}
          >
            {value.length}/{maxLength}
          </span>
        )}
      </div>
      
      <button
        onClick={onSend}
        disabled={!canSend}
        className="w-[40px] h-[40px] flex items-center justify-center bg-ink-900 text-white rounded-r2 hover:bg-ink-800 disabled:bg-ink-300 disabled:cursor-not-allowed focus:shadow-focus-ring outline-none transition-colors"
        aria-label="Send message"
      >
        <Send className="w-4 h-4" />
      </button>
    </div>
  );
};
