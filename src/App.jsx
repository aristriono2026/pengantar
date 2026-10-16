import { Routes, Route, Navigate } from "react-router-dom";
import Login from "./Login"; 
import DashboardTerpadu from "./DashboardTerpadu";

export default function App() {
  // Mengecek apakah ada user yang sedang login
  const isAuth = localStorage.getItem("role");

  return (
    <Routes>
      {/* Jika sudah login, muat Dasbor. Jika belum, muat Login. Tetap di alamat "/" */}
      <Route path="/" element={isAuth ? <DashboardTerpadu /> : <Login />} />
      
      {/* Redirect alamat ngawur kembali ke "/" */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}