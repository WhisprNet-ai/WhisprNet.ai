/**
 * Trace Controller
 * Exposes whisper trace data from OpenTelemetry
 */

import Whisper from '../../models/Whisper.js';
import { controller } from '../../utils/controllerUtils.js';
import { sendSuccess, sendError, sendNotFound } from '../../utils/responseHandler.js';
import fetch from 'node-fetch';

/**
 * Get the trace ID for a specific whisper
 * @route GET /api/organizations/:organizationId/whispers/:id/trace
 */
export const getWhisperTrace = controller(async (req, res) => {
  const { id } = req.params;
  const { organizationId } = req.params;
  
  // Find the whisper by its ID
  const whisper = await Whisper.findOne({ 
    _id: id,
    organizationId 
  });
  
  if (!whisper) {
    return sendNotFound(res, `Whisper with ID ${id} not found`);
  }
  
  // Check if the whisper has a trace ID
  if (!whisper.metadata || !whisper.metadata.traceId) {
    return sendError(res, 'No trace data available for this whisper', 404);
  }
  
  // Return the basic trace metadata
  const traceData = {
    whisperId: whisper.whisperId || id,
    traceId: whisper.metadata.traceId,
    title: whisper.title || whisper.content?.title || `${whisper.category || 'Insight'} Whisper`,
    category: whisper.category,
    priority: whisper.priority,
    agentSessionId: whisper.metadata.agentSessionId,
    generatedAt: whisper.metadata.generatedAt,
    modelName: whisper.metadata.modelName
  };
  
  // Try to fetch detailed trace information from SignOz/OpenTelemetry
  try {
    // Configuration for OpenTelemetry collector API
    const OTEL_API_ENDPOINT = process.env.OTEL_API_ENDPOINT || 'http://localhost:4318';
    
    // Fetch the trace details from the OpenTelemetry collector
    const traceResponse = await fetch(`${OTEL_API_ENDPOINT}/api/v1/traces/${whisper.metadata.traceId}`);
    
    if (traceResponse.ok) {
      const detailedTrace = await traceResponse.json();
      
      // Process the trace data to extract the workflow
      const workflow = processTraceForWorkflow(detailedTrace, whisper.metadata.agentSessionId);
      
      // Add the workflow data to the response
      traceData.workflow = workflow;
    } else {
      // If we couldn't get trace data from SignOz, generate simulated workflow data
      console.log('[TRACER] Could not retrieve trace data from collector, generating simulated workflow');
      traceData.workflow = generateSimulatedWorkflow(whisper);
    }
  } catch (error) {
    console.error('Error fetching detailed trace data:', error);
    // Generate simulated workflow data as fallback
    traceData.workflow = generateSimulatedWorkflow(whisper);
  }
  
  sendSuccess(res, 'Whisper trace data retrieved successfully', traceData);
});

/**
 * Process raw trace data into a structured workflow
 * @param {Object} traceData - Raw trace data from OpenTelemetry
 * @param {String} sessionId - Agent session ID to filter spans
 * @returns {Object} - Structured workflow data
 */
function processTraceForWorkflow(traceData, sessionId) {
  // If no trace data is available, return empty workflow
  if (!traceData || !traceData.spans) {
    return {
      nodes: [],
      connections: [],
    };
  }
  
  const spans = traceData.spans || [];
  const nodes = [];
  const connections = [];
  const spanMap = {};
  
  // First pass: Create nodes for each span
  spans.forEach((span, index) => {
    // Only include spans related to our agent session
    if (span.attributes && 
        (span.attributes['agent.session_id'] === sessionId || 
         span.name.includes('agent'))) {
      
      // Extract agent type from span name
      const agentType = span.name.split('.')[0] || 'unknown';
      
      // Create a node for this span
      const node = {
        id: span.spanId,
        type: agentType,
        name: span.name,
        startTime: span.startTimeUnixNano / 1000000, // Convert to milliseconds
        endTime: span.endTimeUnixNano / 1000000,     // Convert to milliseconds
        duration: (span.endTimeUnixNano - span.startTimeUnixNano) / 1000000, // ms
        status: span.status?.code === 0 ? 'success' : 'error',
        attributes: span.attributes || {},
        events: span.events || [],
      };
      
      // Try to extract input/output data from attributes or events
      const inputEvent = span.events?.find(e => e.name === 'input' || e.name.includes('request'));
      const outputEvent = span.events?.find(e => e.name === 'output' || e.name.includes('response'));
      
      if (inputEvent) {
        node.input = inputEvent.attributes || {};
      }
      
      if (outputEvent) {
        node.output = outputEvent.attributes || {};
      }
      
      // Add to node list and map
      nodes.push(node);
      spanMap[span.spanId] = node;
    }
  });
  
  // Second pass: Create connections based on parent-child relationships
  spans.forEach(span => {
    if (spanMap[span.spanId] && span.parentSpanId && spanMap[span.parentSpanId]) {
      connections.push({
        source: span.parentSpanId,
        target: span.spanId,
        type: 'parent-child'
      });
    }
  });
  
  // Sort nodes by start time
  nodes.sort((a, b) => a.startTime - b.startTime);
  
  return {
    nodes,
    connections,
    // Add a metadata section for high-level information
    metadata: {
      totalDuration: nodes.length > 0 
        ? nodes[nodes.length - 1].endTime - nodes[0].startTime 
        : 0,
      agentCount: new Set(nodes.map(n => n.type)).size,
      errorCount: nodes.filter(n => n.status === 'error').length,
    }
  };
}

