import {
  sqliteTable,
  text,
  integer,
  real
} from "drizzle-orm/sqlite-core";

// 1. CRM & Core
export const clients = sqliteTable('clients', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  contactPerson: text('contact_person'),
  phone: text('phone'),
  email: text('email'),
  address: text('address'),
});

export const leads = sqliteTable('leads', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  clientId: integer('client_id').references(() => clients.id).notNull(),
  serviceName: text('service_name').notNull(),
  estimatedValue: real('estimated_value'),
  status: text('status').default('New'),
  createdAt: integer('created_at', { mode: 'timestamp' }),
});

export const projects = sqliteTable('projects', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  leadId: integer('lead_id').references(() => leads.id),
  clientId: integer('client_id').references(() => clients.id).notNull(),
  name: text('name').notNull(),
  value: real('value'),
  status: text('status').default('In Progress'),
  progress: integer('progress').default(0),
  startDate: integer('start_date', { mode: 'timestamp' }),
  deadline: integer('deadline', { mode: 'timestamp' }),
});

// 2. Billing & Procurement
export const quotations = sqliteTable('quotations', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  clientId: integer('client_id').references(() => clients.id).notNull(),
  projectId: integer('project_id').references(() => projects.id),
  date: integer('date', { mode: 'timestamp' }).notNull(),
  validUntil: integer('valid_until', { mode: 'timestamp' }),
  subtotal: real('subtotal'),
  tax: real('tax_ppn'),
  total: real('total'),
  status: text('status').default('Draft'),
});

export const quotationItems = sqliteTable('quotation_items', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  quotationId: integer('quotation_id').references(() => quotations.id).notNull(),
  description: text('description').notNull(),
  qty: integer('qty').notNull(),
  unitPrice: real('unit_price').notNull(),
  amount: real('amount').notNull(),
});

export const invoices = sqliteTable('invoices', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  clientId: integer('client_id').references(() => clients.id).notNull(),
  projectId: integer('project_id').references(() => projects.id),
  quotationId: integer('quotation_id').references(() => quotations.id),
  date: integer('date', { mode: 'timestamp' }).notNull(),
  dueDate: integer('due_date', { mode: 'timestamp' }),
  subtotal: real('subtotal'),
  tax: real('tax_ppn'),
  total: real('total'),
  status: text('status').default('Unpaid'),
});

export const invoiceItems = sqliteTable('invoice_items', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  invoiceId: integer('invoice_id').references(() => invoices.id).notNull(),
  description: text('description').notNull(),
  qty: integer('qty').notNull(),
  unitPrice: real('unit_price').notNull(),
  amount: real('amount').notNull(),
});

// 3. Finance
export const payments = sqliteTable('payments', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  invoiceId: integer('invoice_id').references(() => invoices.id).notNull(),
  clientId: integer('client_id').references(() => clients.id).notNull(),
  amount: real('amount').notNull(),
  paymentMethod: text('payment_method'),
  date: integer('date', { mode: 'timestamp' }).notNull(),
  referenceCode: text('reference_code'),
});

export const expenses = sqliteTable('expenses', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  date: integer('date', { mode: 'timestamp' }).notNull(),
  category: text('category').notNull(),
  description: text('description').notNull(),
  amount: real('amount').notNull(),
  status: text('status').default('Pending'),
  projectId: integer('project_id').references(() => projects.id),
});

// 4. Accounting (Double-Entry)
export const accounts = sqliteTable('accounts', {
  code: text('code').primaryKey(),
  name: text('name').notNull(),
  type: text('type').notNull(),
  normalBalance: text('normal_balance').notNull(),
});

export const journals = sqliteTable('journals', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  date: integer('date', { mode: 'timestamp' }).notNull(),
  description: text('description').notNull(),
  referenceId: text('reference_id'),
});

export const journalEntries = sqliteTable('journal_entries', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  journalId: integer('journal_id').references(() => journals.id).notNull(),
  accountCode: text('account_code').references(() => accounts.code).notNull(),
  debit: real('debit').default(0),
  credit: real('credit').default(0),
});
