import React from 'react';
import { NavLink } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { routes } from '@/lib/routes';
import {
  FileText,
  Zap,
  Activity,
  Settings,
  ArrowRight,
  Clock,
  Users,
  Shield
} from 'lucide-react';

interface DemoItem {
  title: string;
  description: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
  badgeVariant?: 'default' | 'secondary' | 'destructive' | 'outline';
  estimatedTime?: string;
  difficulty?: 'Beginner' | 'Intermediate' | 'Advanced';
}

const demos: DemoItem[] = [
  {
    title: "Document Processing Demo",
    description: "Interactive demonstration of our deterministic document processing pipeline with real-time status tracking.",
    href: routes.documentProcessingDemo,
    icon: FileText,
    badge: "Interactive",
    badgeVariant: "default",
    estimatedTime: "5-10 min",
    difficulty: "Beginner"
  },
  {
    title: "Lighthouse Performance Demo", 
    description: "Explore our AI acceleration scoring system and see how it evaluates AI tool readiness.",
    href: routes.lighthouse,
    icon: Zap,
    badge: "Performance",
    badgeVariant: "secondary",
    estimatedTime: "3-5 min",
    difficulty: "Intermediate"
  },
  {
    title: "Tier Demo",
    description: "Experience different subscription tiers and their feature sets in a controlled environment.",
    href: routes.tierDemo,
    icon: Settings,
    badge: "Premium",
    badgeVariant: "outline",
    estimatedTime: "8-12 min", 
    difficulty: "Advanced"
  }
];

export const DemoNavigationHub: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Demo Center</h1>
        <p className="text-muted-foreground text-lg">
          Explore our interactive demonstrations and experience the power of aicomplyr.io firsthand.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {demos.map((demo) => {
          const Icon = demo.icon;
          return (
            <Card key={demo.href} className="group hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-muted rounded-lg">
                      <Icon className="h-5 w-5 text-foreground" />
                    </div>
                    <div className="space-y-1">
                      <CardTitle className="text-lg">{demo.title}</CardTitle>
                      {demo.badge && (
                        <Badge variant={demo.badgeVariant}>{demo.badge}</Badge>
                      )}
                    </div>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                <CardDescription className="text-sm leading-relaxed">
                  {demo.description}
                </CardDescription>
                
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <div className="flex items-center gap-4">
                    {demo.estimatedTime && (
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        <span>{demo.estimatedTime}</span>
                      </div>
                    )}
                    {demo.difficulty && (
                      <div className="flex items-center gap-1">
                        <Shield className="h-3 w-3" />
                        <span>{demo.difficulty}</span>
                      </div>
                    )}
                  </div>
                </div>

                <NavLink 
                  to={demo.href}
                  className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:text-primary/80 transition-colors group"
                >
                  Try Demo
                  <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </NavLink>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card className="bg-muted/30">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Need Help Getting Started?
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground mb-4">
            Our demos are designed to showcase real-world scenarios. Each demo includes guided tutorials and interactive elements to help you understand our platform's capabilities.
          </p>
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline">🎯 Guided Tours</Badge>
            <Badge variant="outline">📊 Real Data</Badge>
            <Badge variant="outline">⚡ Interactive</Badge>
            <Badge variant="outline">🔒 Safe Environment</Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};