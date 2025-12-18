import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { alternate3Content } from '@/content/alternate3ProofFirst';

export const MetricsCardsRow = () => {
  const { metricsCards } = alternate3Content;

  return (
    <section className="py-12 bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {metricsCards.map((card, index) => (
            <Card key={index} className="hover:shadow-lg transition-shadow">
              <CardContent className="pt-6 text-center">
                <h3 className="text-2xl font-bold text-brand-teal mb-3">
                  {card.title}
                </h3>
                <p className="text-muted-foreground">
                  {card.body}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};
