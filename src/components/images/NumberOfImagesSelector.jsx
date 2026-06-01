"use client"

const GOLD = "#cd9639"

/**
 * Segmented control for choosing how many images to generate (e.g. 1, 2, 3).
 * Selected state: colored border only (no fill).
 */
export function NumberOfImagesSelector({
    value,
    onChange,
    min = 1,
    max = 3,
    primaryColor = GOLD,
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
                        className={`min-w-[3rem] px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 border-2 bg-input text-foreground ${buttonClassName} ${
                            selected
                                ? ""
                                : "border-border hover:border-gold-muted hover:bg-accent"
                        }`}
                        style={
                            selected
                                ? {
                                      borderColor: primaryColor,
                                  }
                                : undefined
                        }
                    >
                        {n}
                    </button>
                )
            })}
        </div>
    )
}
