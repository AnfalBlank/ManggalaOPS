export type LeadStatus = "New" | "Follow Up" | "Negotiation" | "Won" | "Lost";
export type ProjectStatus = "In Progress" | "Completed" | "On Hold";
export type QuotationStatus = "Draft" | "Sent" | "Accepted" | "Rejected";
export type InvoiceStatus = "Unpaid" | "Partially Paid" | "Paid" | "Overdue";

export type LeadListItem = {
  id: number;
  code: string;
  clientId: number;
  clientName: string;
  contactPerson: string | null;
  phone: string | null;
  serviceName: string;
  estimatedValue: number;
  status: string;
  createdAt: string | null;
};

export type ProjectListItem = {
  id: number;
  code: string;
  leadId: number | null;
  clientId: number;
  clientName: string;
  name: string;
  value: number;
  status: string;
  progress: number;
  startDate: string | null;
  deadline: string | null;
};

export type QuotationListItem = {
  id: number;
  code: string;
  clientId: number;
  clientName: string;
  projectId: number | null;
  projectName: string | null;
  date: string | null;
  validUntil: string | null;
  subtotal: number;
  tax: number;
  total: number;
  status: string;
};

export type InvoiceListItem = {
  id: number;
  code: string;
  clientId: number;
  clientName: string;
  projectId: number | null;
  projectName: string | null;
  quotationId: number | null;
  date: string | null;
  dueDate: string | null;
  subtotal: number;
  tax: number;
  total: number;
  amountPaid: number;
  outstandingAmount: number;
  status: string;
};

export type PaymentListItem = {
  id: number;
  code: string;
  invoiceId: number;
  invoiceCode: string;
  clientId: number;
  clientName: string;
  amount: number;
  paymentMethod: string | null;
  date: string | null;
  referenceCode: string | null;
};

export type DashboardSummary = {
  totalLeads: number;
  wonLeads: number;
  totalRevenue: number;
  outstandingInvoices: number;
};
