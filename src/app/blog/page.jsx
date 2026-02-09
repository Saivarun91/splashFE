"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { MoveRight, MoveLeft, Calendar, Clock } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import Navigation from "@/components/home/Navigation";
import { apiService } from "@/lib/api";

export default function BlogIndexPage() {
  const router = useRouter();
  const [posts, setPosts] = useState([]);

  useEffect(() => {
    apiService.getBlogPosts().then(setPosts).catch(() => setPosts([]));
  }, []);

  const defaultPosts = [
    {
      slug: "transforming-fashion-photography-with-ai",
      title: "Splash AI Studio: Transforming Fashion Photography with AI",
      excerpt:
        "Traditional photoshoots are expensive, time-consuming, and difficult to scale. Splash AI Studio was built to solve this challenge by replacing traditional photography workflows with an automated, AI-driven creative process.",
      date: "October 16, 2025",
      author: "Splash Team",
      category: "Innovation",
      read_time: "5 min read",
      image: "/images/blog/ai-fashion-visual.png",
    },
  ];
  const list = posts.length ? posts : defaultPosts;

  return (
    <>
    <Navigation />
    <div className="min-h-screen bg-white text-[#0c1421]">
      {/* 1. Page Header */}
      <section className="relative py-20 md:py-32 overflow-hidden bg-[#f8f9fc]">
        <div className="absolute inset-0 bg-grid-slate-100 [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.6))] -z-10" />
        <div className="max-w-screen-xl mx-auto px-6 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#f0f2f5] text-[#5533ff] text-sm font-medium mb-6">
            Our Blog
          </div>

          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight mb-6 bg-clip-text text-transparent bg-gradient-to-br from-indigo-600 to-purple-500">
            Insights & Updates
          </h1>

          <p className="text-lg md:text-xl text-[#313957] max-w-2xl mx-auto leading-relaxed">
            Latest news, trends, and insights on AI, fashion photography, and the
            future of digital retail.
          </p>
        </div>
      </section>

      {/* Back Button */}
      {/* <button
        onClick={() => router.push("/")}
        className="fixed top-10 left-6 z-50
          bg-white/80 backdrop-blur-sm border border-gray-200
          hover:bg-gray-100 hover:text-black
          px-4 py-2 rounded-full shadow-sm transition-all
          flex items-center gap-2"
      >
        <MoveLeft size={16} /> Back
      </button> */}

      {/* Blog Grid */}
      <section className="py-16 md:py-24">
        <div className="max-w-screen-xl mx-auto px-6">
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {list.map((post) => (
              <Link
                href={`/blog/${post.slug}`}
                key={post.slug}
                className="group"
              >
                <Card className="h-full overflow-hidden rounded-2xl bg-white border border-[#e6e6e6]
                  transition-all hover:-translate-y-1 hover:shadow-lg">
                  {/* Image */}
                  <div className="relative h-52 overflow-hidden bg-[#f8f9fc]">
                    <div className="absolute inset-0 bg-gradient-to-br from-[#5533ff]/10 to-[#5533ff]/5
                      flex items-center justify-center text-[#5533ff]/20 font-extrabold tracking-widest text-4xl">
                      SPLASH AI
                    </div>

                    <img
                      src={post.image || post.image_url || ""}
                      alt={post.title}
                      className="absolute inset-0 w-full h-full object-cover opacity-0
                        group-hover:opacity-100 transition-opacity duration-300"
                      onError={(e) => {
                        e.target.style.opacity = 0;
                      }}
                    />
                  </div>

                  {/* Content */}
                  <CardContent className="p-8 flex flex-col h-full">
                    <div className="flex items-center gap-4 text-sm text-[#6b7280] mb-4">
                      <span className="flex items-center gap-1">
                        <Calendar size={14} /> {post.date}
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Clock size={14} /> {post.read_time || post.readTime || "5 min read"}
                      </span>
                    </div>

                    <h3 className="text-xl font-bold mb-4 leading-snug group-hover:text-[#5533ff] transition-colors line-clamp-2">
                      {post.title}
                    </h3>

                    <p className="text-base text-[#313957] leading-relaxed mb-6 line-clamp-3">
                      {post.excerpt}
                    </p>

                    <div className="mt-auto pt-6 border-t border-[#f0f2f5] flex items-center justify-between">
                      <span className="text-sm font-semibold">
                        {post.author}
                      </span>

                      <span className="text-sm font-semibold text-[#5533ff] flex items-center gap-1">
                        Read Article
                        <MoveRight
                          size={14}
                          className="transition-transform group-hover:translate-x-1"
                        />
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
    </>
  );
}
