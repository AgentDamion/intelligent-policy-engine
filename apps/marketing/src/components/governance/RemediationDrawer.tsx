import React, { useState } from 'react';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  User, 
  Calendar, 
  Flag, 
  FileText, 
  Plus, 
  Trash2, 
  Upload,
  Clock,
  CheckCircle,
  AlertTriangle,
  MessageSquare
} from 'lucide-react';
import { GovernanceEntity, GovernanceAlert } from '@/utils/governanceCalculations';
import { formatDistanceToNow } from 'date-fns';

interface RemediationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  entity?: GovernanceEntity;
  alert?: GovernanceAlert;
  onSubmit: (data: RemediationData) => void;
}

interface RemediationData {
  assignee: string;
  dueDate: string;
  priority: 'low' | 'medium' | 'high';
  notes: string;
  subtasks: { id: string; title: string; completed: boolean }[];
  attachments: File[];
}

interface AuditEntry {
  id: string;
  timestamp: string;
  user: string;
  action: string;
  details: string;
}

export const RemediationDrawer: React.FC<RemediationDrawerProps> = ({
  isOpen,
  onClose,
  entity,
  alert,
  onSubmit
}) => {
  const [formData, setFormData] = useState<RemediationData>({
    assignee: '',
    dueDate: '',
    priority: 'medium',
    notes: '',
    subtasks: [],
    attachments: []
  });

  const [newSubtask, setNewSubtask] = useState('');
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);

  const teamMembers = [
    'John Smith', 'Sarah Johnson', 'Mike Davis', 'Lisa Wilson',
    'Alex Chen', 'Maria Garcia', 'David Kim', 'Emma Brown'
  ];

  const slaPresets = [
    { label: '2 days (Critical)', value: '2d', days: 2 },
    { label: '7 days (Standard)', value: '7d', days: 7 },
    { label: '14 days (Planned)', value: '14d', days: 14 },
    { label: 'Custom', value: 'custom', days: null }
  ];

  const mockAuditTrail: AuditEntry[] = [
    {
      id: '1',
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      user: 'System',
      action: 'Alert Created',
      details: 'Governance health threshold breached'
    },
    {
      id: '2',
      timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
      user: 'Sarah Johnson',
      action: 'Investigation Started',
      details: 'Reviewed compliance metrics and identified root cause'
    },
    {
      id: '3',
      timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
      user: 'Mike Davis',
      action: 'Remediation Assigned',
      details: 'Assigned to compliance team for resolution'
    }
  ];

  const addSubtask = () => {
    if (!newSubtask.trim()) return;
    
    const subtask = {
      id: `task-${Date.now()}`,
      title: newSubtask,
      completed: false
    };
    
    setFormData(prev => ({
      ...prev,
      subtasks: [...prev.subtasks, subtask]
    }));
    setNewSubtask('');
  };

  const toggleSubtask = (taskId: string) => {
    setFormData(prev => ({
      ...prev,
      subtasks: prev.subtasks.map(task =>
        task.id === taskId ? { ...task, completed: !task.completed } : task
      )
    }));
  };

  const removeSubtask = (taskId: string) => {
    setFormData(prev => ({
      ...prev,
      subtasks: prev.subtasks.filter(task => task.id !== taskId)
    }));
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    setSelectedFiles(prev => [...prev, ...files]);
  };

  const handleSubmit = () => {
    onSubmit({
      ...formData,
      attachments: selectedFiles
    });
    onClose();
  };

  const getSLADate = (preset: string) => {
    const days = slaPresets.find(p => p.value === preset)?.days;
    if (!days) return '';
    
    const date = new Date();
    date.setDate(date.getDate() + days);
    return date.toISOString().split('T')[0];
  };

  const title = entity ? `Remediate: ${entity.name}` : alert ? `Resolve: ${alert.title}` : 'Remediation';

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="w-[600px] max-w-[90vw] overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-orange-500" />
            {title}
          </SheetTitle>
          <SheetDescription>
            Create and assign remediation tasks to resolve governance issues
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-6 mt-6">
          {/* Entity/Alert Summary */}
          {(entity || alert) && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Issue Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {entity && (
                  <>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Governance Health:</span>
                      <Badge variant={entity.ghi >= 85 ? 'default' : entity.ghi >= 70 ? 'secondary' : 'destructive'}>
                        {entity.ghi}%
                      </Badge>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Open Risks:</span>
                      <span>{entity.openRisks}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Owner:</span>
                      <span>{entity.owner}</span>
                    </div>
                  </>
                )}
                {alert && (
                  <>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Severity:</span>
                      <Badge variant={alert.severity === 'critical' ? 'destructive' : alert.severity === 'warning' ? 'secondary' : 'outline'}>
                        {alert.severity}
                      </Badge>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Days Open:</span>
                      <span>{alert.daysOpen}</span>
                    </div>
                    <p className="text-sm text-muted-foreground">{alert.description}</p>
                  </>
                )}
              </CardContent>
            </Card>
          )}

          {/* Assignment Form */}
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              {/* Assignee */}
              <div className="space-y-2">
                <Label htmlFor="assignee" className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Assignee
                </Label>
                <Select value={formData.assignee} onValueChange={(value) => setFormData(prev => ({ ...prev, assignee: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select team member" />
                  </SelectTrigger>
                  <SelectContent>
                    {teamMembers.map(member => (
                      <SelectItem key={member} value={member}>{member}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Priority */}
              <div className="space-y-2">
                <Label htmlFor="priority" className="flex items-center gap-2">
                  <Flag className="h-4 w-4" />
                  Priority
                </Label>
                <Select value={formData.priority} onValueChange={(value: any) => setFormData(prev => ({ ...prev, priority: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* SLA Presets and Due Date */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Due Date
              </Label>
              <div className="flex gap-2">
                {slaPresets.map(preset => (
                  <Button
                    key={preset.value}
                    variant="outline"
                    size="sm"
                    onClick={() => setFormData(prev => ({ ...prev, dueDate: getSLADate(preset.value) }))}
                  >
                    {preset.label}
                  </Button>
                ))}
              </div>
              <Input
                type="date"
                value={formData.dueDate}
                onChange={(e) => setFormData(prev => ({ ...prev, dueDate: e.target.value }))}
              />
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <Label htmlFor="notes" className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4" />
                Notes
              </Label>
              <Textarea
                id="notes"
                placeholder="Describe the remediation steps, context, or requirements..."
                value={formData.notes}
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                rows={3}
              />
            </div>
          </div>

          {/* Subtasks */}
          <div className="space-y-4">
            <Label className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4" />
              Task Checklist
            </Label>
            
            <div className="flex gap-2">
              <Input
                placeholder="Add a subtask..."
                value={newSubtask}
                onChange={(e) => setNewSubtask(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && addSubtask()}
              />
              <Button size="sm" onClick={addSubtask}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>

            <div className="space-y-2">
              {formData.subtasks.map(task => (
                <div key={task.id} className="flex items-center gap-2 p-2 border rounded">
                  <Checkbox
                    checked={task.completed}
                    onCheckedChange={() => toggleSubtask(task.id)}
                  />
                  <span className={`flex-1 text-sm ${task.completed ? 'line-through text-muted-foreground' : ''}`}>
                    {task.title}
                  </span>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => removeSubtask(task.id)}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
          </div>

          {/* File Attachments */}
          <div className="space-y-4">
            <Label className="flex items-center gap-2">
              <Upload className="h-4 w-4" />
              Attachments
            </Label>
            
            <div className="border-2 border-dashed border-muted rounded-lg p-4 text-center">
              <input
                type="file"
                multiple
                onChange={handleFileUpload}
                className="hidden"
                id="file-upload"
              />
              <Label htmlFor="file-upload" className="cursor-pointer">
                <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  Drop files here or click to upload
                </p>
              </Label>
            </div>

            {selectedFiles.length > 0 && (
              <div className="space-y-2">
                {selectedFiles.map((file, index) => (
                  <div key={index} className="flex items-center gap-2 p-2 bg-accent rounded">
                    <FileText className="h-4 w-4" />
                    <span className="text-sm flex-1">{file.name}</span>
                    <span className="text-xs text-muted-foreground">
                      {(file.size / 1024).toFixed(1)} KB
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Audit Trail */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {mockAuditTrail.map(entry => (
                  <div key={entry.id} className="flex items-start gap-3 text-sm">
                    <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0" />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium">{entry.action}</span>
                        <span className="text-muted-foreground">by {entry.user}</span>
                      </div>
                      <p className="text-muted-foreground">{entry.details}</p>
                      <span className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(entry.timestamp), { addSuffix: true })}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex gap-2 pt-4 border-t">
            <Button onClick={handleSubmit} className="flex-1">
              Assign Task
            </Button>
            <Button variant="outline" onClick={() => {}}>
              Mark Resolved
            </Button>
            <Button variant="outline" onClick={() => {}}>
              Escalate
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};