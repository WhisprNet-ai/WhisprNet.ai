import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useManager } from '../context/ManagerContext';
import { useScope } from '../context/ScopeContext';
import { useScopedInsights } from '../context/ScopedInsightsContext';
import { format } from 'date-fns';

// Date formatter for charts and displays
const formatDate = (dateString) => {
  const date = new Date(dateString);
  return format(date, 'MMM d, yyyy');
};

const ScopedInsights = () => {
  const { integration } = useParams();
  const navigate = useNavigate();
  const { isManager, managerPermissions, loading: managerLoading } = useManager();
  const { scopes, activeIntegration, setCurrentIntegration } = useScope();
  const { 
    insights, 
    metrics, 
    loading, 
    error, 
    dateRange, 
    updateDateRange, 
    clearError 
  } = useScopedInsights();
  
  const [chartData, setChartData] = useState([]);
  
  // Set active integration from route params or default to first available
  useEffect(() => {
    if (managerPermissions && !managerLoading) {
      if (integration && managerPermissions.allowedIntegrations.includes(integration)) {
        setCurrentIntegration(integration);
      } else if (managerPermissions.allowedIntegrations.length > 0) {
        setCurrentIntegration(managerPermissions.allowedIntegrations[0]);
        // Update URL to match the active integration
        navigate(`/scoped-insights/${managerPermissions.allowedIntegrations[0]}`, { replace: true });
      }
    }
  }, [integration, managerPermissions, managerLoading, setCurrentIntegration, navigate]);
  
  // Process metrics data for charts when it changes
  useEffect(() => {
    if (metrics && metrics.timeSeriesData) {
      setChartData(metrics.timeSeriesData.map(item => ({
        date: item._id,
        count: item.count,
        formattedDate: format(new Date(item._id), 'MMM d')
      })));
    }
  }, [metrics]);
  
  // Change the active integration
  const handleIntegrationChange = (integration) => {
    navigate(`/scoped-insights/${integration}`);
  };
  
  // Update date range for filtering
  const handleDateRangeChange = (e, type) => {
    const date = new Date(e.target.value);
    updateDateRange({
      ...dateRange,
      [type]: date
    });
  };
  
  // Redirect if not a manager
  if (!managerLoading && !isManager) {
    navigate('/dashboard');
    return null;
  }
  
  // Helper to capitalize first letter
  const capitalize = (str) => str.charAt(0).toUpperCase() + str.slice(1);
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Team Insights</h1>
        <button 
          onClick={() => navigate('/dashboard')}
          className="px-4 py-2 bg-gray-200 rounded-md text-gray-700 hover:bg-gray-300"
        >
          Back to Dashboard
        </button>
      </div>
      
      {/* Error message */}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4 flex justify-between items-center">
          <span>{error}</span>
          <button onClick={clearError} className="font-bold">×</button>
        </div>
      )}
      
      {/* Loading state */}
      {managerLoading || loading ? (
        <div className="text-center py-8">
          <p className="text-gray-600">Loading...</p>
        </div>
      ) : (
        <>
          {/* Integration and date range selector */}
          <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            <div className="flex flex-col md:flex-row md:justify-between md:items-center space-y-4 md:space-y-0">
              <div>
                <h2 className="text-xl font-semibold mb-3">Select Integration</h2>
                
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
                        {capitalize(integration)}
                      </button>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-600">No integrations are available for you to manage.</p>
                )}
              </div>
              
              <div>
                <h2 className="text-xl font-semibold mb-3">Date Range</h2>
                <div className="flex items-center space-x-4">
                  <div>
                    <label className="block text-gray-700 text-sm mb-1">Start Date</label>
                    <input
                      type="date"
                      value={format(dateRange.startDate, 'yyyy-MM-dd')}
                      onChange={(e) => handleDateRangeChange(e, 'startDate')}
                      className="px-2 py-1 border rounded-md"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-700 text-sm mb-1">End Date</label>
                    <input
                      type="date"
                      value={format(dateRange.endDate, 'yyyy-MM-dd')}
                      onChange={(e) => handleDateRangeChange(e, 'endDate')}
                      className="px-2 py-1 border rounded-md"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Check if scope exists for this integration */}
          {activeIntegration && !scopes[activeIntegration] ? (
            <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded mb-8">
              <p>You haven't defined a scope for {capitalize(activeIntegration)} yet.</p>
              <button 
                onClick={() => navigate(`/scope/${activeIntegration}`)}
                className="mt-2 px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700"
              >
                Define Scope
              </button>
            </div>
          ) : (
            activeIntegration && (
              <>
                {/* Metrics Summary */}
                <div className="mb-8 grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Total Activity Card */}
                  <div className="bg-white rounded-lg shadow-md p-6">
                    <h3 className="text-lg font-semibold mb-2">Total Activity</h3>
                    <p className="text-4xl font-bold text-blue-600">
                      {metrics?.totalCount?.toLocaleString() || 0}
                    </p>
                    <p className="text-gray-600 mt-1">
                      {formatDate(dateRange.startDate)} - {formatDate(dateRange.endDate)}
                    </p>
                  </div>
                  
                  {/* Scope Size Card */}
                  <div className="bg-white rounded-lg shadow-md p-6">
                    <h3 className="text-lg font-semibold mb-2">Scope Size</h3>
                    <p className="text-4xl font-bold text-green-600">
                      {metrics?.scope?.itemCount || 0}
                    </p>
                    <p className="text-gray-600 mt-1">Users and channels in your scope</p>
                  </div>
                  
                  {/* Top Event Type Card */}
                  <div className="bg-white rounded-lg shadow-md p-6">
                    <h3 className="text-lg font-semibold mb-2">Top Event Type</h3>
                    {metrics?.eventTypeBreakdown && metrics.eventTypeBreakdown.length > 0 ? (
                      <>
                        <p className="text-2xl font-bold text-purple-600">
                          {capitalize(metrics.eventTypeBreakdown[0]._id || 'None')}
                        </p>
                        <p className="text-gray-600 mt-1">
                          {metrics.eventTypeBreakdown[0].count.toLocaleString()} events
                        </p>
                      </>
                    ) : (
                      <p className="text-gray-600">No events recorded</p>
                    )}
                  </div>
                </div>
                
                {/* Activity Timeline */}
                <div className="bg-white rounded-lg shadow-md p-6 mb-8">
                  <h2 className="text-xl font-semibold mb-4">Activity Timeline</h2>
                  
                  {chartData.length > 0 ? (
                    <div className="h-64">
                      <div className="flex items-end h-48 space-x-1">
                        {chartData.map((item, index) => {
                          const maxValue = Math.max(...chartData.map(d => d.count));
                          const height = Math.max((item.count / maxValue) * 100, 5);
                          
                          return (
                            <div key={index} className="flex flex-col items-center flex-1">
                              <div 
                                className="bg-blue-500 hover:bg-blue-600 transition-all rounded-t w-full cursor-pointer relative group"
                                style={{ height: `${height}%` }}
                              >
                                <div className="hidden group-hover:block absolute bottom-full left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs rounded px-2 py-1 mb-1 whitespace-nowrap">
                                  {item.count} events on {item.formattedDate}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                      
                      <div className="flex items-center h-16 space-x-1 mt-2 overflow-x-auto">
                        {chartData.map((item, index) => (
                          <div key={index} className="flex-1 text-center text-xs text-gray-600">
                            {item.formattedDate}
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-16 text-gray-500">
                      <p>No activity data available for the selected period</p>
                    </div>
                  )}
                </div>
                
                {/* Insights Cards */}
                <div className="mb-8">
                  <h2 className="text-xl font-semibold mb-4">Generated Insights</h2>
                  
                  {insights && insights.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {insights.map((insight, index) => (
                        <div key={index} className="bg-white rounded-lg shadow-md p-6">
                          <div className="flex items-start justify-between">
                            <h3 className="text-lg font-semibold mb-2">{insight.title}</h3>
                            <span className="px-2 py-1 bg-gray-200 text-gray-800 rounded-full text-xs">
                              {insight.type}
                            </span>
                          </div>
                          <p className="text-gray-700">{insight.insight}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="bg-white rounded-lg shadow-md p-6 text-center">
                      <p className="text-gray-600">No insights available for the selected filters.</p>
                      <p className="text-gray-600 mt-2">Try changing your date range or scope to get more insights.</p>
                    </div>
                  )}
                </div>
                
                {/* Event Type Breakdown */}
                {metrics?.eventTypeBreakdown && metrics.eventTypeBreakdown.length > 0 && (
                  <div className="bg-white rounded-lg shadow-md p-6">
                    <h2 className="text-xl font-semibold mb-4">Event Type Breakdown</h2>
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead>
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Event Type
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Count
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Percentage
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {metrics.eventTypeBreakdown.map((event, index) => (
                            <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                {capitalize(event._id)}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {event.count.toLocaleString()}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {((event.count / metrics.totalCount) * 100).toFixed(1)}%
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </>
            )
          )}
        </>
      )}
    </div>
  );
};

export default ScopedInsights; 