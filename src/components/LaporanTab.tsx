import React, { useState, useEffect } from 'react';
import { 
  FileSpreadsheet, 
  Download, 
  Search, 
  Loader2, 
  Calendar, 
  TrendingUp, 
  TrendingDown, 
  Layers, 
  AlertCircle,
  RefreshCw
} from 'lucide-react';
import { 
  fetchMasterBarangItems, 
  fetchPenerimaanItems, 
  fetchPengeluaranItems,
  MasterBarangItem,
  PenerimaanItem,
  PengeluaranItem
} from '../sheets-api';

interface ReportRow {
  kodeBarang: string;
  namaBarang: string;
  satuan: string;
  saldoAwal: number;
  penerimaan: number;
  pengeluaran: number;
  saldoAkhir: number;
  nilaiRupiah: number;
  unitPrice: number;
}

const MONTHS_ID = [
  { value: 1, label: 'Januari' },
  { value: 2, label: 'Februari' },
  { value: 3, label: 'Maret' },
  { value: 4, label: 'April' },
  { value: 5, label: 'Mei' },
  { value: 6, label: 'Juni' },
  { value: 7, label: 'Juli' },
  { value: 8, label: 'Agustus' },
  { value: 9, label: 'September' },
  { value: 10, label: 'Oktober' },
  { value: 11, label: 'November' },
  { value: 12, label: 'Desember' }
];

const YEARS = [2024, 2025, 2026, 2027, 2028];

