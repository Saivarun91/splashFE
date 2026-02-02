/**
 * Client-side data cache for instant navigation
 * Prevents duplicate API calls and enables instant data access
 * 
 * Strategy:
 * - Cache project/collection data aggressively
 * - Reuse data across tabs and components
 * - Invalidate only on mutations
 */

class DataCache {
    constructor() {
        this.cache = new Map();
        this.pendingRequests = new Map(); // Prevent duplicate concurrent requests
        this.maxAge = 5 * 60 * 1000; // 5 minutes default
    }

    /**
     * Get cached data or return null
     */
    get(key) {
        const cached = this.cache.get(key);
        if (!cached) return null;

        const age = Date.now() - cached.timestamp;
        if (age > this.maxAge) {
            this.cache.delete(key);
            return null;
        }

        return cached.data;
    }

    /**
     * Set cached data
     */
    set(key, data, maxAge = this.maxAge) {
        this.cache.set(key, {
            data,
            timestamp: Date.now(),
            maxAge
        });
    }

    /**
     * Invalidate cache entry
     */
    invalidate(key) {
        this.cache.delete(key);
    }

    /**
     * Invalidate all cache entries matching pattern
     */
    invalidatePattern(pattern) {
        for (const key of this.cache.keys()) {
            if (key.includes(pattern)) {
                this.cache.delete(key);
            }
        }
    }

    /**
     * Clear all cache
     */
    clear() {
        this.cache.clear();
        this.pendingRequests.clear();
    }

    /**
     * Get or fetch data with caching
     * Prevents duplicate concurrent requests
     */
    async getOrFetch(key, fetchFn, maxAge = this.maxAge) {
        // Check cache first
        const cached = this.get(key);
        if (cached) {
            return cached;
        }

        // Check if request is already pending
        if (this.pendingRequests.has(key)) {
            return this.pendingRequests.get(key);
        }

        // Create new request
        const promise = fetchFn()
            .then(data => {
                this.set(key, data, maxAge);
                this.pendingRequests.delete(key);
                return data;
            })
            .catch(error => {
                this.pendingRequests.delete(key);
                throw error;
            });

        this.pendingRequests.set(key, promise);
        return promise;
    }
}

// Singleton instance
export const dataCache = new DataCache();

// Cache key generators
export const cacheKeys = {
    project: (idOrSlug) => `project:${idOrSlug}`,
    projectRole: (idOrSlug) => `project:${idOrSlug}:role`,
    collection: (id) => `collection:${id}`,
    collectionHistory: (id) => `collection:${id}:history`,
    modelStats: (id) => `collection:${id}:model-stats`,
    projectsList: () => 'projects:list',
};
