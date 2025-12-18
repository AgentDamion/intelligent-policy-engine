import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Send } from 'lucide-react';

interface PartnerCommunicationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  partnerName: string;
  partnerId: number;
}

export const PartnerCommunicationModal = ({ 
  open, 
  onOpenChange, 
  partnerName,
  partnerId 
}: PartnerCommunicationModalProps) => {
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const { toast } = useToast();

  const handleSend = async () => {
    if (!subject.trim() || !message.trim()) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please fill in both subject and message"
      });
      return;
    }

    setSending(true);
    try {
      // TODO: Integrate with notification system
      console.log('Sending message to partner:', { partnerId, subject, message });
      
      toast({
        title: "Message Sent",
        description: `Your message has been sent to ${partnerName}`
      });
      
      setSubject('');
      setMessage('');
      onOpenChange(false);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to send message"
      });
    } finally {
      setSending(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-[540px]">
        <SheetHeader>
          <SheetTitle>Contact {partnerName}</SheetTitle>
          <SheetDescription>
            Send a message to your agency partner
          </SheetDescription>
        </SheetHeader>
        <div className="space-y-4 py-4">
          <div>
            <Label htmlFor="subject">Subject</Label>
            <Input
              id="subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Compliance review required..."
              className="mt-1.5"
            />
          </div>
          <div>
            <Label htmlFor="message">Message</Label>
            <Textarea
              id="message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Write your message..."
              rows={8}
              className="mt-1.5"
            />
          </div>
          <Button onClick={handleSend} className="w-full" disabled={sending}>
            <Send className="h-4 w-4 mr-2" />
            {sending ? 'Sending...' : 'Send Message'}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
};
