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
  payment_id: string;
  invoice_id: string;
  payment_amount: number;
  currency: string;
  payment_date: string;
  payment_method: string;
  reference: string;
  category: string;
  direction: 'IN' | 'OUT';
  counterparty_id: string;
  counterparty_type: string;
  exchange_rate_used?: number | null;
  fees_amount?: number | null;
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
  by_currency: Record<string, { in: number; out: number }>;
  rows_considered: number;
}

// Invoice types
export interface Invoice {
  user_id: string;
  invoice_id: string;
  invoice_type: 'Accounts Receivable' | 'Accounts Payable';
  issue_date: string; // e.g. "1/6/24"
  due_date: string;   // e.g. "30/6/24"
  counterparty_id: string;
  currency_code: string;
  tax_rate_percent_total: number;
  tax_amount_total: number;
  subtotal: number;
  payable_amount_total: number;
  payment_terms: string;
  purchase_order_ref?: string;
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';
  paid_date?: string;
  exhcange_rate_to_base?: number;
  notes?: string;
}

export interface InvoiceLineItem {
  invoice_id: string;
  line_id: string;
  item_sku: string;
  item_name: string;
  item_description: string;
  quantity: number;
  unit_code: string;
  unit_price: number;
  currency: string;
  line_tax_rate_percent: number;
  line_tax_amount: number;
  total_amount: number;
  vendor: string;
  issue_date: string;
  due_date: string;
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
  customer_id: string;
  user_id: string;
  name: string;
  tax_reg_id?: string;
  address_line1?: string;
  address_line2?: string;
  city?: string;
  postal_code?: string;
  contact_name?: string;
  email?: string;
  phone?: string;
  default_payment_terms?: string;
  preferred_currency?: string;
  created_at?: string;
}

export interface Supplier {
  supplier_id: string;
  user_id: string;
  name: string;
  tax_reg_id?: string;
  address_line1?: string;
  address_line2?: string;
  city?: string;
  postal_code?: string;
  contact_name?: string;
  email?: string;
  phone?: string;
  default_payment_terms?: string;
  preferred_currency?: string;
  created_at?: string;
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
