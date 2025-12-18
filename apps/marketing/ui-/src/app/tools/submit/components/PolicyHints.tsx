import React from 'react';
import { Card, Skeleton } from '@/components/ui';
import type { PolicyHint } from '../types';
import { FileText, AlertTriangle, Info, ExternalLink, Star } from 'lucide-react';

interface PolicyHintsProps {
  hints: PolicyHint[] | null;
  category?: string;
}

export function PolicyHints({ hints, category }: PolicyHintsProps) {
  const getRelevanceColor = (relevance: number) => {
    if (relevance >= 0.8) return 'text-red-600';
    if (relevance >= 0.6) return 'text-yellow-600';
    return 'text-blue-600';
  };

  const getRelevanceIcon = (relevance: number, required?: boolean) => {
    if (required) return <AlertTriangle className="h-3 w-3 text-red-600" />;
    if (relevance >= 0.8) return <Star className="h-3 w-3 text-yellow-600" />;
    return <Info className="h-3 w-3 text-blue-600" />;
  };

  const getRelevanceLabel = (relevance: number, required?: boolean) => {
    if (required) return 'Required';
    if (relevance >= 0.8) return 'High';
    if (relevance >= 0.6) return 'Medium';
    return 'Low';
  };

  return (
    <Card className="p-4">
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-blue-600" />
            <h3 className="text-sm font-medium text-gray-900">Relevant Policies</h3>
          </div>
          {category && (
            <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
              {category.replace('-', ' ')}
            </span>
          )}
        </div>

        {/* Content */}
        {hints === null ? (
          <div className="space-y-3">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-10 w-full" />
          </div>
        ) : hints.length === 0 ? (
          <div className="text-center py-6">
            <FileText className="h-8 w-8 text-gray-400 mx-auto mb-3" />
            <p className="text-sm text-gray-600 mb-2">No policies found</p>
            <p className="text-xs text-gray-500">
              Select a tool category to see relevant policies and guidelines
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-xs text-gray-600">
              {hints.length} {hints.length === 1 ? 'policy' : 'policies'} applicable to your submission
            </p>
            
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {hints
                .sort((a, b) => {
                  // Sort by required first, then by relevance
                  if (a.required && !b.required) return -1;
                  if (!a.required && b.required) return 1;
                  return b.relevance - a.relevance;
                })
                .map((hint) => (
                  <div
                    key={hint.id}
                    className={`p-3 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors ${
                      hint.required 
                        ? 'border-red-200 bg-red-50' 
                        : hint.relevance >= 0.8
                        ? 'border-yellow-200 bg-yellow-50'
                        : 'border-gray-200'
                    }`}
                  >
                    <div className="space-y-2">
                      {/* Title and Relevance */}
                      <div className="flex items-start justify-between gap-2">
                        <h4 className="text-sm font-medium text-gray-900 flex-1">
                          {hint.title}
                        </h4>
                        <div className="flex items-center gap-1 flex-shrink-0">
                          {getRelevanceIcon(hint.relevance, hint.required)}
                          <span className={`text-xs font-medium ${getRelevanceColor(hint.relevance)}`}>
                            {getRelevanceLabel(hint.relevance, hint.required)}
                          </span>
                        </div>
                      </div>

                      {/* Body */}
                      <p className="text-xs text-gray-700 leading-relaxed">
                        {hint.body}
                      </p>

                      {/* Relevance Score */}
                      {!hint.required && (
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-gray-500">
                            Relevance: {Math.round(hint.relevance * 100)}%
                          </span>
                          <ExternalLink className="h-3 w-3 text-gray-400" />
                        </div>
                      )}
                    </div>
                  </div>
                ))
              }
            </div>

            {/* Footer */}
            <div className="pt-2 border-t border-gray-100">
              <div className="flex items-center justify-between text-xs text-gray-500">
                <span>
                  {hints.filter(h => h.required).length} required policies
                </span>
                <span>
                  Updated automatically
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}
