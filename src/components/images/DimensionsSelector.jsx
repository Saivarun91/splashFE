"use client"

import { Maximize2 } from "lucide-react"

const DIMENSION_OPTIONS = [
    { value: "1:1", label: "1:1", ratio: "Square" , name:"Profile pictures"},
    { value: "16:9", label: "16:9", ratio: "Wide" , name:"Website banners"},
    { value: "4:5", label: "4:5", ratio: "Portrait" , name:"Social media"},
    { value: "9:16", label: "9:16", ratio: "Vertical" , name:"Reels / Stories"},
    { value: "3:4", label: "3:4", ratio: "Portrait" , name:"Posters / Magazine"},
]

const GOLD = "#cd9639"

export function DimensionsSelector({ selectedDimension, onDimensionChange, primaryColor = GOLD }) {
    return (
        <div>
            <label className="block text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                <Maximize2 size={20} className="text-gold-solid" style={{ color: primaryColor }} />
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
                                ? "border-gold-solid bg-accent text-gold-solid shadow-md"
                                : "border-border bg-input text-foreground hover:border-gold-muted hover:bg-accent"
                        }`}
                        style={
                            selectedDimension === option.value
                                ? {
                                      borderColor: primaryColor,
                                      backgroundColor: `${primaryColor}18`,
                                      color: primaryColor,
                                  }
                                : {}
                        }
                    >
                        <div className="text-lg font-bold leading-none">{option.label}</div>
                        <div className="text-xs text-muted-foreground mt-1 leading-tight">{option.ratio}</div>
                        <div className="text-[11px] text-muted-foreground mt-1 leading-tight">{option.name}</div>
                    </button>
                ))}
            </div>
            {selectedDimension && (
                <p className="text-sm text-muted-foreground mt-3">
                    Selected: <span className="font-semibold text-gold-solid" style={{ color: primaryColor }}>{selectedDimension}</span> aspect ratio
                </p>
            )}
        </div>
    )
}
