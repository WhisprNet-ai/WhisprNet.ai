import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts';
import CountUp from 'react-countup';
import { dashboardAPI, getCurrentOrganizationId } from '../services/api';

// Pre-defined chart colors
const COLORS = ['#0ea5e9', '#0284c7', '#0369a1', '#075985'];

// Custom Card Component
const Card = ({ icon, title, value, loading, error, link, linkText, color = 'blue' }) => {
  const colorVariants = {
    blue: {
      bg: 'bg-blue-500',
      bgOpacity: 'bg-opacity-10',
      text: 'text-blue-500',
      hoverText: 'hover:text-blue-400',
      gradient: 'from-blue-500 to-blue-600'
    },
    green: {
      bg: 'bg-emerald-500',
      bgOpacity: 'bg-opacity-10',
      text: 'text-emerald-500',
      hoverText: 'hover:text-emerald-400',
      gradient: 'from-emerald-500 to-cyan-400'
    },
    purple: {
      bg: 'bg-purple-500',
      bgOpacity: 'bg-opacity-10',
      text: 'text-purple-500',
      hoverText: 'hover:text-purple-400',
      gradient: 'from-purple-500 to-indigo-500'
    }
  };

  const colors = colorVariants[color] || colorVariants.blue;

  return (
    <motion.div 
      className="p-6 bg-gray-800/80 rounded-lg border border-gray-700/50 shadow-lg backdrop-blur-sm"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      whileHover={{ 
        y: -5,
        boxShadow: '0 10px 25px -5px rgba(15, 23, 42, 0.3)',
        transition: { duration: 0.2 }
      }}
    >
      <div className="flex items-center">
        <div className={`p-3 rounded-lg ${colors.bg} ${colors.bgOpacity}`}>
          {icon}
        </div>
        <div className="ml-4">
          <h2 className="font-semibold text-white">{title}</h2>
          {loading ? (
            <div className="animate-pulse h-5 w-20 bg-gray-700 rounded mt-1"></div>
          ) : error ? (
            <p className="mt-1 text-sm text-red-400">Error loading data</p>
          ) : (
            <p className="mt-1 text-lg font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary-400 to-primary-600">
              <CountUp end={value} duration={2} separator="," />
            </p>
          )}
        </div>
      </div>
      {link && (
        <div className="mt-4">
          <Link to={link} className={`text-sm font-medium ${colors.text} ${colors.hoverText} transition-colors flex items-center`}>
            {linkText || 'View details'} 
            <svg className="ml-1 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          </Link>
        </div>
      )}
    </motion.div>
  );
};

// Activity Item Component
const ActivityItem = ({ activity, index }) => {
  const getActivityIcon = (type) => {
    switch(type) {
      case 'integration':
        return (
          <div className="p-2 rounded-full bg-blue-500 bg-opacity-10 text-blue-400">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14H11V21L20 10H13Z" />
            </svg>
          </div>
        );
      case 'whisper':
        return (
          <div className="p-2 rounded-full bg-emerald-500 bg-opacity-10 text-emerald-400">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </div>
        );
      case 'user':
        return (
          <div className="p-2 rounded-full bg-purple-500 bg-opacity-10 text-purple-400">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
        );
      default:
        return (
          <div className="p-2 rounded-full bg-gray-500 bg-opacity-10 text-gray-400">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        );
    }
  };

  return (
    <motion.li 
      className="p-4 hover:bg-gray-750 border-b border-gray-700/50 last:border-0"
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
      whileHover={{ backgroundColor: 'rgba(55, 65, 81, 0.4)' }}
    >
      <div className="flex items-center">
        <div className="mr-4">
          {getActivityIcon(activity.type)}
        </div>
        <div className="flex-1">
          <p className="text-sm text-white">{activity.message}</p>
          <p className="text-xs text-gray-400">{activity.time}</p>
        </div>
      </div>
    </motion.li>
  );
};

// Sample chart data
const activityData = [
  { name: 'Mon', value: 12 },
  { name: 'Tue', value: 19 },
  { name: 'Wed', value: 15 },
  { name: 'Thu', value: 27 },
  { name: 'Fri', value: 21 },
  { name: 'Sat', value: 8 },
  { name: 'Sun', value: 11 },
];

const distributionData = [
  { name: 'GitHub', value: 40 },
  { name: 'Slack', value: 30 },
  { name: 'Gmail', value: 20 },
  { name: 'Jira', value: 10 },
];

