"use client";

import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";

import { Button } from "@/components/ui/button";

type PaginationProps = {
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
  onPageSizeChange?: (pageSize: number) => void;
  pageSizeOptions?: number[];
};

const DEFAULT_PAGE_SIZES = [10, 25, 50, 100];

export function Pagination({
  page,
  pageSize,
  total,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = DEFAULT_PAGE_SIZES,
}: PaginationProps) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(Math.max(1, page), totalPages);
  const startItem = total === 0 ? 0 : (safePage - 1) * pageSize + 1;
  const endItem = Math.min(safePage * pageSize, total);

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-2 py-3 text-sm">
      <div className="text-muted-foreground">
        {total === 0 ? "Tidak ada data" : `Menampilkan ${startItem}-${endItem} dari ${total} entri`}
      </div>
      <div className="flex items-center gap-2">
        {onPageSizeChange ? (
          <div className="flex items-center gap-2 mr-2">
            <span className="text-xs text-muted-foreground">Per page</span>
            <select
              value={pageSize}
              onChange={(e) => onPageSizeChange(Number(e.target.value))}
              className="h-8 rounded-md border border-input bg-background px-2 text-sm"
            >
              {pageSizeOptions.map((option) => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
          </div>
        ) : null}

        <Button variant="outline" size="sm" className="size-8 p-0" disabled={safePage <= 1} onClick={() => onPageChange(1)} title="Halaman pertama">
          <ChevronsLeft className="size-4" />
        </Button>
        <Button variant="outline" size="sm" className="size-8 p-0" disabled={safePage <= 1} onClick={() => onPageChange(safePage - 1)} title="Halaman sebelumnya">
          <ChevronLeft className="size-4" />
        </Button>
        <span className="px-2 text-xs font-medium tabular-nums">
          {safePage} / {totalPages}
        </span>
        <Button variant="outline" size="sm" className="size-8 p-0" disabled={safePage >= totalPages} onClick={() => onPageChange(safePage + 1)} title="Halaman selanjutnya">
          <ChevronRight className="size-4" />
        </Button>
        <Button variant="outline" size="sm" className="size-8 p-0" disabled={safePage >= totalPages} onClick={() => onPageChange(totalPages)} title="Halaman terakhir">
          <ChevronsRight className="size-4" />
        </Button>
      </div>
    </div>
  );
}

/**
 * Helper to slice a list by page+pageSize. Use after filtering/sorting,
 * before passing to the table.
 */
export function paginate<T>(items: T[], page: number, pageSize: number): T[] {
  const totalPages = Math.max(1, Math.ceil(items.length / pageSize));
  const safePage = Math.min(Math.max(1, page), totalPages);
  const start = (safePage - 1) * pageSize;
  return items.slice(start, start + pageSize);
}
