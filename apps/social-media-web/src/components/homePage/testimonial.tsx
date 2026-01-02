"use client";

import React, { useRef, useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { ChevronLeft, ChevronRight, MessageCircle, Star } from "lucide-react";
import Container from "./container";

interface Testimonial {
  id: number;
  name: string;
  title: string;
  company: string;
  quote: string;
  avatar: string;
  rating: number;
}

const testimonials: Testimonial[] = [
  {
    id: 1,
    name: "Jaquon Hart",
    title: "Digital Marketing Executive",
    company: "Hypebeast",
    quote:
      "With Veblika, we're able to easily track our performance in full detail. It's become an essential tool for us to grow and engage with our audience.",
    avatar: "/avatars/user1.jpg",
    rating: 5,
  },
  {
    id: 2,
    name: "Jaquon Hart",
    title: "Digital Marketing Executive",
    company: "Hypebeast",
    quote:
      "With Veblika, we're able to easily track our performance in full detail. It's become an essential tool for us to grow and engage with our audience.",
    avatar: "/avatars/user1.jpg",
    rating: 5,
  },
  {
    id: 3,
    name: "Sarah Johnson",
    title: "Social Media Manager",
    company: "TechCorp",
    quote:
      "The analytics dashboard is incredibly intuitive. We've seen a 40% increase in engagement since using Veblika.",
    avatar: "/avatars/user2.jpg",
    rating: 5,
  },
  {
    id: 4,
    name: "Michael Chen",
    title: "Content Director",
    company: "Creative Agency",
    quote:
      "Scheduling posts across multiple platforms has never been easier. Veblika saves us hours every week.",
    avatar: "/avatars/user3.jpg",
    rating: 5,
  },
  {
    id: 5,
    name: "Emily Rodriguez",
    title: "Brand Manager",
    company: "Fashion Brand",
    quote:
      "The insights we get from Veblika help us make data-driven decisions. It's transformed our social media strategy.",
    avatar: "/avatars/user4.jpg",
    rating: 5,
  },
];

export default function Testimonial() {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [isPaused, setIsPaused] = useState(false);
  const animationRef = useRef<number | null>(null);

  // Duplicate testimonials for seamless infinite scroll
  const duplicatedTestimonials = [...testimonials, ...testimonials, ...testimonials];

  useEffect(() => {
    if (isPaused || !scrollContainerRef.current) return;

    const container = scrollContainerRef.current;
    const scrollSpeed = 0.5; // pixels per frame
    const oneSetWidth = container.scrollWidth / 3;

    const animate = () => {
      if (isPaused || !scrollContainerRef.current) return;

      const container = scrollContainerRef.current;
      const currentScroll = container.scrollLeft;
      
      // If we've scrolled past one set, reset to beginning seamlessly
      if (currentScroll >= oneSetWidth - 10) {
        container.scrollLeft = currentScroll - oneSetWidth;
      } else {
        container.scrollLeft = currentScroll + scrollSpeed;
      }

      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isPaused]);

  const handlePrev = () => {
    if (!scrollContainerRef.current) return;
    const container = scrollContainerRef.current;
    const cardWidth = container.offsetWidth / 2.5; // Show ~2.5 cards
    container.scrollBy({ left: -cardWidth, behavior: "smooth" });
  };

  const handleNext = () => {
    if (!scrollContainerRef.current) return;
    const container = scrollContainerRef.current;
    const cardWidth = container.offsetWidth / 2.5;
    container.scrollBy({ left: cardWidth, behavior: "smooth" });
  };

  return (
    <div className="w-full bg-white py-16">
      <Container>
        {/* Header */}
        <div className="flex items-center justify-between mb-12">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-green-500 flex items-center justify-center">
              <MessageCircle className="w-5 h-5 text-white" />
            </div>
            <h2 className="text-4xl lg:text-5xl font-bold text-[#1a365d]">
              Veblika is loved by users
            </h2>
          </div>

          {/* Navigation Arrows */}
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="icon"
              className="rounded-full w-10 h-10 bg-gray-100 hover:bg-gray-200 border-gray-200"
              onClick={handlePrev}
              onMouseEnter={() => setIsPaused(true)}
              onMouseLeave={() => setIsPaused(false)}
            >
              <ChevronLeft className="w-5 h-5 text-gray-600" />
            </Button>
            <Button
              variant="default"
              size="icon"
              className="rounded-full w-10 h-10 bg-[#1a365d] hover:bg-[#1a365d]/90 text-white"
              onClick={handleNext}
              onMouseEnter={() => setIsPaused(true)}
              onMouseLeave={() => setIsPaused(false)}
            >
              <ChevronRight className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* Carousel Container */}
        <div
          ref={scrollContainerRef}
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
          className="flex gap-6 overflow-x-hidden scrollbar-hide"
          style={{
            scrollBehavior: "auto",
          }}
        >
          {duplicatedTestimonials.map((testimonial, index) => (
            <Card
              key={`${testimonial.id}-${index}`}
              className="w-[400px] lg:w-[450px] flex-shrink-0 rounded-xl shadow-md border-gray-100 hover:shadow-lg transition-shadow"
            >
              <CardContent className="p-6">
                <div className="flex items-start gap-4 mb-4">
                  <Avatar className="w-12 h-12">
                    <AvatarImage
                      src={testimonial.avatar}
                      alt={testimonial.name}
                    />
                    <AvatarFallback className="bg-gray-200 text-gray-600">
                      {testimonial.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex gap-1">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star
                        key={i}
                        className="w-5 h-5 fill-yellow-400 text-yellow-400"
                      />
                    ))}
                  </div>
                </div>

                <p className="text-gray-700 text-base leading-relaxed mb-6">
                  {testimonial.quote}
                </p>

                <div>
                  <p className="font-semibold text-gray-900 text-base">
                    {testimonial.name}
                  </p>
                  <p className="text-sm text-gray-600">
                    {testimonial.title}, {testimonial.company}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </Container>

      <style jsx>{`
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </div>
  );
}

