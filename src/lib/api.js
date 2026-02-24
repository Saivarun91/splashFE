// API service layer for communicating with Django backend
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';
import axios from 'axios';
import { generateEnhancedPrompt, generateEnhancedCampaignPrompt } from './ornamentRules';

const SPLASH_LOGIN_PATH = '/login';

/**
 * On any token/authentication error: clear auth state and redirect to login.
 */
function handleTokenError() {
    if (typeof window === 'undefined') return;
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = SPLASH_LOGIN_PATH;
}

function isTokenRelatedError(error) {
    if (!error?.message) return false;
    const msg = String(error.message).toLowerCase();
    return (
        msg.includes('token') ||
        msg.includes('401') ||
        msg.includes('unauthorized') ||
        msg.includes('authentication') ||
        msg.includes('expired') ||
        msg.includes('invalid credentials')
    );
}

/** Ensure 401 responses trigger logout and redirect; returns response otherwise. */
function checkResponseAuth(response) {
    if (response.status === 401) {
        handleTokenError();
        throw new Error('Authentication failed. Please login again.');
    }
    return response;
}

class ApiService {
    constructor() {
        this.baseURL = API_BASE_URL;
        this.userProfileCache = new Map();
        this.userProfileInFlight = new Map();
        this.userProfileCacheTtlMs = 30000;
    }

    // Low-level request helper (uses fetch)
    // OPTIMIZED: Supports Next.js fetch caching options for client-side requests
    async request(endpoint, options = {}) {
        const url = `${this.baseURL}${endpoint}`;

        // Prepare headers object but DO NOT auto-set Content-Type yet
        const headers = {
            ...(options.headers || {})
        };

        const config = {
            ...options,
            headers,
            // Support Next.js fetch caching options (for client-side requests)
            // Note: Client-side fetch caching is limited, but we can pass options through
            ...(options.next && { next: options.next }),
            ...(options.cache && { cache: options.cache }),
        };

        // Auto-add JSON content-type ONLY if the body is a plain JSON string
        const isJSONBody =
            config.body &&
            typeof config.body === "string" &&
            !headers["Content-Type"] &&
            !config.body instanceof FormData;

        if (isJSONBody) {
            headers["Content-Type"] = "application/json";
        }

        try {
            const response = await fetch(url, config);

            if (!response.ok) {
                // Token/authentication error: logout and redirect to login
                if (response.status === 401) {
                    handleTokenError();
                    throw new Error('Authentication failed. Please login again.');
                }

                // Extract backend error message
                let errorMessage = `HTTP error! status: ${response.status}`;
                try {
                    const errorData = await response.json();
                    if (errorData?.error) errorMessage = errorData.error;
                    else if (errorData?.message) errorMessage = errorData.message;
                } catch { }

                const error = new Error(errorMessage);
                error.status = response.status;
                if (isTokenRelatedError(error)) {
                    handleTokenError();
                }
                throw error;
            }

            // Some endpoints return empty body
            const text = await response.text();
            try {
                return text ? JSON.parse(text) : {};
            } catch {
                return text;
            }
        } catch (error) {
            if (isTokenRelatedError(error)) {
                handleTokenError();
            }
            console.error("API request failed:", error);
            throw error;
        }
    }


    // HTTP method shortcuts
    async get(endpoint, options = {}) {
        const { params, ...requestOptions } = options;
        let url = endpoint;

        // Handle query parameters
        if (params) {
            const searchParams = new URLSearchParams();
            for (const key of Object.keys(params)) {
                if (params[key] !== undefined && params[key] !== null) {
                    searchParams.append(key, params[key]);
                }
            }
            const queryString = searchParams.toString();
            if (queryString) {
                url += (endpoint.includes('?') ? '&' : '?') + queryString;
            }
        }

        return this.request(url, { ...requestOptions, method: 'GET' });
    }

    async post(endpoint, data, options = {}) {
        return this.request(endpoint, {
            ...options,
            method: 'POST',
            body: JSON.stringify(data),
        });
    }

    async put(endpoint, data, options = {}) {
        return this.request(endpoint, {
            ...options,
            method: 'PUT',
            body: JSON.stringify(data),
        });
    }

    async delete(endpoint, options = {}) {
        return this.request(endpoint, { ...options, method: 'DELETE' });
    }

