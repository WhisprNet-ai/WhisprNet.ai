import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { setAuthToken } from '../../services/api';
import { useOrganization } from '../../context/OrganizationContext';

const Navbar = ({ toggleSidebar }) => {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const navigate = useNavigate();
  const organization = useOrganization();
  
  // Get user info from localStorage
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const userInitials = user.firstName && user.lastName 
    ? `${user.firstName[0]}${user.lastName[0]}` 
    : 'U';
  const userName = user.firstName && user.lastName 
    ? `${user.firstName} ${user.lastName}` 
    : 'User';
  const userRole = user.role === 'org_admin' ? 'Organization Admin' : 'Organization User';

  const handleSignOut = () => {
    // Clear authentication data
    setAuthToken(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    
    // Close dropdown
    setDropdownOpen(false);
    
    // Redirect to login page
    navigate('/login');
  };

  // Dropdown animation variants
  const dropdownVariants = {
    hidden: { 
      opacity: 0, 
      y: -10,
      scale: 0.95,
      transition: { 
        duration: 0.15,
        ease: "easeIn"
      }
    },
    visible: { 
      opacity: 1, 
      y: 0,
      scale: 1,
      transition: { 
        duration: 0.2,
        ease: "easeOut"
      }
    }
  };

  return (
    <nav className="bg-gray-800/50 backdrop-blur-sm border-b border-gray-700/50 z-20 relative">
      <div className="mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            {/* Mobile menu button */}
            <button
              type="button"
              className="md:hidden inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-white hover:bg-gray-700/50 focus:outline-none transition-colors duration-200"
              onClick={toggleSidebar}
            >
              <svg className="h-6 w-6" stroke="currentColor" fill="none" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            
            <div className="hidden md:block ml-4">
              <h1 className="text-xl font-semibold text-white">{organization.name} Admin</h1>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            {/* Help Icon */}
            <motion.button 
              className="p-2 text-gray-400 hover:text-white hover:bg-gray-700/50 rounded-full focus:outline-none transition-colors duration-200"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </motion.button>
            
            {/* Notifications */}
            <motion.button 
              className="p-2 text-gray-400 hover:text-white hover:bg-gray-700/50 rounded-full focus:outline-none transition-colors duration-200 relative"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              <span className="absolute top-0 right-0 inline-flex items-center justify-center h-4 w-4 rounded-full text-xs font-bold leading-none text-white transform translate-x-1/2 -translate-y-1/2 bg-gradient-to-r from-primary-600 to-cyan-500">
                2
              </span>
            </motion.button>
            
            {/* User Profile Dropdown */}
            <div className="ml-2 relative">
              <div>
                <motion.button 
                  className="flex items-center text-sm rounded-full focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 focus:ring-offset-gray-800"
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                >
                  <div className="h-8 w-8 rounded-full bg-gradient-to-br from-primary-600 to-cyan-500 flex items-center justify-center shadow-lg">
                    <span className="font-medium">{userInitials}</span>
                  </div>
                  <span className="ml-2 hidden md:flex flex-col items-start">
                    <span className="text-sm font-medium text-white">{userName}</span>
                    <span className="text-xs text-gray-400">{userRole}</span>
                  </span>
                  <svg className="ml-1 h-5 w-5 hidden md:block text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                      clipRule="evenodd"
                    />
                  </svg>
                </motion.button>
              </div>
              
              {/* Dropdown Menu */}
              <AnimatePresence>
                {dropdownOpen && (
                  <motion.div 
                    className="origin-top-right absolute right-0 mt-2 w-56 rounded-lg shadow-lg z-50 overflow-hidden"
                    variants={dropdownVariants}
                    initial="hidden"
                    animate="visible"
                    exit="hidden"
                  >
                    <div className="py-1 rounded-lg bg-gray-800/90 backdrop-blur-sm border border-gray-700/50 shadow-xl">
                      <div className="px-4 py-3 border-b border-gray-700/50">
                        <p className="text-sm text-white">{userName}</p>
                        <p className="text-xs font-medium text-gray-400 truncate">
                          {user.email || 'user@example.com'}
                        </p>
                      </div>
                      
                      <Link
                        to="/settings/profile"
                        className="flex items-center px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 hover:text-white transition-colors duration-150"
                        onClick={() => setDropdownOpen(false)}
                      >
                        <svg className="mr-3 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        Your Profile
                      </Link>
                      
                      <Link
                        to="/settings"
                        className="flex items-center px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 hover:text-white transition-colors duration-150"
                        onClick={() => setDropdownOpen(false)}
                      >
                        <svg className="mr-3 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        Settings
                      </Link>
                      
                      <div className="border-t border-gray-700/50 mt-1 pt-1">
                        <button
                          className="flex w-full items-center px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 hover:text-white transition-colors duration-150"
                          onClick={handleSignOut}
                        >
                          <svg className="mr-3 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                          </svg>
                          Sign out
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar; 