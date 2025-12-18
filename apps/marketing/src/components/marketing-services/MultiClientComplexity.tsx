import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, AlertTriangle, Building2 } from 'lucide-react';

const MultiClientComplexity = () => {
  return (
    <section className="py-16 bg-accent/5">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl lg:text-5xl font-bold text-foreground mb-6">
            Every Client Has Different Rules.
            <br />
            <span className="text-teal">aicomplyr.io Keeps You in Sync</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            When each client defines "approved AI" differently, inconsistency becomes risk. Our Policy Engine harmonizes rules across all client workspaces, ensuring every tool and model meets the right standard automatically.
          </p>
        </div>

        {/* Client Policy Cards */}
        <div className="grid lg:grid-cols-3 gap-8 mb-16">
          <Card className="hover:shadow-lg transition-shadow border-blue/20">
            <CardHeader>
              <CardTitle className="flex items-center text-blue">
                <Building2 className="h-6 w-6 mr-2" />
                Client A (Big Pharma)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center text-sm">
                <CheckCircle className="h-4 w-4 text-blue mr-2" />
                AI tool pre-approval required
              </div>
              <div className="flex items-center text-sm">
                <CheckCircle className="h-4 w-4 text-blue mr-2" />
                Complete audit trail for FDA submissions
              </div>
              <div className="flex items-center text-sm">
                <CheckCircle className="h-4 w-4 text-blue mr-2" />
                No personal health information processing
              </div>
              <div className="flex items-center text-sm">
                <CheckCircle className="h-4 w-4 text-blue mr-2" />
                Bias testing mandatory for patient content
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow border-green/20">
            <CardHeader>
              <CardTitle className="flex items-center text-green">
                <Building2 className="h-6 w-6 mr-2" />
                Client B (FinServ)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center text-sm">
                <CheckCircle className="h-4 w-4 text-green mr-2" />
                Real-time compliance monitoring
              </div>
              <div className="flex items-center text-sm">
                <CheckCircle className="h-4 w-4 text-green mr-2" />
                Anti-bias certification required
              </div>
              <div className="flex items-center text-sm">
                <CheckCircle className="h-4 w-4 text-green mr-2" />
                Customer data encryption mandatory
              </div>
              <div className="flex items-center text-sm">
                <CheckCircle className="h-4 w-4 text-green mr-2" />
                Fair lending compliance for AI recommendations
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow border-purple/20">
            <CardHeader>
              <CardTitle className="flex items-center text-purple">
                <Building2 className="h-6 w-6 mr-2" />
                Client C (Healthcare)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center text-sm">
                <CheckCircle className="h-4 w-4 text-purple mr-2" />
                HIPAA compliance required
              </div>
              <div className="flex items-center text-sm">
                <CheckCircle className="h-4 w-4 text-purple mr-2" />
                Clinical decision support validation
              </div>
              <div className="flex items-center text-sm">
                <CheckCircle className="h-4 w-4 text-purple mr-2" />
                Patient consent tracking
              </div>
              <div className="flex items-center text-sm">
                <CheckCircle className="h-4 w-4 text-purple mr-2" />
                Medical device regulation consideration
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Comparison Section */}
        <div className="grid lg:grid-cols-2 gap-8">
          <Card className="border-red/20 bg-red/5">
            <CardHeader>
              <CardTitle className="flex items-center text-red">
                <AlertTriangle className="h-6 w-6 mr-2" />
                Your Challenge Without aicomplyr.io
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center text-sm">
                <AlertTriangle className="h-4 w-4 text-red mr-2" />
                47 different policy requirements across 12 clients
              </div>
              <div className="flex items-center text-sm">
                <AlertTriangle className="h-4 w-4 text-red mr-2" />
                Manual spreadsheet tracking prone to errors
              </div>
              <div className="flex items-center text-sm">
                <AlertTriangle className="h-4 w-4 text-red mr-2" />
                No way to prove compliance consistently
              </div>
              <div className="flex items-center text-sm">
                <AlertTriangle className="h-4 w-4 text-red mr-2" />
                Each new client requires custom compliance setup
              </div>
              <div className="mt-4 p-4 bg-red/10 border border-red/20 rounded">
                <div className="text-center">
                  <div className="text-2xl font-bold text-red">2-3 weeks</div>
                  <div className="text-sm text-muted-foreground">Approval cycle delays</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-green/20 bg-green/5">
            <CardHeader>
              <CardTitle className="flex items-center text-green">
                <CheckCircle className="h-6 w-6 mr-2" />
                Your Solution With aicomplyr.io
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center text-sm">
                <CheckCircle className="h-4 w-4 text-green mr-2" />
                Single platform managing all client policies
              </div>
              <div className="flex items-center text-sm">
                <CheckCircle className="h-4 w-4 text-green mr-2" />
                Automated compliance checking across requirements
              </div>
              <div className="flex items-center text-sm">
                <CheckCircle className="h-4 w-4 text-green mr-2" />
                One-click reporting for any client audit
              </div>
              <div className="flex items-center text-sm">
                <CheckCircle className="h-4 w-4 text-green mr-2" />
                New client onboarding in 24 hours vs. 3 weeks
              </div>
              <div className="mt-4 p-4 bg-green/10 border border-green/20 rounded">
                <div className="text-center">
                  <div className="text-2xl font-bold text-green">24 hours</div>
                  <div className="text-sm text-muted-foreground">New client onboarding time</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
};

export default MultiClientComplexity;