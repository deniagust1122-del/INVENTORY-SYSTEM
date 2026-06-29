import React, { useState, useEffect, useRef } from 'react';
import { fetchMasterBarangItems, fetchPengeluaranItems, appendPengeluaranRow, MasterBarangItem, PengeluaranItem, fetchSPBItems, updateSPBStatus, SPBItem } from '../sheets-api';
import { 
  FileSpreadsheet, 
  Loader2, 
  Search, 
  AlertCircle, 
  CheckCircle2, 
  ShieldAlert, 
  ArrowRight,
  ChevronDown,
  Calendar,
  Filter,
  RefreshCw,
  X,
  TrendingDown
} from 'lucide-react';

interface PengeluaranFormProps {
  token: string;
}

export default function PengeluaranForm({ token }: PengeluaranFormProps) {
  const [barangList, setBarangList] = useState<MasterBarangItem[]>([]);
  const [pengeluaranList, setPengeluaranList] = useState<PengeluaranItem[]>([]);
  const [pendingSpbs, setPendingSpbs] = useState<SPBItem[]>([]);
  const [selectedSpb, setSelectedSpb] = useState<SPBItem | null>(null);
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
  const [noSKB, setNoSKB] = useState('');
  const [qtyPengeluaran, setQtyPengeluaran] = useState<number>(0);
  const [hargaSatuan, setHargaSatuan] = useState<number>(0);
  const [kodePakai, setKodePakai] = useState('PROD-01');
  const [costCenter, setCostCenter] = useState('GUDANG UTAMA');
  const [coa, setCoa] = useState('11510-Persediaan');
  const [keterangan, setKeterangan] = useState('');

  // History Filter Fields
  const [historyStartDate, setHistoryStartDate] = useState('');
  const [historyEndDate, setHistoryEndDate] = useState('');
  const [historySearchQuery, setHistorySearchQuery] = useState('');

  // Confirmation Modal
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  // Ref for Dropdown Click Outside
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Load data
  const loadData = async (isSilent = false) => {
    try {
      if (!isSilent) setLoading(true);
      else setRefreshing(true);
      setError(null);

      const [barang, pengeluarans, spbItems] = await Promise.all([
        fetchMasterBarangItems(token),
        fetchPengeluaranItems(token),
        fetchSPBItems(token).catch(err => {
          console.warn('SPB sheet might not exist yet, defaulting to empty list.', err);
          return [];
        })
      ]);

      setBarangList(barang);
      setPengeluaranList([...pengeluarans].reverse());
      
      const pending = spbItems.filter(item => item.status === 'Pending');
      setPendingSpbs(pending);

      // Generate dynamic SKB if empty
      if (!noSKB) {
        const dateStr = new Date().toISOString().split('T')[0].replace(/-/g, '');
        const randomNum = Math.floor(1000 + Math.random() * 9000);
        setNoSKB(`SKB-${dateStr}-${randomNum}`);
      }
    } catch (err: any) {
      console.error(err);
      setError('Gagal memuat data pengeluaran dari Google Sheets.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
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

  // Filter Barang
  const filteredBarang = barangList.filter(b => {
    const q = searchQuery.toLowerCase();
    return (
      b.kodeBarang.toLowerCase().includes(q) ||
      b.namaBarang.toLowerCase().includes(q)
    );
  });

  const handleSelectBarang = (barang: MasterBarangItem) => {
    setSelectedBarang(barang);
    setQtyPengeluaran(1);
    setHargaSatuan(barang.stokAkhirHarga || barang.stokAwalHarga || 0);
  };

  const totalValue = qtyPengeluaran * hargaSatuan;

  // Validation
  const validateForm = (): string | null => {
    if (!selectedBarang) return 'Silakan pilih barang terlebih dahulu.';
    if (!noSKB.trim()) return 'Nomor SKB tidak boleh kosong.';
    if (qtyPengeluaran <= 0) return 'Jumlah pengeluaran harus lebih besar dari 0.';
    if (qtyPengeluaran > selectedBarang.stokAkhirQty) {
      return `Jumlah pengeluaran (${qtyPengeluaran}) melebihi stok yang tersedia (${selectedBarang.stokAkhirQty} ${selectedBarang.satuan}).`;
    }
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

      await appendPengeluaranRow(
        {
          tanggal,
          noSKB,
          kodeBarang: selectedBarang.kodeBarang,
          namaBarang: selectedBarang.namaBarang,
          satuan: selectedBarang.satuan,
          qty: qtyPengeluaran,
          hargaSatuan,
          total: totalValue,
          kodePakai,
          costCenter,
          coa,
          keterangan: keterangan || `Pengeluaran SKB No. ${noSKB}`
        },
        token
      );

      // If there was an associated SPB, update its status to Approved (Disetujui)
      if (selectedSpb) {
        try {
          await updateSPBStatus(selectedSpb.noSPB, 'Disetujui', token);
        } catch (err) {
          console.error('Failed to update SPB status in real-time:', err);
        }
        setSelectedSpb(null);
      }

      // Clean inputs and regenerate SKB
      const dateStr = new Date().toISOString().split('T')[0].replace(/-/g, '');
      const randomNum = Math.floor(1000 + Math.random() * 9000);
      setNoSKB(`SKB-${dateStr}-${randomNum}`);
      setSelectedBarang(null);
      setQtyPengeluaran(0);
      setKeterangan('');

      await loadData(true);
      alert('Data pengeluaran barang (SKB) berhasil disimpan!');
    } catch (err: any) {
      console.error(err);
      alert(`Gagal menyimpan data pengeluaran: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  // Filter history
  const filteredPengeluarans = pengeluaranList.filter(item => {
    if (historyStartDate && item.tanggal < historyStartDate) return false;
    if (historyEndDate && item.tanggal > historyEndDate) return false;

    if (historySearchQuery) {
      const q = historySearchQuery.toLowerCase();
      return (
        item.noSKB.toLowerCase().includes(q) ||
        item.namaBarang.toLowerCase().includes(q) ||
        item.kodeBarang.toLowerCase().includes(q)
      );
    }
    return true;
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
        <Loader2 className="h-8 w-8 animate-spin text-rose-600" />
        <p className="text-sm font-medium text-slate-500">Menghubungkan ke Google Sheets API...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-rose-200 bg-rose-50 p-6 text-center text-rose-800">
        <AlertCircle className="mx-auto h-12 w-12 text-rose-500 mb-4" />
        <h4 className="font-bold text-lg">Gagal Memuat Data</h4>
        <p className="text-sm text-rose-600 mt-1 mb-4">{error}</p>
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
            Administrasi Pengeluaran Barang (SKB)
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Lakukan input transaksi pengeluaran stok (SKB) langsung ke sheet PENGELUARAN.
          </p>
        </div>
        <button
          type="button"
          onClick={() => loadData(true)}
          disabled={refreshing}
          className="inline-flex items-center gap-2 bg-rose-50 text-rose-700 hover:bg-rose-100 px-4 py-2 rounded-lg text-xs font-bold transition disabled:opacity-60 cursor-pointer"
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
              <TrendingDown className="h-4.5 w-4.5 text-rose-600" />
              <span>Input Pengeluaran SKB</span>
            </h3>

            {/* Opsi Tarik dari SPB */}
            <div className="space-y-1 bg-slate-50 p-3 rounded-lg border border-slate-100">
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                Tarik Data dari SPB (Opsional)
              </label>
              <select
                value={selectedSpb ? selectedSpb.noSPB : ''}
                onChange={(e) => {
                  const val = e.target.value;
                  if (!val) {
                    setSelectedSpb(null);
                    setSelectedBarang(null);
                    setQtyPengeluaran(0);
                    setKeterangan('');
                  } else {
                    const spb = pendingSpbs.find(s => s.noSPB === val);
                    if (spb) {
                      setSelectedSpb(spb);
                      const matchedBarang = barangList.find(b => b.kodeBarang === spb.kodeBarang);
                      if (matchedBarang) {
                        setSelectedBarang(matchedBarang);
                        setQtyPengeluaran(spb.qty);
                        setHargaSatuan(matchedBarang.stokAkhirHarga || matchedBarang.stokAwalHarga || 0);
                        setKeterangan(`Pengeluaran barang untuk SPB No. ${spb.noSPB} oleh ${spb.namaPeminta} (${spb.departemen}) - Keterangan: ${spb.keterangan}`);
                      } else {
                        alert(`Barang dengan kode ${spb.kodeBarang} tidak ditemukan di Master Barang.`);
                      }
                    }
                  }
                }}
                className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold focus:border-rose-500 focus:ring-1 focus:ring-rose-500 outline-none transition"
              >
                <option value="">-- Pilih SPB Pending --</option>
                {pendingSpbs.map(spb => (
                  <option key={spb.noSPB} value={spb.noSPB}>
                    {spb.noSPB} - {spb.namaPeminta} ({spb.namaBarang} x{spb.qty})
                  </option>
                ))}
              </select>
              {selectedSpb && (
                <div className="bg-rose-50 border border-rose-100 rounded-lg p-2 text-[10px] text-rose-800 font-bold flex items-center justify-between mt-1.5">
                  <span>Terhubung dengan SPB: <strong className="font-mono">{selectedSpb.noSPB}</strong></span>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedSpb(null);
                      setSelectedBarang(null);
                      setQtyPengeluaran(0);
                      setKeterangan('');
                    }}
                    className="text-rose-600 hover:text-rose-900 font-black cursor-pointer"
                  >
                    Batal
                  </button>
                </div>
              )}
            </div>

            {/* Custom Dropdown Search for Master Barang */}
            <div className="relative" ref={dropdownRef}>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                Pilih Barang dari Master Gudang
              </label>
              <button
                type="button"
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="w-full text-left rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-medium text-slate-800 hover:border-slate-300 focus:border-rose-500 focus:ring-1 focus:ring-rose-500 outline-none transition flex items-center justify-between shadow-xs"
              >
                {selectedBarang ? (
                  <div className="truncate pr-4">
                    <span className="font-mono font-bold text-rose-700 bg-rose-50 px-1.5 py-0.5 rounded text-[11px] mr-2">
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
                      className="w-full rounded-lg border border-slate-200 pl-9 pr-4 py-2 text-sm focus:border-rose-500 focus:ring-1 focus:ring-rose-500 outline-none transition"
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
                                ? 'border-rose-600 bg-rose-50/40'
                                : 'border-transparent bg-white hover:bg-slate-50'
                            }`}
                          >
                            <div className="flex justify-between items-center w-full">
                              <span className="font-mono font-bold text-slate-900">
                                {barang.kodeBarang}
                              </span>
                              <span className={`rounded px-1.5 py-0.5 font-bold text-[10px] ${
                                barang.stokAkhirQty > 5 ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                              }`}>
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

            {selectedBarang ? (
              <form onSubmit={handleOpenConfirm} className="space-y-4">
                
                {/* Active stock warning */}
                <div className="rounded-lg bg-rose-50/20 p-3 border border-rose-100/40 space-y-1 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-400 font-semibold">Tersedia di Gudang:</span>
                    <span className="font-bold text-rose-700">{selectedBarang.stokAkhirQty} {selectedBarang.satuan}</span>
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1">
                      Tanggal Pengeluaran
                    </label>
                    <input
                      type="date"
                      value={tanggal}
                      onChange={(e) => setTanggal(e.target.value)}
                      required
                      className="w-full rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium focus:border-rose-500 focus:ring-1 focus:ring-rose-500 outline-none transition"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1">
                      No SKB (Otomatis)
                    </label>
                    <input
                      type="text"
                      value={noSKB}
                      onChange={(e) => setNoSKB(e.target.value)}
                      required
                      className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-mono font-bold focus:border-rose-500 focus:ring-1 focus:ring-rose-500 outline-none transition"
                    />
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1">
                      Jumlah Keluar
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        value={qtyPengeluaran === 0 ? '' : qtyPengeluaran}
                        onChange={(e) => {
                          const val = parseFloat(e.target.value) || 0;
                          setQtyPengeluaran(Math.max(0, val));
                        }}
                        required
                        min={0.01}
                        step="any"
                        className="w-full rounded-lg border border-slate-200 pl-3 pr-12 py-1.5 text-xs font-bold text-slate-900 focus:border-rose-500 focus:ring-1 focus:ring-rose-500 outline-none transition"
                      />
                      <span className="absolute right-3 top-1.5 text-xs font-medium text-slate-400">
                        {selectedBarang.satuan}
                      </span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1">
                      Harga Satuan (Mutasi)
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1.5 text-xs font-medium text-slate-400">Rp</span>
                      <input
                        type="number"
                        value={hargaSatuan === 0 ? '' : hargaSatuan}
                        onChange={(e) => {
                          const val = parseFloat(e.target.value) || 0;
                          setHargaSatuan(Math.max(0, val));
                        }}
                        required
                        className="w-full rounded-lg border border-slate-200 pl-8 pr-3 py-1.5 text-xs font-mono font-bold text-slate-900 focus:border-rose-500 focus:ring-1 focus:ring-rose-500 outline-none transition"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1">
                      Kode Pakai
                    </label>
                    <input
                      type="text"
                      value={kodePakai}
                      onChange={(e) => setKodePakai(e.target.value)}
                      className="w-full rounded-lg border border-slate-200 px-2 py-1.5 text-xs focus:border-rose-500 focus:ring-1 focus:ring-rose-500 outline-none transition"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1">
                      Cost Center
                    </label>
                    <input
                      type="text"
                      value={costCenter}
                      onChange={(e) => setCostCenter(e.target.value)}
                      className="w-full rounded-lg border border-slate-200 px-2 py-1.5 text-xs focus:border-rose-500 focus:ring-1 focus:ring-rose-500 outline-none transition"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1">
                      COA Account
                    </label>
                    <input
                      type="text"
                      value={coa}
                      onChange={(e) => setCoa(e.target.value)}
                      className="w-full rounded-lg border border-slate-200 px-2 py-1.5 text-xs focus:border-rose-500 focus:ring-1 focus:ring-rose-500 outline-none transition"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">
                    Keterangan Tujuan / Penggunaan
                  </label>
                  <textarea
                    value={keterangan}
                    onChange={(e) => setKeterangan(e.target.value)}
                    placeholder="Masukkan tujuan pemakaian barang..."
                    rows={2}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-800 focus:border-rose-500 focus:ring-1 focus:ring-rose-500 outline-none transition resize-none"
                  />
                </div>

                <div className="bg-rose-600 text-white p-3.5 rounded-lg flex items-center justify-between shadow-xs">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-rose-100">ESTIMASI NILAI KELUAR</span>
                  <span className="text-base font-black font-mono">
                    {formatRupiah(totalValue)}
                  </span>
                </div>

                <button
                  type="submit"
                  className="w-full rounded-lg bg-rose-600 py-3 text-xs font-bold text-white hover:bg-rose-700 shadow-sm transition flex items-center justify-center gap-2 cursor-pointer"
                >
                  Simpan Transaksi Pengeluaran
                </button>
              </form>
            ) : (
              <div className="flex h-80 flex-col items-center justify-center text-center p-6 border-2 border-dashed border-slate-200 rounded-xl bg-slate-50/50">
                <TrendingDown className="h-10 w-10 text-slate-300 mb-3" />
                <h4 className="font-bold text-slate-700 text-xs uppercase">Belum Ada Barang Terpilih</h4>
                <p className="text-[11px] text-slate-400 mt-1 max-w-xs leading-relaxed">
                  Silakan gunakan dropdown pencarian di atas untuk memilih barang dari Master Gudang yang ingin ditarik keluar.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* History List Panel */}
        <div className="lg:col-span-7 space-y-4">
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs flex flex-col min-h-[550px] h-full">
            <div className="border-b border-slate-100 pb-3 mb-4 flex justify-between items-center">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <FileSpreadsheet className="h-4.5 w-4.5 text-rose-600" />
                <span>Histori Pengeluaran (SKB)</span>
              </h3>
              <span className="text-[10px] bg-slate-100 text-slate-600 font-bold px-2 py-0.5 rounded-full">
                Sheet: PENGELUARAN
              </span>
            </div>

            {/* Filter */}
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 space-y-3 mb-4">
              <div className="grid gap-3 sm:grid-cols-3">
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
                    Cari No SKB / Barang
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
              {filteredPengeluarans.length === 0 ? (
                <div className="text-center py-20 text-slate-400 text-xs">
                  Tidak ada rekam pengeluaran yang sesuai.
                </div>
              ) : (
                <table className="w-full text-left text-xs text-slate-600">
                  <thead className="bg-slate-50 text-[10px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-100">
                    <tr>
                      <th className="p-3">Tanggal / SKB</th>
                      <th className="p-3">Barang & Detail</th>
                      <th className="p-3 text-center">Qty</th>
                      <th className="p-3 text-right">Harga Satuan</th>
                      <th className="p-3 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {filteredPengeluarans.slice(0, 50).map((item) => (
                      <tr key={item.no + '-' + item.noSKB} className="hover:bg-slate-50 transition-colors">
                        <td className="p-3 whitespace-nowrap">
                          <span className="font-semibold text-slate-800 block">{item.tanggal}</span>
                          <span className="font-mono font-bold text-[10px] text-rose-600 bg-rose-50 px-1 rounded block mt-0.5 w-max">
                            {item.noSKB}
                          </span>
                        </td>
                        <td className="p-3">
                          <span className="font-semibold text-slate-800 block truncate max-w-[160px]">
                            {item.namaBarang}
                          </span>
                          <span className="text-[9px] text-slate-400 font-mono block mt-0.5">
                            CC: {item.costCenter} | COA: {item.coa} | Pakai: {item.kodePakai}
                          </span>
                        </td>
                        <td className="p-3 text-center whitespace-nowrap font-bold text-slate-800">
                          {item.qty} {item.satuan}
                        </td>
                        <td className="p-3 text-right font-mono text-slate-600">
                          {formatRupiah(item.hargaSatuan)}
                        </td>
                        <td className="p-3 text-right font-mono font-bold text-rose-600 bg-rose-50/10">
                          {formatRupiah(item.total)}
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
            <h4 className="text-base font-bold text-slate-900">Konfirmasi Pengeluaran</h4>
            <p className="text-xs text-slate-600 mt-1">
              Apakah Anda yakin ingin mengeluarkan barang ini dari Gudang PT. KI?
            </p>

            <div className="rounded-lg bg-slate-50 p-4 border border-slate-200 text-xs space-y-2 font-mono my-4 text-slate-700">
              <div className="flex justify-between border-b pb-1">
                <span>NO SKB:</span>
                <span className="font-bold text-slate-900">{noSKB}</span>
              </div>
              <div className="flex justify-between border-b pb-1">
                <span>BARANG:</span>
                <span className="font-bold text-slate-900 truncate max-w-[200px]">{selectedBarang.namaBarang}</span>
              </div>
              <div className="flex justify-between border-b pb-1">
                <span>QTY KELUAR:</span>
                <span className="font-bold text-rose-700">{qtyPengeluaran} {selectedBarang.satuan}</span>
              </div>
              <div className="flex justify-between border-b pb-1">
                <span>ESTIMASI TOTAL:</span>
                <span className="font-bold text-slate-900">{formatRupiah(totalValue)}</span>
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
                className="rounded-lg bg-rose-600 px-4 py-2 text-xs font-bold text-white hover:bg-rose-700 shadow-sm transition cursor-pointer"
              >
                {submitting ? 'Menyimpan...' : 'Ya, Kirim Barang'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
