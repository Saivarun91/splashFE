"use client"

import { useState } from "react"
import { Maximize2 } from "lucide-react"

const DIMENSION_OPTIONS = [
    { value: "1:1", label: "1:1", ratio: "Square" },
    { value: "16:9", label: "16:9", ratio: "Wide" },
    { value: "4:5", label: "4:5", ratio: "Portrait" },
    { value: "9:16", label: "9:16", ratio: "Vertical" },
    { value: "3:4", label: "3:4", ratio: "Portrait" },
]

export function DimensionsSelector({ selectedDimension, onDimensionChange, primaryColor = "#884cff" }) {
    return (
        <div>
            <label className="block text-lg font-semibold text-[#1a1a1a] mb-4 flex items-center gap-2">
                <Maximize2 size={20} className="text-[#884cff]" style={{ color: primaryColor }} />
                Image Dimensions
            </label>
            <div className="grid grid-cols-5 gap-3">
                {DIMENSION_OPTIONS.map((option) => (
                    <button
                        key={option.value}
                        type="button"
                        onClick={() => onDimensionChange(option.value)}
                        className={`px-4 py-3 rounded-xl font-semibold transition-all duration-300 border-2 ${
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
                        <div className="text-lg font-bold">{option.label}</div>
                        <div className="text-xs text-gray-500 mt-1">{option.ratio}</div>
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

