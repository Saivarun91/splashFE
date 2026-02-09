
"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { apiService } from "@/lib/api";
import Navigation from "@/components/home/Navigation";
import HeroSection from "@/components/home/HeroSection";
import ProductChapter from "@/components/home/ProductChapter";
import FeatureGrid from "@/components/home/FeatureGrid";
import BeforeAfter from "@/components/home/BeforeAfter";
import ShowcaseSection from "@/components/home/ShowcaseSection";
import HowItWorks from "@/components/home/HowItWorks";
import PricingSection from "@/components/home/PricingSection";
import Footer from "@/components/home/Footer";

const DEFAULT_CHAPTERS = [
  { title: "Start with a spark.", description: "Upload moodboards, pick styles, and define your brand feel. Our AI understands luxury aesthetics and translates your vision into precise creative direction.", image_url: "/images/chapter-brief.jpg", image_alt: "Luxury jewelry design moodboard with textures and references", image_position: "right" },
  { title: "Cast the perfect face.", description: "Choose AI models or upload approved talent—control poses, angles, and expressions. Diverse representation with beauty-grade lighting that makes your jewelry shine.", image_url: "/images/chapter-model.jpeg", image_alt: "Professional model portrait for jewelry campaigns", image_position: "left" },
  { title: "Your pieces, flawlessly rendered.", description: "Import SKUs and we preserve every detail—metal sheen, stone fire, and micro-details. From prongs to pavé, accuracy that rivals traditional photography.", image_url: "/images/chapter-product.jpg", image_alt: "Macro close-up of luxury diamond ring", image_position: "right" },
  { title: "Set the scene.", description: "Pick locations, backdrops, and palettes. Go from studio-clean to editorial drama. Marble slabs, silk backdrops, daylight streaming—complete creative control.", image_url: "/images/chapter-scene.png", image_alt: "Editorial jewelry photography setup with marble and silk", image_position: "left" },
  { title: "Generate. Refine. Perfect.", description: "Create multiple takes, prompt micro-edits, correct reflections, and match skin tones. Retouch tools that understand jewelry photography standards.", image_url: "/images/variants-bangles.jpg", image_alt: "Three bangle variants in yellow, rose, and white gold", image_position: "right" },
];

const Home = () => {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuth();
  const [homeContent, setHomeContent] = useState(null);

  useEffect(() => {
    apiService.getPageContent("home").then((content) => setHomeContent(content)).catch(() => setHomeContent({}));
  }, []);

  useEffect(() => {
    // Redirect to dashboard or complete-profile if user is already authenticated
    if (!isLoading && isAuthenticated) {
      const savedUser = localStorage.getItem("user");
      if (savedUser) {
        const userData = JSON.parse(savedUser);
        if (!userData.profile_completed) {
          router.push("/login");
        } else {
          router.push("/dashboard");
        }
      } else {
        router.push("/login");
      }
    }
  }, [isAuthenticated, isLoading, router]);

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <main className="min-h-screen bg-white flex items-center justify-center p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </main>
    );
  }

  // If authenticated, don't render the home page (redirect will happen)
  if (isAuthenticated) {
    return null;
  }

  const chapters = homeContent?.product_chapters?.length ? homeContent.product_chapters : DEFAULT_CHAPTERS;
  const hero = homeContent?.hero || null;
  const features = homeContent?.features || null;
  const showcase = homeContent?.showcase || null;
  const howItWorks = homeContent?.how_it_works || null;
  const footer = homeContent?.footer || null;

  return (
    <div className="min-h-screen bg-white overflow-x-hidden">
      <Navigation />
      <HeroSection hero={hero} />

      {/* Product Story Chapters */}
      <div id="product" className="pt-0 sm:pt-0">
        {chapters.map((ch, i) => (
          <ProductChapter
            key={i}
            title={ch.title}
            description={ch.description}
            imageSrc={ch.image_url}
            imageAlt={ch.image_alt}
            imagePosition={ch.image_position || "right"}
          />
        ))}
      </div>

      <FeatureGrid features={features} />
      <BeforeAfter />
      <ShowcaseSection showcase={showcase} />

      <div id="how-it-works">
        <HowItWorks howItWorks={howItWorks} />
      </div>

      <div id="pricing">
        <PricingSection />
      </div>

      <Footer footer={footer} />
    </div>
  );
};

export default Home;
