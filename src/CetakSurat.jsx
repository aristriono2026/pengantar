import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

export default function Cetak() {
  const location = useLocation();
  const navigate = useNavigate();
  const surat = location.state;

  // Jika halaman dibuka langsung tanpa data dari dashboard
  if (!surat) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
        <p className="text-xl font-bold text-gray-700 mb-4">Data surat tidak ditemukan!</p>
        <button onClick={() => navigate(-1)} className="px-6 py-2 bg-blue-600 text-white rounded-lg shadow-md hover:bg-blue-700">
          Kembali ke Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="bg-gray-200 min-h-screen py-8 font-serif text-black">
      
      {/* Tombol Aksi (Disembunyikan saat dicetak) */}
      <div className="max-w-4xl mx-auto mb-6 no-print flex justify-between px-4">
        <button onClick={() => navigate(-1)} className="bg-gray-600 hover:bg-gray-700 text-white font-bold px-6 py-2.5 rounded-xl shadow-sm transition-all">
          ← Kembali
        </button>
        <button onClick={() => window.print()} className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-6 py-2.5 rounded-xl shadow-sm flex items-center gap-2 transition-all">
          🖨️ Cetak Surat
        </button>
      </div>

      {/* KERTAS CETAK */}
      <div className="max-w-4xl mx-auto bg-white p-12 lg:p-16 shadow-2xl print:shadow-none print:p-0 print:m-0 print:w-full">
        
        {/* HEADER / KOP SURAT (DIPERBESAR) */}
        <div className="text-center border-b-[3px] border-black pb-5 mb-8">
          <h1 className="text-2xl font-extrabold uppercase tracking-wide">Pemerintah Kabupaten Cilacap</h1>
          <h1 className="text-2xl font-extrabold uppercase tracking-wide">Kecamatan Cilacap Selatan</h1>
          <h1 className="text-2xl font-extrabold uppercase tracking-wide">Kelurahan Tambakreja</h1>
          <h2 className="text-xl font-bold uppercase tracking-wider mt-1">Rukun Warga 05 / Rukun Tetangga {surat.rt}</h2>
          <p className="text-sm mt-2">Sekretariat: Jl. (Bisa diisi alamat balai RT/RW) Cilacap Selatan 53213</p>
        </div>

        {/* JUDUL SURAT */}
        <div className="text-center mb-10">
          <h3 className="text-xl font-black underline uppercase tracking-widest">Surat Pengantar RT / RW</h3>
          <p className="font-semibold mt-1 text-lg">Nomor : {surat.nomor_surat || "....... / ....... / ......."}</p>
        </div>

        {/* ISI SURAT */}
        <div className="text-justify space-y-5 text-lg leading-relaxed">
          <p>
            Yang bertanda tangan di bawah ini, Ketua RT {surat.rt} / RW {surat.rw} Kelurahan Tambakreja, 
            Kecamatan Cilacap Selatan, Kabupaten Cilacap, menerangkan dengan sebenarnya bahwa:
          </p>
          
          <table className="w-full ml-4 md:ml-8 my-6">
            <tbody>
              <tr>
                <td className="w-56 align-top py-1.5 font-semibold">Nama Lengkap</td>
                <td className="w-4 align-top py-1.5">:</td>
                <td className="py-1.5 font-bold uppercase">{surat.nama}</td>
              </tr>
              <tr>
                <td className="align-top py-1.5 font-semibold">NIK</td>
                <td className="align-top py-1.5">:</td>
                <td className="py-1.5 tracking-wider">{surat.nik}</td>
              </tr>
              <tr>
                <td className="align-top py-1.5 font-semibold">Jenis Kelamin</td>
                <td className="align-top py-1.5">:</td>
                <td className="py-1.5">{surat.jenis_kelamin === 'Lk' ? 'Laki-Laki' : 'Perempuan'}</td>
              </tr>
              <tr>
                <td className="align-top py-1.5 font-semibold">Tempat, Tanggal Lahir</td>
                <td className="align-top py-1.5">:</td>
                <td className="py-1.5">{surat.tempat_lahir}, {surat.tanggal_lahir}</td>
              </tr>
              <tr>
                <td className="align-top py-1.5 font-semibold">Agama</td>
                <td className="align-top py-1.5">:</td>
                <td className="py-1.5">{surat.agama}</td>
              </tr>
              <tr>
                <td className="align-top py-1.5 font-semibold">Pekerjaan</td>
                <td className="align-top py-1.5">:</td>
                <td className="py-1.5">{surat.pekerjaan}</td>
              </tr>
              <tr>
                <td className="align-top py-1.5 font-semibold">Status Perkawinan</td>
                <td className="align-top py-1.5">:</td>
                <td className="py-1.5">{surat.status_perkawinan}</td>
              </tr>
              {/* PERBAIKAN: NAMA KK & TEMPAT TINGGAL DINAMIS */}
              <tr>
                <td className="align-top py-1.5 font-semibold">Nama Kepala Keluarga</td>
                <td className="align-top py-1.5">:</td>
                <td className="py-1.5">{surat.status_keluarga === 'Kepala Keluarga' ? surat.nama : '.......................................................'}</td>
              </tr>
              <tr>
                <td className="align-top py-1.5 font-semibold">Tempat Tinggal</td>
                <td className="align-top py-1.5">:</td>
                <td className="py-1.5 capitalize">{surat.alamat}, RT {surat.rt} / RW {surat.rw}, Kel. Tambakreja, Kec. Cilacap Selatan, Kab. Cilacap</td>
              </tr>
            </tbody>
          </table>

          <p>
            Orang tersebut di atas benar-benar warga dan bertempat tinggal di lingkungan RT {surat.rt} / RW {surat.rw} Kelurahan Tambakreja. Surat pengantar ini dibuat untuk keperluan:
          </p>
          
          {/* BOX KEPERLUAN */}
          <div className="border-[2px] border-black p-4 font-bold text-center mt-4 mb-4 min-h-[80px] flex items-center justify-center text-xl uppercase">
            "{surat.keperluan}"
          </div>

          <table className="w-full mt-4">
            <tbody>
              <tr>
                <td className="w-40 font-semibold align-top">Keterangan Lain</td>
                <td className="w-4 align-top">:</td>
                <td>{surat.keterangan || "-"}</td>
              </tr>
              <tr>
                <td className="font-semibold align-top">Masa Berlaku</td>
                <td className="align-top">:</td>
                <td>{surat.berlakuMulai}</td>
              </tr>
            </tbody>
          </table>

          <p className="mt-6">
            Demikian surat pengantar ini dibuat dengan sebenarnya untuk dapat dipergunakan sebagaimana mestinya.
          </p>
        </div>

        {/* TANDA TANGAN */}
        <div className="mt-16 flex justify-between text-center text-lg">
          <div className="w-1/2 flex flex-col items-center">
            <p className="mb-1">Mengetahui,</p>
            <p className="font-bold">Ketua RW 05</p>
            <div className="h-28"></div> {/* Spasi Tanda Tangan */}
            <p className="font-bold underline uppercase">( ........................................ )</p>
          </div>
          
          <div className="w-1/2 flex flex-col items-center">
            <p className="mb-1">Tambakreja, {surat.tanggal || new Date().toLocaleDateString('id-ID')}</p>
            <p className="font-bold">Ketua RT {surat.rt}</p>
            <div className="h-28"></div> {/* Spasi Tanda Tangan */}
            <p className="font-bold underline uppercase">( ........................................ )</p>
          </div>
        </div>
      </div>
      
      {/* PENGATURAN CSS KHUSUS PRINT */}
      <style>{`
        @media print {
          body { background-color: white; -webkit-print-color-adjust: exact; }
          .no-print { display: none; }
          @page { size: A4; margin: 15mm 20mm; }
        }
      `}</style>
    </div>
  );
}