// Main Dashboard Component
const Dashboard = () => {
  const [metrics, setMetrics] = useState({
    integrations: { total: 0, connected: 0 },
    whispers: { total: 0, thisMonth: 0 },
    teamMembers: { total: 0, active: 0 }
  });
  const [integrations, setIntegrations] = useState([]);
  const [recentActivity, setRecentActivity] = useState([]);
  const [loading, setLoading] = useState({
    metrics: true,
    integrations: true,
    activity: true
  });
  const [error, setError] = useState({
    metrics: null,
    integrations: null,
    activity: null
  });

  useEffect(() => {
    // Fetch dashboard data on component mount
    const fetchDashboardData = async () => {
      const organizationId = getCurrentOrganizationId();
      
      // Fetch metrics
      try {
        const metricsResponse = await dashboardAPI.getMetrics();
        console.log('Dashboard metrics response:', metricsResponse);
        if (metricsResponse.data && metricsResponse.data.success) {
          setMetrics(metricsResponse.data.data);
        }
        setLoading(prev => ({ ...prev, metrics: false }));
      } catch (err) {
        console.error('Error fetching dashboard metrics:', err);
        setError(prev => ({ 
          ...prev, 
          metrics: 'Failed to load dashboard metrics' 
        }));
        setLoading(prev => ({ ...prev, metrics: false }));
      }
      
      // Fetch integration status
      try {
        const integrationsResponse = await dashboardAPI.getIntegrationStatus();
        if (integrationsResponse.data && integrationsResponse.data.success) {
          setIntegrations(integrationsResponse.data.data);
        }
        setLoading(prev => ({ ...prev, integrations: false }));
      } catch (err) {
        console.error('Error fetching integration status:', err);
        setError(prev => ({ 
          ...prev, 
          integrations: 'Failed to load integration status' 
        }));
        // Fallback to mock data for development
        setIntegrations([
          { name: 'Gmail', status: 'connected', icon: '📧', path: '/integrations/gmail' },
          { name: 'GitHub', status: 'disconnected', icon: '🔄', path: '/integrations/github' },
          { name: 'Slack', status: 'connected', icon: '💬', path: '/integrations/slack' }
        ]);
        setLoading(prev => ({ ...prev, integrations: false }));
      }
      
      // Fetch recent activity
      try {
        const activityResponse = await dashboardAPI.getRecentActivity(5);
        if (activityResponse.data && activityResponse.data.success) {
          setRecentActivity(activityResponse.data.data);
        }
        setLoading(prev => ({ ...prev, activity: false }));
      } catch (err) {
        console.error('Error fetching recent activity:', err);
        setError(prev => ({ 
          ...prev, 
          activity: 'Failed to load recent activity' 
        }));
        // Fallback to mock data for development
        setRecentActivity([
          { id: 1, type: 'integration', message: 'Gmail integration refreshed', time: '3 hours ago' },
          { id: 2, type: 'whisper', message: 'New whisper created from GitHub data', time: '1 day ago' },
          { id: 3, type: 'user', message: 'Jane Doe joined the organization', time: '2 days ago' },
          { id: 4, type: 'integration', message: 'Slack integration connected', time: '3 days ago' }
        ]);
        setLoading(prev => ({ ...prev, activity: false }));
      }
    };
    
    fetchDashboardData();
  }, []);

  // Page title animations
  const titleVariants = {
    hidden: { opacity: 0, y: -20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.6, ease: "easeOut" }
    }
  };

  return (
    <div className="pb-12">
      <motion.div 
        className="mb-8"
        initial="hidden"
        animate="visible"
        variants={titleVariants}
      >
        <h1 className="text-3xl font-bold text-white mb-2">
          Dashboard
        </h1>
        <p className="text-gray-400">
          Welcome back to your Organization Dashboard. Manage your integrations and monitor activity.
        </p>
      </motion.div>

      {/* Status Cards */}
      <div className="grid grid-cols-1 gap-6 mt-6 sm:grid-cols-2 lg:grid-cols-3">
        <Card 
          icon={
            <svg className="w-7 h-7 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14H11V21L20 10H13Z" />
            </svg>
          }
          title="Integrations"
          value={metrics.integrations?.connected || 0}
          loading={loading.metrics}
          error={error.metrics}
          link="/integrations"
          linkText="View details"
          color="blue"
        />

        <Card 
          icon={
            <svg className="w-7 h-7 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          }
          title="Whispers"
          value={metrics.whispers?.thisMonth || 0}
          loading={loading.metrics}
          error={error.metrics}
          link="/whispers"
          linkText="View whispers"
          color="green"
        />

        <Card 
          icon={
            <svg className="w-7 h-7 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          }
          title="Team Members"
          value={metrics.teamMembers?.active || 0}
          loading={loading.metrics}
          error={error.metrics}
          link="/team"
          linkText="Manage team"
          color="purple"
        />
      </div>

      {/* Charts and Activity Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-8">
        {/* Weekly Activity Chart */}
        <motion.div 
          className="lg:col-span-2 p-6 bg-gray-800/80 rounded-lg border border-gray-700/50 shadow-lg backdrop-blur-sm"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
        >
          <h2 className="text-xl font-semibold text-white mb-4">Weekly Activity</h2>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={activityData}
                margin={{ top: 5, right: 20, left: 0, bottom: 5 }}
              >
                <defs>
                  <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0.1}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                <XAxis dataKey="name" stroke="rgba(255,255,255,0.6)" />
                <YAxis stroke="rgba(255,255,255,0.6)" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#1f2937', 
                    borderColor: 'rgba(255,255,255,0.1)',
                    borderRadius: '0.5rem',
                    color: 'white'
                  }}
                  itemStyle={{ color: '#0ea5e9' }}
                  labelStyle={{ color: 'white' }}
                />
                <Area 
                  type="monotone" 
                  dataKey="value" 
                  stroke="#0ea5e9" 
                  fillOpacity={1} 
                  fill="url(#colorValue)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Distribution Pie Chart */}
        <motion.div 
          className="p-6 bg-gray-800/80 rounded-lg border border-gray-700/50 shadow-lg backdrop-blur-sm"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.3 }}
        >
          <h2 className="text-xl font-semibold text-white mb-4">Integration Distribution</h2>
          <div className="h-60 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={distributionData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {distributionData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#1f2937', 
                    borderColor: 'rgba(255,255,255,0.1)',
                    borderRadius: '0.5rem',
                    color: 'white'
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      </div>

      {/* Integrations Quick View */}
      <motion.div 
        className="mt-8"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.4 }}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-white">Your Integrations</h2>
          <Link to="/integrations" className="text-sm font-medium text-primary-400 hover:text-primary-300 transition-colors flex items-center">
            View all
            <svg className="ml-1 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          </Link>
        </div>
        
        {loading.integrations ? (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((item) => (
              <div key={item} className="p-6 bg-gray-800/80 rounded-lg border border-gray-700/50 shadow-lg backdrop-blur-sm">
                <div className="animate-pulse flex items-center">
                  <div className="w-12 h-12 bg-gray-700 rounded-full"></div>
                  <div className="ml-4 flex-1">
                    <div className="h-4 bg-gray-700 rounded w-3/4 mb-2"></div>
                    <div className="h-3 bg-gray-700 rounded w-1/4"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : error.integrations ? (
          <div className="p-4 rounded-lg bg-red-900/20 border border-red-700/50 text-red-400">
            {error.integrations}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {integrations.map((integration, index) => (
              <motion.div
                key={index}
                className="p-6 bg-gray-800/80 rounded-lg border border-gray-700/50 shadow-lg backdrop-blur-sm hover:bg-gray-750 transition-all duration-200"
                whileHover={{ 
                  y: -5,
                  boxShadow: '0 10px 25px -5px rgba(15, 23, 42, 0.3)',
                }}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
              >
                <Link
                  to={integration.path || `/integrations/${integration.name.toLowerCase()}`}
                  className="flex items-center justify-between"
                >
                  <div className="flex items-center">
                    <div className="w-12 h-12 flex items-center justify-center">
                      <span className="text-3xl">{integration.icon}</span>
                    </div>
                    <div className="ml-3">
                      <h3 className="text-white font-medium">{integration.name}</h3>
                      <span className={`inline-flex items-center px-2 py-1 mt-1 text-xs rounded-full ${
                        integration.status === 'connected'
                          ? 'bg-green-900/30 text-green-400 border border-green-700/50'
                          : 'bg-gray-700/30 text-gray-400 border border-gray-600/50'
                      }`}>
                        <span className={`h-2 w-2 rounded-full mr-1 ${
                          integration.status === 'connected' ? 'bg-green-400' : 'bg-gray-500'
                        }`}></span>
                        {integration.status === 'connected' ? 'Connected' : 'Disconnected'}
                      </span>
                    </div>
                  </div>
                  <motion.div 
                    whileHover={{ x: 5 }}
                    transition={{ duration: 0.2 }}
                  >
                    <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                    </svg>
                  </motion.div>
                </Link>
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>

      {/* Recent Activity */}
      <motion.div 
        className="mt-8"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.5 }}
      >
        <h2 className="text-xl font-semibold text-white mb-4">Recent Activity</h2>
        
        {loading.activity ? (
          <div className="bg-gray-800/80 rounded-lg border border-gray-700/50 shadow-lg backdrop-blur-sm overflow-hidden">
            <ul className="divide-y divide-gray-700/50">
              {[1, 2, 3, 4].map((item) => (
                <li key={item} className="p-4">
                  <div className="animate-pulse flex items-center">
                    <div className="w-10 h-10 bg-gray-700 rounded-full mr-4"></div>
                    <div className="flex-1">
                      <div className="h-4 bg-gray-700 rounded w-3/4 mb-2"></div>
                      <div className="h-3 bg-gray-700 rounded w-1/4"></div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        ) : error.activity ? (
          <div className="p-4 rounded-lg bg-red-900/20 border border-red-700/50 text-red-400">
            {error.activity}
          </div>
        ) : (
          <div className="bg-gray-800/80 rounded-lg border border-gray-700/50 shadow-lg backdrop-blur-sm overflow-hidden">
            <ul>
              {recentActivity.map((activity, index) => (
                <ActivityItem key={activity.id} activity={activity} index={index} />
              ))}
            </ul>
            <div className="bg-gray-800/80 px-4 py-3 border-t border-gray-700/50">
              <button className="text-sm text-primary-400 hover:text-primary-300 transition-colors flex items-center">
                View all activity
                <svg className="ml-1 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </button>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default Dashboard; 