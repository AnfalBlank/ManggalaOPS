"use client";

import { Search } from "lucide-react";

import { Input } from "@/components/ui/input";

type TableFilterBarProps = {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
};

export function TableFilterBar({ value, onChange, placeholder }: TableFilterBarProps) {
  return (
    <div className="relative w-full sm:max-w-xs">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
      <Input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="pl-9"
      />
    </div>
  );
}
