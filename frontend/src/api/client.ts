/**
 * API client for plainfigures
 */
import {
  ApiResponse,
  Transaction,
  TransactionCreateRequest,
  CashflowSummary,
  Customer,
  Supplier,
  UploadResponse,
  UserProfile,
} from './types';
import { FinanceRoutes } from './routes';

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

// Note: apiRequest function removed as it's replaced by FinanceRoutes.* methods



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
      const result = await FinanceRoutes.getTransactions(userId) as any;
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

  // Health check
  static async healthCheck(): Promise<{ status: string }> {
    const result = await FinanceRoutes.healthCheck();
    return result as { status: string };
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

  static async getMarketResearch(): Promise<ApiResponse<any>> {
    try {
      const result = await FinanceRoutes.getMarketResearch();
      return result as ApiResponse<any>;
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Failed to get market research' };
    }
  }
}

export { ApiError };
