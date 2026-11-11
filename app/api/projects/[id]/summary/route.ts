import { NextRequest, NextResponse } from "next/server";
import { eq, sql } from "drizzle-orm";

import { db } from "@/db";
import { expenses, invoices, payments, projects, quotations } from "@/db/schema";
import { ensurePositiveInt, toErrorResponse } from "@/lib/api-helpers";
import { requireRole } from "@/lib/auth";
import { formatDocumentNumber } from "@/lib/format";
import { nomorDokumen } from "@/lib/nomor-dokumen";

/**
 * Aggregated view of a project's financial position:
 * - linked quotations
 * - linked invoices with paid/outstanding amounts
 * - linked expenses
 * - net P&L (revenue from invoices - cost from expenses)
 */
export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { role } = await requireRole(["admin", "finance", "sales", "project_manager"]);
    // Tagihan, pembayaran & pengeluaran cuma buat admin/keuangan (sales gak boleh lihat keuangan).
    const lihatUang = role === "admin" || role === "finance";
    const { id } = await params;
    const projectId = ensurePositiveInt(id, "project id");

    const [project, quotationRows, invoiceRows, expenseRows] = await Promise.all([
      db.query.projects.findFirst({ where: eq(projects.id, projectId) }),
      db.select({ id: quotations.id, nomor: quotations.nomor, status: quotations.status, total: quotations.total, date: quotations.date }).from(quotations).where(eq(quotations.projectId, projectId)),
      db
        .select({
          id: invoices.id,
          nomor: invoices.nomor,
          date: invoices.date,
          status: invoices.status,
          total: invoices.total,
          subtotal: invoices.subtotal,
          tax: invoices.tax,
          amountPaid: sql<number>`coalesce((select sum(p.amount) from payments p where p.invoice_id = ${invoices.id}), 0)`.as("amountPaid"),
        })
        .from(invoices)
        .where(eq(invoices.projectId, projectId)),
      db.select({ id: expenses.id, date: expenses.date, category: expenses.category, description: expenses.description, amount: expenses.amount, status: expenses.status }).from(expenses).where(eq(expenses.projectId, projectId)),
    ]);

    if (!project) {
      return NextResponse.json({ error: "Proyek gak ketemu" }, { status: 404 });
    }

    const totalQuotationValue = quotationRows.reduce((sum, q) => sum + (q.total ?? 0), 0);
    const totalInvoiceValue = invoiceRows.reduce((sum, inv) => sum + (inv.total ?? 0), 0);
    const totalCollected = invoiceRows.reduce((sum, inv) => sum + (inv.amountPaid ?? 0), 0);
    const totalOutstanding = invoiceRows.reduce((sum, inv) => sum + Math.max((inv.total ?? 0) - (inv.amountPaid ?? 0), 0), 0);
    const totalExpense = expenseRows.reduce((sum, exp) => sum + (exp.amount ?? 0), 0);
    const netProjectMargin = totalCollected - totalExpense;

    return NextResponse.json({
      project: {
        id: project.id,
        code: formatDocumentNumber("PRJ", project.id),
        name: project.name,
        clientId: project.clientId,
        value: project.value ?? 0,
        status: project.status,
        progress: project.progress,
      },
      quotations: quotationRows.map((q) => ({
        id: q.id,
        code: nomorDokumen("SP", q.id, q.nomor, q.date),
        status: q.status,
        total: q.total ?? 0,
        date: q.date,
      })),
      lihatUang,
      invoices: (lihatUang ? invoiceRows : []).map((inv) => ({
        id: inv.id,
        code: nomorDokumen("INV", inv.id, inv.nomor, inv.date),
        date: inv.date,
        status: inv.status,
        total: inv.total ?? 0,
        amountPaid: inv.amountPaid ?? 0,
        outstanding: Math.max((inv.total ?? 0) - (inv.amountPaid ?? 0), 0),
      })),
      expenses: (lihatUang ? expenseRows : []).map((exp) => ({
        id: exp.id,
        code: formatDocumentNumber("EXP", exp.id),
        date: exp.date,
        category: exp.category,
        description: exp.description,
        amount: exp.amount ?? 0,
        status: exp.status,
      })),
      summary: lihatUang
        ? { totalQuotationValue, totalInvoiceValue, totalCollected, totalOutstanding, totalExpense, netProjectMargin }
        : { totalQuotationValue, totalInvoiceValue: 0, totalCollected: 0, totalOutstanding: 0, totalExpense: 0, netProjectMargin: 0 },
    });
  } catch (error) {
    return toErrorResponse(error, "Gagal ambil ringkasan proyek");
  }
}
