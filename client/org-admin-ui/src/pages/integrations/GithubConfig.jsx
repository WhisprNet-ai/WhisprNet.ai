import React, { useState, useEffect } from 'react';
import { useParams, Link, useLocation } from 'react-router-dom';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { useOrganization } from '../../context/OrganizationContext';

// Helper function to mask sensitive data
const maskSensitiveData = (value) => {
  if (!value) return '';
  if (value.length <= 6) return '******'; // If too short, just mask completely
  return `${value.substring(0, 3)}...${value.substring(value.length - 3)}`;
};

// Helper to get query parameters from URL
const useQuery = () => {
  return new URLSearchParams(useLocation().search);
};

const GithubConfig = () => {
  const { orgId } = useParams();
  const query = useQuery();
  const successParam = query.get('success');
  const errorParam = query.get('error');
  
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [config, setConfig] = useState({
    clientId: '',
    clientSecret: '',
    appId: '',
    privateKey: '',
    webhookSecret: '',
    // Locally generated masked versions
    clientSecretMasked: '',
    privateKeyMasked: '',
    webhookSecretMasked: '',
    subscribedEvents: [
      'push',
      'pull_request',
      'issues',
      'issue_comment'
    ]
  });
  
  // Track fields being edited
  const [editingField, setEditingField] = useState({
    clientId: false,
    clientSecret: false,
    appId: false,
    privateKey: false,
    webhookSecret: false
  });
  
  // Track which fields should show unmasked data
  const [showUnmasked, setShowUnmasked] = useState({
    clientSecret: false,
    privateKey: false,
    webhookSecret: false
  });
  
  // Track input types for password fields
  const [inputTypes, setInputTypes] = useState({
    clientSecret: 'password',
    privateKey: 'password',
    webhookSecret: 'password'
  });
  
  // Track if config exists on the server
  const [configExists, setConfigExists] = useState(false);
  const [hasUnmaskedData, setHasUnmaskedData] = useState(false);
  
  const [verificationStatus, setVerificationStatus] = useState('pending');
  const [isSaving, setIsSaving] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isSettingUpWebhook, setIsSettingUpWebhook] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [orgName, setOrgName] = useState('');
  
  // Configure axios
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    }
  }, []);
  
  // Check for URL parameters on mount
  useEffect(() => {
    if (errorParam) {
      setError(decodeURIComponent(errorParam));
    }
    
    if (successParam === 'true') {
      setSuccess('GitHub OAuth authentication successful. Your credentials are now verified.');
      // Refresh config data to show updated status
      fetchConfig();
    }
  }, [errorParam, successParam]);
  
  // Fetch configuration on load
  useEffect(() => {
    if (!orgId) {
      console.error('No organization ID provided');
      setIsLoading(false);
      setError('No organization ID provided');
      return;
    }
    
    const fetchConfig = async () => {
      try {
        setIsLoading(true);
        
        const response = await axios.get(`/api/organizations/${orgId}/github`);
        
        if (response.data && response.data.data) {
          const apiData = response.data.data;
          
          // Generate masked versions locally from unmasked data
          const clientSecretMasked = apiData.clientSecret ? maskSensitiveData(apiData.clientSecret) : '';
          const webhookSecretMasked = apiData.webhookSecret ? maskSensitiveData(apiData.webhookSecret) : '';
          
          // Initialize values from API response
          const updatedConfig = {
            clientId: apiData.clientId || '',
            // Store unmasked values from API
            clientSecret: apiData.clientSecret || '',
            appId: apiData.appId || '',
            privateKey: apiData.privateKey || '',
            webhookSecret: apiData.webhookSecret || '',
            // Store locally generated masked values
            clientSecretMasked,
            privateKeyMasked: apiData.privateKey ? '********' : '',
            webhookSecretMasked,
            subscribedEvents: apiData.subscribedEvents || [
              'push',
              'pull_request',
              'issues',
              'issue_comment'
            ]
          };
          
          setConfig(updatedConfig);
          
          // Track that we have unmasked data
          setHasUnmaskedData(!!(apiData.clientSecret || apiData.webhookSecret));
          
          if (apiData.verificationStatus) {
            setVerificationStatus(apiData.verificationStatus);
          }
          
          // Set connection status
          if (apiData.webhookSetupStatus === 'setup') {
            setIsConnected(true);
            setOrgName(apiData.githubOrgName || 'GitHub Organization');
          }

          // Clear any previous error if we successfully got data
          setError(null);
          
          // Set configExists to true since we received data
          setConfigExists(true);
        }
      } catch (err) {
        // Handle 404 error (expected for new setups)
        if (err.response && err.response.status === 404) {
          // Clear any previous error - this is an expected condition
          setError(null);
          
          // Set default values for a new configuration
          setConfig({
            clientId: '',
            clientSecret: '',
            appId: '',
            privateKey: '',
            webhookSecret: '',
            clientSecretMasked: '',
            privateKeyMasked: '',
            webhookSecretMasked: '',
            subscribedEvents: [
              'push',
              'pull_request',
              'issues',
              'issue_comment'
            ]
          });
          setVerificationStatus('pending');
          setConfigExists(false);
          
          // Set client ID to editable for new setups
          setEditingField(prev => ({ ...prev, clientId: true }));
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
      if (fieldName === 'clientSecret' || fieldName === 'webhookSecret') {
        setShowUnmasked(prev => ({ ...prev, [fieldName]: true }));
        setInputTypes(prev => ({ ...prev, [fieldName]: 'text' }));
      }
    } else {
      // If finishing edit, reset view
      if (fieldName === 'clientSecret' || fieldName === 'webhookSecret') {
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
  
  // Handle event subscription toggle
  const handleEventChange = (event) => {
    const updatedEvents = [...config.subscribedEvents];
    
    if (updatedEvents.includes(event)) {
      const idx = updatedEvents.indexOf(event);
      updatedEvents.splice(idx, 1);
    } else {
      updatedEvents.push(event);
    }
    
    setConfig({ ...config, subscribedEvents: updatedEvents });
  };
  
  // Handle form submission
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

    if (!config.appId) {
      setError('App ID is required');
      return;
    }

    if (!config.privateKey) {
      setError('Private Key is required');
      return;
    }

    setIsSaving(true);
    setError(null);
    setSuccess(null);

    try {
      // Log what we're sending
      console.log('Submitting GitHub configuration with:', {
        clientId: config.clientId ? `${config.clientId.substring(0, 5)}...` : null,
        hasClientSecret: !!config.clientSecret,
        appId: config.appId ? `${config.appId.substring(0, 5)}...` : null,
        hasPrivateKey: !!config.privateKey,
        hasWebhookSecret: !!config.webhookSecret,
        subscribedEvents: config.subscribedEvents
      });

      // Build request data with current config
      const requestData = {
        clientId: config.clientId,
        appId: config.appId,
        privateKey: config.privateKey,
        subscribedEvents: config.subscribedEvents
      };
      
      // Include sensitive fields if they've been edited
      if (editingField.clientSecret || (!configExists && config.clientSecret)) {
        requestData.clientSecret = config.clientSecret;
      }
      
      if (editingField.privateKey || (!configExists && config.privateKey)) {
        requestData.privateKey = config.privateKey;
      }
      
      if (editingField.webhookSecret || (!configExists && config.webhookSecret)) {
        requestData.webhookSecret = config.webhookSecret;
      }
      
      let response;
      if (configExists) {
        console.log('Updating existing GitHub configuration');
        response = await axios.put(`/api/organizations/${orgId}/github`, requestData);
      } else {
        console.log('Creating new GitHub configuration');
        response = await axios.post(`/api/organizations/${orgId}/github`, requestData);
      }

      console.log('GitHub configuration saved successfully');

      if (response.data && response.data.data) {
        // Update form with unmasked credentials from response
        const respData = response.data.data;
        
        // Generate masked versions from unmasked data
        const clientSecretMasked = respData.clientSecret ? maskSensitiveData(respData.clientSecret) : config.clientSecretMasked;
        const privateKeyMasked = respData.privateKey ? '********' : config.privateKeyMasked;
        const webhookSecretMasked = respData.webhookSecret ? maskSensitiveData(respData.webhookSecret) : config.webhookSecretMasked;
        
        // Update the config with unmasked values from API
        setConfig({
          ...config,
          clientId: respData.clientId || config.clientId,
          appId: respData.appId || config.appId,
          // Update unmasked values
          clientSecret: respData.clientSecret || config.clientSecret,
          privateKey: respData.privateKey || config.privateKey,
          webhookSecret: respData.webhookSecret || config.webhookSecret,
          // Update locally generated masked values
          clientSecretMasked,
          privateKeyMasked,
          webhookSecretMasked,
          subscribedEvents: respData.subscribedEvents || config.subscribedEvents
        });
        
        // Update unmasked data flag
        setHasUnmaskedData(!!(respData.clientSecret || respData.webhookSecret));
        
        setConfigExists(true);
        setSuccess('Configuration saved successfully');
        
        // Reset all editing states
        setEditingField({
          clientId: false,
          clientSecret: false,
          appId: false,
          privateKey: false,
          webhookSecret: false
        });
      }
    } catch (err) {
      console.error('Failed to save GitHub configuration:', err);
      
      // Extract detailed error message if available
      const errorMessage = err.response?.data?.message || err.message;
      console.error('Error details:', errorMessage);
      
      setError(`Failed to save configuration: ${errorMessage}`);
    } finally {
      setIsSaving(false);
    }
  };
  
  // Verify credentials
  const handleVerify = async () => {
    if (!config.clientId || !config.clientSecret) {
      setError('Client ID and Client Secret are required for verification');
      return;
    }
    
    setIsVerifying(true);
    setError(null);
    setSuccess(null);
    
    try {
      // Build verification request with client ID and secret
      const requestData = {
        clientId: config.clientId,
        clientSecret: config.clientSecret
      };
      
      const response = await axios.post(`/api/organizations/${orgId}/github/verify-credentials`, requestData);
      
      if (response.data && response.data.success) {
        setVerificationStatus('verified');
        setSuccess('Credentials verified successfully');
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
  
  // Setup webhook
  const handleSetupWebhook = async () => {
    if (!orgName) {
      setError('GitHub Organization name is required to set up webhooks');
      return;
    }
    
    setIsSettingUpWebhook(true);
    setError(null);
    setSuccess(null);
    
    try {
      const response = await axios.post(`/api/organizations/${orgId}/github/setup-webhook`, {
        orgName: orgName
      });
      
      if (response.data && response.data.success) {
        setIsConnected(true);
        setSuccess('GitHub webhook set up successfully');
      } else {
        setError('Webhook setup failed: ' + (response.data?.message || 'Unknown error'));
      }
    } catch (err) {
      setError('Webhook setup failed: ' + (err.response?.data?.message || err.message));
    } finally {
      setIsSettingUpWebhook(false);
    }
  };
  
  // Add the GitHub OAuth login function
  const handleGitHubOAuth = async () => {
    try {
      // Clear any existing errors/success messages
      setError(null);
      setSuccess(null);
      
      if (!config.clientId) {
        setError('Client ID is required for GitHub authentication');
        return;
      }
      
      // Get the OAuth URL for GitHub
      const redirectUrl = `${window.location.origin}/api/organizations/${orgId}/integrations/github/callback`;
      
      // Build the GitHub OAuth URL
      const oauthUrl = `https://github.com/login/oauth/authorize?client_id=${config.clientId}&redirect_uri=${encodeURIComponent(redirectUrl)}&scope=repo,read:user,read:org,admin:org_hook&state=${orgId}`;
      
      // Log the details for debugging
      console.log('Redirecting to GitHub OAuth URL:', oauthUrl);
      
      // Redirect to GitHub
      window.location.href = oauthUrl;
    } catch (err) {
      setError('Failed to initiate GitHub OAuth: ' + (err.response?.data?.message || err.message));
    }
  };
  
  // Icons
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
          <p className="mt-4 text-white/70">Loading GitHub configuration...</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="pb-12 relative">
      {/* Background Elements */}
      <div className="absolute inset-0 overflow-hidden z-0 pointer-events-none">
        <div className="absolute -top-[10%] -right-[10%] w-[35%] h-[35%] bg-gradient-to-b from-indigo-600/10 to-transparent rounded-full blur-3xl"></div>
        <div className="absolute -bottom-[20%] -left-[10%] w-[40%] h-[50%] bg-gradient-to-t from-purple-600/10 to-transparent rounded-full blur-3xl"></div>
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
                GitHub Integration
              </h1>
            </div>
            <p className="mt-2 text-gray-400">
              Configure your GitHub app and connect your organization repositories
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
                <h3 className="text-lg font-medium text-white">Connected to GitHub</h3>
                <p className="text-sm text-gray-400">
                  {orgName}
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
        className="mb-8 p-5 bg-gradient-to-r from-blue-900/30 to-indigo-900/30 backdrop-blur-sm rounded-lg border border-blue-700/50 text-white shadow-lg relative overflow-hidden"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
      >
        <div className="absolute -top-10 -right-10 w-40 h-40 bg-blue-500/10 rounded-full blur-3xl z-0"></div>
        
        <h3 className="text-xl font-semibold mb-3 relative z-10 flex items-center">
          <svg className="w-6 h-6 mr-2 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          GitHub App Setup Instructions
        </h3>
        
        <ol className="list-decimal pl-6 space-y-2 text-gray-200 relative z-10">
          <li>Create a GitHub App at <a href="https://github.com/settings/apps/new" className="text-blue-300 hover:text-blue-200 hover:underline" target="_blank" rel="noopener noreferrer">https://github.com/settings/apps/new</a></li>
          <li><strong className="text-blue-300">App ID</strong> is shown at the top of your GitHub App's settings page</li>
          <li><strong className="text-blue-300">Private Key</strong> must be generated in the "Private keys" section. Click "Generate a private key" and paste the content of the downloaded .pem file</li>
          <li><strong className="text-blue-300">Client ID</strong> and <strong className="text-blue-300">Client Secret</strong> are shown in the "Client secrets" section</li>
          <li><strong className="text-blue-300">Webhook Secret</strong> is something you create in the Webhook section of your GitHub App</li>
          <li>Required permissions: Repository contents (Read), Issues (Read & Write), Pull requests (Read & Write)</li>
          <li>After saving the configuration, click "Verify Credentials" to test your GitHub App authentication</li>
        </ol>
      </motion.div>
      
      {/* GitHub App Configuration Form */}
      <motion.div 
        className="bg-gray-800/80 backdrop-blur-sm rounded-lg border border-gray-700/50 shadow-lg overflow-hidden"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.2 }}
      >
        <div className="p-6">
          <h2 className="text-xl font-bold mb-6 text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-500">
            GitHub App Configuration
          </h2>
          
          <form onSubmit={handleFormSubmit} className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Client ID */}
              <div className="relative">
                <label className="block text-sm font-medium text-gray-400 mb-1">
                  GitHub Client ID
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
                  GitHub Client Secret
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
              
              {/* App ID */}
              <div className="relative">
                <label className="block text-sm font-medium text-gray-400 mb-1">
                  GitHub App ID
                </label>
                <div className="relative group">
                  <input
                    type="text"
                    name="appId"
                    className={`w-full px-4 py-3 rounded-md bg-gray-700/50 border ${editingField.appId ? 'border-primary-500' : 'border-gray-600'} text-white focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all duration-200 ${!editingField.appId && 'cursor-not-allowed'}`}
                    value={editingField.appId ? config.appId : config.appId}
                    onChange={handleChange}
                    readOnly={!editingField.appId}
                    required
                  />
                  <motion.button
                    type="button"
                    className="absolute inset-y-0 right-0 px-3 flex items-center text-gray-400 hover:text-primary-400"
                    onClick={() => toggleFieldEdit('appId')}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    aria-label={editingField.appId ? "Save App ID" : "Edit App ID"}
                  >
                    {editingField.appId ? <CheckIcon /> : <PencilIcon />}
                  </motion.button>
                </div>
              </div>
              
              {/* Webhook Secret */}
              <div className="relative">
                <label className="block text-sm font-medium text-gray-400 mb-1">
                  GitHub Webhook Secret
                </label>
                <div className="relative group">
                  <input
                    type={inputTypes.webhookSecret}
                    name="webhookSecret"
                    className={`w-full px-4 py-3 rounded-md bg-gray-700/50 border ${editingField.webhookSecret ? 'border-primary-500' : 'border-gray-600'} text-white focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all duration-200 ${!editingField.webhookSecret && 'cursor-not-allowed'} pr-20`}
                    value={getDisplayValue('webhookSecret')}
                    onChange={handleChange}
                    readOnly={!editingField.webhookSecret}
                    placeholder="Webhook Secret"
                  />
                  <div className="absolute inset-y-0 right-0 flex items-center">
                    <motion.button
                      type="button"
                      className="px-2 flex items-center text-gray-400 hover:text-primary-400"
                      onClick={() => toggleVisibility('webhookSecret')}
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.95 }}
                      aria-label={showUnmasked.webhookSecret ? "Hide webhook secret" : "Show webhook secret"}
                    >
                      <span className="text-gray-400 hover:text-primary-400">
                        {showUnmasked.webhookSecret ? <EyeOpenIcon /> : <EyeClosedIcon />}
                      </span>
                    </motion.button>
                    <motion.button
                      type="button"
                      className="px-2 flex items-center text-gray-400 hover:text-primary-400"
                      onClick={() => toggleFieldEdit('webhookSecret')}
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.95 }}
                      aria-label={editingField.webhookSecret ? "Save webhook secret" : "Edit webhook secret"}
                    >
                      {editingField.webhookSecret ? <CheckIcon /> : <PencilIcon />}
                    </motion.button>
                  </div>
                </div>
              </div>
              
              {/* Private Key */}
              <div className="lg:col-span-2">
                <label className="block text-sm font-medium text-gray-400 mb-1">
                  GitHub Private Key
                </label>
                <div className="relative group">
                  <textarea
                    name="privateKey"
                    className={`w-full h-32 px-4 py-3 rounded-md bg-gray-700/50 border ${editingField.privateKey ? 'border-primary-500' : 'border-gray-600'} text-white focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all duration-200 ${!editingField.privateKey && 'cursor-not-allowed'} font-mono text-sm`}
                    value={getDisplayValue('privateKey')}
                    onChange={handleChange}
                    readOnly={!editingField.privateKey}
                    placeholder="Paste your private key including the BEGIN and END RSA PRIVATE KEY markers"
                  />
                  <div className="absolute top-2 right-2 flex space-x-1">
                    <motion.button
                      type="button"
                      className="p-1.5 rounded-md bg-gray-800/70 flex items-center text-gray-400 hover:text-primary-400 hover:bg-gray-800"
                      onClick={() => toggleVisibility('privateKey')}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      aria-label={showUnmasked.privateKey ? "Hide private key" : "Show private key"}
                    >
                      <span className="text-gray-400 hover:text-primary-400">
                        {showUnmasked.privateKey ? <EyeOpenIcon /> : <EyeClosedIcon />}
                      </span>
                    </motion.button>
                    <motion.button
                      type="button"
                      className="p-1.5 rounded-md bg-gray-800/70 flex items-center text-gray-400 hover:text-primary-400 hover:bg-gray-800"
                      onClick={() => toggleFieldEdit('privateKey')}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      aria-label={editingField.privateKey ? "Save private key" : "Edit private key"}
                    >
                      {editingField.privateKey ? <CheckIcon /> : <PencilIcon />}
                    </motion.button>
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-1 flex items-center">
                  <svg className="w-4 h-4 mr-1 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Include the <code className="bg-gray-700/50 px-1 py-0.5 rounded text-xs mx-1">-----BEGIN RSA PRIVATE KEY-----</code> and <code className="bg-gray-700/50 px-1 py-0.5 rounded text-xs mx-1">-----END RSA PRIVATE KEY-----</code> lines
                </p>
              </div>
            </div>
            
            {/* Webhook Events */}
            <div className="pt-4 border-t border-gray-700/50">
              <h3 className="font-medium text-white mb-3 flex items-center">
                <svg className="w-5 h-5 mr-2 text-primary-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                Webhook Events
              </h3>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  { id: 'push', label: 'Push Events', desc: 'Triggered on repository push' },
                  { id: 'pull_request', label: 'Pull Requests', desc: 'Triggered when PRs are opened, closed, or updated' },
                  { id: 'issues', label: 'Issues', desc: 'Triggered when issues are opened, closed, or updated' },
                  { id: 'issue_comment', label: 'Issue Comments', desc: 'Triggered when comments are added to issues or PRs' }
                ].map(event => (
                  <motion.div 
                    key={event.id}
                    className={`p-3 rounded-lg border ${config.subscribedEvents.includes(event.id) 
                      ? 'bg-primary-900/20 border-primary-700/50' 
                      : 'bg-gray-800/50 border-gray-700/50'} 
                      cursor-pointer transition-colors duration-150`}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleEventChange(event.id)}
                  >
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id={`event-${event.id}`}
                        checked={config.subscribedEvents.includes(event.id)}
                        onChange={() => handleEventChange(event.id)}
                        className="h-4 w-4 text-primary-600 rounded border-gray-500 focus:ring-primary-500"
                      />
                      <label htmlFor={`event-${event.id}`} className="ml-2 text-sm font-medium text-white cursor-pointer">
                        {event.label}
                      </label>
                    </div>
                    <p className="mt-1 text-xs text-gray-400 pl-6">{event.desc}</p>
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
                disabled={isVerifying || !config.clientId || !config.clientSecret || Object.values(editingField).some(v => v)}
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
              
              <motion.button
                type="button"
                className="px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg font-medium shadow-lg shadow-indigo-900/20 hover:shadow-indigo-600/40 transition-all duration-200 flex items-center gap-2"
                onClick={handleGitHubOAuth}
                disabled={!config.clientId || Object.values(editingField).some(v => v)}
                whileHover={{ translateY: -2 }}
                whileTap={{ translateY: 0 }}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                </svg>
                Authenticate with GitHub
              </motion.button>
            </div>
          </form>
        </div>
      </motion.div>
      
      {/* Verification Status */}
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
                  <p>Please check your GitHub App credentials and permissions, then try again.</p>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Verification Success */}
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
                  <p>Your GitHub credentials have been verified. You can now connect to your GitHub organization.</p>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default GithubConfig; 