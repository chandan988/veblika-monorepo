"use client";

import React from "react";
import Link from "next/link";
import Container from "./container";
import { Twitter, Instagram, Linkedin } from "lucide-react";

const footerLinks = {
  product: [
    { label: "Landingpage", href: "#" },
    { label: "Features", href: "#" },
    { label: "Documentation", href: "#" },
    { label: "Referral Program", href: "#" },
    { label: "Pricing", href: "#" },
  ],
  services: [
    { label: "Documentation", href: "#" },
    { label: "Design", href: "#" },
    { label: "Themes", href: "#" },
    { label: "Illustrations", href: "#" },
    { label: "UI Kit", href: "#" },
  ],
  company: [
    { label: "About", href: "#" },
    { label: "Terms", href: "#" },
    { label: "Privacy Policy", href: "#" },
    { label: "Careers", href: "#" },
  ],
  more: [
    { label: "Documentation", href: "#" },
    { label: "License", href: "#" },
    { label: "Changelog", href: "#" },
  ],
};

export default function Footer() {
  return (
    <footer className="w-full bg-white py-12 lg:py-16">
      <Container>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 lg:gap-12">
          {/* Column 1: Brand Information */}
          <div className="lg:col-span-1 space-y-4">
            {/* Logo with overlapping V shapes */}
            <Link href="/" className="flex items-center gap-2 group">
              <div className="relative w-10 h-10 flex items-center justify-center">
                {/* First V (Blue) */}
                <img
              src={
                "https://cloudmediastorage.s3.ap-south-1.amazonaws.com/white-label/logo/veblika.com/e745e554-ebb2-44d5-979e-7ceb20f6918e-favicon2.png"
              }
              className="h-8 w-8"
            />
              </div>
              <span className="text-2xl font-semibold text-[#1a365d]">
                Veblika
              </span>
            </Link>

            {/* Tagline */}
            <p className="text-sm text-gray-600 leading-relaxed">
              Build a modern and creative website with crealand
            </p>

            {/* Social Media Icons */}
            <div className="flex items-center gap-3 pt-2">
              {/* Google */}
              <a
                href="#"
                className="w-9 h-9 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
                aria-label="Google"
              >
                <span className="text-gray-700 font-semibold text-sm">G</span>
              </a>

              {/* Twitter */}
              <a
                href="#"
                className="w-9 h-9 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
                aria-label="Twitter"
              >
                <Twitter className="w-4 h-4 text-gray-700" />
              </a>

              {/* Instagram */}
              <a
                href="#"
                className="w-9 h-9 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
                aria-label="Instagram"
              >
                <Instagram className="w-4 h-4 text-gray-700" />
              </a>

              {/* LinkedIn */}
              <a
                href="#"
                className="w-9 h-9 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
                aria-label="LinkedIn"
              >
                <Linkedin className="w-4 h-4 text-gray-700" />
              </a>
            </div>
          </div>

          {/* Column 2: Product */}
          <div className="space-y-4">
            <h3 className="text-base font-semibold text-[#1a365d]">Product</h3>
            <ul className="space-y-3">
              {footerLinks.product.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-sm text-gray-600 hover:text-[#1a365d] transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 3: Services */}
          <div className="space-y-4">
            <h3 className="text-base font-semibold text-[#1a365d]">Services</h3>
            <ul className="space-y-3">
              {footerLinks.services.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-sm text-gray-600 hover:text-[#1a365d] transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 4: Company */}
          <div className="space-y-4">
            <h3 className="text-base font-semibold text-[#1a365d]">Company</h3>
            <ul className="space-y-3">
              {footerLinks.company.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-sm text-gray-600 hover:text-[#1a365d] transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 5: More */}
          <div className="space-y-4">
            <h3 className="text-base font-semibold text-[#1a365d]">More</h3>
            <ul className="space-y-3">
              {footerLinks.more.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-sm text-gray-600 hover:text-[#1a365d] transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </Container>
    </footer>
  );
}

