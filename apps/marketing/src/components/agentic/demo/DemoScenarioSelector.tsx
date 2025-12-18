import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { DemoScenario } from '@/types/intelligenceDemo';

interface DemoScenarioSelectorProps {
  scenarios: Record<string, DemoScenario>;
  selectedScenario: string;
  onScenarioChange: (scenarioId: string) => void;
}

export const DemoScenarioSelector = ({
  scenarios,
  selectedScenario,
  onScenarioChange,
}: DemoScenarioSelectorProps) => {
  const scenario = scenarios[selectedScenario];

  return (
    <div className="flex items-center gap-s3">
      <div>
        <p className="text-xs text-ink-500 font-medium">Scenario</p>
        <Select value={selectedScenario} onValueChange={onScenarioChange}>
          <SelectTrigger className="w-[320px] h-8 border-none shadow-none">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(scenarios).map(([id, scenario]) => (
              <SelectItem key={id} value={id}>
                <div>
                  <div className="font-medium">{scenario.title}</div>
                  <div className="text-xs text-ink-500">{scenario.description}</div>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
};
