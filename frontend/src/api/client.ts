/**
 * API client for plainfigures
 */
import {
  ApiResponse,
  Transaction,
  CashflowSummary,
  Customer,
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
      const result = await FinanceRoutes.getUserProfile(userId) as any;
      return {
        success: result.success || false,
        data: result.data || null,
        error: result.error || null,
      };
    } catch (error) {
      console.error('FinanceApiClient: Error in getUserProfile:', error);
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

  static async getAICharts(timeRange: string = "30d", scenario: string = "current"): Promise<ApiResponse<any>> {
    try {
      const result = await FinanceRoutes.getAICharts(timeRange, scenario);
      return result as ApiResponse<any>;
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Failed to get AI charts' };
    }
  }

  static async getEnhancedRecommendations(marketResearchData: string): Promise<ApiResponse<any>> {
    try {
      const result = await FinanceRoutes.getEnhancedRecommendations(marketResearchData);
      return result as ApiResponse<any>;
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Failed to get enhanced recommendations' };
    }
  }

  // Authentication operations
  static async registerUser(email: string, password: string, companyName: string, ownerName: string): Promise<ApiResponse<any>> {
    try {
      const result = await FinanceRoutes.registerUser(email, password, companyName, ownerName) as any;
      return {
        success: result.success || false,
        data: result.data || null,
        error: result.error || null,
      };
    } catch (error) {
      console.error('FinanceApiClient: Error in registerUser:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  static async loginUser(email: string, password: string): Promise<ApiResponse<any>> {
    try {
      const result = await FinanceRoutes.loginUser(email, password) as any;
      return {
        success: result.success || false,
        data: result.data || null,
        error: result.error || null,
      };
    } catch (error) {
      console.error('FinanceApiClient: Error in loginUser:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  static async completeUserProfile(userId: string, profileData: any): Promise<ApiResponse<any>> {
    try {
      const result = await FinanceRoutes.completeUserProfile(userId, profileData) as any;
      return {
        success: result.success || false,
        data: result.data || null,
        error: result.error || null,
      };
    } catch (error) {
      console.error('FinanceApiClient: Error in completeUserProfile:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  static async updateUserProfile(userId: string, profileData: any): Promise<ApiResponse<any>> {
    try {
      const result = await FinanceRoutes.updateUserProfile(userId, profileData) as any;
      return {
        success: result.success || false,
        data: result.data || null,
        error: result.error || null,
      };
    } catch (error) {
      console.error('FinanceApiClient: Error in updateUserProfile:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  static async ragQuery(question: string, userContext: any): Promise<ApiResponse<any>> {
    try {
      const result = await FinanceRoutes.ragQuery(question, userContext) as any;
      return result as ApiResponse<any>;
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }
}

export { ApiError };
