import { NextRequest, NextResponse } from "next/server";

import { db } from "@/db";
import { payments } from "@/db/schema";
import { ensure, ensurePositiveInt, nullableTrim, toErrorResponse, trimString } from "@/lib/api-helpers";
import { audit } from "@/lib/audit";
import { requireRole } from "@/lib/auth";
import { upsertPaymentJournal } from "@/lib/business";
import { getPayments } from "@/lib/data";
import { parseMoneyInput } from "@/lib/money";
import { createNotification } from "@/lib/notifications";
import { ensurePaymentMatchesInvoice } from "@/lib/validators";
import { cekBayarTagihan } from "@/lib/cegah-dobel";
import { ambilNomor, cariNomor } from "@/lib/nomor-dokumen";

export async function GET() {
  try {
    await requireRole(["admin", "finance"]);
    const data = await getPayments();
    return NextResponse.json(data);
  } catch (error) {
    return toErrorResponse(error, "Failed to fetch payments");
  }
}

export async function POST(request: NextRequest) {
  try {
    const { user } = await requireRole(["admin", "finance"]);
    const body = await request.json();
    const invoiceId = ensurePositiveInt(body.invoiceId, "invoiceId");
    const clientId = ensurePositiveInt(body.clientId, "clientId");
    const amount = parseMoneyInput(body.amount);
    ensure(amount > 0, "Nominal pembayaran harus lebih dari 0");
    const paymentMethod = nullableTrim(body.paymentMethod, 100);
    const paymentAccountCode = trimString(body.paymentAccountCode, 50) || "1002";
    const referenceCode = nullableTrim(body.referenceCode, 200);

    await ensurePaymentMatchesInvoice({ invoiceId, clientId, amount });

    // Ditulis dulu lalu dicek di transaksi yang sama: dua pembayaran yang disimpan bareng gak bisa lewat total tagihan.
    const inserted = await db.transaction(async (tx) => {
      const tanggal = new Date();
      const nomor = await ambilNomor(tx, "KW", tanggal);
      const rows = await tx.insert(payments).values({
        nomor,
        invoiceId,
        clientId,
        amount,
        paymentMethod,
        paymentAccountCode,
        date: tanggal,
        referenceCode,
      }).returning({ id: payments.id });
      await cekBayarTagihan(tx, invoiceId);
      return rows;
    });

    if (inserted[0]?.id) {
      await upsertPaymentJournal(inserted[0].id);
      await createNotification({ title: "Pembayaran masuk", message: `Pembayaran tagihan ${await cariNomor("INV", invoiceId)} sebesar Rp ${amount.toLocaleString('id-ID')} dicatat.`, type: "success", targetRole: "finance" });
      await audit({ userId: user.id, action: "payment.create", entity: "payment", entityId: inserted[0].id, payload: { invoiceId, amount } });
    }

    return NextResponse.json({ ok: true, data: await getPayments() });
  } catch (error) {
    return toErrorResponse(error, "Gagal mencatat pembayaran");
  }
}
