import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { authAPI, setAuthToken } from '../services/api';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FiLock, 
  FiMail, 
  FiShield, 
  FiUsers, 
  FiBarChart2, 
  FiPieChart, 
  FiActivity,
  FiAlertTriangle,
  FiInfo,
  FiX
} from 'react-icons/fi';
import { BiNetworkChart } from 'react-icons/bi';

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
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
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
    setError('');
    setLoading(true);

    try {
      const response = await authAPI.login(formData);
      
      // Check if user is a super_admin - they should use the admin portal instead
      if (response.data.data.role === 'super_admin') {
        setError('You\'re logging in with a system administrator account. Please use the WhisprNet Admin Portal instead. Redirecting you now...');
        setLoading(false);
        
        // Add a slight delay before redirecting to the admin portal
        setTimeout(() => {
          // Get the current URL and replace the port
          const currentUrl = window.location.href;
          const adminUrl = currentUrl.replace(':3003', ':3002');
          window.location.href = adminUrl;
        }, 3000);
        
        return;
      }
      
      // Save token and user data
      const { token, data } = response.data;
      setAuthToken(token);
      localStorage.setItem('user', JSON.stringify(data));
      
      // Redirect to dashboard
      navigate('/dashboard');
    } catch (err) {
      console.error('Login error:', err);
      setError(
        err.response?.data?.error || 
        'Failed to login. Please check your credentials and try again.'
      );
    } finally {
      setLoading(false);
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

  const featureCards = [
    {
      icon: <FiUsers className="feature-icon" />,
      title: "Team Insights",
      description: "Understand your team's interactions and collaboration patterns."
    },
    {
      icon: <BiNetworkChart className="feature-icon" />,
      title: "Network Analysis",
      description: "Visualize communication networks across your organization."
    },
    {
      icon: <FiBarChart2 className="feature-icon" />,
      title: "Productivity Metrics",
      description: "Track productivity without compromising user privacy."
    },
    {
      icon: <FiPieChart className="feature-icon" />,
      title: "Data Visualization",
      description: "Beautiful and intuitive charts to understand team dynamics."
    }
  ];

  // Determine if the error is a redirecting error (telling users to use a different portal)
  const isPortalError = error && error.includes('port 3002');
  
  return (
    <div className="min-h-screen flex lg:flex-row flex-col bg-gray-900 relative overflow-hidden">
      {/* Background elements */}
      <motion.div 
        className="absolute top-0 left-0 w-full h-full overflow-hidden z-0"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1.5 }}
      >
        <motion.div 
          className="absolute top-[-10%] left-[-5%] w-[40%] h-[40%] rounded-full bg-gradient-to-r from-primary-700/20 to-primary-500/10 blur-3xl"
          animate={{ 
            scale: [1, 1.05, 1],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{ 
            duration: 8,
            repeat: Infinity,
            repeatType: "reverse"
          }}
        />
        <motion.div 
          className="absolute bottom-[-10%] right-[-5%] w-[40%] h-[40%] rounded-full bg-gradient-to-l from-cyan-500/10 to-primary-600/20 blur-3xl"
          animate={{ 
            scale: [1, 1.1, 1],
            opacity: [0.2, 0.4, 0.2],
          }}
          transition={{ 
            duration: 10,
            repeat: Infinity,
            repeatType: "reverse",
            delay: 1
          }}
        />
      </motion.div>

      {/* Content wrapper */}
      <div className="flex flex-col lg:flex-row w-full z-10 relative">
        {/* Left panel - Product information */}
        <motion.div 
          className="lg:w-7/12 p-8 lg:p-16 flex flex-col justify-center"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="max-w-2xl mx-auto lg:mx-0">
            <motion.div
              className="flex items-center mb-8"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <motion.div 
                className="w-16 h-16 bg-gradient-to-br from-primary-600 to-cyan-400 rounded-full flex items-center justify-center shadow-lg mr-4 animate-glow"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ 
                  type: "spring",
                  stiffness: 260,
                  damping: 20
                }}
              >
                <FiActivity className="text-white text-3xl" />
              </motion.div>
              <h1 className="text-3xl font-bold text-white">
                WhisprNet<span className="text-gradient">.ai</span>
              </h1>
            </motion.div>
            
            <motion.h2 
              className="text-4xl lg:text-5xl font-bold text-white mb-6 tracking-tight"
              variants={itemVariants}
              initial="hidden"
              animate="visible"
            >
              Organizational insights that <span className="text-gradient">respect privacy</span>
            </motion.h2>
            
            <motion.p 
              className="text-gray-300 text-lg mb-8"
              variants={itemVariants}
              initial="hidden"
              animate="visible"
              transition={{ delay: 0.2 }}
            >
              Access your organization's analytics portal to gain valuable insights while maintaining the highest standards of privacy and data protection.
            </motion.p>
            
            <motion.div 
              className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              transition={{ staggerChildren: 0.1, delayChildren: 0.3 }}
            >
              {featureCards.map((feature, index) => (
                <motion.div
                  key={index}
                  className="feature-card"
                  variants={itemVariants}
                >
                  {feature.icon}
                  <h3 className="text-white font-semibold mb-2">{feature.title}</h3>
                  <p className="text-gray-400 text-sm">{feature.description}</p>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </motion.div>

        {/* Right panel - Login form */}
        <motion.div 
          className="lg:w-5/12 bg-gray-800/30 backdrop-blur-md p-8 lg:p-16 lg:min-h-screen flex items-center"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          <div className="w-full max-w-md mx-auto">
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.4 }}
            >
              <h2 className="text-2xl font-bold text-white mb-2">Organization Portal</h2>
              <p className="text-gray-400 mb-8">Sign in to access your organization's insights</p>
              
              <AnimatePresence>
                {error && (
                  <ErrorAlert 
                    message={error} 
                    onClose={() => setError('')} 
                    variant={isPortalError ? "warning" : "error"}
                  />
                )}
              </AnimatePresence>

              <form onSubmit={handleSubmit} className="space-y-6">
                <motion.div 
                  className="space-y-4"
                  variants={containerVariants}
                  initial="hidden"
                  animate="visible"
                >
                  <motion.div variants={itemVariants}>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-1">
                      Email address
                    </label>
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
                        placeholder="your-email@company.com"
                      />
                    </div>
                  </motion.div>

                  <motion.div variants={itemVariants}>
                    <div className="flex items-center justify-between mb-1">
                      <label htmlFor="password" className="block text-sm font-medium text-gray-300">
                        Password
                      </label>
                      <div className="text-sm">
                        <a href="#" className="text-primary-400 hover:text-primary-300">
                          Forgot password?
                        </a>
                      </div>
                    </div>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <FiLock className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        id="password"
                        name="password"
                        type={showPassword ? "text" : "password"}
                        autoComplete="current-password"
                        required
                        value={formData.password}
                        onChange={handleChange}
                        className="appearance-none block w-full pl-10 px-3 py-3 bg-gray-700/50 border border-gray-600 placeholder-gray-400 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 focus:z-10 sm:text-sm"
                        placeholder="••••••••"
                      />
                      <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="text-gray-400 hover:text-white focus:outline-none"
                        >
                          {showPassword ? (
                            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                            </svg>
                          ) : (
                            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                          )}
                        </button>
                      </div>
                    </div>
                  </motion.div>
                </motion.div>

                <motion.div variants={itemVariants} whileTap={{ scale: 0.98 }}>
                  <motion.button
                    type="submit"
                    disabled={loading}
                    className="group relative w-full flex justify-center items-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-500 hover:to-primary-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 focus:ring-offset-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:translate-y-[-2px] shadow-md hover:shadow-lg"
                    whileHover={{ 
                      y: -2,
                      boxShadow: "0 10px 25px -5px rgba(6, 182, 212, 0.3)",
                      transition: { duration: 0.2 }
                    }}
                  >
                    {loading ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Signing in...
                      </>
                    ) : (
                      <>Sign in</>
                    )}
                  </motion.button>
                </motion.div>
              </form>
              
              <div className="mt-8 text-center">
                <p className="text-sm text-gray-400">
                  Organization portal for WhisprNet.ai users and admins
                </p>
              </div>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Login; 