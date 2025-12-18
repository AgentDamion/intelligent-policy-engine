import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { PolicyUploader } from '@/components/policy/PolicyUploader';
import { ClauseReviewQueue } from '@/components/policy/ClauseReviewQueue';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { usePolicyLaneStats } from '@/hooks/usePolicyLaneStats';
import { BookOpen, Upload, CheckSquare, Shield, Code, Users, TrendingUp } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const PolicyLibraryPage: React.FC = () => {
  const [enterpriseId, setEnterpriseId] = useState<string | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const [reviewCount, setReviewCount] = useState(0);
  const { toast } = useToast();
  const navigate = useNavigate();
  const { stats: laneStats, loading: statsLoading } = usePolicyLaneStats('enterprise', enterpriseId);

  useEffect(() => {
    loadEnterprise();
  }, []);

  useEffect(() => {
    if (enterpriseId) {
      loadReviewCount();
    }
  }, [enterpriseId]);

  const loadEnterprise = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/');
        return;
      }

      // Get user's enterprise
      const { data: membership } = await supabase
        .from('enterprise_members')
        .select('enterprise_id, enterprises(id, name)')
        .eq('user_id', user.id)
        .single();

      if (membership) {
        setEnterpriseId(membership.enterprise_id);
      }
    } catch (error) {
      console.error('Error loading enterprise:', error);
      toast({
        title: 'Error',
        description: 'Failed to load enterprise information',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const loadReviewCount = async () => {
    try {
      const { count, error } = await supabase
        .from('clause_review_queue')
        .select('*', { count: 'exact', head: true })
        .eq('enterprise_id', enterpriseId)
        .eq('resolved', false);

      if (error) throw error;
      setReviewCount(count || 0);
    } catch (error) {
      console.error('Error loading review count:', error);
    }
  };

  const handleUploadSuccess = () => {
    loadReviewCount();
  };

  // Calculate display stats from lane stats
  const total_clauses = 
    laneStats.governance_compliance +
    laneStats.security_access +
    laneStats.integration_scalability +
    laneStats.business_ops;

  const displayStats = {
    total_policies: total_clauses > 0 ? 1 : 0,
    total_clauses,
    governance_compliance: laneStats.governance_compliance,
    security_access: laneStats.security_access,
    integration_scalability: laneStats.integration_scalability,
    business_ops: laneStats.business_ops,
    avg_confidence: 0.85
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p>Loading Policy Library...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!enterpriseId) {
    return (
      <div className="container mx-auto p-6">
        <Card className="border-destructive">
          <CardContent className="p-6 text-center">
            <p className="text-muted-foreground">No enterprise found for your account</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <BookOpen className="h-8 w-8" />
          Policy Library
        </h1>
        <p className="text-muted-foreground">
          Upload, normalize, and manage your AI governance policies with automatic lane classification
        </p>
      </div>

      {/* Stats Overview */}
      {!statsLoading && displayStats && (
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Total Policies</CardDescription>
              <CardTitle className="text-3xl">{displayStats.total_policies}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Total Clauses</CardDescription>
              <CardTitle className="text-3xl">{displayStats.total_clauses}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Avg Confidence</CardDescription>
              <CardTitle className="text-3xl">{(displayStats.avg_confidence * 100).toFixed(0)}%</CardTitle>
            </CardHeader>
          </Card>
          <Card className={reviewCount > 0 ? 'border-warning' : ''}>
            <CardHeader className="pb-2">
              <CardDescription>Needs Review</CardDescription>
              <CardTitle className="text-3xl flex items-center gap-2">
                {reviewCount}
                {reviewCount > 0 && <Badge variant="destructive" className="text-sm">Action Required</Badge>}
              </CardTitle>
            </CardHeader>
          </Card>
        </div>
      )}

      {/* Lane Distribution */}
      {!statsLoading && displayStats && displayStats.total_clauses > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Lane Distribution</CardTitle>
            <CardDescription>How your policy clauses are classified across the four governance lanes</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-4">
              <div className="flex items-center gap-3 p-4 border rounded-lg">
                <Shield className="h-8 w-8 text-blue-600" />
                <div>
                  <div className="text-2xl font-bold">{displayStats.governance_compliance}</div>
                  <div className="text-sm text-muted-foreground">Governance & Compliance</div>
                </div>
              </div>
              <div className="flex items-center gap-3 p-4 border rounded-lg">
                <Shield className="h-8 w-8 text-red-600" />
                <div>
                  <div className="text-2xl font-bold">{displayStats.security_access}</div>
                  <div className="text-sm text-muted-foreground">Security & Access</div>
                </div>
              </div>
              <div className="flex items-center gap-3 p-4 border rounded-lg">
                <Code className="h-8 w-8 text-purple-600" />
                <div>
                  <div className="text-2xl font-bold">{displayStats.integration_scalability}</div>
                  <div className="text-sm text-muted-foreground">Integration & Scalability</div>
                </div>
              </div>
              <div className="flex items-center gap-3 p-4 border rounded-lg">
                <Users className="h-8 w-8 text-orange-600" />
                <div>
                  <div className="text-2xl font-bold">{displayStats.business_ops}</div>
                  <div className="text-sm text-muted-foreground">Business & Operations</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Tabs */}
      <Tabs defaultValue="upload" className="space-y-4">
        <TabsList>
          <TabsTrigger value="upload" className="gap-2">
            <Upload className="h-4 w-4" />
            Upload Policy
          </TabsTrigger>
          <TabsTrigger value="review" className="gap-2">
            <CheckSquare className="h-4 w-4" />
            Review Queue
            {reviewCount > 0 && (
              <Badge variant="destructive" className="ml-2">{reviewCount}</Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="upload">
          <PolicyUploader 
            enterpriseId={enterpriseId} 
            onSuccess={handleUploadSuccess}
          />
        </TabsContent>

        <TabsContent value="review">
          <ClauseReviewQueue enterpriseId={enterpriseId} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default PolicyLibraryPage;
