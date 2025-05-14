import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/layout/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Organizations from './pages/Organizations';
import Invitations from './pages/Invitations';
import Whispers from './pages/Whispers';
import Settings from './pages/Settings';

// Protected route component
const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  console.log('ProtectedRoute check - Token exists:', !!token);
  if (!token) {
    console.log('No token found, redirecting to login...');
    return <Navigate to="/login" replace />;
  }
  console.log('Token found, rendering protected content');
  return children;
};

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  
  useEffect(() => {
    const token = localStorage.getItem('token');
    setIsAuthenticated(!!token);
  }, []);

  return (
    <Router>
      <Routes>
        {/* Auth routes */}
        <Route path="/login" element={<Login />} />
        
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
        <Route path="/organizations" element={
          <ProtectedRoute>
            <Layout><Organizations /></Layout>
          </ProtectedRoute>
        } />
        <Route path="/invitations" element={
          <ProtectedRoute>
            <Layout><Invitations /></Layout>
          </ProtectedRoute>
        } />
        <Route path="/whispers" element={
          <ProtectedRoute>
            <Layout><Whispers /></Layout>
          </ProtectedRoute>
        } />
        <Route path="/settings" element={
          <ProtectedRoute>
            <Layout><Settings /></Layout>
          </ProtectedRoute>
        } />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App
