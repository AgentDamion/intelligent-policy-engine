import React from 'react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { alternate3Content } from '@/content/alternate3ProofFirst';

export const FAQSection = () => {
  const { faq } = alternate3Content;

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": faq.map(item => ({
      "@type": "Question",
      "name": item.question,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": item.answer.replace(/<[^>]*>/g, '')
      }
    }))
  };

  return (
    <section className="py-16 lg:py-24 bg-background">
      <script type="application/ld+json">
        {JSON.stringify(faqSchema)}
      </script>
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-3xl lg:text-4xl font-bold text-center mb-12 text-foreground">
          Frequently Asked Questions
        </h2>

        <Accordion type="single" collapsible className="space-y-4">
          {faq.map((item, index) => {
            const getEventForQuestion = (question: string) => {
              if (question.includes('Enterprise vs. a Partner')) return 'faq_opened_enterprise_partner';
              if (question.includes('store our policies or prompts')) return 'faq_opened_store_policies';
              return null;
            };

            return (
              <AccordionItem 
                key={index} 
                value={`item-${index}`}
                className="border border-border rounded-lg px-6"
              >
                <AccordionTrigger 
                  className="text-left font-semibold hover:no-underline focus-visible:ring-2 focus-visible:ring-brand-teal focus-visible:ring-offset-2 rounded"
                  onClick={() => {
                    const event = getEventForQuestion(item.question);
                    if (event) {
                      window.dispatchEvent(new CustomEvent('analytics', {
                        detail: { event }
                      }));
                    }
                  }}
                >
                  {item.question}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  <div dangerouslySetInnerHTML={{ __html: item.answer }} />
                </AccordionContent>
              </AccordionItem>
            );
          })}
        </Accordion>
      </div>
    </section>
  );
};
