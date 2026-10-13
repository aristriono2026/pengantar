import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { db, auth } from './firebase'
import { collection, query, where, doc, updateDoc, onSnapshot, setDoc, getDocs, deleteDoc } from 'firebase/firestore'
import { updatePassword, signOut } from 'firebase/auth'

const ExternalLinkIcon = () => (
  <svg className="w-3 h-3 text-current opacity-70" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
);

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
      } catch (error) { console.error("Gagal memuat data:", error); }
    };
    if (activeMenu === 'hapus-warga') fetchWarga();
  }, [activeMenu]);

  const filteredPending = semuaSurat.filter(s => s.status === 'Menunggu RW' && (s.nama.toLowerCase().includes(searchKata.toLowerCase()) || s.nik.includes(searchKata)))
  const filteredArsip = semuaSurat.filter(s => s.status !== 'Menunggu RW' && (filterArsip === 'Semua' || s.status === filterArsip) && (s.nama.toLowerCase().includes(searchKata.toLowerCase()) || s.nik.includes(searchKata)))
  const filteredWargaList = dataWargaList.filter(w => (w.nama && w.nama.toLowerCase().includes(searchWarga.toLowerCase())) || (w.nik && w.nik.includes(searchWarga)));

  const handleSelectAll = (e) => e.target.checked ? setSelectedNikWarga(filteredWargaList.map(w => w.nik)) : setSelectedNikWarga([]);
  const handleSelectOne = (nik) => selectedNikWarga.includes(nik) ? setSelectedNikWarga(selectedNikWarga.filter(i => i !== nik)) : setSelectedNikWarga([...selectedNikWarga, nik]);

  const handleHapusWargaTerpilih = async () => {
    if (selectedNikWarga.length === 0) return alert("Pilih minimal satu data!");
    if (window.confirm(`Hapus ${selectedNikWarga.length} data warga?`)) {
      try {
        for (const nik of selectedNikWarga) await deleteDoc(doc(db, "warga", nik));
        alert("Data terhapus!"); setDataWargaList(dataWargaList.filter(w => !selectedNikWarga.includes(w.nik))); setSelectedNikWarga([]);
      } catch (error) { alert("Error: " + error.message); }
    }
  };

  const handleBukaEditWarga = (warga) => {
    setEditWargaModal(warga.nik);
    setFormEditWarga({
      nik: warga.nik || '', nama: warga.nama || '', jenis_kelamin: warga.jenis_kelamin || 'Lk', tempat_lahir: warga.tempat_lahir || '',
      tanggal_lahir: warga.tanggal_lahir || '', alamat: warga.alamat || '', rt: warga.rt || '', rw: warga.rw || '05',
      status_keluarga: warga.status_keluarga || '', status_perkawinan: warga.status_perkawinan || 'Belum Kawin', agama: warga.agama || '', pekerjaan: warga.pekerjaan || ''
    });
  };

  const handleSimpanEditWarga = async (e) => {
    e.preventDefault();
    try {
      await setDoc(doc(db, "warga", editWargaModal), { ...formEditWarga, ttl: `${formEditWarga.tempat_lahir}, ${formEditWarga.tanggal_lahir}` }, { merge: true });
      alert("Berhasil diperbarui!"); setEditWargaModal(null);
      const qs = await getDocs(collection(db, "warga")); setDataWargaList(qs.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    } catch (error) { alert("Gagal: " + error.message); }
  };

  const handleSetujui = async () => {
    try { await updateDoc(doc(db, "surat", suratReview.id), { status: "Disetujui RW" }); setSuratReview(null); alert(`Surat disetujui.`); } 
    catch (error) { alert("Gagal mengupdate."); }
  }

  const handleTolak = async () => {
    if (!alasanTolak.trim()) return alert("Alasan penolakan wajib diisi!")
    try { await updateDoc(doc(db, "surat", suratReview.id), { status: "Ditolak", alasan_tolak: alasanTolak }); setSuratReview(null); setModeTolak(false); setAlasanTolak(''); alert(`Surat ditolak.`); } 
    catch (error) { alert("Gagal menolak."); }
  }

  const handleDownloadRekap = () => {
    if (!tglMulai || !tglSelesai) return alert("Pilih Tanggal Mulai dan Selesai!");
    const start = new Date(tglMulai).setHours(0,0,0,0); const end = new Date(tglSelesai).setHours(23,59,59,999);
    const dataFilter = semuaSurat.filter(s => s.timestamp >= start && s.timestamp <= end);
    if (dataFilter.length === 0) return alert("Tidak ada surat pada rentang tanggal tersebut.");

    const csvRows = [["Tanggal", "No Surat", "Akun Pengirim", "NIK", "Nama Pemohon", "Keperluan", "Status"].join(";")];
    dataFilter.forEach(s => csvRows.push([`"${s.tanggal}"`, `"${s.nomor_surat}"`, `"${s.rt_pengaju}"`, `="${s.nik}"`, `"${s.nama}"`, `"${s.keperluan}"`, `"${s.status}"`].join(";")));
    
    const blob = new Blob(["\uFEFF" + csvRows.join("\n")], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a"); link.href = URL.createObjectURL(blob); link.download = `Rekap_RW05_${tglMulai}_sd_${tglSelesai}.csv`; link.click();
  }

  const handleCetakPDFRekap = () => {
    if (!tglMulai || !tglSelesai) return alert("Pilih Tanggal Mulai dan Selesai!");
    const start = new Date(tglMulai).setHours(0,0,0,0); const end = new Date(tglSelesai).setHours(23,59,59,999);
    const dataFilter = semuaSurat.filter(s => s.timestamp >= start && s.timestamp <= end);
    if (dataFilter.length === 0) return alert("Tidak ada data surat pada rentang tanggal tersebut.");

    const pw = window.open('', '_blank');
    const html = `<!DOCTYPE html><html lang="id"><head><title>Rekap RW 05</title><style>@page { size: 210mm 330mm; margin: 15mm; } body { font-family: Arial; font-size: 11pt; } .header { text-align: center; border-bottom: 2px solid #000; padding-bottom: 10mm; margin-bottom: 20mm; } table { width: 100%; border-collapse: collapse; margin-top: 10mm; } th, td { border: 1px solid #000; padding: 8mm; text-align: left; } th { background-color: #f2f2f2 !important; } .footer { margin-top: 40mm; float: right; text-align: center; }</style></head><body><div class="header"><h3>PEMERINTAH KABUPATEN CILACAP</h3><h2>REKAPITULASI SURAT RW 05</h2><p>Periode: ${tglMulai} s/d ${tglSelesai}</p></div><table><thead><tr><th>No</th><th>Tanggal</th><th>Nomor Surat</th><th>Akun Pengirim</th><th>Nama Pemohon</th><th>Keperluan</th><th>Status</th></tr></thead><tbody>${dataFilter.map((s, i) => `<tr><td style="text-align: center;">${i + 1}</td><td>${s.tanggal}</td><td>${s.nomor_surat || '-'}</td><td style="text-align: center;">${s.rt_pengaju}</td><td><b>${s.nama}</b><br><span style="font-size:8pt">NIK: ${s.nik}</span></td><td>${s.keperluan}</td><td style="text-align: center;"><b>${s.status}</b></td></tr>`).join('')}</tbody></table><div class="footer"><p>Tambakreja, ${new Date().toLocaleDateString('id-ID')}</p><p>Ketua RW 05</p><div style="height:40mm"></div><p><b>( .......................... )</b></p></div><script>window.onload=function(){window.print();window.close();}</script></body></html>`;
    pw.document.write(html); pw.document.close();
  }

  const handleImportCSV = async (e) => {
    const file = e.target.files[0]; if (!file) return;
    setIsImporting(true); const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const rows = event.target.result.split(/\r?\n/).filter(r => r.trim() !== '');
        if (rows.length < 2) throw new Error("File CSV kosong.");
        const sep = rows[0].includes(';') ? ';' : ','; const regex = new RegExp(`${sep}(?=(?:[^"]*"[^"]*")*[^"]*$)`);
        let sc = 0;
        for (let i = 1; i < rows.length; i++) {
          const cols = rows[i].split(regex).map(c => c.replace(/(^"|"$)/g, '').trim());
          if (cols.length >= 3 && cols[0]) {
            await setDoc(doc(db, "warga", cols[0]), { nik: cols[0], nama: cols[1]||'', jenis_kelamin: cols[2]||'Lk', tempat_lahir: cols[3]||'', tanggal_lahir: cols[4]||'', ttl: `${cols[3]||''}, ${cols[4]||''}`, alamat: cols[5]||'', rt: cols[6]||'04', rw: cols[7]||'05', status_keluarga: cols[8]||'', status_perkawinan: cols[9]||'', agama: cols[10]||'', pekerjaan: cols[11]||'' });
            sc++;
          }
        }
        alert(`Sukses! Berhasil mengimpor ${sc} data warga.`);
      } catch (err) { alert("Gagal mengimpor: " + err.message); } finally { setIsImporting(false); e.target.value = ''; }
    }; reader.readAsText(file);
  }

  const handleGantiPassword = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) return alert("Password baru dan konfirmasi password tidak cocok!");
    if (newPassword.length < 6) return alert("Password minimal 6 karakter!");
    try {
      setIsChangingPassword(true);
      const user = auth.currentUser;
      if (user) {
        await updatePassword(user, newPassword);
        await setDoc(doc(db, "users", user.uid), { password_plain: newPassword }, { merge: true });
        alert("Password berhasil diubah! Silakan login kembali dengan password baru."); handleLogout();
      }
    } catch (error) { alert("Gagal mengubah password: " + error.message); } 
    finally { setIsChangingPassword(false); setNewPassword(''); setConfirmPassword(''); }
  };

  const handleLogout = async () => { await signOut(auth); localStorage.clear(); navigate('/'); };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50 font-sans text-gray-800 pb-20 md:pb-10 flex flex-col relative">
      
      {/* NAVBAR DESKTOP GLASSMORPHISM */}
      <nav className="hidden md:flex bg-white/70 backdrop-blur-xl border-b border-white/50 text-blue-900 p-4 shadow-[0_4px_30px_rgb(0,0,0,0.03)] justify-between items-center sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center text-white shadow-lg shadow-blue-500/30 font-black text-lg">05</div>
          <div><h1 className="text-lg font-extrabold tracking-tight">Dasbor Ketua RW</h1><p className="text-[10px] font-bold text-blue-500 uppercase tracking-widest">RW 05 Tambakreja</p></div>
        </div>
        <div className="flex gap-1.5 p-1 bg-blue-50/50 rounded-2xl border border-blue-100/50 backdrop-blur-sm">
          {['antrean', 'arsip', 'warga', 'hapus-warga', 'profil'].map(menu => (
            <button key={menu} onClick={() => setActiveMenu(menu)} className={`px-4 py-2 font-bold text-xs rounded-xl transition-all capitalize ${activeMenu === menu ? 'bg-white text-blue-700 shadow-sm' : 'text-blue-900/60 hover:text-blue-800'}`}>
              {menu === 'hapus-warga' ? 'Database' : menu}
            </button>
          ))}
        </div>
      </nav>

      {/* NAVBAR MOBILE */}
      <div className="md:hidden bg-white/80 backdrop-blur-xl text-blue-900 p-4 shadow-sm border-b border-blue-100/50 sticky top-0 z-40 flex items-center gap-3">
         <div className="w-9 h-9 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center text-white shadow-md font-black text-sm">05</div>
         <div><h1 className="text-base font-extrabold tracking-tight">Dasbor RW 05</h1><p className="text-[9px] font-bold text-blue-500 uppercase tracking-widest">{activeMenu.replace('-', ' ')}</p></div>
      </div>

      <div className="flex-1 max-w-6xl w-full mx-auto mt-6 px-4 space-y-8 relative z-10">
        
        {/* ANTREAN SURAT */}
        {activeMenu === 'antrean' && (
          <div className="animate-fade-in-up">
            <div className="bg-gradient-to-r from-blue-50 to-cyan-50 border border-blue-100/50 p-5 rounded-3xl mb-6 shadow-inner">
              <h2 className="font-extrabold text-blue-900 flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></div> Antrean Cloud ({filteredPending.length})</h2>
              <p className="text-xs text-blue-800/60 mt-1 font-medium">Validasi dokumen warga yang diajukan oleh akun pengirim.</p>
            </div>
            
            <div className="grid md:grid-cols-2 gap-5">
              {filteredPending.length === 0 ? (
                <div className="col-span-full text-center text-blue-900/40 py-16 bg-white/40 backdrop-blur-md rounded-3xl border border-white/60 font-medium italic">Antrean verifikasi database kosong.</div>
              ) : (
                filteredPending.map(surat => (
                  <div key={surat.id} className="bg-white/70 backdrop-blur-xl border border-white/60 rounded-3xl p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-center border-b border-blue-50/50 pb-4 mb-4">
                        <span className="bg-gradient-to-r from-blue-500/10 to-cyan-500/10 text-blue-700 px-3 py-1.5 rounded-lg text-[10px] font-extrabold uppercase tracking-widest border border-blue-500/20">
                          Akun Pengirim: {surat.rt_pengaju}
                        </span>
                        <span className="text-xs font-bold text-blue-900/40">{surat.tanggal}</span>
                      </div>
                      <div className="font-black text-blue-900 text-xl tracking-tight">{surat.nama} <span className="text-xs font-mono text-cyan-600 block md:inline md:ml-1 mt-1 md:mt-0">{surat.nik}</span></div>
                      <div className="text-sm text-blue-800/80 mb-6 mt-3 bg-white/50 p-3 rounded-xl border border-white shadow-inner font-medium">
                        Keperluan: <b className="text-blue-900">{surat.keperluan}</b>
                      </div>
                    </div>
                    <button onClick={() => {setSuratReview(surat); setModeTolak(false); setAlasanTolak('')}} className="w-full bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white py-3.5 rounded-2xl font-black text-xs uppercase tracking-widest shadow-[0_8px_20px_rgb(59,130,246,0.3)] hover:-translate-y-0.5 transition-all">Verifikasi Dokumen</button>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* ARSIP LAPORAN */}
        {activeMenu === 'arsip' && (
          <div className="animate-fade-in-up space-y-6">
            <div className="bg-white/60 backdrop-blur-xl p-6 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white/60 flex flex-col md:flex-row gap-5 items-end justify-between relative overflow-hidden">
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
                <select value={filterArsip} onChange={(e) => setFilterArsip(e.target.value)} className="px-4 py-3 bg-white/70 border border-blue-100 rounded-2xl text-sm outline-none focus:ring-2 focus:ring-cyan-400 font-semibold text-blue-900">
                  <option value="Semua">Semua Status</option><option value="Disetujui RW">Disetujui</option><option value="Ditolak">Ditolak</option>
                </select>
              </div>
              
              <div className="overflow-x-auto p-2">
                <table className="w-full text-left border-collapse text-sm">
                  <thead>
                    <tr className="border-b border-blue-100/50">
                      <th className="p-4 font-bold text-blue-900/60 uppercase tracking-wider text-[10px]">Nomor</th>
                      <th className="p-4 font-bold text-blue-900/60 uppercase tracking-wider text-[10px]">Tanggal</th>
                      <th className="p-4 font-bold text-blue-900/60 uppercase tracking-wider text-[10px]">Akun Pengirim</th>
                      <th className="p-4 font-bold text-blue-900/60 uppercase tracking-wider text-[10px]">Identitas</th>
                      <th className="p-4 font-bold text-blue-900/60 uppercase tracking-wider text-[10px]">Keperluan</th>
                      <th className="p-4 font-bold text-blue-900/60 uppercase tracking-wider text-[10px] text-center">Status</th>
                      <th className="p-4 font-bold text-blue-900/60 uppercase tracking-wider text-[10px] text-center">Aksi / Cetak</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredArsip.length === 0 ? (
                      <tr><td colSpan="7" className="text-center text-blue-900/40 py-12 font-medium italic">Arsip kosong atau tidak ditemukan.</td></tr>
                    ) : (
                      filteredArsip.map((surat, index) => (
                        <tr key={surat.id} className="border-b border-blue-50/50 hover:bg-white/50 transition-colors whitespace-nowrap text-xs">
                          <td className="p-4 font-bold text-blue-900/70">{surat.nomor_surat || `( Arsip #${index + 1} )`}</td>
                          <td className="p-4 text-blue-900/60 font-medium">{surat.tanggal}</td>
                          <td className="p-4"><span className="bg-blue-100/50 text-blue-700 px-3 py-1.5 rounded-lg font-bold border border-blue-200/50 text-[10px]">{surat.rt_pengaju}</span></td>
                          <td className="p-4">
                            <p className="font-extrabold text-blue-900 text-sm">{surat.nama}</p>
                            <p className="font-mono text-[10px] text-cyan-600 font-bold">{surat.nik}</p>
                          </td>
                          <td className="p-4 text-blue-800/80 max-w-[150px] truncate font-medium" title={surat.keperluan}>{surat.keperluan}</td>
                          <td className="p-4 text-center">
                            {surat.status === 'Disetujui RW' ? <span className="bg-green-50 text-green-600 border border-green-200 px-3 py-1 rounded-lg font-extrabold text-[9px] uppercase tracking-wide">DISETUJUI</span> : <span className="bg-red-50 text-red-600 border border-red-200 px-3 py-1 rounded-lg font-extrabold text-[9px] uppercase tracking-wide">DITOLAK</span>}
                          </td>
                          <td className="p-4 text-center space-x-2">
                            <button onClick={() => {setSuratReview(surat); setModeTolak(false); setAlasanTolak('')}} className="bg-white hover:bg-blue-50 text-blue-800 border border-blue-200 shadow-sm px-3 py-1.5 rounded-lg font-bold text-[10px] transition-all">Lihat</button>
                            {surat.status === 'Disetujui RW' && (
                              <button onClick={() => navigate('/cetak', { state: surat })} className="bg-gradient-to-r from-blue-500 to-cyan-500 hover:shadow-lg text-white px-3 py-1.5 rounded-lg font-bold text-[10px] transition-all">Cetak PDF</button>
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

        {/* IMPOR WARGA */}
        {activeMenu === 'warga' && (
          <div className="animate-fade-in-up">
            <div className="bg-white/60 backdrop-blur-xl p-10 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white/60 text-center space-y-6 relative overflow-hidden">
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-cyan-400/10 rounded-full blur-3xl"></div>
              <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-cyan-500 text-white rounded-3xl flex items-center justify-center mx-auto mb-4 shadow-xl shadow-blue-500/30 rotate-3 relative z-10">
                <svg className="w-12 h-12 -rotate-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path></svg>
              </div>
              <h2 className="text-2xl font-black text-blue-900 relative z-10 tracking-tight">Impor Database Warga (CSV)</h2>
              <p className="text-sm text-blue-900/60 max-w-md mx-auto leading-relaxed font-medium relative z-10">Format Wajib 12 Kolom: NIK, Nama, Jenis Kelamin, Tempat Lahir, Tanggal Lahir, Alamat, RT, RW, Status Keluarga, Status Perkawinan, Agama, Pekerjaan.</p>
              <div className="max-w-lg mx-auto mt-8 bg-white/70 p-6 rounded-3xl border-2 border-dashed border-blue-200 relative z-10 shadow-inner">
                 <input type="file" accept=".csv" onChange={handleImportCSV} className="block w-full text-sm text-blue-900 font-bold file:mr-4 file:py-3 file:px-6 file:rounded-xl file:border-0 file:bg-blue-100 file:text-blue-700 cursor-pointer hover:file:bg-blue-200 transition-all" disabled={isImporting} />
                 {isImporting && <p className="text-xs text-blue-600 mt-4 font-extrabold animate-pulse tracking-widest uppercase">Mengekstrak Data...</p>}
              </div>
            </div>
          </div>
        )}

        {/* MANAJEMEN DATABASE WARGA */}
        {activeMenu === 'hapus-warga' && (
          <div className="animate-fade-in-up space-y-5">
            <div className="bg-white/60 backdrop-blur-xl p-6 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white/60 flex flex-col md:flex-row justify-between items-center gap-5">
              <div>
                <h2 className="text-xl font-extrabold text-blue-900 tracking-tight">Manajemen Database Kependudukan</h2>
                <p className="text-xs text-blue-900/60 font-medium mt-1">Hapus massal atau edit data spesifik secara terpusat.</p>
              </div>
              <button 
                onClick={handleHapusWargaTerpilih} disabled={selectedNikWarga.length === 0}
                className={`px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-lg ${selectedNikWarga.length > 0 ? 'bg-gradient-to-r from-red-500 to-pink-500 text-white shadow-red-500/30 hover:-translate-y-0.5' : 'bg-white text-gray-400 shadow-none border border-gray-200 cursor-not-allowed'}`}
              >Hapus Terpilih ({selectedNikWarga.length})</button>
            </div>

            <div className="bg-white/60 backdrop-blur-xl p-3 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white/60 overflow-hidden flex flex-col">
              <div className="p-3 border-b border-white/50">
                 <input type="text" placeholder="Ketik Nama atau NIK warga..." value={searchWarga} onChange={(e) => setSearchWarga(e.target.value)} className="w-full p-4 bg-white/70 border border-blue-100 rounded-2xl text-sm outline-none focus:ring-2 focus:ring-cyan-400 shadow-inner font-semibold" />
              </div>

              <div className="overflow-x-auto p-2">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-blue-100/50 whitespace-nowrap">
                      <th className="p-4 text-center"><input type="checkbox" onChange={handleSelectAll} checked={filteredWargaList.length > 0 && selectedNikWarga.length === filteredWargaList.length} className="w-4 h-4 rounded text-blue-500 focus:ring-blue-500 cursor-pointer" /></th>
                      <th className="p-4 font-bold text-blue-900/60 uppercase tracking-wider text-[10px]">1. NIK</th>
                      <th className="p-4 font-bold text-blue-900/60 uppercase tracking-wider text-[10px]">2. Nama Lengkap</th>
                      <th className="p-4 font-bold text-blue-900/60 uppercase tracking-wider text-[10px]">3. L/P</th>
                      <th className="p-4 font-bold text-blue-900/60 uppercase tracking-wider text-[10px]">4. Tempat Lahir</th>
                      <th className="p-4 font-bold text-blue-900/60 uppercase tracking-wider text-[10px]">5. Tgl Lahir</th>
                      <th className="p-4 font-bold text-blue-900/60 uppercase tracking-wider text-[10px]">6. Alamat</th>
                      <th className="p-4 font-bold text-blue-900/60 uppercase tracking-wider text-[10px]">7. RT</th>
                      <th className="p-4 font-bold text-blue-900/60 uppercase tracking-wider text-[10px]">8. RW</th>
                      <th className="p-4 font-bold text-blue-900/60 uppercase tracking-wider text-[10px]">9. Status Klrg</th>
                      <th className="p-4 font-bold text-blue-900/60 uppercase tracking-wider text-[10px]">10. Kawin</th>
                      <th className="p-4 font-bold text-blue-900/60 uppercase tracking-wider text-[10px]">11. Agama</th>
                      <th className="p-4 font-bold text-blue-900/60 uppercase tracking-wider text-[10px]">12. Pekerjaan</th>
                      <th className="p-4 font-bold text-blue-900/60 uppercase tracking-wider text-[10px] text-center">Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredWargaList.length === 0 ? (
                      <tr><td colSpan="14" className="text-center text-blue-900/40 py-12 font-medium italic text-sm">Tidak ada data di database.</td></tr>
                    ) : (
                      filteredWargaList.map((warga, idx) => (
                        <tr key={warga.nik} className={`border-b border-blue-50/50 hover:bg-white/50 transition-colors whitespace-nowrap ${idx % 2 === 0 ? 'bg-transparent' : 'bg-blue-50/20'}`}>
                          <td className="p-4 text-center"><input type="checkbox" checked={selectedNikWarga.includes(warga.nik)} onChange={() => handleSelectOne(warga.nik)} className="w-4 h-4 rounded text-blue-500 cursor-pointer" /></td>
                          <td className="p-4 font-mono text-cyan-600 font-bold">{warga.nik}</td>
                          <td className="p-4 font-extrabold text-blue-900">{warga.nama}</td>
                          <td className="p-4 text-blue-900/70 font-medium">{warga.jenis_kelamin}</td>
                          <td className="p-4 text-blue-900/70 font-medium">{warga.tempat_lahir || '-'}</td>
                          <td className="p-4 text-blue-900/70 font-medium">{warga.tanggal_lahir || '-'}</td>
                          <td className="p-4 text-blue-900/70 font-medium max-w-[120px] truncate">{warga.alamat || '-'}</td>
                          <td className="p-4 text-blue-900/70 font-medium">{warga.rt || '-'}</td>
                          <td className="p-4 text-blue-900/70 font-medium">{warga.rw || '-'}</td>
                          <td className="p-4 text-blue-900/70 font-medium">{warga.status_keluarga || '-'}</td>
                          <td className="p-4 text-blue-900/70 font-medium">{warga.status_perkawinan || '-'}</td>
                          <td className="p-4 text-blue-900/70 font-medium">{warga.agama || '-'}</td>
                          <td className="p-4 text-blue-900/70 font-medium">{warga.pekerjaan || '-'}</td>
                          <td className="p-4 text-center">
                            <button onClick={() => handleBukaEditWarga(warga)} className="bg-white hover:bg-blue-50 text-blue-600 border border-blue-200 px-4 py-1.5 rounded-lg font-bold text-[10px] shadow-sm transition-all">Edit</button>
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

        {/* PROFIL */}
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
        
        {/* Teks Powered by AI & Created by Aris Triono */}
        <div className="mt-8 pt-6 border-t border-blue-900/10 text-center flex flex-col items-center justify-center gap-1.5 pb-safe">
          <p className="text-[10px] font-bold text-blue-800/40 uppercase tracking-widest">Powered by AI</p>
          <p className="text-xs font-bold text-blue-900 bg-white/60 px-4 py-1.5 rounded-full border border-white shadow-sm">Created by Aris Triono</p>
        </div>
      </footer>

      {/* BOTTOM NAV MOBILE GLASSMORPHISM */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-xl border-t border-white/60 shadow-[0_-8px_30px_rgb(0,0,0,0.04)] flex justify-around p-1 pb-safe z-50">
        <button onClick={() => setActiveMenu('antrean')} className={`flex flex-col items-center w-full py-2.5 rounded-xl transition-all ${activeMenu === 'antrean' ? 'bg-gradient-to-r from-blue-500/10 to-cyan-500/10 text-blue-600 border border-blue-200/50' : 'text-blue-900/40'}`}><span className="text-[9px] font-extrabold uppercase tracking-widest">Antrean</span></button>
        <button onClick={() => setActiveMenu('arsip')} className={`flex flex-col items-center w-full py-2.5 rounded-xl transition-all ${activeMenu === 'arsip' ? 'bg-gradient-to-r from-blue-500/10 to-cyan-500/10 text-blue-600 border border-blue-200/50' : 'text-blue-900/40'}`}><span className="text-[9px] font-extrabold uppercase tracking-widest">Laporan</span></button>
        <button onClick={() => setActiveMenu('warga')} className={`flex flex-col items-center w-full py-2.5 rounded-xl transition-all ${activeMenu === 'warga' ? 'bg-gradient-to-r from-blue-500/10 to-cyan-500/10 text-blue-600 border border-blue-200/50' : 'text-blue-900/40'}`}><span className="text-[9px] font-extrabold uppercase tracking-widest">Impor</span></button>
        <button onClick={() => setActiveMenu('hapus-warga')} className={`flex flex-col items-center w-full py-2.5 rounded-xl transition-all ${activeMenu === 'hapus-warga' ? 'bg-gradient-to-r from-blue-500/10 to-cyan-500/10 text-blue-600 border border-blue-200/50' : 'text-blue-900/40'}`}><span className="text-[9px] font-extrabold uppercase tracking-widest">Database</span></button>
        <button onClick={() => setActiveMenu('profil')} className={`flex flex-col items-center w-full py-2.5 rounded-xl transition-all ${activeMenu === 'profil' ? 'bg-gradient-to-r from-blue-500/10 to-cyan-500/10 text-blue-600 border border-blue-200/50' : 'text-blue-900/40'}`}><span className="text-[9px] font-extrabold uppercase tracking-widest">Profil</span></button>
      </div>

      {/* MODAL EDIT WARGA */}
      {editWargaModal && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-blue-900/40 backdrop-blur-md">
          <div className="bg-white/90 backdrop-blur-2xl rounded-3xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl border border-white overflow-hidden animate-fade-in-up">
            <div className="p-5 bg-gradient-to-r from-blue-500 to-cyan-500 text-white flex justify-between items-center">
              <h3 className="font-extrabold text-base tracking-wide">Edit Data Warga</h3>
              <button onClick={() => setEditWargaModal(null)} className="text-white hover:text-blue-200 font-bold text-lg px-2">✕</button>
            </div>
            <form onSubmit={handleSimpanEditWarga} className="p-6 overflow-y-auto space-y-4 flex-1 text-sm bg-white/50">
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div><label className="block font-bold text-blue-900/80 mb-1.5 text-xs">1. NIK</label><input type="text" value={formEditWarga.nik} readOnly className="w-full p-3 bg-blue-50/50 border border-blue-100/50 rounded-xl font-bold text-blue-900 text-xs" /></div>
                <div><label className="block font-bold text-blue-900/80 mb-1.5 text-xs">2. Nama Lengkap</label><input type="text" value={formEditWarga.nama} onChange={e => setFormEditWarga({...formEditWarga, nama: e.target.value})} required className="w-full p-3 bg-white/70 border border-blue-100 rounded-xl outline-none focus:ring-2 focus:ring-cyan-400 text-xs shadow-inner" /></div>
                <div><label className="block font-bold text-blue-900/80 mb-1.5 text-xs">3. Jenis Kelamin</label><select value={formEditWarga.jenis_kelamin} onChange={e => setFormEditWarga({...formEditWarga, jenis_kelamin: e.target.value})} className="w-full p-3 bg-white/70 border border-blue-100 rounded-xl outline-none focus:ring-2 focus:ring-cyan-400 text-xs shadow-inner"><option value="Lk">Laki-Laki</option><option value="Pr">Perempuan</option></select></div>
                <div><label className="block font-bold text-blue-900/80 mb-1.5 text-xs">4. Tempat Lahir</label><input type="text" value={formEditWarga.tempat_lahir} onChange={e => setFormEditWarga({...formEditWarga, tempat_lahir: e.target.value})} required className="w-full p-3 bg-white/70 border border-blue-100 rounded-xl outline-none focus:ring-2 focus:ring-cyan-400 text-xs shadow-inner" /></div>
                <div><label className="block font-bold text-blue-900/80 mb-1.5 text-xs">5. Tanggal Lahir</label><input type="text" value={formEditWarga.tanggal_lahir} onChange={e => setFormEditWarga({...formEditWarga, tanggal_lahir: e.target.value})} required className="w-full p-3 bg-white/70 border border-blue-100 rounded-xl outline-none focus:ring-2 focus:ring-cyan-400 text-xs shadow-inner" /></div>
                <div className="md:col-span-2"><label className="block font-bold text-blue-900/80 mb-1.5 text-xs">6. Alamat (Jalan)</label><input type="text" value={formEditWarga.alamat} onChange={e => setFormEditWarga({...formEditWarga, alamat: e.target.value})} required className="w-full p-3 bg-white/70 border border-blue-100 rounded-xl outline-none focus:ring-2 focus:ring-cyan-400 text-xs shadow-inner" /></div>
                <div><label className="block font-bold text-blue-900/80 mb-1.5 text-xs">7. RT</label><input type="text" value={formEditWarga.rt} onChange={e => setFormEditWarga({...formEditWarga, rt: e.target.value})} required className="w-full p-3 bg-white/70 border border-blue-100 rounded-xl outline-none focus:ring-2 focus:ring-cyan-400 text-xs shadow-inner" /></div>
                <div><label className="block font-bold text-blue-900/80 mb-1.5 text-xs">8. RW</label><input type="text" value={formEditWarga.rw} onChange={e => setFormEditWarga({...formEditWarga, rw: e.target.value})} required className="w-full p-3 bg-white/70 border border-blue-100 rounded-xl outline-none focus:ring-2 focus:ring-cyan-400 text-xs shadow-inner" /></div>
                <div><label className="block font-bold text-blue-900/80 mb-1.5 text-xs">9. Status dalam Keluarga</label><input type="text" value={formEditWarga.status_keluarga} onChange={e => setFormEditWarga({...formEditWarga, status_keluarga: e.target.value})} required className="w-full p-3 bg-white/70 border border-blue-100 rounded-xl outline-none focus:ring-2 focus:ring-cyan-400 text-xs shadow-inner" /></div>
                <div><label className="block font-bold text-blue-900/80 mb-1.5 text-xs">10. Status Perkawinan</label><select value={formEditWarga.status_perkawinan} onChange={e => setFormEditWarga({...formEditWarga, status_perkawinan: e.target.value})} className="w-full p-3 bg-white/70 border border-blue-100 rounded-xl outline-none focus:ring-2 focus:ring-cyan-400 text-xs shadow-inner"><option value="Belum Kawin">Belum Kawin</option><option value="Kawin">Kawin</option><option value="Duda">Duda</option><option value="Janda">Janda</option></select></div>
                <div><label className="block font-bold text-blue-900/80 mb-1.5 text-xs">11. Agama</label><input type="text" value={formEditWarga.agama} onChange={e => setFormEditWarga({...formEditWarga, agama: e.target.value})} required className="w-full p-3 bg-white/70 border border-blue-100 rounded-xl outline-none focus:ring-2 focus:ring-cyan-400 text-xs shadow-inner" /></div>
                <div><label className="block font-bold text-blue-900/80 mb-1.5 text-xs">12. Pekerjaan</label><input type="text" value={formEditWarga.pekerjaan} onChange={e => setFormEditWarga({...formEditWarga, pekerjaan: e.target.value})} required className="w-full p-3 bg-white/70 border border-blue-100 rounded-xl outline-none focus:ring-2 focus:ring-cyan-400 text-xs shadow-inner" /></div>
              </div>
              <div className="pt-5 flex gap-3">
                <button type="button" onClick={() => setEditWargaModal(null)} className="flex-1 bg-white hover:bg-gray-50 border border-gray-200 text-gray-500 font-bold py-3.5 rounded-xl text-xs transition-all shadow-sm">Batal</button>
                <button type="submit" className="flex-[2] bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white font-bold py-3.5 rounded-xl text-xs shadow-[0_8px_20px_rgb(59,130,246,0.3)] hover:-translate-y-0.5 transition-all">Simpan Perubahan</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL VERIFIKASI SURAT RW */}
      {suratReview && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-blue-900/40 backdrop-blur-md">
          <div className="bg-white/90 backdrop-blur-2xl rounded-3xl w-full max-w-lg max-h-[90vh] flex flex-col shadow-2xl border border-white overflow-hidden animate-fade-in-up">
            <div className="p-5 bg-gradient-to-r from-blue-500 to-cyan-500 text-white flex justify-between items-center">
              <div><h3 className="font-extrabold text-base tracking-wide">Verifikasi Dokumen</h3><p className="text-[10px] text-cyan-100 font-medium mt-0.5">No. Surat: {suratReview.nomor_surat}</p></div>
              <button onClick={()=>setSuratReview(null)} className="text-white hover:text-blue-200 font-bold text-lg px-2">✕</button>
            </div>
            
            <div className="p-6 overflow-y-auto space-y-5 flex-1 text-sm bg-white/50">
              {!modeTolak ? (
                <>
                  <div className="bg-white/70 p-5 rounded-2xl border border-white shadow-sm space-y-2.5">
                    <h4 className="font-extrabold text-blue-900 border-b border-blue-100/50 pb-2.5 text-xs uppercase tracking-widest">Rincian Data Warga</h4>
                    <div className="grid grid-cols-3 gap-1"><span className="text-blue-900/50 text-xs font-bold">Nama</span><span className="col-span-2 font-black text-blue-900">: {suratReview.nama}</span></div>
                    <div className="grid grid-cols-3 gap-1"><span className="text-blue-900/50 text-xs font-bold">NIK</span><span className="col-span-2 font-black text-cyan-600">: {suratReview.nik}</span></div>
                    <div className="grid grid-cols-3 gap-1"><span className="text-blue-900/50 text-xs font-bold">Kelamin</span><span className="col-span-2 text-blue-900/80 font-semibold">: {suratReview.jenis_kelamin}</span></div>
                    <div className="grid grid-cols-3 gap-1"><span className="text-blue-900/50 text-xs font-bold">TTL</span><span className="col-span-2 text-blue-900/80 font-semibold">: {suratReview.ttl}</span></div>
                    <div className="grid grid-cols-3 gap-1"><span className="text-blue-900/50 text-xs font-bold">Alamat</span><span className="col-span-2 text-blue-900/80 font-semibold leading-relaxed">: {suratReview.alamat} (RT {suratReview.rt} / RW {suratReview.rw})</span></div>
                    <div className="grid grid-cols-3 gap-1"><span className="text-blue-900/50 text-xs font-bold">Pekerjaan</span><span className="col-span-2 text-blue-900/80 font-semibold">: {suratReview.pekerjaan}</span></div>
                    <div className="grid grid-cols-3 gap-1 bg-cyan-50/50 p-3 rounded-xl border border-cyan-100/50 mt-2"><span className="text-cyan-800 font-extrabold text-xs">Keperluan</span><span className="col-span-2 font-black text-blue-900">: {suratReview.keperluan}</span></div>
                  </div>

                  <div className="bg-white/70 p-5 rounded-2xl border border-white shadow-sm space-y-4">
                    <h4 className="font-extrabold text-blue-900 border-b border-blue-100/50 pb-2.5 text-xs uppercase tracking-widest">Dokumen Lampiran</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-[10px] font-extrabold text-blue-900/50 mb-1.5 uppercase tracking-wider">Foto KTP:</p>
                        {suratReview.fotoKTP ? (
                          <img src={suratReview.fotoKTP} alt="KTP" className="w-full h-32 object-cover rounded-xl border border-white shadow-md" />
                        ) : (
                          <div className="w-full h-32 bg-blue-50/50 flex items-center justify-center text-xs text-blue-900/30 rounded-xl border border-dashed border-blue-200 font-bold">Tidak ada KTP</div>
                        )}
                      </div>
                      <div>
                        <p className="text-[10px] font-extrabold text-blue-900/50 mb-1.5 uppercase tracking-wider">Foto KK:</p>
                        {suratReview.fotoKK ? (
                          <img src={suratReview.fotoKK} alt="KK" className="w-full h-32 object-cover rounded-xl border border-white shadow-md" />
                        ) : (
                          <div className="w-full h-32 bg-blue-50/50 flex items-center justify-center text-xs text-blue-900/30 rounded-xl border border-dashed border-blue-200 font-bold">Tidak ada KK</div>
                        )}
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <div className="bg-white/70 p-5 rounded-2xl border border-red-200 space-y-3 shadow-inner">
                  <h4 className="font-extrabold text-red-600 text-xs uppercase tracking-widest mb-2">Alasan Penolakan</h4>
                  <textarea value={alasanTolak} onChange={(e)=>setAlasanTolak(e.target.value)} placeholder="Contoh: Foto KTP buram, tidak bisa dibaca..." className="w-full p-4 bg-white border border-red-100 rounded-xl text-sm outline-none focus:ring-2 focus:ring-red-400" rows="4" required></textarea>
                </div>
              )}
            </div>

            <div className="p-5 bg-white/80 border-t border-blue-50 flex gap-3 backdrop-blur-md">
              {!modeTolak ? (
                <><button onClick={()=>setModeTolak(true)} className="flex-1 bg-white border border-red-200 text-red-500 hover:bg-red-50 font-extrabold py-3.5 rounded-xl text-xs transition-all shadow-sm">Tolak Dokumen</button>
                <button onClick={handleSetujui} className="flex-[2] bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-black py-3.5 rounded-xl shadow-[0_8px_20px_rgb(59,130,246,0.3)] hover:-translate-y-0.5 transition-all text-xs tracking-wider">Sahkan DB</button></>
              ) : (
                <><button onClick={()=>setModeTolak(false)} className="flex-1 bg-white border border-gray-200 text-gray-500 hover:bg-gray-50 font-extrabold py-3.5 rounded-xl text-xs transition-all shadow-sm">Batal</button>
                <button onClick={handleTolak} className="flex-[2] bg-gradient-to-r from-red-500 to-pink-500 text-white font-black py-3.5 rounded-xl shadow-[0_8px_20px_rgb(239,68,68,0.3)] hover:-translate-y-0.5 transition-all text-xs tracking-wider">Kirim Penolakan</button></>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}