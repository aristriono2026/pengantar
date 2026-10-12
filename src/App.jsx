import { useState } from 'react'
import { Routes, Route, useNavigate } from 'react-router-dom'
import DashboardRT from './DashboardRT'
import DashboardRW from './DashboardRW'
import CetakSurat from './CetakSurat'

// Komponen Halaman Login
function Login() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [errorMsg, setErrorMsg] = useState('')
  const navigate = useNavigate()

  const handleLogin = (e) => {
    e.preventDefault() 
    setErrorMsg('')

    if (password !== '123456') {
      setErrorMsg('Password salah! (Gunakan: 123456)')
      return
    }

    const user = username.toLowerCase().trim()

    if (user.startsWith('rt')) {
      const rtNumber = parseInt(user.replace('rt', ''))
      if (rtNumber >= 1 && rtNumber <= 13) {
        navigate('/rt') 
      } else {
        setErrorMsg('Akun RT tidak valid. Hanya RT 01 sampai 13.')
      }
    } else if (user === 'rw05' || user === 'admin') {
      navigate('/rw') 
    } else {
      setErrorMsg('Username tidak ditemukan.')
    }
  }

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4 sm:p-8">
      <div className="bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col md:flex-row w-full max-w-4xl border border-gray-100">
        
        {/* Kolom Kiri - Desain Banner */}
        <div className="bg-blue-600 md:w-1/2 p-8 md:p-12 text-white flex flex-col justify-center items-center text-center relative">
          <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mb-6 backdrop-blur-sm border border-white/30 shadow-lg">
            <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
          </div>
          <h1 className="text-3xl font-bold mb-3 tracking-wide">E-Surat Warga</h1>
          <p className="text-blue-100 mb-8 text-sm md:text-base leading-relaxed">Sistem Terintegrasi Pelayanan Formulir Surat Pengantar Tingkat RT/RW</p>
          <div className="mt-auto"><p className="text-sm font-medium text-white bg-blue-700/50 px-4 py-2 rounded-full border border-blue-500/50">Kelurahan Tambakreja, Cilacap Selatan</p></div>
        </div>

        {/* Kolom Kanan - Form Login */}
        <div className="md:w-1/2 p-8 md:p-12 flex flex-col justify-center bg-white">
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Selamat Datang</h2>
            <p className="text-gray-500 text-sm">Silakan login menggunakan akun yang telah diberikan.</p>
          </div>

          {errorMsg && (
            <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 text-sm rounded-lg">
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
                placeholder="Contoh: rt04 atau rw05" 
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

            <button type="submit" className="w-full mt-2 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 px-4 rounded-xl shadow-md transform transition-all active:scale-95 flex justify-center items-center gap-2">
              <span>Masuk Sistem</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}

// Pengatur Rute Utama (Router)
export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Login />} />
      <Route path="/rt" element={<DashboardRT />} />
      <Route path="/rw" element={<DashboardRW />} />
      <Route path="/cetak" element={<CetakSurat />} />
    </Routes>
  )
}