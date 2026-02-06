
const axios = require('axios');

// Mock API base URL (assuming default django port)
const API_BASE_URL = 'http://127.0.0.1:8000';

class ApiService {
    constructor() {
        this.baseURL = API_BASE_URL;
    }

    async request(endpoint, options = {}) {
        const url = `${this.baseURL}${endpoint}`;
        console.log(`Requesting: ${url}`);
        try {
            const response = await axios({
                url,
                ...options
            });
            return response.data;
        } catch (error) {
            console.error(`Error requesting ${url}:`, error.message);
            if (error.response) {
                console.error("Response data:", error.response.data);
                console.error("Response status:", error.response.status);
            }
            return null;
        }
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

const apiService = new ApiService();

async function testLegalContent() {
    console.log("Testing getLegalContent('terms')...");
    const terms = await apiService.getLegalContent('terms');
    console.log("Terms result:", terms);

    console.log("\nTesting getLegalContent('privacy')...");
    const privacy = await apiService.getLegalContent('privacy');
    console.log("Privacy result:", privacy);
}

testLegalContent();
