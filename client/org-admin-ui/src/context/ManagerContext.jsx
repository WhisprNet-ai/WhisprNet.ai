import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { managerAPI } from '../services/api';

const ManagerContext = createContext();

export const useManager = () => useContext(ManagerContext);

export const ManagerProvider = ({ children }) => {
  const [isManager, setIsManager] = useState(false);
  const [managerPermissions, setManagerPermissions] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Check if the current user is a team manager
  const checkManagerStatus = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await managerAPI.getMyPermissions();
      setIsManager(!!data.permission);
      setManagerPermissions(data.permission);
      return data.permission;
    } catch (err) {
      if (err.response?.status !== 404) {
        // 404 just means not a manager, not an error
        setError(err.response?.data?.message || 'Failed to verify manager status');
      }
      setIsManager(false);
      setManagerPermissions(null);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // Get available integrations that this manager can access
  const getAvailableIntegrations = useCallback(async () => {
    try {
      const { data } = await managerAPI.getAvailableIntegrations();
      return data.integrations || [];
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch available integrations');
      return [];
    }
  }, []);

  // Get manager's connections
  const getManagerConnections = useCallback(async () => {
    try {
      const { data } = await managerAPI.getMyConnections();
      return data.connections || [];
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch manager connections');
      return [];
    }
  }, []);

  // Get all managers for admin view
  const getAllManagers = useCallback(async () => {
    try {
      const { data } = await managerAPI.getManagerPermissions();
      return data.permissions || [];
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch managers');
      return [];
    }
  }, []);

  // Assign manager role to a user
  const assignManagerRole = useCallback(async (userId, allowedIntegrations) => {
    try {
      const { data } = await managerAPI.assignManagerRole(userId, allowedIntegrations);
      return data.permission;
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to assign manager role');
      throw err;
    }
  }, []);

  // Revoke manager role from a user
  const revokeManagerRole = useCallback(async (managerId) => {
    try {
      await managerAPI.revokeManagerRole(managerId);
      return true;
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to revoke manager role');
      throw err;
    }
  }, []);

  // Clear any errors
  const clearError = useCallback(() => setError(null), []);

  useEffect(() => {
    // Check manager status on component mount
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    if (user.role === 'team_manager') {
      checkManagerStatus();
    } else {
      setLoading(false);
    }
  }, [checkManagerStatus]);

  return (
    <ManagerContext.Provider
      value={{
        isManager,
        managerPermissions,
        loading,
        error,
        checkManagerStatus,
        getAvailableIntegrations,
        getManagerConnections,
        getAllManagers,
        assignManagerRole,
        revokeManagerRole,
        clearError
      }}
    >
      {children}
    </ManagerContext.Provider>
  );
};

export default ManagerContext; 