import React, { useState, useEffect, useRef } from 'react';
import { 
  fetchMasterBarangItems, 
  fetchSPBItems, 
  appendSPBRow, 
  MasterBarangItem, 
  SPBItem 
} from '../sheets-api';
import { 
  ClipboardList, 
  Loader2, 
  Search, 
  AlertCircle, 
  CheckCircle2, 
  Calendar, 
  Filter, 
  RefreshCw, 
  X, 
  Printer, 
  ChevronDown,
  Clock,
  Check
} from 'lucide-react';
import PrintSPB from './PrintSPB';

interface SPBTabProps {
  token: string;
}

export default function SPBTab({ token }: SPBTabProps) {
  const [barangList, setBarangList] = useState<MasterBarangItem[]>([]);
  const [spbList, setSpbList] = useState<SPBItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Search & Dynamic Dropdown Master Barang state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBarang, setSelectedBarang] = useState<MasterBarangItem | null>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // Form Fields
  const [tanggal, setTanggal] = useState(new Date().toISOString().split('T')[0]);
  const [noSPB, setNoSPB] = useState('');
  const [namaPeminta, setNamaPeminta] = useState('');
  const [departemen, setDepartemen] = useState('');
  const [qty, setQty] = useState<number>(0);
  const [keterangan, setKeterangan] = useState('');

  // History Filter Fields
  const [historyStartDate, setHistoryStartDate] = useState('');
  const [historyEndDate, setHistoryEndDate] = useState('');
  const [historySearchQuery, setHistorySearchQuery] = useState('');
  const [historyStatusFilter, setHistoryStatusFilter] = useState<'All' | 'Pending' | 'Disetujui'>('All');

  // Print Mode State
  const [activePrintSpb, setActivePrintSpb] = useState<SPBItem | null>(null);

  // Confirmation Modal
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  // Ref for Dropdown Click Outside
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Load database items
  const loadData = async (isSilent = false) => {
    try {
      if (!isSilent) setLoading(true);
      else setRefreshing(true);
      setError(null);

      const [barang, spbs] = await Promise.all([
        fetchMasterBarangItems(token),
        fetchSPBItems(token)
      ]);

      setBarangList(barang);
      setSpbList([...spbs].reverse()); // Newest first

      // Generate dynamic SPB ID if not already set or cleared
      generateNoSPB();
    } catch (err: any) {
      console.error(err);
      setError('Gagal memuat data SPB dari Google Sheets.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const generateNoSPB = () => {
    const dateStr = new Date().toISOString().split('T')[0].replace(/-/g, '');
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    setNoSPB(`SPB-${dateStr}-${randomNum}`);
  };

  useEffect(() => {
    loadData();
  }, [token]);

  // Handle click outside to close the custom dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filter Barang for Dropdown
  const filteredBarang = barangList.filter(b => {
    const q = searchQuery.toLowerCase();
    return (
      b.kodeBarang.toLowerCase().includes(q) ||
      b.namaBarang.toLowerCase().includes(q)
    );
  });

  const handleSelectBarang = (barang: MasterBarangItem) => {
    setSelectedBarang(barang);
    setQty(1);
  };

  // Form Validation
  const validateForm = (): string | null => {
    if (!namaPeminta.trim()) return 'Nama Peminta tidak boleh kosong.';
    if (!departemen.trim()) return 'Departemen tidak boleh kosong.';
    if (!selectedBarang) return 'Silakan pilih barang terlebih dahulu.';
    if (!noSPB.trim()) return 'Nomor SPB tidak boleh kosong.';
    if (qty <= 0) return 'Jumlah permintaan barang harus lebih besar dari 0.';
    return null;
  };

  const handleOpenConfirm = (e: React.FormEvent) => {
    e.preventDefault();
    const validationError = validateForm();
    if (validationError) {
      alert(validationError);
      return;
    }
    setShowConfirmModal(true);
  };

  const handleSubmit = async () => {
    if (!selectedBarang) return;

    try {
      setSubmitting(true);
      setShowConfirmModal(false);

      await appendSPBRow(
        {
          tanggal,
          noSPB,
          namaPeminta: namaPeminta.trim(),
          departemen: departemen.trim(),
          kodeBarang: selectedBarang.kodeBarang,
          namaBarang: selectedBarang.namaBarang,
          qty,
          keterangan: keterangan.trim() || `Permintaan barang ${selectedBarang.namaBarang}`,
          status: 'Pending'
        },
        token
      );

      // Reset Form fields
      setNamaPeminta('');
      setDepartemen('');
      setSelectedBarang(null);
      setQty(0);
      setKeterangan('');
      generateNoSPB();

      // Refresh database
      await loadData(true);
      alert('Surat Permintaan Barang (SPB) berhasil diajukan dengan status Pending!');
    } catch (err: any) {
      console.error(err);
      alert(`Gagal menyimpan data SPB: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  // Filter history list
  const filteredSpbs = spbList.filter(item => {
    if (historyStartDate && item.tanggal < historyStartDate) return false;
    if (historyEndDate && item.tanggal > historyEndDate) return false;
    if (historyStatusFilter !== 'All' && item.status !== historyStatusFilter) return false;

    if (historySearchQuery) {
      const q = historySearchQuery.toLowerCase();
      return (
        item.noSPB.toLowerCase().includes(q) ||
        item.namaPeminta.toLowerCase().includes(q) ||
        item.departemen.toLowerCase().includes(q) ||
        item.namaBarang.toLowerCase().includes(q) ||
        item.kodeBarang.toLowerCase().includes(q)
      );
    }
    return true;
  });

  if (activePrintSpb) {
    return (
      <PrintSPB 
        spb={activePrintSpb} 
        onBack={() => setActivePrintSpb(null)} 
      />
    );
  }

  if (loading) {
    return (
      <div className="flex h-64 flex-col items-center justify-center gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
        <p className="text-sm font-medium text-slate-500">Menghubungkan ke database Google Sheets...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center text-red-800">
        <AlertCircle className="mx-auto h-12 w-12 text-red-500 mb-4" />
        <h4 className="font-bold text-lg">Gagal Memuat Data SPB</h4>
        <p className="text-sm text-red-600 mt-1 mb-4">{error}</p>
        <button
          onClick={() => loadData()}
          className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 transition"
        >
          Coba Muat Ulang
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
        <div>
          <h2 className="text-base font-bold text-slate-800 uppercase tracking-wide">
            Permintaan Barang (SPB)
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Buat formulir permintaan barang dari departemen dan pantau status persetujuan.
          </p>
        </div>
        <button
          type="button"
          onClick={() => loadData(true)}
          disabled={refreshing}
          className="inline-flex items-center gap-2 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 px-4 py-2 rounded-lg text-xs font-bold transition disabled:opacity-60 cursor-pointer"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? 'animate-spin' : ''}`} />
          <span>{refreshing ? 'Sinkronisasi...' : 'Sinkronkan Database'}</span>
        </button>
      </div>

      <div className="grid gap-8 lg:grid-cols-12">
        {/* Input Form Panel */}
        <div className="lg:col-span-5 space-y-6">
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs space-y-6">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-3 flex items-center gap-2">
              <ClipboardList className="h-4.5 w-4.5 text-indigo-600" />
              <span>Formulir Pengajuan SPB</span>
            </h3>

            <form onSubmit={handleOpenConfirm} className="space-y-4">
              
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">
                    Tanggal Pengajuan
                  </label>
                  <input
                    type="date"
                    value={tanggal}
                    onChange={(e) => setTanggal(e.target.value)}
                    required
                    className="w-full rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">
                    No SPB (Otomatis)
                  </label>
                  <input
                    type="text"
                    value={noSPB}
                    onChange={(e) => setNoSPB(e.target.value)}
                    required
                    className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-mono font-bold focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition"
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">
                    Nama Peminta
                  </label>
                  <input
                    type="text"
                    placeholder="Nama lengkap..."
                    value={namaPeminta}
                    onChange={(e) => setNamaPeminta(e.target.value)}
                    required
                    className="w-full rounded-lg border border-slate-200 px-3 py-1.5 text-xs focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">
                    Departemen
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: Produksi, IT..."
                    value={departemen}
                    onChange={(e) => setDepartemen(e.target.value)}
                    required
                    className="w-full rounded-lg border border-slate-200 px-3 py-1.5 text-xs focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition"
                  />
                </div>
              </div>

              {/* Searchable Custom Dropdown for Master Barang */}
              <div className="relative" ref={dropdownRef}>
                <label className="block text-xs font-semibold text-slate-500 mb-1">
                  Pilih Barang Permintaan
                </label>
                <button
                  type="button"
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className="w-full text-left rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-800 hover:border-slate-300 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition flex items-center justify-between shadow-xs"
                >
                  {selectedBarang ? (
                    <div className="truncate pr-4">
                      <span className="font-mono font-bold text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded text-[10px] mr-2">
                        {selectedBarang.kodeBarang}
                      </span>
                      <span className="text-slate-800 font-semibold">{selectedBarang.namaBarang}</span>
                    </div>
                  ) : (
                    <span className="text-slate-400">-- Pilih Kode/Nama Barang --</span>
                  )}
                  <ChevronDown className={`h-4 w-4 text-slate-400 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
                </button>

                {isDropdownOpen && (
                  <div className="absolute left-0 right-0 z-50 mt-1.5 rounded-xl border border-slate-200 bg-white p-3 shadow-xl max-h-96 flex flex-col">
                    <div className="relative mb-2">
                      <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                      <input
                        type="text"
                        placeholder="Cari Kode atau Nama Barang..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full rounded-lg border border-slate-200 pl-9 pr-4 py-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition"
                        autoFocus
                      />
                    </div>

                    <div className="overflow-y-auto space-y-1 max-h-60 pr-1">
                      {filteredBarang.length === 0 ? (
                        <p className="text-xs text-center text-slate-400 py-6">Tidak ada barang yang sesuai.</p>
                      ) : (
                        filteredBarang.map((barang) => {
                          const isSelected = selectedBarang?.kodeBarang === barang.kodeBarang;
                          return (
                            <button
                              key={barang.kodeBarang}
                              type="button"
                              onClick={() => {
                                handleSelectBarang(barang);
                                setIsDropdownOpen(false);
                              }}
                              className={`w-full text-left p-2.5 rounded-lg border text-xs transition flex flex-col gap-1 ${
                                isSelected
                                  ? 'border-indigo-600 bg-indigo-50/40'
                                  : 'border-transparent bg-white hover:bg-slate-50'
                              }`}
                            >
                              <div className="flex justify-between items-center w-full">
                                <span className="font-mono font-bold text-slate-900">
                                  {barang.kodeBarang}
                                </span>
                                <span className="rounded px-1.5 py-0.5 font-bold text-[10px] bg-slate-100 text-slate-700">
                                  Stok: {barang.stokAkhirQty} {barang.satuan}
                                </span>
                              </div>
                              <div className="font-medium text-slate-700 line-clamp-1">{barang.namaBarang}</div>
                            </button>
                          );
                        })
                      )}
                    </div>
                  </div>
                )}
              </div>

              {selectedBarang && (
                <>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 mb-1">
                        Jumlah Permintaan (Qty)
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          value={qty === 0 ? '' : qty}
                          onChange={(e) => {
                            const val = parseFloat(e.target.value) || 0;
                            setQty(Math.max(0, val));
                          }}
                          required
                          min={0.01}
                          step="any"
                          className="w-full rounded-lg border border-slate-200 pl-3 pr-12 py-1.5 text-xs font-bold text-slate-900 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition"
                        />
                        <span className="absolute right-3 top-1.5 text-xs font-medium text-slate-400">
                          {selectedBarang.satuan}
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-col justify-end text-right text-xs">
                      <span className="text-slate-400 font-bold block mb-1">Estimasi Stok Akhir:</span>
                      <span className="font-black text-slate-900 text-sm">
                        {selectedBarang.stokAkhirQty} {selectedBarang.satuan}
                      </span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1">
                      Keterangan Penggunaan
                    </label>
                    <textarea
                      value={keterangan}
                      onChange={(e) => setKeterangan(e.target.value)}
                      placeholder="Tuliskan alasan permintaan barang ini..."
                      rows={3}
                      className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition resize-none"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full rounded-lg bg-indigo-600 py-3 text-xs font-bold text-white hover:bg-indigo-700 shadow-sm transition flex items-center justify-center gap-2 cursor-pointer mt-4"
                  >
                    Kirim Pengajuan SPB
                  </button>
                </>
              )}
            </form>
          </div>
        </div>

        {/* History List Panel */}
        <div className="lg:col-span-7 space-y-4">
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs flex flex-col min-h-[550px] h-full">
            <div className="border-b border-slate-100 pb-3 mb-4 flex justify-between items-center">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <ClipboardList className="h-4.5 w-4.5 text-indigo-600" />
                <span>Histori Pengajuan SPB</span>
              </h3>
              <span className="text-[10px] bg-slate-100 text-slate-600 font-bold px-2 py-0.5 rounded-full">
                Sheet: SPB
              </span>
            </div>

            {/* Filter controls */}
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 space-y-3 mb-4">
              <div className="grid gap-3 sm:grid-cols-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Mulai Tanggal
                  </label>
                  <input
                    type="date"
                    value={historyStartDate}
                    onChange={(e) => setHistoryStartDate(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs text-slate-700"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Hingga Tanggal
                  </label>
                  <input
                    type="date"
                    value={historyEndDate}
                    onChange={(e) => setHistoryEndDate(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs text-slate-700"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Status
                  </label>
                  <select
                    value={historyStatusFilter}
                    onChange={(e: any) => setHistoryStatusFilter(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs text-slate-700"
                  >
                    <option value="All">Semua Status</option>
                    <option value="Pending">Pending</option>
                    <option value="Disetujui">Disetujui</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Cari No SPB / Peminta
                  </label>
                  <div className="relative">
                    <Search className="absolute left-2 top-1.5 h-3.5 w-3.5 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Kata kunci..."
                      value={historySearchQuery}
                      onChange={(e) => setHistorySearchQuery(e.target.value)}
                      className="w-full rounded-lg border border-slate-200 bg-white pl-7 pr-2 py-1 text-xs text-slate-700"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Table */}
            <div className="flex-1 overflow-x-auto">
              {filteredSpbs.length === 0 ? (
                <div className="text-center py-20 text-slate-400 text-xs">
                  Tidak ada data permintaan barang (SPB) yang sesuai.
                </div>
              ) : (
                <table className="w-full text-left text-xs text-slate-600">
                  <thead className="bg-slate-50 text-[10px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-100">
                    <tr>
                      <th className="p-3">Tanggal / SPB</th>
                      <th className="p-3">Peminta / Dept</th>
                      <th className="p-3">Barang Permintaan</th>
                      <th className="p-3 text-center">Qty</th>
                      <th className="p-3 text-center">Status</th>
                      <th className="p-3 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {filteredSpbs.map((item) => (
                      <tr key={item.no + '-' + item.noSPB} className="hover:bg-slate-50 transition-colors">
                        <td className="p-3 whitespace-nowrap">
                          <span className="font-semibold text-slate-800 block">{item.tanggal}</span>
                          <span className="font-mono font-bold text-[10px] text-indigo-600 bg-indigo-50 px-1 rounded block mt-0.5 w-max">
                            {item.noSPB}
                          </span>
                        </td>
                        <td className="p-3 whitespace-nowrap">
                          <span className="font-semibold text-slate-800 block">{item.namaPeminta}</span>
                          <span className="text-[9px] text-slate-400 font-bold block uppercase mt-0.5">
                            DEPT: {item.departemen}
                          </span>
                        </td>
                        <td className="p-3">
                          <span className="font-semibold text-slate-800 block truncate max-w-[150px]">
                            {item.namaBarang}
                          </span>
                          <span className="text-[9px] text-slate-400 font-mono block mt-0.5">
                            Kode: {item.kodeBarang}
                          </span>
                        </td>
                        <td className="p-3 text-center whitespace-nowrap font-bold text-slate-800">
                          {item.qty}
                        </td>
                        <td className="p-3 text-center whitespace-nowrap">
                          {item.status === 'Disetujui' ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              <Check className="h-2.5 w-2.5" />
                              <span>Disetujui</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold bg-amber-50 text-amber-700 border border-amber-200 animate-pulse">
                              <Clock className="h-2.5 w-2.5" />
                              <span>Pending</span>
                            </span>
                          )}
                        </td>
                        <td className="p-3 text-right whitespace-nowrap">
                          <button
                            type="button"
                            onClick={() => setActivePrintSpb(item)}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-[10px] font-bold text-slate-600 hover:text-indigo-600 hover:border-indigo-200 hover:bg-indigo-50 transition cursor-pointer"
                          >
                            <Printer className="h-3 w-3" />
                            <span>Cetak</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      {showConfirmModal && selectedBarang && (
        <div className="fixed inset-0 z-55 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-2xl border border-slate-200">
            <h4 className="text-base font-bold text-slate-900">Konfirmasi Pengajuan SPB</h4>
            <p className="text-xs text-slate-600 mt-1">
              Apakah Anda yakin ingin mengajukan Surat Permintaan Barang (SPB) ini?
            </p>

            <div className="rounded-lg bg-slate-50 p-4 border border-slate-200 text-xs space-y-2 font-mono my-4 text-slate-700">
              <div className="flex justify-between border-b pb-1">
                <span>NO SPB:</span>
                <span className="font-bold text-slate-900">{noSPB}</span>
              </div>
              <div className="flex justify-between border-b pb-1">
                <span>PEMINTA:</span>
                <span className="font-bold text-slate-900">{namaPeminta} ({departemen})</span>
              </div>
              <div className="flex justify-between border-b pb-1">
                <span>BARANG:</span>
                <span className="font-bold text-slate-900 truncate max-w-[200px]">{selectedBarang.namaBarang}</span>
              </div>
              <div className="flex justify-between border-b pb-1">
                <span>JUMLAH:</span>
                <span className="font-bold text-indigo-700">{qty} {selectedBarang.satuan}</span>
              </div>
            </div>

            <div className="flex gap-3 justify-end">
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={submitting}
                className="rounded-lg bg-indigo-600 px-4 py-2 text-xs font-bold text-white hover:bg-indigo-700 shadow-sm transition cursor-pointer"
              >
                {submitting ? 'Menyimpan...' : 'Kirim Pengajuan'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
