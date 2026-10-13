import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, db, firebaseConfig } from './firebase';
import { collection, getDocs, setDoc, doc, deleteDoc } from 'firebase/firestore';
import { initializeApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword, signOut } from 'firebase/auth';

// Membuat aplikasi firebase sekunder untuk registrasi agar Admin tidak ter-logout
const secondaryApp = initializeApp(firebaseConfig, "SecondaryApp");
const secondaryAuth = getAuth(secondaryApp);

export default function DashboardAdmin() {
  const navigate = useNavigate();
  const [usersList, setUsersList] = useState([]);
  
  const [email, setEmail] = useState('');
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
      // 1. Buat user di Firebase Auth (menggunakan secondary auth)
      const userCredential = await createUserWithEmailAndPassword(secondaryAuth, email, password);
      const newUid = userCredential.user.uid;

      // 2. Simpan Role dan data RT di Firestore koleksi "users"
      const userData = { email, role };
      if (role === 'RT') userData.rt_number = rtNumber;
      
      await setDoc(doc(db, "users", newUid), userData);
      
      // 3. Logout akun dari secondary auth
      await signOut(secondaryAuth);
      
      alert("Akun berhasil dibuat!");
      setEmail(''); setPassword('');
      fetchUsers();
    } catch (error) {
      alert("Gagal membuat akun: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    auth.signOut();
    localStorage.clear();
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex justify-between items-center bg-blue-800 text-white p-5 rounded-2xl shadow">
          <h1 className="text-xl font-bold">Dasbor Administrator</h1>
          <button onClick={handleLogout} className="bg-red-500 px-4 py-2 rounded-lg font-bold text-sm">Logout</button>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {/* Form Buat Akun */}
          <div className="md:col-span-1 bg-white p-5 rounded-2xl shadow-sm border">
            <h2 className="font-bold mb-4">Buat Akun Baru</h2>
            <form onSubmit={handleBuatAkun} className="space-y-4 text-sm">
              <div>
                <label className="block font-semibold mb-1">Email</label>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} required className="w-full p-2.5 border rounded-lg" />
              </div>
              <div>
                <label className="block font-semibold mb-1">Password (Min 6 Karakter)</label>
                <input type="password" value={password} onChange={e => setPassword(e.target.value)} required className="w-full p-2.5 border rounded-lg" />
              </div>
              <div>
                <label className="block font-semibold mb-1">Role Akun</label>
                <select value={role} onChange={e => setRole(e.target.value)} className="w-full p-2.5 border rounded-lg">
                  <option value="RT">Ketua RT</option>
                  <option value="RW">Ketua RW</option>
                  <option value="Admin">Administrator</option>
                </select>
              </div>
              {role === 'RT' && (
                <div>
                  <label className="block font-semibold mb-1">Pilih RT (Contoh: 04)</label>
                  <input type="text" value={rtNumber} onChange={e => setRtNumber(e.target.value)} required className="w-full p-2.5 border rounded-lg" maxLength="3" />
                </div>
              )}
              <button type="submit" disabled={loading} className="w-full bg-blue-600 text-white font-bold py-3 rounded-lg">{loading ? 'Memproses...' : 'Buat Akun'}</button>
            </form>
          </div>

          {/* Tabel Daftar Akun */}
          <div className="md:col-span-2 bg-white p-5 rounded-2xl shadow-sm border">
            <h2 className="font-bold mb-4">Daftar Akun Terdaftar</h2>
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="bg-gray-100">
                  <th className="p-3 border-b">Email</th>
                  <th className="p-3 border-b">Role</th>
                  <th className="p-3 border-b">Detail (RT)</th>
                </tr>
              </thead>
              <tbody>
                {usersList.map(user => (
                  <tr key={user.uid} className="border-b">
                    <td className="p-3">{user.email}</td>
                    <td className="p-3 font-bold text-blue-600">{user.role}</td>
                    <td className="p-3">{user.rt_number ? `RT ${user.rt_number}` : '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}