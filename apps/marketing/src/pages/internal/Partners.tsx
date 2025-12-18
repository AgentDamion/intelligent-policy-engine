import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Building2, 
  TrendingUp, 
  Users, 
  Star,
  PlusCircle,
  FileText,
  CheckCircle,
  Clock,
  XCircle,
  AlertTriangle,
  DollarSign,
  Activity,
  Award,
  Mail,
  Phone,
  FileCheck,
  Calendar
} from 'lucide-react';
import { useAdminKPIs } from '@/hooks/useAdminKPIs';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';

// Mock data for partner management
const partnerRevenueData = [
  { month: 'Jan', acme: 25000, digital: 15000, global: 35000, innovation: 12000, medtech: 28000 },
  { month: 'Feb', acme: 26500, digital: 16200, global: 37800, innovation: 11800, medtech: 29400 },
  { month: 'Mar', acme: 28200, digital: 17100, global: 39200, innovation: 13200, medtech: 31100 },
  { month: 'Apr', acme: 29800, digital: 18500, global: 41500, innovation: 14100, medtech: 32800 },
  { month: 'May', acme: 31200, digital: 19800, global: 43200, innovation: 15500, medtech: 34200 },
  { month: 'Jun', acme: 32800, digital: 21200, global: 45100, innovation: 16800, medtech: 35900 }
];

const partnerHealthData = [
  { name: 'Revenue Growth', acme: 85, digital: 92, global: 78, innovation: 65, medtech: 88 },
  { name: 'Activity Level', acme: 90, digital: 88, global: 85, innovation: 70, medtech: 92 },
  { name: 'Satisfaction', acme: 88, digital: 95, global: 82, innovation: 75, medtech: 90 },
  { name: 'Compliance', acme: 95, digital: 90, global: 93, innovation: 80, medtech: 87 },
  { name: 'Performance', acme: 87, digital: 91, global: 84, innovation: 72, medtech: 89 }
];

const partnersData = [
  { 
    id: 1, 
    name: 'Acme Pharmaceuticals', 
    type: 'Enterprise', 
    revenue: '$32,800', 
    score: 87, 
    status: 'Active', 
    lastActivity: '2024-09-25',
    contact: 'sarah.johnson@acme.com',
    phone: '+1 (555) 123-4567'
  },
  { 
    id: 2, 
    name: 'Digital Health Agency', 
    type: 'Agency', 
    revenue: '$21,200', 
    score: 91, 
    status: 'Active', 
    lastActivity: '2024-09-26',
    contact: 'mike.chen@digitalhealth.com',
    phone: '+1 (555) 234-5678'
  },
  { 
    id: 3, 
    name: 'Global Medical Corp', 
    type: 'Enterprise', 
    revenue: '$45,100', 
    score: 84, 
    status: 'Active', 
    lastActivity: '2024-09-24',
    contact: 'emma.davis@globalmed.com',
    phone: '+1 (555) 345-6789'
  },
  { 
    id: 4, 
    name: 'Innovation Labs', 
    type: 'Startup', 
    revenue: '$16,800', 
    score: 72, 
    status: 'At Risk', 
    lastActivity: '2024-09-20',
    contact: 'robert.wilson@innovation.com',
    phone: '+1 (555) 456-7890'
  },
  { 
    id: 5, 
    name: 'MedTech Solutions', 
    type: 'Vendor', 
    revenue: '$35,900', 
    score: 89, 
    status: 'Active', 
    lastActivity: '2024-09-26',
    contact: 'lisa.thompson@medtech.com',
    phone: '+1 (555) 567-8901'
  }
];

const pendingApplications = [
  { 
    id: 1, 
    company: 'BioCompliance Inc', 
    type: 'Enterprise', 
    submitted: '2024-09-20', 
    reviewer: 'John Smith',
    priority: 'High',
    documents: ['Contract', 'Compliance Cert', 'References']
  },
  { 
    id: 2, 
    company: 'AI Health Systems', 
    type: 'Agency', 
    submitted: '2024-09-22', 
    reviewer: 'Sarah Johnson',
    priority: 'Medium',
    documents: ['Application', 'Portfolio', 'Insurance']
  },
  { 
    id: 3, 
    company: 'Regulatory Tech Co', 
    type: 'Vendor', 
    submitted: '2024-09-23', 
    reviewer: 'Mike Chen',
    priority: 'Low',
    documents: ['Product Demo', 'Pricing', 'Security Audit']
  }
];

const onboardingSteps = [
  { step: 'Application', status: 'completed' },
  { step: 'Review', status: 'completed' },
  { step: 'Approval', status: 'completed' },
  { step: 'Contract Signing', status: 'current' },
  { step: 'Training', status: 'pending' },
  { step: 'First Sale', status: 'pending' },
  { step: 'Active', status: 'pending' }
];

