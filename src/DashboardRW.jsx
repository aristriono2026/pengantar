import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { db } from './firebase'
import { collection, query, where, doc, updateDoc, onSnapshot } from 'firebase/firestore'

export default function DashboardRW() {
  const navigate = useNavigate()
  
  const [activeMenu, setActiveMenu] = useState('antrean') 
  // State untuk menyimpan data yang diambil dari Firestore
  const [semuaSurat, setSemuaSurat] = useState([])
  const [searchKata, setSearchKata] = useState('')
  const [filterArsip, setFilterArsip] = useState('Semua')

  const [suratReview, setSuratReview] = useState(null)
  const [modeTolak, setModeTolak] = useState(false)
  const [alasanTolak, setAlasanTolak] = useState('')

  const [passData, setPassData] = useState({ oldPass: '', newPass: '', confirmPass: '' })

  // LISTENER REAL-TIME FIREBASE UNTUK ANTRIAN RW
  useEffect(() => {
    // Menarik seluruh data surat yang tidak lagi berstatus "Draft"
    const q = query(collection(db, "surat"), where("status", "in", ["Menunggu RW", "Disetujui RW", "Ditolak"]));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const suratData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      // Urutkan manual: yang terbaru paling atas
      suratData.sort((a, b) => b.timestamp - a.timestamp);
      setSemuaSurat(suratData);
    });
    return () => unsubscribe();
  }, []);

  const filteredPending = semuaSurat.filter(s => s.status === 'Menunggu RW' && (s.nama.toLowerCase().includes(searchKata.toLowerCase()) || s.nik.includes(searchKata)))
  const filteredArsip = semuaSurat.filter(s => s.status !== 'Menunggu RW' && (filterArsip === 'Semua' || s.status === filterArsip) && (s.nama.toLowerCase().includes(searchKata.toLowerCase()) || s.nik.includes(searchKata)))

  // MENGUBAH STATUS MENJADI DISETUJUI KE DATABASE
  const handleSetujui = async () => {
    try {
      const suratRef = doc(db, "surat", suratReview.id);
      await updateDoc(suratRef, { status: "Disetujui RW" });
      setSuratReview(null)
      alert(`Surat untuk ${suratReview.nama} berhasil disetujui (Tersimpan di Cloud).`)
    } catch (error) {
      alert("Gagal mengupdate persetujuan ke database.");
    }
  }

  // MENGIRIM KEPUTUSAN PENOLAKAN KE DATABASE
  const handleTolak = async () => {
    if (!alasanTolak.trim()) return alert("Alasan penolakan wajib diisi!")
    try {
      const suratRef = doc(db, "surat", suratReview.id);
      await updateDoc(suratRef, { status: "Ditolak", alasan_tolak: alasanTolak });
      setSuratReview(null)
      setModeTolak(false)
      setAlasanTolak('')
      alert(`Surat ditolak & dikembalikan ke RT terkait.`)
    } catch (error) {
      alert("Gagal mengirim penolakan ke database.");
    }
  }

  const handleUbahPassword = (e) => {
    e.preventDefault()
    if (passData.newPass !== passData.confirmPass) return alert("Password baru tidak cocok!")
    alert("Sistem Manajemen Password belum terintegrasi Firebase Auth (Simulasi Sukses).")
    setPassData({ oldPass: '', newPass: '', confirmPass: '' })
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20 md:pb-10 relative">
      
      {/* HEADER DESKTOP */}
      <nav className="hidden md:flex bg-green-700 text-white p-4 shadow-md justify-between items-center sticky top-0 z-40">
        <div><h1 className="text-xl font-bold">Dasbor Ketua RW 05</h1><p className="text-xs text-green-100">Kel. Tambakreja</p></div>
        <div className="flex gap-4 items-center">
          <button onClick={() => setActiveMenu('antrean')} className={`font-bold pb-1 ${activeMenu === 'antrean' ? 'border-b-2 border-white' : 'text-green-200'}`}>Antrean (Live DB)</button>
          <button onClick={() => setActiveMenu('arsip')} className={`font-bold pb-1 ${activeMenu === 'arsip' ? 'border-b-2 border-white' : 'text-green-200'}`}>Arsip DB</button>
          <button onClick={() => setActiveMenu('profil')} className={`font-bold pb-1 ${activeMenu === 'profil' ? 'border-b-2 border-white' : 'text-green-200'}`}>Profil</button>
        </div>
      </nav>

      {/* HEADER MOBILE */}
      <div className="md:hidden bg-green-700 text-white p-4 shadow-sm sticky top-0 z-40">
        <h1 className="text-lg font-bold">Dasbor Ketua RW 05</h1>
        <p className="text-[10px] text-green-100 uppercase tracking-widest">{activeMenu}</p>
      </div>

      <div className="max-w-4xl mx-auto mt-6 px-4 space-y-6">
        
        {/* ================= MENU 1: ANTREAN ================= */}
        {activeMenu === 'antrean' && (
          <div className="animate-fade-in-up">
            <div className="bg-orange-50 border border-orange-200 p-4 rounded-xl mb-4">
              <h2 className="font-bold text-orange-800">Antrean Cloud ({filteredPending.length})</h2>
              <p className="text-xs text-orange-600 mt-1">Periksa seluruh 13 item data dan dokumen warga dari database.</p>
            </div>
            
            <div className="grid gap-4">
              {filteredPending.length === 0 ? (
                <div className="text-center text-gray-500 py-10 bg-white rounded-xl border border-gray-100">Antrean verifikasi dari database kosong.</div>
              ) : (
                filteredPending.map(surat => (
                  <div key={surat.id} className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
                    <div className="flex justify-between border-b pb-2 mb-2">
                      <span className="font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded text-xs">{surat.rt_pengaju}</span>
                      <span className="text-xs text-gray-500">{surat.tanggal}</span>
                    </div>
                    <div className="font-bold text-gray-800 text-lg">{surat.nama}</div>
                    <div className="text-sm text-gray-600 mb-3">Keperluan: <b>{surat.keperluan}</b></div>
                    
                    <button onClick={() => {setSuratReview(surat); setModeTolak(false); setAlasanTolak('')}} className="w-full bg-green-600 hover:bg-green-700 text-white py-2.5 rounded-lg font-bold text-sm shadow-sm active:scale-95 transition-transform">
                      Verifikasi 13 Item Data
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* ================= MENU 2: ARsip ================= */}
        {activeMenu === 'arsip' && (
          <div className="animate-fade-in-up">
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 mb-4 flex flex-col gap-2">
              <input type="text" placeholder="Cari Nama/NIK..." value={searchKata} onChange={(e) => setSearchKata(e.target.value)} className="w-full p-2.5 border border-gray-300 rounded-lg text-sm outline-none" />
              <select value={filterArsip} onChange={(e) => setFilterArsip(e.target.value)} className="w-full p-2.5 border border-gray-300 rounded-lg text-sm bg-white outline-none">
                <option value="Semua">Semua Status</option><option value="Disetujui RW">Disetujui</option><option value="Ditolak">Ditolak</option>
              </select>
            </div>

            <div className="grid gap-4">
              {filteredArsip.length === 0 ? (
                <div className="text-center text-gray-500 py-10 bg-white rounded-xl border border-gray-100">Arsip database kosong.</div>
              ) : (
                filteredArsip.map(surat => (
                  <div key={surat.id} className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
                    <div className="flex justify-between border-b pb-2 mb-2">
                      <span className="font-bold text-gray-600 text-xs">{surat.rt_pengaju}</span>
                      {surat.status === 'Disetujui RW' ? <span className="text-green-600 text-xs font-bold bg-green-50 px-2 py-0.5 rounded">DISETUJUI</span> : <span className="text-red-600 text-xs font-bold bg-red-50 px-2 py-0.5 rounded">DITOLAK</span>}
                    </div>
                    <div className="font-bold text-gray-800 text-lg">{surat.nama}</div>
                    <div className="text-sm text-gray-600 mb-3">Keperluan: <b>{surat.keperluan}</b></div>
                    
                    {surat.status === 'Ditolak' && <div className="text-xs text-red-600 bg-red-50 p-2 rounded mb-3 border border-red-100"><b>Alasan:</b> {surat.alasan_tolak}</div>}

                    {surat.status === 'Disetujui RW' && (
                      <button onClick={() => navigate('/cetak', { state: surat })} className="w-full bg-blue-100 text-blue-700 border border-blue-300 py-2 rounded-lg font-bold text-sm">Cetak PDF</button>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* ================= MENU 3: PROFIL ================= */}
        {activeMenu === 'profil' && (
          <div className="animate-fade-in-up space-y-6 max-w-md mx-auto">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 text-center">
              <div className="w-20 h-20 bg-green-100 text-green-700 rounded-full flex items-center justify-center mx-auto mb-3 text-2xl font-bold">RW</div>
              <h2 className="text-xl font-bold text-gray-800">Ketua RW 05</h2>
              <p className="text-sm text-gray-500">Kelurahan Tambakreja</p>
            </div>
            
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
              <h3 className="font-bold text-gray-800 mb-4">Ubah Password</h3>
              <form onSubmit={handleUbahPassword} className="space-y-4">
                <div><label className="block text-xs font-semibold mb-1">Password Lama</label><input type="password" value={passData.oldPass} onChange={(e)=>setPassData({...passData, oldPass: e.target.value})} required className="w-full p-2.5 border border-gray-300 rounded-lg text-sm" /></div>
                <div><label className="block text-xs font-semibold mb-1">Password Baru</label><input type="password" value={passData.newPass} onChange={(e)=>setPassData({...passData, newPass: e.target.value})} required className="w-full p-2.5 border border-gray-300 rounded-lg text-sm" minLength="6" /></div>
                <div><label className="block text-xs font-semibold mb-1">Konfirmasi Password Baru</label><input type="password" value={passData.confirmPass} onChange={(e)=>setPassData({...passData, confirmPass: e.target.value})} required className="w-full p-2.5 border border-gray-300 rounded-lg text-sm" minLength="6" /></div>
                <button type="submit" className="w-full bg-green-600 text-white font-bold py-3 rounded-xl text-sm shadow-md">Simpan Password Baru</button>
              </form>
            </div>

            <button onClick={() => navigate('/')} className="w-full bg-red-100 text-red-600 border border-red-200 font-bold py-4 rounded-xl text-sm shadow-sm flex items-center justify-center gap-2">Keluar (Logout)</button>
          </div>
        )}

      </div>

      {/* BOTTOM NAV BAR (MOBILE) */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 flex justify-around p-2 pb-safe z-50 shadow-[0_-5px_15px_rgba(0,0,0,0.05)]">
        <button onClick={() => setActiveMenu('antrean')} className={`flex flex-col items-center w-full py-1 ${activeMenu === 'antrean' ? 'text-green-700' : 'text-gray-400'}`}>
          <svg className="w-6 h-6 mb-1" fill={activeMenu === 'antrean' ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg><span className="text-[10px] font-bold">Antrean</span>
        </button>
        <button onClick={() => setActiveMenu('arsip')} className={`flex flex-col items-center w-full py-1 ${activeMenu === 'arsip' ? 'text-green-700' : 'text-gray-400'}`}>
          <svg className="w-6 h-6 mb-1" fill={activeMenu === 'arsip' ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4"></path></svg><span className="text-[10px] font-bold">Arsip DB</span>
        </button>
        <button onClick={() => setActiveMenu('profil')} className={`flex flex-col items-center w-full py-1 ${activeMenu === 'profil' ? 'text-green-700' : 'text-gray-400'}`}>
          <svg className="w-6 h-6 mb-1" fill={activeMenu === 'profil' ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg><span className="text-[10px] font-bold">Profil</span>
        </button>
      </div>

      {/* ========================================================= */}
      {/* MODAL VERIFIKASI DENGAN 13 ITEM LENGKAP */}
      {/* ========================================================= */}
      {suratReview && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-3 bg-black/70 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-fade-in-up">
            
            {/* Header Modal */}
            <div className="p-4 bg-green-700 text-white flex justify-between items-center">
              <div>
                <h3 className="font-bold text-base">Verifikasi Database</h3>
                <p className="text-xs text-green-100">No. Surat: {suratReview.nomor_surat}</p>
              </div>
              <button onClick={()=>setSuratReview(null)} className="text-white hover:text-gray-200 font-bold text-lg px-2">✕</button>
            </div>

            {/* Isi Detail 13 Item Data */}
            <div className="p-5 overflow-y-auto space-y-4 flex-1 text-sm bg-gray-50">
              {!modeTolak ? (
                <>
                  <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm space-y-3">
                    <h4 className="font-bold text-green-800 border-b pb-2 text-xs uppercase tracking-wider">Rincian Data Warga (13 Poin)</h4>
                    
                    <div className="grid grid-cols-3 gap-1"><span className="text-gray-500 text-xs">1. Nama</span><span className="col-span-2 font-bold text-gray-800">: {suratReview.nama} ({suratReview.jk})</span></div>
                    <div className="grid grid-cols-3 gap-1"><span className="text-gray-500 text-xs">2. TTL</span><span className="col-span-2 text-gray-800">: {suratReview.ttl}</span></div>
                    <div className="grid grid-cols-3 gap-1"><span className="text-gray-500 text-xs">3. WN / Agama</span><span className="col-span-2 text-gray-800">: {suratReview.kewarganegaraan} / {suratReview.agama}</span></div>
                    <div className="grid grid-cols-3 gap-1"><span className="text-gray-500 text-xs">4. Status Kawin</span><span className="col-span-2 text-gray-800">: {suratReview.status_kawin}</span></div>
                    <div className="grid grid-cols-3 gap-1"><span className="text-gray-500 text-xs">5. Pekerjaan</span><span className="col-span-2 text-gray-800">: {suratReview.pekerjaan}</span></div>
                    <div className="grid grid-cols-3 gap-1"><span className="text-gray-500 text-xs">6. Nama KK</span><span className="col-span-2 text-gray-800">: {suratReview.namaKK}</span></div>
                    <div className="grid grid-cols-3 gap-1"><span className="text-gray-500 text-xs">7. Hub. Keluarga</span><span className="col-span-2 text-gray-800">: {suratReview.hubunganKK}</span></div>
                    <div className="grid grid-cols-3 gap-1"><span className="text-gray-500 text-xs">8. Alamat</span><span className="col-span-2 text-gray-800">: {suratReview.tempatTinggal}</span></div>
                    <div className="grid grid-cols-3 gap-1"><span className="text-gray-500 text-xs">9. Kabupaten</span><span className="col-span-2 text-gray-800">: {suratReview.kabupaten}</span></div>
                    <div className="grid grid-cols-3 gap-1"><span className="text-gray-500 text-xs">10. NIK (KTP)</span><span className="col-span-2 font-bold text-blue-700">: {suratReview.nik}</span></div>
                    <div className="grid grid-cols-3 gap-1 bg-blue-50 p-2 rounded"><span className="text-blue-900 font-bold text-xs">11. Keperluan</span><span className="col-span-2 font-bold text-blue-900">: {suratReview.keperluan}</span></div>
                    <div className="grid grid-cols-3 gap-1"><span className="text-gray-500 text-xs">12. Masa Berlaku</span><span className="col-span-2 text-gray-800">: {suratReview.berlakuMulai}</span></div>
                    <div className="grid grid-cols-3 gap-1"><span className="text-gray-500 text-xs">13. Keterangan</span><span className="col-span-2 text-gray-800">: {suratReview.keterangan}</span></div>
                  </div>

                  <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                    <h4 className="font-bold text-gray-700 text-xs uppercase tracking-wider mb-2">Status Lampiran Berkas</h4>
                    <div className="flex gap-2">
                      <span className={`px-2.5 py-1 rounded text-xs font-bold ${suratReview.lampiran?.ktp ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-400'}`}>KTP {suratReview.lampiran?.ktp ? '✓' : '✗'}</span>
                      <span className={`px-2.5 py-1 rounded text-xs font-bold ${suratReview.lampiran?.kk ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-400'}`}>KK {suratReview.lampiran?.kk ? '✓' : '✗'}</span>
                      <span className={`px-2.5 py-1 rounded text-xs font-bold ${suratReview.lampiran?.lain ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-400'}`}>Lainnya {suratReview.lampiran?.lain ? '✓' : '✗'}</span>
                    </div>
                  </div>
                </>
              ) : (
                <div className="bg-white p-4 rounded-xl border border-red-200 space-y-3">
                  <h4 className="font-bold text-red-700 text-xs uppercase tracking-wider">Form Alasan Penolakan</h4>
                  <p className="text-xs text-gray-600">Berikan catatan atau alasan mengapa surat ini ditolak agar Ketua RT dapat segera memperbaikinya.</p>
                  <textarea value={alasanTolak} onChange={(e)=>setAlasanTolak(e.target.value)} placeholder="Contoh: KTP buram / Keperluan kurang lengkap..." className="w-full p-3 border border-red-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-red-500" rows="4" required></textarea>
                </div>
              )}
            </div>

            {/* Footer Aksi Modal */}
            <div className="p-4 bg-white border-t flex gap-3">
              {!modeTolak ? (
                <>
                  <button onClick={()=>setModeTolak(true)} className="flex-1 bg-white border border-red-500 hover:bg-red-50 text-red-600 font-bold py-3 rounded-xl text-sm transition-all active:scale-95">Tolak Surat</button>
                  <button onClick={handleSetujui} className="flex-[2] bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-xl text-sm shadow-md transition-all active:scale-95">Setujui & Sahkan DB</button>
                </>
              ) : (
                <>
                  <button onClick={()=>setModeTolak(false)} className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 font-bold py-3 rounded-xl text-sm transition-all">Batal</button>
                  <button onClick={handleTolak} className="flex-[2] bg-red-600 hover:bg-red-700 text-white font-bold py-3 rounded-xl text-sm shadow-md transition-all active:scale-95">Kirim Penolakan ke RT</button>
                </>
              )}
            </div>

          </div>
        </div>
      )}
    </div>
  )
}