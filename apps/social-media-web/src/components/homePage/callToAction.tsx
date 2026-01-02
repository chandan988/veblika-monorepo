"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import Container from "./container";

// Avatar data with fallback colors
const avatarData = [
  { seed: "alice", color: "bg-blue-400" },
  { seed: "bob", color: "bg-green-400" },
  { seed: "charlie", color: "bg-purple-400" },
  { seed: "diana", color: "bg-pink-400" },
  { seed: "eve", color: "bg-yellow-400" },
  { seed: "frank", color: "bg-indigo-400" },
  { seed: "grace", color: "bg-red-400" },
  { seed: "henry", color: "bg-teal-400" },
  { seed: "ivy", color: "bg-orange-400" },
  { seed: "jack", color: "bg-cyan-400" },
  { seed: "kate", color: "bg-rose-400" },
  { seed: "liam", color: "bg-violet-400" },
];

// Avatar positions (absolute positioning)
const avatarPositions = [
  { top: "5%", left: "2%", size: "w-10 h-10" },
  { top: "12%", left: "8%", size: "w-12 h-12" },
  { top: "25%", left: "3%", size: "w-8 h-8" },
  { top: "35%", left: "5%", size: "w-10 h-10" },
  { top: "60%", left: "4%", size: "w-9 h-9" },
  { top: "75%", left: "6%", size: "w-11 h-11" },
  { top: "8%", right: "5%", size: "w-9 h-9" },
  { top: "20%", right: "3%", size: "w-10 h-10" },
  { top: "40%", right: "8%", size: "w-12 h-12" },
  { top: "55%", right: "4%", size: "w-8 h-8" },
  { top: "70%", right: "6%", size: "w-10 h-10" },
  { top: "85%", right: "2%", size: "w-9 h-9" },
];

// Emoji positions
const emojiPositions = [
  { emoji: "👍", top: "15%", left: "12%", size: "text-3xl" },
  { emoji: "😁", top: "50%", left: "10%", size: "text-4xl" },
  { emoji: "😟", top: "18%", right: "10%", size: "text-3xl" },
  { emoji: "😍", top: "65%", right: "12%", size: "text-4xl" },
];

export default function CallToAction() {
  return (
    <div className="w-full bg-white py-20 lg:py-32 relative overflow-hidden">
      <Container>
        <div className="relative min-h-[400px] flex items-center justify-center">
          {/* Scattered Avatars */}
          {avatarData.map((avatarInfo, index) => {
            const position = avatarPositions[index % avatarPositions.length];
            const avatarUrl = `https://api.dicebear.com/7.x/avataaars/svg?seed=${avatarInfo.seed}`;
            return (
              <div
                key={index}
                className={`absolute ${position.size} ${position.top} ${position.left || position.right} z-10 hidden lg:block animate-bounce`}
                style={{
                  animationDuration: `${3 + (index % 3)}s`,
                  animationDelay: `${index * 0.2}s`,
                }}
              >
                <Avatar className={`${position.size} border-2 border-white shadow-md`}>
                  <AvatarImage 
                    src={avatarUrl} 
                    alt={`User ${index + 1}`}
                    onError={(e) => {
                      // Hide image on error, fallback will show
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                  <AvatarFallback className={`${avatarInfo.color} text-white font-semibold`}>
                    {String.fromCharCode(65 + index)}
                  </AvatarFallback>
                </Avatar>
              </div>
            );
          })}

          {/* Scattered Emojis */}
          {emojiPositions.map((emojiData, index) => (
            <div
              key={index}
              className={`absolute ${emojiData.size} ${emojiData.top} ${emojiData.left || emojiData.right} z-10 hidden lg:block animate-bounce`}
              style={{
                animationDuration: `${2 + (index % 2)}s`,
                animationDelay: `${index * 0.3}s`,
              }}
            >
              {emojiData.emoji}
            </div>
          ))}

          {/* Central Content */}
          <div className="relative z-20 text-center max-w-3xl mx-auto px-4">
            {/* Headline */}
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-[#1a365d] leading-tight mb-6">
              Grow your brand presence on social media.
            </h2>

            {/* Sub-headline with Badges */}
            <p className="text-lg md:text-xl text-gray-600 mb-8 text-center leading-relaxed">
              <span>Try Veblika free for </span>
              <Badge
                variant="secondary"
                className="bg-blue-100 text-blue-800 border border-blue-300 px-2.5 py-0.5 text-base font-medium rounded-md inline-flex items-center align-middle"
              >
                14 days
              </Badge>
              <span>. </span>
              <Badge
                variant="outline"
                className="border-gray-300 text-gray-700 bg-white px-2.5 py-0.5 text-base font-normal rounded-md inline-flex items-center align-middle"
              >
                No credit card required
              </Badge>
            </p>

            {/* CTA Button */}
            <Button
              size="lg"
              className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-6 text-lg font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all"
            >
              Sign Up for Free Trial
            </Button>
          </div>
        </div>
      </Container>

    </div>
  );
}

