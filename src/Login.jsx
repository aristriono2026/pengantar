import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, db } from './firebase';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      // 1. Login menggunakan Firebase Auth
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // 2. Ambil data Role dari Firestore (koleksi "users")
      const userDoc = await getDoc(doc(db, "users", user.uid));
      
      if (userDoc.exists()) {
        const userData = userDoc.data();
        // Simpan data ke localStorage agar bisa dibaca di Dasbor
        localStorage.setItem("userRole", userData.role);
        if (userData.rt_number) localStorage.setItem("currentUserRT", userData.rt_number);

        // 3. Arahkan ke Dasbor yang sesuai
        if (userData.role === 'Admin') navigate('/admin');
        else if (userData.role === 'RT') navigate('/dashboard-rt');
        else if (userData.role === 'RW') navigate('/dashboard-rw');
        
      } else {
        alert("Akun tidak memiliki hak akses sistem.");
        auth.signOut();
      }
    } catch (error) {
      alert("Login Gagal! Periksa Email dan Password. (" + error.message + ")");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-2xl shadow-lg w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-blue-700">Sistem Administrasi RW 05</h1>
          <p className="text-sm text-gray-500">Kelurahan Tambakreja, Cilacap</p>
        </div>
        
        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Email</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="w-full p-3 border border-gray-300 rounded-lg outline-none focus:border-blue-500" placeholder="admin@rw05.com" />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Password</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required className="w-full p-3 border border-gray-300 rounded-lg outline-none focus:border-blue-500" placeholder="••••••••" />
          </div>
          <button type="submit" disabled={loading} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg transition-all">
            {loading ? 'Memeriksa...' : 'Masuk ke Sistem'}
          </button>
        </form>
      </div>
    </div>
  );
}