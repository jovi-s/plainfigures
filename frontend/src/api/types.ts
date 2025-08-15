/**
 * TypeScript interfaces for plainfigures API
 */

// Base types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

// Transaction types
export interface Transaction {
  user_id: string;
  date: string;
  category: string;
  currency: string;
  amount: number;
  direction: 'IN' | 'OUT';
  counterparty_id?: string;
  counterparty_type?: string;
  transaction_id: string;
  description?: string;
  document_reference?: string;
  tax_amount?: number;
  payment_method?: string;
}

export interface TransactionCreateRequest {
  user_id: string;
  date: string;
  category: string;
  currency: string;
  amount: number;
  direction: 'IN' | 'OUT';
  counterparty_id?: string;
  counterparty_type?: string;
  description?: string;
  document_reference?: string;
  tax_amount?: number;
  payment_method?: string;
}

// Cashflow summary types
export interface CashflowSummary {
  totals: {
    in: number;
    out: number;
    net: number;
  };
  by_category: Record<string, number>;
  rows_considered: number;
}

// Invoice types
export interface Invoice {
  user_id: string;
  invoice_id: string;
  invoice_type: 'AR' | 'AP';
  counterparty_id: string;
  issue_date: string;
  due_date: string;
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';
  currency: string;
  subtotal: number;
  tax_rate: number;
  tax_amount: number;
  total: number;
  payment_terms?: string;
  fx_rate_to_base?: string;
  notes?: string;
}

export interface InvoiceLineItem {
  description: string;
  quantity: number;
  unit_price: number;
  tax_rate: number;
}

export interface InvoiceCreateRequest {
  user_id: string;
  invoice_type: 'AR' | 'AP';
  counterparty_id: string;
  issue_date: string;
  due_date: string;
  currency: string;
  line_items: InvoiceLineItem[];
  payment_terms?: string;
  notes?: string;
}

// Customer/Supplier types
export interface Customer {
  id: string;
  name: string;
  address?: string;
  tax_id?: string;
  email?: string;
  phone?: string;
}

export interface Supplier {
  id: string;
  name: string;
  address?: string;
  tax_id?: string;
  email?: string;
  phone?: string;
}

// OCR/Upload types
export interface InvoiceData {
  vendor?: string;
  issue_date?: string;
  due_date?: string;
  currency?: string;
  line_items?: Array<{
    description: string;
    qty: number;
    unit_price: number;
    tax_rate: number;
  }>;
  subtotal?: number;
  tax?: number;
  total?: number;
  raw_text?: string;
}

export interface UploadResponse {
  invoice_data: InvoiceData;
}

// Agent interaction types
export interface AgentMessage {
  type: 'human' | 'ai';
  content: string;
  id: string;
  agent?: string;
  timestamp?: string;
}

export interface AgentResponse {
  action: string;
  result: any;
  message?: string;
}

// AI Recommendations types
export interface Recommendation {
  type: 'AP_REDUCTION' | 'AR_INCREASE' | 'CASHFLOW_PROJECTION';
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  actionItems: string[];
}

export interface AIRecommendationsResponse {
  recommendations: Recommendation[];
  generated_at: string;
  context_summary: string;
}

// User Profile types
export interface UserProfile {
  user_id: number;
  company_name: string;
  owner_name: string;
  industry: string;
  country: string;
  employees: number;
  annual_revenue_usd: number;
  years_in_business: number;
  primary_business_activity: string;
}

// File upload types
export interface FileUploadRequest {
  file: File;
  type: 'image' | 'pdf';
}
