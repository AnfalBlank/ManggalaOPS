"use client";

import { Input } from "@/components/ui/input";
import { formatMoneyInput, parseMoneyInput } from "@/lib/money";

export function RupiahInput({ value, onChange, placeholder = "0" }: { value: string; onChange: (value: string) => void; placeholder?: string }) {
  return (
    <div className="relative">
      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">Rp</span>
      <Input
        inputMode="numeric"
        className="pl-10"
        value={formatMoneyInput(value)}
        onChange={(e) => onChange(String(parseMoneyInput(e.target.value) || ""))}
        placeholder={placeholder}
      />
    </div>
  );
}
