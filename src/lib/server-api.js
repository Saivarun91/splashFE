/**
 * Server-side API helper functions
 * These can be used in Server Components to fetch data on the server
 * Note: Token must be passed from cookies or headers since localStorage is client-only
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';

/**
 * Server-side fetch with caching support
 */
async function serverFetch(endpoint, options = {}) {
    const url = `${API_BASE_URL}${endpoint}`;
    
    const config = {
        ...options,
        headers: {
            'Content-Type': 'application/json',
            ...options.headers,
        },
        // Next.js fetch caching
        next: {
            revalidate: options.revalidate || 60, // Default 60 seconds
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
        revalidate: options.revalidate || 30, // Cache for 30 seconds
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
        revalidate: options.revalidate || 10, // Cache for 10 seconds
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
        revalidate: 30,
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
        revalidate: options.revalidate || 5, // Cache for 5 seconds (more dynamic)
        ...options,
    });
}
