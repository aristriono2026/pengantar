import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, db, firebaseConfig } from './firebase';
import { collection, getDocs, setDoc, doc, deleteDoc } from 'firebase/firestore';
import { initializeApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword, signOut } from 'firebase/auth';

const secondaryApp = initializeApp(firebaseConfig, "SecondaryApp");
const secondaryAuth = getAuth(secondaryApp);

const ExternalLinkIcon = () => (
  <svg className="w-3 h-3 text-current opacity-70" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
);

export default function DashboardAdmin() {
  const navigate = useNavigate();
  const [usersList, setUsersList] = useState([]);
  
  const [username, setUsername] = useState(''); 
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('RT');
  const [rtNumber, setRtNumber] = useState('01');
  const [loading, setLoading] = useState(false);

  const fetchUsers = async () => {
    const querySnapshot = await getDocs(collection(db, "users"));
    setUsersList(querySnapshot.docs.map(doc => ({ uid: doc.id, ...doc.data() })));
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleBuatAkun = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      let emailDaftar = username.trim().toLowerCase();
      if (!emailDaftar.includes('@')) {
        emailDaftar = emailDaftar + '@rw05.com';
      }

      const userCredential = await createUserWithEmailAndPassword(secondaryAuth, emailDaftar, password);
      const newUid = userCredential.user.uid;

      const userData = { 
        username: username.trim(), 
        role: role,
        password_plain: password 
      };
      if (role === 'RT') userData.rt_number = rtNumber;
      
      await setDoc(doc(db, "users", newUid), userData);
      await signOut(secondaryAuth);
      
      alert("Akun berhasil dibuat!");
      setUsername(''); setPassword('');
      fetchUsers();
    } catch (error) {
      alert("Gagal membuat akun: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleHapusAkun = async (uid, namaUser) => {
    if (window.confirm(`Yakin ingin MENGHAPUS akun "${namaUser}"?\nPengguna ini tidak akan bisa login lagi ke sistem.`)) {
      try {
        await deleteDoc(doc(db, "users", uid));
        alert("Akun berhasil dihapus dan akses dicabut.");
        fetchUsers();
      } catch (error) {
        alert("Gagal menghapus akun: " + error.message);
      }
    }
  };

  const handleLogout = () => {
    auth.signOut();
    localStorage.clear();
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50 font-sans text-gray-800 pb-10 flex flex-col">
      <div className="flex-1 p-4 md:p-8 max-w-6xl mx-auto w-full space-y-8 relative z-10">
        
        {/* HEADER GLASSMORPHISM */}
        <div className="flex justify-between items-center bg-white/60 backdrop-blur-xl border border-white/50 text-blue-900 p-5 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-400 rounded-xl flex items-center justify-center text-white shadow-lg shadow-blue-500/30">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path></svg>
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-black tracking-tight">Dasbor Administrator</h1>
              <p className="text-xs font-semibold text-blue-600/80 uppercase tracking-widest">Sistem Manajemen Akun</p>
            </div>
          </div>
          <button onClick={handleLogout} className="bg-white/50 hover:bg-red-50 text-red-600 border border-red-100 px-5 py-2.5 rounded-2xl font-bold text-sm transition-all shadow-sm">Logout</button>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          
          {/* KARTU BUAT AKUN */}
          <div className="md:col-span-1 bg-white/60 backdrop-blur-xl p-6 md:p-8 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white/60 h-fit sticky top-8">
            <h2 className="font-extrabold mb-6 text-blue-900 text-lg flex items-center gap-2">
              <span className="bg-blue-100 text-blue-600 p-1.5 rounded-lg"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"></path></svg></span>
              Buat Akun Baru
            </h2>
            <form onSubmit={handleBuatAkun} className="space-y-5 text-sm">
              <div>
                <label className="block font-bold text-blue-900/80 mb-2">Username</label>
                <input type="text" value={username} onChange={e => setUsername(e.target.value)} required className="w-full p-3.5 bg-white/50 backdrop-blur-sm border border-blue-100 rounded-2xl focus:ring-2 focus:ring-blue-400 focus:bg-white outline-none transition-all shadow-inner" placeholder="Contoh: RT01" />
              </div>
              <div>
                <label className="block font-bold text-blue-900/80 mb-2">Password (Min 6 Karakter)</label>
                <input type="text" value={password} onChange={e => setPassword(e.target.value)} required className="w-full p-3.5 bg-white/50 backdrop-blur-sm border border-blue-100 rounded-2xl focus:ring-2 focus:ring-blue-400 focus:bg-white outline-none transition-all shadow-inner" placeholder="Ketik password..." />
              </div>
              <div>
                <label className="block font-bold text-blue-900/80 mb-2">Role Akun</label>
                <select value={role} onChange={e => setRole(e.target.value)} className="w-full p-3.5 bg-white/50 backdrop-blur-sm border border-blue-100 rounded-2xl focus:ring-2 focus:ring-blue-400 focus:bg-white outline-none transition-all shadow-inner">
                  <option value="RT">Ketua RT</option>
                  <option value="RW">Ketua RW</option>
                  <option value="Admin">Administrator</option>
                </select>
              </div>
              {role === 'RT' && (
                <div>
                  <label className="block font-bold text-blue-900/80 mb-2">Pilih RT (Contoh: 04)</label>
                  <input type="text" value={rtNumber} onChange={e => setRtNumber(e.target.value)} required className="w-full p-3.5 bg-white/50 backdrop-blur-sm border border-blue-100 rounded-2xl focus:ring-2 focus:ring-blue-400 focus:bg-white outline-none transition-all shadow-inner" maxLength="3" />
                </div>
              )}
              <button type="submit" disabled={loading} className="w-full bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white font-bold py-4 rounded-2xl shadow-lg shadow-blue-500/30 transition-all hover:-translate-y-0.5 mt-2">{loading ? 'Memproses...' : 'Buat Akun Sekarang'}</button>
            </form>
          </div>

          {/* TABEL MANAJEMEN */}
          <div className="md:col-span-2 bg-white/60 backdrop-blur-xl p-6 md:p-8 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white/60 overflow-hidden flex flex-col">
            <h2 className="font-extrabold mb-6 text-blue-900 text-lg flex items-center gap-2">
              <span className="bg-blue-100 text-blue-600 p-1.5 rounded-lg"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"></path></svg></span>
              Manajemen Akun Terdaftar
            </h2>
            <div className="overflow-x-auto bg-white/40 rounded-2xl border border-white/50">
              <table className="w-full text-left text-sm border-collapse">
                <thead>
                  <tr className="border-b border-blue-100/50">
                    <th className="p-4 font-bold text-blue-900/60 uppercase tracking-wider text-xs">Username</th>
                    <th className="p-4 font-bold text-red-500/80 uppercase tracking-wider text-xs">Password</th>
                    <th className="p-4 font-bold text-blue-900/60 uppercase tracking-wider text-xs">Role / RT</th>
                    <th className="p-4 font-bold text-blue-900/60 uppercase tracking-wider text-xs text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {usersList.map((user, index) => (
                    <tr key={user.uid} className={`border-b border-blue-50/50 hover:bg-white/50 transition-colors ${index % 2 === 0 ? 'bg-transparent' : 'bg-blue-50/20'}`}>
                      <td className="p-4 font-bold text-blue-900">{user.username || user.email}</td>
                      <td className="p-4 font-mono font-bold text-red-500">{user.password_plain || 'Disembunyikan'}</td>
                      <td className="p-4">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-gradient-to-r from-blue-500/10 to-cyan-500/10 text-blue-700 font-bold rounded-lg border border-blue-500/20 text-xs">
                          {user.role} {user.rt_number && `(RT ${user.rt_number})`}
                        </span>
                      </td>
                      <td className="p-4 text-center">
                        <button onClick={() => handleHapusAkun(user.uid, user.username || user.email)} className="bg-white hover:bg-red-50 text-red-500 border border-red-100 hover:border-red-200 px-4 py-2 rounded-xl font-bold text-xs transition-all shadow-sm">Hapus</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-xs text-blue-900/40 mt-5 font-medium italic text-center">* Jika ingin mengedit akun, silakan Hapus akun lama dan Buat Akun Baru.</p>
          </div>
        </div>
      </div>

      {/* FOOTER */}
      <footer className="no-print mt-auto bg-white/40 backdrop-blur-xl border-t border-white/60 py-8 text-blue-900 shadow-[0_-8px_30px_rgb(0,0,0,0.02)] relative z-10">
        <div className="max-w-6xl mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-6 text-center md:text-left">
          <div>
            <p className="font-extrabold text-blue-900 text-lg tracking-wider">RUKUN WARGA 05</p>
            <p className="text-xs text-blue-800/70 mt-1 font-semibold max-w-sm">Kelurahan Tambakreja, Kecamatan Cilacap Selatan, Kabupaten Cilacap</p>
          </div>

          <div className="flex flex-wrap items-center gap-3 justify-center md:justify-end">
            <a href="https://www.instagram.com/rw_05_tambakreja" target="_blank" rel="noopener noreferrer"
               className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-tr from-amber-500 via-pink-600 to-purple-600 text-white font-bold rounded-2xl transition-all shadow-lg hover:shadow-pink-500/30 hover:-translate-y-0.5 text-xs">
              <svg className="w-4 h-4 fill-current shrink-0" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
              <span>@rw_05_tambakreja</span>
              <ExternalLinkIcon />
            </a>

            <a href="https://www.tiktok.com/@rw_05_tambakreja" target="_blank" rel="noopener noreferrer"
               className="flex items-center gap-2 px-5 py-2.5 bg-black/80 hover:bg-black text-white font-bold rounded-2xl transition-all shadow-lg hover:shadow-black/20 hover:-translate-y-0.5 text-xs">
              <img src="https://upload.wikimedia.org/wikipedia/commons/3/34/Ionicons_logo-tiktok.svg" alt="TikTok" className="w-4 h-4 shrink-0 brightness-0 invert" />
              <span>@rw_05_tambakreja</span>
              <ExternalLinkIcon />
            </a>
          </div>
        </div>
        
        {/* Teks Powered By AI & Created By */}
        <div className="mt-8 pt-6 border-t border-blue-900/10 text-center flex flex-col items-center justify-center gap-1.5">
          <p className="text-[10px] font-bold text-blue-800/40 uppercase tracking-widest">Powered by AI</p>
          <p className="text-xs font-bold text-blue-900 bg-white/60 px-4 py-1.5 rounded-full border border-white shadow-sm">Created by Aris Triono</p>
        </div>
      </footer>
    </div>
  );
}