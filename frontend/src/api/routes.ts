/**
 * API route handlers that map frontend requests to backend endpoints
 * This serves as a proxy layer between the React frontend and Python backend
 */

// Import statements for type checking if needed
// import { } from './types';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

// Add debug logging for production
if (import.meta.env.PROD) {
  console.log('Production backend URL:', BACKEND_URL);
}

/**
 * Base request wrapper for backend communication
 */
async function backendRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${BACKEND_URL}${endpoint}`;
  
  const defaultHeaders = {
    'Content-Type': 'application/json',
  };

  const config: RequestInit = {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
  };

  try {
    console.log(`Making request to: ${url}`);
    const response = await fetch(url, config);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Backend request failed: ${response.status} ${response.statusText}`, errorText);
      throw new Error(`Backend request failed: ${response.status} ${response.statusText} - ${errorText}`);
    }

    return await response.json();
  } catch (error) {
    console.error(`Network error for ${url}:`, error);
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new Error(`Network connection failed: Unable to reach backend at ${BACKEND_URL}. Check CORS settings and network connectivity.`);
    }
    throw error;
  }
}

/**
 * Finance API route handlers
 */
export const FinanceRoutes = {
  // Health check
  async healthCheck() {
    return backendRequest('/health');
  },

  // Transaction operations
  async getTransactions(userId?: string) {
    // Get transactions directly from the REST endpoint
    const params = userId ? `?user_id=${encodeURIComponent(userId)}` : '';
    return backendRequest(`/transactions${params}`);
  },

  async getCashflowSummary(userId?: string, lookbackDays: number = 30) {
    const payload = {
      function_name: 'summarize_cashflow',
      parameters: {
        user_id: userId,
        lookback_days: lookbackDays,
      }
    };

    return backendRequest('/functions/call', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  // Customer/Supplier operations
  async getCustomers() {
    const payload = {
      function_name: 'load_customers',
      parameters: {}
    };

    return backendRequest('/functions/call', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  // File upload operations
  async uploadInvoiceImage(file: File) {
    // Convert file to base64 for backend processing
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = async () => {
        try {
          const base64 = (reader.result as string).split(',')[1];
          const payload = {
            function_name: 'extract_invoice_data_from_image',
            parameters: {
              invoice_base64_image: base64
            }
          };

          const result = await backendRequest('/functions/call', {
            method: 'POST',
            body: JSON.stringify(payload),
          });

          resolve(result);
        } catch (error) {
          reject(error);
        }
      };
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsDataURL(file);
    });
  },

  async uploadInvoicePDF(file: File) {
    // Convert file to bytes for backend processing
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = async () => {
        try {
          const arrayBuffer = reader.result as ArrayBuffer;
          const bytes = new Uint8Array(arrayBuffer);
          
          const payload = {
            function_name: 'extract_invoice_data_from_pdf',
            parameters: {
              invoice_pdf_bytes: Array.from(bytes)
            }
          };

          const result = await backendRequest('/functions/call', {
            method: 'POST',
            body: JSON.stringify(payload),
          });

          resolve(result);
        } catch (error) {
          reject(error);
        }
      };
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsArrayBuffer(file);
    });
  },

  // User Profile
  async getUserProfile(userId: string) {
    return backendRequest(`/users/${userId}/profile`);
  },

  // Simple AI Recommendations (using GPT-4o directly)
  async getOpenAIRecommendations() {
    return backendRequest('/ai/openai-recommendations');
  },

  async getMarketResearch() {
    return backendRequest('/ai/market-research');
  },

  async getAICharts(timeRange: string = "30d", scenario: string = "current") {
    return backendRequest(`/ai/charts?time_range=${timeRange}&scenario=${scenario}`);
  },

  async getEnhancedRecommendations(marketResearchData: string) {
    return backendRequest('/ai/enhanced-recommendations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        market_research_data: marketResearchData
      })
    });
  },

  // Authentication operations
  async registerUser(email: string, password: string, companyName: string, ownerName: string) {
    return backendRequest('/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        email,
        password,
        company_name: companyName,
        owner_name: ownerName
      })
    });
  },

  async loginUser(email: string, password: string) {
    return backendRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        email,
        password
      })
    });
  },

  async completeUserProfile(userId: string, profileData: any) {
    return backendRequest(`/users/${userId}/profile/complete`, {
      method: 'POST',
      body: JSON.stringify({
        profile_data: profileData
      })
    });
  },

  async updateUserProfile(userId: string, profileData: any) {
    return backendRequest(`/users/${userId}/profile`, {
      method: 'PUT',
      body: JSON.stringify({
        profile_data: profileData
      })
    });
  },

  async ragQuery(question: string, userContext: any) {
    return backendRequest('/rag/query', {
      method: 'POST',
      body: JSON.stringify({
        question,
        user_context: userContext
      })
    });
  },
};
