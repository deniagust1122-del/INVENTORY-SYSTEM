import React, { useState, useEffect } from 'react';
import { fetchUsers, appendUserRow, UserItem, DEFAULT_USERS } from '../sheets-api';
import { 
  Users, 
  UserPlus, 
  Shield, 
  RefreshCw, 
  Loader2, 
  CheckCircle2, 
  AlertCircle,
  KeyRound,
  UserCheck
} from 'lucide-react';

interface UsersTabProps {
  token: string | null;
}

export default function UsersTab({ token }: UsersTabProps) {
  const [users, setUsers] = useState<UserItem[]>(DEFAULT_USERS);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Form fields
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newRole, setNewRole] = useState<'admin' | 'gudang'>('gudang');
  const [newNama, setNewNama] = useState('');

  const loadUsers = async (isSilent = false) => {
    if (!token) {
      setUsers(DEFAULT_USERS);
      return;
    }
    try {
      if (!isSilent) setLoading(true);
      else setRefreshing(true);
      setError(null);

      const fetched = await fetchUsers(token);
      setUsers(fetched);
    } catch (err: any) {
      console.error(err);
      setError('Gagal mengambil data user dari Google Sheets.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, [token]);

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUsername.trim() || !newPassword.trim()) {
      alert('Username dan Password tidak boleh kosong.');
      return;
    }

    const exists = users.some(u => u.username.toLowerCase() === newUsername.trim().toLowerCase());
    if (exists) {
      alert('Username sudah terdaftar! Gunakan username unik.');
      return;
    }

    try {
      setSubmitting(true);
      await appendUserRow(
        {
          username: newUsername.trim(),
          password: newPassword.trim(),
          role: newRole,
          nama: newNama.trim() || newUsername.trim()
        },
        token || ''
      );

      // Reset form
      setNewUsername('');
      setNewPassword('');
      setNewNama('');
      setNewRole('gudang');

      // Reload
      await loadUsers(true);
      if (!token) {
        alert('User baru berhasil disimpan di database LOKAL browser Anda!');
      } else {
        alert('User baru berhasil ditambahkan ke database USERS Google Sheets!');
      }
    } catch (err: any) {
      console.error(err);
      alert(`Gagal menambahkan user: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
        <div>
          <h2 className="text-base font-bold text-slate-800 uppercase tracking-wide">
            Manajemen Pengguna (USERS)
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Daftar pengguna dan konfigurasi Role-Based Access Control (RBAC) pada sistem WarehouseOS.
          </p>
        </div>
        <button
          type="button"
          onClick={() => loadUsers(true)}
          disabled={refreshing}
          className="inline-flex items-center gap-2 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 px-4 py-2 rounded-lg text-xs font-bold transition disabled:opacity-60 cursor-pointer"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? 'animate-spin' : ''}`} />
          <span>Sinkronkan User</span>
        </button>
      </div>

      <div className="grid gap-8 lg:grid-cols-12">
        {/* New User Form */}
        <div className="lg:col-span-5">
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs space-y-6">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-3 flex items-center gap-2">
              <UserPlus className="h-4.5 w-4.5 text-indigo-600" />
              <span>Tambah User Baru</span>
            </h3>

            {!token && (
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-xs text-amber-800 space-y-2">
                <div className="flex gap-2">
                  <AlertCircle className="h-4.5 w-4.5 text-amber-500 shrink-0" />
                  <span className="font-bold">Google Sheets Tidak Terhubung</span>
                </div>
                <p className="leading-relaxed">
                  Aplikasi sedang berjalan secara lokal. User baru akan disimpan secara lokal di browser Anda. Hubungkan Google Sheets untuk sinkronisasi permanen.
                </p>
              </div>
            )}

            <form onSubmit={handleAddUser} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">
                    Username (Huruf Kecil, Unik)
                  </label>
                  <input
                    type="text"
                    required
                    value={newUsername}
                    onChange={(e) => setNewUsername(e.target.value.toLowerCase().replace(/\s+/g, ''))}
                    placeholder="Contoh: agus_gudang"
                    className="w-full rounded-lg border border-slate-200 px-3.5 py-2 text-xs font-medium focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">
                    Password
                  </label>
                  <input
                    type="text"
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Ketik password user..."
                    className="w-full rounded-lg border border-slate-200 px-3.5 py-2 text-xs font-mono focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">
                    Nama Lengkap / Panggilan
                  </label>
                  <input
                    type="text"
                    required
                    value={newNama}
                    onChange={(e) => setNewNama(e.target.value)}
                    placeholder="Contoh: Agus Setiawan"
                    className="w-full rounded-lg border border-slate-200 px-3.5 py-2 text-xs focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">
                    Hak Akses / Role (RBAC)
                  </label>
                  <select
                    value={newRole}
                    onChange={(e) => setNewRole(e.target.value as 'admin' | 'gudang')}
                    className="w-full rounded-lg border border-slate-200 px-3.5 py-2 text-xs focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition bg-white"
                  >
                    <option value="gudang">Petugas Gudang (Akses Terbatas)</option>
                    <option value="admin">Admin / Manager (Akses Penuh)</option>
                  </select>
                  <p className="text-[10px] text-slate-400 leading-relaxed mt-1.5">
                    * <strong>Gudang:</strong> Hanya diizinkan mengakses Dashboard Mutasi, Penerimaan LPB, dan Pengeluaran SKB. <br />
                    * <strong>Admin:</strong> Memiliki akses penuh ke seluruh menu sistem.
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full rounded-lg bg-indigo-600 py-3 text-xs font-bold text-white hover:bg-indigo-700 shadow-sm transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-65"
                >
                  {submitting ? 'Menyimpan...' : 'Simpan User Baru'}
                </button>
              </form>
          </div>
        </div>

        {/* User Accounts List */}
        <div className="lg:col-span-7">
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs flex flex-col min-h-[400px]">
            <div className="border-b border-slate-100 pb-3 mb-4 flex justify-between items-center">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <Users className="h-4.5 w-4.5 text-indigo-600" />
                <span>Akun Pengguna Terdaftar</span>
              </h3>
              <span className="text-[10px] bg-slate-100 text-slate-600 font-bold px-2 py-0.5 rounded-full">
                {users.length} Akun
              </span>
            </div>

            {loading ? (
              <div className="flex h-64 flex-col items-center justify-center gap-2">
                <Loader2 className="h-6 w-6 animate-spin text-indigo-600" />
                <span className="text-xs text-slate-500">Memuat database pengguna...</span>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-600">
                  <thead className="bg-slate-50 text-[10px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-100">
                    <tr>
                      <th className="p-3">Nama Pengguna</th>
                      <th className="p-3">Username</th>
                      <th className="p-3">Password</th>
                      <th className="p-3 text-center">Role / Akses</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {users.map((u) => (
                      <tr key={u.username} className="hover:bg-slate-50/50 transition">
                        <td className="p-3 font-semibold text-slate-800 flex items-center gap-2">
                          <div className="h-7 w-7 rounded-full bg-indigo-50 text-indigo-700 flex items-center justify-center text-[10px] font-black uppercase">
                            {String(u.nama || '').slice(0, 2) || String(u.username || '').slice(0, 2)}
                          </div>
                          <span>{u.nama || u.username}</span>
                        </td>
                        <td className="p-3 font-mono text-indigo-600 font-medium">
                          @{u.username}
                        </td>
                        <td className="p-3 font-mono text-slate-400">
                          {u.password ? '••••••••' : '(Tidak Ada)'}
                        </td>
                        <td className="p-3 text-center">
                          <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                            u.role === 'admin' 
                              ? 'bg-indigo-100 text-indigo-800' 
                              : 'bg-amber-100 text-amber-800'
                          }`}>
                            <Shield className="h-3 w-3" />
                            <span>{u.role}</span>
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
