import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useOrganization } from '../../context/OrganizationContext';
import { useManager } from '../../context/ManagerContext';

const Sidebar = ({ isOpen, toggleSidebar }) => {
  const location = useLocation();
  const organization = useOrganization();
  const { isManager } = useManager();
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const isAdmin = user.role === 'org_admin' || user.role === 'super_admin';

  const isActivePath = (path) => {
    return location.pathname.startsWith(path) 
      ? 'bg-gradient-to-r from-primary-700 to-primary-600 text-white shadow-md' 
      : 'text-gray-300 hover:bg-gray-800/70 hover:text-white';
  };

  const sidebarVariants = {
    open: { 
      x: 0,
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 30,
        when: "beforeChildren",
        staggerChildren: 0.05
      }
    },
    closed: { 
      x: "-100%",
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 30,
        when: "afterChildren",
        staggerChildren: 0.05,
        staggerDirection: -1
      }
    }
  };

  const itemVariants = {
    open: { 
      x: 0, 
      opacity: 1,
      transition: { type: "spring", stiffness: 300, damping: 30 }
    },
    closed: { 
      x: -20, 
      opacity: 0,
      transition: { type: "spring", stiffness: 300, damping: 30 }
    }
  };

  return (
    <>
      {/* Mobile sidebar backdrop */}
      <div 
        className={`md:hidden fixed inset-0 z-20 bg-black bg-opacity-50 backdrop-blur-sm transition-opacity duration-200 ${
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={toggleSidebar}
      />

      {/* Sidebar */}
      <motion.aside 
        className={`fixed inset-y-0 left-0 z-30 w-64 bg-gray-800/90 backdrop-blur-sm border-r border-gray-700/50 md:translate-x-0 md:relative md:z-0 shadow-xl`}
        variants={sidebarVariants}
        initial={false}
        animate={isOpen ? "open" : "closed"}
      >
        {/* Logo */}
        <div className="h-16 flex items-center px-6 border-b border-gray-700/50">
          <Link to="/" className="flex items-center transition-transform hover:scale-105">
            <div className="flex items-center">
              <div className="h-10 w-10 bg-gradient-to-br from-primary-600 to-cyan-500 rounded-full flex items-center justify-center shadow-lg mr-2 animate-glow">
                <svg className="h-5 w-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"></path>
                </svg>
              </div>
              <span className="text-xl font-bold">
                Whispr<span className="text-gradient">Net.ai</span>
              </span>
            </div>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="mt-8 px-4 space-y-2">
          <motion.div variants={itemVariants}>
            <Link
              to="/dashboard"
              className={`flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-all duration-200 ${isActivePath('/dashboard')}`}
            >
              <svg className="mr-3 h-5 w-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M3 12L5 10M5 10L12 3L19 10M5 10V20C5 20.5523 5.44772 21 6 21H9M19 10L21 12M19 10V20C19 20.5523 18.5523 21 18 21H15M9 21C9.55228 21 10 20.5523 10 20V16C10 15.4477 10.4477 15 11 15H13C13.5523 15 14 15.4477 14 16V20C14 20.5523 14.4477 21 15 21M9 21H15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Dashboard
            </Link>
          </motion.div>

          <motion.div variants={itemVariants}>
            <Link
              to="/integrations"
              className={`flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-all duration-200 ${isActivePath('/integrations')}`}
            >
              <svg className="mr-3 h-5 w-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M13 10V3L4 14H11V21L20 10H13Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Integrations
            </Link>
          </motion.div>

          <motion.div variants={itemVariants}>
            <Link
              to="/whispers"
              className={`flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-all duration-200 ${isActivePath('/whispers')}`}
            >
              <svg className="mr-3 h-5 w-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M8 10H8.01M12 10H12.01M16 10H16.01M9 16H5C3.89543 16 3 15.1046 3 14V6C3 4.89543 3.89543 4 5 4H19C20.1046 4 21 4.89543 21 6V14C21 15.1046 20.1046 16 19 16H14L9 21V16Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Whispers
            </Link>
          </motion.div>

          {/* Team Management link - only visible to admins */}
          {isAdmin && (
            <motion.div variants={itemVariants}>
              <Link
                to="/team-management"
                className={`flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-all duration-200 ${isActivePath('/team-management')}`}
              >
                <svg className="mr-3 h-5 w-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M17 20H22V18C22 16.3431 20.6569 15 19 15C18.0444 15 17.1931 15.4468 16.6438 16.1429M17 20H7M17 20V18C17 17.3438 16.8736 16.717 16.6438 16.1429M7 20H2V18C2 16.3431 3.34315 15 5 15C5.95561 15 6.80686 15.4468 7.35625 16.1429M7 20V18C7 17.3438 7.12642 16.717 7.35625 16.1429M7.35625 16.1429C8.0935 14.301 9.89482 13 12 13C14.1052 13 15.9065 14.301 16.6438 16.1429M15 7C15 8.65685 13.6569 10 12 10C10.3431 10 9 8.65685 9 7C9 5.34315 10.3431 4 12 4C13.6569 4 15 5.34315 15 7ZM21 10C21 11.1046 20.1046 12 19 12C17.8954 12 17 11.1046 17 10C17 8.89543 17.8954 8 19 8C20.1046 8 21 8.89543 21 10ZM7 10C7 11.1046 6.10457 12 5 12C3.89543 12 3 11.1046 3 10C3 8.89543 3.89543 8 5 8C6.10457 8 7 8.89543 7 10Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Team Management
              </Link>
            </motion.div>
          )}

          {/* Scope Definition link - only visible to team managers */}
          {isManager && (
            <motion.div variants={itemVariants}>
              <Link
                to="/scope"
                className={`flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-all duration-200 ${isActivePath('/scope')}`}
              >
                <svg className="mr-3 h-5 w-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M9 12L11 14L15 10M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Define Scope
              </Link>
            </motion.div>
          )}

          {/* Scoped Insights link - only visible to team managers */}
          {isManager && (
            <motion.div variants={itemVariants}>
              <Link
                to="/scoped-insights"
                className={`flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-all duration-200 ${isActivePath('/scoped-insights')}`}
              >
                <svg className="mr-3 h-5 w-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M9 19V13M9 13V5M9 13H15M15 19V13M15 13V5M15 5H5C3.89543 5 3 5.89543 3 7V17C3 18.1046 3.89543 19 5 19H19C20.1046 19 21 18.1046 21 17V7C21 5.89543 20.1046 5 19 5H15Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Team Insights
              </Link>
            </motion.div>
          )}

          <motion.div variants={itemVariants}>
            <Link
              to="/settings"
              className={`flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-all duration-200 ${isActivePath('/settings')}`}
            >
              <svg className="mr-3 h-5 w-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M10.3246 4.31731C10.751 2.5609 13.249 2.5609 13.6754 4.31731C13.9508 5.45193 15.2507 5.99038 16.2478 5.38285C17.7913 4.44239 19.5576 6.2087 18.6172 7.75218C18.0096 8.74925 18.5481 10.0492 19.6827 10.3246C21.4391 10.751 21.4391 13.249 19.6827 13.6754C18.5481 13.9508 18.0096 15.2507 18.6172 16.2478C19.5576 17.7913 17.7913 19.5576 16.2478 18.6172C15.2507 18.0096 13.9508 18.5481 13.6754 19.6827C13.249 21.4391 10.751 21.4391 10.3246 19.6827C10.0492 18.5481 8.74926 18.0096 7.75219 18.6172C6.2087 19.5576 4.44239 17.7913 5.38285 16.2478C5.99038 15.2507 5.45193 13.9508 4.31731 13.6754C2.5609 13.249 2.5609 10.751 4.31731 10.3246C5.45193 10.0492 5.99037 8.74926 5.38285 7.75218C4.44239 6.2087 6.2087 4.44239 7.75219 5.38285C8.74926 5.99037 10.0492 5.45193 10.3246 4.31731Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M15 12C15 13.6569 13.6569 15 12 15C10.3431 15 9 13.6569 9 12C9 10.3431 10.3431 9 12 9C13.6569 9 15 10.3431 15 12Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Settings
            </Link>
          </motion.div>
        </nav>

        {/* Organization Info */}
        <motion.div 
          className="absolute bottom-0 w-full border-t border-gray-700/50 p-4 bg-gray-800/80"
          variants={itemVariants}
        >
          <div className="flex items-center space-x-3">
            <div className="h-10 w-10 rounded-full bg-gradient-to-br from-purple-600 to-indigo-700 flex items-center justify-center shadow-lg">
              <span className="text-lg font-semibold text-white">
                {organization.name ? organization.name.charAt(0) : 'W'}
              </span>
            </div>
            <div>
              <h3 className="text-sm font-medium text-white">{organization.name}</h3>
              <p className="text-xs text-gray-400">Business Plan</p>
            </div>
          </div>
        </motion.div>
      </motion.aside>
    </>
  );
};

export default Sidebar; 