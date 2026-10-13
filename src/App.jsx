import { useState } from 'react'
import { Routes, Route, useNavigate, Navigate } from 'react-router-dom'
import DashboardRT from './DashboardRT'
import DashboardRW from './DashboardRW'
import DashboardAdmin from './DashboardAdmin'
import CetakSurat from './CetakSurat'
import { auth, db } from './firebase'
import { signInWithEmailAndPassword } from 'firebase/auth'
import { doc, getDoc } from 'firebase/firestore'

function Login() {
  const [username, setUsername] = useState('') // Diubah jadi username
  const [password, setPassword] = useState('')
  const [errorMsg, setErrorMsg] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const handleLogin = async (e) => {
    e.preventDefault() 
    setErrorMsg('')
    setLoading(true)

    try {
      // TRIK: Jika yang diketik tidak mengandung "@", tambahkan "@rw05.com" otomatis
      let emailLogin = username.trim().toLowerCase();
      if (!emailLogin.includes('@')) {
        emailLogin = emailLogin + '@rw05.com';
      }

      const userCredential = await signInWithEmailAndPassword(auth, emailLogin, password);
      const user = userCredential.user;

      const userDoc = await getDoc(doc(db, "users", user.uid));
      
      if (userDoc.exists()) {
        const userData = userDoc.data();
        localStorage.setItem("userRole", userData.role);
        if (userData.rt_number) localStorage.setItem("currentUserRT", userData.rt_number);

        if (userData.role === 'Admin') navigate('/admin');
        else if (userData.role === 'RT') navigate('/rt');
        else if (userData.role === 'RW') navigate('/rw');
        
      } else {
        setErrorMsg("Akun tidak memiliki hak akses sistem di database.");
        auth.signOut();
      }
    } catch (error) {
      setErrorMsg("Login Gagal! Pastikan Username dan Password benar.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4 sm:p-8">
      <div className="bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col md:flex-row w-full max-w-4xl border border-gray-100">
        
        <div className="bg-blue-600 md:w-1/2 p-8 md:p-12 text-white flex flex-col justify-center items-center text-center relative">
          <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mb-6 backdrop-blur-sm border border-white/30 shadow-lg">
            <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
          </div>
          <h1 className="text-3xl font-bold mb-3 tracking-wide">E-PENGANTAR RW.05</h1>
          <p className="text-blue-100 mb-8 text-sm md:text-base leading-relaxed">Sistem Terintegrasi Pelayanan Formulir Surat Pengantar Tingkat RT/RW 05</p>
          <div className="mt-auto"><p className="text-sm font-medium text-white bg-blue-700/50 px-4 py-2 rounded-full border border-blue-500/50">Kelurahan Tambakreja, Cilacap Selatan</p></div>
        </div>

        <div className="md:w-1/2 p-8 md:p-12 flex flex-col justify-center bg-white">
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Selamat Datang</h2>
            <p className="text-gray-500 text-sm">Silakan login menggunakan akun yang telah diberikan.</p>
          </div>

          {errorMsg && (
            <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 text-sm rounded-lg font-semibold">
              {errorMsg}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Username</label>
              <input 
                type="text" 
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white transition-all text-gray-800"
                placeholder="Contoh: admin atau RT04" 
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Password</label>
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white transition-all text-gray-800"
                placeholder="••••••••" 
                required
              />
            </div>

            <button disabled={loading} type="submit" className="w-full mt-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-bold py-3.5 px-4 rounded-xl shadow-md transform transition-all active:scale-95 flex justify-center items-center gap-2">
              <span>{loading ? 'Memeriksa Kredensial...' : 'Masuk Sistem'}</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Login />} />
      <Route path="/admin" element={<DashboardAdmin />} />
      <Route path="/rt" element={<DashboardRT />} />
      <Route path="/rw" element={<DashboardRW />} />
      <Route path="/cetak" element={<CetakSurat />} />
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  )
}