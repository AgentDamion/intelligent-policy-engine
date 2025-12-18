import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  TrendingUp, 
  Users, 
  Target,
  MousePointer,
  PlusCircle,
  Upload,
  FileBarChart,
  Zap,
  Star,
  Clock,
  CheckCircle,
  XCircle,
  DollarSign
} from 'lucide-react';
import { useAdminKPIs } from '@/hooks/useAdminKPIs';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar, FunnelChart, Funnel, LabelList } from 'recharts';

// Mock data for marketing analytics
const leadGenerationData = [
  { month: 'Jan', leads: 1240, mqls: 186, customers: 23 },
  { month: 'Feb', leads: 1380, mqls: 207, customers: 31 },
  { month: 'Mar', leads: 1520, mqls: 228, customers: 38 },
  { month: 'Apr', leads: 1680, mqls: 252, customers: 42 },
  { month: 'May', leads: 1850, mqls: 277, customers: 51 },
  { month: 'Jun', leads: 2020, mqls: 303, customers: 58 },
  { month: 'Jul', leads: 2180, mqls: 327, customers: 65 },
  { month: 'Aug', leads: 2350, mqls: 352, customers: 73 },
  { month: 'Sep', leads: 2520, mqls: 378, customers: 81 }
];

const funnelData = [
  { name: 'Visitors', value: 45000, fill: 'hsl(var(--primary))' },
  { name: 'Leads', value: 2520, fill: 'hsl(var(--primary))' },
  { name: 'MQLs', value: 378, fill: 'hsl(var(--primary))' },
  { name: 'Customers', value: 81, fill: 'hsl(var(--success))' }
];

const leadSourceData = [
  { name: 'Organic Search', value: 32, color: 'hsl(var(--primary))' },
  { name: 'Paid Search', value: 28, color: 'hsl(var(--secondary))' },
  { name: 'Social Media', value: 18, color: 'hsl(var(--accent))' },
  { name: 'Referral', value: 15, color: 'hsl(var(--muted))' },
  { name: 'Direct', value: 7, color: 'hsl(var(--border))' }
];

const campaignData = [
  { name: 'Enterprise AI Compliance', spend: '$12,500', leads: 340, conversionRate: '15.2%', roi: '420%' },
  { name: 'Healthcare AI Solutions', spend: '$8,900', leads: 275, conversionRate: '12.8%', roi: '380%' },
  { name: 'Partner Program Launch', spend: '$6,200', leads: 180, conversionRate: '18.5%', roi: '590%' },
  { name: 'Tool Marketplace Beta', spend: '$4,800', leads: 150, conversionRate: '10.4%', roi: '280%' },
  { name: 'Webinar Series Q3', spend: '$3,200', leads: 95, conversionRate: '22.1%', roi: '650%' }
];

const leadsData = [
  { id: 1, company: 'Global Pharma Corp', contact: 'Sarah Johnson', score: 92, source: 'Organic', stage: 'Demo Scheduled', daysInStage: 2 },
  { id: 2, company: 'MedTech Innovations', contact: 'Michael Chen', score: 87, source: 'Paid Search', stage: 'Qualified', daysInStage: 5 },
  { id: 3, company: 'Healthcare Analytics', contact: 'Emma Davis', score: 78, source: 'Social', stage: 'Contacted', daysInStage: 8 },
  { id: 4, company: 'BioCompliance Solutions', contact: 'Robert Wilson', score: 94, source: 'Referral', stage: 'Demo Scheduled', daysInStage: 1 },
  { id: 5, company: 'AI Health Systems', contact: 'Lisa Thompson', score: 71, source: 'Direct', stage: 'New', daysInStage: 12 },
  { id: 6, company: 'Regulatory Tech Co', contact: 'David Brown', score: 89, source: 'Organic', stage: 'Qualified', daysInStage: 3 }
];

const stageColumns = [
  { id: 'new', title: 'New', color: 'hsl(var(--muted))' },
  { id: 'contacted', title: 'Contacted', color: 'hsl(var(--primary))' },
  { id: 'qualified', title: 'Qualified', color: 'hsl(var(--secondary))' },
  { id: 'demo-scheduled', title: 'Demo Scheduled', color: 'hsl(var(--accent))' },
  { id: 'closed-won', title: 'Closed Won', color: 'hsl(var(--success))' },
  { id: 'closed-lost', title: 'Closed Lost', color: 'hsl(var(--destructive))' }
];

