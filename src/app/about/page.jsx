"use client";

import React from "react";
import { MoveRight, MoveLeft, CheckCircle2, Zap, Users, Globe2, Layers } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function AboutPage() {
  const router = useRouter();
  return (
    <div className="min-h-screen bg-white text-[#0c1421]">
      {/* 1. Page Header */}
      <section className="relative py-20 md:py-32 overflow-hidden bg-[#f8f9fc]">
        <div className="absolute inset-0 bg-grid-slate-100 [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.6))] -z-10" />
        <div className="max-w-screen-xl mx-auto px-6 text-center">
          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight mb-6 bg-clip-text text-transparent bg-gradient-to-br from-indigo-600 to-purple-500">
            About Splash AI Studio
          </h1>
          <p className="text-lg md:text-xl text-[#313957] max-w-2xl mx-auto leading-relaxed">
            Splash AI Studio is an AI-powered photoshoot replacement platform built for the fashion and apparel retail industry.
          </p>
        </div>
      </section>

      {/* 2. Who We Are */}
      <section className="py-16 md:py-24">
        <div className="max-w-screen-xl mx-auto px-6 grid md:grid-cols-2 gap-12 items-center">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#f0f2f5] text-[#5533ff] text-sm font-medium mb-6">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#5533ff] opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#5533ff]"></span>
              </span>
              Who We Are
            </div>
            <h2 className="text-3xl md:text-4xl font-bold mb-6">
              Virtual Creative Studio
            </h2>
            <p className="text-lg text-[#313957] mb-6 leading-relaxed">
              Splash AI Studio transforms the traditional product photography process into an automated, AI-driven workflow.
              It enables fashion brands and D2C retailers to generate high-quality product visuals, lifestyle images, and campaign assets without the need for cameras, physical studios, or professional models.
            </p>
            <p className="text-lg text-[#313957] leading-relaxed">
              The platform functions as a virtual creative studio that simplifies visual content creation while maintaining professional quality and brand consistency.
            </p>
          </div>
          <div className="bg-[#f8f9fc] rounded-2xl p-8 md:p-12 border border-[#e6e6e6]">
            {/* Placeholder for an abstract illustration or pattern */}
            <div className="grid grid-cols-2 gap-4">
              <div className="h-40 bg-white rounded-lg shadow-sm w-full animate-pulse"></div>
              <div className="h-40 bg-white rounded-lg shadow-sm w-full animate-pulse delay-75"></div>
              <div className="h-40 bg-white rounded-lg shadow-sm w-full animate-pulse delay-150"></div>
              <div className="h-40 bg-white rounded-lg shadow-sm w-full animate-pulse delay-300"></div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Our Purpose & 4. Our Vision */}
      <section className="py-16 md:py-24 bg-[#0c1421] text-white">
        <div className="max-w-screen-xl mx-auto px-6">
          <div className="grid md:grid-cols-2 gap-16">
            {/* Purpose */}
            <div>
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-white/10 rounded-lg">
                  <Zap className="w-6 h-6 text-[#5533ff]" />
                </div>
                <h2 className="text-2xl md:text-3xl font-bold">Our Purpose</h2>
              </div>
              <p className="text-gray-300 text-lg mb-6 leading-relaxed">
                The purpose of Splash AI Studio is to eliminate the limitations of traditional photoshoots — high costs, long production cycles, and limited scalability.
              </p>
              <p className="text-gray-300 text-lg leading-relaxed">
                By leveraging artificial intelligence, the platform allows brands to create visual content instantly, reduce operational overhead, and adapt quickly to changing marketing needs.
              </p>
            </div>

            {/* Vision */}
            <div>
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-white/10 rounded-lg">
                  <Globe2 className="w-6 h-6 text-[#5533ff]" />
                </div>
                <h2 className="text-2xl md:text-3xl font-bold">Our Vision</h2>
              </div>
              <p className="text-gray-300 text-lg leading-relaxed">
                The vision of Splash AI Studio is to make AI-powered visual content creation accessible to every fashion retailer, regardless of team size, budget, or technical expertise.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 5. What the Platform Offers */}
      <section className="py-16 md:py-24">
        <div className="max-w-screen-xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">What the Platform Offers</h2>
            <p className="text-lg text-[#313957] max-w-2xl mx-auto">
              A complete suite of tools designed to replace the traditional studio workflow.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="p-8 bg-white border border-[#e6e6e6] rounded-xl hover:shadow-lg transition-shadow">
              <Layers className="w-10 h-10 text-[#5533ff] mb-4" />
              <h3 className="text-xl font-bold mb-3">Product Visuals</h3>
              <p className="text-[#313957]">Tools to generate individual product visuals and campaign imagery with high fidelity.</p>
            </div>
            {/* Feature 2 */}
            <div className="p-8 bg-white border border-[#e6e6e6] rounded-xl hover:shadow-lg transition-shadow">
              <div className="w-10 h-10 bg-[#f0f2f5] rounded-lg flex items-center justify-center mb-4 text-[#5533ff] font-bold">D</div>
              <h3 className="text-xl font-bold mb-3">Centralized Dashboard</h3>
              <p className="text-[#313957]">A centralized dashboard to manage, organize, and retrieve all your AI-generated images.</p>
            </div>
            {/* Feature 3 */}
            <div className="p-8 bg-white border border-[#e6e6e6] rounded-xl hover:shadow-lg transition-shadow">
              <div className="w-10 h-10 bg-[#f0f2f5] rounded-lg flex items-center justify-center mb-4 text-[#5533ff] font-bold">C</div>
              <h3 className="text-xl font-bold mb-3">Campaign Creation</h3>
              <p className="text-[#313957]">Support for project-based campaign creation to keep your seasonal assets organized.</p>
            </div>
            {/* Feature 4 */}
            <div className="p-8 bg-white border border-[#e6e6e6] rounded-xl hover:shadow-lg transition-shadow">
              <Users className="w-10 h-10 text-[#5533ff] mb-4" />
              <h3 className="text-xl font-bold mb-3">Collaboration</h3>
              <p className="text-[#313957]">Built-in collaboration capabilities for growing teams and agencies.</p>
            </div>
            {/* Feature 5 */}
            <div className="p-8 bg-white border border-[#e6e6e6] rounded-xl hover:shadow-lg transition-shadow">
              <div className="w-10 h-10 bg-[#f0f2f5] rounded-lg flex items-center justify-center mb-4 text-[#5533ff] font-bold">$</div>
              <h3 className="text-xl font-bold mb-3">Flexible Plans</h3>
              <p className="text-[#313957]">Flexible subscription and credit-based usage plans tailored to your needs.</p>
            </div>
            {/* Feature 6 */}
            <div className="p-8 bg-white border border-[#e6e6e6] rounded-xl hover:shadow-lg transition-shadow">
              <CheckCircle2 className="w-10 h-10 text-[#5533ff] mb-4" />
              <h3 className="text-xl font-bold mb-3">Intuitive Design</h3>
              <p className="text-[#313957]">The platform is designed to be intuitive and usable by non-technical users.</p>
            </div>
          </div>
        </div>
      </section>

      {/* 6. How It Works */}
      <section className="py-16 md:py-24 bg-[#f8f9fc]">
        <div className="max-w-screen-xl mx-auto px-6">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <div className="order-2 md:order-1">
              <h2 className="text-3xl md:text-4xl font-bold mb-6">How It Works</h2>
              <div className="space-y-8">
                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-[#5533ff] text-white flex items-center justify-center font-bold">1</div>
                  <div>
                    <h3 className="text-xl font-bold mb-2">Upload & Select</h3>
                    <p className="text-[#313957]">Users upload product images, select visual styles or themes, and generate AI-powered visuals through guided workflows.</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-[#5533ff] text-white flex items-center justify-center font-bold">2</div>
                  <div>
                    <h3 className="text-xl font-bold mb-2">Refine & Download</h3>
                    <p className="text-[#313957]">Generated images can be previewed, refined, organized, and downloaded directly from the platform.</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="order-1 md:order-2 bg-white p-8 rounded-2xl shadow-sm border border-[#e6e6e6]">
              {/* Simplified workflow visualization */}
              <div className="flex flex-col gap-4">
                <div className="h-16 bg-[#f0f2f5] rounded-lg w-full flex items-center px-4 text-sm text-gray-500">Upload Product.png</div>
                <div className="flex justify-center"><MoveRight className="text-gray-300 rotate-90" /></div>
                <div className="h-16 bg-[#f0f2f5] rounded-lg w-full flex items-center px-4 text-sm text-gray-500">Select "Studio Lighting"</div>
                <div className="flex justify-center"><MoveRight className="text-gray-300 rotate-90" /></div>
                <div className="h-48 bg-gradient-to-br from-[#f0f2f5] to-[#e6e6e6] rounded-lg w-full flex items-center justify-center text-[#5533ff] font-bold">
                  Generating...
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 7. Who It Is For */}
      <section className="py-16 md:py-24">
        <div className="max-w-screen-xl mx-auto px-6 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-12">Who It Is For</h2>
          <div className="flex flex-wrap justify-center gap-4">
            {["Fashion and apparel brands", "D2C retailers", "Ecommerce businesses", "Creative teams and agencies"].map((item, index) => (
              <div key={index} className="px-6 py-3 bg-[#f3f9fa] text-[#0c1421] font-semibold rounded-full border border-[#e6e6e6]">
                {item}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 8. Closing Statement */}
      <section className="py-20 bg-gradient-to-br from-indigo-600 to-purple-500 text-white text-center">
        <div className="max-w-screen-lg mx-auto px-6">
          <h2 className="text-3xl md:text-4xl font-bold mb-8 leading-tight">
            Splash AI Studio represents a modern approach to fashion photography — combining speed, scalability, and creative flexibility through artificial intelligence.
          </h2>
          <Link href="/signup">
            <Button size="lg" className="bg-white text-[#5533ff] hover:bg-gray-100 font-bold px-8 py-6 text-lg rounded-full border border-black">
              Get Started
            </Button>
          </Link>
        </div>
      </section>

      <button
        onClick={() => {
          router.push("/");
        }}
        className="fixed top-10 left-6 z-50
                   bg-white/80 backdrop-blur-sm border border-gray-200 text-
                   hover:bg-gray-100 hover:text-black
                   px-4 py-2 rounded-full shadow-sm transition-all flex items-center gap-2"
      >
        <MoveLeft size={16} /> Back
      </button>
    </div>
  );
}
