"use client";

import React, { useEffect, useState } from "react";
import { MoveRight, MoveLeft, CheckCircle2, Zap, Users, Globe2, Layers, LayoutDashboardIcon, DollarSignIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Navigation from "@/components/home/Navigation";
import { apiService } from "@/lib/api";

export default function AboutPage() {
  const router = useRouter();
  const [content, setContent] = useState(null);

  useEffect(() => {
    apiService.getPageContent("about").then(setContent).catch(() => setContent({}));
  }, []);

  const header = content?.header || {};
  const whoWeAre = content?.who_we_are || {};
  const purposeVision = content?.purpose_vision || {};
  const platformOffers = content?.platform_offers || {};
  const howItWorks = content?.how_it_works || {};
  const whoItIsFor = content?.who_it_is_for || {};
  const closing = content?.closing || {};

  return (
    <>
    <Navigation />
    <div className="min-h-screen bg-white text-[#0c1421]">
      <section className="relative py-20 md:py-32 overflow-hidden bg-[#f8f9fc]">
        <div className="absolute inset-0 bg-grid-slate-100 [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.6))] -z-10" />
        <div className="max-w-screen-xl mx-auto px-6 text-center">
          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight mb-6 bg-clip-text text-transparent bg-gradient-to-br from-indigo-600 to-purple-500">
            {header.title || "About Splash AI Studio"}
          </h1>
          <p className="text-lg md:text-xl text-[#313957] max-w-2xl mx-auto leading-relaxed">
            {header.subtitle || "Splash AI Studio is an AI-powered photoshoot replacement platform built for the fashion and apparel retail industry."}
          </p>
        </div>
      </section>

      <section className="py-16 md:py-24">
        <div className="max-w-screen-xl mx-auto px-6 grid md:grid-cols-2 gap-12 items-center">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#f0f2f5] text-[#5533ff] text-sm font-medium mb-6">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#5533ff] opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#5533ff]"></span>
              </span>
              {whoWeAre.badge || "Who We Are"}
            </div>
            <h2 className="text-3xl md:text-4xl font-bold mb-6">
              {whoWeAre.title || "Virtual Creative Studio"}
            </h2>
            {(whoWeAre.paragraphs || []).length > 0 ? whoWeAre.paragraphs.map((p, i) => (
              <p key={i} className="text-lg text-[#313957] mb-6 leading-relaxed">{p}</p>
            )) : (
              <>
                <p className="text-lg text-[#313957] mb-6 leading-relaxed">
                  Splash AI Studio transforms the traditional product photography process into an automated, AI-driven workflow.
                  It enables fashion brands and D2C retailers to generate high-quality product visuals, lifestyle images, and campaign assets without the need for cameras, physical studios, or professional models.
                </p>
                <p className="text-lg text-[#313957] leading-relaxed">
                  The platform functions as a virtual creative studio that simplifies visual content creation while maintaining professional quality and brand consistency.
                </p>
              </>
            )}
          </div>
          <div className="bg-[#f8f9fc] rounded-2xl p-8 md:p-12 border border-[#e6e6e6]">
            <div className="grid grid-cols-2 gap-4">
              {(whoWeAre.images || ["/images/about1.jpg", "/images/about2.jpg", "/images/about3.jpg", "/images/logo-Splash.png"]).map((src, i) => (
                <div key={i} className="h-40 bg-white rounded-lg shadow-sm w-full overflow-hidden">
                  <img src={src} alt={`About ${i + 1}`} className="w-full h-full object-cover" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 md:py-24 bg-[#0c1421] text-white">
        <div className="max-w-screen-xl mx-auto px-6">
          <div className="grid md:grid-cols-2 gap-16">
            <div>
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-white/10 rounded-lg">
                  <Zap className="w-6 h-6 text-[#5533ff]" />
                </div>
                <h2 className="text-2xl md:text-3xl font-bold">{purposeVision.purpose_title || "Our Purpose"}</h2>
              </div>
              <p className="text-gray-300 text-lg leading-relaxed whitespace-pre-line">
                {purposeVision.purpose_text || "The purpose of Splash AI Studio is to eliminate the limitations of traditional photoshoots — high costs, long production cycles, and limited scalability.\n\nBy leveraging artificial intelligence, the platform allows brands to create visual content instantly, reduce operational overhead, and adapt quickly to changing marketing needs."}
              </p>
            </div>
            <div>
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-white/10 rounded-lg">
                  <Globe2 className="w-6 h-6 text-[#5533ff]" />
                </div>
                <h2 className="text-2xl md:text-3xl font-bold">{purposeVision.vision_title || "Our Vision"}</h2>
              </div>
              <p className="text-gray-300 text-lg leading-relaxed">
                {purposeVision.vision_text || "The vision of Splash AI Studio is to make AI-powered visual content creation accessible to every fashion retailer, regardless of team size, budget, or technical expertise."}
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 md:py-24">
        <div className="max-w-screen-xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">{platformOffers.heading || "What the Platform Offers"}</h2>
            <p className="text-lg text-[#313957] max-w-2xl mx-auto">
              {platformOffers.subheading || "A complete suite of tools designed to replace the traditional studio workflow."}
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {(platformOffers.items || [
              { title: "Product Visuals", description: "Tools to generate individual product visuals and campaign imagery with high fidelity." },
              { title: "Centralized Dashboard", description: "A centralized dashboard to manage, organize, and retrieve all your AI-generated images." },
              { title: "Campaign Creation", description: "Support for project-based campaign creation to keep your seasonal assets organized." },
              { title: "Collaboration", description: "Built-in collaboration capabilities for growing teams and agencies." },
              { title: "Flexible Plans", description: "Flexible subscription and credit-based usage plans tailored to your needs." },
              { title: "Intuitive Design", description: "The platform is designed to be intuitive and usable by non-technical users." },
            ]).map((item, i) => (
              <div key={i} className="p-6 bg-white border border-[#e6e6e6] rounded-xl hover:shadow-lg transition-shadow">
                <div className="w-10 h-10 bg-[#f0f2f5] rounded-lg flex items-center justify-center mb-4 text-[#5533ff] font-bold"><Layers /></div>
                <h3 className="text-xl font-bold mb-3">{item.title}</h3>
                <p className="text-[#313957]">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 md:py-24 bg-[#f8f9fc]">
        <div className="max-w-screen-xl mx-auto px-6">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <div className="order-2 md:order-1">
              <h2 className="text-3xl md:text-4xl font-bold mb-6">{howItWorks.heading || "How It Works"}</h2>
              <div className="space-y-8">
                {(howItWorks.steps || [
                  { title: "Upload & Select", description: "Users upload product images, select visual styles or themes, and generate AI-powered visuals through guided workflows." },
                  { title: "Refine & Download", description: "Generated images can be previewed, refined, organized, and downloaded directly from the platform." },
                ]).map((step, i) => (
                  <div key={i} className="flex gap-4">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-[#5533ff] text-white flex items-center justify-center font-bold">{i + 1}</div>
                    <div>
                      <h3 className="text-xl font-bold mb-2">{step.title}</h3>
                      <p className="text-[#313957]">{step.description}</p>
                    </div>
                  </div>
                ))}
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

      <section className="py-16 md:py-24">
        <div className="max-w-screen-xl mx-auto px-6 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-12">{whoItIsFor.heading || "Who It Is For"}</h2>
          <div className="flex flex-wrap justify-center gap-4">
            {(whoItIsFor.items || ["Fashion and apparel brands", "D2C retailers", "Ecommerce businesses", "Creative teams and agencies"]).map((item, index) => (
              <div key={index} className="px-6 py-3 bg-[#f3f9fa] text-[#0c1421] font-semibold rounded-full border border-[#e6e6e6]">
                {item}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 bg-gradient-to-br from-indigo-600 to-purple-500 text-white text-center">
        <div className="max-w-screen-lg mx-auto px-6">
          <h2 className="text-3xl md:text-4xl font-bold mb-8 leading-tight">
            {closing.title || "Splash AI Studio represents a modern approach to fashion photography — combining speed, scalability, and creative flexibility through artificial intelligence."}
          </h2>
          <Link href="/signup">
            <Button size="lg" className="bg-white text-[#5533ff] hover:bg-gray-100 font-bold px-8 py-6 text-lg rounded-full border border-black">
              {closing.cta_text || "Get Started"}
            </Button>
          </Link>
        </div>
      </section>

      {/* <button
        onClick={() => {
          router.push("/");
        }}
        className="fixed top-10 left-6 z-50
                   bg-white/80 backdrop-blur-sm border border-gray-200 text-
                   hover:bg-gray-100 hover:text-black
                   px-4 py-2 rounded-full shadow-sm transition-all flex items-center gap-2"
      >
        <MoveLeft size={16} /> Back
      </button> */}
    </div>
    </>
    
  );
}
