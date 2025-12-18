import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertCircle } from 'lucide-react';
import { PolicyTemplate } from '@/types/policy';

interface TemplateSelectorProps {
  templates: PolicyTemplate[];
  onSelectTemplate: (template: PolicyTemplate) => void;
}

export default function TemplateSelector({ templates, onSelectTemplate }: TemplateSelectorProps) {
  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-foreground mb-2">Choose a Policy Template</h2>
        <p className="text-muted-foreground">
          Select a template that matches your industry and compliance requirements.
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.isArray(templates) && templates.length > 0 ? (
          templates.map((template) => (
            <Card 
              key={template.id} 
              className="cursor-pointer transition-all duration-200 hover:shadow-lg hover:border-primary/50"
              onClick={() => onSelectTemplate(template)}
            >
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{template.name}</CardTitle>
                  <Badge variant="secondary">{template.template_type}</Badge>
                </div>
                <CardDescription>{template.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Industry: {template.industry}</span>
                  <Button variant="outline" size="sm">
                    Customize
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <div className="col-span-full text-center py-12">
            <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No policy templates available</p>
          </div>
        )}
      </div>
    </div>
  );
}