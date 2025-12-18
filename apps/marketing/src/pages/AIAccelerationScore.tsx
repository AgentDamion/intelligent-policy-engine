import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowRight, CheckCircle, Clock, Shield, Target, Download, ExternalLink, Share2 } from 'lucide-react';
import { AssessmentStepper } from '@/components/ai-acceleration/AssessmentStepper';
import { AssessmentWizard } from '@/components/ai-acceleration/AssessmentWizard';
import { ScoreRing } from '@/components/ai-acceleration/ScoreRing';
import { BandBadge } from '@/components/ai-acceleration/BandBadge';
import { TrustCenterCard } from '@/components/ai-acceleration/TrustCenterCard';
import { ScoreModal } from '@/components/ai-acceleration/ScoreModal';
import { TTATooltip } from '@/components/ai-acceleration/TTATooltip';
import { ProvisionalBanner } from '@/components/ai-acceleration/ProvisionalBanner';
import { MustPassGateAlert } from '@/components/ai-acceleration/MustPassGateAlert';
import MarketingHeader from '@/components/marketing/MarketingHeader';
import { StandardPageLayout } from '@/components/layout/StandardPageLayout';
import Footer from '@/components/Footer';
import { assessmentScoring, type AssessmentResult } from '@/services/assessment-scoring';
interface AssessmentResults extends AssessmentResult {}
export default function AIAccelerationScore() {
  const [showWizard, setShowWizard] = useState(false);
  const [showScoreModal, setShowScoreModal] = useState(false);
  const [results, setResults] = useState<AssessmentResults | null>(null);
  const [userType, setUserType] = useState<'enterprise' | 'agency'>('enterprise');
  const [resumeToken, setResumeToken] = useState<string | null>(null);
  const calculatorRef = useRef<HTMLDivElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  // Check for resume token on mount
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('resume');
    if (token) {
      setResumeToken(token);
      setShowWizard(true);
      setTimeout(() => {
        calculatorRef.current?.scrollIntoView({
          behavior: 'smooth'
        });
      }, 100);
    }
  }, []);
  const handleStartAssessment = () => {
    setShowWizard(true);
    setTimeout(() => {
      calculatorRef.current?.scrollIntoView({
        behavior: 'smooth'
      });
    }, 100);
  };
  const handleAssessmentComplete = (assessmentData: any) => {
    // Use the real scoring engine
    const assessmentResult = assessmentScoring.calculateScore(assessmentData.answers, assessmentData.organizationType, assessmentData.organizationSize);
    setResults(assessmentResult);
    setShowWizard(false);

    // Scroll to results
    setTimeout(() => {
      resultsRef.current?.scrollIntoView({
        behavior: 'smooth'
      });
    }, 100);
  };
  const handleUserTypeSelect = (type: 'enterprise' | 'agency') => {
    setUserType(type);
  };

  // If wizard is active or results are shown, use dashboard layout
  if (showWizard || results) {
    return <StandardPageLayout 
      title={showWizard ? "AI Acceleration Assessment" : "Your AI Acceleration Score"} 
      subtitle={showWizard ? "Evaluate your organization's AI readiness and compliance posture" : "Professional assessment results and recommendations"}
      navigation={{
        showBackButton: true,
        backButtonText: "Back to Home",
        onBackClick: () => {
          setShowWizard(false);
          setResults(null);
          setResumeToken(null);
          // Remove resume token from URL
          const url = new URL(window.location.href);
          url.searchParams.delete('resume');
          window.history.replaceState({}, '', url);
        },
        logoText: "aicomply.io",
        logoOnClick: () => {
          setShowWizard(false);
          setResults(null);
          setResumeToken(null);
          // Remove resume token from URL
          const url = new URL(window.location.href);
          url.searchParams.delete('resume');
          window.history.replaceState({}, '', url);
        }
      }}
    >
        {showWizard && <div ref={calculatorRef}>
            <AssessmentWizard onComplete={handleAssessmentComplete} onUserTypeSelect={handleUserTypeSelect} resumeToken={resumeToken} />
          </div>}

        {results && <div ref={resultsRef} className="space-y-8">
            {/* Score Overview */}
            <div className="grid lg:grid-cols-3 gap-8">
              <div className="text-center">
                <ScoreRing score={results.composite} band={results.band} size="large" className="mx-auto mb-6" />
                <div className="space-y-2">
                  <BandBadge band={results.band} size="lg" />
                  <div className="text-sm text-muted-foreground">
                    Confidence: {Math.round(results.confidence * 100)}%
                  </div>
                </div>
              </div>

              {/* Alerts */}
              <div className="lg:col-span-2 space-y-4">
                <ProvisionalBanner completionRate={results.metadata.completionRate} evidenceCount={results.evidence.totalProvided} onResumeAssessment={() => setShowWizard(true)} />
                <MustPassGateAlert failedGates={results.mustPassGates.failed} onViewDetails={() => console.log('View gate details')} />

                <div className="grid md:grid-cols-3 gap-4">
                  <Card>
                    <CardContent className="p-6 text-center">
                      <Target className="h-8 w-8 text-primary mx-auto mb-3" />
                      <TTATooltip>
                        <div className="text-2xl font-bold text-foreground">{results.projectedTTA}%</div>
                        <div className="text-sm text-muted-foreground">Projected Time-to-Approval Reduction</div>
                      </TTATooltip>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-6 text-center">
                      <CheckCircle className="h-8 w-8 text-green-600 mx-auto mb-3" />
                      <div className="text-2xl font-bold text-foreground">{results.domainBreakdown.length}</div>
                      <div className="text-sm text-muted-foreground">Domains Assessed</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-6 text-center">
                      <Shield className="h-8 w-8 text-blue-600 mx-auto mb-3" />
                      <div className="text-2xl font-bold text-foreground">{Math.round(results.confidence * 100)}%</div>
                      <div className="text-sm text-muted-foreground">Assessment Confidence</div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>

            {/* Domain Breakdown and Recommendations */}
            <div className="grid lg:grid-cols-2 gap-8">
              {/* Domain Breakdown */}
              <Card>
                <CardHeader>
                  <CardTitle>Domain Breakdown</CardTitle>
                  <CardDescription>Your performance across key AI governance areas</CardDescription>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="space-y-4">
                    {results.domainBreakdown.map((domain, index) => <div key={index} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <span className="text-sm font-medium">{domain.domainName}</span>
                            {domain.isMustPass && <Badge variant="outline" className="text-xs">Must-Pass</Badge>}
                          </div>
                          <div className="flex items-center space-x-2">
                            <div className="w-24 bg-muted rounded-full h-2">
                              <div className="bg-primary h-2 rounded-full" style={{
                          width: `${domain.evidenceBoostedScore / 5 * 100}%`
                        }}></div>
                            </div>
                            <span className="text-sm font-medium w-8">{domain.evidenceBoostedScore.toFixed(1)}</span>
                          </div>
                        </div>
                        {!domain.passesThreshold && domain.isMustPass && <div className="text-xs text-red-600">Below threshold - score capped</div>}
                      </div>)}
                  </div>
                </CardContent>
              </Card>

              {/* Recommendations */}
              <Card>
                <CardHeader>
                  <CardTitle>Top Recommendations</CardTitle>
                  <CardDescription>Priority actions to improve your AI governance</CardDescription>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="space-y-3">
                    {results.recommendations.map((rec, index) => <div key={index} className="flex items-start space-x-3 text-sm">
                        <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${rec.includes('🔴') ? 'bg-red-500' : rec.includes('🟠') ? 'bg-orange-500' : rec.includes('🟡') ? 'bg-yellow-500' : 'bg-green-500'}`}></div>
                        <span>{rec}</span>
                      </div>)}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Action Buttons */}
            <Card>
              <CardContent className="p-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-medium text-foreground mb-2">Ready to take action?</h4>
                    <p className="text-sm text-muted-foreground mb-4">
                      Get your detailed PDF report and start implementing improvements.
                    </p>
                  </div>
                  <div className="flex flex-col space-y-3">
                    <Button className="w-full" onClick={() => window.open(`/api/assessments/${results.assessmentId}/pdf`, '_blank')}>
                      <Download className="w-4 h-4 mr-2" />
                      Download PDF Report
                    </Button>
                    {userType === 'enterprise' ? <Button variant="outline" className="w-full">
                        Start Policy Workspace
                      </Button> : <Button variant="outline" className="w-full">
                        <Share2 className="w-4 h-4 mr-2" />
                        Create Trust Center Profile
                      </Button>}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Trust Center Section for Agencies */}
            {userType === 'agency' && <div className="mt-12">
                <div className="text-center mb-8">
                  <h3 className="text-2xl font-bold text-foreground mb-4">
                    Agency Trust Center
                  </h3>
                  <p className="text-lg text-muted-foreground">
                    Publish your compliance score and build trust with prospective clients
                  </p>
                </div>
                <TrustCenterCard />
              </div>}
          </div>}
        <ScoreModal open={showScoreModal} onClose={() => setShowScoreModal(false)} />
      </StandardPageLayout>;
  }
  return <div className="min-h-screen bg-brand-warm-white">
      {/* Navigation */}
      <nav className="border-b border-border bg-background/80 backdrop-blur-sm sticky top-0 z-50">
        <MarketingHeader />
      </nav>

      <main>
        {/* Hero Section */}
        <section className="py-24 px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl md:text-6xl font-bold text-brand-gray-900 mb-6">
              What's Your{' '}
              <span className="bg-gradient-to-r from-brand-teal-600 to-brand-teal-700 bg-clip-text text-orange-500">
                AI Acceleration Score?
              </span>
            </h1>
            
            <p className="text-xl text-brand-gray-600 mb-8 max-w-3xl mx-auto">
              Get a comprehensive assessment of your organization's AI readiness, compliance posture, and 
              projected time-to-approval improvements. Professional-grade scoring in 5 minutes.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
              <Button size="lg" onClick={handleStartAssessment} className="text-lg px-8 py-6">
                <Target className="w-5 h-5 mr-2" />
                Start Assessment
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
              
              <Button variant="outline" size="lg" onClick={() => setShowScoreModal(true)} className="text-lg px-8 py-6">
                <Shield className="w-5 h-5 mr-2" />
                How It Works
              </Button>
            </div>

            {/* Trust Signals */}
            <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
              <div className="text-center">
                <div className="w-16 h-16 bg-brand-teal-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Clock className="w-8 h-8 text-brand-teal-600" />
                </div>
                <h3 className="font-semibold text-brand-gray-900 mb-2">5-Minute Assessment</h3>
                <p className="text-brand-gray-600">Quick evaluation across 6 critical AI governance domains</p>
              </div>
              
              <div className="text-center">
                <div className="w-16 h-16 bg-brand-teal-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Shield className="w-8 h-8 text-brand-teal-600" />
                </div>
                <h3 className="font-semibold text-brand-gray-900 mb-2">Regulatory-Aligned</h3>
                <p className="text-brand-gray-600">Based on FDA, EU AI Act, and enterprise best practices</p>
              </div>
              
              <div className="text-center">
                <div className="w-16 h-16 bg-brand-teal-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Target className="w-8 h-8 text-brand-teal-600" />
                </div>
                <h3 className="font-semibold text-brand-gray-900 mb-2">Actionable Results</h3>
                <p className="text-brand-gray-600">Specific recommendations with projected impact metrics</p>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-16 px-4 bg-background">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-foreground mb-4">
                Professional AI Governance Assessment
              </h2>
              <p className="text-xl text-muted-foreground">
                Get the insights you need to accelerate compliant AI deployment
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              <Card>
                <CardContent className="p-6">
                  <CheckCircle className="w-12 h-12 text-green-600 mb-4" />
                  <h3 className="font-semibold text-foreground mb-2">Comprehensive Scoring</h3>
                  <p className="text-muted-foreground">
                    Evidence-based assessment across Data Governance, Human-in-Loop, Audit Trail, and Security domains
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <Target className="w-12 h-12 text-blue-600 mb-4" />
                  <h3 className="font-semibold text-foreground mb-2">Impact Projection</h3>
                  <p className="text-muted-foreground">
                    Quantified estimates of time-to-approval improvements based on your governance maturity
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <ExternalLink className="w-12 h-12 text-purple-600 mb-4" />
                  <h3 className="font-semibold text-foreground mb-2">Trust Center Profile</h3>
                  <p className="text-muted-foreground">
                    Agencies can publish verified scores to build trust with enterprise prospects
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <Footer />
      
      <ScoreModal open={showScoreModal} onClose={() => setShowScoreModal(false)} />
    </div>;
}