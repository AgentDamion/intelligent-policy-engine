export type Persona = 'cco' | 'agency' | 'default';

export interface PersonaConfig {
  secondaryCTA: string;
  whyCareBullets: {
    icon: string;
    title: string;
    desc: string;
  }[];
}

export function detectPersona(): Persona {
  if (typeof window === 'undefined') return 'default';
  
  const params = new URLSearchParams(window.location.search);
  const persona = params.get('persona');
  
  if (persona === 'cco' || persona === 'agency') {
    return persona;
  }
  
  // Detect from UTM campaign
  const campaign = params.get('utm_campaign')?.toLowerCase() || '';
  if (campaign.includes('agency')) return 'agency';
  if (campaign.includes('cco') || campaign.includes('compliance')) return 'cco';
  
  return 'default';
}

export function getPersonaConfig(persona: Persona): PersonaConfig {
  const configs: Record<Persona, PersonaConfig> = {
    cco: {
      secondaryCTA: 'Book a Governance Lab (90-min)',
      whyCareBullets: [
        { icon: '⚡', title: 'FDA Evidence on Demand', desc: 'Minutes, not weeks' },
        { icon: '📊', title: 'MLR Cycle Time Reduction', desc: '60% faster approvals' },
        { icon: '🔒', title: 'Audit-Ready Proof', desc: 'Tamper-evident bundles' }
      ]
    },
    agency: {
      secondaryCTA: 'Preview Compliance Certificate',
      whyCareBullets: [
        { icon: '🎯', title: 'Multi-Client Policy Harmony', desc: 'No conflicts' },
        { icon: '✅', title: 'Portable Compliance Proof', desc: 'Show all clients' },
        { icon: '⚡', title: 'Zero Workflow Friction', desc: 'Built into your stack' }
      ]
    },
    default: {
      secondaryCTA: 'Book a Governance Lab (90-min)',
      whyCareBullets: [
        { icon: '⚡', title: 'FDA Evidence on Demand', desc: 'Minutes, not weeks' },
        { icon: '🔍', title: 'Cross-Partner Visibility', desc: 'See all agency AI tools' },
        { icon: '✅', title: 'Proof, Not Promises', desc: 'Tamper-evident bundles' }
      ]
    }
  };
  
  return configs[persona];
}
