# TODO - Aplikasi Akuntansi BUMDes

## File yang perlu dibuat/dimodifikasi:

### 1. Core Files
- **src/App.tsx** - Routing dan layout utama
- **index.html** - Update title dan meta
- **src/pages/Index.tsx** - Rewrite menjadi Dashboard

### 2. Pages
- **src/pages/Dashboard.tsx** - Dashboard dengan ringkasan keuangan
- **src/pages/Journal.tsx** - Halaman jurnal dengan form entry
- **src/pages/Accounts.tsx** - Manajemen chart of accounts
- **src/pages/Reports.tsx** - Laporan keuangan

### 3. Components
- **src/components/Sidebar.tsx** - Navigation sidebar
- **src/components/JournalForm.tsx** - Form untuk entry jurnal
- **src/components/AccountForm.tsx** - Form untuk tambah/edit akun
- **src/components/ReportViewer.tsx** - Komponen untuk menampilkan laporan

### 4. Utils & Types
- **src/types/accounting.ts** - TypeScript interfaces
- **src/utils/accounting.ts** - Helper functions untuk kalkulasi

## Fitur yang akan diimplementasi:
1. ✅ Dashboard dengan metrik keuangan
2. ✅ Sistem jurnal double-entry dengan validasi
3. ✅ Chart of accounts management
4. ✅ Multiple journal entries per transaction
5. ✅ Edit functionality untuk jurnal
6. ✅ Laporan keuangan (Ringkasan, Detail, Neraca Saldo)
7. ✅ Print functionality
8. ✅ Mobile responsive design
9. ✅ localStorage untuk persistensi data
10. ✅ Interface bahasa Indonesia

## Struktur Data:
- Accounts: id, code, name, type, balance, created_date
- Journal Entries: id, date, reference, description, entries[]
- Journal Entry Items: account_id, debit, credit