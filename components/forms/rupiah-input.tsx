"use client";

import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { formatMoneyInput, parseMoneyInput } from "@/lib/money";

export function RupiahInput({ value, onChange, placeholder = "0" }: { value: string; onChange: (value: string) => void; placeholder?: string }) {
  const [internalValue, setInternalValue] = useState(formatMoneyInput(value));

  useEffect(() => {
    const parsedExternal = parseMoneyInput(value, false);
    const parsedInternal = parseMoneyInput(internalValue, true);
    if (parsedExternal !== parsedInternal) {
      setInternalValue(formatMoneyInput(value));
    }
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/[^0-9.,]/g, "");
    setInternalValue(val);
    const parsed = parseMoneyInput(val, true);
    onChange(parsed ? String(parsed) : "");
  };

  const handleBlur = () => {
    setInternalValue(formatMoneyInput(value));
  };

  return (
    <div className="relative">
      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">Rp</span>
      <Input
        inputMode="numeric"
        className="pl-10"
        value={internalValue}
        onChange={handleChange}
        onBlur={handleBlur}
        placeholder={placeholder}
      />
    </div>
  );
}