const Partners: React.FC = () => {
  const kpis = useAdminKPIs();
  const [selectedPartnerType, setSelectedPartnerType] = useState('all');
  const [selectedPartner, setSelectedPartner] = useState('all');

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Active':
        return <Badge variant="default" className="bg-success/10 text-success border-success/20"><CheckCircle className="w-3 h-3 mr-1" />Active</Badge>;
      case 'At Risk':
        return <Badge variant="destructive"><AlertTriangle className="w-3 h-3 mr-1" />At Risk</Badge>;
      case 'Pending':
        return <Badge variant="secondary"><Clock className="w-3 h-3 mr-1" />Pending</Badge>;
      case 'Inactive':
        return <Badge variant="outline"><XCircle className="w-3 h-3 mr-1" />Inactive</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 85) return 'text-success';
    if (score >= 70) return 'text-primary';
    return 'text-destructive';
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'High':
        return <Badge variant="destructive">High</Badge>;
      case 'Medium':
        return <Badge variant="secondary">Medium</Badge>;
      case 'Low':
        return <Badge variant="outline">Low</Badge>;
      default:
        return <Badge>{priority}</Badge>;
    }
  };

  const getStepStatus = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-success" />;
      case 'current':
        return <Activity className="w-5 h-5 text-primary" />;
      case 'pending':
        return <Clock className="w-5 h-5 text-muted-foreground" />;
      default:
        return <Clock className="w-5 h-5 text-muted-foreground" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Partner Management</h1>
          <p className="text-muted-foreground">Partner relationships, performance tracking, and onboarding management</p>
        </div>
        <div className="flex gap-2">
          <Select value={selectedPartnerType} onValueChange={setSelectedPartnerType}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Partner type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="enterprise">Enterprise</SelectItem>
              <SelectItem value="agency">Agency</SelectItem>
              <SelectItem value="vendor">Vendor</SelectItem>
              <SelectItem value="startup">Startup</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline">
            <FileText className="w-4 h-4 mr-2" />
            Commission Report
          </Button>
          <Button>
            <PlusCircle className="w-4 h-4 mr-2" />
            Add Partner
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Partners</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{kpis.activePartners}</div>
            <p className="text-xs text-success">+8 new this month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Partners</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{Math.round(kpis.activePartners * 0.89)}</div>
            <p className="text-xs text-success">89% active rate</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Revenue from Partners</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">$635K</div>
            <p className="text-xs text-success">+15.2% from last month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Performance Score</CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">84.6</div>
            <p className="text-xs text-success">+2.3 points this quarter</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Partner Revenue Trend */}
        <Card>
          <CardHeader>
            <CardTitle>Partner Revenue Trend</CardTitle>
            <CardDescription>Monthly revenue contribution by top partners</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={partnerRevenueData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis tickFormatter={(value) => `$${value / 1000}K`} />
                <Tooltip formatter={(value) => [`$${value.toLocaleString()}`, 'Revenue']} />
                <Line type="monotone" dataKey="acme" stroke="hsl(var(--primary))" strokeWidth={2} name="Acme Pharma" />
                <Line type="monotone" dataKey="global" stroke="hsl(var(--secondary))" strokeWidth={2} name="Global Medical" />
                <Line type="monotone" dataKey="medtech" stroke="hsl(var(--accent))" strokeWidth={2} name="MedTech Solutions" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Partner Health Score Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Partner Health Score Distribution</CardTitle>
            <CardDescription>Performance metrics across all active partners</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={[
                { range: '90-100', count: 23, color: 'hsl(var(--success))' },
                { range: '80-89', count: 45, color: 'hsl(var(--primary))' },
                { range: '70-79', count: 32, color: 'hsl(var(--secondary))' },
                { range: '60-69', count: 18, color: 'hsl(var(--muted))' },
                { range: '<60', count: 9, color: 'hsl(var(--destructive))' }
              ]}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="range" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="hsl(var(--primary))" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Partner Performance Leaderboard */}
      <Card>
        <CardHeader>
          <CardTitle>Partner Performance Leaderboard</CardTitle>
          <CardDescription>Top performing partners ranked by overall score and revenue contribution</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="border rounded-lg">
            <table className="w-full">
              <thead className="border-b">
                <tr className="text-left">
                  <th className="p-4 font-medium">Rank</th>
                  <th className="p-4 font-medium">Partner Name</th>
                  <th className="p-4 font-medium">Type</th>
                  <th className="p-4 font-medium">Revenue Contribution</th>
                  <th className="p-4 font-medium">Performance Score</th>
                  <th className="p-4 font-medium">Status</th>
                  <th className="p-4 font-medium">Last Activity</th>
                  <th className="p-4 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {partnersData.map((partner, index) => (
                  <tr key={partner.id} className="border-b">
                    <td className="p-4">
                      <div className="flex items-center">
                        {index < 3 ? <Award className="w-4 h-4 text-primary mr-2" /> : null}
                        #{index + 1}
                      </div>
                    </td>
                    <td className="p-4 font-medium">{partner.name}</td>
                    <td className="p-4">
                      <Badge variant="outline">{partner.type}</Badge>
                    </td>
                    <td className="p-4 font-semibold">{partner.revenue}</td>
                    <td className="p-4">
                      <span className={`font-semibold ${getScoreColor(partner.score)}`}>
                        {partner.score}
                      </span>
                    </td>
                    <td className="p-4">{getStatusBadge(partner.status)}</td>
                    <td className="p-4 text-sm text-muted-foreground">{partner.lastActivity}</td>
                    <td className="p-4">
                      <div className="flex gap-1">
                        <Button variant="ghost" size="sm">View</Button>
                        <Button variant="ghost" size="sm">
                          <Mail className="w-3 h-3" />
                        </Button>
                        <Button variant="ghost" size="sm">
                          <Phone className="w-3 h-3" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Partner Management Tabs */}
      <Card>
        <CardHeader>
          <CardTitle>Partner Onboarding & Applications</CardTitle>
          <CardDescription>Manage partner applications and onboarding processes</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="applications">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="applications">Pending Applications</TabsTrigger>
              <TabsTrigger value="onboarding">Onboarding Progress</TabsTrigger>
            </TabsList>

            <TabsContent value="applications" className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">Applications Under Review</h3>
                <Button variant="outline" size="sm">
                  <FileCheck className="w-4 h-4 mr-2" />
                  Bulk Review
                </Button>
              </div>
              <div className="border rounded-lg">
                <table className="w-full">
                  <thead className="border-b">
                    <tr className="text-left">
                      <th className="p-4 font-medium">Company</th>
                      <th className="p-4 font-medium">Type</th>
                      <th className="p-4 font-medium">Submitted</th>
                      <th className="p-4 font-medium">Reviewer</th>
                      <th className="p-4 font-medium">Priority</th>
                      <th className="p-4 font-medium">Documents</th>
                      <th className="p-4 font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pendingApplications.map((application) => (
                      <tr key={application.id} className="border-b">
                        <td className="p-4 font-medium">{application.company}</td>
                        <td className="p-4">
                          <Badge variant="outline">{application.type}</Badge>
                        </td>
                        <td className="p-4">{application.submitted}</td>
                        <td className="p-4">{application.reviewer}</td>
                        <td className="p-4">{getPriorityBadge(application.priority)}</td>
                        <td className="p-4">
                          <div className="flex gap-1">
                            {application.documents.map((doc, index) => (
                              <Badge key={index} variant="secondary" className="text-xs">
                                {doc}
                              </Badge>
                            ))}
                          </div>
                        </td>
                        <td className="p-4">
                          <div className="flex gap-2">
                            <Button variant="outline" size="sm" className="text-success border-success/20 hover:bg-success/10">
                              Approve
                            </Button>
                            <Button variant="outline" size="sm" className="text-destructive border-destructive/20 hover:bg-destructive/10">
                              Reject
                            </Button>
                            <Button variant="ghost" size="sm">
                              Review
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </TabsContent>

            <TabsContent value="onboarding" className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">Onboarding Progress - BioCompliance Inc</h3>
                <Button variant="outline" size="sm">
                  <Calendar className="w-4 h-4 mr-2" />
                  Schedule Training
                </Button>
              </div>
              <div className="grid grid-cols-7 gap-4">
                {onboardingSteps.map((step, index) => (
                  <div key={index} className="flex flex-col items-center space-y-2">
                    <div className={`flex items-center justify-center w-12 h-12 rounded-full border-2 ${
                      step.status === 'completed' ? 'border-success bg-success/10' :
                      step.status === 'current' ? 'border-primary bg-primary/10' :
                      'border-muted bg-muted/10'
                    }`}>
                      {getStepStatus(step.status)}
                    </div>
                    <span className="text-sm text-center font-medium">{step.step}</span>
                    {index < onboardingSteps.length - 1 && (
                      <div className={`h-1 w-full ${
                        step.status === 'completed' ? 'bg-success' : 'bg-muted'
                      }`} />
                    )}
                  </div>
                ))}
              </div>
              <div className="mt-6 p-4 bg-muted/20 rounded-lg">
                <h4 className="font-semibold mb-2">Current Step: Contract Signing</h4>
                <p className="text-sm text-muted-foreground mb-3">
                  Partner contract has been reviewed and approved. Waiting for final signatures from both parties.
                </p>
                <div className="flex gap-2">
                  <Button size="sm">Send Contract</Button>
                  <Button variant="outline" size="sm">View Documents</Button>
                  <Button variant="ghost" size="sm">Add Note</Button>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default Partners;