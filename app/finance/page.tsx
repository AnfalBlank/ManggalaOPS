"use client";

import { PageWrapper } from "@/components/layout/page-wrapper";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { mockExpenses, mockInvoices } from "@/lib/mock-data";
import { format } from "date-fns";
import { CreditCard, Wallet, ArrowUpCircle, ArrowDownCircle, Plus } from "lucide-react";
import { motion } from "framer-motion";

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(amount);
};

export default function FinancePage() {
  const totalIncome = mockInvoices
    .filter(i => i.status === "Paid" || i.status === "Partially Paid")
    .reduce((sum, i) => sum + (i.amountPaid || i.total), 0);
    
  const totalExpense = mockExpenses.reduce((sum, e) => sum + e.amount, 0);
  const netCashFlow = totalIncome - totalExpense;

  return (
    <PageWrapper>
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-primary">Finance</h1>
          <p className="text-muted-foreground mt-1">Track actual cash in (income) and cash out (expenses).</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2">
            Export Report
          </Button>
          <Button className="bg-primary hover:bg-primary/90 text-white rounded-lg px-4 gap-2">
            <Plus className="size-4" /> Add Expense
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3 mb-8">
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Income</CardTitle>
            <div className="size-10 rounded-full bg-emerald-50 flex items-center justify-center">
              <ArrowUpCircle className="size-5 text-emerald-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600">{formatCurrency(totalIncome)}</div>
            <p className="text-xs text-muted-foreground mt-1">From paid invoices</p>
          </CardContent>
        </Card>
        
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Expenses</CardTitle>
            <div className="size-10 rounded-full bg-rose-50 flex items-center justify-center">
              <ArrowDownCircle className="size-5 text-rose-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-rose-600">{formatCurrency(totalExpense)}</div>
            <p className="text-xs text-muted-foreground mt-1">From operational & projects</p>
          </CardContent>
        </Card>

        <Card className="border-primary/20 bg-blue-50/50 hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-primary">Net Cash Flow</CardTitle>
            <div className="size-10 rounded-full bg-primary/10 flex items-center justify-center">
              <Wallet className="size-5 text-primary" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{formatCurrency(netCashFlow)}</div>
            <p className="text-xs text-muted-foreground mt-1">Current period</p>
          </CardContent>
        </Card>
      </div>

      <h2 className="text-xl font-bold tracking-tight text-foreground mb-4">Recent Expenses</h2>
      <motion.div 
        initial={{ opacity: 0, y: 15 }} 
        animate={{ opacity: 1, y: 0 }} 
        transition={{ duration: 0.4 }}
        className="bg-white rounded-2xl shadow-sm border border-border p-4 md:p-6 mb-8"
      >
        <div className="w-full overflow-x-auto pb-4 rounded-xl border">
          <Table className="min-w-[800px]">
            <TableHeader className="bg-muted/50 sticky top-0 z-10 backdrop-blur-sm">
              <TableRow className="hover:bg-transparent">
                <TableHead className="w-[120px] rounded-tl-xl text-xs uppercase tracking-wider">Expense ID</TableHead>
                <TableHead className="text-xs uppercase tracking-wider">Date</TableHead>
                <TableHead className="text-xs uppercase tracking-wider">Category</TableHead>
                <TableHead className="text-xs uppercase tracking-wider">Description</TableHead>
                <TableHead className="text-right text-xs uppercase tracking-wider">Amount (IDR)</TableHead>
                <TableHead className="text-center w-[120px] rounded-tr-xl text-xs uppercase tracking-wider">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mockExpenses.map((expense, idx) => (
                <motion.tr
                  key={expense.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2, delay: idx * 0.05 }}
                  className="group hover:bg-muted/30 transition-colors border-b last:border-0"
                >
                  <TableCell className="font-medium text-muted-foreground py-4">
                    {expense.id}
                  </TableCell>
                  <TableCell className="text-sm py-4">
                    {format(expense.date, "dd MMM yyyy")}
                  </TableCell>
                  <TableCell className="py-4 font-medium text-slate-700">
                    <div className="flex items-center gap-2">
                      <CreditCard className="size-4 text-muted-foreground" />
                      {expense.category}
                    </div>
                  </TableCell>
                  <TableCell className="text-sm py-4 max-w-[250px] truncate" title={expense.description}>
                    {expense.description}
                  </TableCell>
                  <TableCell className="text-right font-medium py-4 text-foreground">
                    {formatCurrency(expense.amount)}
                  </TableCell>
                  <TableCell className="text-center py-4">
                    {expense.status === "Approved" ? (
                      <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 hover:text-emerald-800 border-none shadow-none">Approved</Badge>
                    ) : (
                      <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100 hover:text-amber-800 border-none shadow-none">Pending</Badge>
                    )}
                  </TableCell>
                </motion.tr>
              ))}
            </TableBody>
          </Table>
        </div>
      </motion.div>
    </PageWrapper>
  );
}
