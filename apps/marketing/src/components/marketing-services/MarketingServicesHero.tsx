import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, AlertTriangle, Shield, Target, BarChart3, ArrowRight, Phone } from 'lucide-react';
import { scrollToSection } from '@/utils/scrollToSection';
interface ClientData {
  name: string;
  score: number;
  color: string;
  requirements: string[];
}
const clientData: Record<string, ClientData> = {
  pharma: {
    name: 'Pfizer',
    score: 85,
    color: 'text-orange-600',
    requirements: ['FDA compliance', 'Audit trails', 'Bias testing']
  },
  finserv: {
    name: 'JPMorgan',
    score: 92,
    color: 'text-blue-600',
    requirements: ['Fair lending', 'Real-time monitoring', 'Data encryption']
  },
  healthcare: {
    name: 'Kaiser',
    score: 88,
    color: 'text-green-600',
    requirements: ['HIPAA compliance', 'Patient consent', 'Clinical validation']
  }
};
const MarketingServicesHero = () => {
  const [selectedClient, setSelectedClient] = useState('pharma');
  const navigate = useNavigate();
  return <section className="pt-24 pb-16 bg-gradient-to-br from-background via-accent/5 to-teal/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl lg:text-6xl font-bold text-orange mb-6 leading-tight">
            Win More Pharma & Financial Clients
            <br />
            <span className="text-emerald-400">with Proof-Ready AI Governance</span>
          </h1>
          <p className="text-xl lg:text-2xl text-muted-foreground mb-12 max-w-4xl mx-auto">
            Agencies today use dozens of AI tools — and increasingly, build their own. aicomplyr.io gives you the power to prove every model, plugin, and agent meets client compliance before it's ever used.
          </p>
          
          {/* Value Proposition Badges */}
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
            <Badge variant="secondary" className="p-4 bg-teal/10 text-teal border-teal/20 hover:bg-teal/20 transition-colors">
              <CheckCircle className="h-5 w-5 mr-2" />
              <div className="text-left">
                <div className="font-semibold">Multi-Client Policy Management</div>
                <div className="text-xs text-muted-foreground">Handle 20+ client AI policies</div>
              </div>
            </Badge>
            <Badge variant="secondary" className="p-4 bg-orange/10 text-orange border-orange/20 hover:bg-orange/20 transition-colors">
              <BarChart3 className="h-5 w-5 mr-2" />
              <div className="text-left">
                <div className="font-semibold">Real-Time Compliance Scoring</div>
                <div className="text-xs text-muted-foreground">Know you're compliant before delivery</div>
              </div>
            </Badge>
            <Badge variant="secondary" className="p-4 bg-blue/10 text-blue border-blue/20 hover:bg-blue/20 transition-colors">
              <Shield className="h-5 w-5 mr-2" />
              <div className="text-left">
                <div className="font-semibold">Client-Ready Reporting</div>
                <div className="text-xs text-muted-foreground">Automated compliance documentation</div>
              </div>
            </Badge>
            <Badge variant="secondary" className="p-4 bg-purple/10 text-purple border-purple/20 hover:bg-purple/20 transition-colors">
              <Target className="h-5 w-5 mr-2" />
              <div className="text-left">
                <div className="font-semibold">Competitive Differentiation</div>
                <div className="text-xs text-muted-foreground">Win RFPs with proven governance</div>
              </div>
            </Badge>
          </div>

          {/* Hero Pain Point */}
          <div className="bg-amber/10 border border-amber/20 rounded-lg p-6 mb-12 max-w-4xl mx-auto">
            <div className="flex items-center justify-center mb-4">
              <AlertTriangle className="h-6 w-6 text-amber-600 mr-2" />
              <span className="text-amber-700 font-semibold">Turn AI Risk Into Relationship Currency</span>
            </div>
            <p className="text-lg text-foreground">
              Clients don't just want innovation — they want assurance. Demonstrate full compliance for every AI tool in your stack, whether it's third-party or home-grown.
            </p>
          </div>

          {/* Interactive Demo Widget */}
          <div className="bg-card border border-border rounded-lg p-8 max-w-2xl mx-auto mb-12">
            <h3 className="text-2xl font-bold text-foreground mb-6">Live Multi-Client Compliance Check</h3>
            
            <div className="space-y-6">
              <div className="flex justify-center space-x-4">
                {Object.entries(clientData).map(([key, client]) => <Button key={key} variant={selectedClient === key ? "default" : "outline"} onClick={() => setSelectedClient(key)} className="transition-all duration-300">
                    {client.name}
                  </Button>)}
              </div>

              <div className="text-center p-6 bg-accent/10 rounded-lg">
                <div className="text-lg text-muted-foreground mb-2">Client: {clientData[selectedClient].name}</div>
                <div className="text-3xl font-bold mb-4">
                  <span className={clientData[selectedClient].color}>
                    Compliance Score: {clientData[selectedClient].score}%
                  </span>
                </div>
                <div className="flex justify-center space-x-4 text-sm text-muted-foreground">
                  {clientData[selectedClient].requirements.map((req, index) => <span key={index} className="flex items-center">
                      <CheckCircle className="h-4 w-4 text-green mr-1" />
                      {req}
                    </span>)}
                </div>
              </div>
            </div>

            <Button 
              onClick={() => scrollToSection('business-impact')}
              className="w-full mt-6 bg-[hsl(var(--brand-teal))] hover:bg-[hsl(var(--brand-teal))]/90 text-white"
            >
              See How This Wins You Business
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>

          {/* Primary CTAs */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              onClick={() => scrollToSection('platform-features')}
              size="lg" 
              className="bg-[hsl(var(--brand-teal))] hover:bg-[hsl(var(--brand-teal))]/80 text-white px-8 py-4"
            >
              Show Me How It Works
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <Button 
              onClick={() => navigate('/book-demo')}
              size="lg" 
              variant="outline" 
              className="px-8 py-4 border-[hsl(var(--brand-teal))] text-[hsl(var(--brand-teal))] hover:bg-[hsl(var(--brand-teal))]/10"
            >
              Book a Proof Session
            </Button>
          </div>
        </div>
      </div>
    </section>;
};
export default MarketingServicesHero;