// Service Billing & Tax Invoice Types

export type PaymentMethod = 'CASH' | 'UPI' | 'BANK_TRANSFER';
export type OrderStatus = 'delivered' | 'cancelled';
export type OrderPaymentStatus = 'pending' | 'completed' | 'failed';

export interface Order {
  id: number;
  invoice_number: string;
  client_name: string;
  status: OrderStatus;
  payment_status: OrderPaymentStatus;
  payment_method: PaymentMethod;
  taxable_value: number;
  cgst_amount: number;
  sgst_amount: number;
  grand_total: number;
  notes: string | null;
  linked_transaction_id: number | null;
  created_by: number | null;
  created_at: string;
  updated_at: string;
}

export interface OrderItem {
  id: number;
  order_id: number;
  description: string;
  quantity: number;
  rate: number;
  line_total: number;
  created_at: string;
}

/** A single free-text line entered on the invoice form before submit */
export interface InvoiceLineItem {
  description: string;
  quantity: number;
  rate: number;
}

export interface GstBreakdown {
  taxableValue: number;
  cgstAmount: number;
  sgstAmount: number;
  grandTotal: number;
}

export interface ProcessServiceInvoiceInput {
  clientName: string;
  paymentMethod: PaymentMethod;
  items: InvoiceLineItem[];
  notes?: string | null;
}

/** A receipt-ready line item, used by InvoiceReceipt / BulkReceiptWrapper */
export interface ReceiptLineItem {
  description: string;
  quantity: number;
  lineTotal: number;
}

export interface ReceiptData {
  invoiceNumber: string;
  orderNumber: string;
  createdAt: string;
  paymentMethod: PaymentMethod;
  clientName: string;
  clientPhone?: string | null;
  items: ReceiptLineItem[];
  taxableValue: number;
  cgstAmount: number;
  sgstAmount: number;
  grandTotal: number;
}

export interface ProcessServiceInvoiceResult {
  success: boolean;
  error?: string;
  financeSyncFailed?: boolean;
  orderId?: number;
  orderNumber?: string;
  invoiceNumber?: string;
  receipt?: ReceiptData;
}
