# Phase 1, Step 6: Policy Resolution Panel Component

## Prompt to paste into Lovable:

```
Create a new UI component: src/components/rfp/PolicyResolutionPanel.tsx

This component displays the validation results of disclosed AI tools against policy requirements.

DESIGN REQUIREMENTS:
- Follow existing Card/Badge/Button patterns from shadcn
- Use semantic color tokens from index.css (not direct colors)
- Responsive design (stack on mobile, side-by-side on desktop)
- Match the style of existing RFP components

COMPONENT FEATURES:
1. Header showing overall compliance score with visual indicator (ring/progress)
2. Per-tool breakdown in a list/table format
3. Status badges: Compliant (green), Pending (yellow), Restricted (red)
4. Expandable details showing reasons and failed controls
5. Empty state when no validation has been run
6. Loading state with skeleton placeholders
7. Error state with retry option

Props:
- resolution?: PolicyResolutionResult
- loading?: boolean
- error?: string
- onValidate?: () => Promise<void>

Use lucide-react icons (CheckCircle2, AlertCircle, XCircle, ChevronDown).
```

## Expected Component Structure:

```tsx
// src/components/rfp/PolicyResolutionPanel.tsx
import { useState } from 'react';
import { CheckCircle2, AlertCircle, XCircle, ChevronDown, ChevronUp, Loader2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { PolicyResolutionResult, PolicyCheckStatus } from '@/types/rfp';

interface PolicyResolutionPanelProps {
  resolution?: PolicyResolutionResult;
  loading?: boolean;
  error?: string;
  onValidate?: () => Promise<void>;
}

const getStatusIcon = (status: PolicyCheckStatus) => {
  switch (status) {
    case 'COMPLIANT':
      return <CheckCircle2 className="h-4 w-4 text-green-600" />;
    case 'RESTRICTED':
      return <XCircle className="h-4 w-4 text-destructive" />;
    case 'PENDING':
    default:
      return <AlertCircle className="h-4 w-4 text-yellow-600" />;
  }
};

const getStatusBadge = (status: PolicyCheckStatus) => {
  const variants = {
    COMPLIANT: 'default',
    PENDING: 'secondary',
    RESTRICTED: 'destructive'
  } as const;

  return (
    <Badge variant={variants[status] || 'secondary'}>
      {status}
    </Badge>
  );
};

const getScoreColor = (score: number) => {
  if (score >= 80) return 'text-green-600';
  if (score >= 50) return 'text-yellow-600';
  return 'text-destructive';
};

export function PolicyResolutionPanel({
  resolution,
  loading,
  error,
  onValidate
}: PolicyResolutionPanelProps) {
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

  const toggleExpanded = (toolName: string) => {
    const next = new Set(expandedItems);
    if (next.has(toolName)) {
      next.delete(toolName);
    } else {
      next.add(toolName);
    }
    setExpandedItems(next);
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Loader2 className="h-5 w-5 animate-spin" />
            Validating Tools...
          </CardTitle>
          <CardDescription>
            Checking disclosed tools against policy requirements
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 bg-muted animate-pulse rounded-md" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-destructive">Validation Error</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">{error}</p>
          {onValidate && (
            <Button onClick={onValidate} variant="outline" size="sm">
              Retry Validation
            </Button>
          )}
        </CardContent>
      </Card>
    );
  }

  if (!resolution) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Policy Validation</CardTitle>
          <CardDescription>
            Validate your disclosed tools against client policy requirements
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <AlertCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-sm text-muted-foreground mb-4">
              No validation results yet. Add tools and run validation.
            </p>
            {onValidate && (
              <Button onClick={onValidate} size="sm">
                Validate Tools
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  const compliantCount = resolution.items.filter(i => i.status === 'COMPLIANT').length;
  const pendingCount = resolution.items.filter(i => i.status === 'PENDING').length;
  const restrictedCount = resolution.items.filter(i => i.status === 'RESTRICTED').length;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle>Policy Validation Results</CardTitle>
            <CardDescription>
              {resolution.items.length} tools validated
            </CardDescription>
          </div>
          <div className="text-right">
            <div className={`text-3xl font-bold ${getScoreColor(resolution.overall_score)}`}>
              {resolution.overall_score}%
            </div>
            <div className="text-xs text-muted-foreground">
              Overall Score
            </div>
          </div>
        </div>

        <div className="flex gap-4 mt-4 text-sm">
          <div className="flex items-center gap-1">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <span className="font-medium">{compliantCount}</span>
            <span className="text-muted-foreground">Compliant</span>
          </div>
          <div className="flex items-center gap-1">
            <AlertCircle className="h-4 w-4 text-yellow-600" />
            <span className="font-medium">{pendingCount}</span>
            <span className="text-muted-foreground">Pending</span>
          </div>
          {restrictedCount > 0 && (
            <div className="flex items-center gap-1">
              <XCircle className="h-4 w-4 text-destructive" />
              <span className="font-medium">{restrictedCount}</span>
              <span className="text-muted-foreground">Restricted</span>
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent>
        <div className="space-y-2">
          {resolution.items.map((item) => {
            const isExpanded = expandedItems.has(item.tool_name);
            const hasDetails = item.reasons.length > 0 || item.failed_controls.length > 0;

            return (
              <div key={item.tool_name} className="border rounded-lg p-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 flex-1">
                    {getStatusIcon(item.status)}
                    <div className="flex-1">
                      <div className="font-medium">{item.tool_name}</div>
                      {item.version && (
                        <div className="text-xs text-muted-foreground">
                          v{item.version} {item.provider && `· ${item.provider}`}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {getStatusBadge(item.status)}
                    {hasDetails && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleExpanded(item.tool_name)}
                      >
                        {isExpanded ? (
                          <ChevronUp className="h-4 w-4" />
                        ) : (
                          <ChevronDown className="h-4 w-4" />
                        )}
                      </Button>
                    )}
                  </div>
                </div>

                {isExpanded && hasDetails && (
                  <div className="mt-3 pt-3 border-t space-y-2">
                    {item.reasons.length > 0 && (
                      <div>
                        <div className="text-xs font-medium text-muted-foreground mb-1">
                          Reasons:
                        </div>
                        <ul className="text-sm space-y-1">
                          {item.reasons.map((reason, i) => (
                            <li key={i} className="flex items-start gap-2">
                              <span className="text-muted-foreground">•</span>
                              <span>{reason}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {item.failed_controls.length > 0 && (
                      <div>
                        <div className="text-xs font-medium text-muted-foreground mb-1">
                          Failed Controls:
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {item.failed_controls.map((control) => (
                            <Badge key={control} variant="outline" className="text-xs">
                              {control}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {onValidate && (
          <div className="mt-4 pt-4 border-t">
            <Button onClick={onValidate} variant="outline" size="sm" className="w-full">
              Re-validate Tools
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
```
