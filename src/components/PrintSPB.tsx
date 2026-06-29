import React, { useRef } from 'react';
import { Printer, ArrowLeft } from 'lucide-react';
import { SPBItem } from '../sheets-api';

interface PrintSPBProps {
  spb: SPBItem;
  onBack: () => void;
}

export default function PrintSPB({ spb, onBack }: PrintSPBProps) {
  const printAreaRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6 md:p-12 print:bg-white print:p-0 flex flex-col items-center">
      
      {/* Control Panel (Hidden in print) */}
      <div className="w-full max-w-4xl mb-8 flex items-center justify-between gap-4 border-b border-slate-200 pb-6 print:hidden">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-slate-900 transition cursor-pointer"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Kembali ke Histori SPB</span>
        </button>
        
        <button
          onClick={handlePrint}
          className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-5 py-2.5 text-xs font-bold text-white hover:bg-indigo-700 shadow-sm transition cursor-pointer"
        >
          <Printer className="h-4 w-4" />
          <span>Cetak Dokumen SPB</span>
        </button>
      </div>

      {/* Printable Sheet Area */}
      <div 
        ref={printAreaRef}
        className="w-full max-w-4xl bg-white border border-slate-200 p-8 md:p-12 shadow-md rounded-xl print:shadow-none print:border-none print:p-0 print:w-full print:max-w-none"
      >
        {/* Header Kop Surat */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b-2 border-slate-900 pb-6 mb-8 gap-4">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold text-lg print:bg-indigo-600">
              KB
            </div>
            <div>
              <h1 className="text-xl font-black text-slate-900 tracking-tight uppercase">KYOKKO BEACH</h1>
              <p className="text-[10px] text-slate-500 font-semibold tracking-wider uppercase mt-0.5">
                Sistem Pergudangan, Logistik & Penyaluran Barang
              </p>
              <p className="text-[9px] text-slate-400 font-mono mt-0.5">Jl. Pantai Kyokko No. 88, Badung, Bali</p>
            </div>
          </div>
          <div className="text-right sm:text-right">
            <h2 className="text-lg font-black text-slate-900 tracking-wide uppercase">SURAT PERMINTAAN BARANG (SPB)</h2>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-amber-50 border border-amber-200 text-amber-800 rounded text-[9px] font-bold uppercase tracking-wider mt-1.5 print:bg-amber-50 print:border-amber-200 print:text-amber-800">
              STATUS SPB: {spb.status}
            </div>
          </div>
        </div>

        {/* Info Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-50 border border-slate-200 rounded-xl p-6 mb-8 text-xs font-medium text-slate-600 print:bg-slate-50 print:p-6 print:border-slate-200">
          <div className="space-y-2">
            <div className="flex">
              <span className="w-28 text-slate-400 uppercase font-semibold text-[10px] tracking-wider">No. SPB</span>
              <span className="font-mono font-bold text-slate-900">{spb.noSPB}</span>
            </div>
            <div className="flex">
              <span className="w-28 text-slate-400 uppercase font-semibold text-[10px] tracking-wider">Tanggal</span>
              <span className="text-slate-900 font-semibold">{spb.tanggal}</span>
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex">
              <span className="w-28 text-slate-400 uppercase font-semibold text-[10px] tracking-wider">Nama Peminta</span>
              <span className="text-slate-900 font-bold">{spb.namaPeminta}</span>
            </div>
            <div className="flex">
              <span className="w-28 text-slate-400 uppercase font-semibold text-[10px] tracking-wider">Departemen</span>
              <span className="text-slate-900 font-bold uppercase">{spb.departemen}</span>
            </div>
          </div>
        </div>

        {/* Table Barang */}
        <div className="border border-slate-200 rounded-xl overflow-hidden mb-12">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-900 text-white font-bold uppercase text-[10px] tracking-wider">
              <tr>
                <th className="p-4 text-center w-12">No</th>
                <th className="p-4 w-32">Kode Barang</th>
                <th className="p-4">Nama Barang / Spesifikasi</th>
                <th className="p-4 text-center w-24">Jumlah (Qty)</th>
                <th className="p-4">Keterangan Penggunaan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              <tr className="align-middle">
                <td className="p-4 text-center font-bold text-slate-800">1</td>
                <td className="p-4 font-mono font-bold text-indigo-600">{spb.kodeBarang}</td>
                <td className="p-4 font-bold text-slate-900">{spb.namaBarang}</td>
                <td className="p-4 text-center font-black text-slate-900 bg-slate-50/50">{spb.qty}</td>
                <td className="p-4 text-slate-600 leading-relaxed font-semibold">{spb.keterangan || '-'}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Tanda Tangan */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center text-xs font-bold text-slate-700 mt-16 print:grid-cols-4">
          <div className="flex flex-col justify-between h-28">
            <span className="text-[10px] uppercase text-slate-400 tracking-wider">Peminta Barang</span>
            <div className="border-b border-slate-300 w-32 mx-auto pb-1 text-slate-900">{spb.namaPeminta}</div>
            <span className="text-[9px] text-slate-400 font-mono">Tgl: {spb.tanggal}</span>
          </div>

          <div className="flex flex-col justify-between h-28">
            <span className="text-[10px] uppercase text-slate-400 tracking-wider">Kepala Departemen</span>
            <div className="border-b border-slate-300 w-32 mx-auto pb-1 text-slate-300">............................</div>
            <span className="text-[9px] text-slate-400">Tanda Tangan & Nama</span>
          </div>

          <div className="flex flex-col justify-between h-28">
            <span className="text-[10px] uppercase text-slate-400 tracking-wider">Petugas Gudang</span>
            <div className="border-b border-slate-300 w-32 mx-auto pb-1 text-slate-300">............................</div>
            <span className="text-[9px] text-slate-400">Pemeriksa Persediaan</span>
          </div>

          <div className="flex flex-col justify-between h-28">
            <span className="text-[10px] uppercase text-slate-400 tracking-wider">Direktur Operational</span>
            <div className="border-b border-slate-300 w-32 mx-auto pb-1 text-slate-300">............................</div>
            <span className="text-[9px] text-slate-400">Pemberi Persetujuan</span>
          </div>
        </div>

        {/* Footer Notes */}
        <div className="border-t border-slate-200 mt-16 pt-6 flex justify-between items-center text-[10px] text-slate-400 font-medium font-mono">
          <span>Sistem Cetak SPB Otomatis Kyokko Beach Inventory</span>
          <span>Dokumen ID: {spb.noSPB.replace(/-/g, '')}</span>
        </div>
      </div>
    </div>
  );
}
