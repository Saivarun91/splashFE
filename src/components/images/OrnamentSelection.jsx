"use client"

import { Ruler, Sparkles } from "lucide-react"
import { getOrnamentFittingRules, ORNAMENT_TYPES as ORNAMENT_TYPES_BASE } from "@/lib/ornamentRules"
import { OrnamentTypeSelect } from "@/components/images/OrnamentTypeSelect"

// Measurement definitions by ornament type id (used when ornament has measurements)
const ORNAMENT_MEASUREMENTS = {
    anklets: [
        { id: "circumference", label: "Circumference", placeholder: "e.g., 22cm", unit: "cm" },
        { id: "width", label: "Width", placeholder: "e.g., 0.8cm", unit: "cm" }
    ],
    armlet: [
        { id: "circumference", label: "Circumference", placeholder: "e.g., 25cm", unit: "cm" },
        { id: "width", label: "Width", placeholder: "e.g., 2cm", unit: "cm" }
    ],
    bangle: [
        { id: "diameter", label: "Diameter", placeholder: "e.g., 6cm", unit: "cm" },
        { id: "width", label: "Width", placeholder: "e.g., 1.5cm", unit: "cm" }
    ],
    bib_necklace: [
        { id: "length", label: "Length", placeholder: "e.g., 50cm", unit: "cm" },
        { id: "width", label: "Width", placeholder: "e.g., 8cm", unit: "cm" }
    ],
    black_beads_necklace: [
        { id: "length", label: "Length", placeholder: "e.g., 45cm", unit: "cm" },
        { id: "bead_size", label: "Bead Size", placeholder: "e.g., 0.5cm", unit: "cm" }
    ],
    bracelet: [
        { id: "circumference", label: "Circumference", placeholder: "e.g., 18cm", unit: "cm" },
        { id: "width", label: "Width", placeholder: "e.g., 1cm", unit: "cm" }
    ],
    chandbali: [
        { id: "length", label: "Length", placeholder: "e.g., 6cm", unit: "cm" },
        { id: "width", label: "Width", placeholder: "e.g., 3cm", unit: "cm" }
    ],
    charm: [
        { id: "length", label: "Length", placeholder: "e.g., 2cm", unit: "cm" },
        { id: "width", label: "Width", placeholder: "e.g., 1.5cm", unit: "cm" }
    ],
    choker: [
        { id: "length", label: "Length", placeholder: "e.g., 30cm", unit: "cm" },
        { id: "width", label: "Width", placeholder: "e.g., 3cm", unit: "cm" }
    ],
    cocktail_ring: [
        { id: "size", label: "Ring Size", placeholder: "e.g., 7", unit: "" },
        { id: "stone_size", label: "Stone Size", placeholder: "e.g., 1cm", unit: "cm" }
    ],
    collar_necklace: [
        { id: "length", label: "Length", placeholder: "e.g., 35cm", unit: "cm" },
        { id: "width", label: "Width", placeholder: "e.g., 4cm", unit: "cm" }
    ],
    damini: [
        { id: "length", label: "Length", placeholder: "e.g., 4cm", unit: "cm" },
        { id: "width", label: "Width", placeholder: "e.g., 2cm", unit: "cm" }
    ],
    delicate_necklace: [
        { id: "length", label: "Length", placeholder: "e.g., 40cm", unit: "cm" },
        { id: "width", label: "Width", placeholder: "e.g., 1cm", unit: "cm" }
    ],
    delicate_ring: [
        { id: "size", label: "Ring Size", placeholder: "e.g., 7", unit: "" },
        { id: "width", label: "Band Width", placeholder: "e.g., 0.3cm", unit: "cm" }
    ],
    drop_earrings: [
        { id: "length", label: "Length", placeholder: "e.g., 5cm", unit: "cm" },
        { id: "width", label: "Width", placeholder: "e.g., 1.5cm", unit: "cm" }
    ],
    ear_chain: [
        { id: "length", label: "Length", placeholder: "e.g., 8cm", unit: "cm" },
        { id: "thickness", label: "Thickness", placeholder: "e.g., 0.1cm", unit: "cm" }
    ],
    ear_cuff: [
        { id: "length", label: "Length", placeholder: "e.g., 3cm", unit: "cm" },
        { id: "width", label: "Width", placeholder: "e.g., 2cm", unit: "cm" }
    ],
    hair_brooch: [
        { id: "length", label: "Length", placeholder: "e.g., 5cm", unit: "cm" },
        { id: "width", label: "Width", placeholder: "e.g., 3cm", unit: "cm" }
    ],
    hand_chain: [
        { id: "length", label: "Length", placeholder: "e.g., 20cm", unit: "cm" },
        { id: "thickness", label: "Thickness", placeholder: "e.g., 0.2cm", unit: "cm" }
    ],
    hasli: [
        { id: "length", label: "Length", placeholder: "e.g., 35cm", unit: "cm" },
        { id: "width", label: "Width", placeholder: "e.g., 4cm", unit: "cm" }
    ],
    hoop_earrings: [
        { id: "diameter", label: "Diameter", placeholder: "e.g., 3cm", unit: "cm" },
        { id: "thickness", label: "Thickness", placeholder: "e.g., 0.2cm", unit: "cm" }
    ],
    huggie_earrings: [
        { id: "diameter", label: "Diameter", placeholder: "e.g., 1.5cm", unit: "cm" },
        { id: "thickness", label: "Thickness", placeholder: "e.g., 0.2cm", unit: "cm" }
    ],
    invisible_chain: [
        { id: "length", label: "Length", placeholder: "e.g., 40cm", unit: "cm" }
    ],
    jhumka_earrings: [
        { id: "length", label: "Length", placeholder: "e.g., 4cm", unit: "cm" },
        { id: "width", label: "Width", placeholder: "e.g., 2cm", unit: "cm" }
    ],
    juda_pin: [
        { id: "length", label: "Length", placeholder: "e.g., 5cm", unit: "cm" },
        { id: "width", label: "Width", placeholder: "e.g., 3cm", unit: "cm" }
    ],
    kada: [
        { id: "diameter", label: "Diameter", placeholder: "e.g., 6cm", unit: "cm" },
        { id: "width", label: "Width", placeholder: "e.g., 2cm", unit: "cm" }
    ],
    kamarbandh_layers: [
        { id: "circumference", label: "Circumference", placeholder: "e.g., 75cm", unit: "cm" },
        { id: "width", label: "Width", placeholder: "e.g., 4cm", unit: "cm" }
    ],
    knuckle_ring: [
        { id: "size", label: "Ring Size", placeholder: "e.g., 5", unit: "" }
    ],
    latkan_earrings: [
        { id: "length", label: "Length", placeholder: "e.g., 8cm", unit: "cm" },
        { id: "width", label: "Width", placeholder: "e.g., 2cm", unit: "cm" }
    ],
    layered_necklace: [
        { id: "length_1", label: "First Layer", placeholder: "e.g., 35cm", unit: "cm" },
        { id: "length_2", label: "Second Layer", placeholder: "e.g., 40cm", unit: "cm" }
    ],
    long_necklace: [
        { id: "length", label: "Length", placeholder: "e.g., 60cm", unit: "cm" },
        { id: "width", label: "Width", placeholder: "e.g., 2cm", unit: "cm" }
    ],
    maang_tikka: [
        { id: "length", label: "Length", placeholder: "e.g., 8cm", unit: "cm" },
        { id: "width", label: "Width", placeholder: "e.g., 2cm", unit: "cm" }
    ],
    mangalsutra: [
        { id: "length", label: "Length", placeholder: "e.g., 45cm", unit: "cm" },
        { id: "bead_size", label: "Bead Size", placeholder: "e.g., 0.5cm", unit: "cm" }
    ],
    matha_patti: [
        { id: "length", label: "Length", placeholder: "e.g., 25cm", unit: "cm" },
        { id: "width", label: "Width", placeholder: "e.g., 3cm", unit: "cm" }
    ],
    nath: [
        { id: "diameter", label: "Diameter", placeholder: "e.g., 3cm", unit: "cm" },
        { id: "chain_length", label: "Chain Length", placeholder: "e.g., 15cm", unit: "cm" }
    ],
    necklace_set: [
        { id: "length", label: "Length", placeholder: "e.g., 45cm", unit: "cm" },
        { id: "width", label: "Width", placeholder: "e.g., 2cm", unit: "cm" }
    ],
    nose_pin: [
        { id: "length", label: "Length", placeholder: "e.g., 2cm", unit: "cm" },
        { id: "diameter", label: "Diameter", placeholder: "e.g., 0.5cm", unit: "cm" }
    ],
    nose_ring: [
        { id: "diameter", label: "Diameter", placeholder: "e.g., 1cm", unit: "cm" },
        { id: "thickness", label: "Thickness", placeholder: "e.g., 0.1cm", unit: "cm" }
    ],
    passa: [
        { id: "length", label: "Length", placeholder: "e.g., 10cm", unit: "cm" },
        { id: "width", label: "Width", placeholder: "e.g., 3cm", unit: "cm" }
    ],
    payal_ghungroo: [
        { id: "circumference", label: "Circumference", placeholder: "e.g., 22cm", unit: "cm" },
        { id: "width", label: "Width", placeholder: "e.g., 1cm", unit: "cm" }
    ],
    pendant: [
        { id: "length", label: "Length", placeholder: "e.g., 4cm", unit: "cm" },
        { id: "width", label: "Width", placeholder: "e.g., 2.5cm", unit: "cm" }
    ],
    pendant_necklace: [
        { id: "length", label: "Length", placeholder: "e.g., 45cm", unit: "cm" },
        { id: "pendant_size", label: "Pendant Size", placeholder: "e.g., 3x2cm", unit: "cm" }
    ],
    pendant_necklace_set: [
        { id: "length", label: "Length", placeholder: "e.g., 45cm", unit: "cm" },
        { id: "pendant_size", label: "Pendant Size", placeholder: "e.g., 3x2cm", unit: "cm" }
    ],
    rani_haar: [
        { id: "length", label: "Length", placeholder: "e.g., 90cm", unit: "cm" },
        { id: "width", label: "Width", placeholder: "e.g., 5cm", unit: "cm" }
    ],
    ring: [
        { id: "size", label: "Ring Size", placeholder: "e.g., 7", unit: "" },
        { id: "width", label: "Band Width", placeholder: "e.g., 0.5cm", unit: "cm" }
    ],
    septum_ring: [
        { id: "diameter", label: "Diameter", placeholder: "e.g., 1cm", unit: "cm" },
        { id: "thickness", label: "Thickness", placeholder: "e.g., 0.1cm", unit: "cm" }
    ],
    sheeshphool: [
        { id: "length", label: "Length", placeholder: "e.g., 15cm", unit: "cm" },
        { id: "width", label: "Width", placeholder: "e.g., 8cm", unit: "cm" }
    ],
    short_necklace: [
        { id: "length", label: "Length", placeholder: "e.g., 35cm", unit: "cm" },
        { id: "width", label: "Width", placeholder: "e.g., 2cm", unit: "cm" }
    ],
    stacked_bangles_set: [
        { id: "diameter", label: "Diameter", placeholder: "e.g., 6cm", unit: "cm" },
        { id: "count", label: "Number of Bangles", placeholder: "e.g., 5", unit: "" }
    ],
    stud_earrings: [
        { id: "diameter", label: "Diameter", placeholder: "e.g., 1cm", unit: "cm" },
        { id: "height", label: "Height", placeholder: "e.g., 0.5cm", unit: "cm" }
    ],
    toe_rings: [
        { id: "size", label: "Size", placeholder: "e.g., 6", unit: "" }
    ],
    torque_necklace: [
        { id: "length", label: "Length", placeholder: "e.g., 40cm", unit: "cm" },
        { id: "width", label: "Width", placeholder: "e.g., 3cm", unit: "cm" }
    ],
    traditional_ring: [
        { id: "size", label: "Ring Size", placeholder: "e.g., 7", unit: "" },
        { id: "width", label: "Band Width", placeholder: "e.g., 0.8cm", unit: "cm" }
    ],
    waist_band: [
        { id: "circumference", label: "Circumference", placeholder: "e.g., 70cm", unit: "cm" },
        { id: "width", label: "Width", placeholder: "e.g., 3cm", unit: "cm" }
    ]
};

