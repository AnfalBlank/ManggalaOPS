import {
  sqliteTable,
  text,
  integer,
  real
} from "drizzle-orm/sqlite-core";

export const users = sqliteTable('users', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  role: text('role').notNull(),
  avatarUrl: text('avatar_url'),
  createdAt: integer('created_at', { mode: 'timestamp' }),
});

export const sessions = sqliteTable('sessions', {
  id: text('id').primaryKey(),
  userId: integer('user_id').references(() => users.id).notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }),
  expiresAt: integer('expires_at', { mode: 'timestamp' }),
});

export const notifications = sqliteTable('notifications', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  title: text('title').notNull(),
  message: text('message'),
  type: text('type').default('info'),
  targetRole: text('target_role'),
  isRead: integer('is_read', { mode: 'boolean' }).default(false),
  createdAt: integer('created_at', { mode: 'timestamp' }),
});

export const chatThreads = sqliteTable('chat_threads', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  title: text('title').notNull(),
  kind: text('kind').default('direct'),
  projectId: integer('project_id').references(() => projects.id),
  createdByUserId: integer('created_by_user_id').references(() => users.id),
  createdAt: integer('created_at', { mode: 'timestamp' }),
});

export const chatParticipants = sqliteTable('chat_participants', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  threadId: integer('thread_id').references(() => chatThreads.id).notNull(),
  userId: integer('user_id').references(() => users.id).notNull(),
});

export const chatMessages = sqliteTable('chat_messages', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  threadId: integer('thread_id').references(() => chatThreads.id).notNull(),
  senderUserId: integer('sender_user_id').references(() => users.id).notNull(),
  body: text('body').notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }),
});

export const openingBalances = sqliteTable('opening_balances', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  cashOnHand: real('cash_on_hand').default(0),
  bankMandiri: real('bank_mandiri').default(0),
  bankBca: real('bank_bca').default(0),
  receivables: real('receivables').default(0),
  fixedAssets: real('fixed_assets').default(0),
  liabilities: real('liabilities').default(0),
  equity: real('equity').default(0),
  createdAt: integer('created_at', { mode: 'timestamp' }),
  updatedAt: integer('updated_at', { mode: 'timestamp' }),
});

export const appSettings = sqliteTable('app_settings', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  companyName: text('company_name').notNull().default('PT. Manggala Utama Indonesia'),
  companyEmail: text('company_email').default('admin@manggala-utama.id'),
  companyPhone: text('company_phone').default('+62 878-8424-1703'),
  companyAddress: text('company_address').default('Jakarta'),
  defaultTaxPercent: real('default_tax_percent').default(11),
  quotationValidityDays: integer('quotation_validity_days').default(7),
  invoiceDueDays: integer('invoice_due_days').default(14),
  defaultPaymentMethod: text('default_payment_method').default('CBD'),
  defaultSignatoryName: text('default_signatory_name').default('Muhammad Hidayat'),
  defaultSignatoryTitle: text('default_signatory_title').default('Direktur'),
  defaultCashAccountCode: text('default_cash_account_code').references(() => accounts.code),
  defaultBankMandiriAccountCode: text('default_bank_mandiri_account_code').references(() => accounts.code),
  defaultBankBcaAccountCode: text('default_bank_bca_account_code').references(() => accounts.code),
  defaultReceivableAccountCode: text('default_receivable_account_code').references(() => accounts.code),
  defaultFixedAssetAccountCode: text('default_fixed_asset_account_code').references(() => accounts.code),
  defaultLiabilityAccountCode: text('default_liability_account_code').references(() => accounts.code),
  defaultEquityAccountCode: text('default_equity_account_code').references(() => accounts.code),
  defaultProjectRevenueAccountCode: text('default_project_revenue_account_code').references(() => accounts.code),
  defaultNonProjectRevenueAccountCode: text('default_non_project_revenue_account_code').references(() => accounts.code),
  defaultOperationalExpenseAccountCode: text('default_operational_expense_account_code').references(() => accounts.code),
  defaultProjectExpenseAccountCode: text('default_project_expense_account_code').references(() => accounts.code),
  financeApprovalRequired: integer('finance_approval_required', { mode: 'boolean' }).default(true),
  allowUserSelfReset: integer('allow_user_self_reset', { mode: 'boolean' }).default(false),
  signatureImageUrl: text('signature_image_url'),
  stampImageUrl: text('stamp_image_url'),
  // Penawaran ditandatangani marketing (beda dengan tagihan & kwitansi yang pakai penanda tangan default).
  quotationSignatoryName: text('quotation_signatory_name').default('Adiatma Pasau'),
  quotationSignatoryTitle: text('quotation_signatory_title').default('Manager Marketing'),
  quotationSignatureImageUrl: text('quotation_signature_image_url'),
  updatedAt: integer('updated_at', { mode: 'timestamp' }),
});

