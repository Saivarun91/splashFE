
"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { ChevronRight, Menu } from "lucide-react";

const defaultHeroImages = [
  "/images/hero-campaign-01.jpg",
  "/images/hero-campaign-02.jpg",
  "/images/hero-campaign-03.jpg",
];

const HeroSection = ({ hero: heroContent }) => {
  const [currentImage, setCurrentImage] = useState(0);
  const [scrolledPastHero, setScrolledPastHero] = useState(false);
  const heroRef = useRef(null);

  const heroImages = heroContent?.images?.length ? heroContent.images : defaultHeroImages;
  const title = heroContent?.title ?? "CAMPAIGN READY VISUALS, WITHOUT THE SHOOT";
  const ctaPrimaryText = heroContent?.cta_primary_text ?? "Try Free Splash AI";
  const ctaPrimaryHref = heroContent?.cta_primary_href ?? "/login";
  const ctaSecondaryText = heroContent?.cta_secondary_text ?? "See Showcase";
  const ctaSecondaryHref = heroContent?.cta_secondary_href ?? "#showcase";
  const bottomText = heroContent?.bottom_text ?? "Moodboard to model shots to perfect retouches— Splash AI Studio turns your concepts into stunning, shoppable imagery.";

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImage((prev) => (prev + 1) % heroImages.length);
    }, 5000);

    const handleScroll = () => {
      if (heroRef.current) {
        const heroBottom = heroRef.current.getBoundingClientRect().bottom;
        setScrolledPastHero(heroBottom < window.innerHeight - 50);
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => {
      clearInterval(interval);
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  return (
    <section
      ref={heroRef}
      className="relative w-full overflow-hidden bg-white pt-12 lg:pt-14"
    >
      {/* Top Content */}
      <div className="max-w-screen-xl mx-auto px-6 lg:px-12 py-2 lg:py-3 text-center relative z-10">
        <h1 className="text-[1.3rem] lg:text-[1.6rem] font-bold my-4 text-transparent bg-clip-text bg-gradient-to-br from-[#5533FF] via-[#863FFF] to-[#C44DFF] animate-slideFadeIn">
          {title}
        </h1>

        <div className="flex flex-col sm:flex-row gap-2 justify-center mb-0">
          <Link
            href={ctaPrimaryHref}
            className="inline-flex items-center justify-center bg-gradient-to-br from-[#5533FF] via-[#863FFF] to-[#C44DFF] text-white font-medium rounded-xl hover:bg-purple-600 transition-colors sm:flex-1 sm:max-w-[180px] animate-slideFadeIn delay-100"
          >
            {ctaPrimaryText}
            <ChevronRight className="ml-2" size={20} />
          </Link>
          <a
            href={ctaSecondaryHref}
            className="inline-flex items-center justify-center px-4 py-2 border-2 border-gray-300 rounded text-gray-800 hover:bg-gray-100 transition-colors sm:flex-1 sm:max-w-[180px] animate-slideFadeIn delay-200"
          >
            {ctaSecondaryText}
          </a>
        </div>
      </div>

      {/* Image Carousel in Middle */}
      <div className="relative h-[70vh] lg:h-[80vh] w-full overflow-hidden">
        {heroImages.map((image, index) => (
          <div
            key={index}
            className={`absolute inset-0 transition-opacity duration-1000 ease-in-out transform-gpu ${index === currentImage ? "opacity-100 scale-100" : "opacity-0 scale-105"
              } will-change-transform will-change-opacity`}
          >
            <img
              src={image}
              alt={`Luxury jewelry campaign ${index + 1}`}
              className="w-full h-full object-cover rounded-xl shadow-lg"
              draggable={false}
            />
          </div>
        ))}

        {/* Carousel Indicators */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-10">
          {heroImages.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentImage(index)}
              className={`h-1 rounded-full transition-all duration-300 ${index === currentImage ? "w-8 bg-[#A64DFF]" : "w-1 bg-[#A64DFF]/50"
                }`}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      </div>

      {/* Bottom Text (smaller size) */}
      <div className="max-w-screen-xl mx-auto px-6 lg:px-12 py-3 text-center relative z-10">
        <p className="text-[0.95rem] lg:text-[1.1rem] max-w-2xl mx-auto text-black animate-slideFadeIn">
          {bottomText}
        </p>
      </div>

      {/* Fixed Bottom Glassy Bar */}
      <div
        className={`fixed bottom-3 sm:bottom-6 left-1/2 -translate-x-1/2 z-20 transition-all duration-500 ease-in-out w-[95%] sm:w-auto max-w-[95vw] ${scrolledPastHero ? "opacity-100 translate-y-0 animate-slideUpIn" : "opacity-0 -translate-y-6 pointer-events-none"
          }`}
      >
        <div className="flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-3 bg-white/60 backdrop-blur-md px-3 sm:px-5 py-2.5 sm:py-3 rounded-xl shadow-lg border border-white/20">
          <span className="text-[0.75rem] sm:text-[0.95rem] font-bold text-transparent bg-clip-text bg-gradient-to-br from-[#5533FF] via-[#863FFF] to-[#C44DFF] animate-slideFadeIn text-center sm:text-left whitespace-normal sm:whitespace-nowrap">
            {title}
          </span>
          <div className="flex items-center gap-2 w-full sm:w-auto justify-center sm:justify-start">
            <Link
              href={ctaPrimaryHref}
              className="inline-flex items-center justify-center bg-gradient-to-br from-[#5533FF] via-[#863FFF] to-[#C44DFF] text-white text-xs sm:text-sm font-medium rounded-xl px-3 sm:px-3 py-1.5 sm:py-2 hover:bg-purple-600 transition-colors animate-slideFadeIn delay-100 flex-1 sm:flex-initial"
            >
              {ctaPrimaryText}
              <ChevronRight className="ml-1" size={14} />
            </Link>
            <a
              href={ctaSecondaryHref}
              className="inline-flex items-center justify-center px-3 py-1.5 sm:py-2 border-2 border-gray-300 rounded text-gray-800 text-xs sm:text-sm hover:bg-gray-100 transition-colors animate-slideFadeIn delay-200 flex-1 sm:flex-initial"
            >
              {ctaSecondaryText}
            </a>
          </div>
        </div>
      </div>
      
        

      {/* Animations */}
      <style jsx>{`
        @keyframes slideFadeIn {
          0% { opacity: 0; transform: translateY(20px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        .animate-slideFadeIn {
          animation: slideFadeIn 0.8s ease-out forwards;
        }

        @keyframes slideUpIn {
          0% { opacity: 0; transform: translateY(20px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        .animate-slideUpIn {
          animation: slideUpIn 0.6s ease-out forwards;
        }
      `}</style>

      
    </section>
  );
};

export default HeroSection;
