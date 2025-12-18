import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Mail, Save, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

interface SaveResumeModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (email: string) => void;
  answers: any[];
  currentStep: number;
}

export function SaveResumeModal({ 
  open, 
  onClose, 
  onSave, 
  answers, 
  currentStep 
}: SaveResumeModalProps) {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSave = async () => {
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast.error('Please enter a valid email address');
      return;
    }

    setIsLoading(true);
    
    try {
      // Mock API call to save progress
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // In production, this would:
      // 1. Generate a unique token
      // 2. Save assessment progress to database
      // 3. Send magic link email
      
      onSave(email);
      setSent(true);
      toast.success('Progress saved! Check your email for the resume link.');
    } catch (error) {
      toast.error('Failed to save progress. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setSent(false);
    setEmail('');
    onClose();
  };

  if (sent) {
    return (
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <div className="flex items-center space-x-2">
              <CheckCircle2 className="w-6 h-6 text-green-600" />
              <DialogTitle>Progress Saved!</DialogTitle>
            </div>
            <DialogDescription>
              We've sent a resume link to {email}. Click the link in your email to continue where you left off.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center space-x-2 text-green-800">
                <Mail className="w-4 h-4" />
                <span className="text-sm font-medium">Email sent successfully</span>
              </div>
              <p className="text-xs text-green-700 mt-1">
                The link will be valid for 7 days and will take you directly to step {currentStep + 1}.
              </p>
            </div>
            
            <Button onClick={handleClose} className="w-full">
              Continue Assessment
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Save className="w-5 h-5" />
            <span>Save Your Progress</span>
          </DialogTitle>
          <DialogDescription>
            Get a magic link to resume this assessment later. We'll save your {answers.length} answers and bring you back to step {currentStep + 1}.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <div>
            <Label htmlFor="email">Email Address</Label>
            <Input
              id="email"
              type="email"
              placeholder="your.email@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1"
            />
            <p className="text-xs text-muted-foreground mt-1">
              We'll send you a secure link to resume this assessment. No spam, promise.
            </p>
          </div>
          
          <div className="bg-muted/50 border rounded-lg p-3">
            <h4 className="text-sm font-medium mb-1">What's saved:</h4>
            <ul className="text-xs text-muted-foreground space-y-1">
              <li>• {answers.length} completed answers</li>
              <li>• Current position (Step {currentStep + 1}/5)</li>
              <li>• Organization type and size</li>
              <li>• Evidence attachments (if any)</li>
            </ul>
          </div>
          
          <div className="flex space-x-3">
            <Button variant="outline" onClick={handleClose} className="flex-1">
              Cancel
            </Button>
            <Button 
              onClick={handleSave} 
              disabled={isLoading}
              className="flex-1"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
                  Saving...
                </>
              ) : (
                <>
                  <Mail className="w-4 h-4 mr-2" />
                  Send Magic Link
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}