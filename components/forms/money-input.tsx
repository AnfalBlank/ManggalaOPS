"use client";

import { Input } from "@/components/ui/input";
import { formatMoneyInput, parseMoneyInput } from "@/lib/money";

type MoneyInputProps = {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
};

export function MoneyInput({ id, value, onChange, placeholder }: MoneyInputProps) {
  return (
    <Input
      id={id}
      inputMode="numeric"
      value={formatMoneyInput(value)}
      onChange={(event) => onChange(String(parseMoneyInput(event.target.value) || ""))}
      placeholder={placeholder}
    />
  );
}
