export interface Account {
  id: string;
  code: string;
  name: string;
  type: 'Aset' | 'Kewajiban' | 'Modal' | 'Pendapatan' | 'Beban';
  balance: number;
  created_date: string;
}

export interface JournalEntryItem {
  id: string;
  account_id: string;
  account_name: string;
  debit: number;
  credit: number;
}

export interface JournalEntry {
  id: string;
  date: string;
  reference: string;
  description: string;
  entries: JournalEntryItem[];
  created_date: string;
}

export interface FinancialSummary {
  total_assets: number;
  total_liabilities: number;
  total_equity: number;
  total_revenue: number;
  total_expenses: number;
  net_income: number;
}

export interface BUMDesProfile {
  id: string;
  name: string;
  village: string;
  subdistrict: string;
  district: string;
  business_activities: string;
  address: string;
  email: string;
  director_name: string;
  director_phone: string;
  secretary_name: string;
  secretary_phone: string;
  treasurer_name: string;
  treasurer_phone: string;
  created_date: string;
  updated_date: string;
}