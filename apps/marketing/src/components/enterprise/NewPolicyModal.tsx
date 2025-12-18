import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

interface NewPolicyModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  onCreatePolicy: (policyData: {
    title: string;
    description: string;
    requirements: string[];
    aiTools: string[];
    status: 'active' | 'draft';
  }) => Promise<any>;
}

const NewPolicyModal: React.FC<NewPolicyModalProps> = ({
  open,
  onClose,
  onSuccess,
  onCreatePolicy
}) => {
  const [formData, setFormData] = useState({
    title: '',
    description: ''
  });
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title.trim() || !formData.description.trim()) {
      toast({
        variant: "destructive",
        title: "Validation Error",
        description: "Please fill in all fields"
      });
      return;
    }

    setLoading(true);
    
    try {
      await onCreatePolicy({
        title: formData.title,
        description: formData.description,
        requirements: ['Policy compliance required'],
        aiTools: ['All AI tools'],
        status: 'active'
      });

      toast({
        title: "Success",
        description: "Policy created successfully"
      });

      setFormData({ title: '', description: '' });
      onSuccess();
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to create policy. Please try again."
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Create New Policy</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Policy Title</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => handleInputChange('title', e.target.value)}
              placeholder="Enter policy title"
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Policy Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="Enter policy description"
              rows={4}
              disabled={loading}
            />
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create Policy
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default NewPolicyModal;