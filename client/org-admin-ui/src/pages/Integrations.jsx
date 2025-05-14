import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { getCurrentOrganizationId } from '../services/api';
import { FiArrowRight, FiSettings, FiGitBranch, FiSlack, FiMail } from 'react-icons/fi';
import { SiGoogledrive, SiJira, SiNotion, SiAsana, SiTrello } from 'react-icons/si';

// Microsoft Teams custom icon
const TeamsIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="h-5 w-5 text-blue-400/70">
    <path 
      fill="currentColor" 
      d="M20.656 8.402c.087.59.14.119.14.178v5.188a1.91 1.91 0 0 1-1.856 1.95h-.096a.507.507 0 0 1-.179-.03c-.248-.085-1.511-.537-1.77-.642-.078-.03-.14-.113-.14-.197V9.463c0-.084.062-.162.14-.196.259-.094 1.511-.546 1.77-.635a.425.425 0 0 1 .179-.042h.096a1.903 1.903 0 0 1 1.856 1.95c0 .06-.52.12-.14.178zM9.023 8.074h4.626a1.299 1.299 0 0 1 1.282 1.282v4.569a1.303 1.303 0 0 1-1.282 1.289H9.023a1.303 1.303 0 0 1-1.29-1.29V9.365a1.303 1.303 0 0 1 1.29-1.29zm9.87-4.35H9.716a2.307 2.307 0 0 0-2.281 2.29l-.01 2.624c.795-.416 1.452-.626 2.308-.626h10.16v-.725A3.292 3.292 0 0 0 16.6 3.996h-.1a.42.42 0 0 0-.14.03c-.308.104-1.77.642-2.086.75.01 0 0 0 0 0 .03.009.06.017.078.026.197.068.315.18.315.335v5.839c0 .154-.118.266-.315.334-.02.009-.048.017-.078.026v.008a.37.37 0 0 1-.14.026H11.77c-.04-.008-.08-.017-.12-.026v-.008a.408.408 0 0 1-.177-.06V5.767c0-.044-.035-.079-.08-.079H6.358a.565.565 0 0 0-.559.559v8.951c0 1.24.998 2.246 2.238 2.246h9.55a2.307 2.307 0 0 0 2.281-2.29V6.013c0-1.267-.998-2.29-2.221-2.29z"
    />
  </svg>
);

// Get the current organization ID dynamically
const getOrgId = () => getCurrentOrganizationId();

