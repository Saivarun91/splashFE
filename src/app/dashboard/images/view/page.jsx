"use client"

import { useEffect, useMemo, useState } from "react"
import { useSearchParams } from "next/navigation"
import Image from "next/image"
import { ChevronLeft, ChevronRight } from "lucide-react"

export default function ImageViewerPage() {
  const searchParams = useSearchParams()
  const [images, setImages] = useState([])
  const [activeIndex, setActiveIndex] = useState(0)

  useEffect(() => {
    const key = searchParams.get("key")
    if (!key) return

    const payload = window.sessionStorage.getItem(`image-viewer:${key}`)
    if (!payload) return

    try {
      const parsed = JSON.parse(payload)
      const parsedImages = Array.isArray(parsed?.images) ? parsed.images : []
      const nextIndex = Number(parsed?.initialIndex) || 0

      setImages(parsedImages)
      setActiveIndex(
        Math.min(Math.max(nextIndex, 0), Math.max(parsedImages.length - 1, 0))
      )
    } catch (error) {
      console.error("Failed to load viewer payload:", error)
    }
  }, [searchParams])

  const activeImage = useMemo(() => images[activeIndex], [images, activeIndex])

  const goPrev = () => {
    setActiveIndex((prev) => (prev > 0 ? prev - 1 : prev))
  }

  const goNext = () => {
    setActiveIndex((prev) => (prev < images.length - 1 ? prev + 1 : prev))
  }

  if (!activeImage) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="bg-card rounded-xl border border-border p-8 text-center">
          <h1 className="text-xl font-semibold text-foreground mb-2">
            Image not found
          </h1>
          <p className="text-muted-foreground">
            Please open this page from the View button in the dashboard.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-4">
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">
            Image Viewer
          </h1>
          <p className="text-muted-foreground">
            {activeIndex + 1} / {images.length}
            {/* {activeImage?.label ? ` - ${activeImage.label}` : ""} */}
            
          </p>
        </div>

        <div className="relative bg-card rounded-xl border border-border overflow-hidden">
          <div className="relative w-full h-[65vh] min-h-[420px]">
            <Image
              src={activeImage.url}
              alt={activeImage.label || "Selected image"}
              fill
              className="object-contain bg-secondary/30"
              priority
            />
          </div>

          <button
            type="button"
            onClick={goPrev}
            disabled={activeIndex === 0}
            className="absolute left-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-card border border-border text-foreground hover:bg-accent disabled:opacity-40 disabled:cursor-not-allowed"
            aria-label="Previous image"
          >
            <ChevronLeft className="w-5 h-5 text-foreground" />
          </button>

          <button
            type="button"
            onClick={goNext}
            disabled={activeIndex === images.length - 1}
            className="absolute right-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-card border border-border text-foreground hover:bg-accent disabled:opacity-40 disabled:cursor-not-allowed"
            aria-label="Next image"
          >
            <ChevronRight className="w-5 h-5 text-foreground" />
          </button>
        </div>

        {images.length > 1 && (
          <div className="mt-4 flex gap-3 overflow-x-auto pb-2 thumbnail-scroll scroll-smooth">
            {images.map((image, index) => (
              <button
                type="button"
                key={`${image.url}-${index}`}
                onClick={() => setActiveIndex(index)}
                className={`relative w-24 h-24 rounded-xl overflow-hidden border-2 shrink-0 ${
                  index === activeIndex
                    ? "border-gold-muted"
                    : "border-border hover:border-border"
                }`}
                title={image.label || `Image ${index + 1}`}
              >
                <Image
                  src={image.url}
                  alt={image.label || `Image ${index + 1}`}
                  fill
                  className="object-cover"
                />
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
