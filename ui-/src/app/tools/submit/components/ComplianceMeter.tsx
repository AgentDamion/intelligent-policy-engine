import React from 'react';
import { Card } from '@/components/ui';
import { TrendingUp, CheckCircle } from 'lucide-react';

interface ComplianceMeterProps {
  score: number;
  completedSteps: number;
  totalSteps: number;
}

export function ComplianceMeter({ score, completedSteps, totalSteps }: ComplianceMeterProps) {
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBgColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  // Calculate the stroke dasharray for the circular progress
  const circumference = 2 * Math.PI * 40;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  return (
    <Card className="p-4">
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium text-gray-900">Compliance Score</h3>
          <TrendingUp className="h-4 w-4 text-gray-400" />
        </div>

        {/* Circular Progress */}
        <div className="flex justify-center">
          <div className="relative w-24 h-24">
            <svg className="w-24 h-24 transform -rotate-90" viewBox="0 0 100 100">
              {/* Background circle */}
              <circle
                cx="50"
                cy="50"
                r="40"
                stroke="currentColor"
                strokeWidth="8"
                fill="transparent"
                className="text-gray-200"
              />
              {/* Progress circle */}
              <circle
                cx="50"
                cy="50"
                r="40"
                stroke="currentColor"
                strokeWidth="8"
                fill="transparent"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                className={getScoreBgColor(score)}
                strokeLinecap="round"
                style={{
                  transition: 'stroke-dashoffset 0.5s ease-in-out'
                }}
              />
            </svg>
            {/* Score text */}
            <div className="absolute inset-0 flex items-center justify-center">
              <span className={`text-lg font-semibold ${getScoreColor(score)}`}>
                {Math.round(score)}%
              </span>
            </div>
          </div>
        </div>

        {/* Description */}
        <div className="text-center">
          <p className="text-sm text-gray-600">
            Based on completed fields and policy alignment
          </p>
        </div>

        {/* Progress breakdown */}
        <div className="space-y-3 pt-2 border-t border-gray-100">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Steps completed</span>
            <span className="font-medium">
              {completedSteps} of {totalSteps}
            </span>
          </div>
          
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Required fields</span>
            <div className="flex items-center gap-1">
              <CheckCircle className="h-3 w-3 text-green-600" />
              <span className="text-green-600 font-medium">
                {score >= 70 ? 'Complete' : 'In progress'}
              </span>
            </div>
          </div>

          {/* Progress bar */}
          <div className="space-y-1">
            <div className="flex justify-between text-xs text-gray-500">
              <span>Form completion</span>
              <span>{Math.round((completedSteps / totalSteps) * 100)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-1.5">
              <div 
                className="bg-blue-600 h-1.5 rounded-full transition-all duration-300"
                style={{ width: `${(completedSteps / totalSteps) * 100}%` }}
              />
            </div>
          </div>
        </div>

        {/* Score guidance */}
        <div className="text-xs text-gray-500 bg-gray-50 rounded-lg p-3">
          {score >= 80 && (
            <div className="flex items-center gap-2">
              <CheckCircle className="h-3 w-3 text-green-600 flex-shrink-0" />
              <span>Excellent! Your submission meets all compliance requirements.</span>
            </div>
          )}
          {score >= 60 && score < 80 && (
            <div className="flex items-center gap-2">
              <TrendingUp className="h-3 w-3 text-yellow-600 flex-shrink-0" />
              <span>Good progress. Complete remaining sections to improve compliance score.</span>
            </div>
          )}
          {score < 60 && (
            <div className="flex items-center gap-2">
              <TrendingUp className="h-3 w-3 text-red-600 flex-shrink-0" />
              <span>More information needed. Focus on required fields and risk assessment.</span>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}
