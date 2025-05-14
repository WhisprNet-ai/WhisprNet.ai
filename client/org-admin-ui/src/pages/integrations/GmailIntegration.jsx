import React, { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { integrationAPI } from '../../services/api';

const GmailIntegration = () => {
  const { organizationId } = useParams();
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [integration, setIntegration] = useState(null);
  const [settings, setSettings] = useState({
    labels: ['INBOX', 'IMPORTANT'],
    syncFrequency: 'hourly',
    syncAttachments: true,
    includeSpam: false,
    maxEmailsPerSync: 100,
    maxHistoryDays: 30
  });
  const [showConnectModal, setShowConnectModal] = useState(false);
  const [availableLabels, setAvailableLabels] = useState([]);

  useEffect(() => {
    // Fetch Gmail integration on component mount
    const fetchIntegration = async () => {
      try {
        setIsLoading(true);
        
        // Get all integrations first
        const response = await integrationAPI.getAll(organizationId);
        const gmailIntegration = response.data.data.find(i => 
          i.type === 'email' && 
          i.metadata && 
          i.metadata.provider === 'gmail'
        );
        
        if (gmailIntegration) {
          setIntegration(gmailIntegration);
          setIsConnected(gmailIntegration.status === 'active');
          
          // If integration is active, get labels
          if (gmailIntegration.status === 'active') {
            await fetchLabels(gmailIntegration._id);
            
            // If integration has metadata with settings, use those
            if (gmailIntegration.metadata && gmailIntegration.metadata.settings) {
              setSettings(prev => ({
                ...prev,
                ...gmailIntegration.metadata.settings
              }));
            }
          }
        }
      } catch (err) {
        console.error('Error fetching Gmail integration:', err);
        setError('Failed to load Gmail integration details');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchIntegration();
  }, [organizationId]);

  const fetchLabels = async (integrationId) => {
    try {
      // This endpoint would need to be implemented in your backend
      const response = await integrationAPI.getById(organizationId, integrationId);
      
      // Extract labels from integration metadata
      if (response.data.data.metadata && response.data.data.metadata.labels) {
        setAvailableLabels(response.data.data.metadata.labels);
      } else {
        // Fallback to static data if not available
        setAvailableLabels([
          { id: 'INBOX', name: 'Inbox' },
          { id: 'SENT', name: 'Sent' },
          { id: 'IMPORTANT', name: 'Important' },
          { id: 'TRASH', name: 'Trash' },
          { id: 'SPAM', name: 'Spam' },
          { id: 'STARRED', name: 'Starred' },
          { id: 'DRAFT', name: 'Drafts' },
          { id: 'CATEGORY_PERSONAL', name: 'Personal' },
          { id: 'CATEGORY_SOCIAL', name: 'Social' },
          { id: 'CATEGORY_PROMOTIONS', name: 'Promotions' },
          { id: 'CATEGORY_UPDATES', name: 'Updates' },
          { id: 'CATEGORY_FORUMS', name: 'Forums' }
        ]);
      }
    } catch (err) {
      console.error('Error fetching Gmail labels:', err);
      setError('Failed to load Gmail labels');
    }
  };

  const handleToggleConnection = async () => {
    if (isConnected) {
      // If connected, disconnect by updating the integration status to inactive
      try {
        if (integration) {
          await integrationAPI.update(organizationId, integration._id, {
            status: 'inactive'
          });
          setIsConnected(false);
        }
      } catch (err) {
        console.error('Error disconnecting Gmail:', err);
        setError('Failed to disconnect Gmail integration');
      }
    } else {
      // If not connected, show the connect modal
      setShowConnectModal(true);
    }
  };

  const handleSettingChange = (e) => {
    const { name, value, type, checked } = e.target;
    setSettings({
      ...settings,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  const handleLabelToggle = (labelId) => {
    const currentLabels = [...settings.labels];
    
    if (currentLabels.includes(labelId)) {
      setSettings({
        ...settings,
        labels: currentLabels.filter(l => l !== labelId)
      });
    } else {
      setSettings({
        ...settings,
        labels: [...currentLabels, labelId]
      });
    }
  };

  const saveSettings = async () => {
    try {
      if (integration) {
        await integrationAPI.update(organizationId, integration._id, {
          metadata: {
            ...integration.metadata,
            settings
          }
        });
        alert('Settings saved successfully!');
      }
    } catch (err) {
      console.error('Error saving settings:', err);
      setError('Failed to save settings');
    }
  };

  const handleConnectWithGmail = async () => {
    try {
      // Create a new integration if none exists
      if (!integration) {
        const createResponse = await integrationAPI.create(organizationId, {
          type: 'email',
          name: 'Gmail Integration',
          metadata: {
            provider: 'gmail'
          }
        });
        
        const newIntegration = createResponse.data.data;
        setIntegration(newIntegration);
        
        // Redirect to Gmail OAuth page
        const oauthUrl = integrationAPI.getOAuthUrl(organizationId, 'gmail', newIntegration._id);
        window.location.href = oauthUrl;
      } else {
        // Use existing integration
        const oauthUrl = integrationAPI.getOAuthUrl(organizationId, 'gmail', integration._id);
        window.location.href = oauthUrl;
      }
    } catch (err) {
      console.error('Error connecting to Gmail:', err);
      setError('Failed to initiate Gmail connection');
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-600/20 border border-red-700 text-red-200 p-4 rounded-lg">
        <h3 className="text-lg font-medium">Error</h3>
        <p>{error}</p>
        <button 
          onClick={() => window.location.reload()}
          className="mt-2 px-4 py-2 bg-red-700 text-white rounded-md hover:bg-red-600 transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between">
        <div>
          <div className="flex items-center">
            <Link to="/integrations" className="mr-4 text-gray-400 hover:text-white">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
              </svg>
            </Link>
            <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-red-400 to-pink-500">
              Gmail Integration
            </h1>
          </div>
          <p className="mt-2 text-gray-400">
            Connect WhisprNet.ai to your Gmail account to analyze emails and extract insights.
          </p>
        </div>
        <div className="mt-4 md:mt-0">
          <button
            onClick={handleToggleConnection}
            className={`px-4 py-2 rounded-md mr-3 ${
              isConnected 
                ? 'bg-red-600/20 text-red-400 border border-red-600/30 hover:bg-red-600/30'
                : 'bg-green-600/20 text-green-400 border border-green-600/30 hover:bg-green-600/30'
            }`}
          >
            {isConnected ? 'Disconnect' : 'Connect'}
          </button>
          <button
            onClick={saveSettings}
            className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-500 transition-colors"
            disabled={!isConnected}
          >
            Save Settings
          </button>
        </div>
      </div>

      {!isConnected ? (
        <div className="bg-gray-800 rounded-lg border border-gray-700 p-6 text-center">
          <div className="text-5xl mb-4">📧</div>
          <h2 className="text-xl font-semibold text-white mb-2">Connect Your Gmail Account</h2>
          <p className="text-gray-400 max-w-2xl mx-auto mb-6">
            WhisprNet.ai integrates with Gmail to analyze your emails, track important information, and provide AI-powered insights.
            Your emails are securely processed and we only access the data you specify below.
          </p>
          <button
            onClick={() => setShowConnectModal(true)}
            className="px-6 py-3 bg-primary-600 text-white rounded-md hover:bg-primary-500 transition-colors"
          >
            Connect Gmail
          </button>
        </div>
      ) : (
        <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden shadow-lg">
          <div className="p-4 bg-gray-750 border-b border-gray-700">
            <h2 className="text-xl font-semibold text-white">Gmail Integration Settings</h2>
          </div>
          
          <div className="p-6 space-y-6">
            {/* Connection Status */}
            <div className="pb-6 border-b border-gray-700">
              <div className="flex items-center">
                <div className="h-10 w-10 rounded-full bg-green-900/30 flex items-center justify-center">
                  <svg className="h-6 w-6 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-medium text-white">Connected to Gmail</h3>
                  <p className="text-sm text-gray-400">
                    {integration?.credentials?.emailAddress || 'Gmail Account'}
                  </p>
                </div>
                <button 
                  onClick={() => setShowConnectModal(true)} 
                  className="ml-auto text-primary-400 hover:text-primary-300"
                >
                  Update Connection
                </button>
              </div>
            </div>
            
            {/* Labels Selection */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-white">Email Settings</h3>
              
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-3">
                  Select Labels to Monitor
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {availableLabels.map((label) => (
                    <div key={label.id} className="flex items-center p-3 border border-gray-700 rounded-lg bg-gray-750">
                      <input
                        type="checkbox"
                        id={`label-${label.id}`}
                        checked={settings.labels.includes(label.id)}
                        onChange={() => handleLabelToggle(label.id)}
                        className="h-4 w-4 text-primary-600 rounded border-gray-500 focus:ring-primary-500"
                      />
                      <label htmlFor={`label-${label.id}`} className="ml-2 text-sm text-gray-300 flex-1">
                        {label.name}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">
                    Sync Frequency
                  </label>
                  <select
                    name="syncFrequency"
                    value={settings.syncFrequency}
                    onChange={handleSettingChange}
                    className="w-full px-3 py-2 rounded-md bg-gray-700 border border-gray-600 text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="realtime">Push updates (when available)</option>
                    <option value="hourly">Hourly</option>
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">
                    History Limit (days)
                  </label>
                  <input
                    type="number"
                    name="maxHistoryDays"
                    value={settings.maxHistoryDays}
                    onChange={handleSettingChange}
                    className="w-full px-3 py-2 rounded-md bg-gray-700 border border-gray-600 text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                    min="1"
                    max="90"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">
                  Max Emails Per Sync
                </label>
                <input
                  type="number"
                  name="maxEmailsPerSync"
                  value={settings.maxEmailsPerSync}
                  onChange={handleSettingChange}
                  className="w-full px-3 py-2 rounded-md bg-gray-700 border border-gray-600 text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                  min="10"
                  max="1000"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Maximum number of emails to process in each sync
                </p>
              </div>
              
              <div className="space-y-3">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="syncAttachments"
                    name="syncAttachments"
                    checked={settings.syncAttachments}
                    onChange={handleSettingChange}
                    className="h-4 w-4 text-primary-600 rounded border-gray-500 focus:ring-primary-500"
                  />
                  <label htmlFor="syncAttachments" className="ml-2 text-sm text-gray-300">
                    Analyze email attachments
                  </label>
                </div>
                
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="includeSpam"
                    name="includeSpam"
                    checked={settings.includeSpam}
                    onChange={handleSettingChange}
                    className="h-4 w-4 text-primary-600 rounded border-gray-500 focus:ring-primary-500"
                  />
                  <label htmlFor="includeSpam" className="ml-2 text-sm text-gray-300">
                    Include spam/junk emails
                  </label>
                </div>
              </div>
            </div>
          </div>
          
          <div className="px-6 py-4 bg-gray-750 border-t border-gray-700 flex justify-end">
            <button 
              onClick={saveSettings}
              className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-500 transition-colors"
            >
              Save Settings
            </button>
          </div>
        </div>
      )}

      {/* Connect Modal */}
      {showConnectModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-gray-800 rounded-lg border border-gray-700 shadow-xl max-w-md w-full">
            <div className="px-6 py-4 border-b border-gray-700">
              <h3 className="text-lg font-semibold text-white">Connect to Gmail</h3>
            </div>
            <div className="p-6 space-y-4">
              <p className="text-sm text-gray-400">
                Click the button below to connect WhisprNet.ai to your Gmail account. You'll be redirected to Google to authorize access.
              </p>
              <div className="text-sm text-gray-400 bg-gray-750 p-4 rounded-md border border-gray-600">
                <p className="font-medium text-white mb-2">WhisprNet.ai will request permission to:</p>
                <ul className="list-disc ml-5 text-gray-400">
                  <li>Read your emails (content and metadata)</li>
                  <li>View your email labels</li>
                  <li>Access attachments</li>
                </ul>
                <p className="mt-2">
                  We only use these permissions to analyze your emails and provide insights. We do not modify or delete any of your emails.
                </p>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-700 flex justify-end space-x-3">
              <button 
                className="px-4 py-2 bg-gray-700 text-white rounded-md hover:bg-gray-600 transition-colors"
                onClick={() => setShowConnectModal(false)}
              >
                Cancel
              </button>
              <button 
                className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-500 transition-colors"
                onClick={handleConnectWithGmail}
              >
                Connect with Gmail
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GmailIntegration; 