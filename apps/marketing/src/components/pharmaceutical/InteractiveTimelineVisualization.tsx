import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Calendar, CheckCircle, Clock, AlertTriangle, FileText, Users } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';

interface TimelineEvent {
  id: string;
  date: string;
  title: string;
  description: string;
  type: 'milestone' | 'regulation' | 'guidance' | 'deadline';
  status: 'completed' | 'in-progress' | 'upcoming';
  impact: 'high' | 'medium' | 'low';
  aicomplyResponse?: string;
}

const timelineData: TimelineEvent[] = [
  {
    id: '1',
    date: '2020-01-15',
    title: 'FDA AI/ML Guidance Published',
    description: 'FDA released initial guidance on AI/ML-enabled medical devices',
    type: 'regulation',
    status: 'completed',
    impact: 'high',
    aicomplyResponse: 'Framework foundation established for predictive compliance'
  },
  {
    id: '2',
    date: '2021-04-20',
    title: 'Good Machine Learning Practice',
    description: 'FDA published Good Machine Learning Practice for Medical Device Development',
    type: 'guidance',
    status: 'completed',
    impact: 'high',
    aicomplyResponse: 'Integrated GMLP requirements into automated assessment framework'
  },
  {
    id: '3',
    date: '2022-09-15',
    title: 'Digital Health Center Updates',
    description: 'Enhanced pre-submission guidance for AI-enabled devices',
    type: 'guidance',
    status: 'completed',
    impact: 'medium',
    aicomplyResponse: 'Updated policy templates to reflect new pre-submission requirements'
  },
  {
    id: '4',
    date: '2023-11-30',
    title: 'Software as Medical Device Framework',
    description: 'Comprehensive SaMD classification and risk categorization',
    type: 'regulation',
    status: 'completed',
    impact: 'high',
    aicomplyResponse: 'Built automated risk classification engine for SaMD compliance'
  },
  {
    id: '5',
    date: '2024-03-15',
    title: 'AI Governance Framework',
    description: 'FDA released comprehensive AI governance requirements',
    type: 'regulation',
    status: 'completed',
    impact: 'high',
    aicomplyResponse: 'Launched enterprise governance dashboard and audit trail system'
  },
  {
    id: '6',
    date: '2024-12-01',
    title: 'Updated 21 CFR Part 11',
    description: 'Enhanced electronic records requirements for AI systems',
    type: 'regulation',
    status: 'in-progress',
    impact: 'high',
    aicomplyResponse: 'Developing next-gen cryptographic validation system'
  },
  {
    id: '7',
    date: '2025-06-15',
    title: 'Manufacturing AI Guidance',
    description: 'New guidance for AI in pharmaceutical manufacturing processes',
    type: 'guidance',
    status: 'upcoming',
    impact: 'medium',
    aicomplyResponse: 'Manufacturing compliance module in development'
  },
  {
    id: '8',
    date: '2025-12-31',
    title: 'Mandatory AI Auditing',
    description: 'All pharmaceutical AI systems must undergo annual compliance audits',
    type: 'deadline',
    status: 'upcoming',
    impact: 'high',
    aicomplyResponse: 'Automated audit package generation ready for deployment'
  }
];

