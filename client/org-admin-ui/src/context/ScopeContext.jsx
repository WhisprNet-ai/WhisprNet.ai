import React, { createContext, useState, useContext, useEffect } from 'react';
import { scopeAPI } from '../services/api';
import { useManager } from './ManagerContext';

const ScopeContext = createContext();

export const useScope = () => useContext(ScopeContext);

export const ScopeProvider = ({ children }) => {
  const { isManager } = useManager();
  const [scopes, setScopes] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeIntegration, setActiveIntegration] = useState(null);

  // Load all scopes for the current manager
  const loadAllScopes = async () => {
    if (!isManager) return;
    
    setLoading(true);
    try {
      const { data } = await scopeAPI.getAllScopes();
      
      // Transform array into object by integration
      const scopesMap = {};
      data.scopes.forEach(scope => {
        scopesMap[scope.integration] = scope;
      });
      
      setScopes(scopesMap);
      return scopesMap;
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load scopes');
      return {};
    } finally {
      setLoading(false);
    }
  };

  // Get scope for a specific integration
  const getScope = async (integration) => {
    setLoading(true);
    try {
      const { data } = await scopeAPI.getScope(integration);
      
      // Update the scopes state
      setScopes(prev => ({
        ...prev,
        [integration]: data.scope
      }));
      
      return data.scope;
    } catch (err) {
      setError(err.response?.data?.message || `Failed to get scope for ${integration}`);
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Define scope for an integration
  const defineScope = async (integration, scopeItems) => {
    setLoading(true);
    try {
      const { data } = await scopeAPI.defineScope(integration, scopeItems);
      
      // Update the scopes state
      setScopes(prev => ({
        ...prev,
        [integration]: data.scope
      }));
      
      return data.scope;
    } catch (err) {
      setError(err.response?.data?.message || `Failed to define scope for ${integration}`);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Delete scope for an integration
  const deleteScope = async (integration) => {
    setLoading(true);
    try {
      await scopeAPI.deleteScope(integration);
      
      // Remove from scopes state
      setScopes(prev => {
        const newScopes = { ...prev };
        delete newScopes[integration];
        return newScopes;
      });
      
      return true;
    } catch (err) {
      setError(err.response?.data?.message || `Failed to delete scope for ${integration}`);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Get available items for scope definition
  const getIntegrationItems = async (integration) => {
    try {
      const { data } = await scopeAPI.getIntegrationItems(integration);
      return {
        users: data.users || [],
        channels: data.channels || []
      };
    } catch (err) {
      setError(err.response?.data?.message || `Failed to get items for ${integration}`);
      return { users: [], channels: [] };
    }
  };

  // Set active integration for the UI
  const setCurrentIntegration = (integration) => {
    setActiveIntegration(integration);
    // Load scope for this integration if not already loaded
    if (!scopes[integration]) {
      getScope(integration);
    }
  };

  // Clear errors
  const clearError = () => setError(null);

  useEffect(() => {
    if (isManager) {
      loadAllScopes();
    }
  }, [isManager]);

  return (
    <ScopeContext.Provider
      value={{
        scopes,
        loading,
        error,
        activeIntegration,
        loadAllScopes,
        getScope,
        defineScope,
        deleteScope,
        getIntegrationItems,
        setCurrentIntegration,
        clearError
      }}
    >
      {children}
    </ScopeContext.Provider>
  );
};

export default ScopeContext; 