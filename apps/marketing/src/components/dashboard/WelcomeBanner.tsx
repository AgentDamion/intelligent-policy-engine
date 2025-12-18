import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';

interface WelcomeBannerProps {
  onDismiss?: () => void;
}

const WelcomeBanner = ({ onDismiss }: WelcomeBannerProps) => {
  const [isVisible, setIsVisible] = useState(true);

  const handleDismiss = () => {
    setIsVisible(false);
    onDismiss?.();
  };

  if (!isVisible) return null;

  return (
    <Card className="bg-gradient-to-r from-teal-light/30 to-orange-light/30 border-teal/20 mb-6">
      <CardContent className="p-4 relative">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleDismiss}
          className="absolute top-2 right-2 h-6 w-6 p-0 hover:bg-white/20"
        >
          <X className="h-4 w-4" />
        </Button>
        
        <div className="flex items-start gap-4 pr-8">
          <div className="flex-shrink-0 mt-1">
            <svg width="24" height="18" viewBox="0 0 32 24" fill="none">
              <path d="M2 12 L14 10 L24 4" stroke="hsl(var(--teal))" strokeWidth="2" fill="none"/>
              <ellipse cx="16" cy="12" rx="7" ry="6" stroke="hsl(var(--teal))" strokeWidth="2" fill="none"/>
              <circle cx="19" cy="12" r="1.2" fill="hsl(var(--teal))"/>
              <path d="M14 10 Q10 6 7 16 Q14 14 14 10" stroke="hsl(var(--orange))" strokeWidth="2" fill="none"/>
            </svg>
          </div>
          
          <div className="flex-1">
            <h3 className="font-semibold text-gray-900 mb-2">
              Welcome to your Compliance Command Center!
            </h3>
            <p className="text-gray-700 mb-3">
              Meet your hummingbird copilot—always vigilant, always here to help your agency stay compliant, fast.
            </p>
            
            <div className="text-sm text-gray-600">
              <p className="font-medium mb-2">Not sure where to start? Your copilot recommends:</p>
              <ul className="space-y-1 list-none">
                <li className="flex items-center gap-2">
                  <span className="text-teal font-medium">1️⃣</span>
                  <span>Invite your first client</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-orange font-medium">2️⃣</span>
                  <span>Review your compliance policies</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-teal font-medium">3️⃣</span>
                  <span>Set up your first audit trail</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default WelcomeBanner;