// Integration Card Component
const IntegrationCard = ({ integration, index }) => {
  const getIntegrationIcon = (type) => {
    switch (type) {
      case 'github':
        return <FiGitBranch className="h-6 w-6 text-white" />;
      case 'slack':
        return <FiSlack className="h-6 w-6 text-white" />;
      case 'email':
        return <FiMail className="h-6 w-6 text-white" />;
      default:
        return <span className="text-2xl">{integration.icon}</span>;
    }
  };

  const gradients = [
    'from-blue-600 to-cyan-500',
    'from-purple-600 to-indigo-600', 
    'from-cyan-500 to-emerald-500',
  ];

  const gradient = gradients[index % gradients.length];

  return (
    <motion.div
      className="p-6 bg-gray-800/80 backdrop-blur-sm rounded-lg border border-gray-700/50 shadow-lg hover:shadow-xl transition-all duration-300"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.1 }}
      whileHover={{ 
        y: -5,
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2)',
        borderColor: 'rgba(14, 165, 233, 0.3)',
      }}
    >
      <div className="flex justify-between items-start">
        <div className="flex items-center">
          <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${gradient} flex items-center justify-center shadow-lg mr-3`}>
            {getIntegrationIcon(integration.type)}
          </div>
          <h3 className="text-lg font-medium text-white">{integration.name}</h3>
        </div>
        <motion.div
          whileHover={{ rotate: 90, scale: 1.1 }}
          transition={{ duration: 0.2 }}
        >
          <Link 
            to={integration.path}
            className="p-2 rounded-full hover:bg-gray-700/50 flex items-center justify-center transition-colors duration-200"
            title={`Configure ${integration.name}`}
          >
            <FiSettings className="h-5 w-5 text-primary-400" />
          </Link>
        </motion.div>
      </div>
      <p className="mt-4 text-sm text-gray-300">{integration.description}</p>
      <div className="mt-6">
        <motion.div whileHover={{ x: 5 }} transition={{ duration: 0.2 }}>
          <Link 
            to={integration.path}
            className="text-primary-400 text-sm hover:text-primary-300 flex items-center transition-colors duration-200"
          >
            Configure settings
            <FiArrowRight className="h-4 w-4 ml-2" />
          </Link>
        </motion.div>
      </div>
    </motion.div>
  );
};

// Coming Soon Card Component
const ComingSoonCard = ({ service, icon, index }) => {
  return (
    <motion.div 
      className="p-6 bg-gray-800/30 backdrop-blur-sm rounded-lg border border-gray-700/30 shadow-lg relative overflow-hidden group"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.1 + (index * 0.05) }}
      whileHover={{ y: -3 }}
    >
      <div className="absolute -right-10 -top-10 w-24 h-24 bg-gray-700/20 rounded-full blur-xl group-hover:bg-primary-900/10 transition-all duration-300"></div>
      
      <div className="flex items-center mb-3">
        <div className="w-10 h-10 rounded-full bg-gray-700/50 flex items-center justify-center mr-3">
          {icon}
        </div>
        <h3 className="text-lg font-medium text-white">{service}</h3>
      </div>
      
      <div className="flex items-center">
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-900/30 text-primary-300 border border-primary-800/50">
          Coming Soon
        </span>
      </div>
      
      <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-gray-700/50 to-transparent"></div>
    </motion.div>
  );
};

const Integrations = () => {
  const [orgId] = useState(getOrgId());
  
  // Configuration options for integrations
  const configIntegrations = [
    {
      id: 'github-config',
      type: 'github',
      name: 'GitHub',
      description: 'Connect your GitHub repositories to analyze collaboration patterns, code contributions, and development metrics while maintaining privacy.',
      icon: '🔄',
      path: `/organizations/${orgId}/integrations/github/config`
    },
    {
      id: 'slack-config',
      type: 'slack',
      name: 'Slack',
      description: 'Integrate with Slack to understand communication patterns, channel engagement, and team collaboration insights with privacy by design.',
      icon: '💬',
      path: `/organizations/${orgId}/integrations/slack/config`
    },
    {
      id: 'gmail-config',
      type: 'email',
      name: 'Gmail',
      description: 'Connect Gmail to analyze email communication patterns and productivity metrics while ensuring complete privacy of message content.',
      icon: '📧',
      path: `/organizations/${orgId}/integrations/gmail/config`
    }
  ];

  // Upcoming integrations with icons
  const upcomingIntegrations = [
    { name: 'Jira', icon: <SiJira className="h-5 w-5 text-blue-400/70" /> },
    { name: 'Google Drive', icon: <SiGoogledrive className="h-5 w-5 text-yellow-400/70" /> },
    { name: 'Microsoft Teams', icon: <img src="https://www.svgrepo.com/show/452111/teams.svg" alt="Microsoft Teams" className="h-5 w-5" /> },
    { name: 'Notion', icon: <SiNotion className="h-5 w-5 text-gray-400/70" /> },
    { name: 'Asana', icon: <SiAsana className="h-5 w-5 text-red-400/70" /> },
    { name: 'Trello', icon: <SiTrello className="h-5 w-5 text-blue-400/70" /> }
  ];

  // Page title animation variants
  const titleVariants = {
    hidden: { opacity: 0, y: -20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.6, ease: "easeOut" }
    }
  };

  // Staggered container animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { 
        when: "beforeChildren",
        staggerChildren: 0.1,
        delayChildren: 0.3
      }
    }
  };

  return (
    <div className="pb-12 relative">
      {/* Background Elements */}
      <div className="absolute inset-0 overflow-hidden z-0 pointer-events-none">
        <div className="absolute -top-[10%] -right-[10%] w-[35%] h-[35%] bg-gradient-to-b from-primary-600/5 to-transparent rounded-full blur-3xl"></div>
        <div className="absolute -bottom-[20%] -left-[10%] w-[40%] h-[50%] bg-gradient-to-t from-cyan-600/5 to-transparent rounded-full blur-3xl"></div>
      </div>

      <motion.div 
        className="mb-8 relative z-10"
        initial="hidden"
        animate="visible"
        variants={titleVariants}
      >
        <h1 className="text-3xl font-bold text-white mb-2">
          Integrations
        </h1>
        <p className="text-gray-400 max-w-3xl">
          Connect your organization's tools and services to WhisprNet.ai for intelligent processing while maintaining privacy and security standards.
        </p>
      </motion.div>

      {/* Configure Integration Options */}
      <motion.div 
        className="mt-8 relative z-10"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <motion.h2 
          className="text-xl font-semibold text-white mb-6"
          variants={titleVariants}
        >
          Configure Integrations
        </motion.h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {configIntegrations.map((integration, index) => (
            <IntegrationCard 
              key={integration.id} 
              integration={integration} 
              index={index} 
            />
          ))}
        </div>
      </motion.div>

      {/* Other Integration Options */}
      <motion.div 
        className="mt-16 relative z-10"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
      >
        <motion.h2 
          className="text-xl font-semibold text-white mb-6"
          variants={titleVariants}
        >
          More Integrations Coming Soon
        </motion.h2>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {upcomingIntegrations.map((service, index) => (
            <ComingSoonCard 
              key={index} 
              service={service.name} 
              icon={service.icon} 
              index={index} 
            />
          ))}
        </div>
      </motion.div>

      {/* Need Help Section */}
      <motion.div 
        className="mt-16 relative z-10"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.4 }}
      >
        <div className="p-8 bg-gradient-to-r from-gray-800/80 to-gray-900/80 backdrop-blur-sm rounded-xl border border-gray-700/50 shadow-lg relative overflow-hidden">
          <div className="absolute -right-20 -top-20 w-60 h-60 bg-primary-600/10 rounded-full blur-3xl"></div>
          <div className="relative z-10">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between">
              <div className="mb-6 md:mb-0">
                <h2 className="text-xl font-semibold text-white mb-2">Need Help Setting Up Integrations?</h2>
                <p className="text-gray-300 max-w-2xl">
                  Our team can help you set up and configure integrations for your specific workflow. We'll ensure your data flows seamlessly while maintaining privacy standards.
                </p>
              </div>
              <div className="flex-shrink-0">
                <motion.button 
                  className="px-6 py-3 bg-gradient-to-r from-primary-600 to-primary-700 text-white rounded-lg shadow-lg hover:shadow-primary-500/20 transition-all duration-300 font-medium"
                  whileHover={{ y: -2, boxShadow: "0 10px 20px -10px rgba(14, 165, 233, 0.5)" }}
                  whileTap={{ y: 0, scale: 0.98 }}
                >
                  Contact Support
                </motion.button>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default Integrations; 