import React from 'react';
import { Card } from '@/components/ui/card';
import { Clock, AlertTriangle, Users, ArrowRight } from 'lucide-react';

const statsData = [
  {
    icon: Clock,
    value: "6 weeks",
    label: "Average approval time",
    description: "for each AI tool"
  },
  {
    icon: AlertTriangle,
    value: "73%",
    label: "Compliance failures",
    description: "due to manual processes"
  },
  {
    icon: Users,
    value: "8-12",
    label: "People involved",
    description: "in each approval cycle"
  }
];

const StatsRow = () => {
  return (
    <section className="py-16 lg:py-24 bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl lg:text-4xl font-bold text-foreground mb-4">
            Your Teams Can't Keep Up With Manual AI Tool Approvals
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {statsData.map((stat, index) => {
            const IconComponent = stat.icon;
            return (
              <Card key={index} className="p-6 text-center relative group hover-scale">
                <div className="flex items-center justify-center mb-4">
                  <div className="w-12 h-12 rounded-full bg-secondary/10 flex items-center justify-center">
                    <IconComponent className="w-6 h-6 text-secondary" />
                  </div>
                </div>
                
                <div className="text-3xl font-bold text-foreground mb-2">
                  {stat.value}
                </div>
                
                <div className="font-semibold text-foreground mb-1">
                  {stat.label}
                </div>
                
                <div className="text-sm text-muted-foreground">
                  {stat.description}
                </div>

                {index < statsData.length - 1 && (
                  <div className="hidden md:block absolute -right-4 top-1/2 transform -translate-y-1/2">
                    <ArrowRight className="w-6 h-6 text-muted-foreground" />
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default StatsRow;