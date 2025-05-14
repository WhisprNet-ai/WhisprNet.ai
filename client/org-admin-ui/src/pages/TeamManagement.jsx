import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useManager } from '../context/ManagerContext';
import { organizationAPI, slackAPI, dashboardAPI } from '../services/api';
import { motion, AnimatePresence } from 'framer-motion';
import { FiUsers, FiUserPlus, FiSettings, FiSlack, FiGithub, FiMail, FiMessageSquare, FiAlertCircle, FiCheckCircle, FiList, FiArrowLeft, FiTwitch, FiHash, FiChevronDown, FiCheck, FiRefreshCw, FiSave } from 'react-icons/fi';
import axios from 'axios';

// Slack Integration Form component
const SlackIntegrationForm = ({ onConfigSaved }) => {
  const [formData, setFormData] = useState({
    clientId: '',
    clientSecret: '',
    accessToken: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Get organization ID
      const user = localStorage.getItem('user') ? 
        JSON.parse(localStorage.getItem('user')) : null;
      
      const organizationId = user?.organizationId || 'current';
      
      // Validate inputs
      if (!formData.clientId.trim()) {
        setError('Client ID is required');
        return;
      }
      
      if (!formData.clientSecret.trim()) {
        setError('Client Secret is required');
        return;
      }
      
      if (!formData.accessToken.trim()) {
        setError('Access Token is required');
        return;
      }
      
      if (!formData.accessToken.startsWith('xoxp-') && !formData.accessToken.startsWith('xoxb-')) {
        setError('Invalid token format. It should start with xoxp- or xoxb-');
        return;
      }
      
      // Save Slack configuration
      await organizationAPI.post(`/api/organizations/${organizationId}/integrations/slack/config`, formData);
      
      console.log('Slack configuration saved successfully');
      
      // Call onConfigSaved to reload Slack users
      if (onConfigSaved) onConfigSaved();
    } catch (err) {
      console.error('Error saving Slack config:', err);
      setError(err.response?.data?.error || 'Failed to save Slack configuration. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div 
      className="bg-gray-800/50 backdrop-blur-sm rounded-lg shadow-lg border border-gray-700 overflow-hidden p-6 mb-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="flex items-center mb-4">
        <FiSlack className="text-blue-400 mr-2 text-xl" />
        <h2 className="text-xl font-semibold text-white">Configure Slack Integration</h2>
      </div>
      
      {error && (
        <div className="bg-red-900/30 border border-red-500 text-red-200 px-4 py-3 rounded relative mb-6">
          <FiAlertCircle className="inline mr-2" />
          {error}
        </div>
      )}
      
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label className="block text-gray-300 text-sm mb-2">
            Slack Client ID
          </label>
          <input
            type="text"
            name="clientId"
            value={formData.clientId}
            onChange={handleChange}
            className="w-full px-3 py-2 bg-gray-700/50 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Enter your Slack Client ID"
            required
          />
        </div>
        
        <div className="mb-4">
          <label className="block text-gray-300 text-sm mb-2">
            Slack Client Secret
          </label>
          <input
            type="password"
            name="clientSecret"
            value={formData.clientSecret}
            onChange={handleChange}
            className="w-full px-3 py-2 bg-gray-700/50 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Enter your Slack Client Secret"
            required
          />
        </div>
        
        <div className="mb-6">
          <label className="block text-gray-300 text-sm mb-2">
            Slack Access Token (xoxp-...)
          </label>
          <input
            type="password"
            name="accessToken"
            value={formData.accessToken}
            onChange={handleChange}
            className="w-full px-3 py-2 bg-gray-700/50 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Enter your Slack Access Token (xoxp-...)"
            required
          />
          <p className="text-gray-400 text-xs mt-1">
            To find your Slack tokens, visit the <a href="https://api.slack.com/apps" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">Slack API Apps page</a>
          </p>
        </div>
        
        <motion.button
          type="submit"
          className="px-5 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-500 transition-colors duration-200 flex items-center justify-center w-full"
          disabled={loading}
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
        >
          {loading ? (
            <>
              <FiRefreshCw className="animate-spin mr-2" />
              Saving...
            </>
          ) : (
            <>
              <FiSave className="mr-2" />
              Save Slack Configuration
            </>
          )}
        </motion.button>
      </form>
    </motion.div>
  );
};

// Team Management component for organization admins
const TeamManagement = () => {
  const navigate = useNavigate();
  const { getAllManagers, assignManagerRole, revokeManagerRole, error: managerError, clearError } = useManager();
  
  const [members, setMembers] = useState([]);
  const [managers, setManagers] = useState([]);
  const [integrations, setIntegrations] = useState([]);
  const [slackUsers, setSlackUsers] = useState([]);
  const [loadingMembers, setLoadingMembers] = useState(true);
  const [loadingManagers, setLoadingManagers] = useState(true);
  const [loadingSlack, setLoadingSlack] = useState(false);
  const [loadingIntegrations, setLoadingIntegrations] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [showSlackConfig, setShowSlackConfig] = useState(false);
  const [slackLastFetched, setSlackLastFetched] = useState(null);
  const slackUsersLoaded = useRef(false);
  
  // New state for two-pane selection
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedIntegrations, setSelectedIntegrations] = useState([]); // Common integrations for all users
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { 
        when: "beforeChildren",
        staggerChildren: 0.1
      }
    }
  };
  
  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1 }
  };
  
  // Helper function to get the stored auth token - try both methods
  const getAuthToken = () => {
    try {
      // First try direct token storage (the way the API helpers use)
      const directToken = localStorage.getItem('token');
      if (directToken) {
        console.log('Found token in localStorage.token');
        return directToken;
      }
      
      // Then try user object (the way this component was trying to use)
      const user = localStorage.getItem('user');
      if (!user) return null;
      
      const userData = JSON.parse(user);
      if (!userData.token) {
        console.warn('User object found but no token present:', userData);
        return null;
      }
      
      console.log('Found token in localStorage.user.token');
      return userData.token;
    } catch (err) {
      console.error('Error retrieving auth token:', err);
      return null;
    }
  };
  
  // Function to fetch integration status and log to console
  const fetchIntegrationStatus = async () => {
    try {
      console.log('Fetching integration status using dashboardAPI...');
      const response = await dashboardAPI.getIntegrationStatus();
      console.log('🟢 Integration Status API Response:', response.data);
      return response.data;
    } catch (err) {
      console.error('🔴 Error fetching integration status:', err.message || err);
      return null;
    }
  };
  
  // Load enabled integrations for the organization
  const loadEnabledIntegrations = async () => {
    setLoadingIntegrations(true);
    setError('');
    
    try {
      console.log('Loading enabled integrations for organization using dashboardAPI');
      
      // Use the dashboardAPI helper instead of creating a custom axios instance
      const response = await dashboardAPI.getIntegrationStatus();
      console.log('Integrations API response:', response);
      
      if (response.data?.success && Array.isArray(response.data.data)) {
        const integrationsData = response.data.data;
        console.log('Received integrations:', integrationsData);
        
        // Map integration data to include icons
        const integrationsWithIcons = integrationsData.map(integration => {
          let icon;
          
          // Use the integration.type to determine the icon
          switch (integration.type) {
            case 'slack':
              icon = <FiSlack />;
              break;
            case 'teams':
            case 'microsoft_teams':
              icon = <FiMessageSquare />;
              break;
            case 'discord':
              icon = <FiHash />;
              break;
            case 'gmail':
            case 'email':
              icon = <FiMail />;
              break;
            case 'github':
              icon = <FiGithub />;
              break;
            default:
              icon = <FiSettings />;
          }
          
          return {
            id: integration.type, // Use type as the id for consistency with manager assignment
            name: integration.name, 
            type: integration.type,
            description: `${integration.name} (${integration.type})`,
            icon,
            status: integration.status,
            originalId: integration.id // Keep the original ID in case needed
          };
        });
        
        // Only include connected integrations
        const connectedIntegrations = integrationsWithIcons.filter(
          integration => integration.status === 'connected'
        );
        
        setIntegrations(connectedIntegrations);
        console.log('Enabled integrations loaded:', connectedIntegrations.length);
        
        // Clear any selected integrations that are no longer enabled
        if (selectedIntegrations.length > 0) {
          const enabledIds = connectedIntegrations.map(integration => integration.id);
          const filteredSelected = selectedIntegrations.filter(id => enabledIds.includes(id));
          
          if (filteredSelected.length !== selectedIntegrations.length) {
            setSelectedIntegrations(filteredSelected);
          }
        }
        
        // Clear any previous errors
        setError('');
      } else {
        console.error('Invalid response format from integrations API:', response.data);
        throw new Error('Invalid response format from integrations API');
      }
    } catch (err) {
      console.error('Error loading enabled integrations:', err);
      // Show more detailed error information
      let errorMessage = 'Failed to load available integrations. ';
      
      if (err.response) {
        console.error('Error response:', err.response);
        errorMessage += `Server error: ${err.response.status}`;
      } else if (err.request) {
        console.error('No response received:', err.request);
        errorMessage += 'No response from server. Check your connection.';
      } else {
        console.error('Error message:', err.message);
        errorMessage += err.message;
      }
      
      setError(errorMessage);
    } finally {
      setLoadingIntegrations(false);
    }
  };
  
  // Load Slack users first - primary data source
  const loadSlackUsers = async (forceRefresh = false) => {
    setLoadingSlack(true);
    setError('');
    
    try {
      // Call the direct Slack API endpoint
      console.log(`Fetching Slack users directly from Slack API via backend${forceRefresh ? ' (force refresh)' : ''}`);
      
      // Direct call to Slack API - use force refresh when requested
      const response = forceRefresh 
        ? await slackAPI.getUsersForceRefresh()
        : await slackAPI.getUsers();
      
      if (response.data?.users) {
        const slackUsers = response.data.users;
        console.log(`Received ${slackUsers.length} Slack users from API${response.data.fromCache ? ' (from cache)' : ''}`);
        
        // Transform Slack users to match the format needed for the dropdown
        const formattedSlackUsers = slackUsers.map(user => ({
          _id: `slack-${user.id}`, // Prefix with 'slack-' to distinguish from DB users
          firstName: user.name.split(' ')[0] || user.name,
          lastName: user.name.split(' ').slice(1).join(' ') || '',
          email: user.email || `${user.name.toLowerCase().replace(/\s+/g, '.')}@slack.user`,
          role: user.is_admin ? 'admin' : 'member',
          avatar: user.avatar,
          timeZone: user.tz,
          title: user.title,
          status: user.status,
          source: 'slack',
          slackUserId: user.id, // Store original Slack ID
          displayName: user.name // Keep original display name
        }));
        
        if (formattedSlackUsers.length === 0) {
          console.warn('No Slack users returned from API');
          setError('No users found in your Slack workspace. Please check your Slack integration.');
          loadOrganizationMembers(); // Fallback to database users
          return;
        }
        
        setSlackUsers(formattedSlackUsers);
        
        // Use Slack users as the primary source for members
        setMembers(formattedSlackUsers);
        setLoadingMembers(false);
        setShowSlackConfig(false); // Hide config form if it was shown
        
        setSuccess(`Successfully loaded ${formattedSlackUsers.length} users from Slack!${response.data.fromCache ? ' (cached data)' : ''}`);
        
        // Update the last fetched timestamp
        setSlackLastFetched(new Date());
        
        // Clear success message after 3 seconds
        setTimeout(() => {
          setSuccess('');
        }, 3000);
      } else {
        throw new Error('Invalid response format from Slack API');
      }
    } catch (err) {
      console.error('Error loading Slack users:', err);
      
      // Handle specific Slack config errors
      if (err.response?.status === 404) {
        setError('Slack integration not configured. Please configure your Slack integration below.');
        setShowSlackConfig(true); // Show the Slack config form
      } else if (err.response?.status === 400) {
        setError('Invalid Slack credentials. Please update your Slack integration with valid tokens below.');
        setShowSlackConfig(true); // Show the Slack config form
      } else if (err.response?.status === 401) {
        setError('Slack authentication failed. Please update your token with valid credentials below.');
        setShowSlackConfig(true); // Show the Slack config form
      } else if (err.response?.status === 403) {
        setError('Slack token is missing required scopes. The token needs users:read scope.');
        setShowSlackConfig(true); // Show the Slack config form
      } else if (err.response?.status === 429) {
        setError('Rate limited by Slack API. Please try again later.');
      } else {
        setError(err.response?.data?.error || 'Failed to load Slack users. Please check your Slack integration.');
      }
      
      // Load organization members as fallback
      loadOrganizationMembers();
    } finally {
      setLoadingSlack(false);
    }
  };
  
  // Fallback to load organization members from database
  const loadOrganizationMembers = async () => {
    try {
      const user = localStorage.getItem('user') ? 
        JSON.parse(localStorage.getItem('user')) : null;
      
      const organizationId = user?.organizationId || 'current';
      
      console.log(`Fetching members using organizationAPI.getMembers(${organizationId})`);
      const response = await organizationAPI.getMembers(organizationId);
      
      console.log('API response received:', response);
      
      if (response.data?.members) {
        // Add source property to indicate these are database users
        const formattedMembers = response.data.members.map(member => ({
          ...member,
          source: 'database'
        }));
        
        setMembers(formattedMembers);
        console.log('Members loaded from API:', formattedMembers.length);
      } else {
        console.error('Invalid response format:', response.data);
        throw new Error('Invalid response format from members API');
      }
    } catch (err) {
      console.error('Error loading organization members:', err);
      
      // Use mock data as last resort
      const mockMembers = [
        {
          _id: 'admin123456',
          firstName: 'Admin',
          lastName: 'User',
          email: 'admin@whisprnet.test',
          role: 'org_admin',
          source: 'mock'
        },
        {
          _id: 'user1234567890',
          firstName: 'Team',
          lastName: 'Member 1',
          email: 'member1@whisprnet.test',
          role: 'org_user',
          source: 'mock'
        },
        {
          _id: 'user0987654321',
          firstName: 'Team',
          lastName: 'Member 2',
          email: 'member2@whisprnet.test',
          role: 'org_user',
          source: 'mock'
        }
      ];
      
      setMembers(mockMembers);
      console.log('Using mock members data:', mockMembers.length);
      
      // Show a warning for mock data
      setSuccess('Using demo data for team members');
      
      // Clear success message after 5 seconds
      setTimeout(() => {
        setSuccess('');
      }, 5000);
    } finally {
      setLoadingMembers(false);
    }
  };
  
  // Load organization members, managers, and available integrations
  useEffect(() => {
    // Track if component is mounted to prevent state updates after unmount
    let isMounted = true;
    
    const loadData = async () => {
      try {
        const user = localStorage.getItem('user') ? 
          JSON.parse(localStorage.getItem('user')) : null;
        
        const organizationId = user?.organizationId || 'current';
        
        console.log('Loading team data for organization:', organizationId);
        
        // Fetch and log integration status directly using the dashboard API
        console.log('Calling fetchIntegrationStatus to log integration status...');
        const integrationStatusData = await fetchIntegrationStatus();
        console.log('Integration status data received:', integrationStatusData);
        
        // Load Slack users only if not already loaded during this session
        if (isMounted && !slackUsersLoaded.current) {
          slackUsersLoaded.current = true; // Mark as loaded regardless of outcome
          
          // Load Slack users (only once per page load)
          await loadSlackUsers();
        }
        
        // Load current managers
        if (isMounted) setLoadingManagers(true);
        try {
          const managersData = await getAllManagers(organizationId);
          if (isMounted && managersData) {
            setManagers(managersData);
            console.log('Managers loaded:', managersData.length);
          }
        } catch (err) {
          console.error('Error loading managers:', err.response?.data || err.message);
          if (isMounted) setError(err.response?.data?.message || 'Failed to load managers. Please try again.');
        }
        if (isMounted) setLoadingManagers(false);
        
        // Load available integrations
        if (isMounted) {
          await loadEnabledIntegrations();
        }
      } catch (err) {
        console.error('Error in loadData:', err);
        if (isMounted) setError('An unexpected error occurred. Please try refreshing the page.');
      }
    };
    
    loadData();
    
    // Cleanup function to prevent state updates after unmount
    return () => {
      isMounted = false;
    };
  }, []); 
  
  // Filter available members (not already managers and not already selected)
  const getAvailableUsers = () => {
    // Filter out users who are already managers
    const nonManagerMembers = members.filter(member => 
      !managers.some(manager => {
        // Handle different types of manager entries
        if (manager.managerId && manager.managerId._id) {
          return manager.managerId._id === member._id;
        } else if (member._id.startsWith('slack-') && manager.managerId && manager.managerId.slackUserId) {
          // For Slack users, compare the Slack user ID
          return manager.managerId.slackUserId === member.slackUserId;
        }
        return false;
      })
    );
    
    // Also filter out users already in the selected list
    return nonManagerMembers.filter(member => 
      !selectedUsers.some(selectedUser => selectedUser._id === member._id)
    );
  };
  
  // Filter users based on search term
  const filteredAvailableUsers = getAvailableUsers().filter(user => {
    const searchString = searchTerm.toLowerCase();
    const displayName = user.displayName || `${user.firstName} ${user.lastName}`;
    const email = user.email || '';
    
    return (
      displayName.toLowerCase().includes(searchString) ||
      email.toLowerCase().includes(searchString)
    );
  });
  
  // Handle user selection (move to right pane)
  const handleSelectUser = (user) => {
    setSelectedUsers(prev => [...prev, user]);
  };
  
  // Handle moving multiple users to right pane
  const handleMoveSelectedToManagers = (selectedIds) => {
    const usersToMove = getAvailableUsers().filter(user => selectedIds.includes(user._id));
    setSelectedUsers(prev => [...prev, ...usersToMove]);
  };
  
  // Handle removing a user from selection
  const handleRemoveUser = (userId) => {
    setSelectedUsers(prev => prev.filter(user => user._id !== userId));
  };
  
  // Handle integration selection change (common for all users)
  const handleIntegrationChange = (integrationIds) => {
    setSelectedIntegrations(integrationIds);
  };
  
  // Get icon for integration
  const getIntegrationIcon = (id) => {
    const integration = integrations.find(item => item.id === id);
    return integration?.icon || <FiSettings />;
  };
  
  // Handle submitting all selected managers
  const handleAssignManagers = async () => {
    if (selectedUsers.length === 0) {
      setError('Please select at least one user to assign as manager');
      return;
    }
    
    // Check if at least one integration is selected
    if (selectedIntegrations.length === 0) {
      setError('Please select at least one integration for the managers');
      return;
    }
    
    setIsSubmitting(true);
    setError('');
    
    try {
      // Process each user one by one with the same integrations
      for (const user of selectedUsers) {
        const isSlackUser = user._id.startsWith('slack-');
        
        if (isSlackUser) {
          // For Slack users, first create a user account
          console.log('Creating new user from Slack data:', user);
          
          // Extract needed data from the Slack user
          const userData = {
            firstName: user.firstName || user.displayName.split(' ')[0],
            lastName: user.lastName || user.displayName.split(' ').slice(1).join(' ') || '',
            email: user.email,
            role: 'team_manager',
            slackUserId: user.slackUserId,
            profileImage: user.avatar,
            sendInvite: true // Flag to send invitation email
          };
          
          // Call API to create the user first
          const createResponse = await axios.post('/api/users/create-from-external', userData, {
            headers: {
              'Authorization': `Bearer ${getAuthToken()}`,
              'Content-Type': 'application/json'
            }
          });
          
          console.log('User creation response:', createResponse.data);
          
          if (createResponse.data.success) {
            // Now assign manager role to the newly created user
            const userId = createResponse.data.user._id;
            await assignManagerRole(userId, selectedIntegrations);
          } else {
            throw new Error(createResponse.data.message || 'Failed to create user from Slack data');
          }
        } else {
          // For existing users, directly assign manager role
          await assignManagerRole(user._id, selectedIntegrations);
        }
      }
      
      // Clear selection after successful assignment
      setSelectedUsers([]);
      // Don't clear integrations to allow reuse for next batch
      
      // Show success message
      setSuccess(`Successfully assigned ${selectedUsers.length} team manager${selectedUsers.length > 1 ? 's' : ''}! Invitation emails have been sent.`);
      
      // Reload managers list
      const managersData = await getAllManagers();
      setManagers(managersData);
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccess('');
      }, 3000);
    } catch (err) {
      console.error('Error assigning manager roles:', err);
      setError(err.response?.data?.error || err.message || 'Failed to assign manager roles. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Handle manager role revocation
  const handleRevokeManager = async (managerId) => {
    if (!window.confirm('Are you sure you want to revoke this manager role?')) {
      return;
    }
    
    try {
      // Revoke manager role through API
      await revokeManagerRole(managerId);
      
      // Success message
      setSuccess('Team manager role revoked successfully!');
      
      // Update managers list
      const managersData = await getAllManagers();
      setManagers(managersData);
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccess('');
      }, 3000);
    } catch (err) {
      console.error('Error revoking manager role:', err);
      setError(err.response?.data?.error || 'Failed to revoke manager role. Please try again.');
    }
  };
  
  // Clear any error messages
  const handleClearError = () => {
    clearError();
    setError('');
  };
  
  // Component for displaying a user card with avatar and info
  const UserCard = ({ user, selected = false, onClick, showCheckbox = false, onCheckboxChange, checked = false }) => {
    return (
      <motion.div 
        className={`group p-3 rounded-lg transition-colors duration-200 ${
          selected ? 'bg-blue-900/30 border-blue-500 border' : 
          'bg-gray-700/30 border-gray-600 border hover:bg-gray-700/50'
        } ${onClick ? 'cursor-pointer' : ''}`}
        onClick={onClick}
        whileHover={onClick ? { scale: 1.01 } : {}}
        whileTap={onClick ? { scale: 0.99 } : {}}
      >
        <div className="flex items-center">
          {showCheckbox && (
            <div className="mr-2">
              <input 
                type="checkbox" 
                checked={checked} 
                onChange={(e) => onCheckboxChange(user._id, e.target.checked)}
                onClick={(e) => e.stopPropagation()}
                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 bg-gray-700"
              />
            </div>
          )}
          
          {user.avatar && typeof user.avatar === 'string' && user.avatar.startsWith('http') ? (
            <div className="relative">
              <img 
                src={user.avatar} 
                alt={user.displayName} 
                className="w-12 h-12 rounded-lg mr-4 object-cover border-2 border-blue-500/30 shadow-md" 
              />
            </div>
          ) : (
            <div className="relative">
              <div className="w-12 h-12 rounded-lg bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold text-lg mr-4 shadow-md">
                {(user.displayName || user.firstName)?.charAt(0) || '?'}
              </div>
            </div>
          )}
          
          <div className="flex-1 min-w-0">
            <div className="text-sm text-white font-medium truncate">
              {user.displayName || `${user.firstName} ${user.lastName}`}
            </div>
            {user.email && <div className="text-xs text-gray-400 truncate">{user.email}</div>}
            {user.title && <div className="text-xs text-gray-500 truncate">{user.title}</div>}
          </div>
          
          {user.source === 'slack' && (
            <span className="ml-1 px-1.5 py-0.5 text-xs rounded bg-purple-900/30 text-purple-300 border border-purple-800/50 flex items-center">
              <FiSlack className="mr-1" size={10} />
              Slack
            </span>
          )}
        </div>
      </motion.div>
    );
  };
  
  // Multi-select dropdown component for integrations
  const MultiSelectIntegrations = ({ selectedIntegrations, onChange }) => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);
    
    // Close dropdown when clicking outside
    useEffect(() => {
      const handleClickOutside = (event) => {
        if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
          setIsOpen(false);
        }
      };
      
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }, []);
    
    // Toggle integration selection
    const handleToggleIntegration = (integrationId) => {
      const newSelection = selectedIntegrations.includes(integrationId)
        ? selectedIntegrations.filter(id => id !== integrationId)
        : [...selectedIntegrations, integrationId];
      
      onChange(newSelection);
    };
    
    return (
      <div className="relative w-full" ref={dropdownRef}>
        <motion.button
          type="button"
          className="flex items-center justify-between w-full py-2.5 px-3.5 text-white bg-gray-800/60 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm transition-all duration-200"
          onClick={() => setIsOpen(!isOpen)}
          whileHover={{ backgroundColor: 'rgba(55, 65, 81, 0.6)' }}
          whileTap={{ scale: 0.98 }}
        >
          <span className="text-sm truncate flex items-center">
            {selectedIntegrations.length > 0 
              ? (
                <span className="flex items-center">
                  <span className="flex -space-x-1 mr-2">
                    {selectedIntegrations.slice(0, 3).map(id => (
                      <span key={id} className="bg-blue-900/40 w-6 h-6 rounded-full flex items-center justify-center border border-blue-800/50 shadow-sm">
                        {getIntegrationIcon(id)}
                      </span>
                    ))}
                  </span>
                  {selectedIntegrations.length} integration{selectedIntegrations.length > 1 ? 's' : ''} selected
                </span>
              ) 
              : (
                <span className="text-gray-400">
                  <FiSettings className="inline mr-2 text-gray-500" />
                  Select integrations...
                </span>
              )
            }
          </span>
          <div className="flex items-center">
            {loadingIntegrations ? (
              <FiRefreshCw className="animate-spin mr-1.5 text-gray-400" size={14} />
            ) : (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  loadEnabledIntegrations();
                }}
                className="mr-1.5 text-gray-400 hover:text-gray-300 p-1 hover:bg-gray-700/50 rounded-full"
              >
                <FiRefreshCw size={14} />
              </button>
            )}
            <FiChevronDown className={`transition-transform duration-200 ${isOpen ? 'transform rotate-180' : ''}`} />
          </div>
        </motion.button>
        
        <AnimatePresence>
          {isOpen && (
            <motion.div
              className="absolute z-50 w-full mt-1 top-full left-0 bg-gray-800 border border-gray-700 rounded-md shadow-lg overflow-hidden"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              transition={{ duration: 0.2 }}
            >
              <div className="max-h-60 overflow-y-auto py-1 scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-800">
                {loadingIntegrations ? (
                  <div className="px-4 py-6 text-center text-gray-400">
                    <FiRefreshCw className="animate-spin mx-auto mb-2" size={20} />
                    <p>Loading integrations...</p>
                  </div>
                ) : integrations.length === 0 ? (
                  <div className="px-4 py-6 text-gray-400 text-center">
                    <div className="bg-gray-700/30 p-3 rounded-full w-12 h-12 mx-auto mb-2 flex items-center justify-center">
                      <FiSettings className="text-gray-400" size={18} />
                    </div>
                    <p className="mb-2">No active integrations configured</p>
                    <button
                      onClick={() => loadEnabledIntegrations()}
                      className="text-xs text-blue-400 hover:text-blue-300 inline-flex items-center bg-blue-900/20 px-2 py-1 rounded-md"
                    >
                      <FiRefreshCw className="mr-1" size={12} />
                      Refresh integrations
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="px-3 py-2 text-xs text-gray-400 border-b border-gray-700">
                      Select the integrations to allow
                    </div>
                    {integrations.map((integration) => (
                      <motion.div
                        key={integration.id}
                        className={`px-3 py-2.5 cursor-pointer flex items-center justify-between ${
                          selectedIntegrations.includes(integration.id) 
                            ? 'bg-blue-600/20 text-blue-300' 
                            : 'text-white hover:bg-gray-700/60'
                        }`}
                        onClick={() => handleToggleIntegration(integration.id)}
                        whileHover={{ backgroundColor: selectedIntegrations.includes(integration.id) ? 'rgba(37, 99, 235, 0.2)' : 'rgba(55, 65, 81, 0.6)' }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <div className="flex items-center gap-2">
                          <div className={`flex items-center justify-center w-7 h-7 rounded-md ${
                            selectedIntegrations.includes(integration.id) 
                              ? 'bg-blue-500/30 text-blue-400' 
                              : 'bg-gray-600/30 text-gray-400'
                          }`}>
                            {integration.icon}
                          </div>
                          <div className="flex flex-col">
                            <span className="text-sm font-medium">{integration.name}</span>
                            <span className="text-xs text-gray-400 capitalize">{integration.type}</span>
                          </div>
                        </div>
                        <div className={`w-5 h-5 rounded flex items-center justify-center ${
                          selectedIntegrations.includes(integration.id) 
                            ? 'bg-blue-500 text-white' 
                            : 'border border-gray-500'
                        }`}>
                          {selectedIntegrations.includes(integration.id) && (
                            <FiCheck size={14} />
                          )}
                        </div>
                      </motion.div>
                    ))}
                  </>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  };
  
  return (
    <motion.div 
      className="container mx-auto px-4 py-8"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <div className="flex justify-between items-center mb-8">
        <div className="flex items-center">
          <FiUsers className="text-blue-400 mr-3 text-2xl" />
          <h1 className="text-2xl font-bold text-white">Team Management</h1>
        </div>
        <div className="flex items-center space-x-3">
          <motion.button
            onClick={async () => {
              setLoadingIntegrations(true);
              console.log('Manually reloading integration status...');
              await fetchIntegrationStatus();
              await loadEnabledIntegrations();
              setLoadingIntegrations(false);
            }}
            className="flex items-center px-3 py-2 bg-gray-800 text-gray-300 rounded-md hover:bg-gray-700 transition-colors duration-200 border border-gray-700"
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            disabled={loadingIntegrations}
          >
            {loadingIntegrations ? (
              <FiRefreshCw className="animate-spin mr-2" />
            ) : (
              <FiRefreshCw className="mr-2" />
            )}
            Reload Integrations
          </motion.button>
          <motion.button 
            onClick={() => navigate('/settings')}
            className="flex items-center px-4 py-2 bg-gray-800 text-gray-300 rounded-md hover:bg-gray-700 transition-colors duration-200 border border-gray-700"
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
          >
            <FiArrowLeft className="mr-2" />
            Back to Settings
          </motion.button>
        </div>
      </div>
      
      {/* Error and success messages */}
      <AnimatePresence>
        {(error || managerError) && (
          <motion.div 
            className="bg-red-900/30 border border-red-500 text-red-200 px-4 py-3 rounded relative mb-6 flex justify-between items-center"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, height: 0, marginBottom: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className="flex items-center">
              <FiAlertCircle className="text-red-400 mr-2" />
              <span>{error || managerError}</span>
            </div>
            <button 
              onClick={handleClearError} 
              className="text-red-400 hover:text-red-300 transition-colors"
            >
              &times;
            </button>
          </motion.div>
        )}
        
        {success && (
          <motion.div 
            className="bg-green-900/30 border border-green-500 text-green-200 px-4 py-3 rounded relative mb-6 flex items-center"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, height: 0, marginBottom: 0 }}
          >
            <FiCheckCircle className="text-green-400 mr-2" />
            {success}
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Show Slack Configuration Form if needed */}
      {showSlackConfig && (
        <SlackIntegrationForm 
          onConfigSaved={() => {
            setShowSlackConfig(false);
            setSuccess('Slack configuration saved successfully!');
            loadSlackUsers();
          }} 
        />
      )}
      
      {/* Two-Pane Manager Assignment UI */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Pane - Available Slack Users */}
        <motion.div 
          className="bg-gray-800/50 backdrop-blur-sm rounded-lg shadow-lg border border-gray-700 overflow-hidden"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <div className="p-5 border-b border-gray-700 flex justify-between items-center">
            <div>
              <div className="flex items-center">
                <FiSlack className="text-blue-400 mr-2 text-xl" />
                <h2 className="text-xl font-semibold text-white">Available Slack Users</h2>
              </div>
              {slackLastFetched && (
                <div className="text-xs text-gray-400 mt-1">
                  Last synced: {slackLastFetched.toLocaleTimeString()}
                </div>
              )}
            </div>
            <motion.button
              type="button"
              onClick={() => loadSlackUsers(true)}
              className="flex items-center text-sm px-3 py-1.5 bg-blue-700/50 border border-blue-600 rounded text-blue-300 hover:bg-blue-700"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              disabled={loadingSlack}
            >
              {loadingSlack ? (
                <FiRefreshCw className="animate-spin mr-1.5" />
              ) : (
                <FiRefreshCw className="mr-1.5" />
              )}
              Refresh
            </motion.button>
          </div>
          
          {/* Search bar */}
          <div className="p-4 border-b border-gray-700">
            <div className="relative rounded-md">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                </svg>
              </div>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search users by name or email..."
                className="w-full pl-10 pr-4 py-2 bg-gray-700/40 border border-gray-600 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          
          {/* User list */}
          <div className="p-4 overflow-y-auto" style={{ height: '390px' }}>
            {loadingMembers || loadingSlack ? (
              <div className="flex justify-center py-10">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-400"></div>
              </div>
            ) : filteredAvailableUsers.length > 0 ? (
              <>
                {/* Multi-select logic */}
                <div className="space-y-2">
                  {filteredAvailableUsers.map(user => (
                    <UserCard
                      key={user._id}
                      user={user}
                      onClick={() => handleSelectUser(user)}
                      showCheckbox={true}
                      onCheckboxChange={(userId, isChecked) => {
                        if (isChecked) {
                          const user = filteredAvailableUsers.find(u => u._id === userId);
                          if (user) handleSelectUser(user);
                        }
                      }}
                      checked={false}
                    />
                  ))}
                </div>
              </>
            ) : (
              <div className="text-center py-10 text-gray-400 flex flex-col items-center">
                <FiUsers className="text-gray-500 mb-3 text-3xl" />
                <p>No available Slack users found</p>
                {searchTerm && (
                  <button 
                    onClick={() => setSearchTerm('')}
                    className="mt-2 text-blue-400 hover:underline text-sm"
                  >
                    Clear search
                  </button>
                )}
              </div>
            )}
          </div>
          
          {/* Bottom action bar */}
          <div className="p-4 border-t border-gray-700 bg-gray-800/60">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-400">
                {filteredAvailableUsers.length} user{filteredAvailableUsers.length !== 1 ? 's' : ''} available
              </div>
              <motion.button
                type="button"
                onClick={() => {
                  // Move all filtered users
                  handleMoveSelectedToManagers(filteredAvailableUsers.map(user => user._id));
                }}
                className="flex items-center text-sm px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-500"
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                disabled={filteredAvailableUsers.length === 0}
              >
                Select All Users
              </motion.button>
            </div>
          </div>
        </motion.div>
        
        {/* Right Pane - Assigned Team Managers */}
        <motion.div 
          className="bg-gray-800/50 backdrop-blur-sm rounded-lg shadow-lg border border-gray-700 overflow-hidden"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <div className="p-5 border-b border-gray-700 flex justify-between items-center">
            <div>
              <div className="flex items-center">
                <FiUserPlus className="text-blue-400 mr-2 text-xl" />
                <h2 className="text-xl font-semibold text-white">Assigned Team Managers</h2>
              </div>
              <p className="text-xs text-gray-400 mt-1">
                {selectedUsers.length > 0 
                  ? `${selectedUsers.length} user${selectedUsers.length > 1 ? 's' : ''} selected for manager role`
                  : 'Select users from the left panel to assign as team managers'}
              </p>
            </div>
          </div>
          
          {/* Selected users */}
          <div className="p-4 overflow-y-auto" style={{ height: '390px' }}>
            {selectedUsers.length > 0 ? (
              <div className="space-y-4">
                {selectedUsers.map(user => (
                  <motion.div 
                    key={user._id}
                    className="bg-gradient-to-r from-gray-700/40 to-gray-700/20 border border-gray-600 rounded-lg p-4 hover:border-blue-500/30 hover:from-gray-700/50 hover:to-gray-700/30 transition-all duration-300 shadow-sm"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                  >
                    <div className="flex justify-between items-center">
                      <div className="flex items-center">
                        {user.avatar && typeof user.avatar === 'string' && user.avatar.startsWith('http') ? (
                          <div className="relative">
                            <img 
                              src={user.avatar} 
                              alt={user.displayName} 
                              className="w-12 h-12 rounded-lg mr-4 object-cover border-2 border-blue-500/30 shadow-md" 
                            />
                          </div>
                        ) : (
                          <div className="relative">
                            <div className="w-12 h-12 rounded-lg bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold text-lg mr-4 shadow-md">
                              {(user.displayName || user.firstName)?.charAt(0) || '?'}
                            </div>
                          </div>
                        )}
                        <div>
                          <h3 className="font-medium text-white text-base">
                            {user.displayName || `${user.firstName} ${user.lastName}`}
                          </h3>
                          <p className="text-gray-400 text-sm">{user.email}</p>
                          {user.title && <p className="text-gray-500 text-xs mt-0.5">{user.title}</p>}
                        </div>
                      </div>
                      <motion.button
                        onClick={() => handleRemoveUser(user._id)}
                        className="p-2 text-gray-400 hover:text-red-400 rounded-full hover:bg-gray-700/70 transition-colors duration-200"
                        whileHover={{ scale: 1.1, backgroundColor: 'rgba(239, 68, 68, 0.2)' }}
                        whileTap={{ scale: 0.9 }}
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                        </svg>
                      </motion.button>
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center py-10 text-gray-400">
                <div className="bg-gray-700/30 rounded-full p-4 mb-4">
                  <FiUserPlus className="text-blue-400 text-3xl" />
                </div>
                <p className="text-lg font-medium text-gray-300 mb-1">No managers assigned yet</p>
                <p className="text-sm max-w-xs">Select users from the left panel to assign them manager roles</p>
                <motion.div 
                  className="mt-5 flex items-center text-blue-400"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5 }}
                >
                  <svg className="w-5 h-5 mr-1 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 9l3 3m0 0l-3 3m3-3H8m13 0a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                  </svg>
                  <span className="text-sm">Select from available users</span>
                </motion.div>
              </div>
            )}
          </div>
          
          {/* Bottom action bar - Assign Roles button */}
          <div className="p-4 border-t border-gray-700 bg-gray-800/60">
            <div className="flex flex-col gap-4">
              <div className="bg-gray-700/40 rounded-lg p-3 border border-gray-600">
                <div className="flex items-center mb-2">
                  <span className="text-gray-300 text-sm font-medium flex items-center">
                    <FiSettings className="mr-2 text-blue-400" /> 
                    Allowed Integrations
                  </span>
                  {loadingIntegrations && (
                    <FiRefreshCw className="animate-spin ml-2 text-gray-400" size={14} />
                  )}
                </div>
                
                <div className="w-full">
                  <MultiSelectIntegrations 
                    selectedIntegrations={selectedIntegrations}
                    onChange={handleIntegrationChange}
                  />
                </div>
                
                {selectedIntegrations.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-3 bg-gray-800/30 p-2 rounded-md">
                    {selectedIntegrations.map(integrationId => {
                      const integration = integrations.find(i => i.id === integrationId);
                      return integration ? (
                        <span 
                          key={integrationId}
                          className="px-2 py-1 bg-blue-900/30 border border-blue-700/40 rounded-md text-xs text-blue-300 flex items-center"
                        >
                          <span className="mr-1.5 text-blue-400">
                            {getIntegrationIcon(integrationId)}
                          </span>
                          {integration.name}
                        </span>
                      ) : null;
                    })}
                  </div>
                )}
              </div>
              
              <motion.button
                type="button"
                onClick={handleAssignManagers}
                className="w-full py-3 px-4 bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-md hover:from-blue-500 hover:to-blue-400 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-md border border-blue-600/50 font-medium"
                whileHover={{ scale: 1.02, boxShadow: "0 4px 10px rgba(59, 130, 246, 0.3)" }}
                whileTap={{ scale: 0.98 }}
                disabled={selectedUsers.length === 0 || selectedIntegrations.length === 0 || isSubmitting}
              >
                {isSubmitting ? (
                  <div className="flex items-center justify-center">
                    <FiRefreshCw className="animate-spin mr-2" />
                    <span>Assigning Roles...</span>
                  </div>
                ) : (
                  <div className="flex items-center justify-center">
                    <FiUserPlus className="mr-2" />
                    <span>{selectedUsers.length > 0 
                      ? `Assign Manager Roles (${selectedUsers.length})` 
                      : "Assign Manager Roles"}
                    </span>
                  </div>
                )}
              </motion.button>
            </div>
          </div>
        </motion.div>
      </div>
      
      {/* Current Team Managers Section */}
      <motion.div 
        className="mt-8 bg-gray-800/50 backdrop-blur-sm rounded-lg shadow-lg border border-gray-700 overflow-hidden"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <div className="p-6 border-b border-gray-700">
          <div className="flex items-center mb-4">
            <FiList className="text-blue-400 mr-2 text-xl" />
            <h2 className="text-xl font-semibold text-white">Current Team Managers</h2>
          </div>
          
          {loadingManagers ? (
            <div className="flex justify-center py-10">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-400"></div>
            </div>
          ) : managers.length === 0 ? (
            <motion.div 
              className="text-center py-8 text-gray-400"
              variants={itemVariants}
            >
              <svg className="mx-auto h-12 w-12 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <p className="mt-2">No team managers assigned yet.</p>
            </motion.div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <AnimatePresence>
                {managers.map(manager => (
                  <motion.div 
                    key={manager._id} 
                    className="group bg-gray-700/30 border border-gray-700 rounded-lg p-4 hover:border-gray-600 transition-colors duration-200"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    whileHover={{ y: -2 }}
                    transition={{ duration: 0.2 }}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex items-start">
                        {manager.managerId?.avatar ? (
                          <img src={manager.managerId.avatar} alt={manager.managerId.firstName} className="w-10 h-10 rounded-md mr-3 object-cover" />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold text-lg mr-3">
                            {manager.managerId?.firstName?.charAt(0) || '?'}
                          </div>
                        )}
                        <div className="ml-3">
                          <h3 className="font-medium text-white">
                            {manager.managerId ? (
                              `${manager.managerId.firstName} ${manager.managerId.lastName}`
                            ) : (
                              'Unknown User'
                            )}
                          </h3>
                          <p className="text-gray-400 text-sm">
                            {manager.managerId?.email}
                          </p>
                        </div>
                      </div>
                      <motion.button
                        onClick={() => handleRevokeManager(manager.managerId._id)}
                        className="px-3 py-1 bg-red-500/20 text-red-400 border border-red-500/40 rounded-md hover:bg-red-500/30 text-sm transition-colors duration-200"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        Revoke
                      </motion.button>
                    </div>
                    
                    <div className="mt-3 pt-3 border-t border-gray-700/50">
                      <p className="text-sm text-gray-400 mb-2">Allowed Integrations:</p>
                      <div className="flex flex-wrap gap-2">
                        {manager.allowedIntegrations.map(integration => (
                          <motion.span 
                            key={integration} 
                            className="px-3 py-1.5 bg-gray-700/50 border border-gray-600 rounded-full text-xs text-gray-300 flex items-center"
                            whileHover={{ scale: 1.05 }}
                          >
                            <span className="mr-1.5 text-gray-400">
                              {getIntegrationIcon(integration)}
                            </span>
                            {integration}
                          </motion.span>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
};

export default TeamManagement; 