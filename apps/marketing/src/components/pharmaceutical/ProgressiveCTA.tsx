import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { monitoring } from '@/utils/monitoring';
import { Button } from '@/components/ui/button';
import { 
  Download, 
  Play, 
  Calendar, 
  Calculator, 
  ArrowRight, 
  CheckCircle, 
  Clock,
  Users,
  Zap,
  FileText,
  PhoneCall
} from 'lucide-react';

interface CTALevel {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<any>;
  buttonText: string;
  commitment: 'low' | 'medium' | 'high';
  value: string;
  urgency?: string;
}

const ctaLevels: CTALevel[] = [
  {
    id: 'download',
    title: 'Get Started Free',
    description: 'Download our comprehensive FDA compliance checklist and see how ready your AI tools are.',
    icon: Download,
    buttonText: 'Download Compliance Guide',
    commitment: 'low',
    value: 'Free 15-page guide',
    urgency: '2,847 downloads this month'
  },
  {
    id: 'demo',
    title: 'See It In Action',
    description: 'Experience live AI compliance monitoring with our interactive demo using real pharmaceutical scenarios.',
    icon: Play,
    buttonText: 'Try Interactive Demo',
    commitment: 'medium',
    value: '5-minute experience',
    urgency: 'No signup required'
  },
  {
    id: 'consultation',
    title: 'Expert Consultation',
    description: 'Schedule a personalized session with our FDA compliance experts to assess your specific needs.',
    icon: Calendar,
    buttonText: 'Book Expert Session',
    commitment: 'high',
    value: '30-min consultation',
    urgency: 'Limited slots available'
  }
];

interface SocialProofIndicator {
  message: string;
  type: 'download' | 'demo' | 'signup' | 'success';
  timestamp: Date;
  company?: string;
}

const socialProofMessages: SocialProofIndicator[] = [
  { message: 'A Fortune 500 pharma company just downloaded the compliance guide', type: 'download', timestamp: new Date(Date.now() - 2 * 60 * 1000) },
  { message: 'BioPharma executive completed compliance assessment', type: 'demo', timestamp: new Date(Date.now() - 5 * 60 * 1000) },
  { message: 'Global pharmaceutical leader scheduled consultation', type: 'signup', timestamp: new Date(Date.now() - 8 * 60 * 1000) },
  { message: 'Top 10 pharma company achieved 100% audit success', type: 'success', timestamp: new Date(Date.now() - 15 * 60 * 1000), company: 'Confidential' }
];

interface ProgressiveCTAProps {
  currentEngagement?: 'visitor' | 'interested' | 'qualified';
  showSocialProof?: boolean;
  showUrgencyIndicators?: boolean;
  scrollBasedProgression?: boolean;
}

