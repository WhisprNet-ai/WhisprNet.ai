import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import Sidebar from './Sidebar';

const Layout = ({ children }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [mounted, setMounted] = useState(false);
  
  // Check window size and adjust sidebar on mobile
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setIsSidebarOpen(false);
      } else {
        setIsSidebarOpen(true);
      }
    };
    
    window.addEventListener('resize', handleResize);
    handleResize(); // Call once on initial render
    setMounted(true); // Component has mounted
    
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  // Background blur elements
  const BackgroundElements = () => (
    <div className="fixed top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
      <div 
        className="absolute top-[-20%] left-[-10%] w-[50%] h-[40%] rounded-full bg-gradient-to-r from-primary-700/5 to-primary-500/5 blur-3xl"
      />
      <div 
        className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[40%] rounded-full bg-gradient-to-l from-cyan-500/5 to-primary-600/5 blur-3xl"
      />
    </div>
  );

  // Motion variants for page transitions
  const pageVariants = {
    initial: { 
      opacity: 0
    },
    in: { 
      opacity: 1,
      transition: { 
        duration: 0.3,
        ease: "easeOut" 
      }
    },
    out: { 
      opacity: 0,
      transition: { 
        duration: 0.2, 
        ease: "easeIn" 
      }
    }
  };

  return (
    <div className="flex h-screen bg-gray-900 text-white overflow-hidden relative">
      <BackgroundElements />
      
      <Sidebar isOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />
      
      <div className="flex flex-col flex-1 overflow-hidden">
        <Navbar toggleSidebar={toggleSidebar} />
        
        <motion.main 
          className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 bg-gray-900 relative z-10"
          initial="initial"
          animate="in"
          exit="out"
          variants={pageVariants}
          key={mounted ? window.location.pathname : "initial"}
        >
          <div className="container mx-auto">
            {children}
          </div>
        </motion.main>
        
        <footer className="bg-gray-800/50 backdrop-blur-sm text-gray-400 text-sm py-4 text-center border-t border-gray-700/50">
          <div className="flex justify-center items-center">
            <p>© {new Date().getFullYear()} WhisprNet<span className="text-gradient">.ai</span> - Privacy-focused insights</p>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default Layout; 