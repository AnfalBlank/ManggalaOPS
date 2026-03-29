"use client";

import { Search } from "lucide-react";

import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type FilterOption = {
  label: string;
  value: string;
};

type TableFilterBarProps = {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  periodValue?: string;
  onPeriodChange?: (value: string) => void;
  periodOptions?: FilterOption[];
  typeValue?: string;
  onTypeChange?: (value: string) => void;
  typeOptions?: FilterOption[];
};

const defaultPeriodOptions: FilterOption[] = [
  { label: "Semua periode", value: "all" },
  { label: "30 hari terakhir", value: "30d" },
  { label: "Bulan ini", value: "month" },
  { label: "Tahun ini", value: "year" },
];

export function TableFilterBar({
  value,
  onChange,
  placeholder,
  periodValue,
  onPeriodChange,
  periodOptions = defaultPeriodOptions,
  typeValue,
  onTypeChange,
  typeOptions = [],
}: TableFilterBarProps) {
  return (
    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
      <div className="relative w-full md:max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
        <Input
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          className="pl-9"
        />
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        {onPeriodChange ? (
          <Select value={periodValue ?? "all"} onValueChange={(next) => onPeriodChange(next ?? "all")}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Pilih periode" />
            </SelectTrigger>
            <SelectContent>
              {periodOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : null}

        {onTypeChange && typeOptions.length > 0 ? (
          <Select value={typeValue ?? "all"} onValueChange={(next) => onTypeChange(next ?? "all")}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Pilih jenis" />
            </SelectTrigger>
            <SelectContent>
              {typeOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : null}
      </div>
    </div>
  );
}
