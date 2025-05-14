import React from 'react';

export default function CustomerLogos() {
  // In a production app, you'd import actual logo SVGs/PNGs here
  const companies = [
    { name: 'Acme Corp', brandColor: '#FF5A5F' },
    { name: 'TechGiant', brandColor: '#0070E0' },
    { name: 'GlobalSoft', brandColor: '#34D399' },
    { name: 'InnoSystems', brandColor: '#8B5CF6' },
    { name: 'FutureWorks', brandColor: '#F97316' },
    { name: 'NexGen', brandColor: '#FBBF24' }
  ];

  const sectionStyle = {
    padding: '4rem 0',
    backgroundColor: 'rgba(15, 15, 28, 0.5)',
    borderTop: '1px solid rgba(255, 255, 255, 0.05)',
    borderBottom: '1px solid rgba(255, 255, 255, 0.05)'
  };

  const containerStyle = {
    maxWidth: '80rem',
    margin: '0 auto',
    padding: '0 1rem'
  };

  const titleStyle = {
    fontSize: '1.25rem',
    fontWeight: '500',
    textAlign: 'center',
    marginBottom: '3rem',
    color: 'rgba(255, 255, 255, 0.7)'
  };

  const logosContainerStyle = {
    display: 'flex',
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignItems: 'center',
    gap: '3rem'
  };

  return (
    <section style={sectionStyle}>
      <div style={containerStyle}>
        <h3 style={titleStyle}>Trusted by innovative teams worldwide</h3>
        
        <div style={logosContainerStyle}>
          {companies.map((company) => (
            <div 
              key={company.name} 
              style={{ 
                display: 'flex', 
                flexDirection: 'column',
                alignItems: 'center',
                opacity: 0.7,
                transition: 'opacity 0.3s, transform 0.3s',
                cursor: 'pointer'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.opacity = 1;
                e.currentTarget.style.transform = 'scale(1.05)';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.opacity = 0.7;
                e.currentTarget.style.transform = 'scale(1)';
              }}
            >
              {/* Logo placeholder */}
              <div 
                style={{
                  width: '3.5rem',
                  height: '3.5rem',
                  borderRadius: '0.5rem',
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  color: 'white',
                  fontWeight: 'bold',
                  marginBottom: '0.5rem',
                  background: company.brandColor,
                  boxShadow: `0 0 15px ${company.brandColor}40`
                }}
              >
                {company.name.substring(0, 2)}
              </div>
              <span style={{ color: 'white', fontSize: '0.875rem' }}>{company.name}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
} 