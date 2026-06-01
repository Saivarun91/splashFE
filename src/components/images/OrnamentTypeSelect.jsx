"use client"

import { useState, useRef, useEffect } from "react"
import { ChevronDown, ChevronRight, Sparkles } from "lucide-react"
import { ORNAMENT_CATEGORIES } from "@/lib/ornamentRules"

/**
 * Unified ornament type selector - categories first, click category to expand and see items.
 * Same UI used across product upload, image generation, campaign, etc.
 */
export function OrnamentTypeSelect({
    selectedType,
    onTypeChange,
    className = "",
    size = "md",
    placeholder = "Select type",
    label = "Ornament type",
    showLabel = true,
}) {
    const [isOpen, setIsOpen] = useState(false)
    const [expandedCategories, setExpandedCategories] = useState(new Set())
    const dropdownRef = useRef(null)

    const selectedOrnament = Object.entries(ORNAMENT_CATEGORIES)
        .flatMap(([category, items]) => items.map(item => ({ ...item, category })))
        .find(item => item.id === selectedType)

    const handleTypeSelect = (typeId) => {
        onTypeChange(typeId)
        setIsOpen(false)
    }

    const toggleCategory = (category) => {
        setExpandedCategories(prev => {
            const newSet = new Set(prev)
            if (newSet.has(category)) {
                newSet.delete(category)
            } else {
                newSet.add(category)
            }
            return newSet
        })
    }

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false)
            }
        }
        if (isOpen) document.addEventListener("mousedown", handleClickOutside)
        return () => document.removeEventListener("mousedown", handleClickOutside)
    }, [isOpen])

    const isCompact = size === "sm"
    const btnClasses = isCompact
        ? "w-full px-2 py-1.5 text-sm border border-input rounded-lg bg-input text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent flex items-center justify-between hover:border-gold-muted"
        : "w-full px-3 py-2 text-sm border border-input rounded-lg bg-input text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-all flex items-center justify-between hover:border-gold-muted"

    return (
        <div className={`relative ${className}`} ref={dropdownRef}>
            {showLabel && (
                <label className="block text-xs font-medium text-muted-foreground mb-1">
                    {label}
                </label>
            )}
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className={btnClasses}
            >
                <div className="flex items-center gap-2 min-w-0 flex-1">
                    <Sparkles className={`text-gold-solid flex-shrink-0 ${isCompact ? "w-3 h-3" : "w-3.5 h-3.5"}`} />
                    {selectedOrnament ? (
                        <span className="truncate text-left">
                            {selectedOrnament.category} – {selectedOrnament.name}
                        </span>
                    ) : (
                        <span className="text-muted-foreground">{placeholder}</span>
                    )}
                </div>
                <ChevronDown className={`text-muted-foreground flex-shrink-0 ml-2 transition-transform ${isCompact ? "w-3.5 h-3.5" : "w-4 h-4"} ${isOpen ? "rotate-180" : ""}`} />
            </button>

            {isOpen && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-card border border-border rounded-lg shadow-lg z-50 max-h-64 overflow-y-auto">
                    {Object.entries(ORNAMENT_CATEGORIES).map(([category, items]) => {
                        const isExpanded = expandedCategories.has(category)
                        return (
                            <div key={category}>
                                <button
                                    type="button"
                                    onClick={() => toggleCategory(category)}
                                    className="w-full px-3 py-2 text-sm text-left hover:bg-accent flex items-center justify-between transition-colors border-b border-border last:border-b-0"
                                >
                                    <span className="font-semibold text-foreground">{category}</span>
                                    {isExpanded ? (
                                        <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
                                    ) : (
                                        <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />
                                    )}
                                </button>
                                {isExpanded && (
                                    <div className="bg-secondary/50">
                                        {items.map((item) => (
                                            <button
                                                key={item.id}
                                                type="button"
                                                onClick={() => handleTypeSelect(item.id)}
                                                className={`w-full px-6 py-1.5 text-sm text-left hover:bg-accent flex items-center gap-2 transition-colors ${
                                                    selectedType === item.id ? "bg-accent text-gold-solid font-medium" : "text-foreground"
                                                }`}
                                            >
                                                {item.name}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )
                    })}
                </div>
            )}
        </div>
    )
}
