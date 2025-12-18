import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2, FileText, Shield, Database } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

interface TermsAcceptanceProps {
  onAccept: () => void;
}

const TermsAcceptance: React.FC<TermsAcceptanceProps> = ({ onAccept }) => {
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [acceptedPrivacy, setAcceptedPrivacy] = useState(false);
  const [acceptedDataProcessing, setAcceptedDataProcessing] = useState(false);
  const [marketingConsent, setMarketingConsent] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { updateProfile } = useAuth();

  const canProceed = acceptedTerms && acceptedPrivacy && acceptedDataProcessing;

  const handleAccept = async () => {
    if (!canProceed) return;
    
    setIsLoading(true);
    
    const currentTime = new Date().toISOString();
    const termsVersion = '1.0';

    try {
      await updateProfile({
        terms_accepted_at: currentTime,
        terms_version: termsVersion,
        privacy_accepted_at: currentTime,
        marketing_consent: marketingConsent
      });
      
      onAccept();
    } catch (error) {
      console.error('Error accepting terms:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 to-secondary/10 p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">Legal Agreements</CardTitle>
          <CardDescription>
            Please review and accept our legal agreements to continue using AI Comply
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Terms of Service */}
          <div className="flex items-start space-x-3 p-4 border rounded-lg hover:bg-muted/50 transition-colors">
            <Checkbox
              id="terms"
              checked={acceptedTerms}
              onCheckedChange={(checked) => setAcceptedTerms(checked as boolean)}
              className="mt-1"
            />
            <div className="flex-1">
              <div className="flex items-center space-x-2 mb-2">
                <FileText className="h-5 w-5 text-primary" />
                <label 
                  htmlFor="terms" 
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                >
                  Terms of Service <span className="text-destructive">*</span>
                </label>
              </div>
              <p className="text-sm text-muted-foreground">
                I agree to the{' '}
                <Link to="/terms" target="_blank" className="text-primary hover:underline">
                  Terms of Service
                </Link>
                {' '}governing the use of AI Comply platform.
              </p>
            </div>
          </div>

          {/* Privacy Policy */}
          <div className="flex items-start space-x-3 p-4 border rounded-lg hover:bg-muted/50 transition-colors">
            <Checkbox
              id="privacy"
              checked={acceptedPrivacy}
              onCheckedChange={(checked) => setAcceptedPrivacy(checked as boolean)}
              className="mt-1"
            />
            <div className="flex-1">
              <div className="flex items-center space-x-2 mb-2">
                <Shield className="h-5 w-5 text-primary" />
                <label 
                  htmlFor="privacy" 
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                >
                  Privacy Policy <span className="text-destructive">*</span>
                </label>
              </div>
              <p className="text-sm text-muted-foreground">
                I acknowledge that I have read and understood the{' '}
                <Link to="/privacy" target="_blank" className="text-primary hover:underline">
                  Privacy Policy
                </Link>
                {' '}describing how my data will be processed.
              </p>
            </div>
          </div>

          {/* Data Processing Agreement */}
          <div className="flex items-start space-x-3 p-4 border rounded-lg hover:bg-muted/50 transition-colors">
            <Checkbox
              id="data-processing"
              checked={acceptedDataProcessing}
              onCheckedChange={(checked) => setAcceptedDataProcessing(checked as boolean)}
              className="mt-1"
            />
            <div className="flex-1">
              <div className="flex items-center space-x-2 mb-2">
                <Database className="h-5 w-5 text-primary" />
                <label 
                  htmlFor="data-processing" 
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                >
                  Data Processing Agreement <span className="text-destructive">*</span>
                </label>
              </div>
              <p className="text-sm text-muted-foreground">
                I consent to the processing of my data as outlined in the{' '}
                <Link to="/data-processing" target="_blank" className="text-primary hover:underline">
                  Data Processing Agreement
                </Link>
                {' '}for AI governance services.
              </p>
            </div>
          </div>

          {/* Marketing Consent (Optional) */}
          <div className="flex items-start space-x-3 p-4 border rounded-lg hover:bg-muted/50 transition-colors">
            <Checkbox
              id="marketing"
              checked={marketingConsent}
              onCheckedChange={(checked) => setMarketingConsent(checked as boolean)}
              className="mt-1"
            />
            <div className="flex-1">
              <label 
                htmlFor="marketing" 
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer block mb-2"
              >
                Marketing Communications (Optional)
              </label>
              <p className="text-sm text-muted-foreground">
                I would like to receive updates about new features, compliance insights, and AI governance best practices.
              </p>
            </div>
          </div>

          <div className="pt-4 space-y-4">
            <p className="text-xs text-muted-foreground text-center">
              <span className="text-destructive">*</span> Required to use AI Comply
            </p>
            
            <Button
              onClick={handleAccept}
              disabled={!canProceed || isLoading}
              className="w-full"
              size="lg"
            >
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Accept and Continue
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default TermsAcceptance;