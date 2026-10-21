import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from './firebase'; // Pastikan path ini sesuai dengan file firebase.js Anda

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  // KODE YANG BENAR
const handleLogin = async (e) => {
  e.preventDefault();
  try {
    // 1. Ambil teks dari inputan dan hilangkan spasi berlebih
    let emailLogin = username.trim().toLowerCase();

    // 2. Cek apakah user sudah mengetik '@'. Jika belum, tambahkan otomatis
    if (!emailLogin.includes('@')) {
      emailLogin += '@rw05.com';
    }

    // 3. Gunakan 'emailLogin' yang sudah diformat untuk login, BUKAN 'username'
    const userCredential = await signInWithEmailAndPassword(auth, emailLogin, password);
    const user = userCredential.user;

    const userDoc = await getDoc(doc(db, "users", user.uid));
    
    if (userDoc.exists()) {
      const data = userDoc.data();
      localStorage.setItem("role", data.role || "Admin");
      localStorage.setItem("currentUserRT", data.rt_number || "");
      window.location.reload();
    } else {
      alert("Data pengguna tidak ditemukan di Firestore!");
    }
  } catch (error) {
    alert("Gagal login: " + error.message);
  }
};

  const inputClass = "w-full p-4 bg-blue-950/40 border border-cyan-500/30 text-cyan-50 rounded-xl outline-none focus:ring-2 focus:ring-cyan-400 focus:bg-blue-900/60 transition-all placeholder-cyan-700 font-mono tracking-wider";
  const labelClass = "block font-semibold text-cyan-300 mb-2 text-xs uppercase tracking-widest";

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-cyan-950 flex items-center justify-center p-4 selection:bg-cyan-500 selection:text-white">
      
      {/* ORNAMEN DEKORASI FUTURISTIK */}
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-cyan-400 to-blue-600"></div>
      <div className="absolute top-20 left-20 w-72 h-72 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-20 right-20 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none"></div>

      <div className="max-w-md w-full bg-white/5 backdrop-blur-2xl border border-white/10 p-10 rounded-3xl shadow-[0_8px_32px_0_rgba(31,38,135,0.37)] relative z-10">
        
        {/* LOGO / HEADER */}
        <div className="text-center mb-10">
          <div className="w-20 h-20 bg-gradient-to-br from-cyan-400 to-blue-600 rounded-2xl mx-auto mb-6 flex items-center justify-center shadow-[0_0_20px_rgba(6,182,212,0.4)] border border-cyan-300/30">
            <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path></svg>
          </div>
          <h1 className="text-2xl font-black text-white tracking-widest">E - PANTAR <span className="text-cyan-400">RW 05</span></h1>
          <p className="text-cyan-500/70 text-xs mt-2 uppercase tracking-widest font-bold">Elektronik - Pengantar RW.05</p>
          <p className="text-cyan-500/70 text-xs mt-2 uppercase tracking-widest font-bold">Kelurahan Tambakreja</p>
        </div>

        {error && (
          <div className="bg-rose-500/10 border border-rose-500/50 text-rose-400 p-4 rounded-xl mb-6 text-xs text-center font-bold tracking-wider">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label className={labelClass}>Username ID</label>
            <input 
              type="text" 
              value={username} 
              onChange={(e) => setUsername(e.target.value)} 
              placeholder="Contoh: rt04 atau rw05" 
              required 
              className={inputClass} 
              autoComplete="off"
            />
          </div>

          <div>
            <label className={labelClass}>Kode Keamanan (Password)</label>
            <input 
              type="password" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              placeholder="••••••••" 
              required 
              className={inputClass} 
            />
          </div>

          <button 
            type="submit" 
            disabled={isLoading} 
            className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-black py-4 rounded-xl mt-4 shadow-[0_0_20px_rgba(6,182,212,0.4)] tracking-widest uppercase transition-all disabled:opacity-50"
          >
            {isLoading ? 'MEMVERIFIKASI...' : 'OTORISASI MASUK'}
          </button>
        </form>

        <div className="mt-8 text-center border-t border-cyan-500/20 pt-6">
          <p className="text-cyan-500/50 text-[10px] uppercase tracking-widest font-bold">
            Pemerintah Kabupaten Cilacap<br/>Kecamatan Cilacap Selatan
          </p>
        </div>
      </div>
    </div>
  );
}