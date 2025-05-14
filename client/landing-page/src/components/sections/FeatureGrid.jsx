import React from 'react';

// Feature data
const features = [
  {
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ width: '2rem', height: '2rem' }}>
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 16l4-4 4 4m0 0l-4-4-4 4" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M22 12c0 5.523-4.477 10-10 10S2 17.523 2 12 6.477 2 12 2s10 4.477 10 10z" />
      </svg>
    ),
    title: "Communication Analytics",
    description: "Monitor team conversations across platforms to identify knowledge gaps and improve information flow."
  },
  {
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ width: '2rem', height: '2rem' }}>
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    ),
    title: "Burnout Detection",
    description: "Identify signs of team burnout before it affects productivity with early warning indicators."
  },
  {
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ width: '2rem', height: '2rem' }}>
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 4a2 2 0 114 0v1a1 1 0 001 1h3a1 1 0 011 1v3a1 1 0 01-1 1h-1a2 2 0 100 4h1a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-1a2 2 0 10-4 0v1a1 1 0 01-1 1H7a1 1 0 01-1-1v-3a1 1 0 00-1-1H4a2 2 0 110-4h1a1 1 0 001-1V7a1 1 0 011-1h3a1 1 0 001-1V4z" />
      </svg>
    ),
    title: "Tool-Agnostic Integration",
    description: "Connect with Slack, GitHub, Jira, and more without disrupting your team's workflow."
  },
  {
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ width: '2rem', height: '2rem' }}>
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
      </svg>
    ),
    title: "Smart Slack Nudges",
    description: "Receive timely, contextual suggestions to improve team communication patterns."
  },
  {
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ width: '2rem', height: '2rem' }}>
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ),
    title: "Weekly Behavioral Trends",
    description: "Track team dynamics and collaboration patterns over time with visual reports."
  },
  {
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ width: '2rem', height: '2rem' }}>
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
      </svg>
    ),
    title: "Privacy-First by Design",
    description: "Only analyze metadata, never message content, ensuring team privacy and security."
  },
];

export default function FeatureGrid() {
  const sectionStyle = {
    padding: '5rem 0',
    background: 'linear-gradient(to bottom, #0f0f1c, rgba(15, 15, 28, 0.95))'
  };

  const containerStyle = {
    maxWidth: '80rem',
    margin: '0 auto',
    padding: '0 1rem'
  };

  const titleStyle = {
    fontSize: 'clamp(1.75rem, 3vw, 2.25rem)',
    fontWeight: 'bold',
    marginBottom: '4rem',
    textAlign: 'center',
    color: 'white'
  };

  const gridStyle = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
    gap: '2rem'
  };

  const featureCardStyle = {
    backgroundColor: 'rgba(15, 15, 28, 0.4)',
    backdropFilter: 'blur(4px)',
    padding: '1.5rem',
    borderRadius: '0.75rem',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    transition: 'all 0.3s',
  };

  const iconStyle = {
    color: '#9747ff',
    marginBottom: '1rem'
  };

  const featureTitleStyle = {
    fontSize: '1.25rem',
    fontWeight: 'bold',
    marginBottom: '0.75rem',
    color: 'white'
  };

  const featureDescStyle = {
    color: 'rgba(209, 213, 219, 0.9)'
  };

  return (
    <section id="features" style={sectionStyle}>
      <div style={containerStyle}>
        <h2 style={titleStyle}>
          Key Features
        </h2>

        <div style={gridStyle}>
          {features.map((feature, index) => (
            <div
              key={index}
              style={featureCardStyle}
              onMouseOver={(e) => {
                e.currentTarget.style.borderColor = 'rgba(151, 71, 255, 0.3)';
                e.currentTarget.style.boxShadow = '0 10px 25px -5px rgba(0, 0, 0, 0.1)';
                const iconElement = e.currentTarget.querySelector('.feature-icon');
                if (iconElement) {
                  iconElement.style.transform = 'scale(1.1)';
                }
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                e.currentTarget.style.boxShadow = 'none';
                const iconElement = e.currentTarget.querySelector('.feature-icon');
                if (iconElement) {
                  iconElement.style.transform = 'scale(1)';
                }
              }}
            >
              <div className="feature-icon" style={{...iconStyle, transition: 'transform 0.3s'}}>
                {feature.icon}
              </div>
              <h3 style={featureTitleStyle}>{feature.title}</h3>
              <p style={featureDescStyle}>{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
} 