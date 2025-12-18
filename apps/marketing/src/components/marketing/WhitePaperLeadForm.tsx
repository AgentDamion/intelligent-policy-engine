import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import type { WhitePaper } from "@/data/whitePapers";

const leadFormSchema = z.object({
  firstName: z.string().min(1, "First name is required").max(100),
  lastName: z.string().min(1, "Last name is required").max(100),
  email: z.string().email("Invalid email address").max(255),
  companyName: z.string().min(1, "Company name is required").max(255),
  industry: z.string().min(1, "Please select an industry"),
  aiToolsCount: z.string().min(1, "Please select an option"),
  newsletterOptin: z.boolean().default(false),
});

type LeadFormData = z.infer<typeof leadFormSchema>;

interface WhitePaperLeadFormProps {
  isOpen: boolean;
  onClose: () => void;
  whitePaper: WhitePaper | null;
  onSuccess?: () => void;
}

export const WhitePaperLeadForm = ({
  isOpen,
  onClose,
  whitePaper,
  onSuccess,
}: WhitePaperLeadFormProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const form = useForm<LeadFormData>({
    resolver: zodResolver(leadFormSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      companyName: "",
      industry: "",
      aiToolsCount: "",
      newsletterOptin: false,
    },
  });

  const onSubmit = async (data: LeadFormData) => {
    if (!whitePaper) return;

    setIsSubmitting(true);

    try {
      // Get UTM parameters from URL if present
      const urlParams = new URLSearchParams(window.location.search);
      const utmSource = urlParams.get('utm_source');
      const utmMedium = urlParams.get('utm_medium');
      const utmCampaign = urlParams.get('utm_campaign');

      // Insert lead data into Supabase
      const { error } = await supabase.from("white_paper_downloads").insert({
        first_name: data.firstName,
        last_name: data.lastName,
        email: data.email,
        company_name: data.companyName,
        industry: data.industry,
        ai_tools_count: data.aiToolsCount,
        white_paper_id: whitePaper.id,
        white_paper_title: whitePaper.title,
        newsletter_optin: data.newsletterOptin,
        utm_source: utmSource,
        utm_medium: utmMedium,
        utm_campaign: utmCampaign,
      });

      if (error) throw error;

      toast({
        title: "Success!",
        description: "Your white paper is downloading. Check your email for the link.",
      });

      // Call onSuccess callback if provided
      if (onSuccess) {
        onSuccess();
      }

      form.reset();
      onClose();
    } catch (error) {
      console.error("Error submitting lead form:", error);
      toast({
        title: "Error",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Download White Paper</DialogTitle>
          <DialogDescription>
            {whitePaper?.title}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="firstName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>First Name *</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="lastName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Last Name *</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Work Email *</FormLabel>
                  <FormControl>
                    <Input type="email" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="companyName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Company Name *</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="industry"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Industry *</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select industry" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="pharmaceutical">Pharmaceutical</SelectItem>
                      <SelectItem value="marketing-services">Marketing & Agencies</SelectItem>
                      <SelectItem value="financial">Financial Services</SelectItem>
                      <SelectItem value="healthcare">Healthcare</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="aiToolsCount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Number of AI Tools Used *</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select range" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="1-5">1-5 tools</SelectItem>
                      <SelectItem value="6-15">6-15 tools</SelectItem>
                      <SelectItem value="16-30">16-30 tools</SelectItem>
                      <SelectItem value="30+">30+ tools</SelectItem>
                      <SelectItem value="not-sure">Not sure</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="newsletterOptin"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel className="text-sm font-normal">
                      Subscribe to AI Governance Insights newsletter
                    </FormLabel>
                  </div>
                </FormItem>
              )}
            />

            <p className="text-xs text-muted-foreground">
              By downloading, you agree to our privacy policy and may receive emails about AI governance insights.
            </p>

            <div className="flex gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                className="flex-1"
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" className="flex-1" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Downloading...
                  </>
                ) : (
                  "Download Now"
                )}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
