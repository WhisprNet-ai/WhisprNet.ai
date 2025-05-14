import React, { useState } from 'react';

const faqs = [
  {
    question: "How does WhisprNet detect team burnout?",
    answer: "WhisprNet analyzes communication patterns and metadata from Slack, GitHub, and other tools to identify signs of potential burnout. This includes changes in response times, communication frequency, working hours, and other team behavior metrics. We never analyze message content itself, only metadata."
  },
  {
    question: "Is WhisprNet secure and private?",
    answer: "Absolutely. WhisprNet is built with privacy at its core. We only analyze metadata, never message content. All data is encrypted both in transit and at rest, and we comply with GDPR, CCPA, and other privacy regulations. We also offer on-premise deployment options for enterprises with strict security requirements."
  },
  {
    question: "How long does it take to set up WhisprNet?",
    answer: "Most teams are up and running within 30 minutes. Our integrations with Slack, GitHub, and Jira are designed to be plug-and-play, requiring minimal configuration. Our customer success team provides full onboarding support to ensure a smooth setup process."
  },
  {
    question: "Do team members need to install anything?",
    answer: "No. WhisprNet works through authorized integrations with your existing tools. Team members don't need to install any software or change their workflow. The platform runs in the background, providing insights without disrupting your team's existing processes."
  },
  {
    question: "How is WhisprNet different from other analytics tools?",
    answer: "WhisprNet focuses specifically on team health and communication patterns rather than just productivity metrics. Our AI-powered insights are designed to improve team wellbeing, reduce burnout, and enhance collaboration, not just track output. We also emphasize privacy by only analyzing metadata."
  },
  {
    question: "Can I use WhisprNet with my existing team management tools?",
    answer: "Yes. WhisprNet is designed to complement your existing workflow. We integrate with popular tools like Slack, GitHub, Jira, Microsoft Teams, and more. If you use a tool that isn't currently supported, contact us about building a custom integration."
  }
];

export default function FaqSection() {
  const [openIndex, setOpenIndex] = useState(null);

  const toggleFaq = (index) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  const sectionStyle = {
    padding: '6rem 0',
    backgroundColor: 'rgba(15, 15, 28, 0.9)',
    position: 'relative'
  };

  const containerStyle = {
    maxWidth: '80rem',
    margin: '0 auto',
    padding: '0 1rem'
  };

  const headerStyle = {
    marginBottom: '4rem',
    textAlign: 'center'
  };

  const titleStyle = {
    fontSize: 'clamp(1.75rem, 3vw, 2.25rem)',
    fontWeight: 'bold',
    marginBottom: '1rem',
    color: 'white'
  };

  const subtitleStyle = {
    fontSize: 'clamp(1rem, 2vw, 1.25rem)',
    maxWidth: '42rem',
    margin: '0 auto',
    color: '#d1d5db'
  };

  const faqContainerStyle = {
    maxWidth: '48rem',
    margin: '0 auto'
  };

  const faqItemStyle = {
    borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
    marginBottom: '1rem'
  };

  const questionStyle = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '1rem 0',
    color: 'white',
    fontWeight: '500',
    fontSize: '1.125rem',
    cursor: 'pointer',
    transition: 'color 0.3s'
  };

  const answerStyle = (isOpen) => ({
    fontSize: '1rem',
    color: '#d1d5db',
    lineHeight: 1.6,
    paddingBottom: isOpen ? '1.5rem' : 0,
    maxHeight: isOpen ? '500px' : '0',
    overflow: 'hidden',
    transition: 'all 0.3s ease-in-out',
    opacity: isOpen ? 1 : 0
  });

  const iconStyle = (isOpen) => ({
    width: '1.5rem',
    height: '1.5rem',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    transition: 'transform 0.3s ease',
    transform: isOpen ? 'rotate(45deg)' : 'rotate(0)'
  });

  return (
    <section id="faq" style={sectionStyle}>
      <div style={containerStyle}>
        <div style={headerStyle}>
          <h2 style={titleStyle}>Frequently Asked Questions</h2>
          <p style={subtitleStyle}>
            Get answers to common questions about WhisprNet.
          </p>
        </div>

        <div style={faqContainerStyle}>
          {faqs.map((faq, index) => (
            <div key={index} style={faqItemStyle}>
              <div 
                style={questionStyle}
                onClick={() => toggleFaq(index)}
              >
                <span>{faq.question}</span>
                <span style={iconStyle(openIndex === index)}>+</span>
              </div>
              <div style={answerStyle(openIndex === index)}>
                {faq.answer}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
} 