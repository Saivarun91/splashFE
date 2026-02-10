"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, Calendar, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import Navigation from "@/components/home/Navigation";
import { apiService } from "@/lib/api";

export default function BlogPostPage() {
  const params = useParams();
  const slug = params?.slug;
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!slug) return;
    apiService
      .getBlogPost(slug)
      .then(setPost)
      .catch(() => setPost(null))
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) {
    return (
      <>
        <Navigation />
        <div className="min-h-screen bg-white flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#5533ff]" />
        </div>
      </>
    );
  }

  if (!post) {
    return (
      <>
        <Navigation />
        <div className="min-h-screen bg-white flex flex-col items-center justify-center px-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Post not found</h1>
          <Link href="/blog" className="text-[#5533ff] hover:underline">Back to Blog</Link>
        </div>
      </>
    );
  }

  const authorInitial = (post.author || "S").charAt(0).toUpperCase();

  return (
    <>
      <Navigation />
      <div className="min-h-screen bg-white text-[#0c1421]">
        <section className="bg-[#f8f9fc] border-b border-[#e6e6e6] py-12 md:py-16">
          <div className="max-w-screen-xl mx-auto px-6">
            <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight mb-6 leading-tight">
              {post.title}
            </h1>
            <div className="flex flex-wrap items-center gap-6 text-sm text-[#313957]">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-[#5533ff] text-white flex items-center justify-center font-bold text-xs">
                  {authorInitial}
                </div>
                <span className="font-semibold">{post.author || "Splash Team"}</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar size={16} />
                <span>{post.date || ""}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock size={16} />
                <span>{post.read_time || "5 min read"}</span>
              </div>
            </div>
          </div>
        </section>

        <article className="max-w-screen-xl mx-auto px-6 py-12 md:py-16">
          <div className="prose prose-lg prose-slate max-w-none">
            {post.body ? (
              <div dangerouslySetInnerHTML={{ __html: post.body }} />
            ) : (
              <p className="text-xl text-[#313957]">{post.excerpt}</p>
            )}
          </div>
        </article>

        <div className="max-w-screen-xl mx-auto px-6 mb-16">
          <section className="bg-[#f8f9fc] rounded-2xl p-8 text-center border border-[#e6e6e6]">
            <h3 className="text-2xl font-bold mb-4">Ready to transform your visual content?</h3>
            <p className="text-[#313957] mb-6">Start creating professional AI-generated fashion imagery today.</p>
            <Link href="/signup">
              <Button className="bg-[#5533ff] hover:bg-[#4422dd] text-white font-bold rounded-full px-8 py-6 text-lg">
                Get Started for Free
              </Button>
            </Link>
          </section>
        </div>

        <div className="max-w-screen-xl mx-auto px-6 pb-12">
          <Link
            href="/blog"
            className="inline-flex items-center gap-2 text-[#5533ff] font-semibold hover:underline"
          >
            <ArrowLeft size={16} /> Back to Blog
          </Link>
        </div>
      </div>
    </>
  );
}
