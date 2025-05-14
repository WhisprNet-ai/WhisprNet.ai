import { Routes, Route, Navigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import Layout from './components/layout/Layout'
import Dashboard from './pages/Dashboard'
import Integrations from './pages/Integrations'
import Settings from './pages/Settings'
import Login from './pages/Login'
import InvitationAccept from './pages/InvitationAccept'
import GmailIntegration from './pages/integrations/GmailIntegration'
import GithubConfig from './pages/integrations/GithubConfig'
import SlackConfig from './pages/integrations/SlackConfig'
import GmailConfig from './pages/integrations/GmailConfig'
import Whispers from './pages/Whispers'
import WhisperDetail from './pages/WhisperDetail'
import TeamManagement from './pages/TeamManagement'
import ScopeDefinition from './pages/ScopeDefinition'
import ScopedInsights from './pages/ScopedInsights'
import ManagerDashboard from './pages/ManagerDashboard'
import { OrganizationProvider } from './context/OrganizationContext'
import { ManagerProvider } from './context/ManagerContext'
import { ScopeProvider } from './context/ScopeContext'
import { ScopedInsightsProvider } from './context/ScopedInsightsContext'

// Default organization ID for development
const DEFAULT_ORG_ID = 'dev-org-123';

// Add a utility function at the top to handle token extraction
const getTokenFromUrl = () => {
  // First try getting token from path
  const path = window.location.pathname;
  if (path.includes('/invitations/accept/')) {
    const parts = path.split('/invitations/accept/');
    if (parts.length > 1 && parts[1].length > 0) {
      return parts[1];
    }
  }
  
  // If not found in path, check query string
  const urlParams = new URLSearchParams(window.location.search);
  const token = urlParams.get('token');
  if (token) {
    return token;
  }
  
  return null;
};

// Simplified debug component that doesn't trigger alerts
const RouteDebugger = () => {
  const [pathname, setPathname] = useState(window.location.pathname);
  
  useEffect(() => {
    console.log('Route Debugger mounted, current path:', window.location.pathname);
    
    const handleLocationChange = () => {
      setPathname(window.location.pathname);
      console.log('Location changed to:', window.location.pathname);
    };
    
    window.addEventListener('popstate', handleLocationChange);
    
    // Just log, don't alert
    console.log(`Route Debugger: Path is ${window.location.pathname}`);
    
    return () => {
      window.removeEventListener('popstate', handleLocationChange);
    };
  }, []);
  
  return (
    <div style={{
      position: 'fixed',
      bottom: '10px',
      right: '10px',
      padding: '10px',
      background: 'rgba(0,0,0,0.7)',
      color: 'white',
      zIndex: 9999
    }}>
      Current path: {pathname}
    </div>
  );
};

// Protected route component with all providers
const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  
  // Run once on mount only, no need for dependencies
  useEffect(() => {
    // For debugging purposes
    console.log('Protected route loaded - one time check');
    console.log('User:', localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')) : 'No user data');
    console.log('Organization ID:', localStorage.getItem('user') ? 
      JSON.parse(localStorage.getItem('user')).organizationId || 'Not set in user data' : 
      'No user data');
  }, []); // Empty dependency array ensures it runs only once
  
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  
  return (
    <OrganizationProvider>
      <ManagerProvider>
        <ScopeProvider>
          <ScopedInsightsProvider>
            {children}
          </ScopedInsightsProvider>
        </ScopeProvider>
      </ManagerProvider>
    </OrganizationProvider>
  );
};

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  
  useEffect(() => {
    const token = localStorage.getItem('token');
    setIsAuthenticated(!!token);
    
    // Debug log to verify App is mounting
    console.log('App component mounted');
    console.log('Current location:', window.location.pathname);
    
    // Check if we're on an invitation path - either with path or query param
    if (window.location.pathname.startsWith('/invitations/accept') || 
        (window.location.pathname === '/invitations/accept' && window.location.search.includes('token='))) {
      console.log('On invitation path:', window.location.pathname + window.location.search);
    }
  }, []);

  // Check for invitation URLs - support both query params and path params
  if (window.location.pathname.startsWith('/invitations/accept')) {
    console.log('Directly rendering InvitationAccept component');
    const token = getTokenFromUrl();
    console.log('Extracted token for direct rendering:', token);
    return <InvitationAccept directToken={token} />;
  }

  return (
    <>
      <RouteDebugger />
      <Routes>
        {/* Auth routes */}
        <Route path="/login" element={<Login />} />
        
        {/* Invitation routes - moved to conditional rendering above */}
        <Route path="/invitations/accept/:token" element={<InvitationAccept />} />
        <Route path="/invitations/accept/*" element={<InvitationAccept />} />
        <Route path="/invitations/*" element={<InvitationAccept />} />
        
        {/* Protected routes */}
        <Route path="/" element={
          <ProtectedRoute>
            <Layout><Dashboard /></Layout>
          </ProtectedRoute>
        } />
        <Route path="/dashboard" element={
          <ProtectedRoute>
            <Layout><Dashboard /></Layout>
          </ProtectedRoute>
        } />
        <Route path="/manager-dashboard" element={
          <ProtectedRoute>
            <Layout><ManagerDashboard /></Layout>
          </ProtectedRoute>
        } />
        <Route path="/integrations" element={
          <ProtectedRoute>
            <Layout><Integrations /></Layout>
          </ProtectedRoute>
        } />
        
        {/* Integration routes with organization ID parameter */}
        <Route path="/organizations/:organizationId/integrations/gmail" element={
          <ProtectedRoute>
            <Layout><GmailIntegration /></Layout>
          </ProtectedRoute>
        } />
        
        {/* Integration configuration routes */}
        <Route path="/organizations/:orgId/integrations/github/config" element={
          <ProtectedRoute>
            <Layout><GithubConfig /></Layout>
          </ProtectedRoute>
        } />
        <Route path="/organizations/:orgId/integrations/slack/config" element={
          <ProtectedRoute>
            <Layout><SlackConfig /></Layout>
          </ProtectedRoute>
        } />
        <Route path="/organizations/:orgId/integrations/gmail/config" element={
          <ProtectedRoute>
            <Layout><GmailConfig /></Layout>
          </ProtectedRoute>
        } />
        
        {/* Default routes that redirect to the version with organizationId */}
        <Route path="/integrations/gmail" element={
          <ProtectedRoute>
            <Navigate to={`/organizations/${DEFAULT_ORG_ID}/integrations/gmail`} replace />
          </ProtectedRoute>
        } />
        <Route path="/integrations/github" element={
          <ProtectedRoute>
            <Navigate to={`/organizations/${DEFAULT_ORG_ID}/integrations/github/config`} replace />
          </ProtectedRoute>
        } />
        <Route path="/integrations/slack" element={
          <ProtectedRoute>
            <Navigate to={`/organizations/${DEFAULT_ORG_ID}/integrations/slack/config`} replace />
          </ProtectedRoute>
        } />
        
        <Route path="/settings" element={
          <ProtectedRoute>
            <Layout><Settings /></Layout>
          </ProtectedRoute>
        } />
        
        {/* Whispers routes */}
        <Route path="/whispers" element={
          <ProtectedRoute>
            <Layout><Whispers /></Layout>
          </ProtectedRoute>
        } />
        <Route path="/whispers/:whisperId" element={
          <ProtectedRoute>
            <Layout><WhisperDetail /></Layout>
          </ProtectedRoute>
        } />

        {/* Team Management routes */}
        <Route path="/team-management" element={
          <ProtectedRoute>
            <Layout><TeamManagement /></Layout>
          </ProtectedRoute>
        } />

        {/* Scope Definition routes */}
        <Route path="/scope/:integration" element={
          <ProtectedRoute>
            <Layout><ScopeDefinition /></Layout>
          </ProtectedRoute>
        } />
        <Route path="/scope" element={
          <ProtectedRoute>
            <Layout><ScopeDefinition /></Layout>
          </ProtectedRoute>
        } />

        {/* Scoped Insights routes */}
        <Route path="/scoped-insights/:integration" element={
          <ProtectedRoute>
            <Layout><ScopedInsights /></Layout>
          </ProtectedRoute>
        } />
        <Route path="/scoped-insights" element={
          <ProtectedRoute>
            <Layout><ScopedInsights /></Layout>
          </ProtectedRoute>
        } />
        
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  )
}

export default App 