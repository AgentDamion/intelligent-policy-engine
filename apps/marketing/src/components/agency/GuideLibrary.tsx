import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { 
  Search, 
  Filter, 
  BookOpen, 
  Video, 
  FileText, 
  CheckSquare,
  Clock,
  Star,
  ExternalLink,
  Play,
  Download,
  Users
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { PreWorkGuide } from '@/hooks/useAIReadinessData';

interface GuideLibraryProps {
  guides: PreWorkGuide[];
  onGuideSelect: (guide: PreWorkGuide) => void;
  onUpdateProgress: (guideId: string, progress: number) => void;
  className?: string;
}

const categoryColors = {
  governance: 'hsl(var(--primary))',
  technical: 'hsl(42 86% 55%)',
  cultural: 'hsl(265 85% 60%)',
  operational: 'hsl(142 76% 36%)'
};

const difficultyIcons = {
  beginner: '●',
  intermediate: '●●',
  advanced: '●●●'
};

const resourceIcons = {
  document: <FileText className="h-4 w-4" />,
  video: <Video className="h-4 w-4" />,
  template: <Download className="h-4 w-4" />,
  checklist: <CheckSquare className="h-4 w-4" />
};

export function GuideLibrary({ 
  guides, 
  onGuideSelect, 
  onUpdateProgress, 
  className 
}: GuideLibraryProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('all');

  const filteredGuides = guides.filter(guide => {
    const matchesSearch = guide.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         guide.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || guide.category === selectedCategory;
    const matchesDifficulty = selectedDifficulty === 'all' || guide.difficulty === selectedDifficulty;
    
    return matchesSearch && matchesCategory && matchesDifficulty;
  });

  const categories = Array.from(new Set(guides.map(g => g.category)));

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header */}
      <div className="space-y-4">
        <div>
          <h2 className="text-2xl font-bold">Implementation Guides</h2>
          <p className="text-muted-foreground">
            Step-by-step guides to improve your AI readiness across all dimensions
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search guides..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <div className="flex gap-2">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3 py-2 border border-input rounded-md bg-background text-sm"
            >
              <option value="all">All Categories</option>
              {categories.map(cat => (
                <option key={cat} value={cat}>
                  {cat.charAt(0).toUpperCase() + cat.slice(1)}
                </option>
              ))}
            </select>

            <select
              value={selectedDifficulty}
              onChange={(e) => setSelectedDifficulty(e.target.value)}
              className="px-3 py-2 border border-input rounded-md bg-background text-sm"
            >
              <option value="all">All Levels</option>
              <option value="beginner">Beginner</option>
              <option value="intermediate">Intermediate</option>
              <option value="advanced">Advanced</option>
            </select>
          </div>
        </div>
      </div>

      {/* Guides Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredGuides.map((guide) => (
          <Card key={guide.id} className="h-full flex flex-col">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between gap-2">
                <div className="space-y-2">
                  <Badge 
                    variant="outline" 
                    style={{ 
                      borderColor: categoryColors[guide.category],
                      color: categoryColors[guide.category]
                    }}
                  >
                    {guide.category.charAt(0).toUpperCase() + guide.category.slice(1)}
                  </Badge>
                  <CardTitle className="text-lg leading-tight">{guide.title}</CardTitle>
                </div>
                {guide.isCompleted && (
                  <div className="flex-shrink-0">
                    <Badge variant="outline" className="text-success border-success">
                      ✓ Complete
                    </Badge>
                  </div>
                )}
              </div>
              
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  <span>{guide.duration}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Users className="h-4 w-4" />
                  <span>{difficultyIcons[guide.difficulty]} {guide.difficulty}</span>
                </div>
              </div>
            </CardHeader>

            <CardContent className="flex-1 flex flex-col gap-4">
              <p className="text-sm text-muted-foreground line-clamp-3">
                {guide.description}
              </p>

              {/* Progress */}
              {guide.progress > 0 && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Progress</span>
                    <span className="font-medium">{guide.progress}%</span>
                  </div>
                  <Progress value={guide.progress} className="h-2" />
                </div>
              )}

              {/* Steps Preview */}
              <div className="space-y-2">
                <h4 className="text-sm font-medium">Key Steps:</h4>
                <ul className="space-y-1">
                  {guide.steps.slice(0, 3).map((step, index) => (
                    <li key={index} className="text-sm text-muted-foreground flex items-start gap-2">
                      <span className="w-1 h-1 rounded-full bg-muted-foreground mt-2 flex-shrink-0" />
                      <span>{step}</span>
                    </li>
                  ))}
                  {guide.steps.length > 3 && (
                    <li className="text-sm text-muted-foreground">
                      +{guide.steps.length - 3} more steps
                    </li>
                  )}
                </ul>
              </div>

              {/* Resources */}
              <div className="space-y-2">
                <h4 className="text-sm font-medium">Resources:</h4>
                <div className="flex flex-wrap gap-2">
                  {guide.resources.slice(0, 3).map((resource, index) => (
                    <Badge key={index} variant="outline" className="gap-1 text-xs">
                      {resourceIcons[resource.type]}
                      {resource.type}
                    </Badge>
                  ))}
                  {guide.resources.length > 3 && (
                    <Badge variant="outline" className="text-xs">
                      +{guide.resources.length - 3} more
                    </Badge>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="mt-auto space-y-2">
                <Button 
                  onClick={() => onGuideSelect(guide)}
                  className="w-full gap-2"
                  variant={guide.isCompleted ? "outline" : "default"}
                >
                  {guide.isCompleted ? (
                    <>
                      <BookOpen className="h-4 w-4" />
                      Review Guide
                    </>
                  ) : guide.progress > 0 ? (
                    <>
                      <Play className="h-4 w-4" />
                      Continue
                    </>
                  ) : (
                    <>
                      <Play className="h-4 w-4" />
                      Start Guide
                    </>
                  )}
                </Button>

                {/* Quick Progress Update */}
                {!guide.isCompleted && guide.progress > 0 && (
                  <div className="flex gap-1">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onUpdateProgress(guide.id, Math.min(100, guide.progress + 25))}
                      className="flex-1 text-xs"
                    >
                      +25%
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onUpdateProgress(guide.id, 100)}
                      className="flex-1 text-xs"
                    >
                      Complete
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredGuides.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No guides found</h3>
            <p className="text-muted-foreground">
              Try adjusting your search terms or filters
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}