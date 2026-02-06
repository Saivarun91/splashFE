"use client";

import React from "react";
import Link from "next/link";
import { ArrowRight, ArrowLeft, Calendar, User, Clock } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function BlogIndexPage() {
  const posts = [
    {
      slug: "transforming-fashion-photography-with-ai",
      title: "Splash AI Studio: Transforming Fashion Photography with AI",
      excerpt: "Traditional photoshoots are expensive, time-consuming, and difficult to scale. Splash AI Studio was built to solve this challenge by replacing traditional photography workflows with an automated, AI-driven creative process.",
      date: "October 16, 2025",
      author: "Splash Team",
      category: "Innovation",
      readTime: "5 min read",
      image: "/images/blog/ai-fashion-visual.png" // Will use placeholder fallback if missing
    }
  ];

  return (
    <div className="min-h-screen bg-[#f8f9fc] text-[#0c1421]">
      {/* Hero Section */}
      <section className="bg-white border-b border-[#e6e6e6] py-16 md:py-24">
        <div className="max-w-screen-xl mx-auto px-6 text-center">
          <Badge className="mb-4 bg-[#f0f2f5] text-[#5533ff] hover:bg-[#e6e8eb]">Our Blog</Badge>
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-6">
            Insights & Updates
          </h1>
          <p className="text-lg text-[#313957] max-w-2xl mx-auto">
            Latest news, trends, and insights on AI, fashion photography, and the future of digital retail.
          </p>
        </div>
      </section>
      <button
        onClick={() => {
          const footer = document.getElementById("site-footer");
          footer?.scrollIntoView({ behavior: "smooth" });
        }}
        className="fixed top-24 left-6 z-50
             bg-white/80 backdrop-blur-sm border border-gray-200 text-gray-700
             hover:bg-gray-100 hover:text-black
             px-4 py-2 rounded-full shadow-sm transition-all flex items-center gap-2"
      >
        <ArrowLeft size={16} /> Back
      </button>

      {/* Blog Grid */}
      <section className="py-16">
        <div className="max-w-screen-xl mx-auto px-6">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {posts.map((post) => (
              <Link href={`/blog/${post.slug}`} key={post.slug} className="group">
                <Card className="h-full border-[#e6e6e6] overflow-hidden hover:shadow-lg transition-all duration-300 group-hover:-translate-y-1">
                  <div className="h-48 bg-gray-200 relative overflow-hidden">
                    {/* Placeholder for missing image */}
                    <div className="absolute inset-0 bg-gradient-to-br from-[#5533ff]/10 to-[#5533ff]/5 flex items-center justify-center text-[#5533ff]/20 font-bold text-4xl">
                      SPLASH
                    </div>
                    <img
                      src={post.image}
                      alt={post.title}
                      className="w-full h-full object-cover opacity-0 group-hover:opacity-100 transition-opacity duration-300 absolute inset-0"
                      onError={(e) => { e.target.style.opacity = 0 }}
                    />
                  </div>
                  <CardContent className="p-6">
                    <div className="flex items-center gap-3 text-sm text-[#313957]/70 mb-3">
                      <span className="flex items-center gap-1"><Calendar size={14} /> {post.date}</span>
                      <span>•</span>
                      <span className="flex items-center gap-1"><Clock size={14} /> {post.readTime}</span>
                    </div>
                    <h3 className="text-xl font-bold mb-3 group-hover:text-[#5533ff] transition-colors line-clamp-2">
                      {post.title}
                    </h3>
                    <p className="text-[#313957] mb-4 line-clamp-3 text-sm leading-relaxed">
                      {post.excerpt}
                    </p>
                    <div className="flex items-center justify-between mt-auto">
                      <span className="text-sm font-semibold text-[#0c1421]">{post.author}</span>
                      <span className="text-[#5533ff] font-semibold text-sm flex items-center gap-1">
                        Read Article <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
