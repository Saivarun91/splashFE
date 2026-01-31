"use client"

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import Image from "next/image"

// Two reference images showing product image kept aside of scale for better result
const REFERENCE_IMAGES = [
  { src: "/images/reference2.png", alt: "Reference 1 - Product image aside scale" },
  { src: "/images/reference1.png", alt: "Reference 2 - Product image aside scale" },
]

export function ReferenceImagesModal({ open, onOpenChange }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-lg">Reference images</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-gray-600 mb-4">
          Upload the product image which is captured in the similar way as the reference images for better result.
          <br /> <span className="font-bold">Examples:</span>
        </p>
        <div className="grid grid-cols-2 gap-4">
          {REFERENCE_IMAGES.map((img, index) => (
            <div key={index} className="relative aspect-square rounded-lg overflow-hidden border border-gray-200 bg-gray-50">
              <Image
                src={img.src}
                alt={img.alt}
                fill
                className="object-contain"
                sizes="(max-width: 768px) 100vw, 320px"
              />
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  )
}
