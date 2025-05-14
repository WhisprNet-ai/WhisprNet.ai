import React, { createContext, useState, useContext, useEffect } from 'react';
import { organizationAPI } from '../services/api';

// Create context
const OrganizationContext = createContext();

// Provider component
export const OrganizationProvider = ({ children }) => {
  const [organization, setOrganization] = useState({
    name: 'WhisprNet',
    id: '',
    isLoading: true,
    error: null
  });

  // Fetch organization data
  useEffect(() => {
    const fetchOrganization = async () => {
      try {
        const response = await organizationAPI.getCurrent();
        if (response.data && response.data.success) {
          setOrganization({
            name: response.data.data.name,
            id: response.data.data._id,
            isLoading: false,
            error: null
          });
        }
      } catch (error) {
        console.error('Error fetching organization data:', error);
        setOrganization(prev => ({
          ...prev,
          isLoading: false,
          error: 'Failed to load organization data'
        }));
      }
    };

    fetchOrganization();
  }, []);

  return (
    <OrganizationContext.Provider value={organization}>
      {children}
    </OrganizationContext.Provider>
  );
};

// Custom hook to use the organization context
export const useOrganization = () => {
  const context = useContext(OrganizationContext);
  if (context === undefined) {
    throw new Error('useOrganization must be used within an OrganizationProvider');
  }
  return context;
};

export default OrganizationContext; 