export const InteractiveTimelineVisualization: React.FC = () => {
  const [selectedEvent, setSelectedEvent] = useState<TimelineEvent | null>(null);
  const [filterType, setFilterType] = useState<string>('all');

  const filteredEvents = filterType === 'all' 
    ? timelineData 
    : timelineData.filter(event => event.type === filterType);

  const getEventIcon = (type: string, status: string) => {
    if (status === 'completed') return <CheckCircle className="h-4 w-4 text-green-600" />;
    if (status === 'in-progress') return <Clock className="h-4 w-4 text-blue-600" />;
    
    switch (type) {
      case 'regulation': return <FileText className="h-4 w-4 text-red-600" />;
      case 'guidance': return <Users className="h-4 w-4 text-orange-600" />;
      case 'deadline': return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
      default: return <Calendar className="h-4 w-4 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-500';
      case 'in-progress': return 'bg-blue-500';
      case 'upcoming': return 'bg-gray-400';
      default: return 'bg-gray-400';
    }
  };

  const getImpactBadge = (impact: string) => {
    const variants = {
      high: 'destructive',
      medium: 'secondary',
      low: 'outline'
    } as const;

    return (
      <Badge variant={variants[impact as keyof typeof variants]} className="text-xs">
        {impact.toUpperCase()} IMPACT
      </Badge>
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const calculateProgress = () => {
    const completedEvents = filteredEvents.filter(event => event.status === 'completed').length;
    return Math.round((completedEvents / filteredEvents.length) * 100);
  };

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Calendar className="h-5 w-5 text-primary" />
              <span>FDA AI Regulatory Timeline</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-sm text-muted-foreground">
                {calculateProgress()}% Complete
              </span>
              <Progress value={calculateProgress()} className="w-20" />
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex space-x-2 mb-4">
            <Button
              variant={filterType === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilterType('all')}
            >
              All Events
            </Button>
            <Button
              variant={filterType === 'regulation' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilterType('regulation')}
            >
              Regulations
            </Button>
            <Button
              variant={filterType === 'guidance' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilterType('guidance')}
            >
              Guidance
            </Button>
            <Button
              variant={filterType === 'deadline' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilterType('deadline')}
            >
              Deadlines
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Timeline */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Regulatory Evolution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="relative">
              {/* Timeline line */}
              <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-border"></div>
              
              <div className="space-y-6">
                {filteredEvents.map((event, index) => (
                  <motion.div
                    key={event.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className={`relative flex items-start space-x-4 cursor-pointer p-3 rounded-lg transition-colors ${
                      selectedEvent?.id === event.id ? 'bg-primary/5 border border-primary/20' : 'hover:bg-muted/50'
                    }`}
                    onClick={() => setSelectedEvent(event)}
                  >
                    {/* Timeline node */}
                    <div className={`relative z-10 w-3 h-3 rounded-full ${getStatusColor(event.status)} border-2 border-background`}></div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center space-x-2">
                          {getEventIcon(event.type, event.status)}
                          <span className="text-sm font-medium">{event.title}</span>
                        </div>
                        {getImpactBadge(event.impact)}
                      </div>
                      <p className="text-xs text-muted-foreground mb-2">{event.description}</p>
                      <div className="text-xs text-muted-foreground">
                        {formatDate(event.date)}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Event Details */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">
              {selectedEvent ? 'Event Details' : 'Select an Event'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {selectedEvent ? (
              <motion.div
                key={selectedEvent.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-4"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    {getEventIcon(selectedEvent.type, selectedEvent.status)}
                    <h3 className="font-semibold">{selectedEvent.title}</h3>
                  </div>
                  {getImpactBadge(selectedEvent.impact)}
                </div>

                <div className="space-y-2">
                  <div className="text-sm">
                    <span className="font-medium">Date:</span> {formatDate(selectedEvent.date)}
                  </div>
                  <div className="text-sm">
                    <span className="font-medium">Type:</span> {selectedEvent.type}
                  </div>
                  <div className="text-sm">
                    <span className="font-medium">Status:</span> 
                    <Badge variant="outline" className="ml-2 text-xs">
                      {selectedEvent.status.replace('-', ' ').toUpperCase()}
                    </Badge>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium text-sm mb-2">Description</h4>
                  <p className="text-sm text-muted-foreground">{selectedEvent.description}</p>
                </div>

                {selectedEvent.aicomplyResponse && (
                  <div className="p-3 bg-primary/5 rounded-lg border border-primary/20">
                    <h4 className="font-medium text-sm mb-2 flex items-center">
                      <span className="text-brand-teal">aicomplyr.io Response</span>
                    </h4>
                    <p className="text-sm text-muted-foreground">{selectedEvent.aicomplyResponse}</p>
                  </div>
                )}

                {selectedEvent.status === 'upcoming' && (
                  <div className="p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                    <p className="text-sm text-yellow-800">
                      <strong>Preparation Time:</strong> {Math.ceil((new Date(selectedEvent.date).getTime() - Date.now()) / (1000 * 60 * 60 * 24))} days remaining
                    </p>
                  </div>
                )}
              </motion.div>
            ) : (
              <div className="text-center py-8">
                <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">
                  Click on any timeline event to view detailed information and aicomplyr.io's response.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};