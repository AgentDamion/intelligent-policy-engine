import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  AlertTriangle, 
  Clock, 
  User, 
  Calendar,
  CheckCircle,
  Filter
} from 'lucide-react';

interface ActionItemsListProps {
  actionItems: Array<{
    id: string;
    title: string;
    priority: 'high' | 'medium' | 'low';
    dueDate: string;
    area: string;
    description: string;
    clientName: string;
  }>;
}

type PriorityFilter = 'all' | 'high' | 'medium' | 'low';

export const ActionItemsList: React.FC<ActionItemsListProps> = ({ actionItems }) => {
  const [priorityFilter, setPriorityFilter] = useState<PriorityFilter>('all');
  const [completedItems, setCompletedItems] = useState<Set<string>>(new Set());

  const filteredItems = actionItems.filter(item => {
    if (priorityFilter === 'all') return true;
    return item.priority === priorityFilter;
  });

  const getPriorityColor = (priority: 'high' | 'medium' | 'low') => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-blue-100 text-blue-800 border-blue-200';
    }
  };

  const getPriorityIcon = (priority: 'high' | 'medium' | 'low') => {
    switch (priority) {
      case 'high': return <AlertTriangle className="h-3 w-3" />;
      case 'medium': return <Clock className="h-3 w-3" />;
      case 'low': return <Calendar className="h-3 w-3" />;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = date.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    const formatted = date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
    });

    if (diffDays < 0) {
      return { formatted, status: 'overdue', text: `${formatted} (${Math.abs(diffDays)}d overdue)` };
    } else if (diffDays <= 7) {
      return { formatted, status: 'urgent', text: `${formatted} (${diffDays}d left)` };
    } else {
      return { formatted, status: 'normal', text: formatted };
    }
  };

  const getDateColor = (status: string) => {
    switch (status) {
      case 'overdue': return 'text-red-600';
      case 'urgent': return 'text-yellow-600';
      default: return 'text-muted-foreground';
    }
  };

  const handleCompleteItem = (itemId: string) => {
    setCompletedItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(itemId)) {
        newSet.delete(itemId);
      } else {
        newSet.add(itemId);
      }
      return newSet;
    });
  };

  const getFilterButtonVariant = (filter: PriorityFilter) => {
    return priorityFilter === filter ? 'default' : 'outline';
  };

  const priorityCounts = {
    high: actionItems.filter(item => item.priority === 'high').length,
    medium: actionItems.filter(item => item.priority === 'medium').length,
    low: actionItems.filter(item => item.priority === 'low').length
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-600" />
              Action Items
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              {actionItems.length} items requiring attention across all clients
            </p>
          </div>
          <Badge variant="outline" className="gap-1">
            <Filter className="h-3 w-3" />
            {filteredItems.length} shown
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Priority Filters */}
        <div className="flex gap-2 flex-wrap">
          <Button
            variant={getFilterButtonVariant('all')}
            size="sm"
            onClick={() => setPriorityFilter('all')}
          >
            All ({actionItems.length})
          </Button>
          <Button
            variant={getFilterButtonVariant('high')}
            size="sm"
            onClick={() => setPriorityFilter('high')}
            className="gap-1"
          >
            <AlertTriangle className="h-3 w-3" />
            High ({priorityCounts.high})
          </Button>
          <Button
            variant={getFilterButtonVariant('medium')}
            size="sm"
            onClick={() => setPriorityFilter('medium')}
            className="gap-1"
          >
            <Clock className="h-3 w-3" />
            Medium ({priorityCounts.medium})
          </Button>
          <Button
            variant={getFilterButtonVariant('low')}
            size="sm"
            onClick={() => setPriorityFilter('low')}
            className="gap-1"
          >
            <Calendar className="h-3 w-3" />
            Low ({priorityCounts.low})
          </Button>
        </div>

        {/* Action Items List */}
        <div className="space-y-3">
          {filteredItems.map((item, index) => {
            const dateInfo = formatDate(item.dueDate);
            const isCompleted = completedItems.has(item.id);
            
            return (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className={`p-4 rounded-lg border ${isCompleted ? 'bg-green-50 border-green-200' : 'bg-card'}`}
              >
                <div className="space-y-3">
                  {/* Header */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0"
                          onClick={() => handleCompleteItem(item.id)}
                        >
                          <CheckCircle className={`h-4 w-4 ${isCompleted ? 'text-green-600' : 'text-muted-foreground'}`} />
                        </Button>
                        <Badge variant="outline" className={`${getPriorityColor(item.priority)} gap-1`}>
                          {getPriorityIcon(item.priority)}
                          {item.priority}
                        </Badge>
                        <Badge variant="secondary">
                          {item.area}
                        </Badge>
                      </div>
                      <h3 className={`font-medium ${isCompleted ? 'line-through text-muted-foreground' : ''}`}>
                        {item.title}
                      </h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        {item.description}
                      </p>
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="flex items-center justify-between text-sm pt-2 border-t">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-1">
                        <User className="h-3 w-3 text-muted-foreground" />
                        <span className="text-muted-foreground">{item.clientName}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3 text-muted-foreground" />
                        <span className={getDateColor(dateInfo.status)}>
                          {dateInfo.text}
                        </span>
                      </div>
                    </div>
                    {isCompleted && (
                      <Badge variant="outline" className="text-green-600 border-green-200 bg-green-50">
                        Completed
                      </Badge>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        {filteredItems.length === 0 && (
          <div className="text-center py-8">
            <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-3" />
            <h3 className="font-medium text-green-700 mb-1">All Clear!</h3>
            <p className="text-sm text-muted-foreground">
              No {priorityFilter === 'all' ? '' : priorityFilter + ' priority '}action items found
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};