const ProgressiveCTA: React.FC<ProgressiveCTAProps> = ({
  currentEngagement = 'visitor',
  showSocialProof = true,
  showUrgencyIndicators = true,
  scrollBasedProgression = false
}) => {
  const [currentLevel, setCurrentLevel] = useState(0);
  const [scrollDepth, setScrollDepth] = useState(0);
  const [activeProof, setActiveProof] = useState(0);
  const [showUrgency, setShowUrgency] = useState(false);

  // Scroll-based progression
  useEffect(() => {
    if (!scrollBasedProgression) return;

    const handleScroll = () => {
      const scrollPercent = (window.scrollY / (document.documentElement.scrollHeight - window.innerHeight)) * 100;
      setScrollDepth(scrollPercent);

      if (scrollPercent > 75) setCurrentLevel(2);
      else if (scrollPercent > 40) setCurrentLevel(1);
      else setCurrentLevel(0);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [scrollBasedProgression]);

  // Social proof rotation
  useEffect(() => {
    if (!showSocialProof) return;

    const interval = setInterval(() => {
      setActiveProof((prev) => (prev + 1) % socialProofMessages.length);
    }, 8000);

    return () => clearInterval(interval);
  }, [showSocialProof]);

  // Urgency indicator
  useEffect(() => {
    if (!showUrgencyIndicators) return;

    const urgencyTimer = setTimeout(() => {
      setShowUrgency(true);
    }, 30000); // Show after 30 seconds

    return () => clearTimeout(urgencyTimer);
  }, [showUrgencyIndicators]);

  const handleCTAClick = (level: CTALevel) => {
    // Analytics tracking
    monitoring.trackUserAction(`CTA clicked: ${level.id}`, { 
      ctaType: level.id,
      level: level.id,
      source: 'progressive-cta'
    });
    
    // Actual action based on CTA type
    switch (level.id) {
      case 'download':
        // Trigger download
        break;
      case 'demo':
        // Open demo modal or navigate
        break;
      case 'consultation':
        // Open booking widget
        break;
    }
  };

  const currentCTA = ctaLevels[currentLevel];
  const IconComponent = currentCTA.icon;

  const getCommitmentColor = (commitment: string) => {
    switch (commitment) {
      case 'low': return 'hsl(var(--success))';
      case 'medium': return 'hsl(var(--warning))';
      case 'high': return 'hsl(var(--primary))';
      default: return 'hsl(var(--primary))';
    }
  };

  const getProofIcon = (type: string) => {
    switch (type) {
      case 'download': return FileText;
      case 'demo': return Play;
      case 'signup': return Calendar;
      case 'success': return CheckCircle;
      default: return Users;
    }
  };

  const formatTimeAgo = (timestamp: Date) => {
    const minutes = Math.floor((Date.now() - timestamp.getTime()) / 60000);
    if (minutes < 1) return 'just now';
    if (minutes === 1) return '1 minute ago';
    return `${minutes} minutes ago`;
  };

  return (
    <div className="relative">
      {/* Social Proof Indicators */}
      {showSocialProof && (
        <AnimatePresence mode="wait">
          <motion.div
            key={activeProof}
            className="mb-4 p-3 bg-muted/50 rounded-lg border border-border/50"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ duration: 0.3 }}
          >
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              {React.createElement(getProofIcon(socialProofMessages[activeProof].type), { className: "w-4 h-4 text-primary" })}
              <span>🔥 {socialProofMessages[activeProof].message}</span>
              <span className="text-xs">•</span>
              <span className="text-xs">{formatTimeAgo(socialProofMessages[activeProof].timestamp)}</span>
            </div>
          </motion.div>
        </AnimatePresence>
      )}

      {/* Progressive CTA Levels */}
      <div className="space-y-4">
        {ctaLevels.map((level, index) => (
          <motion.div
            key={level.id}
            className={`border border-border rounded-xl p-6 transition-all duration-300 ${
              index === currentLevel 
                ? 'bg-card shadow-lg border-primary/30' 
                : 'bg-muted/30 opacity-60'
            }`}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ 
              opacity: index <= currentLevel ? 1 : 0.6,
              scale: index === currentLevel ? 1 : 0.95
            }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
          >
            <div className="flex items-start gap-4">
              <div 
                className="p-3 rounded-lg"
                style={{ backgroundColor: `${getCommitmentColor(level.commitment)}15` }}
              >
                <IconComponent 
                  className="w-6 h-6" 
                  style={{ color: getCommitmentColor(level.commitment) }}
                />
              </div>
              
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="text-lg font-semibold text-foreground">{level.title}</h3>
                  <span 
                    className="px-2 py-1 text-xs rounded-full"
                    style={{ 
                      backgroundColor: `${getCommitmentColor(level.commitment)}15`,
                      color: getCommitmentColor(level.commitment)
                    }}
                  >
                    {level.value}
                  </span>
                </div>
                
                <p className="text-muted-foreground mb-4">{level.description}</p>
                
                <div className="flex items-center justify-between">
                  <Button
                    onClick={() => handleCTAClick(level)}
                    disabled={index > currentLevel}
                    className="group"
                    style={{ backgroundColor: getCommitmentColor(level.commitment) }}
                  >
                    {level.buttonText}
                    <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                  </Button>
                  
                  {level.urgency && (
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <Clock className="w-4 h-4" />
                      <span>{level.urgency}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Urgency Banner */}
      <AnimatePresence>
        {showUrgency && (
          <motion.div
            className="mt-6 p-4 bg-destructive/10 border border-destructive/20 rounded-lg"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
          >
            <div className="flex items-center gap-2 text-destructive">
              <Zap className="w-5 h-5" />
              <div>
                <div className="font-medium">⏰ New FDA SaMD guidance takes effect in 47 days</div>
                <div className="text-sm text-destructive/80">Ensure your AI tools are compliant before the deadline</div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Quick Actions Bar */}
      <div className="mt-6 flex flex-wrap gap-2 justify-center">
        <Button variant="outline" size="sm" className="text-xs">
          <Calculator className="w-3 h-3 mr-1" />
          ROI Calculator
        </Button>
        <Button variant="outline" size="sm" className="text-xs">
          <PhoneCall className="w-3 h-3 mr-1" />
          Emergency Support
        </Button>
        <Button variant="outline" size="sm" className="text-xs">
          <FileText className="w-3 h-3 mr-1" />
          Compliance Docs
        </Button>
      </div>
    </div>
  );
};

export default ProgressiveCTA;