import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { db } from './firebase'
import { collection, query, where, getDocs, addDoc, updateDoc, doc, onSnapshot } from 'firebase/firestore'

export default function DashboardRT() {
  const navigate = useNavigate()
  const currentUserRT = "04" 

  const [activeMenu, setActiveMenu] = useState('beranda') 
  const [cariNik, setCariNik] = useState('')
  const [statusPencarian, setStatusPencarian] = useState(null) 
  
  // Data riwayat surat diambil langsung dari Firestore (kosong saat inisialisasi)
  const [riwayatSurat, setRiwayatSurat] = useState([])
  const [suratReview, setSuratReview] = useState(null)
  const [centangSetuju, setCentangSetuju] = useState(false)
  const [filterStatus, setFilterStatus] = useState('Semua')
  const [searchKata, setSearchKata] = useState('')
  const [editModeId, setEditModeId] = useState(null)
  
  const [formData, setFormData] = useState({
    nik: '', nama: '', jk: 'Lk', ttl: '', kewarganegaraan: 'WNI', agama: 'Islam', status_kawin: 'Belum Kawin', 
    pekerjaan: '', namaKK: '', hubunganKK: '', tempatTinggal: '', kabupaten: 'Cilacap Propinsi Jawa Tengah', keperluan: '', berlakuMulai: '', keterangan: ''
  })
  const [dokumen, setDokumen] = useState({ fotoKTP: null, fotoKK: null, filePendukung: [] })
  const [passData, setPassData] = useState({ oldPass: '', newPass: '', confirmPass: '' })

  // MENDENGARKAN PERUBAHAN SURAT RT 04 SECARA REAL-TIME DARI FIRESTORE
  useEffect(() => {
    const q = query(collection(db, "surat"), where("rt_pengaju", "==", `RT ${currentUserRT}`));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const suratData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      // Mengurutkan berdasarkan waktu (terbaru di atas)
      suratData.sort((a, b) => b.timestamp - a.timestamp);
      setRiwayatSurat(suratData);
    });
    return () => unsubscribe();
  }, []);

  const setTanggalBerlaku = () => {
    const hariIni = new Date(); const batasBerlaku = new Date(hariIni); batasBerlaku.setMonth(batasBerlaku.getMonth() + 3); 
    const formatTgl = (tgl) => tgl.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
    return `${formatTgl(hariIni)} s/d ${formatTgl(batasBerlaku)}`;
  }

  // PENCARIAN NIK KE DATABASE WARGA
  const handleCari = async (e) => {
    e.preventDefault()
    if (!cariNik) return

    setEditModeId(null) 
    const nikBersih = cariNik.trim()

    try {
      const q = query(collection(db, "warga"), where("nik", "==", nikBersih));
      const querySnapshot = await getDocs(q);

      setDokumen({ fotoKTP: null, fotoKK: null, filePendukung: [] })
      const formBerkas = document.getElementById('formBerkas')
      if (formBerkas) formBerkas.reset()

      if (!querySnapshot.empty) {
        let wargaDitemukan = null;
        querySnapshot.forEach((doc) => { wargaDitemukan = doc.data(); });
        setStatusPencarian('ketemu')
        setFormData({ ...wargaDitemukan, kabupaten: 'Cilacap Propinsi Jawa Tengah', keperluan: '', berlakuMulai: setTanggalBerlaku(), keterangan: '' })
      } else {
        setStatusPencarian('baru')
        setFormData({ 
          nik: nikBersih, nama: '', jk: 'Lk', ttl: '', kewarganegaraan: 'WNI', agama: 'Islam', status_kawin: 'Belum Kawin', pekerjaan: '', namaKK: '', hubunganKK: '', tempatTinggal: '', kabupaten: 'Cilacap Propinsi Jawa Tengah', keperluan: '', berlakuMulai: setTanggalBerlaku(), keterangan: '' 
        })
      }
    } catch (error) {
      console.error("Gagal mengambil data dari Firebase:", error);
      alert("Terjadi kesalahan koneksi database.");
    }
  }

  const handleEdit = (surat) => {
    setActiveMenu('beranda') 
    setEditModeId(surat.id)
    setStatusPencarian('edit')
    setFormData({
      nik: surat.nik || '', nama: surat.nama || '', jk: surat.jk || 'Lk', ttl: surat.ttl || '', kewarganegaraan: surat.kewarganegaraan || 'WNI', agama: surat.agama || 'Islam', status_kawin: surat.status_kawin || 'Belum Kawin', pekerjaan: surat.pekerjaan || '', namaKK: surat.namaKK || '', hubunganKK: surat.hubunganKK || '', tempatTinggal: surat.tempatTinggal || '', kabupaten: surat.kabupaten || 'Cilacap Propinsi Jawa Tengah', keperluan: surat.keperluan || '', berlakuMulai: surat.berlakuMulai || setTanggalBerlaku(), keterangan: surat.keterangan || ''
    })
    setDokumen({ fotoKTP: null, fotoKK: null, filePendukung: [] })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value })
  const handleFileChange = (e) => {
    if (e.target.name === 'filePendukung') setDokumen({ ...dokumen, filePendukung: Array.from(e.target.files) })
    else setDokumen({ ...dokumen, [e.target.name]: e.target.files[0] })
  }

  // SIMPAN DRAFT KE FIRESTORE
  const handleSubmitDraft = async (e) => {
    e.preventDefault()
    
    const payloadSurat = {
      rt_pengaju: `RT ${currentUserRT}`,
      nik: formData.nik, nama: formData.nama, jk: formData.jk, ttl: formData.ttl, kewarganegaraan: formData.kewarganegaraan, agama: formData.agama, status_kawin: formData.status_kawin, pekerjaan: formData.pekerjaan, namaKK: formData.namaKK, hubunganKK: formData.hubunganKK, tempatTinggal: formData.tempatTinggal, kabupaten: formData.kabupaten, keperluan: formData.keperluan, berlakuMulai: formData.berlakuMulai, keterangan: formData.keterangan,
      status: "Draft",
      tanggal: new Date().toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' }),
      timestamp: Date.now(),
      lampiran: { ktp: !!dokumen.fotoKTP, kk: !!dokumen.fotoKK, lain: (dokumen.filePendukung.length > 0) }
    }

    try {
      if (editModeId) {
        const suratRef = doc(db, "surat", editModeId);
        await updateDoc(suratRef, payloadSurat);
        alert(`Data berhasil diperbaiki ke database (Status: DRAFT).`);
        setEditModeId(null)
      } else {
        const tahunIni = new Date().getFullYear()
        const suratTahunIni = riwayatSurat.filter(s => s.tanggal && s.tanggal.includes(tahunIni))
        payloadSurat.nomor_surat = `148 / ${String(suratTahunIni.length + 1).padStart(3, '0')} / ${currentUserRT} / RW.05 / ${tahunIni}`;
        
        await addDoc(collection(db, "surat"), payloadSurat);
        alert(`Nomor Surat: ${payloadSurat.nomor_surat} berhasil dibuat (Status: DRAFT).`);
      }
      setStatusPencarian(null); setCariNik(''); setActiveMenu('arsip')
    } catch (error) {
      alert("Gagal menyimpan ke database.");
      console.error(error);
    }
  }

  // MENGUBAH STATUS MENJADI 'Menunggu RW' DI FIRESTORE
  const handleKirimKeRW = async () => {
    try {
      const suratRef = doc(db, "surat", suratReview.id);
      await updateDoc(suratRef, { status: "Menunggu RW" });
      setSuratReview(null);
      alert(`Sukses! Surat resmi dikirim ke sistem RW.`);
    } catch (error) {
      alert("Gagal mengirim surat ke RW.");
    }
  }

  const handleUbahPassword = (e) => {
    e.preventDefault()
    if (passData.newPass !== passData.confirmPass) return alert("Password baru tidak cocok!")
    alert("Sistem Manajemen Password belum terintegrasi Firebase Auth (Simulasi Sukses).")
    setPassData({ oldPass: '', newPass: '', confirmPass: '' })
  }

  const filteredRiwayat = riwayatSurat.filter(surat => {
    const matchStatus = filterStatus === 'Semua' || surat.status === filterStatus
    const matchSearch = surat.nama.toLowerCase().includes(searchKata.toLowerCase()) || surat.nik.includes(searchKata)
    return matchStatus && matchSearch
  })

  return (
    <div className="min-h-screen bg-gray-50 pb-20 md:pb-10 relative">
      <nav className="hidden md:flex bg-blue-600 text-white p-4 shadow-md justify-between items-center sticky top-0 z-40">
        <div><h1 className="text-xl font-bold">Dasbor Ketua RT</h1><p className="text-xs text-blue-100">Kel. Tambakreja - Cilacap Selatan</p></div>
        <div className="flex gap-4 items-center">
          <button onClick={() => setActiveMenu('beranda')} className={`font-bold pb-1 ${activeMenu === 'beranda' ? 'border-b-2 border-white' : 'text-blue-200'}`}>Beranda</button>
          <button onClick={() => setActiveMenu('arsip')} className={`font-bold pb-1 ${activeMenu === 'arsip' ? 'border-b-2 border-white' : 'text-blue-200'}`}>Arsip DB</button>
          <button onClick={() => setActiveMenu('profil')} className={`font-bold pb-1 ${activeMenu === 'profil' ? 'border-b-2 border-white' : 'text-blue-200'}`}>Profil</button>
        </div>
      </nav>

      <div className="md:hidden bg-blue-600 text-white p-4 shadow-sm sticky top-0 z-40">
        <h1 className="text-lg font-bold">Dasbor Ketua RT {currentUserRT}</h1>
        <p className="text-[10px] text-blue-100 uppercase tracking-widest">{activeMenu}</p>
      </div>

      <div className="max-w-5xl mx-auto mt-6 px-4 space-y-6">
        {/* BERANDA */}
        {activeMenu === 'beranda' && (
          <div className="animate-fade-in-up">
            <div className="bg-white p-5 md:p-6 rounded-2xl shadow-sm border border-gray-100 mb-6">
              <h2 className="text-lg font-bold text-gray-800 mb-4">Pengajuan Surat (Live Database)</h2>
              <form onSubmit={handleCari} className="flex flex-col sm:flex-row gap-3">
                <input type="text" value={cariNik} onChange={(e) => setCariNik(e.target.value)} placeholder="Masukkan 16 Digit NIK Warga..." className="flex-1 px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" maxLength="16" required={!editModeId} disabled={editModeId} />
                <button type="submit" disabled={editModeId} className={`font-bold py-3 px-6 rounded-xl transition-all ${editModeId ? 'bg-gray-300 text-gray-500' : 'bg-blue-600 hover:bg-blue-700 text-white shadow-md'}`}>Cari Data</button>
              </form>
            </div>

            {statusPencarian && (
              <div className="bg-white p-5 md:p-8 rounded-2xl shadow-sm border border-gray-100 border-t-4 border-t-blue-500">
                <div className="flex justify-between items-center border-b pb-4 mb-5">
                  <h2 className="text-lg md:text-xl font-bold text-gray-800">{editModeId ? "Edit Data (Perbaikan)" : "Form Isian 13 Poin"}</h2>
                  {editModeId && <button onClick={() => {setEditModeId(null); setStatusPencarian(null)}} className="text-red-500 font-bold text-sm">✖ Batal</button>}
                </div>
                
                <form id="formBerkas" onSubmit={handleSubmitDraft} className="space-y-5">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div className="md:col-span-2"><label className="block font-semibold mb-1">10. NIK</label><input type="text" name="nik" value={formData.nik} readOnly className="w-full p-2.5 bg-gray-100 border border-gray-300 rounded-lg font-bold" /></div>
                    <div><label className="block font-semibold mb-1">1. Nama Lengkap</label><input type="text" name="nama" value={formData.nama} onChange={handleChange} required className="w-full p-2.5 border border-gray-300 rounded-lg" /></div>
                    <div><label className="block font-semibold mb-1">Jenis Kelamin</label><select name="jk" value={formData.jk} onChange={handleChange} className="w-full p-2.5 border border-gray-300 rounded-lg"><option value="Lk">Laki-Laki</option><option value="Pr">Perempuan</option></select></div>
                    <div className="md:col-span-2"><label className="block font-semibold mb-1">2. Tempat & Tgl Lahir</label><input type="text" name="ttl" value={formData.ttl} onChange={handleChange} required className="w-full p-2.5 border border-gray-300 rounded-lg" /></div>
                    <div><label className="block font-semibold mb-1">3. Kewarganegaraan</label><input type="text" name="kewarganegaraan" value={formData.kewarganegaraan} onChange={handleChange} required className="w-full p-2.5 border border-gray-300 rounded-lg" /></div>
                    <div><label className="block font-semibold mb-1">Agama</label><select name="agama" value={formData.agama} onChange={handleChange} className="w-full p-2.5 border border-gray-300 rounded-lg"><option value="Islam">Islam</option><option value="Kristen">Kristen</option><option value="Katolik">Katolik</option><option value="Hindu">Hindu</option><option value="Buddha">Buddha</option><option value="Konghucu">Konghucu</option></select></div>
                    <div><label className="block font-semibold mb-1">4. Status Perkawinan</label><select name="status_kawin" value={formData.status_kawin} onChange={handleChange} className="w-full p-2.5 border border-gray-300 rounded-lg"><option value="Belum Kawin">Belum Kawin</option><option value="Kawin">Kawin</option><option value="Duda">Duda</option><option value="Janda">Janda</option></select></div>
                    <div><label className="block font-semibold mb-1">5. Pekerjaan</label><input type="text" name="pekerjaan" value={formData.pekerjaan} onChange={handleChange} required className="w-full p-2.5 border border-gray-300 rounded-lg" /></div>
                    <div><label className="block font-semibold mb-1">6. Nama KK</label><input type="text" name="namaKK" value={formData.namaKK} onChange={handleChange} required className="w-full p-2.5 border border-gray-300 rounded-lg" /></div>
                    <div><label className="block font-semibold mb-1">7. Hubungan KK</label><select name="hubunganKK" value={formData.hubunganKK} onChange={handleChange} className="w-full p-2.5 border border-gray-300 rounded-lg"><option value="Kepala Keluarga">Kepala Keluarga</option><option value="Istri">Istri</option><option value="Anak">Anak</option><option value="Famili Lain">Famili Lain</option></select></div>
                    <div className="md:col-span-2"><label className="block font-semibold mb-1">8. Tempat Tinggal</label><textarea name="tempatTinggal" value={formData.tempatTinggal} onChange={handleChange} required rows="2" className="w-full p-2.5 border border-gray-300 rounded-lg"></textarea></div>
                    <div className="md:col-span-2"><label className="block font-semibold mb-1">9. Kabupaten</label><input type="text" name="kabupaten" value={formData.kabupaten} onChange={handleChange} required className="w-full p-2.5 bg-gray-100 border border-gray-300 rounded-lg" /></div>
                  </div>

                  <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 space-y-4 text-sm">
                    <div><label className="block font-bold text-blue-800 mb-1">11. Keperluan Surat</label><textarea name="keperluan" value={formData.keperluan} onChange={handleChange} required className="w-full p-3 border border-blue-300 rounded-lg min-h-[80px]"></textarea></div>
                    <div><label className="block font-bold text-blue-800 mb-1">12. Berlaku Mulai</label><input type="text" name="berlakuMulai" value={formData.berlakuMulai} onChange={handleChange} className="w-full p-2.5 border border-blue-300 rounded-lg" /></div>
                    <div><label className="block font-bold text-blue-800 mb-1">13. Keterangan Lain</label><input type="text" name="keterangan" value={formData.keterangan} onChange={handleChange} className="w-full p-2.5 border border-blue-300 rounded-lg" /></div>
                  </div>

                  <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                    <h3 className="font-bold text-gray-800 mb-3 text-sm">Unggah Dokumen (Opsional jika Edit)</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div className="border border-dashed border-gray-300 p-3 rounded-lg bg-white"><label className="block text-xs font-semibold mb-1">Foto KTP</label><input type="file" name="fotoKTP" onChange={handleFileChange} className="block w-full text-[10px]" /></div>
                      <div className="border border-dashed border-gray-300 p-3 rounded-lg bg-white"><label className="block text-xs font-semibold mb-1">Foto KK</label><input type="file" name="fotoKK" onChange={handleFileChange} className="block w-full text-[10px]" /></div>
                      <div className="border border-dashed border-gray-300 p-3 rounded-lg bg-white">
                        <label className="block text-xs font-semibold mb-1">Berkas Lain (Multiple)</label>
                        <input type="file" name="filePendukung" multiple onChange={handleFileChange} className="block w-full text-[10px]" />
                        {dokumen.filePendukung.length > 0 && <p className="text-[10px] text-green-600 font-bold mt-1">✓ {dokumen.filePendukung.length} File dipilih</p>}
                      </div>
                    </div>
                  </div>
                  
                  <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-xl shadow-lg active:scale-95 text-lg">
                    {editModeId ? "Simpan Perbaikan (Draft)" : "Simpan ke Draft DB"}
                  </button>
                </form>
              </div>
            )}
          </div>
        )}

        {/* ARSIP */}
        {activeMenu === 'arsip' && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden animate-fade-in-up">
            <div className="p-5 border-b border-gray-100 bg-gray-50 flex flex-col gap-3">
              <h2 className="text-lg font-bold text-gray-800">Arsip Cloud (Firestore)</h2>
              <div className="flex gap-2">
                <input type="text" placeholder="Cari..." value={searchKata} onChange={(e) => setSearchKata(e.target.value)} className="px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none flex-1" />
                <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white outline-none">
                  <option value="Semua">Semua</option><option value="Draft">Draft</option><option value="Menunggu RW">Proses RW</option><option value="Disetujui RW">Selesai</option><option value="Ditolak">Ditolak</option>
                </select>
              </div>
            </div>
            
            <div className="p-4 grid gap-4">
              {filteredRiwayat.length === 0 ? (
                <div className="text-center text-gray-500 italic py-10">Data tidak ditemukan di database.</div>
              ) : (
                filteredRiwayat.map((surat) => (
                  <div key={surat.id} className="border border-gray-200 rounded-xl p-4 shadow-sm relative bg-white">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <div className="font-bold text-gray-800 text-lg">{surat.nama}</div>
                        <div className="text-xs text-gray-500">{surat.nomor_surat}</div>
                      </div>
                      <div className="text-right">
                        {surat.status === 'Draft' && <span className="bg-gray-200 text-gray-700 px-2 py-1 rounded text-[10px] font-bold">DRAFT</span>}
                        {surat.status === 'Menunggu RW' && <span className="bg-yellow-100 text-yellow-700 px-2 py-1 rounded text-[10px] font-bold">PROSES RW</span>}
                        {surat.status === 'Disetujui RW' && <span className="bg-green-100 text-green-700 px-2 py-1 rounded text-[10px] font-bold">SELESAI</span>}
                        {surat.status === 'Ditolak' && <span className="bg-red-100 text-red-700 px-2 py-1 rounded text-[10px] font-bold">DITOLAK</span>}
                      </div>
                    </div>
                    
                    <div className="text-sm text-gray-600 mb-3">Keperluan: <b>{surat.keperluan}</b></div>

                    {surat.status === 'Ditolak' && (
                      <div className="bg-red-50 border border-red-200 p-2 rounded mb-3 text-xs text-red-700">
                        <b>Alasan Ditolak RW:</b> {surat.alasan_tolak}
                      </div>
                    )}

                    <div className="flex flex-wrap gap-2 mt-2 pt-3 border-t border-gray-100">
                      {surat.status === 'Draft' && (
                        <button onClick={() => {setSuratReview(surat); setCentangSetuju(false)}} className="bg-orange-500 text-white px-3 py-1.5 rounded-lg text-xs font-bold flex-1">Review & Kirim</button>
                      )}
                      {(surat.status === 'Draft' || surat.status === 'Ditolak') && (
                        <button onClick={() => handleEdit(surat)} className="bg-blue-100 text-blue-700 border border-blue-200 px-3 py-1.5 rounded-lg text-xs font-bold flex-1">✎ Edit</button>
                      )}
                      <button onClick={() => navigate('/cetak', { state: surat })} className="bg-gray-100 text-gray-700 border border-gray-300 px-3 py-1.5 rounded-lg text-xs font-bold flex-1">Cetak PDF</button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* PROFIL & UBAH PASSWORD */}
        {activeMenu === 'profil' && (
          <div className="animate-fade-in-up space-y-6 max-w-md mx-auto">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 text-center">
              <div className="w-20 h-20 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-3 text-2xl font-bold">RT</div>
              <h2 className="text-xl font-bold text-gray-800">Ketua RT {currentUserRT}</h2>
              <p className="text-sm text-gray-500">Kelurahan Tambakreja</p>
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
              <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">Ubah Password</h3>
              <form onSubmit={handleUbahPassword} className="space-y-4">
                <div><label className="block text-xs font-semibold text-gray-600 mb-1">Password Lama</label><input type="password" value={passData.oldPass} onChange={(e)=>setPassData({...passData, oldPass: e.target.value})} required className="w-full p-2.5 border border-gray-300 rounded-lg text-sm" /></div>
                <div><label className="block text-xs font-semibold text-gray-600 mb-1">Password Baru</label><input type="password" value={passData.newPass} onChange={(e)=>setPassData({...passData, newPass: e.target.value})} required className="w-full p-2.5 border border-gray-300 rounded-lg text-sm" minLength="6" /></div>
                <div><label className="block text-xs font-semibold text-gray-600 mb-1">Konfirmasi Password Baru</label><input type="password" value={passData.confirmPass} onChange={(e)=>setPassData({...passData, confirmPass: e.target.value})} required className="w-full p-2.5 border border-gray-300 rounded-lg text-sm" minLength="6" /></div>
                <button type="submit" className="w-full bg-blue-600 text-white font-bold py-3 rounded-xl text-sm shadow-md active:scale-95 transition-transform">Simpan Password Baru</button>
              </form>
            </div>

            <button onClick={() => navigate('/')} className="w-full bg-red-100 text-red-600 border border-red-200 font-bold py-4 rounded-xl text-sm shadow-sm active:scale-95 transition-transform flex items-center justify-center gap-2">Keluar (Logout)</button>
          </div>
        )}

      </div>

      {/* BOTTOM NAVIGATION BAR (MOBILE) */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 flex justify-around p-2 pb-safe z-50 shadow-[0_-5px_15px_rgba(0,0,0,0.05)]">
        <button onClick={() => setActiveMenu('beranda')} className={`flex flex-col items-center justify-center w-full py-1 ${activeMenu === 'beranda' ? 'text-blue-600' : 'text-gray-400'}`}>
          <svg className="w-6 h-6 mb-1" fill={activeMenu === 'beranda' ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"></path></svg>
          <span className="text-[10px] font-bold">Buat Surat</span>
        </button>
        <button onClick={() => setActiveMenu('arsip')} className={`flex flex-col items-center justify-center w-full py-1 ${activeMenu === 'arsip' ? 'text-blue-600' : 'text-gray-400'}`}>
          <svg className="w-6 h-6 mb-1" fill={activeMenu === 'arsip' ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
          <span className="text-[10px] font-bold">Arsip DB</span>
        </button>
        <button onClick={() => setActiveMenu('profil')} className={`flex flex-col items-center justify-center w-full py-1 ${activeMenu === 'profil' ? 'text-blue-600' : 'text-gray-400'}`}>
          <svg className="w-6 h-6 mb-1" fill={activeMenu === 'profil' ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>
          <span className="text-[10px] font-bold">Profil</span>
        </button>
      </div>

      {/* MODAL REVIEW */}
      {suratReview && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-lg overflow-hidden animate-fade-in-up">
            <div className="bg-blue-600 p-4 text-white flex justify-between items-center"><h3 className="font-bold text-lg">Konfirmasi Kirim DB</h3><button onClick={() => setSuratReview(null)}>✖</button></div>
            <div className="p-5">
              <div className="bg-gray-50 border border-gray-200 p-4 rounded-xl mb-4 text-sm">
                <div className="grid grid-cols-3 gap-2 mb-2"><span className="text-gray-500">No Surat</span><span className="col-span-2 font-bold text-blue-700">: {suratReview.nomor_surat}</span></div>
                <div className="grid grid-cols-3 gap-2 mb-2"><span className="text-gray-500">Nama</span><span className="col-span-2 font-semibold text-gray-800">: {suratReview.nama}</span></div>
                <div className="grid grid-cols-3 gap-2 mb-2"><span className="text-gray-500">Keperluan</span><span className="col-span-2 font-semibold text-gray-800">: {suratReview.keperluan}</span></div>
              </div>
              <label className="flex items-start gap-3 p-3 border border-orange-200 bg-orange-50 rounded-lg cursor-pointer hover:bg-orange-100">
                <input type="checkbox" checked={centangSetuju} onChange={(e) => setCentangSetuju(e.target.checked)} className="mt-1 w-5 h-5 text-orange-600 rounded" />
                <span className="text-xs text-orange-800 font-medium">Saya menyetujui untuk meneruskannya ke antrean database Ketua RW.</span>
              </label>
              <button onClick={handleKirimKeRW} disabled={!centangSetuju} className={`w-full mt-4 font-bold py-3 rounded-xl shadow-sm ${centangSetuju ? 'bg-green-600 text-white' : 'bg-green-200 text-green-500'}`}>Kirim Sekarang</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}