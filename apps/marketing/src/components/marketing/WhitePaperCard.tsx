import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Download, Calendar, User } from "lucide-react";
import type { WhitePaper } from "@/data/whitePapers";

interface WhitePaperCardProps {
  whitePaper: WhitePaper;
  onDownloadClick: (whitePaper: WhitePaper) => void;
}

const categoryColors = {
  compliance: 'bg-blue-500/10 text-blue-700 dark:text-blue-300',
  roi: 'bg-green-500/10 text-green-700 dark:text-green-300',
  'risk-management': 'bg-orange-500/10 text-orange-700 dark:text-orange-300',
  'best-practices': 'bg-purple-500/10 text-purple-700 dark:text-purple-300',
  frameworks: 'bg-teal-500/10 text-teal-700 dark:text-teal-300'
};

const industryLabels = {
  pharmaceutical: 'Pharmaceutical',
  'marketing-services': 'Marketing & Agencies',
  financial: 'Financial Services',
  healthcare: 'Healthcare',
  all: 'All Industries'
};

export const WhitePaperCard = ({ whitePaper, onDownloadClick }: WhitePaperCardProps) => {
  return (
    <Card className="h-full flex flex-col hover:shadow-lg transition-shadow">
      <CardHeader className="space-y-3">
        {/* Cover Image */}
        <div className="aspect-video bg-gradient-to-br from-primary/20 to-primary/5 rounded-lg overflow-hidden">
          <img 
            src={whitePaper.coverImage} 
            alt={whitePaper.title}
            className="w-full h-full object-cover"
          />
        </div>
        
        {/* Badges */}
        <div className="flex flex-wrap gap-2">
          <Badge variant="secondary" className={categoryColors[whitePaper.category]}>
            {whitePaper.category.replace('-', ' ')}
          </Badge>
          <Badge variant="outline">
            {industryLabels[whitePaper.industry]}
          </Badge>
        </div>
        
        {/* Title */}
        <h3 className="text-xl font-bold line-clamp-2 min-h-[3.5rem]">
          {whitePaper.title}
        </h3>
      </CardHeader>

      <CardContent className="flex-1 space-y-4">
        {/* Description */}
        <p className="text-sm text-muted-foreground line-clamp-3">
          {whitePaper.description}
        </p>

        {/* Key Takeaways */}
        {whitePaper.keyTakeaways && whitePaper.keyTakeaways.length > 0 && (
          <div>
            <p className="text-sm font-semibold mb-2">Key Takeaways:</p>
            <ul className="text-sm text-muted-foreground space-y-1">
              {whitePaper.keyTakeaways.slice(0, 3).map((takeaway, index) => (
                <li key={index} className="flex items-start gap-2">
                  <span className="text-primary mt-1">•</span>
                  <span className="line-clamp-1">{takeaway}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>

      <CardFooter className="flex flex-col gap-3 pt-4 border-t">
        {/* Meta Info */}
        <div className="flex items-center justify-between w-full text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <User className="h-3 w-3" />
            <span className="line-clamp-1">{whitePaper.author}</span>
          </div>
          <div className="flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            <span>{whitePaper.publishDate}</span>
          </div>
        </div>

        {/* Download Button */}
        <Button 
          className="w-full gap-2" 
          onClick={() => onDownloadClick(whitePaper)}
        >
          <Download className="h-4 w-4" />
          Download Free
        </Button>
      </CardFooter>
    </Card>
  );
};
