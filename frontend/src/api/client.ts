/**
 * API client for plainfigures
 */
import {
  ApiResponse,
  Transaction,
  TransactionCreateRequest,
  CashflowSummary,
  Invoice,
  InvoiceCreateRequest,
  Customer,
  Supplier,
  UploadResponse,
  AgentResponse,
  AIRecommendationsResponse,
  UserProfile,
} from './types';
import { FinanceRoutes } from './routes';

const API_BASE_URL = '/api';

class ApiError extends Error {
  constructor(
    message: string,
    public status?: number,
    public response?: any
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

/**
 * Base fetch wrapper with error handling
 */
async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  
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
    const response = await fetch(url, config);
    
    if (!response.ok) {
      throw new ApiError(
        `API request failed: ${response.status} ${response.statusText}`,
        response.status,
        response
      );
    }

    return await response.json();
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(`Network error: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}



/**
 * API client class - delegates to FinanceRoutes for backend communication
 */
export class FinanceApiClient {
  // Transaction operations
  static async createTransaction(data: TransactionCreateRequest): Promise<ApiResponse<Transaction>> {
    try {
      const result = await FinanceRoutes.createTransaction(data);
      return {
        success: true,
        data: result as Transaction,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  static async getTransactions(userId?: string): Promise<ApiResponse<Transaction[]>> {
    try {
      const params = userId ? `?user_id=${encodeURIComponent(userId)}` : '';
      console.log('FinanceApiClient: Making request to /transactions' + params);
      const result = await apiRequest(`/transactions${params}`) as any;
      console.log('FinanceApiClient: Raw API result:', result);
      return {
        success: true,
        data: (result.data || []) as Transaction[],
      };
    } catch (error) {
      console.error('FinanceApiClient: Error in getTransactions:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  static async getCashflowSummary(
    userId?: string,
    lookbackDays: number = 30
  ): Promise<ApiResponse<CashflowSummary>> {
    try {
      const result = await FinanceRoutes.getCashflowSummary(userId, lookbackDays);
      return {
        success: true,
        data: result as CashflowSummary,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  static async getInvoices(): Promise<ApiResponse<Invoice[]>> {
    try {
      // Will need to implement invoice list endpoint
      return {
        success: true,
        data: [],
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  // Customer/Supplier operations
  static async getCustomers(): Promise<ApiResponse<Customer[]>> {
    try {
      const result = await FinanceRoutes.getCustomers() as any;
      return {
        success: true,
        data: (result.customers || []) as Customer[],
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  static async getSuppliers(): Promise<ApiResponse<Supplier[]>> {
    try {
      const result = await FinanceRoutes.getSuppliers() as any;
      return {
        success: true,
        data: (result.suppliers || []) as Supplier[],
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  // File upload operations
  static async uploadInvoiceImage(file: File): Promise<UploadResponse> {
    const result = await FinanceRoutes.uploadInvoiceImage(file);
    return result as UploadResponse;
  }

  static async uploadInvoicePDF(file: File): Promise<UploadResponse> {
    const result = await FinanceRoutes.uploadInvoicePDF(file);
    return result as UploadResponse;
  }

  // Agent operations
  static async sendMessage(message: string): Promise<AgentResponse> {
    const result = await FinanceRoutes.sendMessage(message);
    return result as AgentResponse;
  }

  // Health check
  static async healthCheck(): Promise<{ status: string }> {
    const result = await FinanceRoutes.healthCheck();
    return result as { status: string };
  }

  // AI Recommendations
  static async getAIRecommendations(userId?: string): Promise<ApiResponse<AIRecommendationsResponse>> {
    try {
      const result = await FinanceRoutes.getAIRecommendations(userId);
      return { success: true, data: result as AIRecommendationsResponse };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Failed to get AI recommendations' };
    }
  }

  // User Profile
  static async getUserProfile(userId: string): Promise<ApiResponse<UserProfile>> {
    try {
      const result = await FinanceRoutes.getUserProfile(userId);
      return { success: true, data: result as UserProfile };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Failed to get user profile' };
    }
  }

  // Simple AI Recommendations (using GPT-4o directly)
  static async getOpenAIRecommendations(): Promise<ApiResponse<any>> {
    try {
      const result = await FinanceRoutes.getOpenAIRecommendations();
      // Backend already returns wrapped response {success, data, message, error}
      return result as ApiResponse<any>;
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Failed to get AI recommendations' };
    }
  }
}

export { ApiError };
