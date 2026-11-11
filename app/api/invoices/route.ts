import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";

import { db } from "@/db";
import { clientPos, invoiceItems, invoices } from "@/db/schema";
import { ensure, ensurePositiveInt, nullableTrim, toErrorResponse, trimString } from "@/lib/api-helpers";
import { audit } from "@/lib/audit";
import { requireRole } from "@/lib/auth";
import { upsertInvoiceJournal } from "@/lib/business";
import { getInvoices } from "@/lib/data";
import { parseMoneyInput } from "@/lib/money";
import { createNotification } from "@/lib/notifications";
import { computeOutputTax, normalizeTaxPercent } from "@/lib/output-tax";
import { cekTotalTagihanPo } from "@/lib/cegah-dobel";

export async function GET() {
  try {
    const { role } = await requireRole(["admin", "finance", "sales", "project_manager"]);
    const data = await getInvoices();
    if (role === "admin" || role === "finance") return NextResponse.json(data);
    // Sales & project manager cuma butuh data buat isi surat jalan (penerima & barang), tanpa angka uang.
    return NextResponse.json(data.map((row) => ({
      id: row.id,
      code: row.code,
      clientId: row.clientId,
      clientName: row.clientName,
      projectId: row.projectId,
      projectName: row.projectName,
      recipientName: row.recipientName,
      recipientCompany: row.recipientCompany,
      recipientAddress: row.recipientAddress,
      subject: row.subject,
      signatoryName: row.signatoryName,
      signatoryTitle: row.signatoryTitle,
      items: (row.items ?? []).map((item) => ({ description: item.description, qty: item.qty, unit: item.unit })),
    })));
  } catch (error) {
    return toErrorResponse(error, "Failed to fetch invoices");
  }
}

export async function POST(request: NextRequest) {
  try {
    const { user } = await requireRole(["admin", "finance", "sales"]);
    const body = await request.json();
    const clientId = ensurePositiveInt(body.clientId, "clientId");
    const items = (Array.isArray(body.items) ? body.items : []) as Array<{ description?: string; qty?: number | string; unit?: string; unitPrice?: number | string; amount?: number | string }>;
    ensure(items.length > 0, "Isi minimal satu baris barang/jasa");
    const subtotal = items.reduce((sum: number, item) => sum + parseMoneyInput(item.amount), 0);
    ensure(subtotal > 0, "Subtotal tagihan harus lebih dari 0");
    const { tax, total } = computeOutputTax(subtotal, normalizeTaxPercent(body.taxPercent, 11));
    const dueDate = body.dueDate ? new Date(body.dueDate) : null;
    const clientPoId = body.clientPoId ? ensurePositiveInt(body.clientPoId, "clientPoId") : null;
    if (clientPoId) {
      const po = await db.query.clientPos.findFirst({ where: eq(clientPos.id, clientPoId) });
      ensure(po, "PO klien tidak ditemukan");
      ensure(po.clientId === clientId, "PO klien bukan milik client ini");
    }

    const invoiceId = await db.transaction(async (tx) => {
      const inserted = await tx.insert(invoices).values({
        clientId,
        projectId: body.projectId ? ensurePositiveInt(body.projectId, "projectId") : null,
        quotationId: body.quotationId ? ensurePositiveInt(body.quotationId, "quotationId") : null,
        clientPoId,
        date: body.date ? new Date(body.date) : new Date(),
        dueDate,
        paymentMethod: trimString(body.paymentMethod, 50) || "CBD",
        attachment: nullableTrim(body.attachment, 500),
        subject: nullableTrim(body.subject, 500),
        recipientName: nullableTrim(body.recipientName, 200),
        recipientCompany: nullableTrim(body.recipientCompany, 200),
        recipientAddress: nullableTrim(body.recipientAddress, 500),
        introduction: nullableTrim(body.introduction, 2000),
        terms: nullableTrim(body.terms, 5000),
        closingNote: nullableTrim(body.closingNote, 2000),
        signatoryName: nullableTrim(body.signatoryName, 200),
        signatoryTitle: nullableTrim(body.signatoryTitle, 200),
        subtotal,
        tax,
        total,
        status: "Unpaid",
      }).returning({ id: invoices.id });

      const newId = inserted[0]?.id;
      if (!newId) throw new Error("Gagal membuat tagihan");

      await tx.insert(invoiceItems).values(items.map((item) => ({
        invoiceId: newId,
        description: trimString(item.description, 1000),
        qty: Math.max(1, Number(item.qty ?? 0) || 1),
        unit: trimString(item.unit, 50) || "Unit",
        unitPrice: parseMoneyInput(item.unitPrice),
        amount: parseMoneyInput(item.amount),
      })));

      // Dicek setelah ditulis (masih di transaksi) biar dua tagihan yang disimpan bareng gak lolos dua-duanya.
      if (clientPoId) await cekTotalTagihanPo(tx, clientPoId);

      return newId;
    });

    await upsertInvoiceJournal(invoiceId);
    await createNotification({ title: "Tagihan baru", message: `INV-${String(invoiceId).padStart(4, "0")} dibuat, total Rp ${total.toLocaleString('id-ID')}.`, type: "info", targetRole: "finance" });
    await audit({ userId: user.id, action: "invoice.create", entity: "invoice", entityId: invoiceId, payload: { clientId, total, clientPoId } });

    return NextResponse.json({ ok: true, data: await getInvoices() });
  } catch (error) {
    return toErrorResponse(error, "Gagal membuat tagihan");
  }
}