// 1. CRM & Core
export const clients = sqliteTable('clients', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  contactPerson: text('contact_person'),
  additionalPic: text('additional_pic'),
  phone: text('phone'),
  email: text('email'),
  npwp: text('npwp'),
  address: text('address'),
  notes: text('notes'),
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
  paymentMethod: text('payment_method').default('CBD'),
  attachment: text('attachment'),
  subject: text('subject'),
  recipientName: text('recipient_name'),
  recipientCompany: text('recipient_company'),
  recipientAddress: text('recipient_address'),
  introduction: text('introduction'),
  terms: text('terms'),
  closingNote: text('closing_note'),
  signatoryName: text('signatory_name'),
  signatoryTitle: text('signatory_title'),
  subtotal: real('subtotal'),
  tax: real('tax_ppn'),
  total: real('total'),
  subtotalCost: real('subtotal_cost').default(0),
  totalMargin: real('total_margin').default(0),
  marginPercentage: real('margin_percentage').default(0),
  status: text('status').default('Draft'),
});

export const quotationItems = sqliteTable('quotation_items', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  quotationId: integer('quotation_id').references(() => quotations.id).notNull(),
  description: text('description').notNull(),
  qty: integer('qty').notNull(),
  unit: text('unit').default('Unit'),
  unitPrice: real('unit_price').notNull(),
  unitCost: real('unit_cost').default(0),
  amount: real('amount').notNull(),
  imageUrl: text('image_url'),
});

export const invoices = sqliteTable('invoices', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  clientId: integer('client_id').references(() => clients.id).notNull(),
  projectId: integer('project_id').references(() => projects.id),
  quotationId: integer('quotation_id').references(() => quotations.id),
  date: integer('date', { mode: 'timestamp' }).notNull(),
  dueDate: integer('due_date', { mode: 'timestamp' }),
  paymentMethod: text('payment_method').default('CBD'),
  attachment: text('attachment'),
  subject: text('subject'),
  recipientName: text('recipient_name'),
  recipientCompany: text('recipient_company'),
  recipientAddress: text('recipient_address'),
  introduction: text('introduction'),
  terms: text('terms'),
  closingNote: text('closing_note'),
  signatoryName: text('signatory_name'),
  signatoryTitle: text('signatory_title'),
  subtotal: real('subtotal'),
  tax: real('tax_ppn'),
  total: real('total'),
  clientPoId: integer('client_po_id'),
  status: text('status').default('Unpaid'),
});

export const invoiceItems = sqliteTable('invoice_items', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  invoiceId: integer('invoice_id').references(() => invoices.id).notNull(),
  description: text('description').notNull(),
  qty: integer('qty').notNull(),
  unit: text('unit').default('Unit'),
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
  paymentAccountCode: text('payment_account_code').references(() => accounts.code),
  date: integer('date', { mode: 'timestamp' }).notNull(),
  referenceCode: text('reference_code'),
});

export const expenses = sqliteTable('expenses', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  date: integer('date', { mode: 'timestamp' }).notNull(),
  category: text('category').notNull(),
  description: text('description').notNull(),
  amount: real('amount').notNull(),
  taxMode: text('tax_mode').default('none'),
  taxPercent: real('tax_percent').default(0),
  taxAmount: real('tax_amount').default(0),
  baseAmount: real('base_amount').default(0),
  status: text('status').default('Pending'),
  projectId: integer('project_id').references(() => projects.id),
  paymentAccountCode: text('payment_account_code').references(() => accounts.code),
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

// 4b. Delivery Orders (Surat Jalan)
export const deliveryOrders = sqliteTable('delivery_orders', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  clientId: integer('client_id').references(() => clients.id).notNull(),
  projectId: integer('project_id').references(() => projects.id),
  invoiceId: integer('invoice_id').references(() => invoices.id),
  quotationId: integer('quotation_id').references(() => quotations.id),
  clientPoId: integer('client_po_id'),
  date: integer('date', { mode: 'timestamp' }).notNull(),
  vehicleNumber: text('vehicle_number'),
  driverName: text('driver_name'),
  shippingMethod: text('shipping_method'),
  recipientName: text('recipient_name'),
  recipientCompany: text('recipient_company'),
  recipientAddress: text('recipient_address'),
  recipientPhone: text('recipient_phone'),
  subject: text('subject'),
  introduction: text('introduction'),
  notes: text('notes'),
  closingNote: text('closing_note'),
  signatoryName: text('signatory_name'),
  signatoryTitle: text('signatory_title'),
  status: text('status').default('Draft'),
  createdAt: integer('created_at', { mode: 'timestamp' }),
});

export const deliveryOrderItems = sqliteTable('delivery_order_items', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  deliveryOrderId: integer('delivery_order_id').references(() => deliveryOrders.id).notNull(),
  clientPoItemId: integer('client_po_item_id'),
  description: text('description').notNull(),
  qty: integer('qty').notNull(),
  unit: text('unit').default('Unit'),
  serialNumber: text('serial_number'),
  notes: text('notes'),
});

// 4c. Audit log for destructive / high-risk actions
export const auditLog = sqliteTable('audit_log', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: integer('user_id').references(() => users.id),
  action: text('action').notNull(),
  entity: text('entity'),
  entityId: text('entity_id'),
  payload: text('payload'),
  ip: text('ip'),
  createdAt: integer('created_at', { mode: 'timestamp' }),
});

// 5. Tools & Utilities
export const officeLocations = sqliteTable('office_locations', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  latitude: real('latitude').notNull(),
  longitude: real('longitude').notNull(),
  radiusMeters: integer('radius_meters').default(100),
  isActive: integer('is_active', { mode: 'boolean' }).default(true),
  createdAt: integer('created_at', { mode: 'timestamp' }),
});

export const attendance = sqliteTable('attendance', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: integer('user_id').references(() => users.id).notNull(),
  date: text('date').notNull(),
  clockIn: integer('clock_in', { mode: 'timestamp' }),
  clockOut: integer('clock_out', { mode: 'timestamp' }),
  clockInLatitude: real('clock_in_latitude'),
  clockInLongitude: real('clock_in_longitude'),
  clockOutLatitude: real('clock_out_latitude'),
  clockOutLongitude: real('clock_out_longitude'),
  clockInPhoto: text('clock_in_photo'),
  clockOutPhoto: text('clock_out_photo'),
  clockInLocationId: integer('clock_in_location_id').references(() => officeLocations.id),
  clockOutLocationId: integer('clock_out_location_id').references(() => officeLocations.id),
  clockInDistance: real('clock_in_distance'),
  clockOutDistance: real('clock_out_distance'),
  status: text('status').default('present'),
  notes: text('notes'),
  createdAt: integer('created_at', { mode: 'timestamp' }),
});

export const estimations = sqliteTable('estimations', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  buyPrice: real('buy_price').notNull(),
  sellPrice: real('sell_price').notNull(),
  qty: integer('qty').notNull(),
  buyIncludePpn: integer('buy_include_ppn', { mode: 'boolean' }).notNull(),
  sellIncludePpn: integer('sell_include_ppn', { mode: 'boolean' }).notNull(),
  ppnRate: real('ppn_rate').notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }),
});

// 6. PO klien & PO ke supplier
export const clientPos = sqliteTable('client_pos', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  quotationId: integer('quotation_id').references(() => quotations.id).notNull(),
  clientId: integer('client_id').references(() => clients.id).notNull(),
  projectId: integer('project_id').references(() => projects.id),
  poNumber: text('po_number').notNull(),
  poDate: integer('po_date', { mode: 'timestamp' }).notNull(),
  value: real('value'),
  fileUrl: text('file_url'),
  notes: text('notes'),
  closedAt: integer('closed_at', { mode: 'timestamp' }),
  createdBy: integer('created_by').references(() => users.id),
  createdAt: integer('created_at', { mode: 'timestamp' }),
});

export const clientPoItems = sqliteTable('client_po_items', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  clientPoId: integer('client_po_id').references(() => clientPos.id).notNull(),
  description: text('description').notNull(),
  qty: integer('qty').notNull(),
  unit: text('unit').default('Unit'),
  unitPrice: real('unit_price').notNull(),
  unitCost: real('unit_cost').default(0),
  amount: real('amount').notNull(),
});

export const supplierPos = sqliteTable('supplier_pos', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  clientPoId: integer('client_po_id').references(() => clientPos.id).notNull(),
  supplierName: text('supplier_name').notNull(),
  supplierContact: text('supplier_contact'),
  supplierPhone: text('supplier_phone'),
  supplierAddress: text('supplier_address'),
  date: integer('date', { mode: 'timestamp' }).notNull(),
  expectedDate: integer('expected_date', { mode: 'timestamp' }),
  paymentTerms: text('payment_terms'),
  notes: text('notes'),
  subtotal: real('subtotal').default(0),
  tax: real('tax').default(0),
  total: real('total').default(0),
  status: text('status').default('Draft'),
  createdBy: integer('created_by').references(() => users.id),
  createdAt: integer('created_at', { mode: 'timestamp' }),
});

export const supplierPoItems = sqliteTable('supplier_po_items', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  supplierPoId: integer('supplier_po_id').references(() => supplierPos.id).notNull(),
  description: text('description').notNull(),
  qty: integer('qty').notNull(),
  unit: text('unit').default('Unit'),
  unitPrice: real('unit_price').notNull(),
  amount: real('amount').notNull(),
});
