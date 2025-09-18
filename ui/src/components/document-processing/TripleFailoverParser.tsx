import React, { useState, useEffect } from 'react';
import { Card, Button, Progress, Alert } from '@/components/ui';
import { 
  Brain, 
  Cloud, 
  FileText, 
  CheckCircle, 
  AlertTriangle, 
  Clock,
  Zap,
  Shield,
  Activity
} from 'lucide-react';

interface ParsingResult {
  method: 'ai' | 'textract' | 'template';
  confidence: number;
  content: string;
  processingTime: number;
  success: boolean;
  error?: string;
}

interface TripleFailoverParserProps {
  document: {
    id: string;
    name: string;
    type: string;
    content: string;
  };
  onParsingComplete: (result: ParsingResult) => void;
  className?: string;
}

export function TripleFailoverParser({ 
  document, 
  onParsingComplete, 
  className = '' 
}: TripleFailoverParserProps) {
  const [currentMethod, setCurrentMethod] = useState<'ai' | 'textract' | 'template' | null>(null);
  const [results, setResults] = useState<ParsingResult[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [finalResult, setFinalResult] = useState<ParsingResult | null>(null);

  const parsingMethods = [
    {
      id: 'ai' as const,
      name: 'AI Agent Parser',
      description: 'Primary: Google Document AI with Claude-3.5 Sonnet',
      icon: Brain,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      borderColor: 'border-purple-200',
      confidence: 0.9
    },
    {
      id: 'textract' as const,
      name: 'AWS Textract',
      description: 'Fallback: AWS Textract for document analysis',
      icon: Cloud,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200',
      confidence: 0.7
    },
    {
      id: 'template' as const,
      name: 'Template Parser',
      description: 'Last Resort: Rule-based template matching',
      icon: FileText,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200',
      confidence: 0.5
    }
  ];

  const simulateParsing = async (method: 'ai' | 'textract' | 'template'): Promise<ParsingResult> => {
    const startTime = Date.now();
    
    // Simulate different processing times and success rates
    const processingTimes = {
      ai: 2000,
      textract: 3000,
      template: 1000
    };

    const successRates = {
      ai: 0.85,
      textract: 0.70,
      template: 0.40
    };

    await new Promise(resolve => setTimeout(resolve, processingTimes[method]));
    
    const isSuccess = Math.random() < successRates[method];
    const processingTime = Date.now() - startTime;
    
    if (isSuccess) {
      return {
        method,
        confidence: parsingMethods.find(m => m.id === method)?.confidence || 0.5,
        content: `Successfully parsed "${document.name}" using ${method.toUpperCase()} method. Extracted structured content with ${Math.round((parsingMethods.find(m => m.id === method)?.confidence || 0.5) * 100)}% confidence.`,
        processingTime,
        success: true
      };
    } else {
      return {
        method,
        confidence: 0,
        content: '',
        processingTime,
        success: false,
        error: `${method.toUpperCase()} parsing failed. Attempting fallback method...`
      };
    }
  };

  const runTripleFailover = async () => {
    setIsProcessing(true);
    setResults([]);
    setFinalResult(null);
    
    const methods: ('ai' | 'textract' | 'template')[] = ['ai', 'textract', 'template'];
    
    for (let i = 0; i < methods.length; i++) {
      const method = methods[i];
      setCurrentMethod(method);
      
      const result = await simulateParsing(method);
      setResults(prev => [...prev, result]);
      
      if (result.success) {
        setFinalResult(result);
        onParsingComplete(result);
        break;
      }
      
      // If this is the last method and it failed, use it anyway
      if (i === methods.length - 1) {
        setFinalResult(result);
        onParsingComplete(result);
      }
    }
    
    setCurrentMethod(null);
    setIsProcessing(false);
  };

  const getMethodStatus = (method: 'ai' | 'textract' | 'template') => {
    if (currentMethod === method) {
      return 'processing';
    }
    
    const result = results.find(r => r.method === method);
    if (result) {
      return result.success ? 'success' : 'failed';
    }
    
    return 'pending';
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'processing':
        return <Clock className="h-4 w-4 text-blue-600 animate-spin" />;
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'failed':
        return <AlertTriangle className="h-4 w-4 text-red-600" />;
      default:
        return <div className="h-4 w-4 rounded-full bg-gray-300" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'processing':
        return 'border-blue-300 bg-blue-50';
      case 'success':
        return 'border-green-300 bg-green-50';
      case 'failed':
        return 'border-red-300 bg-red-50';
      default:
        return 'border-gray-200 bg-gray-50';
    }
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium text-gray-900">Triple-Failover Parsing</h3>
          <p className="text-sm text-gray-600">
            Deterministic document processing with guaranteed results
          </p>
        </div>
        <Button 
          onClick={runTripleFailover}
          disabled={isProcessing}
          className="flex items-center space-x-2"
        >
          <Zap className="h-4 w-4" />
          <span>{isProcessing ? 'Processing...' : 'Start Parsing'}</span>
        </Button>
      </div>

      {/* Processing Pipeline */}
      <div className="space-y-3">
        {parsingMethods.map((method, index) => {
          const status = getMethodStatus(method.id);
          const result = results.find(r => r.method === method.id);
          const Icon = method.icon;
          
          return (
            <Card key={method.id} className={`p-4 ${getStatusColor(status)}`}>
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0">
                  {getStatusIcon(status)}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <Icon className={`h-5 w-5 ${method.color}`} />
                      <h4 className="text-sm font-medium text-gray-900">
                        {method.name}
                      </h4>
                      {index === 0 && (
                        <span className="px-2 py-1 text-xs font-medium text-purple-700 bg-purple-100 rounded-full">
                          Primary
                        </span>
                      )}
                      {index === 1 && (
                        <span className="px-2 py-1 text-xs font-medium text-blue-700 bg-blue-100 rounded-full">
                          Fallback
                        </span>
                      )}
                      {index === 2 && (
                        <span className="px-2 py-1 text-xs font-medium text-green-700 bg-green-100 rounded-full">
                          Last Resort
                        </span>
                      )}
                    </div>
                    
                    {result && (
                      <div className="text-xs text-gray-500">
                        {result.processingTime}ms
                      </div>
                    )}
                  </div>
                  
                  <p className="text-xs text-gray-600 mb-2">
                    {method.description}
                  </p>
                  
                  {/* Processing Progress */}
                  {status === 'processing' && (
                    <div className="space-y-2">
                      <Progress value={75} className="h-2" />
                      <p className="text-xs text-blue-600">
                        Processing document with {method.name}...
                      </p>
                    </div>
                  )}
                  
                  {/* Success Result */}
                  {status === 'success' && result && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-green-600 font-medium">
                          ✓ Successfully parsed
                        </span>
                        <span className="text-gray-500">
                          {Math.round(result.confidence * 100)}% confidence
                        </span>
                      </div>
                      <div className="text-xs text-gray-600 bg-white p-2 rounded border">
                        {result.content}
                      </div>
                    </div>
                  )}
                  
                  {/* Failed Result */}
                  {status === 'failed' && result && (
                    <div className="space-y-2">
                      <div className="text-xs text-red-600 font-medium">
                        ✗ Parsing failed
                      </div>
                      <div className="text-xs text-red-600 bg-red-50 p-2 rounded border">
                        {result.error}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Final Result */}
      {finalResult && (
        <Card className="p-4 bg-gradient-to-r from-purple-50 to-blue-50 border-purple-200">
          <div className="flex items-start space-x-3">
            <Shield className="h-5 w-5 text-purple-600 mt-0.5" />
            <div className="flex-1">
              <h4 className="text-sm font-medium text-gray-900 mb-2">
                Deterministic Processing Complete
              </h4>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-600">Final Method:</span>
                  <span className="font-medium text-gray-900">
                    {parsingMethods.find(m => m.id === finalResult.method)?.name}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-600">Confidence Score:</span>
                  <span className="font-medium text-gray-900">
                    {Math.round(finalResult.confidence * 100)}%
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-600">Processing Time:</span>
                  <span className="font-medium text-gray-900">
                    {finalResult.processingTime}ms
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-600">Status:</span>
                  <span className={`font-medium ${finalResult.success ? 'text-green-600' : 'text-red-600'}`}>
                    {finalResult.success ? 'Success' : 'Failed'}
                  </span>
                </div>
              </div>
              
              {finalResult.success && (
                <div className="mt-3 p-3 bg-white rounded border">
                  <h5 className="text-xs font-medium text-gray-900 mb-1">Extracted Content:</h5>
                  <p className="text-xs text-gray-600">{finalResult.content}</p>
                </div>
              )}
            </div>
          </div>
        </Card>
      )}

      {/* Processing Summary */}
      {results.length > 0 && (
        <Card className="p-4 bg-gray-50">
          <div className="grid grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-lg font-bold text-gray-900">
                {results.filter(r => r.success).length}
              </div>
              <div className="text-xs text-gray-600">Successful</div>
            </div>
            <div>
              <div className="text-lg font-bold text-gray-900">
                {results.filter(r => !r.success).length}
              </div>
              <div className="text-xs text-gray-600">Failed</div>
            </div>
            <div>
              <div className="text-lg font-bold text-gray-900">
                {Math.round(results.reduce((acc, r) => acc + r.processingTime, 0) / results.length) || 0}ms
              </div>
              <div className="text-xs text-gray-600">Avg Time</div>
            </div>
            <div>
              <div className="text-lg font-bold text-gray-900">
                {finalResult ? Math.round(finalResult.confidence * 100) : 0}%
              </div>
              <div className="text-xs text-gray-600">Final Confidence</div>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}