import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { FileHashInput } from '@/components/declarations/FileHashInput';
import { ProjectSelector } from '@/components/declarations/ProjectSelector';
import { ToolMultiSelect } from '@/components/declarations/ToolMultiSelect';
import { ValidationPreview } from '@/components/declarations/ValidationPreview';
import { DeclarationReceipt } from '@/components/declarations/DeclarationReceipt';
import { useDeclareAsset } from '@/hooks/useDeclareAsset';

export default function DeclareAsset() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [fileHash, setFileHash] = useState('');
  const [fileName, setFileName] = useState('');
  const [fileSize, setFileSize] = useState<number>();
  const [fileType, setFileType] = useState('');
  const [projectId, setProjectId] = useState('');
  const [workspaceId, setWorkspaceId] = useState('');
  const [selectedTools, setSelectedTools] = useState<string[]>([]);
  const [usageDescription, setUsageDescription] = useState('');
  const [validationResult, setValidationResult] = useState<any>(null);
  const [receiptData, setReceiptData] = useState<any>(null);

  const { mutate: declareAsset, isPending } = useDeclareAsset({
    onSuccess: (data) => {
      setReceiptData(data);
      setStep(5);
    },
  });

  const handleSubmit = () => {
    declareAsset({
      fileHash,
      fileName,
      fileSize,
      fileType,
      projectId,
      workspaceId,
      toolsUsed: selectedTools,
      usageDescription,
    });
  };

  const canProceedToTools = fileHash && projectId && workspaceId;
  const canSubmit = canProceedToTools && selectedTools.length > 0 && 
    validationResult?.all_tools_approved && usageDescription.trim().length > 0;

  return (
    <div className="min-h-screen bg-muted/30">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => navigate(-1)}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <h1 className="text-3xl font-bold mb-2">Declare AI Asset</h1>
          <p className="text-muted-foreground">
            Register your deliverable and declare which AI tools were used to create it
          </p>
        </div>

        {/* Progress Steps */}
        <div className="mb-8 flex items-center justify-between">
          {[
            { num: 1, label: 'File Hash' },
            { num: 2, label: 'Project' },
            { num: 3, label: 'Tools' },
            { num: 4, label: 'Submit' },
          ].map((s, idx) => (
            <div key={s.num} className="flex items-center flex-1">
              <div className={`flex items-center justify-center w-8 h-8 rounded-full border-2 ${
                step >= s.num ? 'border-primary bg-primary text-primary-foreground' : 'border-muted-foreground text-muted-foreground'
              }`}>
                {s.num}
              </div>
              <div className="ml-2 text-sm font-medium">{s.label}</div>
              {idx < 3 && (
                <div className={`flex-1 h-0.5 mx-4 ${
                  step > s.num ? 'bg-primary' : 'bg-muted-foreground/30'
                }`} />
              )}
            </div>
          ))}
        </div>

        {/* Main Form Card */}
        {receiptData ? (
          <DeclarationReceipt data={receiptData} onClose={() => {
            setReceiptData(null);
            setStep(1);
            setFileHash('');
            setFileName('');
            setFileSize(undefined);
            setFileType('');
            setProjectId('');
            setWorkspaceId('');
            setSelectedTools([]);
            setUsageDescription('');
            setValidationResult(null);
          }} />
        ) : (
          <Card className="p-6">
            <div className="space-y-6">
              {/* Step 1: File Hash */}
              <FileHashInput
                value={fileHash}
                fileName={fileName}
                fileSize={fileSize}
                fileType={fileType}
                onChange={(hash, name, size, type) => {
                  setFileHash(hash);
                  setFileName(name);
                  setFileSize(size);
                  setFileType(type);
                  if (hash && step === 1) setStep(2);
                }}
              />

              {/* Step 2: Project Selection */}
              {step >= 2 && (
                <ProjectSelector
                  value={{ projectId, workspaceId }}
                  onChange={(project, workspace) => {
                    setProjectId(project);
                    setWorkspaceId(workspace);
                    if (project && workspace && step === 2) setStep(3);
                  }}
                />
              )}

              {/* Step 3: Tool Selection */}
              {step >= 3 && canProceedToTools && (
                <>
                  <ToolMultiSelect
                    selectedTools={selectedTools}
                    projectId={projectId}
                    workspaceId={workspaceId}
                    onChange={setSelectedTools}
                    onValidationResult={setValidationResult}
                  />

                  {selectedTools.length > 0 && (
                    <div>
                      <label className="text-sm font-medium mb-2 block">
                        Usage Description
                      </label>
                      <textarea
                        value={usageDescription}
                        onChange={(e) => setUsageDescription(e.target.value)}
                        placeholder="Describe how these AI tools were used to create this asset..."
                        className="w-full min-h-[100px] px-3 py-2 rounded-md border border-input bg-background"
                        required
                      />
                    </div>
                  )}

                  {validationResult && (
                    <ValidationPreview result={validationResult} />
                  )}
                </>
              )}

              {/* Step 4: Submit */}
              {step >= 3 && (
                <div className="flex justify-end gap-3 pt-4 border-t">
                  <Button
                    variant="outline"
                    onClick={() => navigate(-1)}
                    disabled={isPending}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleSubmit}
                    disabled={!canSubmit || isPending}
                  >
                    {isPending ? 'Submitting...' : 'Submit Declaration'}
                  </Button>
                </div>
              )}
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
