import React, { useState, useEffect } from 'react';
import { whisperAPI } from '../services/api';

const Whispers = () => {
  const [whispers, setWhispers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedPriority, setSelectedPriority] = useState('all');

  // Fetch whispers on component mount
  useEffect(() => {
    fetchWhispers();
  }, []);

  // Function to fetch whispers from API
  const fetchWhispers = async () => {
    try {
      setLoading(true);
      const response = await whisperAPI.getAll();
      setWhispers(response.data.data);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching whispers:', err);
      setError(err.response?.data?.error || 'Failed to fetch whispers');
      setLoading(false);
    }
  };

  // Function to format date
  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  // Function to get category badge class
  const getCategoryBadgeClass = (category) => {
    switch (category) {
      case 'insight':
        return 'bg-blue-900/50 text-blue-300 border border-blue-500/50';
      case 'warning':
        return 'bg-amber-900/50 text-amber-300 border border-amber-500/50';
      case 'alert':
        return 'bg-red-900/50 text-red-300 border border-red-500/50';
      case 'suggestion':
        return 'bg-emerald-900/50 text-emerald-300 border border-emerald-500/50';
      default:
        return 'bg-gray-800/50 text-gray-300 border border-gray-600/50';
    }
  };

  // Function to get priority badge class
  const getPriorityBadgeClass = (priority) => {
    switch (priority) {
      case 'high':
        return 'bg-red-900/50 text-red-300 border border-red-500/50';
      case 'medium':
        return 'bg-amber-900/50 text-amber-300 border border-amber-500/50';
      case 'low':
        return 'bg-emerald-900/50 text-emerald-300 border border-emerald-500/50';
      case 'critical':
        return 'bg-purple-900/50 text-purple-300 border border-purple-500/50';
      default:
        return 'bg-gray-800/50 text-gray-300 border border-gray-600/50';
    }
  };

  // Determine category from tags
  const getCategory = (whisper) => {
    if (!whisper.tags || whisper.tags.length === 0) return 'insight';
    
    const tag = whisper.tags[0].toLowerCase();
    if (tag.includes('warning')) return 'warning';
    if (tag.includes('alert')) return 'alert';
    if (tag.includes('suggestion')) return 'suggestion';
    if (tag.includes('insight')) return 'insight';
    
    return 'insight';
  };
  
  // Determine priority based on status
  const getPriority = (whisper) => {
    if (whisper.status === 'published') return 'high';
    if (whisper.status === 'draft') return 'medium';
    if (whisper.status === 'archived') return 'low';
    
    return 'medium';
  };

  // Filter whispers by selected category and priority
  const filteredWhispers = whispers.filter(whisper => {
    const category = getCategory(whisper);
    const priority = getPriority(whisper);
    
    if (selectedCategory !== 'all' && category !== selectedCategory) {
      return false;
    }
    if (selectedPriority !== 'all' && priority !== selectedPriority) {
      return false;
    }
    return true;
  });

  // Function to resend whisper
  const handleResendWhisper = async (id) => {
    try {
      // Find the whisper to get its data
      const whisper = whispers.find(w => w._id === id);
      if (!whisper) return;
      
      // Update the whisper's status to published if it's not already
      if (whisper.status !== 'published') {
        await whisperAPI.update(id, { 
          ...whisper,
          status: 'published' 
        });
        
        // Refresh whispers
        await fetchWhispers();
      }
    } catch (err) {
      console.error('Error resending whisper:', err);
      setError(err.response?.data?.error || 'Failed to resend whisper');
    }
  };

  // Function to view details of a whisper
  const handleViewDetails = (id) => {
    console.log(`View details for whisper ${id}`);
    // This would navigate to a details view in a real implementation
  };

  if (loading && whispers.length === 0) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="spinner-border animate-spin inline-block w-8 h-8 border-4 rounded-full text-blue-500" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  if (error && whispers.length === 0) {
    return (
      <div className="bg-red-900/50 text-red-300 border border-red-500/50 p-4 rounded-lg">
        <p>Error: {error}</p>
        <button 
          onClick={fetchWhispers}
          className="mt-2 px-4 py-2 bg-red-800 text-white rounded-lg hover:bg-red-700"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">
          Whispers
        </h1>
        <p className="mt-2 text-gray-400">
          AI-generated insights and alerts for your team
        </p>
      </div>

      {/* Filters */}
      <div className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="category-filter" className="block text-sm font-medium text-gray-300 mb-1">
            Filter by Category
          </label>
          <select
            id="category-filter"
            name="category-filter"
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-600 bg-gray-700/50 focus:outline-none focus:ring-cyan-500 focus:border-cyan-500 sm:text-sm rounded-md text-gray-200"
          >
            <option value="all">All Categories</option>
            <option value="insight">Insight</option>
            <option value="warning">Warning</option>
            <option value="alert">Alert</option>
            <option value="suggestion">Suggestion</option>
          </select>
        </div>
        <div>
          <label htmlFor="priority-filter" className="block text-sm font-medium text-gray-300 mb-1">
            Filter by Priority
          </label>
          <select
            id="priority-filter"
            name="priority-filter"
            value={selectedPriority}
            onChange={(e) => setSelectedPriority(e.target.value)}
            className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-600 bg-gray-700/50 focus:outline-none focus:ring-cyan-500 focus:border-cyan-500 sm:text-sm rounded-md text-gray-200"
          >
            <option value="all">All Priorities</option>
            <option value="critical">Critical</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
        </div>
      </div>

      {/* Whispers List */}
      <div className="space-y-4">
        {filteredWhispers.length === 0 ? (
          <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-700 p-6 text-center text-gray-400">
            No whispers found matching the selected filters.
          </div>
        ) : (
          filteredWhispers.map((whisper) => {
            const category = getCategory(whisper);
            const priority = getPriority(whisper);
            const confidence = whisper.metadata?.confidence || 0.8;
            const source = whisper.metadata?.source || 'internal';
            
            // Extract title from different possible formats
            const title = typeof whisper.title === 'string' 
              ? whisper.title 
              : (whisper.content?.title || 'Untitled Whisper');
            
            // Handle different formats for description/suggestedActions
            let suggestedActions = [];
            if (whisper.content?.suggestedActions && Array.isArray(whisper.content.suggestedActions)) {
              suggestedActions = whisper.content.suggestedActions;
            } else if (whisper.description) {
              if (typeof whisper.description === 'string') {
                suggestedActions = whisper.description.split('\n').filter(line => line.trim().startsWith('-'));
              } else if (whisper.description.suggestedActions && Array.isArray(whisper.description.suggestedActions)) {
                suggestedActions = whisper.description.suggestedActions;
              }
            } else if (whisper.suggestedActions && Array.isArray(whisper.suggestedActions)) {
              suggestedActions = whisper.suggestedActions;
            }
            
            // Extract message content from different possible formats
            const messageContent = typeof whisper.content === 'string' 
              ? whisper.content 
              : (whisper.content?.message || whisper.content?.title || '');
            
            return (
              <div key={whisper._id} className="bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-700 shadow-lg overflow-hidden group hover:border-cyan-800/50 hover:shadow-cyan-900/20 transition-all duration-200">
                <div className="px-4 py-5 sm:px-6 flex justify-between items-start border-b border-gray-700">
                  <div>
                    <h3 className="text-lg leading-6 font-medium text-gray-200 group-hover:text-cyan-400 transition-colors flex items-center">
                      {title}
                      <span className={`ml-2 px-2.5 py-0.5 rounded-full text-xs font-medium ${getPriorityBadgeClass(priority)}`}>
                        {priority}
                      </span>
                      <span className={`ml-2 px-2.5 py-0.5 rounded-full text-xs font-medium ${getCategoryBadgeClass(category)}`}>
                        {category}
                      </span>
                    </h3>
                    <p className="mt-1 max-w-2xl text-sm text-gray-400">
                      Generated {formatDate(whisper.createdAt)} • 
                      <span className="ml-1 font-medium">{whisper.organizationId?.name || 'Unknown Organization'}</span> • 
                      <span className="ml-1 capitalize">Source: {source}</span>
                    </p>
                  </div>
                  <div>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-700/70 text-gray-300 border border-gray-600/50">
                      {whisper.status || 'draft'}
                    </span>
                  </div>
                </div>
                <div className="border-b border-gray-700 px-4 py-5 sm:px-6">
                  <div className="text-sm text-gray-300 mb-4">
                    {messageContent}
                  </div>
                  {suggestedActions.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-300 mb-2">Suggested Actions:</h4>
                      <ul className="list-disc pl-5 text-sm text-gray-400 space-y-1">
                        {suggestedActions.map((action, index) => (
                          <li key={index}>
                            {typeof action === 'string' 
                              ? action.replace(/^-\s*/, '').trim() 
                              : action.text || (typeof action === 'object' && JSON.stringify(action))}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
                <div className="bg-gray-900/50 px-4 py-4 sm:px-6 flex justify-between items-center">
                  <div className="text-xs text-gray-400">
                    Confidence: <span className="text-cyan-400">{(confidence * 100).toFixed(0)}%</span>
                  </div>
                  <div>
                    <button
                      className="inline-flex items-center px-2.5 py-1.5 border border-transparent text-xs font-medium rounded-lg text-cyan-400 bg-cyan-900/30 hover:bg-cyan-900/50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-500 focus:ring-offset-gray-800 mr-2 transition-colors"
                      onClick={() => handleResendWhisper(whisper._id)}
                    >
                      Resend
                    </button>
                    <button
                      className="inline-flex items-center px-2.5 py-1.5 border border-gray-600 shadow-sm text-xs font-medium rounded-lg text-gray-300 bg-gray-800 hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-500 focus:ring-offset-gray-800 transition-colors"
                      onClick={() => handleViewDetails(whisper._id)}
                    >
                      View Details
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default Whispers; 