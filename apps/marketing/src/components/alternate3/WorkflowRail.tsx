import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { motion } from 'framer-motion';
import { alternate3Content } from '@/content/alternate3ProofFirst';

export const WorkflowRail = () => {
  const { workflow } = alternate3Content;

  return (
    <section className="pt-16 lg:pt-24 pb-8 lg:pb-12 bg-muted/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-2xl lg:text-3xl font-bold text-center mb-6 text-foreground">
          Speed up AI tool approvals by delivering reviewer-ready proof faster.
        </h2>
        
        <h3 className="text-xl lg:text-2xl font-bold text-center mb-12 text-foreground">
          {workflow.sectionTitle}
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {workflow.steps.map((step, index) => (
            <motion.div
              key={step.number}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              viewport={{ once: true }}
            >
              <Card className="h-full hover:shadow-lg transition-shadow">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-center w-12 h-12 rounded-full bg-brand-teal text-white font-bold text-xl mb-4 mx-auto">
                    {step.number}
                  </div>
                  
                  <div className="aspect-video bg-muted rounded-lg mb-4 flex items-center justify-center">
                    <img 
                      src={step.mockImage} 
                      alt={`${step.title} workflow step`}
                      className="w-full h-full object-cover rounded-lg"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                        e.currentTarget.parentElement!.innerHTML = '<div class="text-muted-foreground text-sm">Step ' + step.number + '</div>';
                      }}
                    />
                  </div>

                  <h3 className="text-xl font-bold mb-2 text-foreground">
                    {step.title}
                  </h3>
                  
                  <p className="text-sm text-muted-foreground">
                    {step.description}
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
