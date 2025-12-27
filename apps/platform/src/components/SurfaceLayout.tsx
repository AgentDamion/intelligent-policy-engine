/**
 * apps/platform/src/components/SurfaceLayout.tsx
 * 
 * Consistent shell for all governance surfaces.
 * Enforces the "Hard Compliance Boundaries" by checking allowed actions.
 */

import React from 'react';
import { SurfaceNoun, SURFACE_REGISTRY } from '../surfaces/registry';
import SurfaceHeader from './surfaces/SurfaceHeader'

interface SurfaceLayoutProps {
  surface: SurfaceNoun;
  title?: string;
  subtitle?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
  veraContext?: React.ReactNode; // Right rail VERA content
}

export const SurfaceLayout: React.FC<SurfaceLayoutProps> = ({
  surface,
  title,
  subtitle,
  actions,
  children,
  veraContext
}) => {
  const config = SURFACE_REGISTRY[surface];
  const guardrail = config.guardrail;

  return (
    <div className="flex flex-col">
      <SurfaceHeader
        title={title || config.label}
        subtitle={subtitle || config.subtitle}
        guardrail={guardrail}
        primaryActions={actions}
      />

      {/* Main Surface Area (shell owns scrolling) */}
      <div className="flex flex-1 min-h-0">
        <main className="flex-1 p-6 bg-slate-50/50">
          <div className="mx-auto max-w-7xl">{children}</div>
        </main>

        {/* Optional right rail (secondary to VeraDrawer) */}
        {veraContext && (
          <aside className="w-80 border-l border-slate-200 bg-white hidden xl:block">
            <div className="h-full overflow-y-auto">{veraContext}</div>
          </aside>
        )}
      </div>
    </div>
  );
};

