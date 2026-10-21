import React, { useState, useEffect, useRef } from 'react';
import { auth, db, firebaseConfig } from './firebase'; 
import { collection, query, where, getDocs, addDoc, updateDoc, deleteDoc, doc, onSnapshot, setDoc, getDoc } from 'firebase/firestore';
import { updatePassword, signOut, getAuth, createUserWithEmailAndPassword } from 'firebase/auth';
import { initializeApp } from 'firebase/app';
import html2pdf from 'html2pdf.js';
import { toJpeg } from 'html-to-image';
import jsPDF from 'jspdf';

const secondaryApp = initializeApp(firebaseConfig, "SecondaryApp");
const secondaryAuth = getAuth(secondaryApp);

// ==========================================
// 0. KOMPONEN FOOTER MEDIA SOSIAL (TENGAH BAWAH)
// ==========================================
function FooterSosmed() {
  return (
    <footer className="mt-auto py-8 border-t border-white/10 flex flex-col items-center justify-center gap-3 text-center no-print">
      <div className="flex flex-wrap items-center justify-center gap-3">
        {/* Instagram Pill Badge */}
        <a 
          href="https://instagram.com/rw_05_tambakreja" 
          target="_blank" 
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2.5 px-5 py-2 rounded-full bg-gradient-to-r from-amber-500 via-rose-500 to-purple-600 text-white font-bold text-xs shadow-lg hover:opacity-95 transition-all hover:scale-105"
        >
          <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
            <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
          </svg>
          <span>@rw_05_tambakreja</span>
          <svg className="w-3.5 h-3.5 ml-0.5 opacity-80" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/></svg>
        </a>

        {/* TikTok Pill Badge */}
        <a 
          href="https://tiktok.com/@rw_05_tambakreja" 
          target="_blank" 
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2.5 px-5 py-2 rounded-full bg-black text-white border border-slate-700 font-bold text-xs shadow-lg hover:bg-slate-900 transition-all hover:scale-105"
        >
          <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
            <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-5.2 1.74 2.89 2.89 0 012.31-4.64 2.93 2.93 0 01.88.13V9.4a6.84 6.84 0 00-1-.05A6.33 6.33 0 003 15.68 6.34 6.34 0 009.68 22a6.34 6.34 0 006.33-6.33V9.22a8.16 8.16 0 004.85 1.57V7.34a4.85 4.85 0 01-1.27-.65z"/>
          </svg>
          <span>@rw_05_tambakreja</span>
          <svg className="w-3.5 h-3.5 ml-0.5 opacity-80" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/></svg>
        </a>
      </div>
      
      <p className="text-xs font-bold text-slate-300 mt-1">RUKUN WARGA 05 - KELURAHAN TAMBAKREJA</p>
      <p className="text-[11px] text-slate-400">Created by Aris Triono</p>
    </footer>
  );
}

