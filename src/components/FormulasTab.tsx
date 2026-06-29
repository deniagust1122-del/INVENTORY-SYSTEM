import React, { useState } from 'react';
import { Copy, Check, FileSpreadsheet, Sparkles, BookOpen } from 'lucide-react';
import { SPREADSHEET_FORMULAS, SpreadsheetFormula } from '../spreadsheet-formulas';

export default function FormulasTab() {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const handleCopy = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  return (
    <div className="space-y-6">
      <div className="rounded-xl bg-gradient-to-r from-slate-50 to-indigo-50/30 p-6 border border-slate-200">
        <div className="flex gap-4 items-start">
          <div className="rounded-lg bg-indigo-50 p-2 text-indigo-600 border border-indigo-100">
            <Sparkles className="h-6 w-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900">Formula Dashboard Mutasi Otomatis</h3>
            <p className="text-sm text-slate-600 mt-1">
              Gunakan formula di bawah ini langsung di spreadsheet Anda untuk membuat dashboard stok gudang secara otomatis tanpa script tambahan. Sangat dinamis dan tahan error!
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-1">
        {SPREADSHEET_FORMULAS.map((item, index) => (
          <div key={index} className="rounded-xl bg-white border border-slate-200 p-6 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                  item.type === 'QUERY' ? 'bg-indigo-50 text-indigo-700 border border-indigo-100' : 'bg-slate-100 text-slate-700 border border-slate-200'
                }`}>
                  <FileSpreadsheet className="h-3 w-3" />
                  {item.type} Formula
                </span>
                <span className="text-xs font-mono text-slate-400">#Formula-{index + 1}</span>
              </div>
              <h4 className="text-base font-bold text-slate-900">{item.title}</h4>
              <p className="text-sm text-slate-600 mt-2">{item.description}</p>
            </div>

            <div className="mt-4">
              <div className="relative">
                <div className="absolute right-3 top-3">
                  <button
                    onClick={() => handleCopy(item.formula, index)}
                    className="rounded bg-slate-50 hover:bg-slate-100 border border-slate-200 p-2 text-slate-600 hover:text-slate-900 transition flex items-center gap-1 text-xs cursor-pointer"
                    title="Salin Formula"
                  >
                    {copiedIndex === index ? (
                      <>
                        <Check className="h-3.5 w-3.5 text-emerald-600" />
                        <span className="text-emerald-600 font-medium">Tersalin</span>
                      </>
                    ) : (
                      <>
                        <Copy className="h-3.5 w-3.5" />
                        <span>Salin</span>
                      </>
                    )}
                  </button>
                </div>
                <pre className="overflow-x-auto rounded bg-slate-950 p-4 font-mono text-xs text-indigo-400 border border-slate-900 pt-12">
                  <code>{item.formula}</code>
                </pre>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h4 className="font-bold text-slate-900 flex items-center gap-2 mb-4">
          <BookOpen className="h-5 w-5 text-indigo-600" />
          Panduan Penggunaan di Google Sheets
        </h4>
        <div className="prose prose-sm text-slate-600 space-y-2">
          <p>
            1. <strong>Formula SUMIFS</strong>: Masukkan rumus ini ke sel baris pertama (misalnya baris 3) pada tabel mutasi baru Anda, lalu tarik tuas pengisian otomatis (fill handle) ke bawah untuk menghitung semua baris lainnya.
          </p>
          <p>
            2. <strong>Formula QUERY</strong>: Ini adalah formula sekali-masuk! Cukup ketikkan rumus ini di satu sel kosong di sebelah kiri atas tabel (misalnya sel A1), dan ia akan otomatis membuat seluruh tabel mutasi termasuk Kode Barang, Nama, Satuan, Stok Awal, dll.
          </p>
          <p className="text-xs text-amber-600 bg-amber-50 p-3 rounded-lg border border-amber-100">
            <strong>⚠️ Catatan Format Internasional:</strong> Jika spreadsheet Anda menggunakan format Regional Amerika Serikat (US), ganti tanda titik koma (<code>;</code>) dalam rumus menjadi tanda koma (<code>,</code>).
          </p>
        </div>
      </div>
    </div>
  );
}
