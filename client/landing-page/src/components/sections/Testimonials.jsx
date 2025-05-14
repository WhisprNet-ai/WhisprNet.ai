import React, { useState } from 'react';

const testimonials = [
  {
    quote: "WhisprNet has transformed how our engineering team collaborates. We caught burnout signs early and improved team communication patterns significantly.",
    author: "Sarah Chen",
    role: "CTO at TechForward",
    avatar: "SC" // In a real app, you'd use an actual image path
  },
  {
    quote: "The insights from WhisprNet helped us identify knowledge silos we didn't even know existed. Now our information flows properly across teams.",
    author: "Michael Rodriguez",
    role: "Engineering Manager at CloudScale",
    avatar: "MR"
  },
  {
    quote: "The way WhisprNet integrates with our existing tools made adoption seamless. We saw value within the first week of implementation.",
    author: "Priya Sharma",
    role: "VP of Engineering at DataFlow",
    avatar: "PS"
  }
];

export default function Testimonials() {
  const [activeIndex, setActiveIndex] = useState(0);

  const sectionStyle = {
    padding: '6rem 0',
    backgroundColor: 'rgba(15, 15, 28, 0.7)',
    position: 'relative',
    overflow: 'hidden'
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

  const testimonialContainerStyle = {
    maxWidth: '48rem',
    margin: '0 auto',
    position: 'relative'
  };

  const quoteStyle = {
    fontSize: 'clamp(1.25rem, 2vw, 1.5rem)',
    lineHeight: 1.5,
    textAlign: 'center',
    color: 'white',
    marginBottom: '2rem',
    position: 'relative',
    padding: '0 3rem'
  };

  const quotationMarkStyle = {
    fontSize: '5rem',
    position: 'absolute',
    color: 'rgba(143, 78, 242, 0.2)',
    fontFamily: 'Georgia, serif',
    height: '3rem',
    lineHeight: 1
  };

  const authorContainerStyle = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    marginBottom: '3rem'
  };

  const avatarStyle = {
    width: '4rem',
    height: '4rem',
    borderRadius: '50%',
    background: 'linear-gradient(to right, #4e42ec, #8f4ef2)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    color: 'white',
    fontWeight: 'bold',
    fontSize: '1.25rem',
    marginBottom: '1rem'
  };

  const authorNameStyle = {
    fontSize: '1.125rem',
    fontWeight: 'bold',
    color: 'white',
    marginBottom: '0.25rem'
  };

  const authorRoleStyle = {
    fontSize: '0.875rem',
    color: '#d1d5db'
  };

  const dotsContainerStyle = {
    display: 'flex',
    justifyContent: 'center',
    gap: '0.5rem'
  };

  const dotStyle = (isActive) => ({
    width: '0.75rem',
    height: '0.75rem',
    borderRadius: '50%',
    backgroundColor: isActive ? '#8f4ef2' : 'rgba(255, 255, 255, 0.2)',
    transition: 'background-color 0.3s',
    cursor: 'pointer'
  });

  const nextTestimonial = () => {
    setActiveIndex((prevIndex) => (prevIndex + 1) % testimonials.length);
  };

  const prevTestimonial = () => {
    setActiveIndex((prevIndex) => 
      prevIndex === 0 ? testimonials.length - 1 : prevIndex - 1
    );
  };

  return (
    <section id="testimonials" style={sectionStyle}>
      <div style={containerStyle}>
        <h2 style={titleStyle}>What Our Users Say</h2>
        <p style={subtitleStyle}>
          See how WhisprNet is transforming team collaboration across organizations.
        </p>

        <div style={testimonialContainerStyle}>
          <button 
            onClick={prevTestimonial}
            style={{
              position: 'absolute',
              top: '50%',
              left: '0',
              transform: 'translateY(-50%)',
              background: 'none',
              border: 'none',
              color: 'white',
              fontSize: '2rem',
              cursor: 'pointer',
              opacity: 0.7,
              transition: 'opacity 0.3s',
              zIndex: 10
            }}
            onMouseOver={(e) => e.currentTarget.style.opacity = 1}
            onMouseOut={(e) => e.currentTarget.style.opacity = 0.7}
          >
            ‹
          </button>

          <div>
            <div style={quoteStyle}>
              <span style={{...quotationMarkStyle, top: '-2rem', left: 0}}>"</span>
              {testimonials[activeIndex].quote}
              <span style={{...quotationMarkStyle, bottom: '-2rem', right: 0}}>"</span>
            </div>

            <div style={authorContainerStyle}>
              <div style={avatarStyle}>
                {testimonials[activeIndex].avatar}
              </div>
              <div style={authorNameStyle}>{testimonials[activeIndex].author}</div>
              <div style={authorRoleStyle}>{testimonials[activeIndex].role}</div>
            </div>

            <div style={dotsContainerStyle}>
              {testimonials.map((_, index) => (
                <button
                  key={index}
                  style={dotStyle(index === activeIndex)}
                  onClick={() => setActiveIndex(index)}
                  aria-label={`Go to testimonial ${index + 1}`}
                />
              ))}
            </div>
          </div>

          <button 
            onClick={nextTestimonial}
            style={{
              position: 'absolute',
              top: '50%',
              right: '0',
              transform: 'translateY(-50%)',
              background: 'none',
              border: 'none',
              color: 'white',
              fontSize: '2rem',
              cursor: 'pointer',
              opacity: 0.7,
              transition: 'opacity 0.3s',
              zIndex: 10
            }}
            onMouseOver={(e) => e.currentTarget.style.opacity = 1}
            onMouseOut={(e) => e.currentTarget.style.opacity = 0.7}
          >
            ›
          </button>
        </div>
      </div>
    </section>
  );
} 