/**
 * API route handlers that map frontend requests to backend endpoints
 * This serves as a proxy layer between the React frontend and Python backend
 */

import { 
  TransactionCreateRequest
} from './types';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

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

  const response = await fetch(url, config);
  
  if (!response.ok) {
    throw new Error(`Backend request failed: ${response.status} ${response.statusText}`);
  }

  return await response.json();
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
  async createTransaction(data: TransactionCreateRequest) {
    // Map to backend function call format
    const payload = {
      function_name: 'record_transaction',
      parameters: {
        user_id: data.user_id,
        date: data.date,
        category: data.category,
        currency: data.currency,
        amount: data.amount,
        direction: data.direction,
        counterparty_id: data.counterparty_id,
        counterparty_type: data.counterparty_type,
        description: data.description,
        document_reference: data.document_reference,
        tax_amount: data.tax_amount,
        payment_method: data.payment_method,
      }
    };

    return backendRequest('/functions/call', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

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

  async getSuppliers() {
    const payload = {
      function_name: 'load_suppliers',
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

  // Agent messaging
  async sendMessage(message: string) {
    const payload = {
      message: message,
      user_id: 'user_1', // Default user
    };

    return backendRequest('/agent/message', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  // AI Recommendations
  async getAIRecommendations(userId?: string) {
    const params = userId ? `?user_id=${userId}` : '';
    return backendRequest(`/ai/recommendations${params}`);
  },

  // User Profile
  async getUserProfile(userId: string) {
    return backendRequest(`/users/${userId}/profile`);
  },

  // Simple AI Recommendations (using GPT-4o directly)
  async getOpenAIRecommendations() {
    return backendRequest('/ai/openai-recommendations');
  },
};
