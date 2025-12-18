import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { ReadinessOverview } from '@/components/agency/ReadinessOverview';
import { MaturityDimensions } from '@/components/agency/MaturityDimensions';
import { AssessmentQuestionnaire } from '@/components/agency/AssessmentQuestionnaire';
import { GuideLibrary } from '@/components/agency/GuideLibrary';
import { useAIReadinessData } from '@/hooks/useAIReadinessData';
import { monitoring } from '@/utils/monitoring';
import SpecBadge from '@/components/ui/SpecBadge';
import { 
  Brain, 
  TrendingUp, 
  BookOpen, 
  CheckCircle, 
  PlayCircle,
  BarChart3,
  Target,
  Users
} from 'lucide-react';

const AIReadiness = () => {
  const { data, guides, actionItems, loading, updateProgress } = useAIReadinessData();
  const [activeTab, setActiveTab] = useState('overview');
  const [showAssessment, setShowAssessment] = useState(false);

  const handleStartAssessment = () => {
    setShowAssessment(true);
    setActiveTab('assessment');
  };

  const handleAssessmentComplete = (answers: any[]) => {
    // Handle assessment completion
    console.log('Assessment completed:', answers);
    setShowAssessment(false);
    setActiveTab('overview');
    // In a real app, this would update the readiness data
  };

  const handleGuideSelect = (guide: any) => {
    console.log('Selected guide:', guide);
    // In a real app, this would navigate to the guide details
  };

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="mb-6">
          <Skeleton className="h-8 w-48 mb-2" />
          <Skeleton className="h-4 w-64" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Skeleton className="h-64" />
          <div className="lg:col-span-2">
            <Skeleton className="h-64" />
          </div>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold">AI Readiness</h1>
          <p className="text-muted-foreground">Maturity checks and pre-work guides</p>
        </div>
        
        <Card>
          <CardContent className="text-center py-12">
            <Brain className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No assessment data available</h3>
            <p className="text-muted-foreground mb-6">
              Start your AI readiness assessment to get personalized recommendations
            </p>
            <Button onClick={handleStartAssessment} className="gap-2">
              <PlayCircle className="h-4 w-4" />
              Start Assessment
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <h1 className="text-2xl font-semibold">AI Readiness</h1>
          <SpecBadge id="C2" />
        </div>
        <p className="text-muted-foreground">Maturity checks and pre-work guides</p>
      </div>

      {showAssessment ? (
        <AssessmentQuestionnaire onComplete={handleAssessmentComplete} />
      ) : (
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview" className="gap-2">
              <BarChart3 className="h-4 w-4" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="dimensions" className="gap-2">
              <Target className="h-4 w-4" />
              Dimensions
            </TabsTrigger>
            <TabsTrigger value="guides" className="gap-2">
              <BookOpen className="h-4 w-4" />
              Guides
            </TabsTrigger>
            <TabsTrigger value="assessment" className="gap-2">
              <Brain className="h-4 w-4" />
              Assessment
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <ReadinessOverview data={data} />
            
            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PlayCircle className="h-5 w-5" />
                  Quick Actions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Button 
                    variant="outline" 
                    className="h-auto p-4 flex flex-col gap-2"
                    onClick={handleStartAssessment}
                  >
                    <Brain className="h-6 w-6" />
                    <span className="font-medium">Retake Assessment</span>
                    <span className="text-xs text-muted-foreground">Update your readiness score</span>
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    className="h-auto p-4 flex flex-col gap-2"
                    onClick={() => setActiveTab('guides')}
                  >
                    <BookOpen className="h-6 w-6" />
                    <span className="font-medium">Browse Guides</span>
                    <span className="text-xs text-muted-foreground">Implementation resources</span>
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    className="h-auto p-4 flex flex-col gap-2"
                    onClick={() => setActiveTab('dimensions')}
                  >
                    <Target className="h-6 w-6" />
                    <span className="font-medium">View Details</span>
                    <span className="text-xs text-muted-foreground">Detailed breakdown</span>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="dimensions" className="space-y-6">
            <MaturityDimensions 
              dimensions={data.dimensions}
              onDimensionClick={(id) => {
                monitoring.trackUserAction('Dimension clicked', { dimensionId: id, source: 'agency-readiness' });
              }}
            />
          </TabsContent>

          <TabsContent value="guides" className="space-y-6">
            <GuideLibrary 
              guides={guides}
              onGuideSelect={handleGuideSelect}
              onUpdateProgress={updateProgress}
            />
          </TabsContent>

          <TabsContent value="assessment" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Brain className="h-5 w-5" />
                  AI Readiness Assessment
                </CardTitle>
              </CardHeader>
              <CardContent className="text-center py-8">
                <div className="space-y-4">
                  <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
                    <Brain className="h-8 w-8 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold mb-2">Comprehensive AI Readiness Evaluation</h3>
                    <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
                      Take our detailed assessment to evaluate your organization's AI maturity across 
                      governance, technical infrastructure, human capital, cultural readiness, 
                      operational excellence, and business integration.
                    </p>
                    <div className="flex flex-wrap gap-2 justify-center mb-6">
                      <Badge variant="outline">~15 minutes</Badge>
                      <Badge variant="outline">6 dimensions</Badge>
                      <Badge variant="outline">18 questions</Badge>
                      <Badge variant="outline">Personalized recommendations</Badge>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <Button onClick={handleStartAssessment} size="lg" className="gap-2">
                      <PlayCircle className="h-5 w-5" />
                      Start Assessment
                    </Button>
                    <p className="text-sm text-muted-foreground">
                      Your progress will be saved automatically
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
};

export default AIReadiness;