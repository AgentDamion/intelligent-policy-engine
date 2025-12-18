import React from 'react';
import { TrustCenterCard } from '@/components/ai-acceleration/TrustCenterCard';

export default function PartnerTrustCenter() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Trust Center</h1>
        <p className="text-muted-foreground">
          Manage your public compliance profile and trust center settings.
        </p>
      </div>
      
      <TrustCenterCard />
    </div>
  );
}