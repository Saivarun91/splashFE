export function formatRelativeCommentTime(createdAt, nowMs = Date.now()) {
    if (!createdAt) return "just now"

    const createdMs = new Date(createdAt).getTime()
    if (!Number.isFinite(createdMs)) return "just now"

    const diffMs = Math.max(0, nowMs - createdMs)
    const minuteMs = 60 * 1000
    const hourMs = 60 * minuteMs
    const dayMs = 24 * hourMs
    const weekMs = 7 * dayMs
    const yearMs = 365 * dayMs

    if (diffMs < minuteMs) {
        return "just now"
    }
    if (diffMs < hourMs) {
        const minutes = Math.floor(diffMs / minuteMs)
        return `${minutes}m ago`
    }
    if (diffMs < dayMs) {
        const hours = Math.floor(diffMs / hourMs)
        return `${hours}h ago`
    }
    if (diffMs < weekMs) {
        const days = Math.floor(diffMs / dayMs)
        return `${days}d ago`
    }
    if (diffMs < yearMs) {
        const weeks = Math.floor(diffMs / weekMs)
        return `${weeks}w ago`
    }

    const years = Math.floor(diffMs / yearMs)
    return `${years}y ago`
}
