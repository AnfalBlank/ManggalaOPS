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
  customStart?: string;
  customEnd?: string;
  onCustomRangeChange?: (range: { start: string; end: string }) => void;
};

const defaultPeriodOptions: FilterOption[] = [
  { label: "Semua periode", value: "all" },
  { label: "30 hari terakhir", value: "30d" },
  { label: "Bulan ini", value: "month" },
  { label: "Tahun ini", value: "year" },
  { label: "Range custom", value: "custom" },
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
  customStart = "",
  customEnd = "",
  onCustomRangeChange,
}: TableFilterBarProps) {
  return (
    <div className="flex flex-col gap-3">
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

      {periodValue === "custom" && onCustomRangeChange ? (
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3 rounded-lg bg-muted/30 p-3 border">
          <span className="text-xs font-medium text-muted-foreground uppercase">Range Custom</span>
          <div className="flex flex-1 flex-col sm:flex-row gap-2">
            <Input
              type="date"
              value={customStart}
              onChange={(e) => onCustomRangeChange({ start: e.target.value, end: customEnd })}
              className="sm:max-w-[180px]"
              placeholder="Mulai"
            />
            <span className="hidden sm:inline self-center text-muted-foreground">—</span>
            <Input
              type="date"
              value={customEnd}
              onChange={(e) => onCustomRangeChange({ start: customStart, end: e.target.value })}
              className="sm:max-w-[180px]"
              placeholder="Akhir"
            />
          </div>
        </div>
      ) : null}
    </div>
  );
}
