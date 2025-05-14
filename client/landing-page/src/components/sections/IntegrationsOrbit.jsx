import React, { useState, useEffect } from 'react';
import whisprNetLogo from '../../assets/images/WhisprNet.ai.png';

// Integration data with SVG logos
const integrations = [
  { 
    name: 'Slack', 
    logo: "https://www.svgrepo.com/show/303320/slack-new-logo-logo.svg"
  },
  { 
    name: 'Google', 
    logo: "https://www.svgrepo.com/show/223041/google.svg"
  },
  { 
    name: 'GitHub', 
    logo: "https://www.svgrepo.com/show/475654/github-color.svg"
  },
  { 
    name: 'Jira', 
    logo: "https://www.svgrepo.com/show/353935/jira.svg"
  },
  { 
    name: 'Asana', 
    logo: "https://logosandtypes.com/wp-content/uploads/2020/11/asana.svg"
  },
  { 
    name: 'Microsoft Teams', 
    logo: "https://www.svgrepo.com/show/452111/teams.svg"
  },
  { 
    name: 'Zoom', 
    logo: "https://www.svgrepo.com/show/349580/zoom.svg"
  },
  { 
    name: 'Trello', 
    logo: "https://www.svgrepo.com/show/475688/trello-color.svg"
  }
];

