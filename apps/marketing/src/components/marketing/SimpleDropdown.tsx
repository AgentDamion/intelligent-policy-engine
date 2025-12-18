import React, { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DropdownItem {
  name: string;
  href: string;
  description: string;
}

interface SimpleDropdownProps {
  label: string;
  items: DropdownItem[];
}

const SimpleDropdown: React.FC<SimpleDropdownProps> = ({ label, items }) => {
  const [isOpen, setIsOpen] = useState(false);
  const closeTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleMouseEnter = () => {
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current);
      closeTimeoutRef.current = null;
    }
    setIsOpen(true);
  };

  const handleMouseLeave = () => {
    closeTimeoutRef.current = setTimeout(() => {
      setIsOpen(false);
    }, 150);
  };

  return (
    <div 
      className="relative"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <button className="flex items-center space-x-1 text-sm font-medium text-foreground hover:text-primary transition-colors duration-150 group">
        <span className="group-hover:underline underline-offset-4">{label}</span>
        <ChevronDown className={cn(
          "h-3 w-3 transition-transform duration-150",
          isOpen && "rotate-180"
        )} />
      </button>

      {/* Dropdown menu */}
      {isOpen && (
        <div className="absolute top-full left-0 mt-1 pt-1 w-64 bg-popover border border-border rounded-lg shadow-lg p-2 z-50 transition-opacity duration-200">
          {items.map((item) => (
            <Link
              key={item.name}
              to={item.href}
              className="block p-3 rounded-md hover:bg-accent transition-colors duration-150 group"
            >
              <div className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">
                {item.name}
              </div>
              <div className="text-xs text-muted-foreground mt-1 leading-relaxed">
                {item.description}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

export default SimpleDropdown;