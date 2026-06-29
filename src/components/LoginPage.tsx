import React, { useState, useEffect } from 'react';
import { fetchUsers, UserItem, DEFAULT_USERS, fetchBackgroundImage } from '../sheets-api';
import { 
  Warehouse, 
  User, 
  Lock, 
  Eye, 
  EyeOff, 
  LogIn, 
  ShieldAlert, 
  Database,
  Loader2,
  CheckCircle2,
  RefreshCw
} from 'lucide-react';

interface LoginPageProps {
  token: string | null;
  onGoogleConnect: () => Promise<void>;
  onGoogleDisconnect: () => Promise<void>;
  onLoginSuccess: (user: { username: string; role: 'admin' | 'gudang'; nama: string }) => void;
}

export default function LoginPage({ token, onGoogleConnect, onGoogleDisconnect, onLoginSuccess }: LoginPageProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  const [bgImageUrl, setBgImageUrl] = useState<string>('');
  
  const [userList, setUserList] = useState<UserItem[]>(DEFAULT_USERS);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Load user data and background image from sheet or cache
  useEffect(() => {
    async function loadBackgroundAndUsers() {
      // Load background
      try {
        const bgUrl = await fetchBackgroundImage(token || '');
        setBgImageUrl(bgUrl);
      } catch (err) {
        console.error('Failed to load background image:', err);
      }

      if (!token) {
        // Let's load the cached users if they exist in localStorage!
        const cachedUsersStr = localStorage.getItem('offline_users');
        if (cachedUsersStr) {
          try {
            setUserList(JSON.parse(cachedUsersStr));
          } catch (e) {
            setUserList(DEFAULT_USERS);
          }
        } else {
          setUserList(DEFAULT_USERS);
        }
        return;
      }

      try {
        setLoadingUsers(true);
        const users = await fetchUsers(token);
        setUserList(users);
      } catch (err) {
        console.error('Failed to load USERS from sheet', err);
        const cachedUsersStr = localStorage.getItem('offline_users');
        if (cachedUsersStr) {
          try {
            setUserList(JSON.parse(cachedUsersStr));
          } catch (e) {
            setUserList(DEFAULT_USERS);
          }
        } else {
          setUserList(DEFAULT_USERS);
        }
      } finally {
        setLoadingUsers(false);
      }
    }

    loadBackgroundAndUsers();
  }, [token]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const cleanUsername = username.trim().toLowerCase();
    const cleanPassword = password.trim();

    if (!cleanUsername || !cleanPassword) {
      setErrorMessage('Username dan Password tidak boleh kosong.');
      return;
    }

    // Find user in user list
    const foundUser = userList.find(
      u => u.username.toLowerCase() === cleanUsername && (u.password === cleanPassword || !u.password)
    );

    if (foundUser) {
      console.log(`[LOGIN SUCCESS] User: ${foundUser.username}, Role: ${foundUser.role}, Nama: ${foundUser.nama}`);
      onLoginSuccess({
        username: foundUser.username,
        role: foundUser.role,
        nama: foundUser.nama || foundUser.username
      });
    } else {
      setErrorMessage('Username atau Password salah. Silakan coba lagi.');
    }
  };

  return (
    <div 
      className={`min-h-screen relative flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 ${
        bgImageUrl ? 'bg-cover bg-center' : 'bg-slate-900'
      }`}
      style={bgImageUrl ? { backgroundImage: `url(${bgImageUrl})` } : undefined}
    >
      {/* Dark overlay for beautiful contrast */}
      {bgImageUrl && <div className="absolute inset-0 bg-black/50 pointer-events-none" />}
      
      {/* Brand Header */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center relative z-10">
        <div className="inline-flex rounded-2xl bg-indigo-600 p-3.5 text-white shadow-lg shadow-indigo-600/10">
          <Warehouse className="h-8 w-8" />
        </div>
        <h2 className="mt-6 text-2xl font-extrabold text-white uppercase tracking-tight">
          AKSES SISTEM KYOKKO BEACH
        </h2>
        <p className="mt-2 text-xs font-semibold text-indigo-400 uppercase tracking-wider">
          Sistem Manajemen Gudang & Logistik
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="bg-white py-8 px-6 shadow-xl rounded-2xl border border-slate-100 space-y-6 sm:px-10">
          
          <div className="border-b border-slate-100 pb-3">
            <h3 className="text-base font-bold text-slate-800">
              Silakan Masuk
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Gunakan kredensial akun Anda untuk mengakses sistem pergudangan Kyokko Beach.
            </p>
          </div>



          {errorMessage && (
            <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-xs font-medium text-rose-800 flex items-start gap-2.5 animate-in fade-in duration-150">
              <ShieldAlert className="h-4 w-4 text-rose-500 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          <form className="space-y-4" onSubmit={handleSubmit}>
            {/* Username */}
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                Username
              </label>
              <div className="relative rounded-lg shadow-xs">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <User className="h-4 w-4" />
                </div>
                <input
                  id="username"
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="block w-full pl-10 pr-3.5 py-2.5 text-sm rounded-lg border border-slate-200 bg-white placeholder-slate-400 text-slate-900 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition"
                  placeholder="Ketik username Anda..."
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                Password
              </label>
              <div className="relative rounded-lg shadow-xs">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="h-4 w-4" />
                </div>
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-10 pr-10 py-2.5 text-sm rounded-lg border border-slate-200 bg-white placeholder-slate-400 text-slate-900 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 transition"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="w-full flex justify-center items-center gap-2 py-3 px-4 border border-transparent rounded-lg text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 shadow-sm transition cursor-pointer mt-2"
            >
              <LogIn className="h-4 w-4" />
              <span>Masuk Sistem</span>
            </button>
          </form>

          <div className="border-t border-slate-100 pt-6 space-y-4">
            <div className="text-center">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2">INTEGRASI DATABASE GOOGLE SHEETS</span>
            </div>
            
            <div className="flex items-center justify-between p-2.5 rounded-lg border border-emerald-100 bg-emerald-50/50 text-xs">
              <div className="flex items-center gap-2 text-emerald-800 font-medium">
                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                <span>Web App Backend Aktif</span>
              </div>
              <span className="text-[9px] font-bold text-emerald-600 bg-emerald-100/50 px-1.5 py-0.5 rounded font-mono">CONNECTED</span>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