// ==========================================
// 0.1 MODAL LAMPIRAN / PREVIEW DOKUMEN & FOTO/PDF
// ==========================================
function ModalLampiran({ surat, onClose }) {
  const [previewFile, setPreviewFile] = useState(null);
  const [previewLabel, setPreviewLabel] = useState("");

  if (!surat) return null;

  const handlePreview = (fileData, label) => {
    if (previewLabel === label) {
      setPreviewFile(null);
      setPreviewLabel("");
    } else {
      setPreviewFile(fileData);
      setPreviewLabel(label);
    }
  };

  const renderFileItem = (fileData, label) => {
    if (!fileData) return <p className="text-slate-600 italic text-xs px-2 mb-2">Tidak ada lampiran {label}</p>;
    
    const isActive = previewLabel === label;

    return (
      <button 
        onClick={() => handlePreview(fileData, label)}
        className={`w-full text-left p-4 rounded-xl flex items-center justify-between transition-all mb-2 border ${isActive ? 'bg-cyan-900/50 border-cyan-400' : 'bg-blue-950/40 border-cyan-500/30 hover:bg-blue-900/50'}`}
      >
        <div className="flex items-center gap-3">
          <span className="text-xl">{fileData.startsWith('data:application/pdf') ? '📄' : '🖼️'}</span>
          <span className="text-cyan-200 font-bold text-sm uppercase tracking-wider">{label}</span>
        </div>
        <span className={`text-xs px-3 py-1 rounded-lg font-bold ${isActive ? 'bg-rose-500 text-white' : 'bg-cyan-600 text-white'}`}>
          {isActive ? 'Tutup Preview' : 'Buka Preview'}
        </span>
      </button>
    );
  };

  return (
    <div className="fixed inset-0 z-[200] bg-black/80 backdrop-blur-sm flex justify-center items-center p-4">
      <div className="bg-slate-900 border border-cyan-500/40 rounded-3xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto text-slate-200 shadow-2xl">
        <div className="flex justify-between items-center border-b border-cyan-500/30 pb-4 mb-6">
          <div>
            <h3 className="text-lg font-black text-cyan-400">DAFTAR LAMPIRAN DOKUMEN</h3>
            <p className="text-xs text-slate-400 mt-1 uppercase">Atas Nama: <strong className="text-slate-200">{surat.nama}</strong></p>
          </div>
          <button onClick={onClose} className="text-rose-400 font-bold px-4 py-2 bg-rose-500/10 rounded-xl hover:bg-rose-500/20">Tutup ✕</button>
        </div>
        
        <div className="mb-2">
          {renderFileItem(surat.ktp, "KTP Warga")}
          {renderFileItem(surat.kk, "Kartu Keluarga (KK)")}
          
          {surat.pendukung && surat.pendukung.length > 0 && surat.pendukung.map((file, idx) => (
            <React.Fragment key={idx}>
              {renderFileItem(file, `Dokumen Pendukung ${idx + 1}`)}
            </React.Fragment>
          ))}
        </div>

        {previewFile && (
          <div className="mt-4 p-4 border border-cyan-500/40 rounded-2xl bg-black/60 animate-fade-in-up">
            <div className="flex justify-between items-center mb-3">
              <h4 className="text-cyan-300 font-bold text-sm">Menampilkan: {previewLabel}</h4>
            </div>
            
            {previewFile.startsWith('data:application/pdf') ? (
              <div className="space-y-3 text-center">
                <iframe src={previewFile} title={previewLabel} className="w-full h-80 rounded-xl border border-white/10 bg-white shadow-inner"></iframe>
                <a href={previewFile} download={`Lampiran_${previewLabel}_${surat.nik}.pdf`} className="inline-block bg-cyan-600 hover:bg-cyan-500 text-white px-5 py-2 rounded-xl text-xs font-bold shadow-lg">
                  📥 Download PDF Ini
                </a>
              </div>
            ) : (
              <div className="flex justify-center">
                <img src={previewFile} alt={previewLabel} className="w-full h-auto rounded-xl border border-white/10 object-contain max-h-[500px] shadow-2xl" />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ==========================================
// 0.2 MODAL LEMBAR VERIFIKASI SEBELUM KIRIM/SETUJU
// ==========================================
function ModalVerifikasiDetail({ surat, onClose, onKonfirmasi, judulTombolAksi, warnaTombol }) {
  const [showLampiran, setShowLampiran] = useState(false);
  if (!surat) return null;

  return (
    <div className="fixed inset-0 z-[190] bg-black/85 backdrop-blur-md flex justify-center items-center p-4">
      {showLampiran && <ModalLampiran surat={surat} onClose={() => setShowLampiran(false)} />}
      
      <div className="bg-slate-900 border border-cyan-500/50 rounded-3xl p-8 max-w-3xl w-full max-h-[92vh] overflow-y-auto text-slate-100 shadow-2xl">
        <div className="flex justify-between items-center border-b border-cyan-500/30 pb-4 mb-6">
          <div>
            <h2 className="text-xl font-black text-cyan-400">LEMBAR VERIFIKASI DATA PENGANTAR</h2>
            <p className="text-xs text-slate-400 uppercase tracking-wider mt-0.5">Periksa keabsahan data warga beserta dokumen lampirannya</p>
          </div>
          <button onClick={onClose} className="text-rose-400 font-bold px-4 py-2 bg-rose-500/10 hover:bg-rose-500/20 rounded-xl text-sm transition-all">Tutup ✕</button>
        </div>

        <div className="bg-blue-950/30 border border-cyan-500/20 rounded-2xl p-6 mb-6 space-y-3 text-sm">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div><span className="text-cyan-300 font-semibold text-xs block uppercase">1. NIK:</span> <span className="font-mono">{surat.nik}</span></div>
            <div><span className="text-cyan-300 font-semibold text-xs block uppercase">2. Nama Lengkap:</span> <strong className="uppercase">{surat.nama}</strong></div>
            <div><span className="text-cyan-300 font-semibold text-xs block uppercase">3. Jenis Kelamin:</span> {surat.jenis_kelamin === 'Lk' ? 'Laki-Laki' : 'Perempuan'}</div>
            <div><span className="text-cyan-300 font-semibold text-xs block uppercase">4. Tempat, Tanggal Lahir:</span> {surat.tempat_lahir}, {surat.tanggal_lahir}</div>
            <div><span className="text-cyan-300 font-semibold text-xs block uppercase">5. Agama:</span> {surat.agama}</div>
            <div><span className="text-cyan-300 font-semibold text-xs block uppercase">6. Pekerjaan:</span> {surat.pekerjaan}</div>
            <div><span className="text-cyan-300 font-semibold text-xs block uppercase">7. Status Perkawinan:</span> {surat.status_perkawinan}</div>
            <div><span className="text-cyan-300 font-semibold text-xs block uppercase">8. Hubungan / Status di KK:</span> {surat.status_keluarga}</div>
            <div><span className="text-cyan-300 font-semibold text-xs block uppercase">9. Nama Kepala Keluarga:</span> {surat.nama_kk || '-'}</div>
            
            <div><span className="text-cyan-300 font-semibold text-xs block uppercase">10. Alamat:</span> {surat.alamat}</div>
            <div><span className="text-cyan-300 font-semibold text-xs block uppercase">11. RT:</span> RT {surat.rt}</div>
            <div><span className="text-cyan-300 font-semibold text-xs block uppercase">12. RW:</span> RW {surat.rw || '05'}</div>

            <div><span className="text-cyan-300 font-semibold text-xs block uppercase">13. Keperluan Surat:</span> <strong className="text-cyan-300 uppercase">{surat.keperluan}</strong></div>
            <div><span className="text-cyan-300 font-semibold text-xs block uppercase">14. Masa Berlaku:</span> {surat.berlakuMulai}</div>
            <div className="md:col-span-3"><span className="text-cyan-300 font-semibold text-xs block uppercase">15. Keterangan Lain-lain:</span> {surat.keterangan || '-'}</div>
          </div>
        </div>

        <div className="flex items-center justify-between bg-white/5 border border-white/10 p-4 rounded-2xl mb-6">
          <div>
            <p className="font-bold text-cyan-300 text-sm">Lampiran Dokumen Warga</p>
            <p className="text-xs text-slate-400">Pastikan file KTP, KK, dan dokumen pendukung valid.</p>
          </div>
          <button onClick={() => setShowLampiran(true)} className="bg-blue-600 hover:bg-blue-500 text-white font-bold px-5 py-2.5 rounded-xl text-xs flex items-center gap-2 shadow-lg">
            📁 Lihat Lampiran Dokumen
          </button>
        </div>

        <div className="flex gap-4 pt-2">
          <button onClick={onClose} className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold py-3.5 rounded-xl text-sm transition-all">Batal</button>
          <button onClick={onKonfirmasi} className={`flex-1 font-bold py-3.5 rounded-xl text-sm shadow-lg text-white transition-all ${warnaTombol || 'bg-emerald-600 hover:bg-emerald-500'}`}>
            {judulTombolAksi}
          </button>
        </div>
      </div>
    </div>
  );
}

// ==========================================
// 1. KOMPONEN CETAK SURAT
// ==========================================
function CetakSurat({ surat, onKembali }) {
  const [namaRtAktif, setNamaRtAktif] = useState(surat.nama_rt || '');
  const [namaRwAktif, setNamaRwAktif] = useState(surat.nama_rw || '');
  
  const [isDownloading, setIsDownloading] = useState(false);
  const kertasSuratRef = useRef();

  useEffect(() => {
    const fetchPejabat = async () => {
      try {
        if (!surat.nama_rt) {
          const userRtQuery = query(collection(db, "users"), where("role", "==", "RT"), where("rt_number", "==", surat.rt));
          const userRtSnap = await getDocs(userRtQuery);
          if (!userRtSnap.empty && userRtSnap.docs[0].data().nama_lengkap) {
            setNamaRtAktif(userRtSnap.docs[0].data().nama_lengkap);
          }
        }
        if (!surat.nama_rw) {
          const userRwQuery = query(collection(db, "users"), where("role", "==", "RW"));
          const userRwSnap = await getDocs(userRwQuery);
          if (!userRwSnap.empty && userRwSnap.docs[0].data().nama_lengkap) {
            setNamaRwAktif(userRwSnap.docs[0].data().nama_lengkap);
          }
        }
      } catch (e) {
        console.error("Gagal memuat nama pejabat", e);
      }
    };
    fetchPejabat();
  }, [surat]);

  if (!surat) return <div className="text-center mt-20 font-bold text-cyan-400">Data tidak ditemukan!</div>;

  const qrTextRT = encodeURIComponent(`Disetujui Ketua RT ${surat.rt} RW ${surat.rw || '05'} Tgl ${surat.tanggal} NIK ${surat.nik} An ${surat.nama}`);
  const qrUrlRT = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${qrTextRT}`;

  const qrTextRW = encodeURIComponent(`Disetujui Ketua RW ${surat.rw || '05'} Tgl ${surat.tanggal} NIK ${surat.nik} An ${surat.nama}`);
  const qrUrlRW = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${qrTextRW}`;

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPdf = async () => {
    const element = kertasSuratRef.current;
    if (!element) return;

    setIsDownloading(true);

    try {
      const dataUrl = await toJpeg(element, { 
        quality: 1,
        pixelRatio: 2, 
        backgroundColor: '#ffffff',
        style: {
          margin: '0',
          position: 'initial',
          transform: 'none',
          boxShadow: 'none'
        }
      });

      const pdf = new jsPDF({ 
        unit: 'mm', 
        format: [165, 215], 
        orientation: 'portrait' 
      });

      pdf.addImage(dataUrl, 'JPEG', 0, 0, 165, 215);
      pdf.save(`Surat_Pengantar_${surat.nama}_RT${surat.rt}.pdf`);
    } catch (error) {
      console.error("Gagal membuat PDF:", error);
      alert("Terjadi kesalahan saat memproses dokumen PDF.");
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="cetak-wrapper bg-slate-900 print:bg-white print:py-0 print:min-h-0 min-h-screen py-6 font-serif text-black w-full absolute top-0 left-0 z-[100] flex flex-col items-center overflow-auto">
      <div className="max-w-[165mm] w-full mb-4 no-print flex justify-between px-2 font-sans gap-2">
        <button onClick={onKembali} className="bg-slate-700 hover:bg-slate-600 text-white font-bold px-4 py-2 rounded-xl shadow-lg transition-all text-xs">← Kembali</button>
        <div className="flex gap-2">
          <button onClick={handlePrint} className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-4 py-2 rounded-xl shadow-lg flex items-center gap-2 text-xs">🖨️ Cetak</button>
          
          <button 
            onClick={handleDownloadPdf} 
            disabled={isDownloading}
            className={`${isDownloading ? 'bg-emerald-800 cursor-not-allowed' : 'bg-emerald-600 hover:bg-emerald-700'} text-white font-bold px-4 py-2 rounded-xl shadow-lg flex items-center gap-2 text-xs transition-colors`}
          >
            {isDownloading ? '⏳ Memproses PDF...' : '📥 Download PDF'}
          </button>
        </div>
      </div>

      <div ref={kertasSuratRef} className="surat-container bg-white px-8 py-6 shadow-2xl mx-auto flex flex-col relative" style={{ width: '165mm', height: '215mm' }}>
        <div className="flex items-center justify-between border-b-[2.5px] border-black pb-2 mb-3">
          <div className="w-[60px] flex-shrink-0 flex justify-start">
            <img 
              src="/logo_clp.jpg" 
              alt="Logo Cilacap" 
              className="w-[52px] h-auto object-contain" 
              onError={(e) => { e.target.style.display = 'none'; }} 
            />
          </div>
          
          <div className="flex-1 text-center leading-tight">
            <h1 className="text-[14px] font-bold uppercase tracking-wide m-0 p-0">Pemerintah Kabupaten Cilacap</h1>
            <h1 className="text-[14px] font-bold uppercase tracking-wide m-0 p-0">Kecamatan Cilacap Selatan</h1>
            <h1 className="text-[14px] font-bold uppercase tracking-wide m-0 p-0">Kelurahan Tambakreja</h1>
            <h2 className="text-[14px] font-bold mt-1 m-0 p-0">RT. {surat.rt} &nbsp;&nbsp;&nbsp; RW. {surat.rw || '05'}</h2>
          </div>

          <div className="w-[60px] flex-shrink-0"></div>
        </div>

        <div className="text-center mb-4">
          <h3 className="text-[14px] font-bold underline uppercase tracking-widest">Surat Keterangan / Pengantar</h3>
          <p className="font-semibold text-[12px] mt-0.5">Nomor : {surat.nomor_surat || "148 / draft / ..... / RW.05 / 2026"}</p>
        </div>

        <div className="text-justify text-[12px] leading-relaxed flex-1">
          <p className="mb-2">Yang bertanda tangan dibawah ini, menerangkan bahwa :</p>
          <table className="w-full mb-3 text-[12px] border-collapse">
            <tbody>
              <tr>
                <td className="w-6 align-top py-[3px]">1.</td>
                <td className="w-36 align-top py-[3px]">Nama</td>
                <td className="w-2 align-top py-[3px]">:</td>
                <td className="py-[3px] font-bold uppercase">
                  {surat.nama} 
                  <span className="ml-2 font-normal normal-case">
                    {surat.jenis_kelamin?.toLowerCase() === 'lk' || surat.jenis_kelamin?.toLowerCase() === 'laki-laki' ? (
                      <span><strong>Laki-Laki</strong> / <span className="line-through text-gray-500">Perempuan</span></span>
                    ) : (
                      <span><span className="line-through text-gray-500">Laki-Laki</span> / <strong>Perempuan</strong></span>
                    )}
                  </span>
                </td>
              </tr>
              
              <tr><td className="align-top py-[3px]">2.</td><td className="align-top py-[3px]">Tempat & Tgl Lahir</td><td className="align-top py-[3px]">:</td><td className="py-[3px]">{surat.tempat_lahir}, {surat.tanggal_lahir}</td></tr>
              <tr><td className="align-top py-[3px]">3.</td><td className="align-top py-[3px]">Kewarganegaraan & Agama</td><td className="align-top py-[3px]">:</td><td className="py-[3px]">WNI / {surat.agama}</td></tr>
              
              <tr>
                <td className="align-top py-[3px]">4.</td>
                <td className="align-top py-[3px]">Status Perkawinan</td>
                <td className="align-top py-[3px]">:</td>
                <td className="py-[3px] font-bold">
                  {['Belum Kawin', 'Kawin', 'Duda', 'Janda'].map((st) => {
                    const isMatch = surat.status_perkawinan?.toLowerCase() === st.toLowerCase();
                    return (
                      <span key={st} className="mr-2">
                        {isMatch ? <u>{st}</u> : <span className="line-through text-gray-500 font-normal">{st}</span>}
                      </span>
                    );
                  })}
                </td>
              </tr>

              <tr><td className="align-top py-[3px]">5.</td><td className="align-top py-[3px]">Pekerjaan</td><td className="align-top py-[3px]">:</td><td className="py-[3px]">{surat.pekerjaan}</td></tr>
              <tr><td className="align-top py-[3px]">6.</td><td className="align-top py-[3px]">Nama KK</td><td className="align-top py-[3px]">:</td><td className="py-[3px] uppercase font-bold">{surat.status_keluarga === 'Kepala Keluarga' ? surat.nama : surat.nama_kk || '...........................................'}</td></tr>
              <tr><td className="align-top py-[3px]">7.</td><td className="align-top py-[3px]">Hubungan dengan KK</td><td className="align-top py-[3px]">:</td><td className="py-[3px]">{surat.status_keluarga}</td></tr>
              
              <tr>
                <td className="align-top py-[3px]">8.</td>
                <td className="align-top py-[3px]">Tempat Tinggal</td><td className="align-top py-[3px]">:</td><td className="align-top py-[3px] capitalize">
                  {surat.alamat}, RT {surat.rt} / RW {surat.rw || '05'}, Kelurahan Tambakreja
                </td>
              </tr>

              <tr><td className="align-top py-[3px]">9.</td><td className="align-top py-[3px]">Kabupaten</td><td className="align-top py-[3px]">:</td><td className="align-top py-[3px]">Cilacap Propinsi Jawa Tengah</td></tr>
              <tr><td className="align-top py-[3px]">10.</td><td className="align-top py-[3px]">Surat Bukti Diri (KTP)</td><td className="align-top py-[3px]">:</td><td className="align-top py-[3px] tracking-wider">{surat.nik}</td></tr>
              <tr><td className="align-top py-[3px]">11.</td><td className="align-top py-[3px]">Keperluan</td><td className="align-top py-[3px]">:</td><td className="align-top py-[3px] font-bold uppercase">{surat.keperluan}</td></tr>
              <tr><td className="align-top py-[3px]">12.</td><td className="align-top py-[3px]">Berlaku mulai</td><td className="align-top py-[3px]">:</td><td className="align-top py-[3px]">{surat.berlakuMulai}</td></tr>
              <tr><td className="align-top py-[3px]">13.</td><td className="align-top py-[3px]">Keterangan lain-lain</td><td className="align-top py-[3px]">:</td><td className="align-top py-[3px]">{surat.keterangan || "-"}</td></tr>
            </tbody>
          </table>

          <div className="bg-gray-100 p-2 rounded border border-gray-300 text-[11px] font-semibold mb-3">
            <strong>Catatan :</strong> Bawalah dokumen sesuai dengan persyarat saat ke Kelurahan.
          </div>

          <p className="mb-0">Demikian untuk menjadi periksa bagi yang berkepentingan</p>
        </div>
        
        <div className="flex justify-between text-center text-[12px] mt-2 pb-2">
          <div className="w-1/2 flex flex-col items-center justify-end">
            <p className="mb-1">Mengetahui:</p>
            <p className="font-bold">Ketua RW {surat.rw || '05'}</p>
            <div className="h-14 flex items-center justify-center my-1.5">
              {surat.status === 'Disetujui RW' ? (
                <img src={qrUrlRW} alt="Barcode RW" crossOrigin="anonymous" className="h-14 w-14 object-contain" />
              ) : null}
            </div>
            <p className="font-bold underline uppercase tracking-wider text-[12px]">{namaRwAktif || "........................................"}</p>
          </div>
          
          <div className="w-1/2 flex flex-col items-center justify-end">
            <p className="mb-1">Tambakreja, {surat.tanggal || new Date().toLocaleDateString('id-ID')}</p>
            <p className="font-bold">Ketua RT {surat.rt} RW {surat.rw || '05'}</p>
            <div className="h-14 flex items-center justify-center my-1.5">
              {(surat.status === 'Menunggu RW' || surat.status === 'Disetujui RW') ? (
                <img src={qrUrlRT} alt="Barcode RT" crossOrigin="anonymous" className="h-14 w-14 object-contain" />
              ) : null}
            </div>
            <p className="font-bold underline uppercase tracking-wider text-[12px]">{namaRtAktif || "........................................"}</p>
          </div>
        </div>

        <div className="pt-1.5 border-t border-gray-300 text-center text-[9px] text-gray-500 font-sans mt-auto">
          dicetak dari E-Pantar ( Elektronik Surat Pengantar RT / RW.05 )
        </div>
      </div>

      <style>{`
        @media print { 
          @page { 
            size: 165mm 215mm; 
            margin: 0mm !important; 
          }
          
          html, body {
            background-color: #ffffff !important;
            margin: 0 !important;
            padding: 0 !important;
            width: 165mm !important;
            height: 215mm !important;
            overflow: hidden !important; 
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }

          .no-print { 
            display: none !important; 
          } 
          
          .cetak-wrapper {
            background: #ffffff !important;
            background-color: #ffffff !important;
            padding: 0 !important;
            margin: 0 !important;
          }

          .surat-container { 
            box-shadow: none !important; 
            border: none !important;
            background: #ffffff !important;
            width: 165mm !important; 
            height: 215mm !important; 
            margin: 0 auto !important; 
            padding: 8mm 10mm !important; 
            page-break-after: avoid !important;
            page-break-inside: avoid !important;
          }
        }
      `}</style>
    </div>
  );
}

// FUNGSI KOMPRESI FILE OTOMATIS
const processFile = (file) => {
  return new Promise((resolve) => {
    if (!file) { resolve(''); return; }
    
    if (file.type === 'application/pdf') {
      if (file.size > 250000) {
        alert(`File PDF "${file.name}" terlalu besar (${(file.size / 1024).toFixed(0)} KB).\n\nBatas maksimal PDF adalah 250 KB agar tidak melebihi kapasitas memori Firestore.`);
        resolve('');
        return;
      }
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (e) => resolve(e.target.result);
      return;
    }

    if (file.type.startsWith('image/')) {
      const reader = new FileReader(); 
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image(); 
        img.src = event.target.result;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_DIMENSION = 600; 
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > MAX_DIMENSION) {
              height *= MAX_DIMENSION / width;
              width = MAX_DIMENSION;
            }
          } else {
            if (height > MAX_DIMENSION) {
              width *= MAX_DIMENSION / height;
              height = MAX_DIMENSION;
            }
          }

          canvas.width = width; 
          canvas.height = height;
          const ctx = canvas.getContext('2d'); 
          ctx.drawImage(img, 0, 0, width, height);
          
          const compressedBase64 = canvas.toDataURL('image/jpeg', 0.25);
          resolve(compressedBase64);
        };
      };
      return;
    }

    resolve('');
  });
};

// ==========================================
// 2. DASBOR RT
// ==========================================
function DashboardRT({ onCetak, onLogout }) {
  const currentUserRT = localStorage.getItem("currentUserRT") || "04"; 
  const currentUid = auth.currentUser?.uid;
  const [activeMenu, setActiveMenu] = useState('formulir');
  const [cariNik, setCariNik] = useState('');
  const [statusPencarian, setStatusPencarian] = useState(null); 
  const [riwayatSurat, setRiwayatSurat] = useState([]);
  const [dataWargaRt, setDataWargaRt] = useState([]);
  const [editModeId, setEditModeId] = useState(null);
  const [namaPejabatRt, setNamaPejabatRt] = useState('');
  const [selectedModalSurat, setSelectedModalSurat] = useState(null);
  const [suratAkanKirimRt, setSuratAkanKirimRt] = useState(null);
  
  // STATE FILTER & PAGINASI DATA WARGA RT
  const [filterSearchWarga, setFilterSearchWarga] = useState('');
  const [itemsPerPageWarga, setItemsPerPageWarga] = useState(10);
  const [currentPageWarga, setCurrentPageWarga] = useState(1);

  const [formData, setFormData] = useState({ nik: '', nama: '', jenis_kelamin: 'Lk', tempat_lahir: '', tanggal_lahir: '', alamat: '', rt: currentUserRT, rw: '05', status_keluarga: '', status_perkawinan: 'Belum Kawin', agama: '', pekerjaan: '', keperluan: '', berlakuMulai: '', keterangan: '', nama_kk: '' });
  const [dokumen, setDokumen] = useState({ ktp: '', kk: '', pendukung: [] });

  const cameraInputKtpRef = useRef(null);
  const cameraInputKkRef = useRef(null);

  useEffect(() => {
    const q = query(collection(db, "surat"), where("rt_pengaju", "==", `RT ${currentUserRT}`));
    return onSnapshot(q, (snapshot) => { 
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })); 
      setRiwayatSurat(data.sort((a, b) => b.timestamp - a.timestamp)); 
    });
  }, [currentUserRT]);

  // PENYESUAIAN PENCATATAN RT MULTI-FORMAT ("001" SD "013", 1 SD 13)
  useEffect(() => {
    const unsubWarga = onSnapshot(collection(db, "warga"), (snapshot) => {
      const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      const targetRtNum = parseInt(currentUserRT, 10);

      const filteredByRt = list.filter(w => {
        if (w.rt === undefined || w.rt === null || w.rt === '') return false;
        return parseInt(w.rt, 10) === targetRtNum;
      });

      setDataWargaRt(filteredByRt);
    }, (error) => {
      console.error("Gagal mengambil data warga dari Firestore:", error);
    });

    return () => unsubWarga();
  }, [currentUserRT]);

  useEffect(() => {
    if (currentUid) {
      getDoc(doc(db, "users", currentUid)).then(docSnap => {
        if (docSnap.exists() && docSnap.data().nama_lengkap) {
          setNamaPejabatRt(docSnap.data().nama_lengkap);
        }
      });
    }
  }, [currentUid]);

  const hitungMasaBerlaku = () => {
    const hariIni = new Date();
    const tigaBulanLagi = new Date(hariIni);
    tigaBulanLagi.setMonth(tigaBulanLagi.getMonth() + 3);
    const formatTgl = (tgl) => tgl.toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit', year: 'numeric' });
    return `${formatTgl(hariIni)} s/d ${formatTgl(tigaBulanLagi)}`;
  };

  const handleCari = async (e, nikParam) => {
    if (e) e.preventDefault(); 
    setEditModeId(null); 
    const nikBersih = (nikParam || cariNik).trim();
    if (!nikBersih) return;

    const q = query(collection(db, "warga"), where("nik", "==", nikBersih)); 
    const querySnapshot = await getDocs(q);
    
    const baseData = { nik: nikBersih, rw: '05', keperluan: '', berlakuMulai: hitungMasaBerlaku(), keterangan: '-' };
    
    if (!querySnapshot.empty) {
      let warga = null; 
      querySnapshot.forEach(doc => { warga = doc.data(); });

      if (warga.rt && parseInt(warga.rt, 10) !== parseInt(currentUserRT, 10)) {
        alert(`AKSES DITOLAK!\n\nNIK ${nikBersih} atas nama ${warga.nama} adalah warga terdaftar di RT ${warga.rt}.\n\nAnda tidak memiliki izin untuk memproses pengajuan surat untuk warga di luar lingkup RT ${currentUserRT}.`);
        setStatusPencarian(null);
        return;
      }

      setStatusPencarian('ketemu'); 
      setFormData({ ...warga, ...baseData, rt: warga.rt || currentUserRT, rw: warga.rw || '05', nama_kk: warga.nama_kk || '' });
    } else { 
      setStatusPencarian('baru'); 
      setFormData({ ...baseData, rt: currentUserRT, rw: '05', nama: '', jenis_kelamin: 'Lk', tempat_lahir: '', tanggal_lahir: '', alamat: '', status_keluarga: '', status_perkawinan: 'Belum Kawin', agama: '', pekerjaan: '', nama_kk: '' }); 
    }
  };

  const handleBuatSuratDariWarga = (warga) => {
    setCariNik(warga.nik);
    setActiveMenu('formulir');
    handleCari(null, warga.nik);
  };

  const handleEditData = (surat) => {
    setEditModeId(surat.id);
    setFormData(surat);
    setStatusPencarian('edit');
    setActiveMenu('formulir');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleHapusSurat = async (id) => {
    if (window.confirm("Apakah Anda yakin ingin menghapus surat yang ditolak ini secara permanen?")) {
      try {
        await deleteDoc(doc(db, "surat", id));
        alert("Surat yang ditolak berhasil dihapus!");
      } catch (err) {
        alert("Gagal menghapus surat: " + err.message);
      }
    }
  };

  const handleFileChange = async (e, type) => {
    const file = e.target.files[0];
    if (file) {
      const resultBase64 = await processFile(file);
      if (resultBase64) {
        setDokumen(prev => ({ ...prev, [type]: resultBase64 }));
      }
    }
  };

  const handleMultiFileChange = async (e) => {
    const files = Array.from(e.target.files);
    if (dokumen.pendukung.length + files.length > 3) {
      alert("Maksimal 3 dokumen pendukung yang diperbolehkan.");
      return;
    }
    const processedFiles = await Promise.all(files.map(f => processFile(f)));
    setDokumen(prev => ({ ...prev, pendukung: [...prev.pendukung, ...processedFiles.filter(Boolean)].slice(0, 3) }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      let namaRwAktif = "";
      const usersSnap = await getDocs(query(collection(db, "users"), where("role", "==", "RW")));
      if (!usersSnap.empty) {
        namaRwAktif = usersSnap.docs[0].data().nama_lengkap || "";
      }

      const payload = { 
        ...formData, 
        ...dokumen, 
        rt_pengaju: `RT ${currentUserRT}`,
        nama_rt: namaPejabatRt,
        nama_rw: namaRwAktif
      };

      const payloadSize = new Blob([JSON.stringify(payload)]).size;
      if (payloadSize > 850000) {
        alert("Gagal menyimpan! Total ukuran file lampiran terlalu besar. Harap kurangi foto/PDF pendukung.");
        return;
      }
      
      if (editModeId) {
        await updateDoc(doc(db, "surat", editModeId), payload);
        alert("Data berhasil diperbarui!");
        setEditModeId(null);
      } else {
        payload.status = "Draft"; 
        payload.tanggal = new Date().toLocaleDateString('id-ID');
        
        const tahunIni = new Date().getFullYear();
        payload.nomor_surat = `148 / draft / ${currentUserRT} / RW.05 / ${tahunIni}`;

        payload.timestamp = Date.now();
        await addDoc(collection(db, "surat"), payload);
        alert("Data masuk ke Arsip. Silakan cek dan verifikasi di Menu Arsip sebelum dikirim ke RW.");
      }
      
      setStatusPencarian(null); 
      setCariNik(''); 
      setActiveMenu('arsip');
    } catch (error) {
      console.error("Gagal menyimpan formulir:", error);
      alert(`Terjadi kesalahan saat menyimpan data: ${error.message}`);
    }
  };

  const prosesKirimRWFinal = async () => {
    if (!suratAkanKirimRt) return;
    try {
      await updateDoc(doc(db, "surat", suratAkanKirimRt.id), { 
        status: "Menunggu RW",
        timestamp: Date.now() 
      });
      setSuratAkanKirimRt(null);
      alert("Dokumen berhasil diverifikasi dan dikirim ke antrean RW!");
    } catch (err) {
      alert("Gagal mengirim dokumen: " + err.message);
    }
  };

  const simpanNamaRt = async (e) => {
    e.preventDefault();
    const namaBaru = e.target.namaLengkap.value;
    if (currentUid) {
      try {
        await updateDoc(doc(db, "users", currentUid), { nama_lengkap: namaBaru });
        setNamaPejabatRt(namaBaru);
        alert("Nama Lengkap Ketua RT berhasil disimpan!");
      } catch (err) {
        alert("Gagal menyimpan nama: " + err.message);
      }
    }
  };

  const simpanPasswordRt = async (e) => {
    e.preventDefault();
    const passwordBaru = e.target.passwordBaru.value;
    if (currentUid && passwordBaru) {
      try {
        await updateDoc(doc(db, "users", currentUid), { password_plain: passwordBaru });
        if (auth.currentUser) {
          await updatePassword(auth.currentUser, passwordBaru);
        }
        alert("Password Ketua RT berhasil diubah!");
        e.target.reset();
      } catch (err) {
        alert("Gagal mengubah password: " + err.message);
      }
    }
  };

  // LOGIK FILTER & PAGINASI WARGA RT
  const filteredWargaRt = dataWargaRt.filter(w => {
    const term = filterSearchWarga.toLowerCase();
    return (w.nama || '').toLowerCase().includes(term) || 
           (w.nik || '').includes(term) || 
           (w.alamat || '').toLowerCase().includes(term) ||
           (w.pekerjaan || '').toLowerCase().includes(term);
  });

  const totalPagesWargaRt = itemsPerPageWarga === 'semua' ? 1 : Math.ceil(filteredWargaRt.length / itemsPerPageWarga) || 1;
  const paginatedWargaRt = itemsPerPageWarga === 'semua' 
    ? filteredWargaRt 
    : filteredWargaRt.slice((currentPageWarga - 1) * itemsPerPageWarga, currentPageWarga * itemsPerPageWarga);

  const inputClass = "w-full p-3 bg-blue-950/40 border border-cyan-500/30 text-cyan-50 rounded-xl outline-none focus:ring-1 focus:ring-cyan-400 text-sm";
  const labelClass = "block font-semibold text-cyan-300 mb-1 text-xs uppercase";

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-cyan-950 font-sans text-slate-200 flex flex-col justify-between">
      <div>
        {selectedModalSurat && <ModalLampiran surat={selectedModalSurat} onClose={() => setSelectedModalSurat(null)} />}
        
        {suratAkanKirimRt && (
          <ModalVerifikasiDetail 
            surat={suratAkanKirimRt} 
            onClose={() => setSuratAkanKirimRt(null)} 
            onKonfirmasi={prosesKirimRWFinal}
            judulTombolAksi="Kirim Dokumen ke RW"
            warnaTombol="bg-emerald-600 hover:bg-emerald-500"
          />
        )}
        
        <nav className="bg-white/5 backdrop-blur-xl border-b border-white/10 p-4 flex justify-between items-center">
          <div className="font-extrabold text-cyan-400 flex items-center gap-2"><div className="w-8 h-8 bg-cyan-600 text-white flex items-center justify-center rounded-lg">{currentUserRT}</div> RT SYSTEM</div>
          <div className="flex gap-2 text-xs">
            <button onClick={() => setActiveMenu('formulir')} className={`px-4 py-2 rounded-xl ${activeMenu==='formulir' ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500' : 'text-slate-400 hover:text-cyan-300'}`}>FORMULIR</button>
            <button onClick={() => setActiveMenu('arsip')} className={`px-4 py-2 rounded-xl ${activeMenu==='arsip' ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500' : 'text-slate-400 hover:text-cyan-300'}`}>ARSIP</button>
            <button onClick={() => setActiveMenu('warga')} className={`px-4 py-2 rounded-xl ${activeMenu==='warga' ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500' : 'text-slate-400 hover:text-cyan-300'}`}>DATA WARGA</button>
            <button onClick={() => setActiveMenu('profil')} className={`px-4 py-2 rounded-xl ${activeMenu==='profil' ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500' : 'text-slate-400 hover:text-cyan-300'}`}>PROFIL</button>
            <button onClick={onLogout} className="px-4 py-2 text-rose-400 hover:bg-rose-500/10 rounded-xl">LOGOUT</button>
          </div>
        </nav>

        <div className="p-4 max-w-6xl mx-auto space-y-6 mt-4">
          {activeMenu === 'formulir' && (
            <div className="animate-fade-in-up">
              <div className="bg-white/5 border border-white/10 p-6 rounded-3xl mb-6">
                <form onSubmit={handleCari} className="flex gap-4">
                  <input type="text" value={cariNik} onChange={(e) => setCariNik(e.target.value)} placeholder="KETIK NIK WARGA..." className={`${inputClass} py-4 font-mono`} required={!editModeId} disabled={editModeId} />
                  <button type="submit" disabled={editModeId} className="bg-cyan-600 text-white font-bold px-8 rounded-xl disabled:opacity-50">CARI</button>
                </form>
              </div>
              
              {statusPencarian && (
                <form onSubmit={handleSubmit} className="bg-white/5 border border-white/10 p-6 rounded-3xl space-y-4">
                  <div className="flex justify-between items-center border-b border-cyan-500/30 pb-2 mb-4">
                    <h2 className="text-lg font-bold text-cyan-400">{editModeId ? "MODE EDIT DATA" : "DATA PENGANTAR (14 KOLOM)"}</h2>
                    {editModeId && <button type="button" onClick={() => {setEditModeId(null); setStatusPencarian(null)}} className="text-rose-400 font-bold text-xs bg-rose-500/10 px-3 py-1.5 rounded-lg">BATAL EDIT</button>}
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div><label className={labelClass}>1. NIK</label><input name="nik" value={formData.nik} readOnly className={`${inputClass} bg-black/20 text-slate-500`} /></div>
                    <div><label className={labelClass}>2. Nama Lengkap</label><input name="nama" value={formData.nama} onChange={e=>setFormData({...formData, nama: e.target.value})} className={inputClass} required/></div>
                    <div><label className={labelClass}>3. Jenis Kelamin</label><select name="jenis_kelamin" value={formData.jenis_kelamin} onChange={e=>setFormData({...formData, jenis_kelamin: e.target.value})} className={inputClass}><option className="bg-slate-900" value="Lk">Laki-Laki</option><option className="bg-slate-900" value="Pr">Perempuan</option></select></div>
                    <div><label className={labelClass}>4. Tempat & Tgl Lahir</label><div className="flex gap-2"><input name="tempat_lahir" value={formData.tempat_lahir} onChange={e=>setFormData({...formData, tempat_lahir: e.target.value})} className={inputClass} placeholder="Tempat" required/><input name="tanggal_lahir" value={formData.tanggal_lahir} onChange={e=>setFormData({...formData, tanggal_lahir: e.target.value})} className={inputClass} placeholder="Tanggal" required/></div></div>
                    <div><label className={labelClass}>5. Agama</label><input name="agama" value={formData.agama} onChange={e=>setFormData({...formData, agama: e.target.value})} className={inputClass} required/></div>
                    <div><label className={labelClass}>6. Pekerjaan</label><input name="pekerjaan" value={formData.pekerjaan} onChange={e=>setFormData({...formData, pekerjaan: e.target.value})} className={inputClass} required/></div>
                    <div><label className={labelClass}>7. Status Kawin</label><select name="status_perkawinan" value={formData.status_perkawinan} onChange={e=>setFormData({...formData, status_perkawinan: e.target.value})} className={inputClass}><option className="bg-slate-900" value="Belum Kawin">Belum Kawin</option><option className="bg-slate-900" value="Kawin">Kawin</option><option className="bg-slate-900" value="Duda">Duda</option><option className="bg-slate-900" value="Janda">Janda</option></select></div>
                    <div><label className={labelClass}>8. Status di KK</label><input name="status_keluarga" value={formData.status_keluarga} onChange={e=>setFormData({...formData, status_keluarga: e.target.value})} className={inputClass} required/></div>
                    <div><label className={labelClass}>9. Nama Kepala Keluarga</label><input name="nama_kk" value={formData.nama_kk} onChange={e=>setFormData({...formData, nama_kk: e.target.value})} className={inputClass} /></div>
                    
                    {/* PEMISAHAN TERPISAH: ALAMAT, RT, RW */}
                    <div><label className={labelClass}>10. Alamat (Jalan/Blok/Gang)</label><input name="alamat" value={formData.alamat} onChange={e=>setFormData({...formData, alamat: e.target.value})} className={inputClass} required/></div>
                    <div><label className={labelClass}>11. RT (Nomor RT)</label><input name="rt" value={formData.rt} readOnly className={`${inputClass} bg-black/20 text-slate-500 cursor-not-allowed`} title="Warga wajib diproses oleh RT masing-masing" required/></div>
                    <div><label className={labelClass}>12. RW (Nomor RW)</label><input name="rw" value={formData.rw || '05'} readOnly className={`${inputClass} bg-black/20 text-slate-500 cursor-not-allowed`} required/></div>
                    
                    <div><label className={labelClass}>13. Keperluan</label><input name="keperluan" value={formData.keperluan} onChange={e=>setFormData({...formData, keperluan: e.target.value})} className={`${inputClass} border-cyan-400 font-bold uppercase`} required/></div>
                    <div><label className={labelClass}>14. Berlaku Mulai (3 Bulan)</label><input name="berlakuMulai" value={formData.berlakuMulai} onChange={e=>setFormData({...formData, berlakuMulai: e.target.value})} className={inputClass} /></div>
                    <div><label className={labelClass}>15. Keterangan lain-lain</label><input name="keterangan" value={formData.keterangan} onChange={e=>setFormData({...formData, keterangan: e.target.value})} className={inputClass} placeholder="Contoh: -"/></div>
                  </div>

                  <div className="mt-6 p-4 bg-blue-900/20 rounded-2xl border border-cyan-500/20 space-y-4">
                    <h3 className="text-cyan-300 font-bold text-sm">LAMPIRAN DOKUMEN (PDF / FOTO / KAMERA)</h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                      <div className="space-y-2 bg-black/20 p-3 rounded-xl border border-white/5">
                        <label className="block font-semibold text-cyan-200">Foto / PDF KTP</label>
                        <input type="file" accept="image/*,.pdf" onChange={(e) => handleFileChange(e, 'ktp')} className="text-cyan-200 w-full text-[10px]" />
                        <button type="button" onClick={() => cameraInputKtpRef.current.click()} className="w-full bg-cyan-700 hover:bg-cyan-600 text-white py-1.5 rounded-lg font-bold flex items-center justify-center gap-1">
                          📸 Ambil dari Kamera
                        </button>
                        <input type="file" accept="image/*" capture="environment" ref={cameraInputKtpRef} onChange={(e) => handleFileChange(e, 'ktp')} className="hidden" />
                        {dokumen.ktp && <span className="text-emerald-400 block font-bold">✔ KTP Terunggah</span>}
                      </div>

                      <div className="space-y-2 bg-black/20 p-3 rounded-xl border border-white/5">
                        <label className="block font-semibold text-cyan-200">Foto / PDF KK</label>
                        <input type="file" accept="image/*,.pdf" onChange={(e) => handleFileChange(e, 'kk')} className="text-cyan-200 w-full text-[10px]" />
                        <button type="button" onClick={() => cameraInputKkRef.current.click()} className="w-full bg-cyan-700 hover:bg-cyan-600 text-white py-1.5 rounded-lg font-bold flex items-center justify-center gap-1">
                          📸 Ambil dari Kamera
                        </button>
                        <input type="file" accept="image/*" capture="environment" ref={cameraInputKkRef} onChange={(e) => handleFileChange(e, 'kk')} className="hidden" />
                        {dokumen.kk && <span className="text-emerald-400 block font-bold">✔ KK Terunggah</span>}
                      </div>

                      <div className="space-y-2 bg-black/20 p-3 rounded-xl border border-white/5">
                        <label className="block font-semibold text-cyan-200">Dokumen Pendukung Lainnya</label>
                        <input type="file" accept="image/*,.pdf" multiple onChange={handleMultiFileChange} className="text-cyan-200 w-full text-[10px]" />
                        <p className="text-[10px] text-slate-400">Dapat memilih banyak file (PDF/Foto)</p>
                        {dokumen.pendukung.length > 0 && <span className="text-emerald-400 block font-bold">✔ {dokumen.pendukung.length} File Pendukung</span>}
                      </div>
                    </div>
                  </div>

                  <button type="submit" className="w-full bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-4 rounded-xl mt-6 uppercase tracking-widest">{editModeId ? "UPDATE DATA" : "SIMPAN KE ARSIP (DRAFT)"}</button>
                </form>
              )}
            </div>
          )}

          {activeMenu === 'arsip' && (
            <div className="bg-white/5 border border-white/10 p-4 rounded-3xl overflow-hidden">
              <h2 className="text-lg font-bold text-cyan-400 mb-4 px-2 tracking-widest">ARSIP & VERIFIKASI PENGAJUAN</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-[11px] border-collapse whitespace-nowrap">
                  <thead>
                    <tr className="border-b border-cyan-500/30 text-cyan-300">
                      <th className="p-2">NIK</th><th className="p-2">Nama</th><th className="p-2">L/P</th><th className="p-2">TTL</th>
                      <th className="p-2">Agama</th><th className="p-2">Kerja</th><th className="p-2">Kawin</th><th className="p-2">Stt.KK</th>
                      <th className="p-2">Nm.KK</th><th className="p-2">Alamat</th><th className="p-2">RT</th><th className="p-2">RW</th><th className="p-2">Keperluan</th><th className="p-2">Berlaku</th>
                      <th className="p-2 text-center">Lampiran</th><th className="p-2 text-center">Status</th><th className="p-2 text-center">Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {riwayatSurat.map(s => (
                      <tr key={s.id} className="border-b border-white/5 hover:bg-white/5 text-slate-300">
                        <td className="p-2 font-mono">{s.nik}</td><td className="p-2 font-bold text-white">{s.nama}</td><td className="p-2">{s.jenis_kelamin}</td><td className="p-2">{s.tempat_lahir}, {s.tanggal_lahir}</td>
                        <td className="p-2">{s.agama}</td><td className="p-2">{s.pekerjaan}</td><td className="p-2">{s.status_perkawinan}</td><td className="p-2">{s.status_keluarga}</td>
                        <td className="p-2">{s.nama_kk}</td>
                        
                        {/* KOLOM TERPISAH: ALAMAT, RT, RW */}
                        <td className="p-2 truncate max-w-[100px]">{s.alamat}</td>
                        <td className="p-2 text-cyan-300 font-bold bg-cyan-900/20">RT {s.rt}</td>
                        <td className="p-2 text-cyan-300 font-bold bg-blue-900/20">RW {s.rw || '05'}</td>

                        <td className="p-2 font-bold uppercase">{s.keperluan}</td><td className="p-2">{s.berlakuMulai}</td>
                        
                        <td className="p-2 text-center">
                          <button onClick={() => setSelectedModalSurat(s)} className="bg-blue-600/30 border border-blue-400 text-blue-300 px-2 py-1 rounded text-[10px] font-bold">📁 Lihat Dokumen</button>
                        </td>

                        <td className="p-2 text-center">
                          <span 
                            onClick={() => { if(s.status === 'Ditolak') alert(`Alasan Penolakan:\n${s.alasan_penolakan || 'Tidak ada catatan alasan penolakan dari RW.'}`); }}
                            className={`px-2 py-1 rounded text-[10px] font-bold cursor-pointer ${s.status === 'Draft' ? 'bg-slate-700 text-white' : s.status === 'Ditolak' ? 'bg-rose-900/60 text-rose-300 underline hover:text-rose-100' : 'bg-blue-900/50 text-cyan-300'}`}
                            title={s.status === 'Ditolak' ? 'Klik untuk melihat alasan penolakan' : ''}
                          >
                            {s.status} {s.status === 'Ditolak' ? 'ℹ️' : ''}
                          </span>
                        </td>

                        <td className="p-2 text-center">
                          <div className="flex justify-center gap-1">
                            {s.status === 'Draft' && (
                              <>
                                <button onClick={() => setSuratAkanKirimRt(s)} className="bg-emerald-600 text-white px-2 py-1.5 rounded text-[10px] font-bold">Kirim RW</button>
                                <button onClick={() => handleEditData(s)} className="bg-transparent border border-cyan-500 text-cyan-400 px-2 py-1.5 rounded text-[10px] font-bold">Edit</button>
                              </>
                            )}
                            {s.status === 'Ditolak' && (
                              <>
                                <button onClick={() => setSuratAkanKirimRt(s)} className="bg-emerald-600 text-white px-2 py-1.5 rounded text-[10px] font-bold">Kirim Ulang</button>
                                <button onClick={() => handleEditData(s)} className="bg-transparent border border-cyan-500 text-cyan-400 px-2 py-1.5 rounded text-[10px] font-bold">Edit</button>
                                <button onClick={() => handleHapusSurat(s.id)} className="bg-rose-600 hover:bg-rose-500 text-white px-2 py-1.5 rounded text-[10px] font-bold">Hapus</button>
                              </>
                            )}
                            <button onClick={() => onCetak(s)} className="bg-cyan-600 text-white px-2 py-1.5 rounded text-[10px] font-bold">Cetak</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* MENU DATA WARGA RT */}
          {activeMenu === 'warga' && (
            <div className="bg-white/5 border border-white/10 p-6 rounded-3xl space-y-4">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-cyan-500/30 pb-4">
                <div>
                  <h2 className="text-lg font-bold text-cyan-400 tracking-wider uppercase">DATABASE WARGA RT {currentUserRT}</h2>
                  <p className="text-xs text-slate-400">Menampilkan data warga terdaftar yang dimuat langsung dari database RT {currentUserRT}</p>
                </div>
                <div className="text-xs text-cyan-300 bg-cyan-950/60 border border-cyan-500/40 px-3 py-1.5 rounded-xl font-bold">
                  Total: {filteredWargaRt.length} Warga
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-12 gap-3 bg-blue-950/30 p-4 rounded-2xl border border-white/5">
                <div className="md:col-span-8">
                  <label className="text-[10px] font-bold text-cyan-300 block mb-1 uppercase">Cari Warga (Nama / NIK / Alamat / Pekerjaan)</label>
                  <input 
                    type="text" 
                    value={filterSearchWarga} 
                    onChange={e => { setFilterSearchWarga(e.target.value); setCurrentPageWarga(1); }} 
                    placeholder="Ketik kata kunci pencarian warga..." 
                    className={inputClass} 
                  />
                </div>

                <div className="md:col-span-4">
                  <label className="text-[10px] font-bold text-cyan-300 block mb-1 uppercase">Tampilkan Per Halaman</label>
                  <select 
                    value={itemsPerPageWarga} 
                    onChange={e => { setItemsPerPageWarga(e.target.value === 'semua' ? 'semua' : Number(e.target.value)); setCurrentPageWarga(1); }} 
                    className={inputClass}
                  >
                    <option className="bg-slate-900" value={10}>10 Baris</option>
                    <option className="bg-slate-900" value={25}>25 Baris</option>
                    <option className="bg-slate-900" value={50}>50 Baris</option>
                    <option className="bg-slate-900" value={100}>100 Baris</option>
                    <option className="bg-slate-900" value="semua">Semua Data</option>
                  </select>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse whitespace-nowrap">
                  <thead>
                    <tr className="border-b border-cyan-500/30 text-cyan-300 bg-black/20">
                      <th className="p-3">No</th>
                      <th className="p-3">NIK</th>
                      <th className="p-3">Nama Lengkap</th>
                      <th className="p-3">L/P</th>
                      <th className="p-3">Tempat, Tgl Lahir</th>
                      <th className="p-3">Agama</th>
                      <th className="p-3">Pekerjaan</th>
                      <th className="p-3">Alamat</th>
                      <th className="p-3">RT</th>
                      <th className="p-3">RW</th>
                      <th className="p-3 text-center">Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedWargaRt.length > 0 ? (
                      paginatedWargaRt.map((w, idx) => (
                        <tr key={w.id || idx} className="border-b border-white/5 hover:bg-white/5 text-slate-300">
                          <td className="p-3 text-slate-500">
                            {itemsPerPageWarga === 'semua' ? idx + 1 : (currentPageWarga - 1) * itemsPerPageWarga + idx + 1}
                          </td>
                          <td className="p-3 font-mono text-cyan-200">{w.nik}</td>
                          <td className="p-3 font-bold text-white uppercase">{w.nama}</td>
                          <td className="p-3">{w.jenis_kelamin === 'Lk' ? 'L' : 'P'}</td>
                          <td className="p-3">{w.tempat_lahir}, {w.tanggal_lahir}</td>
                          <td className="p-3">{w.agama}</td>
                          <td className="p-3">{w.pekerjaan}</td>
                          
                          {/* KOLOM TERPISAH: ALAMAT, RT, RW */}
                          <td className="p-3 truncate max-w-[150px]">{w.alamat}</td>
                          <td className="p-3 font-bold text-cyan-300">RT {w.rt || currentUserRT}</td>
                          <td className="p-3 font-bold text-cyan-300">RW {w.rw || '05'}</td>

                          <td className="p-3 text-center">
                            <button 
                              onClick={() => handleBuatSuratDariWarga(w)} 
                              className="bg-cyan-600 hover:bg-cyan-500 text-white px-3 py-1.5 rounded-lg text-[10px] font-bold shadow-md transition-all"
                            >
                              ➕ Buat Surat
                            </button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="11" className="text-center py-8 text-slate-500 italic">Tidak ada data warga yang cocok dengan pencarian di database RT {currentUserRT}.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {itemsPerPageWarga !== 'semua' && totalPagesWargaRt > 1 && (
                <div className="flex justify-between items-center pt-2 text-xs text-slate-400">
                  <div>Halaman <strong>{currentPageWarga}</strong> dari <strong>{totalPagesWargaRt}</strong></div>
                  <div className="flex gap-2">
                    <button 
                      disabled={currentPageWarga === 1} 
                      onClick={() => setCurrentPageWarga(prev => Math.max(prev - 1, 1))} 
                      className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 font-bold"
                    >
                      ← Prev
                    </button>
                    <button 
                      disabled={currentPageWarga === totalPagesWargaRt} 
                      onClick={() => setCurrentPageWarga(prev => Math.min(prev + 1, totalPagesWargaRt))} 
                      className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 font-bold"
                    >
                      Next →
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeMenu === 'profil' && (
            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-white/5 border border-white/10 p-6 rounded-3xl">
                <h2 className="text-lg font-bold text-cyan-400 mb-4 uppercase tracking-widest">PENGATURAN NAMA KETUA RT {currentUserRT}</h2>
                <form onSubmit={simpanNamaRt} className="space-y-4">
                  <div>
                    <label className={labelClass}>Nama Lengkap (Untuk Tanda Tangan Surat)</label>
                    <input type="text" name="namaLengkap" defaultValue={namaPejabatRt} placeholder="Contoh: Ahmad Sutoro" className={inputClass} required />
                  </div>
                  <button type="submit" className="w-full bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-3 rounded-xl uppercase tracking-widest text-xs">Simpan Nama</button>
                </form>
              </div>

              <div className="bg-white/5 border border-white/10 p-6 rounded-3xl">
                <h2 className="text-lg font-bold text-cyan-400 mb-4 uppercase tracking-widest">PENGATURAN PASSWORD</h2>
                <form onSubmit={simpanPasswordRt} className="space-y-4">
                  <div>
                    <label className={labelClass}>Password Baru</label>
                    <input type="password" name="passwordBaru" placeholder="Masukkan password baru" className={inputClass} required />
                  </div>
                  <button type="submit" className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-xl uppercase tracking-widest text-xs">Ubah Password</button>
                </form>
              </div>
            </div>
          )}
        </div>
      </div>

      <FooterSosmed />
    </div>
  );
}

// ==========================================
// 3. DASBOR RW
// ==========================================
function DashboardRW({ onCetak, onLogout }) {
  const currentUid = auth.currentUser?.uid;
  const [activeMenu, setActiveMenu] = useState('antrian');
  const [semuaSurat, setSemuaSurat] = useState([]);
  const [dataWarga, setDataWarga] = useState([]);
  const [namaPejabatRw, setNamaPejabatRw] = useState('');
  const [selectedModalSurat, setSelectedModalSurat] = useState(null);
  const [suratVerifikasiRw, setSuratVerifikasiRw] = useState(null);
  const [wargaEditRw, setWargaEditRw] = useState(null);

  // STATE FILTER & PAGINASI DATA WARGA RW
  const [filterSearchWargaRw, setFilterSearchWargaRw] = useState('');
  const [filterRtWargaRw, setFilterRtWargaRw] = useState('semua');
  const [itemsPerPageWargaRw, setItemsPerPageWargaRw] = useState(10);
  const [currentPageWargaRw, setCurrentPageWargaRw] = useState(1);

  useEffect(() => {
    const unsubSurat = onSnapshot(query(collection(db, "surat"), where("rw", "==", "05")), snap => setSemuaSurat(snap.docs.map(d => ({id: d.id, ...d.data()})).sort((a,b) => b.timestamp - a.timestamp)));
    const unsubWarga = onSnapshot(collection(db, "warga"), snap => setDataWarga(snap.docs.map(d => ({id: d.id, ...d.data()}))));
    return () => { unsubSurat(); unsubWarga(); };
  }, []);

  useEffect(() => {
    if (currentUid) {
      getDoc(doc(db, "users", currentUid)).then(docSnap => {
        if (docSnap.exists() && docSnap.data().nama_lengkap) {
          setNamaPejabatRw(docSnap.data().nama_lengkap);
        }
      });
    }
  }, [currentUid]);

  const handleUpdateStatus = async (id, status) => { 
    let namaRwAktif = namaPejabatRw;
    if (!namaRwAktif && currentUid) {
      const docSnap = await getDoc(doc(db, "users", currentUid));
      if (docSnap.exists()) namaRwAktif = docSnap.data().nama_lengkap || "";
    }

    let alasan = "";
    if (status === 'Ditolak') {
      alasan = prompt("Masukkan alasan penolakan surat ini:") || "Tidak memenuhi persyaratan administrasi.";
    }

    const updateData = { 
      status, 
      nama_rw: namaRwAktif,
      ...(alasan ? { alasan_penolakan: alasan } : {})
    };

    if (status === 'Disetujui RW') {
      const approvedSnap = await getDocs(query(collection(db, "surat"), where("status", "==", "Disetujui RW")));
      const tahunIni = new Date().getFullYear();
      const nomorUrutOtomatis = String(approvedSnap.size + 1).padStart(3, '0');
      updateData.nomor_surat = `148 / ${nomorUrutOtomatis} / RW.05 / ${tahunIni}`;
    }

    await updateDoc(doc(db, "surat", id), updateData); 
    setSuratVerifikasiRw(null);
  };

  const handleSimpanEditWargaRw = async (e) => {
    e.preventDefault();
    if (!wargaEditRw) return;
    try {
      await updateDoc(doc(db, "warga", wargaEditRw.id), {
        nik: wargaEditRw.nik,
        nama: wargaEditRw.nama,
        rt: wargaEditRw.rt,
        rw: wargaEditRw.rw || '05',
        jenis_kelamin: wargaEditRw.jenis_kelamin,
        tempat_lahir: wargaEditRw.tempat_lahir,
        tanggal_lahir: wargaEditRw.tanggal_lahir,
        agama: wargaEditRw.agama,
        pekerjaan: wargaEditRw.pekerjaan,
        alamat: wargaEditRw.alamat,
        nama_kk: wargaEditRw.nama_kk || '',
        status_keluarga: wargaEditRw.status_keluarga || '',
        status_perkawinan: wargaEditRw.status_perkawinan || 'Belum Kawin'
      });
      alert("Data warga berhasil diperbarui oleh RW!");
      setWargaEditRw(null);
    } catch (err) {
      alert("Gagal memperbarui data warga: " + err.message);
    }
  };

  const simpanNamaRw = async (e) => {
    e.preventDefault();
    const namaBaru = e.target.namaLengkap.value;
    if (currentUid) {
      try {
        await updateDoc(doc(db, "users", currentUid), { nama_lengkap: namaBaru });
        setNamaPejabatRw(namaBaru);
        alert("Nama Lengkap Ketua RW berhasil disimpan!");
      } catch (err) {
        alert("Gagal menyimpan nama: " + err.message);
      }
    }
  };

  const simpanPasswordRw = async (e) => {
    e.preventDefault();
    const passwordBaru = e.target.passwordBaru.value;
    if (currentUid && passwordBaru) {
      try {
        await updateDoc(doc(db, "users", currentUid), { password_plain: passwordBaru });
        if (auth.currentUser) {
          await updatePassword(auth.currentUser, passwordBaru);
        }
        alert("Password Ketua RW berhasil diubah!");
        e.target.reset();
      } catch (err) {
        alert("Gagal mengubah password: " + err.message);
      }
    }
  };

  // LOGIK FILTER & PAGINASI WARGA RW
  const filteredWargaRw = dataWarga.filter(w => {
    const term = filterSearchWargaRw.toLowerCase();
    const matchSearch = (w.nama || '').toLowerCase().includes(term) || 
                        (w.nik || '').includes(term) || 
                        (w.alamat || '').toLowerCase().includes(term);
    
    const matchRt = filterRtWargaRw === 'semua' || parseInt(w.rt, 10) === parseInt(filterRtWargaRw, 10);

    return matchSearch && matchRt;
  });

  const totalPagesWargaRw = itemsPerPageWargaRw === 'semua' ? 1 : Math.ceil(filteredWargaRw.length / itemsPerPageWargaRw) || 1;
  const paginatedWargaRw = itemsPerPageWargaRw === 'semua' 
    ? filteredWargaRw 
    : filteredWargaRw.slice((currentPageWargaRw - 1) * itemsPerPageWargaRw, currentPageWargaRw * itemsPerPageWargaRw);

  const inputClass = "w-full p-3 bg-blue-950/40 border border-cyan-500/30 text-cyan-50 rounded-xl outline-none focus:ring-1 focus:ring-cyan-400 text-sm";
  const labelClass = "block font-semibold text-cyan-300 mb-1 text-xs uppercase";

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-cyan-950 font-sans text-slate-200 flex flex-col justify-between">
      <div>
        {selectedModalSurat && <ModalLampiran surat={selectedModalSurat} onClose={() => setSelectedModalSurat(null)} />}

        {/* MODAL EDIT DATA WARGA OLEH RW */}
        {wargaEditRw && (
          <div className="fixed inset-0 z-[190] bg-black/85 backdrop-blur-md flex justify-center items-center p-4">
            <div className="bg-slate-900 border border-cyan-500/50 rounded-3xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto text-slate-100 shadow-2xl">
              <div className="flex justify-between items-center border-b border-cyan-500/30 pb-3 mb-4">
                <h3 className="text-lg font-bold text-cyan-400 uppercase tracking-wider">EDIT DATA WARGA (SISTEM RW)</h3>
                <button onClick={() => setWargaEditRw(null)} className="text-rose-400 font-bold px-3 py-1 bg-rose-500/10 hover:bg-rose-500/20 rounded-lg text-xs">Tutup ✕</button>
              </div>
              
              <form onSubmit={handleSimpanEditWargaRw} className="space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div><label className={labelClass}>NIK Warga</label><input value={wargaEditRw.nik || ''} onChange={e => setWargaEditRw({...wargaEditRw, nik: e.target.value})} className={inputClass} required /></div>
                  <div><label className={labelClass}>Nama Lengkap</label><input value={wargaEditRw.nama || ''} onChange={e => setWargaEditRw({...wargaEditRw, nama: e.target.value})} className={inputClass} required /></div>
                  <div><label className={labelClass}>Jenis Kelamin</label><select value={wargaEditRw.jenis_kelamin || 'Lk'} onChange={e => setWargaEditRw({...wargaEditRw, jenis_kelamin: e.target.value})} className={inputClass}><option className="bg-slate-900" value="Lk">Laki-Laki</option><option className="bg-slate-900" value="Pr">Perempuan</option></select></div>
                  
                  <div><label className={labelClass}>Tempat Lahir</label><input value={wargaEditRw.tempat_lahir || ''} onChange={e => setWargaEditRw({...wargaEditRw, tempat_lahir: e.target.value})} className={inputClass} required /></div>
                  <div><label className={labelClass}>Tanggal Lahir</label><input value={wargaEditRw.tanggal_lahir || ''} onChange={e => setWargaEditRw({...wargaEditRw, tanggal_lahir: e.target.value})} className={inputClass} required /></div>
                  <div><label className={labelClass}>Agama</label><input value={wargaEditRw.agama || ''} onChange={e => setWargaEditRw({...wargaEditRw, agama: e.target.value})} className={inputClass} required /></div>
                  
                  <div><label className={labelClass}>Pekerjaan</label><input value={wargaEditRw.pekerjaan || ''} onChange={e => setWargaEditRw({...wargaEditRw, pekerjaan: e.target.value})} className={inputClass} required /></div>
                  <div><label className={labelClass}>Status Kawin</label><select value={wargaEditRw.status_perkawinan || 'Belum Kawin'} onChange={e => setWargaEditRw({...wargaEditRw, status_perkawinan: e.target.value})} className={inputClass}><option className="bg-slate-900" value="Belum Kawin">Belum Kawin</option><option className="bg-slate-900" value="Kawin">Kawin</option><option className="bg-slate-900" value="Duda">Duda</option><option className="bg-slate-900" value="Janda">Janda</option></select></div>
                  <div><label className={labelClass}>Status di KK</label><input value={wargaEditRw.status_keluarga || ''} onChange={e => setWargaEditRw({...wargaEditRw, status_keluarga: e.target.value})} className={inputClass} /></div>
                  
                  {/* PEMISAHAN FIELD ALAMAT, RT, RW */}
                  <div><label className={labelClass}>Alamat (Jalan/Blok)</label><input value={wargaEditRw.alamat || ''} onChange={e => setWargaEditRw({...wargaEditRw, alamat: e.target.value})} className={inputClass} required /></div>
                  <div><label className={labelClass}>Nomor RT</label><input value={wargaEditRw.rt || ''} onChange={e => setWargaEditRw({...wargaEditRw, rt: e.target.value})} className={inputClass} required /></div>
                  <div><label className={labelClass}>Nomor RW</label><input value={wargaEditRw.rw || '05'} onChange={e => setWargaEditRw({...wargaEditRw, rw: e.target.value})} className={inputClass} required /></div>
                </div>

                <div className="flex gap-3 pt-4">
                  <button type="button" onClick={() => setWargaEditRw(null)} className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 py-3 rounded-xl font-bold text-xs">Batal</button>
                  <button type="submit" className="flex-1 bg-cyan-600 hover:bg-cyan-500 text-white py-3 rounded-xl font-bold text-xs shadow-lg">Simpan Perubahan Warga</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {suratVerifikasiRw && (
          <div className="fixed inset-0 z-[190] bg-black/85 backdrop-blur-md flex justify-center items-center p-4">
            <div className="bg-slate-900 border border-cyan-500/50 rounded-3xl p-8 max-w-3xl w-full max-h-[92vh] overflow-y-auto text-slate-100 shadow-2xl">
              <div className="flex justify-between items-center border-b border-cyan-500/30 pb-4 mb-6">
                <div>
                  <h2 className="text-xl font-black text-cyan-400">LEMBAR VERIFIKASI RW - RT {suratVerifikasiRw.rt}</h2>
                  <p className="text-xs text-slate-400 uppercase tracking-wider mt-0.5">Periksa 14 poin data warga & lampiran sebelum memberikan persetujuan</p>
                </div>
                <button onClick={() => setSuratVerifikasiRw(null)} className="text-rose-400 font-bold px-4 py-2 bg-rose-500/10 hover:bg-rose-500/20 rounded-xl text-sm transition-all">Tutup ✕</button>
              </div>

              <div className="bg-blue-950/30 border border-cyan-500/20 rounded-2xl p-6 mb-6 space-y-3 text-sm">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div><span className="text-cyan-300 font-semibold text-xs block uppercase">1. NIK:</span> <span className="font-mono">{suratVerifikasiRw.nik}</span></div>
                  <div><span className="text-cyan-300 font-semibold text-xs block uppercase">2. Nama Lengkap:</span> <strong className="uppercase">{suratVerifikasiRw.nama}</strong></div>
                  <div><span className="text-cyan-300 font-semibold text-xs block uppercase">3. Jenis Kelamin:</span> {suratVerifikasiRw.jenis_kelamin === 'Lk' ? 'Laki-Laki' : 'Perempuan'}</div>
                  <div><span className="text-cyan-300 font-semibold text-xs block uppercase">4. Tempat, Tanggal Lahir:</span> {suratVerifikasiRw.tempat_lahir}, {suratVerifikasiRw.tanggal_lahir}</div>
                  <div><span className="text-cyan-300 font-semibold text-xs block uppercase">5. Agama:</span> {suratVerifikasiRw.agama}</div>
                  <div><span className="text-cyan-300 font-semibold text-xs block uppercase">6. Pekerjaan:</span> {suratVerifikasiRw.pekerjaan}</div>
                  <div><span className="text-cyan-300 font-semibold text-xs block uppercase">7. Status Perkawinan:</span> {suratVerifikasiRw.status_perkawinan}</div>
                  <div><span className="text-cyan-300 font-semibold text-xs block uppercase">8. Hubungan / Status di KK:</span> {suratVerifikasiRw.status_keluarga}</div>
                  <div><span className="text-cyan-300 font-semibold text-xs block uppercase">9. Nama Kepala Keluarga:</span> {suratVerifikasiRw.nama_kk || '-'}</div>
                  
                  <div><span className="text-cyan-300 font-semibold text-xs block uppercase">10. Alamat:</span> {suratVerifikasiRw.alamat}</div>
                  <div><span className="text-cyan-300 font-semibold text-xs block uppercase">11. RT:</span> RT {suratVerifikasiRw.rt}</div>
                  <div><span className="text-cyan-300 font-semibold text-xs block uppercase">12. RW:</span> RW {suratVerifikasiRw.rw || '05'}</div>

                  <div><span className="text-cyan-300 font-semibold text-xs block uppercase">13. Keperluan Surat:</span> <strong className="text-cyan-300 uppercase">{suratVerifikasiRw.keperluan}</strong></div>
                  <div><span className="text-cyan-300 font-semibold text-xs block uppercase">14. Masa Berlaku:</span> {suratVerifikasiRw.berlakuMulai}</div>
                  <div className="md:col-span-3"><span className="text-cyan-300 font-semibold text-xs block uppercase">15. Keterangan Lain-lain:</span> {suratVerifikasiRw.keterangan || '-'}</div>
                </div>
              </div>

              <div className="flex items-center justify-between bg-white/5 border border-white/10 p-4 rounded-2xl mb-6">
                <div>
                  <p className="font-bold text-cyan-300 text-sm">Lampiran Dokumen Warga</p>
                  <p className="text-xs text-slate-400">Pastikan file KTP, KK, dan dokumen pendukung lengkap.</p>
                </div>
                <button onClick={() => setSelectedModalSurat(suratVerifikasiRw)} className="bg-blue-600 hover:bg-blue-500 text-white font-bold px-5 py-2.5 rounded-xl text-xs flex items-center gap-2 shadow-lg">
                  📁 Lihat Dokumen Lampiran
                </button>
              </div>

              <div className="flex gap-4 pt-2">
                <button onClick={() => handleUpdateStatus(suratVerifikasiRw.id, 'Ditolak')} className="flex-1 bg-rose-600 hover:bg-rose-500 text-white font-bold py-3.5 rounded-xl text-sm shadow-lg transition-all">Tolak Pengajuan</button>
                <button onClick={() => { handleUpdateStatus(suratVerifikasiRw.id, 'Disetujui RW'); alert("Surat disetujui, Nomor Surat Resmi & Barcode RW Diterbitkan!"); }} className="flex-1 bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-3.5 rounded-xl text-sm shadow-lg transition-all">Setujui & Terbitkan Barcode</button>
              </div>
            </div>
          </div>
        )}

        <nav className="bg-white/5 border-b border-white/10 p-4 flex justify-between items-center overflow-x-auto whitespace-nowrap">
          <div className="font-extrabold text-cyan-400 mr-4">RW 05</div>
          <div className="flex gap-2 text-xs">
            {['antrian', 'arsip', 'warga', 'profil'].map(menu => (
              <button key={menu} onClick={() => setActiveMenu(menu)} className={`px-4 py-2 uppercase rounded-xl ${activeMenu===menu ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500' : 'text-slate-400'}`}>{menu}</button>
            ))}
            <button onClick={onLogout} className="px-4 py-2 text-rose-400 rounded-xl">LOGOUT</button>
          </div>
        </nav>

        <div className="p-4 max-w-7xl mx-auto mt-4">
          {activeMenu === 'antrian' && (
            <div className="bg-white/5 p-4 rounded-3xl border border-white/10">
              <h2 className="text-cyan-400 font-bold mb-4">ANTRIAN VERIFIKASI</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="border-b border-cyan-500/30 text-cyan-300">
                    <tr><th className="p-2">RT</th><th className="p-2">Warga</th><th className="p-2">Keperluan</th><th className="p-2 text-center">Aksi Verifikasi</th></tr>
                  </thead>
                  <tbody>
                    {semuaSurat.filter(s => s.status === 'Menunggu RW').map(s => (
                      <tr key={s.id} className="border-b border-white/5 hover:bg-white/5">
                        <td className="p-2 text-cyan-300 font-bold">RT {s.rt}</td>
                        <td className="p-2 font-bold">{s.nama}</td>
                        <td className="p-2 uppercase">{s.keperluan}</td>
                        <td className="p-2 text-center">
                          <button onClick={() => setSuratVerifikasiRw(s)} className="bg-cyan-600 hover:bg-cyan-500 px-4 py-2 rounded-xl text-white font-bold text-xs shadow-md">
                            🔍 Buka Lembar Verifikasi
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeMenu === 'arsip' && (
            <div className="bg-white/5 p-4 rounded-3xl border border-white/10 overflow-hidden">
              <h2 className="text-cyan-400 font-bold mb-4">ARSIP PENGAJUAN</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-[11px] border-collapse whitespace-nowrap">
                  <thead>
                    <tr className="border-b border-cyan-500/30 text-cyan-300">
                      <th className="p-2">NIK</th><th className="p-2">Nama</th><th className="p-2">L/P</th><th className="p-2">TTL</th>
                      <th className="p-2">Agama</th><th className="p-2">Kerja</th><th className="p-2">Kawin</th><th className="p-2">Stt.KK</th>
                      <th className="p-2">Nm.KK</th><th className="p-2">Alamat</th><th className="p-2">RT</th><th className="p-2">RW</th><th className="p-2">Keperluan</th><th className="p-2">Berlaku</th>
                      <th className="p-2 text-center">Lampiran</th><th className="p-2 text-center">Status</th><th className="p-2 text-center">Cetak</th>
                    </tr>
                  </thead>
                  <tbody>
                    {semuaSurat.filter(s => s.status !== 'Draft').map(s => (
                      <tr key={s.id} className="border-b border-white/5 text-slate-300">
                        <td className="p-2 font-mono">{s.nik}</td><td className="p-2 font-bold text-white">{s.nama}</td><td className="p-2">{s.jenis_kelamin}</td><td className="p-2">{s.tempat_lahir}, {s.tanggal_lahir}</td>
                        <td className="p-2">{s.agama}</td><td className="p-2">{s.pekerjaan}</td><td className="p-2">{s.status_perkawinan}</td><td className="p-2">{s.status_keluarga}</td>
                        <td className="p-2">{s.nama_kk}</td>
                        
                        {/* KOLOM TERPISAH: ALAMAT, RT, RW */}
                        <td className="p-2 truncate max-w-[80px]">{s.alamat}</td>
                        <td className="p-2 text-cyan-300 font-bold bg-cyan-900/20">RT {s.rt}</td>
                        <td className="p-2 text-cyan-300 font-bold bg-blue-900/20">RW {s.rw || '05'}</td>

                        <td className="p-2 font-bold uppercase">{s.keperluan}</td><td className="p-2">{s.berlakuMulai}</td>
                        
                        <td className="p-2 text-center">
                          <button onClick={() => setSelectedModalSurat(s)} className="bg-blue-600/30 border border-blue-400 text-blue-300 px-2 py-1 rounded text-[10px] font-bold">📁 Lihat Dokumen</button>
                        </td>

                        <td className="p-2 text-center">
                          <span 
                            onClick={() => { if(s.status === 'Ditolak') alert(`Alasan Penolakan:\n${s.alasan_penolakan || 'Tidak ada catatan alasan penolakan.'}`); }}
                            className={`px-2 py-1 rounded text-[10px] font-bold cursor-pointer ${s.status === 'Ditolak' ? 'bg-rose-900/60 text-rose-300 underline hover:text-rose-100' : 'text-cyan-400'}`}
                            title={s.status === 'Ditolak' ? 'Klik untuk melihat alasan penolakan' : ''}
                          >
                            {s.status} {s.status === 'Ditolak' ? 'ℹ️' : ''}
                          </span>
                        </td>

                        <td className="p-2 text-center"><button onClick={() => onCetak(s)} className="bg-cyan-600 px-2 py-1 rounded text-white text-[10px]">Cetak</button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* MENU DATA WARGA RW */}
          {activeMenu === 'warga' && (
            <div className="bg-white/5 p-6 rounded-3xl border border-white/10 space-y-4">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-cyan-500/30 pb-4">
                <div>
                  <h2 className="text-lg font-bold text-cyan-400 uppercase tracking-wider">DATABASE WARGA RW 05</h2>
                  <p className="text-xs text-slate-400">Pencarian & pengelolaan seluruh data warga di wilayah RW 05</p>
                </div>
                <div className="text-xs text-cyan-300 bg-cyan-950/60 border border-cyan-500/40 px-3 py-1.5 rounded-xl font-bold">
                  Total Hasil: {filteredWargaRw.length} Warga
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-12 gap-3 bg-blue-950/30 p-4 rounded-2xl border border-white/5">
                <div className="md:col-span-6">
                  <label className="text-[10px] font-bold text-cyan-300 block mb-1 uppercase">Cari Warga (Nama / NIK / Alamat)</label>
                  <input 
                    type="text" 
                    value={filterSearchWargaRw} 
                    onChange={e => { setFilterSearchWargaRw(e.target.value); setCurrentPageWargaRw(1); }} 
                    placeholder="Ketik nama atau NIK warga..." 
                    className={inputClass} 
                  />
                </div>

                <div className="md:col-span-3">
                  <label className="text-[10px] font-bold text-cyan-300 block mb-1 uppercase">Filter RT</label>
                  {/* PILIHAN RT DIPERBAARUI DARI RT 01 HINGGA RT 13 */}
                  <select 
                    value={filterRtWargaRw} 
                    onChange={e => { setFilterRtWargaRw(e.target.value); setCurrentPageWargaRw(1); }} 
                    className={inputClass}
                  >
                    <option className="bg-slate-900" value="semua">Semua RT</option>
                    <option className="bg-slate-900" value="01">RT 01</option>
                    <option className="bg-slate-900" value="02">RT 02</option>
                    <option className="bg-slate-900" value="03">RT 03</option>
                    <option className="bg-slate-900" value="04">RT 04</option>
                    <option className="bg-slate-900" value="05">RT 05</option>
                    <option className="bg-slate-900" value="06">RT 06</option>
                    <option className="bg-slate-900" value="07">RT 07</option>
                    <option className="bg-slate-900" value="08">RT 08</option>
                    <option className="bg-slate-900" value="09">RT 09</option>
                    <option className="bg-slate-900" value="10">RT 10</option>
                    <option className="bg-slate-900" value="11">RT 11</option>
                    <option className="bg-slate-900" value="12">RT 12</option>
                    <option className="bg-slate-900" value="13">RT 13</option>
                  </select>
                </div>

                <div className="md:col-span-3">
                  <label className="text-[10px] font-bold text-cyan-300 block mb-1 uppercase">Tampilkan Per Halaman</label>
                  <select 
                    value={itemsPerPageWargaRw} 
                    onChange={e => { setItemsPerPageWargaRw(e.target.value === 'semua' ? 'semua' : Number(e.target.value)); setCurrentPageWargaRw(1); }} 
                    className={inputClass}
                  >
                    <option className="bg-slate-900" value={10}>10 Baris</option>
                    <option className="bg-slate-900" value={25}>25 Baris</option>
                    <option className="bg-slate-900" value={50}>50 Baris</option>
                    <option className="bg-slate-900" value={100}>100 Baris</option>
                    <option className="bg-slate-900" value="semua">Semua Data</option>
                  </select>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse whitespace-nowrap">
                  <thead>
                    <tr className="border-b border-cyan-500/30 text-cyan-300 bg-black/20">
                      <th className="p-3">No</th>
                      <th className="p-3">NIK</th>
                      <th className="p-3">Nama Warga</th>
                      <th className="p-3">L/P</th>
                      <th className="p-3">TTL</th>
                      <th className="p-3">Agama</th>
                      <th className="p-3">Pekerjaan</th>
                      <th className="p-3">Alamat</th>
                      <th className="p-3">RT</th>
                      <th className="p-3">RW</th>
                      <th className="p-3 text-center">Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedWargaRw.length > 0 ? (
                      paginatedWargaRw.map((w, idx) => (
                        <tr key={w.id || idx} className="border-b border-white/5 hover:bg-white/5 text-slate-300">
                          <td className="p-3 text-slate-500">
                            {itemsPerPageWargaRw === 'semua' ? idx + 1 : (currentPageWargaRw - 1) * itemsPerPageWargaRw + idx + 1}
                          </td>
                          <td className="p-3 font-mono text-cyan-200">{w.nik}</td>
                          <td className="p-3 font-bold text-white uppercase">{w.nama}</td>
                          <td className="p-3">{w.jenis_kelamin === 'Lk' ? 'L' : 'P'}</td>
                          <td className="p-3">{w.tempat_lahir}, {w.tanggal_lahir}</td>
                          <td className="p-3">{w.agama}</td>
                          <td className="p-3">{w.pekerjaan}</td>
                          
                          {/* KOLOM TERPISAH: ALAMAT, RT, RW */}
                          <td className="p-3 truncate max-w-[150px]">{w.alamat}</td>
                          <td className="p-3 font-bold text-cyan-300">RT {w.rt}</td>
                          <td className="p-3 font-bold text-cyan-300">RW {w.rw || '05'}</td>

                          <td className="p-3 text-center">
                            <button 
                              onClick={() => setWargaEditRw(w)} 
                              className="text-cyan-400 border border-cyan-500/50 hover:bg-cyan-500/20 px-3 py-1 rounded-lg font-bold text-[11px] transition-all"
                            >
                              Edit
                            </button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="11" className="text-center py-8 text-slate-500 italic">Tidak ada data warga yang cocok dengan kriteria pencarian.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {itemsPerPageWargaRw !== 'semua' && totalPagesWargaRw > 1 && (
                <div className="flex justify-between items-center pt-2 text-xs text-slate-400">
                  <div>Halaman <strong>{currentPageWargaRw}</strong> dari <strong>{totalPagesWargaRw}</strong></div>
                  <div className="flex gap-2">
                    <button 
                      disabled={currentPageWargaRw === 1} 
                      onClick={() => setCurrentPageWargaRw(prev => Math.max(prev - 1, 1))} 
                      className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 font-bold"
                    >
                      ← Prev
                    </button>
                    <button 
                      disabled={currentPageWargaRw === totalPagesWargaRw} 
                      onClick={() => setCurrentPageWargaRw(prev => Math.min(prev + 1, totalPagesWargaRw))} 
                      className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 font-bold"
                    >
                      Next →
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeMenu === 'profil' && (
            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-white/5 border border-white/10 p-6 rounded-3xl">
                <h2 className="text-lg font-bold text-cyan-400 mb-4 uppercase tracking-widest">PENGATURAN NAMA KETUA RW 05</h2>
                <form onSubmit={simpanNamaRw} className="space-y-4">
                  <div>
                    <label className={labelClass}>Nama Lengkap (Untuk Tanda Tangan Surat)</label>
                    <input type="text" name="namaLengkap" defaultValue={namaPejabatRw} placeholder="Contoh: H. Sutarno" className={inputClass} required />
                  </div>
                  <button type="submit" className="w-full bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-3 rounded-xl uppercase tracking-widest text-xs">Simpan Nama</button>
                </form>
              </div>

              <div className="bg-white/5 border border-white/10 p-6 rounded-3xl">
                <h2 className="text-lg font-bold text-cyan-400 mb-4 uppercase tracking-widest">PENGATURAN PASSWORD</h2>
                <form onSubmit={simpanPasswordRw} className="space-y-4">
                  <div>
                    <label className={labelClass}>Password Baru</label>
                    <input type="password" name="passwordBaru" placeholder="Masukkan password baru" className={inputClass} required />
                  </div>
                  <button type="submit" className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-xl uppercase tracking-widest text-xs">Ubah Password</button>
                </form>
              </div>
            </div>
          )}
        </div>
      </div>

      <FooterSosmed />
    </div>
  );
}

// ==========================================
// 4. DASBOR ADMIN
// ==========================================
function DashboardAdmin({ onLogout }) {
  const [usersList, setUsersList] = useState([]);
  const [username, setUsername] = useState(''); 
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('Ketua RT');
  const [rtNumber, setRtNumber] = useState('01');
  const [loading, setLoading] = useState(false);

  const fetchUsers = async () => { 
    const snap = await getDocs(collection(db, "users")); 
    setUsersList(snap.docs.map(d => ({ uid: d.id, ...d.data() }))); 
  };
  
  useEffect(() => { fetchUsers(); }, []);

  const handleBuatAkun = async (e) => {
    e.preventDefault(); setLoading(true);
    try {
      let emailDaftar = username.trim().toLowerCase();
      if (!emailDaftar.includes('@')) emailDaftar += '@rw05.com';
      
      const cred = await createUserWithEmailAndPassword(secondaryAuth, emailDaftar, password);
      
      const roleSimpan = role === 'Ketua RT' ? 'RT' : 'RW';
      const userData = { 
        username: username.trim(), 
        role: roleSimpan, 
        password_plain: password, 
        nama_lengkap: username.trim() 
      };
      
      if (roleSimpan === 'RT') {
        userData.rt_number = rtNumber.trim();
      } else {
        userData.rt_number = '05';
      }

      await setDoc(doc(db, "users", cred.user.uid), userData);
      await signOut(secondaryAuth); 
      
      alert("Akun berhasil dibuat!"); 
      setUsername(''); 
      setPassword(''); 
      setRtNumber('01');
      fetchUsers();
    } catch (error) { 
      alert("Error: " + error.message); 
    } finally { 
      setLoading(false); 
    }
  };

  const handleHapusAkun = async (uid) => {
    if (window.confirm("Apakah Anda yakin ingin menghapus akun ini?")) { 
      await deleteDoc(doc(db, "users", uid)); 
      fetchUsers(); 
    }
  };

  const inputClass = "w-full p-3.5 bg-white border border-slate-200 text-slate-800 rounded-2xl outline-none focus:ring-2 focus:ring-cyan-500 text-sm placeholder:text-slate-400 shadow-sm";
  const labelClass = "block mb-1.5 text-xs font-bold text-slate-700 tracking-wide";

  return (
    <div className="min-h-screen bg-slate-900 font-sans text-slate-800 flex flex-col justify-between">
      <div>
        <div className="bg-white border-b border-slate-200 px-6 py-4 flex justify-between items-center shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-xl flex items-center justify-center text-white font-bold shadow-md">⚙️</div>
            <div><h1 className="text-base font-black text-slate-800 tracking-wider">PANEL ADMINISTRATOR</h1><p className="text-[11px] text-slate-500">E-Pantar (Elektronik Surat Pengantar RT/RW.05)</p></div>
          </div>
          <button onClick={onLogout} className="bg-rose-50 text-rose-600 border border-rose-200 px-5 py-2 rounded-xl text-xs font-bold hover:bg-rose-100 transition-all">Logout</button>
        </div>

        <div className="p-4 md:p-8 max-w-7xl mx-auto w-full">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            <div className="lg:col-span-5 bg-white border border-slate-200/80 p-7 rounded-3xl shadow-xl">
              <div className="flex items-center gap-2.5 mb-6 border-b border-slate-100 pb-4">
                <div className="p-2 bg-blue-50 text-blue-600 rounded-xl text-lg">👤</div>
                <h2 className="font-bold text-lg text-slate-800 tracking-wide">Buat Akun Baru</h2>
              </div>

              <form onSubmit={handleBuatAkun} className="space-y-4">
                <div>
                  <label className={labelClass}>Username</label>
                  <input type="text" value={username} onChange={e => setUsername(e.target.value)} placeholder="Contoh: RT01" required className={inputClass} />
                </div>

                <div>
                  <label className={labelClass}>Password (Min 6 Karakter)</label>
                  <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Ketik password..." required className={inputClass} />
                </div>

                <div>
                  <label className={labelClass}>Role Akun</label>
                  <select value={role} onChange={e => setRole(e.target.value)} className={inputClass}>
                    <option value="Ketua RT">Ketua RT</option>
                    <option value="Ketua RW">Ketua RW</option>
                  </select>
                </div>

                {role === 'Ketua RT' && (
                  <div>
                    <label className={labelClass}>Pilih RT (Contoh: 04)</label>
                    <input type="text" value={rtNumber} onChange={e => setRtNumber(e.target.value)} placeholder="01" required className={inputClass} maxLength="3"/>
                  </div>
                )}

                <button type="submit" disabled={loading} className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white font-bold py-4 rounded-2xl shadow-lg transition-all tracking-wider text-sm uppercase mt-4">
                  {loading ? 'Memproses...' : 'Buat Akun Sekarang'}
                </button>
              </form>
            </div>

            <div className="lg:col-span-7 bg-white border border-slate-200/80 p-6 rounded-3xl shadow-xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm border-collapse">
                  <tbody>
                    {usersList.map((user) => (
                      <tr key={user.uid} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                        <td className="p-4 font-bold text-slate-800">{user.username || user.email}</td>
                        <td className="p-4 font-mono text-rose-500 text-xs font-semibold">{user.password_plain ? user.password_plain : 'Disembunyikan'}</td>
                        <td className="p-4">
                          <span className="px-3 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-600 border border-blue-200">
                            {user.role === 'RT' ? `RT (RT ${user.rt_number})` : user.role === 'RW' ? 'RW' : 'Admin'}
                          </span>
                        </td>
                        <td className="p-4 text-right">
                          <button onClick={() => handleHapusAkun(user.uid)} className="bg-rose-50 text-rose-600 hover:bg-rose-100 px-4 py-1.5 rounded-xl border border-rose-200 text-xs font-bold transition-all">
                            Hapus
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="mt-6 text-right text-[11px] text-slate-400 italic">
                * Jika ingin mengedit akun, silakan Hapus akun lama dan Buat Akun baru.
              </div>
            </div>

          </div>
        </div>
      </div>

      <FooterSosmed />
    </div>
  );
}

// ==========================================
// 5. KONTROLER UTAMA SPA
// ==========================================
export default function DashboardTerpadu() {
  const [view, setView] = useState('dashboard'); 
  const [suratCetak, setSuratCetak] = useState(null);
  
  const rawRole = localStorage.getItem("role") || "RT"; 
  const userRole = rawRole.trim().toLowerCase(); 
  const currentEmail = auth.currentUser?.email?.toLowerCase() || "";

  const handleCetak = (data) => { setSuratCetak(data); setView('cetak'); };
  const handleKembali = () => { setSuratCetak(null); setView('dashboard'); };
  
  const handleLogout = async () => { 
    await signOut(auth); 
    localStorage.clear(); 
    window.location.href = '/'; 
  };

  if (view === 'cetak') return <CetakSurat surat={suratCetak} onKembali={handleKembali} />;
  
  if (userRole === 'admin' || userRole === 'administrator' || currentEmail === 'aris.triono.2024@gmail.com') {
    return <DashboardAdmin onLogout={handleLogout} />;
  }
  
  if (userRole === 'rw') {
    return <DashboardRW onCetak={handleCetak} onLogout={handleLogout} />;
  }
  
  return <DashboardRT onCetak={handleCetak} onLogout={handleLogout} />;
}