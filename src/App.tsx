import React, { useState, useEffect } from 'react';
import { initAuth, googleSignIn, googleSignOut } from './firebase-auth';
import { Loader2, CheckCircle2, AlertCircle, Clock } from 'lucide-react';
import { 
  Package, 
  ClipboardList, 
  TrendingDown, 
  Layers, 
  Users, 
  FileSpreadsheet, 
  LogOut, 
  Menu, 
  X,
  Warehouse,
  Shield,
  Database,
  RefreshCw,
  QrCode,
  ShieldAlert,
  Settings
} from 'lucide-react';
import Dashboard from './components/Dashboard';
import PenerimaanForm from './components/PenerimaanForm';
import PengeluaranForm from './components/PengeluaranForm';
import MasterTab from './components/MasterTab';
import UsersTab from './components/UsersTab';
import FormulasTab from './components/FormulasTab';
import SettingsTab from './components/SettingsTab';
import PrintLPB from './components/PrintLPB';
import CetakLPB from './components/CetakLPB';
import LoginPage from './components/LoginPage';
import SPBTab from './components/SPBTab';
import LaporanTab from './components/LaporanTab';
import { fetchPenerimaanItems, fetchUsers } from './sheets-api';

type TabType = 'dashboard' | 'penerimaan' | 'pengeluaran' | 'spb' | 'master' | 'user' | 'formulas' | 'settings' | 'laporan';

interface CustomUser {
  username: string;
  role: 'admin' | 'gudang';
  nama: string;
}

