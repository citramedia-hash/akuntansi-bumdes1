import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";

import App from "./App";

// Halaman utama
import IndexPage from "./pages/Index";
import DashboardPage from "./pages/Dashboard";
import JournalPage from "./pages/Journal";
import AccountsPage from "./pages/Accounts";
import ReportsPage from "./pages/Reports";
import ProfilePage from "./pages/Profile";
import NotFoundPage from "./pages/NotFound";

// Halaman laporan detail (folder reports)
import NeracaPage from "./pages/reports/neraca";

import "./index.css";

createRoot(document.getElementById("root")!).render(
  <BrowserRouter>
    <Routes>
      {/* Layout utama */}
      <Route path="/" element={<App />}>
        {/* Beranda (index) */}
        <Route index element={<IndexPage />} />

        {/* Menu utama */}
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="jurnal" element={<JournalPage />} />
        <Route path="akun" element={<AccountsPage />} />
        <Route path="laporan" element={<ReportsPage />} />
        <Route path="profil" element={<ProfilePage />} />

        {/* Laporan detail */}
        <Route path="reports/neraca" element={<NeracaPage />} />

        {/* Not Found */}
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  </BrowserRouter>
);
