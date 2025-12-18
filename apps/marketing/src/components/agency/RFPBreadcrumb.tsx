import React from 'react';
import { Link } from 'react-router-dom';
import { routes } from '@/lib/routes';
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';

interface RFPBreadcrumbProps {
  clientName: string;
  policyName: string;
  policyVersion: string;
  currentQuestion: number;
  totalQuestions: number;
}

export const RFPBreadcrumb: React.FC<RFPBreadcrumbProps> = ({
  clientName,
  policyName,
  policyVersion,
  currentQuestion,
  totalQuestions,
}) => {
  return (
    <Breadcrumb>
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink asChild>
            <Link to={routes.agency.dashboard}>Dashboard</Link>
          </BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator />
        <BreadcrumbItem>
          <BreadcrumbLink asChild>
            <Link to={routes.agency.policyRequests}>Policy Requests</Link>
          </BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator />
        <BreadcrumbItem>
          <BreadcrumbLink>{clientName}</BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator />
        <BreadcrumbItem>
          <BreadcrumbLink>
            {policyName}{' '}
            <span className="text-muted-foreground">v{policyVersion}</span>
          </BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator />
        <BreadcrumbItem>
          <BreadcrumbPage>
            Question {currentQuestion}/{totalQuestions}
          </BreadcrumbPage>
        </BreadcrumbItem>
      </BreadcrumbList>
    </Breadcrumb>
  );
};
