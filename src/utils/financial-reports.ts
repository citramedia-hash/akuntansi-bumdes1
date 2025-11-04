import { JournalEntry, Account } from '@/types/accounting';
import { calculateAccountBalance } from './accounting';
import { cashFlowKeywords } from '@/config/cashflow-keywords';

export interface DateRange {
  startDate: string;
  endDate: string;
}

export interface BalanceSheetItem {
  name: string;
  amount: number;
}

export interface BalanceSheet {
  assets: {
    current: BalanceSheetItem[];
    fixed: BalanceSheetItem[];
    total: number;
  };
  liabilities: {
    current: BalanceSheetItem[];
    longTerm: BalanceSheetItem[];
    total: number;
  };
  equity: {
    items: BalanceSheetItem[];
    total: number;
  };
}

export interface IncomeStatement {
  revenue: BalanceSheetItem[];
  expenses: BalanceSheetItem[];
  totalRevenue: number;
  totalExpenses: number;
  netIncome: number;
}

export interface CashFlowItem {
  description: string;
  amount: number;
}

export interface CashFlowStatement {
  operating: CashFlowItem[];
  investing: CashFlowItem[];
  financing: CashFlowItem[];
  operatingTotal: number;
  investingTotal: number;
  financingTotal: number;
  netCashFlow: number;
}

export interface EquityChangeDetail {
  type: string;
  description: string;
  amount: number;
}

export interface EquityChangesStatement {
  beginningEquity: number;
  netIncome: number;
  additionalCapital: number;
  withdrawals: number;
  endingEquity: number;
  details: EquityChangeDetail[];
}

export const getDateRange = (period: string): DateRange => {
  const now = new Date();
  let startDate: Date;
  
  switch (period) {
    case '1month':
      startDate = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
      break;
    case '3months':
      startDate = new Date(now.getFullYear(), now.getMonth() - 3, now.getDate());
      break;
    case '6months':
      startDate = new Date(now.getFullYear(), now.getMonth() - 6, now.getDate());
      break;
    case '12months':
      startDate = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
      break;
    default:
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
  }
  
  return {
    startDate: startDate.toISOString().split('T')[0],
    endDate: now.toISOString().split('T')[0]
  };
};

export const generateBalanceSheet = (
  entries: JournalEntry[], 
  accounts: Account[], 
  dateRange: DateRange
): BalanceSheet => {
  // Filter entries by date range
  const filteredEntries = entries.filter(entry => {
    const entryDate = new Date(entry.date);
    const startDate = new Date(dateRange.startDate);
    const endDate = new Date(dateRange.endDate);
    return entryDate >= startDate && entryDate <= endDate;
  });

  const balanceSheet: BalanceSheet = {
    assets: { current: [], fixed: [], total: 0 },
    liabilities: { current: [], longTerm: [], total: 0 },
    equity: { items: [], total: 0 }
  };

  // Process each account
  accounts.forEach(account => {
    const balance = calculateAccountBalance(account.id, filteredEntries);
    
    if (balance === 0) return; // Skip accounts with zero balance
    
    const item: BalanceSheetItem = {
      name: account.name,
      amount: Math.abs(balance)
    };

    switch (account.type) {
      case 'Aset':
        // Categorize assets (simplified - you can enhance this logic)
        if (account.name.toLowerCase().includes('kas') || 
            account.name.toLowerCase().includes('bank') ||
            account.name.toLowerCase().includes('piutang')) {
          balanceSheet.assets.current.push(item);
        } else {
          balanceSheet.assets.fixed.push(item);
        }
        balanceSheet.assets.total += item.amount;
        break;
        
      case 'Kewajiban':
        // Categorize liabilities (simplified)
        if (account.name.toLowerCase().includes('hutang usaha')) {
          balanceSheet.liabilities.current.push(item);
        } else {
          balanceSheet.liabilities.longTerm.push(item);
        }
        balanceSheet.liabilities.total += item.amount;
        break;
        
      case 'Modal':
        balanceSheet.equity.items.push(item);
        balanceSheet.equity.total += item.amount;
        break;
    }
  });

  return balanceSheet;
};

export const generateIncomeStatement = (
  entries: JournalEntry[], 
  accounts: Account[], 
  dateRange: DateRange
): IncomeStatement => {
  // Filter entries by date range
  const filteredEntries = entries.filter(entry => {
    const entryDate = new Date(entry.date);
    const startDate = new Date(dateRange.startDate);
    const endDate = new Date(dateRange.endDate);
    return entryDate >= startDate && entryDate <= endDate;
  });

  const incomeStatement: IncomeStatement = {
    revenue: [],
    expenses: [],
    totalRevenue: 0,
    totalExpenses: 0,
    netIncome: 0
  };

  accounts.forEach(account => {
    const balance = calculateAccountBalance(account.id, filteredEntries);
    
    if (balance === 0) return;
    
    const item: BalanceSheetItem = {
      name: account.name,
      amount: Math.abs(balance)
    };

    switch (account.type) {
      case 'Pendapatan':
        incomeStatement.revenue.push(item);
        incomeStatement.totalRevenue += item.amount;
        break;
        
      case 'Beban':
        incomeStatement.expenses.push(item);
        incomeStatement.totalExpenses += item.amount;
        break;
    }
  });

  incomeStatement.netIncome = incomeStatement.totalRevenue - incomeStatement.totalExpenses;
  return incomeStatement;
};

