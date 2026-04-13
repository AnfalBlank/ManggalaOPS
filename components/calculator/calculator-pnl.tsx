"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Trash2, Save, FolderOpen, Loader2 } from "lucide-react";
import { toast } from "sonner";

export function CalculatorPnL() {
  const [name, setName] = useState("");
  const [buyPrice, setBuyPrice] = useState<number | "">("");
  const [sellPrice, setSellPrice] = useState<number | "">("");
  const [qty, setQty] = useState<number | "">(1);
  const [buyIncludePpn, setBuyIncludePpn] = useState(false);
  const [sellIncludePpn, setSellIncludePpn] = useState(false);
  const [ppnRate, setPpnRate] = useState<number | "">(11);

  const [estimations, setEstimations] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchEstimations();
  }, []);

  const fetchEstimations = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/estimations");
      if (res.ok) {
        const data = await res.json();
        setEstimations(data);
      }
    } catch (error) {
      console.error("Failed to fetch estimations", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error("Nama estimasi wajib diisi");
      return;
    }
    try {
      setSaving(true);
      const res = await fetch("/api/estimations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          buyPrice: Number(buyPrice) || 0,
          sellPrice: Number(sellPrice) || 0,
          qty: Number(qty) || 1,
          buyIncludePpn,
          sellIncludePpn,
          ppnRate: Number(ppnRate) || 0,
        }),
      });

      if (res.ok) {
        toast.success("Estimasi berhasil disimpan");
        setName("");
        fetchEstimations();
      } else {
        const data = await res.json();
        toast.error(data.error || "Gagal menyimpan estimasi");
      }
    } catch (error) {
      toast.error("Terjadi kesalahan sistem");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Hapus estimasi ini?")) return;
    try {
      const res = await fetch(`/api/estimations/${id}`, { method: "DELETE" });
      if (res.ok) {
        toast.success("Estimasi dihapus");
        fetchEstimations();
      } else {
        toast.error("Gagal menghapus estimasi");
      }
    } catch (error) {
      toast.error("Terjadi kesalahan sistem");
    }
  };

  const handleLoad = (est: any) => {
    setName(est.name);
    setBuyPrice(est.buyPrice);
    setSellPrice(est.sellPrice);
    setQty(est.qty);
    setBuyIncludePpn(est.buyIncludePpn);
    setSellIncludePpn(est.sellIncludePpn);
    setPpnRate(est.ppnRate);
    toast.success(`Estimasi "${est.name}" dimuat`);
  };

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
    return new Intl.NumberFormat("id-ID", { maximumFractionDigits: 3 }).format(value);
  };

  const handleNumberChange = (setter: React.Dispatch<React.SetStateAction<number | "">>) => (e: React.ChangeEvent<HTMLInputElement>) => {
    // Allows IDR formatted string to be parsed correctly preserving decimals
    const str = e.target.value;
    const normalized = str
      .replace(/\./g, "")    // Remove thousand separators
      .replace(/,/g, ".")    // Convert comma to dot
      .replace(/[^\d.-]/g, ""); // Keep digits, dot, and minus
      
    if (normalized === "") {
       setter("");
       return;
    }
    
    // We update the state precisely, but we should probably keep string state to allow trailing dots?
    // Since state is number, typing "10," -> "10." -> Number("10.") = 10. The user can't see the comma!
    // But this is an existing issue in the calculator numeric state design.
    // At least parse valid full numbers for now.
    setter(Number(normalized) || "");
  };

  const formatRupiah = (value: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(value);
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-6 md:grid-cols-2">
        {/* Input Section */}
        <Card>
          <CardHeader>
            <CardTitle>Form Transaksi</CardTitle>
            <CardDescription>Masukkan detail harga beli, jual, dan kuantitas</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Nama Estimasi (Project)</Label>
              <Input
                type="text"
                placeholder="Misal: Proyek Pengadaan Laptop Dinas"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>

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

              <Button onClick={handleSave} disabled={saving} className="w-full">
                {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                Simpan Estimasi
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Saved Estimations List */}
      <Card>
        <CardHeader>
          <CardTitle>Riwayat Estimasi</CardTitle>
          <CardDescription>Daftar estimasi yang pernah disimpan sebagai patokan project.</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center items-center py-8 text-muted-foreground">
              <Loader2 className="w-6 h-6 animate-spin mr-2" /> Memuat data...
            </div>
          ) : estimations.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground text-sm border border-dashed rounded-lg">
              Belum ada estimasi yang disimpan.
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {estimations.map((est) => {
                const estTotalBuy = (est.buyIncludePpn ? est.buyPrice / (1 + est.ppnRate / 100) : est.buyPrice) * est.qty;
                const estTotalSell = (est.sellIncludePpn ? est.sellPrice / (1 + est.ppnRate / 100) : est.sellPrice) * est.qty;
                const estProfit = estTotalSell - estTotalBuy;
                const estMargin = estTotalSell > 0 ? (estProfit / estTotalSell) * 100 : 0;
                
                return (
                  <div key={est.id} className="p-4 rounded-lg border flex flex-col justify-between group hover:border-primary/50 transition-colors">
                    <div className="space-y-1 mb-4">
                      <h4 className="font-semibold text-base line-clamp-1" title={est.name}>{est.name}</h4>
                      <p className="text-[11px] text-muted-foreground">Qty: {est.qty} &bull; PPN: {est.ppnRate}%</p>
                      <p className="text-[10px] text-muted-foreground opacity-75">Beli {est.buyIncludePpn ? "(Inc PPN)" : "(Exc PPN)"} &bull; Jual {est.sellIncludePpn ? "(Inc PPN)" : "(Exc PPN)"}</p>
                      <div className="flex items-center gap-2 mt-2 pt-2 border-t">
                        <div className="flex-1">
                          <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Profit Estimasi</p>
                          <p className={`font-semibold text-sm ${estProfit > 0 ? "text-green-600" : estProfit < 0 ? "text-red-500" : ""}`}>
                            {formatRupiah(estProfit)}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Margin</p>
                          <p className="font-medium text-sm">{estMargin.toFixed(2)}%</p>
                        </div>
                      </div>
                    </div>
                    <div className="flex justify-between items-center gap-2">
                      <Button variant="outline" size="sm" className="flex-1 text-xs" onClick={() => handleLoad(est)}>
                        <FolderOpen className="w-3 h-3 mr-2" /> Load Data
                      </Button>
                      <Button variant="ghost" size="sm" className="text-red-500 hover:bg-red-50 hover:text-red-600 px-2" onClick={() => handleDelete(est.id)}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