export default function LaporanTab({ token }: { token: string }) {
  const [loading, setLoading] = useState(true);
  const [calculating, setCalculating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Filter & parameters states
  const [periodType, setPeriodType] = useState<'bulanan' | 'tahunan'>('bulanan');
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState<number>(2026); // Default matching user's current timeline
  const [searchQuery, setSearchQuery] = useState('');

  // Source data states
  const [masterItems, setMasterItems] = useState<MasterBarangItem[]>([]);
  const [penerimaanItems, setPenerimaanItems] = useState<PenerimaanItem[]>([]);
  const [pengeluaranItems, setPengeluaranItems] = useState<PengeluaranItem[]>([]);

  // Generated report data
  const [reportRows, setReportRows] = useState<ReportRow[]>([]);

  // Fetch all source data once
  const loadSourceData = async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      setError(null);

      // Fetch all required sheets in parallel asynchronously
      const [master, penerimaan, pengeluaran] = await Promise.all([
        fetchMasterBarangItems(token),
        fetchPenerimaanItems(token),
        fetchPengeluaranItems(token)
      ]);

      setMasterItems(master || []);
      setPenerimaanItems(penerimaan || []);
      setPengeluaranItems(pengeluaran || []);
    } catch (err: any) {
      console.error('Error fetching data for reporting module:', err);
      setError(err.message || 'Gagal memuat data dari Google Sheets. Pastikan koneksi dan konfigurasi Apps Script Anda benar.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSourceData();
  }, [token]);

  // Calculate report rows when source data or filters change
  useEffect(() => {
    if (masterItems.length === 0) return;

    setCalculating(true);

    // Using a light async deferment to keep the UI completely smooth and prevent frame drops (anti-lag)
    const timer = setTimeout(() => {
      try {
        let startDateStr = '';
        let endDateStr = '';

        if (periodType === 'bulanan') {
          const monthStr = String(selectedMonth).padStart(2, '0');
          startDateStr = `${selectedYear}-${monthStr}-01`;
          const lastDay = new Date(selectedYear, selectedMonth, 0).getDate();
          const lastDayStr = String(lastDay).padStart(2, '0');
          endDateStr = `${selectedYear}-${monthStr}-${lastDayStr}`;
        } else {
          startDateStr = `${selectedYear}-01-01`;
          endDateStr = `${selectedYear}-12-31`;
        }

        const calculated = masterItems.map(item => {
          const kode = item.kodeBarang;

          // 1. Calculate opening balance (Saldo Awal)
          // Start with absolute initial opening balance defined in master catalog
          const masterOpeningQty = item.stokAwalQty || 0;

          // Add all receptions prior to start date of selected period
          const receivedPrior = penerimaanItems
            .filter(p => p.kodeBarang === kode && p.tanggal && p.tanggal < startDateStr)
            .reduce((sum, p) => sum + (Number(p.qty) || 0), 0);

          // Subtract all issues prior to start date of selected period
          const issuedPrior = pengeluaranItems
            .filter(p => p.kodeBarang === kode && p.tanggal && p.tanggal < startDateStr)
            .reduce((sum, p) => sum + (Number(p.qty) || 0), 0);

          const saldoAwal = masterOpeningQty + receivedPrior - issuedPrior;

          // 2. Calculate receptions (Penerimaan) within selected period
          const penerimaan = penerimaanItems
            .filter(p => p.kodeBarang === kode && p.tanggal && p.tanggal >= startDateStr && p.tanggal <= endDateStr)
            .reduce((sum, p) => sum + (Number(p.qty) || 0), 0);

          // 3. Calculate issues (Pengeluaran) within selected period
          const pengeluaran = pengeluaranItems
            .filter(p => p.kodeBarang === kode && p.tanggal && p.tanggal >= startDateStr && p.tanggal <= endDateStr)
            .reduce((sum, p) => sum + (Number(p.qty) || 0), 0);

          // 4. Calculate closing balance (Saldo Akhir)
          const saldoAkhir = saldoAwal + penerimaan - pengeluaran;

          // 5. Determine unit price for inventory valuation
          let unitPrice = Number(item.stokAwalHarga) || 0;

          // Fallback to the latest price from receptions in the selected period if available
          const periodPenerimaans = penerimaanItems.filter(
            p => p.kodeBarang === kode && p.tanggal && p.tanggal >= startDateStr && p.tanggal <= endDateStr
          );

          if (periodPenerimaans.length > 0) {
            // Sort by date desc to find the latest verified transaction price
            const sorted = [...periodPenerimaans].sort((a, b) => b.tanggal.localeCompare(a.tanggal));
            unitPrice = Number(sorted[0].hargaSatuan) || unitPrice;
          } else {
            // Or look for any historic reception price if period has none
            const allPenerimaans = penerimaanItems.filter(p => p.kodeBarang === kode);
            if (allPenerimaans.length > 0) {
              const sortedAll = [...allPenerimaans].sort((a, b) => b.tanggal.localeCompare(a.tanggal));
              unitPrice = Number(sortedAll[0].hargaSatuan) || unitPrice;
            }
          }

          const nilaiRupiah = saldoAkhir * unitPrice;

          return {
            kodeBarang: kode,
            namaBarang: item.namaBarang,
            satuan: item.satuan,
            saldoAwal,
            penerimaan,
            pengeluaran,
            saldoAkhir,
            nilaiRupiah,
            unitPrice
          };
        });

        setReportRows(calculated);
      } catch (err) {
        console.error('Calculation error in report:', err);
      } finally {
        setCalculating(false);
      }
    }, 100);

    return () => clearTimeout(timer);
  }, [selectedMonth, selectedYear, periodType, masterItems, penerimaanItems, pengeluaranItems]);

  const handleExportCSV = () => {
    if (reportRows.length === 0) return;

    const headers = ['Kode Barang', 'Nama Barang', 'Satuan', 'Saldo Awal', 'Penerimaan', 'Pengeluaran', 'Saldo Akhir', 'Harga Satuan (IDR)', 'Nilai Rupiah Total (IDR)'];
    
    const csvContent = [
      headers.join(','),
      ...reportRows.map(row => [
        `"${row.kodeBarang.replace(/"/g, '""')}"`,
        `"${row.namaBarang.replace(/"/g, '""')}"`,
        `"${row.satuan.replace(/"/g, '""')}"`,
        row.saldoAwal,
        row.penerimaan,
        row.pengeluaran,
        row.saldoAkhir,
        row.unitPrice,
        row.nilaiRupiah
      ].join(','))
    ].join('\n');

    // Excel compatibility with UTF-8 BOM prefix
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    
    const periodName = periodType === 'bulanan'
      ? `Bulanan_${MONTHS_ID.find(m => m.value === selectedMonth)?.label}_${selectedYear}`
      : `Tahunan_${selectedYear}`;

    link.setAttribute('href', url);
    link.setAttribute('download', `Laporan_Stok_Gudang_KyokkoBeach_${periodName}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const formatRupiah = (val: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0
    }).format(val);
  };

  // Filtered rows for the table search view
  const filteredRows = reportRows.filter(row => {
    const q = searchQuery.toLowerCase();
    return (
      row.kodeBarang.toLowerCase().includes(q) ||
      row.namaBarang.toLowerCase().includes(q)
    );
  });

  // Totals calculations
  const totalSaldoAwal = filteredRows.reduce((sum, r) => sum + r.saldoAwal, 0);
  const totalPenerimaan = filteredRows.reduce((sum, r) => sum + r.penerimaan, 0);
  const totalPengeluaran = filteredRows.reduce((sum, r) => sum + r.pengeluaran, 0);
  const totalSaldoAkhir = filteredRows.reduce((sum, r) => sum + r.saldoAkhir, 0);
  const totalValueIDR = filteredRows.reduce((sum, r) => sum + r.nilaiRupiah, 0);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center bg-white rounded-xl border border-slate-200 shadow-sm min-h-[300px]">
        <Loader2 className="h-8 w-8 text-indigo-600 animate-spin mb-3" />
        <p className="text-sm font-semibold text-slate-800">Menghubungkan & Membaca Data Google Sheets...</p>
        <p className="text-xs text-slate-500 mt-1">Mengambil database MUTASI, PENERIMAAN dan PENGELUARAN untuk laporan real-time</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-rose-200 bg-rose-50 p-6 shadow-sm">
        <div className="flex gap-3">
          <AlertCircle className="h-5 w-5 text-rose-600 shrink-0 mt-0.5" />
          <div>
            <h3 className="text-sm font-bold text-rose-800">Gagal Mempersiapkan Modul Laporan</h3>
            <p className="text-xs text-rose-700 mt-1">{error}</p>
            <button
              onClick={() => loadSourceData()}
              className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-rose-600 px-3.5 py-1.5 text-xs font-bold text-white hover:bg-rose-700 shadow-xs cursor-pointer transition"
            >
              <RefreshCw className="h-3 w-3" /> Muat Ulang Data
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5 text-indigo-600" />
            <h2 className="text-base font-bold text-slate-900">Modul Pelaporan Stok & Mutasi</h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Analisis terperinci persediaan barang gudang KYOKKO BEACH dengan perhitungan Saldo Awal, Masuk, Keluar, dan Saldo Akhir.
          </p>
        </div>

        <button
          onClick={handleExportCSV}
          disabled={reportRows.length === 0 || calculating}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-700 shadow-xs disabled:opacity-50 transition cursor-pointer"
        >
          <Download className="h-4 w-4" />
          <span>Ekspor Excel/CSV</span>
        </button>
      </div>

      {/* Filter and Control Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* Period type selector */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">Jenis Laporan</span>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => setPeriodType('bulanan')}
              className={`py-2 text-xs font-bold rounded-lg transition border cursor-pointer ${
                periodType === 'bulanan'
                  ? 'bg-indigo-50 border-indigo-200 text-indigo-700 shadow-xs'
                  : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              Bulanan
            </button>
            <button
              onClick={() => setPeriodType('tahunan')}
              className={`py-2 text-xs font-bold rounded-lg transition border cursor-pointer ${
                periodType === 'tahunan'
                  ? 'bg-indigo-50 border-indigo-200 text-indigo-700 shadow-xs'
                  : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              Tahunan
            </button>
          </div>
        </div>

        {/* Month selector (Conditional) */}
        {periodType === 'bulanan' && (
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">Pilih Bulan</span>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(Number(e.target.value))}
              className="w-full rounded-lg border border-slate-200 p-2 text-xs font-semibold text-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 bg-white"
            >
              {MONTHS_ID.map(m => (
                <option key={m.value} value={m.value}>{m.label}</option>
              ))}
            </select>
          </div>
        )}

        {/* Year selector */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">Pilih Tahun</span>
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(Number(e.target.value))}
            className="w-full rounded-lg border border-slate-200 p-2 text-xs font-semibold text-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 bg-white"
          >
            {YEARS.map(y => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>

        {/* Search Input */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between lg:col-span-1">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">Cari Barang</span>
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Cari kode atau nama..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-lg border border-slate-200 pl-9 pr-4 py-2 text-xs font-medium text-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
            />
          </div>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center gap-4">
          <div className="p-3 bg-slate-50 border border-slate-100 rounded-lg text-slate-500 shrink-0">
            <Calendar className="h-5 w-5" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Periode Laporan</span>
            <span className="text-xs font-bold text-slate-800">
              {periodType === 'bulanan' 
                ? `${MONTHS_ID.find(m => m.value === selectedMonth)?.label} ${selectedYear}`
                : `Tahun ${selectedYear}`
              }
            </span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center gap-4">
          <div className="p-3 bg-indigo-50 border border-indigo-100 rounded-lg text-indigo-600 shrink-0">
            <TrendingUp className="h-5 w-5" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Penerimaan Qty</span>
            <span className="text-sm font-bold text-indigo-700">{totalPenerimaan} Item</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center gap-4">
          <div className="p-3 bg-rose-50 border border-rose-100 rounded-lg text-rose-600 shrink-0">
            <TrendingDown className="h-5 w-5" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Pengeluaran Qty</span>
            <span className="text-sm font-bold text-rose-700">{totalPengeluaran} Item</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center gap-4">
          <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-lg text-emerald-600 shrink-0">
            <Layers className="h-5 w-5" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Valuasi Stok Akhir</span>
            <span className="text-sm font-bold text-emerald-700">{formatRupiah(totalValueIDR)}</span>
          </div>
        </div>
      </div>

      {/* Main Table Grid Card */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        {calculating && (
          <div className="bg-indigo-50 px-4 py-2 border-b border-indigo-100 flex items-center gap-2 justify-center text-xs font-semibold text-indigo-700">
            <Loader2 className="h-3 w-3 animate-spin" />
            <span>Mengkalkulasi saldo akhir & penyesuaian periodik...</span>
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold">
                <th className="p-4 w-28">Kode Barang</th>
                <th className="p-4">Nama Barang</th>
                <th className="p-4 w-24">Satuan</th>
                <th className="p-4 text-right w-28">Saldo Awal</th>
                <th className="p-4 text-right w-28">Penerimaan</th>
                <th className="p-4 text-right w-28">Pengeluaran</th>
                <th className="p-4 text-right w-28">Saldo Akhir</th>
                <th className="p-4 text-right w-36">Nilai Rupiah</th>
              </tr>
            </thead>
            <tbody>
              {filteredRows.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-12 text-center text-slate-400 font-medium">
                    Tidak ada data persediaan barang yang cocok atau ditemukan untuk periode ini.
                  </td>
                </tr>
              ) : (
                filteredRows.map((row, idx) => (
                  <tr 
                    key={row.kodeBarang} 
                    className={`border-b border-slate-100 hover:bg-slate-50/60 transition ${
                      idx % 2 === 1 ? 'bg-slate-50/20' : ''
                    }`}
                  >
                    <td className="p-4 font-mono font-bold text-slate-700">{row.kodeBarang}</td>
                    <td className="p-4 font-medium text-slate-900">{row.namaBarang}</td>
                    <td className="p-4 text-slate-500 font-medium">{row.satuan}</td>
                    <td className="p-4 text-right font-semibold text-slate-600">{row.saldoAwal}</td>
                    <td className="p-4 text-right font-semibold text-emerald-600">
                      {row.penerimaan > 0 ? `+${row.penerimaan}` : '0'}
                    </td>
                    <td className="p-4 text-right font-semibold text-rose-600">
                      {row.pengeluaran > 0 ? `-${row.pengeluaran}` : '0'}
                    </td>
                    <td className="p-4 text-right font-bold text-slate-800">
                      <span className={`px-2 py-0.5 rounded ${
                        row.saldoAkhir <= 0 
                          ? 'bg-rose-50 text-rose-700 border border-rose-100' 
                          : row.saldoAkhir < 10 
                          ? 'bg-amber-50 text-amber-700 border border-amber-100' 
                          : 'text-slate-800'
                      }`}>
                        {row.saldoAkhir}
                      </span>
                    </td>
                    <td className="p-4 text-right font-mono font-bold text-slate-900">{formatRupiah(row.nilaiRupiah)}</td>
                  </tr>
                ))
              )}
            </tbody>
            {filteredRows.length > 0 && (
              <tfoot>
                <tr className="bg-slate-100/80 font-bold border-t-2 border-slate-300 text-slate-900">
                  <td colSpan={3} className="p-4 text-left">Total Akumulasi</td>
                  <td className="p-4 text-right font-semibold text-slate-700">{totalSaldoAwal}</td>
                  <td className="p-4 text-right font-semibold text-emerald-700">+{totalPenerimaan}</td>
                  <td className="p-4 text-right font-semibold text-rose-700">-{totalPengeluaran}</td>
                  <td className="p-4 text-right font-bold text-slate-900">{totalSaldoAkhir}</td>
                  <td className="p-4 text-right font-mono font-extrabold text-indigo-700">{formatRupiah(totalValueIDR)}</td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>
    </div>
  );
}
