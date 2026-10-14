import { useLocation, useNavigate } from 'react-router-dom'

export default function CetakSurat() {
  const navigate = useNavigate()
  const location = useLocation()

  // Ambil state data yang disahkan dari Firebase via router
  const suratDariState = location.state || {}

  const dataSurat = {
    nomor: suratDariState.nomor_surat || "148 / 001 / 04 / RW.05 / 2026",
    rt: suratDariState.rt_pengaju ? suratDariState.rt_pengaju.replace('RT ', '') : "04",
    rw: "05",
    nama: suratDariState.nama || "Budi Santoso",
    jk: suratDariState.jk || "Lk", 
    ttl: suratDariState.ttl || "Cilacap, 17 Agustus 1990",
    kewarganegaraan: suratDariState.kewarganegaraan || "WNI",
    agama: suratDariState.agama || "Islam",
    status_kawin: suratDariState.status_kawin || "Kawin", 
    pekerjaan: suratDariState.pekerjaan || "Wiraswasta",
    namaKK: suratDariState.namaKK || "Budi Santoso",
    hubunganKK: suratDariState.hubunganKK || "Kepala Keluarga",
    tempatTinggal: suratDariState.tempatTinggal || "Jl. Lingkar Selatan No. 12, RT 04 RW 05",
    nik: suratDariState.nik || "3301011234567890",
    keperluan: suratDariState.keperluan || "Pengurusan SKCK",
    berlakuMulai: suratDariState.berlakuMulai || "11 Oktober 2026 s/d 11 Januari 2027",
    keteranganLain: suratDariState.keterangan || "Orang tersebut benar-benar warga kami",
    tanggalCetak: suratDariState.tanggal || "11 Oktober 2026",
    status: suratDariState.status || "Draft" 
  }

  let tteRT = 'draft';
  let tteRW = 'draft';

  if (dataSurat.status === 'Menunggu RW' || dataSurat.status === 'Pending') {
    tteRT = 'disetujui'; tteRW = 'belum';
  } else if (dataSurat.status === 'Disetujui RW' || dataSurat.status === 'Disetujui') {
    tteRT = 'disetujui'; tteRW = 'disetujui';
  }

  const generateQRCode = (teks) => `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(teks)}`

  const handleCetakPDF = () => {
    window.print();
  }

  const teksQRSuratRT = `surat pengantar telah disetujui oleh ketua RT.${dataSurat.rt} tanggal : ${dataSurat.tanggalCetak}\nNIK Pemohon : ${dataSurat.nik}\nKeperluan Pemohon: ${dataSurat.keperluan}`
  const teksQRSuratRW = `surat pengantar telah disetujui oleh ketua RW.${dataSurat.rw} tanggal : ${dataSurat.tanggalCetak}\nNIK Pemohon : ${dataSurat.nik}\nKeperluan Pemohon: ${dataSurat.keperluan}`

  return (
    <div className="min-h-screen bg-gray-600 py-10 print:py-0 print:bg-white flex justify-center items-start">
      
      <style>
        {`
          @media print {
            @page { size: 165mm 215mm portrait; margin: 0; }
            body { -webkit-print-color-adjust: exact; }
          }
        `}
      </style>

      <div className="fixed top-5 right-5 flex flex-col gap-3 print:hidden z-50">
        <button onClick={handleCetakPDF} className="bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-xl shadow-lg flex items-center gap-2 transition-transform active:scale-95">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>
          Download / Cetak PDF
        </button>
        <button onClick={() => navigate(-1)} className="bg-gray-700 hover:bg-gray-800 text-white font-bold py-2 px-6 rounded-xl shadow-lg">
          Kembali
        </button>
      </div>

      <div id="area-surat-cetak" className="bg-white shadow-2xl print:shadow-none font-serif text-black relative mx-auto" style={{ width: '165mm', height: '215mm', padding: '12mm 10mm', boxSizing: 'border-box' }}>
        <div className="flex items-center justify-between border-b-[2.5px] border-black pb-1.5 mb-3">
          <div className="w-[15%] flex justify-center">
            <img src="/logo_clp.jpg" alt="Logo Cilacap" className="w-[14mm] h-auto object-contain grayscale" onError={(e) => e.target.style.display='none'} />
          </div>
          <div className="w-[70%] text-center font-bold text-[12pt] leading-[1.15]">
            <p>PEMERINTAH KABUPATEN CILACAP</p>
            <p>KECAMATAN CILACAP SELATAN</p>
            <p>KELURAHAN TAMBAKREJA</p>
            <p>RT. {dataSurat.rt} RW. {dataSurat.rw}</p>
          </div>
          <div className="w-[15%]"></div>
        </div>

        <div className="text-center mb-4">
          <h1 className="font-bold text-[10pt] underline tracking-wide">SURAT KETERANGAN PENGANTAR</h1>
          <p className="text-[9pt] mt-0.5">Nomor: {dataSurat.nomor}</p>
        </div>

        <div className="text-[9pt] mb-2">
          <p>Yang bertanda tangan dibawah ini, menerangkan bahwa :</p>
        </div>

        <table className="w-full text-[9pt] ml-1 mb-2 leading-[1.3]">
          <tbody>
            <tr><td className="w-[4%] align-top pb-[2px]">1.</td><td className="w-[32%] align-top pb-[2px]">Nama</td><td className="w-[2%] align-top pb-[2px]">:</td><td className="w-[62%] align-top pb-[2px] font-bold">{dataSurat.nama} <span className="ml-3 font-bold">.{dataSurat.jk}.</span> <span className="line-through text-gray-400 font-normal text-[8pt]">Lk/Pr</span>.</td></tr>
            <tr><td className="align-top pb-[2px]">2.</td><td className="align-top pb-[2px]">Tempat & Tgl Lahir</td><td className="align-top pb-[2px]">:</td><td className="align-top pb-[2px]">{dataSurat.ttl}</td></tr>
            <tr><td className="align-top pb-[2px]">3.</td><td className="align-top pb-[2px]">Warga Negara & Agama</td><td className="align-top pb-[2px]">:</td><td className="align-top pb-[2px]">{dataSurat.kewarganegaraan} / {dataSurat.agama}</td></tr>
            <tr><td className="align-top pb-[2px]">4.</td><td className="align-top pb-[2px]">Status</td><td className="align-top pb-[2px]">:</td><td className="align-top pb-[2px] font-bold">{dataSurat.status_kawin} <span className="font-normal text-gray-400 line-through text-[8pt]">(Blm Kawin/Kawin/Duda/Janda)</span></td></tr>
            <tr><td className="align-top pb-[2px]">5.</td><td className="align-top pb-[2px]">Pekerjaan</td><td className="align-top pb-[2px]">:</td><td className="align-top pb-[2px]">{dataSurat.pekerjaan}</td></tr>
            <tr><td className="align-top pb-[2px]">6.</td><td className="align-top pb-[2px]">Nama KK</td><td className="align-top pb-[2px]">:</td><td className="align-top pb-[2px]">{dataSurat.namaKK}</td></tr>
            <tr><td className="align-top pb-[2px]">7.</td><td className="align-top pb-[2px]">Hubungan dengan KK</td><td className="align-top pb-[2px]">:</td><td className="align-top pb-[2px]">{dataSurat.hubunganKK}</td></tr>
            <tr><td className="align-top pb-[2px]">8.</td><td className="align-top pb-[2px]">Tempat Tinggal</td><td className="align-top pb-[2px]">:</td><td className="align-top pb-[2px]">{dataSurat.tempatTinggal}</td></tr>
            <tr><td className="align-top pb-[2px]">9.</td><td className="align-top pb-[2px]">Kabupaten</td><td className="align-top pb-[2px]">:</td><td className="align-top pb-[2px]">{dataSurat.kabupaten}</td></tr>
            <tr><td className="align-top pb-[2px]">10.</td><td className="align-top pb-[2px]">Surat Bukti Diri</td><td className="align-top pb-[2px]">:</td><td className="align-top pb-[2px]">KTP. No. {dataSurat.nik}</td></tr>
            <tr><td className="align-top pb-[2px]">11.</td><td className="align-top pb-[2px]">Keperluan</td><td className="align-top pb-[2px]">:</td><td className="align-top pb-[2px] font-bold">{dataSurat.keperluan}</td></tr>
            <tr><td className="align-top pb-[2px]">12.</td><td className="align-top pb-[2px]">Berlaku mulai</td><td className="align-top pb-[2px]">:</td><td className="align-top pb-[2px]">{dataSurat.berlakuMulai}</td></tr>
            <tr><td className="align-top pb-[2px]">13.</td><td className="align-top pb-[2px]">Keterangan lain</td><td className="align-top pb-[2px]">:</td><td className="align-top pb-[2px]">{dataSurat.keteranganLain}</td></tr>
          </tbody>
        </table>

        <div className="text-[9pt] mt-3 mb-5">
          <p>Demikian untuk menjadi periksa bagi yang berkepentingan.</p>
        </div>

        <div className="flex justify-between text-[9pt] text-center w-full px-2 mt-auto">
          
          <div className="w-[48%] flex flex-col items-center">
            <p>Mengetahui:</p>
            <p>Ketua RW {dataSurat.rw}</p>
            
            {tteRW === 'disetujui' ? (
              <div className="flex flex-col items-center my-1">
                <img src={generateQRCode(teksQRSuratRW)} alt="QR RW" className="w-[14mm] h-[14mm] object-contain opacity-90" />
                <span className="text-[5pt] text-gray-500 mt-0.5 font-sans font-bold">Dokumen Sah (TTE)</span>
              </div>
            ) : tteRW === 'belum' ? (
              <div className="h-[16mm] flex items-center justify-center my-1 w-full">
                <span className="text-red-600 font-bold text-[7pt] leading-tight border border-red-500 p-1 bg-red-50 rounded">
                  BELUM DISETUJUI<br/>KETUA RW
                </span>
              </div>
            ) : (
              <div className="h-[16mm] flex items-center justify-center my-1">
                <span className="text-gray-300 font-bold border border-gray-200 p-1 rounded transform -rotate-12 tracking-widest text-[8pt]">DRAFT</span>
              </div>
            )}
            <p className="font-bold leading-none">( ................................... )</p>
          </div>
          
          <div className="w-[48%] flex flex-col items-center">
            <p>Tambakreja, {dataSurat.tanggalCetak}</p>
            <p>Ketua RT {dataSurat.rt}</p>
            
            {tteRT === 'disetujui' ? (
              <div className="flex flex-col items-center my-1">
                <img src={generateQRCode(teksQRSuratRT)} alt="QR RT" className="w-[14mm] h-[14mm] object-contain opacity-90" />
                <span className="text-[5pt] text-gray-500 mt-0.5 font-sans font-bold">Dokumen Sah (TTE)</span>
              </div>
            ) : (
              <div className="h-[16mm] flex items-center justify-center my-1">
                <span className="text-gray-300 font-bold border border-gray-200 p-1 rounded transform -rotate-12 tracking-widest text-[8pt]">DRAFT</span>
              </div>
            )}
            <p className="font-bold leading-none">( ................................... )</p>
          </div>

        </div>
      </div>
    </div>
  )
}
