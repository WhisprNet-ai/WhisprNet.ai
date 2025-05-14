import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { setAuthToken } from '../../services/api';

const Sidebar = () => {
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Check localStorage for saved collapsed state preference
  useEffect(() => {
    const savedState = localStorage.getItem('sidebarCollapsed');
    if (savedState !== null) {
      setIsCollapsed(savedState === 'true');
    }
  }, []);

  // Save collapsed state to localStorage
  const toggleCollapse = () => {
    const newState = !isCollapsed;
    setIsCollapsed(newState);
    localStorage.setItem('sidebarCollapsed', newState.toString());
    
    // Dispatch custom event for other components to detect
    window.dispatchEvent(new Event('sidebarStateChange'));
  };

  const isActive = (path) => {
    return location.pathname.startsWith(path) ? 
      'bg-gradient-to-r from-cyan-500 to-blue-500 text-white shadow-lg shadow-cyan-500/50' : 
      'text-gray-300 hover:bg-gray-800 hover:text-white transition-all duration-200';
  };

  return (
    <>
      {/* Mobile menu button */}
      <div className="fixed top-4 left-4 z-50 md:hidden">
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="p-2 rounded-full bg-gray-800 text-white hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-cyan-500"
        >
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            {isMobileMenuOpen ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </button>
      </div>

      {/* Sidebar for mobile */}
      <div className={`fixed inset-0 z-40 md:hidden transition-opacity duration-300 ${isMobileMenuOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
        <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm" onClick={() => setIsMobileMenuOpen(false)}></div>
        <div className={`fixed inset-y-0 left-0 flex flex-col w-64 max-w-xs bg-gray-900 transition-transform duration-300 ease-in-out ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
          <SidebarContent isCollapsed={false} />
        </div>
      </div>

      {/* Sidebar for desktop */}
      <div className={`hidden md:flex md:flex-col ${isCollapsed ? 'md:w-20' : 'md:w-72'} md:fixed md:inset-y-0 backdrop-blur-md bg-gray-900/80 border-r border-gray-800 shadow-xl transition-all duration-200 will-change-transform`}>
        <SidebarContent isCollapsed={isCollapsed} toggleCollapse={toggleCollapse} />
      </div>
    </>
  );
};

const SidebarContent = ({ isCollapsed, toggleCollapse }) => {
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    // Clear auth token
    setAuthToken(null);
    // Remove user from localStorage
    localStorage.removeItem('user');
    // Redirect to login page
    navigate('/login');
  };

  const isActive = (path) => {
    return location.pathname === path || (path !== '/' && location.pathname.startsWith(path)) 
      ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white shadow-lg shadow-cyan-500/50' 
      : 'text-gray-300 hover:bg-gray-800 hover:text-white transition-all duration-200';
  };

  return (
    <div className="h-full flex flex-col">
      {/* Logo and collapse button */}
      <div className="flex items-center justify-between h-20 px-6 bg-gradient-to-r from-gray-900 to-gray-800">
        <Link to="/" className="flex items-center">
          {isCollapsed ? (
            <div className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">
              W
            </div>
          ) : (
            <div className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">
              WhisprNet<span className="text-cyan-400">.ai</span>
            </div>
          )}
        </Link>
        {toggleCollapse && (
          <button 
            onClick={toggleCollapse}
            className="p-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white focus:outline-none transition-colors"
          >
            {isCollapsed ? (
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
              </svg>
            ) : (
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
              </svg>
            )}
          </button>
        )}
      </div>
      
      {/* Navigation */}
      <div className="flex-1 overflow-y-auto py-6 px-3 space-y-1">
        <Link
          to="/dashboard"
          className={`group flex items-center ${isCollapsed ? 'justify-center' : ''} px-4 py-3 text-sm font-medium rounded-lg ${isActive('/dashboard')}`}
        >
          <svg className={isCollapsed ? 'h-6 w-6' : 'mr-3 h-5 w-5'} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M3 12L5 10M5 10L12 3L19 10M5 10V20C5 20.5523 5.44772 21 6 21H9M19 10L21 12M19 10V20C19 20.5523 18.5523 21 18 21H15M9 21C9.55228 21 10 20.5523 10 20V16C10 15.4477 10.4477 15 11 15H13C13.5523 15 14 15.4477 14 16V20C14 20.5523 14.4477 21 15 21M9 21H15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          {!isCollapsed && 'Dashboard'}
        </Link>

        <Link
          to="/organizations"
          className={`group flex items-center ${isCollapsed ? 'justify-center' : ''} px-4 py-3 text-sm font-medium rounded-lg ${isActive('/organizations')}`}
        >
          <svg className={isCollapsed ? 'h-6 w-6' : 'mr-3 h-5 w-5'} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M19 21V5C19 3.89543 18.1046 3 17 3H7C5.89543 3 5 3.89543 5 5V21M19 21H21M19 21H14M5 21H3M5 21H10M9 6.99998H10M9 11H10M14 6.99998H15M14 11H15M10 21V16C10 15.4477 10.4477 15 11 15H13C13.5523 15 14 15.4477 14 16V21M10 21H14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          {!isCollapsed && 'Organizations'}
        </Link>

        <Link
          to="/invitations"
          className={`group flex items-center ${isCollapsed ? 'justify-center' : ''} px-4 py-3 text-sm font-medium rounded-lg ${isActive('/invitations')}`}
        >
          <svg className={isCollapsed ? 'h-6 w-6' : 'mr-3 h-5 w-5'} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M3 8L10.89 13.26C11.2187 13.4793 11.6049 13.5963 12 13.5963C12.3951 13.5963 12.7813 13.4793 13.11 13.26L21 8M5 19H19C20.1046 19 21 18.1046 21 17V7C21 5.89543 20.1046 5 19 5H5C3.89543 5 3 5.89543 3 7V17C3 18.1046 3.89543 19 5 19Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          {!isCollapsed && 'Invitations'}
        </Link>

        <Link
          to="/whispers"
          className={`group flex items-center ${isCollapsed ? 'justify-center' : ''} px-4 py-3 text-sm font-medium rounded-lg ${isActive('/whispers')}`}
        >
          <svg className={isCollapsed ? 'h-6 w-6' : 'mr-3 h-5 w-5'} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M8 12H16M8 8H16M8 16H12M22 12C22 17.5228 17.5228 22 12 22C6.47715 22 2 17.5228 2 12C2 6.47715 6.47715 2 12 2C17.5228 2 22 6.47715 22 12Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          {!isCollapsed && 'Whispers'}
        </Link>

        <Link
          to="/settings"
          className={`group flex items-center ${isCollapsed ? 'justify-center' : ''} px-4 py-3 text-sm font-medium rounded-lg ${isActive('/settings')}`}
        >
          <svg className={isCollapsed ? 'h-6 w-6' : 'mr-3 h-5 w-5'} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M10.3246 4.31731C10.751 2.5609 13.249 2.5609 13.6754 4.31731C13.9508 5.45193 15.2507 5.99038 16.2478 5.38285C17.7913 4.44239 19.5576 6.2087 18.6172 7.75218C18.0096 8.74925 18.5481 10.0492 19.6827 10.3246C21.4391 10.751 21.4391 13.249 19.6827 13.6754C18.5481 13.9508 18.0096 15.2507 18.6172 16.2478C19.5576 17.7913 17.7913 19.5576 16.2478 18.6172C15.2507 18.0096 13.9508 18.5481 13.6754 19.6827C13.249 21.4391 10.751 21.4391 10.3246 19.6827C10.0492 18.5481 8.74926 18.0096 7.75219 18.6172C6.2087 19.5576 4.44239 17.7913 5.38285 16.2478C5.99038 15.2507 5.45193 13.9508 4.31731 13.6754C2.5609 13.249 2.5609 10.751 4.31731 10.3246C5.45193 10.0492 5.99037 8.74926 5.38285 7.75218C4.44239 6.2087 6.2087 4.44239 7.75219 5.38285C8.74926 5.99037 10.0492 5.45193 10.3246 4.31731Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M15 12C15 13.6569 13.6569 15 12 15C10.3431 15 9 13.6569 9 12C9 10.3431 10.3431 9 12 9C13.6569 9 15 10.3431 15 12Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          {!isCollapsed && 'Settings'}
        </Link>
      </div>
      
      {/* User profile */}
      {!isCollapsed && (
        <div className="p-4 border-t border-gray-800">
          <div className="flex items-center space-x-3 bg-gray-800 p-3 rounded-lg backdrop-blur-sm">
            <img
              className="h-12 w-12 rounded-full ring-2 ring-cyan-500 cursor-pointer"
              src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80"
              alt="User profile"
              onClick={toggleCollapse}
              title="Click to collapse sidebar"
            />
            <div>
              <div className="text-sm font-medium">Admin User</div>
              <div className="flex mt-2 space-x-2">
                <button 
                  className="text-xs px-2 py-1 rounded bg-gray-700 hover:bg-gray-600 transition-all"
                  onClick={() => console.log('Profile clicked')}
                >
                  Profile
                </button>
                <button 
                  className="text-xs px-2 py-1 rounded bg-red-600 hover:bg-red-500 transition-all"
                  onClick={handleLogout}
                >
                  Logout
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Collapsed user profile */}
      {isCollapsed && (
        <div className="p-3 border-t border-gray-800 flex justify-center">
          <div className="relative">
            <img
              className="h-10 w-10 rounded-full ring-2 ring-cyan-500 cursor-pointer"
              src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80"
              alt="User profile"
              onClick={toggleCollapse}
              title="Click to expand sidebar"
            />
            <div className="absolute bottom-0 right-0 -mb-1 -mr-1 h-4 w-4 rounded-full bg-green-500 border-2 border-gray-900"></div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Sidebar; 