import React, { useState, useEffect } from 'react';

export default function HeroSection() {
  const [displayText, setDisplayText] = useState('');
  const [textIndex, setTextIndex] = useState(0);
  const [charIndex, setCharIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);
  const [typingSpeed, setTypingSpeed] = useState(50);
  
  const textOptions = [
    "Stay ahead of misalignment, burnout, and bottlenecks—before they hit.",
    "WhisprNet distills chaos into clarity so your team moves with precision.",
    "Turn hidden team signals into proactive, actionable intelligence.",
    "See what matters. Intervene early. Let your team thrive.",
    "WhisprNet turns Slack signals into strategic insights—automatically."
  ];
  
  // Typing effect
  useEffect(() => {
    const currentText = textOptions[textIndex];
    
    const typingEffect = () => {
      if (!isDeleting && charIndex < currentText.length) {
        // Typing forward
        setDisplayText(currentText.substring(0, charIndex + 1));
        setCharIndex(charIndex + 1);
        setTypingSpeed(50); // Normal typing speed
      } else if (!isDeleting && charIndex === currentText.length) {
        // Delay before starting to delete
        setTypingSpeed(2000); // Pause at the end
        setIsDeleting(true);
      } else if (isDeleting && charIndex > 0) {
        // Deleting
        setDisplayText(currentText.substring(0, charIndex - 1));
        setCharIndex(charIndex - 1);
        setTypingSpeed(30); // Faster when deleting
      } else if (isDeleting && charIndex === 0) {
        // Move to next text
        setIsDeleting(false);
        setTextIndex((textIndex + 1) % textOptions.length);
        setTypingSpeed(500); // Delay before starting next text
      }
    };
    
    const timer = setTimeout(typingEffect, typingSpeed);
    return () => clearTimeout(timer);
  }, [charIndex, isDeleting, textIndex, typingSpeed, textOptions]);

  const sectionStyle = {
    position: 'relative',
    minHeight: '90vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden'
  };

  const meshStyle = {
    position: 'absolute',
    inset: 0,
    zIndex: 0,
    opacity: 0.3
  };

  const blob1Style = {
    position: 'absolute',
    top: '25%',
    left: '25%',
    width: '50%',
    height: '50%',
    borderRadius: '50%',
    background: 'linear-gradient(to right, #4e42ec, #8f4ef2)',
    filter: 'blur(80px)'
  };

  const blob2Style = {
    position: 'absolute',
    top: '33%',
    right: '25%',
    width: '33%',
    height: '33%',
    borderRadius: '50%',
    background: '#9747ff',
    filter: 'blur(100px)'
  };

  const blob3Style = {
    position: 'absolute',
    bottom: '25%',
    left: '33%',
    width: '25%',
    height: '25%',
    borderRadius: '50%',
    background: '#4e42ec',
    filter: 'blur(70px)'
  };

  const contentStyle = {
    position: 'relative',
    zIndex: 10,
    textAlign: 'center',
    maxWidth: '80rem',
    margin: '0 auto',
    padding: '0 1rem'
  };

  const headlineStyle = {
    fontSize: 'clamp(2.5rem, 5vw, 4rem)',
    fontWeight: 'bold',
    marginBottom: '1.5rem',
    maxWidth: '56rem',
    marginLeft: 'auto',
    marginRight: 'auto',
    lineHeight: 1.2,
    color: 'white'
  };

  const subtextStyle = {
    fontSize: 'clamp(1.25rem, 2vw, 1.5rem)',
    maxWidth: '42rem',
    marginLeft: 'auto',
    marginRight: 'auto',
    marginBottom: '2.5rem',
    color: '#d1d5db',
    minHeight: '4.5rem', // Reserve space for the text to prevent layout shift
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  };

  const cursorStyle = {
    display: 'inline-block',
    width: '3px',
    height: '1.2em',
    backgroundColor: '#d1d5db',
    marginLeft: '3px',
    animation: 'blink 1s step-end infinite'
  };

  // Add cursor animation to document head
  useEffect(() => {
    const style = document.createElement('style');
    style.innerHTML = `
      @keyframes blink {
        from, to { opacity: 1; }
        50% { opacity: 0; }
      }
    `;
    document.head.appendChild(style);
    
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  const ctaButtonStyle = {
    background: 'linear-gradient(to right, #4e42ec, #8f4ef2)',
    padding: '0.75rem 1.5rem',
    borderRadius: '0.375rem',
    color: 'white',
    fontWeight: 500,
    fontSize: '1.125rem',
    textDecoration: 'none',
    display: 'inline-block',
    transition: 'transform 0.3s ease, box-shadow 0.3s ease'
  };

  return (
    <section style={sectionStyle}>
      {/* Static mesh background */}
      <div style={meshStyle}>
        <div style={blob1Style}></div>
        <div style={blob2Style}></div>
        <div style={blob3Style}></div>
      </div>

      <div style={contentStyle}>
        <div style={{
          fontSize: 'clamp(3rem, 6vw, 5rem)',
          fontWeight: 'bold',
          marginBottom: '2rem',
          color: 'white',
          lineHeight: 1.1
        }}>
          WhisprNet.ai
        </div>
        <h1 style={headlineStyle}>
          Your Team's Seventh Sense
        </h1>
        <div style={subtextStyle}>
          {displayText}
          <span style={cursorStyle}></span>
        </div>
        <a 
          href="#waitlist" 
          style={ctaButtonStyle}
          onMouseOver={(e) => {
            e.target.style.transform = 'scale(1.05)';
            e.target.style.boxShadow = '0 10px 15px -3px rgba(0, 0, 0, 0.2)';
          }}
          onMouseOut={(e) => {
            e.target.style.transform = 'scale(1)';
            e.target.style.boxShadow = 'none';
          }}
        >
          Join the Waitlist
        </a>
      </div>
    </section>
  );
} 