import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import MaturityModelSection from './MaturityModelSection';
import InteractiveROICalculator from './InteractiveROICalculator';
import InternalChampionKit from './InternalChampionKit';

const AdvancedSections = () => {
  return (
    <section className="py-12 bg-gray-50">
      <div className="max-w-6xl mx-auto px-4">
        <h3 className="text-2xl font-bold text-center mb-8">
          Deep Dives & Tools (Optional)
        </h3>
        <Accordion type="single" collapsible className="space-y-4">
          <AccordionItem value="maturity">
            <AccordionTrigger className="text-lg font-semibold">
              AI Governance Maturity Model
            </AccordionTrigger>
            <AccordionContent>
              <MaturityModelSection />
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="roi">
            <AccordionTrigger className="text-lg font-semibold">
              ROI Calculator
            </AccordionTrigger>
            <AccordionContent>
              <InteractiveROICalculator />
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="champion">
            <AccordionTrigger className="text-lg font-semibold">
              Internal Champion Kit
            </AccordionTrigger>
            <AccordionContent>
              <InternalChampionKit />
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>
    </section>
  );
};

export default AdvancedSections;
