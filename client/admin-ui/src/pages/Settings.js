import React, { useState, useEffect } from 'react';
import { authAPI, organizationAPI } from '../services/api';

const Settings = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [user, setUser] = useState(null);
  const [apiKey, setApiKey] = useState(null);
  const [organization, setOrganization] = useState(null);
  const [activeTab, setActiveTab] = useState('general');
  
  const [generalSettings, setGeneralSettings] = useState({
    organizationName: '',
    emailNotifications: true,
    slackNotifications: true,
    whisperThreshold: 0.75,
    dataRetentionDays: 90,
    darkMode: true
  });

  const [securitySettings, setSecuritySettings] = useState({
    twoFactorAuth: false,
    sessionTimeout: 60,
    ipRestriction: false,
    allowedIPs: ''
  });

  // Fetch user and organization data on component mount
  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    try {
      setLoading(true);
      
      // Get current user
      const userResponse = await authAPI.getCurrentUser();
      const userData = userResponse.data.data;
      setUser(userData);
      
      // Get user's organization if they have one
      if (userData.organizationId) {
        const orgResponse = await organizationAPI.getById(userData.organizationId);
        const orgData = orgResponse.data.data;
        setOrganization(orgData);
        
        // Update form with real data
        setGeneralSettings(prevSettings => ({
          ...prevSettings,
          organizationName: orgData.name || 'WhisprNet Admin',
          emailNotifications: orgData.settings?.notificationSettings?.email?.enabled ?? true,
          slackNotifications: orgData.settings?.notificationSettings?.slack?.enabled ?? false,
          dataRetentionDays: orgData.settings?.dataRetentionDays || 90,
          darkMode: orgData.settings?.theme === 'dark' ? true : false
        }));
        
        // Try to get API key if user is admin
        if (userData.role === 'admin') {
          try {
            const apiKeyResponse = await organizationAPI.getApiKey(userData.organizationId);
            setApiKey(apiKeyResponse.data.data.apiKey);
          } catch (err) {
            console.error('Error fetching API key:', err);
            // Not critical, just won't show the API key
          }
        }
      }
      
      setLoading(false);
    } catch (err) {
      console.error('Error fetching user data:', err);
      setError(err.response?.data?.error || 'Failed to fetch user data');
      setLoading(false);
    }
  };

  const handleGeneralChange = (e) => {
    const { name, value, type, checked } = e.target;
    setGeneralSettings({
      ...generalSettings,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  const handleSecurityChange = (e) => {
    const { name, value, type, checked } = e.target;
    setSecuritySettings({
      ...securitySettings,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  const handleRangeChange = (e) => {
    setGeneralSettings({
      ...generalSettings,
      [e.target.name]: parseFloat(e.target.value)
    });
  };

  const handleSaveSettings = async () => {
    try {
      setLoading(true);
      
      if (!organization) {
        throw new Error('No organization found');
      }
      
      // Prepare the data to update
      const updateData = {
        name: generalSettings.organizationName,
        settings: {
          theme: generalSettings.darkMode ? 'dark' : 'light',
          dataRetentionDays: parseInt(generalSettings.dataRetentionDays),
          notificationSettings: {
            email: {
              enabled: generalSettings.emailNotifications,
              digestFrequency: 'daily'
            },
            slack: {
              enabled: generalSettings.slackNotifications
            }
          }
        }
      };
      
      // Update the organization
      await organizationAPI.update(organization._id, updateData);
      
      // Refresh the data
      await fetchUserData();
      
      alert('Settings saved successfully');
    } catch (err) {
      console.error('Error saving settings:', err);
      setError(err.response?.data?.error || 'Failed to save settings');
    } finally {
      setLoading(false);
    }
  };

  const generateNewApiKey = async () => {
    try {
      if (!organization) return;
      
      const response = await organizationAPI.getApiKey(organization._id);
      setApiKey(response.data.data.apiKey);
    } catch (err) {
      console.error('Error generating API key:', err);
      setError(err.response?.data?.error || 'Failed to generate API key');
    }
  };

  if (loading && !user) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="spinner-border animate-spin inline-block w-8 h-8 border-4 rounded-full text-blue-500" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  if (error && !user) {
    return (
      <div className="bg-red-900/50 text-red-300 border border-red-500/50 p-4 rounded-lg">
        <p>Error: {error}</p>
        <button 
          onClick={fetchUserData}
          className="mt-2 px-4 py-2 bg-red-800 text-white rounded-lg hover:bg-red-700"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">
          Settings
        </h1>
        <p className="mt-2 text-gray-400">
          Configure your WhisprNet.ai platform settings
        </p>
      </div>

      {/* Settings Tabs */}
      <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-700 shadow-lg overflow-hidden mb-8">
        <div className="border-b border-gray-700">
          <nav className="flex -mb-px">
            <button 
              className={`${activeTab === 'general' ? 'bg-gray-700/50 text-cyan-400 border-b-2 border-cyan-500' : 'text-gray-400 hover:text-gray-300 border-b-2 border-transparent hover:border-gray-600'} py-4 px-6 font-medium text-sm`}
              onClick={() => setActiveTab('general')}
            >
              General
            </button>
            <button 
              className={`${activeTab === 'security' ? 'bg-gray-700/50 text-cyan-400 border-b-2 border-cyan-500' : 'text-gray-400 hover:text-gray-300 border-b-2 border-transparent hover:border-gray-600'} py-4 px-6 font-medium text-sm`}
              onClick={() => setActiveTab('security')}
            >
              Security
            </button>
            <button 
              className={`${activeTab === 'integrations' ? 'bg-gray-700/50 text-cyan-400 border-b-2 border-cyan-500' : 'text-gray-400 hover:text-gray-300 border-b-2 border-transparent hover:border-gray-600'} py-4 px-6 font-medium text-sm`}
              onClick={() => setActiveTab('integrations')}
            >
              Integrations
            </button>
            <button 
              className={`${activeTab === 'api' ? 'bg-gray-700/50 text-cyan-400 border-b-2 border-cyan-500' : 'text-gray-400 hover:text-gray-300 border-b-2 border-transparent hover:border-gray-600'} py-4 px-6 font-medium text-sm`}
              onClick={() => setActiveTab('api')}
            >
              API
            </button>
          </nav>
        </div>

        {/* General Settings */}
        {activeTab === 'general' && (
          <div className="p-6">
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-200 mb-4">General Settings</h3>
                <div className="space-y-4">
                  <div>
                    <label htmlFor="organizationName" className="block text-sm font-medium text-gray-300">
                      Organization Name
                    </label>
                    <input
                      type="text"
                      name="organizationName"
                      id="organizationName"
                      value={generalSettings.organizationName}
                      onChange={handleGeneralChange}
                      className="mt-1 block w-full border-gray-600 rounded-md shadow-sm bg-gray-700 text-gray-200 focus:ring-cyan-500 focus:border-cyan-500 sm:text-sm"
                    />
                  </div>

                  <div>
                    <h4 className="text-sm font-medium text-gray-300 mb-3">Notifications</h4>
                    <div className="space-y-2">
                      <div className="flex items-center">
                        <input
                          id="emailNotifications"
                          name="emailNotifications"
                          type="checkbox"
                          checked={generalSettings.emailNotifications}
                          onChange={handleGeneralChange}
                          className="h-4 w-4 text-cyan-600 focus:ring-cyan-500 border-gray-600 rounded bg-gray-700"
                        />
                        <label htmlFor="emailNotifications" className="ml-2 block text-sm text-gray-300">
                          Email Notifications
                        </label>
                      </div>
                      <div className="flex items-center">
                        <input
                          id="slackNotifications"
                          name="slackNotifications"
                          type="checkbox"
                          checked={generalSettings.slackNotifications}
                          onChange={handleGeneralChange}
                          className="h-4 w-4 text-cyan-600 focus:ring-cyan-500 border-gray-600 rounded bg-gray-700"
                        />
                        <label htmlFor="slackNotifications" className="ml-2 block text-sm text-gray-300">
                          Slack Notifications
                        </label>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label htmlFor="whisperThreshold" className="block text-sm font-medium text-gray-300">
                      Whisper Confidence Threshold: {generalSettings.whisperThreshold}
                    </label>
                    <input
                      type="range"
                      name="whisperThreshold"
                      id="whisperThreshold"
                      min="0.5"
                      max="0.95"
                      step="0.05"
                      value={generalSettings.whisperThreshold}
                      onChange={handleRangeChange}
                      className="mt-1 block w-full accent-cyan-500"
                    />
                    <div className="flex justify-between text-xs text-gray-400 mt-1">
                      <span>More Whispers (0.5)</span>
                      <span>More Accurate (0.95)</span>
                    </div>
                  </div>

                  <div>
                    <label htmlFor="dataRetentionDays" className="block text-sm font-medium text-gray-300">
                      Data Retention (days)
                    </label>
                    <select
                      id="dataRetentionDays"
                      name="dataRetentionDays"
                      value={generalSettings.dataRetentionDays}
                      onChange={handleGeneralChange}
                      className="mt-1 block w-full py-2 px-3 border border-gray-600 bg-gray-700 rounded-md shadow-sm focus:outline-none focus:ring-cyan-500 focus:border-cyan-500 text-gray-200 sm:text-sm"
                    >
                      <option value="30">30 days</option>
                      <option value="60">60 days</option>
                      <option value="90">90 days</option>
                      <option value="180">180 days</option>
                      <option value="365">365 days</option>
                    </select>
                  </div>

                  <div>
                    <div className="flex items-center justify-between">
                      <label htmlFor="darkMode" className="text-sm font-medium text-gray-300">
                        Dark Mode
                      </label>
                      <div className="relative inline-block w-12 h-6 transition duration-200 ease-in-out">
                        <input
                          type="checkbox"
                          id="darkMode"
                          name="darkMode"
                          className="opacity-0 absolute w-0 h-0"
                          checked={generalSettings.darkMode}
                          onChange={handleGeneralChange}
                        />
                        <label
                          htmlFor="darkMode"
                          className={`block overflow-hidden h-6 rounded-full bg-gray-700 cursor-pointer ${
                            generalSettings.darkMode ? "bg-cyan-600" : ""
                          }`}
                        >
                          <span
                            className={`block h-6 w-6 rounded-full bg-white shadow transform transition ease-in-out duration-200 ${
                              generalSettings.darkMode ? "translate-x-6" : "translate-x-0"
                            }`}
                          ></span>
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-5 border-t border-gray-700">
                <div className="flex justify-end">
                  <button
                    type="button"
                    className="bg-gray-800 py-2 px-4 border border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-300 hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-500 focus:ring-offset-gray-900 mr-3"
                    onClick={fetchUserData}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-500 focus:ring-offset-gray-900"
                    onClick={handleSaveSettings}
                    disabled={loading}
                  >
                    {loading ? 'Saving...' : 'Save Settings'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Security Settings - Just skeleton, not connected to API */}
        {activeTab === 'security' && (
          <div className="p-6">
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-200 mb-4">Security Settings</h3>
                <div className="space-y-4">
                  <div className="flex items-center">
                    <input
                      id="twoFactorAuth"
                      name="twoFactorAuth"
                      type="checkbox"
                      checked={securitySettings.twoFactorAuth}
                      onChange={handleSecurityChange}
                      className="h-4 w-4 text-cyan-600 focus:ring-cyan-500 border-gray-600 rounded bg-gray-700"
                    />
                    <label htmlFor="twoFactorAuth" className="ml-2 block text-sm text-gray-300">
                      Enable Two-Factor Authentication
                    </label>
                  </div>
                  
                  <div>
                    <label htmlFor="sessionTimeout" className="block text-sm font-medium text-gray-300">
                      Session Timeout (minutes)
                    </label>
                    <input
                      type="number"
                      name="sessionTimeout"
                      id="sessionTimeout"
                      value={securitySettings.sessionTimeout}
                      onChange={handleSecurityChange}
                      min="15"
                      max="240"
                      className="mt-1 block w-full border-gray-600 rounded-md shadow-sm bg-gray-700 text-gray-200 focus:ring-cyan-500 focus:border-cyan-500 sm:text-sm"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* API Keys Section */}
      {(activeTab === 'api' || activeTab === 'general') && (
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-700 shadow-lg overflow-hidden">
          <div className="px-4 py-5 sm:px-6 border-b border-gray-700">
            <h3 className="text-lg leading-6 font-medium text-gray-200">
              API Keys
            </h3>
            <p className="mt-1 max-w-2xl text-sm text-gray-400">
              Manage API keys for programmatic access to the WhisprNet.ai platform
            </p>
          </div>
          <div className="bg-gray-800/70 px-4 py-5 sm:px-6">
            {apiKey ? (
              <div className="flex items-center justify-between mb-4">
                <div>
                  <span className="font-mono text-sm text-gray-300 bg-gray-700 px-2 py-1 rounded border border-gray-600">
                    {apiKey.substring(0, 8)}*************{apiKey.substring(apiKey.length - 4)}
                  </span>
                  <span className="ml-2 text-xs text-gray-400">Created: {organization ? new Date(organization.createdAt).toLocaleDateString() : 'Unknown'}</span>
                </div>
                <div>
                  <button
                    className="text-red-400 hover:text-red-300 text-sm font-medium"
                    onClick={() => setApiKey(null)}
                  >
                    Revoke
                  </button>
                </div>
              </div>
            ) : (
              <p className="text-gray-400 mb-4">No API key available. Generate a new one to get started.</p>
            )}
            <button
              className="mt-2 inline-flex items-center px-3 py-2 border border-gray-600 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-300 bg-gray-800 hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-500"
              onClick={generateNewApiKey}
            >
              Generate New API Key
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Settings; 