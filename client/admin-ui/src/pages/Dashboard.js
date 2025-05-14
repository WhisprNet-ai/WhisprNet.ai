import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { authAPI } from '../services/api';
import api from '../services/api';

const Dashboard = () => {
  const [stats, setStats] = useState([
    { id: 1, name: 'Total Organizations', value: '0', change: '0%', changeType: 'neutral' },
    { id: 2, name: 'Active Organizations', value: '0', change: '0', changeType: 'neutral' },
    { id: 3, name: 'Total Users', value: '0', change: '0', changeType: 'neutral' },
    { id: 4, name: 'Total Whispers', value: '0%', change: '0%', changeType: 'neutral' },
  ]);
  
  const [recentWhispers, setRecentWhispers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [totalWhispers, setTotalWhispers] = useState(0);
  const [systemStatus, setSystemStatus] = useState({
    api: 'operational',
    database: 'operational',
    ml: 'operational'
  });

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    setError(null); // Reset error state
    try {
      // Fetch admin dashboard metrics
      console.log('Fetching admin dashboard data...');
      const dashboardResponse = await api.get('/admin/dashboard/metrics');
      console.log('Admin dashboard data received:', dashboardResponse.data);
      
      // Fetch recent whispers across all organizations
      console.log('Fetching recent whispers...');
      const whisperResponse = await api.get('/admin/whispers/recent');
      console.log('Whisper data received:', whisperResponse?.data);
      
      const dashboardData = dashboardResponse?.data?.data || {};
      const whispers = whisperResponse?.data?.data || [];
      
      // Update total whispers count
      setTotalWhispers(dashboardData.totalWhispers || 0);
      
      // Process recent whispers for display
      const processedWhispers = whispers.map(whisper => ({
        id: whisper._id,
        title: whisper.title || whisper.content?.title || 'Untitled Whisper',
        category: whisper.tags?.[0] || whisper.category || 'insight',
        priority: getPriorityFromWhisper(whisper),
        createdAt: whisper.createdAt,
        organizationName: whisper.organization?.name || 'Unknown'
      }));
      
      setRecentWhispers(processedWhispers);
      
      // Update stats
      setStats([
        { 
          id: 1, 
          name: 'Total Organizations', 
          value: dashboardData.totalOrganizations?.toString() || '0', 
          change: dashboardData.organizationGrowth || '+0%', 
          changeType: dashboardData.organizationGrowth?.startsWith('+') ? 'increase' : 'decrease' 
        },
        { 
          id: 2, 
          name: 'Active Organizations', 
          value: dashboardData.activeOrganizations?.toString() || '0', 
          change: `${dashboardData.activeOrganizationsPercent || '0'}%`, 
          changeType: 'neutral'
        },
        { 
          id: 3, 
          name: 'Total Users', 
          value: dashboardData.totalUsers?.toString() || '0', 
          change: dashboardData.userGrowth || '+0%', 
          changeType: dashboardData.userGrowth?.startsWith('+') ? 'increase' : 'decrease'
        },
        { 
          id: 4, 
          name: 'Total Whispers', 
          value: dashboardData.totalWhispers?.toString() || '0', 
          change: dashboardData.whisperGrowth || '+0%', 
          changeType: dashboardData.whisperGrowth?.startsWith('+') ? 'increase' : 'decrease'
        },
      ]);
      
      // Update system status
      setSystemStatus({
        api: dashboardData.systemStatus?.api || 'operational',
        database: dashboardData.systemStatus?.database || 'operational',
        ml: dashboardData.systemStatus?.ml || 'operational'
      });
      
      setLoading(false);
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      if (err.response) {
        // The request was made and the server responded with a status code that falls out of the range of 2xx
        console.error('Response data:', err.response.data);
        console.error('Response status:', err.response.status);
        console.error('Response headers:', err.response.headers);
        
        setError(`Server error: ${err.response.status} - ${err.response.data.message || err.response.data.error || 'Unknown error'}`);
      } else if (err.request) {
        // The request was made but no response was received
        console.error('Request made but no response received:', err.request);
        setError('No response from server. Please check your network connection.');
      } else {
        // Something happened in setting up the request that triggered an Error
        console.error('Error setting up request:', err.message);
        setError(`Error: ${err.message}`);
      }
      setLoading(false);
    }
  };

  // Function to determine priority based on whisper data
  const getPriorityFromWhisper = (whisper) => {
    // This would be based on real logic in a production app
    if (whisper.status === 'published') return 'high';
    if (whisper.tags?.includes('urgent')) return 'critical';
    return 'medium';
  };

  // Function to format date
  const formatDate = (dateString) => {
    const options = { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  // Function to get category badge class
  const getCategoryBadgeClass = (category) => {
    switch (category) {
      case 'insight':
        return 'bg-blue-900/50 text-blue-300 border border-blue-500/50';
      case 'warning':
        return 'bg-amber-900/50 text-amber-300 border border-amber-500/50';
      case 'alert':
        return 'bg-red-900/50 text-red-300 border border-red-500/50';
      case 'suggestion':
        return 'bg-emerald-900/50 text-emerald-300 border border-emerald-500/50';
      default:
        return 'bg-gray-800 text-gray-300 border border-gray-600';
    }
  };

  // Function to get priority indicator class
  const getPriorityIndicatorClass = (priority) => {
    switch (priority) {
      case 'high':
        return 'bg-red-500 animate-pulse';
      case 'medium':
        return 'bg-amber-500';
      case 'low':
        return 'bg-green-500';
      case 'critical':
        return 'bg-purple-500 animate-pulse';
      default:
        return 'bg-gray-500';
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="spinner-border animate-spin inline-block w-8 h-8 border-4 rounded-full text-blue-500" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-900/50 text-red-300 border border-red-500/50 p-6 rounded-lg">
        <h3 className="text-lg font-semibold mb-3">Error Loading Dashboard</h3>
        <div>
          <p className="mb-3">{error}</p>
          <div className="text-sm text-red-400 mb-3">
            <p>This could be due to:</p>
            <ul className="list-disc ml-5 mt-1">
              <li>Server may not be running</li>
              <li>Authentication token may be expired</li>
              <li>API endpoints mismatch between client and server</li>
              <li>Network connectivity issues</li>
            </ul>
          </div>
        </div>
        
        <div className="flex space-x-3">
          <button 
            onClick={fetchDashboardData}
            className="px-4 py-2 bg-red-800 text-white rounded-lg hover:bg-red-700"
          >
            Try Again
          </button>
          <button 
            onClick={() => {
              localStorage.removeItem('token');
              window.location.href = '/login';
            }}
            className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600"
          >
            Logout & Re-login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">
          Dashboard
        </h1>
        <p className="mt-2 text-gray-400">
          Overview of your WhisprNet.ai monitoring system
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        {stats.map((stat) => (
          <div 
            key={stat.id} 
            className="relative overflow-hidden bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-700 shadow-lg px-4 py-5 sm:p-6 hover:shadow-cyan-900/20 hover:border-cyan-800/50 transition-all duration-300"
          >
            <dt className="text-sm font-medium text-gray-400 truncate">
              {stat.name}
            </dt>
            <dd className="mt-1 flex justify-between items-baseline">
              <div className="flex items-baseline text-2xl font-semibold text-cyan-400">
                {stat.value}
                {stat.change && (
                  <span className={`ml-2 text-sm font-medium ${
                    stat.changeType === 'increase' ? 'text-green-500' : 
                    stat.changeType === 'decrease' ? 'text-red-500' : 'text-gray-500'
                  }`}>
                    {stat.change}
                  </span>
                )}
              </div>
            </dd>
            {/* Abstract background element */}
            <div className="absolute -bottom-6 -right-6 w-24 h-24 rounded-full bg-gradient-to-r from-cyan-500/20 to-blue-500/20 blur-xl"></div>
          </div>
        ))}
      </div>

      {/* Recent Whispers */}
      <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-700 shadow-lg overflow-hidden">
        <div className="px-4 py-5 sm:px-6 flex justify-between items-center border-b border-gray-700">
          <h3 className="text-lg leading-6 font-medium text-gray-200">
            Recent Whispers
          </h3>
          <Link
            to="/whispers"
            className="text-sm font-medium text-cyan-400 hover:text-cyan-300 transition-colors"
          >
            View all
          </Link>
        </div>
        <ul className="divide-y divide-gray-700">
          {recentWhispers.length === 0 ? (
            <li className="px-4 py-5 sm:px-6 text-center text-gray-400">
              No recent whispers found.
            </li>
          ) : (
            recentWhispers.map((whisper) => (
              <li key={whisper.id} className="group hover:bg-gray-800/50 transition-colors">
                <div className="px-4 py-4 sm:px-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-start">
                      <div className={`min-w-2 h-2 w-2 mt-1.5 mr-2 rounded-full shrink-0 
                        ${getPriorityIndicatorClass(whisper.priority)}`}></div>
                      <div>
                        <p className="text-sm font-medium text-gray-200 group-hover:text-cyan-400 transition-colors">
                          {whisper.title}
                        </p>
                        <p className="mt-1 flex text-xs text-gray-400">
                          <span>{formatDate(whisper.createdAt)}</span>
                          <span className="mx-1.5">•</span>
                          <span>{whisper.organizationName}</span>
                        </p>
                      </div>
                    </div>
                    <div>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getCategoryBadgeClass(whisper.category)}`}>
                        {whisper.category}
                      </span>
                    </div>
                  </div>
                </div>
              </li>
            ))
          )}
        </ul>
        <div className="px-4 py-4 sm:px-6 border-t border-gray-700 bg-gradient-to-r from-gray-800/50 to-gray-900/50">
          <div className="flex items-center justify-between text-sm">
            <div className="font-medium text-gray-400">
              Showing {recentWhispers.length} of {totalWhispers} whispers
            </div>
            <div className="flex space-x-1">
              <button 
                className="inline-flex items-center px-2.5 py-1.5 border border-gray-700 text-xs font-medium rounded text-gray-300 bg-gray-800 hover:bg-gray-700"
                disabled
              >
                Previous
              </button>
              <button 
                className="inline-flex items-center px-2.5 py-1.5 border border-gray-700 text-xs font-medium rounded text-gray-300 bg-gray-800 hover:bg-gray-700"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* System Status Card */}
      <div className="mt-8 bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-700 shadow-lg overflow-hidden">
        <div className="px-4 py-5 sm:px-6 border-b border-gray-700">
          <h3 className="text-lg leading-6 font-medium text-gray-200">
            System Status
          </h3>
        </div>
        <div className="px-4 py-5 sm:p-6">
          <div className="flex items-center space-x-4">
            <div className="flex-shrink-0">
              <div className="flex items-center justify-center w-12 h-12 rounded-full bg-green-900/30 border border-green-500/30">
                <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse"></div>
              </div>
            </div>
            <div>
              <h4 className="text-lg font-medium text-gray-200">All Systems Operational</h4>
              <p className="mt-1 text-sm text-gray-400">
                Last checked: {new Date().toLocaleTimeString()}
              </p>
            </div>
          </div>
          <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            <div className="flex items-center p-3 rounded-lg bg-gray-700/50 border border-gray-600">
              <div className={`w-2 h-2 rounded-full ${systemStatus.api === 'operational' ? 'bg-green-500' : 'bg-red-500'} mr-2`}></div>
              <div className="text-sm text-gray-300">API: {systemStatus.api}</div>
            </div>
            <div className="flex items-center p-3 rounded-lg bg-gray-700/50 border border-gray-600">
              <div className={`w-2 h-2 rounded-full ${systemStatus.database === 'operational' ? 'bg-green-500' : 'bg-red-500'} mr-2`}></div>
              <div className="text-sm text-gray-300">Database: {systemStatus.database}</div>
            </div>
            <div className="flex items-center p-3 rounded-lg bg-gray-700/50 border border-gray-600">
              <div className={`w-2 h-2 rounded-full ${systemStatus.ml === 'operational' ? 'bg-green-500' : 'bg-red-500'} mr-2`}></div>
              <div className="text-sm text-gray-300">ML Inference: {systemStatus.ml}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard; 