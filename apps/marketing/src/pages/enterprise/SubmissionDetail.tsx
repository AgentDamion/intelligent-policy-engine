import React from 'react';
import { useParams } from 'react-router-dom';
import { SubmissionDetail as SharedSubmissionDetail } from '@/components/shared/SubmissionDetail';

const SubmissionDetail = () => {
  const { id } = useParams<{ id: string }>();

  if (!id) {
    return <div className="p-6">Submission not found</div>;
  }

  return (
    <div className="p-6">
      <SharedSubmissionDetail submissionId={id} isEnterprise={true} />
    </div>
  );
};

export default SubmissionDetail;