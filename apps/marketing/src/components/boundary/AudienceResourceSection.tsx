import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Download } from "lucide-react";
import { trackEvent } from "@/utils/analytics";

interface Resource {
  id: string;
  title: string;
  description: string;
  pdfPath: string;
  badge: string | null;
}

interface AudienceResourceSectionProps {
  id: string;
  title: string;
  description: string;
  resources: Resource[];
  onDownloadClick: (resource: Resource) => void;
  bgColor?: string;
}

const badgeColors = {
  RECOMMENDED: 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/20',
  POPULAR: 'bg-primary/10 text-primary border-primary/20',
  NEW: 'bg-green-500/10 text-green-700 dark:text-green-300 border-green-500/20'
};

export const AudienceResourceSection = ({ 
  id,
  title, 
  description, 
  resources,
  onDownloadClick,
  bgColor = 'bg-white'
}: AudienceResourceSectionProps) => {
  const handleDownload = (resource: Resource) => {
    trackEvent('boundary_lab_resource_clicked', {
      resource_id: resource.id,
      resource_title: resource.title,
      audience_section: id,
      source_page: 'boundary_lab'
    });
    onDownloadClick(resource);
  };

  return (
    <section id={id} className={`py-20 ${bgColor}`}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-12">
          <h2 className="text-3xl lg:text-4xl font-bold text-foreground mb-4 font-solution">
            {title}
          </h2>
          <p className="text-lg text-muted-foreground max-w-3xl">
            {description}
          </p>
        </div>

        <div className={`grid grid-cols-1 ${
          resources.length === 2 ? 'md:grid-cols-2' : 'md:grid-cols-2 lg:grid-cols-3'
        } gap-6 lg:gap-8`}>
          {resources.map((resource) => (
            <Card 
              key={resource.id}
              className="h-full flex flex-col hover:shadow-xl transition-shadow"
            >
              <CardHeader className="space-y-3">
                {resource.badge && (
                  <div>
                    <Badge 
                      variant="outline" 
                      className={badgeColors[resource.badge as keyof typeof badgeColors] || ''}
                    >
                      {resource.badge}
                    </Badge>
                  </div>
                )}
                
                <h3 className="text-xl font-bold line-clamp-2 min-h-[3.5rem]">
                  {resource.title}
                </h3>
              </CardHeader>

              <CardContent className="flex-1">
                <p className="text-sm text-muted-foreground">
                  {resource.description}
                </p>
              </CardContent>

              <CardFooter className="pt-4 border-t">
                <Button 
                  className="w-full gap-2" 
                  onClick={() => handleDownload(resource)}
                >
                  <Download className="h-4 w-4" />
                  Download PDF
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};
