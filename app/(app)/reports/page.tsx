import { ReportsCenter } from "@/components/reports/reports-center";
import { getInvoices, getLeads, getPayments, getProjects } from "@/lib/data";
import { getFinanceOverviewData } from "@/lib/admin-data";

export default async function ReportsPage() {
  const [finance, leads, invoices, payments, projects] = await Promise.all([
    getFinanceOverviewData(),
    getLeads(),
    getInvoices(),
    getPayments(),
    getProjects(),
  ]);

  const financeRows = finance.recentExpenses.map((expense) => ({
    date: new Date(expense.date).toISOString(),
    category: expense.category,
    description: expense.description,
    amount: expense.amount,
    status: expense.status,
  }));

  const salesRows = [
    ...leads.map((lead) => ({ date: lead.createdAt, type: "Lead", code: lead.code, client: lead.clientName, status: lead.status, amount: lead.estimatedValue })),
    ...invoices.map((invoice) => ({ date: invoice.date, type: "Invoice", code: invoice.code, client: invoice.clientName, status: invoice.status, amount: invoice.total })),
    ...payments.map((payment) => ({ date: payment.date, type: "Payment", code: payment.code, client: payment.clientName, status: payment.paymentMethod, amount: payment.amount })),
  ];

  const projectRows = projects.map((project) => ({
    startDate: project.startDate,
    deadline: project.deadline,
    code: project.code,
    project: project.name,
    client: project.clientName,
    status: project.status,
    value: project.value,
    progress: project.progress,
  }));

  const taxRows = invoices.map((invoice) => ({ date: invoice.date, source: invoice.code, type: "Invoice", client: invoice.clientName, tax: invoice.tax, total: invoice.total }));

  return <ReportsCenter financeRows={financeRows} salesRows={salesRows} projectRows={projectRows} taxRows={taxRows} />;
}
