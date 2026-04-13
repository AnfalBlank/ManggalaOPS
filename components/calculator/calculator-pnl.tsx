"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function CalculatorPnL() {
  const [buyPrice, setBuyPrice] = useState<number | "">("");
  const [sellPrice, setSellPrice] = useState<number | "">("");
  const [qty, setQty] = useState<number | "">(1);
  const [buyIncludePpn, setBuyIncludePpn] = useState(false);
  const [sellIncludePpn, setSellIncludePpn] = useState(false);
  const [ppnRate, setPpnRate] = useState<number | "">(11);

  // Parse inputs safely
  const vBuy = Number(buyPrice) || 0;
  const vSell = Number(sellPrice) || 0;
  const vQty = Math.max(Number(qty) || 1, 1);
  const vPpnRate = Number(ppnRate) || 0;

  // Calculatations per unit
  const dppBuyUnit = buyIncludePpn ? vBuy / (1 + vPpnRate / 100) : vBuy;
  const dppSellUnit = sellIncludePpn ? vSell / (1 + vPpnRate / 100) : vSell;

  // Total Calculations
  const totalDppBuy = dppBuyUnit * vQty;
  const totalDppSell = dppSellUnit * vQty;

  const ppnMasukan = totalDppBuy * (vPpnRate / 100);
  const ppnKeluaran = totalDppSell * (vPpnRate / 100);
  const ppnDisetor = ppnKeluaran - ppnMasukan;

  const totalProfit = totalDppSell - totalDppBuy;
  const marginPercentage = totalDppSell > 0 ? (totalProfit / totalDppSell) * 100 : 0;

  const formatNumberInput = (value: number | "") => {
    if (value === "") return "";
    return new Intl.NumberFormat("id-ID").format(value);
  };

  const handleNumberChange = (setter: React.Dispatch<React.SetStateAction<number | "">>) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value.replace(/\./g, "").replace(/\D/g, "");
    setter(rawValue ? Number(rawValue) : "");
  };

  const formatRupiah = (value: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(value);
  };

  return (
    <div className="grid gap-6 md:grid-cols-2">
      {/* Input Section */}
      <Card>
        <CardHeader>
          <CardTitle>Form Transaksi</CardTitle>
          <CardDescription>Masukkan detail harga beli, jual, dan kuantitas</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Harga Beli per Unit</Label>
            <Input
              type="text"
              placeholder="0"
              value={formatNumberInput(buyPrice)}
              onChange={handleNumberChange(setBuyPrice)}
            />
            <label className="flex items-center space-x-2 text-sm text-muted-foreground mt-1 cursor-pointer">
              <input
                type="checkbox"
                className="rounded border-input bg-background w-4 h-4"
                checked={buyIncludePpn}
                onChange={(e) => setBuyIncludePpn(e.target.checked)}
              />
              <span>Harga Beli sudah include PPN</span>
            </label>
          </div>

          <div className="space-y-2">
            <Label>Harga Jual per Unit</Label>
            <Input
              type="text"
              placeholder="0"
              value={formatNumberInput(sellPrice)}
              onChange={handleNumberChange(setSellPrice)}
            />
            <label className="flex items-center space-x-2 text-sm text-muted-foreground mt-1 cursor-pointer">
              <input
                type="checkbox"
                className="rounded border-input bg-background w-4 h-4"
                checked={sellIncludePpn}
                onChange={(e) => setSellIncludePpn(e.target.checked)}
              />
              <span>Harga Jual sudah include PPN</span>
            </label>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Quantity (Minimal 1)</Label>
              <Input
                type="text"
                placeholder="1"
                value={formatNumberInput(qty)}
                onChange={handleNumberChange(setQty)}
              />
            </div>
            <div className="space-y-2">
              <Label>PPN (%)</Label>
              <Input
                type="number"
                value={ppnRate}
                onChange={(e) => setPpnRate(e.target.value ? Number(e.target.value) : "")}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Output Section */}
      <Card>
        <CardHeader>
          <CardTitle>Ringkasan P&L (Profit & Loss)</CardTitle>
          <CardDescription>Estimasi keuntungan bersih dan kewajiban pajak</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="space-y-1">
                <span className="text-muted-foreground block text-xs">DPP Beli per unit</span>
                <span className="font-semibold">{formatRupiah(dppBuyUnit)}</span>
              </div>
              <div className="space-y-1">
                <span className="text-muted-foreground block text-xs">DPP Jual per unit</span>
                <span className="font-semibold">{formatRupiah(dppSellUnit)}</span>
              </div>
            </div>

            <div className="rounded-lg border bg-muted/20 p-4 space-y-3">
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">Total DPP Beli</span>
                <span className="font-medium">{formatRupiah(totalDppBuy)}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">Total DPP Jual</span>
                <span className="font-medium">{formatRupiah(totalDppSell)}</span>
              </div>
              <div className="h-px bg-border w-full my-2" />
              <div className="flex justify-between items-center">
                <span className="font-semibold">Total Profit (Kotor)</span>
                <span className={`font-bold ${totalProfit > 0 ? "text-green-600" : totalProfit < 0 ? "text-red-500" : ""}`}>
                  {formatRupiah(totalProfit)}
                </span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">Margin (%)</span>
                <span className={`font-semibold ${totalProfit > 0 ? "text-green-600" : totalProfit < 0 ? "text-red-500" : ""}`}>
                  {marginPercentage.toFixed(2)}%
                </span>
              </div>
            </div>

            <div className="rounded-lg border border-blue-100 bg-blue-50 p-4 space-y-3 dark:border-blue-900/50 dark:bg-blue-900/10">
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-600 dark:text-slate-400">PPN Masukan</span>
                <span className="font-medium text-slate-700 dark:text-slate-300">{formatRupiah(ppnMasukan)}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-600 dark:text-slate-400">PPN Keluaran</span>
                <span className="font-medium text-slate-700 dark:text-slate-300">{formatRupiah(ppnKeluaran)}</span>
              </div>
              <div className="h-px bg-blue-200 dark:bg-blue-800 w-full my-2" />
              <div className="flex justify-between items-center">
                <span className="font-semibold text-blue-700 dark:text-blue-300">PPN Harus Disetor</span>
                <span className="font-bold text-blue-700 dark:text-blue-300">
                  {formatRupiah(ppnDisetor)}
                </span>
              </div>
              {ppnDisetor < 0 && (
                <div className="text-xs text-blue-600/70 dark:text-blue-400/70 mt-1 italic text-right">
                  (Lebih Bayar PPN)
                </div>
              )}
            </div>
            
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
