import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { useOrganization } from '../../context/OrganizationContext';
import api from '../../services/api'; // Import the configured API instance with auth

// Configure axios for this component
axios.defaults.baseURL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

/*
 * IMPORTANT: Backend requirements for this component to work properly:
 * 
 * The backend API now returns only unmasked versions of sensitive credentials:
 * - clientSecret, signingSecret, botToken
 *
 * The frontend component will handle masking and toggling visibility.
 */

// Helper function to mask sensitive data (same as backend)
const maskSensitiveData = (value) => {
  if (!value) return '';
  if (value.length <= 6) return '******'; // If too short, just mask completely
  return `${value.substring(0, 3)}...${value.substring(value.length - 3)}`;
};

const SlackConfig = () => {
  const { orgId } = useParams();
  const navigate = useNavigate();
  const organization = useOrganization(); // Use the organization context
  
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [config, setConfig] = useState({
    clientId: '',
    clientSecret: '',
    signingSecret: '',
    botToken: '',
    // Locally generated masked versions
    clientSecretMasked: '',
    signingSecretMasked: '',
    botTokenMasked: '',
    appName: 'WhisprNet.ai',
    scopes: [
      'channels:history',
      'channels:read',
      'chat:write',
      'emoji:read',
      'reactions:read',
      'team:read',
      'users:read'
    ]
  });
  
  // Track fields being edited
  const [editingField, setEditingField] = useState({
    clientId: false,
    clientSecret: false,
    signingSecret: false,
    botToken: false
  });
  
  // Track which fields should show unmasked data
  const [showUnmasked, setShowUnmasked] = useState({
    clientSecret: false,
    signingSecret: false,
    botToken: false
  });
  
  // Track input types for password fields
  const [inputTypes, setInputTypes] = useState({
    clientSecret: 'password',
    signingSecret: 'password',
    botToken: 'password'
  });
  
  // Track if config exists on the server
  const [configExists, setConfigExists] = useState(false);
  const [hasUnmaskedData, setHasUnmaskedData] = useState(false);
  
  const [verificationStatus, setVerificationStatus] = useState('pending');
  const [isSaving, setIsSaving] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [workspaceName, setWorkspaceName] = useState('');

  // Configure axios
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    }
  }, []);
  
  // Fetch configuration on load
  useEffect(() => {
    if (!orgId) {
      console.error('No organization ID provided');
      setIsLoading(false);
      setError('No organization ID provided');
      return;
    }
    
    // Check if we've previously saved or interacted with this config
    const configKey = `slack_config_exists_${orgId}`;
    const hasInteractedBefore = localStorage.getItem(configKey) === 'true';
    
    // If no prior interaction, assume it's a new setup
    if (!hasInteractedBefore) {
      console.log('No prior interaction detected, assuming new setup');
      // For new setup, don't fetch config, just set all fields to editable
      setIsLoading(false);
      setConfigExists(false);
      setConfig({
        clientId: '',
        clientSecret: '',
        signingSecret: '',
        botToken: '',
        clientSecretMasked: '',
        signingSecretMasked: '',
        botTokenMasked: '',
        appName: 'WhisprNet.ai',
        scopes: [
          'channels:history',
          'channels:read',
          'chat:write',
          'emoji:read',
          'reactions:read',
          'team:read',
          'users:read'
        ]
      });
      // Set all fields to editable for new setup
      setEditingField({
        clientId: true,
        clientSecret: true,
        signingSecret: true,
        botToken: true
      });
      return;
    }
    
    // If we've interacted before, try loading the config
    const fetchConfig = async () => {
      try {
        setIsLoading(true);
        
        const response = await api.get(`/api/organizations/${orgId}/slack`);
        
        if (response.data && response.data.data) {
          const apiData = response.data.data;
          
          // Generate masked versions locally from unmasked data
          const clientSecretMasked = apiData.clientSecret ? maskSensitiveData(apiData.clientSecret) : '';
          const signingSecretMasked = apiData.signingSecret ? maskSensitiveData(apiData.signingSecret) : '';
          const botTokenMasked = apiData.botToken ? maskSensitiveData(apiData.botToken) : '';
          
          // Initialize values from API response
          const updatedConfig = {
            clientId: apiData.clientId || '',
            // Store unmasked values from API
            clientSecret: apiData.clientSecret || '',
            signingSecret: apiData.signingSecret || '',
            botToken: apiData.botToken || '',
            // Store locally generated masked values
            clientSecretMasked,
            signingSecretMasked,
            botTokenMasked,
            appName: apiData.appName || 'WhisprNet.ai',
            scopes: apiData.scopes || [
              'channels:history',
              'channels:read',
              'chat:write',
              'emoji:read',
              'reactions:read',
              'team:read',
              'users:read'
            ]
          };
          
          setConfig(updatedConfig);
          
          // Track that we have unmasked data
          setHasUnmaskedData(!!(apiData.clientSecret || apiData.signingSecret || apiData.botToken));
          
          if (apiData.verificationStatus) {
            setVerificationStatus(apiData.verificationStatus);
          }
          
          // Set connection status
          if (apiData.isConnected) {
            setIsConnected(true);
            setWorkspaceName(apiData.workspaceName || 'Slack Workspace');
          }

          // Clear any previous error if we successfully got data
          setError(null);
          
          // Set configExists to true since we received data
          setConfigExists(true);
        }
      } catch (err) {
        // Handle 404 error (expected if config no longer exists)
        if (err.response && err.response.status === 404) {
          // Clear any previous error - this is an expected condition
          setError(null);
          
          // Set default values for a new configuration
          setConfig({
            clientId: '',
            clientSecret: '',
            signingSecret: '',
            botToken: '',
            clientSecretMasked: '',
            signingSecretMasked: '',
            botTokenMasked: '',
            appName: 'WhisprNet.ai',
            scopes: [
              'channels:history',
              'channels:read',
              'chat:write',
              'emoji:read',
              'reactions:read',
              'team:read',
              'users:read'
            ]
          });
          setVerificationStatus('pending');
          setConfigExists(false);
          
          // Set all fields to editable for new setups
          setEditingField({
            clientId: true,
            clientSecret: true,
            signingSecret: true,
            botToken: true
          });
          
          // Reset the localStorage flag since config doesn't exist anymore
          localStorage.removeItem(configKey);
        } else {
          // Show error for other error types
          setError('Error loading configuration: ' + (err.response?.data?.message || err.message));
        }
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchConfig();
  }, [orgId]);
  
  // Toggle field editing
  const toggleFieldEdit = (fieldName) => {
    setEditingField(prev => ({ 
      ...prev, 
      [fieldName]: !prev[fieldName] 
    }));
    
    // If starting to edit, ensure the input shows the actual value
    if (!editingField[fieldName]) {
      // In case of sensitive fields, show unmasked version
      if (fieldName === 'clientSecret' || fieldName === 'signingSecret' || fieldName === 'botToken') {
        setShowUnmasked(prev => ({ ...prev, [fieldName]: true }));
        setInputTypes(prev => ({ ...prev, [fieldName]: 'text' }));
      }
    } else {
      // If finishing edit, reset view
      if (fieldName === 'clientSecret' || fieldName === 'signingSecret' || fieldName === 'botToken') {
        setShowUnmasked(prev => ({ ...prev, [fieldName]: false }));
        setInputTypes(prev => ({ ...prev, [fieldName]: 'password' }));
      }
    }
  };
  
  // Handle field change
  const handleChange = (e) => {
    const { name, value } = e.target;
    setConfig({ ...config, [name]: value });
  };
  
  // Toggle visibility of sensitive data
  const toggleVisibility = (fieldName) => {
    // Toggle visibility state
    const newVisibility = !showUnmasked[fieldName];
    setShowUnmasked({ ...showUnmasked, [fieldName]: newVisibility });
    
    // Toggle input type between password and text
    setInputTypes({
      ...inputTypes,
      [fieldName]: newVisibility ? 'text' : 'password'
    });
  };
  
  // Get display value for a field based on visibility state
  const getDisplayValue = (fieldName) => {
    // If editing, show the current value
    if (editingField[fieldName]) {
      return config[fieldName] || '';
    }
    
    // If showing unmasked and we have data, show unmasked
    if (showUnmasked[fieldName] && config[fieldName]) {
      return config[fieldName];
    }
    
    // Otherwise show masked version
    return config[`${fieldName}Masked`] || '';
  };
  
  // Handle scope toggle
  const handleScopeChange = (scope) => {
    const updatedScopes = [...config.scopes];
    
    if (updatedScopes.includes(scope)) {
      const idx = updatedScopes.indexOf(scope);
      updatedScopes.splice(idx, 1);
    } else {
      updatedScopes.push(scope);
    }
    
    setConfig({ ...config, scopes: updatedScopes });
  };
  
  // Handle form submission (prevent default form submission)
  const handleFormSubmit = (e) => {
    e.preventDefault(); // Prevent default form submission
    handleSubmit();
  };
  
  // Handle submit for form
  const handleSubmit = async () => {
    if (!config.clientId) {
      setError('Client ID is required');
      return;
    }
    
    setIsSaving(true);
    setError(null);
    setSuccess(null);

    try {
      // Build request data with current config
      const requestData = {
        clientId: config.clientId,
        appName: config.appName,
        scopes: config.scopes
      };
      
      // Include sensitive fields if they've been edited
      if (editingField.clientSecret || (!configExists && config.clientSecret)) {
        requestData.clientSecret = config.clientSecret;
      }
      
      if (editingField.signingSecret || (!configExists && config.signingSecret)) {
        requestData.signingSecret = config.signingSecret;
      }
      
      if (editingField.botToken || (!configExists && config.botToken)) {
        requestData.botToken = config.botToken;
      }
      
      let response;
      if (configExists) {
        response = await api.put(`/api/organizations/${orgId}/slack`, requestData);
      } else {
        response = await api.post(`/api/organizations/${orgId}/slack`, requestData);
      }

      if (response.data && response.data.data) {
        // Update form with unmasked credentials from response
        const respData = response.data.data;
        
        // Generate masked versions from unmasked data
        const clientSecretMasked = respData.clientSecret ? maskSensitiveData(respData.clientSecret) : config.clientSecretMasked;
        const signingSecretMasked = respData.signingSecret ? maskSensitiveData(respData.signingSecret) : config.signingSecretMasked;
        const botTokenMasked = respData.botToken ? maskSensitiveData(respData.botToken) : config.botTokenMasked;
        
        // Update the config with unmasked values from API
        setConfig({
          ...config,
          clientId: respData.clientId || config.clientId,
          // Update unmasked values
          clientSecret: respData.clientSecret || config.clientSecret,
          signingSecret: respData.signingSecret || config.signingSecret,
          botToken: respData.botToken || config.botToken,
          // Update locally generated masked values
          clientSecretMasked,
          signingSecretMasked,
          botTokenMasked,
          appName: respData.appName || config.appName,
          scopes: respData.scopes || config.scopes
        });
        
        // Update unmasked data flag
        setHasUnmaskedData(!!(respData.clientSecret || respData.signingSecret || respData.botToken));
        
        // Set that config now exists
        const wasNewConfig = !configExists;
        setConfigExists(true);
        
        // Set flag in localStorage that we've saved this config
        localStorage.setItem(`slack_config_exists_${orgId}`, 'true');
        
        // Set success message
        setSuccess(configExists ? 
          'Configuration updated successfully' : 
          'Slack configuration created successfully! Your app is now configured.');
        
        // If this was a new configuration, clean up URL by removing the 'new' parameter
        if (wasNewConfig) {
          // Remove 'new=true' from URL without page reload
          const url = new URL(window.location.href);
          url.searchParams.delete('new');
          window.history.replaceState({}, '', url);
        }
        
        // Reset all editing states
        setEditingField({
          clientId: false,
          clientSecret: false,
          signingSecret: false,
          botToken: false
        });
      }
    } catch (err) {
      setError('Failed to save configuration: ' + (err.response?.data?.message || err.message));
    } finally {
      setIsSaving(false);
    }
  };
  
  // Verify credentials
  const handleVerify = async () => {
    if (!config.clientId) {
      setError('Client ID is required for verification');
      return;
    }
    
    setIsVerifying(true);
    setError(null);
    setSuccess(null);
    
    try {
      // Build verification request with client ID
      const requestData = {
        clientId: config.clientId
      };
      
      // Include unmasked credentials if available
      if (hasUnmaskedData) {
        if (config.clientSecret) {
          requestData.clientSecret = config.clientSecret;
        }
        
        if (config.signingSecret) {
          requestData.signingSecret = config.signingSecret;
        }
        
        if (config.botToken) {
          requestData.botToken = config.botToken;
        }
      }
      
      const response = await api.post(`/api/organizations/${orgId}/slack/verify-credentials`, requestData);
      
      if (response.data && response.data.success) {
        setVerificationStatus('verified');
        // Mark as configured in localStorage after verification
        localStorage.setItem(`slack_config_exists_${orgId}`, 'true');
        setSuccess('Credentials verified successfully. Your Slack app configuration is valid. WhisprNet.ai will now be able to process and analyze your Slack data.');
      } else {
        setVerificationStatus('failed');
        setError('Verification failed: ' + (response.data?.message || 'Unknown error'));
      }
    } catch (err) {
      setVerificationStatus('failed');
      setError('Verification failed: ' + (err.response?.data?.message || err.message));
    } finally {
      setIsVerifying(false);
    }
  };
  
  // Replace the SVG icons for eye open and eye closed with simpler versions
  const EyeOpenIcon = () => (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      width="20" 
      height="20" 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    >
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
      <circle cx="12" cy="12" r="3"></circle>
    </svg>
  );
  
  const EyeClosedIcon = () => (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      width="20" 
      height="20" 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    >
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
      <line x1="1" y1="1" x2="23" y2="23"></line>
    </svg>
  );
  
  // Pencil edit icon
  const PencilIcon = () => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path>
    </svg>
  );
  
  // Save/Checkmark icon
  const CheckIcon = () => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="20 6 9 17 4 12"></polyline>
    </svg>
  );
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center">
          <div className="w-16 h-16 border-4 border-t-primary-500 border-r-transparent border-b-transparent border-l-transparent rounded-full animate-spin"></div>
          <p className="mt-4 text-white/70">Loading Slack configuration...</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="pb-12 relative">
      {/* Background Elements */}
      <div className="absolute inset-0 overflow-hidden z-0 pointer-events-none">
        <div className="absolute -top-[10%] -right-[10%] w-[35%] h-[35%] bg-gradient-to-b from-purple-600/10 to-transparent rounded-full blur-3xl"></div>
        <div className="absolute -bottom-[20%] -left-[10%] w-[40%] h-[50%] bg-gradient-to-t from-indigo-600/10 to-transparent rounded-full blur-3xl"></div>
      </div>

      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="relative z-10"
      >
        <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between">
          <div>
            <div className="flex items-center space-x-2">
              <Link to="/integrations" className="group flex items-center text-gray-400 hover:text-primary-400 transition-colors duration-200">
                <motion.div
                  whileHover={{ x: -3 }}
                  transition={{ duration: 0.2 }}
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                  </svg>
                </motion.div>
                <span className="ml-1 text-sm hidden md:inline-block group-hover:translate-x-[-3px] transition-transform duration-200">Back</span>
              </Link>
              <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary-400 to-purple-500">
                Slack Integration
              </h1>
            </div>
            <p className="mt-2 text-gray-400">
              Configure your Slack app and connect your workspace
            </p>
          </div>
        </div>
      </motion.div>

      {/* Connection Status (if connected) */}
      <AnimatePresence>
        {isConnected && (
          <motion.div 
            className="mb-6 p-4 bg-gray-800/80 backdrop-blur-sm rounded-lg border border-gray-700/50 shadow-lg"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <div className="flex items-center">
              <div className="h-10 w-10 rounded-full bg-green-900/30 border border-green-500/30 flex items-center justify-center shadow-lg">
                <svg className="h-5 w-5 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-medium text-white">Connected to Slack</h3>
                <p className="text-sm text-gray-400">
                  {workspaceName}
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Alert Messages */}
      <AnimatePresence>
        {error && (
          <motion.div 
            className="mb-6 p-4 bg-red-900/20 backdrop-blur-sm rounded-lg border border-red-700/50 text-red-200 shadow-lg"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
          >
            <div className="flex">
              <svg className="w-5 h-5 mr-3 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <span>{error}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      <AnimatePresence>
        {success && (
          <motion.div 
            className="mb-6 p-4 bg-green-900/20 backdrop-blur-sm rounded-lg border border-green-700/50 text-green-200 shadow-lg"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
          >
            <div className="flex">
              <svg className="w-5 h-5 mr-3 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{success}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Setup Instructions */}
      <motion.div 
        className="mb-8 p-5 bg-gradient-to-r from-purple-900/30 to-indigo-900/30 backdrop-blur-sm rounded-lg border border-indigo-700/50 text-white shadow-lg relative overflow-hidden"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
      >
        <div className="absolute -top-10 -right-10 w-40 h-40 bg-purple-500/10 rounded-full blur-3xl z-0"></div>
        
        <h3 className="text-xl font-semibold mb-3 relative z-10 flex items-center">
          <svg className="w-6 h-6 mr-2 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Slack App Setup Instructions
        </h3>
        
        <ol className="list-decimal pl-6 space-y-2 text-gray-200 relative z-10">
          <li>Create a Slack app at <a href="https://api.slack.com/apps" className="text-indigo-300 hover:text-indigo-200 hover:underline" target="_blank" rel="noopener noreferrer">https://api.slack.com/apps</a></li>
          <li>Enter the <strong className="text-indigo-300">App Credentials</strong> below</li>
          <li>Install the app to your workspace and get the <strong className="text-indigo-300">Bot Token</strong> (starts with xoxb-)</li>
          <li>Add the required <strong className="text-indigo-300">Bot Token Scopes</strong> to your Slack App</li>
        </ol>
      </motion.div>
      
      {/* Slack App Configuration Form */}
      <motion.div 
        className="bg-gray-800/80 backdrop-blur-sm rounded-lg border border-gray-700/50 shadow-lg overflow-hidden"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.2 }}
      >
        <div className="p-6">
          <h2 className="text-xl font-bold mb-6 text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-500">
            Slack App Configuration
          </h2>
          <form onSubmit={handleFormSubmit} className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Client ID */}
              <div className="relative">
                <label className="block text-sm font-medium text-gray-400 mb-1">
                  Client ID
                </label>
                <div className="relative group">
                  <input
                    type="text"
                    name="clientId"
                    className={`w-full px-4 py-3 rounded-md bg-gray-700/50 border ${editingField.clientId ? 'border-primary-500' : 'border-gray-600'} text-white focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all duration-200 ${!editingField.clientId && 'cursor-not-allowed'}`}
                    value={editingField.clientId ? config.clientId : config.clientId}
                    onChange={handleChange}
                    readOnly={!editingField.clientId}
                    required
                  />
                  <motion.button
                    type="button"
                    className="absolute inset-y-0 right-0 px-3 flex items-center text-gray-400 hover:text-primary-400"
                    onClick={() => toggleFieldEdit('clientId')}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    aria-label={editingField.clientId ? "Save client ID" : "Edit client ID"}
                  >
                    {editingField.clientId ? <CheckIcon /> : <PencilIcon />}
                  </motion.button>
                </div>
              </div>
              
              {/* Client Secret */}
              <div className="relative">
                <label className="block text-sm font-medium text-gray-400 mb-1">
                  Client Secret
                </label>
                <div className="relative group">
                  <input
                    type={inputTypes.clientSecret}
                    name="clientSecret"
                    className={`w-full px-4 py-3 rounded-md bg-gray-700/50 border ${editingField.clientSecret ? 'border-primary-500' : 'border-gray-600'} text-white focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all duration-200 ${!editingField.clientSecret && 'cursor-not-allowed'} pr-20`}
                    value={getDisplayValue('clientSecret')}
                    onChange={handleChange}
                    readOnly={!editingField.clientSecret}
                    placeholder="Client Secret"
                  />
                  <div className="absolute inset-y-0 right-0 flex items-center">
                    <motion.button
                      type="button"
                      className="px-2 flex items-center text-gray-400 hover:text-primary-400"
                      onClick={() => toggleVisibility('clientSecret')}
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.95 }}
                      aria-label={showUnmasked.clientSecret ? "Hide client secret" : "Show client secret"}
                    >
                      <span className="text-gray-400 hover:text-primary-400">
                        {showUnmasked.clientSecret ? <EyeOpenIcon /> : <EyeClosedIcon />}
                      </span>
                    </motion.button>
                    <motion.button
                      type="button"
                      className="px-2 flex items-center text-gray-400 hover:text-primary-400"
                      onClick={() => toggleFieldEdit('clientSecret')}
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.95 }}
                      aria-label={editingField.clientSecret ? "Save client secret" : "Edit client secret"}
                    >
                      {editingField.clientSecret ? <CheckIcon /> : <PencilIcon />}
                    </motion.button>
                  </div>
                </div>
              </div>
              
              {/* Signing Secret */}
              <div className="relative">
                <label className="block text-sm font-medium text-gray-400 mb-1">
                  Signing Secret
                </label>
                <div className="relative group">
                  <input
                    type={inputTypes.signingSecret}
                    name="signingSecret"
                    className={`w-full px-4 py-3 rounded-md bg-gray-700/50 border ${editingField.signingSecret ? 'border-primary-500' : 'border-gray-600'} text-white focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all duration-200 ${!editingField.signingSecret && 'cursor-not-allowed'} pr-20`}
                    value={getDisplayValue('signingSecret')}
                    onChange={handleChange}
                    readOnly={!editingField.signingSecret}
                    placeholder="Signing Secret"
                  />
                  <div className="absolute inset-y-0 right-0 flex items-center">
                    <motion.button
                      type="button"
                      className="px-2 flex items-center text-gray-400 hover:text-primary-400"
                      onClick={() => toggleVisibility('signingSecret')}
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.95 }}
                      aria-label={showUnmasked.signingSecret ? "Hide signing secret" : "Show signing secret"}
                    >
                      <span className="text-gray-400 hover:text-primary-400">
                        {showUnmasked.signingSecret ? <EyeOpenIcon /> : <EyeClosedIcon />}
                      </span>
                    </motion.button>
                    <motion.button
                      type="button"
                      className="px-2 flex items-center text-gray-400 hover:text-primary-400"
                      onClick={() => toggleFieldEdit('signingSecret')}
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.95 }}
                      aria-label={editingField.signingSecret ? "Save signing secret" : "Edit signing secret"}
                    >
                      {editingField.signingSecret ? <CheckIcon /> : <PencilIcon />}
                    </motion.button>
                  </div>
                </div>
              </div>
              
              {/* Bot Token */}
              <div className="relative">
                <label className="block text-sm font-medium text-gray-400 mb-1">
                  Bot Token (xoxb-...)
                </label>
                <div className="relative group">
                  <input
                    type={inputTypes.botToken}
                    name="botToken"
                    className={`w-full px-4 py-3 rounded-md bg-gray-700/50 border ${editingField.botToken ? 'border-primary-500' : 'border-gray-600'} text-white focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all duration-200 ${!editingField.botToken && 'cursor-not-allowed'} pr-20`}
                    value={getDisplayValue('botToken')}
                    onChange={handleChange}
                    readOnly={!editingField.botToken}
                    placeholder="Bot Token"
                  />
                  <div className="absolute inset-y-0 right-0 flex items-center">
                    <motion.button
                      type="button"
                      className="px-2 flex items-center text-gray-400 hover:text-primary-400"
                      onClick={() => toggleVisibility('botToken')}
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.95 }}
                      aria-label={showUnmasked.botToken ? "Hide bot token" : "Show bot token"}
                    >
                      <span className="text-gray-400 hover:text-primary-400">
                        {showUnmasked.botToken ? <EyeOpenIcon /> : <EyeClosedIcon />}
                      </span>
                    </motion.button>
                    <motion.button
                      type="button"
                      className="px-2 flex items-center text-gray-400 hover:text-primary-400"
                      onClick={() => toggleFieldEdit('botToken')}
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.95 }}
                      aria-label={editingField.botToken ? "Save bot token" : "Edit bot token"}
                    >
                      {editingField.botToken ? <CheckIcon /> : <PencilIcon />}
                    </motion.button>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Webhook Events */}
            <div className="pt-4 border-t border-gray-700/50">
              <h3 className="font-medium text-white mb-3 flex items-center">
                <svg className="w-5 h-5 mr-2 text-primary-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                Required Scopes
              </h3>
              
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {[
                  { id: 'channels:history', label: 'Channels History', desc: 'View messages and other content in public channels' },
                  { id: 'channels:read', label: 'Channels Read', desc: 'View basic information about public channels' },
                  { id: 'chat:write', label: 'Chat Write', desc: 'Send messages as the app' },
                  { id: 'emoji:read', label: 'Emoji Read', desc: 'View custom emoji in the workspace' },
                  { id: 'reactions:read', label: 'Reactions Read', desc: 'View emoji reactions to messages' },
                  { id: 'team:read', label: 'Team Read', desc: 'View team information' },
                  { id: 'users:read', label: 'Users Read', desc: 'View basic profile info about users' },
                  { id: 'users:read.email', label: 'User Emails', desc: 'View email addresses of users' },
                  { id: 'im:read', label: 'IM Read', desc: 'View direct messages' },
                  { id: 'im:write', label: 'IM Write', desc: 'Start direct messages' }
                ].map(scope => (
                  <motion.div 
                    key={scope.id}
                    className={`p-3 rounded-lg border ${config.scopes.includes(scope.id) 
                      ? 'bg-primary-900/20 border-primary-700/50' 
                      : 'bg-gray-800/50 border-gray-700/50'} 
                      cursor-pointer transition-colors duration-150`}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleScopeChange(scope.id)}
                  >
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id={`scope-${scope.id}`}
                        checked={config.scopes.includes(scope.id)}
                        onChange={() => handleScopeChange(scope.id)}
                        className="h-4 w-4 text-primary-600 rounded border-gray-500 focus:ring-primary-500"
                      />
                      <label htmlFor={`scope-${scope.id}`} className="ml-2 text-sm font-medium text-white cursor-pointer">
                        {scope.label}
                      </label>
                    </div>
                    <p className="mt-1 text-xs text-gray-400 pl-6">{scope.desc}</p>
                  </motion.div>
                ))}
              </div>
            </div>
            
            {/* Action Buttons */}
            <div className="pt-6 border-t border-gray-700/50 flex flex-wrap gap-3">
              <motion.button
                type="submit"
                className="px-5 py-2.5 bg-gradient-to-r from-primary-600 to-blue-600 text-white rounded-lg font-medium shadow-lg shadow-primary-900/20 hover:shadow-primary-600/40 transition-all duration-200 flex items-center gap-2"
                disabled={isSaving}
                whileHover={{ translateY: -2 }}
                whileTap={{ translateY: 0 }}
              >
                {isSaving ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Saving...
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                    </svg>
                    Save Configuration
                  </>
                )}
              </motion.button>
              
              <motion.button
                type="button"
                className="px-5 py-2.5 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg font-medium shadow-lg shadow-green-900/20 hover:shadow-green-600/40 transition-all duration-200 flex items-center gap-2"
                onClick={handleVerify}
                disabled={isVerifying || !config.clientId || Object.values(editingField).some(v => v)}
                whileHover={{ translateY: -2 }}
                whileTap={{ translateY: 0 }}
              >
                {isVerifying ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Verifying...
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                    Verify Credentials
                  </>
                )}
              </motion.button>
            </div>
          </form>
          
          {/* Verification Status */}
          <AnimatePresence>
            {verificationStatus === 'verified' && (
              <motion.div 
                className="mt-6 bg-green-900/30 backdrop-blur-sm rounded-lg border border-green-700/50 text-green-200 p-4 shadow-lg"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
              >
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <motion.svg 
                      className="h-6 w-6 text-green-400" 
                      fill="none" 
                      viewBox="0 0 24 24" 
                      stroke="currentColor"
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ 
                        type: "spring", 
                        stiffness: 500, 
                        damping: 15, 
                        delay: 0.2 
                      }}
                    >
                      <motion.path 
                        strokeLinecap="round" 
                        strokeLinejoin="round" 
                        strokeWidth="2" 
                        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                        initial={{ pathLength: 0 }}
                        animate={{ pathLength: 1 }}
                        transition={{ duration: 0.6, delay: 0.3 }}
                      />
                    </motion.svg>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-green-300">Verification Successful</h3>
                    <div className="mt-2 text-sm text-green-200">
                      <p>Your Slack app credentials are valid. WhisprNet.ai will now be able to process and analyze your Slack data.</p>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          
          <AnimatePresence>
            {verificationStatus === 'failed' && (
              <motion.div 
                className="mt-6 bg-yellow-900/30 backdrop-blur-sm rounded-lg border border-yellow-700/50 text-yellow-200 p-4 shadow-lg"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
              >
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-yellow-300">Verification Failed</h3>
                    <div className="mt-2 text-sm text-yellow-200">
                      <p>Please check your Slack app credentials and required scopes, then try again.</p>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
};

export default SlackConfig; 