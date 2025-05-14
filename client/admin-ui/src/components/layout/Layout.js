import React, { useState, useEffect } from 'react';
import Sidebar from './Sidebar';

const Layout = ({ children }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Check localStorage for saved sidebar state
  useEffect(() => {
    const savedState = localStorage.getItem('sidebarCollapsed');
    if (savedState !== null) {
      setIsCollapsed(savedState === 'true');
    }

    // Add event listener to track sidebar collapse state changes
    const handleStorageChange = () => {
      const currentState = localStorage.getItem('sidebarCollapsed');
      if (currentState !== null) {
        setIsCollapsed(currentState === 'true');
      }
    };

    window.addEventListener('storage', handleStorageChange);
    
    // Custom event for same-window updates
    window.addEventListener('sidebarStateChange', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('sidebarStateChange', handleStorageChange);
    };
  }, []);

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100">
      <Sidebar />
      <div className={`flex flex-col flex-1 transition-all duration-300 ${isCollapsed ? 'md:pl-20' : 'md:pl-72'}`}>
        <main className="flex-1 px-4 py-8 sm:px-6 lg:px-8">
          {children}
        </main>
        <footer className="bg-gray-800 p-4 mt-auto">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <p className="text-center text-sm text-gray-400">
              &copy; 2025 WhisprNet.ai. All rights reserved.
            </p>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default Layout; 