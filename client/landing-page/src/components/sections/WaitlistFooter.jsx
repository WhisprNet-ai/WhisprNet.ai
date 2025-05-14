import React, { useState } from 'react';

export default function WaitlistFooter() {
  const [email, setEmail] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Backend API URL - can be configured based on environment
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    // Basic frontend validation
    if (!email) {
      setError('Please enter your email');
      return;
    }
    
    if (!/\S+@\S+\.\S+/.test(email)) {
      setError('Please enter a valid email');
      return;
    }
    
    try {
      // Show loading state
      setIsLoading(true);
      
      // Call API to add email to waitlist (using full URL)
      const response = await fetch(`${API_URL}/api/waitlist`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to join waitlist');
      }
      
      // Show success message
      setIsSubmitted(true);
      setEmail('');
    } catch (err) {
      setError(err.message || 'Something went wrong');
    } finally {
      setIsLoading(false);
    }
  };

  const sectionStyle = {
    padding: '6rem 0',
    backgroundImage: 'linear-gradient(to bottom, rgba(15, 15, 28, 1), rgba(20, 20, 40, 0.95))',
    position: 'relative',
    overflow: 'hidden'
  };

  const containerStyle = {
    maxWidth: '80rem',
    margin: '0 auto',
    padding: '0 1rem'
  };

  const contentStyle = {
    maxWidth: '38rem',
    margin: '0 auto 6rem',
    textAlign: 'center'
  };

  const titleStyle = {
    fontSize: 'clamp(1.75rem, 3vw, 2.5rem)',
    fontWeight: 'bold',
    marginBottom: '1rem',
    color: 'white'
  };

  const subtitleStyle = {
    fontSize: 'clamp(1rem, 2vw, 1.25rem)',
    maxWidth: '42rem',
    margin: '0 auto 2rem',
    color: '#d1d5db'
  };

  const formStyle = {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
    maxWidth: '32rem',
    margin: '0 auto'
  };

  const formRowStyle = {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
    width: '100%',
    '@media (min-width: 640px)': {
      flexDirection: 'row'
    }
  };

  const inputStyle = {
    padding: '0.75rem 1rem',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    color: 'white',
    border: '1px solid rgba(255, 255, 255, 0.2)',
    borderRadius: '0.375rem',
    fontSize: '1rem',
    width: '100%',
    transition: 'border-color 0.3s',
    outline: 'none'
  };

  const buttonStyle = {
    padding: '0.75rem 1.5rem',
    background: isLoading ? '#6c62eb' : 'linear-gradient(to right, #4e42ec, #8f4ef2)',
    color: 'white',
    fontWeight: '500',
    borderRadius: '0.375rem',
    cursor: isLoading || isSubmitted ? 'default' : 'pointer',
    transition: 'transform 0.3s, box-shadow 0.3s',
    width: '100%',
    opacity: isLoading ? 0.8 : 1,
    '@media (min-width: 640px)': {
      width: 'auto'
    }
  };

  const errorStyle = {
    color: '#f87171',
    fontSize: '0.875rem',
    marginTop: '0.5rem',
    textAlign: 'left'
  };

  const successStyle = {
    fontSize: '1.125rem',
    padding: '1rem',
    backgroundColor: 'rgba(52, 211, 153, 0.2)',
    color: '#34d399',
    borderRadius: '0.375rem',
    marginTop: '1rem'
  };

  const footerStyle = {
    borderTop: '1px solid rgba(255, 255, 255, 0.1)',
    paddingTop: '2rem',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '2rem',
    '@media (min-width: 768px)': {
      flexDirection: 'row',
      justifyContent: 'space-between'
    }
  };

  const logoTextStyle = {
    fontSize: '1.25rem',
    fontWeight: 'bold',
    color: 'white'
  };

  const linksStyle = {
    display: 'flex',
    gap: '2rem',
    flexWrap: 'wrap',
    justifyContent: 'center'
  };

  const linkStyle = {
    color: 'rgba(255, 255, 255, 0.7)',
    transition: 'color 0.3s'
  };

  const copyrightStyle = {
    color: 'rgba(255, 255, 255, 0.5)',
    fontSize: '0.875rem',
    textAlign: 'center',
    marginTop: '2rem',
    '@media (min-width: 768px)': {
      marginTop: 0
    }
  };

  const footerBlob1Style = {
    position: 'absolute',
    bottom: '-200px',
    left: '-200px',
    width: '400px',
    height: '400px',
    borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(78, 66, 236, 0.2) 0%, rgba(15, 15, 28, 0) 70%)',
    filter: 'blur(50px)',
    zIndex: 0
  };

  const footerBlob2Style = {
    position: 'absolute',
    top: '-100px',
    right: '-100px',
    width: '300px',
    height: '300px',
    borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(143, 78, 242, 0.15) 0%, rgba(15, 15, 28, 0) 70%)',
    filter: 'blur(50px)',
    zIndex: 0
  };

  return (
    <section id="waitlist" style={sectionStyle}>
      <div style={footerBlob1Style}></div>
      <div style={footerBlob2Style}></div>
      
      <div style={containerStyle}>
        <div style={contentStyle}>
          <h2 style={titleStyle}>Join the WhisprNet Waitlist</h2>
          <p style={subtitleStyle}>
            Be among the first to experience the future of team intelligence. 
            Early access spots are limited.
          </p>
          
          <form onSubmit={handleSubmit} style={formStyle}>
            <div style={formRowStyle}>
              <input
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={{
                  ...inputStyle,
                  borderColor: error ? '#f87171' : 'rgba(255, 255, 255, 0.2)'
                }}
                disabled={isLoading || isSubmitted}
              />
              <button 
                type="submit" 
                style={buttonStyle}
                disabled={isLoading || isSubmitted}
                onMouseOver={(e) => {
                  if (!isLoading && !isSubmitted) {
                    e.currentTarget.style.transform = 'scale(1.02)';
                    e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(78, 66, 236, 0.2)';
                  }
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.transform = 'scale(1)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                {isLoading ? 'Joining...' : isSubmitted ? 'Joined!' : 'Join Waitlist'}
              </button>
            </div>
            
            {error && <div style={errorStyle}>{error}</div>}
            {isSubmitted && (
              <div style={successStyle}>
                You're on the waitlist! Check your email.
              </div>
            )}
          </form>
        </div>
        
        <footer style={footerStyle}>
          <div>
            <span style={logoTextStyle}>WhisprNet.ai</span>
          </div>
          
          <div style={linksStyle}>
            <a 
              href="#features" 
              style={linkStyle}
              onMouseOver={(e) => e.currentTarget.style.color = 'white'}
              onMouseOut={(e) => e.currentTarget.style.color = 'rgba(255, 255, 255, 0.7)'}
            >
              Features
            </a>
            <a 
              href="#how-it-works" 
              style={linkStyle}
              onMouseOver={(e) => e.currentTarget.style.color = 'white'}
              onMouseOut={(e) => e.currentTarget.style.color = 'rgba(255, 255, 255, 0.7)'}
            >
              How It Works
            </a>
            <a 
              href="#pricing" 
              style={linkStyle}
              onMouseOver={(e) => e.currentTarget.style.color = 'white'}
              onMouseOut={(e) => e.currentTarget.style.color = 'rgba(255, 255, 255, 0.7)'}
            >
              Pricing
            </a>
            <a 
              href="#faq" 
              style={linkStyle}
              onMouseOver={(e) => e.currentTarget.style.color = 'white'}
              onMouseOut={(e) => e.currentTarget.style.color = 'rgba(255, 255, 255, 0.7)'}
            >
              FAQ
            </a>
            <a 
              href="mailto:info@whisprnet.ai" 
              style={linkStyle}
              onMouseOver={(e) => e.currentTarget.style.color = 'white'}
              onMouseOut={(e) => e.currentTarget.style.color = 'rgba(255, 255, 255, 0.7)'}
            >
              Contact
            </a>
          </div>
        </footer>
        
        <div style={copyrightStyle}>
          © {new Date().getFullYear()} WhisprNet.ai. All rights reserved.
        </div>
      </div>
    </section>
  );
} 