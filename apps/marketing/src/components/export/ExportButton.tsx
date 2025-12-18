import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Download, Calendar as CalendarIcon, FileText, Hash } from 'lucide-react';
import { format } from 'date-fns';
import { auditPacketService } from '@/lib/export/auditPacket';
import { useToast } from '@/hooks/use-toast';

interface ExportButtonProps {
  agencyId: string;
  clientId?: string;
}

export const ExportButton: React.FC<ExportButtonProps> = ({ agencyId, clientId }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [startDate, setStartDate] = useState<Date>();
  const [endDate, setEndDate] = useState<Date>();
  const [exportFormat, setExportFormat] = useState<'pdf' | 'excel' | 'json'>('pdf');
  const [includeDecisions, setIncludeDecisions] = useState(true);
  const [includeEvents, setIncludeEvents] = useState(true);
  const { toast } = useToast();

  const handleExport = async () => {
    if (!startDate || !endDate) {
      toast({
        title: "Error",
        description: "Please select both start and end dates",
        variant: "destructive"
      });
      return;
    }

    setIsExporting(true);
    try {
      const packet = await auditPacketService.generatePacket({
        startDate,
        endDate,
        agencyId,
        clientId,
        includeDecisions,
        includeEvents
      });

      toast({
        title: "Export Generated",
        description: (
          <div className="space-y-2">
            <p>Audit packet created successfully</p>
            <div className="flex items-center gap-2 text-xs">
              <Hash className="h-3 w-3" />
              <span className="font-mono">{packet.sha256Hash}</span>
            </div>
          </div>
        )
      });

      // Create download card (would integrate with downloads system)
      console.log('Download available:', packet.downloadUrl);
      
      setIsOpen(false);
    } catch (error) {
      toast({
        title: "Export Failed",
        description: "Failed to generate audit packet. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Download className="h-4 w-4" />
          Export Audit Packet
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Generate Audit Packet
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Date Range */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Start Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left font-normal">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {startDate ? format(startDate, "PPP") : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={startDate}
                    onSelect={setStartDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
            
            <div className="space-y-2">
              <Label>End Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left font-normal">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {endDate ? format(endDate, "PPP") : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={endDate}
                    onSelect={setEndDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {/* Format Selection */}
          <div className="space-y-2">
            <Label>Export Format</Label>
            <Select value={exportFormat} onValueChange={(value: 'pdf' | 'excel' | 'json') => setExportFormat(value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select format" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pdf">PDF Summary + CSV + JSON</SelectItem>
                <SelectItem value="excel">Excel Workbook</SelectItem>
                <SelectItem value="json">JSON Archive</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Include Options */}
          <div className="space-y-3">
            <Label>Include in Export</Label>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="decisions"
                  checked={includeDecisions}
                  onCheckedChange={(checked) => setIncludeDecisions(checked === true)}
                />
                <Label htmlFor="decisions" className="text-sm font-normal">
                  Decision History
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="events"
                  checked={includeEvents}
                  onCheckedChange={(checked) => setIncludeEvents(checked === true)}
                />
                <Label htmlFor="events" className="text-sm font-normal">
                  Audit Events
                </Label>
              </div>
            </div>
          </div>

          {/* Security Notice */}
          <div className="bg-muted/50 p-3 rounded-lg text-xs space-y-1">
            <p className="font-medium">Security & Compliance:</p>
            <ul className="list-disc list-inside space-y-1 text-muted-foreground">
              <li>All exports include SHA-256 hash verification</li>
              <li>PII is automatically redacted or anonymized</li>
              <li>Export access is logged for audit trail</li>
              <li>Files expire after 7 days for security</li>
            </ul>
          </div>

          {/* Export Button */}
          <Button 
            onClick={handleExport} 
            disabled={isExporting || !startDate || !endDate}
            className="w-full"
          >
            {isExporting ? (
              <>
                <div className="animate-spin mr-2 h-4 w-4 border-2 border-current border-t-transparent rounded-full" />
                Generating Export...
              </>
            ) : (
              <>
                <Download className="mr-2 h-4 w-4" />
                Generate Audit Packet
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};