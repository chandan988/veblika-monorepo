import React from 'react'
import Navbar from '@/components/homePage/navbar.jsx'
import Container from '@/components/homePage/container.tsx'
import HeroSection from '@/components/homePage/heroSection.tsx'
import Image from 'next/image'
import Feature from '@/components/homePage/feature.tsx'
import Testimonial from '@/components/homePage/testimonial.tsx'
import Footer from '@/components/homePage/footer.tsx'
import CallToAction from '@/components/homePage/callToAction.tsx'
const Home = () => {
  return (
    <>
      
      <HeroSection />
      <Feature />
      <Testimonial />
      {/* <CallToAction /> */}
      <Footer />
     

    </>
   
  )
}

export default Home