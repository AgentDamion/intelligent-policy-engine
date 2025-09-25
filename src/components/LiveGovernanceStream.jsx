// LiveGovernanceStream.jsx - Real-time governance event feed
import React, { useState, useEffect, useRef } from 'react'
import { 
  Activity, Shield, Users, AlertTriangle, Clock, 
  Filter, Search, FileText, Zap, TrendingUp,
  ChevronDown, ChevronUp, Download
} from 'lucide-react'
import { useGovernanceWebSocket } from '../lib/websocket'
import { useAuth } from '../contexts/AuthContext'

export const LiveGovernanceStream = ({ 
  isOpen = false,
  onClose = () => {},
  position = 'right',
  context = null,
  currentUser = null
}) => {
  const { session } = useAuth()
  const { createConnection } = useGovernanceWebSocket(session)
  const [events, setEvents] = useState([])
  const [filteredEvents, setFilteredEvents] = useState([])
  const [filters, setFilters] = useState({
    eventTypes: 'all',
    severity: 'all',
    timeRange: '24h',
    agency: 'all',
    searchQuery: ''
  })
  const [isConnected, setIsConnected] = useState(false)
  const [expandedEvents, setExpandedEvents] = useState(new Set())
  const [isFilterPanelOpen, setIsFilterPanelOpen] = useState(false)
  const streamRef = useRef(null)
  const wsRef = useRef(null)

  // Event type configurations
  const eventTypes = {
    policy_decision: {
      icon: Shield,
      color: 'blue',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200',
      textColor: 'text-blue-800',
      label: 'Policy Decision'
    },
    compliance_alert: {
      icon: AlertTriangle,
      color: 'orange',
      bgColor: 'bg-orange-50',
      borderColor: 'border-orange-200',
      textColor: 'text-orange-800',
      label: 'Compliance Alert'
    },
    tool_submission: {
      icon: FileText,
      color: 'green',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200',
      textColor: 'text-green-800',
      label: 'Tool Submission'
    },
    agent_action: {
      icon: Zap,
      color: 'purple',
      bgColor: 'bg-purple-50',
      borderColor: 'border-purple-200',
      textColor: 'text-purple-800',
      label: 'AI Agent Action'
    },
    risk_assessment: {
      icon: TrendingUp,
      color: 'red',
      bgColor: 'bg-red-50',
      borderColor: 'border-red-200',
      textColor: 'text-red-800',
      label: 'Risk Assessment'
    },
    user_activity: {
      icon: Users,
      color: 'gray',
      bgColor: 'bg-gray-50',
      borderColor: 'border-gray-200',
      textColor: 'text-gray-800',
      label: 'User Activity'
    }
  }

  // Connect to real-time governance stream
  useEffect(() => {
    if (isOpen) {
      connectToGovernanceStream()
      loadInitialEvents()
    }

    return () => {
      if (wsRef.current) {
        wsRef.current.disconnect()
      }
    }
  }, [isOpen, context, session])

  // Filter events based on current filters
  useEffect(() => {
    filterEvents()
  }, [events, filters])

  const connectToGovernanceStream = async () => {
    try {
      if (!session) {
        console.warn('No session available for WebSocket connection')
        setIsConnected(false)
        return
      }

      const wsConnection = createConnection()
      wsRef.current = wsConnection

      // Set up message handler
      wsConnection.onMessage((message) => {
        if (message.type === 'governance_event') {
          setEvents(prev => [message.data, ...prev])
        }
      })

      // Set up status handler
      wsConnection.onStatusChange((connected) => {
        setIsConnected(connected)
      })

      await wsConnection.connect()
    } catch (error) {
      console.error('Failed to connect to governance stream:', error)
      setIsConnected(false)
    }
  }

  const loadInitialEvents = async () => {
    try {
      // Load recent events from API
      const mockEvents = generateMockEvents(50)
      setEvents(mockEvents)
    } catch (error) {
      console.error('Failed to load initial events:', error)
    }
  }

  const filterEvents = () => {
    let filtered = [...events]

    // Filter by event type
    if (filters.eventTypes !== 'all') {
      filtered = filtered.filter(event => event.type === filters.eventTypes)
    }

    // Filter by severity
    if (filters.severity !== 'all') {
      filtered = filtered.filter(event => event.severity === filters.severity)
    }

    // Filter by time range
    const now = new Date()
    const timeRangeMs = {
      '1h': 60 * 60 * 1000,
      '24h': 24 * 60 * 60 * 1000,
      '7d': 7 * 24 * 60 * 60 * 1000,
      '30d': 30 * 24 * 60 * 60 * 1000
    }
    
    if (filters.timeRange !== 'all') {
      const cutoff = new Date(now.getTime() - timeRangeMs[filters.timeRange])
      filtered = filtered.filter(event => new Date(event.timestamp) > cutoff)
    }

    // Filter by agency (Enterprise users only)
    if (filters.agency !== 'all' && currentUser?.type === 'enterprise') {
      filtered = filtered.filter(event => event.agency === filters.agency)
    }

    // Filter by search query
    if (filters.searchQuery.trim()) {
      const query = filters.searchQuery.toLowerCase()
      filtered = filtered.filter(event => 
        event.title.toLowerCase().includes(query) ||
        event.description.toLowerCase().includes(query) ||
        event.agency?.toLowerCase().includes(query) ||
        event.user?.toLowerCase().includes(query)
      )
    }

    setFilteredEvents(filtered)
  }

  const toggleEventExpansion = (eventId) => {
    const newExpanded = new Set(expandedEvents)
    if (newExpanded.has(eventId)) {
      newExpanded.delete(eventId)
    } else {
      newExpanded.add(eventId)
    }
    setExpandedEvents(newExpanded)
  }

  const exportEvents = () => {
    const csvData = filteredEvents.map(event => ({
      timestamp: event.timestamp,
      type: event.type,
      severity: event.severity,
      title: event.title,
      description: event.description,
      agency: event.agency,
      user: event.user,
      agent: event.agent
    }))

    const csv = [
      Object.keys(csvData[0]).join(','),
      ...csvData.map(row => Object.values(row).join(','))
    ].join('\n')

    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `governance-events-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
  }

  if (!isOpen) return null

  return (
    <div className={`
      fixed inset-y-0 z-40 flex flex-col bg-white shadow-2xl border-l border-gray-200 transition-all duration-300
      ${position === 'right' ? 'right-0' : 'left-0'}
      ${isOpen ? 'w-96' : 'w-0'}
    `}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gradient-to-r from-indigo-500 to-purple-600 text-white">
        <div className="flex items-center gap-3">
          <Activity size={20} />
          <div>
            <h3 className="font-semibold">Live Governance</h3>
            <p className="text-xs text-indigo-100">
              {isConnected ? 
                `${filteredEvents.length} events • Connected` : 
                `${filteredEvents.length} events • Mock Data`
              }
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsFilterPanelOpen(!isFilterPanelOpen)}
            className="text-white hover:text-gray-200 p-1 transition-colors"
          >
            <Filter size={16} />
          </button>
          <button
            onClick={exportEvents}
            className="text-white hover:text-gray-200 p-1 transition-colors"
          >
            <Download size={16} />
          </button>
          <button
            onClick={onClose}
            className="text-white hover:text-gray-200 p-1 transition-colors"
          >
            ✕
          </button>
        </div>
      </div>

      {/* Filter Panel */}
      {isFilterPanelOpen && (
        <div className="border-b border-gray-200 bg-gray-50 p-4">
          <div className="space-y-3">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
              <input
                type="text"
                placeholder="Search events..."
                value={filters.searchQuery}
                onChange={(e) => setFilters({...filters, searchQuery: e.target.value})}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm"
              />
            </div>

            {/* Event Type Filter */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Event Type</label>
              <select
                value={filters.eventTypes}
                onChange={(e) => setFilters({...filters, eventTypes: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
              >
                <option value="all">All Types</option>
                {Object.entries(eventTypes).map(([key, type]) => (
                  <option key={key} value={key}>{type.label}</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {/* Severity Filter */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Severity</label>
                <select
                  value={filters.severity}
                  onChange={(e) => setFilters({...filters, severity: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                >
                  <option value="all">All</option>
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="critical">Critical</option>
                </select>
              </div>

              {/* Time Range Filter */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Time Range</label>
                <select
                  value={filters.timeRange}
                  onChange={(e) => setFilters({...filters, timeRange: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                >
                  <option value="1h">Last Hour</option>
                  <option value="24h">Last 24 Hours</option>
                  <option value="7d">Last 7 Days</option>
                  <option value="30d">Last 30 Days</option>
                  <option value="all">All Time</option>
                </select>
              </div>
            </div>

            {/* Agency Filter (Enterprise only) */}
            {currentUser?.type === 'enterprise' && (
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Agency</label>
                <select
                  value={filters.agency}
                  onChange={(e) => setFilters({...filters, agency: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                >
                  <option value="all">All Agencies</option>
                  <option value="ogilvy-health">Ogilvy Health</option>
                  <option value="mccann-health">McCann Health</option>
                  <option value="havas-health">Havas Health</option>
                  <option value="razorfish-health">Razorfish Health</option>
                </select>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Events Stream */}
      <div 
        ref={streamRef}
        className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50"
      >
        {filteredEvents.length === 0 ? (
          <div className="text-center py-12">
            <Activity className="mx-auto text-gray-400 mb-4" size={48} />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Events Found</h3>
            <p className="text-gray-500 text-sm">
              {filters.searchQuery || filters.eventTypes !== 'all' || filters.timeRange !== '24h'
                ? 'Try adjusting your filters to see more events.'
                : 'Events will appear here as they occur.'
              }
            </p>
          </div>
        ) : (
          filteredEvents.map(event => (
            <EventCard
              key={event.id}
              event={event}
              eventType={eventTypes[event.type]}
              isExpanded={expandedEvents.has(event.id)}
              onToggleExpansion={() => toggleEventExpansion(event.id)}
              currentUser={currentUser}
            />
          ))
        )}
      </div>

      {/* Status Footer */}
      <div className="border-t border-gray-200 px-4 py-2 bg-white">
        <div className="flex items-center justify-between text-xs text-gray-500">
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-gray-500'}`} />
            <span>{isConnected ? 'Live Stream Active' : 'Mock Data Mode'}</span>
          </div>
          <span>{filteredEvents.length} events shown</span>
        </div>
      </div>
    </div>
  )
}

