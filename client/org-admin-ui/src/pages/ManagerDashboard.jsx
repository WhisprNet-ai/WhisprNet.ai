import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useManager } from '../context/ManagerContext';
import { format } from 'date-fns';
import { FiUsers, FiActivity, FiPieChart, FiSettings, FiEye } from 'react-icons/fi';
import { managerAPI } from '../services/api';

const ManagerDashboard = () => {
  const navigate = useNavigate();
  const { isManager, managerPermissions, loading: managerLoading, error: managerError } = useManager();
  
  const [metrics, setMetrics] = useState({
    teamMembers: 0,
    insights: 0,
    recentActivity: []
  });
  const [integrations, setIntegrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchManagerData = async () => {
      if (!isManager) return;
      
      try {
        setLoading(true);
        
        // Get available integrations
        const integrationsData = await managerAPI.getAvailableIntegrations();
        if (integrationsData.data && integrationsData.data.integrations) {
          setIntegrations(integrationsData.data.integrations);
        }
        
        // Get team metrics (placeholder until API is implemented)
        // This would typically come from an API call
        setMetrics({
          teamMembers: 12, // Placeholder data
          insights: 48,    // Placeholder data
          recentActivity: [
            { id: 1, type: 'message', user: 'Sara Kim', timestamp: new Date(), description: 'New message in #engineering' },
            { id: 2, type: 'file', user: 'James Wilson', timestamp: new Date(Date.now() - 3600000), description: 'Shared design-specs.pdf in #product' },
            { id: 3, type: 'mention', user: 'Anjali Patel', timestamp: new Date(Date.now() - 7200000), description: 'Mentioned you in #marketing' }
          ]
        });
        
        setLoading(false);
      } catch (err) {
        console.error('Error fetching manager data:', err);
        setError('Failed to load dashboard data. Please try again later.');
        setLoading(false);
      }
    };
    
    if (!managerLoading && isManager) {
      fetchManagerData();
    }
  }, [isManager, managerLoading]);

  // Redirect if not a manager
  useEffect(() => {
    if (!managerLoading && !isManager) {
      navigate('/dashboard');
    }
  }, [isManager, managerLoading, navigate]);

  // Helper to format relative time
  const formatRelativeTime = (date) => {
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);
    
    if (diffInSeconds < 60) return `${diffInSeconds} seconds ago`;
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
    return format(date, 'MMM d, yyyy');
  };

  if (managerLoading || loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error || managerError) {
    return (
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4">
        {error || managerError}
      </div>
    );
  }

  // Helper to capitalize strings
  const capitalize = (str) => str.charAt(0).toUpperCase() + str.slice(1);

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Team Manager Dashboard</h1>
      
      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-blue-100 text-blue-500 mr-4">
              <FiUsers className="text-xl" />
            </div>
            <div>
              <p className="text-gray-500 text-sm">Team Members</p>
              <h3 className="text-2xl font-bold">{metrics.teamMembers}</h3>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-purple-100 text-purple-500 mr-4">
              <FiActivity className="text-xl" />
            </div>
            <div>
              <p className="text-gray-500 text-sm">Recent Insights</p>
              <h3 className="text-2xl font-bold">{metrics.insights}</h3>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-green-100 text-green-500 mr-4">
              <FiEye className="text-xl" />
            </div>
            <div>
              <p className="text-gray-500 text-sm">Integrations</p>
              <h3 className="text-2xl font-bold">{integrations.length}</h3>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-yellow-100 text-yellow-500 mr-4">
              <FiSettings className="text-xl" />
            </div>
            <div>
              <p className="text-gray-500 text-sm">Settings</p>
              <button 
                onClick={() => navigate('/scope')}
                className="text-blue-500 hover:underline text-sm"
              >
                Configure Scope
              </button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Integrations Section */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-8 border border-gray-200">
        <h2 className="text-xl font-bold text-gray-800 mb-4">Your Integrations</h2>
        
        {integrations.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {integrations.map((integration, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-4 hover:border-blue-500 transition-colors duration-200">
                <h3 className="font-medium text-lg mb-2">{capitalize(integration)}</h3>
                <div className="flex justify-between items-center mt-4">
                  <button 
                    onClick={() => navigate(`/scoped-insights/${integration}`)}
                    className="text-blue-500 hover:underline"
                  >
                    View Insights
                  </button>
                  <button 
                    onClick={() => navigate(`/scope/${integration}`)}
                    className="text-gray-500 hover:underline"
                  >
                    Configure
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500">No integrations available. Contact your administrator to set up integrations.</p>
        )}
      </div>
      
      {/* Recent Activity */}
      <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
        <h2 className="text-xl font-bold text-gray-800 mb-4">Recent Team Activity</h2>
        
        {metrics.recentActivity.length > 0 ? (
          <div className="divide-y divide-gray-200">
            {metrics.recentActivity.map((activity) => (
              <div key={activity.id} className="py-4 flex items-start">
                <div className="mr-4">
                  <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                    {activity.type === 'message' && <FiActivity className="text-blue-500" />}
                    {activity.type === 'file' && <FiActivity className="text-green-500" />}
                    {activity.type === 'mention' && <FiActivity className="text-purple-500" />}
                  </div>
                </div>
                <div className="flex-1">
                  <p className="text-gray-800 font-medium">{activity.user}</p>
                  <p className="text-gray-600 text-sm">{activity.description}</p>
                  <p className="text-gray-400 text-xs mt-1">{formatRelativeTime(activity.timestamp)}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500">No recent activity.</p>
        )}
      </div>
    </div>
  );
};

export default ManagerDashboard; 