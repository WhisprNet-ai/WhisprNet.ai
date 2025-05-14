import { useState, useEffect } from 'react';
import logo from '../../assets/images/WhisprNet.ai.png';

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);

  // Check if we're on desktop
  useEffect(() => {
    const checkIfDesktop = () => {
      setIsDesktop(window.innerWidth >= 768);
    };
    
    // Initial check
    checkIfDesktop();
    
    // Add event listener
    window.addEventListener('resize', checkIfDesktop);
    
    // Clean up
    return () => window.removeEventListener('resize', checkIfDesktop);
  }, []);

  return (
    <header 
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 50,
        backgroundColor: 'rgba(15, 15, 28, 0.9)',
        backdropFilter: 'blur(8px)',
        padding: '1rem 0',
        borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
      }}
    >
      <div style={{ 
        maxWidth: '80rem', 
        margin: '0 auto', 
        padding: '0 1rem',
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center' 
      }}>
        <a href="/" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <img src={logo} alt="WhisprNet.ai Logo" style={{ height: '3.5rem' }} />
          <span style={{ 
            color: 'white', 
            fontWeight: 'bold', 
            fontSize: '1.25rem',
            display: 'block'
          }}>WhisprNet.ai</span>
        </a>
        
        <nav style={{ 
          display: isMenuOpen && !isDesktop ? 'flex' : 'none',
          flexDirection: 'column',
          position: 'absolute',
          top: '4rem',
          left: 0,
          right: 0,
          backgroundColor: 'rgba(15, 15, 28, 0.95)',
          padding: '1rem',
          alignItems: 'center',
          gap: '1rem',
          zIndex: 40
        }} className="mobile-nav">
          {['Features', 'How It Works', 'Integrations'].map((item, index) => (
            <a 
              key={item}
              href={`#${item.toLowerCase().replace(/\s+/g, '-')}`}
              style={{
                color: 'rgba(255, 255, 255, 0.8)',
                fontWeight: 500,
                margin: '0.5rem 0',
                textDecoration: 'none',
                transition: 'color 0.3s'
              }}
            >
              {item}
            </a>
          ))}
          <a 
            href="#waitlist" 
            style={{
              background: 'linear-gradient(to right, #4e42ec, #8f4ef2)',
              padding: '0.75rem 1.5rem',
              borderRadius: '0.375rem',
              color: 'white',
              fontWeight: 500,
              textDecoration: 'none'
            }}
          >
            Join the Waitlist
          </a>
        </nav>
        
        <div 
          style={{ 
            display: isDesktop ? 'flex' : 'none',
            alignItems: 'center',
            gap: '2rem'
          }} 
          className="desktop-nav"
        >
          {['Features', 'How It Works', 'Integrations'].map((item) => (
            <a 
              key={item}
              href={`#${item.toLowerCase().replace(/\s+/g, '-')}`}
              style={{
                color: 'rgba(255, 255, 255, 0.8)',
                fontWeight: 500,
                textDecoration: 'none',
                transition: 'color 0.3s'
              }}
              onMouseOver={(e) => e.target.style.color = 'white'}
              onMouseOut={(e) => e.target.style.color = 'rgba(255, 255, 255, 0.8)'}
            >
              {item}
            </a>
          ))}
          <a 
            href="#waitlist" 
            style={{
              background: 'linear-gradient(to right, #4e42ec, #8f4ef2)',
              padding: '0.75rem 1.5rem',
              borderRadius: '0.375rem',
              color: 'white',
              fontWeight: 500,
              textDecoration: 'none',
              transition: 'transform 0.3s, box-shadow 0.3s'
            }}
            onMouseOver={(e) => {
              e.target.style.transform = 'translateY(-2px)';
              e.target.style.boxShadow = '0 4px 12px rgba(143, 78, 242, 0.3)';
            }}
            onMouseOut={(e) => {
              e.target.style.transform = 'translateY(0)';
              e.target.style.boxShadow = 'none';
            }}
          >
            Join the Waitlist
          </a>
        </div>
        
        <button 
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          style={{ 
            display: isDesktop ? 'none' : 'block',
            color: 'white',
            background: 'none',
            border: 'none'
          }}
          className="mobile-menu-button"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ width: '1.5rem', height: '1.5rem' }}>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      </div>
    </header>
  );
} 