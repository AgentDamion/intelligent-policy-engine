import React from 'react';
import { Link } from 'react-router-dom';
import { X, Settings, Users, Shield, BarChart3, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { routes } from '@/lib/routes';
import PersonaToggle from './PersonaToggle';

interface DropdownItem {
  name: string;
  href: string;
  description: string;
}

interface ProductItem {
  name: string;
  href: string;
  description: string;
  icon: string;
}

interface MobileDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  productItems: ProductItem[];
  industriesItems: DropdownItem[];
  resourcesItems: DropdownItem[];
  companyItems: DropdownItem[];
}

const MobileDrawer: React.FC<MobileDrawerProps> = ({ 
  isOpen, 
  onClose, 
  productItems,
  industriesItems,
  resourcesItems, 
  companyItems 
}) => {
  if (!isOpen) return null;

  const getIcon = (iconName: string) => {
    switch (iconName) {
      case 'Settings': return Settings;
      case 'Users': return Users;
      case 'Shield': return Shield;
      case 'BarChart3': return BarChart3;
      default: return Settings;
    }
  };

  return (
    <>
      {/* Overlay */}
      <div 
        className="fixed inset-0 bg-black/50 z-50 lg:hidden"
        onClick={onClose}
      />
      
      {/* Drawer */}
      <div className="fixed top-0 right-0 h-full w-80 bg-background border-l border-border z-50 lg:hidden animate-in slide-in-from-right duration-300">
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-border">
            <PersonaToggle />
            <button 
              onClick={onClose}
              className="p-2 hover:bg-accent rounded-md transition-colors"
              aria-label="Close menu"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Navigation */}
          <div className="flex-1 overflow-y-auto p-4">
            <nav className="space-y-6">
              {/* Product section */}
              <div>
                <h3 className="text-sm font-semibold text-foreground mb-3">Product</h3>
                <div className="space-y-1">
                  {productItems.map((item) => {
                    const IconComponent = getIcon(item.icon);
                    return (
                      <Link
                        key={item.name}
                        to={item.href}
                        onClick={onClose}
                        className="flex items-start space-x-3 p-3 rounded-lg hover:bg-accent transition-colors group"
                      >
                        <IconComponent className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                        <div>
                          <div className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">
                            {item.name}
                          </div>
                          <div className="text-xs text-muted-foreground mt-1">
                            {item.description}
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </div>

              {/* Industries section */}
              <div>
                <h3 className="text-sm font-semibold text-foreground mb-3">Industries</h3>
                <div className="space-y-1">
                  {industriesItems.map((item) => (
                    <Link
                      key={item.name}
                      to={item.href}
                      onClick={onClose}
                      className="block p-3 rounded-lg hover:bg-accent transition-colors group"
                    >
                      <div className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">
                        {item.name}
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {item.description}
                      </div>
                    </Link>
                  ))}
                </div>
              </div>

              {/* Resources section */}
              <div>
                <h3 className="text-sm font-semibold text-foreground mb-3">Resources</h3>
                <div className="space-y-1">
                  {resourcesItems.map((item) => (
                    <Link
                      key={item.name}
                      to={item.href}
                      onClick={onClose}
                      className="block p-3 rounded-lg hover:bg-accent transition-colors group"
                    >
                      <div className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">
                        {item.name}
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {item.description}
                      </div>
                    </Link>
                  ))}
                </div>
              </div>

              {/* Company section */}
              <div>
                <h3 className="text-sm font-semibold text-foreground mb-3">Company</h3>
                <div className="space-y-1">
                  {companyItems.map((item) => (
                    <Link
                      key={item.name}
                      to={item.href}
                      onClick={onClose}
                      className="block p-3 rounded-lg hover:bg-accent transition-colors group"
                    >
                      <div className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">
                        {item.name}
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {item.description}
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            </nav>
          </div>

          {/* Footer CTA */}
          <div className="p-4 border-t border-border space-y-3">
            <Button 
              asChild
              variant="outline"
              className="w-full"
              onClick={onClose}
            >
              <a href="/auth">Customer Login</a>
            </Button>
            <Button 
              asChild
              className="w-full bg-primary text-primary-foreground hover:bg-primary/90 font-medium"
              onClick={onClose}
            >
              <a href="/contact">Schedule Demo</a>
            </Button>
          </div>
        </div>
      </div>
    </>
  );
};

export default MobileDrawer;