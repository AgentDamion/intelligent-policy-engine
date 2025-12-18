import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { AlertTriangle, CheckCircle, Eye, MessageSquare } from 'lucide-react';
import { PartnerCommunicationModal } from '@/components/enterprise/PartnerCommunicationModal';
import { routes } from '@/lib/routes';

interface Agency {
  id: number;
  name: string;
  compliance: number;
  violations: number;
  lastAudit: string;
  status: 'active' | 'warning' | 'inactive';
}

interface AgencyComplianceListProps {
  agencies: Agency[];
  detailed?: boolean;
}

const AgencyComplianceList: React.FC<AgencyComplianceListProps> = ({ 
  agencies, 
  detailed = false 
}) => {
  const navigate = useNavigate();
  const [contactModalOpen, setContactModalOpen] = useState(false);
  const [selectedAgency, setSelectedAgency] = useState<Agency | null>(null);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'warning':
        return 'bg-yellow-100 text-yellow-800';
      case 'inactive':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <CheckCircle className="h-4 w-4" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4" />;
      case 'inactive':
        return <AlertTriangle className="h-4 w-4" />;
      default:
        return null;
    }
  };

  const getComplianceColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 80) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Agency Partner Compliance</CardTitle>
        <CardDescription>
          Monitor compliance scores and violations across your agency network
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {agencies.map((agency) => (
            <div key={agency.id} className="p-4 border rounded-lg hover:bg-gray-50">
              <div className="flex items-center justify-between">
                <div className="flex-1 space-y-2">
                  {/* Agency Header */}
                  <div className="flex items-center gap-3">
                    <h4 className="font-semibold text-lg">{agency.name}</h4>
                    <Badge 
                      className={`flex items-center gap-1 ${getStatusColor(agency.status)}`}
                    >
                      {getStatusIcon(agency.status)}
                      {agency.status}
                    </Badge>
                  </div>

                  {/* Compliance Score */}
                  <div className="space-y-1">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Compliance Score</span>
                      <span className={`font-semibold ${getComplianceColor(agency.compliance)}`}>
                        {agency.compliance}%
                      </span>
                    </div>
                    <Progress value={agency.compliance} className="h-2" />
                  </div>

                  {/* Details */}
                  <div className="flex items-center gap-6 text-sm text-gray-600">
                    <div className="flex items-center gap-1">
                      <AlertTriangle className="h-3 w-3" />
                      <span>{agency.violations} violations</span>
                    </div>
                    <div>
                      Last audit: {agency.lastAudit}
                    </div>
                  </div>

                  {detailed && (
                    <div className="pt-2 space-y-2">
                      {/* Recent Activity */}
                      <div className="text-sm">
                        <h5 className="font-medium text-gray-700">Recent Activity</h5>
                        <ul className="mt-1 space-y-1 text-gray-600">
                          <li>• Submitted marketing campaign for review (2 hours ago)</li>
                          <li>• AI compliance check passed (1 day ago)</li>
                          <li>• Policy acknowledgment received (3 days ago)</li>
                        </ul>
                      </div>

                      {/* AI Tools Usage */}
                      <div className="text-sm">
                        <h5 className="font-medium text-gray-700">AI Tools in Use</h5>
                        <div className="flex flex-wrap gap-1 mt-1">
                          <Badge variant="outline" className="text-xs">ChatGPT</Badge>
                          <Badge variant="outline" className="text-xs">Claude</Badge>
                          <Badge variant="outline" className="text-xs">Midjourney</Badge>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex flex-col gap-2 ml-4">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => navigate(routes.enterprise.partnerProfile(agency.id.toString()))}
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    View Details
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => {
                      setSelectedAgency(agency);
                      setContactModalOpen(true);
                    }}
                  >
                    <MessageSquare className="h-4 w-4 mr-2" />
                    Contact
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Summary */}
        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-green-600">
                {agencies.filter(a => a.status === 'active').length}
              </div>
              <div className="text-sm text-gray-600">Active Agencies</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-yellow-600">
                {agencies.filter(a => a.status === 'warning').length}
              </div>
              <div className="text-sm text-gray-600">Need Attention</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-700">
                {Math.round(agencies.reduce((acc, a) => acc + a.compliance, 0) / agencies.length)}%
              </div>
              <div className="text-sm text-gray-600">Average Compliance</div>
            </div>
          </div>
        </div>

        {/* Contact Modal */}
        {selectedAgency && (
          <PartnerCommunicationModal
            open={contactModalOpen}
            onOpenChange={setContactModalOpen}
            partnerName={selectedAgency.name}
            partnerId={selectedAgency.id}
          />
        )}
      </CardContent>
    </Card>
  );
};

export default AgencyComplianceList;