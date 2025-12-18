import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const policyMetadataSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters').max(200),
  description: z.string().max(1000).optional(),
  framework: z.string().min(1, 'Please select a compliance framework'),
  version: z.string().min(1, 'Version is required'),
  effectiveDate: z.string().optional(),
});

export type PolicyMetadata = z.infer<typeof policyMetadataSchema>;

interface PolicyMetadataFormProps {
  initialData?: Partial<PolicyMetadata>;
  fileName: string;
  onSubmit: (data: PolicyMetadata) => void;
  onBack: () => void;
  isSubmitting?: boolean;
}

export const PolicyMetadataForm = ({
  initialData,
  fileName,
  onSubmit,
  onBack,
  isSubmitting
}: PolicyMetadataFormProps) => {
  const form = useForm<PolicyMetadata>({
    resolver: zodResolver(policyMetadataSchema),
    defaultValues: {
      title: initialData?.title || fileName.replace(/\.[^/.]+$/, ''),
      description: initialData?.description || '',
      framework: initialData?.framework || '',
      version: initialData?.version || '1.0',
      effectiveDate: initialData?.effectiveDate || new Date().toISOString().split('T')[0],
    }
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Policy Title *</FormLabel>
              <FormControl>
                <Input placeholder="e.g., AI Governance Policy" {...field} />
              </FormControl>
              <FormDescription>
                A descriptive title for this policy document
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Brief description of this policy's purpose and scope..."
                  className="min-h-[100px]"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="framework"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Compliance Framework *</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select framework" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="21-cfr-part-11">21 CFR Part 11</SelectItem>
                  <SelectItem value="gdpr">GDPR</SelectItem>
                  <SelectItem value="hipaa">HIPAA</SelectItem>
                  <SelectItem value="iso-27001">ISO 27001</SelectItem>
                  <SelectItem value="soc2">SOC 2</SelectItem>
                  <SelectItem value="nist">NIST</SelectItem>
                  <SelectItem value="custom">Custom Framework</SelectItem>
                </SelectContent>
              </Select>
              <FormDescription>
                Primary compliance framework this policy addresses
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="version"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Version *</FormLabel>
                <FormControl>
                  <Input placeholder="1.0" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="effectiveDate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Effective Date</FormLabel>
                <FormControl>
                  <Input type="date" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="flex justify-between pt-4">
          <Button type="button" variant="outline" onClick={onBack} disabled={isSubmitting}>
            Back
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Processing...' : 'Continue to Review'}
          </Button>
        </div>
      </form>
    </Form>
  );
};
