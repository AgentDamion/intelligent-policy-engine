interface DecisionPathPanelProps {
  decisionPath: string[];
  modelVersion?: string;
}

export const DecisionPathPanel = ({ decisionPath, modelVersion }: DecisionPathPanelProps) => {
  return (
    <div className="h-full overflow-auto bg-white">
      <div className="space-y-s3">
        <h4 className="text-sm font-semibold text-ink-900 sticky top-0 z-10 bg-white pb-s2">
          Decision Path
        </h4>
        <ul className="space-y-s2 text-sm text-ink-700">
          {decisionPath.map((step, i) => (
            <li key={i} className="flex gap-s2 p-s2 hover:bg-surface-100 rounded-r2 transition-colors">
              <span className="text-ink-400 font-medium">{i + 1}.</span>
              <span>{step}</span>
            </li>
          ))}
        </ul>
        {modelVersion && (
          <div className="pt-s3 border-t border-ink-100">
            <p className="text-xs text-ink-500 font-mono">Model: {modelVersion}</p>
          </div>
        )}
      </div>
    </div>
  );
};
