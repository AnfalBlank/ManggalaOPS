"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/format";

type RevenuePoint = {
  name: string;
  total: number;
};

type CashflowPoint = {
  name: string;
  in: number;
  out: number;
};

function ChartSkeleton() {
  return <div className="h-full w-full rounded-lg bg-slate-50 animate-pulse" />;
}

export function DashboardCharts({
  revenueData,
  cashflowData,
}: {
  revenueData: RevenuePoint[];
  cashflowData: CashflowPoint[];
}) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const safeRevenueData = useMemo(() => revenueData ?? [], [revenueData]);
  const safeCashflowData = useMemo(() => cashflowData ?? [], [cashflowData]);

  return (
    <div className="lg:col-span-2 space-y-6 min-w-0">
      <Card className="hover:shadow-md transition-shadow border-border/60 min-w-0">
        <CardHeader>
          <CardTitle className="text-lg">Revenue Trend</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[280px] w-full min-w-0">
            {!mounted ? (
              <ChartSkeleton />
            ) : (
              <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                <LineChart data={safeRevenueData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: "#64748B", fontSize: 12 }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: "#64748B", fontSize: 12 }} tickFormatter={(value) => `Rp${value / 1000000}M`} />
                  <Tooltip contentStyle={{ borderRadius: "12px", border: "none", boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)" }} formatter={(value) => [formatCurrency(Number(value ?? 0)), "Revenue"]} />
                  <Line type="monotone" dataKey="total" stroke="#1D4ED8" strokeWidth={3} dot={{ r: 4, fill: "#1D4ED8", strokeWidth: 2, stroke: "#fff" }} activeDot={{ r: 6, strokeWidth: 0 }} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </CardContent>
      </Card>

      <Card className="hover:shadow-md transition-shadow border-border/60 min-w-0">
        <CardHeader>
          <CardTitle className="text-lg">Cash Flow Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[280px] w-full min-w-0">
            {!mounted ? (
              <ChartSkeleton />
            ) : (
              <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                <BarChart data={safeCashflowData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: "#64748B", fontSize: 12 }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: "#64748B", fontSize: 12 }} tickFormatter={(value) => `Rp${value / 1000000}M`} />
                  <Tooltip cursor={{ fill: "#F8FAFC" }} contentStyle={{ borderRadius: "12px", border: "none", boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)" }} formatter={(value, name) => [formatCurrency(Number(value ?? 0)), name === "in" ? "Cash In" : "Cash Out"]} />
                  <Bar dataKey="in" fill="#1D4ED8" radius={[4, 4, 0, 0]} maxBarSize={40} />
                  <Bar dataKey="out" fill="#7C3AED" radius={[4, 4, 0, 0]} maxBarSize={40} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
