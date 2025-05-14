import React, { useState } from 'react';

const plans = [
  {
    name: 'Starter',
    price: {
      monthly: 49,
      yearly: 39
    },
    description: 'Perfect for small teams just getting started.',
    features: [
      'Up to 10 team members',
      'Slack integration',
      'Basic analytics dashboard',
      'Weekly reports',
      'Email support'
    ],
    cta: 'Start Free Trial',
    popular: false
  },
  {
    name: 'Business',
    price: {
      monthly: 99,
      yearly: 79
    },
    description: 'For growing teams that need more insights.',
    features: [
      'Up to 25 team members',
      'All Starter features',
      'GitHub & Jira integrations',
      'Burnout detection',
      'Team health metrics',
      'Priority support'
    ],
    cta: 'Start Free Trial',
    popular: true
  },
  {
    name: 'Enterprise',
    price: {
      monthly: 249,
      yearly: 199
    },
    description: 'Advanced features for large organizations.',
    features: [
      'Unlimited team members',
      'All Business features',
      'Custom integrations',
      'Advanced analytics',
      'Dedicated account manager',
      'SLA & priority support',
      'Team trainings'
    ],
    cta: 'Contact Sales',
    popular: false
  }
];

export default function PricingSection() {
  const [annual, setAnnual] = useState(true);

  const sectionStyle = {
    padding: '6rem 0',
    backgroundColor: 'rgba(15, 15, 28, 0.8)',
    position: 'relative'
  };

  const containerStyle = {
    maxWidth: '80rem',
    margin: '0 auto',
    padding: '0 1rem'
  };

  const headerStyle = {
    textAlign: 'center',
    marginBottom: '4rem'
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
    margin: '0 auto 2rem',
    color: '#d1d5db'
  };

  const toggleContainerStyle = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '1rem',
    marginBottom: '2rem'
  };

  const toggleTextStyle = {
    color: '#d1d5db',
    fontSize: '1rem',
    cursor: 'pointer',
    transition: 'color 0.3s'
  };

  const toggleActiveStyle = {
    ...toggleTextStyle,
    color: 'white',
    fontWeight: '500'
  };

  const toggleSwitchStyle = {
    position: 'relative',
    width: '3.5rem',
    height: '1.75rem',
    backgroundColor: 'rgba(78, 66, 236, 0.3)',
    borderRadius: '1rem',
    cursor: 'pointer',
    transition: 'background-color 0.3s'
  };

  const toggleKnobStyle = {
    position: 'absolute',
    top: '0.25rem',
    left: annual ? 'calc(100% - 1.5rem)' : '0.25rem',
    width: '1.25rem',
    height: '1.25rem',
    backgroundColor: '#4e42ec',
    borderRadius: '50%',
    transition: 'left 0.3s'
  };

  const discountStyle = {
    background: 'linear-gradient(to right, #4e42ec, #8f4ef2)',
    padding: '0.25rem 0.5rem',
    borderRadius: '1rem',
    fontSize: '0.75rem',
    color: 'white',
    marginLeft: '0.5rem'
  };

  const plansContainerStyle = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
    gap: '2rem'
  };

  return (
    <section id="pricing" style={sectionStyle}>
      <div style={containerStyle}>
        <div style={headerStyle}>
          <h2 style={titleStyle}>Transparent Pricing</h2>
          <p style={subtitleStyle}>
            Choose the plan that fits your team's needs. All plans start with a 14-day free trial.
          </p>

          <div style={toggleContainerStyle}>
            <span 
              style={annual ? toggleTextStyle : toggleActiveStyle}
              onClick={() => setAnnual(false)}
            >
              Monthly
            </span>
            
            <div 
              style={toggleSwitchStyle}
              onClick={() => setAnnual(!annual)}
            >
              <div style={toggleKnobStyle}></div>
            </div>
            
            <span 
              style={annual ? toggleActiveStyle : toggleTextStyle}
              onClick={() => setAnnual(true)}
            >
              Annual
              <span style={discountStyle}>Save 20%</span>
            </span>
          </div>
        </div>

        <div style={plansContainerStyle}>
          {plans.map((plan) => (
            <div 
              key={plan.name}
              style={{
                backgroundColor: 'rgba(15, 15, 28, 0.5)',
                borderRadius: '0.75rem',
                padding: '2rem',
                border: plan.popular 
                  ? '2px solid rgba(143, 78, 242, 0.5)' 
                  : '1px solid rgba(255, 255, 255, 0.1)',
                position: 'relative',
                transition: 'transform 0.3s, box-shadow 0.3s',
                boxShadow: plan.popular 
                  ? '0 10px 30px -5px rgba(143, 78, 242, 0.2)' 
                  : 'none'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.transform = 'translateY(-5px)';
                e.currentTarget.style.boxShadow = plan.popular 
                  ? '0 15px 35px -5px rgba(143, 78, 242, 0.3)'
                  : '0 10px 25px -5px rgba(0, 0, 0, 0.1)';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = plan.popular 
                  ? '0 10px 30px -5px rgba(143, 78, 242, 0.2)'
                  : 'none';
              }}
            >
              {plan.popular && (
                <div 
                  style={{
                    position: 'absolute',
                    top: '-12px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    background: 'linear-gradient(to right, #4e42ec, #8f4ef2)',
                    padding: '0.25rem 1rem',
                    borderRadius: '1rem',
                    fontSize: '0.75rem',
                    fontWeight: 'bold',
                    color: 'white'
                  }}
                >
                  Most Popular
                </div>
              )}
              
              <h3 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'white', marginBottom: '0.5rem' }}>
                {plan.name}
              </h3>
              
              <p style={{ color: '#d1d5db', marginBottom: '1.5rem' }}>
                {plan.description}
              </p>
              
              <div style={{ marginBottom: '1.5rem' }}>
                <span style={{ fontSize: '2.5rem', fontWeight: 'bold', color: 'white' }}>
                  ${annual ? plan.price.yearly : plan.price.monthly}
                </span>
                <span style={{ color: '#d1d5db' }}>
                  /month {annual && '(billed annually)'}
                </span>
              </div>
              
              <ul style={{ margin: '2rem 0', listStyleType: 'none', padding: 0 }}>
                {plan.features.map((feature, idx) => (
                  <li 
                    key={idx} 
                    style={{ 
                      marginBottom: '0.75rem', 
                      color: '#d1d5db',
                      display: 'flex',
                      alignItems: 'center' 
                    }}
                  >
                    <svg 
                      xmlns="http://www.w3.org/2000/svg" 
                      viewBox="0 0 20 20" 
                      fill="#4e42ec" 
                      style={{ width: '1rem', height: '1rem', marginRight: '0.5rem' }}
                    >
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    {feature}
                  </li>
                ))}
              </ul>
              
              <button 
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  borderRadius: '0.375rem',
                  fontWeight: '500',
                  cursor: 'pointer',
                  background: plan.popular 
                    ? 'linear-gradient(to right, #4e42ec, #8f4ef2)' 
                    : 'transparent',
                  border: plan.popular 
                    ? 'none' 
                    : '1px solid rgba(143, 78, 242, 0.5)',
                  color: 'white',
                  transition: 'transform 0.3s, box-shadow 0.3s'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.transform = 'scale(1.02)';
                  if (plan.popular) {
                    e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(143, 78, 242, 0.2)';
                  }
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.transform = 'scale(1)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                {plan.cta}
              </button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
} 