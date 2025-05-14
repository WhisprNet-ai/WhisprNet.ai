import { useEffect } from 'react'
import Header from './components/layout/Header'
import HeroSection from './components/sections/HeroSection'
import ProductPreview from './components/sections/ProductPreview'
import FeatureGrid from './components/sections/FeatureGrid'
import IntegrationsOrbit from './components/sections/IntegrationsOrbit'
import PricingSection from './components/sections/PricingSection'
import CustomerLogos from './components/sections/CustomerLogos'
import Testimonials from './components/sections/Testimonials'
import FaqSection from './components/sections/FaqSection'
import WaitlistFooter from './components/sections/WaitlistFooter'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

// Register plugins at app level
gsap.registerPlugin(ScrollTrigger)

function App() {
  useEffect(() => {
    console.log('App component mounted');
  }, []);

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#0f0f1c',
      color: '#d1d5db',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif'
    }}>
      <Header />
      <main>
        <HeroSection />
        <ProductPreview />
        <FeatureGrid />
        <IntegrationsOrbit />
        <CustomerLogos />
        <Testimonials />
        <PricingSection />
        <FaqSection />
      </main>
      <WaitlistFooter />
    </div>
  )
}

export default App
