import React, { useEffect, useRef, useState } from 'react';
import { FiCpu, FiMessageSquare, FiAlertCircle, FiCheckCircle } from 'react-icons/fi';
import '../styles/trace-flow.css';

/**
 * TraceFlow Component
 * Visualizes the agent workflow using flowchart-like UI
 */
const TraceFlow = ({ traceData }) => {
  const containerRef = useRef(null);
  const [selectedNode, setSelectedNode] = useState(null);
  
  // If no workflow data is available, show an info message
  if (!traceData || !traceData.workflow || !traceData.workflow.nodes || traceData.workflow.nodes.length === 0) {
    return (
      <div className="trace-flow-empty">
        <FiAlertCircle size={48} />
        <h3>No detailed trace data available</h3>
        <p>This whisper doesn't have detailed trace data or the trace data cannot be retrieved from the collector.</p>
      </div>
    );
  }
  
  const { nodes, connections, metadata } = traceData.workflow;
  
  // Helper to get agent icon
  const getAgentIcon = (type) => {
    switch (type.toLowerCase()) {
      case 'pulseagent':
        return <FiCpu size={24} />;
      case 'intelagent':
        return <FiCpu size={24} />;
      case 'sentinelagent':
        return <FiCpu size={24} />;
      case 'whispragent':
        return <FiMessageSquare size={24} />;
      case 'supervisor':
        return <FiCpu size={24} />;
      default:
        return <FiCpu size={24} />;
    }
  };
  
  // Helper to format duration
  const formatDuration = (ms) => {
    if (ms < 1000) return `${ms.toFixed(0)}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
  };
  
  // Render agent nodes
  const renderNodes = () => {
    return nodes.map((node, index) => (
      <div 
        key={node.id} 
        className={`agent-node ${node.status} ${selectedNode?.id === node.id ? 'selected' : ''}`}
        onClick={() => setSelectedNode(node)}
      >
        <div className="node-number">{index + 1}</div>
        <div className="node-icon">
          {getAgentIcon(node.type)}
        </div>
        <div className="node-content">
          <div className="node-name">{node.type}</div>
          <div className="node-action">{node.name.split('.')[1] || 'execute'}</div>
          <div className="node-duration">{formatDuration(node.duration)}</div>
        </div>
        <div className="node-status">
          {node.status === 'success' ? <FiCheckCircle size={16} /> : <FiAlertCircle size={16} />}
        </div>
      </div>
    ));
  };
  
  // Render connections between nodes
  const renderConnections = () => {
    return connections.map((connection, index) => {
      // Find source and target nodes by ID
      const source = nodes.find(n => n.id === connection.source);
      const target = nodes.find(n => n.id === connection.target);
      
      if (!source || !target) return null;
      
      // Calculate source and target positions in the rendered list
      const sourceIndex = nodes.findIndex(n => n.id === source.id);
      const targetIndex = nodes.findIndex(n => n.id === target.id);
      
      // Calculate vertical positions
      const sourceY = 64 + sourceIndex * 116; // Approximate node height + margin
      const targetY = 64 + targetIndex * 116;
      
      return (
        <div key={`connection-${index}`} className="node-connection">
          <svg width="100%" height="100%" className="connections-svg">
            <path
              d={`M 40 ${sourceY} L 40 ${targetY}`}
              stroke="#4b5563"
              strokeWidth="2"
              fill="none"
            />
            <circle 
              cx="40" 
              cy={targetY} 
              r="3" 
              fill="#4b5563" 
            />
          </svg>
        </div>
      );
    });
  };
  
  // Render the details view for the selected node
  const renderNodeDetails = () => {
    if (!selectedNode) return null;
    
    return (
      <div className="node-details">
        <h3>{selectedNode.type} Details</h3>
        
        <div className="node-detail-item">
          <label>Operation:</label>
          <span>{selectedNode.name}</span>
        </div>
        
        <div className="node-detail-item">
          <label>Duration:</label>
          <span>{formatDuration(selectedNode.duration)}</span>
        </div>
        
        <div className="node-detail-item">
          <label>Status:</label>
          <span className={`status-badge ${selectedNode.status}`}>
            {selectedNode.status}
          </span>
        </div>
        
        {/* Input data - formatted for end users */}
        <div className="detail-section">
          <h4>What this agent considered:</h4>
          <div className="user-friendly-data">
            {selectedNode.input && Object.keys(selectedNode.input).length > 0 ? (
              <ul className="data-points-list">
                {Object.entries(selectedNode.input).map(([key, value]) => {
                  // Format keys to be more readable
                  const readableKey = key
                    .replace(/_/g, ' ')
                    .replace(/([A-Z])/g, ' $1')
                    .toLowerCase();
                  
                  return (
                    <li key={key}>
                      <strong>{readableKey}:</strong> {' '}
                      {typeof value === 'object' 
                        ? JSON.stringify(value) 
                        : String(value)}
                    </li>
                  );
                })}
              </ul>
            ) : selectedNode.attributes && Object.keys(selectedNode.attributes).length > 0 ? (
              <ul className="data-points-list">
                {Object.entries(selectedNode.attributes)
                  .filter(([key]) => !key.includes('agent.') && !key.includes('service.'))
                  .map(([key, value]) => {
                    const readableKey = key
                      .replace(/_/g, ' ')
                      .replace(/([A-Z])/g, ' $1')
                      .toLowerCase();
                    
                    return (
                      <li key={key}>
                        <strong>{readableKey}:</strong> {' '}
                        {typeof value === 'object' 
                          ? JSON.stringify(value) 
                          : String(value)}
                      </li>
                    );
                  })}
              </ul>
            ) : (
              <p>No specific input data available for this agent.</p>
            )}
          </div>
        </div>
        
        {/* Output data - formatted for end users */}
        <div className="detail-section">
          <h4>Insights generated by this agent:</h4>
          <div className="user-friendly-data">
            {selectedNode.output && Object.keys(selectedNode.output).length > 0 ? (
              <ul className="data-points-list">
                {Object.entries(selectedNode.output).map(([key, value]) => {
                  // Format keys to be more readable
                  const readableKey = key
                    .replace(/_/g, ' ')
                    .replace(/([A-Z])/g, ' $1')
                    .toLowerCase();
                  
                  return (
                    <li key={key}>
                      <strong>{readableKey}:</strong> {' '}
                      {typeof value === 'object' 
                        ? JSON.stringify(value) 
                        : String(value)}
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p>No output data available for this agent.</p>
            )}
          </div>
        </div>
        
        {/* Only show events if requested by advanced users */}
        {false && selectedNode.events && selectedNode.events.length > 0 && (
          <div className="detail-section">
            <h4>Events</h4>
            {selectedNode.events.map((event, index) => (
              <div key={`event-${index}`} className="event-item">
                <div className="event-name">{event.name}</div>
                <div className="event-time">{new Date(event.timeUnixNano / 1000000).toISOString()}</div>
                <pre className="code-block">
                  {JSON.stringify(event.attributes || {}, null, 2)}
                </pre>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };
  
  return (
    <div className="trace-flow-container">
      <div className="trace-flow-header">
        <h3>Agent Workflow</h3>
        <div className="trace-metadata">
          <div className="metadata-item">
            <label>Total Duration:</label>
            <span>{formatDuration(metadata.totalDuration)}</span>
          </div>
          <div className="metadata-item">
            <label>Agents:</label>
            <span>{metadata.agentCount}</span>
          </div>
          <div className="metadata-item">
            <label>Error Count:</label>
            <span>{metadata.errorCount}</span>
          </div>
        </div>
      </div>
      
      <div className="trace-flow-main">
        <div className="trace-flow-graph" ref={containerRef}>
          <div className="nodes-container">
            {renderNodes()}
          </div>
          <div className="connections-container">
            {renderConnections()}
          </div>
        </div>
        
        <div className="trace-flow-details">
          {selectedNode ? renderNodeDetails() : (
            <div className="select-node-prompt">
              <FiCpu size={48} />
              <p>Select an agent node to view its details</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TraceFlow; 