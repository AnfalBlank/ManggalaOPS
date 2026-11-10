import { CheckCircle2, Clock, Truck } from "lucide-react";

import { RoleGuard } from "@/components/auth/guard";
import { ClickableStatCard } from "@/components/cards/clickable-stat-card";
import { DeliveryOrdersTable } from "@/components/delivery/delivery-order-table";
import { DeliveryOrderDialog } from "@/components/forms/delivery-order-dialogs";
import { PageWrapper } from "@/components/layout/page-wrapper";
import { EmptyState, ErrorState } from "@/components/ui/state";
import { getProjects } from "@/lib/data";
import { getDeliveryOrders } from "@/lib/data-delivery";
import { getClientOptions, getInvoiceOptions } from "@/lib/options";
import { getAppSettings } from "@/lib/settings";

export default async function DeliveryOrdersPage({ searchParams }: { searchParams?: Promise<{ q?: string; period?: string; type?: string }> }) {
  try {
    const params = (await searchParams) ?? {};
    const [deliveries, clients, projects, invoices, settings] = await Promise.all([
      getDeliveryOrders(),
      getClientOptions(),
      getProjects(),
      getInvoiceOptions(),
      getAppSettings(),
    ]);

    const draftCount = deliveries.filter((delivery) => delivery.status === "Draft").length;
    const inTransitCount = deliveries.filter((delivery) => delivery.status === "In Transit").length;
    const deliveredCount = deliveries.filter((delivery) => delivery.status === "Delivered").length;

    const projectOptions = projects.map((project) => ({
      id: project.id,
      name: project.name,
      clientId: project.clientId,
      clientName: project.clientName,
    }));
    const invoiceOptions = invoices.map((invoice) => ({
      id: invoice.id,
      code: invoice.code,
      clientId: invoice.clientId,
      clientName: invoice.clientName ?? "-",
    }));

    return (
      <PageWrapper>
        <RoleGuard allow={["admin", "sales", "finance", "project_manager"]}>
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6 gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-primary">Surat Jalan</h1>
              <p className="text-muted-foreground mt-1">
                Bikin dan pantau surat jalan pengiriman barang ke klien.
              </p>
            </div>
            <DeliveryOrderDialog
              clients={clients}
              projects={projectOptions}
              invoices={invoiceOptions}
              defaultSignatoryName={settings.defaultSignatoryName}
              defaultSignatoryTitle={settings.defaultSignatoryTitle}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <ClickableStatCard
              href="/delivery-orders?type=Draft"
              title="Draf"
              value={draftCount}
              hint="Belum dikirim"
              icon={<Clock className="size-5" />}
              accentClassName="bg-amber-50 text-amber-600"
            />
            <ClickableStatCard
              href="/delivery-orders?type=In%20Transit"
              title="Dalam Pengiriman"
              value={inTransitCount}
              hint="Barang lagi di jalan"
              icon={<Truck className="size-5" />}
              accentClassName="bg-blue-50 text-blue-600"
            />
            <ClickableStatCard
              href="/delivery-orders?type=Delivered"
              title="Terkirim"
              value={deliveredCount}
              hint="Udah diterima klien"
              icon={<CheckCircle2 className="size-5" />}
              accentClassName="bg-emerald-50 text-emerald-600"
            />
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-border p-4 md:p-6">
            {deliveries.length === 0 ? (
              <EmptyState
                title="Belum ada surat jalan"
                description="Bikin surat jalan pertama di sini, atau langsung dari halaman PO klien / tagihan."
              />
            ) : (
              <DeliveryOrdersTable
                deliveries={deliveries}
                clients={clients}
                projects={projectOptions}
                invoices={invoiceOptions}
                settings={{
                  companyName: settings.companyName,
                  companyEmail: settings.companyEmail,
                  companyPhone: settings.companyPhone,
                  companyAddress: settings.companyAddress,
                  defaultSignatoryName: settings.defaultSignatoryName,
                  defaultSignatoryTitle: settings.defaultSignatoryTitle,
                }}
                filters={{
                  initialQuery: params.q,
                  initialPeriod: (params.period as "all" | "30d" | "month" | "year") ?? "all",
                  initialType: params.type ?? "all",
                }}
              />
            )}
          </div>
        </RoleGuard>
      </PageWrapper>
    );
  } catch (error) {
    return (
      <PageWrapper>
        <ErrorState title="Gagal memuat surat jalan" description={error instanceof Error ? error.message : "Data surat jalan gagal dibaca. Coba muat ulang halaman."} />
      </PageWrapper>
    );
  }
}
