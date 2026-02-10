"use client";

import React, { useEffect, useState } from "react";
import { Eye, Target, CheckCircle2, Zap, Globe2, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import Navigation from "@/components/home/Navigation";
import { apiService } from "@/lib/api";

export default function VisionMissionPage() {
  const [content, setContent] = useState(null);

  useEffect(() => {
    apiService.getPageContent("vision_mission").then(setContent).catch(() => setContent({}));
  }, []);

  const header = content?.header || {};
  const vision = content?.vision || {};
  const mission = content?.mission || {};
  const coreValues = content?.core_values || {};
  const cta = content?.cta || {};

  return (
    <>
      <Navigation />

      <div className="min-h-screen bg-white text-[#0c1421]">
        <section className="relative py-20 md:py-32 overflow-hidden bg-[#f8f9fc]">
          <div className="absolute inset-0 bg-grid-slate-100 [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.6))] -z-10" />
          <div className="max-w-screen-xl mx-auto px-6 text-center">
            <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight mb-6 bg-clip-text text-transparent bg-gradient-to-br from-indigo-600 to-purple-500">
              {header.title || "Our Vision & Mission"}
            </h1>
            <p className="text-lg md:text-xl text-[#313957] max-w-2xl mx-auto leading-relaxed">
              {header.subtitle || "Shaping the future of fashion imagery with AI-powered creativity."}
            </p>
          </div>
        </section>

        <section className="py-16 md:py-24">
          <div className="max-w-screen-xl mx-auto px-6 grid md:grid-cols-2 gap-16 items-center">
            <div>
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-[#f0f2f5] rounded-lg">
                  <Eye className="w-6 h-6 text-[#5533ff]" />
                </div>
                <h2 className="text-3xl md:text-4xl font-bold">{vision.title || "Our Vision"}</h2>
              </div>
              {(vision.paragraphs || []).length > 0 ? vision.paragraphs.map((p, i) => (
                <p key={i} className="text-lg text-[#313957] mb-6 leading-relaxed">{p}</p>
              )) : (
                <>
                  <p className="text-lg text-[#313957] mb-6 leading-relaxed">
                    To become the global standard for AI-powered fashion and product imagery.
                  </p>
                  <p className="text-lg text-[#313957] leading-relaxed">
                    We envision a world where brands can create studio-quality visuals instantly,
                    without physical shoots, heavy costs, or production delays.
                  </p>
                </>
              )}
            </div>
            <div className="bg-[#f8f9fc] rounded-2xl p-10 border border-[#e6e6e6]">
              <div className="space-y-6">
                {(vision.points || ["Democratize professional visuals", "Enable instant content creation", "Remove photoshoot dependencies", "Empower limitless creativity"]).map((item, index) => (
                  <div key={index} className="flex items-center gap-4">
                    <CheckCircle2 className="text-[#5533ff]" />
                    <span className="text-[#313957] text-lg">{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="py-16 md:py-24 bg-[#0c1421] text-white">
          <div className="max-w-screen-xl mx-auto px-6 grid md:grid-cols-2 gap-16 items-center">
            <div className="order-2 md:order-1">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-white/10 rounded-lg">
                  <Target className="w-6 h-6 text-[#5533ff]" />
                </div>
                <h2 className="text-3xl md:text-4xl font-bold">{mission.title || "Our Mission"}</h2>
              </div>
              {(mission.paragraphs || []).length > 0 ? mission.paragraphs.map((p, i) => (
                <p key={i} className="text-gray-300 text-lg mb-6 leading-relaxed">{p}</p>
              )) : (
                <>
                  <p className="text-gray-300 text-lg mb-6 leading-relaxed">
                    To replace traditional fashion photoshoots with an intelligent,
                    AI-driven creative studio.
                  </p>
                  <p className="text-gray-300 text-lg leading-relaxed">
                    We help brands reduce costs, move faster, and maintain consistent
                    visual quality across all digital channels.
                  </p>
                </>
              )}
            </div>
            <div className="order-1 md:order-2 bg-white p-10 rounded-2xl border border-[#e6e6e6] text-[#0c1421]">
              <div className="space-y-6">
                {(mission.bullets || [{ text: "Instant AI-generated visuals" }, { text: "Built for brands and creative teams" }, { text: "Scales globally with ease" }]).map((b, i) => (
                  <div key={i} className="flex gap-4">
                    <Zap className="text-[#5533ff]" />
                    <p className="text-lg">{typeof b === "string" ? b : b.text}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="py-16 md:py-24">
          <div className="max-w-screen-xl mx-auto px-6 text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-12">
              {coreValues.heading || "Our Core Values"}
            </h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {(coreValues.items || [
                { title: "Innovation", desc: "Pushing boundaries with AI-driven creativity." },
                { title: "Speed", desc: "Helping brands go to market faster." },
                { title: "Accessibility", desc: "High-quality visuals for everyone." },
                { title: "Creative Freedom", desc: "Unlimited experimentation without limits." },
                { title: "Reliability", desc: "Consistent, production-ready results." },
                { title: "Customer Focus", desc: "Solving real-world fashion challenges." },
              ]).map((item, index) => (
                <div key={index} className="p-6 bg-white border border-[#e6e6e6] rounded-xl hover:shadow-lg transition-shadow">
                  <h3 className="text-xl font-bold mb-3">{item.title}</h3>
                  <p className="text-[#313957]">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="py-20 bg-gradient-to-br from-indigo-600 to-purple-500 text-white text-center">
          <div className="max-w-screen-lg mx-auto px-6">
            <h2 className="text-3xl md:text-4xl font-bold mb-8 leading-tight">
              {cta.title || "Build the future of fashion visuals with Splash AI Studio."}
            </h2>
            <Link href="/signup">
              <Button size="lg" className="bg-white text-[#5533ff] hover:bg-gray-100 font-bold px-8 py-6 text-lg rounded-full border border-black">
                {cta.button_text || "Get Started"}
              </Button>
            </Link>
          </div>
        </section>

      </div>
    </>
  );
}
