"use client";

import { useState, useEffect, useRef } from "react";
import { ChevronLeft, ChevronRight, ArrowRight } from "lucide-react";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

const AUTO_ADVANCE_DELAY = 10000;
const RESUME_DELAY = 15000;

const BeforeAfter = () => {
  const [images, setImages] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [sliderPositions, setSliderPositions] = useState({});
  const [loading, setLoading] = useState(true);
  const [isPaused, setIsPaused] = useState(false);

  const autoAdvanceRef = useRef(null);
  const resumeRef = useRef(null);

  /* ---------------- Fetch Images ---------------- */
  useEffect(() => {
    fetchImages();
  }, []);

  const fetchImages = async () => {
    try {
      setLoading(true);
      const res = await fetch(
        `${API_BASE_URL}/api/homepage/before-after/`
      );
      const data = await res.json();

      if (data.success && data.images?.length) {
        setImages(data.images);

        const initial = {};
        data.images.forEach((_, i) => (initial[i] = 50));
        setSliderPositions(initial);
      }
    } catch (err) {
      console.error("Failed to fetch images", err);
    } finally {
      setLoading(false);
    }
  };
  

  /* ---------------- Auto Advance ---------------- */
  useEffect(() => {
    if (images.length <= 1 || isPaused) return;

    autoAdvanceRef.current = setInterval(() => {
      setCurrentIndex((prev) => {
        const next = prev === images.length - 1 ? 0 : prev + 1;
        setSliderPositions((p) => ({ ...p, [next]: 50 }));
        return next;
      });
    }, AUTO_ADVANCE_DELAY);

    return () => clearInterval(autoAdvanceRef.current);
  }, [images.length, isPaused]);

  const pauseAutoAdvance = () => {
    setIsPaused(true);
    clearTimeout(resumeRef.current);
    resumeRef.current = setTimeout(
      () => setIsPaused(false),
      RESUME_DELAY
    );
  };

  
  /* ---------------- Handlers ---------------- */
  const handleSliderChange = (value) => {
    const v = Number(value);
  
    // Snap near edges
    const snapped =
      v < 3 ? 0 :
      v > 97 ? 100 :
      v;
  
    setSliderPositions((p) => ({
      ...p,
      [currentIndex]: snapped,
    }));
  
    pauseAutoAdvance();
  };
  const slider = sliderPositions[currentIndex] ?? 50;
  const showLabels = slider <= 70;


  const goToSlide = (index) => {
    setCurrentIndex(index);
    setSliderPositions((p) => ({ ...p, [index]: 50 }));
    pauseAutoAdvance();
  };

  const goToPrev = () =>
    goToSlide(currentIndex === 0 ? images.length - 1 : currentIndex - 1);

  const goToNext = () =>
    goToSlide(currentIndex === images.length - 1 ? 0 : currentIndex + 1);

  /* ---------------- States ---------------- */
  if (loading) {
    return (
      <section className="py-20 text-center">
        <div className="animate-spin h-10 w-10 mx-auto mb-4 rounded-full border-b-2 border-gold-solid" />
        <p className="text-muted-foreground">Loading images…</p>
      </section>
    );
  }

  if (!images.length) return null;

  const currentImage = images[currentIndex];
 

  /* ---------------- Render ---------------- */
  return (
    <section className="py-16 lg:py-20">
      <div className="max-w-screen-2xl mx-auto px-6 lg:px-12">

        {/* Header */}
        <div className="text-center mb-12">
          <h2 className="text-4xl lg:text-5xl font-bold mb-4 text-foreground">
            From packshot to editorial
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Transform basic product photos into stunning campaign visuals.
          </p>
        </div>

        {/* Thumbnails */}
        {/* {images.length > 1 && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-6xl mx-auto mb-10">
            {images.map((img, i) => (
              <button
                key={i}
                onClick={() => goToSlide(i)}
                className={`rounded-lg overflow-hidden shadow-md transition-all ${
                  i === currentIndex
                    ? "ring-4 ring-blue-500 scale-105"
                    : "opacity-70 hover:opacity-100"
                }`}
              >
                <img
                  src={img.after_image_url}
                  className="w-full h-32 object-cover"
                  alt=""
                />
              </button>
            ))}
          </div>
        )} */}

        {/* Main Slider */}
{/* Main Slider with Side Previews */}
<div className="grid grid-cols-1 lg:grid-cols-[1fr_2fr_1fr] gap-6 items-center max-w-6xl mx-auto">

  {/* Left Preview */}
  {images.length > 1 && (
  <div
    onClick={() =>
      goToSlide(
        currentIndex === 0 ? images.length - 1 : currentIndex - 1
      )
    }
    className="hidden lg:block cursor-pointer relative rounded-xl overflow-hidden shadow-lg opacity-60 hover:opacity-100 transition-all duration-300"
  >
    <img
      src={
        images[
          currentIndex === 0 ? images.length - 1 : currentIndex - 1
        ].after_image_url
      }
      className="w-full h-[280px] object-cover hover:scale-105 transition-transform duration-500"
      alt="Preview"
    />
  </div>
)}


  {/* CENTER – Before / After Slider */}
  <div className="relative h-[450px] overflow-hidden rounded-2xl shadow-2xl border border-border bg-card">

{/* AFTER Image (only when slider < 100) */}
{slider < 100 && (
  <img
    src={currentImage.after_image_url}
    className="absolute inset-0 w-full h-full object-cover"
    alt="After"
  />
)}

{/* BEFORE Image (only when slider > 0) */}
{slider > 0 && (
  <div
    className="absolute inset-0 overflow-hidden"
    style={{ width: `${slider}%` }}
  >
    <img
      src={currentImage.before_image_url}
      className="w-full h-full object-cover"
      alt="Before"
    />
  </div>
)}

{/* Divider (hide at edges) */}
{slider > 0 && slider < 100 && (
  <div
    className="absolute top-0 bottom-0 w-1 bg-gold-solid z-20"
    style={{ left: `${slider}%` }}
  >
    <div
      className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2
                 w-12 h-12 bg-gold-gradient rounded-full shadow-xl
                 flex items-center justify-center"
    >
<ArrowRight
  className={`w-6 h-6 text-white transition-transform ${
    slider < 50 ? "rotate-180" : ""
  }`}
/>

    </div>
  </div>
)}

{/* Slider Input */}
<input
  type="range"
  min="0"
  max="100"
  value={slider}
  onChange={(e) => handleSliderChange(e.target.value)}
  className="absolute inset-0 opacity-0 cursor-ew-resize z-30"
/>

{/* Labels */}
{showLabels && slider > 0 && (
  <div className="absolute top-4 left-4 bg-gold-gradient text-primary-foreground px-4 py-1 rounded-full shadow text-sm font-semibold">
    Before
  </div>
)}

{showLabels && slider < 100 && (
  <div className="absolute top-4 right-4 bg-gold-gradient text-primary-foreground px-4 py-1 rounded-full shadow text-sm font-semibold">
    After
  </div>
)}

</div>


  {/* Right Preview */}
  {images.length > 1 && (
  <div
    onClick={() =>
      goToSlide(
        currentIndex === images.length - 1 ? 0 : currentIndex + 1
      )
    }
    className="hidden lg:block cursor-pointer relative rounded-xl overflow-hidden shadow-lg opacity-60 hover:opacity-100 transition-all duration-300"
  >
    <img
      src={
        images[
          currentIndex === images.length - 1 ? 0 : currentIndex + 1
        ].after_image_url
      }
      className="w-full h-[280px] object-cover hover:scale-105 transition-transform duration-500"
      alt="Preview"
    />
  </div>
)}

</div>

      </div>
    </section>
  );
};

export default BeforeAfter;