// Build ORNAMENT_TYPES from ornamentRules (category-wise, alphabetical) with measurements
const ORNAMENT_TYPES = ORNAMENT_TYPES_BASE.map(({ id, name }) => ({
    id,
    name,
    icon: "",
    measurements: ORNAMENT_MEASUREMENTS[id] || []
}));


export function OrnamentSelection({
    selectedType,
    onTypeChange,
    measurements,
    onMeasurementsChange,
    className = ""
}) {
    const selectedOrnament = ORNAMENT_TYPES.find(type => type.id === selectedType)

    const handleTypeSelect = (typeId) => {
        onTypeChange(typeId)
        onMeasurementsChange({})
    }

    const handleMeasurementChange = (measurementId, value) => {
        onMeasurementsChange({
            ...measurements,
            [measurementId]: value
        })
    }

    const getMeasurementValue = (measurementId) => {
        return measurements[measurementId] || ""
    }

    const getFittingRules = (ornamentType) => {
        return getOrnamentFittingRules(ornamentType)
    }

    return (
        <div className={`space-y-4 ${className}`}>
            {/* Ornament Type Selection - same expand-on-click UI everywhere */}
            <div>
                <label className="block text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-gold-solid" />
                    Ornament Type <span className="text-red-500">*</span>
                </label>
                <OrnamentTypeSelect
                    selectedType={selectedType}
                    onTypeChange={handleTypeSelect}
                    placeholder="Select ornament type"
                    showLabel={false}
                />
            </div>

            {/* Measurements */}
            {selectedOrnament && (
                <div>
                    <label className="block text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                        <Ruler className="w-4 h-4 text-gold-solid" />
                        Measurements (Optional)
                    </label>
                    <p className="text-xs text-muted-foreground mb-2">
                        💡 Providing accurate measurements helps generate more realistic images
                    </p>
                    <div className="grid grid-cols-1 gap-3">
                        {selectedOrnament.measurements.map((measurement) => (
                            <div key={measurement.id} className="flex items-center gap-2">
                                <label className="text-sm text-muted-foreground min-w-[120px]">
                                    {measurement.label}:
                                </label>
                                <div className="flex-1 flex items-center gap-2">
                                    <input
                                        type="text"
                                        placeholder={measurement.placeholder}
                                        value={getMeasurementValue(measurement.id)}
                                        onChange={(e) => handleMeasurementChange(measurement.id, e.target.value)}
                                        className="flex-1 px-3 py-2 border border-input rounded-lg bg-input text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-all text-sm"
                                    />
                                    {measurement.unit && (
                                        <span className="text-sm text-muted-foreground min-w-[20px]">
                                            {measurement.unit}
                                        </span>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                    
                </div>
            )}

            {/* Fitting Rules Display */}
            {/* {selectedOrnament && (
                <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-purple-600" />
                        Fitting Guidelines
                    </label>
                    <div className="bg-purple-50 border border-purple-200 rounded-xl p-4">
                        <p className="text-sm text-gray-700 leading-relaxed">
                            {getFittingRules(selectedOrnament.id)}
                        </p>
                        <p className="text-xs text-purple-600 mt-2 font-medium">
                            ✨ These guidelines will be automatically applied to ensure realistic ornament fitting
                        </p>
                    </div>
                </div>
            )} */}
        </div>
    )
}

export { ORNAMENT_TYPES }
