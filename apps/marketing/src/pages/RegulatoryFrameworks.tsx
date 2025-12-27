import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Globe, Download, AlertCircle, CheckCircle, Clock } from 'lucide-react'
import Layout from '../components/Layout'

interface Framework {
  id: string
  name: string
  short_code: string
  jurisdiction: string
  jurisdiction_display: string
  status: string
  enforcement_date?: string
  summary?: string
  requirement_count?: number
}

export default function RegulatoryFrameworks() {
  const [frameworks, setFrameworks] = useState<Framework[]>([])
  const [loading, setLoading] = useState(true)
  const [filterJurisdiction, setFilterJurisdiction] = useState<string>('')

  useEffect(() => {
    fetchFrameworks()
  }, [])

  const fetchFrameworks = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/frameworks?status=active')
      if (!response.ok) throw new Error('Failed to fetch frameworks')

      const result = await response.json()
      setFrameworks(result.data?.frameworks || [])
    } catch (error) {
      console.error('Error fetching frameworks:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredFrameworks = frameworks.filter(f => 
    !filterJurisdiction || f.jurisdiction === filterJurisdiction
  )

  const jurisdictions = Array.from(new Set(frameworks.map(f => f.jurisdiction))).sort()

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
      case 'enforced':
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case 'enacted':
        return <Clock className="h-4 w-4 text-blue-600" />
      case 'pending':
        return <AlertCircle className="h-4 w-4 text-yellow-600" />
      default:
        return null
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
      case 'enforced':
        return 'bg-green-100 text-green-800'
      case 'enacted':
        return 'bg-blue-100 text-blue-800'
      case 'pending':
        return 'bg-yellow-100 text-yellow-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
        {/* Hero Section */}
        <div className="bg-white border-b border-slate-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
            <div className="text-center">
              <h1 className="text-4xl font-bold text-slate-900 mb-4">
                AICOMPLYR.IO Regulatory Intelligence
              </h1>
              <p className="text-xl text-slate-600 max-w-3xl mx-auto">
                We track AI governance requirements across 11+ jurisdictions so your compliance workflows adapt as regulations evolve.
              </p>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center gap-4 mb-6">
            <button
              onClick={() => setFilterJurisdiction('')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                !filterJurisdiction
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-50'
              }`}
            >
              All
            </button>
            {jurisdictions.map(jurisdiction => (
              <button
                key={jurisdiction}
                onClick={() => setFilterJurisdiction(jurisdiction)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filterJurisdiction === jurisdiction
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-50'
                }`}
              >
                {jurisdiction}
              </button>
            ))}
          </div>

          {/* Frameworks Table */}
          <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Framework
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Jurisdiction
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Enforcement
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-200">
                {loading ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-12 text-center text-slate-500">
                      Loading frameworks...
                    </td>
                  </tr>
                ) : filteredFrameworks.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-12 text-center text-slate-500">
                      No frameworks found
                    </td>
                  </tr>
                ) : (
                  filteredFrameworks.map((framework) => (
                    <tr key={framework.id} className="hover:bg-slate-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="font-medium text-slate-900">{framework.name}</div>
                        {framework.summary && (
                          <div className="text-sm text-slate-500 mt-1">{framework.summary}</div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <Globe className="h-4 w-4 text-slate-400" />
                          <span className="text-sm text-slate-900">
                            {framework.jurisdiction_display || framework.jurisdiction}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          {getStatusIcon(framework.status)}
                          <span className={`px-2 py-1 text-xs font-medium rounded ${getStatusBadge(framework.status)}`}>
                            {framework.status}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                        {framework.enforcement_date ? (
                          new Date(framework.enforcement_date).toLocaleDateString()
                        ) : (
                          'Ongoing'
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Recent Enforcement Actions */}
          <div className="mt-12 bg-white border border-slate-200 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-slate-900 mb-4">Recent Enforcement Actions</h2>
            <div className="space-y-4">
              <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
                <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
                <div>
                  <div className="font-medium text-slate-900">Dec 2024: EU fines X Corp €120M under DSA</div>
                  <div className="text-sm text-slate-600 mt-1">
                    Cited: Inadequate audit trails, opaque ad repository
                  </div>
                </div>
              </div>
              <div className="flex items-start gap-3 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <Clock className="h-5 w-5 text-yellow-600 mt-0.5" />
                <div>
                  <div className="font-medium text-slate-900">Dec 2024: NY enacts synthetic performer disclosure law</div>
                  <div className="text-sm text-slate-600 mt-1">
                    First-in-nation AI disclosure mandate, effective Jun 2026
                  </div>
                </div>
              </div>
              <div className="flex items-start gap-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <CheckCircle className="h-5 w-5 text-blue-600 mt-0.5" />
                <div>
                  <div className="font-medium text-slate-900">Aug 2024: EU AI Act enters into force</div>
                  <div className="text-sm text-slate-600 mt-1">
                    Phased enforcement beginning Feb 2025
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* CTA */}
          <div className="mt-12 text-center">
            <Link
              to="/contact"
              className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Download className="h-5 w-5" />
              Download Complete Framework Guide (PDF)
            </Link>
          </div>
        </div>
      </div>
    </Layout>
  )
}

