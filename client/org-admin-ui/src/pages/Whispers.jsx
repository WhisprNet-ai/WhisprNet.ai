import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { whisperAPI, dashboardAPI, getCurrentOrganizationId } from '../services/api';
import '../styles/whispers.css';
import { motion, AnimatePresence } from 'framer-motion';
import { formatDistanceToNow } from 'date-fns';
import { Link } from 'react-router-dom';

// Icons
import { 
  FiSlack, FiGithub, FiMail, FiLayers, FiMessageSquare, 
  FiSearch, FiFilter, FiRefreshCw, FiX, FiChevronDown,
  FiAlertCircle, FiAlertTriangle, FiInfo, FiCheckCircle,
  FiCalendar, FiClock, FiTag, FiArrowUp, FiArrowDown, FiExternalLink
} from 'react-icons/fi';

const Whispers = () => {
  // State
  const [loading, setLoading] = useState(true);
  const [whispers, setWhispers] = useState([]);
  const [allWhispers, setAllWhispers] = useState([]); // Store all whispers for client-side filtering
  const [stats, setStats] = useState({
    total: 0,
    byCategory: [],
    byPriority: []
  });
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilters, setCategoryFilters] = useState([]);
  const [priorityFilters, setPriorityFilters] = useState([]);
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortDirection, setSortDirection] = useState('desc');
  const [viewMode, setViewMode] = useState('table'); // Default to table view only
  const [selectedWhisper, setSelectedWhisper] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [toast, setToast] = useState({ show: false, message: '', type: '' });
  const [useClientSideFiltering, setUseClientSideFiltering] = useState(false);

  const pageSize = 12;

  // Available filter options
  const categories = ['insight', 'warning', 'suggestion', 'alert', 'health', 'collaboration', 'improvement', 'optimization', 'recognition'];
  const priorities = ['critical', 'high', 'medium', 'low'];

  // Fetch statistics
  const fetchStats = useCallback(async () => {
    try {
      const response = await dashboardAPI.getWhisperStats();
      if (response.data && response.data.success) {
        setStats(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching whisper stats:', error);
    }
  }, []);

  // Debounce search term
  useEffect(() => {
    const timerId = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 500);

    return () => {
      clearTimeout(timerId);
    };
  }, [searchTerm]);

  // Fetch whispers when filters or search term change
  useEffect(() => {
    if (allWhispers.length > 0) {
      applyClientSideFilters();
    } else {
      fetchInitialWhispers();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, categoryFilters, priorityFilters, debouncedSearchTerm, sortBy, sortDirection]);

  // Fetch stats on mount
  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  // Handle toast auto-hide
  useEffect(() => {
    if (toast.show) {
      const timer = setTimeout(() => {
        setToast({ ...toast, show: false });
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  // First fetch needs to load all data for client-side filtering
  const fetchInitialWhispers = async () => {
    try {
      setIsLoading(true);
      setLoading(true);
      const response = await whisperAPI.getAll({ limit: 100 }); // Get all whispers for client-side filtering
      
      if (response.data && response.data.success) {
        let results = [];
        if (response.data.data && Array.isArray(response.data.data)) {
          results = response.data.data;
        } else if (response.data.data && response.data.data.results && Array.isArray(response.data.data.results)) {
          results = response.data.data.results;
        }
        
        setAllWhispers(results);
        setWhispers(results);
        
        // Set total pages
        const totalItems = results.length;
        setTotalPages(Math.ceil(totalItems / pageSize));
        
        // Update stats
        fetchStats();
      } else {
        setError('Failed to fetch whispers');
        showToast('Failed to load whispers', 'error');
      }
    } catch (error) {
      console.error('Error fetching whispers:', error);
      setError('Failed to load whispers. Please try again later.');
      showToast('Error loading whispers', 'error');
    } finally {
      setIsLoading(false);
      setLoading(false);
    }
  };

  // For backward compatibility and places that still reference this function
  const fetchWhispers = () => {
    fetchInitialWhispers();
  };

  // Apply client-side filtering and sorting
  const applyClientSideFilters = () => {
    setIsLoading(true);
    
    // Start with all whispers
    let filteredWhispers = [...allWhispers];
    
    // Apply search term filter
    if (debouncedSearchTerm) {
      const searchLower = debouncedSearchTerm.toLowerCase();
      filteredWhispers = filteredWhispers.filter(whisper => {
        const title = whisper.title || whisper.content?.title || '';
        const message = whisper.content?.message || whisper.message || '';
        return title.toLowerCase().includes(searchLower) || 
               message.toLowerCase().includes(searchLower);
      });
    }
    
    // Apply category filters
    if (categoryFilters.length > 0) {
      filteredWhispers = filteredWhispers.filter(whisper => 
        whisper.category && categoryFilters.includes(whisper.category.toLowerCase())
      );
    }
    
    // Apply priority filters
    if (priorityFilters.length > 0) {
      filteredWhispers = filteredWhispers.filter(whisper => {
        const priorityText = (whisper.priorityText || 
                             whisper.priorityString || 
                             getPriorityTextFromNumber(whisper.priority) || '').toLowerCase();
        return priorityText && priorityFilters.includes(priorityText);
      });
    }
    
    // Apply sorting
    filteredWhispers.sort((a, b) => {
      let aValue, bValue;
      
      // Get comparable values based on sort field
      if (sortBy === 'priority') {
        aValue = typeof a.priority === 'number' ? a.priority : getPriorityNumber(a.priorityText || a.priorityString || 'medium');
        bValue = typeof b.priority === 'number' ? b.priority : getPriorityNumber(b.priorityText || b.priorityString || 'medium');
      } else if (sortBy === 'category') {
        aValue = a.category || '';
        bValue = b.category || '';
      } else if (sortBy === 'title') {
        aValue = a.title || a.content?.title || '';
        bValue = b.title || b.content?.title || '';
      } else { // default to createdAt
        aValue = new Date(a.createdAt || Date.now()).getTime();
        bValue = new Date(b.createdAt || Date.now()).getTime();
      }
      
      // Compare values based on sort direction
      if (sortDirection === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });
    
    // Apply pagination
    const startIndex = (page - 1) * pageSize;
    const paginatedWhispers = filteredWhispers.slice(startIndex, startIndex + pageSize);
    
    // Update state
    setWhispers(paginatedWhispers);
    setTotalPages(Math.ceil(filteredWhispers.length / pageSize || 1));
    setIsLoading(false);
  };

  // Run on component mount to fetch initial data
  useEffect(() => {
    fetchInitialWhispers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Override original fetch mechanism to ensure client-side filtering works reliably
  const handleSearchSubmit = (e) => {
    if (e) e.preventDefault();
    setPage(1);
    // Force immediate search update without debounce
    setDebouncedSearchTerm(searchTerm);
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    setPage(1); // Reset to first page on search change
  };

  const toggleCategoryFilter = (category) => {
    setCategoryFilters(prev => {
      const lowerCategory = category.toLowerCase();
      if (prev.includes(lowerCategory)) {
        return prev.filter(c => c !== lowerCategory);
      } else {
        return [...prev, lowerCategory];
      }
    });
    setPage(1);
  };

  const togglePriorityFilter = (priority) => {
    setPriorityFilters(prev => {
      const lowerPriority = priority.toLowerCase();
      if (prev.includes(lowerPriority)) {
        return prev.filter(p => p !== lowerPriority);
      } else {
        return [...prev, lowerPriority];
      }
    });
    setPage(1);
  };

  const handleRefresh = () => {
    showToast('Refreshing whispers...', 'info');
    fetchInitialWhispers();
  };

  const clearAllFilters = () => {
    setCategoryFilters([]);
    setPriorityFilters([]);
    setSearchTerm('');
    setDebouncedSearchTerm('');
    setPage(1);
    setSortBy('createdAt');
    setSortDirection('desc');
    
    // If we have data, just apply the cleared filters
    if (allWhispers.length > 0) {
      setTimeout(() => applyClientSideFilters(), 0);
    }
  };

  // This is the missing function that's causing the error
  const hasActiveFilters = () => {
    return categoryFilters.length > 0 || priorityFilters.length > 0 || searchTerm !== '';
  };

  const deleteWhisper = async (whisperId) => {
    try {
      setIsLoading(true);
      await whisperAPI.delete(whisperId);
      showToast('Whisper deleted successfully', 'success');
      
      // Remove the whisper from our local cache and reapply filters
      setAllWhispers(prev => prev.filter(w => w._id !== whisperId));
      applyClientSideFilters();
    } catch (error) {
      console.error('Error deleting whisper:', error);
      showToast('Failed to delete whisper', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSort = (field) => {
    if (sortBy === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortDirection('desc');
    }
  };

  const showToast = (message, type = 'info') => {
    setToast({ show: true, message, type });
  };

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    
    const date = new Date(dateString);
    return formatDistanceToNow(date, { addSuffix: true });
  };

  // Get icon for source
  const getSourceIcon = (source) => {
    switch (source?.toLowerCase()) {
      case 'slack': return <FiSlack size={18} />;
      case 'github': return <FiGithub size={18} />;
      case 'email': return <FiMail size={18} />;
      case 'combined': return <FiLayers size={18} />;
      default: return <FiMessageSquare size={18} />;
    }
  };

  // Get icon for category
  const getCategoryIcon = (category) => {
    switch (category?.toLowerCase()) {
      case 'alert': return <FiAlertCircle size={18} />;
      case 'warning': return <FiAlertTriangle size={18} />;
      case 'health': return <FiAlertTriangle size={18} />;
      case 'insight': return <FiInfo size={18} />;
      case 'suggestion': return <FiCheckCircle size={18} />;
      case 'improvement': return <FiCheckCircle size={18} />;
      case 'optimization': return <FiCheckCircle size={18} />;
      case 'collaboration': return <FiInfo size={18} />;
      case 'recognition': return <FiInfo size={18} />;
      default: return <FiInfo size={18} />;
    }
  };

  // Get color for category
  const getCategoryColor = (category) => {
    switch (category?.toLowerCase()) {
      case 'alert': return 'bg-red-900 text-red-100 border-red-800';
      case 'warning': return 'bg-amber-900 text-amber-100 border-amber-800';
      case 'health': return 'bg-amber-900 text-amber-100 border-amber-800';
      case 'insight': return 'bg-blue-900 text-blue-100 border-blue-800';
      case 'suggestion': return 'bg-green-900 text-green-100 border-green-800';
      case 'improvement': return 'bg-green-900 text-green-100 border-green-800';
      case 'optimization': return 'bg-green-900 text-green-100 border-green-800';
      case 'collaboration': return 'bg-indigo-900 text-indigo-100 border-indigo-800';
      case 'recognition': return 'bg-purple-900 text-purple-100 border-purple-800';
      default: return 'bg-gray-700 text-gray-100 border-gray-600';
    }
  };

  // Get color for priority
  const getPriorityColor = (priority) => {
    if (typeof priority === 'number') {
      // Convert numeric priority to string
      switch (priority) {
        case 1: return 'bg-red-900 text-red-100 border-red-800';
        case 2: return 'bg-amber-900 text-amber-100 border-amber-800';
        case 3: return 'bg-blue-900 text-blue-100 border-blue-800';
        case 4:
        case 5: return 'bg-green-900 text-green-100 border-green-800';
        default: return 'bg-blue-900 text-blue-100 border-blue-800';
      }
    }
    
    // Handle string priorities
    switch (priority?.toLowerCase()) {
      case 'critical': return 'bg-red-900 text-red-100 border-red-800';
      case 'high': return 'bg-amber-900 text-amber-100 border-amber-800';
      case 'medium': return 'bg-blue-900 text-blue-100 border-blue-800';
      case 'low': return 'bg-green-900 text-green-100 border-green-800';
      default: return 'bg-blue-900 text-blue-100 border-blue-800';
    }
  };

  const getPriorityBorderColor = (priority) => {
    if (typeof priority === 'number') {
      // Convert numeric priority to string
      switch (priority) {
        case 1: return 'border-l-4 border-l-red-500';
        case 2: return 'border-l-4 border-l-amber-500';
        case 3: return 'border-l-4 border-l-blue-500';
        case 4:
        case 5: return 'border-l-4 border-l-green-500';
        default: return 'border-l-4 border-l-blue-500';
      }
    }
    
    // Handle string priorities
    switch (priority?.toLowerCase()) {
      case 'critical': return 'border-l-4 border-l-red-500';
      case 'high': return 'border-l-4 border-l-amber-500';
      case 'medium': return 'border-l-4 border-l-blue-500';
      case 'low': return 'border-l-4 border-l-green-500';
      default: return 'border-l-4 border-l-blue-500';
    }
  };

  // Convert numeric priority to text
  const getPriorityTextFromNumber = (priority) => {
    if (priority === undefined || priority === null) return null;
    
    const numPriority = Number(priority);
    switch (numPriority) {
      case 1: return 'Critical';
      case 2: return 'High';
      case 3: return 'Medium';
      case 4: case 5: return 'Low';
      default: return 'Medium';
    }
  };
  
  // Map priority string to numeric priority for API filters
  const getPriorityNumber = (priorityString) => {
    switch(priorityString.toLowerCase()) {
      case 'critical': return 1;
      case 'high': return 2;
      case 'medium': return 3;
      case 'low': return 4;
      default: return 3;
    }
  };

  // Count whispers by category
  const categoryCount = useMemo(() => {
    const counts = {};
    categories.forEach(cat => counts[cat] = 0);
    
    whispers.forEach(whisper => {
      if (whisper.category) {
        counts[whisper.category] = (counts[whisper.category] || 0) + 1;
      }
    });
    
    return counts;
  }, [whispers, categories]);

  // Count whispers by priority
  const priorityCount = useMemo(() => {
    const counts = {};
    priorities.forEach(prio => counts[prio] = 0);
    
    whispers.forEach(whisper => {
      const priority = whisper.priorityText || whisper.priorityString || getPriorityTextFromNumber(whisper.priority);
      if (priority) {
        counts[priority.toLowerCase()] = (counts[priority.toLowerCase()] || 0) + 1;
      }
    });
    
    return counts;
  }, [whispers, priorities]);

  // Function to render filter pill
  const renderFilterPill = (label, isActive, onClick, type = 'default') => {
    let colorClass = 'bg-gray-700 hover:bg-gray-600 text-gray-100';
    
    if (isActive) {
      if (type === 'category') {
        colorClass = getCategoryColor(label);
      } else if (type === 'priority') {
        colorClass = getPriorityColor(label);
      } else {
        colorClass = 'bg-blue-900 text-blue-100 border-blue-800';
      }
    }
    
    return (
      <button
        key={label}
        className={`filter-pill ${isActive ? 'active' : ''} ${colorClass}`}
        onClick={onClick}
      >
        <span>{label}</span>
        {isActive && <FiX className="filter-remove" />}
      </button>
    );
  };

  // Render whisper detail modal
  const renderWhisperDetail = () => {
    if (!selectedWhisper) return null;
    
    const priorityText = selectedWhisper.priorityText || 
                          selectedWhisper.priorityString || 
                          getPriorityTextFromNumber(selectedWhisper.priority) || 'Medium';
    
    const message = selectedWhisper.content?.message || selectedWhisper.message || '';
    const title = selectedWhisper.title || selectedWhisper.content?.title || 'Untitled';
    const suggestedActions = selectedWhisper.content?.suggestedActions || selectedWhisper.suggestedActions || [];
    
    return (
      <div className="whisper-detail-overlay" onClick={() => setSelectedWhisper(null)}>
        <motion.div 
          className="whisper-detail-modal"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          transition={{ duration: 0.2 }}
          onClick={e => e.stopPropagation()}
        >
          <button className="close-button" onClick={() => setSelectedWhisper(null)}>
            <FiX size={20} />
          </button>
          
          <div className="modal-header">
            <h2>{title}</h2>
            <div className="modal-meta">
              <div className="meta-item">
                <FiCalendar size={14} />
                <span>{new Date(selectedWhisper.createdAt).toLocaleDateString()}</span>
              </div>
              <div className="meta-item">
                <FiClock size={14} />
                <span>{new Date(selectedWhisper.createdAt).toLocaleTimeString()}</span>
              </div>
              <div className="meta-item">
                <FiTag size={14} />
                <span>ID: {selectedWhisper.whisperId}</span>
              </div>
              {selectedWhisper.metadata?.traceId && (
                <div className="meta-item trace-item" title="Trace data available">
                  <FiExternalLink size={14} />
                  <span>Trace Available</span>
                </div>
              )}
            </div>
          </div>
          
          <div className="modal-badges">
            <div className={`modal-badge ${getCategoryColor(selectedWhisper.category)}`}>
              {getCategoryIcon(selectedWhisper.category)}
              <span>{selectedWhisper.category}</span>
            </div>
            
            <div className={`modal-badge ${getPriorityColor(selectedWhisper.priorityText || selectedWhisper.priorityString || selectedWhisper.priority)}`}>
              <span>{priorityText}</span>
            </div>
          </div>
          
          <div className="modal-content">
            <p>{message}</p>
            
            {suggestedActions.length > 0 && (
              <div className="suggested-actions">
                <h3>Suggested Actions</h3>
                <ul>
                  {suggestedActions.map((action, index) => (
                    <li key={index}>{action}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
          
          <div className="modal-footer">
            <div className="modal-actions">
              <Link 
                to={`/whispers/${selectedWhisper._id}`}
                className="view-details-button"
                onClick={(e) => e.stopPropagation()}
              >
                <FiExternalLink size={16} />
                <span>View Details</span>
              </Link>
              <button 
                className="delete-button"
                onClick={() => {
                  deleteWhisper(selectedWhisper._id);
                  setSelectedWhisper(null);
                }}
              >
                Delete
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    );
  };

  // Render toast notification
  const renderToast = () => {
    if (!toast.show) return null;
    
    let bgColor = 'bg-blue-500';
    if (toast.type === 'error') bgColor = 'bg-red-500';
    if (toast.type === 'success') bgColor = 'bg-green-500';
    
    return (
      <motion.div 
        className={`toast-notification ${bgColor}`}
        initial={{ opacity: 0, y: -50 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -50 }}
        style={{ zIndex: 2000 }} // Ensure toast is above everything else
      >
        <span>{toast.message}</span>
        <button onClick={() => setToast({ ...toast, show: false })}>
          <FiX size={18} />
        </button>
      </motion.div>
    );
  };

  // Render main content
  return (
    <div className="whispers-container">
      {/* Toast Notification */}
      <AnimatePresence>
        {toast.show && renderToast()}
      </AnimatePresence>
      
      {/* Whisper Detail Modal */}
      <AnimatePresence>
        {selectedWhisper && renderWhisperDetail()}
      </AnimatePresence>

      {/* Header Section */}
      <div className="whispers-header">
        <h2 className="page-title">Whispers</h2>
        <div className="header-actions">
          <button 
            className="refresh-button" 
            onClick={handleRefresh}
            disabled={isLoading}
            title="Refresh whispers"
          >
            <FiRefreshCw className={isLoading ? 'spin' : ''} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="stats-cards">
        <div className="stat-card">
          <div className="stat-icon">
            <FiMessageSquare size={24} />
          </div>
          <div className="stat-content">
            <div className="stat-value">{stats.total || whispers.length}</div>
            <div className="stat-label">Total Whispers</div>
          </div>
        </div>
        
        {categories.slice(0, 4).map(category => (
          <div 
            key={category} 
            className="stat-card" 
            onClick={() => {
              if (!categoryFilters.includes(category)) {
                toggleCategoryFilter(category);
              }
            }}
          >
            <div className="stat-icon" style={{ color: getCategoryIcon(category).props.color }}>
              {getCategoryIcon(category)}
            </div>
            <div className="stat-content">
              <div className="stat-value">{categoryCount[category] || 0}</div>
              <div className="stat-label">{category.charAt(0).toUpperCase() + category.slice(1)}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Search and Filters */}
      <div className="search-filter-container">
        <div className="search-container">
          <form onSubmit={handleSearchSubmit} className="search-form">
            <div className="search-input-container">
              <FiSearch className="search-icon" />
              <input 
                type="text" 
                placeholder="Search by title or message..." 
                value={searchTerm}
                onChange={handleSearchChange}
              />
              {searchTerm && (
                <button 
                  type="button" 
                  className="clear-search"
                  onClick={() => {
                    setSearchTerm('');
                    setDebouncedSearchTerm('');
                  }}
                >
                  <FiX />
                </button>
              )}
            </div>
          </form>
          
          <button 
            className={`filter-toggle ${showFilters ? 'active' : ''}`}
            onClick={() => setShowFilters(!showFilters)}
          >
            <FiFilter />
            <span>Filter</span>
            <FiChevronDown className={`chevron ${showFilters ? 'open' : ''}`} />
          </button>
          
          <div className="sort-controls">
            <button 
              className={`sort-button ${sortBy === 'createdAt' ? 'active' : ''}`}
              onClick={() => handleSort('createdAt')}
            >
              <span>Date</span>
              {sortBy === 'createdAt' && (
                sortDirection === 'desc' ? <FiArrowDown /> : <FiArrowUp />
              )}
            </button>
            
            <button 
              className={`sort-button ${sortBy === 'priority' ? 'active' : ''}`}
              onClick={() => handleSort('priority')}
            >
              <span>Priority</span>
              {sortBy === 'priority' && (
                sortDirection === 'desc' ? <FiArrowDown /> : <FiArrowUp />
              )}
            </button>
          </div>
        </div>
        
        {/* Advanced Filters */}
        <AnimatePresence>
          {showFilters && (
            <motion.div 
              className="advanced-filters"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
            >
              <div className="filter-group">
                <h3>Categories</h3>
                <div className="filter-pills">
                  {categories.map((category) => 
                    renderFilterPill(
                      category, 
                      categoryFilters.includes(category.toLowerCase()), 
                      () => toggleCategoryFilter(category),
                      'category'
                    )
                  )}
                </div>
              </div>
              
              <div className="filter-group">
                <h3>Priority</h3>
                <div className="filter-pills">
                  {priorities.map((priority) => 
                    renderFilterPill(
                      priority, 
                      priorityFilters.includes(priority.toLowerCase()), 
                      () => togglePriorityFilter(priority),
                      'priority'
                    )
                  )}
                </div>
              </div>
              
              {hasActiveFilters() && (
                <button className="clear-filters" onClick={clearAllFilters}>
                  Clear all filters
                </button>
              )}
            </motion.div>
          )}
        </AnimatePresence>
        
        {/* Active Filters Summary */}
        {hasActiveFilters() && (
          <div className="active-filters-summary">
            <span>Active filters:</span>
            
            {searchTerm && (
              <div className="active-filter">
                <span>"{searchTerm}"</span>
                <button onClick={() => {
                  setSearchTerm('');
                  setDebouncedSearchTerm('');
                }}>
                  <FiX size={14} />
                </button>
              </div>
            )}
            
            {categoryFilters.map(category => (
              <div 
                key={category} 
                className={`active-filter category ${getCategoryColor(category)}`}
              >
                <span>{category}</span>
                <button onClick={() => toggleCategoryFilter(category)}>
                  <FiX size={14} />
                </button>
              </div>
            ))}
            
            {priorityFilters.map(priority => (
              <div 
                key={priority} 
                className={`active-filter priority ${getPriorityColor(priority)}`}
              >
                <span>{priority}</span>
                <button onClick={() => togglePriorityFilter(priority)}>
                  <FiX size={14} />
                </button>
              </div>
            ))}
            
            <button className="clear-all" onClick={clearAllFilters}>
              Clear all
            </button>
          </div>
        )}
      </div>

      {/* Error message */}
      {error && (
        <div className="error-container">
          <div className="error-content">
            <FiAlertCircle size={20} />
            <span>{error}</span>
            <button 
              type="button" 
              className="close-button" 
              onClick={() => setError(null)}
              aria-label="Close"
            >
              <FiX size={18} />
            </button>
          </div>
        </div>
      )}

      {/* Loading skeleton */}
      {loading ? (
        <div className="whispers-table-container-loading">
          <div className="skeleton-table">
            {Array.from({ length: 5 }).map((_, index) => (
              <div key={index} className="skeleton-row">
                <div className="skeleton-cell skeleton-icon"></div>
                <div className="skeleton-cell skeleton-title"></div>
                <div className="skeleton-cell skeleton-category"></div>
                <div className="skeleton-cell skeleton-priority"></div>
                <div className="skeleton-cell skeleton-date"></div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <>
          {/* Always use table view */}
          {whispers.length > 0 ? (
            <div className="whispers-table-container">
              <table className="whispers-table">
                <thead>
                  <tr>
                    <th className="icon-column"></th>
                    <th>
                      <button 
                        className={`sort-header ${sortBy === 'title' ? 'active' : ''}`}
                        onClick={() => handleSort('title')}
                      >
                        Title
                        {sortBy === 'title' && (
                          sortDirection === 'desc' ? <FiArrowDown /> : <FiArrowUp />
                        )}
                      </button>
                    </th>
                    <th>
                      <button 
                        className={`sort-header ${sortBy === 'category' ? 'active' : ''}`}
                        onClick={() => handleSort('category')}
                      >
                        Category
                        {sortBy === 'category' && (
                          sortDirection === 'desc' ? <FiArrowDown /> : <FiArrowUp />
                        )}
                      </button>
                    </th>
                    <th>
                      <button 
                        className={`sort-header ${sortBy === 'priority' ? 'active' : ''}`}
                        onClick={() => handleSort('priority')}
                      >
                        Priority
                        {sortBy === 'priority' && (
                          sortDirection === 'desc' ? <FiArrowDown /> : <FiArrowUp />
                        )}
                      </button>
                    </th>
                    <th>
                      <button 
                        className={`sort-header ${sortBy === 'createdAt' ? 'active' : ''}`}
                        onClick={() => handleSort('createdAt')}
                      >
                        Created
                        {sortBy === 'createdAt' && (
                          sortDirection === 'desc' ? <FiArrowDown /> : <FiArrowUp />
                        )}
                      </button>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <AnimatePresence>
                    {whispers.map((whisper) => (
                      <motion.tr 
                        key={whisper._id} 
                        className="whisper-row"
                        onClick={() => setSelectedWhisper(whisper)}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        whileHover={{ backgroundColor: '#374151' }}
                      >
                        <td className="icon-column">
                          <div className="source-icon">
                            {getSourceIcon(whisper.metadata?.source)}
                          </div>
                        </td>
                        <td>
                          <div className="title-cell">
                            <div className="title">
                              {whisper.title ? 
                                <span>{whisper.title}</span> 
                                : (whisper.content?.title ? 
                                  <span>{whisper.content.title}</span> 
                                  : "Untitled")}
                              {whisper.metadata?.traceId && (
                                <span className="trace-badge" title="Trace data available">
                                  <FiExternalLink size={14} />
                                </span>
                              )}
                            </div>
                            <div className="message">
                              {whisper.content?.message ? 
                                <span>{whisper.content.message.substring(0, 60)}...</span> 
                                : (whisper.message ? 
                                  <span>{whisper.message.substring(0, 60)}...</span>
                                  : "")}
                            </div>
                          </div>
                        </td>
                        <td>
                          <div className={`category-badge ${getCategoryColor(whisper.category)}`}>
                            {getCategoryIcon(whisper.category)}
                            <span>{whisper.category || 'Unknown'}</span>
                          </div>
                        </td>
                        <td>
                          <div className={`priority-badge ${getPriorityColor(whisper.priorityText || whisper.priorityString || whisper.priority)}`}>
                            <span>{whisper.priorityText || whisper.priorityString || getPriorityTextFromNumber(whisper.priority) || 'Medium'}</span>
                          </div>
                        </td>
                        <td>
                          <div className="date-cell">
                            {formatDate(whisper.createdAt)}
                          </div>
                        </td>
                      </motion.tr>
                    ))}
                  </AnimatePresence>
                </tbody>
              </table>
            </div>
          ) : (
            <div className="empty-state">
              <div className="empty-icon">
                <FiMessageSquare size={48} />
              </div>
              <h3>No whispers found</h3>
              <p>Try adjusting your filters or check back later.</p>
              {hasActiveFilters() && (
                <button className="clear-filters-button" onClick={clearAllFilters}>
                  Clear all filters
                </button>
              )}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="pagination-container">
              <div className="pagination">
                <button 
                  className={`pagination-button ${page === 1 ? 'disabled' : ''}`}
                  onClick={() => setPage(prev => Math.max(prev - 1, 1))}
                  disabled={page === 1}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>
                </button>
                
                {[...Array(totalPages).keys()].map(p => (
                  <button 
                    key={p} 
                    className={`pagination-button ${page === p + 1 ? 'active' : ''}`}
                    onClick={() => setPage(p + 1)}
                  >
                    {p + 1}
                  </button>
                ))}
                
                <button 
                  className={`pagination-button ${page === totalPages ? 'disabled' : ''}`}
                  onClick={() => setPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={page === totalPages}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Whispers; 