import { useState, useEffect } from 'react';
import { Slider } from '@/components/ui/slider';
import { Card } from '@/components/ui/card';
import { Database, Shield, Globe } from 'lucide-react';

interface RiskSlidersProps {
  onRiskChange: (params: {
    sensitivity: number;
    vendorRisk: number;
    exposure: number;
  }) => void;
}

const useDebounce = <T,>(value: T, delay: number): T => {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => clearTimeout(handler);
  }, [value, delay]);

  return debouncedValue;
};

export const RiskSliders = ({ onRiskChange }: RiskSlidersProps) => {
  const [sensitivity, setSensitivity] = useState(50);
  const [vendorRisk, setVendorRisk] = useState(30);
  const [exposure, setExposure] = useState(40);

  const debouncedSensitivity = useDebounce(sensitivity, 300);
  const debouncedVendorRisk = useDebounce(vendorRisk, 300);
  const debouncedExposure = useDebounce(exposure, 300);

  useEffect(() => {
    onRiskChange({
      sensitivity: debouncedSensitivity,
      vendorRisk: debouncedVendorRisk,
      exposure: debouncedExposure
    });
  }, [debouncedSensitivity, debouncedVendorRisk, debouncedExposure, onRiskChange]);

  const getSliderColor = (value: number) => {
    if (value < 30) return 'bg-success';
    if (value < 70) return 'bg-warning';
    return 'bg-destructive';
  };

  const getLabel = (value: number, type: 'sensitivity' | 'vendor' | 'exposure') => {
    if (type === 'sensitivity') {
      if (value < 30) return 'Public data';
      if (value < 70) return 'Internal data';
      return 'PHI/PII/Regulated';
    }
    if (type === 'vendor') {
      if (value < 30) return 'Trusted';
      if (value < 70) return 'Unknown';
      return 'High-risk';
    }
    if (value < 30) return 'Internal only';
    if (value < 70) return 'Partner access';
    return 'Public-facing';
  };

  return (
    <Card className="p-4 space-y-6">
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Database className="w-4 h-4 text-muted-foreground" />
            <label className="text-sm font-medium">Data Sensitivity</label>
          </div>
          <span className="text-xs text-muted-foreground">
            {getLabel(sensitivity, 'sensitivity')}
          </span>
        </div>
        <Slider
          value={[sensitivity]}
          onValueChange={([v]) => setSensitivity(v)}
          max={100}
          step={1}
          className={getSliderColor(sensitivity)}
        />
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>Low</span>
          <span>High</span>
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-muted-foreground" />
            <label className="text-sm font-medium">Vendor Risk</label>
          </div>
          <span className="text-xs text-muted-foreground">
            {getLabel(vendorRisk, 'vendor')}
          </span>
        </div>
        <Slider
          value={[vendorRisk]}
          onValueChange={([v]) => setVendorRisk(v)}
          max={100}
          step={1}
          className={getSliderColor(vendorRisk)}
        />
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>Trusted</span>
          <span>High-risk</span>
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Globe className="w-4 h-4 text-muted-foreground" />
            <label className="text-sm font-medium">Exposure</label>
          </div>
          <span className="text-xs text-muted-foreground">
            {getLabel(exposure, 'exposure')}
          </span>
        </div>
        <Slider
          value={[exposure]}
          onValueChange={([v]) => setExposure(v)}
          max={100}
          step={1}
          className={getSliderColor(exposure)}
        />
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>Limited</span>
          <span>Wide</span>
        </div>
      </div>
    </Card>
  );
};
