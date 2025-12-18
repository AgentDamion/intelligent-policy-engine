interface FeatureDriver {
  label: string;
  impact: string;
  weight: number;
}

interface TopThreeDriversProps {
  drivers: FeatureDriver[];
  confidence: number;
}

export const TopThreeDrivers = ({ drivers, confidence }: TopThreeDriversProps) => {
  return (
    <div className="space-y-s4 bg-white p-s4 rounded-r2">
      <div>
        <h3 className="text-sm font-medium text-ink-900 mb-s3">
          Why this recommendation?
        </h3>
        <ul className="space-y-s3 text-sm text-ink-700">
          {drivers.map((driver, i) => (
            <li key={i} className="flex items-start gap-s2">
              <span className="text-ink-400 font-medium">{i + 1}.</span>
              <div>
                <div className="font-medium text-ink-900">{driver.label}</div>
                <div className="text-xs text-ink-600 mt-s1">↳ {driver.impact}</div>
              </div>
            </li>
          ))}
        </ul>
      </div>
      
      <div className="pt-s3 border-t border-ink-100">
        <div className="flex items-center justify-between">
          <span className="text-xs text-ink-600">Model confidence</span>
          <span className="text-lg font-semibold text-ink-900">{confidence}%</span>
        </div>
      </div>
    </div>
  );
};
