import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { authAPI, setAuthToken } from '../services/api';
import { FiShield, FiLock, FiMail, FiAlertTriangle, FiInfo, FiX } from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';

// Error Alert Component
const ErrorAlert = ({ message, onClose, variant = "error" }) => {
  const variants = {
    hidden: { opacity: 0, y: -20 },
    visible: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -10, transition: { duration: 0.2 } }
  };

  const errorStyles = {
    error: {
      bg: "bg-red-900/30",
      border: "border-red-500",
      text: "text-red-200",
      icon: <FiAlertTriangle className="h-5 w-5 text-red-400" />
    },
    warning: {
      bg: "bg-amber-900/30",
      border: "border-amber-500",
      text: "text-amber-200",
      icon: <FiInfo className="h-5 w-5 text-amber-400" />
    }
  };

  const style = errorStyles[variant];

  return (
    <motion.div 
      className={`${style.bg} ${style.border} ${style.text} border rounded-lg px-4 py-3 mb-6 shadow-lg`}
      initial="hidden"
      animate="visible"
      exit="exit"
      variants={variants}
      transition={{ duration: 0.3 }}
    >
      <div className="flex justify-between items-start">
        <div className="flex">
          <span className="flex-shrink-0 mr-2">
            {style.icon}
          </span>
          <span className="block text-sm">
            {message}
          </span>
        </div>
        {onClose && (
          <button 
            onClick={onClose}
            className="ml-4 flex-shrink-0 text-red-200 hover:text-white transition-colors duration-150"
          >
            <FiX className="h-4 w-4" />
          </button>
        )}
      </div>
    </motion.div>
  );
};

const Login = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  // Clear any existing tokens on login page load
  useEffect(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  }, []);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      // Call the admin login endpoint
      const response = await authAPI.login({
        email: formData.email,
        password: formData.password
      });
      
      if (!response.data || !response.data.token) {
        setError('Server returned invalid response format');
        setIsSubmitting(false);
        return;
      }
      
      // Check if user is an org_user or org_admin trying to access the admin portal
      if (response.data.data && (response.data.data.role === 'org_user' || response.data.data.role === 'org_admin')) {
        setError('You\'re logging in with an organization account. Please use the Organization Portal instead. Redirecting you now...');
        setIsSubmitting(false);
        
        // Add a slight delay before redirecting to the org portal
        setTimeout(() => {
          // Get the current URL and replace the port
          const currentUrl = window.location.href;
          const orgUrl = currentUrl.replace(':3002', ':3003');
          window.location.href = orgUrl;
        }, 3000);
        
        return;
      }
      
      // Set the auth token in localStorage
      const token = response.data.token;
      setAuthToken(token);
      
      if (response.data.data) {
        localStorage.setItem('user', JSON.stringify(response.data.data));
      }
      
      // Navigate to dashboard after success
      navigate('/dashboard');
      
    } catch (error) {
      // Display error message
      if (error.response) {
        setError(error.response.data?.error || 'Invalid admin credentials');
      } else if (error.request) {
        setError('No response from server. Please check your network connection.');
      } else {
        setError(`Request failed: ${error.message}`);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { 
        duration: 0.5, 
        when: "beforeChildren",
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { duration: 0.4 } }
  };

  // Determine if the error is related to network connectivity
  const isNetworkError = error && error.includes('network');

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900 py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Decorative blobs */}
      <motion.div 
        className="absolute top-0 left-0 w-full h-full overflow-hidden z-0"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1.5 }}
      >
        <motion.div 
          className="absolute top-[-20%] left-[-10%] w-[50%] h-[40%] rounded-full bg-gradient-to-r from-primary-700/20 to-primary-500/10 blur-3xl"
          animate={{ 
            scale: [1, 1.05, 1],
            opacity: [0.4, 0.6, 0.4],
          }}
          transition={{ 
            duration: 8,
            repeat: Infinity,
            repeatType: "reverse"
          }}
        />
        <motion.div 
          className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[40%] rounded-full bg-gradient-to-l from-cyan-500/10 to-primary-600/20 blur-3xl"
          animate={{ 
            scale: [1, 1.1, 1],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{ 
            duration: 10,
            repeat: Infinity,
            repeatType: "reverse",
            delay: 1
          }}
        />
      </motion.div>
      
      {/* Login card */}
      <motion.div 
        className="w-full max-w-md z-10 space-y-8"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <motion.div 
          className="bg-gray-800/70 backdrop-blur-sm rounded-xl shadow-xl p-8 border border-gray-700"
          variants={itemVariants}
        >
          <motion.div 
            className="flex flex-col items-center mb-8"
            variants={itemVariants}
          >
            <motion.div 
              className="w-24 h-24 bg-gradient-to-br from-primary-600 to-cyan-400 rounded-full flex items-center justify-center shadow-lg mb-4 animate-glow"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ 
                type: "spring",
                stiffness: 260,
                damping: 20,
                delay: 0.3
              }}
            >
              <FiShield className="text-white text-4xl" />
            </motion.div>
            <motion.h2 
              className="mt-2 text-center text-3xl font-extrabold text-white"
              variants={itemVariants}
            >
              WhisprNet<span className="text-gradient">.ai</span> Admin
            </motion.h2>
            <motion.p 
              className="mt-2 text-center text-sm text-gray-400"
              variants={itemVariants}
            >
              Sign in to your system admin account
            </motion.p>
          </motion.div>
          
          <AnimatePresence>
            {error && (
              <ErrorAlert 
                message={error} 
                onClose={() => setError('')} 
                variant={isNetworkError ? "warning" : "error"}
              />
            )}
          </AnimatePresence>
          
          <motion.form 
            className="mt-8 space-y-6" 
            onSubmit={handleSubmit}
            variants={itemVariants}
          >
            <div className="space-y-4">
              <motion.div variants={itemVariants}>
                <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-1">Email address</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FiMail className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={formData.email}
                    onChange={handleChange}
                    className="appearance-none block w-full pl-10 px-3 py-3 bg-gray-700/50 border border-gray-600 placeholder-gray-400 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 focus:z-10 sm:text-sm"
                    placeholder="admin@example.com"
                  />
                </div>
              </motion.div>
              <motion.div variants={itemVariants}>
                <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-1">Password</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FiLock className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="password"
                    name="password"
                    type="password"
                    autoComplete="current-password"
                    required
                    value={formData.password}
                    onChange={handleChange}
                    className="appearance-none block w-full pl-10 px-3 py-3 bg-gray-700/50 border border-gray-600 placeholder-gray-400 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 focus:z-10 sm:text-sm"
                    placeholder="••••••••"
                  />
                </div>
              </motion.div>
            </div>

            <motion.div variants={itemVariants} whileTap={{ scale: 0.98 }}>
              <motion.button
                type="submit"
                disabled={isSubmitting}
                className="group relative w-full flex justify-center items-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-500 hover:to-primary-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 focus:ring-offset-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:translate-y-[-2px] shadow-md hover:shadow-lg"
                whileHover={{ 
                  y: -2,
                  boxShadow: "0 10px 25px -5px rgba(6, 182, 212, 0.3)",
                  transition: { duration: 0.2 }
                }}
              >
                {isSubmitting ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Signing in...
                  </>
                ) : 'Sign in'}
              </motion.button>
            </motion.div>
          </motion.form>
        </motion.div>
        <motion.div 
          className="text-center mt-4"
          variants={itemVariants}
        >
          <p className="text-sm text-gray-400">
            WhisprNet.ai © {new Date().getFullYear()} | Privacy-focused insights
          </p>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default Login; 