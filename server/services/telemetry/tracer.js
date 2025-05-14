/**
 * OpenTelemetry tracing for WhisprNet agents
 * Sends trace data to SignOz
 */

import { NodeSDK } from '@opentelemetry/sdk-node';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { SemanticResourceAttributes } from '@opentelemetry/semantic-conventions';
import { trace, context, SpanStatusCode } from '@opentelemetry/api';

// Configure the OpenTelemetry endpoint - default to localhost for SignOz
const OTEL_EXPORTER_OTLP_ENDPOINT = process.env.OTEL_EXPORTER_OTLP_ENDPOINT || 'http://localhost:4318';
const SERVICE_NAME = process.env.OTEL_SERVICE_NAME || 'whisprnet-agent';
const DISABLE_TRACING = process.env.DISABLE_TRACING === 'true';

let sdk;

// First, dynamically import the Resource module
// This avoids the direct ESM named import issue with CommonJS modules
async function initializeTracing() {
  if (DISABLE_TRACING) return;
  
  try {
    console.log(`[TRACER] Initializing OpenTelemetry with endpoint: ${OTEL_EXPORTER_OTLP_ENDPOINT}`);
    
    // Use manual resource attributes instead of the Resource class that's causing issues
    const resourceAttributes = {
      [SemanticResourceAttributes.SERVICE_NAME]: SERVICE_NAME,
    };
    
    console.log(`[TRACER] Creating SDK with service name: ${SERVICE_NAME}`);
    
    // Create the SDK without explicitly using the Resource constructor
    sdk = new NodeSDK({
      // The SDK will create a default resource with our attributes
      resourceAttributes,
      traceExporter: new OTLPTraceExporter({
        url: `${OTEL_EXPORTER_OTLP_ENDPOINT}/v1/traces`,
      }),
    });
    
    // Start the SDK
    await sdk.start();
    console.log('[TRACER] OpenTelemetry SDK started successfully ✅');
    
    // Handle shutdown
    process.on('SIGTERM', async () => {
      try {
        await sdk.shutdown();
        console.log('[TRACER] OpenTelemetry SDK shut down successfully');
      } catch (error) {
        console.error('[TRACER] Error shutting down OpenTelemetry SDK:', error);
      } finally {
        process.exit(0);
      }
    });
  } catch (error) {
    console.error('[TRACER] Failed to initialize OpenTelemetry SDK:', error);
  }
}

// Initialize tracing as soon as this module loads
initializeTracing().catch(err => {
  console.error('[TRACER] Initialization error:', err);
});

/**
 * Creates a new span for an agent
 * @param {string} agentName - The name of the agent 
 * @param {object} attributes - Attributes to add to the span
 * @returns {object} - The span object or a fallback mock if tracing is disabled
 */
export function startAgentSpan(agentName, attributes = {}) {
  if (DISABLE_TRACING || !sdk) {
    return createMockSpan(agentName, attributes);
  }
  
  try {
    const tracer = trace.getTracer('whisprnet-agents');
    const spanName = `${agentName}.execute`;
    
    const span = tracer.startSpan(spanName);
    
    // Add default attributes
    span.setAttribute('agent.name', agentName);
    span.setAttribute('service.name', SERVICE_NAME);
    
    // Add custom attributes
    Object.entries(attributes).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        span.setAttribute(key, value);
      }
    });
    
    return span;
  } catch (error) {
    console.error(`[TRACER] Error starting span for ${agentName}:`, error);
    return createMockSpan(agentName, attributes);
  }
}

/**
 * Ends a span with success status
 * @param {object} span - The span to end
 * @param {object} attributes - Optional additional attributes to add
 */
export function endSpan(span, attributes = {}) {
  if (!span) return;
  
  try {
    // Add any additional attributes
    Object.entries(attributes).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        span.setAttribute(key, value);
      }
    });
    
    span.setStatus({ code: SpanStatusCode.OK });
    span.end();
  } catch (error) {
    console.error('[TRACER] Error ending span:', error);
  }
}

/**
 * Ends a span with error status
 * @param {object} span - The span to end
 * @param {Error} error - The error that occurred
 * @param {object} attributes - Optional additional attributes to add
 */
export function endSpanWithError(span, error, attributes = {}) {
  if (!span) return;
  
  try {
    // Add any additional attributes
    Object.entries(attributes).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        span.setAttribute(key, value);
      }
    });
    
    span.setStatus({
      code: SpanStatusCode.ERROR,
      message: error.message,
    });
    span.recordException(error);
    span.end();
  } catch (err) {
    console.error('[TRACER] Error ending span with error:', err);
  }
}

/**
 * Get the current active trace ID
 * @returns {string|null} - The current trace ID or null
 */
export function getCurrentTraceId() {
  if (DISABLE_TRACING || !sdk) {
    return `mock-trace-${Date.now()}-${Math.floor(Math.random() * 1000000)}`;
  }
  
  try {
    const currentSpan = trace.getSpan(context.active());
    if (currentSpan) {
      return currentSpan.spanContext().traceId;
    }
  } catch (error) {
    console.error('[TRACER] Error getting current trace ID:', error);
  }
  
  return null;
}

/**
 * Creates a mock span for when tracing is disabled
 * @param {string} agentName - The name of the agent
 * @param {object} attributes - Attributes for the span
 * @returns {object} - A mock span object
 */
function createMockSpan(agentName, attributes = {}) {
  console.log(`[MOCK TRACER] Starting span for agent: ${agentName}`, attributes);
  
  return {
    setAttribute: (key, value) => {
      console.log(`[MOCK TRACER] Setting attribute ${key}=${value} for ${agentName}`);
    },
    setStatus: (status) => {
      console.log(`[MOCK TRACER] Setting status ${status.code} for ${agentName}`);
    },
    recordException: (error) => {
      console.log(`[MOCK TRACER] Recording exception for ${agentName}: ${error.message}`);
    },
    end: () => {
      console.log(`[MOCK TRACER] Ending span for ${agentName}`);
    }
  };
}

export default {
  startAgentSpan,
  endSpan,
  endSpanWithError,
  getCurrentTraceId
}; 