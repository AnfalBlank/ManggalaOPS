import { db } from "@/db";
import {
  accounts,
  clients,
  expenses,
  invoices,
  invoiceItems,
  journalEntries,
  journals,
  leads,
  payments,
  projects,
  quotationItems,
  quotations,
} from "@/db/schema";

export async function seedDatabase() {
  const existingClients = await db.select().from(clients).limit(1);
  if (existingClients.length > 0) {
    return { seeded: false, reason: "Database already contains data" };
  }

  const insertedClients = await db
    .insert(clients)
    .values([
      {
        name: "PT. Teknologi Maju",
        contactPerson: "Budi Santoso",
        phone: "0812-3456-7890",
        email: "budi@teknologimaju.co.id",
        address: "Jakarta Selatan",
      },
      {
        name: "CV. Makmur Jaya",
        contactPerson: "Siti Rahma",
        phone: "0813-1122-3344",
        email: "siti@makmurjaya.co.id",
        address: "Bandung",
      },
      {
        name: "Dinas Pendidikan",
        contactPerson: "Ahmad Rizki",
        phone: "0856-7788-9900",
        email: "ahmad@diknas.go.id",
        address: "Jakarta Pusat",
      },
      {
        name: "PT. Energi Nusantara",
        contactPerson: "Diana Putri",
        phone: "0819-5566-7788",
        email: "diana@energinusantara.co.id",
        address: "Surabaya",
      },
    ])
    .returning({ id: clients.id, name: clients.name });

  const clientMap = Object.fromEntries(insertedClients.map((client) => [client.name, client.id]));

  const insertedLeads = await db
    .insert(leads)
    .values([
      {
        clientId: clientMap["PT. Teknologi Maju"],
        serviceName: "IT Infrastructure Upgrade",
        estimatedValue: 450000000,
        status: "Won",
        createdAt: new Date("2026-03-10T09:00:00+07:00"),
      },
      {
        clientId: clientMap["CV. Makmur Jaya"],
        serviceName: "ERP System Development",
        estimatedValue: 850000000,
        status: "Negotiation",
        createdAt: new Date("2026-03-20T11:00:00+07:00"),
      },
      {
        clientId: clientMap["Dinas Pendidikan"],
        serviceName: "Procurement 50 PC & 2 Server",
        estimatedValue: 950000000,
        status: "Follow Up",
        createdAt: new Date("2026-03-24T14:00:00+07:00"),
      },
      {
        clientId: clientMap["PT. Energi Nusantara"],
        serviceName: "CCTV & Security System",
        estimatedValue: 120000000,
        status: "Won",
        createdAt: new Date("2026-03-18T13:00:00+07:00"),
      },
    ])
    .returning({ id: leads.id, clientId: leads.clientId, serviceName: leads.serviceName });

  const leadMap = Object.fromEntries(insertedLeads.map((lead) => [lead.serviceName, lead.id]));

  const insertedProjects = await db
    .insert(projects)
    .values([
      {
        leadId: leadMap["IT Infrastructure Upgrade"],
        clientId: clientMap["PT. Teknologi Maju"],
        name: "IT Infrastructure Upgrade HQ",
        value: 450000000,
        status: "In Progress",
        progress: 75,
        startDate: new Date("2026-03-12T09:00:00+07:00"),
        deadline: new Date("2026-04-30T17:00:00+07:00"),
      },
      {
        leadId: leadMap["CCTV & Security System"],
        clientId: clientMap["PT. Energi Nusantara"],
        name: "CCTV & Security System",
        value: 120000000,
        status: "Completed",
        progress: 100,
        startDate: new Date("2026-02-05T09:00:00+07:00"),
        deadline: new Date("2026-03-15T17:00:00+07:00"),
      },
    ])
    .returning({ id: projects.id, name: projects.name });

  const projectMap = Object.fromEntries(insertedProjects.map((project) => [project.name, project.id]));

  const insertedQuotations = await db
    .insert(quotations)
    .values([
      {
        clientId: clientMap["Dinas Pendidikan"],
        projectId: null,
        date: new Date("2026-03-12T10:00:00+07:00"),
        validUntil: new Date("2026-04-12T10:00:00+07:00"),
        subtotal: 950000000,
        tax: 104500000,
        total: 1054500000,
        status: "Sent",
      },
      {
        clientId: clientMap["PT. Teknologi Maju"],
        projectId: projectMap["IT Infrastructure Upgrade HQ"],
        date: new Date("2026-03-03T10:00:00+07:00"),
        validUntil: new Date("2026-03-30T10:00:00+07:00"),
        subtotal: 450000000,
        tax: 49500000,
        total: 499500000,
        status: "Accepted",
      },
    ])
    .returning({ id: quotations.id });

  await db.insert(quotationItems).values([
    {
      quotationId: insertedQuotations[0].id,
      description: "Lenovo ThinkCentre M70q x50",
      qty: 50,
      unitPrice: 12000000,
      amount: 600000000,
    },
    {
      quotationId: insertedQuotations[0].id,
      description: "Dell PowerEdge R740 x2",
      qty: 2,
      unitPrice: 175000000,
      amount: 350000000,
    },
    {
      quotationId: insertedQuotations[1].id,
      description: "Cisco Catalyst 9300 x4",
      qty: 4,
      unitPrice: 35000000,
      amount: 140000000,
    },
    {
      quotationId: insertedQuotations[1].id,
      description: "Implementation Services",
      qty: 1,
      unitPrice: 310000000,
      amount: 310000000,
    },
  ]);

  const insertedInvoices = await db
    .insert(invoices)
    .values([
      {
        clientId: clientMap["PT. Teknologi Maju"],
        projectId: projectMap["IT Infrastructure Upgrade HQ"],
        quotationId: insertedQuotations[1].id,
        date: new Date("2026-03-18T10:00:00+07:00"),
        dueDate: new Date("2026-04-01T10:00:00+07:00"),
        subtotal: 225000000,
        tax: 24750000,
        total: 249750000,
        status: "Paid",
      },
      {
        clientId: clientMap["PT. Teknologi Maju"],
        projectId: projectMap["IT Infrastructure Upgrade HQ"],
        quotationId: insertedQuotations[1].id,
        date: new Date("2026-03-28T10:00:00+07:00"),
        dueDate: new Date("2026-04-11T10:00:00+07:00"),
        subtotal: 135000000,
        tax: 14850000,
        total: 149850000,
        status: "Unpaid",
      },
      {
        clientId: clientMap["PT. Energi Nusantara"],
        projectId: projectMap["CCTV & Security System"],
        quotationId: null,
        date: new Date("2026-03-20T10:00:00+07:00"),
        dueDate: new Date("2026-04-05T10:00:00+07:00"),
        subtotal: 120000000,
        tax: 13200000,
        total: 133200000,
        status: "Partially Paid",
      },
    ])
    .returning({ id: invoices.id });

  await db.insert(invoiceItems).values([
    {
      invoiceId: insertedInvoices[0].id,
      description: "DP 50% IT Infrastructure Upgrade HQ",
      qty: 1,
      unitPrice: 225000000,
      amount: 225000000,
    },
    {
      invoiceId: insertedInvoices[1].id,
      description: "Termin 2 - 30% IT Infrastructure Upgrade HQ",
      qty: 1,
      unitPrice: 135000000,
      amount: 135000000,
    },
    {
      invoiceId: insertedInvoices[2].id,
      description: "Final Payment CCTV & Security System",
      qty: 1,
      unitPrice: 120000000,
      amount: 120000000,
    },
  ]);

  await db.insert(payments).values([
    {
      invoiceId: insertedInvoices[0].id,
      clientId: clientMap["PT. Teknologi Maju"],
      amount: 249750000,
      paymentMethod: "Bank Transfer (Mandiri)",
      date: new Date("2026-03-19T12:00:00+07:00"),
      referenceCode: "TRX-INV-0001",
    },
    {
      invoiceId: insertedInvoices[2].id,
      clientId: clientMap["PT. Energi Nusantara"],
      amount: 65000000,
      paymentMethod: "Bank Transfer (BCA)",
      date: new Date("2026-03-26T15:00:00+07:00"),
      referenceCode: "TRX-INV-0002",
    },
  ]);

  await db.insert(expenses).values([
    {
      date: new Date("2026-03-25T09:00:00+07:00"),
      category: "Vendor Payment",
      description: "Pembelian 2 Unit Server Dell R740",
      amount: 150000000,
      status: "Approved",
      projectId: projectMap["IT Infrastructure Upgrade HQ"],
    },
    {
      date: new Date("2026-03-26T09:00:00+07:00"),
      category: "Operational",
      description: "Biaya Internet & Telepon Kantor",
      amount: 5500000,
      status: "Approved",
      projectId: null,
    },
  ]);

  await db.insert(accounts).values([
    { code: "1001", name: "Kas Utama", type: "Asset", normalBalance: "Debit" },
    { code: "1002", name: "Bank Mandiri", type: "Asset", normalBalance: "Debit" },
    { code: "1101", name: "Piutang Usaha", type: "Asset", normalBalance: "Debit" },
    { code: "2101", name: "Utang PPN", type: "Liability", normalBalance: "Credit" },
    { code: "4001", name: "Pendapatan Jasa IT", type: "Revenue", normalBalance: "Credit" },
    { code: "4002", name: "Pendapatan Pengadaan", type: "Revenue", normalBalance: "Credit" },
    { code: "5001", name: "Beban Operasional", type: "Expense", normalBalance: "Debit" },
    { code: "5002", name: "Beban HPP Proyek", type: "Expense", normalBalance: "Debit" },
  ]);

  const insertedJournals = await db
    .insert(journals)
    .values([
      {
        date: new Date("2026-03-18T10:00:00+07:00"),
        description: "DP 50% IT Infrastructure Upgrade (Invoice 1)",
        referenceId: `invoice:${insertedInvoices[0].id}`,
      },
      {
        date: new Date("2026-03-19T12:00:00+07:00"),
        description: "Pembayaran DP Invoice 1 via Mandiri",
        referenceId: `payment:1`,
      },
    ])
    .returning({ id: journals.id });

  await db.insert(journalEntries).values([
    {
      journalId: insertedJournals[0].id,
      accountCode: "1101",
      debit: 249750000,
      credit: 0,
    },
    {
      journalId: insertedJournals[0].id,
      accountCode: "4001",
      debit: 0,
      credit: 225000000,
    },
    {
      journalId: insertedJournals[0].id,
      accountCode: "2101",
      debit: 0,
      credit: 24750000,
    },
    {
      journalId: insertedJournals[1].id,
      accountCode: "1002",
      debit: 249750000,
      credit: 0,
    },
    {
      journalId: insertedJournals[1].id,
      accountCode: "1101",
      debit: 0,
      credit: 249750000,
    },
  ]);

  return { seeded: true };
}
