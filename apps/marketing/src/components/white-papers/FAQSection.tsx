import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

const FAQSection = () => {
  return (
    <section className="py-16 bg-white">
      <div className="max-w-3xl mx-auto px-4">
        <h3 className="text-3xl font-bold text-center mb-10">Common Questions</h3>
        <Accordion type="single" collapsible className="space-y-4">
          <AccordionItem value="gated">
            <AccordionTrigger>Is the white paper bundle gated?</AccordionTrigger>
            <AccordionContent>
              No. You can download all 3 papers instantly without providing an email. 
              We believe the content should speak for itself.
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="pricing">
            <AccordionTrigger>Do the papers include pricing?</AccordionTrigger>
            <AccordionContent>
              No. The white papers focus on framework design and implementation roadmaps. 
              Pricing is discussed during the Governance Lab based on your specific use case.
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="access">
            <AccordionTrigger>Can I share these with my team?</AccordionTrigger>
            <AccordionContent>
              Yes. Share freely. We've seen the best results when CCOs, MLR leads, and agency 
              partners all read Paper #2 together before the first implementation meeting.
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="data">
            <AccordionTrigger>How do you handle our data?</AccordionTrigger>
            <AccordionContent>
              All policy decisions and proof bundles are encrypted at rest and in transit. 
              You retain ownership of all decision records. We never train models on your data.
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>
    </section>
  );
};

export default FAQSection;
