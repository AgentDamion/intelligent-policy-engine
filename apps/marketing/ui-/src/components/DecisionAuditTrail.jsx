import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { format, parseISO, isWithinInterval, startOfDay, endOfDay, subDays } from 'date-fns';
import { 
  Search, 
  Filter, 
  Download, 
  ChevronDown, 
  ChevronUp, 
  Calendar,
  User,
  FileText,
  Shield,
  AlertTriangle,
  CheckCircle,
  Clock,
  Eye,
  EyeOff,
  RefreshCw,
  BarChart3,
  TrendingUp,
  TrendingDown,
  Activity,
  Zap,
  Database,
  Globe,
  Lock,
  Unlock,
  AlertCircle,
  Info,
  ExternalLink,
  Copy,
  Share2,
  Settings,
  MoreHorizontal
} from 'lucide-react';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

const DecisionAuditTrail = ({ organizationId, className = '' }) => {
  // State management
  const [auditEntries, setAuditEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedEntries, setExpandedEntries] = useState(new Set());
  const [filters, setFilters] = useState({
    dateRange: { start: subDays(new Date(), 30), end: new Date() },
    user: '',
    decisionType: '',
    status: '',
    searchQuery: '',
    riskLevel: ''
  });
  const [showFilters, setShowFilters] = useState(false);
  const [stats, setStats] = useState({
    totalEntries: 0,
    approvedCount: 0,
    rejectedCount: 0,
    pendingCount: 0,
    reviewCount: 0,
    averageConfidence: 0,
    averageCompliance: 0
  });
  const [exportLoading, setExportLoading] = useState(false);

  // Fetch audit data with organization scoping
  const fetchAuditData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch from the existing API endpoint with organization scoping
      const response = await fetch(`/api/dashboard/audit-trail/${organizationId}`, {
        headers: {
          'Content-Type': 'application/json',
          // Include organization context for proper scoping
          'X-Organization-ID': organizationId
        }
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch audit data: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.success) {
        setAuditEntries(data.auditTrail || []);
        
        // Calculate stats
        const entries = data.auditTrail || [];
        const stats = {
          totalEntries: entries.length,
          approvedCount: entries.filter(e => e.status === 'approved').length,
          rejectedCount: entries.filter(e => e.status === 'rejected').length,
          pendingCount: entries.filter(e => e.status === 'pending').length,
          reviewCount: entries.filter(e => e.status === 'review').length,
          averageConfidence: entries.length > 0 
            ? entries.reduce((sum, e) => sum + (e.details?.confidence_score || 0), 0) / entries.length 
            : 0,
          averageCompliance: entries.length > 0 
            ? entries.reduce((sum, e) => sum + (e.details?.compliance_score || 0), 0) / entries.length 
            : 0
        };
        setStats(stats);
      } else {
        throw new Error(data.error || 'Failed to fetch audit data');
      }
    } catch (err) {
      console.error('Error fetching audit data:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [organizationId]);

  // Initial data fetch
  useEffect(() => {
    fetchAuditData();
  }, [fetchAuditData]);

  // Filter and search logic with enhanced filtering
  const filteredEntries = useMemo(() => {
    return auditEntries.filter(entry => {
      // Date range filter
      if (filters.dateRange.start && filters.dateRange.end) {
        const entryDate = parseISO(entry.timestamp);
        const startDate = startOfDay(filters.dateRange.start);
        const endDate = endOfDay(filters.dateRange.end);
        
        if (!isWithinInterval(entryDate, { start: startDate, end: endDate })) {
          return false;
        }
      }

      // User filter
      if (filters.user && !entry.user?.toLowerCase().includes(filters.user.toLowerCase())) {
        return false;
      }

      // Decision type filter
      if (filters.decisionType && entry.decisionType !== filters.decisionType) {
        return false;
      }

      // Status filter
      if (filters.status && entry.status !== filters.status) {
        return false;
      }

      // Risk level filter
      if (filters.riskLevel && entry.details?.risk_level !== filters.riskLevel) {
        return false;
      }

      // Search query across all fields
      if (filters.searchQuery) {
        const searchLower = filters.searchQuery.toLowerCase();
        const searchableText = [
          entry.action,
          entry.user,
          entry.decisionType,
          entry.rationale,
          entry.policyReferences?.join(' '),
          entry.status,
          entry.details?.risk_level,
          entry.details?.confidence_score?.toString(),
          entry.details?.compliance_score?.toString()
        ].join(' ').toLowerCase();
        
        if (!searchableText.includes(searchLower)) {
          return false;
        }
      }

      return true;
    });
  }, [auditEntries, filters]);

  // Toggle entry expansion
  const toggleEntry = (entryId) => {
    const newExpanded = new Set(expandedEntries);
    if (newExpanded.has(entryId)) {
      newExpanded.delete(entryId);
    } else {
      newExpanded.add(entryId);
    }
    setExpandedEntries(newExpanded);
  };

  // Enhanced PDF export with timeline visualization
  const exportToPDF = async () => {
    setExportLoading(true);
    try {
      const doc = new jsPDF();
      
      // Header
      doc.setFontSize(20);
      doc.text('Trust & Transparency Audit Trail Report', 20, 20);
      
      doc.setFontSize(12);
      doc.text(`Organization: ${organizationId}`, 20, 30);
      doc.text(`Generated: ${format(new Date(), 'PPpp')}`, 20, 40);
      doc.text(`Total Entries: ${filteredEntries.length}`, 20, 50);
      
      let yPos = 70;
      
      // Statistics table
      const statsData = [
        ['Metric', 'Value'],
        ['Total Entries', stats.totalEntries],
        ['Approved', stats.approvedCount],
        ['Rejected', stats.rejectedCount],
        ['Pending', stats.pendingCount],
        ['Under Review', stats.reviewCount],
        ['Avg Confidence', `${(stats.averageConfidence * 100).toFixed(1)}%`],
        ['Avg Compliance', `${(stats.averageCompliance * 100).toFixed(1)}%`]
      ];
      
      doc.autoTable({
        startY: yPos,
        head: [statsData[0]],
        body: statsData.slice(1),
        theme: 'grid',
        headStyles: { fillColor: [59, 130, 246] }
      });
      
      yPos = doc.lastAutoTable.finalY + 20;
      
      // Timeline entries
      doc.setFontSize(16);
      doc.text('Timeline Entries', 20, yPos);
      yPos += 15;
      
      filteredEntries.forEach((entry, index) => {
        if (yPos > 250) {
          doc.addPage();
          yPos = 20;
        }
        
        doc.setFontSize(14);
        doc.setTextColor(59, 130, 246);
        doc.text(`${index + 1}. ${entry.action}`, 20, yPos);
        yPos += 8;
        
        doc.setFontSize(10);
        doc.setTextColor(0, 0, 0);
        doc.text(`Timestamp: ${format(parseISO(entry.timestamp), 'PPpp')}`, 20, yPos);
        yPos += 6;
        doc.text(`User: ${entry.user || 'System'}`, 20, yPos);
        yPos += 6;
        doc.text(`Decision Type: ${entry.decisionType || 'N/A'}`, 20, yPos);
        yPos += 6;
        doc.text(`Status: ${entry.status || 'Unknown'}`, 20, yPos);
        yPos += 6;
        
        if (entry.rationale) {
          const rationaleLines = doc.splitTextToSize(`Rationale: ${entry.rationale}`, 170);
          doc.text(rationaleLines, 20, yPos);
          yPos += rationaleLines.length * 6;
        }
        
        if (entry.policyReferences?.length) {
          doc.text(`Policy References: ${entry.policyReferences.join(', ')}`, 20, yPos);
          yPos += 6;
        }
        
        if (entry.details) {
          doc.text(`Confidence: ${(entry.details.confidence_score * 100).toFixed(1)}%`, 20, yPos);
          yPos += 6;
          doc.text(`Compliance: ${(entry.details.compliance_score * 100).toFixed(1)}%`, 20, yPos);
          yPos += 6;
          doc.text(`Risk Level: ${entry.details.risk_level || 'Unknown'}`, 20, yPos);
          yPos += 6;
        }
        
        yPos += 10;
      });
      
      doc.save(`audit-trail-${organizationId}-${format(new Date(), 'yyyy-MM-dd')}.pdf`);
    } catch (error) {
      console.error('PDF export error:', error);
      alert('Failed to export PDF. Please try again.');
    } finally {
      setExportLoading(false);
    }
  };

  // Enhanced CSV export
  const exportToCSV = () => {
    const headers = [
      'Timestamp', 'User', 'Action', 'Decision Type', 'Status', 
      'Rationale', 'Policy References', 'Confidence Score', 
      'Compliance Score', 'Risk Level', 'Processing Time (ms)'
    ];
    
    const csvData = [
      headers.join(','),
      ...filteredEntries.map(entry => [
        format(parseISO(entry.timestamp), 'yyyy-MM-dd HH:mm:ss'),
        entry.user || 'System',
        `"${entry.action.replace(/"/g, '""')}"`,
        entry.decisionType || '',
        entry.status || '',
        `"${(entry.rationale || '').replace(/"/g, '""')}"`,
        `"${(entry.policyReferences?.join('; ') || '').replace(/"/g, '""')}"`,
        entry.details?.confidence_score || '',
        entry.details?.compliance_score || '',
        entry.details?.risk_level || '',
        entry.details?.processing_time_ms || ''
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `audit-trail-${organizationId}-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  // Get status badge with enhanced styling
  const getStatusBadge = (status) => {
    const statusConfig = {
      approved: { color: 'bg-green-100 text-green-800 border-green-200', icon: CheckCircle },
      rejected: { color: 'bg-red-100 text-red-800 border-red-200', icon: AlertTriangle },
      pending: { color: 'bg-yellow-100 text-yellow-800 border-yellow-200', icon: Clock },
      review: { color: 'bg-blue-100 text-blue-800 border-blue-200', icon: Eye }
    };

    const config = statusConfig[status?.toLowerCase()] || statusConfig.pending;
    const IconComponent = config.icon;

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${config.color}`}>
        <IconComponent className="w-3 h-3 mr-1" />
        {status || 'pending'}
      </span>
    );
  };

  // Get decision type icon with enhanced styling
  const getDecisionTypeIcon = (type) => {
    const iconMap = {
      policy: Shield,
      audit: FileText,
      compliance: CheckCircle,
      risk: AlertTriangle,
      system: Zap,
      user: User,
      automated: Activity
    };
    const IconComponent = iconMap[type?.toLowerCase()] || FileText;
    return <IconComponent className="w-4 h-4" />;
  };

  // Get risk level indicator
  const getRiskLevelIndicator = (riskLevel) => {
    const riskConfig = {
      low: { color: 'bg-green-100 text-green-800', icon: CheckCircle },
      medium: { color: 'bg-yellow-100 text-yellow-800', icon: AlertCircle },
      high: { color: 'bg-red-100 text-red-800', icon: AlertTriangle }
    };
    
    const config = riskConfig[riskLevel?.toLowerCase()] || riskConfig.low;
    const IconComponent = config.icon;
    
    return (
      <span className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium ${config.color}`}>
        <IconComponent className="w-3 h-3 mr-1" />
        {riskLevel || 'low'}
      </span>
    );
  };

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        <span className="ml-3 text-gray-600">Loading audit trail...</span>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-md p-4">
        <div className="flex">
          <AlertTriangle className="h-5 w-5 text-red-400" />
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">Error loading audit trail</h3>
            <p className="text-sm text-red-700 mt-1">{error}</p>
            <button 
              onClick={fetchAuditData}
              className="mt-2 inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-red-700 bg-red-100 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg shadow-sm border border-gray-200 ${className}`}>
      {/* Header with enhanced stats */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Trust & Transparency Audit Trail</h2>
            <p className="text-sm text-gray-600 mt-1">
              Complete timeline of all policy decisions and actions for organization: {organizationId}
            </p>
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={fetchAuditData}
              className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </button>
            
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <Filter className="w-4 h-4 mr-2" />
              Filters
              {showFilters ? <ChevronUp className="w-4 h-4 ml-2" /> : <ChevronDown className="w-4 h-4 ml-2" />}
            </button>
            
            <button
              onClick={exportToPDF}
              disabled={exportLoading}
              className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              <Download className="w-4 h-4 mr-2" />
              {exportLoading ? 'Exporting...' : 'Export PDF'}
            </button>
            
            <button
              onClick={exportToCSV}
              className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <Download className="w-4 h-4 mr-2" />
              Export CSV
            </button>
          </div>
        </div>
      </div>

      {/* Statistics Dashboard */}
      <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
          <div className="bg-white p-3 rounded-lg border border-gray-200">
            <div className="flex items-center">
              <Database className="w-5 h-5 text-blue-500" />
              <span className="ml-2 text-sm font-medium text-gray-600">Total</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">{stats.totalEntries}</p>
          </div>
          
          <div className="bg-white p-3 rounded-lg border border-gray-200">
            <div className="flex items-center">
              <CheckCircle className="w-5 h-5 text-green-500" />
              <span className="ml-2 text-sm font-medium text-gray-600">Approved</span>
            </div>
            <p className="text-2xl font-bold text-green-600">{stats.approvedCount}</p>
          </div>
          
          <div className="bg-white p-3 rounded-lg border border-gray-200">
            <div className="flex items-center">
              <AlertTriangle className="w-5 h-5 text-red-500" />
              <span className="ml-2 text-sm font-medium text-gray-600">Rejected</span>
            </div>
            <p className="text-2xl font-bold text-red-600">{stats.rejectedCount}</p>
          </div>
          
          <div className="bg-white p-3 rounded-lg border border-gray-200">
            <div className="flex items-center">
              <Clock className="w-5 h-5 text-yellow-500" />
              <span className="ml-2 text-sm font-medium text-gray-600">Pending</span>
            </div>
            <p className="text-2xl font-bold text-yellow-600">{stats.pendingCount}</p>
          </div>
          
          <div className="bg-white p-3 rounded-lg border border-gray-200">
            <div className="flex items-center">
              <Eye className="w-5 h-5 text-blue-500" />
              <span className="ml-2 text-sm font-medium text-gray-600">Review</span>
            </div>
            <p className="text-2xl font-bold text-blue-600">{stats.reviewCount}</p>
          </div>
          
          <div className="bg-white p-3 rounded-lg border border-gray-200">
            <div className="flex items-center">
              <TrendingUp className="w-5 h-5 text-green-500" />
              <span className="ml-2 text-sm font-medium text-gray-600">Confidence</span>
            </div>
            <p className="text-2xl font-bold text-green-600">{(stats.averageConfidence * 100).toFixed(1)}%</p>
          </div>
          
          <div className="bg-white p-3 rounded-lg border border-gray-200">
            <div className="flex items-center">
              <Shield className="w-5 h-5 text-blue-500" />
              <span className="ml-2 text-sm font-medium text-gray-600">Compliance</span>
            </div>
            <p className="text-2xl font-bold text-blue-600">{(stats.averageCompliance * 100).toFixed(1)}%</p>
          </div>
        </div>
      </div>

      {/* Enhanced Filters */}
      {showFilters && (
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
            {/* Search */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  value={filters.searchQuery}
                  onChange={(e) => setFilters(prev => ({ ...prev, searchQuery: e.target.value }))}
                  placeholder="Search entries..."
                  className="pl-10 pr-3 py-2 border border-gray-300 rounded-md w-full focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            {/* Start Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="date"
                  value={filters.dateRange.start ? format(filters.dateRange.start, 'yyyy-MM-dd') : ''}
                  onChange={(e) => setFilters(prev => ({ 
                    ...prev, 
                    dateRange: { ...prev.dateRange, start: e.target.value ? new Date(e.target.value) : null }
                  }))}
                  className="pl-10 pr-3 py-2 border border-gray-300 rounded-md w-full focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            {/* End Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="date"
                  value={filters.dateRange.end ? format(filters.dateRange.end, 'yyyy-MM-dd') : ''}
                  onChange={(e) => setFilters(prev => ({ 
                    ...prev, 
                    dateRange: { ...prev.dateRange, end: e.target.value ? new Date(e.target.value) : null }
                  }))}
                  className="pl-10 pr-3 py-2 border border-gray-300 rounded-md w-full focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            {/* Decision Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Decision Type</label>
              <select
                value={filters.decisionType}
                onChange={(e) => setFilters(prev => ({ ...prev, decisionType: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">All Types</option>
                <option value="policy">Policy</option>
                <option value="audit">Audit</option>
                <option value="compliance">Compliance</option>
                <option value="risk">Risk Assessment</option>
                <option value="system">System</option>
                <option value="automated">Automated</option>
              </select>
            </div>

            {/* Status */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                value={filters.status}
                onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">All Status</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
                <option value="pending">Pending</option>
                <option value="review">Under Review</option>
              </select>
            </div>

            {/* Risk Level */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Risk Level</label>
              <select
                value={filters.riskLevel}
                onChange={(e) => setFilters(prev => ({ ...prev, riskLevel: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">All Levels</option>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Results Summary */}
      <div className="px-6 py-3 bg-gray-50 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">
            Showing {filteredEntries.length} of {auditEntries.length} entries
          </span>
          <span className="text-sm text-gray-600">
            Last updated: {format(new Date(), 'PPpp')}
          </span>
        </div>
      </div>

      {/* Enhanced Timeline */}
      <div className="p-6">
        {filteredEntries.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No audit entries found</h3>
            <p className="mt-1 text-sm text-gray-500">
              Try adjusting your filters or search criteria.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredEntries.map((entry, index) => (
              <div
                key={entry.id || index}
                className="bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow"
              >
                {/* Entry Header */}
                <div
                  className="px-4 py-3 cursor-pointer"
                  onClick={() => toggleEntry(entry.id || index)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="flex-shrink-0">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                          {getDecisionTypeIcon(entry.decisionType)}
                        </div>
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2">
                          <h3 className="text-sm font-medium text-gray-900 truncate">
                            {entry.action}
                          </h3>
                          {getStatusBadge(entry.status)}
                          {entry.details?.risk_level && getRiskLevelIndicator(entry.details.risk_level)}
                        </div>
                        
                        <div className="flex items-center space-x-4 mt-1 text-xs text-gray-500">
                          <div className="flex items-center">
                            <Clock className="w-3 h-3 mr-1" />
                            {format(parseISO(entry.timestamp), 'PPpp')}
                          </div>
                          {entry.user && (
                            <div className="flex items-center">
                              <User className="w-3 h-3 mr-1" />
                              {entry.user}
                            </div>
                          )}
                          {entry.decisionType && (
                            <div className="flex items-center">
                              <FileText className="w-3 h-3 mr-1" />
                              {entry.decisionType}
                            </div>
                          )}
                          {entry.details?.confidence_score && (
                            <div className="flex items-center">
                              <TrendingUp className="w-3 h-3 mr-1" />
                              {(entry.details.confidence_score * 100).toFixed(1)}%
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex-shrink-0">
                      {expandedEntries.has(entry.id || index) ? (
                        <ChevronUp className="w-5 h-5 text-gray-400" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-gray-400" />
                      )}
                    </div>
                  </div>
                </div>

                {/* Expanded Content */}
                {expandedEntries.has(entry.id || index) && (
                  <div className="px-4 pb-4 border-t border-gray-100">
                    <div className="mt-3 space-y-3">
                      {/* Rationale */}
                      {entry.rationale && (
                        <div>
                          <h4 className="text-xs font-medium text-gray-700 uppercase tracking-wide mb-1">
                            Decision Rationale
                          </h4>
                          <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-md">
                            {entry.rationale}
                          </p>
                        </div>
                      )}

                      {/* Policy References */}
                      {entry.policyReferences && entry.policyReferences.length > 0 && (
                        <div>
                          <h4 className="text-xs font-medium text-gray-700 uppercase tracking-wide mb-1">
                            Policy References
                          </h4>
                          <div className="flex flex-wrap gap-2">
                            {entry.policyReferences.map((policy, idx) => (
                              <span
                                key={idx}
                                className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                              >
                                <Shield className="w-3 h-3 mr-1" />
                                {policy}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Performance Metrics */}
                      {entry.details && (
                        <div>
                          <h4 className="text-xs font-medium text-gray-700 uppercase tracking-wide mb-1">
                            Performance Metrics
                          </h4>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            {entry.details.confidence_score && (
                              <div className="bg-green-50 p-2 rounded-md">
                                <div className="text-xs text-green-600 font-medium">Confidence</div>
                                <div className="text-sm font-bold text-green-800">
                                  {(entry.details.confidence_score * 100).toFixed(1)}%
                                </div>
                              </div>
                            )}
                            {entry.details.compliance_score && (
                              <div className="bg-blue-50 p-2 rounded-md">
                                <div className="text-xs text-blue-600 font-medium">Compliance</div>
                                <div className="text-sm font-bold text-blue-800">
                                  {(entry.details.compliance_score * 100).toFixed(1)}%
                                </div>
                              </div>
                            )}
                            {entry.details.risk_level && (
                              <div className="bg-yellow-50 p-2 rounded-md">
                                <div className="text-xs text-yellow-600 font-medium">Risk Level</div>
                                <div className="text-sm font-bold text-yellow-800 capitalize">
                                  {entry.details.risk_level}
                                </div>
                              </div>
                            )}
                            {entry.details.processing_time_ms && (
                              <div className="bg-gray-50 p-2 rounded-md">
                                <div className="text-xs text-gray-600 font-medium">Processing Time</div>
                                <div className="text-sm font-bold text-gray-800">
                                  {entry.details.processing_time_ms}ms
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Raw Data */}
                      {entry.details && (
                        <div>
                          <h4 className="text-xs font-medium text-gray-700 uppercase tracking-wide mb-1">
                            Technical Details
                          </h4>
                          <div className="bg-gray-50 p-3 rounded-md">
                            <pre className="text-xs text-gray-600 whitespace-pre-wrap">
                              {JSON.stringify(entry.details, null, 2)}
                            </pre>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default DecisionAuditTrail; 