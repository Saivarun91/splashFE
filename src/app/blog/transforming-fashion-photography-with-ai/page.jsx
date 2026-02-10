"use client";

import React from "react";
import Link from "next/link";
import { ArrowLeft, Calendar, User, Share2, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useRouter } from "next/navigation";
import Navigation from "@/components/home/Navigation";

export default function BlogPostPage() {
    const router = useRouter();
    return (
        <>
        <Navigation />
        <div className="min-h-screen bg-white text-[#0c1421]">
            {/* Header / Hero */}
            <section className="bg-[#f8f9fc] border-b border-[#e6e6e6] py-12 md:py-30">
                <div className="max-w-screen-xl mx-auto px-6">
                    {/* <div className="flex items-start justify-start mb-4">
                <button
                onClick={() => {
                    router.push("/");
                }}
                className="inline-flex items-center text-sm font-semibold text-[#5533ff] hover:underline mb-8 hover:cursor-pointer
                   bg-white/80 backdrop-blur-sm border border-gray-200 text-gray-700
                   hover:bg-gray-100 hover:text-black
                   px-2 py-1 rounded-full shadow-sm transition-all flex items-center gap-2"
            >
                <ArrowLeft size={16} /> back
            </button>
                    </div> */}
                    <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight mb-6 leading-tight">
                        Splash AI Studio: Transforming Fashion Photography with AI
                    </h1>
                    <div className="flex flex-wrap items-center gap-6 text-sm text-[#313957]">
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-[#5533ff] text-white flex items-center justify-center font-bold text-xs">S</div>
                            <span className="font-semibold">Splash Team</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Calendar size={16} />
                            <span>October 16, 2025</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Clock size={16} />
                            <span>5 min read</span>
                        </div>
                    </div>
                </div>
            </section>

            {/* Article Content */}
            <article className="max-w-screen-xl mx-auto px-6 py-12 md:py-16">
                <div className="prose prose-lg prose-slate max-w-none">
                    <p className="lead text-xl text-[#313957] mb-8">
                        The fashion and apparel industry thrives on visuals. From product listings and social media campaigns to seasonal launches and digital ads, high-quality imagery plays a critical role in brand success. However, traditional photoshoots are expensive, time-consuming, and difficult to scale.
                    </p>

                    <p className="font-semibold text-[#0c1421]">
                        Splash AI Studio was built to solve this challenge.
                    </p>

                    <p>
                        Splash AI Studio is an AI-powered photoshoot replacement platform designed specifically for fashion and apparel brands. It enables businesses to create professional product images, lifestyle visuals, and campaign creatives without relying on physical studios, cameras, or models.
                    </p>

                    <h2 className="text-2xl font-bold mt-12 mb-6">The Challenge with Traditional Fashion Photoshoots</h2>
                    <p>
                        Fashion brands today face multiple obstacles when producing visual content:
                    </p>
                    <ul className="list-disc pl-6 space-y-2 mb-8">
                        <li>High costs associated with studios, photographers, models, and logistics</li>
                        <li>Long production timelines that delay product launches</li>
                        <li>Limited flexibility to experiment with different styles or themes</li>
                        <li>Difficulty scaling visuals across large product catalogs</li>
                    </ul>
                    <p>
                        For D2C and ecommerce brands, these challenges often result in slower go-to-market timelines and increased operational costs.
                    </p>

                    {/* Image 1 Placeholder */}
                    <figure className="my-10">
                        <div className="bg-gray-100 rounded-lg overflow-hidden aspect-video flex items-center justify-center text-gray-400 border border-dashed border-gray-300">
                            <img src="/images/about2.jpg" alt="Traditional Photoshoot Setup" />
                        </div>
                        <figcaption className="text-center text-sm text-gray-500 mt-3 italic">
                            Traditional fashion photoshoots involve complex logistics, high costs, and long production cycles.
                        </figcaption>
                    </figure>

                    <h2 className="text-2xl font-bold mt-12 mb-6">Introducing Splash AI Studio</h2>
                    <p>
                        Splash AI Studio replaces traditional photography workflows with an automated, AI-driven creative process.
                    </p>
                    <p>
                        Instead of organizing physical shoots, brands can generate high-quality visuals digitally. By uploading product images and selecting styles or themes, users can instantly create visuals that are ready for ecommerce, marketing, and advertising.
                    </p>
                    <p>
                        The platform functions as a virtual creative studio, always available and scalable.
                    </p>

                    {/* Image 2 Placeholder */}
                    <figure className="my-10">
                        <div className="bg-gray-100 rounded-xl overflow-hidden aspect-video flex items-center justify-center text-gray-400 border border-dashed border-gray-300">
                            <img src="/images/logo-Splash.png" alt="AI-Powered Fashion Visual" />
                        </div>
                        <figcaption className="text-center text-sm text-gray-500 mt-3 italic">
                            AI-generated fashion visuals created instantly without cameras or studios.
                        </figcaption>
                    </figure>

                    <h2 className="text-2xl font-bold mt-12 mb-6">Purpose and Vision of Splash AI Studio</h2>
                    <p>
                        The purpose of Splash AI Studio is to empower fashion brands with a faster, more flexible way to create visual content.
                    </p>
                    <p>
                        By removing physical constraints, the platform allows brands to:
                    </p>
                    <ul className="list-disc pl-6 space-y-2 mb-8">
                        <li>Reduce costs</li>
                        <li>Shorten production cycles</li>
                        <li>Experiment creatively without risk</li>
                        <li>Scale visual content effortlessly</li>
                    </ul>
                    <p>
                        The long-term vision is to make AI-powered visual content creation accessible to every fashion retailer, regardless of technical expertise or team size.
                    </p>

                    <h2 className="text-2xl font-bold mt-12 mb-6">How Splash AI Studio Works</h2>
                    <p>
                        Splash AI Studio is designed to be intuitive and easy to use, even for non-technical users.
                    </p>
                    <p className="font-medium text-[#0c1421] mb-4">The process follows a simple flow:</p>
                    <ol className="list-decimal pl-6 space-y-2 mb-8">
                        <li>Upload product images</li>
                        <li>Choose a visual style, background, or AI model</li>
                        <li>Generate AI-powered visuals</li>
                        <li>Preview, organize, and download results</li>
                    </ol>
                    <p>
                        This streamlined workflow allows brands to generate professional visuals in minutes instead of weeks.
                    </p>

                    {/* Image 3 Placeholder */}
                    <figure className="my-10">
                        <div className="bg-gray-100 rounded-xl overflow-hidden aspect-video flex items-center justify-center text-gray-400 border border-dashed border-gray-300">
                            <img src="/images/about3.jpg" alt="Platform Workflow Illustration" />
                        </div>
                        <figcaption className="text-center text-sm text-gray-500 mt-3 italic">
                            A simplified workflow of how Splash AI Studio generates visuals.
                        </figcaption>
                    </figure>

                    <h2 className="text-2xl font-bold mt-12 mb-6">Key Capabilities of the Platform</h2>
                    <p>
                        Splash AI Studio supports multiple types of visual generation:
                    </p>
                    <ul className="list-disc pl-6 space-y-2 mb-8">
                        <li>Plain background product images for ecommerce listings</li>
                        <li>Themed and lifestyle visuals for branding</li>
                        <li>AI models wearing uploaded products</li>
                        <li>Campaign banners optimized for digital ads</li>
                        <li>Project-based visual management for campaigns</li>
                    </ul>
                    <p>
                        All generated assets are stored in a centralized gallery, making it easy to manage and reuse visuals across teams and campaigns.
                    </p>

                    {/* Image 4 Placeholder */}
                    <figure className="my-10">
                        <div className="bg-gray-100 rounded-xl overflow-hidden aspect-video flex items-center justify-center text-gray-400 border border-dashed border-gray-300">
                            <span className="text-sm"><img src="/images/about1.jpg" alt="AI Model Wearing Apparel" /></span>
                        </div>
                        <figcaption className="text-center text-sm text-gray-500 mt-3 italic">
                            Virtual AI models wearing fashion products generated by Splash AI Studio.
                        </figcaption>
                    </figure>

                    <h2 className="text-2xl font-bold mt-12 mb-6">Built for Teams and Campaigns</h2>
                    <p>
                        Splash AI Studio supports collaboration for growing teams and agencies.
                    </p>
                    <p>
                        With role-based access, multiple users can work together on projects while maintaining control and organization. Campaigns can be managed as projects, allowing teams to generate consistent visuals across product launches and seasonal collections.
                    </p>
                    <p>
                        This makes Splash AI Studio suitable not only for individual brands but also for creative agencies handling multiple clients.
                    </p>

                    <h2 className="text-2xl font-bold mt-12 mb-6">Designed for Simplicity and Scale</h2>
                    <p>
                        One of the core principles behind Splash AI Studio is simplicity.
                    </p>
                    <p>
                        The platform is designed to:
                    </p>
                    <ul className="list-disc pl-6 space-y-2 mb-8">
                        <li>Require no design or AI expertise</li>
                        <li>Offer guided workflows</li>
                        <li>Provide quick previews and refinements</li>
                        <li>Scale easily as brand needs grow</li>
                    </ul>
                    <p>
                        Whether managing a small product catalog or a large seasonal campaign, the experience remains consistent and efficient.
                    </p>

                    <h2 className="text-2xl font-bold mt-12 mb-6">The Future of Fashion Visual Content</h2>
                    <p>
                        As ecommerce and digital marketing continue to evolve, the demand for fast, scalable, and high-quality visuals will only increase.
                    </p>
                    <p>
                        Splash AI Studio represents a shift toward intelligent, AI-powered creative workflows — where brands are no longer limited by physical resources but empowered by technology.
                    </p>
                    <p>
                        By combining automation, creativity, and scalability, Splash AI Studio is shaping the future of fashion photography.
                    </p>

                    {/* Image 5 Placeholder */}
                    <figure className="my-10">
                        <div className="bg-gray-100 rounded-xl overflow-hidden aspect-video flex items-center justify-center text-gray-400 border border-dashed border-gray-300">
                            <span className="text-sm"><img src="/images/about2.jpg" alt="Future of Fashion & AI" /></span>
                        </div>
                        <figcaption className="text-center text-sm text-gray-500 mt-3 italic">
                            AI-powered creativity shaping the future of fashion visuals.
                        </figcaption>
                    </figure>

                    <Separator className="my-12" />

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
            </article>

            {/* Footer / More Posts */}
            <section className="bg-[#f8f9fc] py-16 border-t border-[#e6e6e6] mt-16">
                <div className="max-w-screen-xl mx-auto px-6">
                    <div className="flex items-center justify-between mb-8">
                        <h2 className="text-2xl font-bold">More from our blog</h2>
                        <Link href="/blog" className="text-[#5533ff] font-semibold hover:underline">View all posts</Link>
                    </div>
                    {/* Loop placeholders... */}
                    <p className="text-gray-500">More updates coming soon.</p>
                </div>
            </section>


            <button
                onClick={() => {
                    router.push("/blog");
                }}
                className="fixed top-[100px] left-6 z-50
                   bg-white/80 backdrop-blur-sm border border-gray-200 text-gray-700
                   hover:bg-gray-100 hover:text-black
                   px-4 py-2 rounded-full shadow-sm transition-all flex items-center gap-2"
            >
                <ArrowLeft size={16} /> Back
            </button>
        </div >
        </>
    );
}