export default function IntegrationsOrbit() {
  const [hoveredIndex, setHoveredIndex] = useState(null);
  
  const sectionStyle = {
    padding: '6rem 0',
    backgroundColor: 'rgba(15, 15, 28, 0.6)',
    position: 'relative',
    overflow: 'hidden'
  };

  const containerStyle = {
    maxWidth: '80rem',
    margin: '0 auto',
    padding: '0 1rem',
    position: 'relative',
    zIndex: 1
  };

  const titleStyle = {
    fontSize: 'clamp(1.75rem, 3vw, 2.25rem)',
    fontWeight: 'bold',
    marginBottom: '1.5rem',
    textAlign: 'center',
    color: 'white'
  };

  const subtitleStyle = {
    fontSize: 'clamp(1rem, 2vw, 1.25rem)',
    maxWidth: '42rem',
    margin: '0 auto 4rem',
    textAlign: 'center',
    color: '#d1d5db'
  };

  const orbitContainerStyle = {
    position: 'relative',
    width: '100%',
    height: '400px',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center'
  };

  const centerLogoStyle = {
    width: '180px',
    height: '180px',
    backgroundColor: 'rgba(65, 60, 170, 0.9)',
    borderRadius: '50%',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    padding: '15px',
    boxShadow: '0 0 30px rgba(143, 78, 242, 0.5)',
    zIndex: 10,
    overflow: 'hidden'
  };

  const tooltipStyle = {
    position: 'absolute',
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    color: 'white',
    padding: '0.5rem 0.75rem',
    borderRadius: '0.25rem',
    fontSize: '0.875rem',
    whiteSpace: 'nowrap',
    zIndex: 20,
    transition: 'opacity 0.2s, transform 0.2s',
    opacity: 0,
    transform: 'translateY(10px)',
    pointerEvents: 'none'
  };

  // Create orbit animation
  React.useEffect(() => {
    const orbit = document.querySelector('.orbit');
    if (orbit) {
      orbit.style.animation = 'rotate 30s linear infinite';
    }

    // Add keyframe animation
    const style = document.createElement('style');
    style.textContent = `
      @keyframes rotate {
        from { transform: rotate(0deg); }
        to { transform: rotate(360deg); }
      }
      
      @keyframes counter-rotate {
        from { transform: rotate(360deg); }
        to { transform: rotate(0deg); }
      }
    `;
    document.head.appendChild(style);

    return () => {
      document.head.removeChild(style);
    };
  }, []);

  return (
    <section id="integrations" style={sectionStyle}>
      <div style={containerStyle}>
        <h2 style={titleStyle}>Seamless Integrations</h2>
        <p style={subtitleStyle}>
          WhisprNet connects with your favorite tools without disrupting your workflow, providing powerful insights across platforms.
        </p>

        <div style={orbitContainerStyle}>
          {/* Center WhisprNet logo */}
          <div style={centerLogoStyle}>
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              height: '100%'
            }}>
              <img 
                src={whisprNetLogo} 
                alt="WhisprNet logo" 
                style={{ 
                  width: '70%',
                  objectFit: 'contain',
                  marginBottom: '5px'
                }}
              />
              <span style={{
                color: 'white',
                fontWeight: 'bold',
                fontSize: '1.1rem',
                textAlign: 'center',
                marginTop: '-20px',
                transform: 'translateY(-5px)'
              }}>
                WhisprNet.ai
              </span>
            </div>
          </div>

          {/* Orbit path */}
          <div 
            className="orbit" 
            style={{
              position: 'absolute',
              width: '360px',
              height: '360px',
              borderRadius: '50%',
              border: '1px dashed rgba(255, 255, 255, 0.3)'
            }}
          >
            {/* Integration logos positioned around the orbit */}
            {integrations.map((integration, index) => {
              // Calculate position in the circle
              const angle = (index * 360) / integrations.length;
              const radians = (angle * Math.PI) / 180;
              const radius = 180;
              const left = Math.cos(radians) * radius + 180;
              const top = Math.sin(radians) * radius + 180;

              // Calculate tooltip position
              const isLeftSide = left < 180;
              const isTopSide = top < 180;
              const tooltipX = isLeftSide ? '-100%' : '100%';
              const tooltipY = isTopSide ? '-100%' : '100%';

              const isHovered = hoveredIndex === index;

              return (
                <div
                  key={integration.name}
                  style={{
                    position: 'absolute',
                    left: `${left - 35}px`,
                    top: `${top - 35}px`,
                    width: '70px',
                    height: '70px',
                    backgroundColor: '#2A2A3A',
                    borderRadius: '50%',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    padding: '0.75rem',
                    boxShadow: isHovered ? '0 0 20px rgba(78, 66, 236, 0.5)' : '0 0 15px rgba(0, 0, 0, 0.3)',
                    animation: 'counter-rotate 30s linear infinite',
                    zIndex: 5,
                    cursor: 'pointer',
                    transition: 'transform 0.3s, box-shadow 0.3s',
                    transform: isHovered ? 'scale(1.15)' : 'scale(1)'
                  }}
                  onMouseEnter={() => setHoveredIndex(index)}
                  onMouseLeave={() => setHoveredIndex(null)}
                >
                  {typeof integration.logo === 'string' ? (
                    <img 
                      src={integration.logo} 
                      alt={`${integration.name} logo`} 
                      style={{ 
                        width: '100%', 
                        height: '100%', 
                        filter: isHovered ? 'brightness(1.2)' : 'brightness(1)',
                        opacity: 1,
                        transition: 'filter 0.3s, transform 0.3s'
                      }}
                    />
                  ) : (
                    <div style={{ 
                      width: '100%', 
                      height: '100%', 
                      color: 'white',
                      filter: isHovered ? 'brightness(1.2)' : 'brightness(1)',
                      opacity: 1,
                      transition: 'filter 0.3s, transform 0.3s'
                    }}>
                      {integration.logo}
                    </div>
                  )}
                  
                  {/* Tooltip */}
                  <div
                    style={{
                      ...tooltipStyle,
                      transform: isHovered ? 'translateY(0)' : 'translateY(10px)',
                      opacity: isHovered ? 1 : 0,
                      left: isLeftSide ? '-15px' : '65px',
                      top: isTopSide ? '-15px' : '65px',
                      transformOrigin: `${isLeftSide ? 'right' : 'left'} ${isTopSide ? 'bottom' : 'top'}`
                    }}
                  >
                    {integration.name}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
} 