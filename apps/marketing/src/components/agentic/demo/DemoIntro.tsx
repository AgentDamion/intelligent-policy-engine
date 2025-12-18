import { DemoIntroContent, DemoScenario } from '@/types/intelligenceDemo';
import { CheckCircle, Clock } from 'lucide-react';

interface DemoIntroProps {
  intro: DemoIntroContent;
  scenario: DemoScenario;
}

export const DemoIntro = ({ intro, scenario }: DemoIntroProps) => {
  return (
    <div className="flex items-center justify-center h-full p-s6">
      <div className="max-w-2xl space-y-s6">
        <div className="text-center space-y-s3">
          <div className="inline-flex items-center gap-s2 px-s3 py-s1 rounded-full bg-primary/10 text-primary text-sm font-medium mb-s3">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
            </span>
            Live Intelligence Demo
          </div>
          
          <h1 className="text-4xl font-bold text-ink-900">{intro.title}</h1>
          
          <div className="flex items-center justify-center gap-s2 text-ink-500">
            <Clock className="h-4 w-4" />
            <span className="text-sm">
              Expected completion: {Math.round(scenario.duration / 1000)}s
            </span>
          </div>
        </div>

        <div className="bg-surface-100 rounded-lg p-s5 space-y-s4">
          <div>
            <h3 className="text-sm font-semibold text-ink-700 mb-s2">Challenge</h3>
            <p className="text-ink-900">{intro.challenge}</p>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-ink-700 mb-s2">AI Agents Involved</h3>
            <div className="flex flex-wrap gap-s2">
              {intro.stakeholders.map((stakeholder, index) => (
                <span
                  key={index}
                  className="px-s3 py-s1 rounded-full bg-surface-0 text-sm text-ink-700 border border-ink-100"
                >
                  {stakeholder}
                </span>
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-ink-700 mb-s2">Success Criteria</h3>
            <div className="space-y-s2">
              {intro.successCriteria.map((criterion, index) => (
                <div key={index} className="flex items-center gap-s2">
                  <CheckCircle className="h-4 w-4 text-primary flex-shrink-0" />
                  <span className="text-sm text-ink-700">{criterion}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="text-center text-sm text-ink-500">
          Press <kbd className="px-2 py-1 bg-surface-100 rounded border border-ink-200 font-mono">Space</kbd> to play/pause
        </div>
      </div>
    </div>
  );
};