export const generateCashFlowStatement = (
  entries: JournalEntry[], 
  accounts: Account[], 
  dateRange: DateRange
): CashFlowStatement => {
  // Filter entries by date range
  const filteredEntries = entries.filter(entry => {
    const entryDate = new Date(entry.date);
    const startDate = new Date(dateRange.startDate);
    const endDate = new Date(dateRange.endDate);
    return entryDate >= startDate && entryDate <= endDate;
  });

  const cashFlow: CashFlowStatement = {
    operating: [],
    investing: [],
    financing: [],
    operatingTotal: 0,
    investingTotal: 0,
    financingTotal: 0,
    netCashFlow: 0
  };

  // Categorize transactions based on keywords
  filteredEntries.forEach(entry => {
    const description = entry.description.toLowerCase();
    
    entry.entries.forEach(entryItem => {
      const amount = entryItem.debit - entryItem.credit;
      
      if (amount === 0) return;
      
      // Check for operating activities
      if (cashFlowKeywords.operasi.some(keyword => description.includes(keyword))) {
        cashFlow.operating.push({
          description: entry.description,
          amount: amount
        });
        cashFlow.operatingTotal += amount;
      }
      // Check for investing activities
      else if (cashFlowKeywords.investasi.some(keyword => description.includes(keyword))) {
        cashFlow.investing.push({
          description: entry.description,
          amount: amount
        });
        cashFlow.investingTotal += amount;
      }
      // Check for financing activities
      else if (cashFlowKeywords.pendanaan.some(keyword => description.includes(keyword))) {
        cashFlow.financing.push({
          description: entry.description,
          amount: amount
        });
        cashFlow.financingTotal += amount;
      }
      // Default to operating if no specific category found
      else {
        cashFlow.operating.push({
          description: entry.description,
          amount: amount
        });
        cashFlow.operatingTotal += amount;
      }
    });
  });

  cashFlow.netCashFlow = cashFlow.operatingTotal + cashFlow.investingTotal + cashFlow.financingTotal;
  return cashFlow;
};

export const generateEquityChangesStatement = (
  entries: JournalEntry[], 
  accounts: Account[], 
  dateRange: DateRange
): EquityChangesStatement => {
  // Filter entries by date range
  const filteredEntries = entries.filter(entry => {
    const entryDate = new Date(entry.date);
    const startDate = new Date(dateRange.startDate);
    const endDate = new Date(dateRange.endDate);
    return entryDate >= startDate && entryDate <= endDate;
  });

  // Get beginning equity (before the period)
  const beginningEntries = entries.filter(entry => {
    const entryDate = new Date(entry.date);
    const startDate = new Date(dateRange.startDate);
    return entryDate < startDate;
  });

  let beginningEquity = 0;
  let netIncome = 0;
  let additionalCapital = 0;
  let withdrawals = 0;
  const details: EquityChangeDetail[] = [];

  // Calculate beginning equity
  accounts.filter(acc => acc.type === 'Modal').forEach(account => {
    const balance = calculateAccountBalance(account.id, beginningEntries);
    beginningEquity += balance;
  });

  // Calculate changes during the period
  accounts.forEach(account => {
    const balance = calculateAccountBalance(account.id, filteredEntries);
    
    if (balance === 0) return;
    
    switch (account.type) {
      case 'Pendapatan':
        netIncome += balance;
        break;
        
      case 'Beban':
        netIncome -= balance;
        break;
        
      case 'Modal':
        if (account.code === '3110') { // Penambahan Modal
          additionalCapital += balance;
          details.push({
            type: 'Penambahan Modal',
            description: account.name,
            amount: balance
          });
        } else if (account.code === '3130') { // Prive
          withdrawals += Math.abs(balance);
          details.push({
            type: 'Penarikan Modal (Prive)',
            description: account.name,
            amount: Math.abs(balance)
          });
        }
        break;
    }
  });

  // Add net income to details if not zero
  if (netIncome !== 0) {
    details.push({
      type: netIncome >= 0 ? 'Laba Bersih' : 'Rugi Bersih',
      description: 'Hasil operasi periode berjalan',
      amount: netIncome
    });
  }

  const endingEquity = beginningEquity + netIncome + additionalCapital - withdrawals;

  return {
    beginningEquity,
    netIncome,
    additionalCapital,
    withdrawals,
    endingEquity,
    details
  };
};