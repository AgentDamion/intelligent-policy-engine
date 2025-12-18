import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { getApiUrl } from '@/config/api';

const AgentTestPanel = () => {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any[]>([]);

  const runConflictTest = async (testName: string, policies: any[]) => {
    setLoading(true);
    try {
      const response = await fetch(getApiUrl('/api/analyze-conflicts'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ policies })
      });
      
      const data = await response.json();
      setResults(prev => [...prev, { testName, success: data.success, time: new Date().toLocaleTimeString() }]);
      
      // Trigger a refresh of activities after 1 second
      setTimeout(() => {
        window.location.reload();
      }, 1000);
      
    } catch (error) {
      console.error('Test failed:', error);
      setResults(prev => [...prev, { testName, success: false, error: error.message }]);
    } finally {
      setLoading(false);
    }
  };

  const test1Policies = [
    { id: 1, content: "All customer data must be permanently deleted within 30 days of account closure" },
    { id: 2, content: "Customer transaction records must be retained for 7 years for regulatory compliance" }
  ];

  const test2Policies = [
    { id: 3, content: "No AI tools may process personally identifiable information (PII) without explicit consent" },
    { id: 4, content: "AI-powered customer service must have access to customer profiles to provide personalized support" },
    { id: 5, content: "All customer data must be anonymized before any AI processing" }
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Agent Test Panel</CardTitle>
        <CardDescription>Run tests to generate agent activities</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Button 
            onClick={() => runConflictTest('Data Retention Conflict', test1Policies)}
            disabled={loading}
            className="w-full"
          >
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Test 1: Data Retention Conflict
          </Button>
          
          <Button 
            onClick={() => runConflictTest('AI Usage Conflict', test2Policies)}
            disabled={loading}
            variant="secondary"
            className="w-full"
          >
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Test 2: AI Usage Conflict (3 policies)
          </Button>
        </div>

        {results.length > 0 && (
          <div className="mt-4 space-y-2">
            <h3 className="text-sm font-medium">Test Results:</h3>
            {results.map((result, index) => (
              <div key={index} className="text-sm">
                <span className={result.success ? 'text-green-600' : 'text-red-600'}>
                  {result.success ? '✓' : '✗'}
                </span>
                {' '}{result.testName} - {result.time}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default AgentTestPanel;