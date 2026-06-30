import React, { useRef, useState, useEffect } from 'react';
import { Printer, QrCode, ArrowLeft, Loader2, RefreshCw } from 'lucide-react';
import { fetchPenerimaanItems, PenerimaanItem } from '../sheets-api';

export default function CetakLPB() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [item, setItem] = useState<PenerimaanItem | null>(null);
  const [printMode, setPrintMode] = useState<'all' | 'lpb' | 'barcode'>('all');
  const printAreaRef = useRef<HTMLDivElement>(null);

  // Extract no_lpb from URL query parameter
  const params = new URLSearchParams(window.location.search);
  const noLpb = params.get('no_lpb') || params.get('lpb') || '';

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      if (!noLpb) {
        throw new Error('Nomor LPB tidak ditemukan di parameter URL. Pastikan link memiliki format: ?no_lpb=LPB-XXXXXX');
      }

      // Read token from local storage or use default fallback for simplicity
      const token = localStorage.getItem('google_token') || 'apps-script-backend';
      const items = await fetchPenerimaanItems(token);
      
      const matched = items.find(
        (i) => String(i.noLPB).trim().toUpperCase() === String(noLpb).trim().toUpperCase()
      );

      if (!matched) {
        throw new Error(`Data Penerimaan dengan nomor LPB "${noLpb}" tidak ditemukan di database Google Sheets.`);
      }

      setItem(matched);
    } catch (err: any) {
      console.error('Error fetching LPB details for print:', err);
      setError(err.message || 'Terjadi kesalahan saat memproses data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [noLpb]);

  const handlePrint = () => {
    window.print();
  };

  const handleBack = () => {
    window.location.href = '/';
  };

  const formatRupiah = (val: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0
    }).format(val);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center">
        <Loader2 className="h-10 w-10 text-indigo-600 animate-spin mb-4" />
        <h3 className="text-base font-bold text-slate-800">Memuat Dokumen LPB...</h3>
        <p className="text-xs text-slate-500 mt-1 max-w-md">
          Sedang mengambil data transaksi terverifikasi langsung dari Google Sheets untuk {noLpb || 'LPB Baru'}
        </p>
      </div>
    );
  }

  if (error || !item) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center">
        <div className="rounded-full bg-rose-100 p-3 text-rose-600 mb-4">
          <ArrowLeft className="h-6 w-6" />
        </div>
        <h3 className="text-lg font-bold text-slate-900">Gagal Membuka Dokumen Cetak</h3>
        <p className="text-sm text-slate-600 mt-2 max-w-md bg-white p-4 rounded-lg border border-slate-200">
          {error}
        </p>
        <div className="mt-6 flex gap-3">
          <button
            onClick={handleBack}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-sm cursor-pointer"
          >
            Kembali ke Aplikasi Utama
          </button>
          <button
            onClick={loadData}
            className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-xs font-semibold text-white hover:bg-indigo-700 shadow-sm cursor-pointer"
          >
            <RefreshCw className="h-3 w-3" /> Coba Lagi
          </button>
        </div>
      </div>
    );
  }

  const {
    noLPB,
    noPO,
    kodeBarang,
    namaBarang,
    qty,
    satuan,
    hargaSatuan,
    total,
    supplier,
    tanggal,
    diskon = 0,
    ppn = 0,
    verification,
    petugas
  } = item;

  const formattedHarga = formatRupiah(hargaSatuan);
  const formattedTotal = formatRupiah(total);
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(kodeBarang)}`;

  if (printMode === 'barcode') {
    return (
      <div className="min-h-screen bg-slate-50 p-6 md:p-12 print:bg-white print:p-0">
        {/* Control Panel (Hidden in print) */}
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-6 print:hidden">
          <button
            onClick={handleBack}
            className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-900 cursor-pointer"
          >
            <ArrowLeft className="h-4 w-4" />
            Kembali ke Aplikasi Utama
          </button>
          
          {/* Print Layout Toggle */}
          <div className="flex bg-slate-100 p-1 rounded-lg border border-slate-200">
            <button
              onClick={() => setPrintMode('all')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition cursor-pointer ${
                printMode === 'all'
                  ? 'bg-white text-indigo-600 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Semua (LPB & Barcode)
            </button>
            <button
              onClick={() => setPrintMode('lpb')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition cursor-pointer ${
                printMode === 'lpb'
                  ? 'bg-white text-indigo-600 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Dokumen LPB Saja
            </button>
            <button
              onClick={() => setPrintMode('barcode')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition cursor-pointer ${
                printMode === 'barcode'
                  ? 'bg-white text-indigo-600 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Barcode Saja
            </button>
          </div>

          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-2 rounded bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 transition cursor-pointer"
          >
            <Printer className="h-4 w-4" />
            Cetak Barcode
          </button>
        </div>

        {/* Barcode Label Card */}
        <div className="mx-auto max-w-sm bg-white p-6 shadow-sm border border-slate-200 rounded-lg text-center print:shadow-none print:border-none print:p-0">
          <div className="border-2 border-dashed border-slate-300 p-6 rounded-lg flex flex-col items-center">
            <div className="text-xs font-bold text-slate-800 tracking-wider uppercase mb-1">
              BARCODE BARANG GUDANG
            </div>
            <div className="text-[10px] text-slate-500 mb-4 font-mono">
              KYOKKO BEACH INVENTORY SYSTEM
            </div>
            
            <div className="border-2 border-slate-900 p-3 rounded-md bg-white mb-4">
              <img 
                src={qrUrl} 
                alt={`QR Code ${kodeBarang}`} 
                className="h-40 w-40"
                referrerPolicy="no-referrer"
              />
            </div>
            
            <p className="text-base font-mono font-bold text-slate-900 tracking-widest bg-slate-100 px-3 py-1 rounded">
              {kodeBarang}
            </p>
            
            <p className="text-sm font-semibold text-slate-800 mt-3 text-center line-clamp-2 max-w-xs">
              {namaBarang}
            </p>
            
            <div className="mt-4 pt-4 border-t border-slate-100 w-full grid grid-cols-2 gap-2 text-[10px] text-slate-400 font-mono text-left">
              <div>
                <span className="block text-slate-500">NO. LPB:</span>
                <span className="font-bold text-slate-700 truncate block">{noLPB}</span>
              </div>
              <div>
                <span className="block text-slate-500">SUPPLIER:</span>
                <span className="font-bold text-slate-700 truncate block">{supplier}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-6 md:p-12 print:bg-white print:p-0">
      {/* Control Panel (Hidden in print) */}
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-6 print:hidden">
        <button
          onClick={handleBack}
          className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-900 cursor-pointer"
        >
          <ArrowLeft className="h-4 w-4" />
          Kembali ke Aplikasi Utama
        </button>

        {/* Print Layout Toggle */}
        <div className="flex bg-slate-100 p-1 rounded-lg border border-slate-200">
          <button
            onClick={() => setPrintMode('all')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition cursor-pointer ${
              printMode === 'all'
                ? 'bg-white text-indigo-600 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Semua (LPB & Barcode)
          </button>
          <button
            onClick={() => setPrintMode('lpb')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition cursor-pointer ${
              printMode === 'lpb'
                ? 'bg-white text-indigo-600 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Dokumen LPB Saja
          </button>
          <button
            onClick={() => setPrintMode('barcode')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition cursor-pointer ${
              printMode === 'barcode'
                ? 'bg-white text-indigo-600 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Barcode Saja
          </button>
        </div>

        <button
          onClick={handlePrint}
          className="inline-flex items-center gap-2 rounded bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 transition cursor-pointer"
        >
          <Printer className="h-4 w-4" />
          Cetak Dokumen
        </button>
      </div>

      {/* Printable Receipt */}
      <div 
        ref={printAreaRef}
        className="mx-auto max-w-3xl bg-white p-8 shadow-sm border border-slate-200 print:shadow-none print:border-none print:p-4"
        style={{ contentVisibility: 'auto' }}
      >
        {/* Header */}
        <div className="flex justify-between items-start border-b-2 border-slate-900 pb-6 mb-6">
          <div>
            <h1 className="text-xl font-bold text-slate-900 uppercase tracking-wide">KYOKKO BEACH</h1>
            <p className="text-xs text-slate-500 mt-1">Sistem Manajemen Inventaris Gudang</p>
            <p className="text-xs text-slate-500">Laporan Penerimaan Barang (LPB)</p>
          </div>
          <div className="text-right">
            <div className="inline-block bg-slate-100 px-3 py-1 text-xs font-mono font-bold text-slate-800 rounded">
              DOKUMEN LPB RESMI
            </div>
            <p className="text-xs text-slate-500 mt-2">Tanggal: {tanggal}</p>
          </div>
        </div>

        {/* Info Grid */}
        <div className="grid grid-cols-2 gap-4 text-xs mb-6">
          <div className="space-y-1">
            <p className="text-slate-500">No. LPB / Receipt:</p>
            <p className="font-mono font-bold text-sm text-slate-900">{noLPB}</p>
            
            <p className="text-slate-500 mt-3">No. Purchase Order (PO):</p>
            <p className="font-mono font-medium text-slate-900">{noPO}</p>
          </div>
          <div className="space-y-1">
            <p className="text-slate-500">Supplier / Pemasok:</p>
            <p className="font-semibold text-slate-900">{supplier}</p>

            <p className="text-slate-500 mt-3">Status Verifikasi:</p>
            <p className="inline-flex items-center gap-1 font-semibold text-indigo-700">
              <span>✔</span> {verification || 'Terverifikasi Gudang'}
            </p>
          </div>
        </div>

        {/* Item Table */}
        <div className="border border-slate-300 rounded overflow-hidden mb-8">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-100 border-b border-slate-300 font-semibold text-slate-700">
                <th className="p-3">Kode Barang</th>
                <th className="p-3">Nama Barang & Spesifikasi</th>
                <th className="p-3 text-right">Jumlah (Qty)</th>
                <th className="p-3">Satuan</th>
                <th className="p-3 text-right">Harga Satuan</th>
                <th className="p-3 text-right">Total</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-slate-200">
                <td className="p-3 font-mono font-semibold text-slate-800">{kodeBarang}</td>
                <td className="p-3 font-medium text-slate-900">{namaBarang}</td>
                <td className="p-3 text-right font-bold text-slate-900">{qty}</td>
                <td className="p-3 text-slate-600">{satuan}</td>
                <td className="p-3 text-right font-mono text-slate-800">{formattedHarga}</td>
                <td className="p-3 text-right font-mono font-bold text-slate-900">{formattedTotal}</td>
              </tr>
              {/* Financial Breakdown Rows */}
              <tr className="border-b border-slate-100 text-[11px] text-slate-500">
                <td colSpan={4} className="p-2"></td>
                <td className="p-2 text-right">Subtotal Gross:</td>
                <td className="p-2 text-right font-mono">{formatRupiah(qty * hargaSatuan)}</td>
              </tr>
              {Math.abs(diskon) > 0 && (
                <tr className="border-b border-slate-100 text-[11px] text-slate-500">
                  <td colSpan={4} className="p-2"></td>
                  <td className="p-2 text-right">Diskon:</td>
                  <td className="p-2 text-right font-mono text-rose-600">-{formatRupiah(Math.abs(diskon))}</td>
                </tr>
              )}
              {Math.abs(ppn) > 0 && (
                <tr className="border-b border-slate-100 text-[11px] text-slate-500">
                  <td colSpan={4} className="p-2"></td>
                  <td className="p-2 text-right">PPN:</td>
                  <td className="p-2 text-right font-mono text-emerald-600">+{formatRupiah(Math.abs(ppn))}</td>
                </tr>
              )}
              <tr className="bg-slate-50 text-[11px] font-bold">
                <td colSpan={4} className="p-2"></td>
                <td className="p-2 text-right text-slate-800">Total Netto:</td>
                <td className="p-2 text-right font-mono text-indigo-700">{formatRupiah((qty * hargaSatuan) - Math.abs(diskon) + Math.abs(ppn))}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Print Layout Double: LPB Details and QR Code Card for Barcode Scan */}
        <div className={`grid ${printMode === 'all' ? 'grid-cols-2 gap-8' : 'grid-cols-1'} items-end border-t border-slate-200 pt-8`}>
          {/* Signatures */}
          <div className={`grid grid-cols-2 gap-4 text-center text-xs ${printMode === 'lpb' ? 'max-w-md mx-auto w-full' : ''}`}>
            <div>
              <p className="text-slate-500 mb-12">Diserahkan Oleh,</p>
              <div className="border-b border-slate-400 mx-auto w-24"></div>
              <p className="text-slate-600 mt-1 font-medium">{supplier}</p>
            </div>
            <div>
              <p className="text-slate-500 mb-12">Petugas Gudang,</p>
              <div className="border-b border-slate-400 mx-auto w-24"></div>
              <p className="text-slate-600 mt-1 font-medium">{petugas || verification || 'Verifikator'}</p>
            </div>
          </div>

          {/* Barcode & QR code Section */}
          {printMode === 'all' && (
            <div className="flex flex-col items-center justify-center border-l border-slate-200 pl-8">
              <p className="text-xs font-semibold text-slate-700 mb-2 text-center uppercase tracking-wider">
                Scan Barcode / QR Barang
              </p>
              <div className="border-2 border-slate-900 p-2 rounded bg-white">
                <img 
                  src={qrUrl} 
                  alt={`QR Code ${kodeBarang}`} 
                  className="h-28 w-28"
                  referrerPolicy="no-referrer"
                />
              </div>
              <p className="text-xs font-mono text-slate-500 mt-2 tracking-widest">{kodeBarang}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-dashed border-slate-300 mt-8 pt-4 text-center text-[10px] text-slate-400 font-mono">
          Kyokko Beach Inventory Management System • Dokumen ini dihasilkan secara otomatis pada tanggal {new Date().toLocaleString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit', timeZoneName: 'short' })}
        </div>
      </div>
    </div>
  );
}
