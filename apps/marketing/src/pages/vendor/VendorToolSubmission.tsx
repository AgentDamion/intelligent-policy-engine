import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft, ArrowRight, CheckCircle, Upload, Globe, Shield, DollarSign } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { routes } from '@/lib/routes';

const toolSubmissionSchema = z.object({
  // Basic Information
  toolName: z.string().min(2, 'Tool name must be at least 2 characters'),
  description: z.string().min(50, 'Description must be at least 50 characters'),
  category: z.string().min(1, 'Please select a category'),
  website: z.string().url('Please enter a valid URL').optional().or(z.literal('')),
  version: z.string().min(1, 'Version is required'),
  primaryUseCase: z.string().min(1, 'Please select a primary use case'),
  
  // Technical Details
  apiDocumentation: z.string().url('Please enter a valid URL').optional().or(z.literal('')),
  integrationRequirements: z.array(z.string()).min(1, 'Select at least one integration requirement'),
  dataProcessing: z.string().min(20, 'Please describe data processing capabilities'),
  
  // Compliance Information
  securityCertifications: z.array(z.string()),
  complianceStandards: z.array(z.string()),
  dataHandling: z.string().min(20, 'Please describe data handling policies'),
  
  // Business Information
  pricingModel: z.string().min(1, 'Please select a pricing model'),
  supportContact: z.string().email('Please enter a valid email'),
  termsOfService: z.string().url('Please enter a valid URL').optional().or(z.literal('')),
  privacyPolicy: z.string().url('Please enter a valid URL').optional().or(z.literal('')),
});

type ToolSubmissionData = z.infer<typeof toolSubmissionSchema>;

const STEPS = [
  { id: 1, title: 'Basic Information', icon: Globe },
  { id: 2, title: 'Technical Details', icon: Upload },
  { id: 3, title: 'Compliance', icon: Shield },
  { id: 4, title: 'Business Info', icon: DollarSign },
];

const CATEGORIES = [
  'Machine Learning',
  'Natural Language Processing',
  'Computer Vision',
  'Data Analytics',
  'Automation',
  'Predictive Modeling',
  'Document Processing',
  'Healthcare AI',
  'Financial AI',
  'Other'
];

const USE_CASES = [
  'Predictive Analytics',
  'Process Automation',
  'Document Analysis',
  'Customer Service',
  'Risk Assessment',
  'Quality Control',
  'Data Mining',
  'Image Recognition',
  'Speech Recognition',
  'Recommendation Engine'
];

const INTEGRATION_REQUIREMENTS = [
  'REST API',
  'GraphQL',
  'Webhook Integration',
  'SDK Available',
  'Cloud Deployment',
  'On-Premise Installation',
  'Docker Support',
  'Kubernetes Ready'
];

const SECURITY_CERTIFICATIONS = [
  'SOC 2 Type II',
  'ISO 27001',
  'HIPAA',
  'GDPR Compliant',
  'FedRAMP',
  'PCI DSS',
  'NIST Framework'
];

const COMPLIANCE_STANDARDS = [
  'FDA 21 CFR Part 11',
  'HIPAA',
  'GDPR',
  'SOX',
  'CCPA',
  'ISO 13485',
  'IEC 62304'
];

const PRICING_MODELS = [
  'Subscription (Monthly)',
  'Subscription (Annual)',
  'Pay-per-use',
  'One-time License',
  'Freemium',
  'Custom Enterprise'
];

