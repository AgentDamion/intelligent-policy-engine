import React from 'react';
import { Button, Card } from '@/components/ui';
import type { StepProps } from '../types';
import { Shield, Info } from 'lucide-react';

export function TechnicalRequirementsStep({ onNext, onPrev }: StepProps) {
  return (
    <div className="p-8">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <div className="h-10 w-10 bg-cyan-500 rounded-lg flex items-center justify-center">
            <Shield className="h-5 w-5 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Technical Requirements</h2>
            <p className="text-gray-600">Define technical specifications and integration requirements.</p>
          </div>
        </div>
      </div>

      <Card className="bg-yellow-50 border-yellow-200 p-6">
        <div className="flex items-start gap-3">
          <Info className="h-5 w-5 text-yellow-600 mt-0.5 flex-shrink-0" />
          <div>
            <h4 className="text-sm font-medium text-yellow-900 mb-1">Step In Development</h4>
            <p className="text-sm text-yellow-800">
              This step will include hosting requirements, integration specifications, 
              security requirements, and technical architecture details.
            </p>
          </div>
        </div>
      </Card>

      <div className="flex justify-between pt-8 border-t mt-8">
        <Button variant="outline" onClick={onPrev}>Previous</Button>
        <Button onClick={onNext} size="lg">Next</Button>
      </div>
    </div>
  );
}
