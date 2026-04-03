"use client"

/**
 * Segmented control for choosing how many images to generate (e.g. 1, 2, 3).
 * Use instead of a free-form number input wherever num_images is 1–3.
 */
export function NumberOfImagesSelector({
    value,
    onChange,
    min = 1,
    max = 3,
    primaryColor = "#7753ff",
    className = "",
    buttonClassName = "",
}) {
    const options = []
    for (let n = min; n <= max; n += 1) {
        options.push(n)
    }

    return (
        <div className={`flex flex-wrap items-center gap-2 ${className}`}>
            {options.map((n) => {
                const selected = value === n
                return (
                    <button
                        key={n}
                        type="button"
                        onClick={() => onChange(n)}
                        className={`min-w-[3rem] px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 border-2 ${buttonClassName} ${
                            selected
                                ? "border-transparent shadow-md text-white"
                                : "border-[#e6e6e6] bg-white text-[#1a1a1a] hover:border-[#7753ff]/40 hover:bg-[#f8f7ff]"
                        }`}
                        style={
                            selected
                                ? {
                                      backgroundColor: primaryColor,
                                      borderColor: primaryColor,
                                      boxShadow: `0 4px 14px ${primaryColor}40`,
                                  }
                                : { borderColor: undefined }
                        }
                    >
                        {n}
                    </button>
                )
            })}
        </div>
    )
}
