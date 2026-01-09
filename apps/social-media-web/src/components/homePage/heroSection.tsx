import React from 'react'
import Navbar from './navbar'
import Container from './container'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import Image from 'next/image'

export default function HeroSection() {
    return (
      <>
        {/* Section wrapper with fullscreen background */}
        <div className="relative w-full min-h-screen overflow-hidden">
  
          {/* Background Image */}
          <div
            className="absolute inset-0 bg-cover bg-center bg-no-repeat"
            style={{ backgroundImage: "url('/backgroundImg.png')" }}
          />
  
          {/* Foreground content */}
          <Container className="relative h-full z-10">
            <Navbar />
            <div className="flex flex-col items-center justify-center h-full pt-20">
              <h1 className="text-black text-5xl leading-tight font-bold text-center">
                Track your <br /> Social Media Performance
              </h1>
  
              <p className="text-lg text-center max-w-3xl my-4 text-[#5A7184]">
                Veblika is the overall social media analytics platform teams use to stay focused on
                <br /> the goals, track engagement for report your business.
              </p>
  
              <Button className="mt-4 bg-slate-700 py-7 px-8 text-lg">
                Get 14-day Free Trial
              </Button>
            </div>
          </Container>
        </div>
  
        {/* Put hero image OUTSIDE fullscreen container */}
        <div className="flex justify-center w-full mt-[-275px] "> 
          <Image
            src="/hero.png"
            alt="hero-section"
            width={1080}
            height={600}
            className="z-20 over shadow-md"
          />
        </div>
      </>
    );
  }
  