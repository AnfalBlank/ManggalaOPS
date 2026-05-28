"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { ArrowDownCircle, ArrowUpCircle, Calculator, FolderOpen, Loader2, Save, Trash2 } from "lucide-react";
import { toast } from "sonner";

type EstimationRow = {
  id: number;
  name: string;
  buyPrice: number;
  sellPrice: number;
  qty: number;
  buyIncludePpn: boolean;
  sellIncludePpn: boolean;
  ppnRate: number;
  createdAt?: string | number | null;
};

type Computed = {
  dppBuyUnit: number;
  dppSellUnit: number;
  grossBuyUnit: number;
  grossSellUnit: number;
  totalDppBuy: number;
  totalDppSell: number;
  totalGrossBuy: number;
  totalGrossSell: number;
  ppnMasukan: number;
  ppnKeluaran: number;
  ppnDisetor: number;
  profit: number;
  marginPct: number;
  cashOut: number;
  cashIn: number;
  netCash: number;
};

function compute(buy: number, sell: number, qty: number, ppnRate: number, buyIncPpn: boolean, sellIncPpn: boolean): Computed {
  const ppnFactor = 1 + ppnRate / 100;
  // DPP per unit (price excluding PPN — the "real" net price the company books).
  const dppBuyUnit = buyIncPpn ? buy / ppnFactor : buy;
  const dppSellUnit = sellIncPpn ? sell / ppnFactor : sell;
  // Gross per unit (price including PPN — the actual cash that changes hands).
  const grossBuyUnit = buyIncPpn ? buy : buy * ppnFactor;
  const grossSellUnit = sellIncPpn ? sell : sell * ppnFactor;

  const totalDppBuy = dppBuyUnit * qty;
  const totalDppSell = dppSellUnit * qty;
  const totalGrossBuy = grossBuyUnit * qty;
  const totalGrossSell = grossSellUnit * qty;

  const ppnMasukan = totalDppBuy * (ppnRate / 100);
  const ppnKeluaran = totalDppSell * (ppnRate / 100);
  const ppnDisetor = ppnKeluaran - ppnMasukan;

  // Profit on DPP basis = net economic profit (also equals net cash flow after PPN settlement).
  const profit = totalDppSell - totalDppBuy;
  const marginPct = totalDppSell > 0 ? (profit / totalDppSell) * 100 : 0;

  // Cash flow view: actual money in/out (gross) before PPN settlement.
  const cashOut = totalGrossBuy;
  const cashIn = totalGrossSell;
  const netCash = cashIn - cashOut - ppnDisetor; // equals `profit`

  return {
    dppBuyUnit, dppSellUnit, grossBuyUnit, grossSellUnit,
    totalDppBuy, totalDppSell, totalGrossBuy, totalGrossSell,
    ppnMasukan, ppnKeluaran, ppnDisetor, profit, marginPct,
    cashOut, cashIn, netCash,
  };
}

const formatRupiah = (v: number) =>
  new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(v);

