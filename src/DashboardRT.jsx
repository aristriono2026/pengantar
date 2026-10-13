import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { db, auth } from './firebase'
import { collection, query, where, getDocs, addDoc, updateDoc, deleteDoc, doc, onSnapshot, setDoc } from 'firebase/firestore'
import { updatePassword, signOut } from 'firebase/auth'

const ExternalLinkIcon = () => (
  <svg className="w-3 h-3 text-current opacity-70" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
);

export default function DashboardRT() {
  const navigate = useNavigate()
  const currentUserRT = localStorage.getItem("currentUserRT") || "04"; 

  const [activeMenu, setActiveMenu] = useState('beranda') 
  const [cariNik, setCariNik] = useState('')
  const [statusPencarian, setStatusPencarian] = useState(null) 
  
  const [riwayatSurat, setRiwayatSurat] = useState([])
  const [suratReview, setSuratReview] = useState(null)
  const [filterStatus, setFilterStatus] = useState('Semua')
  const [searchKata, setSearchKata] = useState('')
  const [editModeId, setEditModeId] = useState(null)
  
  const [tglMulai, setTglMulai] = useState('')
  const [tglSelesai, setTglSelesai] = useState('')

  const [formData, setFormData] = useState({
    nik: '', nama: '', jenis_kelamin: 'Lk', tempat_lahir: '', tanggal_lahir: '', 
    alamat: '', rt: currentUserRT, rw: '05', status_keluarga: '', 
    status_perkawinan: 'Belum Kawin', agama: '', pekerjaan: '', keperluan: '', berlakuMulai: '', keterangan: ''
  })
  
  const [dokumen, setDokumen] = useState({ fotoKTP: null, fotoKK: null, dokumenLainnya: [] })

  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isChangingPassword, setIsChangingPassword] = useState(false)

  useEffect(() => {
    const q = query(collection(db, "surat"), where("rt_pengaju", "==", `RT ${currentUserRT}`));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const suratData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      suratData.sort((a, b) => b.timestamp - a.timestamp);
      setRiwayatSurat(suratData);
    });
    return () => unsubscribe();
  }, []);

  const setTanggalBerlaku = () => {
    const hariIni = new Date(); const batasBerlaku = new Date(hariIni); batasBerlaku.setMonth(batasBerlaku.getMonth() + 3); 
    const formatTgl = (tgl) => tgl.toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit', year: 'numeric' });
    return `${formatTgl(hariIni)} s/d ${formatTgl(batasBerlaku)}`;
  }

  const handleCari = async (e) => {
    e.preventDefault()
    if (!cariNik) return
    setEditModeId(null) 
    const nikBersih = cariNik.trim()
    try {
      const q = query(collection(db, "warga"), where("nik", "==", nikBersih));
      const querySnapshot = await getDocs(q);
      setDokumen({ fotoKTP: null, fotoKK: null, dokumenLainnya: [] })

      if (!querySnapshot.empty) {
        let wargaDitemukan = null;
        querySnapshot.forEach((doc) => { wargaDitemukan = doc.data(); });

        const rtWarga = String(wargaDitemukan.rt || '').trim();
        if (rtWarga !== currentUserRT && rtWarga !== "4" && rtWarga !== "004") {
          alert(`Akses Ditolak! NIK ${nikBersih} terdaftar di RT ${rtWarga}, bukan warga RT ${currentUserRT}.`);
          setStatusPencarian(null); setCariNik(''); return;
        }

        setStatusPencarian('ketemu')
        setFormData({ ...wargaDitemukan, rt: currentUserRT, rw: wargaDitemukan.rw || '05', keperluan: '', berlakuMulai: setTanggalBerlaku(), keterangan: '' })
      } else {
        setStatusPencarian('baru')
        setFormData({ nik: nikBersih, nama: '', jenis_kelamin: 'Lk', tempat_lahir: '', tanggal_lahir: '', alamat: '', rt: currentUserRT, rw: '05', status_keluarga: '', status_perkawinan: 'Belum Kawin', agama: '', pekerjaan: '', keperluan: '', berlakuMulai: setTanggalBerlaku(), keterangan: '' })
      }
    } catch (error) { alert("Terjadi kesalahan koneksi database."); }
  }

  const handleEdit = (surat) => {
    setActiveMenu('beranda'); setEditModeId(surat.id); setStatusPencarian('edit');
    setFormData({ ...surat, rt: currentUserRT })
    setDokumen({ fotoKTP: surat.fotoKTP || null, fotoKK: surat.fotoKK || null, dokumenLainnya: surat.dokumenLainnya || [] })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleHapusSurat = async (idSurat, namaWarga) => {
    if (window.confirm(`Hapus pengajuan surat ditolak atas nama "${namaWarga}"?`)) {
      try { await deleteDoc(doc(db, "surat", idSurat)); alert("Berhasil dihapus."); } 
      catch (error) { alert("Gagal menghapus: " + error.message); }
    }
  };

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value })
  
  const handleFileChange = (e) => {
    const { name, files } = e.target;
    if (files && files[0]) {
      const reader = new FileReader();
      reader.onloadend = () => { setDokumen(prev => ({ ...prev, [name]: reader.result })); };
      reader.readAsDataURL(files[0]);
    }
  };

  const handleMultiFileChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;
    let loadedCount = 0;
    const newFilesBase64 = [];
    files.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        newFilesBase64.push({ name: file.name, data: reader.result });
        loadedCount++;
        if (loadedCount === files.length) {
          setDokumen(prev => ({ ...prev, dokumenLainnya: [...prev.dokumenLainnya, ...newFilesBase64] }));
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const handleHapusDokumenLain = (index) => {
    setDokumen(prev => ({ ...prev, dokumenLainnya: prev.dokumenLainnya.filter((_, i) => i !== index) }));
  };

  const handleSubmitDraft = async (e) => {
    e.preventDefault()
    const tglFormated = new Date().toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit', year: 'numeric' });
    const payloadSurat = {
      rt_pengaju: `RT ${currentUserRT}`, 
      ...formData, rt: currentUserRT, 
      ttl: `${formData.tempat_lahir || ''}, ${formData.tanggal_lahir || ''}`,
      fotoKTP: dokumen.fotoKTP, fotoKK: dokumen.fotoKK, dokumenLainnya: dokumen.dokumenLainnya,
      status: "Draft", tanggal: tglFormated, timestamp: Date.now()
    }

    try {
      if (editModeId) {
        await updateDoc(doc(db, "surat", editModeId), payloadSurat);
        alert(`Data berhasil diperbaiki.`); setEditModeId(null)
      } else {
        const tahunIni = new Date().getFullYear()
        const suratTahunIni = riwayatSurat.filter(s => s.tanggal && s.tanggal.includes(tahunIni))
        payloadSurat.nomor_surat = `148 / ${String(suratTahunIni.length + 1).padStart(3, '0')} / ${currentUserRT} / RW.05 / ${tahunIni}`;
        await addDoc(collection(db, "surat"), payloadSurat);
        alert(`Surat berhasil dibuat (DRAFT).`);
      }
      setStatusPencarian(null); setCariNik(''); setActiveMenu('arsip')
    } catch (error) { alert("Gagal menyimpan ke database."); }
  }

  const handleKirimKeRW = async () => {
    try {
      await updateDoc(doc(db, "surat", suratReview.id), { status: "Menunggu RW" });
      setSuratReview(null); alert(`Surat dikirim ke RW.`);
    } catch (error) { alert("Gagal mengirim surat."); }
  }

  const handleDownloadRekap = () => {
    if (!tglMulai || !tglSelesai) return alert("Pilih Tanggal Mulai dan Selesai!");
    const startTimestamp = new Date(tglMulai).setHours(0, 0, 0, 0);
    const endTimestamp = new Date(tglSelesai).setHours(23, 59, 59, 999);
    const dataFilter = riwayatSurat.filter(s => s.timestamp >= startTimestamp && s.timestamp <= endTimestamp);
    if (dataFilter.length === 0) return alert("Tidak ada surat pada rentang ini.");

    const csvRows = [["Tanggal", "No Surat", "NIK", "Nama Pemohon", "Keperluan", "Status"].join(";")];
    dataFilter.forEach(s => csvRows.push([`"${s.tanggal}"`, `"${s.nomor_surat}"`, `="${s.nik}"`, `"${s.nama}"`, `"${s.keperluan}"`, `"${s.status}"`].join(";")));
    
    const blob = new Blob(["\uFEFF" + csvRows.join("\n")], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a"); link.href = URL.createObjectURL(blob); link.download = `Rekap_RT${currentUserRT}_${tglMulai}.csv`; link.click();
  }

  const handleCetakPDFRekap = () => {
    if (!tglMulai || !tglSelesai) return alert("Pilih Tanggal Mulai dan Selesai!");
    const startTimestamp = new Date(tglMulai).setHours(0, 0, 0, 0);
    const endTimestamp = new Date(tglSelesai).setHours(23, 59, 59, 999);
    const dataFilter = riwayatSurat.filter(s => s.timestamp >= startTimestamp && s.timestamp <= endTimestamp);
    if (dataFilter.length === 0) return alert("Tidak ada data.");

    const printWindow = window.open('', '_blank');
    const htmlContent = `<!DOCTYPE html><html lang="id"><head><title>Rekap RT ${currentUserRT}</title><style>@page { size: 210mm 330mm; margin: 15mm; } body { font-family: Arial; font-size: 11pt; } .header { text-align: center; border-bottom: 2px solid #000; padding-bottom: 10mm; margin-bottom: 20mm; } table { width: 100%; border-collapse: collapse; margin-top: 10mm; } th, td { border: 1px solid #000; padding: 8mm; text-align: left; } th { background-color: #f2f2f2 !important; } .footer { margin-top: 40mm; float: right; text-align: center; }</style></head><body><div class="header"><h3>PEMERINTAH KABUPATEN CILACAP</h3><h2>REKAPITULASI SURAT RT ${currentUserRT}</h2><p>Periode: ${tglMulai} s/d ${tglSelesai}</p></div><table><thead><tr><th>No</th><th>Tanggal</th><th>Nomor Surat</th><th>Nama Pemohon</th><th>Keperluan</th><th>Status</th></tr></thead><tbody>${dataFilter.map((s, i) => `<tr><td style="text-align: center;">${i + 1}</td><td>${s.tanggal}</td><td>${s.nomor_surat || '-'}</td><td><b>${s.nama}</b><br><span style="font-size:8pt">NIK: ${s.nik}</span></td><td>${s.keperluan}</td><td style="text-align: center;"><b>${s.status}</b></td></tr>`).join('')}</tbody></table><div class="footer"><p>Tambakreja, ${new Date().toLocaleDateString('id-ID')}</p><p>Ketua RT ${currentUserRT}</p><div style="height:40mm"></div><p><b>( .......................... )</b></p></div><script>window.onload=function(){window.print();window.close();}</script></body></html>`;
    printWindow.document.write(htmlContent); printWindow.document.close();
  }

  const handleGantiPassword = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) return alert("Password tidak cocok!");
    if (newPassword.length < 6) return alert("Minimal 6 karakter!");
    try {
      setIsChangingPassword(true);
      const user = auth.currentUser;
      if (user) {
        await updatePassword(user, newPassword);
        await setDoc(doc(db, "users", user.uid), { password_plain: newPassword }, { merge: true });
        alert("Password diubah! Silakan login ulang."); handleLogout();
      } else alert("Sesi tidak valid.");
    } catch (error) { alert("Gagal mengubah: " + error.message); } 
    finally { setIsChangingPassword(false); setNewPassword(''); setConfirmPassword(''); }
  };

  const handleLogout = async () => {
    await signOut(auth); localStorage.clear(); navigate('/');
  };

  const filteredRiwayat = riwayatSurat.filter(surat => {
    const matchStatus = filterStatus === 'Semua' || surat.status === filterStatus
    const matchSearch = surat.nama.toLowerCase().includes(searchKata.toLowerCase()) || surat.nik.includes(searchKata)
    return matchStatus && matchSearch
  })

  return (
    <div className="min-h-screen bg-gradient-to-br from-cyan-50 via-white to-blue-50 font-sans text-gray-800 pb-20 md:pb-10 flex flex-col relative">
      
      {/* NAVBAR DESKTOP GLASSMORPHISM */}
      <nav className="hidden md:flex bg-white/70 backdrop-blur-xl border-b border-white/50 text-blue-900 p-4 shadow-[0_4px_30px_rgb(0,0,0,0.03)] justify-between items-center sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center text-white shadow-lg shadow-blue-500/30 font-black text-lg">
            {currentUserRT}
          </div>
          <div><h1 className="text-lg font-extrabold tracking-tight">Dasbor Ketua RT</h1><p className="text-[10px] font-bold text-blue-500 uppercase tracking-widest">RW 05 Tambakreja</p></div>
        </div>
        <div className="flex gap-2 p-1 bg-blue-50/50 rounded-2xl border border-blue-100/50 backdrop-blur-sm">
          <button onClick={() => setActiveMenu('beranda')} className={`px-5 py-2 font-bold text-sm rounded-xl transition-all ${activeMenu === 'beranda' ? 'bg-white text-blue-700 shadow-sm' : 'text-blue-900/60 hover:text-blue-800'}`}>Beranda</button>
          <button onClick={() => setActiveMenu('arsip')} className={`px-5 py-2 font-bold text-sm rounded-xl transition-all ${activeMenu === 'arsip' ? 'bg-white text-blue-700 shadow-sm' : 'text-blue-900/60 hover:text-blue-800'}`}>Arsip & Laporan</button>
          <button onClick={() => setActiveMenu('profil')} className={`px-5 py-2 font-bold text-sm rounded-xl transition-all ${activeMenu === 'profil' ? 'bg-white text-blue-700 shadow-sm' : 'text-blue-900/60 hover:text-blue-800'}`}>Profil</button>
        </div>
      </nav>

      {/* NAVBAR MOBILE */}
      <div className="md:hidden bg-white/80 backdrop-blur-xl text-blue-900 p-4 shadow-sm border-b border-blue-100/50 sticky top-0 z-40 flex items-center gap-3">
         <div className="w-9 h-9 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center text-white shadow-md font-black text-sm">{currentUserRT}</div>
         <div>
           <h1 className="text-base font-extrabold tracking-tight">Dasbor RT {currentUserRT}</h1>
           <p className="text-[9px] font-bold text-blue-500 uppercase tracking-widest">{activeMenu}</p>
         </div>
      </div>

      <div className="flex-1 max-w-6xl w-full mx-auto mt-6 px-4 space-y-8 relative z-10">
        
        {activeMenu === 'beranda' && (
          <div className="animate-fade-in-up">
            <div className="bg-white/60 backdrop-blur-xl p-6 md:p-8 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white/60 mb-8">
              <h2 className="text-xl font-extrabold text-blue-900 mb-2">Pengajuan Surat Pengantar</h2>
              <p className="text-sm text-blue-900/60 font-medium mb-6">Sistem otomatis memvalidasi apakah NIK tersebut terdaftar di RT {currentUserRT}.</p>
              
              <form onSubmit={handleCari} className="flex flex-col sm:flex-row gap-3">
                <input type="text" value={cariNik} onChange={(e) => setCariNik(e.target.value)} placeholder={`Ketik 16 Digit NIK Warga...`} className="flex-1 px-5 py-4 bg-white/50 backdrop-blur-sm border border-blue-100 rounded-2xl focus:ring-2 focus:ring-blue-400 outline-none shadow-inner transition-all font-semibold" maxLength="16" required={!editModeId} disabled={editModeId} />
                <button type="submit" disabled={editModeId} className={`font-bold py-4 px-8 rounded-2xl transition-all shadow-lg ${editModeId ? 'bg-gray-200 text-gray-400 shadow-none' : 'bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white shadow-blue-500/30 hover:-translate-y-0.5'}`}>Cari & Validasi</button>
              </form>
            </div>

            {statusPencarian && (
              <div className="bg-white/60 backdrop-blur-xl p-6 md:p-8 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.06)] border border-white/60">
                <div className="flex justify-between items-center border-b border-blue-100/50 pb-5 mb-6">
                  <h2 className="text-xl font-extrabold text-blue-900">{editModeId ? "Edit Data Pengajuan" : "Formulir Data Warga"}</h2>
                  {editModeId && <button onClick={() => {setEditModeId(null); setStatusPencarian(null)}} className="bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 px-4 py-2 rounded-xl font-bold text-xs transition-all shadow-sm">✖ Batal Edit</button>}
                </div>
                
                <form onSubmit={handleSubmitDraft} className="space-y-6">
                  {/* GRID FORM - GLASSMORPHISM INPUTS */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-sm">
                    <div className="md:col-span-2"><label className="block font-bold text-blue-900/80 mb-1.5">1. NIK</label><input type="text" name="nik" value={formData.nik} readOnly className="w-full p-3.5 bg-blue-50/50 border border-blue-100/50 rounded-2xl font-bold text-blue-900" /></div>
                    <div className="md:col-span-2"><label className="block font-bold text-blue-900/80 mb-1.5">2. Nama Lengkap</label><input type="text" name="nama" value={formData.nama} onChange={handleChange} required className="w-full p-3.5 bg-white/50 backdrop-blur-sm border border-blue-100 rounded-2xl focus:ring-2 focus:ring-blue-400 outline-none" /></div>
                    <div><label className="block font-bold text-blue-900/80 mb-1.5">3. Jenis Kelamin</label><select name="jenis_kelamin" value={formData.jenis_kelamin} onChange={handleChange} className="w-full p-3.5 bg-white/50 backdrop-blur-sm border border-blue-100 rounded-2xl focus:ring-2 focus:ring-blue-400 outline-none"><option value="Lk">Laki-Laki</option><option value="Pr">Perempuan</option></select></div>
                    <div><label className="block font-bold text-blue-900/80 mb-1.5">4. Tempat Lahir</label><input type="text" name="tempat_lahir" value={formData.tempat_lahir} onChange={handleChange} required className="w-full p-3.5 bg-white/50 backdrop-blur-sm border border-blue-100 rounded-2xl focus:ring-2 focus:ring-blue-400 outline-none" /></div>
                    <div><label className="block font-bold text-blue-900/80 mb-1.5">5. Tanggal Lahir</label><input type="text" name="tanggal_lahir" value={formData.tanggal_lahir} onChange={handleChange} required className="w-full p-3.5 bg-white/50 backdrop-blur-sm border border-blue-100 rounded-2xl focus:ring-2 focus:ring-blue-400 outline-none" placeholder="Cth: 17 Agustus 1990" /></div>
                    <div className="md:col-span-2"><label className="block font-bold text-blue-900/80 mb-1.5">6. Alamat (Jalan)</label><input type="text" name="alamat" value={formData.alamat} onChange={handleChange} required className="w-full p-3.5 bg-white/50 backdrop-blur-sm border border-blue-100 rounded-2xl focus:ring-2 focus:ring-blue-400 outline-none" /></div>
                    <div><label className="block font-bold text-blue-900/80 mb-1.5">7. RT</label><input type="text" name="rt" value={formData.rt} readOnly className="w-full p-3.5 bg-blue-50/50 border border-blue-100/50 rounded-2xl font-bold text-blue-600" /></div>
                    <div><label className="block font-bold text-blue-900/80 mb-1.5">8. RW</label><input type="text" name="rw" value={formData.rw} onChange={handleChange} required className="w-full p-3.5 bg-white/50 backdrop-blur-sm border border-blue-100 rounded-2xl focus:ring-2 focus:ring-blue-400 outline-none" /></div>
                    <div><label className="block font-bold text-blue-900/80 mb-1.5">9. Status dalam Keluarga</label><input type="text" name="status_keluarga" value={formData.status_keluarga} onChange={handleChange} required className="w-full p-3.5 bg-white/50 backdrop-blur-sm border border-blue-100 rounded-2xl focus:ring-2 focus:ring-blue-400 outline-none" /></div>
                    <div><label className="block font-bold text-blue-900/80 mb-1.5">10. Status Perkawinan</label><select name="status_perkawinan" value={formData.status_perkawinan} onChange={handleChange} className="w-full p-3.5 bg-white/50 backdrop-blur-sm border border-blue-100 rounded-2xl focus:ring-2 focus:ring-blue-400 outline-none"><option value="Belum Kawin">Belum Kawin</option><option value="Kawin">Kawin</option><option value="Duda">Duda</option><option value="Janda">Janda</option></select></div>
                    <div><label className="block font-bold text-blue-900/80 mb-1.5">11. Agama</label><input type="text" name="agama" value={formData.agama} onChange={handleChange} required className="w-full p-3.5 bg-white/50 backdrop-blur-sm border border-blue-100 rounded-2xl focus:ring-2 focus:ring-blue-400 outline-none" /></div>
                    <div><label className="block font-bold text-blue-900/80 mb-1.5">12. Pekerjaan</label><input type="text" name="pekerjaan" value={formData.pekerjaan} onChange={handleChange} required className="w-full p-3.5 bg-white/50 backdrop-blur-sm border border-blue-100 rounded-2xl focus:ring-2 focus:ring-blue-400 outline-none" /></div>
                  </div>

                  {/* KOTAK DOKUMEN */}
                  <div className="bg-white/40 p-5 rounded-3xl border border-white/60 shadow-sm space-y-5 text-sm">
                    <h3 className="font-extrabold text-blue-900 border-b border-blue-100/50 pb-3">Dokumen Pendukung (Kamera / File)</h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <div className="bg-white/60 p-4 rounded-2xl border border-white">
                        <label className="block font-bold text-blue-900/80 mb-2 text-xs">Foto KTP (Maks. 1 Dokumen)</label>
                        <input type="file" name="fotoKTP" accept="image/*" capture="environment" onChange={handleFileChange} className="w-full text-xs file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:bg-blue-50 file:text-blue-700 font-bold cursor-pointer" />
                        {dokumen.fotoKTP && (
                          <div className="mt-3 relative inline-block group">
                            <img src={dokumen.fotoKTP} alt="KTP" className="h-28 object-cover rounded-xl shadow-md border border-white" />
                            <button type="button" onClick={() => setDokumen(prev => ({...prev, fotoKTP: null}))} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 text-xs flex items-center justify-center font-bold shadow-lg opacity-0 group-hover:opacity-100 transition-opacity">✕</button>
                          </div>
                        )}
                      </div>

                      <div className="bg-white/60 p-4 rounded-2xl border border-white">
                        <label className="block font-bold text-blue-900/80 mb-2 text-xs">Foto KK (Maks. 1 Dokumen)</label>
                        <input type="file" name="fotoKK" accept="image/*" capture="environment" onChange={handleFileChange} className="w-full text-xs file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:bg-blue-50 file:text-blue-700 font-bold cursor-pointer" />
                        {dokumen.fotoKK && (
                          <div className="mt-3 relative inline-block group">
                            <img src={dokumen.fotoKK} alt="KK" className="h-28 object-cover rounded-xl shadow-md border border-white" />
                            <button type="button" onClick={() => setDokumen(prev => ({...prev, fotoKK: null}))} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 text-xs flex items-center justify-center font-bold shadow-lg opacity-0 group-hover:opacity-100 transition-opacity">✕</button>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="pt-3">
                      <label className="block font-bold text-blue-900/80 mb-2 text-xs">Dokumen Lainnya (Multi-file / PDF / Gambar)</label>
                      <input type="file" multiple accept="image/*,.pdf" onChange={handleMultiFileChange} className="w-full text-xs file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:bg-cyan-50 file:text-cyan-700 font-bold cursor-pointer" />
                      
                      {dokumen.dokumenLainnya.length > 0 && (
                        <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
                          {dokumen.dokumenLainnya.map((docItem, idx) => (
                            <div key={idx} className="p-2 bg-white/70 border border-white rounded-xl shadow-sm relative group flex flex-col justify-between">
                              <span className="truncate font-bold text-blue-900/70 mb-1.5 text-[10px] px-1">{docItem.name || `Dokumen ${idx + 1}`}</span>
                              {docItem.data.startsWith('data:image') ? (
                                <img src={docItem.data} alt="Lampiran" className="h-16 object-cover rounded-lg mb-1.5" />
                              ) : (
                                <div className="h-16 bg-blue-50/50 flex items-center justify-center text-[10px] font-black text-blue-300 rounded-lg mb-1.5 border border-dashed border-blue-200">PDF</div>
                              )}
                              <button type="button" onClick={() => handleHapusDokumenLain(idx)} className="bg-red-50 text-red-500 hover:bg-red-500 hover:text-white py-1 rounded-lg font-bold text-[10px] transition-colors">Hapus</button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="bg-blue-50/50 p-5 rounded-3xl border border-blue-100/50 space-y-5 text-sm shadow-inner">
                    <div><label className="block font-extrabold text-blue-800 mb-2">Keperluan Surat (Tujuan)</label><textarea name="keperluan" value={formData.keperluan} onChange={handleChange} required className="w-full p-4 bg-white/80 backdrop-blur-sm border border-blue-200 rounded-2xl min-h-[100px] outline-none focus:ring-2 focus:ring-blue-400 transition-all"></textarea></div>
                    <div className="grid md:grid-cols-2 gap-5">
                       <div><label className="block font-bold text-blue-800/80 mb-2">Berlaku Mulai</label><input type="text" name="berlakuMulai" value={formData.berlakuMulai} onChange={handleChange} className="w-full p-3.5 bg-white/80 backdrop-blur-sm border border-blue-200 rounded-2xl outline-none" /></div>
                       <div><label className="block font-bold text-blue-800/80 mb-2">Keterangan Lain</label><input type="text" name="keterangan" value={formData.keterangan} onChange={handleChange} className="w-full p-3.5 bg-white/80 backdrop-blur-sm border border-blue-200 rounded-2xl outline-none" /></div>
                    </div>
                  </div>
                  <button type="submit" className="w-full bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white font-black py-4.5 rounded-2xl shadow-[0_8px_20px_rgb(59,130,246,0.3)] hover:-translate-y-0.5 transition-all text-lg tracking-wide">
                     Simpan Data ke Database
                  </button>
                </form>
              </div>
            )}
          </div>
        )}

        {activeMenu === 'arsip' && (
          <div className="animate-fade-in-up space-y-8">
            <div className="bg-white/60 backdrop-blur-xl p-6 md:p-8 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white/60 flex flex-col md:flex-row gap-5 items-end justify-between relative overflow-hidden">
               <div className="absolute top-0 right-0 w-32 h-32 bg-blue-400/10 rounded-full blur-3xl"></div>
               <div className="flex-1 w-full space-y-4 relative z-10">
                  <h2 className="font-extrabold text-blue-900 text-lg flex items-center gap-2"><span className="p-1.5 bg-cyan-100 text-cyan-600 rounded-lg"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg></span> Rekapitulasi Laporan</h2>
                  <div className="flex gap-4">
                    <div className="flex-1"><label className="block text-xs font-bold text-blue-900/60 mb-1.5 ml-1">Mulai Tanggal</label><input type="date" value={tglMulai} onChange={e=>setTglMulai(e.target.value)} className="w-full p-3 bg-white/70 border border-blue-100 rounded-xl text-sm outline-none focus:ring-2 focus:ring-cyan-400" /></div>
                    <div className="flex-1"><label className="block text-xs font-bold text-blue-900/60 mb-1.5 ml-1">Sampai Tanggal</label><input type="date" value={tglSelesai} onChange={e=>setTglSelesai(e.target.value)} className="w-full p-3 bg-white/70 border border-blue-100 rounded-xl text-sm outline-none focus:ring-2 focus:ring-cyan-400" /></div>
                  </div>
               </div>
               <div className="flex gap-3 w-full md:w-auto relative z-10">
                  <button onClick={handleDownloadRekap} className="flex-1 md:flex-none bg-white hover:bg-green-50 text-green-600 border border-green-200 px-6 py-3.5 rounded-xl font-bold text-sm shadow-sm transition-all text-center">CSV</button>
                  <button onClick={handleCetakPDFRekap} className="flex-1 md:flex-none bg-gradient-to-r from-blue-500 to-cyan-500 text-white hover:shadow-lg hover:shadow-blue-500/30 px-6 py-3.5 rounded-xl font-bold text-sm transition-all hover:-translate-y-0.5 text-center">Cetak PDF</button>
               </div>
            </div>

            <div className="bg-white/60 backdrop-blur-xl p-2 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white/60 overflow-hidden flex flex-col">
              <div className="p-5 flex flex-col md:flex-row gap-4 border-b border-white/50">
                <input type="text" placeholder="Cari Nama/NIK warga..." value={searchKata} onChange={(e) => setSearchKata(e.target.value)} className="flex-1 px-4 py-3 bg-white/70 border border-blue-100 rounded-2xl text-sm outline-none focus:ring-2 focus:ring-cyan-400 shadow-inner" />
                <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="px-4 py-3 bg-white/70 border border-blue-100 rounded-2xl text-sm outline-none focus:ring-2 focus:ring-cyan-400 font-semibold text-blue-900">
                  <option value="Semua">Semua Status</option><option value="Draft">Draft</option><option value="Menunggu RW">Proses RW</option><option value="Disetujui RW">Selesai</option><option value="Ditolak">Ditolak</option>
                </select>
              </div>
              
              <div className="overflow-x-auto p-2">
                <table className="w-full text-left border-collapse text-sm">
                  <thead>
                    <tr className="border-b border-blue-100/50">
                      <th className="p-4 font-bold text-blue-900/60 uppercase tracking-wider text-[10px]">Nomor</th>
                      <th className="p-4 font-bold text-blue-900/60 uppercase tracking-wider text-[10px]">Tanggal</th>
                      <th className="p-4 font-bold text-blue-900/60 uppercase tracking-wider text-[10px]">Identitas</th>
                      <th className="p-4 font-bold text-blue-900/60 uppercase tracking-wider text-[10px]">Keperluan</th>
                      <th className="p-4 font-bold text-blue-900/60 uppercase tracking-wider text-[10px] text-center">Status</th>
                      <th className="p-4 font-bold text-blue-900/60 uppercase tracking-wider text-[10px] text-center">Aksi (RT)</th>
                      <th className="p-4 font-bold text-blue-900/60 uppercase tracking-wider text-[10px] text-center">Cetak</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRiwayat.length === 0 ? (
                      <tr><td colSpan="7" className="text-center text-blue-900/40 py-12 font-medium italic">Riwayat kosong atau tidak ditemukan.</td></tr>
                    ) : (
                      filteredRiwayat.map((surat, index) => (
                        <tr key={surat.id} className="border-b border-blue-50/50 hover:bg-white/50 transition-colors whitespace-nowrap text-xs">
                          <td className="p-4 font-bold text-blue-900/70">{surat.nomor_surat || `(Draft #${index + 1})`}</td>
                          <td className="p-4 text-blue-900/60 font-medium">{surat.tanggal}</td>
                          <td className="p-4">
                            <p className="font-extrabold text-blue-900 text-sm">{surat.nama}</p>
                            <p className="font-mono text-[10px] text-cyan-600 font-bold">{surat.nik}</p>
                          </td>
                          <td className="p-4 text-blue-800/80 max-w-[150px] truncate font-medium" title={surat.keperluan}>{surat.keperluan}</td>
                          <td className="p-4 text-center">
                            {surat.status === 'Draft' && <span className="bg-slate-100/80 text-slate-600 border border-slate-200 px-3 py-1 rounded-lg font-extrabold text-[9px] uppercase tracking-wide">DRAFT</span>}
                            {surat.status === 'Menunggu RW' && <span className="bg-amber-50 text-amber-600 border border-amber-200 px-3 py-1 rounded-lg font-extrabold text-[9px] uppercase tracking-wide">PROSES RW</span>}
                            {surat.status === 'Disetujui RW' && <span className="bg-green-50 text-green-600 border border-green-200 px-3 py-1 rounded-lg font-extrabold text-[9px] uppercase tracking-wide">SELESAI</span>}
                            {surat.status === 'Ditolak' && (
                              <span onClick={() => alert(`Alasan Penolakan:\n"${surat.alasan_tolak || '-'}"`)} className="bg-red-50 text-red-600 border border-red-200 px-3 py-1 rounded-lg font-extrabold text-[9px] cursor-pointer hover:bg-red-100 uppercase tracking-wide">DITOLAK (Klik)</span>
                            )}
                          </td>
                          <td className="p-4 text-center space-x-2">
                            {surat.status === 'Draft' && (
                              <><button onClick={() => setSuratReview(surat)} className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:shadow-lg text-white px-4 py-1.5 rounded-lg font-bold text-[10px] transition-all">Kirim RW</button>
                              <button onClick={() => handleEdit(surat)} className="bg-white text-blue-600 border border-blue-200 hover:bg-blue-50 px-4 py-1.5 rounded-lg font-bold text-[10px] transition-all">Edit</button></>
                            )}
                            {surat.status === 'Ditolak' && (
                              <><button onClick={() => handleEdit(surat)} className="bg-white text-blue-600 border border-blue-200 hover:bg-blue-50 px-3 py-1.5 rounded-lg font-bold text-[10px] transition-all">Edit</button>
                              <button onClick={() => handleHapusSurat(surat.id, surat.nama)} className="bg-red-50 text-red-600 hover:bg-red-500 hover:text-white px-3 py-1.5 rounded-lg font-bold text-[10px] transition-all">Hapus</button></>
                            )}
                            {surat.status !== 'Draft' && surat.status !== 'Ditolak' && (<span className="text-blue-900/30 italic text-[10px] font-bold">Terkunci</span>)}
                          </td>
                          <td className="p-4 text-center">
                            <button onClick={() => navigate('/cetak', { state: surat })} className="bg-white hover:bg-blue-50 text-blue-800 border border-blue-200 shadow-sm px-4 py-1.5 rounded-lg font-bold text-[10px] transition-all">Cetak</button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeMenu === 'profil' && (
          <div className="animate-fade-in-up space-y-6 max-w-md mx-auto">
            <div className="bg-white/60 backdrop-blur-xl p-8 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white/60 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-20 h-20 bg-blue-400/20 rounded-full blur-2xl"></div>
              <h2 className="text-xl font-extrabold text-blue-900 mb-6 flex items-center gap-2 relative z-10"><span className="p-1.5 bg-blue-100/50 text-blue-600 rounded-lg"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"></path></svg></span> Ganti Password</h2>
              <form onSubmit={handleGantiPassword} className="space-y-5 text-sm relative z-10">
                <div><label className="block font-bold text-blue-900/80 mb-2">Password Baru</label><input type="text" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required minLength="6" className="w-full p-4 bg-white/70 border border-blue-100 rounded-2xl outline-none focus:ring-2 focus:ring-cyan-400 shadow-inner" placeholder="Minimal 6 karakter" /></div>
                <div><label className="block font-bold text-blue-900/80 mb-2">Konfirmasi Password</label><input type="text" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required minLength="6" className="w-full p-4 bg-white/70 border border-blue-100 rounded-2xl outline-none focus:ring-2 focus:ring-cyan-400 shadow-inner" placeholder="Ketik ulang password..." /></div>
                <button type="submit" disabled={isChangingPassword} className="w-full bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white font-black py-4 rounded-2xl shadow-lg shadow-blue-500/30 transition-all hover:-translate-y-0.5 mt-2 tracking-wide">
                  {isChangingPassword ? 'Memproses...' : 'Simpan Password'}
                </button>
              </form>
            </div>
            
            <div className="bg-white/40 backdrop-blur-md p-2 rounded-3xl border border-white/60">
              <button onClick={handleLogout} className="w-full bg-white/60 hover:bg-red-50 text-red-600 border border-red-100 font-bold py-4 rounded-2xl text-sm shadow-sm flex items-center justify-center gap-2 transition-all">Logout / Keluar</button>
            </div>
          </div>
        )}
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
        
        <div className="mt-8 pt-6 border-t border-blue-900/10 text-center flex flex-col items-center justify-center gap-1.5 pb-safe">
          <p className="text-[10px] font-bold text-blue-800/40 uppercase tracking-widest">Powered by AI</p>
          <p className="text-xs font-bold text-blue-900 bg-white/60 px-4 py-1.5 rounded-full border border-white shadow-sm">Created by Aris Triono</p>
        </div>
      </footer>

      {/* BOTTOM NAV MOBILE GLASSMORPHISM */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-xl border-t border-white/60 shadow-[0_-8px_30px_rgb(0,0,0,0.04)] flex justify-around p-1 pb-safe z-50">
        <button onClick={() => setActiveMenu('beranda')} className={`w-full py-3 font-extrabold text-[10px] uppercase tracking-wider rounded-xl transition-all ${activeMenu === 'beranda' ? 'bg-gradient-to-r from-blue-500/10 to-cyan-500/10 text-blue-600 border border-blue-200/50' : 'text-blue-900/40'}`}>Buat Surat</button>
        <button onClick={() => setActiveMenu('arsip')} className={`w-full py-3 font-extrabold text-[10px] uppercase tracking-wider rounded-xl transition-all ${activeMenu === 'arsip' ? 'bg-gradient-to-r from-blue-500/10 to-cyan-500/10 text-blue-600 border border-blue-200/50' : 'text-blue-900/40'}`}>Laporan</button>
        <button onClick={() => setActiveMenu('profil')} className={`w-full py-3 font-extrabold text-[10px] uppercase tracking-wider rounded-xl transition-all ${activeMenu === 'profil' ? 'bg-gradient-to-r from-blue-500/10 to-cyan-500/10 text-blue-600 border border-blue-200/50' : 'text-blue-900/40'}`}>Profil</button>
      </div>

      {suratReview && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-blue-900/40 backdrop-blur-md">
          <div className="bg-white/90 backdrop-blur-2xl border border-white rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl animate-fade-in-up">
            <div className="bg-gradient-to-r from-blue-500 to-cyan-500 p-5 text-white flex justify-between items-center"><h3 className="font-extrabold text-lg tracking-wide">Kirim ke DB Cloud</h3><button onClick={() => setSuratReview(null)} className="opacity-80 hover:opacity-100 font-bold">✕</button></div>
            <div className="p-6 text-center">
              <div className="w-16 h-16 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center mx-auto mb-4 border border-blue-100"><svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path></svg></div>
              <p className="mb-6 text-sm font-semibold text-blue-900/80 leading-relaxed">Kirim pengajuan surat atas nama <br/><b className="text-blue-900 text-base">{suratReview.nama}</b><br/> ke antrean RW?</p>
              <button onClick={handleKirimKeRW} className="w-full font-black py-4 rounded-2xl shadow-[0_8px_20px_rgb(59,130,246,0.3)] bg-gradient-to-r from-blue-500 to-cyan-500 text-white hover:-translate-y-0.5 transition-all text-sm tracking-widest uppercase">Kirim Sekarang</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}