// Individual Event Card Component
const EventCard = ({ event, eventType, isExpanded, onToggleExpansion, currentUser }) => {
  const Icon = eventType.icon
  const timeAgo = getTimeAgo(event.timestamp)
  
  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'critical': return 'text-red-600 bg-red-100'
      case 'high': return 'text-orange-600 bg-orange-100'
      case 'medium': return 'text-yellow-600 bg-yellow-100'
      case 'low': return 'text-green-600 bg-green-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  return (
    <div className={`
      border rounded-lg bg-white shadow-sm transition-all duration-200 hover:shadow-md
      ${eventType.borderColor}
    `}>
      {/* Event Header */}
      <div className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3 flex-1">
            <div className={`
              w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0
              ${eventType.bgColor}
            `}>
              <Icon size={16} className={eventType.textColor} />
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h4 className="font-medium text-gray-900 text-sm truncate">
                  {event.title}
                </h4>
                <span className={`
                  px-2 py-1 rounded text-xs font-medium
                  ${getSeverityColor(event.severity)}
                `}>
                  {event.severity}
                </span>
              </div>
              
              <p className="text-gray-600 text-sm line-clamp-2 mb-2">
                {event.description}
              </p>
              
              <div className="flex items-center gap-4 text-xs text-gray-500">
                <span className="flex items-center gap-1">
                  <Clock size={12} />
                  {timeAgo}
                </span>
                {event.agency && (
                  <span className="flex items-center gap-1">
                    <Users size={12} />
                    {event.agency}
                  </span>
                )}
                {event.user && (
                  <span>{event.user}</span>
                )}
                {event.agent && (
                  <span className="flex items-center gap-1">
                    <Zap size={12} />
                    {event.agent}
                  </span>
                )}
              </div>
            </div>
          </div>
          
          {event.details && (
            <button
              onClick={onToggleExpansion}
              className="text-gray-400 hover:text-gray-600 p-1 transition-colors"
            >
              {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>
          )}
        </div>
      </div>

      {/* Expanded Details */}
      {isExpanded && event.details && (
        <div className="border-t border-gray-200 p-4 bg-gray-50">
          <div className="space-y-3">
            {event.details.map((detail, index) => (
              <div key={index} className="text-sm">
                <div className="font-medium text-gray-900 mb-1">{detail.label}</div>
                <div className="text-gray-600">{detail.value}</div>
              </div>
            ))}
            
            {event.actions && event.actions.length > 0 && (
              <div className="pt-3 border-t border-gray-200">
                <div className="font-medium text-gray-900 mb-2 text-sm">Quick Actions</div>
                <div className="flex flex-wrap gap-2">
                  {event.actions.map((action, index) => (
                    <button
                      key={index}
                      onClick={() => executeEventAction(action)}
                      className="px-3 py-1 bg-blue-100 text-blue-700 rounded text-xs font-medium hover:bg-blue-200 transition-colors"
                    >
                      {action.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

// Utility functions
const getTimeAgo = (timestamp) => {
  const now = new Date()
  const eventTime = new Date(timestamp)
  const diffMs = now - eventTime
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMins / 60)
  const diffDays = Math.floor(diffHours / 24)

  if (diffMins < 1) return 'Just now'
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  return `${diffDays}d ago`
}

const executeEventAction = (action) => {
  // Execute action and update UI
  window.dispatchEvent(new CustomEvent(action.event, { detail: action.data }))
}

// Mock event generator for development
const generateMockEvents = (count) => {
  const mockEvents = []
  const eventTemplates = [
    {
      type: 'policy_decision',
      severity: 'medium',
      title: 'AI Policy Updated',
      description: 'Social media content policy updated with new FDA guidelines',
      agency: 'Ogilvy Health',
      user: 'Sarah Johnson',
      agent: 'Policy Assistant'
    },
    {
      type: 'tool_submission',
      severity: 'low',
      title: 'New Tool Submitted',
      description: 'Midjourney v6 submitted for approval by creative team',
      agency: 'McCann Health',
      user: 'Mike Chen',
      agent: null
    },
    {
      type: 'compliance_alert',
      severity: 'high',
      title: 'Compliance Violation Detected',
      description: 'Medical claim detected in AI-generated social media post',
      agency: 'Havas Health',
      user: 'Emma Wilson',
      agent: 'Compliance Monitor'
    },
    {
      type: 'risk_assessment',
      severity: 'medium',
      title: 'Risk Assessment Complete',
      description: 'Quarterly AI tool risk assessment completed for all approved tools',
      agency: 'Razorfish Health',
      user: 'David Lee',
      agent: 'Risk Analyzer'
    },
    {
      type: 'agent_action',
      severity: 'low',
      title: 'Auto-Approval Processed',
      description: 'Low-risk content variation automatically approved by AI agent',
      agency: 'McCann Health',
      user: null,
      agent: 'Approval Assistant'
    }
  ]

  for (let i = 0; i < count; i++) {
    const template = eventTemplates[Math.floor(Math.random() * eventTemplates.length)]
    const event = {
      id: Date.now() + i,
      ...template,
      timestamp: new Date(Date.now() - Math.random() * 86400000 * 7).toISOString(), // Random time in last week
      details: [
        { label: 'Event ID', value: `EVT-${String(Date.now() + i).slice(-8)}` },
        { label: 'Source', value: 'AI Governance System' },
        { label: 'Impact', value: template.severity === 'high' ? 'High - Immediate attention required' : 'Low - Routine monitoring' }
      ],
      actions: template.type === 'compliance_alert' ? [
        { label: 'Review Details', event: 'openComplianceReview', data: { eventId: Date.now() + i } },
        { label: 'Contact Agency', event: 'openAgencyContact', data: { agency: template.agency } }
      ] : []
    }
    mockEvents.push(event)
  }

  return mockEvents.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
}

// Integration hook for opening LiveGovernanceStream
export const useLiveGovernanceStream = () => {
  const [isStreamOpen, setIsStreamOpen] = useState(false)
  const [streamContext, setStreamContext] = useState(null)

  useEffect(() => {
    const handleOpenStream = (event) => {
      setStreamContext(event.detail || null)
      setIsStreamOpen(true)
    }

    window.addEventListener('openGovernanceStream', handleOpenStream)
    return () => window.removeEventListener('openGovernanceStream', handleOpenStream)
  }, [])

  const openStream = (context = null) => {
    setStreamContext(context)
    setIsStreamOpen(true)
  }

  return {
    isStreamOpen,
    setIsStreamOpen,
    streamContext,
    openStream
  }
}

export default LiveGovernanceStream