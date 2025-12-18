import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface RuleInputProps {
  ruleKey: string;
  value: any;
  onUpdate: (value: any) => void;
}

export default function RuleInput({ ruleKey, value, onUpdate }: RuleInputProps) {
  const displayName = ruleKey.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());

  if (typeof value === 'boolean') {
    return (
      <div className="flex items-center space-x-2">
        <Checkbox
          id={ruleKey}
          checked={value}
          onCheckedChange={(checked) => onUpdate(checked)}
        />
        <Label htmlFor={ruleKey} className="text-sm font-medium">
          {displayName}
        </Label>
      </div>
    );
  }

  if (Array.isArray(value)) {
    return (
      <div className="space-y-2">
        <Label className="text-sm font-medium">{displayName}</Label>
        <Textarea
          value={value.join('\n')}
          onChange={(e) => onUpdate(e.target.value.split('\n').filter(line => line.trim()))}
          placeholder="One item per line"
          className="min-h-[100px]"
        />
      </div>
    );
  }

  if (typeof value === 'object' && value !== null) {
    return (
      <div className="space-y-2">
        <Label className="text-sm font-medium">{displayName}</Label>
        <Textarea
          value={JSON.stringify(value, null, 2)}
          onChange={(e) => {
            try {
              const parsed = JSON.parse(e.target.value);
              onUpdate(parsed);
            } catch {
              // Invalid JSON, don't update
            }
          }}
          placeholder="JSON object"
          className="min-h-[120px] font-mono text-sm"
        />
      </div>
    );
  }

  if (ruleKey.includes('threshold') || ruleKey.includes('level') || ruleKey.includes('priority')) {
    const options = ['low', 'medium', 'high', 'critical'];
    return (
      <div className="space-y-2">
        <Label className="text-sm font-medium">{displayName}</Label>
        <Select value={value} onValueChange={(newValue) => onUpdate(newValue)}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {options.map(option => (
              <SelectItem key={option} value={option}>
                {option.charAt(0).toUpperCase() + option.slice(1)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <Label className="text-sm font-medium">{displayName}</Label>
      <Input
        type={typeof value === 'number' ? 'number' : 'text'}
        value={value}
        onChange={(e) => onUpdate(typeof value === 'number' ? Number(e.target.value) : e.target.value)}
      />
    </div>
  );
}