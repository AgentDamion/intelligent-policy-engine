// Platform Configuration Modal Component

import React, { useState } from 'react';
import { PlatformConfig, PlatformType } from '../../services/platform-integrations';

interface PlatformConfigModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (config: Partial<PlatformConfig> & { auth_config: any }) => Promise<void>;
  editingConfig?: PlatformConfig | null;
  loading?: boolean;
}

export function PlatformConfigModal({ 
  open, 
  onClose, 
  onSubmit, 
  editingConfig,
  loading = false 
}: PlatformConfigModalProps) {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    name: editingConfig?.name || '',
    platform_type: editingConfig?.platform_type || 'veeva' as PlatformType,
    auth_config: editingConfig?.auth_config || {},
    sync_settings: editingConfig?.sync_settings || {
      auto_sync: false,
      sync_on_approval: true,
      sync_on_submission: false
    }
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await onSubmit(formData);
      onClose();
      setStep(1);
      setFormData({
        name: '',
        platform_type: 'veeva',
        auth_config: {},
        sync_settings: {
          auto_sync: false,
          sync_on_approval: true,
          sync_on_submission: false
        }
      });
    } catch (error) {
      // Error handling is done in the parent component
    }
  };

  const handleClose = () => {
    onClose();
    setStep(1);
    setFormData({
      name: '',
      platform_type: 'veeva',
      auth_config: {},
      sync_settings: {
        auto_sync: false,
        sync_on_approval: true,
        sync_on_submission: false
      }
    });
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">
            {editingConfig ? 'Edit Platform Configuration' : 'Add Platform Configuration'}
          </h2>
          <button
            onClick={handleClose}
            className="text-gray-500 hover:text-gray-700"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Step 1: Basic Info */}
          {step === 1 && (
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Basic Information</h3>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Configuration Name
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., Production Veeva Vault"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Platform Type
                </label>
                <select
                  value={formData.platform_type}
                  onChange={(e) => setFormData({ ...formData, platform_type: e.target.value as PlatformType })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="veeva">Veeva Vault</option>
                  <option value="sharepoint">SharePoint</option>
                  <option value="custom">Custom Platform</option>
                </select>
              </div>

              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Next
                </button>
              </div>
            </div>
          )}

          {/* Step 2: Authentication */}
          {step === 2 && (
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Authentication Configuration</h3>
              
              {formData.platform_type === 'veeva' && (
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Base URL
                    </label>
                    <input
                      type="url"
                      value={formData.auth_config.base_url || ''}
                      onChange={(e) => setFormData({
                        ...formData,
                        auth_config: { ...formData.auth_config, base_url: e.target.value }
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="https://your-vault.veevavault.com"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Authentication Type
                    </label>
                    <select
                      value={formData.auth_config.auth_type || 'oauth2'}
                      onChange={(e) => setFormData({
                        ...formData,
                        auth_config: { ...formData.auth_config, auth_type: e.target.value }
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="oauth2">OAuth2</option>
                      <option value="api_key">API Key</option>
                    </select>
                  </div>

                  {formData.auth_config.auth_type === 'oauth2' && (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Client ID
                        </label>
                        <input
                          type="text"
                          value={formData.auth_config.client_id || ''}
                          onChange={(e) => setFormData({
                            ...formData,
                            auth_config: { ...formData.auth_config, client_id: e.target.value }
                          })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Client Secret
                        </label>
                        <input
                          type="password"
                          value={formData.auth_config.client_secret || ''}
                          onChange={(e) => setFormData({
                            ...formData,
                            auth_config: { ...formData.auth_config, client_secret: e.target.value }
                          })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          required
                        />
                      </div>
                    </>
                  )}

                  {formData.auth_config.auth_type === 'api_key' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        API Key
                      </label>
                      <input
                        type="password"
                        value={formData.auth_config.api_key || ''}
                        onChange={(e) => setFormData({
                          ...formData,
                          auth_config: { ...formData.auth_config, api_key: e.target.value }
                        })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                      />
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Vault Name (optional)
                    </label>
                    <input
                      type="text"
                      value={formData.auth_config.vault || ''}
                      onChange={(e) => setFormData({
                        ...formData,
                        auth_config: { ...formData.auth_config, vault: e.target.value }
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              )}

              <div className="flex justify-between">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={() => setStep(3)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Next
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Sync Settings */}
          {step === 3 && (
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Sync Settings</h3>
              
              <div className="space-y-3">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.sync_settings.auto_sync || false}
                    onChange={(e) => setFormData({
                      ...formData,
                      sync_settings: { ...formData.sync_settings, auto_sync: e.target.checked }
                    })}
                    className="mr-2"
                  />
                  <span className="text-sm text-gray-700">Enable automatic sync</span>
                </label>

                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.sync_settings.sync_on_approval || false}
                    onChange={(e) => setFormData({
                      ...formData,
                      sync_settings: { ...formData.sync_settings, sync_on_approval: e.target.checked }
                    })}
                    className="mr-2"
                  />
                  <span className="text-sm text-gray-700">Sync on approval</span>
                </label>

                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.sync_settings.sync_on_submission || false}
                    onChange={(e) => setFormData({
                      ...formData,
                      sync_settings: { ...formData.sync_settings, sync_on_submission: e.target.checked }
                    })}
                    className="mr-2"
                  />
                  <span className="text-sm text-gray-700">Sync on submission</span>
                </label>
              </div>

              <div className="flex justify-between">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
                >
                  {loading ? 'Saving...' : (editingConfig ? 'Update' : 'Create')}
                </button>
              </div>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}