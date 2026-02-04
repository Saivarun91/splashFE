/**
 * Server-side API helper functions
 * These can be used in Server Components to fetch data on the server
 * Note: Token must be passed from cookies or headers since localStorage is client-only
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';

/**
 * Server-side fetch with aggressive caching for instant navigation
 * Uses force-cache + revalidate for optimal performance
 */
async function serverFetch(endpoint, options = {}) {
    const url = `${API_BASE_URL}${endpoint}`;
    
    // Determine cache strategy
    const cacheStrategy = options.cache || 'force-cache'; // Default to aggressive caching
    const revalidateTime = options.revalidate || 60; // Default 60 seconds
    
    const config = {
        ...options,
        headers: {
            'Content-Type': 'application/json',
            ...options.headers,
        },
        // Next.js fetch caching - aggressive caching for instant navigation
        cache: cacheStrategy,
        next: {
            revalidate: cacheStrategy === 'no-store' ? 0 : revalidateTime,
            tags: options.tags || [], // Cache tags for selective revalidation
            ...options.next,
        },
    };

    try {
        const response = await fetch(url, config);

        if (!response.ok) {
            if (response.status === 401) {
                return null;
            }
            let errorMessage = `HTTP error! status: ${response.status}`;
            try {
                const errorData = await response.json();
                if (errorData?.error) errorMessage = errorData.error;
                else if (errorData?.message) errorMessage = errorData.message;
            } catch {}
            const error = new Error(errorMessage);
            error.status = response.status;
            throw error;
        }

        const text = await response.text();
        try {
            return text ? JSON.parse(text) : {};
        } catch {
            return text;
        }
    } catch (error) {
        console.error("Server API request failed:", error);
        throw error;
    }
}

/**
 * Get projects (server-side)
 * @param {string} token - Auth token
 * @param {object} options - Fetch options including revalidate
 */
export async function getProjectsServer(token, options = {}) {
    if (!token) return null;
    
    return serverFetch('/probackendapp/api/projects/', {
        headers: {
            'Authorization': `Bearer ${token}`,
        },
        cache: 'force-cache', // Aggressive caching - projects list changes infrequently
        revalidate: options.revalidate || 60, // Revalidate every 60 seconds
        tags: ['projects', `projects-${token}`], // Tag for selective revalidation
        ...options,
    });
}

/**
 * Get project by slug/ID (server-side)
 * @param {string} projectId - Project slug or ID
 * @param {string} token - Auth token
 * @param {object} options - Fetch options
 */
export async function getProjectServer(projectId, token, options = {}) {
    if (!token || !projectId) return null;
    
    return serverFetch(`/probackendapp/api/projects/${projectId}/`, {
        headers: {
            'Authorization': `Bearer ${token}`,
        },
        cache: 'force-cache', // Cache project details aggressively
        revalidate: options.revalidate || 30, // Revalidate every 30 seconds
        tags: ['projects', `project-${projectId}`, `project-${projectId}-${token}`],
        ...options,
    });
}

/**
 * Get user role (server-side)
 * @param {string} projectId - Project slug or ID
 * @param {string} token - Auth token
 */
export async function getUserRoleServer(projectId, token) {
    if (!token || !projectId) return null;
    
    return serverFetch(`/probackendapp/api/projects/${projectId}/user-role/`, {
        headers: {
            'Authorization': `Bearer ${token}`,
        },
        cache: 'force-cache', // Cache user roles - they change infrequently
        revalidate: 60, // Revalidate every 60 seconds
        tags: [`project-role-${projectId}`, `project-role-${projectId}-${token}`],
    });
}

/**
 * Get collection (server-side)
 * @param {string} collectionId - Collection ID
 * @param {string} token - Auth token
 * @param {object} options - Fetch options
 */
export async function getCollectionServer(collectionId, token, options = {}) {
    if (!token || !collectionId) return null;
    
    return serverFetch(`/probackendapp/api/collections/${collectionId}/`, {
        headers: {
            'Authorization': `Bearer ${token}`,
        },
        cache: 'force-cache', // Cache collections - reuse across tabs
        revalidate: options.revalidate || 30, // Revalidate every 30 seconds
        tags: ['collections', `collection-${collectionId}`, `collection-${collectionId}-${token}`],
        ...options,
    });
}

/**
 * Get user profile (server-side) - cached aggressively
 */
export async function getUserProfileServer(token) {
    if (!token) return null;
    
    return serverFetch('/probackendapp/api/user/profile/', {
        headers: {
            'Authorization': `Bearer ${token}`,
        },
        cache: 'force-cache', // User profile changes infrequently
        revalidate: 300, // Revalidate every 5 minutes
        tags: ['user-profile', `user-profile-${token}`],
    });
}

/**
 * Get recent images (server-side)
 */
export async function getRecentImagesServer(token, limit = 5) {
    if (!token) return null;
    
    return serverFetch(`/probackendapp/api/images/recent/?limit=${limit}`, {
        headers: {
            'Authorization': `Bearer ${token}`,
        },
        cache: 'force-cache',
        revalidate: 30, // Revalidate every 30 seconds
        tags: ['recent-images', `recent-images-${token}`],
    });
}

/**
 * Get organization (server-side)
 */
export async function getOrganizationServer(organizationId, token) {
    if (!token || !organizationId) return null;
    
    return serverFetch(`/probackendapp/api/organizations/${organizationId}/`, {
        headers: {
            'Authorization': `Bearer ${token}`,
        },
        cache: 'force-cache',
        revalidate: 300, // Revalidate every 5 minutes
        tags: ['organizations', `organization-${organizationId}`, `organization-${organizationId}-${token}`],
    });
}