    // User endpoints   
    async login(email, password) {
        console.log('API URL', this.baseURL);
        return this.request('/api/login/', {
            method: 'POST',
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ email, password }),
        });
    }

    async register(full_name, username, email, password) {
        console.log(full_name, username, email, password)
        return this.request('/api/register/', {
            method: 'POST',
            body: JSON.stringify({ full_name, username, email, password }),
        })
    }

    async getUserProfile(token, options = {}) {
        const authToken = token || '';
        const cacheKey = authToken || 'anonymous';
        const now = Date.now();
        const forceRefresh = Boolean(options?.forceRefresh);

        if (!forceRefresh) {
            const cached = this.userProfileCache.get(cacheKey);
            if (cached && (now - cached.timestamp) < this.userProfileCacheTtlMs) {
                return cached.data;
            }

            const inFlight = this.userProfileInFlight.get(cacheKey);
            if (inFlight) {
                return inFlight;
            }
        }

        const requestPromise = this.request('/api/profile/', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${authToken}`,
            },
        }).then((response) => {
            this.userProfileCache.set(cacheKey, {
                data: response,
                timestamp: Date.now(),
            });
            return response;
        }).finally(() => {
            this.userProfileInFlight.delete(cacheKey);
        });

        this.userProfileInFlight.set(cacheKey, requestPromise);
        return requestPromise;
    }

    async updateUserProfile(profileData, token) {
        const response = await this.request('/api/profile/update/', {
            method: 'PUT',
            body: JSON.stringify(profileData),
            headers: {
                'Authorization': `Bearer ${token || ''}`,
            },
        });
        this.userProfileCache.clear();
        return response;
    }

    async completeProfile(profileData, token) {
        const response = await this.request('/api/profile/complete/', {
            method: 'POST',
            body: JSON.stringify(profileData),
            headers: {
                'Authorization': `Bearer ${token || ''}`,
            },
        });
        this.userProfileCache.clear();
        return response;
    }

    async forgotPassword(email) {
        return this.request('/api/forgot-password/', {
            method: 'POST',
            body: JSON.stringify({ email }),
        });
    }

    async resetPassword(token, newPassword) {
        return this.request('/api/reset-password/', {
            method: 'POST',
            body: JSON.stringify({ token, new_password: newPassword }),
        });
    }

    async verifyEmailOtp(email, otp) {
        return this.request('/api/verify-email-otp/', {
            method: 'POST',
            body: JSON.stringify({ email, otp }),
        });
    }

    async resendEmailOtp(email) {
        return this.request('/api/resend-email-otp/', {
            method: 'POST',
            body: JSON.stringify({ email }),
        });
    }

    // Project endpoints - OPTIMIZED with caching hints
    async getProjects(token, options = {}) {
        return this.request('/probackendapp/api/projects/', {
            headers: {
                'Authorization': `Bearer ${token}`,
            },
            // Pass through caching options for better performance
            ...options,
        });
    }

    async getProject(projectId, token, options = {}) {
        return this.request(`/probackendapp/api/projects/${projectId}/`, {
            headers: {
                'Authorization': `Bearer ${token || ''}`,
            },
            // Pass through caching options
            ...options,
        });
    }

    async createProject(projectData, token) {
        return this.request('/probackendapp/api/projects/create/', {
            method: 'POST',
            body: JSON.stringify(projectData),
            headers: {
                'Authorization': `Bearer ${token || ''}`,
            },
        });
    }

    async updateProject(projectId, projectData, token) {
        return this.request(`/probackendapp/api/projects/${projectId}/update/`, {
            method: 'PUT',
            body: JSON.stringify(projectData),
            headers: {
                'Authorization': `Bearer ${token || ''}`,
            },
        });
    }

    async updateProjectStatus(projectId, status, token) {
        return this.request(`/probackendapp/api/projects/${projectId}/update/`, {
            method: 'PUT',
            body: JSON.stringify({ status }),
            headers: {
                'Authorization': `Bearer ${token || ''}`,
            },
        });
    }

    async deleteProject(projectId, token) {
        return this.request(`/probackendapp/api/projects/${projectId}/delete/`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token || ''}`,
            },
        });
    }

    // Collection endpoints - OPTIMIZED with caching
    async getCollection(collectionId, token, options = {}) {
        return this.request(`/probackendapp/api/collections/${collectionId}/`, {
            headers: {
                'Authorization': `Bearer ${token || ''}`,
            },
            // Pass through caching options for reuse across tabs
            ...options,
        });
    }

    async updateCollectionDescription(projectId, description, uploadedImage, targetAudience = null, campaignSeason = null) {
        // If there's an uploaded image, use FormData
        if (uploadedImage) {
            const formData = new FormData();
            formData.append('description', description);
            formData.append('uploaded_image', uploadedImage);
            if (targetAudience) {
                formData.append('target_audience', targetAudience);
            }
            if (campaignSeason) {
                formData.append('campaign_season', campaignSeason);
            }

            return fetch(`${this.baseURL}/probackendapp/api/projects/${projectId}/setup/description/`, {
                method: 'POST',
                body: formData,
            }).then(response => {
                checkResponseAuth(response);
                return response.json();
            });
        }

        // Otherwise, use JSON
        const requestData = { description };
        if (targetAudience) {
            requestData.target_audience = targetAudience;
        }
        if (campaignSeason) {
            requestData.campaign_season = campaignSeason;
        }
        return this.request(`/probackendapp/api/projects/${projectId}/setup/description/`, {
            method: 'POST',
            body: JSON.stringify(requestData),
        });
    }

    async updateBriefComments(projectId, collectionId, commentType, comments, token) {
        const normalizedType = String(commentType || 'description').trim().toLowerCase();
        const payloadFieldMap = {
            description: 'description_comments',
            target_audience: 'target_audience_comments',
            campaign_season: 'campaign_season_comments',
        };
        const payloadField = payloadFieldMap[normalizedType] || 'description_comments';

        return this.request(`/probackendapp/api/projects/${projectId}/collections/${collectionId}/description-comments/`, {
            method: 'POST',
            body: JSON.stringify({
                comment_type: normalizedType,
                [payloadField]: Array.isArray(comments) ? comments : [],
            }),
            headers: {
                'Authorization': `Bearer ${token || ''}`,
            },
        });
    }

    async updateDescriptionComments(projectId, collectionId, descriptionComments, token) {
        return this.updateBriefComments(
            projectId,
            collectionId,
            'description',
            descriptionComments,
            token
        );
    }

    async updateSelectionComments(projectId, collectionId, commentType, comments, token) {
        const normalizedType = String(commentType || 'themes').trim().toLowerCase();
        const payloadFieldMap = {
            themes: 'themes_comments',
            outfits: 'outfits_comments',
            backgrounds: 'backgrounds_comments',
            poses: 'poses_comments',
            locations: 'locations_comments',
            color_images: 'color_images_comments',
            additional_instructions: 'additional_instructions_comments',
            human_model_preview: 'human_model_preview_comments',
            ai_model_preview: 'ai_model_preview_comments',
            product_upload: 'product_upload_comments',
            generated_product_images: 'generated_product_images_comments',
        };
        const payloadField = payloadFieldMap[normalizedType] || 'themes_comments';

        return this.request(`/probackendapp/api/projects/${projectId}/collections/${collectionId}/selection-comments/`, {
            method: 'POST',
            body: JSON.stringify({
                comment_type: normalizedType,
                [payloadField]: Array.isArray(comments) ? comments : [],
            }),
            headers: {
                'Authorization': `Bearer ${token || ''}`,
            },
        });
    }

    async removeWorkflowImage(projectId, collectionId, imageId, category, token, cloudUrl = null) {
        return this.request(`/probackendapp/api/projects/${projectId}/collections/${collectionId}/remove-workflow-image/`, {
            method: 'DELETE',
            body: JSON.stringify({
                image_id: imageId,
                cloud_url: cloudUrl,
                category: category
            }),
            headers: {
                'Authorization': `Bearer ${token || ''}`,
            },
        });
    }

    async uploadWorkflowImage(projectId, collectionId, category, images, token) {
        const formData = new FormData();
        formData.append('category', category);

        for (const image of images) {
            formData.append('images', image);
        }

        console.log('Uploading workflow image:', {
            projectId,
            collectionId,
            category,
            imageCount: images.length,
            token: token ? 'present' : 'missing'
        });

        return fetch(`${this.baseURL}/probackendapp/api/projects/${projectId}/collections/${collectionId}/upload-workflow-image/`, {
            method: 'POST',
            body: formData,
            headers: {
                'Authorization': `Bearer ${token || ''}`,
            },
        }).then(response => {
            checkResponseAuth(response);
            console.log('Upload response status:', response.status);
            if (!response.ok) {
                return response.text().then(text => {
                    console.error('Upload failed:', text);
                    throw new Error(`Upload failed: ${response.status} ${text}`);
                });
            }
            return response.json();
        });
    }

    async updateCollectionSelections(projectId, collectionId, selections, uploadedImages = {}) {
        // If there are uploaded images, use FormData
        if (Object.keys(uploadedImages).some(category => uploadedImages[category].length > 0)) {
            const formData = new FormData();

            // Add selections as JSON
            formData.append('selections', JSON.stringify(selections));

            // Add uploaded images for each category
            Object.keys(uploadedImages).forEach(category => {
                uploadedImages[category].forEach((image, index) => {
                    formData.append(`uploaded_${category}_images`, image.file);
                });
            });

            return fetch(`${this.baseURL}/probackendapp/api/projects/${projectId}/collections/${collectionId}/select/`, {
                method: 'POST',
                body: formData,
            }).then(response => {
                checkResponseAuth(response);
                return response.json();
            });
        }

        // Otherwise, use JSON
        return this.request(`/probackendapp/api/projects/${projectId}/collections/${collectionId}/select/`, {
            method: 'POST',
            body: JSON.stringify(selections),
        });
    }
    async enhanceImage(imageUrl, collectionId, productImagePath, generatedImagePath, token) {
        return this.request(`/probackendapp/api/image/enhance/`, {
            method: 'POST',
            body: JSON.stringify({
                image_url: imageUrl,
                collection_id: collectionId,
                product_image_path: productImagePath,
                generated_image_path: generatedImagePath
            }),
            headers: {
                'Authorization': `Bearer ${token}`,
            },
        });
    }

    // AI Image Generation endpoints
    async generateAIImages(collectionId, token, onProgress = null) {
        // Start the Celery task
        const startResponse = await this.request(`/probackendapp/api/collections/${collectionId}/generate-images/`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
        });

        if (!startResponse.success || !startResponse.task_id) {
            throw new Error(startResponse.error || 'Failed to start AI image generation');
        }

        const taskId = startResponse.task_id;

        // Poll for task completion
        return new Promise((resolve, reject) => {
            const pollInterval = setInterval(async () => {
                try {
                    const statusResponse = await this.getTaskStatus(taskId, token);

                    if (onProgress) {
                        onProgress(statusResponse);
                    }

                    if (statusResponse.status === 'SUCCESS') {
                        clearInterval(pollInterval);
                        // Return the result from the task
                        // statusResponse.result contains {success, images, saved_images, total_generated}
                        const result = statusResponse.result || {};
                        resolve({
                            images: result.images || [],
                            saved_images: result.saved_images || [],
                            success: result.success !== false,
                            total_generated: result.total_generated || 0
                        });
                    } else if (statusResponse.status === 'FAILURE' || statusResponse.status === 'REVOKED') {
                        clearInterval(pollInterval);
                        const errorMsg = statusResponse.error ||
                            (typeof statusResponse.result === 'string' ? statusResponse.result : 'Task failed');
                        reject(new Error(errorMsg));
                    }
                    // If status is PENDING or STARTED, continue polling
                } catch (error) {
                    clearInterval(pollInterval);
                    reject(error);
                }
            }, 2000); // Poll every 2 seconds

            // Set a timeout (e.g., 10 minutes)
            setTimeout(() => {
                clearInterval(pollInterval);
                reject(new Error('Task timeout: AI image generation took too long'));
            }, 600000); // 10 minutes timeout
        });
    }

    async saveGeneratedImages(collectionId, selectedImages, token) {
        return this.request(`/probackendapp/api/collections/${collectionId}/save-images/`, {
            method: 'POST',
            body: JSON.stringify({ images: selectedImages }),
            headers: {
                'Authorization': `Bearer ${token}`,
            },
        });
    }

    // Product Image endpoints
    async uploadProductImages(collectionId, images, ornamentTypes, token, ornamentRules = null) {
        const formData = new FormData();
        for (const image of images) {
            formData.append('images', image);
        }
        // Append ornament types as JSON array
        if (ornamentTypes && ornamentTypes.length > 0) {
            formData.append('ornament_types', JSON.stringify(ornamentTypes));
        }
        // Append ornament fitting rules (from ornamentRules.js) as JSON array, same order as ornamentTypes
        if (ornamentRules && ornamentRules.length > 0) {
            formData.append('ornament_rules', JSON.stringify(ornamentRules));
        }

        return fetch(`${this.baseURL}/probackendapp/api/collections/${collectionId}/upload-products/`, {
            method: 'POST',
            body: formData,
            headers: {
                'Authorization': `Bearer ${token}`,
            },
        }).then(response => {
            checkResponseAuth(response);
            return response.json();
        });
    }

    async deleteProductImage(collectionId, productImageUrl, productImagePath, token) {
        return this.request(`/probackendapp/api/collections/${collectionId}/products/`, {
            method: 'DELETE',
            body: JSON.stringify({
                product_image_url: productImageUrl,
                product_image_path: productImagePath
            }),
            headers: {
                'Authorization': `Bearer ${token}`,
            },
        });
    }

    async updateProductGenerationSelections(collectionId, imageTypeSelections, token) {
        return this.request(`/probackendapp/api/collections/${collectionId}/products/generation-selections/`, {
            method: 'PUT',
            body: JSON.stringify({
                image_type_selections: imageTypeSelections
            }),
            headers: {
                'Authorization': `Bearer ${token}`,
            },
        });
    }

    async generateProductModelImages(collectionId, imageTypeSelections = null, token) {
        const body = imageTypeSelections ? { image_type_selections: imageTypeSelections } : {};
        return this.request(`/probackendapp/api/collections/${collectionId}/generate-all-product-model-images/`, {
            method: 'POST',
            body: JSON.stringify(body),
            headers: {
                'Authorization': `Bearer ${token || ''}`,
            },
        });
    }

    async getJobImages(jobId, token) {
        return this.request(`/probackendapp/api/jobs/${jobId}/images/`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token || ''}`,
            },
        });
    }

    async getTaskStatus(taskId, token) {
        return this.request(`/probackendapp/api/task-status/${taskId}/`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token || ''}`,
            },
        });
    }

    async generateProductModelImagesWithPolling(collectionId, imageTypeSelections = null, token, onProgress = null) {
        // Start the bulk generation job
        const startResponse = await this.generateProductModelImages(collectionId, imageTypeSelections, token);

        if (!startResponse.success || !startResponse.job_id) {
            throw new Error(startResponse.error || 'Failed to start image generation job');
        }

        const jobId = startResponse.job_id;

        // Poll for job completion and progressive results
        return new Promise((resolve, reject) => {
            const pollInterval = setInterval(async () => {
                try {
                    const jobStatus = await this.getJobImages(jobId, token);

                    if (onProgress) {
                        // Pass full job status so caller can show progress/completed counts
                        onProgress(jobStatus);
                    }

                    if (jobStatus.status === 'completed') {
                        clearInterval(pollInterval);
                        resolve({
                            success: true,
                            message: jobStatus.message || 'Image generation completed',
                            total_generated: jobStatus.completed_images,
                            job_id: jobId,
                        });
                    } else if (jobStatus.status === 'failed') {
                        clearInterval(pollInterval);
                        const errorMsg = jobStatus.error || 'Image generation job failed';
                        reject(new Error(errorMsg));
                    }
                    // If status is pending/running, continue polling
                } catch (error) {
                    clearInterval(pollInterval);
                    reject(error);
                }
            }, 2000); // Poll every 2 seconds

            // Set a timeout (e.g., 10 minutes)
            setTimeout(() => {
                clearInterval(pollInterval);
                reject(new Error('Job timeout: Image generation took too long'));
            }, 600000); // 10 minutes timeout
        });
    }

    async generateSingleProductModelImages(collectionId, productImageUrl, productImagePath, token) {
        return this.request(`/probackendapp/api/collections/${collectionId}/generate-product-model-images/`, {
            method: 'POST',
            body: JSON.stringify({
                // product_image_url: productImageUrl,
                // product_image_path: productImagePath
                product_url: productImageUrl
            }),
            headers: {
                'Authorization': `Bearer ${token || ''}`,
            },
        });
    }

    async regenerateProductModelImage(collectionId, productImagePath, generatedImagePath, prompt, useDifferentModel = false, newModel = null, token) {
        return this.request(`/probackendapp/api/collections/${collectionId}/regenerate/`, {
            method: 'POST',
            body: JSON.stringify({
                product_image_path: productImagePath,
                generated_image_path: generatedImagePath,
                prompt: prompt,
                use_different_model: useDifferentModel,
                new_model: newModel,
            }),
            headers: {
                'Authorization': `Bearer ${token || ''}`,
            },
        });
    }

    // Model Management endpoints
    async uploadRealModels(collectionId, images, token) {
        const formData = new FormData();
        for (const image of images) {
            formData.append('images', image);
        }

        return fetch(`${this.baseURL}/probackendapp/api/collections/${collectionId}/upload-real-models/`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token || ''}`,
            },
            body: formData,
        }).then(response => {
            checkResponseAuth(response);
            return response.json();
        });
    }

    async getAllModels(collectionId, token) {
        return this.request(`/probackendapp/api/collections/${collectionId}/get-all-models/`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token || ''}`,
            },
        });
    }

    async selectModel(collectionId, modelType, modelData) {
        return this.request(`/probackendapp/api/collections/${collectionId}/select-model/`, {
            method: 'POST',
            body: JSON.stringify({
                type: modelType,
                model: modelData,
            }),
        });
    }

    // Collaboration endpoints
    async inviteUser(projectId, email, role, token) {
        return this.request(`/probackendapp/api/${projectId}/invite`, {
            method: 'POST',
            body: JSON.stringify({ email, role }),
            headers: {
                'Authorization': `Bearer ${token || ''}`,
            },
        });
    }

    async acceptInvite(projectId, token) {
        return this.request(`/probackendapp/api/${projectId}/accept-invite`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token || ''}`,
            },
        });
    }

    async listInvites(projectId, token) {
        return this.request(`/probackendapp/api/${projectId}/invites`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token || ''}`,
            },
        });
    }

    async getAvailableUsers(projectId, token) {
        return this.request(`/probackendapp/api/${projectId}/available-users`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token || ''}`,
            },
        });
    }

    async updateMemberRole(projectId, userId, role, token) {
        return this.request(`/probackendapp/api/${projectId}/update-member-role`, {
            method: 'POST',
            body: JSON.stringify({ user_id: userId, role }),
            headers: {
                'Authorization': `Bearer ${token || ''}`,
            },
        });
    }

    async removeProjectMember(projectId, userId, token) {
        return this.request(`/probackendapp/api/${projectId}/remove-member`, {
            method: 'POST',
            body: JSON.stringify({ user_id: userId }),
            headers: {
                'Authorization': `Bearer ${token || ''}`,
            },
        });
    }

    async updateProjectInviteRole(projectId, inviteId, role, token) {
        return this.request(`/probackendapp/api/${projectId}/invites/${inviteId}/update-role`, {
            method: 'POST',
            body: JSON.stringify({ role }),
            headers: {
                'Authorization': `Bearer ${token || ''}`,
            },
        });
    }

    async cancelProjectInvite(projectId, inviteId, token) {
        return this.request(`/probackendapp/api/${projectId}/invites/${inviteId}/cancel`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token || ''}`,
            },
        });
    }

    // Global invite endpoints (for dashboard)
    async getAllInvites(token) {
        return this.request(`/probackendapp/api/invites/all`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token || ''}`,
            },
        });
    }

    async acceptInviteById(inviteId, token) {
        return this.request(`/probackendapp/api/invites/${inviteId}/accept`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token || ''}`,
            },
        });
    }

    async rejectInvite(inviteId, token) {
        return this.request(`/probackendapp/api/invites/${inviteId}/reject`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token || ''}`,
            },
        });
    }

    // Role and Permission endpoints
    async getUserRole(projectId, token, options = {}) {
        return this.request(`/probackendapp/api/projects/${projectId}/user-role/`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token || ''}`,
            },
            ...options,
        });
    }
    async removeModel(collectionId, type, model, token) {
        return this.request(`/probackendapp/api/collections/${collectionId}/models/`, {
            method: 'DELETE',
            body: JSON.stringify({ type, model }),
            headers: {
                'Authorization': `Bearer ${token}`,
            },
        });
    }


    // Model usage statistics
    async getModelUsageStats(collectionId, token, options = {}) {
        return this.request(`/probackendapp/api/collections/${collectionId}/model-usage-stats/`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token || ''}`,
            },
            ...options,
        });
    }

    // =======================
    // Image Generation helpers (imgbackendapp)
    // =======================

    // Get credit settings for image generation (cost per image)
    async getImageCreditSettings(token) {
        try {
            const response = await axios.get(`${this.baseURL}/api/credits/settings/`, {
                headers: token ? { 'Authorization': `Bearer ${token}` } : {},
            });
            if (response.data?.success && response.data?.settings) {
                return response.data.settings;
            }
            return { credits_per_image_generation: 2, credits_per_regeneration: 1 };
        } catch (err) {
            console.warn('Failed to fetch image credit settings:', err);
            return { credits_per_image_generation: 2, credits_per_regeneration: 1 };
        }
    }

    // Get Celery task status for image generation
    async getImageTaskStatus(taskId, token) {
        const response = await axios.get(
            `${this.baseURL}/image/task-status/`,
            {
                params: { task_id: taskId },
                headers: {
                    'Authorization': `Bearer ${token || ''}`,
                }
            }
        );
        return response.data;
    }

    // Wait for multiple Celery image-generation tasks and return { images: [...] }
    async waitForImageTasks(taskIds, token, options = {}) {
        const results = await Promise.all(
            taskIds.map((id) => this.waitForImageTask(id, token, options))
        );
        const images = results.map((r, index) => {
            const url = r.generated_image_url || r.uploaded_image_url;
            return {
                success: true,
                generated_image_url: r.generated_image_url || url,
                mongo_id: r.mongo_id,
                prompt: r.prompt || r.original_prompt,
                index,
                ...r,
            };
        });
        return { success: true, images };
    }

    // Wait for a Celery image-generation task to complete and return its result
    async waitForImageTask(taskId, token, options = {}) {
        const intervalMs = options.intervalMs || 2000;
        const timeoutMs = options.timeoutMs || 10 * 60 * 1000; // 10 minutes
        const start = Date.now();

        // Simple polling loop
        // NOTE: This keeps the UI "loading" until the image is actually ready
        // but avoids blocking the Django request thread.
        // The frontend components don't need to change their success logic.
        // They will only receive the final result once the task finishes.
        // eslint-disable-next-line no-constant-condition
        while (true) {
            const status = await this.getImageTaskStatus(taskId, token);

            if (!status || !status.status) {
                throw new Error('Invalid task status response from server');
            }

            if (status.status === 'SUCCESS') {
                // Celery task result: single image dict or batch { images: [...] }
                if (!status.result) {
                    throw new Error('Task completed but no result was returned');
                }
                const result = status.result;
                // Normalize batch response to same shape as single for consumers that expect .images
                if (result.images && Array.isArray(result.images)) {
                    return result;
                }
                return result;
            }

            if (status.status === 'FAILURE') {
                const errMsg = status.error || status.message || 'Image generation failed';
                throw new Error(errMsg);
            }

            if (Date.now() - start > timeoutMs) {
                throw new Error('Image generation timed out. Please try again.');
            }

            // Wait before next poll
            await new Promise((resolve) => setTimeout(resolve, intervalMs));
        }
    }

    // Image Generation endpoints (imgbackendapp)
    async uploadOrnamentWithBackground(formData, token) {
        const response = await axios.post(`${this.baseURL}/image/`, formData, {
            headers: {
                'Authorization': `Bearer ${token || ''}`,
            }
        });
        const data = response.data;

        // If Celery queued a background task, wait for completion
        if (data && data.task_id) {
            return await this.waitForImageTask(data.task_id, token);
        }

        // Backward-compatible: if the backend returns final result directly
        return data;
    }

    /**
     * Analyze a reference image for themed / model / campaign context.
     * Returns { success, analysis_text }.
     * @param {File} imageFile - reference image file
     * @param {string} context - 'themed' | 'model' | 'campaign'
     * @param {string} token - auth token
     */
    async analyzeReferenceImage(imageFile, context, token) {
        if (!imageFile) return { success: false, analysis_text: '' };
        const formData = new FormData();
        formData.append('image', imageFile);
        formData.append('context', context || 'themed');
        const response = await axios.post(`${this.baseURL}/image/analyze-reference/`, formData, {
            headers: {
                'Authorization': `Bearer ${token || ''}`,
            },
        });
        return response.data;
    }

    async changeBackground(formData, token) {
        const response = await axios.post(`${this.baseURL}/image/change_background/`, formData, {
            headers: {
                'Authorization': `Bearer ${token || ''}`,
            }
        });
        const data = response.data;

        if (data && data.task_ids && data.task_ids.length > 0) {
            return await this.waitForImageTasks(data.task_ids, token);
        }
        if (data && data.task_id) {
            return await this.waitForImageTask(data.task_id, token);
        }

        return data;
    }

    async generateModelWithOrnament(formData, token) {
        // Extract ornament type and measurements from formData
        const ornamentType = formData.get('ornament_type');
        const ornamentMeasurements = formData.get('ornament_measurements');
        const basePrompt = formData.get('prompt') || 'Generate an AI model wearing this ornament';

        // Generate enhanced prompt with fitting rules
        let enhancedPrompt = basePrompt;
        if (ornamentType) {
            try {
                const measurements = ornamentMeasurements ? JSON.parse(ornamentMeasurements) : {};
                enhancedPrompt = generateEnhancedPrompt(basePrompt, ornamentType, measurements);
            } catch (error) {
                console.warn('Failed to parse ornament measurements:', error);
                enhancedPrompt = generateEnhancedPrompt(basePrompt, ornamentType, {});
            }
        }

        // Update the prompt in formData
        formData.set('prompt', enhancedPrompt);

        const response = await axios.post(`${this.baseURL}/image/generate-model/`, formData, {
            headers: {
                'Authorization': `Bearer ${token || ''}`,
            }
        });
        const data = response.data;

        if (data && data.task_ids && data.task_ids.length > 0) {
            return await this.waitForImageTasks(data.task_ids, token);
        }
        if (data && data.task_id) {
            return await this.waitForImageTask(data.task_id, token);
        }

        return data;
    }

    async generateRealModelWithOrnament(formData, token) {
        // Extract ornament type and measurements from formData
        const ornamentType = formData.get('ornament_type');
        const ornamentMeasurements = formData.get('ornament_measurements');
        const basePrompt = formData.get('prompt') || 'Generate realistic image with model wearing ornament';

        // Generate enhanced prompt with fitting rules
        let enhancedPrompt = basePrompt;
        if (ornamentType) {
            try {
                const measurements = ornamentMeasurements ? JSON.parse(ornamentMeasurements) : {};
                enhancedPrompt = generateEnhancedPrompt(basePrompt, ornamentType, measurements);
            } catch (error) {
                console.warn('Failed to parse ornament measurements:', error);
                enhancedPrompt = generateEnhancedPrompt(basePrompt, ornamentType, {});
            }
        }

        // Update the prompt in formData
        formData.set('prompt', enhancedPrompt);

        const response = await axios.post(`${this.baseURL}/image/generate-real-model/`, formData, {
            headers: {
                'Authorization': `Bearer ${token || ''}`,
            }
        });
        const data = response.data;

        if (data && data.task_ids && data.task_ids.length > 0) {
            return await this.waitForImageTasks(data.task_ids, token);
        }
        if (data && data.task_id) {
            return await this.waitForImageTask(data.task_id, token);
        }

        return data;
    }

    async generateCampaignShot(formData, token) {
        // Extract ornament types, measurements and base prompt from formData
        const ornamentTypes = formData.getAll('ornament_types');
        const basePrompt = formData.get('prompt') || 'Generate campaign shot with multiple ornaments';
        const rawMeasurements = formData.get('ornament_measurements');

        // Parse optional per-ornament measurements (JSON array of objects)
        let ornamentMeasurements = [];
        if (rawMeasurements) {
            try {
                const parsed = JSON.parse(rawMeasurements);
                if (Array.isArray(parsed)) {
                    ornamentMeasurements = parsed;
                }
            } catch (error) {
                console.warn('Failed to parse ornament measurements for campaign shot:', error);
            }
        }

        // Generate enhanced prompt with fitting rules for multiple ornaments
        let enhancedPrompt = basePrompt;
        if (ornamentTypes && ornamentTypes.length > 0) {
            enhancedPrompt = generateEnhancedCampaignPrompt(
                basePrompt,
                ornamentTypes,
                ornamentMeasurements
            );
        }

        // Update the prompt in formData
        formData.set('prompt', enhancedPrompt);

        const response = await axios.post(`${this.baseURL}/image/generate-campaign-shot/`, formData, {
            headers: {
                'Authorization': `Bearer ${token || ''}`,
            }
        });
        const data = response.data;

        if (data && data.task_ids && data.task_ids.length > 0) {
            return await this.waitForImageTasks(data.task_ids, token);
        }

        if (data && data.task_id) {
            return await this.waitForImageTask(data.task_id, token);
        }

        return data;
    }

    // Regeneration endpoints
    async regenerateImage(imageId, prompt, token) {
        // Validate MongoDB ObjectId format (24 hex characters)
        if (!imageId || typeof imageId !== 'string') {
            throw new Error('Invalid image ID: image_id is required and must be a string');
        }

        // MongoDB ObjectId must be exactly 24 hex characters
        const objectIdPattern = /^[0-9a-fA-F]{24}$/;
        if (!objectIdPattern.test(imageId)) {
            throw new Error(`Invalid image ID: '${imageId}' is not a valid MongoDB ObjectId. It must be a 24-character hex string. Please ensure you are using mongo_id, not ornament_id.`);
        }

        const formData = new FormData();
        formData.append('image_id', imageId);
        formData.append('prompt', prompt);

        const response = await axios.post(
            `${this.baseURL}/image/regenerate/`,
            formData,
            {
                headers: {
                    'Authorization': `Bearer ${token || ''}`,
                }
            }
        );
        const data = response.data;

        if (data && data.task_id) {
            return await this.waitForImageTask(data.task_id, token);
        }

        return data;
    }

    async getUserImages(type = null, page = 1, limit = 20) {
        const token = localStorage.getItem('token');
        const params = { page, limit };
        if (type) {
            params.type = type;
        }

        const response = await axios.get(
            `${this.baseURL}/image/user-images/`,
            {
                params,
                headers: {
                    'Authorization': `Bearer ${token || ''}`,
                }
            }
        );
        return response.data;
    }
    async deleteUserImage(imageId, token) {
        const response = await this.delete(`/image/delete-image/${imageId}/`, {
            headers: {
                'Authorization': `Bearer ${token || ''}`,
            }
        });
        return response;
    }

    // Recent History endpoints
    async getRecentHistory(token, params = {}) {
        return this.get('/probackendapp/api/recent/history/', {
            params,
            headers: {
                'Authorization': `Bearer ${token || ''}`,
            },
        });
    }

    async getRecentProjects(token, params = {}) {
        return this.get('/probackendapp/api/recent/projects/', {
            params,
            headers: {
                'Authorization': `Bearer ${token || ''}`,
            },
        });
    }

    async getRecentProjectHistory(token, params = {}) {
        return this.get('/probackendapp/api/recent/project-history/', {
            params,
            headers: {
                'Authorization': `Bearer ${token || ''}`,
            },
        });
    }

    async getRecentImages(token, limit = 8) {
        return this.get('/probackendapp/api/recent/images/', {
            params: { limit },
            headers: {
                'Authorization': `Bearer ${token || ''}`,
            },
        });
    }

    async getCollectionHistory(collectionId, token, options = {}) {
        return this.get(`/probackendapp/api/collections/${collectionId}/history/`, {
            headers: {
                'Authorization': `Bearer ${token || ''}`,
            },
            ...options,
        });
    }

    // Prompt Master endpoints
    async getPrompts(token) {
        return this.get('/probackendapp/api/prompts/', {
            headers: {
                'Authorization': `Bearer ${token || ''}`,
            },
        });
    }

    async getPrompt(promptId, token) {
        return this.get(`/probackendapp/api/prompts/${promptId}/`, {
            headers: {
                'Authorization': `Bearer ${token || ''}`,
            },
        });
    }

    async createPrompt(promptData, token) {
        return this.post('/probackendapp/api/prompts/create/', promptData, {
            headers: {
                'Authorization': `Bearer ${token || ''}`,
            },
        });
    }

    async updatePrompt(promptId, promptData, token) {
        return this.put(`/probackendapp/api/prompts/${promptId}/update/`, promptData, {
            headers: {
                'Authorization': `Bearer ${token || ''}`,
            },
        });
    }

    async deletePrompt(promptId, token) {
        return this.delete(`/probackendapp/api/prompts/${promptId}/delete/`, {
            headers: {
                'Authorization': `Bearer ${token || ''}`,
            },
        });
    }

    async getPromptByKey(promptKey, token) {
        return this.get(`/probackendapp/api/prompts/key/${promptKey}/`, {
            headers: {
                'Authorization': `Bearer ${token || ''}`,
            },
        });
    }

    async initializePrompts(token) {
        return this.post('/probackendapp/api/prompts/initialize/', {}, {
            headers: {
                'Authorization': `Bearer ${token || ''}`,
            },
        });
    }

    // =====================
    // Organization API endpoints
    // =====================

    // List organizations (admin sees all, users see their own)
    async listOrganizations(token) {
        return this.get('/imgbackendapp/api/organizations/list/', {
            headers: {
                'Authorization': `Bearer ${token || ''}`,
            },
        });
    }

    // Get organization details
    async getOrganization(organizationId, token) {
        return this.get(`/api/organizations/${organizationId}/`, {
            headers: {
                'Authorization': `Bearer ${token || ''}`,
            },
        });
    }

    // Create organization (admin only)
    async createOrganization(name, ownerEmail, initialCredits = 0, token) {
        return this.post('/imgbackendapp/api/organizations/create/', {
            name,
            owner_email: ownerEmail,
            initial_credits: initialCredits
        }, {
            headers: {
                'Authorization': `Bearer ${token || ''}`,
            },
        });
    }

    // Update organization (owner/admin only)
    async updateOrganization(organizationId, data, token) {
        return this.request(`/imgbackendapp/api/organizations/${organizationId}/update/`, {
            method: 'PUT',
            body: JSON.stringify(data),
            headers: {
                'Authorization': `Bearer ${token || ''}`,
            },
        });
    }

    // Delete organization (admin only)
    async deleteOrganization(organizationId, token) {
        return this.request(`/imgbackendapp/api/organizations/${organizationId}/delete/`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token || ''}`,
            },
        });
    }

    // Add user to organization (admin only)
    async addUserToOrganization(userEmail, organizationId, organizationRole = 'member', token) {
        return this.post('/imgbackendapp/api/organizations/add-user/', {
            user_email: userEmail,
            organization_id: organizationId,
            organization_role: organizationRole
        }, {
            headers: {
                'Authorization': `Bearer ${token || ''}`,
            },
        });
    }

    // Add credits to organization (admin only)
    async addOrganizationCredits(organizationId, amount, reason = 'Credit top-up by admin', token) {
        return this.post(`/imgbackendapp/api/organizations/${organizationId}/add-credits/`, {
            amount,
            reason
        }, {
            headers: {
                'Authorization': `Bearer ${token || ''}`,
            },
        });
    }

    // =====================
    // Credit Usage API endpoints
    // =====================

    // Get organization credit usage
    async getOrganizationCreditUsage(organizationId, params = {}, token) {
        return this.get(`/imgbackendapp/api/credits/organization/${organizationId}/usage/`, {
            params,
            headers: {
                'Authorization': `Bearer ${token || ''}`,
            },
        });
    }

    // Get organization credit summary
    async getOrganizationCreditSummary(organizationId, token) {
        return this.get(`/imgbackendapp/api/credits/organization/${organizationId}/summary/`, {
            headers: {
                'Authorization': `Bearer ${token || ''}`,
            },
        });
    }

    // Get all organizations credit usage (admin only)
    async getAllOrganizationsCreditUsage(params = {}, token) {
        return this.get('/imgbackendapp/api/credits/all-organizations/usage/', {
            params,
            headers: {
                'Authorization': `Bearer ${token || ''}`,
            },
        });
    }

    // Get credit usage for current user (individual, not scoped to org)
    async getUserCreditUsage(token) {
        return this.get('/api/credits/user/usage/', {
            headers: {
                'Authorization': `Bearer ${token || ''}`,
            },
        });
    }

    // Get payment history for current user (works for both org and individual users)
    async getPaymentHistory(token, organizationId = null) {
        const url = organizationId
            ? `/api/payments/history/?organization_id=${organizationId}`
            : '/api/payments/history/';
        return this.get(url, {
            headers: {
                'Authorization': `Bearer ${token || ''}`,
            },
        });
    }

    // Get credit settings (public read-only)
    async getCreditSettings() {
        return this.request('/api/credits/settings/');
    }

    // Plans endpoints
    async getPlans(activeOnly = true) {
        const endpoint = activeOnly
            ? '/api/plans/?active_only=true'
            : '/api/plans/';
        return this.request(endpoint);
    }

    async getPlan(planId) {
        return this.request(`/api/plans/${planId}/`);
    }

    // Contact Sales (Enterprise lead form) - no auth required
    async submitContactSales(data) {
        return this.request('/api/payments/contact-sales/', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    }

    // Submit Contact Form (Footer) - no auth required
    async submitContact(data) {
        return this.request('/api/homepage/contact/', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    }

    // Page content (CMS): home, about, vision_mission, tutorials, security
    async getPageContent(slug) {
        const res = await this.get(`/api/homepage/content/${slug}/`);
        return res?.content ?? {};
    }

    // Blog (public)
    async getBlogPosts() {
        const res = await this.get('/api/homepage/blog/');
        return res?.posts ?? [];
    }
    async getBlogPost(slug) {
        const res = await this.get(`/api/homepage/blog/${slug}/`);
        return res?.post ?? null;
    }

    // Legal endpoints
    async getLegalContent(type) {
        return this.get(`/api/legal/${type}/`);
    }

    // Invoice endpoints
    async getInvoiceConfig(token) {
        return this.get('/api/invoices/config/', {
            headers: {
                'Authorization': `Bearer ${token || ''}`,
            },
        });
    }

    // Legal Compliance endpoints
    async getLegalContent(contentType) {
        if (contentType) {
            return this.request(`/api/legal/${contentType}/`);
        } else {
            return this.request('/api/legal/');
        }
    }
}

// Configure axios to add token to all requests
axios.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token && config.url.includes('/imgbackendapp/')) {
            config.headers['Authorization'] = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// On 401 or token errors from axios, logout and redirect to login
axios.interceptors.response.use(
    (response) => response,
    (error) => {
        const status = error?.response?.status;
        const message = error?.response?.data?.error || error?.response?.data?.message || error?.message || '';
        if (status === 401 || isTokenRelatedError({ message })) {
            handleTokenError();
        }
        return Promise.reject(error);
    }
);

export const apiService = new ApiService();
export default apiService;
