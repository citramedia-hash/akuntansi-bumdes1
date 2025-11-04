import { Account, JournalEntry, FinancialSummary, BUMDesProfile, JournalEntryItem } from '@/types/accounting';

export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

export const generateAccountCode = (accounts: Account[], type: string): string => {
  const typePrefix = {
    'Aset': '1',
    'Kewajiban': '2',
    'Modal': '3',
    'Pendapatan': '4',
    'Beban': '5'
  };

  const prefix = typePrefix[type as keyof typeof typePrefix] || '1';
  const existingCodes = accounts
    .filter(acc => acc.code.startsWith(prefix))
    .map(acc => parseInt(acc.code))
    .sort((a, b) => b - a);

  const nextNumber = existingCodes.length > 0 ? existingCodes[0] + 1 : parseInt(prefix + '001');
  return nextNumber.toString();
};

export const getAccountsByType = (accounts: Account[], type: string): Account[] => {
  return accounts.filter(account => account.type === type);
};

export const getInitialAccounts = (): Account[] => [
  // Aset
  { id: '1', code: '1001', name: 'Kas', type: 'Aset', balance: 0, created_date: new Date().toISOString() },
  { id: '2', code: '1002', name: 'Bank', type: 'Aset', balance: 0, created_date: new Date().toISOString() },
  { id: '3', code: '1003', name: 'Piutang Usaha', type: 'Aset', balance: 0, created_date: new Date().toISOString() },
  { id: '4', code: '1004', name: 'Persediaan Barang Dagang', type: 'Aset', balance: 0, created_date: new Date().toISOString() },
  { id: '5', code: '1005', name: 'Peralatan', type: 'Aset', balance: 0, created_date: new Date().toISOString() },
  
  // Kewajiban
  { id: '6', code: '2001', name: 'Hutang Usaha', type: 'Kewajiban', balance: 0, created_date: new Date().toISOString() },
  { id: '7', code: '2002', name: 'Hutang Bank', type: 'Kewajiban', balance: 0, created_date: new Date().toISOString() },
  
  // Modal
  { id: '8', code: '3001', name: 'Modal Awal', type: 'Modal', balance: 0, created_date: new Date().toISOString() },
  { id: '9', code: '3002', name: 'Laba Ditahan', type: 'Modal', balance: 0, created_date: new Date().toISOString() },
  { id: '10', code: '3003', name: 'Ikhtisar Laba/Rugi', type: 'Modal', balance: 0, created_date: new Date().toISOString() },
  { id: '11', code: '3004', name: 'Dividen/Bagi Hasil Usaha', type: 'Modal', balance: 0, created_date: new Date().toISOString() },
  
  // Pendapatan
  { id: '12', code: '4001', name: 'Pendapatan Penjualan', type: 'Pendapatan', balance: 0, created_date: new Date().toISOString() },
  { id: '13', code: '4002', name: 'Pendapatan Jasa', type: 'Pendapatan', balance: 0, created_date: new Date().toISOString() },
  
  // Beban
  { id: '14', code: '5001', name: 'Beban Operasional', type: 'Beban', balance: 0, created_date: new Date().toISOString() },
  { id: '15', code: '5002', name: 'Beban Gaji', type: 'Beban', balance: 0, created_date: new Date().toISOString() },
  { id: '16', code: '5003', name: 'Beban Listrik', type: 'Beban', balance: 0, created_date: new Date().toISOString() },
];

export const getInitialProfile = (): BUMDesProfile => ({
  id: '1',
  name: 'BUMDes Contoh',
  village: 'Desa Contoh',
  subdistrict: 'Kecamatan Contoh',
  district: 'Kabupaten Contoh',
  business_activities: 'Perdagangan, Jasa, dan Simpan Pinjam',
  address: 'Jl. Contoh No. 123, Desa Contoh',
  email: 'bumdes@contoh.com',
  director_name: 'Direktur BUMDes',
  director_phone: '081234567890',
  secretary_name: 'Sekretaris BUMDes',
  secretary_phone: '081234567891',
  treasurer_name: 'Bendahara BUMDes',
  treasurer_phone: '081234567892',
  created_date: new Date().toISOString(),
  updated_date: new Date().toISOString(),
});

export const calculateAccountBalance = (accountId: string, journalEntries: JournalEntry[]): number => {
  let balance = 0;
  
  journalEntries.forEach(journal => {
    journal.entries.forEach(entry => {
      if (entry.account_id === accountId) {
        balance += entry.debit - entry.credit;
      }
    });
  });
  
  return balance;
};

export const calculateFinancialSummary = (accounts: Account[], journalEntries: JournalEntry[]): FinancialSummary => {
  const summary: FinancialSummary = {
    total_assets: 0,
    total_liabilities: 0,
    total_equity: 0,
    total_revenue: 0,
    total_expenses: 0,
    net_income: 0
  };

  accounts.forEach(account => {
    const balance = calculateAccountBalance(account.id, journalEntries);
    
    switch (account.type) {
      case 'Aset':
        summary.total_assets += balance;
        break;
      case 'Kewajiban':
        summary.total_liabilities += balance;
        break;
      case 'Modal':
        summary.total_equity += balance;
        break;
      case 'Pendapatan':
        summary.total_revenue += balance;
        break;
      case 'Beban':
        summary.total_expenses += balance;
        break;
    }
  });

  summary.net_income = summary.total_revenue - summary.total_expenses;
  return summary;
};

export const validateJournalEntry = (entries: JournalEntryItem[]): boolean => {
  const totalDebit = entries.reduce((sum, entry) => sum + (entry.debit || 0), 0);
  const totalCredit = entries.reduce((sum, entry) => sum + (entry.credit || 0), 0);
  return Math.abs(totalDebit - totalCredit) < 0.01;
};