import { addDays, subDays } from "date-fns";

export const mockLeads = [
  {
    id: "LD-2024-001",
    client: "PT. Teknologi Maju",
    contact: "Budi Santoso",
    phone: "0812-3456-7890",
    service: "IT Infrastructure Upgrade",
    value: 450000000,
    status: "Won",
    date: subDays(new Date(), 15),
  },
  {
    id: "LD-2024-002",
    client: "CV. Makmur Jaya",
    contact: "Siti Rahma",
    phone: "0813-1122-3344",
    service: "ERP System Development",
    value: 850000000,
    status: "Negotiation",
    date: subDays(new Date(), 5),
  },
  {
    id: "LD-2024-003",
    client: "Dinas Pendidikan",
    contact: "Ahmad Rizki",
    phone: "0856-7788-9900",
    service: "Procurement 50 PC & 2 Server",
    value: 950000000,
    status: "Follow Up",
    date: subDays(new Date(), 2),
  },
  {
    id: "LD-2024-004",
    client: "PT. Global Retail",
    contact: "Diana Putri",
    phone: "0819-5566-7788",
    service: "Network Installation (10 Branch)",
    value: 200000000,
    status: "New",
    date: new Date(),
  },
];

export const mockProjects = [
  {
    id: "PRJ-2024-001",
    name: "IT Infrastructure Upgrade HQ",
    client: "PT. Teknologi Maju",
    value: 450000000,
    progress: 75,
    status: "In Progress",
    startDate: subDays(new Date(), 10),
    deadline: addDays(new Date(), 30),
  },
  {
    id: "PRJ-2024-002",
    name: "CCTV & Security System",
    client: "PT. Energi Nusantara",
    value: 120000000,
    progress: 100,
    status: "Completed",
    startDate: subDays(new Date(), 45),
    deadline: subDays(new Date(), 5),
  },
];

export const mockInvoices = [
  {
    id: "INV-2024-045",
    client: "PT. Teknologi Maju",
    project: "IT Infrastructure Upgrade HQ (DP 50%)",
    date: subDays(new Date(), 10),
    dueDate: addDays(new Date(), 4),
    subtotal: 225000000,
    ppn: 24750000,
    total: 249750000,
    status: "Paid",
  },
  {
    id: "INV-2024-046",
    client: "PT. Teknologi Maju",
    project: "IT Infrastructure Upgrade HQ (Termin 2 30%)",
    date: new Date(),
    dueDate: addDays(new Date(), 14),
    subtotal: 135000000,
    ppn: 14850000,
    total: 149850000,
    status: "Unpaid",
  },
  {
    id: "INV-2024-047",
    client: "PT. Energi Nusantara",
    project: "CCTV & Security System (Final Payment)",
    date: subDays(new Date(), 5),
    dueDate: addDays(new Date(), 9),
    subtotal: 120000000,
    ppn: 13200000,
    total: 133200000,
    amountPaid: 65000000, // Partially paid scenario
    status: "Partially Paid",
  },
];

export const mockExpenses = [
  {
    id: "EXP-2024-091",
    date: subDays(new Date(), 3),
    category: "Vendor Payment",
    description: "Pembelian 2 Unit Server Dell R740",
    amount: 150000000,
    status: "Approved",
  },
  {
    id: "EXP-2024-092",
    date: subDays(new Date(), 2),
    category: "Operational",
    description: "Biaya Internet & Telepon Kantor",
    amount: 5500000,
    status: "Approved",
  },
  {
    id: "EXP-2024-093",
    date: subDays(new Date(), 1),
    category: "Logistics",
    description: "Pengiriman Peralatan Jaringan ke Cabang",
    amount: 2500000,
    status: "Pending",
  },
];

export const mockCOA = [
  { code: "1001", name: "Kas Utama", type: "Asset", balance: 150000000 },
  { code: "1002", name: "Bank Mandiri", type: "Asset", balance: 850000000 },
  { code: "1101", name: "Piutang Usaha", type: "Asset", balance: 283050000 },
  { code: "4001", name: "Pendapatan Jasa IT", type: "Revenue", balance: 450000000 },
  { code: "4002", name: "Pendapatan Pengadaan", type: "Revenue", balance: 120000000 },
  { code: "5001", name: "Beban Operasional", type: "Expense", balance: 5500000 },
  { code: "5002", name: "Beban HPP Proyek", type: "Expense", balance: 150000000 },
  { code: "2101", name: "Utang PPN", type: "Liability", balance: 39600000 },
];

export const mockJournals = [
  {
    id: "JRN-2024-101",
    date: subDays(new Date(), 10),
    description: "DP 50% IT Infrastructure Upgrade (INV-2024-045)",
    entries: [
      { accountCode: "1101", accountName: "Piutang Usaha", debit: 249750000, credit: 0 },
      { accountCode: "4001", accountName: "Pendapatan Jasa IT", debit: 0, credit: 225000000 },
      { accountCode: "2101", accountName: "Utang PPN", debit: 0, credit: 24750000 },
    ]
  },
  {
    id: "JRN-2024-102",
    date: subDays(new Date(), 9),
    description: "Pembayaran DP (INV-2024-045) via Mandiri",
    entries: [
      { accountCode: "1002", accountName: "Bank Mandiri", debit: 249750000, credit: 0 },
      { accountCode: "1101", accountName: "Piutang Usaha", debit: 0, credit: 249750000 },
    ]
  }
];

export const mockQuotations = [
  {
    id: "QUO-2024-012",
    client: "Dinas Pendidikan",
    project: "Procurement 50 PC & 2 Server",
    date: subDays(new Date(), 10),
    validUntil: addDays(new Date(), 20),
    items: [
      { name: "Lenovo ThinkCentre M70q", qty: 50, price: 12000000 },
      { name: "Dell PowerEdge R740", qty: 2, price: 175000000 }
    ],
    subtotal: 950000000,
    ppn: 104500000,
    total: 1054500000,
    status: "Sent",
  },
  {
    id: "QUO-2024-013",
    client: "PT. Teknologi Maju",
    project: "IT Infrastructure Upgrade HQ",
    date: subDays(new Date(), 25),
    validUntil: addDays(new Date(), 5),
    items: [
      { name: "Cisco Catalyst 9300", qty: 4, price: 35000000 },
      { name: "Implementation Services", qty: 1, price: 310000000 }
    ],
    subtotal: 450000000,
    ppn: 49500000,
    total: 499500000,
    status: "Accepted",
  }
];

export const mockPayments = [
  {
    id: "PAY-2024-080",
    invoiceId: "INV-2024-045",
    client: "PT. Teknologi Maju",
    date: subDays(new Date(), 9),
    amount: 249750000,
    method: "Bank Transfer (Mandiri)",
    status: "Completed",
  },
  {
    id: "PAY-2024-081",
    invoiceId: "INV-2024-047",
    client: "PT. Energi Nusantara",
    date: subDays(new Date(), 2),
    amount: 65000000,
    method: "Bank Transfer (BCA)",
    status: "Completed",
  }
];
