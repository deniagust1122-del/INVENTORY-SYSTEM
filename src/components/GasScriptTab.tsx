import React, { useState } from 'react';
import { Copy, Check, Terminal, Play, AlertTriangle } from 'lucide-react';
import { GOOGLE_APPS_SCRIPT_CODE } from '../google-apps-script';

export default function GasScriptTab() {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(GOOGLE_APPS_SCRIPT_CODE);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      <div className="rounded-xl bg-gradient-to-r from-slate-50 to-indigo-50/30 p-6 border border-slate-200">
        <div className="flex gap-4 items-start">
          <div className="rounded-lg bg-indigo-50 p-2 text-indigo-600 border border-indigo-100">
            <Terminal className="h-6 w-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900">Google Apps Script Kokoh (Anti-Geser)</h3>
            <p className="text-sm text-slate-600 mt-1">
              Skrip ini secara dinamis memetakan posisi kolom berdasarkan nama header di Google Sheets, bukan nomor indeks tetap. Data Anda akan selalu terisi ke kolom yang tepat meskipun Anda menambah atau memindahkan urutan kolom di spreadsheet!
            </p>
          </div>
        </div>
      </div>

      <div className="rounded-xl bg-white border border-slate-200 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/50 px-6 py-4">
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-full bg-amber-500 animate-pulse"></div>
            <span className="text-sm font-semibold text-slate-700 font-mono">Code.gs</span>
          </div>
          <button
            onClick={handleCopy}
            className="inline-flex items-center gap-1.5 rounded border border-slate-200 bg-white px-3.5 py-1.5 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50 hover:text-slate-900 transition cursor-pointer"
          >
            {copied ? (
              <>
                <Check className="h-3.5 w-3.5 text-emerald-600" />
                <span className="text-emerald-600">Tersalin ke Clipboard</span>
              </>
            ) : (
              <>
                <Copy className="h-3.5 w-3.5" />
                <span>Salin Semua Kode</span>
              </>
            )}
          </button>
        </div>

        <div className="relative">
          <pre className="max-h-[500px] overflow-y-auto p-6 bg-slate-950 font-mono text-xs text-indigo-400 leading-relaxed border border-slate-900">
            <code>{GOOGLE_APPS_SCRIPT_CODE}</code>
          </pre>
        </div>
      </div>

      {/* Deployment Guide */}
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h4 className="font-bold text-slate-900 flex items-center gap-2 mb-4">
          <Play className="h-5 w-5 text-indigo-600" />
          Cara Memasang Script di Google Sheets Anda
        </h4>
        <div className="space-y-4 text-sm text-slate-600">
          <div className="flex gap-3">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-indigo-50 font-mono text-xs font-bold text-indigo-700">
              1
            </span>
            <p>
              Buka Google Sheets Anda, pilih menu <strong>Extensions</strong> (Ekstensi) di bagian atas, lalu klik <strong>Apps Script</strong>.
            </p>
          </div>
          <div className="flex gap-3">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-indigo-50 font-mono text-xs font-bold text-indigo-700">
              2
            </span>
            <p>
              Hapus semua kode bawaan yang ada di editor editor (biasanya berupa fungsi <code>myFunction</code>), lalu paste seluruh kode yang sudah disalin di atas.
            </p>
          </div>
          <div className="flex gap-3">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-indigo-50 font-mono text-xs font-bold text-indigo-700">
              3
            </span>
            <p>
              Simpan script dengan menekan tombol ikon disket di bagian atas atau tekan <code>Ctrl + S</code>.
            </p>
          </div>
          <div className="flex gap-3">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-indigo-50 font-mono text-xs font-bold text-indigo-700">
              4
            </span>
            <p>
              Anda bisa langsung menjalankan fungsi <code>submitPenerimaanBarang</code> untuk menguji coba penulisan dinamis, lalu lihat baris baru yang terbentuk di sheet "Penerimaan".
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
