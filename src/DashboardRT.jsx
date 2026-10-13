import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { db, auth } from './firebase'
import { collection, query, where, getDocs, addDoc, updateDoc, deleteDoc, doc, onSnapshot } from 'firebase/firestore'
import { updatePassword, signOut } from 'firebase/auth'

export default function DashboardRT() {
  const navigate = useNavigate()
  const currentUserRT = localStorage.getItem("currentUserRT") || "04"; // RT akun yang sedang login

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

  // State untuk fitur Ganti Password
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
          setStatusPencarian(null);
          setCariNik('');
          return;
        }

        setStatusPencarian('ketemu')
        setFormData({ 
          ...wargaDitemukan, 
          rt: currentUserRT,
          rw: wargaDitemukan.rw || '05',
          keperluan: '', 
          berlakuMulai: setTanggalBerlaku(), 
          keterangan: '' 
        })
      } else {
        setStatusPencarian('baru')
        setFormData({ 
          nik: nikBersih, nama: '', jenis_kelamin: 'Lk', tempat_lahir: '', tanggal_lahir: '', 
          alamat: '', rt: currentUserRT, rw: '05', status_keluarga: '', 
          status_perkawinan: 'Belum Kawin', agama: '', pekerjaan: '', keperluan: '', berlakuMulai: setTanggalBerlaku(), keterangan: '' 
        })
      }
    } catch (error) {
      alert("Terjadi kesalahan koneksi database.");
    }
  }

  const handleEdit = (surat) => {
    setActiveMenu('beranda'); setEditModeId(surat.id); setStatusPencarian('edit');
    setFormData({ ...surat, rt: currentUserRT })
    setDokumen({ 
      fotoKTP: surat.fotoKTP || null, 
      fotoKK: surat.fotoKK || null, 
      dokumenLainnya: surat.dokumenLainnya || [] 
    })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleHapusSurat = async (idSurat, namaWarga) => {
    if (window.confirm(`Apakah Anda yakin ingin menghapus pengajuan surat yang ditolak untuk warga atas nama "${namaWarga}"?`)) {
      try {
        await deleteDoc(doc(db, "surat", idSurat));
        alert("Pengajuan surat yang ditolak berhasil dihapus dari riwayat.");
      } catch (error) {
        alert("Gagal menghapus surat: " + error.message);
      }
    }
  };

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value })
  
  const handleFileChange = (e) => {
    const { name, files } = e.target;
    if (files && files[0]) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setDokumen(prev => ({ ...prev, [name]: reader.result }));
      };
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
          setDokumen(prev => ({
            ...prev,
            dokumenLainnya: [...prev.dokumenLainnya, ...newFilesBase64]
          }));
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const handleHapusDokumenLain = (index) => {
    setDokumen(prev => ({
      ...prev,
      dokumenLainnya: prev.dokumenLainnya.filter((_, i) => i !== index)
    }));
  };

  const handleSubmitDraft = async (e) => {
    e.preventDefault()
    const tglFormated = new Date().toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit', year: 'numeric' });
    const ttlGabungan = `${formData.tempat_lahir || ''}, ${formData.tanggal_lahir || ''}`;

    const payloadSurat = {
      rt_pengaju: `RT ${currentUserRT}`, 
      ...formData, 
      rt: currentUserRT, 
      ttl: ttlGabungan,
      fotoKTP: dokumen.fotoKTP,
      fotoKK: dokumen.fotoKK,
      dokumenLainnya: dokumen.dokumenLainnya,
      status: "Draft",
      tanggal: tglFormated,
      timestamp: Date.now()
    }

    try {
      if (editModeId) {
        await updateDoc(doc(db, "surat", editModeId), payloadSurat);
        alert(`Data berhasil diperbaiki ke database.`);
        setEditModeId(null)
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
      setSuratReview(null); alert(`Surat resmi dikirim ke antrean RW.`);
    } catch (error) { alert("Gagal mengirim surat ke RW."); }
  }

  const handleDownloadRekap = () => {
    if (!tglMulai || !tglSelesai) return alert("Pilih Tanggal Mulai dan Tanggal Selesai terlebih dahulu!");
    const startTimestamp = new Date(tglMulai).setHours(0, 0, 0, 0);
    const endTimestamp = new Date(tglSelesai).setHours(23, 59, 59, 999);

    const dataFilter = riwayatSurat.filter(s => s.timestamp >= startTimestamp && s.timestamp <= endTimestamp);
    if (dataFilter.length === 0) return alert("Tidak ada surat pada rentang tanggal tersebut.");

    const headers = ["Tanggal", "No Surat", "NIK", "Nama Pemohon", "Keperluan", "Status"];
    const csvRows = [headers.join(";")];
    dataFilter.forEach(s => {
      csvRows.push([`"${s.tanggal}"`, `"${s.nomor_surat}"`, `="${s.nik}"`, `"${s.nama}"`, `"${s.keperluan}"`, `"${s.status}"`].join(";"));
    });

    const csvContent = "\uFEFF" + csvRows.join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `Rekap_Surat_RT${currentUserRT}_${tglMulai}_sd_${tglSelesai}.csv`;
    link.click();
  }

  const handleCetakPDFRekap = () => {
    if (!tglMulai || !tglSelesai) return alert("Pilih Tanggal Mulai dan Tanggal Selesai terlebih dahulu!");
    const startTimestamp = new Date(tglMulai).setHours(0, 0, 0, 0);
    const endTimestamp = new Date(tglSelesai).setHours(23, 59, 59, 999);

    const dataFilter = riwayatSurat.filter(s => s.timestamp >= startTimestamp && s.timestamp <= endTimestamp);
    if (dataFilter.length === 0) return alert("Tidak ada data surat pada rentang tanggal tersebut.");

    const printWindow = window.open('', '_blank');
    const htmlContent = `
      <!DOCTYPE html>
      <html lang="id">
      <head>
        <meta charset="UTF-8">
        <title>Rekapitulasi Laporan Surat RT ${currentUserRT}</title>
        <style>
          @page { size: 210mm 330mm; margin: 15mm; }
          body { font-family: Arial, sans-serif; color: #000; margin: 0; padding: 0; font-size: 11pt; }
          .header { text-align: center; border-bottom: 2px solid #000; padding-bottom: 10mm; margin-bottom: 20mm; }
          .header h2, .header h3 { margin: 2px 0; }
          .info { margin-bottom: 15mm; font-size: 10pt; }
          table { width: 100%; border-collapse: collapse; margin-top: 10mm; }
          table, th, td { border: 1px solid #000; }
          th, td { padding: 8mm 10mm; text-align: left; font-size: 10pt; }
          th { background-color: #f2f2f2 !important; -webkit-print-color-adjust: exact; }
          .footer { margin-top: 40mm; float: right; text-align: center; font-size: 10pt; }
          .sign-space { height: 60mm; }
        </style>
      </head>
      <body>
        <div class="header">
          <h3>PEMERINTAH KABUPATEN CILACAP</h3>
          <h3>KECAMATAN CILACAP SELATAN - KELURAHAN TAMBAKREJA</h3>
          <h2>REKAPITULASI PERMOHONAN SURAT PENGANTAR RT ${currentUserRT}</h2>
          <p style="font-size: 9pt; margin: 5mm 0;">Periode: ${tglMulai} s/d ${tglSelesai}</p>
        </div>
        <div class="info"><p><b>Total Permohonan:</b> ${dataFilter.length} Surat</p></div>
        <table>
          <thead>
            <tr>
              <th style="width: 5%;">No</th>
              <th style="width: 15%;">Tanggal</th>
              <th style="width: 25%;">Nomor Surat</th>
              <th style="width: 20%;">Nama Pemohon</th>
              <th style="width: 25%;">Keperluan</th>
              <th style="width: 10%;">Status</th>
            </tr>
          </thead>
          <tbody>
            ${dataFilter.map((s, index) => `
              <tr>
                <td style="text-align: center;">${index + 1}</td>
                <td>${s.tanggal}</td>
                <td>${s.nomor_surat || '-'}</td>
                <td><b>${s.nama}</b><br><span style="font-size: 8pt; color: #555;">NIK: ${s.nik}</span></td>
                <td>${s.keperluan}</td>
                <td style="text-align: center;"><b>${s.status}</b></td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        <div class="footer">
          <div>
            <p>Tambakreja, ${new Date().toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit', year: 'numeric' })}</p>
            <p>Ketua RT ${currentUserRT} RW 05</p>
            <div class="sign-space"></div>
            <p><b>( .......................................... )</b></p>
          </div>
        </div>
        <script>window.onload = function() { window.print(); window.close(); }</script>
      </body>
      </html>
    `;
    printWindow.document.write(htmlContent);
    printWindow.document.close();
  }

  // FUNGSI GANTI PASSWORD
  const handleGantiPassword = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      return alert("Password baru dan konfirmasi password tidak cocok!");
    }
    if (newPassword.length < 6) {
      return alert("Password minimal 6 karakter!");
    }

    try {
      setIsChangingPassword(true);
      const user = auth.currentUser;
      if (user) {
        await updatePassword(user, newPassword);
        alert("Password berhasil diubah! Silakan login kembali dengan password baru.");
        handleLogout();
      } else {
        alert("Sesi tidak valid. Silakan logout dan login ulang.");
      }
    } catch (error) {
      if (error.code === 'auth/requires-recent-login') {
        alert("Sesi Anda sudah terlalu lama. Demi keamanan, silakan logout dan login kembali sebelum mengubah password.");
      } else {
        alert("Gagal mengubah password: " + error.message);
      }
    } finally {
      setIsChangingPassword(false);
      setNewPassword('');
      setConfirmPassword('');
    }
  };

  // FUNGSI LOGOUT
  const handleLogout = async () => {
    try {
      await signOut(auth);
      localStorage.clear();
      navigate('/');
    } catch (error) {
      console.error("Logout gagal: ", error);
    }
  };

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
          <button onClick={() => setActiveMenu('arsip')} className={`font-bold pb-1 ${activeMenu === 'arsip' ? 'border-b-2 border-white' : 'text-blue-200'}`}>Arsip & Laporan</button>
          <button onClick={() => setActiveMenu('profil')} className={`font-bold pb-1 ${activeMenu === 'profil' ? 'border-b-2 border-white' : 'text-blue-200'}`}>Profil</button>
        </div>
      </nav>

      <div className="md:hidden bg-blue-600 text-white p-4 shadow-sm sticky top-0 z-40">
        <h1 className="text-lg font-bold">Dasbor Ketua RT {currentUserRT}</h1>
        <p className="text-[10px] text-blue-100 uppercase tracking-widest">{activeMenu}</p>
      </div>

      <div className="max-w-6xl mx-auto mt-6 px-4 space-y-6">
        {activeMenu === 'beranda' && (
          <div className="animate-fade-in-up">
            <div className="bg-white p-5 md:p-6 rounded-2xl shadow-sm border border-gray-100 mb-6">
              <h2 className="text-lg font-bold text-gray-800 mb-1">Pengajuan Surat (Khusus Warga RT {currentUserRT})</h2>
              <p className="text-xs text-gray-500 mb-4">Masukkan NIK warga. Sistem otomatis memvalidasi apakah warga tersebut terdaftar di RT {currentUserRT}.</p>
              
              <form onSubmit={handleCari} className="flex flex-col sm:flex-row gap-3">
                <input type="text" value={cariNik} onChange={(e) => setCariNik(e.target.value)} placeholder={`Masukkan 16 Digit NIK Warga RT ${currentUserRT}...`} className="flex-1 px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" maxLength="16" required={!editModeId} disabled={editModeId} />
                <button type="submit" disabled={editModeId} className={`font-bold py-3 px-6 rounded-xl transition-all ${editModeId ? 'bg-gray-300 text-gray-500' : 'bg-blue-600 hover:bg-blue-700 text-white shadow-md'}`}>Cari Data</button>
              </form>
            </div>

            {statusPencarian && (
              <div className="bg-white p-5 md:p-8 rounded-2xl shadow-sm border border-gray-100 border-t-4 border-t-blue-500">
                <div className="flex justify-between items-center border-b pb-4 mb-5">
                  <h2 className="text-lg md:text-xl font-bold text-gray-800">{editModeId ? "Edit Data" : "Form Isian Data Warga"}</h2>
                  {editModeId && <button onClick={() => {setEditModeId(null); setStatusPencarian(null)}} className="text-red-500 font-bold text-sm">✖ Batal</button>}
                </div>
                
                <form onSubmit={handleSubmitDraft} className="space-y-5">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div className="md:col-span-2"><label className="block font-semibold mb-1">1. NIK</label><input type="text" name="nik" value={formData.nik} readOnly className="w-full p-2.5 bg-gray-100 border border-gray-300 rounded-lg font-bold" /></div>
                    <div className="md:col-span-2"><label className="block font-semibold mb-1">2. Nama Lengkap</label><input type="text" name="nama" value={formData.nama} onChange={handleChange} required className="w-full p-2.5 border border-gray-300 rounded-lg" /></div>
                    <div><label className="block font-semibold mb-1">3. Jenis Kelamin</label><select name="jenis_kelamin" value={formData.jenis_kelamin} onChange={handleChange} className="w-full p-2.5 border border-gray-300 rounded-lg"><option value="Lk">Laki-Laki</option><option value="Pr">Perempuan</option></select></div>
                    <div><label className="block font-semibold mb-1">4. Tempat Lahir</label><input type="text" name="tempat_lahir" value={formData.tempat_lahir} onChange={handleChange} required className="w-full p-2.5 border border-gray-300 rounded-lg" /></div>
                    <div><label className="block font-semibold mb-1">5. Tanggal Lahir</label><input type="text" name="tanggal_lahir" value={formData.tanggal_lahir} onChange={handleChange} required className="w-full p-2.5 border border-gray-300 rounded-lg" placeholder="Cth: 17 Agustus 1990" /></div>
                    <div className="md:col-span-2"><label className="block font-semibold mb-1">6. Alamat (Jalan)</label><input type="text" name="alamat" value={formData.alamat} onChange={handleChange} required className="w-full p-2.5 border border-gray-300 rounded-lg" /></div>
                    <div><label className="block font-semibold mb-1">7. RT</label><input type="text" name="rt" value={formData.rt} readOnly className="w-full p-2.5 bg-gray-100 border border-gray-300 rounded-lg font-bold text-blue-700" /></div>
                    <div><label className="block font-semibold mb-1">8. RW</label><input type="text" name="rw" value={formData.rw} onChange={handleChange} required className="w-full p-2.5 border border-gray-300 rounded-lg" /></div>
                    
                    <div><label className="block font-semibold mb-1">9. Status dalam Keluarga</label><input type="text" name="status_keluarga" value={formData.status_keluarga} onChange={handleChange} required className="w-full p-2.5 border border-gray-300 rounded-lg" placeholder="Cth: Kepala Keluarga / Istri / Anak" /></div>
                    <div><label className="block font-semibold mb-1">10. Status Perkawinan</label><select name="status_perkawinan" value={formData.status_perkawinan} onChange={handleChange} className="w-full p-2.5 border border-gray-300 rounded-lg"><option value="Belum Kawin">Belum Kawin</option><option value="Kawin">Kawin</option><option value="Duda">Duda</option><option value="Janda">Janda</option></select></div>
                    <div><label className="block font-semibold mb-1">11. Agama</label><input type="text" name="agama" value={formData.agama} onChange={handleChange} required className="w-full p-2.5 border border-gray-300 rounded-lg" placeholder="Cth: Islam" /></div>
                    <div><label className="block font-semibold mb-1">12. Pekerjaan</label><input type="text" name="pekerjaan" value={formData.pekerjaan} onChange={handleChange} required className="w-full p-2.5 border border-gray-300 rounded-lg" /></div>
                  </div>

                  <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 space-y-4 text-sm">
                    <h3 className="font-bold text-gray-700 border-b pb-2">Unggah Dokumen Pendukung Warga (Kamera atau Folder PC/HP)</h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block font-semibold mb-1 text-xs text-gray-700">Foto KTP (Maks. 1 Dokumen)</label>
                        <input type="file" name="fotoKTP" accept="image/*" capture="environment" onChange={handleFileChange} className="w-full text-xs file:mr-2 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:bg-blue-100 file:text-blue-700 font-semibold cursor-pointer" />
                        {dokumen.fotoKTP && (
                          <div className="mt-2 relative inline-block">
                            <img src={dokumen.fotoKTP} alt="Preview KTP" className="h-28 object-cover rounded-lg border shadow-sm" />
                            <button type="button" onClick={() => setDokumen(prev => ({...prev, fotoKTP: null}))} className="absolute top-1 right-1 bg-red-600 text-white rounded-full w-5 h-5 text-xs flex items-center justify-center font-bold">×</button>
                          </div>
                        )}
                      </div>

                      <div>
                        <label className="block font-semibold mb-1 text-xs text-gray-700">Foto KK (Maks. 1 Dokumen)</label>
                        <input type="file" name="fotoKK" accept="image/*" capture="environment" onChange={handleFileChange} className="w-full text-xs file:mr-2 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:bg-blue-100 file:text-blue-700 font-semibold cursor-pointer" />
                        {dokumen.fotoKK && (
                          <div className="mt-2 relative inline-block">
                            <img src={dokumen.fotoKK} alt="Preview KK" className="h-28 object-cover rounded-lg border shadow-sm" />
                            <button type="button" onClick={() => setDokumen(prev => ({...prev, fotoKK: null}))} className="absolute top-1 right-1 bg-red-600 text-white rounded-full w-5 h-5 text-xs flex items-center justify-center font-bold">×</button>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="pt-3 border-t border-gray-200">
                      <label className="block font-semibold mb-1 text-xs text-gray-700">Dokumen Lainnya (Jumlah File Tidak Dibatasi / Multi-file)</label>
                      <input type="file" multiple accept="image/*,.pdf" onChange={handleMultiFileChange} className="w-full text-xs file:mr-2 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:bg-green-100 file:text-green-700 font-semibold cursor-pointer" />
                      
                      {dokumen.dokumenLainnya.length > 0 && (
                        <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 gap-2">
                          {dokumen.dokumenLainnya.map((docItem, idx) => (
                            <div key={idx} className="p-2 bg-white border rounded-lg shadow-sm text-xs relative flex flex-col justify-between">
                              <span className="truncate font-semibold text-gray-700 mb-1">{docItem.name || `Dokumen ${idx + 1}`}</span>
                              {docItem.data.startsWith('data:image') ? (
                                <img src={docItem.data} alt="Lampiran" className="h-16 object-cover rounded mb-1" />
                              ) : (
                                <div className="h-16 bg-gray-100 flex items-center justify-center text-[10px] font-bold text-gray-500 rounded mb-1">FILE PDF</div>
                              )}
                              <button type="button" onClick={() => handleHapusDokumenLain(idx)} className="bg-red-100 text-red-600 hover:bg-red-200 py-1 rounded font-bold text-[10px]">Hapus</button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 space-y-4 text-sm mt-4">
                    <div><label className="block font-bold text-blue-800 mb-1">Keperluan Surat</label><textarea name="keperluan" value={formData.keperluan} onChange={handleChange} required className="w-full p-3 border border-blue-300 rounded-lg min-h-[80px]"></textarea></div>
                    <div><label className="block font-bold text-blue-800 mb-1">Berlaku Mulai</label><input type="text" name="berlakuMulai" value={formData.berlakuMulai} onChange={handleChange} className="w-full p-2.5 border border-blue-300 rounded-lg" /></div>
                    <div><label className="block font-bold text-blue-800 mb-1">Keterangan Lain</label><input type="text" name="keterangan" value={formData.keterangan} onChange={handleChange} className="w-full p-2.5 border border-blue-300 rounded-lg" /></div>
                  </div>
                  <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-xl shadow-lg active:scale-95 text-lg">Simpan ke Database</button>
                </form>
              </div>
            )}
          </div>
        )}

        {activeMenu === 'arsip' && (
          <div className="animate-fade-in-up space-y-6">
            <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 border-l-4 border-l-blue-500">
               <h2 className="font-bold text-gray-800 mb-3 text-sm">Download / Cetak Rekapitulasi</h2>
               <div className="flex flex-col md:flex-row gap-3 items-end">
                  <div className="flex-1 w-full"><label className="block text-xs font-semibold text-gray-500 mb-1">Mulai Tanggal</label><input type="date" value={tglMulai} onChange={e=>setTglMulai(e.target.value)} className="w-full p-2.5 border border-gray-300 rounded-lg text-sm outline-none" /></div>
                  <div className="flex-1 w-full"><label className="block text-xs font-semibold text-gray-500 mb-1">Sampai Tanggal</label><input type="date" value={tglSelesai} onChange={e=>setTglSelesai(e.target.value)} className="w-full p-2.5 border border-gray-300 rounded-lg text-sm outline-none" /></div>
                  <button onClick={handleDownloadRekap} className="w-full md:w-auto bg-green-600 hover:bg-green-700 text-white px-5 py-2.5 rounded-lg font-bold text-sm shadow-sm">Unduh CSV</button>
                  <button onClick={handleCetakPDFRekap} className="w-full md:w-auto bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg font-bold text-sm shadow-sm">Cetak PDF (Folio)</button>
               </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="p-5 border-b border-gray-100 bg-gray-50 flex flex-col gap-3">
                <h2 className="text-lg font-bold text-gray-800">Riwayat Surat</h2>
                <div className="flex gap-2">
                  <input type="text" placeholder="Cari Nama/NIK..." value={searchKata} onChange={(e) => setSearchKata(e.target.value)} className="px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none flex-1" />
                  <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white outline-none">
                    <option value="Semua">Semua</option><option value="Draft">Draft</option><option value="Menunggu RW">Proses RW</option><option value="Disetujui RW">Selesai</option><option value="Ditolak">Ditolak</option>
                  </select>
                </div>
              </div>
              
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-sm">
                  <thead>
                    <tr className="bg-gray-100 border-b border-gray-200 text-gray-700 font-bold whitespace-nowrap text-xs">
                      <th className="p-3">Nomor</th>
                      <th className="p-3">Tgl Pengajuan</th>
                      <th className="p-3">NIK</th>
                      <th className="p-3">Nama</th>
                      <th className="p-3">Keperluan</th>
                      <th className="p-3">Status</th>
                      <th className="p-3 text-center">Aksi (Edit/Hapus)</th>
                      <th className="p-3 text-center">Cetak</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRiwayat.length === 0 ? (
                      <tr>
                        <td colSpan="8" className="text-center text-gray-400 py-10 italic">Data surat tidak ditemukan.</td>
                      </tr>
                    ) : (
                      filteredRiwayat.map((surat, index) => (
                        <tr key={surat.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors whitespace-nowrap text-xs">
                          <td className="p-3 font-semibold text-gray-600">{surat.nomor_surat || `(Draft #${index + 1})`}</td>
                          <td className="p-3 text-gray-500">{surat.tanggal}</td>
                          <td className="p-3 font-mono text-blue-700 font-semibold">{surat.nik}</td>
                          <td className="p-3 font-bold text-gray-800">{surat.nama}</td>
                          <td className="p-3 text-gray-600 max-w-xs truncate">{surat.keperluan}</td>
                          <td className="p-3">
                            {surat.status === 'Draft' && <span className="bg-gray-200 text-gray-700 px-2 py-0.5 rounded font-bold text-[10px]">DRAFT</span>}
                            {surat.status === 'Menunggu RW' && <span className="bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded font-bold text-[10px]">PROSES RW</span>}
                            {surat.status === 'Disetujui RW' && <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded font-bold text-[10px]">SELESAI</span>}
                            {surat.status === 'Ditolak' && (
                              <span 
                                onClick={() => alert(`Alasan Penolakan dari Ketua RW:\n\n"${surat.alasan_tolak || 'Tidak ada alasan yang dicantumkan.'}"`)}
                                className="bg-red-100 text-red-700 px-2 py-0.5 rounded font-bold text-[10px] cursor-pointer hover:bg-red-200 underline"
                                title="Klik untuk melihat alasan penolakan"
                              >
                                DITOLAK (Ketuk)
                              </span>
                            )}
                          </td>
                          <td className="p-3 text-center space-x-1">
                            {surat.status === 'Draft' && (
                              <>
                                <button onClick={() => setSuratReview(surat)} className="bg-orange-500 hover:bg-orange-600 text-white px-2.5 py-1 rounded font-bold text-[10px]">Kirim</button>
                                <button onClick={() => handleEdit(surat)} className="bg-blue-100 text-blue-700 hover:bg-blue-200 px-2.5 py-1 rounded font-bold text-[10px]">Edit</button>
                              </>
                            )}
                            {surat.status === 'Ditolak' && (
                              <>
                                <button onClick={() => handleEdit(surat)} className="bg-blue-100 text-blue-700 hover:bg-blue-200 px-2.5 py-1 rounded font-bold text-[10px]">Edit</button>
                                <button onClick={() => handleHapusSurat(surat.id, surat.nama)} className="bg-red-600 hover:bg-red-700 text-white px-2.5 py-1 rounded font-bold text-[10px]">Hapus</button>
                              </>
                            )}
                            {surat.status !== 'Draft' && surat.status !== 'Ditolak' && (
                              <span className="text-gray-400 italic text-[10px]">Terkunci</span>
                            )}
                          </td>
                          <td className="p-3 text-center">
                            <button onClick={() => navigate('/cetak', { state: surat })} className="bg-gray-100 hover:bg-gray-200 text-gray-700 border border-gray-300 px-3 py-1 rounded font-bold text-[10px]">Cetak PDF</button>
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

        {/* MENU PROFIL & GANTI PASSWORD */}
        {activeMenu === 'profil' && (
          <div className="animate-fade-in-up space-y-6 max-w-md mx-auto">
            
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 space-y-4">
              <h2 className="text-lg font-bold text-gray-800 border-b pb-2">Ganti Password</h2>
              <form onSubmit={handleGantiPassword} className="space-y-4 text-sm">
                <div>
                  <label className="block font-semibold mb-1 text-gray-700">Password Baru</label>
                  <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required minLength="6" className="w-full p-3 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" placeholder="Minimal 6 karakter" />
                </div>
                <div>
                  <label className="block font-semibold mb-1 text-gray-700">Konfirmasi Password Baru</label>
                  <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required minLength="6" className="w-full p-3 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" placeholder="Ulangi password baru" />
                </div>
                <button type="submit" disabled={isChangingPassword} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl shadow-sm transition-all disabled:bg-blue-400">
                  {isChangingPassword ? 'Memproses...' : 'Simpan Password Baru'}
                </button>
              </form>
            </div>
            
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
              <button onClick={handleLogout} className="w-full bg-red-100 text-red-600 border border-red-200 font-bold py-4 rounded-xl text-sm shadow-sm flex items-center justify-center gap-2 hover:bg-red-200 transition-colors">
                Keluar dari Sistem (Logout)
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 flex justify-around p-2 pb-safe z-50">
        <button onClick={() => setActiveMenu('beranda')} className={`w-full py-1 font-bold text-[10px] ${activeMenu === 'beranda' ? 'text-blue-600' : 'text-gray-400'}`}>Buat Surat</button>
        <button onClick={() => setActiveMenu('arsip')} className={`w-full py-1 font-bold text-[10px] ${activeMenu === 'arsip' ? 'text-blue-600' : 'text-gray-400'}`}>Arsip & Laporan</button>
        <button onClick={() => setActiveMenu('profil')} className={`w-full py-1 font-bold text-[10px] ${activeMenu === 'profil' ? 'text-blue-600' : 'text-gray-400'}`}>Profil</button>
      </div>

      {suratReview && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-lg overflow-hidden animate-fade-in-up">
            <div className="bg-blue-600 p-4 text-white flex justify-between items-center"><h3 className="font-bold text-lg">Konfirmasi Kirim DB</h3><button onClick={() => setSuratReview(null)}>✖</button></div>
            <div className="p-5">
              <p className="mb-4 text-sm font-semibold text-gray-700">Kirim surat {suratReview.nama} ke antrean Ketua RW?</p>
              <button onClick={handleKirimKeRW} className={`w-full font-bold py-3 rounded-xl shadow-sm bg-green-600 text-white`}>Kirim Sekarang</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}