import { BookOpen } from 'lucide-react';

interface DemoNarrativeProps {
  content: string;
}

export const DemoNarrative = ({ content }: DemoNarrativeProps) => {
  return (
    <div className="w-80 border-l border-ink-100 bg-white p-s5 overflow-y-auto shadow-sm">
      <div className="space-y-s4">
        <div className="flex items-center gap-s2 text-ink-700">
          <BookOpen className="h-5 w-5" strokeWidth={1.5} />
          <h3 className="font-semibold text-sm uppercase tracking-wide">Scenario Summary</h3>
        </div>
        <p className="text-sm leading-relaxed text-ink-600">{content}</p>
      </div>
    </div>
  );
};
