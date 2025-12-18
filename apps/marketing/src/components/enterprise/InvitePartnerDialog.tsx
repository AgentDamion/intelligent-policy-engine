import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import InvitePartnerForm from '@/components/InvitePartnerForm';

interface InvitePartnerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  enterpriseId?: string;
}

export function InvitePartnerDialog({ open, onOpenChange, enterpriseId }: InvitePartnerDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Invite Partner Agency</DialogTitle>
          <DialogDescription>
            Send an invitation to a partner agency to collaborate on AI governance policies
          </DialogDescription>
        </DialogHeader>
        <InvitePartnerForm enterpriseId={enterpriseId} />
      </DialogContent>
    </Dialog>
  );
}
