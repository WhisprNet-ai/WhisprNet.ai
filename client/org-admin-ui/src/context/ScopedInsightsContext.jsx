import React, { createContext, useState, useContext, useEffect } from 'react';
import { scopedInsightsAPI } from '../services/api';
import { useScope } from './ScopeContext';

const ScopedInsightsContext = createContext();

export const useScopedInsights = () => useContext(ScopedInsightsContext);

export const ScopedInsightsProvider = ({ children }) => {
  const { activeIntegration, scopes } = useScope();
  const [insights, setInsights] = useState([]);
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [dateRange, setDateRange] = useState({
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
    endDate: new Date()
  });

  // Get scoped insights for the active integration
  const loadScopedInsights = async (integration = activeIntegration, params = {}) => {
    if (!integration || !scopes[integration]) return;
    
    setLoading(true);
    try {
      // Merge date range with params
      const requestParams = {
        ...params,
        startDate: dateRange.startDate.toISOString(),
        endDate: dateRange.endDate.toISOString()
      };
      
      const { data } = await scopedInsightsAPI.getScopedMetadataInsights(integration, requestParams);
      setInsights(data.insights || []);
      return data.insights;
    } catch (err) {
      setError(err.response?.data?.message || `Failed to load insights for ${integration}`);
      return [];
    } finally {
      setLoading(false);
    }
  };

  // Get scoped metrics for the active integration
  const loadScopedMetrics = async (integration = activeIntegration, params = {}) => {
    if (!integration || !scopes[integration]) return;
    
    setLoading(true);
    try {
      // Merge date range with params
      const requestParams = {
        ...params,
        startDate: dateRange.startDate.toISOString(),
        endDate: dateRange.endDate.toISOString()
      };
      
      const { data } = await scopedInsightsAPI.getScopedMetadataMetrics(integration, requestParams);
      setMetrics(data);
      return data;
    } catch (err) {
      setError(err.response?.data?.message || `Failed to load metrics for ${integration}`);
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Update date range and reload data
  const updateDateRange = (newRange) => {
    setDateRange(newRange);
  };

  // Clear errors
  const clearError = () => setError(null);

  // Load data when integration changes
  useEffect(() => {
    if (activeIntegration && scopes[activeIntegration]) {
      loadScopedInsights();
      loadScopedMetrics();
    }
  }, [activeIntegration, scopes, dateRange]);

  return (
    <ScopedInsightsContext.Provider
      value={{
        insights,
        metrics,
        loading,
        error,
        dateRange,
        loadScopedInsights,
        loadScopedMetrics,
        updateDateRange,
        clearError
      }}
    >
      {children}
    </ScopedInsightsContext.Provider>
  );
};

export default ScopedInsightsContext; 