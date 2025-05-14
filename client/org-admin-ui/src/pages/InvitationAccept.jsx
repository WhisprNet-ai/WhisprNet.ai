import { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

// Custom styles for spinner animation
const keyframes = `
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;

// UI Components
const Button = ({ children, onClick, type = 'primary', disabled = false }) => {
  const getStyle = () => {
    if (type === 'primary') {
      return {
        backgroundColor: disabled ? '#7c3aed80' : '#7c3aed',
        color: 'white',
      };
    } else {
      return {
        backgroundColor: 'transparent',
        color: '#7c3aed',
        border: '1px solid #7c3aed',
      };
    }
  };
  
  return (
    <button 
      onClick={onClick} 
      disabled={disabled}
      style={{
        padding: '12px 24px',
        borderRadius: '8px',
        border: 'none',
        fontWeight: '600',
        fontSize: '16px',
        cursor: disabled ? 'not-allowed' : 'pointer',
        transition: 'all 0.2s ease',
        width: '100%',
        marginTop: '1rem',
        ...getStyle()
      }}
    >
      {children}
    </button>
  );
};

const Input = ({ label, type, value, onChange, error, disabled = false }) => {
  return (
    <div style={{ marginBottom: '1.25rem' }}>
      <label 
        style={{ 
          display: 'block', 
          marginBottom: '0.5rem', 
          fontWeight: '500', 
          fontSize: '0.875rem',
          color: error ? '#ef4444' : '#f8fafc'
        }}
      >
        {label}
      </label>
      <input 
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        style={{
          width: '100%',
          padding: '0.75rem',
          borderRadius: '0.5rem',
          border: `1px solid ${error ? '#ef4444' : '#4b5563'}`,
          backgroundColor: 'rgba(255, 255, 255, 0.05)',
          color: '#f8fafc',
          fontSize: '1rem'
        }}
      />
      {error && <p style={{ color: '#ef4444', fontSize: '0.75rem', marginTop: '0.25rem' }}>{error}</p>}
    </div>
  );
};

const PasswordStrengthMeter = ({ password }) => {
  const calculateStrength = (pwd) => {
    if (!pwd) return 0;
    
    let strength = 0;
    
    // Length
    if (pwd.length >= 8) strength += 1;
    if (pwd.length >= 12) strength += 1;
    
    // Complexity
    if (/[A-Z]/.test(pwd)) strength += 1;
    if (/\d/.test(pwd)) strength += 1;
    if (/[^A-Za-z0-9]/.test(pwd)) strength += 1;
    
    return strength;
  };
  
  const getStrengthText = (strength) => {
    if (strength <= 1) return 'Weak';
    if (strength <= 3) return 'Moderate';
    return 'Strong';
  };
  
  const getStrengthColor = (strength) => {
    if (strength <= 1) return '#ef4444';
    if (strength <= 3) return '#f59e0b';
    return '#10b981';
  };
  
  const strength = calculateStrength(password);
  const strengthText = getStrengthText(strength);
  const strengthColor = getStrengthColor(strength);
  
  return (
    <div style={{ marginTop: '0.5rem', marginBottom: '1rem' }}>
      <div style={{ height: '0.25rem', backgroundColor: '#4b5563', borderRadius: '0.125rem', overflow: 'hidden' }}>
        <div 
          style={{ 
            height: '100%', 
            width: `${(strength / 5) * 100}%`, 
            backgroundColor: strengthColor,
            transition: 'width 0.3s ease, background-color 0.3s ease'
          }} 
        />
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginTop: '0.25rem' }}>
        <span style={{ color: strengthColor }}>{strengthText}</span>
        <span style={{ color: '#94a3b8' }}>{strength}/5</span>
      </div>
    </div>
  );
};

// Main Component
const InvitationAccept = ({ directToken }) => {
  const navigate = useNavigate();
  
  // States
  const [token, setToken] = useState(null);
  const [invitationDetails, setInvitationDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formSuccess, setFormSuccess] = useState(false);
  
  // Form states
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  // Validation errors
  const [firstNameError, setFirstNameError] = useState('');
  const [lastNameError, setLastNameError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [confirmPasswordError, setConfirmPasswordError] = useState('');
  
  // Extract token from URL
  useEffect(() => {
    const extractToken = () => {
      // 1. Try from directToken prop
      if (directToken) {
        return directToken;
      }
      
      // 2. Try from query parameters
      const urlParams = new URLSearchParams(window.location.search);
      const queryToken = urlParams.get('token');
      if (queryToken) {
        return queryToken;
      }
      
      // 3. Try from URL path
      const path = window.location.pathname;
      if (path.includes('/accept/')) {
        const pathParts = path.split('/accept/');
        if (pathParts.length > 1 && pathParts[1]) {
          return pathParts[1];
        }
      }
      
      return null;
    };
    
    const foundToken = extractToken();
    setToken(foundToken);
    
    if (foundToken) {
      validateToken(foundToken);
    } else {
      setLoading(false);
      setError('No invitation token found. Please check your invitation link.');
    }
  }, [directToken]);
  
  // Simulate token validation
  const validateToken = async (token) => {
    try {
      setLoading(true);
      
      // Simulate API call
      setTimeout(() => {
        // Check if token exists
        if (token) {
          // Determine invitation type based on token
          const isSuperAdminInvite = token.includes('admin') || Math.random() > 0.5;
          
          setInvitationDetails({
            valid: true,
            email: 'invited.user@example.com',
            invitationType: isSuperAdminInvite ? 'organization_admin' : 'team_manager',
            organizationName: 'WhisprNet Technologies',
            invitedBy: {
              name: isSuperAdminInvite ? 'System Administrator' : 'John Organization Admin',
              email: isSuperAdminInvite ? 'admin@whisprnet.ai' : 'john@whisprnet.ai'
            }
          });
          
          setLoading(false);
        } else {
          setError('This invitation is no longer valid. It may have expired or already been used.');
          setLoading(false);
        }
      }, 1000);
      
    } catch (err) {
      console.error('Error validating token:', err);
      setError('Failed to validate invitation. Please try again or contact support.');
      setLoading(false);
    }
  };
  
  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Reset validation errors
    setFirstNameError('');
    setLastNameError('');
    setPasswordError('');
    setConfirmPasswordError('');
    
    // Validate inputs
    let isValid = true;
    
    if (!firstName.trim()) {
      setFirstNameError('First name is required');
      isValid = false;
    }
    
    if (!lastName.trim()) {
      setLastNameError('Last name is required');
      isValid = false;
    }
    
    if (!password) {
      setPasswordError('Password is required');
      isValid = false;
    } else if (password.length < 8) {
      setPasswordError('Password must be at least 8 characters');
      isValid = false;
    }
    
    if (password !== confirmPassword) {
      setConfirmPasswordError('Passwords do not match');
      isValid = false;
    }
    
    if (!isValid) return;
    
    // Simulate form submission
    setFormSubmitting(true);
    
    setTimeout(() => {
      setFormSubmitting(false);
      setFormSuccess(true);
      
      // Redirect after success
      setTimeout(() => {
        navigate('/login');
      }, 3000);
    }, 1500);
  };
  
  // Calculate password strength
  const calculateStrength = (pwd) => {
    if (!pwd) return 0;
    
    let strength = 0;
    
    // Length check
    if (pwd.length >= 8) strength += 1;
    if (pwd.length >= 12) strength += 1;
    
    // Complexity checks
    if (/[A-Z]/.test(pwd)) strength += 1;
    if (/\d/.test(pwd)) strength += 1;
    if (/[^A-Za-z0-9]/.test(pwd)) strength += 1;
    
    return strength;
  };
  
  // Get color based on password strength
  const getStrengthColor = (strength) => {
    if (strength <= 1) return '#ef4444';
    if (strength <= 3) return '#f59e0b';
    return '#10b981';
  };
  
  // Get text based on password strength
  const getStrengthText = (strength) => {
    if (strength <= 1) return 'Weak';
    if (strength <= 3) return 'Moderate';
    return 'Strong';
  };
  
  // Password strength for current password
  const passwordStrength = calculateStrength(password);
  const strengthColor = getStrengthColor(passwordStrength);
  const strengthText = getStrengthText(passwordStrength);

  // Determine invitation type text
  const getInvitationTypeText = () => {
    if (!invitationDetails) return '';
    
    if (invitationDetails.invitationType === 'organization_admin') {
      return `You've been invited to be an Organization Admin for ${invitationDetails.organizationName}`;
    } else {
      return `You've been invited to join ${invitationDetails.organizationName} as a Team Manager`;
    }
  };
  
  // Render loading state
  if (loading) {
    return (
      <div className="invitation-page">
        <style>
          {keyframes}
          {`.invitation-page {
            min-height: 100vh;
            background-color: #0f172a;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 2rem;
            color: #f8fafc;
            font-family: sans-serif;
          }
          .card {
            width: 100%;
            max-width: 600px;
            background-color: #1e293b;
            border-radius: 1rem;
            box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
            padding: 2.5rem;
            display: flex;
            flex-direction: column;
            align-items: center;
          }
          .loading-spinner {
            width: 60px;
            height: 60px;
            border-radius: 50%;
            border: 3px solid rgba(124, 58, 237, 0.1);
            border-top-color: #7c3aed;
            animation: spin 1s linear infinite;
            margin-bottom: 1.5rem;
          }`}
        </style>
        <div className="card">
          <div className="loading-spinner"></div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1rem' }}>
            Loading Invitation...
          </h2>
          <p style={{ fontSize: '1rem', color: '#cbd5e1' }}>
            Please wait while we validate your invitation.
          </p>
        </div>
      </div>
    );
  }
  
  // Render error state
  if (error) {
    return (
      <div className="invitation-page">
        <style>
          {`.invitation-page {
            min-height: 100vh;
            background-color: #0f172a;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 2rem;
            color: #f8fafc;
            font-family: sans-serif;
          }
          .card {
            width: 100%;
            max-width: 600px;
            background-color: #1e293b;
            border-radius: 1rem;
            box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
            padding: 2.5rem;
            display: flex;
            flex-direction: column;
            align-items: center;
          }
          .error-icon {
            width: 80px;
            height: 80px;
            border-radius: 50%;
            background-color: #ef4444;
            color: white;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 2.5rem;
            margin-bottom: 1.5rem;
          }
          .button {
            padding: 0.75rem 1.5rem;
            background-color: #7c3aed;
            color: white;
            border: none;
            border-radius: 0.5rem;
            font-weight: 600;
            cursor: pointer;
            margin-top: 1rem;
            font-size: 1rem;
          }`}
        </style>
        <div className="card">
          <div className="error-icon">!</div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1rem' }}>
            Invitation Error
          </h2>
          <p style={{ fontSize: '1rem', color: '#cbd5e1', marginBottom: '1.5rem', textAlign: 'center' }}>
            {error}
          </p>
          <button className="button" onClick={() => navigate('/login')}>
            Go to Login
          </button>
        </div>
      </div>
    );
  }
  
  // Render success state
  if (formSuccess) {
    return (
      <div className="invitation-page">
        <style>
          {`.invitation-page {
            min-height: 100vh;
            background-color: #0f172a;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 2rem;
            color: #f8fafc;
            font-family: sans-serif;
          }
          .card {
            width: 100%;
            max-width: 600px;
            background-color: #1e293b;
            border-radius: 1rem;
            box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
            padding: 2.5rem;
            display: flex;
            flex-direction: column;
            align-items: center;
          }
          .success-icon {
            width: 80px;
            height: 80px;
            border-radius: 50%;
            background-color: #10b981;
            color: white;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 2.5rem;
            margin-bottom: 1.5rem;
          }
          .button {
            padding: 0.75rem 1.5rem;
            background-color: #7c3aed;
            color: white;
            border: none;
            border-radius: 0.5rem;
            font-weight: 600;
            cursor: pointer;
            margin-top: 1rem;
            font-size: 1rem;
          }`}
        </style>
        <div className="card">
          <div className="success-icon">✓</div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1rem' }}>
            Registration Complete!
          </h2>
          <p style={{ fontSize: '1rem', color: '#cbd5e1', marginBottom: '0.5rem', textAlign: 'center' }}>
            Your account has been successfully created.
          </p>
          <p style={{ fontSize: '1rem', color: '#cbd5e1', fontWeight: '600', marginBottom: '1.5rem', textAlign: 'center' }}>
            You'll be redirected to the login page in a few seconds...
          </p>
          <button className="button" onClick={() => navigate('/login')}>
            Go to Login Now
          </button>
        </div>
      </div>
    );
  }
  
  // Render main form
  return (
    <div className="invitation-page">
      <style>
        {`.invitation-page {
          min-height: 100vh;
          background-color: #0f172a;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 2rem;
          color: #f8fafc;
          font-family: sans-serif;
        }
        .card {
          width: 100%;
          max-width: 600px;
          background-color: #1e293b;
          border-radius: 1rem;
          box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
          padding: 2.5rem;
          display: flex;
          flex-direction: column;
          align-items: center;
        }
        .logo {
          width: 80px;
          height: 80px;
          margin-bottom: 1.5rem;
        }
        .invite-info {
          background-color: rgba(124, 58, 237, 0.1);
          border-radius: 0.5rem;
          padding: 1rem;
          margin-bottom: 1.5rem;
          width: 100%;
          border: 1px solid rgba(124, 58, 237, 0.2);
        }
        .form {
          width: 100%;
        }
        .form-row {
          display: flex;
          gap: 1rem;
          margin-bottom: 0.5rem;
        }
        .form-col {
          flex: 1;
        }
        .form-group {
          margin-bottom: 1.25rem;
        }
        .label {
          display: block;
          margin-bottom: 0.5rem;
          font-weight: 500;
          font-size: 0.875rem;
        }
        .input {
          width: 100%;
          padding: 0.75rem;
          border-radius: 0.5rem;
          border: 1px solid #4b5563;
          background-color: rgba(255, 255, 255, 0.05);
          color: #f8fafc;
          font-size: 1rem;
        }
        .error {
          color: #ef4444;
          font-size: 0.75rem;
          margin-top: 0.25rem;
        }
        .password-strength {
          margin-top: 0.5rem;
          margin-bottom: 1rem;
        }
        .strength-bar {
          height: 0.25rem;
          background-color: #4b5563;
          border-radius: 0.125rem;
          overflow: hidden;
        }
        .strength-fill {
          height: 100%;
          transition: width 0.3s ease, background-color 0.3s ease;
        }
        .strength-text {
          display: flex;
          justify-content: space-between;
          font-size: 0.75rem;
          margin-top: 0.25rem;
        }
        .button {
          width: 100%;
          padding: 0.75rem;
          background-color: #7c3aed;
          color: white;
          border: none;
          border-radius: 0.5rem;
          font-weight: 600;
          cursor: pointer;
          margin-top: 1rem;
          font-size: 1rem;
        }
        .button:disabled {
          background-color: rgba(124, 58, 237, 0.5);
          cursor: not-allowed;
        }
        .terms {
          font-size: 0.75rem;
          color: #94a3b8;
          text-align: center;
          margin-top: 1.5rem;
        }
        .link {
          color: #7c3aed;
          text-decoration: none;
          margin-left: 0.25rem;
          margin-right: 0.25rem;
        }`}
      </style>
      <div className="card">
        <img 
          src="/favicon.svg" 
          alt="WhisprNet Logo" 
          className="logo" 
        />
        
        <h1 style={{ fontSize: '1.875rem', fontWeight: '700', marginBottom: '1rem', textAlign: 'center' }}>
          Welcome to WhisprNet
        </h1>
        
        <p style={{ fontSize: '1.25rem', fontWeight: '500', marginBottom: '1.5rem', textAlign: 'center', color: '#94a3b8' }}>
          {getInvitationTypeText()}
        </p>
        
        <div className="invite-info">
          <p>Invited by: <span style={{ color: '#f8fafc', fontWeight: '600' }}>{invitationDetails?.invitedBy.name}</span></p>
          <p>Email: <span style={{ color: '#f8fafc', fontWeight: '600' }}>{invitationDetails?.email}</span></p>
        </div>
        
        <form onSubmit={handleSubmit} className="form">
          <div className="form-row">
            <div className="form-col">
              <div className="form-group">
                <label className="label" style={{ color: firstNameError ? '#ef4444' : '#f8fafc' }}>First Name</label>
                <input
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="input"
                  style={{ borderColor: firstNameError ? '#ef4444' : '#4b5563' }}
                />
                {firstNameError && <p className="error">{firstNameError}</p>}
              </div>
            </div>
            <div className="form-col">
              <div className="form-group">
                <label className="label" style={{ color: lastNameError ? '#ef4444' : '#f8fafc' }}>Last Name</label>
                <input
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="input"
                  style={{ borderColor: lastNameError ? '#ef4444' : '#4b5563' }}
                />
                {lastNameError && <p className="error">{lastNameError}</p>}
              </div>
            </div>
          </div>
          
          <div className="form-group">
            <label className="label">Email</label>
            <input
              type="email"
              value={invitationDetails?.email || ''}
              disabled
              className="input"
              style={{ opacity: 0.7 }}
            />
          </div>
          
          <div className="form-group">
            <label className="label" style={{ color: passwordError ? '#ef4444' : '#f8fafc' }}>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input"
              style={{ borderColor: passwordError ? '#ef4444' : '#4b5563' }}
            />
            {passwordError && <p className="error">{passwordError}</p>}
            
            <div className="password-strength">
              <div className="strength-bar">
                <div
                  className="strength-fill"
                  style={{
                    width: `${(passwordStrength / 5) * 100}%`,
                    backgroundColor: strengthColor
                  }}
                />
              </div>
              <div className="strength-text">
                <span style={{ color: strengthColor }}>{strengthText}</span>
                <span style={{ color: '#94a3b8' }}>{passwordStrength}/5</span>
              </div>
            </div>
          </div>
          
          <div className="form-group">
            <label className="label" style={{ color: confirmPasswordError ? '#ef4444' : '#f8fafc' }}>Confirm Password</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="input"
              style={{ borderColor: confirmPasswordError ? '#ef4444' : '#4b5563' }}
            />
            {confirmPasswordError && <p className="error">{confirmPasswordError}</p>}
          </div>
          
          <button type="submit" className="button" disabled={formSubmitting}>
            {formSubmitting ? 'Creating Account...' : 'Complete Registration'}
          </button>
        </form>
        
        <p className="terms">
          By completing registration, you agree to WhisprNet's
          <a href="/terms" className="link">Terms of Service</a> and
          <a href="/privacy" className="link">Privacy Policy</a>.
        </p>
      </div>
    </div>
  );
};

export default InvitationAccept; 