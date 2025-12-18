import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ToolSubmitPage } from './ToolSubmitPage';
import { ToastProvider } from '@/components/ui';

export default function ToolSubmitRoute() {
  const { id } = useParams<{ id?: string }>();
  const navigate = useNavigate();

  return (
    <ToastProvider>
      <ToolSubmitPage submissionId={id} />
    </ToastProvider>
  );
}

// Export for direct import
export { ToolSubmitPage } from './ToolSubmitPage';
export { useToolSubmission } from './useToolSubmission';
export * from './types';
