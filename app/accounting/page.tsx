"use client";

import React from "react";
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
import { mockCOA, mockJournals } from "@/lib/mock-data";
import { format } from "date-fns";
import { BookOpen, FileSpreadsheet, Plus } from "lucide-react";
import { motion } from "framer-motion";

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(amount);
};

export default function AccountingPage() {
  return (
    <PageWrapper>
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-primary">Accounting System</h1>
          <p className="text-muted-foreground mt-1">General Ledger, Journals, and Chart of Accounts.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2">
            <FileSpreadsheet className="size-4" /> Export Ledger
          </Button>
          <Button className="bg-primary hover:bg-primary/90 text-white rounded-lg px-4 gap-2">
            <Plus className="size-4" /> Manual Journal
          </Button>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6 mb-8">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }} 
          animate={{ opacity: 1, scale: 1 }} 
          transition={{ duration: 0.4 }}
          className="lg:col-span-1 bg-white rounded-2xl shadow-sm border border-border p-4 md:p-6 flex flex-col h-full"
        >
          <h2 className="text-lg font-bold tracking-tight text-foreground flex items-center gap-2 mb-4">
            <BookOpen className="size-5 text-primary" /> Chart of Accounts
          </h2>
          <div className="overflow-y-auto pr-2" style={{ maxHeight: "500px" }}>
            <div className="flex flex-col gap-3">
              {mockCOA.map((account) => (
                <div key={account.code} className="p-3 rounded-lg border border-border/50 hover:bg-slate-50 transition-colors flex justify-between items-center group">
                  <div className="flex flex-col">
                    <span className="text-sm font-semibold text-primary">{account.code} - {account.name}</span>
                    <span className="text-xs text-muted-foreground">{account.type}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-medium text-foreground">{formatCurrency(account.balance)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 15 }} 
          animate={{ opacity: 1, y: 0 }} 
          transition={{ duration: 0.4, delay: 0.1 }}
          className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-border p-4 md:p-6"
        >
          <h2 className="text-lg font-bold tracking-tight text-foreground mb-4">General Journal</h2>
          
          <div className="w-full overflow-x-auto pb-4 rounded-xl border">
            <Table className="min-w-[600px]">
              <TableHeader className="bg-muted/50 sticky top-0 z-10 backdrop-blur-sm">
                <TableRow className="hover:bg-transparent">
                  <TableHead className="w-[100px] text-xs uppercase tracking-wider">Date</TableHead>
                  <TableHead className="text-xs uppercase tracking-wider text-left">Account</TableHead>
                  <TableHead className="text-right text-xs uppercase tracking-wider">Debit</TableHead>
                  <TableHead className="text-right text-xs uppercase tracking-wider">Credit</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mockJournals.map((journal, idx) => (
                  <React.Fragment key={journal.id}>
                    <TableRow className="bg-muted/10 border-b-0 hover:bg-muted/10">
                      <TableCell colSpan={4} className="py-2 text-xs font-medium text-muted-foreground bg-muted/20">
                        {journal.id} - {journal.description}
                      </TableCell>
                    </TableRow>
                    {journal.entries.map((entry, eIdx) => (
                      <TableRow key={`${journal.id}-${eIdx}`} className="border-b-0 hover:bg-transparent">
                        <TableCell className="py-2 align-top text-xs text-muted-foreground w-[100px]">
                          {eIdx === 0 ? format(journal.date, "dd/MM/yy") : ""}
                        </TableCell>
                        <TableCell className="py-2">
                          <span className={`text-sm ${entry.credit > 0 ? 'ml-6 text-muted-foreground' : 'font-medium'}`}>
                            {entry.accountCode} - {entry.accountName}
                          </span>
                        </TableCell>
                        <TableCell className="text-right py-2 font-medium">
                          {entry.debit > 0 ? formatCurrency(entry.debit) : ""}
                        </TableCell>
                        <TableCell className="text-right py-2 font-medium">
                          {entry.credit > 0 ? formatCurrency(entry.credit) : ""}
                        </TableCell>
                      </TableRow>
                    ))}
                    <TableRow className="border-b last:border-b-0">
                      <TableCell colSpan={4} className="h-6 p-0 border-0"></TableCell>
                    </TableRow>
                  </React.Fragment>
                ))}
              </TableBody>
            </Table>
          </div>
        </motion.div>
      </div>
    </PageWrapper>
  );
}
