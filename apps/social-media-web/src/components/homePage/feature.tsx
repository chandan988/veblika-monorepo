"use client";

import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { Lightbulb, Eye, Check, Plus, Star } from "lucide-react";
import Container from "./container";

// Sample data for the impressions and reach chart
const chartData = [
  { name: "Week 1", impressions: 800, reach: 4000 },
  { name: "Week 2", impressions: 2000, reach: 600 },
  { name: "Week 3", impressions: 1500, reach: 3500 },
  { name: "Week 4", impressions: 4200, reach: 4500 },
  { name: "Week 5", impressions: 4500, reach: 2000 },
];

// Sample scheduled posts data
const scheduledPosts = [
  { day: "MON", time: "1pm", color: "bg-yellow-300", type: "image" },
  { day: "MON", time: "3pm", color: "bg-blue-400", type: "pattern" },
  { day: "MON", time: "4pm", color: "bg-pink-400", type: "pattern" },
  { day: "TUE", time: "1pm", color: "bg-orange-400", type: "image" },
  { day: "TUE", time: "3pm", color: "bg-blue-400", type: "text", text: "Stories" },
  { day: "WED", time: "2pm", color: "bg-yellow-300", type: "banana" },
  { day: "WED", time: "3pm", color: "bg-red-400", type: "image" },
  { day: "THU", time: "1pm", color: "bg-pink-400", type: "textured" },
  { day: "THU", time: "3pm", color: "bg-green-400", type: "pattern" },
  { day: "FRI", time: "2pm", color: "bg-yellow-300", type: "image" },
  { day: "FRI", time: "4pm", color: "bg-yellow-300", type: "star" },
];

const days = ["MON", "TUE", "WED", "THU", "FRI"];
const times = ["1pm", "2pm", "3pm", "4pm", "5pm"];

export default function Feature() {
  // Helper function to get post at specific day and time
  const getPostAt = (day: string, time: string) => {
    return scheduledPosts.find((post) => post.day === day && post.time === time);
  };

  return (
    <div className="w-full bg-white py-16">
      <Container>
        {/* Top Section: Measure Impressions and Reach Post */}
        <div className="mb-24 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Left side: Text content */}
          <div className="space-y-6">
            <h2 className="text-4xl lg:text-5xl font-bold text-[#1a365d] leading-tight">
              Measure Impressions and Reach Post
            </h2>
            <p className="text-lg text-gray-600 leading-relaxed">
              Graphs displaying your performance for metrics like follower
              evolution, average engagement rate per post and reach and
              impressions to give you the insights.
            </p>
            <a
              href="#"
              className="inline-block text-blue-600 hover:text-blue-700 font-medium text-lg"
            >
              Learn More →
            </a>
          </div>

          {/* Right side: Chart card */}
          <div className="relative">
            <Card className="w-full h-full bg-black-600">
             <Image src="/Graph-1.png" alt="Graph-1" width={1000} height={1000} />
            </Card>
          </div>
        </div>

        {/* Bottom Section: Schedule Your Post Whenever You Want */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Left side: Calendar grid */}
          <div className="relative">
            <Card className="rounded-2xl shadow-lg overflow-hidden">
              <Image src="/Graph-2.png" alt="Graph-2" width={1000} height={1000} />
            </Card>
          </div>

          {/* Right side: Text content */}
          <div className="space-y-6">
            <h2 className="text-4xl lg:text-5xl font-bold text-[#1a365d] leading-tight">
              Schedule Your Post Whenever You Want
            </h2>
            <p className="text-lg text-gray-600 leading-relaxed">
              Publish your content automatically. Built-in features, such as Best
              Time to Post, Geolocation, User Tag, and more, ensure that your
              content reaches the right people.
            </p>
            <div className="flex items-start gap-3">
              <Check className="w-5 h-5 text-gray-500 mt-1 flex-shrink-0" />
              <p className="text-sm text-gray-600">
                Data about audience can be accessed on Ehya Apps. You can
                download Ehya apps on Google Play & App Store.
              </p>
            </div>
          </div>
        </div>
      </Container>
    </div>
  );
}
