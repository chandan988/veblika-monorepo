"use client";

import React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import Container from "./container";
import Image from "next/image";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChevronDown } from "lucide-react";

export default function Navbar() {
  return (
    <header className="z-10 w-full bg-transparent">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <div className="flex items-center gap-1">
            <img
              src={
                "https://cloudmediastorage.s3.ap-south-1.amazonaws.com/white-label/logo/veblika.com/e745e554-ebb2-44d5-979e-7ceb20f6918e-favicon2.png"
              }
              className="h-8 w-8"
            />
            </div>
            <span className="text-black-600 font-medium text-2xl">Veblika</span>
          </Link>

          <div className="flex items-center gap-12">
          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-12 text-lg">
            <Link
              href="/"
              className="text-black-400 hover:text-black-300 transition-colors font-medium"
            >
              Home
            </Link>

            {/* Features Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger className="text-black-500 hover:text-black-300 transition-colors text-lg font-medium flex items-center gap-1 outline-none">
                Features
                <ChevronDown className="h-3 w-3" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="bg-gray-900 border-gray-700">
                <DropdownMenuItem className="text-gray-300 hover:bg-gray-800">
                  Feature 1
                </DropdownMenuItem>
                <DropdownMenuItem className="text-gray-300 hover:bg-gray-800">
                  Feature 2
                </DropdownMenuItem>
                <DropdownMenuItem className="text-gray-300 hover:bg-gray-800">
                  Feature 3
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Pages Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger className="text-black-600 hover:text-black-300 transition-colors text-lg font-medium flex items-center gap-1 outline-none">
                Pages
                <ChevronDown className="h-3 w-3" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="bg-gray-900 border-gray-700">
                <DropdownMenuItem className="text-gray-300 hover:bg-gray-800">
                  Page 1
                </DropdownMenuItem>
                <DropdownMenuItem className="text-gray-300 hover:bg-gray-800">
                  Page 2
                </DropdownMenuItem>
                <DropdownMenuItem className="text-gray-300 hover:bg-gray-800">
                  Page 3
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <Link
              href="/docs"
              className="text-black-400 hover:text-black-300 transition-colors text-lg font-medium"
            >
              Docs
            </Link>

            <Link
              href="/help"
              className="text-black-400 hover:text-black-300 transition-colors text-lg font-medium"
            >
              Help
            </Link>
          </nav>

          {/* Get it now Button */}
          <Button
            asChild
            className="bg-white-700 hover:bg-blue-700 text-blue-500 hover:text-white border-2 border-blue-500 rounded-3xl px-5 shadow-lg py-5 text-sm font-medium relative overflow-hidden"
          >
            <a
              href={`${process.env.NEXT_PUBLIC_AUTH_URL || 'http://localhost:3000'}/login`}
              className="relative z-10 text-lg"
            >
              Get it now
            </a>
          </Button>
        </div>
        </div>
      </div>
    </header>
  ); 
}

