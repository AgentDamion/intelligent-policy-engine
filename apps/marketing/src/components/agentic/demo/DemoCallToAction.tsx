import { Button } from '@/components/ui/button';
import { ArrowRight, Play, FileText, Calendar } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { trackDemoEvent, DemoEvents } from '@/utils/demoTelemetry';

export const DemoCallToAction = () => {
  const navigate = useNavigate();

  const handleTryYourOwn = () => {
    trackDemoEvent(DemoEvents.DEMO_CTA_CLICKED, {
      cta_type: 'try_your_own',
      destination: 'weave',
    });
    navigate('/agentic?tab=weave');
  };

  const handleExploreDecision = () => {
    trackDemoEvent(DemoEvents.DEMO_CTA_CLICKED, {
      cta_type: 'explore_decision',
      destination: 'spine',
    });
    navigate('/agentic?tab=spine&t=demo-oncology');
  };

  const handleReplay = () => {
    trackDemoEvent(DemoEvents.DEMO_REPLAYED, {});
    window.location.reload();
  };

  return (
    <div className="border-t border-ink-100 bg-surface-0 p-s5">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-s5">
          <h3 className="text-xl font-bold text-ink-900 mb-s2">
            Experience AI Governance Yourself
          </h3>
          <p className="text-ink-600">
            See how agentic AI can transform your pharmaceutical compliance workflow
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-s4">
          <Button
            size="lg"
            variant="default"
            className="w-full h-auto py-s4 px-s6 flex-col items-start text-left"
            onClick={handleTryYourOwn}
          >
            <div className="flex items-center gap-s2 mb-s2 w-full">
              <Play className="h-5 w-5" strokeWidth={2} />
              <span className="font-semibold">Try It Yourself</span>
              <ArrowRight className="h-4 w-4 ml-auto" />
            </div>
            <span className="text-xs opacity-90 font-normal">
              Test with your own AI tool or policy
            </span>
          </Button>

          <Button
            variant="outline"
            size="lg"
            className="w-full h-auto py-s4 px-s6 flex-col items-start text-left border-ink-200 hover:bg-surface-50"
            onClick={handleExploreDecision}
          >
            <div className="flex items-center gap-s2 mb-s2 w-full">
              <FileText className="h-5 w-5 text-ink-500" strokeWidth={1.5} />
              <span className="font-semibold text-ink-700">Explore Details</span>
              <ArrowRight className="h-4 w-4 ml-auto text-ink-400" />
            </div>
            <span className="text-xs text-ink-500 font-normal">
              Deep dive into this decision
            </span>
          </Button>

          <Button
            variant="ghost"
            size="lg"
            className="w-full h-auto py-s4 px-s6 flex-col items-start text-left hover:bg-surface-50"
            onClick={handleReplay}
          >
            <div className="flex items-center gap-s2 mb-s2 w-full">
              <Play className="h-5 w-5 text-ink-400" strokeWidth={1.5} />
              <span className="font-semibold text-ink-600">Replay Demo</span>
              <ArrowRight className="h-4 w-4 ml-auto text-ink-300" />
            </div>
            <span className="text-xs text-ink-400 font-normal">
              Watch the demo again
            </span>
          </Button>
        </div>
      </div>
    </div>
  );
};