const VendorToolSubmission: React.FC = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const navigate = useNavigate();

  const form = useForm<ToolSubmissionData>({
    resolver: zodResolver(toolSubmissionSchema),
    defaultValues: {
      toolName: '',
      description: '',
      category: '',
      website: '',
      version: '',
      primaryUseCase: '',
      apiDocumentation: '',
      integrationRequirements: [],
      dataProcessing: '',
      securityCertifications: [],
      complianceStandards: [],
      dataHandling: '',
      pricingModel: '',
      supportContact: '',
      termsOfService: '',
      privacyPolicy: '',
    },
  });

  const onSubmit = async (data: ToolSubmissionData) => {
    try {
      // TODO: Replace with actual API call
      console.log('Submitting tool:', data);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast({
        title: "Tool Submitted Successfully",
        description: "Your AI tool has been submitted for review. You'll receive an email update within 2-3 business days.",
      });
      
      navigate(routes.vendor.submissions);
    } catch (error) {
      toast({
        title: "Submission Failed",
        description: "There was an error submitting your tool. Please try again.",
        variant: "destructive",
      });
    }
  };

  const nextStep = async () => {
    const fieldsToValidate = getFieldsForStep(currentStep);
    const isValid = await form.trigger(fieldsToValidate);
    
    if (isValid && currentStep < STEPS.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const getFieldsForStep = (step: number): (keyof ToolSubmissionData)[] => {
    switch (step) {
      case 1:
        return ['toolName', 'description', 'category', 'version', 'primaryUseCase'];
      case 2:
        return ['integrationRequirements', 'dataProcessing'];
      case 3:
        return ['dataHandling'];
      case 4:
        return ['pricingModel', 'supportContact'];
      default:
        return [];
    }
  };

  const progress = (currentStep / STEPS.length) * 100;

  return (
    <div className="container mx-auto py-8 max-w-4xl">
      {/* Header */}
      <div className="mb-8">
        <Button 
          variant="ghost" 
          onClick={() => navigate(routes.vendor.tools)}
          className="mb-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Tools
        </Button>
        
        <h1 className="text-3xl font-bold text-foreground">Submit New AI Tool</h1>
        <p className="text-muted-foreground mt-2">
          Share your AI tool with the marketplace. All submissions are reviewed before publication.
        </p>
      </div>

      {/* Progress Indicator */}
      <Card className="mb-8">
        <CardContent className="pt-6">
          <div className="flex justify-between items-center mb-4">
            {STEPS.map((step, index) => {
              const Icon = step.icon;
              const isActive = currentStep === step.id;
              const isCompleted = currentStep > step.id;
              
              return (
                <div key={step.id} className="flex flex-col items-center">
                  <div className={`rounded-full p-3 mb-2 ${
                    isCompleted ? 'bg-primary text-primary-foreground' :
                    isActive ? 'bg-primary/20 text-primary border-2 border-primary' :
                    'bg-muted text-muted-foreground'
                  }`}>
                    {isCompleted ? (
                      <CheckCircle className="h-5 w-5" />
                    ) : (
                      <Icon className="h-5 w-5" />
                    )}
                  </div>
                  <span className={`text-sm font-medium ${isActive ? 'text-primary' : 'text-muted-foreground'}`}>
                    {step.title}
                  </span>
                </div>
              );
            })}
          </div>
          <Progress value={progress} className="h-2" />
        </CardContent>
      </Card>

      {/* Form */}
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {React.createElement(STEPS[currentStep - 1].icon, { className: "h-5 w-5" })}
                {STEPS[currentStep - 1].title}
              </CardTitle>
              <CardDescription>
                {currentStep === 1 && "Tell us about your AI tool and what it does."}
                {currentStep === 2 && "Provide technical specifications and integration details."}
                {currentStep === 3 && "Share compliance and security information."}
                {currentStep === 4 && "Complete business and support information."}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Step 1: Basic Information */}
              {currentStep === 1 && (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="toolName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Tool Name *</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter your tool name" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="version"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Version *</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g. 1.0.0" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description *</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Describe what your tool does, its key features, and benefits..."
                            className="min-h-24"
                            {...field} 
                          />
                        </FormControl>
                        <FormDescription>
                          Minimum 50 characters. Be specific about capabilities and use cases.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="category"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Category *</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select category" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {CATEGORIES.map((category) => (
                                <SelectItem key={category} value={category}>
                                  {category}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="primaryUseCase"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Primary Use Case *</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select use case" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {USE_CASES.map((useCase) => (
                                <SelectItem key={useCase} value={useCase}>
                                  {useCase}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="website"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Website URL</FormLabel>
                        <FormControl>
                          <Input placeholder="https://your-tool-website.com" {...field} />
                        </FormControl>
                        <FormDescription>
                          Link to your tool's homepage or documentation
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </>
              )}

              {/* Step 2: Technical Details */}
              {currentStep === 2 && (
                <>
                  <FormField
                    control={form.control}
                    name="apiDocumentation"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>API Documentation URL</FormLabel>
                        <FormControl>
                          <Input placeholder="https://docs.your-tool.com/api" {...field} />
                        </FormControl>
                        <FormDescription>
                          Link to your API documentation for integration
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="integrationRequirements"
                    render={() => (
                      <FormItem>
                        <FormLabel>Integration Requirements *</FormLabel>
                        <FormDescription>
                          Select all integration methods your tool supports
                        </FormDescription>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-2">
                          {INTEGRATION_REQUIREMENTS.map((requirement) => (
                            <FormField
                              key={requirement}
                              control={form.control}
                              name="integrationRequirements"
                              render={({ field }) => {
                                return (
                                  <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                                    <FormControl>
                                      <Checkbox
                                        checked={field.value?.includes(requirement)}
                                        onCheckedChange={(checked) => {
                                          return checked
                                            ? field.onChange([...field.value, requirement])
                                            : field.onChange(field.value?.filter((value) => value !== requirement))
                                        }}
                                      />
                                    </FormControl>
                                    <FormLabel className="text-sm font-normal">
                                      {requirement}
                                    </FormLabel>
                                  </FormItem>
                                )
                              }}
                            />
                          ))}
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="dataProcessing"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Data Processing Capabilities *</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Describe what types of data your tool can process, processing methods, and output formats..."
                            className="min-h-24"
                            {...field} 
                          />
                        </FormControl>
                        <FormDescription>
                          Include data types, formats, processing speed, and limitations
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </>
              )}

              {/* Step 3: Compliance Information */}
              {currentStep === 3 && (
                <>
                  <FormField
                    control={form.control}
                    name="securityCertifications"
                    render={() => (
                      <FormItem>
                        <FormLabel>Security Certifications</FormLabel>
                        <FormDescription>
                          Select all security certifications your tool has achieved
                        </FormDescription>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-2">
                          {SECURITY_CERTIFICATIONS.map((certification) => (
                            <FormField
                              key={certification}
                              control={form.control}
                              name="securityCertifications"
                              render={({ field }) => {
                                return (
                                  <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                                    <FormControl>
                                      <Checkbox
                                        checked={field.value?.includes(certification)}
                                        onCheckedChange={(checked) => {
                                          return checked
                                            ? field.onChange([...field.value, certification])
                                            : field.onChange(field.value?.filter((value) => value !== certification))
                                        }}
                                      />
                                    </FormControl>
                                    <FormLabel className="text-sm font-normal">
                                      {certification}
                                    </FormLabel>
                                  </FormItem>
                                )
                              }}
                            />
                          ))}
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="complianceStandards"
                    render={() => (
                      <FormItem>
                        <FormLabel>Compliance Standards</FormLabel>
                        <FormDescription>
                          Select all compliance standards your tool meets
                        </FormDescription>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-2">
                          {COMPLIANCE_STANDARDS.map((standard) => (
                            <FormField
                              key={standard}
                              control={form.control}
                              name="complianceStandards"
                              render={({ field }) => {
                                return (
                                  <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                                    <FormControl>
                                      <Checkbox
                                        checked={field.value?.includes(standard)}
                                        onCheckedChange={(checked) => {
                                          return checked
                                            ? field.onChange([...field.value, standard])
                                            : field.onChange(field.value?.filter((value) => value !== standard))
                                        }}
                                      />
                                    </FormControl>
                                    <FormLabel className="text-sm font-normal">
                                      {standard}
                                    </FormLabel>
                                  </FormItem>
                                )
                              }}
                            />
                          ))}
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="dataHandling"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Data Handling Policies *</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Describe how your tool handles data: storage, encryption, retention, deletion policies..."
                            className="min-h-24"
                            {...field} 
                          />
                        </FormControl>
                        <FormDescription>
                          Include information about data residency, encryption, and privacy measures
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </>
              )}

              {/* Step 4: Business Information */}
              {currentStep === 4 && (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="pricingModel"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Pricing Model *</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select pricing model" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {PRICING_MODELS.map((model) => (
                                <SelectItem key={model} value={model}>
                                  {model}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="supportContact"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Support Contact Email *</FormLabel>
                          <FormControl>
                            <Input 
                              type="email" 
                              placeholder="support@your-company.com" 
                              {...field} 
                            />
                          </FormControl>
                          <FormDescription>
                            Primary contact for customer support
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="termsOfService"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Terms of Service URL</FormLabel>
                          <FormControl>
                            <Input placeholder="https://your-company.com/terms" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="privacyPolicy"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Privacy Policy URL</FormLabel>
                          <FormControl>
                            <Input placeholder="https://your-company.com/privacy" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Navigation Buttons */}
          <div className="flex justify-between">
            <Button
              type="button"
              variant="outline"
              onClick={prevStep}
              disabled={currentStep === 1}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Previous
            </Button>

            <div className="flex gap-2">
              {currentStep < STEPS.length ? (
                <Button type="button" onClick={nextStep}>
                  Next
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              ) : (
                <Button type="submit">
                  Submit for Review
                </Button>
              )}
            </div>
          </div>
        </form>
      </Form>
    </div>
  );
};

export default VendorToolSubmission;