"use client"

import * as React from "react"

import { cn } from "@/lib/utils"

// Di HP (< 768 px) tiap baris tabel tampil jadi kartu: judul kolom pindah ke kiri nilainya.
// Judul kolom diambil otomatis dari <th>, disimpan di data-label tiap <td> (lihat globals.css).
// Matikan dengan kartuHp={false} buat tabel yang memang harus tetap tabel.
function pasangLabel(table: HTMLTableElement) {
  const judul: string[] = []
  const barisJudul = table.tHead?.rows[table.tHead.rows.length - 1]
  if (barisJudul) {
    for (const th of Array.from(barisJudul.cells)) {
      const teks = (th.textContent ?? "").trim()
      for (let i = 0; i < (th.colSpan || 1); i++) judul.push(teks)
    }
  }
  const bagian: HTMLTableSectionElement[] = Array.from(table.tBodies)
  if (table.tFoot) bagian.push(table.tFoot)
  for (const body of bagian) {
    for (const tr of Array.from(body.rows)) {
      let kolom = 0
      const penuh = tr.cells.length === 1 && (tr.cells[0].colSpan || 1) > 1
      for (const td of Array.from(tr.cells)) {
        if (td.dataset.labelManual === undefined) {
          const label = penuh ? "" : judul[kolom] ?? ""
          if (td.getAttribute("data-label") !== label) td.setAttribute("data-label", label)
        }
        kolom += td.colSpan || 1
      }
    }
  }
}

function Table({ className, kartuHp = true, ...props }: React.ComponentProps<"table"> & { kartuHp?: boolean }) {
  const ref = React.useRef<HTMLTableElement>(null)
  React.useEffect(() => {
    const table = ref.current
    if (!table || !kartuHp) return
    pasangLabel(table)
    const amati = new MutationObserver(() => pasangLabel(table))
    amati.observe(table, { childList: true, subtree: true, characterData: true })
    return () => amati.disconnect()
  }, [kartuHp])
  return (
    <div
      data-slot="table-container"
      className="relative w-full overflow-x-auto"
    >
      <table
        ref={ref}
        data-slot="table"
        data-kartu={kartuHp ? "hp" : undefined}
        className={cn("w-full caption-bottom text-sm", className)}
        {...props}
      />
    </div>
  )
}

function TableHeader({ className, ...props }: React.ComponentProps<"thead">) {
  return (
    <thead
      data-slot="table-header"
      className={cn("[&_tr]:border-b", className)}
      {...props}
    />
  )
}

function TableBody({ className, ...props }: React.ComponentProps<"tbody">) {
  return (
    <tbody
      data-slot="table-body"
      className={cn("[&_tr:last-child]:border-0", className)}
      {...props}
    />
  )
}

function TableFooter({ className, ...props }: React.ComponentProps<"tfoot">) {
  return (
    <tfoot
      data-slot="table-footer"
      className={cn(
        "border-t bg-muted/50 font-medium [&>tr]:last:border-b-0",
        className
      )}
      {...props}
    />
  )
}

function TableRow({ className, ...props }: React.ComponentProps<"tr">) {
  return (
    <tr
      data-slot="table-row"
      className={cn(
        "border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted",
        className
      )}
      {...props}
    />
  )
}

function TableHead({ className, ...props }: React.ComponentProps<"th">) {
  return (
    <th
      data-slot="table-head"
      className={cn(
        "h-10 px-2 text-left align-middle font-medium whitespace-nowrap text-foreground [&:has([role=checkbox])]:pr-0",
        className
      )}
      {...props}
    />
  )
}

function TableCell({ className, ...props }: React.ComponentProps<"td">) {
  return (
    <td
      data-slot="table-cell"
      className={cn(
        "p-2 align-middle whitespace-nowrap [&:has([role=checkbox])]:pr-0",
        className
      )}
      {...props}
    />
  )
}

function TableCaption({
  className,
  ...props
}: React.ComponentProps<"caption">) {
  return (
    <caption
      data-slot="table-caption"
      className={cn("mt-4 text-sm text-muted-foreground", className)}
      {...props}
    />
  )
}

export {
  Table,
  TableHeader,
  TableBody,
  TableFooter,
  TableHead,
  TableRow,
  TableCell,
  TableCaption,
}
