import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { db, auth } from './firebase'
import { collection, query, where, doc, updateDoc, onSnapshot, setDoc, getDocs, deleteDoc } from 'firebase/firestore'
import { updatePassword, signOut } from 'firebase/auth'

export default function DashboardRW() {
  const navigate = useNavigate()
  
  const [activeMenu, setActiveMenu] = useState('antrean') 
  const [semuaSurat, setSemuaSurat] = useState([])
  const [searchKata, setSearchKata] = useState('')
  const [filterArsip, setFilterArsip] = useState('Semua')

  const [suratReview, setSuratReview] = useState(null)
  const [modeTolak, setModeTolak] = useState(false)
  const [alasanTolak, setAlasanTolak] = useState('')
  
  const [tglMulai, setTglMulai] = useState('')
  const [tglSelesai, setTglSelesai] = useState('')
  const [isImporting, setIsImporting] = useState(false)

  const [dataWargaList, setDataWargaList] = useState([])
  const [searchWarga, setSearchWarga] = useState('')
  const [selectedNikWarga, setSelectedNikWarga] = useState([])

  const [editWargaModal, setEditWargaModal] = useState(null)
  const [formEditWarga, setFormEditWarga] = useState({
    nik: '', nama: '', jenis_kelamin: 'Lk', tempat_lahir: '', tanggal_lahir: '',
    alamat: '', rt: '', rw: '05', status_keluarga: '', status_perkawinan: 'Belum Kawin', agama: '', pekerjaan: ''
  })

  // State untuk fitur Ganti Password
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isChangingPassword, setIsChangingPassword] = useState(false)

  useEffect(() => {
    const q = query(collection(db, "surat"), where("status", "in", ["Menunggu RW", "Disetujui RW", "Ditolak"]));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const suratData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      suratData.sort((a, b) => b.timestamp - a.timestamp);
      setSemuaSurat(suratData);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const fetchWarga = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "warga"));
        const wargaArr = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setDataWargaList(wargaArr);
      } catch (error) {
        console.error("Gagal memuat data warga:", error);
      }
    };
    if (activeMenu === 'hapus-warga') {
      fetchWarga();
    }
  }, [activeMenu]);

  const filteredPending = semuaSurat.filter(s => s.status === 'Menunggu RW' && (s.nama.toLowerCase().includes(searchKata.toLowerCase()) || s.nik.includes(searchKata)))
  const filteredArsip = semuaSurat.filter(s => s.status !== 'Menunggu RW' && (filterArsip === 'Semua' || s.status === filterArsip) && (s.nama.toLowerCase().includes(searchKata.toLowerCase()) || s.nik.includes(searchKata)))

  const filteredWargaList = dataWargaList.filter(w => 
    (w.nama && w.nama.toLowerCase().includes(searchWarga.toLowerCase())) || 
    (w.nik && w.nik.includes(searchWarga))
  );

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      const allNiks = filteredWargaList.map(w => w.nik);
      setSelectedNikWarga(allNiks);
    } else {
      setSelectedNikWarga([]);
    }
  };

  const handleSelectOne = (nik) => {
    if (selectedNikWarga.includes(nik)) {
      setSelectedNikWarga(selectedNikWarga.filter(item => item !== nik));
    } else {
      setSelectedNikWarga([...selectedNikWarga, nik]);
    }
  };

  const handleHapusWargaTerpilih = async () => {
    if (selectedNikWarga.length === 0) return alert("Pilih minimal satu data warga yang ingin dihapus!");
    
    if (window.confirm(`Apakah Anda yakin ingin menghapus ${selectedNikWarga.length} data warga terpilih secara permanen?`)) {
      try {
        for (const nik of selectedNikWarga) {
          await deleteDoc(doc(db, "warga", nik));
        }
        alert("Data warga terpilih berhasil dihapus!");
        setDataWargaList(dataWargaList.filter(w => !selectedNikWarga.includes(w.nik)));
        setSelectedNikWarga([]);
      } catch (error) {
        alert("Terjadi kesalahan saat menghapus data.");
      }
    }
  };

  const handleBukaEditWarga = (warga) => {
    setEditWargaModal(warga.nik);
    setFormEditWarga({
      nik: warga.nik || '',
      nama: warga.nama || '',
      jenis_kelamin: warga.jenis_kelamin || 'Lk',
      tempat_lahir: warga.tempat_lahir || '',
      tanggal_lahir: warga.tanggal_lahir || '',
      alamat: warga.alamat || '',
      rt: warga.rt || '',
      rw: warga.rw || '05',
      status_keluarga: warga.status_keluarga || '',
      status_perkawinan: warga.status_perkawinan || 'Belum Kawin',
      agama: warga.agama || '',
      pekerjaan: warga.pekerjaan || ''
    });
  };

  const handleSimpanEditWarga = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...formEditWarga,
        ttl: `${formEditWarga.tempat_lahir}, ${formEditWarga.tanggal_lahir}`
      };
      await setDoc(doc(db, "warga", editWargaModal), payload, { merge: true });
      alert("Data warga berhasil diperbarui!");
      setEditWargaModal(null);
      const querySnapshot = await getDocs(collection(db, "warga"));
      setDataWargaList(querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    } catch (error) {
      alert("Gagal memperbarui data warga: " + error.message);
    }
  };

  const handleSetujui = async () => {
    try {
      await updateDoc(doc(db, "surat", suratReview.id), { status: "Disetujui RW" });
      setSuratReview(null); alert(`Surat berhasil disetujui.`);
    } catch (error) { alert("Gagal mengupdate persetujuan."); }
  }

  const handleTolak = async () => {
    if (!alasanTolak.trim()) return alert("Alasan penolakan wajib diisi!")
    try {
      await updateDoc(doc(db, "surat", suratReview.id), { status: "Ditolak", alasan_tolak: alasanTolak });
      setSuratReview(null); setModeTolak(false); setAlasanTolak(''); alert(`Surat ditolak.`);
    } catch (error) { alert("Gagal mengirim penolakan."); }
  }

  const handleDownloadRekap = () => {
    if (!tglMulai || !tglSelesai) return alert("Pilih Tanggal Mulai dan Tanggal Selesai terlebih dahulu!");
    const startTimestamp = new Date(tglMulai).setHours(0, 0, 0, 0);
    const endTimestamp = new Date(tglSelesai).setHours(23, 59, 59, 999);

    const dataFilter = semuaSurat.filter(s => s.timestamp >= startTimestamp && s.timestamp <= endTimestamp);
    if (dataFilter.length === 0) return alert("Tidak ada surat pada rentang tanggal tersebut.");

    const headers = ["Tanggal", "No Surat", "Asal RT", "NIK", "Nama Pemohon", "Keperluan", "Status"];
    const csvRows = [headers.join(";")];
    dataFilter.forEach(s => {
      csvRows.push([`"${s.tanggal}"`, `"${s.nomor_surat}"`, `"${s.rt_pengaju}"`, `="${s.nik}"`, `"${s.nama}"`, `"${s.keperluan}"`, `"${s.status}"`].join(";"));
    });

    const csvContent = "\uFEFF" + csvRows.join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `Rekap_Surat_RW05_${tglMulai}_sd_${tglSelesai}.csv`;
    link.click();
  }

  const handleCetakPDFRekap = () => {
    if (!tglMulai || !tglSelesai) return alert("Pilih Tanggal Mulai dan Tanggal Selesai terlebih dahulu!");
    const startTimestamp = new Date(tglMulai).setHours(0, 0, 0, 0);
    const endTimestamp = new Date(tglSelesai).setHours(23, 59, 59, 999);

    const dataFilter = semuaSurat.filter(s => s.timestamp >= startTimestamp && s.timestamp <= endTimestamp);
    if (dataFilter.length === 0) return alert("Tidak ada data surat pada rentang tanggal tersebut.");

    const printWindow = window.open('', '_blank');
    const htmlContent = `
      <!DOCTYPE html>
      <html lang="id">
      <head>
        <meta charset="UTF-8">
        <title>Rekapitulasi Laporan Surat RW 05</title>
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
          <h2>REKAPITULASI PERMOHONAN SURAT PENGANTAR RW 05</h2>
          <p style="font-size: 9pt; margin: 5mm 0;">Periode: ${tglMulai} s/d ${tglSelesai}</p>
        </div>
        <div class="info"><p><b>Total Permohonan:</b> ${dataFilter.length} Surat</p></div>
        <table>
          <thead>
            <tr>
              <th style="width: 5%;">No</th>
              <th style="width: 15%;">Tanggal</th>
              <th style="width: 20%;">Nomor Surat</th>
              <th style="width: 10%;">Asal RT</th>
              <th style="width: 20%;">Nama Pemohon</th>
              <th style="width: 20%;">Keperluan</th>
              <th style="width: 10%;">Status</th>
            </tr>
          </thead>
          <tbody>
            ${dataFilter.map((s, index) => `
              <tr>
                <td style="text-align: center;">${index + 1}</td>
                <td>${s.tanggal}</td>
                <td>${s.nomor_surat || '-'}</td>
                <td style="text-align: center;">${s.rt_pengaju}</td>
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
            <p>Ketua RW 05 Kelurahan Tambakreja</p>
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

  const handleImportCSV = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setIsImporting(true);
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const text = event.target.result;
        const rows = text.split(/\r?\n/).filter(row => row.trim() !== '');
        if (rows.length < 2) throw new Error("File CSV kosong.");
        
        const separator = rows[0].includes(';') ? ';' : ',';
        const splitRegex = new RegExp(`${separator}(?=(?:[^"]*"[^"]*")*[^"]*$)`);
        let successCount = 0;
        
        for (let i = 1; i < rows.length; i++) {
          const cols = rows[i].split(splitRegex).map(c => c.replace(/(^"|"$)/g, '').trim());
          if (cols.length >= 3 && cols[0]) {
            const nikWarga = cols[0];
            const dataBaru = {
              nik: nikWarga,
              nama: cols[1] || '',
              jenis_kelamin: cols[2] || 'Lk',
              tempat_lahir: cols[3] || '',
              tanggal_lahir: cols[4] || '',
              ttl: `${cols[3] || ''}, ${cols[4] || ''}`,
              alamat: cols[5] || '',
              rt: cols[6] || '04',
              rw: cols[7] || '05',
              status_keluarga: cols[8] || '',
              status_perkawinan: cols[9] || '',
              agama: cols[10] || '',
              pekerjaan: cols[11] || '',
            };
            await setDoc(doc(db, "warga", nikWarga), dataBaru);
            successCount++;
          }
        }
        alert(`Sukses! Berhasil mengimpor ${successCount} data warga.`);
      } catch (error) {
        alert("Gagal mengimpor: " + error.message);
      } finally {
        setIsImporting(false);
        e.target.value = '';
      }
    };
    reader.readAsText(file);
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

  return (
    <div className="min-h-screen bg-gray-50 pb-20 md:pb-10 relative">
      <nav className="hidden md:flex bg-green-700 text-white p-4 shadow-md justify-between items-center sticky top-0 z-40">
        <div><h1 className="text-xl font-bold">Dasbor Ketua RW 05</h1><p className="text-xs text-green-100">Kel. Tambakreja</p></div>
        <div className="flex gap-3 items-center">
          <button onClick={() => setActiveMenu('antrean')} className={`font-bold pb-1 ${activeMenu === 'antrean' ? 'border-b-2 border-white' : 'text-green-200'}`}>Antrean DB</button>
          <button onClick={() => setActiveMenu('arsip')} className={`font-bold pb-1 ${activeMenu === 'arsip' ? 'border-b-2 border-white' : 'text-green-200'}`}>Arsip & Laporan</button>
          <button onClick={() => setActiveMenu('warga')} className={`font-bold pb-1 ${activeMenu === 'warga' ? 'border-b-2 border-white' : 'text-green-200'}`}>Impor Warga</button>
          <button onClick={() => setActiveMenu('hapus-warga')} className={`font-bold pb-1 ${activeMenu === 'hapus-warga' ? 'border-b-2 border-white' : 'text-green-200'}`}>Manajemen Warga</button>
          <button onClick={() => setActiveMenu('profil')} className={`font-bold pb-1 ${activeMenu === 'profil' ? 'border-b-2 border-white' : 'text-green-200'}`}>Profil</button>
        </div>
      </nav>

      <div className="md:hidden bg-green-700 text-white p-4 shadow-sm sticky top-0 z-40">
        <h1 className="text-lg font-bold">Dasbor Ketua RW 05</h1>
        <p className="text-[10px] text-green-100 uppercase tracking-widest">{activeMenu}</p>
      </div>

      <div className="max-w-6xl mx-auto mt-6 px-4 space-y-6">
        {activeMenu === 'antrean' && (
          <div className="animate-fade-in-up">
            <div className="bg-orange-50 border border-orange-200 p-4 rounded-xl mb-4">
              <h2 className="font-bold text-orange-800">Antrean Cloud ({filteredPending.length})</h2>
              <p className="text-xs text-orange-600 mt-1">Periksa seluruh data dan dokumen warga dari database.</p>
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
                    <button onClick={() => {setSuratReview(surat); setModeTolak(false); setAlasanTolak('')}} className="w-full bg-green-600 hover:bg-green-700 text-white py-2.5 rounded-lg font-bold text-sm shadow-sm active:scale-95 transition-transform">Verifikasi Dokumen & Data</button>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {activeMenu === 'arsip' && (
          <div className="animate-fade-in-up space-y-6">
            <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 border-l-4 border-l-green-500">
               <h2 className="font-bold text-gray-800 mb-3 text-sm">Download / Cetak Rekapitulasi</h2>
               <div className="flex flex-col md:flex-row gap-3 items-end">
                  <div className="flex-1 w-full"><label className="block text-xs font-semibold text-gray-500 mb-1">Mulai Tanggal</label><input type="date" value={tglMulai} onChange={e=>setTglMulai(e.target.value)} className="w-full p-2.5 border border-gray-300 rounded-lg text-sm outline-none" /></div>
                  <div className="flex-1 w-full"><label className="block text-xs font-semibold text-gray-500 mb-1">Sampai Tanggal</label><input type="date" value={tglSelesai} onChange={e=>setTglSelesai(e.target.value)} className="w-full p-2.5 border border-gray-300 rounded-lg text-sm outline-none" /></div>
                  <button onClick={handleDownloadRekap} className="w-full md:w-auto bg-green-600 hover:bg-green-700 text-white px-5 py-2.5 rounded-lg font-bold text-sm shadow-sm">Unduh CSV</button>
                  <button onClick={handleCetakPDFRekap} className="w-full md:w-auto bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg font-bold text-sm shadow-sm">Cetak PDF (Folio)</button>
               </div>
            </div>

            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col gap-2">
              <input type="text" placeholder="Cari Nama/NIK..." value={searchKata} onChange={(e) => setSearchKata(e.target.value)} className="w-full p-2.5 border border-gray-300 rounded-lg text-sm outline-none" />
              <select value={filterArsip} onChange={(e) => setFilterArsip(e.target.value)} className="w-full p-2.5 border border-gray-300 rounded-lg text-sm bg-white outline-none">
                <option value="Semua">Semua Status</option><option value="Disetujui RW">Disetujui</option><option value="Ditolak">Ditolak</option>
              </select>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
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
                      <th className="p-3 text-center">Verifikasi</th>
                      <th className="p-3 text-center">Cetak</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredArsip.length === 0 ? (
                      <tr>
                        <td colSpan="8" className="text-center text-gray-400 py-10 italic">Arsip surat tidak ditemukan.</td>
                      </tr>
                    ) : (
                      filteredArsip.map((surat, index) => (
                        <tr key={surat.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors whitespace-nowrap text-xs">
                          <td className="p-3 font-semibold text-gray-600">{surat.nomor_surat || `( Arsip #${index + 1} )`}</td>
                          <td className="p-3 text-gray-500">{surat.tanggal}</td>
                          <td className="p-3 font-mono text-blue-700 font-semibold">{surat.nik}</td>
                          <td className="p-3 font-bold text-gray-800">{surat.nama} <span className="text-[10px] text-gray-400">({surat.rt_pengaju})</span></td>
                          <td className="p-3 text-gray-600 max-w-xs truncate">{surat.keperluan}</td>
                          <td className="p-3">
                            {surat.status === 'Disetujui RW' ? <span className="text-green-600 font-bold bg-green-50 px-2 py-0.5 rounded text-[10px]">DISETUJUI</span> : <span className="text-red-600 font-bold bg-red-50 px-2 py-0.5 rounded text-[10px]">DITOLAK</span>}
                          </td>
                          <td className="p-3 text-center">
                            <button onClick={() => {setSuratReview(surat); setModeTolak(false); setAlasanTolak('')}} className="bg-green-100 hover:bg-green-200 text-green-800 px-3 py-1 rounded font-bold text-[10px]">Lihat/Ubah</button>
                          </td>
                          <td className="p-3 text-center">
                            {surat.status === 'Disetujui RW' ? (
                              <button onClick={() => navigate('/cetak', { state: surat })} className="bg-blue-100 hover:bg-blue-200 text-blue-700 border border-blue-300 px-3 py-1 rounded font-bold text-[10px]">Cetak PDF</button>
                            ) : (
                              <span className="text-gray-400 italic text-[10px]">-</span>
                            )}
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

        {activeMenu === 'warga' && (
          <div className="animate-fade-in-up">
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 text-center space-y-4">
              <div className="w-20 h-20 bg-green-50 text-green-600 rounded-full flex items-center justify-center mx-auto mb-2 border border-green-100">
                <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path></svg>
              </div>
              <h2 className="text-xl font-bold text-gray-800">Impor Data Warga dari CSV</h2>
              <p className="text-sm text-gray-500 max-w-sm mx-auto leading-relaxed">Urutan 12 Kolom: NIK, Nama, Jenis Kelamin, Tempat Lahir, Tanggal Lahir, Alamat, RT, RW, Status Keluarga, Status Perkawinan, Agama, Pekerjaan.</p>
              <div className="max-w-md mx-auto mt-6 bg-gray-50 p-5 rounded-xl border-2 border-dashed border-gray-300">
                 <input type="file" accept=".csv" onChange={handleImportCSV} className="block w-full text-sm text-gray-700 font-semibold file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-green-100 file:text-green-700 cursor-pointer" disabled={isImporting} />
                 {isImporting && <p className="text-xs text-orange-600 mt-3 font-bold animate-pulse">Memproses impor...</p>}
              </div>
            </div>
          </div>
        )}

        {activeMenu === 'hapus-warga' && (
          <div className="animate-fade-in-up space-y-4">
            <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex flex-col md:flex-row justify-between items-center gap-4">
              <div>
                <h2 className="text-lg font-bold text-gray-800">Manajemen Data Warga</h2>
                <p className="text-xs text-gray-500">Edit atau hapus data kependudukan berdasarkan 12 atribut database.</p>
              </div>
              <button 
                onClick={handleHapusWargaTerpilih} 
                disabled={selectedNikWarga.length === 0}
                className={`px-5 py-2.5 rounded-xl font-bold text-sm text-white transition-all shadow-sm ${selectedNikWarga.length > 0 ? 'bg-red-600 hover:bg-red-700 active:scale-95' : 'bg-gray-300 cursor-not-allowed'}`}
              >
                Hapus Terpilih ({selectedNikWarga.length})
              </button>
            </div>

            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
              <input 
                type="text" 
                placeholder="Cari berdasarkan Nama atau NIK..." 
                value={searchWarga} 
                onChange={(e) => setSearchWarga(e.target.value)} 
                className="w-full p-2.5 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-green-500" 
              />
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-gray-100 border-b border-gray-200 text-gray-700 font-bold whitespace-nowrap">
                      <th className="p-3 text-center w-10">
                        <input 
                          type="checkbox" 
                          onChange={handleSelectAll} 
                          checked={filteredWargaList.length > 0 && selectedNikWarga.length === filteredWargaList.length}
                          className="w-4 h-4 text-green-600 rounded cursor-pointer" 
                        />
                      </th>
                      <th className="p-3">1. NIK</th>
                      <th className="p-3">2. Nama Lengkap</th>
                      <th className="p-3">3. L/P</th>
                      <th className="p-3">4. Tempat Lahir</th>
                      <th className="p-3">5. Tanggal Lahir</th>
                      <th className="p-3">6. Alamat</th>
                      <th className="p-3">7. RT</th>
                      <th className="p-3">8. RW</th>
                      <th className="p-3">9. Status Keluarga</th>
                      <th className="p-3">10. Status Perkawinan</th>
                      <th className="p-3">11. Agama</th>
                      <th className="p-3">12. Pekerjaan</th>
                      <th className="p-3 text-center">Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredWargaList.length === 0 ? (
                      <tr>
                        <td colSpan="14" className="text-center text-gray-400 py-8 italic text-sm">Tidak ada data warga ditemukan.</td>
                      </tr>
                    ) : (
                      filteredWargaList.map((warga) => (
                        <tr key={warga.nik} className="border-b border-gray-100 hover:bg-gray-50 transition-colors whitespace-nowrap">
                          <td className="p-3 text-center">
                            <input 
                              type="checkbox" 
                              checked={selectedNikWarga.includes(warga.nik)} 
                              onChange={() => handleSelectOne(warga.nik)}
                              className="w-4 h-4 text-green-600 rounded cursor-pointer" 
                            />
                          </td>
                          <td className="p-3 font-mono text-blue-700 font-semibold">{warga.nik}</td>
                          <td className="p-3 font-bold text-gray-800">{warga.nama}</td>
                          <td className="p-3">{warga.jenis_kelamin}</td>
                          <td className="p-3">{warga.tempat_lahir || '-'}</td>
                          <td className="p-3">{warga.tanggal_lahir || '-'}</td>
                          <td className="p-3">{warga.alamat || '-'}</td>
                          <td className="p-3">{warga.rt || '-'}</td>
                          <td className="p-3">{warga.rw || '-'}</td>
                          <td className="p-3">{warga.status_keluarga || '-'}</td>
                          <td className="p-3">{warga.status_perkawinan || '-'}</td>
                          <td className="p-3">{warga.agama || '-'}</td>
                          <td className="p-3">{warga.pekerjaan || '-'}</td>
                          <td className="p-3 text-center">
                            <button 
                              onClick={() => handleBukaEditWarga(warga)}
                              className="bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 rounded-lg font-bold text-xs shadow-sm"
                            >
                              Edit
                            </button>
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
                  <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required minLength="6" className="w-full p-3 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-green-500" placeholder="Minimal 6 karakter" />
                </div>
                <div>
                  <label className="block font-semibold mb-1 text-gray-700">Konfirmasi Password Baru</label>
                  <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required minLength="6" className="w-full p-3 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-green-500" placeholder="Ulangi password baru" />
                </div>
                <button type="submit" disabled={isChangingPassword} className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-xl shadow-sm transition-all disabled:bg-green-400">
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

      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 flex justify-around px-1 py-2 pb-safe z-50">
        <button onClick={() => setActiveMenu('antrean')} className={`flex flex-col items-center w-full py-1 ${activeMenu === 'antrean' ? 'text-green-700' : 'text-gray-400'}`}><span className="text-[10px] font-bold">Antrean</span></button>
        <button onClick={() => setActiveMenu('arsip')} className={`flex flex-col items-center w-full py-1 ${activeMenu === 'arsip' ? 'text-green-700' : 'text-gray-400'}`}><span className="text-[10px] font-bold">Laporan</span></button>
        <button onClick={() => setActiveMenu('warga')} className={`flex flex-col items-center w-full py-1 ${activeMenu === 'warga' ? 'text-green-700' : 'text-gray-400'}`}><span className="text-[10px] font-bold">Impor</span></button>
        <button onClick={() => setActiveMenu('hapus-warga')} className={`flex flex-col items-center w-full py-1 ${activeMenu === 'hapus-warga' ? 'text-green-700' : 'text-gray-400'}`}><span className="text-[10px] font-bold">Warga</span></button>
        <button onClick={() => setActiveMenu('profil')} className={`flex flex-col items-center w-full py-1 ${activeMenu === 'profil' ? 'text-green-700' : 'text-gray-400'}`}><span className="text-[10px] font-bold">Profil</span></button>
      </div>

      {/* MODAL EDIT WARGA (12 KOLOM) */}
      {editWargaModal && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-3 bg-black/70 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-fade-in-up">
            <div className="p-4 bg-green-700 text-white flex justify-between items-center">
              <h3 className="font-bold text-base">Edit Data Warga</h3>
              <button onClick={() => setEditWargaModal(null)} className="text-white font-bold text-lg px-2">✕</button>
            </div>
            <form onSubmit={handleSimpanEditWarga} className="p-6 overflow-y-auto space-y-4 flex-1 text-sm bg-gray-50">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div><label className="block font-semibold mb-1 text-xs">1. NIK</label><input type="text" value={formEditWarga.nik} readOnly className="w-full p-2.5 bg-gray-200 border rounded-lg font-bold text-xs" /></div>
                <div><label className="block font-semibold mb-1 text-xs">2. Nama Lengkap</label><input type="text" value={formEditWarga.nama} onChange={e => setFormEditWarga({...formEditWarga, nama: e.target.value})} required className="w-full p-2.5 border rounded-lg text-xs" /></div>
                <div><label className="block font-semibold mb-1 text-xs">3. Jenis Kelamin</label><select value={formEditWarga.jenis_kelamin} onChange={e => setFormEditWarga({...formEditWarga, jenis_kelamin: e.target.value})} className="w-full p-2.5 border rounded-lg text-xs"><option value="Lk">Laki-Laki</option><option value="Pr">Perempuan</option></select></div>
                <div><label className="block font-semibold mb-1 text-xs">4. Tempat Lahir</label><input type="text" value={formEditWarga.tempat_lahir} onChange={e => setFormEditWarga({...formEditWarga, tempat_lahir: e.target.value})} required className="w-full p-2.5 border rounded-lg text-xs" /></div>
                <div><label className="block font-semibold mb-1 text-xs">5. Tanggal Lahir</label><input type="text" value={formEditWarga.tanggal_lahir} onChange={e => setFormEditWarga({...formEditWarga, tanggal_lahir: e.target.value})} required className="w-full p-2.5 border rounded-lg text-xs" /></div>
                <div className="md:col-span-2"><label className="block font-semibold mb-1 text-xs">6. Alamat (Jalan)</label><input type="text" value={formEditWarga.alamat} onChange={e => setFormEditWarga({...formEditWarga, alamat: e.target.value})} required className="w-full p-2.5 border rounded-lg text-xs" /></div>
                <div><label className="block font-semibold mb-1 text-xs">7. RT</label><input type="text" value={formEditWarga.rt} onChange={e => setFormEditWarga({...formEditWarga, rt: e.target.value})} required className="w-full p-2.5 border rounded-lg text-xs" /></div>
                <div><label className="block font-semibold mb-1 text-xs">8. RW</label><input type="text" value={formEditWarga.rw} onChange={e => setFormEditWarga({...formEditWarga, rw: e.target.value})} required className="w-full p-2.5 border rounded-lg text-xs" /></div>
                <div><label className="block font-semibold mb-1 text-xs">9. Status dalam Keluarga</label><input type="text" value={formEditWarga.status_keluarga} onChange={e => setFormEditWarga({...formEditWarga, status_keluarga: e.target.value})} required className="w-full p-2.5 border rounded-lg text-xs" /></div>
                <div><label className="block font-semibold mb-1 text-xs">10. Status Perkawinan</label><select value={formEditWarga.status_perkawinan} onChange={e => setFormEditWarga({...formEditWarga, status_perkawinan: e.target.value})} className="w-full p-2.5 border rounded-lg text-xs"><option value="Belum Kawin">Belum Kawin</option><option value="Kawin">Kawin</option><option value="Duda">Duda</option><option value="Janda">Janda</option></select></div>
                <div><label className="block font-semibold mb-1 text-xs">11. Agama</label><input type="text" value={formEditWarga.agama} onChange={e => setFormEditWarga({...formEditWarga, agama: e.target.value})} required className="w-full p-2.5 border rounded-lg text-xs" /></div>
                <div><label className="block font-semibold mb-1 text-xs">12. Pekerjaan</label><input type="text" value={formEditWarga.pekerjaan} onChange={e => setFormEditWarga({...formEditWarga, pekerjaan: e.target.value})} required className="w-full p-2.5 border rounded-lg text-xs" /></div>
              </div>
              <div className="pt-4 flex gap-3">
                <button type="button" onClick={() => setEditWargaModal(null)} className="flex-1 bg-gray-200 font-bold py-3 rounded-xl text-xs">Batal</button>
                <button type="submit" className="flex-[2] bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-xl text-xs shadow-sm">Simpan Perubahan</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL VERIFIKASI SURAT RW */}
      {suratReview && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-3 bg-black/70 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-fade-in-up">
            <div className="p-4 bg-green-700 text-white flex justify-between items-center">
              <div><h3 className="font-bold text-base">Verifikasi Data & Dokumen Warga</h3><p className="text-xs text-green-100">No. Surat: {suratReview.nomor_surat}</p></div>
              <button onClick={()=>setSuratReview(null)} className="text-white hover:text-gray-200 font-bold text-lg px-2">✕</button>
            </div>
            
            <div className="p-5 overflow-y-auto space-y-4 flex-1 text-sm bg-gray-50">
              {!modeTolak ? (
                <>
                  <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm space-y-2">
                    <h4 className="font-bold text-green-800 border-b pb-2 text-xs uppercase tracking-wider">Rincian Data Warga</h4>
                    <div className="grid grid-cols-3 gap-1"><span className="text-gray-500 text-xs">Nama</span><span className="col-span-2 font-bold text-gray-800">: {suratReview.nama}</span></div>
                    <div className="grid grid-cols-3 gap-1"><span className="text-gray-500 text-xs">NIK</span><span className="col-span-2 font-bold text-blue-700">: {suratReview.nik}</span></div>
                    <div className="grid grid-cols-3 gap-1"><span className="text-gray-500 text-xs">Kelamin</span><span className="col-span-2 text-gray-800">: {suratReview.jenis_kelamin}</span></div>
                    <div className="grid grid-cols-3 gap-1"><span className="text-gray-500 text-xs">TTL</span><span className="col-span-2 text-gray-800">: {suratReview.ttl}</span></div>
                    <div className="grid grid-cols-3 gap-1"><span className="text-gray-500 text-xs">Alamat</span><span className="col-span-2 text-gray-800">: {suratReview.alamat} (RT {suratReview.rt} / RW {suratReview.rw})</span></div>
                    <div className="grid grid-cols-3 gap-1"><span className="text-gray-500 text-xs">Pekerjaan</span><span className="col-span-2 text-gray-800">: {suratReview.pekerjaan}</span></div>
                    <div className="grid grid-cols-3 gap-1 bg-blue-50 p-2 rounded"><span className="text-blue-900 font-bold text-xs">Keperluan</span><span className="col-span-2 font-bold text-blue-900">: {suratReview.keperluan}</span></div>
                  </div>

                  <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm space-y-3">
                    <h4 className="font-bold text-green-800 border-b pb-2 text-xs uppercase tracking-wider">Dokumen Lampiran (KTP & KK)</h4>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <p className="text-xs font-semibold text-gray-500 mb-1">Foto KTP:</p>
                        {suratReview.fotoKTP ? (
                          <img src={suratReview.fotoKTP} alt="KTP Warga" className="w-full h-32 object-cover rounded-lg border shadow-sm" />
                        ) : (
                          <div className="w-full h-32 bg-gray-100 flex items-center justify-center text-xs text-gray-400 rounded-lg border">Tidak ada KTP</div>
                        )}
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-gray-500 mb-1">Foto KK:</p>
                        {suratReview.fotoKK ? (
                          <img src={suratReview.fotoKK} alt="KK Warga" className="w-full h-32 object-cover rounded-lg border shadow-sm" />
                        ) : (
                          <div className="w-full h-32 bg-gray-100 flex items-center justify-center text-xs text-gray-400 rounded-lg border">Tidak ada KK</div>
                        )}
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <div className="bg-white p-4 rounded-xl border border-red-200 space-y-3">
                  <h4 className="font-bold text-red-700 text-xs uppercase tracking-wider">Form Alasan Penolakan</h4>
                  <textarea value={alasanTolak} onChange={(e)=>setAlasanTolak(e.target.value)} placeholder="Contoh: KTP buram / Keperluan kurang lengkap..." className="w-full p-3 border border-red-300 rounded-lg text-sm" rows="4" required></textarea>
                </div>
              )}
            </div>

            <div className="p-4 bg-white border-t flex gap-3">
              {!modeTolak ? (
                <><button onClick={()=>setModeTolak(true)} className="flex-1 border border-red-500 text-red-600 font-bold py-3 rounded-xl">Tolak</button><button onClick={handleSetujui} className="flex-[2] bg-green-600 text-white font-bold py-3 rounded-xl">Sahkan DB</button></>
              ) : (
                <><button onClick={()=>setModeTolak(false)} className="flex-1 bg-gray-200 font-bold py-3 rounded-xl">Batal</button><button onClick={handleTolak} className="flex-[2] bg-red-600 text-white font-bold py-3 rounded-xl">Kirim Penolakan</button></>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}