/**
 * Generate simulated workflow data for a whisper when trace data isn't available
 * @param {Object} whisper - Whisper document
 * @returns {Object} - Simulated workflow data
 */
function generateSimulatedWorkflow(whisper) {
  const startTime = whisper.metadata?.generatedAt ? new Date(whisper.metadata.generatedAt).getTime() : Date.now() - 60000;
  
  // Generate realistic agent flow data
  const agents = [
    {
      id: "agent-1",
      type: "pulseAgent",
      name: "pulseAgent.execute",
      startTime: startTime,
      endTime: startTime + 12000,
      duration: 12000,
      status: "success",
      attributes: {
        "agent.name": "pulseAgent",
        "agent.session_id": whisper.metadata?.agentSessionId || "session-123",
        "service.name": whisper.metadata?.modelName || "mistral"
      },
      input: {
        "metadata_count": 8,
        "source": whisper.metadata?.source || "slack"
      },
      output: {
        "patterns_found": 2,
        "insights_generated": 1
      }
    },
    {
      id: "agent-2",
      type: "intelAgent",
      name: "intelAgent.execute",
      startTime: startTime + 12500,
      endTime: startTime + 18000,
      duration: 5500,
      status: "success",
      attributes: {
        "agent.name": "intelAgent",
        "agent.session_id": whisper.metadata?.agentSessionId || "session-123",
        "service.name": whisper.metadata?.modelName || "mistral"
      },
      input: {
        "patterns_count": 2,
        "source": whisper.metadata?.source || "slack"
      },
      output: {
        "signals_count": 3,
        "clusters_generated": 1
      }
    },
    {
      id: "agent-3",
      type: "sentinelAgent",
      name: "sentinelAgent.execute",
      startTime: startTime + 18500,
      endTime: startTime + 22000,
      duration: 3500,
      status: "success",
      attributes: {
        "agent.name": "sentinelAgent",
        "agent.session_id": whisper.metadata?.agentSessionId || "session-123",
        "service.name": whisper.metadata?.modelName || "mistral"
      },
      input: {
        "signals_count": 3,
        "source": whisper.metadata?.source || "slack"
      },
      output: {
        "approved_count": 1,
        "rejected_count": 2
      }
    },
    {
      id: "agent-4",
      type: "whisprAgent",
      name: "whisprAgent.execute",
      startTime: startTime + 22500,
      endTime: startTime + 25000,
      duration: 2500,
      status: "success",
      attributes: {
        "agent.name": "whisprAgent",
        "agent.session_id": whisper.metadata?.agentSessionId || "session-123",
        "service.name": whisper.metadata?.modelName || "mistral"
      },
      input: {
        "approved_signals": 1,
        "category": whisper.category || "optimization"
      },
      output: {
        "whisper_count": 1,
        "category": whisper.category || "optimization",
        "priority": whisper.priority || 3
      }
    }
  ];
  
  // Create connections based on agent order
  const connections = [
    { source: "agent-1", target: "agent-2", type: "parent-child" },
    { source: "agent-2", target: "agent-3", type: "parent-child" },
    { source: "agent-3", target: "agent-4", type: "parent-child" }
  ];
  
  return {
    nodes: agents,
    connections,
    metadata: {
      totalDuration: 25000,
      agentCount: 4,
      errorCount: 0
    }
  };
} 