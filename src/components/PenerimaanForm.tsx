import React, { useState, useEffect, useRef } from 'react';
import { fetchPOItems, fetchPenerimaanItems, appendPenerimaanRow, POItem, PenerimaanItem } from '../sheets-api';
import { 
  ClipboardList, 
  Loader2, 
  Search, 
  AlertCircle, 
  CheckCircle2, 
  UserCheck, 
  ShieldAlert, 
  ArrowRight,
  ChevronDown,
  Calendar,
  Filter,
  RefreshCw,
  Printer,
  QrCode,
  X,
  FileSpreadsheet
} from 'lucide-react';

interface PenerimaanFormProps {
  token: string;
  appUrl: string;
  onSuccess: (data: {
    noLPB: string;
    noPO: string;
    kodeBarang: string;
    namaBarang: string;
    qty: number;
    satuan: string;
    hargaSatuan: number;
    total: number;
    supplier: string;
    tanggal: string;
    diskon?: number;
    ppn?: number;
    verification?: string;
    petugas?: string;
    printMode?: 'all' | 'lpb' | 'barcode';
  }) => void;
}

export default function PenerimaanForm({ token, appUrl, onSuccess }: PenerimaanFormProps) {
  const [poList, setPoList] = useState<POItem[]>([]);
  const [penerimaanList, setPenerimaanList] = useState<PenerimaanItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Search & Dynamic Dropdown PO state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPo, setSelectedPo] = useState<POItem | null>(null);
  const [showAllPos, setShowAllPos] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // Form Fields
  const [tanggal, setTanggal] = useState(new Date().toISOString().split('T')[0]);
  const [noLPB, setNoLPB] = useState('');
  const [qtyPenerimaan, setQtyPenerimaan] = useState<number>(0);
  const [hargaSatuan, setHargaSatuan] = useState<number>(0);
  const [diskon, setDiskon] = useState<number>(0);
  const [ppn, setPpn] = useState<number>(0); // Defaults to 0 absolute nominal, but editable
  const [petugas, setPetugas] = useState(''); // Default empty operator name as requested
  const [keterangan, setKeterangan] = useState('');
  const [kategori, setKategori] = useState('');

  // History Filter Fields
  const [historyStartDate, setHistoryStartDate] = useState('');
  const [historyEndDate, setHistoryEndDate] = useState('');
  const [historySearchQuery, setHistorySearchQuery] = useState('');

  // Confirmation Modal
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  // Ref for Dropdown Click Outside
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Load PO items & Penerimaan history on mount or manual sync
  const loadData = async (isSilent = false) => {
    try {
      if (!isSilent) setLoading(true);
      else setRefreshing(true);
      setError(null);

      const [pos, penerimaans] = await Promise.all([
        fetchPOItems(token),
        fetchPenerimaanItems(token)
      ]);

      // Sort PO by row index descending to show newest POs first
      const sortedPOs = [...pos].sort((a, b) => b.rowIndex - a.rowIndex);
      setPoList(sortedPOs);

      // Sort Penerimaan list to show newest first
      const sortedPenerimaans = [...penerimaans].reverse();
      setPenerimaanList(sortedPenerimaans);

      // Generate dynamic LPB if empty
      if (!noLPB) {
        const dateStr = new Date().toISOString().split('T')[0].replace(/-/g, '');
        const randomNum = Math.floor(1000 + Math.random() * 9000);
        setNoLPB(`LPB-${dateStr}-${randomNum}`);
      }
    } catch (err: any) {
      console.error(err);
      setError('Gagal memuat data dari Google Sheets. Pastikan spreadsheet Anda memiliki format kolom yang tepat.');
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

  // Filter PO based on search query
  const filteredPOs = poList.filter(po => {
    const q = searchQuery.toLowerCase();
    return (
      po.noPO.toLowerCase().includes(q) ||
      po.namaBarang.toLowerCase().includes(q) ||
      po.supplier.toLowerCase().includes(q) ||
      po.kodeBarang.toLowerCase().includes(q)
    );
  });

  // Latest 50 POs vs All POs
  const visiblePOs = showAllPos ? filteredPOs : filteredPOs.slice(0, 50);

  // Handle selection of a PO from our custom dropdown
  const handleSelectPo = (po: POItem) => {
    setSelectedPo(po);
    setQtyPenerimaan(po.qty); // Default to full remaining Qty
    setHargaSatuan(po.hargaSatuan); // Prepopulate with original price

    // Handle initial relational logic for Diskon & PPN if available in PO database, or fallback
    setDiskon(po.diskon !== undefined ? po.diskon : 0);
    setPpn(po.ppn !== undefined ? po.ppn : 0);
    
    // Auto category based on name
    if (po.namaBarang.toLowerCase().includes('teh') || po.namaBarang.toLowerCase().includes('water') || po.namaBarang.toLowerCase().includes('cola')) {
      setKategori('BB - Minuman');
    } else if (po.namaBarang.toLowerCase().includes('daging') || po.namaBarang.toLowerCase().includes('fillet')) {
      setKategori('BB - Daging');
    } else {
      setKategori('Gudang - Umum');
    }
  };

  // Real-time calculations: Total Netto = (Harga Satuan x Jumlah) - Diskon + PPN
  const totalGross = qtyPenerimaan * hargaSatuan;
  const diskonAmount = Math.abs(diskon);
  const ppnAmount = Math.abs(ppn);
  const totalValue = totalGross - diskonAmount + ppnAmount;
  const totalPerUnit = qtyPenerimaan > 0 ? (totalValue / qtyPenerimaan) : 0;

  // Form Validation
  const validateForm = (): string | null => {
    if (!selectedPo) return 'Silakan pilih dokumen PO terlebih dahulu.';
    if (!noLPB.trim()) return 'Nomor LPB tidak boleh kosong.';
    if (!petugas.trim()) return 'Nama petugas penerima tidak boleh kosong.';
    
    // Strict non-negative numerical validations
    if (qtyPenerimaan <= 0) return 'Jumlah penerimaan harus lebih besar dari 0.';
    if (qtyPenerimaan > selectedPo.qty) {
      return `Jumlah penerimaan (${qtyPenerimaan}) melebihi kuantitas PO asli (${selectedPo.qty}). Harap sesuaikan.`;
    }
    if (hargaSatuan < 0) return 'Harga satuan tidak boleh bernilai negatif.';
    if (diskon < 0) return 'Diskon tidak boleh bernilai negatif.';
    if (diskon > totalGross) return 'Diskon tidak boleh melebihi subtotal kotor.';
    if (ppn < 0) return 'PPN tidak boleh bernilai negatif.';
    
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

  const handleSubmit = () => {
    if (!selectedPo) return;

    const dataToSave = {
      tanggal: tanggal,
      noLPB: noLPB,
      noPO: selectedPo.noPO,
      kodeBarang: selectedPo.kodeBarang,
      kodeSuplier: selectedPo.noPO.substring(0, 10), // Safe substring or generate short code
      supplier: selectedPo.supplier,
      namaBarang: selectedPo.namaBarang,
      satuan: selectedPo.satuan,
      qty: qtyPenerimaan,
      hargaSatuan: hargaSatuan,
      diskon: String(diskon),
      ppn: String(ppn),
      total: totalValue,
      totalBayar: totalValue,
      keterangan: keterangan || `Penerimaan LPB dari PO ${selectedPo.noPO}`,
      kategori: kategori,
      check: '✔',
      verification: '✔ Verified',
      shortCode: String(selectedPo.kodeBarang || '').slice(0, 4),
      petugas: petugas
    };

    // Close modal immediately (Optimistic Feedback)
    setShowConfirmModal(false);

    // Call onSuccess immediately to transition the screen to the Print receipt layout
    onSuccess({
      noLPB,
      noPO: selectedPo.noPO,
      kodeBarang: selectedPo.kodeBarang,
      namaBarang: selectedPo.namaBarang,
      qty: qtyPenerimaan,
      satuan: selectedPo.satuan,
      hargaSatuan: hargaSatuan,
      total: totalValue,
      supplier: selectedPo.supplier,
      tanggal: tanggal,
      diskon: diskon,
      ppn: ppn,
      verification: '✔ Verified',
      petugas: petugas,
      printMode: 'all'
    });

    console.log(`[OPTIMISTIC_UI] Dialihkan ke Cetak LPB secara instan. Menjalankan sinkronisasi Google Sheets untuk ${noLPB} di latar belakang...`);
    
    // Dispatch background sync event to App.tsx
    window.dispatchEvent(new CustomEvent('bg-sync-task', {
      detail: {
        id: noLPB,
        status: 'loading',
        message: `Menulis data LPB (${noLPB}) ke Google Sheets...`
      }
    }));

    let completed = false;

    // Timeout mechanism: trigger warning if write takes more than 5 seconds
    const timeoutTimer = setTimeout(() => {
      if (!completed) {
        console.warn(`[TIMEOUT_WARN] Penulisan data ${noLPB} telah berjalan lebih dari 5 detik.`);
        window.dispatchEvent(new CustomEvent('bg-sync-task', {
          detail: {
            id: noLPB,
            status: 'timeout',
            message: `Koneksi Google Sheets lambat. Proses penulisan ${noLPB} tetap dilanjutkan secara aman di latar belakang.`
          }
        }));
      }
    }, 5000);

    // Trigger asynchronous save request
    appendPenerimaanRow(dataToSave, token, appUrl)
      .then(async () => {
        completed = true;
        clearTimeout(timeoutTimer);
        console.log(`[OPTIMISTIC_UI] ✓ Data ${noLPB} sukses terkirim ke Google Sheets.`);
        
        // Dispatch success event
        window.dispatchEvent(new CustomEvent('bg-sync-task', {
          detail: {
            id: noLPB,
            status: 'success',
            message: `Penerimaan LPB (${noLPB}) berhasil disimpan ke Google Sheets.`
          }
        }));

        // Fetch/sync data silently in the background
        try {
          await loadData(true);
        } catch (syncErr) {
          console.warn('[OPTIMISTIC_UI] Silent reload failed, using cached state', syncErr);
        }
      })
      .catch((err: any) => {
        completed = true;
        clearTimeout(timeoutTimer);
        console.error(`[OPTIMISTIC_UI] ❌ Gagal menyimpan data LPB ${noLPB} di latar belakang:`, err);
        
        // Dispatch error event
        window.dispatchEvent(new CustomEvent('bg-sync-task', {
          detail: {
            id: noLPB,
            status: 'error',
            message: `Gagal menyimpan LPB (${noLPB}): ${err.message || 'Koneksi error'}`
          }
        }));
      });
  };

  // Helper to re-print older LPB receipts
  const handlePrintHistoryItem = (item: PenerimaanItem, printMode: 'all' | 'lpb' | 'barcode' = 'all') => {
    onSuccess({
      noLPB: item.noLPB,
      noPO: item.noPO,
      kodeBarang: item.kodeBarang,
      namaBarang: item.namaBarang,
      qty: item.qty,
      satuan: item.satuan,
      hargaSatuan: item.hargaSatuan,
      total: item.total,
      supplier: item.supplier,
      tanggal: item.tanggal,
      diskon: item.diskon || 0,
      ppn: item.ppn || 0,
      verification: item.verification,
      petugas: item.petugas,
      printMode: printMode
    });
  };

  // History filtering logic
  const filteredPenerimaans = penerimaanList.filter(item => {
    // Range Date picker filter
    if (historyStartDate && item.tanggal < historyStartDate) return false;
    if (historyEndDate && item.tanggal > historyEndDate) return false;

    // Search query matches
    if (historySearchQuery) {
      const q = historySearchQuery.toLowerCase();
      return (
        item.noLPB.toLowerCase().includes(q) ||
        item.noPO.toLowerCase().includes(q) ||
        item.namaBarang.toLowerCase().includes(q) ||
        item.supplier.toLowerCase().includes(q) ||
        item.kodeBarang.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const visiblePenerimaans = filteredPenerimaans.slice(0, 50);

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
        <p className="text-sm font-medium text-slate-500">Menghubungkan ke Google Sheets API...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center text-red-800">
        <AlertCircle className="mx-auto h-12 w-12 text-red-500 mb-4 animate-bounce" />
        <h4 className="font-bold text-lg">Gagal Memuat Data</h4>
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
      {/* Top Controls Header with Sync Button */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
        <div>
          <h2 className="text-base font-bold text-slate-800 uppercase tracking-wide">
            Administrasi Penerimaan PO
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Kelola LPB dengan penarikan data PO, otomasi finansial real-time, dan audit rekam transaksi.
          </p>
        </div>
        <button
          type="button"
          onClick={() => loadData(true)}
          disabled={refreshing}
          className="inline-flex items-center gap-2 bg-indigo-50 text-indigo-700 hover:bg-indigo-100/80 px-4 py-2 rounded-lg text-xs font-bold transition disabled:opacity-60 cursor-pointer"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? 'animate-spin' : ''}`} />
          <span>{refreshing ? 'Sinkronisasi...' : 'Sinkronkan Database'}</span>
        </button>
      </div>

      <div className="grid gap-8 lg:grid-cols-12 xl:grid-cols-12">
        
        {/* LEFT COLUMN: FORM PANEL (5/12 width) */}
        <div className="lg:col-span-5 xl:col-span-5 space-y-6">
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs space-y-6">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-3 flex items-center gap-2">
              <ClipboardList className="h-4.5 w-4.5 text-indigo-600" />
              <span>Input Penerimaan LPB</span>
            </h3>

            {/* Dynamic Searchable Combobox/Dropdown for PO */}
            <div className="relative" ref={dropdownRef} id="po-dropdown-container">
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                Pilih Dokumen Purchase Order (PO)
              </label>
              <button
                id="po-dropdown-trigger"
                type="button"
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="w-full text-left rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-medium text-slate-800 hover:border-slate-300 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition flex items-center justify-between shadow-xs"
              >
                {selectedPo ? (
                  <div className="truncate pr-4">
                    <span className="font-mono font-bold text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded text-[11px] mr-2">
                      {selectedPo.noPO}
                    </span>
                    <span className="text-slate-800 font-semibold">{selectedPo.namaBarang}</span>
                  </div>
                ) : (
                  <span className="text-slate-400">-- Pilih No. PO Baru --</span>
                )}
                <ChevronDown className={`h-4 w-4 text-slate-400 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {isDropdownOpen && (
                <div id="po-dropdown-content" className="absolute left-0 right-0 z-50 mt-1.5 rounded-xl border border-slate-200 bg-white p-3 shadow-xl max-h-96 flex flex-col animate-in fade-in slide-in-from-top-2 duration-150">
                  <div className="relative mb-2">
                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Cari No. PO, Supplier, Barang..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full rounded-lg border border-slate-200 pl-9 pr-4 py-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition"
                      autoFocus
                    />
                  </div>

                  <div className="flex items-center justify-between px-2 py-1.5 border-b border-slate-100 mb-2">
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                      Menampilkan {visiblePOs.length} dari {filteredPOs.length} PO
                    </span>
                    <label className="flex items-center gap-1.5 cursor-pointer text-xs font-semibold text-indigo-600 hover:text-indigo-800">
                      <input
                        type="checkbox"
                        checked={showAllPos}
                        onChange={(e) => setShowAllPos(e.target.checked)}
                        className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 h-3.5 w-3.5"
                      />
                      <span>Tampilkan Semua</span>
                    </label>
                  </div>

                  <div className="overflow-y-auto space-y-1 max-h-60 pr-1">
                    {visiblePOs.length === 0 ? (
                      <p className="text-xs text-center text-slate-400 py-6">Tidak ada dokumen PO yang sesuai.</p>
                    ) : (
                      visiblePOs.map((po) => {
                        const isSelected = selectedPo?.noPO === po.noPO && selectedPo?.kodeBarang === po.kodeBarang && selectedPo?.rowIndex === po.rowIndex;
                        return (
                          <button
                            key={`${po.noPO}-${po.kodeBarang}-${po.rowIndex}`}
                            type="button"
                            onClick={() => {
                              handleSelectPo(po);
                              setIsDropdownOpen(false);
                            }}
                            className={`w-full text-left p-2.5 rounded-lg border text-xs transition flex flex-col gap-1 ${
                              isSelected
                                ? 'border-indigo-600 bg-indigo-50/45'
                                : 'border-transparent bg-white hover:bg-slate-50'
                            }`}
                          >
                            <div className="flex justify-between items-center w-full">
                              <span className="font-mono font-bold text-slate-900 truncate" title={po.noPO}>
                                {po.noPO}
                              </span>
                              <span className="rounded bg-indigo-100 text-indigo-800 px-1.5 py-0.5 font-bold text-[10px]">
                                {po.qty} {po.satuan}
                              </span>
                            </div>
                            <div className="font-medium text-slate-700 line-clamp-1">{po.namaBarang}</div>
                            <div className="flex justify-between items-center text-[10px] text-slate-400 mt-1">
                              <span className="font-semibold text-slate-500">{po.supplier}</span>
                              <span className="font-mono text-[9px]">Baris {po.rowIndex}</span>
                            </div>
                          </button>
                        );
                      })
                    )}
                  </div>
                </div>
              )}
            </div>

            {selectedPo ? (
              <form onSubmit={handleOpenConfirm} className="space-y-5">
                
                {/* Active PO Micro details */}
                <div className="rounded-lg bg-indigo-50/20 p-3 border border-indigo-100/40 space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-400 font-semibold">Pemasok / Supplier:</span>
                    <span className="font-bold text-indigo-900">{selectedPo.supplier}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400 font-semibold">Kode & Nama Barang:</span>
                    <span className="font-bold text-slate-800 truncate max-w-[200px]" title={selectedPo.namaBarang}>
                      [{selectedPo.kodeBarang}] {selectedPo.namaBarang}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400 font-semibold">Kuantitas Asli PO:</span>
                    <span className="font-bold text-slate-800">{selectedPo.qty} {selectedPo.satuan}</span>
                  </div>
                </div>

                {/* Sub-Layout: Two columns inside the Form Panel */}
                <div className="grid gap-4 sm:grid-cols-2">
                  
                  {/* COLUMN 1: BASIC DATA */}
                  <div className="space-y-4">
                    <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest block border-b border-slate-100 pb-1">
                      1. Data Dasar
                    </span>

                    {/* Tanggal */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 mb-1">
                        Tanggal Penerimaan
                      </label>
                      <input
                        id="input-tanggal"
                        type="date"
                        value={tanggal}
                        onChange={(e) => setTanggal(e.target.value)}
                        required
                        className="w-full rounded-lg border border-slate-200 px-3.5 py-1.5 text-xs font-medium text-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition"
                      />
                    </div>

                    {/* Petugas */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 mb-1">
                        Nama Petugas Penerima
                      </label>
                      <input
                        id="input-petugas"
                        type="text"
                        value={petugas}
                        onChange={(e) => setPetugas(e.target.value)}
                        required
                        placeholder="Nama lengkap petugas..."
                        className="w-full rounded-lg border border-slate-200 px-3.5 py-1.5 text-xs font-medium text-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition"
                      />
                    </div>

                    {/* No LPB */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 mb-1">
                        No LPB (Otomatis)
                      </label>
                      <input
                        id="input-no-lpb"
                        type="text"
                        value={noLPB}
                        onChange={(e) => setNoLPB(e.target.value)}
                        required
                        className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3.5 py-1.5 text-xs font-mono font-bold text-slate-700 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition"
                      />
                    </div>

                    {/* Kategori */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 mb-1">
                        Kategori Laporan
                      </label>
                      <select
                        id="input-kategori"
                        value={kategori}
                        onChange={(e) => setKategori(e.target.value)}
                        className="w-full rounded-lg border border-slate-200 px-3.5 py-1.5 text-xs font-medium text-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition bg-white"
                      >
                        <option value="BB - Daging">BB - Daging</option>
                        <option value="BB - Minuman">BB - Minuman</option>
                        <option value="Gudang - ATK">Gudang - ATK</option>
                        <option value="Gudang - Umum">Gudang - Umum</option>
                      </select>
                    </div>
                  </div>

                  {/* COLUMN 2: FINANCIAL DETAILS */}
                  <div className="space-y-4">
                    <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest block border-b border-slate-100 pb-1">
                      2. Rincian Finansial
                    </span>

                    {/* Qty Penerimaan */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 mb-1 flex justify-between">
                        <span>Jumlah Diterima</span>
                        <span className="text-slate-400">Max: {selectedPo.qty}</span>
                      </label>
                      <div className="relative">
                        <input
                          id="input-qty"
                          type="number"
                          value={qtyPenerimaan === 0 ? '' : qtyPenerimaan}
                          onChange={(e) => {
                            const val = parseFloat(e.target.value) || 0;
                            setQtyPenerimaan(Math.max(0, val));
                          }}
                          required
                          min={0.01}
                          step="any"
                          className="w-full rounded-lg border border-slate-200 pl-3.5 pr-12 py-1.5 text-xs font-bold text-slate-900 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition"
                        />
                        <span className="absolute right-3 top-1.5 text-xs font-medium text-slate-400">
                          {selectedPo.satuan}
                        </span>
                      </div>
                    </div>

                    {/* Harga Satuan */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 mb-1">
                        Harga Satuan
                      </label>
                      <div className="relative">
                        <span className="absolute left-3 top-1.5 text-xs font-medium text-slate-400">Rp</span>
                        <input
                          id="input-harga"
                          type="number"
                          value={hargaSatuan === 0 ? '' : hargaSatuan}
                          onChange={(e) => {
                            const val = parseFloat(e.target.value) || 0;
                            setHargaSatuan(Math.max(0, val));
                          }}
                          required
                          min={0}
                          step="any"
                          className="w-full rounded-lg border border-slate-200 pl-8 pr-3.5 py-1.5 text-xs font-mono font-bold text-slate-900 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition"
                        />
                      </div>
                    </div>

                    {/* Diskon */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 mb-1">
                        Diskon (Rp)
                      </label>
                      <div className="relative">
                        <input
                          id="input-diskon"
                          type="number"
                          value={diskon === 0 ? '' : diskon}
                          onChange={(e) => {
                            const val = parseFloat(e.target.value) || 0;
                            setDiskon(Math.max(0, val));
                          }}
                          min={0}
                          step="any"
                          className="w-full rounded-lg border border-slate-200 pl-3.5 pr-8 py-1.5 text-xs font-bold text-slate-900 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition"
                          placeholder="0"
                        />
                        <span className="absolute right-3 top-1.5 text-xs font-medium text-slate-400">Rp</span>
                      </div>
                    </div>

                    {/* PPN */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 mb-1">
                        PPN (Rp)
                      </label>
                      <div className="relative">
                        <input
                          id="input-ppn"
                          type="number"
                          value={ppn === 0 ? '' : ppn}
                          onChange={(e) => {
                            const val = parseFloat(e.target.value) || 0;
                            setPpn(Math.max(0, val));
                          }}
                          min={0}
                          step="any"
                          className="w-full rounded-lg border border-slate-200 pl-3.5 pr-8 py-1.5 text-xs font-bold text-slate-900 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition"
                          placeholder="0"
                        />
                        <span className="absolute right-3 top-1.5 text-xs font-medium text-slate-400">Rp</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Keterangan */}
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">
                    Catatan Penerimaan / Keterangan Tambahan
                  </label>
                  <textarea
                    id="input-keterangan"
                    value={keterangan}
                    onChange={(e) => setKeterangan(e.target.value)}
                    placeholder="Masukkan catatan khusus jika ada..."
                    rows={2}
                    className="w-full rounded-lg border border-slate-200 px-3.5 py-2 text-xs text-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition resize-none"
                  />
                </div>

                {/* Dynamic Real-time Calculations Panel */}
                <div className="rounded-xl border border-indigo-100 bg-indigo-50/15 p-4 space-y-3 shadow-xs">
                  <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider block">
                    Kalkulasi Real-time Otomatis
                  </span>
                  
                  <div className="space-y-1.5 text-xs">
                    <div className="flex justify-between items-center text-slate-600">
                      <span>Subtotal Kotor:</span>
                      <span className="font-mono font-semibold text-slate-800">{formatRupiah(totalGross)}</span>
                    </div>
                    
                    <div className="flex justify-between items-center text-slate-600">
                      <span>Potongan Diskon:</span>
                      <span className="font-mono font-semibold text-red-600">-{formatRupiah(diskonAmount)}</span>
                    </div>
                    
                    <div className="flex justify-between items-center text-slate-600">
                      <span>PPN:</span>
                      <span className="font-mono font-semibold text-indigo-600">+{formatRupiah(ppnAmount)}</span>
                    </div>
                    
                    <div className="pt-2 border-t border-slate-200/60 flex justify-between items-center text-slate-700">
                      <span className="font-bold text-[11px]">Bersih / Unit:</span>
                      <span className="font-mono font-bold text-slate-900">{formatRupiah(totalPerUnit)}</span>
                    </div>
                  </div>

                  <div className="bg-indigo-600 text-white p-3 rounded-lg flex items-center justify-between shadow-xs mt-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-100">TOTAL AKHIR (NET)</span>
                    <span className="text-base font-black font-mono">
                      {formatRupiah(totalValue)}
                    </span>
                  </div>
                </div>

                {/* Submit button */}
                <button
                  type="submit"
                  className="w-full rounded-lg bg-indigo-600 py-3 text-xs font-bold text-white hover:bg-indigo-700 shadow-sm hover:shadow-md transition flex items-center justify-center gap-2 cursor-pointer"
                >
                  Simpan Penerimaan (LPB)
                </button>
              </form>
            ) : (
              <div className="flex h-96 flex-col items-center justify-center text-center p-6 border-2 border-dashed border-slate-200 rounded-xl bg-slate-50/50">
                <ClipboardList className="h-10 w-10 text-slate-300 mb-3" />
                <h4 className="font-bold text-slate-700 text-xs uppercase">Belum Ada PO Terpilih</h4>
                <p className="text-[11px] text-slate-400 mt-1 max-w-xs leading-relaxed">
                  Silakan gunakan dropdown combobox di atas untuk mencari dan memilih dokumen Purchase Order (PO) yang akan diproses.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: HISTORY TABLE PANEL (7/12 width) */}
        <div className="lg:col-span-7 xl:col-span-7 space-y-4">
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs flex flex-col min-h-[650px] h-full">
            
            {/* Panel Title */}
            <div className="border-b border-slate-100 pb-3 mb-4 flex justify-between items-center">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <FileSpreadsheet className="h-4.5 w-4.5 text-indigo-600" />
                <span>Histori Penerimaan (50 Terbaru)</span>
              </h3>
              <span className="text-[10px] bg-slate-100 text-slate-600 font-bold px-2 py-0.5 rounded-full">
                Database: PENERIMAAN
              </span>
            </div>

            {/* Range Date Picker & Text Search Filters */}
            <div className="bg-slate-50/80 p-3.5 rounded-xl border border-slate-100 space-y-3 mb-4" id="history-filter-panel">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Filter & Pencarian Laporan
              </span>
              
              <div className="grid gap-3 sm:grid-cols-3">
                {/* Date Start */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Mulai Tanggal
                  </label>
                  <div className="relative">
                    <input
                      id="history-filter-start"
                      type="date"
                      value={historyStartDate}
                      onChange={(e) => setHistoryStartDate(e.target.value)}
                      className="w-full rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs text-slate-700 outline-none focus:border-indigo-500 transition"
                    />
                  </div>
                </div>

                {/* Date End */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Hingga Tanggal
                  </label>
                  <div className="relative">
                    <input
                      id="history-filter-end"
                      type="date"
                      value={historyEndDate}
                      onChange={(e) => setHistoryEndDate(e.target.value)}
                      className="w-full rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs text-slate-700 outline-none focus:border-indigo-500 transition"
                    />
                  </div>
                </div>

                {/* Text Search */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Cari No LPB / PO / Barang
                  </label>
                  <div className="relative">
                    <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-slate-400" />
                    <input
                      id="history-filter-search"
                      type="text"
                      placeholder="Cari kata kunci..."
                      value={historySearchQuery}
                      onChange={(e) => setHistorySearchQuery(e.target.value)}
                      className="w-full rounded-lg border border-slate-200 bg-white pl-8 pr-2 py-1.5 text-xs text-slate-700 outline-none focus:border-indigo-500 transition"
                    />
                  </div>
                </div>
              </div>

              {/* Reset filter buttons */}
              {(historyStartDate || historyEndDate || historySearchQuery) && (
                <div className="flex justify-end pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setHistoryStartDate('');
                      setHistoryEndDate('');
                      setHistorySearchQuery('');
                    }}
                    className="inline-flex items-center gap-1 text-[10px] font-bold text-red-500 hover:text-red-700 transition"
                  >
                    <X className="h-3 w-3" />
                    <span>Hapus Semua Filter</span>
                  </button>
                </div>
              )}
            </div>

            {/* Scrollable History Table */}
            <div className="flex-1 overflow-x-auto min-h-[400px]">
              {visiblePenerimaans.length === 0 ? (
                <div className="flex flex-col items-center justify-center text-center py-20 bg-slate-50/30 rounded-lg border border-dashed border-slate-100">
                  <Filter className="h-8 w-8 text-slate-300 mb-2" />
                  <p className="text-xs text-slate-500 font-medium">Tidak ada rekam penerimaan yang cocok.</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">Silakan sesuaikan filter tanggal atau pencarian Anda.</p>
                </div>
              ) : (
                <div className="rounded-lg border border-slate-100 overflow-hidden shadow-xs">
                  <table className="w-full text-left text-xs text-slate-600" id="history-penerimaan-table">
                    <thead className="bg-slate-50 text-[10px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-100">
                      <tr>
                        <th className="p-3">Tanggal / LPB</th>
                        <th className="p-3">PO & Barang</th>
                        <th className="p-3 text-center">Qty / Satuan</th>
                        <th className="p-3 text-right">Harga Satuan</th>
                        <th className="p-3 text-right">Total Net</th>
                        <th className="p-3 text-center">Cetak</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white">
                      {visiblePenerimaans.map((item) => (
                        <tr key={item.no + '-' + item.noLPB} className="hover:bg-slate-50/80 transition-colors">
                          <td className="p-3 whitespace-nowrap">
                            <span className="font-semibold text-slate-800 block">{item.tanggal}</span>
                            <span className="font-mono font-bold text-[10px] text-indigo-600 bg-indigo-50/50 px-1 rounded block mt-0.5 w-max">
                              {item.noLPB}
                            </span>
                          </td>
                          <td className="p-3">
                            <span className="font-mono text-[10px] text-slate-400 block" title={String(item.noPO)}>
                              {String(item.noPO || '').slice(0, 15)}{String(item.noPO || '').length > 15 ? '...' : ''}
                            </span>
                            <span className="font-semibold text-slate-800 block truncate max-w-[160px]" title={item.namaBarang}>
                              {item.namaBarang}
                            </span>
                            <span className="text-[9px] text-slate-400 block mt-0.5 font-medium italic">
                              By: {item.keterangan?.includes('petugas') ? item.keterangan : (item.supplier || 'Pemasok')}
                            </span>
                          </td>
                          <td className="p-3 text-center whitespace-nowrap">
                            <span className="font-bold text-slate-800 block">{item.qty}</span>
                            <span className="text-[10px] text-slate-400 block">{item.satuan}</span>
                          </td>
                          <td className="p-3 text-right font-mono font-medium text-slate-700">
                            {formatRupiah(item.hargaSatuan)}
                          </td>
                          <td className="p-3 text-right font-mono font-bold text-emerald-600 bg-emerald-50/10">
                            {formatRupiah(item.total)}
                          </td>
                          <td className="p-3 text-center">
                            <div className="flex items-center justify-center gap-1">
                              <button
                                type="button"
                                onClick={() => handlePrintHistoryItem(item, 'lpb')}
                                className="text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 p-1.5 rounded transition cursor-pointer"
                                title="Cetak Dokumen LPB"
                              >
                                <Printer className="h-3.5 w-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handlePrintHistoryItem(item, 'barcode')}
                                className="text-sky-600 hover:text-sky-800 hover:bg-sky-50 p-1.5 rounded transition cursor-pointer"
                                title="Cetak Barcode"
                              >
                                <QrCode className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* List Footer / Counter */}
            <div className="border-t border-slate-100 pt-3 mt-3 flex justify-between items-center text-[10px] text-slate-400">
              <span>Menampilkan {visiblePenerimaans.length} data laporan terakhir</span>
              {filteredPenerimaans.length > 50 && (
                <span>Dibatasi hingga 50 entri</span>
              )}
            </div>

          </div>
        </div>

      </div>

      {/* Dynamic Confirmation Dialog Modal */}
      {showConfirmModal && selectedPo && (
        <div className="fixed inset-0 z-55 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex gap-4 items-start mb-4">
              <div className="rounded-full bg-amber-100 p-2 text-amber-700 shrink-0">
                <ShieldAlert className="h-6 w-6" />
              </div>
              <div>
                <h4 className="text-base font-bold text-slate-900">Konfirmasi Tulis Data</h4>
                <p className="text-sm text-slate-600 mt-1">
                  Apakah Anda yakin ingin menulis laporan LPB ini langsung ke Google Sheets database? Tindakan ini akan meng-append baris baru secara langsung.
                </p>
              </div>
            </div>

            {/* Summary Details */}
            <div className="rounded-lg bg-slate-50 p-4 border border-slate-200 text-xs space-y-2.5 font-mono mb-5 text-slate-700">
              <div className="flex justify-between border-b border-slate-200/60 pb-1.5">
                <span>NOMOR LPB:</span>
                <span className="font-bold text-slate-900">{noLPB}</span>
              </div>
              <div className="flex justify-between border-b border-slate-200/60 pb-1.5">
                <span>NO PO:</span>
                <span className="font-bold text-slate-900">{selectedPo.noPO}</span>
              </div>
              <div className="flex justify-between border-b border-slate-200/60 pb-1.5">
                <span>PETUGAS:</span>
                <span className="font-bold text-slate-900">{petugas}</span>
              </div>
              <div className="flex justify-between border-b border-slate-200/60 pb-1.5">
                <span>BARANG:</span>
                <span className="font-bold text-slate-900 truncate max-w-[200px]" title={selectedPo.namaBarang}>
                  {selectedPo.namaBarang}
                </span>
              </div>
              <div className="flex justify-between border-b border-slate-200/60 pb-1.5">
                <span>JUMLAH LPB:</span>
                <span className="font-bold text-indigo-700">{qtyPenerimaan} {selectedPo.satuan}</span>
              </div>
              <div className="flex justify-between border-b border-slate-200/60 pb-1.5">
                <span>HARGA SATUAN:</span>
                <span className="font-bold text-slate-900">{formatRupiah(hargaSatuan)}</span>
              </div>
              <div className="flex justify-between border-b border-slate-200/60 pb-1.5">
                <span>DISKON / PPN:</span>
                <span className="font-bold text-slate-900">{formatRupiah(diskon)} / {formatRupiah(ppn)}</span>
              </div>
              <div className="flex justify-between border-b border-slate-200/60 pb-1.5 bg-indigo-50/50 p-1.5 rounded">
                <span className="text-indigo-700 font-bold">TOTAL AKHIR (NET):</span>
                <span className="font-bold text-indigo-800">{formatRupiah(totalValue)}</span>
              </div>
              <div className="flex justify-between">
                <span>SUPPLIER:</span>
                <span className="font-bold text-slate-900">{selectedPo.supplier}</span>
              </div>
            </div>

            <div className="flex gap-3 justify-end">
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:text-slate-950 transition cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={submitting}
                className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2 text-xs font-bold text-white hover:bg-indigo-700 shadow-sm transition disabled:opacity-50 cursor-pointer"
              >
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Menulis...</span>
                  </>
                ) : (
                  <span>Ya, Konfirmasi & Tulis</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
