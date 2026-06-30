import React, { useState } from 'react';
import { getAppsScriptUrl, setAppsScriptUrl, fetchUsers } from '../sheets-api';
import { GOOGLE_APPS_SCRIPT_CODE } from '../google-apps-script';
import { 
  Settings, 
  Link, 
  Check, 
  Copy, 
  AlertTriangle, 
  CheckCircle2, 
  Code, 
  ExternalLink,
  RefreshCw,
  HelpCircle,
  FileText
} from 'lucide-react';

export default function SettingsTab() {
  const [url, setUrl] = useState(getAppsScriptUrl());
  const [testStatus, setTestStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [testErrorMessage, setTestErrorMessage] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleSaveUrl = () => {
    setAppsScriptUrl(url);
    alert('URL Web App Backend berhasil disimpan!');
  };

  const handleResetUrl = () => {
    const defaultUrl = 'https://script.google.com/macros/s/AKfycbz_fKes1r8haO8YtnmLhExoSipmRr3RLlFKMC5vMREHGk_O7xgS1k5QAG7ElkRg9Qy7/exec';
    setUrl(defaultUrl);
    setAppsScriptUrl(defaultUrl);
    alert('URL telah di-reset ke nilai default.');
  };

  const handleTestConnection = async () => {
    setTestStatus('loading');
    setTestErrorMessage(null);
    try {
      // We will perform a real fetch to test
      const tempUrl = url.trim();
      if (!tempUrl) {
        throw new Error('URL tidak boleh kosong.');
      }
      
      const nocache = `${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      const testUrl = `${tempUrl}?action=read&sheet=USERS&range=A1:B2&_nocache=${nocache}`;
      const proxyUrl = `/api/proxy?url=${encodeURIComponent(testUrl)}&_t=${nocache}`;
      const res = await fetch(proxyUrl, {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      });
      if (!res.ok) {
        throw new Error(`Koneksi gagal (HTTP ${res.status}): ${res.statusText}`);
      }
      
      const data = await res.json();
      if (data.status === 'error' || data.error) {
        throw new Error(data.error || 'Terjadi kesalahan eksekusi di Apps Script.');
      }
      
      setTestStatus('success');
    } catch (err: any) {
      console.error('Test connection error:', err);
      let errMsg = err.message || String(err);
      
      if (errMsg.includes('Failed to fetch')) {
        errMsg = 'Gagal melakukan fetch (Kemungkinan CORS error karena Apps Script belum dideploy dengan benar sebagai "Anyone" atau fungsi doGet() belum terpasang).';
      }
      
      setTestStatus('error');
      setTestErrorMessage(errMsg);
    }
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(GOOGLE_APPS_SCRIPT_CODE);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      
      {/* 1. Header Card */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs">
        <div className="flex items-start gap-4">
          <div className="rounded-xl bg-indigo-50 p-3 text-indigo-600">
            <Settings className="h-6 w-6" />
          </div>
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide">Pengaturan Backend & Integrasi</h3>
            <p className="text-xs text-slate-500 leading-relaxed max-w-2xl">
              Sistem inventaris Anda saat ini berjalan sepenuhnya menggunakan <b>Google Apps Script Web App</b> sebagai backend untuk integrasi database Google Sheets.
              Ini menggantikan Service Account JSON yang rumit dan rentan terhadap error perizinan, memberikan kestabilan 100% langsung dari akun Google Sheets Anda.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: URL Setup & Diagnostic */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* URL Configuration Card */}
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <Link className="h-4.5 w-4.5 text-indigo-600" />
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Konfigurasi URL Web App</h4>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">URL Web App (Google Apps Script)</label>
              <div className="flex gap-2">
                <input 
                  type="text" 
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://script.google.com/macros/s/.../exec"
                  className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-mono text-slate-700 focus:outline-hidden focus:border-indigo-500 focus:bg-white transition"
                />
              </div>
              <p className="text-[10px] text-slate-400 leading-relaxed">
                * Masukkan URL Web App Google Apps Script hasil deployment terbaru Anda untuk menghubungkan spreadsheet pribadi Anda.
              </p>
            </div>

            <div className="flex flex-wrap gap-2 pt-2">
              <button
                onClick={handleSaveUrl}
                className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold py-2 px-4 rounded-lg transition shadow-xs cursor-pointer flex items-center gap-1.5"
              >
                <Check className="h-3.5 w-3.5" />
                <span>Simpan URL</span>
              </button>
              
              <button
                onClick={handleTestConnection}
                disabled={testStatus === 'loading'}
                className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold py-2 px-4 rounded-lg transition cursor-pointer flex items-center gap-1.5"
              >
                {testStatus === 'loading' ? (
                  <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <RefreshCw className="h-3.5 w-3.5" />
                )}
                <span>Uji Koneksi Backend</span>
              </button>

              <button
                onClick={handleResetUrl}
                className="text-slate-400 hover:text-slate-600 text-[10px] font-bold uppercase tracking-wider py-2 px-3 transition ml-auto cursor-pointer"
              >
                Reset Default
              </button>
            </div>

            {/* Test Results Banner */}
            {testStatus === 'success' && (
              <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-xs font-medium text-emerald-800 flex items-start gap-3 animate-in fade-in duration-150">
                <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <span className="font-bold text-emerald-900 block uppercase tracking-wide">KONEKSI BERHASIL!</span>
                  <span className="text-slate-600 leading-relaxed block">
                    Aplikasi berhasil melakukan request GET dan membaca data Users dari database Google Sheets Anda melalui Apps Script.
                  </span>
                </div>
              </div>
            )}

            {testStatus === 'error' && (
              <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-xs font-medium text-rose-800 flex items-start gap-3 animate-in fade-in duration-150">
                <AlertTriangle className="h-5 w-5 text-rose-500 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <span className="font-bold text-rose-950 block uppercase tracking-wide">KONEKSI GAGAL</span>
                  <span className="text-slate-600 leading-relaxed block text-[11px] mb-2">
                    Gagal membaca data dari Google Sheets. Hal ini biasanya terjadi jika Anda belum menyalin kode Apps Script terbaru atau belum meluncurkan (deploy) ulang Web App dengan izin akses publik.
                  </span>
                  <div className="font-mono text-[10px] bg-white border border-rose-100 p-2.5 rounded-lg text-rose-900 break-words select-all leading-normal">
                    {testErrorMessage}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Setup Instructions Guide */}
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <HelpCircle className="h-4.5 w-4.5 text-indigo-600" />
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Langkah-Langkah Setup Database & Deployment</h4>
            </div>

            <div className="relative border-l-2 border-slate-100 pl-5 ml-2.5 space-y-6 text-xs text-slate-600">
              
              <div className="relative">
                <div className="absolute -left-[27px] top-0 bg-indigo-600 text-white font-bold font-mono text-[9px] h-4.5 w-4.5 rounded-full flex items-center justify-center border border-white">1</div>
                <div className="space-y-1">
                  <h5 className="font-bold text-slate-900">Salin Kode Apps Script</h5>
                  <p className="leading-relaxed">
                    Klik tombol <b>"Salin Kode Apps Script"</b> di kolom sebelah kanan untuk menduplikasi seluruh kode backend yang optimal.
                  </p>
                </div>
              </div>

              <div className="relative">
                <div className="absolute -left-[27px] top-0 bg-indigo-600 text-white font-bold font-mono text-[9px] h-4.5 w-4.5 rounded-full flex items-center justify-center border border-white">2</div>
                <div className="space-y-1">
                  <h5 className="font-bold text-slate-900">Buka Menu Apps Script di Google Sheets</h5>
                  <p className="leading-relaxed">
                    Buka Spreadsheet database Anda, klik menu <span className="font-semibold text-slate-800 bg-slate-100 px-1 py-0.5 rounded">Extensions</span> (Ekstensi) &gt; <span className="font-semibold text-slate-800 bg-slate-100 px-1 py-0.5 rounded">Apps Script</span> di bagian atas.
                  </p>
                </div>
              </div>

              <div className="relative">
                <div className="absolute -left-[27px] top-0 bg-indigo-600 text-white font-bold font-mono text-[9px] h-4.5 w-4.5 rounded-full flex items-center justify-center border border-white">3</div>
                <div className="space-y-1">
                  <h5 className="font-bold text-slate-900">Tempel dan Simpan Kode</h5>
                  <p className="leading-relaxed">
                    Hapus semua kode yang ada di editor editor (biasanya <code className="bg-slate-50 border border-slate-200 px-1 rounded font-mono text-[10px]">Code.gs</code>), tempelkan kode yang telah Anda salin, lalu klik ikon <b>Floppy Disk (Simpan)</b> atau tekan <code className="bg-slate-50 border border-slate-200 px-1 rounded font-mono text-[10px]">Ctrl + S</code>.
                  </p>
                </div>
              </div>

              <div className="relative">
                <div className="absolute -left-[27px] top-0 bg-indigo-600 text-white font-bold font-mono text-[9px] h-4.5 w-4.5 rounded-full flex items-center justify-center border border-white">4</div>
                <div className="space-y-1">
                  <h5 className="font-bold text-slate-900">Lakukan Deployment Baru (Deploy as Web App)</h5>
                  <p className="leading-relaxed">
                    Klik tombol biru <b>Deploy</b> di pojok kanan atas &gt; pilih <b>New deployment</b>.
                    Klik ikon gerigi (Select type) &gt; pilih <b>Web app</b>.
                  </p>
                  <ul className="list-disc list-inside space-y-1 mt-1.5 pl-1.5 text-slate-500 font-medium">
                    <li>Description: <code className="font-mono text-[10px] bg-slate-50 px-1 py-0.5 rounded text-indigo-600">Sistem Inventaris v2</code></li>
                    <li>Execute as: <code className="font-mono text-[10px] bg-slate-50 px-1 py-0.5 rounded text-indigo-600">Me (email Anda)</code></li>
                    <li>Who has access: <code className="font-mono text-[10px] bg-slate-50 px-1 py-0.5 rounded text-rose-600 font-bold">Anyone (Siapa saja)</code></li>
                  </ul>
                  <p className="leading-relaxed mt-1.5 text-amber-600 font-medium">
                    ⚠️ PENTING: Anda wajib memilih "Anyone" agar aplikasi browser dapat berkomunikasi dengan lancar tanpa terhambat CORS!
                  </p>
                </div>
              </div>

              <div className="relative">
                <div className="absolute -left-[27px] top-0 bg-indigo-600 text-white font-bold font-mono text-[9px] h-4.5 w-4.5 rounded-full flex items-center justify-center border border-white">5</div>
                <div className="space-y-1">
                  <h5 className="font-bold text-slate-900">Berikan Otorisasi & Salin URL</h5>
                  <p className="leading-relaxed">
                    Klik <b>Deploy</b>. Jika Google meminta izin otorisasi, klik <b>Authorize Access</b>, pilih akun Google Anda, klik <b>Advanced</b> &gt; <b>Go to ... (unsafe)</b>, lalu klik <b>Allow</b>.
                  </p>
                  <p className="leading-relaxed">
                    Terakhir, salin URL Web App yang berakhiran <code className="bg-slate-50 border border-slate-200 px-1 rounded font-mono text-[10px]">/exec</code>, tempelkan di form di atas, lalu klik <b>Simpan URL</b>!
                  </p>
                </div>
              </div>

            </div>

          </div>

        </div>

        {/* Right Column: Code viewer & Quick Actions */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Apps Script Code Copy Card */}
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Code className="h-4.5 w-4.5 text-indigo-600" />
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Kode Apps Script (Web App)</h4>
              </div>
              <button
                onClick={handleCopyCode}
                className="inline-flex items-center gap-1 bg-slate-100 hover:bg-indigo-50 text-slate-700 hover:text-indigo-700 text-[10px] font-bold uppercase tracking-wider px-2.5 py-1.5 rounded-lg transition cursor-pointer"
              >
                {copied ? (
                  <>
                    <Check className="h-3 w-3 text-emerald-500 animate-in zoom-in-50" />
                    <span>Tersalin!</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-3 w-3" />
                    <span>Salin Kode</span>
                  </>
                )}
              </button>
            </div>

            <p className="text-[11px] text-slate-500 leading-relaxed">
              Ini adalah seluruh script backend mutasi gudang Anda. Salin kode ini secara penuh menggunakan tombol di atas, lalu tempel di editor Google Apps Script spreadsheet Anda.
            </p>

            <div className="relative rounded-lg border border-slate-150 bg-slate-950 p-3.5 max-h-[360px] overflow-y-auto">
              <pre className="font-mono text-[9px] text-slate-300 leading-relaxed whitespace-pre font-normal select-all">
                {GOOGLE_APPS_SCRIPT_CODE}
              </pre>
            </div>

            <div className="pt-2">
              <a 
                href="https://docs.google.com/spreadsheets/d/1Qd3WWCAgsftGsVf1VMX-ZXgopA9QzYPL33VvpHMgn9o/edit?usp=sharing" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="w-full flex justify-center items-center gap-2 py-2.5 px-4 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 bg-slate-50 hover:bg-slate-100 transition cursor-pointer"
              >
                <ExternalLink className="h-4 w-4 text-slate-500" />
                <span>Buka Google Sheets Database ↗</span>
              </a>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
