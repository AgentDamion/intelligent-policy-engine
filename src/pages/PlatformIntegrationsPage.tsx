// Platform Integrations Page

import React, { useState } from 'react';
import { usePlatformIntegrations } from '../hooks/usePlatformIntegrations';
import { PlatformConfigModal } from '../components/platform/PlatformConfigModal';
import { IntegrationActivityLog } from '../components/platform/IntegrationActivityLog';
import { PlatformConfig, SyncJob } from '../services/platform-integrations';

interface PlatformIntegrationsPageProps {
  enterpriseId: string;
}

export function PlatformIntegrationsPage({ enterpriseId }: PlatformIntegrationsPageProps) {
  const {
    configs,
    logs,
    health,
    activeConfigs,
    recentLogs,
    failedLogs,
    loading,
    testing,
    error,
    createConfig,
    updateConfig,
    deleteConfig,
    testConfig,
    triggerSync,
    retryLog,
    clearError
  } = usePlatformIntegrations(enterpriseId);

  const [showConfigModal, setShowConfigModal] = useState(false);
  const [editingConfig, setEditingConfig] = useState<PlatformConfig | null>(null);
  const [showTestModal, setShowTestModal] = useState(false);
  const [testSubmissionId, setTestSubmissionId] = useState('');

  const handleCreateConfig = async (configData: any) => {
    await createConfig(configData);
    setShowConfigModal(false);
  };

  const handleEditConfig = (config: PlatformConfig) => {
    setEditingConfig(config);
    setShowConfigModal(true);
  };

  const handleUpdateConfig = async (configData: any) => {
    if (editingConfig) {
      await updateConfig(editingConfig.id, configData);
      setShowConfigModal(false);
      setEditingConfig(null);
    }
  };

  const handleDeleteConfig = async (config: PlatformConfig) => {
    if (window.confirm(`Are you sure you want to delete "${config.name}"?`)) {
      await deleteConfig(config.id);
    }
  };

  const handleTestConnection = async (config: PlatformConfig) => {
    try {
      await testConfig(config.id);
      alert('Connection test successful!');
    } catch (error) {
      alert(`Connection test failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleTestSync = async () => {
    if (!testSubmissionId.trim()) {
      alert('Please enter a submission ID');
      return;
    }

    const activeConfigIds = activeConfigs.map(config => config.id);
    if (activeConfigIds.length === 0) {
      alert('No active platform configurations found');
      return;
    }

    const syncJob: SyncJob = {
      submissionId: testSubmissionId,
      platformIds: activeConfigIds,
      syncType: 'metadata_update',
      metadata: {
        test: true,
        timestamp: new Date().toISOString()
      }
    };

    try {
      await triggerSync(syncJob);
      alert('Sync triggered successfully!');
      setShowTestModal(false);
      setTestSubmissionId('');
    } catch (error) {
      alert(`Sync failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'text-green-600 bg-green-100';
      case 'inactive':
        return 'text-gray-600 bg-gray-100';
      case 'error':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getPlatformIcon = (platformType: string) => {
    switch (platformType) {
      case 'veeva':
        return '🏥';
      case 'sharepoint':
        return '📄';
      case 'custom':
        return '⚙️';
      default:
        return '🔗';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Platform Integrations</h1>
          <p className="text-gray-600">Manage your external platform connections and sync settings</p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={() => setShowTestModal(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Test Sync
          </button>
          <button
            onClick={() => {
              setEditingConfig(null);
              setShowConfigModal(true);
            }}
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
          >
            Add Platform
          </button>
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <span className="text-red-400">⚠️</span>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-800">{error}</p>
            </div>
            <div className="ml-auto pl-3">
              <button
                onClick={clearError}
                className="text-red-400 hover:text-red-600"
              >
                ✕
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="text-2xl font-bold text-gray-900">{configs.length}</div>
            <div className="ml-2 text-sm text-gray-600">Total Platforms</div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="text-2xl font-bold text-green-600">{activeConfigs.length}</div>
            <div className="ml-2 text-sm text-gray-600">Active</div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="text-2xl font-bold text-red-600">{failedLogs.length}</div>
            <div className="ml-2 text-sm text-gray-600">Failed Syncs</div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="text-2xl font-bold text-blue-600">{recentLogs.length}</div>
            <div className="ml-2 text-sm text-gray-600">Recent Activity</div>
          </div>
        </div>
      </div>

      {/* Platform Configurations */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">Platform Configurations</h2>
        </div>
        <div className="p-6">
          {configs.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-gray-400 text-4xl mb-2">🔗</div>
              <p className="text-gray-500 mb-4">No platform configurations yet</p>
              <button
                onClick={() => setShowConfigModal(true)}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
              >
                Add Your First Platform
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {configs.map((config) => (
                <div key={config.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center">
                      <span className="text-2xl mr-3">{getPlatformIcon(config.platform_type)}</span>
                      <div>
                        <h3 className="font-medium text-gray-900">{config.name}</h3>
                        <p className="text-sm text-gray-500 capitalize">{config.platform_type}</p>
                      </div>
                    </div>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(config.status)}`}>
                      {config.status}
                    </span>
                  </div>
                  
                  <div className="mt-4 space-y-2">
                    <div className="text-sm text-gray-600">
                      <span className="font-medium">Last Sync:</span>{' '}
                      {config.last_sync_at ? new Date(config.last_sync_at).toLocaleString() : 'Never'}
                    </div>
                    
                    <div className="text-sm text-gray-600">
                      <span className="font-medium">Auto Sync:</span>{' '}
                      {config.sync_settings.auto_sync ? 'Enabled' : 'Disabled'}
                    </div>
                  </div>

                  <div className="mt-4 flex space-x-2">
                    <button
                      onClick={() => handleTestConnection(config)}
                      disabled={testing === config.id}
                      className="flex-1 px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200 disabled:opacity-50"
                    >
                      {testing === config.id ? 'Testing...' : 'Test'}
                    </button>
                    <button
                      onClick={() => handleEditConfig(config)}
                      className="flex-1 px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteConfig(config)}
                      className="px-3 py-1 text-sm bg-red-100 text-red-700 rounded hover:bg-red-200"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Activity Log */}
      <IntegrationActivityLog
        logs={recentLogs}
        onRetry={retryLog}
        loading={loading}
      />

      {/* Modals */}
      <PlatformConfigModal
        open={showConfigModal}
        onClose={() => {
          setShowConfigModal(false);
          setEditingConfig(null);
        }}
        onSubmit={editingConfig ? handleUpdateConfig : handleCreateConfig}
        editingConfig={editingConfig}
        loading={loading}
      />

      {/* Test Sync Modal */}
      {showTestModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Test Sync</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Submission ID
                </label>
                <input
                  type="text"
                  value={testSubmissionId}
                  onChange={(e) => setTestSubmissionId(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter submission ID to test"
                />
              </div>
              <div className="text-sm text-gray-600">
                This will trigger a sync to all active platforms ({activeConfigs.length} configured)
              </div>
            </div>
            <div className="mt-6 flex justify-end space-x-3">
              <button
                onClick={() => setShowTestModal(false)}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
              >
                Cancel
              </button>
              <button
                onClick={handleTestSync}
                disabled={loading}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? 'Syncing...' : 'Test Sync'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}