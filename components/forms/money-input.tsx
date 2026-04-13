"use client";

import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { formatMoneyInput, parseMoneyInput } from "@/lib/money";

type MoneyInputProps = {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
};

export function MoneyInput({ id, value, onChange, placeholder }: MoneyInputProps) {
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
    <Input
      id={id}
      inputMode="numeric"
      value={internalValue}
      onChange={handleChange}
      onBlur={handleBlur}
      placeholder={placeholder}
    />
  );
}
