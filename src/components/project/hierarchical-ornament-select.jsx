"use client"

import { useCallback } from "react"
import { getOrnamentFittingRules } from "@/lib/ornamentRules"
import { OrnamentTypeSelect } from "@/components/images/OrnamentTypeSelect"

export function HierarchicalOrnamentSelect({ selectedType, onTypeChange, onOrnamentRulesChange, className = "" }) {
    const handleTypeChange = useCallback(
        (typeId) => {
            onTypeChange(typeId)
            const rules = getOrnamentFittingRules(typeId) || ""
            if (onOrnamentRulesChange) onOrnamentRulesChange(rules)
        },
        [onTypeChange, onOrnamentRulesChange]
    )

    return (
        <OrnamentTypeSelect
            selectedType={selectedType}
            onTypeChange={handleTypeChange}
            className={className}
            placeholder="Select type"
            showLabel={false}
        />
    )
}

