"use client"

import { useState } from "react"
import { Maximize2 } from "lucide-react"

const DIMENSION_OPTIONS = [
    { value: "1:1", label: "1:1", ratio: "Square" },
    { value: "16:9", label: "16:9", ratio: "Wide" },
    { value: "4:5", label: "4:5", ratio: "Portrait" },
    { value: "9:16", label: "9:16", ratio: "Vertical" },
    { value: "3:4", label: "3:4", ratio: "Portrait" },
    { value: "custom", label: "Custom", ratio: "" },
]

const RATIO_REGEX = /^\d+:\d+$/

/** Normalize "5 : 4" or "5: 4" to "5:4" for API */
export function normalizeRatio(input) {
    if (!input || typeof input !== "string") return ""
    const trimmed = input.trim().replace(/\s*:\s*/, ":")
    return trimmed
}

/** Use at submit: returns dimension to send to API, or null if custom selected but invalid */
export function getDimensionForSubmit(selectedDimension, customDimensionInput) {
    if (selectedDimension !== "custom") return selectedDimension
    const normalized = normalizeRatio(customDimensionInput || "")
    return RATIO_REGEX.test(normalized) ? normalized : null
}

function isValidRatio(value) {
    return RATIO_REGEX.test(normalizeRatio(value))
}

function isPresetRatio(value) {
    return DIMENSION_OPTIONS.some(
        (o) => o.value !== "custom" && o.value === value
    )
}

export function DimensionsSelector({
    selectedDimension,
    onDimensionChange,
    customDimensionInput = "",
    onCustomDimensionChange,
    primaryColor = "#884cff",
}) {
    const [localCustom, setLocalCustom] = useState("")
    const isControlled = onCustomDimensionChange != null
    const customRatio = isControlled ? (customDimensionInput ?? "") : localCustom

    const isCustomRatio =
        selectedDimension?.includes(":") && !isPresetRatio(selectedDimension)
    const showCustomInput =
        selectedDimension === "custom" || isCustomRatio

    const inputValue =
        selectedDimension === "custom" || customRatio !== selectedDimension
            ? customRatio
            : selectedDimension

    const syncDimensionToParent = (raw) => {
        const normalized = normalizeRatio(raw)
        if (RATIO_REGEX.test(normalized)) {
            onDimensionChange(normalized)
        } else if (!raw.trim() && selectedDimension !== "custom") {
            onDimensionChange("custom")
        }
    }

    const handleCustomRatioChange = (e) => {
        const raw = e.target.value
        if (isControlled) {
            onCustomDimensionChange(raw)
            syncDimensionToParent(raw)
        } else {
            setLocalCustom(raw)
            syncDimensionToParent(raw)
        }
    }

    const handleCustomRatioBlur = () => {
        const normalized = normalizeRatio(customRatio)
        if (normalized) {
            if (isControlled) {
                onCustomDimensionChange(normalized)
                if (RATIO_REGEX.test(normalized)) onDimensionChange(normalized)
            } else {
                setLocalCustom(normalized)
                if (RATIO_REGEX.test(normalized)) onDimensionChange(normalized)
            }
        }
    }

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
                            (selectedDimension === "custom" || isCustomRatio))

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

            {/* Custom input: single field, value sent to API as a:b */}
            {showCustomInput && (
                <div className="mt-3 flex items-center gap-3 justify-end">
                    <input
                        type="text"
                        placeholder="e.g. 16:9 or 3:2"
                        value={inputValue}
                        onChange={handleCustomRatioChange}
                        onBlur={handleCustomRatioBlur}
                        className="w-36 px-4 py-2.5 rounded-xl border border-gray-300 bg-white text-gray-800 text-left
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
                !isCustomRatio && (
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