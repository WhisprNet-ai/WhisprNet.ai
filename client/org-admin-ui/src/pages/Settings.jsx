import React, { useState, useEffect } from 'react';
import { organizationAPI, userAPI } from '../services/api';
import { useOrganization } from '../context/OrganizationContext';

const Settings = () => {
  const organization = useOrganization();
  const [settings, setSettings] = useState({
    organizationName: '',
    adminEmail: '',
    notificationsEnabled: true,
    emailDigest: 'daily',
    accessControl: 'team-leads',
    auditLogs: true,
    dataRetentionDays: 90,
    theme: 'dark'
  });
  
  const [subscription, setSubscription] = useState({
    plan: 'free',
    status: 'active',
    renewalDate: '',
    paymentMethod: {
      type: 'card',
      last4: '',
      expiry: ''
    }
  });

  const [activeTab, setActiveTab] = useState('general');
  const [loading, setLoading] = useState({
    settings: true,
    subscription: true
  });
  const [error, setError] = useState({
    settings: null,
    subscription: null,
    saveSettings: null
  });
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    // Fetch organization settings
    const fetchOrganizationSettings = async () => {
      try {
        setLoading(prev => ({ ...prev, settings: true }));
        
        const settingsResponse = await organizationAPI.getSettings();
        if (settingsResponse.data && settingsResponse.data.success) {
          setSettings(prev => ({
            ...prev,
            ...settingsResponse.data.data
          }));
        } else if (!organization.isLoading) {
          // Use organization name from context if API fails
          setSettings(prev => ({
            ...prev,
            organizationName: organization.name
          }));
        }
        
        setLoading(prev => ({ ...prev, settings: false }));
      } catch (err) {
        console.error('Error fetching organization settings:', err);
        setError(prev => ({
          ...prev,
          settings: 'Failed to load organization settings'
        }));
        
        // Use organization name from context if API fails
        if (!organization.isLoading) {
          setSettings(prev => ({
            ...prev,
            organizationName: organization.name
          }));
        }
        
        setLoading(prev => ({ ...prev, settings: false }));
      }
    };
    
    // Fetch subscription information
    const fetchSubscription = async () => {
      try {
        setLoading(prev => ({ ...prev, subscription: true }));
        
        const subscriptionResponse = await organizationAPI.getSubscription();
        if (subscriptionResponse.data && subscriptionResponse.data.success) {
          setSubscription(subscriptionResponse.data.data);
        }
        
        setLoading(prev => ({ ...prev, subscription: false }));
      } catch (err) {
        console.error('Error fetching subscription info:', err);
        setError(prev => ({
          ...prev,
          subscription: 'Failed to load subscription information'
        }));
        setLoading(prev => ({ ...prev, subscription: false }));
      }
    };
    
    fetchOrganizationSettings();
    fetchSubscription();
  }, [organization.isLoading, organization.name]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setSettings({
      ...settings,
      [name]: type === 'checkbox' ? checked : value
    });
    
    // Clear any previous success/error messages
    setSaveSuccess(false);
    setError(prev => ({ ...prev, saveSettings: null }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    setSaveSuccess(false);
    setError(prev => ({ ...prev, saveSettings: null }));
    
    try {
      // Send updated settings to the backend
      const response = await organizationAPI.updateSettings(settings);
      
      if (response.data && response.data.success) {
        setSaveSuccess(true);
        // Update the settings with any normalized values from the backend
        if (response.data.data) {
          setSettings(prev => ({
            ...prev,
            ...response.data.data
          }));
        }
      } else {
        setError(prev => ({
          ...prev,
          saveSettings: response.data?.error || 'Failed to save settings'
        }));
      }
    } catch (err) {
      console.error('Error saving settings:', err);
      setError(prev => ({
        ...prev,
        saveSettings: err.response?.data?.error || 'An error occurred while saving settings'
      }));
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancelSubscription = async () => {
    if (window.confirm('Are you sure you want to cancel your subscription? This action cannot be undone.')) {
      try {
        await organizationAPI.cancelSubscription();
        // Update subscription state to reflect cancellation
        setSubscription(prev => ({
          ...prev,
          status: 'cancelled'
        }));
      } catch (err) {
        console.error('Error cancelling subscription:', err);
        alert('Failed to cancel subscription. Please try again or contact support.');
      }
    }
  };

  const TabButton = ({ id, label }) => (
    <button
      onClick={() => setActiveTab(id)}
      className={`px-4 py-2 border-b-2 ${
        activeTab === id 
          ? 'border-primary-500 text-primary-400' 
          : 'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-700'
      }`}
    >
      {label}
    </button>
  );

  // Loading skeleton for form elements
  const FormSkeleton = () => (
    <div className="animate-pulse space-y-6">
      <div className="h-8 bg-gray-700 rounded w-1/3 mb-2"></div>
      <div className="space-y-3">
        <div className="h-10 bg-gray-700 rounded w-full"></div>
        <div className="h-10 bg-gray-700 rounded w-full"></div>
      </div>
    </div>
  );

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">
          Settings
        </h1>
        <p className="mt-2 text-gray-400">
          Configure your organization's settings and preferences.
        </p>
      </div>

      {/* Settings Tabs */}
      <div className="border-b border-gray-700 mb-6">
        <div className="flex space-x-4">
          <TabButton id="general" label="General" />
          <TabButton id="notifications" label="Notifications" />
          <TabButton id="security" label="Security" />
          <TabButton id="billing" label="Billing" />
        </div>
      </div>

      {/* Settings Forms */}
      <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden shadow-lg">
        <div className="p-6 space-y-6">
          {/* General Settings */}
          {activeTab === 'general' && (
            <>
              {loading.settings ? (
                <FormSkeleton />
              ) : error.settings ? (
                <div className="p-4 rounded-lg bg-red-900/20 border border-red-700/50 text-red-400">
                  {error.settings}
                </div>
              ) : (
                <form onSubmit={handleSubmit}>
                  <div className="space-y-6">
                    <h2 className="text-xl font-semibold text-white">Organization Settings</h2>
                    
                    {saveSuccess && (
                      <div className="p-3 rounded-lg bg-green-900/20 border border-green-700/50 text-green-400">
                        Settings updated successfully
                      </div>
                    )}
                    
                    {error.saveSettings && (
                      <div className="p-3 rounded-lg bg-red-900/20 border border-red-700/50 text-red-400">
                        {error.saveSettings}
                      </div>
                    )}
                    
                    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                      <div>
                        <label className="block text-sm font-medium text-gray-400 mb-1">
                          Organization Name
                        </label>
                        <input
                          type="text"
                          name="organizationName"
                          value={settings.organizationName}
                          onChange={handleChange}
                          className="w-full px-3 py-2 rounded-md bg-gray-700 border border-gray-600 text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-400 mb-1">
                          Admin Email
                        </label>
                        <input
                          type="email"
                          name="adminEmail"
                          value={settings.adminEmail}
                          onChange={handleChange}
                          className="w-full px-3 py-2 rounded-md bg-gray-700 border border-gray-600 text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-1">
                        Interface Theme
                      </label>
                      <select
                        name="theme"
                        value={settings.theme}
                        onChange={handleChange}
                        className="w-full md:w-1/3 px-3 py-2 rounded-md bg-gray-700 border border-gray-600 text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                      >
                        <option value="dark">Dark</option>
                        <option value="light">Light</option>
                        <option value="system">System Default</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-1">
                        Data Retention (days)
                      </label>
                      <input
                        type="number"
                        name="dataRetentionDays"
                        value={settings.dataRetentionDays}
                        onChange={handleChange}
                        className="w-full md:w-1/3 px-3 py-2 rounded-md bg-gray-700 border border-gray-600 text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                        min="30"
                        max="365"
                      />
                      <p className="mt-1 text-xs text-gray-400">
                        Processed data will be automatically removed after this many days.
                      </p>
                    </div>

                    <div className="pt-4 border-t border-gray-700 flex justify-end">
                      <button
                        type="submit"
                        disabled={isSaving}
                        className={`px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-500 transition-colors ${
                          isSaving ? 'opacity-70 cursor-not-allowed' : ''
                        }`}
                      >
                        {isSaving ? 'Saving...' : 'Save Changes'}
                      </button>
                    </div>
                  </div>
                </form>
              )}
            </>
          )}

          {/* Notifications Settings */}
          {activeTab === 'notifications' && (
            <>
              {loading.settings ? (
                <FormSkeleton />
              ) : error.settings ? (
                <div className="p-4 rounded-lg bg-red-900/20 border border-red-700/50 text-red-400">
                  {error.settings}
                </div>
              ) : (
                <form onSubmit={handleSubmit}>
                  <div className="space-y-6">
                    <h2 className="text-xl font-semibold text-white">Notification Preferences</h2>
                    
                    {saveSuccess && (
                      <div className="p-3 rounded-lg bg-green-900/20 border border-green-700/50 text-green-400">
                        Settings updated successfully
                      </div>
                    )}
                    
                    {error.saveSettings && (
                      <div className="p-3 rounded-lg bg-red-900/20 border border-red-700/50 text-red-400">
                        {error.saveSettings}
                      </div>
                    )}
                    
                    <div className="space-y-4">
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          id="notificationsEnabled"
                          name="notificationsEnabled"
                          checked={settings.notificationsEnabled}
                          onChange={handleChange}
                          className="h-4 w-4 text-primary-600 rounded border-gray-500 focus:ring-primary-500"
                        />
                        <label htmlFor="notificationsEnabled" className="ml-2 text-sm text-gray-300">
                          Enable email notifications
                        </label>
                      </div>

                      {settings.notificationsEnabled && (
                        <div className="pl-6 space-y-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-400 mb-1">
                              Email Digest Frequency
                            </label>
                            <select
                              name="emailDigest"
                              value={settings.emailDigest}
                              onChange={handleChange}
                              className="w-full md:w-1/3 px-3 py-2 rounded-md bg-gray-700 border border-gray-600 text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                            >
                              <option value="real-time">Real-time</option>
                              <option value="daily">Daily</option>
                              <option value="weekly">Weekly</option>
                              <option value="never">Never</option>
                            </select>
                          </div>

                          <fieldset className="space-y-3">
                            <legend className="text-sm font-medium text-gray-400">Notification Types</legend>
                            {['Integration status changes', 'New data processed', 'System alerts', 'Team member activity'].map((type) => (
                              <div key={type} className="flex items-center">
                                <input
                                  type="checkbox"
                                  id={`notify-${type.toLowerCase().replace(/\s+/g, '-')}`}
                                  checked={true}
                                  className="h-4 w-4 text-primary-600 rounded border-gray-500 focus:ring-primary-500"
                                />
                                <label htmlFor={`notify-${type.toLowerCase().replace(/\s+/g, '-')}`} className="ml-2 text-sm text-gray-300">
                                  {type}
                                </label>
                              </div>
                            ))}
                          </fieldset>
                        </div>
                      )}
                    </div>

                    <div className="pt-4 border-t border-gray-700 flex justify-end">
                      <button
                        type="submit"
                        disabled={isSaving}
                        className={`px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-500 transition-colors ${
                          isSaving ? 'opacity-70 cursor-not-allowed' : ''
                        }`}
                      >
                        {isSaving ? 'Saving...' : 'Save Changes'}
                      </button>
                    </div>
                  </div>
                </form>
              )}
            </>
          )}

          {/* Security Settings */}
          {activeTab === 'security' && (
            <>
              {loading.settings ? (
                <FormSkeleton />
              ) : error.settings ? (
                <div className="p-4 rounded-lg bg-red-900/20 border border-red-700/50 text-red-400">
                  {error.settings}
                </div>
              ) : (
                <form onSubmit={handleSubmit}>
                  <div className="space-y-6">
                    <h2 className="text-xl font-semibold text-white">Security Settings</h2>
                    
                    {saveSuccess && (
                      <div className="p-3 rounded-lg bg-green-900/20 border border-green-700/50 text-green-400">
                        Settings updated successfully
                      </div>
                    )}
                    
                    {error.saveSettings && (
                      <div className="p-3 rounded-lg bg-red-900/20 border border-red-700/50 text-red-400">
                        {error.saveSettings}
                      </div>
                    )}
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-1">
                        Integration Access Control
                      </label>
                      <select
                        name="accessControl"
                        value={settings.accessControl}
                        onChange={handleChange}
                        className="w-full md:w-1/2 px-3 py-2 rounded-md bg-gray-700 border border-gray-600 text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                      >
                        <option value="admin-only">Admin Only</option>
                        <option value="team-leads">Team Leads & Admins</option>
                        <option value="all-members">All Team Members</option>
                      </select>
                      <p className="mt-1 text-xs text-gray-400">
                        Controls who can create and manage integrations
                      </p>
                    </div>

                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="auditLogs"
                        name="auditLogs"
                        checked={settings.auditLogs}
                        onChange={handleChange}
                        className="h-4 w-4 text-primary-600 rounded border-gray-500 focus:ring-primary-500"
                      />
                      <label htmlFor="auditLogs" className="ml-2 text-sm text-gray-300">
                        Enable audit logs for integration activities
                      </label>
                    </div>

                    <div className="pt-4 space-y-4">
                      <button
                        type="button"
                        className="px-4 py-2 bg-red-600/20 text-red-400 border border-red-600/30 rounded-md hover:bg-red-600/30"
                      >
                        Revoke All API Keys
                      </button>
                      <p className="text-xs text-gray-400">
                        This will immediately disconnect all integrations. You'll need to reconnect each service manually.
                      </p>
                    </div>

                    <div className="pt-4 border-t border-gray-700 flex justify-end">
                      <button
                        type="submit"
                        disabled={isSaving}
                        className={`px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-500 transition-colors ${
                          isSaving ? 'opacity-70 cursor-not-allowed' : ''
                        }`}
                      >
                        {isSaving ? 'Saving...' : 'Save Changes'}
                      </button>
                    </div>
                  </div>
                </form>
              )}
            </>
          )}

          {/* Billing Settings */}
          {activeTab === 'billing' && (
            <>
              {loading.subscription ? (
                <FormSkeleton />
              ) : error.subscription ? (
                <div className="p-4 rounded-lg bg-red-900/20 border border-red-700/50 text-red-400">
                  {error.subscription}
                </div>
              ) : (
                <div className="space-y-6">
                  <h2 className="text-xl font-semibold text-white">Billing Information</h2>
                  
                  <div className="p-4 bg-gray-750 rounded-lg border border-gray-700">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-white font-medium">{subscription.plan === 'free' ? 'Free Plan' : `${subscription.plan.charAt(0).toUpperCase() + subscription.plan.slice(1)} Plan`}</h3>
                        {subscription.plan !== 'free' && (
                          <p className="text-sm text-gray-400">
                            {subscription.plan === 'basic' ? '$49/month' : 
                             subscription.plan === 'professional' ? '$99/month' : 
                             subscription.plan === 'enterprise' ? 'Custom pricing' : 
                             'Contact sales for pricing'}
                            {subscription.billingCycle === 'annually' ? ', billed annually' : ', billed monthly'}
                          </p>
                        )}
                      </div>
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        subscription.status === 'active' ? 'bg-green-900/30 text-green-400 border border-green-700/50' :
                        subscription.status === 'trialing' ? 'bg-blue-900/30 text-blue-400 border border-blue-700/50' :
                        subscription.status === 'cancelled' ? 'bg-red-900/30 text-red-400 border border-red-700/50' :
                        'bg-gray-700/30 text-gray-400 border border-gray-600/50'
                      }`}>
                        {subscription.status.charAt(0).toUpperCase() + subscription.status.slice(1)}
                      </span>
                    </div>
                    {subscription.renewalDate && (
                      <div className="mt-4 text-sm text-gray-300">
                        <p>Your subscription renews on: <span className="text-white">{new Date(subscription.renewalDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</span></p>
                      </div>
                    )}
                    <div className="mt-4 flex space-x-3">
                      <button 
                        className="px-3 py-1 text-sm bg-gray-700 hover:bg-gray-650 text-white rounded"
                        onClick={() => alert('This feature is coming soon!')}
                      >
                        Change Plan
                      </button>
                      <button 
                        className="px-3 py-1 text-sm bg-transparent border border-gray-600 text-gray-400 hover:text-white hover:border-gray-400 rounded"
                        onClick={() => alert('This feature is coming soon!')}
                      >
                        View Invoices
                      </button>
                    </div>
                  </div>

                  {subscription.paymentMethod && subscription.paymentMethod.last4 && (
                    <div>
                      <h3 className="text-lg font-medium text-white mb-3">Payment Method</h3>
                      <div className="flex items-center p-3 border border-gray-700 rounded-lg bg-gray-750 text-white">
                        <div className="mr-3 p-2 bg-blue-900/20 rounded">
                          <svg className="h-6 w-6 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                          </svg>
                        </div>
                        <div>
                          <div className="font-medium">{subscription.paymentMethod.type === 'card' ? 'Credit Card' : 'Payment Method'} ending in {subscription.paymentMethod.last4}</div>
                          {subscription.paymentMethod.expiry && (
                            <div className="text-sm text-gray-400">Expires {subscription.paymentMethod.expiry}</div>
                          )}
                        </div>
                        <button 
                          className="ml-auto text-primary-400 hover:text-primary-300 text-sm"
                          onClick={() => alert('This feature is coming soon!')}
                        >
                          Edit
                        </button>
                      </div>
                    </div>
                  )}

                  {subscription.status === 'active' && subscription.plan !== 'free' && (
                    <div className="pt-6 border-t border-gray-700 text-right">
                      <button 
                        className="px-4 py-2 bg-red-600/20 text-red-400 border border-red-600/30 rounded-md hover:bg-red-600/30 text-sm"
                        onClick={handleCancelSubscription}
                      >
                        Cancel Subscription
                      </button>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Settings; 