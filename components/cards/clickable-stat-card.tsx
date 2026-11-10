"use client";

import Link from "next/link";
import type { ReactNode } from "react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function ClickableStatCard({
  href,
  title,
  value,
  hint,
  icon,
  accentClassName = "bg-blue-50 text-blue-600",
  featured = false,
}: {
  href: string;
  title: string;
  value: ReactNode;
  hint?: ReactNode;
  icon: ReactNode;
  accentClassName?: string;
  featured?: boolean;
}) {
  return (
    <Link href={href} className="block h-full cursor-pointer">
      <Card className={`h-full cursor-pointer transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg active:scale-[0.99] ${featured ? "border-primary/20 bg-blue-50/50" : "border-border/60"}`}>
        <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2 px-3 sm:px-4">
          <CardTitle className={`text-xs sm:text-sm font-medium ${featured ? "text-primary" : "text-muted-foreground"}`}>{title}</CardTitle>
          <div className={`size-8 sm:size-10 shrink-0 rounded-full flex items-center justify-center ${accentClassName}`}>{icon}</div>
        </CardHeader>
        <CardContent className="px-3 sm:px-4">
          <div className={`text-[15px] leading-tight sm:text-2xl font-bold tabular-nums [overflow-wrap:anywhere] ${featured ? "text-primary" : "text-slate-800"}`}>{value}</div>
          {hint ? <p className="mt-1 text-xs text-muted-foreground">{hint}</p> : null}
        </CardContent>
      </Card>
    </Link>
  );
}
