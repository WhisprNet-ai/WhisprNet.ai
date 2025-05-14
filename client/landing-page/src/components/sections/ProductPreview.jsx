import React, { useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

// Ensure ScrollTrigger is registered
gsap.registerPlugin(ScrollTrigger);

export default function ProductPreview() {
  // Dashboard widget data with tooltips
  const widgets = [
    { 
      title: "Slack Activity", 
      type: "bar-chart",
      tooltip: "Track async message volume across channels"
    },
    { 
      title: "GitHub Commits", 
      type: "heatmap",
      tooltip: "Surface code push patterns"
    },
    { 
      title: "Jira Status", 
      type: "progress",
      tooltip: "Monitor ticket activity and delays"
    },
    { 
      title: "Team Burnout Risk", 
      type: "donut",
      tooltip: "Estimate fatigue levels using messaging + work hours"
    },
    { 
      title: "Weekly Trends", 
      type: "line-chart",
      tooltip: "See team performance variations"
    },
    { 
      title: "Risk Alerts", 
      type: "alerts",
      tooltip: "Flag communication red flags early"
    }
  ];

  const sectionRef = useRef(null);
  const mockupRef = useRef(null);
  const donutRef = useRef(null);
  const [hoveredWidget, setHoveredWidget] = useState(null);

  useEffect(() => {
    // Scroll animation for the entire section
    const contentContainer = sectionRef.current.querySelector('.content-container');
    if (contentContainer) {
      gsap.fromTo(contentContainer,
        { 
          opacity: 0,
          y: 50
        },
        { 
          opacity: 1,
          y: 0,
          duration: 0.8,
          ease: "power2.out",
          scrollTrigger: {
            trigger: sectionRef.current,
            start: "top 80%",
            end: "top 50%",
            toggleActions: "play none none none"
          }
        }
      );
    }

    // Glow effect for dashboard
    if (mockupRef.current) {
      gsap.to(mockupRef.current, {
        boxShadow: "0 0 30px rgba(127, 82, 255, 0.15), inset 0 0 20px rgba(127, 82, 255, 0.1)",
        duration: 1.5,
        scrollTrigger: {
          trigger: mockupRef.current,
          start: "top 70%",
          toggleActions: "play none none none"
        }
      });
    }

    // Animate the donut chart from 0% to 23%
    if (donutRef.current) {
      gsap.fromTo(donutRef.current,
        { 
          "--percentage": 0 
        },
        { 
          "--percentage": 23,
          duration: 1.5,
          delay: 0.3,
          ease: "power2.out",
          scrollTrigger: {
            trigger: donutRef.current,
            start: "top 70%",
            toggleActions: "play none none none"
          }
        }
      );
    }

    // Blinking dot animation for Risk Alerts
    const blinkingDot = document.querySelector('.blinking-dot');
    if (blinkingDot) {
      gsap.to(blinkingDot, {
        opacity: 0.3,
        duration: 0.8,
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut"
      });
    }

    return () => {
      // Clean up ScrollTrigger instances
      ScrollTrigger.getAll().forEach(trigger => trigger.kill());
    };
  }, []);

  // Animation styles for each chart type
  const getHoverStyles = (index) => {
    const isHovered = hoveredWidget === index;
    
    return {
      transform: isHovered ? 'scale(1.05)' : 'scale(1)',
      transition: 'all 0.3s ease-in-out',
      filter: isHovered ? 'drop-shadow(0 0 6px rgba(127, 82, 255, 0.5))' : 'none'
    };
  };

  // Chart components with animations
  const BarChart = ({index}) => {
    const hoverStyles = getHoverStyles(index);
    const barValues = [15, 35, 50, 30];
    const barColors = [
      'rgba(127, 82, 255, 0.5)', 
      'rgba(127, 82, 255, 0.7)', 
      'rgba(127, 82, 255, 0.9)',
      'rgba(127, 82, 255, 0.6)'
    ];
    
    return (
      <svg width="85" height="70" viewBox="0 0 100 80" style={hoverStyles}>
        {barValues.map((height, i) => {
          const x = 15 + (i * 20);
          const y = 70 - height;
          const barHeight = height;
          return (
            <rect 
              key={i}
              x={x} 
              y={y} 
              width="12" 
              height={barHeight} 
              fill={barColors[i]} 
              rx="2"
              style={{
                transition: 'height 0.3s ease-in-out, y 0.3s ease-in-out',
                height: hoveredWidget === index ? barHeight + 5 : barHeight,
                y: hoveredWidget === index ? y - 5 : y
              }}
            />
          );
        })}
      </svg>
    );
  };

  const Heatmap = ({index}) => {
    const hoverStyles = getHoverStyles(index);
    const cellSize = 10;
    const startX = 10;
    const startY = 10;
    const cells = [];
    
    for (let row = 0; row < 4; row++) {
      for (let col = 0; col < 6; col++) {
        const opacity = Math.random() * 0.8 + 0.1;
        cells.push({
          x: startX + (col * (cellSize + 5)),
          y: startY + (row * (cellSize + 5)),
          opacity
        });
      }
    }
    
    return (
      <svg width="85" height="70" viewBox="0 0 100 80" style={hoverStyles}>
        {cells.map((cell, i) => (
          <rect 
            key={i}
            x={cell.x} 
            y={cell.y} 
            width={cellSize} 
            height={cellSize} 
            fill={`rgba(127, 82, 255, ${hoveredWidget === index ? cell.opacity + 0.1 : cell.opacity})`} 
            rx="1"
            style={{
              transition: 'all 0.3s ease'
            }}
          />
        ))}
      </svg>
    );
  };

  const Progress = ({index}) => {
    const hoverStyles = getHoverStyles(index);
    const bars = [
      { width: 65, y: 20 },
      { width: 40, y: 35 },
      { width: 75, y: 50 }
    ];
    
    return (
      <svg width="85" height="70" viewBox="0 0 100 80" style={hoverStyles}>
        {bars.map((bar, i) => {
          const animatedWidth = hoveredWidget === index ? bar.width + 5 : bar.width;
          return (
            <g key={i}>
              <rect x="10" y={bar.y} width="80" height="6" fill="rgba(127, 82, 255, 0.2)" rx="3" />
              <rect 
                x="10" 
                y={bar.y} 
                width={animatedWidth} 
                height="6" 
                fill="rgba(127, 82, 255, 0.8)" 
                rx="3"
                style={{
                  transition: 'width 0.3s ease-in-out'
                }}
              />
            </g>
          );
        })}
      </svg>
    );
  };

  const DonutChart = ({index}) => {
    const hoverStyles = getHoverStyles(index);
    const isHovered = hoveredWidget === index;
    const percentage = 23;
    const radius = 30;
    const strokeWidth = 8;
    const normalizedRadius = radius - strokeWidth / 2;
    const circumference = normalizedRadius * 2 * Math.PI;
    const strokeDashoffset = circumference - (percentage / 100) * circumference;
    
    return (
      <div style={{
        ...hoverStyles,
        position: 'relative', 
        width: '6rem', 
        height: '6rem'
      }}>
        <svg 
          width="100%"
          height="100%"
          viewBox="0 0 100 100"
        >
          <circle
            cx="50"
            cy="50"
            r={normalizedRadius}
            fill="transparent"
            stroke="rgba(151, 71, 255, 0.2)"
            strokeWidth={strokeWidth}
          />
          <circle
            cx="50"
            cy="50"
            r={normalizedRadius}
            fill="transparent"
            stroke="rgba(151, 71, 255, 0.8)"
            strokeWidth={strokeWidth}
            strokeDasharray={circumference + ' ' + circumference}
            strokeDashoffset={isHovered ? strokeDashoffset - 5 : strokeDashoffset}
            style={{
              transition: 'stroke-dashoffset 0.3s ease-in-out'
            }}
            transform="rotate(-90 50 50)"
          />
        </svg>
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          fontSize: isHovered ? '1.35rem' : '1.25rem',
          fontWeight: 'bold',
          color: 'white',
          transition: 'font-size 0.3s ease'
        }}>
          {percentage}%
        </div>
      </div>
    );
  };

  const LineChart = ({index}) => {
    const hoverStyles = getHoverStyles(index);
    const points = [
      { x: 10, y: 50 },
      { x: 25, y: 30 },
      { x: 40, y: 45 },
      { x: 55, y: 20 },
      { x: 70, y: 35 },
      { x: 90, y: 15 }
    ];
    
    const pointsString = points.map(p => `${p.x},${p.y}`).join(' ');
    
    return (
      <svg width="85" height="70" viewBox="0 0 100 80" style={hoverStyles}>
        <polyline
          points={pointsString}
          fill="none"
          stroke="rgba(127, 82, 255, 0.8)"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {points.map((point, i) => (
          <circle 
            key={i}
            cx={point.x} 
            cy={point.y} 
            r={hoveredWidget === index ? 4 : 3} 
            fill="rgba(127, 82, 255, 0.8)"
            style={{
              transition: 'r 0.3s ease'
            }}
          />
        ))}
      </svg>
    );
  };

  const Alerts = ({index}) => {
    const hoverStyles = getHoverStyles(index);
    const isHovered = hoveredWidget === index;
    
    return (
      <div style={{position: 'relative', width: '85px', height: '70px'}}>
        <div 
          style={{
            position: 'absolute',
            top: '3px',
            right: '3px',
            width: isHovered ? '6px' : '4px',
            height: isHovered ? '6px' : '4px',
            borderRadius: '50%',
            backgroundColor: 'rgba(255, 82, 127, 0.9)',
            transition: 'all 0.3s ease',
            animation: 'pulse 1.5s infinite'
          }}
        />
        <svg width="85" height="70" viewBox="0 0 100 80" style={hoverStyles}>
          <style>
            {`
              @keyframes pulse {
                0% { opacity: 0.5; }
                50% { opacity: 1; }
                100% { opacity: 0.5; }
              }
            `}
          </style>
          <rect x="10" y="15" width="80" height="8" fill="rgba(127, 82, 255, 0.4)" rx="2" />
          <rect x="10" y="30" width="80" height="8" fill="rgba(127, 82, 255, 0.3)" rx="2" />
          <rect 
            x="10" 
            y="45" 
            width="80" 
            height="8" 
            fill={isHovered ? "rgba(255, 82, 127, 0.7)" : "rgba(255, 82, 127, 0.5)"} 
            rx="2"
            style={{
              transition: 'fill 0.3s ease'
            }}
          />
          <rect x="10" y="60" width="80" height="8" fill="rgba(127, 82, 255, 0.2)" rx="2" />
        </svg>
      </div>
    );
  };

  const sectionStyle = {
    padding: '5rem 0',
    backgroundColor: 'rgba(15, 15, 28, 0.8)'
  };

  const containerStyle = {
    maxWidth: '80rem',
    margin: '0 auto',
    padding: '0 1rem'
  };

  const titleStyle = { 
    fontSize: 'clamp(1.75rem, 3vw, 2.25rem)', 
    fontWeight: 'bold', 
    marginBottom: '1rem',
    color: 'white',
    textAlign: 'center'
  };

  const descriptionStyle = { 
    fontSize: 'clamp(1rem, 2vw, 1.25rem)', 
    maxWidth: '42rem', 
    margin: '0 auto 3rem',
    color: '#d1d5db',
    textAlign: 'center'
  };

  const mockupContainerStyle = {
    maxWidth: '1200px',
    margin: '0 auto',
    background: 'rgba(15, 15, 28, 0.4)',
    padding: '1.5rem',
    borderRadius: '0.75rem',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    backdropFilter: 'blur(8px)',
    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
  };

  const dashboardHeaderStyle = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '0.75rem',
    borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
    marginBottom: '1rem'
  };

  const widgetsContainerStyle = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
    gap: '1rem',
    padding: '1rem'
  };

  const widgetStyle = {
    backgroundColor: 'rgba(15, 15, 28, 0.7)',
    padding: '1rem',
    borderRadius: '0.5rem',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    transition: 'all 0.3s ease',
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
  };

  const widgetContentStyle = { 
    backgroundColor: 'rgba(78, 66, 236, 0.1)', 
    height: '8rem', 
    borderRadius: '0.375rem',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden'
  };

  const renderChart = (type, index) => {
    switch(type) {
      case 'bar-chart':
        return <BarChart index={index} />;
      case 'heatmap':
        return <Heatmap index={index} />;
      case 'progress':
        return <Progress index={index} />;
      case 'donut':
        return <DonutChart index={index} />;
      case 'line-chart':
        return <LineChart index={index} />;
      case 'alerts':
        return <Alerts index={index} />;
      default:
        return <div style={{ color: 'rgba(255, 255, 255, 0.3)', fontSize: '0.875rem' }}>{type}</div>;
    }
  };

  return (
    <section 
      id="how-it-works" 
      ref={sectionRef}
      style={sectionStyle}
    >
      <div className="content-container" style={containerStyle}>
        <div>
          <h2 style={titleStyle}>
            Live Signals from Your Workflow
          </h2>
          <p style={descriptionStyle}>
            Preview how WhisprNet overlays insights on top of Slack, GitHub, and Jira.
          </p>
        </div>

        <div 
          ref={mockupRef}
          style={mockupContainerStyle}
        >
          {/* Dashboard mockup */}
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {/* Header with control buttons */}
            <div style={dashboardHeaderStyle}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{ width: '0.75rem', height: '0.75rem', borderRadius: '50%', backgroundColor: '#f87171' }}></div>
                <div style={{ width: '0.75rem', height: '0.75rem', borderRadius: '50%', backgroundColor: '#fbbf24' }}></div>
                <div style={{ width: '0.75rem', height: '0.75rem', borderRadius: '50%', backgroundColor: '#34d399' }}></div>
              </div>
              <div style={{ color: 'rgba(255, 255, 255, 0.8)' }}>WhisprNet Dashboard</div>
              <div style={{ color: 'rgba(255, 255, 255, 0.5)' }}>v1.0</div>
            </div>

            {/* Dashboard widgets */}
            <div style={widgetsContainerStyle}>
              {widgets.map((widget, index) => (
                <div 
                  key={index}
                  style={{
                    ...widgetStyle,
                    transform: hoveredWidget === index ? 'translateY(-5px)' : 'translateY(0)',
                    boxShadow: hoveredWidget === index ? 
                      '0 10px 15px -3px rgba(0, 0, 0, 0.2), 0 0 10px rgba(127, 82, 255, 0.15)' : 
                      '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                    transition: 'all 0.3s ease'
                  }}
                  onMouseEnter={() => setHoveredWidget(index)}
                  onMouseLeave={() => setHoveredWidget(null)}
                >
                  <h4 style={{ color: 'rgba(255, 255, 255, 0.9)', fontWeight: '500', marginBottom: '0.5rem' }}>
                    {widget.title}
                  </h4>
                  <div style={widgetContentStyle}>
                    {renderChart(widget.type, index)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}