"use client"

import { useState, useEffect } from "react"
import { Maximize2 } from "lucide-react"

const DIMENSION_OPTIONS = [
    { value: "1:1", label: "1:1", ratio: "Square" },
    { value: "16:9", label: "16:9", ratio: "Wide" },
    { value: "4:5", label: "4:5", ratio: "Portrait" },
    { value: "9:16", label: "9:16", ratio: "Vertical" },
    { value: "3:4", label: "3:4", ratio: "Portrait" },
    { value: "custom", label: "Custom", ratio: "" },
]

export function DimensionsSelector({
    selectedDimension,
    onDimensionChange,
    primaryColor = "#884cff",
}) {
    const [customWidth, setCustomWidth] = useState("")
    const [customHeight, setCustomHeight] = useState("")

    // When custom values change, update parent
    useEffect(() => {
        if (
            selectedDimension === "custom" &&
            customWidth &&
            customHeight
        ) {
            onDimensionChange(`${customWidth}x${customHeight}`)
        }
    }, [customWidth, customHeight])

    return (
        <div className="w-full">
            {/* Label */}
            <label className="block text-lg font-semibold text-[#1a1a1a] mb-4 flex items-center gap-2">
                <Maximize2
                    size={20}
                    style={{ color: primaryColor }}
                />
                Image Dimensions
            </label>

            {/* Single Row Layout */}
            <div className="flex gap-3 overflow-x-auto pb-2">
                {DIMENSION_OPTIONS.map((option) => {
                    const isSelected =
                        selectedDimension === option.value ||
                        (option.value === "custom" &&
                            selectedDimension?.includes("x"))

                    return (
                        <button
                            key={option.value}
                            type="button"
                            onClick={() =>
                                onDimensionChange(option.value)
                            }
                            className="min-w-[110px] px-4 py-3 rounded-xl font-semibold transition-all duration-300 border-2 bg-white"
                            style={
                                isSelected
                                    ? {
                                          borderColor: primaryColor,
                                          backgroundColor: `${primaryColor}15`,
                                          color: primaryColor,
                                      }
                                    : {
                                          borderColor: "#e6e6e6",
                                          color: "#374151",
                                      }
                            }
                        >
                            <div className="text-lg font-bold">
                                {option.label}
                            </div>
                            <div className="text-xs mt-1 opacity-70">
                                {option.ratio}
                            </div>
                        </button>
                    )
                })}
            </div>

{/* Custom Input Section */}
{(selectedDimension === "custom" ||
  selectedDimension?.includes("x")) && (
  <div className="mt-3 flex items-center gap-3 justify-end">
    <input
      type="number"
      placeholder="Width"
      value={customWidth}
      onChange={(e) => setCustomWidth(e.target.value)}
      className="w-28 px-4 py-2.5 rounded-xl border border-gray-300 bg-white text-gray-800 text-left
                 focus:outline-none focus:ring-2 focus:border-transparent transition-all"
      style={{
        boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
      }}
    />

    <span className="text-gray-400 font-semibold text-lg">×</span>

    <input
      type="number"
      placeholder="Height"
      value={customHeight}
      onChange={(e) => setCustomHeight(e.target.value)}
      className="w-28 px-4 py-2.5 rounded-xl border border-gray-300 bg-white text-gray-800 text-left
                 focus:outline-none focus:ring-2 focus:border-transparent transition-all"
      style={{
        boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
      }}
    />
  </div>
)}

            {/* Selected Info */}
            {selectedDimension &&
                selectedDimension !== "custom" &&
                !selectedDimension.includes("x") && (
                    <p className="text-sm text-gray-500 mt-3">
                        Selected:{" "}
                        <span
                            className="font-semibold"
                            style={{ color: primaryColor }}
                        >
                            {selectedDimension}
                        </span>{" "}
                        aspect ratio
                    </p>
                )}
        </div>
    )
}