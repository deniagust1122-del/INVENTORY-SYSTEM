import React, { useState, useEffect } from 'react';
import { fetchMasterBarangItems, MasterBarangItem } from '../sheets-api';
import { 
  Search, 
  Package, 
  RefreshCw, 
  AlertTriangle, 
  Loader2, 
  CheckCircle2, 
  Info,
  Layers,
  Sparkles
} from 'lucide-react';

interface MasterTabProps {
  token: string;
}

export default function MasterTab({ token }: MasterTabProps) {
  const [items, setItems] = useState<MasterBarangItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [showLowStockOnly, setShowLowStockOnly] = useState(false);

  const loadData = async (isSilent = false) => {
    try {
      if (!isSilent) setLoading(true);
      else setRefreshing(true);
      setError(null);

      const data = await fetchMasterBarangItems(token);
      setItems(data);
    } catch (err: any) {
      console.error(err);
      setError('Gagal memuat katalog Master Barang dari Google Sheets.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [token]);

  const filteredItems = items.filter(item => {
    const matchesSearch = 
      item.namaBarang.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.kodeBarang.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (showLowStockOnly) {
      return matchesSearch && item.stokAkhirQty <= 2;
    }
    return matchesSearch;
  });

  const formatRupiah = (num: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(num);
  };

  if (loading) {
    return (
      <div className="flex h-64 flex-col items-center justify-center gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
        <p className="text-sm font-medium text-slate-500">Memuat Katalog Master Barang...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
        <div>
          <h2 className="text-base font-bold text-slate-800 uppercase tracking-wide">
            Katalog Master Barang & Mutasi
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Database referensi item pergudangan KYOKKO BEACH beserta riwayat stok berjalan.
          </p>
        </div>
        <button
          type="button"
          onClick={() => loadData(true)}
          disabled={refreshing}
          className="inline-flex items-center gap-2 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 px-4 py-2 rounded-lg text-xs font-bold transition disabled:opacity-60 cursor-pointer"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? 'animate-spin' : ''}`} />
          <span>{refreshing ? 'Sinkronisasi...' : 'Sinkronkan Katalog'}</span>
        </button>
      </div>

      {/* Table Card */}
      <div className="bg-white border border-slate-200 rounded-xl flex flex-col min-h-0 shadow-sm overflow-hidden">
        
        {/* Table Filters Header */}
        <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-50/50">
          <div className="flex flex-wrap gap-2 items-center">
            <button
              onClick={() => setShowLowStockOnly(false)}
              className={`px-3 py-1.5 rounded text-[10px] font-bold uppercase transition cursor-pointer ${
                !showLowStockOnly 
                  ? 'bg-indigo-600 text-white' 
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              Semua Barang ({items.length})
            </button>
            <button
              onClick={() => setShowLowStockOnly(true)}
              className={`px-3 py-1.5 rounded text-[10px] font-bold uppercase transition flex items-center gap-1 cursor-pointer ${
                showLowStockOnly 
                  ? 'bg-rose-600 text-white' 
                  : 'bg-white border border-slate-200 text-rose-600 hover:bg-slate-50'
              }`}
            >
              <AlertTriangle className="h-3 w-3" />
              <span>Stok Kritis ({items.filter(i => i.stokAkhirQty <= 2).length})</span>
            </button>
          </div>
          
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Cari Kode atau Nama..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-4 py-1.5 border border-slate-200 rounded-lg text-xs focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition"
            />
          </div>
        </div>

        {error && (
          <div className="p-4 text-center text-xs text-amber-700 bg-amber-50 border-b border-amber-100 flex items-center justify-center gap-2">
            <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
            <span>{error}</span>
          </div>
        )}

        {/* Catalog Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs text-slate-600">
            <thead>
              <tr className="bg-slate-50 text-[10px] uppercase tracking-wider text-slate-500 font-bold border-b border-slate-200">
                <th className="px-6 py-4 w-12 text-center">No</th>
                <th className="px-6 py-4">Kode Barang</th>
                <th className="px-6 py-4">Nama Barang & Deskripsi</th>
                <th className="px-6 py-4">Satuan</th>
                <th className="px-6 py-4 text-center">Stok Awal</th>
                <th className="px-6 py-4 text-center text-emerald-600">Penerimaan (+)</th>
                <th className="px-6 py-4 text-center text-rose-600">Pengeluaran (-)</th>
                <th className="px-6 py-4 text-center">Stok Akhir</th>
                <th className="px-6 py-4 text-right">Nilai Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={9} className="p-12 text-center text-slate-400">
                    Tidak ada barang yang terdaftar atau cocok dengan kriteria pencarian.
                  </td>
                </tr>
              ) : (
                filteredItems.map((item, idx) => {
                  const isLowStock = item.stokAkhirQty <= 2;
                  return (
                    <tr key={`${item.kodeBarang}-${idx}`} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4 text-center font-mono text-slate-400">{idx + 1}</td>
                      <td className="px-6 py-4 font-mono font-bold text-slate-900">{item.kodeBarang}</td>
                      <td className="px-6 py-4">
                        <div className="font-semibold text-slate-800">{item.namaBarang}</div>
                        {isLowStock && (
                          <span className="inline-flex items-center gap-1 mt-1 rounded bg-rose-50 px-1.5 py-0.5 text-[9px] font-bold text-rose-700 border border-rose-100">
                            <AlertTriangle className="h-2.5 w-2.5" />
                            Stok Kritis
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-slate-500">{item.satuan}</td>
                      <td className="px-6 py-4 text-center font-mono font-medium text-slate-600">{item.stokAwalQty}</td>
                      <td className="px-6 py-4 text-center font-mono text-emerald-600 font-bold bg-emerald-50/10">+{item.penerimaanQty}</td>
                      <td className="px-6 py-4 text-center font-mono text-rose-600 font-bold bg-rose-50/10">-{item.pengeluaranQty}</td>
                      <td className={`px-6 py-4 text-center font-mono text-sm font-bold ${
                        isLowStock ? 'text-rose-600 bg-rose-50/5' : 'text-indigo-600 bg-indigo-50/5'
                      }`}>{item.stokAkhirQty}</td>
                      <td className="px-6 py-4 text-right font-mono font-bold text-slate-800">
                        {formatRupiah(item.stokAkhirTotal || (item.stokAkhirQty * (item.stokAkhirHarga || item.stokAwalHarga || 0)))}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