export default function App() {
  // Custom auth states
  const [customUser, setCustomUser] = useState<CustomUser | null>(null);
  
  // Google Sheets integration states
  const [googleUser, setGoogleUser] = useState<any>({ displayName: "Google Sheets Backend", email: "apps-script@backend" });
  const [token, setToken] = useState<string | null>('apps-script-backend');
  const [loading, setLoading] = useState(true);
  
  // Tab Management
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Printing state
  const [printData, setPrintData] = useState<{
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
  } | null>(null);

  const appUrl = window.location.origin;

  // Global Toast / Background Task Notifications state
  const [toasts, setToasts] = useState<Array<{
    id: string;
    status: 'loading' | 'success' | 'error' | 'timeout';
    message: string;
    timestamp: number;
  }>>([]);

  // Listen to background sync task notifications
  useEffect(() => {
    const handleBgSync = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (!detail || !detail.id) return;

      setToasts((prev) => {
        const existingIdx = prev.findIndex(t => t.id === detail.id);
        const newToast = {
          id: detail.id,
          status: detail.status,
          message: detail.message,
          timestamp: Date.now()
        };

        if (existingIdx !== -1) {
          const updated = [...prev];
          updated[existingIdx] = newToast;
          return updated;
        } else {
          return [...prev, newToast];
        }
      });

      // Auto-remove success toasts after 6 seconds to keep it clean
      if (detail.status === 'success') {
        setTimeout(() => {
          setToasts((prev) => prev.filter(t => t.id !== detail.id || t.status !== 'success'));
        }, 6000);
      }
    };

    window.addEventListener('bg-sync-task', handleBgSync);
    return () => window.removeEventListener('bg-sync-task', handleBgSync);
  }, []);

  // URL parameters auto-load for printing specific LPB documents directly
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const queryLpb = params.get('lpb');
    if (queryLpb) {
      const getInitialPrint = async () => {
        try {
          const tokenToUse = token || localStorage.getItem('google_token') || '';
          const items = await fetchPenerimaanItems(tokenToUse);
          const matched = items.find(item => item.noLPB === queryLpb);
          if (matched) {
            setPrintData({
              noLPB: matched.noLPB,
              noPO: matched.noPO,
              kodeBarang: matched.kodeBarang,
              namaBarang: matched.namaBarang,
              qty: matched.qty,
              satuan: matched.satuan,
              hargaSatuan: matched.hargaSatuan,
              total: matched.total,
              supplier: matched.supplier,
              tanggal: matched.tanggal,
              diskon: matched.diskon,
              ppn: matched.ppn,
              verification: matched.verification,
              petugas: matched.petugas,
              printMode: (params.get('mode') as any) || 'all'
            });
          }
        } catch (e) {
          console.error('Gagal memuat otomatis dokumen LPB dari URL:', e);
        }
      };
      getInitialPrint();
    }
  }, [token]);

  // 1. On Mount: Load custom login session
  useEffect(() => {
    // Restore custom user session
    const savedUser = localStorage.getItem('custom_user');
    if (savedUser) {
      try {
        setCustomUser(JSON.parse(savedUser));
      } catch (e) {
        console.error('Error loading custom user session', e);
      }
    }
    setLoading(false);
  }, []);

  // Custom User Login
  const handleCustomLoginSuccess = (user: CustomUser) => {
    setCustomUser(user);
    localStorage.setItem('custom_user', JSON.stringify(user));
    setActiveTab('dashboard');
  };

  // Refresh logged-in user's role from database if connected to prevent stale cached roles
  useEffect(() => {
    if (token && customUser) {
      const refreshUserSession = async () => {
        try {
          const users = await fetchUsers(token);
          const freshUser = users.find(u => u.username.toLowerCase() === customUser.username.toLowerCase());
          if (freshUser) {
            const roleChanged = freshUser.role.toLowerCase() !== customUser.role.toLowerCase();
            const nameChanged = freshUser.nama !== customUser.nama;
            if (roleChanged || nameChanged) {
              console.log(`[SESSION REFRESH] User "${customUser.username}" data updated. New Role: ${freshUser.role}`);
              const updatedUser: CustomUser = {
                username: freshUser.username,
                role: freshUser.role as 'admin' | 'gudang',
                nama: freshUser.nama || freshUser.username
              };
              setCustomUser(updatedUser);
              localStorage.setItem('custom_user', JSON.stringify(updatedUser));
            }
          }
        } catch (e) {
          console.warn('Failed to refresh user session from USERS sheet:', e);
        }
      };
      refreshUserSession();
    }
  }, [token, customUser?.username]);

  // Enforce tab boundary strictly for gudang role, leaving admin completely unrestricted
  useEffect(() => {
    if (customUser) {
      const userRole = (customUser.role || '').trim().toLowerCase();
      if (userRole === 'gudang') {
        const allowedGudangTabs: TabType[] = ['dashboard', 'penerimaan', 'pengeluaran', 'spb', 'laporan'];
        if (!allowedGudangTabs.includes(activeTab)) {
          setActiveTab('dashboard');
        }
      }
    }
  }, [customUser, activeTab]);

  // Custom User Logout
  const handleCustomLogout = () => {
    setCustomUser(null);
    localStorage.removeItem('custom_user');
  };

  // Google connection is automatically and permanently managed by Apps Script Web App backend
  const handleGoogleConnect = async () => {
    console.log('Google connection is automatically managed by Apps Script Web App.');
  };

  const handleGoogleDisconnect = async () => {
    console.log('Google connection is automatically managed by Apps Script Web App.');
  };

  const handlePenerimaanSuccess = (data: any) => {
    setPrintData(data);
  };

  // Render toast notifications beautifully
  const renderToasts = () => {
    if (toasts.length === 0) return null;

    return (
      <div className="fixed bottom-6 right-6 z-100 flex flex-col gap-3 max-w-sm w-full pointer-events-none print:hidden">
        {toasts.map((toast) => {
          const isSuccess = toast.status === 'success';
          const isError = toast.status === 'error';
          const isTimeout = toast.status === 'timeout';
          const isLoading = toast.status === 'loading';

          return (
            <div
              key={toast.id}
              className={`pointer-events-auto p-4 rounded-xl border shadow-xl flex items-start gap-3 transition-all duration-300 transform translate-y-0 animate-in slide-in-from-bottom-5 bg-white ${
                isSuccess ? 'border-emerald-200 bg-emerald-50/90 text-emerald-900' :
                isError ? 'border-red-200 bg-red-50/90 text-red-900' :
                isTimeout ? 'border-amber-200 bg-amber-50/90 text-amber-900' :
                'border-indigo-100 bg-indigo-50/90 text-indigo-900'
              }`}
            >
              <div className="shrink-0 mt-0.5">
                {isLoading && <Loader2 className="h-5 w-5 animate-spin text-indigo-600" />}
                {isSuccess && <CheckCircle2 className="h-5 w-5 text-emerald-600" />}
                {isError && <AlertCircle className="h-5 w-5 text-red-600" />}
                {isTimeout && <Clock className="h-5 w-5 text-amber-600 animate-pulse" />}
              </div>
              <div className="flex-1">
                <p className="text-xs font-bold uppercase tracking-wide">
                  {isSuccess ? 'Sinkronisasi Berhasil' :
                   isError ? 'Sinkronisasi Gagal' :
                   isTimeout ? 'Koneksi Lambat' :
                   'Sinkronisasi Latar Belakang'}
                </p>
                <p className="text-[11px] font-medium leading-relaxed mt-0.5 opacity-90">
                  {toast.message}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setToasts((prev) => prev.filter(t => t.id !== toast.id))}
                className="shrink-0 text-slate-400 hover:text-slate-600 p-0.5 rounded-full transition"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          );
        })}
      </div>
    );
  };

  // If the URL pathname matches /cetak-lpb, render the dedicated printer component completely standalone
  if (window.location.pathname === '/cetak-lpb') {
    return <CetakLPB />;
  }

  // If in printing mode, render the print receipt view immediately
  if (printData) {
    return (
      <>
        <PrintLPB
          noLPB={printData.noLPB}
          noPO={printData.noPO}
          kodeBarang={printData.kodeBarang}
          namaBarang={printData.namaBarang}
          qty={printData.qty}
          satuan={printData.satuan}
          hargaSatuan={printData.hargaSatuan}
          total={printData.total}
          supplier={printData.supplier}
          tanggal={printData.tanggal}
          diskon={printData.diskon}
          ppn={printData.ppn}
          verification={printData.verification}
          petugas={printData.petugas}
          initialPrintMode={printData.printMode}
          onBack={() => setPrintData(null)}
        />
        {renderToasts()}
      </>
    );
  }

  // Render Login page if not authenticated on the custom username/password layer
  if (!customUser) {
    return (
      <LoginPage 
        token={token}
        onGoogleConnect={handleGoogleConnect}
        onGoogleDisconnect={handleGoogleDisconnect}
        onLoginSuccess={handleCustomLoginSuccess}
      />
    );
  }

  // Filter visible tabs based on user role (RBAC)
  // Ensures role checked is case-insensitive, and admin/Admin matches full access.
  const isGudang = (customUser.role || '').trim().toLowerCase() === 'gudang';

  const getTabTitle = () => {
    switch (activeTab) {
      case 'dashboard': return 'DASHBOARD MUTASI GUDANG';
      case 'penerimaan': return 'INPUT PENERIMAAN PO (LPB)';
      case 'pengeluaran': return 'INPUT PENGELUARAN BARANG (SKB)';
      case 'spb': return 'SURAT PERMINTAAN BARANG (SPB)';
      case 'master': return 'KATALOG MASTER BARANG';
      case 'user': return 'MANAJEMEN PENGGUNA (USERS)';
      case 'formulas': return 'FORMULA DASHBOARD & OTOMASI';
      case 'settings': return 'PENGATURAN BACKEND & INTEGRASI';
      default: return 'KYOKKO BEACH';
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex font-sans text-slate-900">
      
      {/* Desktop Left Sidebar Navigation */}
      <aside className="hidden md:flex flex-col w-64 bg-slate-900 text-slate-300 shrink-0 border-r border-slate-800">
        
        {/* Brand Header */}
        <div className="p-6 border-b border-slate-800 flex items-center gap-3 bg-slate-950">
          <div className="rounded-xl bg-indigo-600 p-2 text-white">
            <Warehouse className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-sm font-black text-white tracking-wider uppercase leading-none">
              KYOKKO BEACH
            </h1>
            <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider mt-1.5 block">
              Sistem Gudang & Logistik
            </span>
          </div>
        </div>

        {/* User Info Badge */}
        <div className="px-6 py-4 border-b border-slate-800/60 bg-slate-900/40 flex items-center gap-3">
          <div className="h-9 w-9 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold text-sm uppercase">
            {customUser.nama.slice(0, 2)}
          </div>
          <div className="flex flex-col truncate">
            <span className="text-xs font-bold text-white truncate">{customUser.nama}</span>
            <span className="inline-flex items-center gap-1 text-[9px] text-indigo-400 font-bold uppercase mt-0.5">
              <Shield className="h-2.5 w-2.5" />
              <span>{customUser.role}</span>
            </span>
          </div>
        </div>

        {/* Sidebar Navigation Links */}
        <nav className="flex-1 p-4 space-y-1">
          {/* 1. Dashboard Mutasi (All Roles) */}
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-xs font-bold transition cursor-pointer ${
              activeTab === 'dashboard'
                ? 'bg-indigo-600 text-white'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
            }`}
          >
            <Package className="h-4 w-4" />
            <span>Dashboard Mutasi</span>
          </button>

          {/* 2. Input Penerimaan (LPB) (All Roles) */}
          <button
            onClick={() => setActiveTab('penerimaan')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-xs font-bold transition cursor-pointer ${
              activeTab === 'penerimaan'
                ? 'bg-indigo-600 text-white'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
            }`}
          >
            <ClipboardList className="h-4 w-4" />
            <span>Penerimaan PO (LPB)</span>
          </button>

          {/* 3. Pengeluaran (SKB) (All Roles) */}
          <button
            onClick={() => setActiveTab('pengeluaran')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-xs font-bold transition cursor-pointer ${
              activeTab === 'pengeluaran'
                ? 'bg-indigo-600 text-white'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
            }`}
          >
            <TrendingDown className="h-4 w-4" />
            <span>Pengeluaran (SKB)</span>
          </button>

          {/* 4. Permintaan (SPB) (All Roles) */}
          <button
            onClick={() => setActiveTab('spb')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-xs font-bold transition cursor-pointer ${
              activeTab === 'spb'
                ? 'bg-indigo-600 text-white'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
            }`}
          >
            <ClipboardList className="h-4 w-4" />
            <span>Permintaan (SPB)</span>
          </button>

          {/* 5. Laporan (All Roles) */}
          <button
            onClick={() => setActiveTab('laporan')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-xs font-bold transition cursor-pointer ${
              activeTab === 'laporan'
                ? 'bg-indigo-600 text-white'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
            }`}
          >
            <FileSpreadsheet className="h-4 w-4" />
            <span>Laporan Stok & Mutasi</span>
          </button>

          {/* Admin / Manager Only Navigation Items */}
          {!isGudang && (
            <>
              {/* 4. Katalog Master */}
              <button
                onClick={() => setActiveTab('master')}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-xs font-bold transition cursor-pointer ${
                  activeTab === 'master'
                    ? 'bg-indigo-600 text-white'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                }`}
              >
                <Layers className="h-4 w-4" />
                <span>Katalog Master</span>
              </button>

              {/* 5. User Management */}
              <button
                onClick={() => setActiveTab('user')}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-xs font-bold transition cursor-pointer ${
                  activeTab === 'user'
                    ? 'bg-indigo-600 text-white'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                }`}
              >
                <Users className="h-4 w-4" />
                <span>Manajemen User</span>
              </button>

              {/* 6. Formula Dashboard */}
              <button
                onClick={() => setActiveTab('formulas')}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-xs font-bold transition cursor-pointer ${
                  activeTab === 'formulas'
                    ? 'bg-indigo-600 text-white'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                }`}
              >
                <FileSpreadsheet className="h-4 w-4" />
                <span>Formula Dashboard</span>
              </button>

              {/* 7. Settings Backend */}
              <button
                onClick={() => setActiveTab('settings')}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-xs font-bold transition cursor-pointer ${
                  activeTab === 'settings'
                    ? 'bg-indigo-600 text-white'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                }`}
              >
                <Settings className="h-4 w-4" />
                <span>Pengaturan Backend</span>
              </button>
            </>
          )}
        </nav>

        {/* Database Status card at bottom */}
        {!isGudang && (
          <div className="p-4 mt-auto space-y-2">
            <div className="bg-slate-950 border border-slate-800 rounded-lg p-4">
              <span className="text-[9px] text-slate-500 uppercase tracking-widest font-bold block mb-1">Google Sheets</span>
              <div className="flex items-center gap-2 text-[11px] font-semibold">
                <div className={`w-1.5 h-1.5 rounded-full ${token ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`}></div>
                <span className={token ? 'text-emerald-400' : 'text-amber-400'}>
                  {token ? 'Terhubung' : 'Offline / Terputus'}
                </span>
              </div>
              {token && (
                <a
                  href="https://docs.google.com/spreadsheets/d/1Qd3WWCAgsftGsVf1VMX-ZXgopA9QzYPL33VvpHMgn9o/edit?usp=sharing"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[10px] text-indigo-400 hover:text-indigo-300 transition block mt-2.5 underline"
                >
                  Open Spreadsheet ↗
                </a>
              )}
            </div>
          </div>
        )}
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 bg-slate-50 min-h-screen">
        
        {/* Top Header */}
        <header className="sticky top-0 z-40 bg-white border-b border-slate-200 h-16 shrink-0 flex items-center justify-between px-6 shadow-sm">
          
          <div className="flex items-center gap-3">
            {/* Mobile Sidebar Toggle and Brand Icon */}
            <div className="md:hidden flex items-center gap-2">
              <div className="rounded bg-indigo-600 p-1.5 text-white">
                <Warehouse className="h-4 w-4" />
              </div>
              <span className="text-xs font-black text-slate-900 uppercase tracking-wider">KYOKKO BEACH</span>
            </div>
            
            {/* Desktop Active Tab Title */}
            <div className="hidden md:block">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Operation Center</span>
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
                {getTabTitle()}
              </h2>
            </div>
          </div>

          {/* Top Header Right Actions */}
          <div className="flex items-center gap-4">
            
            {/* Real-time Google Sheets connection badge */}
            <div className="hidden sm:flex items-center gap-1.5 text-[10px] font-bold text-slate-500 bg-slate-100 rounded-lg px-2.5 py-1">
              <Database className={`h-3.5 w-3.5 ${token ? 'text-emerald-500' : 'text-amber-500'}`} />
              <span className="uppercase">{token ? 'Live Sync' : 'Lokal Mode'}</span>
            </div>

            {/* Profile and Logout info */}
            <div className="flex items-center gap-3">
              <div className="flex flex-col text-right">
                <span className="text-xs font-bold text-slate-950 leading-none">
                  {customUser.nama}
                </span>
                <span className="text-[9px] text-indigo-600 font-mono font-bold uppercase mt-0.5">
                  @{customUser.username} ({customUser.role})
                </span>
              </div>

              {/* Logout from system */}
              <button
                onClick={handleCustomLogout}
                className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                title="Keluar Sistem (Sign Out)"
              >
                <LogOut className="h-4.5 w-4.5" />
              </button>

              {/* Mobile Menu Toggle button */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2 text-slate-500 hover:bg-slate-100 rounded-lg md:hidden transition cursor-pointer"
              >
                {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </button>
            </div>
          </div>
        </header>

        {/* Mobile Navigation Dropdown Menu (RBAC Aware) */}
        {mobileMenuOpen && (
          <div className="md:hidden border-b border-slate-200 bg-white px-4 py-3 space-y-1.5 shadow-md">
            <button
              onClick={() => { setActiveTab('dashboard'); setMobileMenuOpen(false); }}
              className={`w-full flex items-center gap-2.5 px-4 py-2.5 text-xs font-bold rounded-lg ${
                activeTab === 'dashboard' ? 'bg-indigo-50 text-indigo-800' : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <Package className="h-4 w-4" />
              <span>Dashboard Mutasi</span>
            </button>
            
            <button
              onClick={() => { setActiveTab('penerimaan'); setMobileMenuOpen(false); }}
              className={`w-full flex items-center gap-2.5 px-4 py-2.5 text-xs font-bold rounded-lg ${
                activeTab === 'penerimaan' ? 'bg-indigo-50 text-indigo-800' : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <ClipboardList className="h-4 w-4" />
              <span>Penerimaan PO (LPB)</span>
            </button>

            <button
              onClick={() => { setActiveTab('pengeluaran'); setMobileMenuOpen(false); }}
              className={`w-full flex items-center gap-2.5 px-4 py-2.5 text-xs font-bold rounded-lg ${
                activeTab === 'pengeluaran' ? 'bg-indigo-50 text-indigo-800' : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <TrendingDown className="h-4 w-4" />
              <span>Pengeluaran (SKB)</span>
            </button>

            <button
              onClick={() => { setActiveTab('spb'); setMobileMenuOpen(false); }}
              className={`w-full flex items-center gap-2.5 px-4 py-2.5 text-xs font-bold rounded-lg ${
                activeTab === 'spb' ? 'bg-indigo-50 text-indigo-800' : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <ClipboardList className="h-4 w-4" />
              <span>Permintaan (SPB)</span>
            </button>

            <button
              onClick={() => { setActiveTab('laporan'); setMobileMenuOpen(false); }}
              className={`w-full flex items-center gap-2.5 px-4 py-2.5 text-xs font-bold rounded-lg ${
                activeTab === 'laporan' ? 'bg-indigo-50 text-indigo-800' : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <FileSpreadsheet className="h-4 w-4" />
              <span>Laporan Stok & Mutasi</span>
            </button>

            {!isGudang && (
              <>
                <button
                  onClick={() => { setActiveTab('master'); setMobileMenuOpen(false); }}
                  className={`w-full flex items-center gap-2.5 px-4 py-2.5 text-xs font-bold rounded-lg ${
                    activeTab === 'master' ? 'bg-indigo-50 text-indigo-800' : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <Layers className="h-4 w-4" />
                  <span>Katalog Master</span>
                </button>

                <button
                  onClick={() => { setActiveTab('user'); setMobileMenuOpen(false); }}
                  className={`w-full flex items-center gap-2.5 px-4 py-2.5 text-xs font-bold rounded-lg ${
                    activeTab === 'user' ? 'bg-indigo-50 text-indigo-800' : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <Users className="h-4 w-4" />
                  <span>Manajemen User</span>
                </button>

                <button
                  onClick={() => { setActiveTab('formulas'); setMobileMenuOpen(false); }}
                  className={`w-full flex items-center gap-2.5 px-4 py-2.5 text-xs font-bold rounded-lg ${
                    activeTab === 'formulas' ? 'bg-indigo-50 text-indigo-800' : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <FileSpreadsheet className="h-4 w-4" />
                  <span>Formula Dashboard</span>
                </button>

                <button
                  onClick={() => { setActiveTab('settings'); setMobileMenuOpen(false); }}
                  className={`w-full flex items-center gap-2.5 px-4 py-2.5 text-xs font-bold rounded-lg ${
                    activeTab === 'settings' ? 'bg-indigo-50 text-indigo-800' : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <Settings className="h-4 w-4" />
                  <span>Pengaturan Backend</span>
                </button>
              </>
            )}
          </div>
        )}

        {/* Main Content Area Body */}
        <main className="flex-1 overflow-y-auto p-6 md:p-8">
          
          {/* Active Tab View Rendering with token check guard */}
          {(!token && !isGudang) && (
            <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 p-4 text-xs font-medium text-amber-800 flex items-center justify-between gap-3 shadow-xs">
              <div className="flex items-center gap-2">
                <Database className="h-4 w-4 text-amber-500 shrink-0" />
                <span>Koneksi Google Sheets terputus. Aplikasi berjalan dalam mode lokal/offline. Data mutasi tidak akan tersinkronisasi.</span>
              </div>
              <button 
                onClick={handleGoogleConnect}
                className="bg-amber-600 hover:bg-amber-700 text-white font-bold px-3 py-1.5 rounded-lg text-[10px] transition shrink-0 cursor-pointer"
              >
                Hubungkan Google
              </button>
            </div>
          )}

          <div className="animate-in fade-in duration-200">
            {activeTab === 'dashboard' && <Dashboard token={token || ''} />}
            {activeTab === 'penerimaan' && (
              <PenerimaanForm token={token || ''} appUrl={appUrl} onSuccess={handlePenerimaanSuccess} />
            )}
            {activeTab === 'pengeluaran' && <PengeluaranForm token={token || ''} />}
            {activeTab === 'spb' && <SPBTab token={token || ''} />}
            {activeTab === 'laporan' && <LaporanTab token={token || ''} />}
            
            {!isGudang && (
              <>
                {activeTab === 'master' && <MasterTab token={token || ''} />}
                {activeTab === 'user' && <UsersTab token={token} />}
                {activeTab === 'formulas' && <FormulasTab />}
                {activeTab === 'settings' && <SettingsTab />}
              </>
            )}
          </div>
        </main>

        {/* Horizontal Footer */}
        <footer className="bg-white border-t border-slate-200 py-6 print:hidden mt-auto">
          <div className="px-8 flex flex-col sm:flex-row justify-between items-center gap-3 text-xs text-slate-400">
            <div className="flex flex-col items-center sm:items-start">
              <p>© 2026 Kyokko Beach Gudang Logistik. Powered by Kyokko Beach.</p>
              <p className="text-[10px] text-slate-300 mt-1 font-mono">Build Terbaru: {(import.meta as any).env?.VITE_BUILD_DATE || 'Mode Pengembangan'}</p>
            </div>
            {token && !isGudang && (
              <div className="flex gap-4">
                <a 
                  href="https://docs.google.com/spreadsheets/d/1Qd3WWCAgsftGsVf1VMX-ZXgopA9QzYPL33VvpHMgn9o/edit?usp=sharing" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="hover:text-indigo-600 transition font-medium underline"
                >
                  Buka Google Sheets Database ↗
                </a>
              </div>
            )}
          </div>
        </footer>
        {renderToasts()}
      </div>
    </div>
  );
}
