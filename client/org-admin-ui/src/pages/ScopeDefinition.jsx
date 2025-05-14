import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useManager } from '../context/ManagerContext';
import { useScope } from '../context/ScopeContext';

const ScopeDefinition = () => {
  const { integration } = useParams();
  const navigate = useNavigate();
  const { isManager, managerPermissions, loading: managerLoading } = useManager();
  const { 
    scopes, 
    activeIntegration, 
    loading, 
    error, 
    getIntegrationItems, 
    defineScope, 
    deleteScope, 
    setCurrentIntegration, 
    clearError 
  } = useScope();
  
  const [availableItems, setAvailableItems] = useState({ users: [], channels: [] });
  const [selectedItems, setSelectedItems] = useState([]);
  const [success, setSuccess] = useState('');
  const [loadingItems, setLoadingItems] = useState(false);
  
  // Set active integration from route params or default to first available
  useEffect(() => {
    if (managerPermissions && !managerLoading) {
      if (integration && managerPermissions.allowedIntegrations.includes(integration)) {
        setCurrentIntegration(integration);
      } else if (managerPermissions.allowedIntegrations.length > 0) {
        setCurrentIntegration(managerPermissions.allowedIntegrations[0]);
        // Update URL to match the active integration
        navigate(`/scope/${managerPermissions.allowedIntegrations[0]}`, { replace: true });
      }
    }
  }, [integration, managerPermissions, managerLoading, setCurrentIntegration, navigate]);
  
  // Load available items for the active integration
  useEffect(() => {
    const loadItems = async () => {
      if (!activeIntegration) return;
      
      setLoadingItems(true);
      try {
        const items = await getIntegrationItems(activeIntegration);
        setAvailableItems(items);
        
        // If we have a scope, set the selected items
        if (scopes[activeIntegration]) {
          const scopeItemIds = scopes[activeIntegration].scopeItems.map(item => item.itemId);
          setSelectedItems(scopeItemIds);
        } else {
          setSelectedItems([]);
        }
      } catch (err) {
        console.error('Error loading integration items:', err);
      } finally {
        setLoadingItems(false);
      }
    };
    
    loadItems();
  }, [activeIntegration, getIntegrationItems, scopes]);
  
  // Change the active integration
  const handleIntegrationChange = (integration) => {
    navigate(`/scope/${integration}`);
  };
  
  // Toggle an item in the selected items list
  const toggleItem = (itemId) => {
    setSelectedItems(prev => {
      if (prev.includes(itemId)) {
        return prev.filter(id => id !== itemId);
      } else {
        return [...prev, itemId];
      }
    });
  };
  
  // Save the defined scope
  const handleSaveScope = async () => {
    if (selectedItems.length === 0) {
      alert('Please select at least one item for your scope');
      return;
    }
    
    try {
      // Format the scope items
      const scopeItems = selectedItems.map(itemId => {
        // Determine if this is a user or channel
        const user = availableItems.users.find(user => user.id === itemId);
        const channel = availableItems.channels.find(channel => channel.id === itemId);
        
        if (user) {
          return {
            itemId,
            itemType: 'user',
            displayName: user.name
          };
        } else if (channel) {
          return {
            itemId,
            itemType: 'channel',
            displayName: channel.name
          };
        }
        
        // Fallback for unknown items
        return { itemId, itemType: 'unknown' };
      });
      
      await defineScope(activeIntegration, scopeItems);
      
      // Success message
      setSuccess('Scope defined successfully!');
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccess('');
      }, 3000);
    } catch (err) {
      console.error('Error saving scope:', err);
    }
  };
  
  // Remove the current scope
  const handleDeleteScope = async () => {
    if (!window.confirm('Are you sure you want to delete this scope?')) {
      return;
    }
    
    try {
      await deleteScope(activeIntegration);
      setSelectedItems([]);
      
      // Success message
      setSuccess('Scope deleted successfully!');
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccess('');
      }, 3000);
    } catch (err) {
      console.error('Error deleting scope:', err);
    }
  };
  
  // Redirect if not a manager
  if (!managerLoading && !isManager) {
    navigate('/dashboard');
    return null;
  }
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Define Your Team Scope</h1>
        <button 
          onClick={() => navigate('/dashboard')}
          className="px-4 py-2 bg-gray-200 rounded-md text-gray-700 hover:bg-gray-300"
        >
          Back to Dashboard
        </button>
      </div>
      
      {/* Error and success messages */}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4 flex justify-between items-center">
          <span>{error}</span>
          <button onClick={clearError} className="font-bold">×</button>
        </div>
      )}
      
      {success && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative mb-4">
          {success}
        </div>
      )}
      
      {/* Loading state */}
      {managerLoading || loading ? (
        <div className="text-center py-8">
          <p className="text-gray-600">Loading...</p>
        </div>
      ) : (
        <>
          {/* Integration selector */}
          <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            <h2 className="text-xl font-semibold mb-4">Select Integration</h2>
            
            {managerPermissions && managerPermissions.allowedIntegrations.length > 0 ? (
              <div className="flex flex-wrap gap-3">
                {managerPermissions.allowedIntegrations.map(integration => (
                  <button
                    key={integration}
                    onClick={() => handleIntegrationChange(integration)}
                    className={`px-4 py-2 rounded-md ${
                      activeIntegration === integration
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    {integration.charAt(0).toUpperCase() + integration.slice(1)}
                  </button>
                ))}
              </div>
            ) : (
              <p className="text-gray-600">No integrations are available for you to manage.</p>
            )}
          </div>
          
          {/* Scope definition area */}
          {activeIntegration && (
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold">
                  Define {activeIntegration.charAt(0).toUpperCase() + activeIntegration.slice(1)} Scope
                </h2>
                
                <div className="flex space-x-2">
                  <button
                    onClick={handleSaveScope}
                    disabled={selectedItems.length === 0}
                    className={`px-4 py-2 rounded-md ${
                      selectedItems.length === 0
                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        : 'bg-green-600 text-white hover:bg-green-700'
                    }`}
                  >
                    Save Scope
                  </button>
                  
                  {scopes[activeIntegration] && (
                    <button
                      onClick={handleDeleteScope}
                      className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                    >
                      Delete Scope
                    </button>
                  )}
                </div>
              </div>
              
              {loadingItems ? (
                <p className="text-gray-600">Loading items...</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* Users section */}
                  <div>
                    <h3 className="font-medium text-lg mb-3">Users</h3>
                    
                    {availableItems.users.length === 0 ? (
                      <p className="text-gray-600">No users available.</p>
                    ) : (
                      <ul className="max-h-96 overflow-y-auto border rounded-md divide-y">
                        {availableItems.users.map(user => (
                          <li key={user.id} className="p-3">
                            <label className="flex items-center space-x-2 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={selectedItems.includes(user.id)}
                                onChange={() => toggleItem(user.id)}
                                className="form-checkbox h-5 w-5 text-blue-600"
                              />
                              <div>
                                <p className="font-medium">{user.name}</p>
                                <p className="text-gray-600 text-sm">{user.email}</p>
                              </div>
                            </label>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                  
                  {/* Channels section */}
                  <div>
                    <h3 className="font-medium text-lg mb-3">Channels</h3>
                    
                    {availableItems.channels.length === 0 ? (
                      <p className="text-gray-600">No channels available.</p>
                    ) : (
                      <ul className="max-h-96 overflow-y-auto border rounded-md divide-y">
                        {availableItems.channels.map(channel => (
                          <li key={channel.id} className="p-3">
                            <label className="flex items-center space-x-2 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={selectedItems.includes(channel.id)}
                                onChange={() => toggleItem(channel.id)}
                                className="form-checkbox h-5 w-5 text-blue-600"
                              />
                              <div>
                                <p className="font-medium">
                                  {channel.name}
                                  {channel.isPrivate && (
                                    <span className="ml-2 text-xs px-2 py-1 bg-gray-200 rounded-full">
                                      Private
                                    </span>
                                  )}
                                </p>
                              </div>
                            </label>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              )}
              
              {/* Summary of selected items */}
              <div className="mt-6 pt-4 border-t">
                <h3 className="font-medium mb-2">Selected Items: {selectedItems.length}</h3>
                
                {selectedItems.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {selectedItems.map(itemId => {
                      const user = availableItems.users.find(u => u.id === itemId);
                      const channel = availableItems.channels.find(c => c.id === itemId);
                      const displayName = user?.name || channel?.name || itemId;
                      const type = user ? 'User' : channel ? 'Channel' : 'Item';
                      
                      return (
                        <span 
                          key={itemId} 
                          className="px-2 py-1 bg-blue-100 text-blue-800 rounded-md text-sm flex items-center"
                        >
                          <span>{type}: {displayName}</span>
                          <button 
                            onClick={() => toggleItem(itemId)}
                            className="ml-2 text-blue-600 hover:text-blue-800 font-bold"
                          >
                            ×
                          </button>
                        </span>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-gray-600">No items selected. Select users and channels to define your scope.</p>
                )}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default ScopeDefinition; 