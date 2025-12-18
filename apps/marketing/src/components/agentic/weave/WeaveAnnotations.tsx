import { useState } from 'react';
import { Ruler, Type, Keyboard } from 'lucide-react';

interface Annotation {
  label: string;
  value: string;
  category: 'dimension' | 'spacing' | 'typography' | 'accessibility';
}

const annotations: Annotation[] = [
  // Dimensions
  { label: 'Header height', value: '64px', category: 'dimension' },
  { label: 'Left panel width', value: '360px', category: 'dimension' },
  { label: 'Message max width', value: '640px', category: 'dimension' },
  
  // Spacing
  { label: 'Vertical rhythm', value: 's2/s3/s4 (16/24/32px)', category: 'spacing' },
  { label: 'Base unit', value: '8px grid', category: 'spacing' },
  
  // Typography
  { label: 'Title', value: '18px/28px semibold', category: 'typography' },
  { label: 'Body', value: '14px/20px regular', category: 'typography' },
  { label: 'Mono/Meta', value: '12px/16px mono', category: 'typography' },
  
  // A11y
  { label: 'Focus rings', value: 'shadow-focus-ring visible', category: 'accessibility' },
  { label: 'ARIA roles', value: 'tablist, list, article', category: 'accessibility' },
  { label: 'Contrast', value: 'WCAG AA compliant', category: 'accessibility' },
  { label: 'Keyboard nav', value: 'Tab order logical', category: 'accessibility' },
];

export const WeaveAnnotations = () => {
  const [visible, setVisible] = useState(false);
  const [filter, setFilter] = useState<string>('all');

  const categoryIcons = {
    dimension: Ruler,
    spacing: Ruler,
    typography: Type,
    accessibility: Keyboard,
  };

  const filteredAnnotations = filter === 'all' 
    ? annotations 
    : annotations.filter(a => a.category === filter);

  return (
    <>
      {/* Toggle Button */}
      <button
        onClick={() => setVisible(!visible)}
        className="fixed bottom-s4 right-s4 px-s3 py-s2 bg-ink-900 text-white rounded-r2 text-[12px] font-mono shadow-e1 hover:bg-ink-800 focus:shadow-focus-ring outline-none z-50"
        data-action="toggle-annotations"
      >
        {visible ? 'Hide' : 'Show'} QA Annotations
      </button>

      {/* Overlay Panel */}
      {visible && (
        <div 
          className="fixed top-s4 right-s4 w-[320px] bg-surface-0 border border-ink-200 rounded-r2 shadow-e1 overflow-hidden z-40"
          data-qa-overlay
        >
          <div className="p-s3 border-b border-ink-100 bg-surface-50">
            <h3 className="text-[14px] font-semibold text-ink-900 mb-s1">
              W4 QA Annotations
            </h3>
            <p className="text-[12px] font-mono text-ink-500">
              Design token verification
            </p>
          </div>

          {/* Filter Buttons */}
          <div className="flex gap-s1 p-s2 border-b border-ink-100 overflow-x-auto">
            {(['all', 'dimension', 'spacing', 'typography', 'accessibility'] as const).map(cat => (
              <button
                key={cat}
                onClick={() => setFilter(cat)}
                className={`px-s2 py-s1 text-[12px] rounded-r1 whitespace-nowrap ${
                  filter === cat 
                    ? 'bg-ink-900 text-white' 
                    : 'bg-surface-50 text-ink-700 hover:bg-ink-100'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Annotations List */}
          <div className="max-h-[400px] overflow-y-auto p-s3 space-y-s2">
            {filteredAnnotations.map((annotation, idx) => {
              const Icon = categoryIcons[annotation.category];
              return (
                <div 
                  key={idx}
                  className="p-s2 rounded-r1 border border-ink-100 bg-surface-50"
                >
                  <div className="flex items-center gap-s2 mb-s1">
                    <Icon className="w-3 h-3 text-ink-500" />
                    <span className="text-[12px] font-medium text-ink-700">
                      {annotation.label}
                    </span>
                  </div>
                  <p className="font-mono text-[11px] text-ink-500 pl-[20px]">
                    {annotation.value}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </>
  );
};
