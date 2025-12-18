import { AlertCircle, CheckCircle, AlertTriangle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface ValidationPreviewProps {
  result: {
    all_tools_approved: boolean;
    aggregated_risk: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    violations?: Array<{
      tool_id: string;
      tool_name: string;
      violation_type: string;
      violation_message: string;
    }>;
  };
}

export function ValidationPreview({ result }: ValidationPreviewProps) {
  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'LOW': return 'text-green-600';
      case 'MEDIUM': return 'text-yellow-600';
      case 'HIGH': return 'text-orange-600';
      case 'CRITICAL': return 'text-red-600';
      default: return 'text-muted-foreground';
    }
  };

  return (
    <div className={`border rounded-lg p-4 ${
      result.all_tools_approved ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
    }`}>
      <div className="flex items-start gap-3">
        {result.all_tools_approved ? (
          <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
        ) : (
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
        )}
        <div className="flex-1">
          <h4 className="font-semibold mb-2">
            {result.all_tools_approved ? 'All Tools Approved' : 'Policy Violations Detected'}
          </h4>
          
          <div className="flex items-center gap-2 mb-3">
            <span className="text-sm">Aggregated Risk:</span>
            <Badge variant="outline" className={getRiskColor(result.aggregated_risk)}>
              {result.aggregated_risk}
            </Badge>
          </div>

          {!result.all_tools_approved && result.violations && result.violations.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-medium">Violations:</p>
              {result.violations.map((violation, idx) => (
                <div key={idx} className="flex items-start gap-2 text-sm">
                  <AlertTriangle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium">{violation.tool_name}</p>
                    <p className="text-muted-foreground">{violation.violation_message}</p>
                  </div>
                </div>
              ))}
              <p className="text-sm text-red-600 font-medium mt-3">
                You cannot submit this declaration with banned tools. Please remove them or contact your administrator.
              </p>
            </div>
          )}

          {result.all_tools_approved && (
            <p className="text-sm text-green-700">
              All selected tools are approved for this project. You can proceed with submission.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