export function CalculatorPnL() {
  const [name, setName] = useState("");
  const [buyPrice, setBuyPrice] = useState<number | "">("");
  const [sellPrice, setSellPrice] = useState<number | "">("");
  const [qty, setQty] = useState<number | "">(1);
  const [buyIncludePpn, setBuyIncludePpn] = useState(false);
  const [sellIncludePpn, setSellIncludePpn] = useState(false);
  const [ppnRate, setPpnRate] = useState<number | "">(11);

  const [estimations, setEstimations] = useState<EstimationRow[]>([]);
  const [editingId, setEditingId] = useState<number | null>(null);
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
      const isUpdate = editingId !== null;
      const res = await fetch(isUpdate ? `/api/estimations/${editingId}` : "/api/estimations", {
        method: isUpdate ? "PATCH" : "POST",
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
        toast.success(isUpdate ? "Estimasi diupdate" : "Estimasi disimpan");
        setName("");
        setEditingId(null);
        fetchEstimations();
      } else {
        const data = await res.json();
        toast.error(data.error || "Gagal menyimpan estimasi");
      }
    } catch {
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
        if (editingId === id) handleNewEstimation();
        fetchEstimations();
      } else {
        toast.error("Gagal menghapus estimasi");
      }
    } catch {
      toast.error("Terjadi kesalahan sistem");
    }
  };

  const handleLoad = (est: EstimationRow) => {
    setName(est.name);
    setBuyPrice(est.buyPrice);
    setSellPrice(est.sellPrice);
    setQty(est.qty);
    setBuyIncludePpn(est.buyIncludePpn);
    setSellIncludePpn(est.sellIncludePpn);
    setPpnRate(est.ppnRate);
    setEditingId(est.id);
    toast.success(`Editing "${est.name}". Klik Simpan untuk update.`);
  };

  const handleNewEstimation = () => {
    setName("");
    setBuyPrice("");
    setSellPrice("");
    setQty(1);
    setBuyIncludePpn(false);
    setSellIncludePpn(false);
    setPpnRate(11);
    setEditingId(null);
  };

  // ---- LIVE CALCULATIONS ----
  const vBuy = Number(buyPrice) || 0;
  const vSell = Number(sellPrice) || 0;
  const vQty = Math.max(Number(qty) || 1, 1);
  const vPpnRate = Number(ppnRate) || 0;
  const c = compute(vBuy, vSell, vQty, vPpnRate, buyIncludePpn, sellIncludePpn);

  // Format number input field (thousand separator while typing).
  const formatNumberInput = (value: number | "") => {
    if (value === "") return "";
    return new Intl.NumberFormat("id-ID", { maximumFractionDigits: 0 }).format(value);
  };

  const handleNumberChange = (setter: React.Dispatch<React.SetStateAction<number | "">>) => (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const str = e.target.value;
    const normalized = str.replace(/\./g, "").replace(/[^\d]/g, "");
    if (normalized === "") {
      setter("");
      return;
    }
    setter(Number(normalized));
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-6 md:grid-cols-2">
        {/* ============== INPUT ============== */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Calculator className="size-5 text-primary" /> Form Transaksi</CardTitle>
            <CardDescription>Masukkan detail harga beli, harga jual, dan kuantitas. Centang opsi PPN sesuai harga yang kamu input.</CardDescription>
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

            <div className="rounded-lg border p-4 space-y-3 bg-rose-50/30">
              <div className="flex items-center gap-2 text-sm font-semibold text-rose-700">
                <ArrowUpCircle className="size-4" /> Harga Beli (dari vendor)
              </div>
              <div className="space-y-2">
                <Label className="text-xs">Harga Beli per Unit</Label>
                <Input
                  type="text"
                  inputMode="numeric"
                  placeholder="0"
                  value={formatNumberInput(buyPrice)}
                  onChange={handleNumberChange(setBuyPrice)}
                />
                <label className="flex items-center space-x-2 text-xs text-muted-foreground cursor-pointer select-none">
                  <input
                    type="checkbox"
                    className="rounded border-input bg-background w-4 h-4"
                    checked={buyIncludePpn}
                    onChange={(e) => setBuyIncludePpn(e.target.checked)}
                  />
                  <span>Harga sudah termasuk PPN ({vPpnRate}%)</span>
                </label>
                {vBuy > 0 ? (
                  <p className="text-[11px] text-muted-foreground italic">
                    {buyIncludePpn
                      ? `DPP (tanpa PPN): ${formatRupiah(c.dppBuyUnit)} • Total bayar ke vendor: ${formatRupiah(c.grossBuyUnit)}`
                      : `Total bayar ke vendor (+ PPN): ${formatRupiah(c.grossBuyUnit)}`}
                  </p>
                ) : null}
              </div>
            </div>

            <div className="rounded-lg border p-4 space-y-3 bg-emerald-50/30">
              <div className="flex items-center gap-2 text-sm font-semibold text-emerald-700">
                <ArrowDownCircle className="size-4" /> Harga Jual (ke client)
              </div>
              <div className="space-y-2">
                <Label className="text-xs">Harga Jual per Unit</Label>
                <Input
                  type="text"
                  inputMode="numeric"
                  placeholder="0"
                  value={formatNumberInput(sellPrice)}
                  onChange={handleNumberChange(setSellPrice)}
                />
                <label className="flex items-center space-x-2 text-xs text-muted-foreground cursor-pointer select-none">
                  <input
                    type="checkbox"
                    className="rounded border-input bg-background w-4 h-4"
                    checked={sellIncludePpn}
                    onChange={(e) => setSellIncludePpn(e.target.checked)}
                  />
                  <span>Harga sudah termasuk PPN ({vPpnRate}%)</span>
                </label>
                {vSell > 0 ? (
                  <p className="text-[11px] text-muted-foreground italic">
                    {sellIncludePpn
                      ? `DPP (tanpa PPN): ${formatRupiah(c.dppSellUnit)} • Total tagih ke client: ${formatRupiah(c.grossSellUnit)}`
                      : `Total tagih ke client (+ PPN): ${formatRupiah(c.grossSellUnit)}`}
                  </p>
                ) : null}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Quantity</Label>
                <Input
                  type="text"
                  inputMode="numeric"
                  placeholder="1"
                  value={formatNumberInput(qty)}
                  onChange={handleNumberChange(setQty)}
                />
              </div>
              <div className="space-y-2">
                <Label>Tarif PPN (%)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={ppnRate}
                  onChange={(e) => setPpnRate(e.target.value ? Number(e.target.value) : "")}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ============== OUTPUT ============== */}
        <Card>
          <CardHeader>
            <CardTitle>Ringkasan P&L</CardTitle>
            <CardDescription>
              Perhitungan margin dan kewajiban PPN. Profit dihitung dari DPP (harga tanpa PPN) sesuai standar pajak.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            {/* CASH FLOW BLOCK — what user actually pays/receives */}
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 space-y-2">
              <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">Arus Kas (Total)</div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-600">Cash Out — Bayar vendor</span>
                <span className="font-medium text-rose-600">{formatRupiah(c.totalGrossBuy)}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-600">Cash In — Terima dari client</span>
                <span className="font-medium text-emerald-600">{formatRupiah(c.totalGrossSell)}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-600">Setor PPN ke negara</span>
                <span className={`font-medium ${c.ppnDisetor >= 0 ? "text-rose-600" : "text-emerald-600"}`}>
                  {c.ppnDisetor >= 0 ? formatRupiah(c.ppnDisetor) : `(restitusi ${formatRupiah(Math.abs(c.ppnDisetor))})`}
                </span>
              </div>
              <div className="h-px bg-slate-200 my-2" />
              <div className="flex justify-between items-center">
                <span className="font-semibold text-slate-800">Net Cash (Profit Bersih)</span>
                <span className={`font-bold text-lg ${c.profit > 0 ? "text-emerald-600" : c.profit < 0 ? "text-rose-600" : "text-slate-800"}`}>
                  {formatRupiah(c.profit)}
                </span>
              </div>
              <div className="flex justify-between items-center text-xs text-slate-500">
                <span>Margin terhadap penjualan (DPP)</span>
                <span className={`font-medium ${c.profit > 0 ? "text-emerald-600" : c.profit < 0 ? "text-rose-600" : ""}`}>
                  {c.marginPct.toFixed(2)}%
                </span>
              </div>
            </div>

            {/* TAX BREAKDOWN */}
            <div className="rounded-lg border border-blue-100 bg-blue-50 p-4 space-y-2">
              <div className="text-xs font-semibold uppercase tracking-wider text-blue-700">Rincian PPN</div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-600">PPN Masukan (dari pembelian)</span>
                <span className="font-medium text-slate-700">{formatRupiah(c.ppnMasukan)}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-600">PPN Keluaran (dari penjualan)</span>
                <span className="font-medium text-slate-700">{formatRupiah(c.ppnKeluaran)}</span>
              </div>
              <div className="h-px bg-blue-200 my-2" />
              <div className="flex justify-between items-center">
                <span className="font-semibold text-blue-800">PPN Harus Disetor</span>
                <span className="font-bold text-blue-800">{formatRupiah(c.ppnDisetor)}</span>
              </div>
              {c.ppnDisetor < 0 && (
                <div className="text-xs text-blue-600 italic">PPN Masukan {`>`} Keluaran → bisa direstitusi/dikompensasi.</div>
              )}
            </div>

            {/* DPP DETAIL — for tax docs */}
            <div className="rounded-lg border bg-muted/20 p-4 space-y-2">
              <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">Detail DPP (Dasar Pajak)</div>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <div className="text-slate-500">DPP Beli per unit</div>
                  <div className="font-semibold">{formatRupiah(c.dppBuyUnit)}</div>
                </div>
                <div>
                  <div className="text-slate-500">DPP Jual per unit</div>
                  <div className="font-semibold">{formatRupiah(c.dppSellUnit)}</div>
                </div>
                <div>
                  <div className="text-slate-500">Total DPP Beli</div>
                  <div className="font-semibold">{formatRupiah(c.totalDppBuy)}</div>
                </div>
                <div>
                  <div className="text-slate-500">Total DPP Jual</div>
                  <div className="font-semibold">{formatRupiah(c.totalDppSell)}</div>
                </div>
              </div>
            </div>

            <div className="flex gap-2">
              {editingId !== null ? (
                <Button variant="outline" onClick={handleNewEstimation} className="flex-1">
                  Estimasi Baru
                </Button>
              ) : null}
              <Button onClick={handleSave} disabled={saving} className="flex-1">
                {saving ? <Loader2 className="size-4 mr-2 animate-spin" /> : <Save className="size-4 mr-2" />}
                {editingId !== null ? "Update Estimasi" : "Simpan Estimasi"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ============== HISTORY ============== */}
      <Card>
        <CardHeader>
          <CardTitle>Riwayat Estimasi</CardTitle>
          <CardDescription>Daftar estimasi yang pernah disimpan sebagai patokan project.</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center items-center py-8 text-muted-foreground">
              <Loader2 className="size-6 animate-spin mr-2" /> Memuat data...
            </div>
          ) : estimations.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground text-sm border border-dashed rounded-lg">
              Belum ada estimasi yang disimpan.
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {estimations.map((est) => {
                const ec = compute(est.buyPrice, est.sellPrice, est.qty, est.ppnRate, est.buyIncludePpn, est.sellIncludePpn);
                return (
                  <div key={est.id} className="p-4 rounded-lg border flex flex-col justify-between hover:border-primary/50 transition-colors">
                    <div className="space-y-1 mb-3">
                      <h4 className="font-semibold text-sm line-clamp-2 min-h-[2.5em]" title={est.name}>{est.name}</h4>
                      <p className="text-[11px] text-muted-foreground">Qty {est.qty} · PPN {est.ppnRate}%</p>
                      <p className="text-[10px] text-muted-foreground">
                        Beli {est.buyIncludePpn ? "inc" : "exc"} · Jual {est.sellIncludePpn ? "inc" : "exc"} PPN
                      </p>
                      <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t text-[11px]">
                        <div>
                          <p className="text-muted-foreground">Net Cash</p>
                          <p className={`font-semibold text-sm ${ec.profit > 0 ? "text-emerald-600" : ec.profit < 0 ? "text-rose-600" : ""}`}>
                            {formatRupiah(ec.profit)}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-muted-foreground">Margin</p>
                          <p className="font-medium text-sm">{ec.marginPct.toFixed(1)}%</p>
                        </div>
                      </div>
                    </div>
                    <div className="flex justify-between items-center gap-2">
                      <Button variant={editingId === est.id ? "default" : "outline"} size="sm" className="flex-1 text-xs" onClick={() => handleLoad(est)}>
                        <FolderOpen className="size-3 mr-2" /> {editingId === est.id ? "Editing" : "Edit"}
                      </Button>
                      <Button variant="ghost" size="sm" className="text-rose-500 hover:bg-rose-50 hover:text-rose-600 px-2" onClick={() => handleDelete(est.id)}>
                        <Trash2 className="size-4" />
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
