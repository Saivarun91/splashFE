"use client"

import { useState } from "react"
import { Maximize2 } from "lucide-react"

const DIMENSION_OPTIONS = [
    { value: "1:1", label: "1:1", ratio: "Square" , name:"Profile pictures"},
    { value: "16:9", label: "16:9", ratio: "Wide" , name:"Website banners"},
    { value: "4:5", label: "4:5", ratio: "Portrait" , name:"Social media"},
    { value: "9:16", label: "9:16", ratio: "Vertical" , name:"Reels / Stories"},
    { value: "3:4", label: "3:4", ratio: "Portrait" , name:"Posters / Magazine"},
]

export function DimensionsSelector({ selectedDimension, onDimensionChange, primaryColor = "#884cff" }) {
    return (
        <div>
            <label className="block text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                <Maximize2 size={20} className="text-[#884cff]" style={{ color: primaryColor }} />
                Image Dimensions
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                {DIMENSION_OPTIONS.map((option) => (
                    <button
                        key={option.value}
                        type="button"
                        onClick={() => onDimensionChange(option.value)}
                        className={`p-3 sm:p-4 rounded-xl font-semibold transition-all duration-300 border-2 text-center min-h-[88px] flex flex-col items-center justify-center ${
                            selectedDimension === option.value
                                ? "border-[#884cff] bg-[#884cff]/10 text-[#884cff] shadow-md"
                                : "border-[#e6e6e6] bg-white text-gray-700 hover:border-[#884cff]/50 hover:bg-[#884cff]/5"
                        }`}
                        style={
                            selectedDimension === option.value
                                ? {
                                      borderColor: primaryColor,
                                      backgroundColor: `${primaryColor}10`,
                                      color: primaryColor,
                                  }
                                : {}
                        }
                    >
                        <div className="text-lg font-bold leading-none">{option.label}</div>
                        <div className="text-xs text-gray-500 mt-1 leading-tight">{option.ratio}</div>
                        <div className="text-[11px] text-gray-500 mt-1 leading-tight">{option.name}</div>
                    </button>
                ))}
            </div>
            {selectedDimension && (
                <p className="text-sm text-gray-500 mt-3">
                    Selected: <span className="font-semibold text-[#884cff]" style={{ color: primaryColor }}>{selectedDimension}</span> aspect ratio
                </p>
            )}
        </div>
    )
}

