import React, { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { ChevronDown, Building2, Shield, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ProductItem {
  name: string;
  href: string;
  description: string;
  icon: string;
}

interface ProductMegaMenuProps {
  productItems: ProductItem[];
}

const ProductMegaMenu: React.FC<ProductMegaMenuProps> = ({ productItems }) => {
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

  const getIcon = (iconName: string) => {
    switch (iconName) {
      case 'Building2': return Building2;
      case 'Shield': return Shield;
      case 'Zap': return Zap;
      default: return Building2;
    }
  };

  return (
    <div 
      className="relative"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <button className="flex items-center space-x-1 text-sm font-medium text-foreground hover:text-primary transition-colors duration-150 group">
        <span className="group-hover:underline underline-offset-4">Product</span>
        <ChevronDown className={cn(
          "h-3 w-3 transition-transform duration-150",
          isOpen && "rotate-180"
        )} />
      </button>

      {/* Mega menu dropdown */}
      {isOpen && (
        <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-1 pt-1 w-96 bg-popover border border-border rounded-lg shadow-lg p-6 z-50 transition-opacity duration-200">
          <div className="grid grid-cols-2 gap-4">
            {productItems.map((item) => {
              const IconComponent = getIcon(item.icon);
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className="group p-3 rounded-lg hover:bg-accent transition-colors duration-150"
                >
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0 mt-0.5">
                      <IconComponent className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">
                        {item.name}
                      </h4>
                      <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                        {item.description}
                      </p>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductMegaMenu;