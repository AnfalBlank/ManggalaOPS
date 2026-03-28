import { desc, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import {
  clients,
  invoices,
  leads,
  payments,
  projects,
  quotations,
} from "@/db/schema";
import { toIsoString } from "@/lib/db-utils";
import { formatDocumentNumber } from "@/lib/format";
import type {
  DashboardSummary,
  InvoiceListItem,
  LeadListItem,
  PaymentListItem,
  ProjectListItem,
  QuotationListItem,
} from "@/lib/types";

export async function getLeads(): Promise<LeadListItem[]> {
  const rows = await db
    .select({
      id: leads.id,
      clientId: leads.clientId,
      clientName: clients.name,
      contactPerson: clients.contactPerson,
      phone: clients.phone,
      serviceName: leads.serviceName,
      estimatedValue: leads.estimatedValue,
      status: leads.status,
      createdAt: leads.createdAt,
    })
    .from(leads)
    .innerJoin(clients, eq(leads.clientId, clients.id))
    .orderBy(desc(leads.id));

  return rows.map((row) => ({
    id: row.id,
    code: formatDocumentNumber("LD", row.id),
    clientId: row.clientId,
    clientName: row.clientName,
    contactPerson: row.contactPerson,
    phone: row.phone,
    serviceName: row.serviceName,
    estimatedValue: row.estimatedValue ?? 0,
    status: row.status ?? "New",
    createdAt: toIsoString(row.createdAt),
  }));
}

export async function getProjects(): Promise<ProjectListItem[]> {
  const rows = await db
    .select({
      id: projects.id,
      leadId: projects.leadId,
      clientId: projects.clientId,
      clientName: clients.name,
      name: projects.name,
      value: projects.value,
      status: projects.status,
      progress: projects.progress,
      startDate: projects.startDate,
      deadline: projects.deadline,
    })
    .from(projects)
    .innerJoin(clients, eq(projects.clientId, clients.id))
    .orderBy(desc(projects.id));

  return rows.map((row) => ({
    id: row.id,
    code: formatDocumentNumber("PRJ", row.id),
    leadId: row.leadId,
    clientId: row.clientId,
    clientName: row.clientName,
    name: row.name,
    value: row.value ?? 0,
    status: row.status ?? "In Progress",
    progress: row.progress ?? 0,
    startDate: toIsoString(row.startDate),
    deadline: toIsoString(row.deadline),
  }));
}

export async function getQuotations(): Promise<QuotationListItem[]> {
  const rows = await db
    .select({
      id: quotations.id,
      clientId: quotations.clientId,
      clientName: clients.name,
      projectId: quotations.projectId,
      projectName: projects.name,
      date: quotations.date,
      validUntil: quotations.validUntil,
      subtotal: quotations.subtotal,
      tax: quotations.tax,
      total: quotations.total,
      status: quotations.status,
    })
    .from(quotations)
    .innerJoin(clients, eq(quotations.clientId, clients.id))
    .leftJoin(projects, eq(quotations.projectId, projects.id))
    .orderBy(desc(quotations.id));

  return rows.map((row) => ({
    id: row.id,
    code: formatDocumentNumber("QUO", row.id),
    clientId: row.clientId,
    clientName: row.clientName,
    projectId: row.projectId,
    projectName: row.projectName,
    date: toIsoString(row.date),
    validUntil: toIsoString(row.validUntil),
    subtotal: row.subtotal ?? 0,
    tax: row.tax ?? 0,
    total: row.total ?? 0,
    status: row.status ?? "Draft",
  }));
}

export async function getInvoices(): Promise<InvoiceListItem[]> {
  const paymentTotals = db
    .select({
      invoiceId: payments.invoiceId,
      amountPaid: sql<number>`coalesce(sum(${payments.amount}), 0)`.as("amountPaid"),
    })
    .from(payments)
    .groupBy(payments.invoiceId)
    .as("payment_totals");

  const rows = await db
    .select({
      id: invoices.id,
      clientId: invoices.clientId,
      clientName: clients.name,
      projectId: invoices.projectId,
      projectName: projects.name,
      quotationId: invoices.quotationId,
      date: invoices.date,
      dueDate: invoices.dueDate,
      subtotal: invoices.subtotal,
      tax: invoices.tax,
      total: invoices.total,
      amountPaid: paymentTotals.amountPaid,
    })
    .from(invoices)
    .innerJoin(clients, eq(invoices.clientId, clients.id))
    .leftJoin(projects, eq(invoices.projectId, projects.id))
    .leftJoin(paymentTotals, eq(invoices.id, paymentTotals.invoiceId))
    .orderBy(desc(invoices.id));

  return rows.map((row) => {
    const total = row.total ?? 0;
    const amountPaid = row.amountPaid ?? 0;
    const outstandingAmount = Math.max(total - amountPaid, 0);
    const now = new Date();
    const dueDate = row.dueDate ? new Date(row.dueDate) : null;

    let status = "Unpaid";
    if (amountPaid >= total && total > 0) status = "Paid";
    else if (amountPaid > 0) status = "Partially Paid";
    else if (dueDate && dueDate < now) status = "Overdue";

    return {
      id: row.id,
      code: formatDocumentNumber("INV", row.id),
      clientId: row.clientId,
      clientName: row.clientName,
      projectId: row.projectId,
      projectName: row.projectName,
      quotationId: row.quotationId,
      date: toIsoString(row.date),
      dueDate: toIsoString(row.dueDate),
      subtotal: row.subtotal ?? 0,
      tax: row.tax ?? 0,
      total,
      amountPaid,
      outstandingAmount,
      status,
    };
  });
}

export async function getPayments(): Promise<PaymentListItem[]> {
  const rows = await db
    .select({
      id: payments.id,
      invoiceId: payments.invoiceId,
      clientId: payments.clientId,
      clientName: clients.name,
      amount: payments.amount,
      paymentMethod: payments.paymentMethod,
      date: payments.date,
      referenceCode: payments.referenceCode,
    })
    .from(payments)
    .innerJoin(clients, eq(payments.clientId, clients.id))
    .orderBy(desc(payments.id));

  return rows.map((row) => ({
    id: row.id,
    code: formatDocumentNumber("PAY", row.id),
    invoiceId: row.invoiceId,
    invoiceCode: formatDocumentNumber("INV", row.invoiceId),
    clientId: row.clientId,
    clientName: row.clientName,
    amount: row.amount,
    paymentMethod: row.paymentMethod,
    date: toIsoString(row.date),
    referenceCode: row.referenceCode,
  }));
}

export async function getDashboardSummary(): Promise<DashboardSummary> {
  const [leadRows, invoiceRows, accountRows] = await Promise.all([
    db.select({ status: leads.status }).from(leads),
    getInvoices(),
    db
      .select({
        totalRevenue: sql<number>`coalesce(sum(${invoices.total}), 0)`,
      })
      .from(invoices),
  ]);

  const totalLeads = leadRows.length;
  const wonLeads = leadRows.filter((lead) => lead.status === "Won").length;
  const outstandingInvoices = invoiceRows.reduce((sum, invoice) => sum + invoice.outstandingAmount, 0);
  const totalRevenue = accountRows[0]?.totalRevenue ?? 0;

  return {
    totalLeads,
    wonLeads,
    totalRevenue,
    outstandingInvoices,
  };
}
