import { cn } from '@/lib/utils';

interface YAMLViewerProps {
  data: any;
  className?: string;
}

export function YAMLViewer({ data, className }: YAMLViewerProps) {
  const formatYAML = (obj: any, indent = 0): string => {
    if (obj === null || obj === undefined) return 'null';
    if (typeof obj !== 'object') return String(obj);
    
    const spaces = '  '.repeat(indent);
    const lines: string[] = [];
    
    Object.entries(obj).forEach(([key, value]) => {
      if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
        lines.push(`${spaces}${key}:`);
        lines.push(formatYAML(value, indent + 1));
      } else if (Array.isArray(value)) {
        lines.push(`${spaces}${key}:`);
        value.forEach(item => {
          lines.push(`${spaces}  - ${JSON.stringify(item)}`);
        });
      } else {
        lines.push(`${spaces}${key}: ${value}`);
      }
    });
    
    return lines.join('\n');
  };

  return (
    <pre className={cn(
      'p-3 bg-muted rounded text-xs font-mono overflow-x-auto',
      className
    )}>
      {formatYAML(data)}
    </pre>
  );
}
