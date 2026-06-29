import React, { useState, useEffect } from 'react';
import { fetchMasterBarangItems, MasterBarangItem, fetchPenerimaanItems, fetchPengeluaranItems } from '../sheets-api';
import { 
  Search, 
  Package, 
  RefreshCw, 
  ArrowUpRight, 
  ArrowDownLeft, 
  TrendingUp, 
  AlertTriangle, 
  Loader2,
  PieChart as PieIcon,
  BarChart2,
  CalendarDays,
  CheckCircle2
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  PieChart, 
  Pie, 
  Cell 
} from 'recharts';

interface DashboardProps {
  token: string;
}

export default function Dashboard({ token }: DashboardProps) {
  const [items, setItems] = useState<MasterBarangItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  // Statistics
  const [totalProducts, setTotalProducts] = useState(0);
  const [totalStokAkhir, setTotalStokAkhir] = useState(0);
  const [totalPenerimaan, setTotalPenerimaan] = useState(0);
  const [totalPengeluaran, setTotalPengeluaran] = useState(0);

  const loadDashboardData = async (isSilent = false) => {
    try {
      if (!isSilent) setLoading(true);
      else setRefreshing(true);

      const [masterData, recData, issData] = await Promise.all([
        fetchMasterBarangItems(token),
        fetchPenerimaanItems(token),
        fetchPengeluaranItems(token)
      ]);

      setItems(masterData);

      // Summarize stats
      setTotalProducts(masterData.length);
      
      let finalStok = 0;
      let recQty = 0;
      let issQty = 0;

      masterData.forEach(item => {
        finalStok += item.stokAkhirQty;
        recQty += item.penerimaanQty;
        issQty += item.pengeluaranQty;
      });

      setTotalStokAkhir(finalStok);
      setTotalPenerimaan(recQty);
      setTotalPengeluaran(issQty);

      setError(null);
    } catch (err: any) {
      console.error(err);
      setError('Gagal memuat data dashboard dari Google Sheets.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, [token]);

  // Data preparation for Top 5 Active Items Chart
  const topActiveItemsData = [...items]
    .sort((a, b) => (b.penerimaanQty + b.pengeluaranQty) - (a.penerimaanQty + a.pengeluaranQty))
    .slice(0, 5)
    .map(item => {
      const nama = String(item.namaBarang || '');
      return {
        name: nama.length > 15 ? `${nama.slice(0, 15)}...` : nama,
        'Penerimaan': item.penerimaanQty,
        'Pengeluaran': item.pengeluaranQty
      };
    });

  // Data preparation for Stock Level Pie Chart
  const criticalItemsCount = items.filter(i => i.stokAkhirQty <= 2).length;
  const safeItemsCount = items.length - criticalItemsCount;

  const stockDistributionData = [
    { name: 'Stok Kritis (≤ 2 Qty)', value: criticalItemsCount, color: '#e11d48' },
    { name: 'Stok Aman (> 2 Qty)', value: safeItemsCount, color: '#4f46e5' }
  ];

  if (loading) {
    return (
      <div className="flex h-96 flex-col items-center justify-center gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
        <p className="text-sm font-medium text-slate-500">Menyinkronkan data visualisasi dari Google Sheets...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Metrics Grid */}
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {/* Metric 1 */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-slate-500 text-[11px] font-bold uppercase tracking-wider block mb-1">Katalog Item</span>
            <div className="text-3xl font-black text-slate-950 font-mono">{totalProducts}</div>
            <div className="text-[10px] text-slate-400 mt-1">Jenis barang terdaftar</div>
          </div>
          <div className="rounded-lg bg-indigo-50 p-3 text-indigo-600">
            <Package className="h-6 w-6" />
          </div>
        </div>

        {/* Metric 2 */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-slate-500 text-[11px] font-bold uppercase tracking-wider block mb-1">Masuk (LPB)</span>
            <div className="text-3xl font-black text-emerald-600 font-mono">+{totalPenerimaan}</div>
            <div className="text-[10px] text-emerald-500 mt-1 font-semibold">Total Kuantitas Masuk</div>
          </div>
          <div className="rounded-lg bg-emerald-50 p-3 text-emerald-600">
            <ArrowUpRight className="h-6 w-6" />
          </div>
        </div>

        {/* Metric 3 */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-slate-500 text-[11px] font-bold uppercase tracking-wider block mb-1">Keluar (SKB)</span>
            <div className="text-3xl font-black text-rose-600 font-mono">-{totalPengeluaran}</div>
            <div className="text-[10px] text-rose-500 mt-1 font-semibold">Total Kuantitas Keluar</div>
          </div>
          <div className="rounded-lg bg-rose-50 p-3 text-rose-600">
            <ArrowDownLeft className="h-6 w-6" />
          </div>
        </div>

        {/* Metric 4 */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-slate-500 text-[11px] font-bold uppercase tracking-wider block mb-1">Saldo Stok Fisik</span>
            <div className="text-3xl font-black text-slate-950 font-mono">{totalStokAkhir}</div>
            <div className="text-[10px] text-slate-400 mt-1">Sisa kuantitas gabungan</div>
          </div>
          <div className="rounded-lg bg-slate-100 p-3 text-slate-700 border border-slate-200">
            <TrendingUp className="h-6 w-6" />
          </div>
        </div>
      </div>

      {error && (
        <div className="p-4 text-center text-xs text-amber-700 bg-amber-50 border border-amber-100 rounded-xl flex items-center justify-center gap-2">
          <AlertTriangle className="h-3.5 w-3.5" />
          <span>{error}</span>
        </div>
      )}

      {/* Visual Charts Row */}
      <div className="grid gap-6 md:grid-cols-12">
        {/* Top Active Goods Bar Chart */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs md:col-span-8 flex flex-col">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <BarChart2 className="h-4 w-4 text-indigo-600" />
              <span>Top 5 Barang Paling Aktif</span>
            </h3>
            <span className="text-[9px] text-slate-400 font-mono">Volume Masuk vs Keluar</span>
          </div>

          <div className="h-80 w-full flex-1">
            {topActiveItemsData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-xs text-slate-400">Tidak ada data untuk ditampilkan</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topActiveItemsData} margin={{ top: 10, right: 10, left: -20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} tickLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} />
                  <Tooltip contentStyle={{ fontSize: '11px', borderRadius: '8px', border: '1px solid #e2e8f0' }} />
                  <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                  <Bar dataKey="Penerimaan" fill="#10b981" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Pengeluaran" fill="#f43f5e" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Stock Level Pie Chart */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs md:col-span-4 flex flex-col">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <PieIcon className="h-4 w-4 text-indigo-600" />
              <span>Komposisi Level Stok</span>
            </h3>
            <span className="text-[9px] text-slate-400 font-mono">Kritikalitas Barang</span>
          </div>

          <div className="h-56 w-full flex-1 relative flex items-center justify-center">
            {items.length === 0 ? (
              <div className="text-xs text-slate-400">Tidak ada data</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={stockDistributionData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {stockDistributionData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => [`${value} Barang`]} contentStyle={{ fontSize: '11px', borderRadius: '8px' }} />
                </PieChart>
              </ResponsiveContainer>
            )}

            {/* Inner Absolute Center text */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none mt-1">
              <span className="text-2xl font-black text-slate-950 font-mono">{criticalItemsCount}</span>
              <span className="text-[9px] font-bold text-rose-600 uppercase tracking-wider">Kritis / Rendah</span>
            </div>
          </div>

          <div className="space-y-2 mt-4 pt-4 border-t border-slate-100">
            {stockDistributionData.map((item, idx) => (
              <div key={idx} className="flex items-center justify-between text-xs font-medium">
                <span className="flex items-center gap-1.5 text-slate-600">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                  {item.name}
                </span>
                <span className="font-bold text-slate-900 font-mono">
                  {item.value} item ({items.length > 0 ? Math.round((item.value / items.length) * 100) : 0}%)
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Critical Stock List Warning panel */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
        <div className="border-b border-slate-100 pb-3 mb-4 flex justify-between items-center">
          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
            <AlertTriangle className="h-4.5 w-4.5 text-rose-600" />
            <span>Pemberitahuan Stok Kritis (Urgent)</span>
          </h3>
          <span className="text-[9px] text-rose-700 bg-rose-50 px-2.5 py-0.5 rounded-full font-bold">
            Stok ≤ 2 Qty
          </span>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.filter(i => i.stokAkhirQty <= 2).length === 0 ? (
            <div className="col-span-full py-6 text-center text-xs text-emerald-600 font-bold bg-emerald-50/50 rounded-lg border border-dashed border-emerald-200 flex items-center justify-center gap-2">
              <CheckCircle2 className="h-4.5 w-4.5 text-emerald-500" />
              <span>Seluruh stok barang dalam kondisi aman (&gt; 2 Qty).</span>
            </div>
          ) : (
            items.filter(i => i.stokAkhirQty <= 2).map((item, idx) => (
              <div key={idx} className="rounded-xl border border-rose-100 bg-rose-50/20 p-4 space-y-2 flex flex-col justify-between">
                <div className="space-y-1">
                  <div className="flex justify-between items-start">
                    <span className="font-mono text-[10px] font-bold text-rose-700 bg-rose-50 px-1.5 py-0.5 rounded">
                      {item.kodeBarang}
                    </span>
                    <span className="font-mono text-xs font-black text-rose-600">
                      Stok: {item.stokAkhirQty} {item.satuan}
                    </span>
                  </div>
                  <h4 className="font-semibold text-xs text-slate-800 line-clamp-1">{item.namaBarang}</h4>
                </div>

                <div className="pt-2 border-t border-rose-100/50 text-[10px] text-slate-500 flex justify-between">
                  <span>Masuk: +{item.penerimaanQty}</span>
                  <span>Keluar: -{item.pengeluaranQty}</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
