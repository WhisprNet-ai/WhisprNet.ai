import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { whisperAPI } from '../services/api';
import TraceFlow from '../components/TraceFlow';
import '../styles/whisper-detail.css';

const WhisperDetail = () => {
  const { whisperId } = useParams();
  const [whisper, setWhisper] = useState(null);
  const [traceData, setTraceData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tabActive, setTabActive] = useState('details');

  useEffect(() => {
    const fetchWhisperData = async () => {
      try {
        setLoading(true);
        // Fetch the whisper details
        const response = await whisperAPI.getById(whisperId);
        
        if (response.data && response.data.success) {
          setWhisper(response.data.data);
          
          // Try to fetch the trace data for this whisper
          try {
            const traceResponse = await whisperAPI.getTrace(whisperId);
            if (traceResponse.data && traceResponse.data.success) {
              setTraceData(traceResponse.data.data);
            }
          } catch (traceError) {
            console.log('No trace data available for this whisper');
          }
        } else {
          setError('Failed to load whisper details');
        }
      } catch (err) {
        console.error('Error fetching whisper:', err);
        setError('Failed to load whisper. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchWhisperData();
  }, [whisperId]);

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    }).format(date);
  };

  const formatWord = (word) => {
    if (!word) return 'Unknown';
    return word.charAt(0).toUpperCase() + word.slice(1);
  };

  const handleSubmitFeedback = async (isHelpful, comment = '') => {
    try {
      await whisperAPI.updateFeedback(whisperId, {
        isHelpful,
        comment
      });
      // Refresh the whisper data
      const response = await whisperAPI.getById(whisperId);
      if (response.data && response.data.success) {
        setWhisper(response.data.data);
      }
    } catch (err) {
      console.error('Error submitting feedback:', err);
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner">
          <div className="bounce1"></div>
          <div className="bounce2"></div>
          <div className="bounce3"></div>
        </div>
        <p>Loading whisper details...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-container">
        <div className="error-content">
          <i className="fas fa-exclamation-circle"></i>
          <span>{error}</span>
        </div>
        <Link to="/whispers" className="back-link">
          <i className="fas fa-arrow-left"></i> Back to Whispers
        </Link>
      </div>
    );
  }

  if (!whisper) {
    return (
      <div className="empty-state">
        <div className="empty-icon">
          <i className="fas fa-comment-slash"></i>
        </div>
        <h3>Whisper not found</h3>
        <p>The requested whisper could not be found.</p>
        <Link to="/whispers" className="back-link">
          <i className="fas fa-arrow-left"></i> Back to Whispers
        </Link>
      </div>
    );
  }

  return (
    <div className="whisper-detail-container">
      <div className="whisper-header">
        <Link to="/whispers" className="back-link">
          <i className="fas fa-arrow-left"></i> Back to Whispers
        </Link>
        <h2>{whisper.title || whisper.content?.title || `${formatWord(whisper.category || 'Insight')} Whisper`}</h2>
        <div className="whisper-metadata">
          <span className={`badge category-${whisper.category || 'default'}`}>
            {formatWord(whisper.category || 'Unknown')}
          </span>
          <span className={`badge priority-${whisper.priority || 'default'}`}>
            {typeof whisper.priority === 'number' ? `Priority ${whisper.priority}` : formatWord(whisper.priority || 'Medium')}
          </span>
          <span className="whisper-date">
            Created: {formatDate(whisper.createdAt)}
          </span>
        </div>
      </div>

      <div className="tabs">
        <button 
          className={`tab ${tabActive === 'details' ? 'active' : ''}`}
          onClick={() => setTabActive('details')}
        >
          Whisper Details
        </button>
        {traceData && (
          <button 
            className={`tab ${tabActive === 'trace' ? 'active' : ''}`}
            onClick={() => setTabActive('trace')}
          >
            Agent Trace
          </button>
        )}
      </div>

      {tabActive === 'details' ? (
        <div className="whisper-content">
          <div className="message-container">
            <h3>Message</h3>
            <p className="message">{whisper.content?.message || 'No message content'}</p>
          </div>

          {whisper.content?.suggestedActions && whisper.content.suggestedActions.length > 0 && (
            <div className="suggested-actions">
              <h3>Suggested Actions</h3>
              <ul>
                {whisper.content.suggestedActions.map((action, index) => (
                  <li key={index}>{action}</li>
                ))}
              </ul>
            </div>
          )}

          <div className="whisper-metadata-details">
            <h3>Metadata</h3>
            <table>
              <tbody>
                <tr>
                  <td>Whisper ID:</td>
                  <td>{whisper.whisperId}</td>
                </tr>
                <tr>
                  <td>Agent Session:</td>
                  <td>{whisper.metadata?.agentSessionId || 'N/A'}</td>
                </tr>
                <tr>
                  <td>Generated By:</td>
                  <td>{whisper.metadata?.generatedBy || 'N/A'}</td>
                </tr>
                <tr>
                  <td>Model:</td>
                  <td>{whisper.metadata?.modelName || 'N/A'}</td>
                </tr>
                <tr>
                  <td>Confidence:</td>
                  <td>{whisper.metadata?.confidence ? `${(whisper.metadata.confidence * 100).toFixed(0)}%` : 'N/A'}</td>
                </tr>
                {whisper.metadata?.traceId && (
                  <tr>
                    <td>Trace ID:</td>
                    <td>
                      <code>{whisper.metadata.traceId}</code>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="feedback-section">
            <h3>Provide Feedback</h3>
            <div className="feedback-buttons">
              <button 
                className={`feedback-button ${whisper.feedback?.isHelpful === true ? 'active' : ''}`}
                onClick={() => handleSubmitFeedback(true)}
                disabled={whisper.feedback?.isHelpful === true}
              >
                <i className="fas fa-thumbs-up"></i> Helpful
              </button>
              <button 
                className={`feedback-button ${whisper.feedback?.isHelpful === false ? 'active' : ''}`}
                onClick={() => handleSubmitFeedback(false)}
                disabled={whisper.feedback?.isHelpful === false}
              >
                <i className="fas fa-thumbs-down"></i> Not Helpful
              </button>
            </div>
            {whisper.feedback?.isHelpful !== undefined && (
              <p className="feedback-thanks">Thank you for your feedback!</p>
            )}
          </div>
        </div>
      ) : (
        <div className="trace-container">
          {traceData ? (
            <TraceFlow traceData={traceData} />
          ) : (
            <div className="trace-unavailable">
              <div className="trace-icon">
                <i className="fas fa-exclamation-circle"></i>
              </div>
              <h3>Trace Unavailable</h3>
              <p>No trace data is available for this whisper.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default WhisperDetail; 