const Marketing: React.FC = () => {
  const kpis = useAdminKPIs();
  const [selectedCampaign, setSelectedCampaign] = useState('all');

  const getLeadScoreColor = (score: number) => {
    if (score >= 80) return 'text-success';
    if (score >= 60) return 'text-primary';
    return 'text-muted-foreground';
  };

  const getLeadScoreLabel = (score: number) => {
    if (score >= 80) return 'Hot';
    if (score >= 60) return 'Warm';
    return 'Cold';
  };

  const groupLeadsByStage = () => {
    const grouped = stageColumns.reduce((acc, column) => {
      acc[column.id] = [];
      return acc;
    }, {} as Record<string, typeof leadsData>);

    leadsData.forEach(lead => {
      const stageKey = lead.stage.toLowerCase().replace(' ', '-');
      if (grouped[stageKey]) {
        grouped[stageKey].push(lead);
      }
    });

    return grouped;
  };

  const leadsByStage = groupLeadsByStage();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Marketing Operations</h1>
          <p className="text-muted-foreground">Lead generation, campaign management, and conversion analytics</p>
        </div>
        <div className="flex gap-2">
          <Select value={selectedCampaign} onValueChange={setSelectedCampaign}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Select campaign" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Campaigns</SelectItem>
              <SelectItem value="enterprise">Enterprise AI Compliance</SelectItem>
              <SelectItem value="healthcare">Healthcare AI Solutions</SelectItem>
              <SelectItem value="partner">Partner Program Launch</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline">
            <Upload className="w-4 h-4 mr-2" />
            Import Leads
          </Button>
          <Button>
            <PlusCircle className="w-4 h-4 mr-2" />
            Create Campaign
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Leads</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">2,520</div>
            <p className="text-xs text-success">+7.2% from last month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">15.2%</div>
            <p className="text-xs text-success">+2.1% from last month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cost Per Lead</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">$142</div>
            <p className="text-xs text-destructive">+5.8% from last month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Marketing Qualified Leads</CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">378</div>
            <p className="text-xs text-success">+12.5% from last month</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Lead Generation Funnel */}
        <Card>
          <CardHeader>
            <CardTitle>Lead Generation Funnel</CardTitle>
            <CardDescription>Conversion flow from visitors to customers</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart layout="horizontal" data={funnelData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="name" type="category" />
                <Tooltip formatter={(value) => [value.toLocaleString(), 'Count']} />
                <Bar dataKey="value" fill="hsl(var(--primary))" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Lead Sources */}
        <Card>
          <CardHeader>
            <CardTitle>Lead Sources</CardTitle>
            <CardDescription>Distribution of lead acquisition channels</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={leadSourceData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: ${value}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {leadSourceData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => [`${value}%`, 'Share']} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Lead Generation Trend */}
      <Card>
        <CardHeader>
          <CardTitle>Lead Generation Trend</CardTitle>
          <CardDescription>Monthly leads, MQLs, and customer acquisition</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={leadGenerationData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="leads" stroke="hsl(var(--primary))" strokeWidth={2} name="Leads" />
              <Line type="monotone" dataKey="mqls" stroke="hsl(var(--secondary))" strokeWidth={2} name="MQLs" />
              <Line type="monotone" dataKey="customers" stroke="hsl(var(--success))" strokeWidth={2} name="Customers" />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Campaign Performance */}
      <Card>
        <CardHeader>
          <CardTitle>Campaign Performance</CardTitle>
          <CardDescription>Active campaigns and their key metrics</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="border rounded-lg">
            <table className="w-full">
              <thead className="border-b">
                <tr className="text-left">
                  <th className="p-4 font-medium">Campaign Name</th>
                  <th className="p-4 font-medium">Spend</th>
                  <th className="p-4 font-medium">Leads</th>
                  <th className="p-4 font-medium">Conversion Rate</th>
                  <th className="p-4 font-medium">ROI</th>
                  <th className="p-4 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {campaignData.map((campaign, index) => (
                  <tr key={index} className="border-b">
                    <td className="p-4 font-medium">{campaign.name}</td>
                    <td className="p-4">{campaign.spend}</td>
                    <td className="p-4">{campaign.leads}</td>
                    <td className="p-4">
                      <Badge variant="secondary">{campaign.conversionRate}</Badge>
                    </td>
                    <td className="p-4">
                      <Badge variant="default" className="bg-success/10 text-success border-success/20">
                        {campaign.roi}
                      </Badge>
                    </td>
                    <td className="p-4">
                      <div className="flex gap-2">
                        <Button variant="ghost" size="sm">View</Button>
                        <Button variant="ghost" size="sm">Edit</Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Lead Pipeline Kanban */}
      <Card>
        <CardHeader>
          <CardTitle>Lead Pipeline</CardTitle>
          <CardDescription>Manage leads through the sales funnel</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-6 gap-4">
            {stageColumns.map((column) => (
              <div key={column.id} className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-sm">{column.title}</h3>
                  <Badge variant="outline">{leadsByStage[column.id]?.length || 0}</Badge>
                </div>
                <div className="space-y-2 min-h-[400px]">
                  {leadsByStage[column.id]?.map((lead) => (
                    <div key={lead.id} className="p-3 border rounded-lg bg-card hover:shadow-sm transition-shadow cursor-pointer">
                      <div className="space-y-2">
                        <div className="font-medium text-sm">{lead.company}</div>
                        <div className="text-xs text-muted-foreground">{lead.contact}</div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1">
                            <Zap className={`w-3 h-3 ${getLeadScoreColor(lead.score)}`} />
                            <span className={`text-xs font-medium ${getLeadScoreColor(lead.score)}`}>
                              {lead.score} ({getLeadScoreLabel(lead.score)})
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-muted-foreground">{lead.source}</span>
                          <span className="text-muted-foreground">{lead.daysInStage}d</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Common marketing operations and reporting</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Button variant="outline" className="h-20 flex flex-col gap-2">
              <FileBarChart className="w-6 h-6" />
              <span className="text-sm">Generate Report</span>
            </Button>
            <Button variant="outline" className="h-20 flex flex-col gap-2">
              <MousePointer className="w-6 h-6" />
              <span className="text-sm">Launch Campaign</span>
            </Button>
            <Button variant="outline" className="h-20 flex flex-col gap-2">
              <Users className="w-6 h-6" />
              <span className="text-sm">Segment Leads</span>
            </Button>
            <Button variant="outline" className="h-20 flex flex-col gap-2">
              <TrendingUp className="w-6 h-6" />
              <span className="text-sm">A/B Test</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Marketing;