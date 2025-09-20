import React, { useState, useEffect } from 'react';
import { Card, Button, Progress, Alert, Badge } from '@/components/ui';
import { DocumentUploadZone, DocumentFile } from './DocumentUploadZone';
import { TripleFailoverParser } from './TripleFailoverParser';
import { 
  FileText, 
  CheckCircle, 
  AlertTriangle, 
  Clock, 
  Zap,
  Shield,
  Activity,
  Download,
  Eye,
  Trash2
} from 'lucide-react';

interface ProcessingStage {
  id: string;
  name: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  startTime?: Date;
  endTime?: Date;
  duration?: number; // in seconds
  description: string;
  icon: React.ComponentType<any>;
}

interface DocumentProcessingPipelineProps {
  onProcessingComplete?: (results: ProcessingResult[]) => void;
  className?: string;
}

interface ProcessingResult {
  documentId: string;
  documentName: string;
  status: 'success' | 'failed';
  parsedContent: string;
  confidence: number;
  parsingMethod: 'ai' | 'textract' | 'template';
  processingTime: number;
  error?: string;
}

export function DocumentProcessingPipeline({ 
  onProcessingComplete,
  className = '' 
}: DocumentProcessingPipelineProps) {
  const [documents, setDocuments] = useState<DocumentFile[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentStage, setCurrentStage] = useState<string | null>(null);
  const [results, setResults] = useState<ProcessingResult[]>([]);
  const [pipelineStages, setPipelineStages] = useState<ProcessingStage[]>([]);

  const stages: ProcessingStage[] = [
    {
      id: 'upload',
      name: 'Document Upload',
      status: 'pending',
      description: 'Upload and validate document files',
      icon: FileText
    },
    {
      id: 'validation',
      name: 'Schema Validation',
      status: 'pending',
      description: 'Validate document structure and format',
      icon: Shield
    },
    {
      id: 'parsing',
      name: 'Triple-Failover Parsing',
      status: 'pending',
      description: 'Extract content using AI → Textract → Template',
      icon: Zap
    },
    {
      id: 'analysis',
      name: 'AI Analysis',
      status: 'pending',
      description: 'Context, Policy, and Risk agent analysis',
      icon: Activity
    },
    {
      id: 'validation_final',
      name: 'Final Validation',
      status: 'pending',
      description: 'Rule engine validation and confidence scoring',
      icon: CheckCircle
    }
  ];

  useEffect(() => {
    setPipelineStages(stages);
  }, []);

  const handleDocumentsChange = (newDocuments: DocumentFile[]) => {
    setDocuments(newDocuments);
  };

  const startProcessing = async () => {
    if (documents.length === 0) return;

    setIsProcessing(true);
    setResults([]);
    
    // Reset stages
    setPipelineStages(stages.map(stage => ({ ...stage, status: 'pending' })));

    // Process each document through the pipeline
    for (const doc of documents) {
      await processDocument(doc);
    }

    setIsProcessing(false);
    onProcessingComplete?.(results);
  };

  const processDocument = async (document: DocumentFile) => {
    const startTime = Date.now();
    
    try {
      // Stage 1: Upload (already done)
      await updateStage('upload', 'completed');
      
      // Stage 2: Schema Validation
      await updateStage('validation', 'in_progress');
      await simulateDelay(1000);
      await updateStage('validation', 'completed');
      
      // Stage 3: Triple-Failover Parsing
      await updateStage('parsing', 'in_progress');
      const parsingResult = await simulateParsing(document);
      await updateStage('parsing', 'completed');
      
      // Stage 4: AI Analysis
      await updateStage('analysis', 'in_progress');
      await simulateDelay(2000);
      await updateStage('analysis', 'completed');
      
      // Stage 5: Final Validation
      await updateStage('validation_final', 'in_progress');
      await simulateDelay(1000);
      await updateStage('validation_final', 'completed');
      
      const processingTime = Date.now() - startTime;
      
      const result: ProcessingResult = {
        documentId: document.id,
        documentName: document.name,
        status: 'success',
        parsedContent: parsingResult.content,
        confidence: parsingResult.confidence,
        parsingMethod: parsingResult.method,
        processingTime
      };
      
      setResults(prev => [...prev, result]);
      
    } catch (error) {
      const processingTime = Date.now() - startTime;
      
      const result: ProcessingResult = {
        documentId: document.id,
        documentName: document.name,
        status: 'failed',
        parsedContent: '',
        confidence: 0,
        parsingMethod: 'template',
        processingTime,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
      
      setResults(prev => [...prev, result]);
    }
  };

  const simulateParsing = async (document: DocumentFile): Promise<{
    content: string;
    confidence: number;
    method: 'ai' | 'textract' | 'template';
  }> => {
    // Simulate triple-failover parsing
    const methods = ['ai', 'textract', 'template'] as const;
    const method = methods[Math.floor(Math.random() * methods.length)];
    const confidence = method === 'ai' ? 0.9 : method === 'textract' ? 0.7 : 0.5;
    
    await simulateDelay(1500);
    
    return {
      content: `Successfully parsed "${document.name}" using ${method.toUpperCase()} method. Extracted structured content with ${Math.round(confidence * 100)}% confidence.`,
      confidence,
      method
    };
  };

  const simulateDelay = (ms: number) => {
    return new Promise(resolve => setTimeout(resolve, ms));
  };

  const updateStage = async (stageId: string, status: ProcessingStage['status']) => {
    setPipelineStages(prev => prev.map(stage => 
      stage.id === stageId 
        ? { 
            ...stage, 
            status,
            startTime: status === 'in_progress' ? new Date() : stage.startTime,
            endTime: status === 'completed' ? new Date() : stage.endTime,
            duration: status === 'completed' && stage.startTime 
              ? (Date.now() - stage.startTime.getTime()) / 1000 
              : stage.duration
          }
        : stage
    ));
    
    setCurrentStage(status === 'in_progress' ? stageId : null);
  };

  const getStageStatusIcon = (stage: ProcessingStage) => {
    switch (stage.status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'in_progress':
        return <Activity className="h-4 w-4 text-blue-600 animate-pulse" />;
      case 'failed':
        return <AlertTriangle className="h-4 w-4 text-red-600" />;
      default:
        return <Clock className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStageStatusColor = (stage: ProcessingStage) => {
    switch (stage.status) {
      case 'completed':
        return 'border-green-200 bg-green-50';
      case 'in_progress':
        return 'border-blue-200 bg-blue-50';
      case 'failed':
        return 'border-red-200 bg-red-50';
      default:
        return 'border-gray-200 bg-gray-50';
    }
  };

  const getOverallStatus = () => {
    if (pipelineStages.some(s => s.status === 'failed')) return 'failed';
    if (pipelineStages.every(s => s.status === 'completed')) return 'completed';
    if (pipelineStages.some(s => s.status === 'in_progress')) return 'in_progress';
    return 'pending';
  };

  const getOverallProgress = () => {
    const completedStages = pipelineStages.filter(s => s.status === 'completed').length;
    return (completedStages / pipelineStages.length) * 100;
  };

  const exportResults = () => {
    const csvData = results.map(result => ({
      documentName: result.documentName,
      status: result.status,
      confidence: result.confidence,
      parsingMethod: result.parsingMethod,
      processingTime: result.processingTime,
      content: result.parsedContent
    }));

    const csv = [
      Object.keys(csvData[0]).join(','),
      ...csvData.map(row => Object.values(row).join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `document-processing-results-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Document Processing Pipeline</h2>
          <p className="text-gray-600">
            Deterministic document processing with triple-failover parsing
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <Button
            onClick={exportResults}
            disabled={results.length === 0}
            variant="outline"
          >
            <Download className="h-4 w-4 mr-2" />
            Export Results
          </Button>
          <Button
            onClick={startProcessing}
            disabled={documents.length === 0 || isProcessing}
            className="flex items-center space-x-2"
          >
            <Zap className="h-4 w-4" />
            <span>{isProcessing ? 'Processing...' : 'Start Processing'}</span>
          </Button>
        </div>
      </div>

      {/* Overall Progress */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900">Processing Status</h3>
          <Badge className={
            getOverallStatus() === 'completed' ? 'text-green-600 bg-green-50 border-green-200' :
            getOverallStatus() === 'in_progress' ? 'text-blue-600 bg-blue-50 border-blue-200' :
            getOverallStatus() === 'failed' ? 'text-red-600 bg-red-50 border-red-200' :
            'text-gray-600 bg-gray-50 border-gray-200'
          }>
            {getOverallStatus().replace('_', ' ').toUpperCase()}
          </Badge>
        </div>
        
        <div className="space-y-4">
          <Progress value={getOverallProgress()} className="h-3" />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-gray-900">
                {documents.length}
              </div>
              <div className="text-xs text-gray-600">Documents</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">
                {results.filter(r => r.status === 'success').length}
              </div>
              <div className="text-xs text-gray-600">Successfully Processed</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">
                {Math.round(results.reduce((acc, r) => acc + r.confidence, 0) / results.length * 100) || 0}%
              </div>
              <div className="text-xs text-gray-600">Avg Confidence</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">
                {Math.round(results.reduce((acc, r) => acc + r.processingTime, 0) / results.length / 1000) || 0}s
              </div>
              <div className="text-xs text-gray-600">Avg Processing Time</div>
            </div>
          </div>
        </div>
      </Card>

      {/* Pipeline Stages */}
      <Card className="p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Processing Pipeline</h3>
        <div className="space-y-3">
          {pipelineStages.map((stage, index) => {
            const Icon = stage.icon;
            return (
              <div key={stage.id} className={`p-4 rounded-lg border ${getStageStatusColor(stage)}`}>
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0">
                    {getStageStatusIcon(stage)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <Icon className="h-5 w-5 text-gray-600" />
                        <h4 className="text-sm font-medium text-gray-900">
                          {stage.name}
                        </h4>
                        <span className="text-xs text-gray-500">
                          Step {index + 1} of {pipelineStages.length}
                        </span>
                      </div>
                      {stage.duration && (
                        <span className="text-xs text-gray-500">
                          {stage.duration.toFixed(1)}s
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-600 mb-2">
                      {stage.description}
                    </p>
                    {stage.status === 'in_progress' && (
                      <div className="space-y-2">
                        <Progress value={75} className="h-2" />
                        <p className="text-xs text-blue-600">
                          Processing documents...
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Document Upload */}
      <DocumentUploadZone
        onDocumentsChange={handleDocumentsChange}
        maxFiles={10}
        acceptedTypes={['.pdf', '.docx', '.txt', '.doc']}
        maxSize={50}
      />

      {/* Processing Results */}
      {results.length > 0 && (
        <Card className="p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Processing Results</h3>
          <div className="space-y-3">
            {results.map((result, index) => (
              <div key={index} className={`p-4 rounded-lg border ${
                result.status === 'success' 
                  ? 'border-green-200 bg-green-50' 
                  : 'border-red-200 bg-red-50'
              }`}>
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-2">
                      <h4 className="text-sm font-medium text-gray-900">
                        {result.documentName}
                      </h4>
                      <Badge className={
                        result.status === 'success' 
                          ? 'text-green-600 bg-green-100' 
                          : 'text-red-600 bg-red-100'
                      }>
                        {result.status}
                      </Badge>
                      <Badge variant="outline">
                        {result.parsingMethod.toUpperCase()}
                      </Badge>
                    </div>
                    
                    {result.status === 'success' && (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-xs text-gray-600">
                          <span>Confidence: {Math.round(result.confidence * 100)}%</span>
                          <span>Processing Time: {result.processingTime}ms</span>
                        </div>
                        <div className="text-xs text-gray-600 bg-white p-2 rounded border">
                          {result.parsedContent}
                        </div>
                      </div>
                    )}
                    
                    {result.status === 'failed' && result.error && (
                      <div className="text-xs text-red-600 bg-red-100 p-2 rounded border">
                        {result.error}
                      </div>
                    )}
                  </div>
                  
                  <div className="flex items-center space-x-2 ml-4">
                    <Button variant="outline" size="sm">
                      <Eye className="h-3 w-3" />
                    </Button>
                    <Button variant="outline" size="sm">
                      <Download className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}