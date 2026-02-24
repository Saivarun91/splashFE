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
        ? "w-full px-2 py-1.5 text-sm border border-gray-200 rounded-lg bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent flex items-center justify-between hover:border-gray-300"
        : "w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all flex items-center justify-between hover:border-gray-300"

    return (
        <div className={`relative ${className}`} ref={dropdownRef}>
            {showLabel && (
                <label className="block text-xs font-medium text-gray-600 mb-1">
                    {label}
                </label>
            )}
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className={btnClasses}
            >
                <div className="flex items-center gap-2 min-w-0 flex-1">
                    <Sparkles className={`text-purple-600 flex-shrink-0 ${isCompact ? "w-3 h-3" : "w-3.5 h-3.5"}`} />
                    {selectedOrnament ? (
                        <span className="truncate text-left">
                            {selectedOrnament.category} – {selectedOrnament.name}
                        </span>
                    ) : (
                        <span className="text-gray-400">{placeholder}</span>
                    )}
                </div>
                <ChevronDown className={`text-gray-400 flex-shrink-0 ml-2 transition-transform ${isCompact ? "w-3.5 h-3.5" : "w-4 h-4"} ${isOpen ? "rotate-180" : ""}`} />
            </button>

            {isOpen && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-64 overflow-y-auto">
                    {Object.entries(ORNAMENT_CATEGORIES).map(([category, items]) => {
                        const isExpanded = expandedCategories.has(category)
                        return (
                            <div key={category}>
                                <button
                                    type="button"
                                    onClick={() => toggleCategory(category)}
                                    className="w-full px-3 py-2 text-sm text-left hover:bg-gray-50 flex items-center justify-between transition-colors border-b border-gray-100 last:border-b-0"
                                >
                                    <span className="font-semibold text-gray-800">{category}</span>
                                    {isExpanded ? (
                                        <ChevronDown className="w-3.5 h-3.5 text-gray-500" />
                                    ) : (
                                        <ChevronRight className="w-3.5 h-3.5 text-gray-500" />
                                    )}
                                </button>
                                {isExpanded && (
                                    <div className="bg-gray-50">
                                        {items.map((item) => (
                                            <button
                                                key={item.id}
                                                type="button"
                                                onClick={() => handleTypeSelect(item.id)}
                                                className={`w-full px-6 py-1.5 text-sm text-left hover:bg-purple-50 flex items-center gap-2 transition-colors ${
                                                    selectedType === item.id ? "bg-purple-100 text-purple-700 font-medium" : "text-gray-700"
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
