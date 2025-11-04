import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Download, FileText, FileSpreadsheet, FileX } from 'lucide-react';
import { JournalEntry, Account, BUMDesProfile } from '@/types/accounting';
import { formatCurrency, calculateAccountBalance } from '@/utils/accounting';

interface ExportDialogProps {
  journalEntries: JournalEntry[];
  accounts: Account[];
  profile: BUMDesProfile;
  reportType: string;
  dateFrom: string;
  dateTo: string;
}

export default function ExportDialog({ 
  journalEntries, 
  accounts, 
  profile, 
  reportType, 
  dateFrom, 
  dateTo 
}: ExportDialogProps) {
  const [open, setOpen] = useState(false);
  const [exportFormat, setExportFormat] = useState('');

  const getDateRangeText = () => {
    if (!dateFrom && !dateTo) return 'Semua Periode';
    if (dateFrom && dateTo) {
      return `${new Date(dateFrom).toLocaleDateString('id-ID')} - ${new Date(dateTo).toLocaleDateString('id-ID')}`;
    }
    if (dateFrom) return `Dari ${new Date(dateFrom).toLocaleDateString('id-ID')}`;
    if (dateTo) return `Sampai ${new Date(dateTo).toLocaleDateString('id-ID')}`;
    return 'Semua Periode';
  };

  const getReportTitle = () => {
    switch (reportType) {
      case 'balance_sheet': return 'Neraca';
      case 'income_statement': return 'Laporan Rugi Laba';
      case 'cash_flow': return 'Laporan Arus Kas';
      case 'equity_changes': return 'Laporan Perubahan Modal';
      case 'detailed': return 'Detail Jurnal';
      default: return 'Ringkasan Keuangan';
    }
  };

  const filteredJournals = journalEntries.filter(journal => {
    if (!dateFrom && !dateTo) return true;
    const journalDate = new Date(journal.date);
    const fromDate = dateFrom ? new Date(dateFrom) : null;
    const toDate = dateTo ? new Date(dateTo) : null;
    
    if (fromDate && journalDate < fromDate) return false;
    if (toDate && journalDate > toDate) return false;
    return true;
  });

  const calculateTotalByType = (type: string) => {
    return accounts
      .filter(account => account.type === type)
      .reduce((total, account) => {
        const balance = calculateAccountBalance(account.id, filteredJournals);
        return total + balance;
      }, 0);
  };

  const getAccountsByType = (type: string) => {
    return accounts
      .filter(account => account.type === type)
      .map(account => ({
        ...account,
        balance: calculateAccountBalance(account.id, filteredJournals)
      }))
      .filter(account => account.balance !== 0);
  };

  const totalAssets = calculateTotalByType('Aset');
  const totalLiabilities = calculateTotalByType('Kewajiban');
  const rawTotalEquity = calculateTotalByType('Modal');
  const totalRevenue = calculateTotalByType('Pendapatan');
  const totalExpenses = calculateTotalByType('Beban');
  const netIncome = totalRevenue - totalExpenses;

  // FIXED: Apply same logic as Reports.tsx - use Math.abs for Modal display
  const totalEquity = Math.abs(rawTotalEquity);
  const finalEquity = totalEquity + netIncome;

  // Cash flow calculation
  const calculateCashFlow = () => {
    const operatingActivities = [];
    const investingActivities = [];
    const financingActivities = [];

    const revenueAccounts = getAccountsByType('Pendapatan');
    const expenseAccounts = getAccountsByType('Beban');

    revenueAccounts.forEach(account => {
      if (account.balance > 0) {
        operatingActivities.push({
          description: account.name,
          amount: account.balance
        });
      }
    });

    expenseAccounts.forEach(account => {
      if (account.balance > 0) {
        operatingActivities.push({
          description: account.name,
          amount: -account.balance
        });
      }
    });

    const assetAccounts = getAccountsByType('Aset').filter(account => 
      !account.name.toLowerCase().includes('kas') && 
      !account.name.toLowerCase().includes('bank')
    );

    assetAccounts.forEach(account => {
      if (Math.abs(account.balance) > 0) {
        investingActivities.push({
          description: `Perubahan ${account.name}`,
          amount: -account.balance
        });
      }
    });

    const liabilityAccounts = getAccountsByType('Kewajiban');
    const equityAccounts = getAccountsByType('Modal');

    liabilityAccounts.forEach(account => {
      if (account.balance > 0) {
        financingActivities.push({
          description: account.name,
          amount: account.balance
        });
      }
    });

    equityAccounts.forEach(account => {
      if (account.balance > 0) {
        financingActivities.push({
          description: account.name,
          amount: account.balance
        });
      }
    });

    const operatingTotal = operatingActivities.reduce((sum, item) => sum + item.amount, 0);
    const investingTotal = investingActivities.reduce((sum, item) => sum + item.amount, 0);
    const financingTotal = financingActivities.reduce((sum, item) => sum + item.amount, 0);

    return {
      operatingActivities,
      investingActivities,
      financingActivities,
      operatingTotal,
      investingTotal,
      financingTotal,
      netCashFlow: operatingTotal + investingTotal + financingTotal
    };
  };

  const cashFlow = calculateCashFlow();

  const exportToPDF = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    let content = '';
    
    // Generate content based on report type
    switch (reportType) {
      case 'balance_sheet':
        content = generateBalanceSheetContent();
        break;
      case 'income_statement':
        content = generateIncomeStatementContent();
        break;
      case 'cash_flow':
        content = generateCashFlowContent();
        break;
      case 'equity_changes':
        content = generateEquityChangesContent();
        break;
      case 'detailed':
        content = generateDetailedJournalContent();
        break;
      default:
        content = generateSummaryContent();
        break;
    }

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>${getReportTitle()} - ${profile.name}</title>
          <style>
            @media print {
              body { margin: 0; }
              @page { margin: 1cm; }
            }
            body { font-family: Arial, sans-serif; margin: 20px; }
          </style>
        </head>
        <body>
          ${content}
          <div style="margin-top: 40px; text-align: right; font-size: 10px;">
            <div style="display: flex; justify-content: space-between;">
              <div style="text-align: center;">
                <p style="margin-bottom: 60px;">Bendahara BUMDes</p>
                <p style="border-bottom: 1px solid #000; display: inline-block; padding: 0 30px;"></p>
                <p style="margin-top: 5px;">${profile.treasurer_name || 'Bendahara'}</p>
              </div>
              <div style="text-align: center;">
                <p style="margin-bottom: 60px;">Direktur BUMDes</p>
                <p style="border-bottom: 1px solid #000; display: inline-block; padding: 0 30px;"></p>
                <p style="margin-top: 5px;">${profile.director_name}</p>
              </div>
            </div>
            <div style="text-align: right; margin-top: 20px; color: #666;">
              Dicetak pada: ${new Date().toLocaleString('id-ID')}
            </div>
          </div>
        </body>
      </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  };

  const generateSummaryContent = () => `
    <div style="text-align: center; margin-bottom: 30px; border-bottom: 2px solid #000; padding-bottom: 20px;">
      <h1 style="margin: 0; font-size: 18px; font-weight: bold;">${profile.name}</h1>
      <p style="margin: 5px 0; font-size: 12px;">${profile.address}</p>
      <p style="margin: 5px 0; font-size: 12px;">Telp: ${profile.director_phone} | Email: ${profile.email}</p>
      <h2 style="margin: 20px 0 5px 0; font-size: 16px; font-weight: bold;">${getReportTitle()}</h2>
      <p style="margin: 0; font-size: 12px;">Periode: ${getDateRangeText()}</p>
      <p style="margin: 0; font-size: 12px;">Tanggal Cetak: ${new Date().toLocaleDateString('id-ID', {
        day: '2-digit',
        month: 'long', 
        year: 'numeric'
      })}</p>
    </div>
    <div style="margin-bottom: 30px;">
      <h3 style="font-size: 14px; font-weight: bold; margin-bottom: 15px;">Ringkasan Keuangan</h3>
      <div style="font-size: 12px;">
        <div style="display: flex; justify-content: space-between; padding: 3px 0;">
          <span>Total Aset:</span>
          <span style="color: #16a34a; font-weight: 500;">${formatCurrency(totalAssets)}</span>
        </div>
        <div style="display: flex; justify-content: space-between; padding: 3px 0;">
          <span>Total Kewajiban:</span>
          <span style="color: #dc2626; font-weight: 500;">${formatCurrency(totalLiabilities)}</span>
        </div>
        <div style="display: flex; justify-content: space-between; padding: 3px 0;">
          <span>Total Modal:</span>
          <span style="color: #2563eb; font-weight: 500;">${formatCurrency(totalEquity)}</span>
        </div>
        <div style="display: flex; justify-content: space-between; padding: 3px 0;">
          <span>Total Pendapatan:</span>
          <span style="color: #16a34a; font-weight: 500;">${formatCurrency(totalRevenue)}</span>
        </div>
        <div style="display: flex; justify-content: space-between; padding: 3px 0;">
          <span>Total Beban:</span>
          <span style="color: #dc2626; font-weight: 500;">${formatCurrency(totalExpenses)}</span>
        </div>
        <div style="display: flex; justify-content: space-between; padding: 3px 0; border-top: 1px solid #ccc; font-weight: bold;">
          <span>Laba Bersih:</span>
          <span style="color: ${netIncome >= 0 ? '#16a34a' : '#dc2626'};">${formatCurrency(netIncome)}</span>
        </div>
        <div style="display: flex; justify-content: space-between; padding: 3px 0;">
          <span>Total Jurnal:</span>
          <span style="font-weight: 500;">${filteredJournals.length}</span>
        </div>
      </div>
    </div>
  `;

  const generateBalanceSheetContent = () => `
    <div style="text-align: center; margin-bottom: 30px; border-bottom: 2px solid #000; padding-bottom: 20px;">
      <h1 style="margin: 0; font-size: 18px; font-weight: bold;">${profile.name}</h1>
      <p style="margin: 5px 0; font-size: 12px;">${profile.address}</p>
      <p style="margin: 5px 0; font-size: 12px;">Telp: ${profile.director_phone} | Email: ${profile.email}</p>
      <h2 style="margin: 20px 0 5px 0; font-size: 16px; font-weight: bold;">${getReportTitle()}</h2>
      <p style="margin: 0; font-size: 12px;">Periode: ${getDateRangeText()}</p>
      <p style="margin: 0; font-size: 12px;">Tanggal Cetak: ${new Date().toLocaleDateString('id-ID', {
        day: '2-digit',
        month: 'long', 
        year: 'numeric'
      })}</p>
    </div>
    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 40px;">
      <div>
        <h3 style="font-size: 14px; font-weight: bold; margin-bottom: 15px; border-bottom: 1px solid #ccc; padding-bottom: 5px;">ASET</h3>
        <div style="font-size: 12px;">
          ${getAccountsByType('Aset').map(account => `
            <div style="display: flex; justify-content: space-between; padding: 3px 0;">
              <span>${account.name}</span>
              <span>${formatCurrency(Math.abs(account.balance))}</span>
            </div>
          `).join('')}
          <div style="display: flex; justify-content: space-between; padding: 3px 0; border-top: 1px solid #ccc; font-weight: bold;">
            <span>Total Aset</span>
            <span>${formatCurrency(totalAssets)}</span>
          </div>
        </div>
      </div>
      <div>
        <h3 style="font-size: 14px; font-weight: bold; margin-bottom: 15px; border-bottom: 1px solid #ccc; padding-bottom: 5px;">KEWAJIBAN & MODAL</h3>
        <div style="font-size: 12px;">
          <h4 style="font-size: 12px; font-weight: bold; margin-bottom: 10px;">Kewajiban:</h4>
          ${getAccountsByType('Kewajiban').map(account => `
            <div style="display: flex; justify-content: space-between; padding: 3px 0; margin-left: 10px;">
              <span>${account.name}</span>
              <span>${formatCurrency(Math.abs(account.balance))}</span>
            </div>
          `).join('')}
          <div style="display: flex; justify-content: space-between; padding: 3px 0; border-top: 1px solid #ddd; font-weight: 500; margin-left: 10px;">
            <span>Total Kewajiban</span>
            <span>${formatCurrency(totalLiabilities)}</span>
          </div>
          
          <h4 style="font-size: 12px; font-weight: bold; margin: 15px 0 10px 0;">Modal:</h4>
          ${getAccountsByType('Modal').map(account => `
            <div style="display: flex; justify-content: space-between; padding: 3px 0; margin-left: 10px;">
              <span>${account.name}</span>
              <span>${formatCurrency(Math.abs(account.balance))}</span>
            </div>
          `).join('')}
          <div style="display: flex; justify-content: space-between; padding: 3px 0; margin-left: 10px;">
            <span>${netIncome >= 0 ? 'Laba Bersih Periode Berjalan' : 'Rugi Bersih Periode Berjalan'}</span>
            <span style="color: ${netIncome >= 0 ? '#16a34a' : '#dc2626'};">${formatCurrency(netIncome)}</span>
          </div>
          <div style="display: flex; justify-content: space-between; padding: 3px 0; border-top: 1px solid #ddd; font-weight: 500; margin-left: 10px;">
            <span>Total Modal</span>
            <span>${formatCurrency(finalEquity)}</span>
          </div>
          
          <div style="display: flex; justify-content: space-between; padding: 3px 0; border-top: 1px solid #ccc; font-weight: bold; margin-top: 15px;">
            <span>Total Kewajiban & Modal</span>
            <span>${formatCurrency(totalLiabilities + finalEquity)}</span>
          </div>
        </div>
      </div>
    </div>
  `;

  const generateIncomeStatementContent = () => `
    <div style="text-align: center; margin-bottom: 30px; border-bottom: 2px solid #000; padding-bottom: 20px;">
      <h1 style="margin: 0; font-size: 18px; font-weight: bold;">${profile.name}</h1>
      <p style="margin: 5px 0; font-size: 12px;">${profile.address}</p>
      <p style="margin: 5px 0; font-size: 12px;">Telp: ${profile.director_phone} | Email: ${profile.email}</p>
      <h2 style="margin: 20px 0 5px 0; font-size: 16px; font-weight: bold;">${getReportTitle()}</h2>
      <p style="margin: 0; font-size: 12px;">Periode: ${getDateRangeText()}</p>
      <p style="margin: 0; font-size: 12px;">Tanggal Cetak: ${new Date().toLocaleDateString('id-ID', {
        day: '2-digit',
        month: 'long', 
        year: 'numeric'
      })}</p>
    </div>
    <div style="margin-bottom: 30px;">
      <h3 style="font-size: 14px; font-weight: bold; margin-bottom: 15px; border-bottom: 1px solid #ccc; padding-bottom: 5px;">PENDAPATAN</h3>
      <div style="font-size: 12px;">
        ${getAccountsByType('Pendapatan').map(account => `
          <div style="display: flex; justify-content: space-between; padding: 3px 0;">
            <span>${account.name}</span>
            <span>${formatCurrency(Math.abs(account.balance))}</span>
          </div>
        `).join('')}
        <div style="display: flex; justify-content: space-between; padding: 3px 0; border-top: 1px solid #ccc; font-weight: bold;">
          <span>Total Pendapatan</span>
          <span>${formatCurrency(totalRevenue)}</span>
        </div>
      </div>
    </div>
    <div style="margin-bottom: 30px;">
      <h3 style="font-size: 14px; font-weight: bold; margin-bottom: 15px; border-bottom: 1px solid #ccc; padding-bottom: 5px;">BEBAN</h3>
      <div style="font-size: 12px;">
        ${getAccountsByType('Beban').map(account => `
          <div style="display: flex; justify-content: space-between; padding: 3px 0;">
            <span>${account.name}</span>
            <span>${formatCurrency(Math.abs(account.balance))}</span>
          </div>
        `).join('')}
        <div style="display: flex; justify-content: space-between; padding: 3px 0; border-top: 1px solid #ccc; font-weight: bold;">
          <span>Total Beban</span>
          <span>${formatCurrency(totalExpenses)}</span>
        </div>
      </div>
    </div>
    <div style="border-top: 2px solid #000; padding-top: 15px;">
      <div style="display: flex; justify-content: space-between; padding: 6px 0; font-size: 14px; font-weight: bold;">
        <span>LABA (RUGI) BERSIH</span>
        <span style="color: ${netIncome >= 0 ? '#16a34a' : '#dc2626'};">${formatCurrency(netIncome)}</span>
      </div>
    </div>
  `;

  const generateCashFlowContent = () => `
    <div style="text-align: center; margin-bottom: 30px; border-bottom: 2px solid #000; padding-bottom: 20px;">
      <h1 style="margin: 0; font-size: 18px; font-weight: bold;">${profile.name}</h1>
      <p style="margin: 5px 0; font-size: 12px;">${profile.address}</p>
      <p style="margin: 5px 0; font-size: 12px;">Telp: ${profile.director_phone} | Email: ${profile.email}</p>
      <h2 style="margin: 20px 0 5px 0; font-size: 16px; font-weight: bold;">${getReportTitle()}</h2>
      <p style="margin: 0; font-size: 12px;">Periode: ${getDateRangeText()}</p>
      <p style="margin: 0; font-size: 12px;">Tanggal Cetak: ${new Date().toLocaleDateString('id-ID', {
        day: '2-digit',
        month: 'long', 
        year: 'numeric'
      })}</p>
    </div>
    <div style="margin-bottom: 30px;">
      <h3 style="font-size: 14px; font-weight: bold; margin-bottom: 15px; border-bottom: 1px solid #ccc; padding-bottom: 5px;">ARUS KAS DARI AKTIVITAS OPERASI</h3>
      <div style="font-size: 12px;">
        ${cashFlow.operatingActivities.map(activity => `
          <div style="display: flex; justify-content: space-between; padding: 3px 0;">
            <span>${activity.description}</span>
            <span style="color: ${activity.amount >= 0 ? '#16a34a' : '#dc2626'};">${formatCurrency(activity.amount)}</span>
          </div>
        `).join('')}
        <div style="display: flex; justify-content: space-between; padding: 3px 0; border-top: 1px solid #ccc; font-weight: bold;">
          <span>Kas Bersih dari Aktivitas Operasi</span>
          <span style="color: ${cashFlow.operatingTotal >= 0 ? '#16a34a' : '#dc2626'};">${formatCurrency(cashFlow.operatingTotal)}</span>
        </div>
      </div>
    </div>
    <div style="margin-bottom: 30px;">
      <h3 style="font-size: 14px; font-weight: bold; margin-bottom: 15px; border-bottom: 1px solid #ccc; padding-bottom: 5px;">ARUS KAS DARI AKTIVITAS INVESTASI</h3>
      <div style="font-size: 12px;">
        ${cashFlow.investingActivities.length > 0 ? 
          cashFlow.investingActivities.map(activity => `
            <div style="display: flex; justify-content: space-between; padding: 3px 0;">
              <span>${activity.description}</span>
              <span style="color: ${activity.amount >= 0 ? '#16a34a' : '#dc2626'};">${formatCurrency(activity.amount)}</span>
            </div>
          `).join('') : 
          '<div style="display: flex; justify-content: space-between; padding: 3px 0; color: #666;"><span>Tidak ada aktivitas investasi</span><span>-</span></div>'
        }
        <div style="display: flex; justify-content: space-between; padding: 3px 0; border-top: 1px solid #ccc; font-weight: bold;">
          <span>Kas Bersih dari Aktivitas Investasi</span>
          <span style="color: ${cashFlow.investingTotal >= 0 ? '#16a34a' : '#dc2626'};">${formatCurrency(cashFlow.investingTotal)}</span>
        </div>
      </div>
    </div>
    <div style="margin-bottom: 30px;">
      <h3 style="font-size: 14px; font-weight: bold; margin-bottom: 15px; border-bottom: 1px solid #ccc; padding-bottom: 5px;">ARUS KAS DARI AKTIVITAS PENDANAAN</h3>
      <div style="font-size: 12px;">
        ${cashFlow.financingActivities.length > 0 ? 
          cashFlow.financingActivities.map(activity => `
            <div style="display: flex; justify-content: space-between; padding: 3px 0;">
              <span>${activity.description}</span>
              <span style="color: ${activity.amount >= 0 ? '#16a34a' : '#dc2626'};">${formatCurrency(activity.amount)}</span>
            </div>
          `).join('') : 
          '<div style="display: flex; justify-content: space-between; padding: 3px 0; color: #666;"><span>Tidak ada aktivitas pendanaan</span><span>-</span></div>'
        }
        <div style="display: flex; justify-content: space-between; padding: 3px 0; border-top: 1px solid #ccc; font-weight: bold;">
          <span>Kas Bersih dari Aktivitas Pendanaan</span>
          <span style="color: ${cashFlow.financingTotal >= 0 ? '#16a34a' : '#dc2626'};">${formatCurrency(cashFlow.financingTotal)}</span>
        </div>
      </div>
    </div>
    <div style="border-top: 2px solid #000; padding-top: 15px;">
      <div style="display: flex; justify-content: space-between; padding: 6px 0; font-size: 14px; font-weight: bold;">
        <span>KENAIKAN (PENURUNAN) BERSIH KAS</span>
        <span style="color: ${cashFlow.netCashFlow >= 0 ? '#16a34a' : '#dc2626'};">${formatCurrency(cashFlow.netCashFlow)}</span>
      </div>
    </div>
  `;

  const generateEquityChangesContent = () => `
    <div style="text-align: center; margin-bottom: 30px; border-bottom: 2px solid #000; padding-bottom: 20px;">
      <h1 style="margin: 0; font-size: 18px; font-weight: bold;">${profile.name}</h1>
      <p style="margin: 5px 0; font-size: 12px;">${profile.address}</p>
      <p style="margin: 5px 0; font-size: 12px;">Telp: ${profile.director_phone} | Email: ${profile.email}</p>
      <h2 style="margin: 20px 0 5px 0; font-size: 16px; font-weight: bold;">${getReportTitle()}</h2>
      <p style="margin: 0; font-size: 12px;">Periode: ${getDateRangeText()}</p>
      <p style="margin: 0; font-size: 12px;">Tanggal Cetak: ${new Date().toLocaleDateString('id-ID', {
        day: '2-digit',
        month: 'long', 
        year: 'numeric'
      })}</p>
    </div>
    <div style="margin-bottom: 30px;">
      <h3 style="font-size: 14px; font-weight: bold; margin-bottom: 15px; border-bottom: 1px solid #ccc; padding-bottom: 5px;">PERUBAHAN MODAL</h3>
      <div style="font-size: 12px;">
        <h4 style="font-size: 12px; font-weight: bold; margin-bottom: 10px;">Modal Awal Periode:</h4>
        <div style="margin-left: 20px;">
          ${getAccountsByType('Modal').map(account => `
            <div style="display: flex; justify-content: space-between; padding: 3px 0;">
              <span>${account.name}</span>
              <span>${formatCurrency(Math.abs(account.balance))}</span>
            </div>
          `).join('')}
          <div style="display: flex; justify-content: space-between; padding: 3px 0; border-top: 1px solid #ddd; font-weight: 500;">
            <span>Total Modal Awal</span>
            <span>${formatCurrency(totalEquity)}</span>
          </div>
        </div>
        
        <h4 style="font-size: 12px; font-weight: bold; margin: 20px 0 10px 0;">Laba (Rugi) Periode Berjalan:</h4>
        <div style="margin-left: 20px;">
          <div style="display: flex; justify-content: space-between; padding: 3px 0;">
            <span>${netIncome >= 0 ? 'Laba Bersih' : 'Rugi Bersih'}</span>
            <span style="color: ${netIncome >= 0 ? '#16a34a' : '#dc2626'};">${formatCurrency(netIncome)}</span>
          </div>
        </div>
        
        <h4 style="font-size: 12px; font-weight: bold; margin: 20px 0 10px 0;">Penambahan Modal:</h4>
        <div style="margin-left: 20px;">
          <div style="display: flex; justify-content: space-between; padding: 3px 0; color: #666;">
            <span>Tidak ada penambahan modal</span>
            <span>-</span>
          </div>
        </div>
        
        <h4 style="font-size: 12px; font-weight: bold; margin: 20px 0 10px 0;">Penarikan Modal:</h4>
        <div style="margin-left: 20px;">
          <div style="display: flex; justify-content: space-between; padding: 3px 0; color: #666;">
            <span>Tidak ada penarikan modal</span>
            <span>-</span>
          </div>
        </div>
      </div>
    </div>
    <div style="border-top: 2px solid #000; padding-top: 15px;">
      <div style="display: flex; justify-content: space-between; padding: 6px 0; font-size: 14px; font-weight: bold;">
        <span>MODAL AKHIR PERIODE</span>
        <span style="color: #2563eb;">${formatCurrency(finalEquity)}</span>
      </div>
    </div>
  `;

  const generateDetailedJournalContent = () => `
    <div style="text-align: center; margin-bottom: 30px; border-bottom: 2px solid #000; padding-bottom: 20px;">
      <h1 style="margin: 0; font-size: 18px; font-weight: bold;">${profile.name}</h1>
      <p style="margin: 5px 0; font-size: 12px;">${profile.address}</p>
      <p style="margin: 5px 0; font-size: 12px;">Telp: ${profile.director_phone} | Email: ${profile.email}</p>
      <h2 style="margin: 20px 0 5px 0; font-size: 16px; font-weight: bold;">${getReportTitle()}</h2>
      <p style="margin: 0; font-size: 12px;">Periode: ${getDateRangeText()}</p>
      <p style="margin: 0; font-size: 12px;">Tanggal Cetak: ${new Date().toLocaleDateString('id-ID', {
        day: '2-digit',
        month: 'long', 
        year: 'numeric'
      })}</p>
    </div>
    <table style="width: 100%; border-collapse: collapse; font-size: 10px;">
      <thead>
        <tr style="background-color: #f3f4f6;">
          <th style="border: 1px solid #ccc; padding: 8px; text-align: left;">Tanggal</th>
          <th style="border: 1px solid #ccc; padding: 8px; text-align: left;">Keterangan</th>
          <th style="border: 1px solid #ccc; padding: 8px; text-align: left;">Referensi</th>
          <th style="border: 1px solid #ccc; padding: 8px; text-align: left;">Akun</th>
          <th style="border: 1px solid #ccc; padding: 8px; text-align: right;">Debit</th>
          <th style="border: 1px solid #ccc; padding: 8px; text-align: right;">Kredit</th>
        </tr>
      </thead>
      <tbody>
        ${filteredJournals.map(journal => 
          journal.entries.map((entry, entryIndex) => `
            <tr>
              ${entryIndex === 0 ? `
                <td style="border: 1px solid #ccc; padding: 4px;" rowspan="${journal.entries.length}">
                  ${new Date(journal.date).toLocaleDateString('id-ID')}
                </td>
                <td style="border: 1px solid #ccc; padding: 4px;" rowspan="${journal.entries.length}">
                  ${journal.description}
                </td>
                <td style="border: 1px solid #ccc; padding: 4px;" rowspan="${journal.entries.length}">
                  ${journal.reference}
                </td>
              ` : ''}
              <td style="border: 1px solid #ccc; padding: 4px;">${entry.account_name}</td>
              <td style="border: 1px solid #ccc; padding: 4px; text-align: right;">
                ${entry.debit > 0 ? formatCurrency(entry.debit) : '-'}
              </td>
              <td style="border: 1px solid #ccc; padding: 4px; text-align: right;">
                ${entry.credit > 0 ? formatCurrency(entry.credit) : '-'}
              </td>
            </tr>
          `).join('')
        ).join('')}
      </tbody>
    </table>
  `;

  const exportToCSV = () => {
    let csvContent = '';
    
    switch (reportType) {
      case 'balance_sheet':
        csvContent = generateBalanceSheetCSV();
        break;
      case 'income_statement':
        csvContent = generateIncomeStatementCSV();
        break;
      case 'cash_flow':
        csvContent = generateCashFlowCSV();
        break;
      case 'equity_changes':
        csvContent = generateEquityChangesCSV();
        break;
      case 'detailed':
        csvContent = generateDetailedJournalCSV();
        break;
      default:
        csvContent = generateSummaryCSV();
        break;
    }

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${getReportTitle().toLowerCase().replace(/\s+/g, '-')}-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const generateSummaryCSV = () => {
    let csvContent = `${getReportTitle()} - ${profile.name}\n`;
    csvContent += `Periode: ${getDateRangeText()}\n`;
    csvContent += `Tanggal Cetak: ${new Date().toLocaleDateString('id-ID')}\n\n`;
    csvContent += `Kategori,Jumlah\n`;
    csvContent += `Total Aset,${totalAssets}\n`;
    csvContent += `Total Kewajiban,${totalLiabilities}\n`;
    csvContent += `Total Modal,${totalEquity}\n`;
    csvContent += `Total Pendapatan,${totalRevenue}\n`;
    csvContent += `Total Beban,${totalExpenses}\n`;
    csvContent += `Laba Bersih,${netIncome}\n`;
    csvContent += `Total Jurnal,${filteredJournals.length}\n`;
    return csvContent;
  };

  const generateBalanceSheetCSV = () => {
    let csvContent = `${getReportTitle()} - ${profile.name}\n`;
    csvContent += `Periode: ${getDateRangeText()}\n`;
    csvContent += `Tanggal Cetak: ${new Date().toLocaleDateString('id-ID')}\n\n`;
    csvContent += `Kategori,Akun,Jumlah\n`;
    
    // Assets
    csvContent += `ASET,,\n`;
    getAccountsByType('Aset').forEach(account => {
      csvContent += `,${account.name},${Math.abs(account.balance)}\n`;
    });
    csvContent += `,Total Aset,${totalAssets}\n\n`;
    
    // Liabilities
    csvContent += `KEWAJIBAN,,\n`;
    getAccountsByType('Kewajiban').forEach(account => {
      csvContent += `,${account.name},${Math.abs(account.balance)}\n`;
    });
    csvContent += `,Total Kewajiban,${totalLiabilities}\n\n`;
    
    // Equity - FIXED: Use corrected calculations
    csvContent += `MODAL,,\n`;
    getAccountsByType('Modal').forEach(account => {
      csvContent += `,${account.name},${Math.abs(account.balance)}\n`;
    });
    csvContent += `,${netIncome >= 0 ? 'Laba Bersih Periode Berjalan' : 'Rugi Bersih Periode Berjalan'},${netIncome}\n`;
    csvContent += `,Total Modal,${finalEquity}\n`;
    csvContent += `,Total Kewajiban & Modal,${totalLiabilities + finalEquity}\n`;
    
    return csvContent;
  };

  const generateIncomeStatementCSV = () => {
    let csvContent = `${getReportTitle()} - ${profile.name}\n`;
    csvContent += `Periode: ${getDateRangeText()}\n`;
    csvContent += `Tanggal Cetak: ${new Date().toLocaleDateString('id-ID')}\n\n`;
    csvContent += `Kategori,Akun,Jumlah\n`;
    
    // Revenue
    csvContent += `PENDAPATAN,,\n`;
    getAccountsByType('Pendapatan').forEach(account => {
      csvContent += `,${account.name},${Math.abs(account.balance)}\n`;
    });
    csvContent += `,Total Pendapatan,${totalRevenue}\n\n`;
    
    // Expenses
    csvContent += `BEBAN,,\n`;
    getAccountsByType('Beban').forEach(account => {
      csvContent += `,${account.name},${Math.abs(account.balance)}\n`;
    });
    csvContent += `,Total Beban,${totalExpenses}\n\n`;
    
    csvContent += `LABA (RUGI) BERSIH,,${netIncome}\n`;
    
    return csvContent;
  };

  const generateCashFlowCSV = () => {
    let csvContent = `${getReportTitle()} - ${profile.name}\n`;
    csvContent += `Periode: ${getDateRangeText()}\n`;
    csvContent += `Tanggal Cetak: ${new Date().toLocaleDateString('id-ID')}\n\n`;
    csvContent += `Kategori,Aktivitas,Jumlah\n`;
    
    // Operating Activities
    csvContent += `ARUS KAS DARI AKTIVITAS OPERASI,,\n`;
    cashFlow.operatingActivities.forEach(activity => {
      csvContent += `,${activity.description},${activity.amount}\n`;
    });
    csvContent += `,Kas Bersih dari Aktivitas Operasi,${cashFlow.operatingTotal}\n\n`;
    
    // Investing Activities
    csvContent += `ARUS KAS DARI AKTIVITAS INVESTASI,,\n`;
    if (cashFlow.investingActivities.length > 0) {
      cashFlow.investingActivities.forEach(activity => {
        csvContent += `,${activity.description},${activity.amount}\n`;
      });
    } else {
      csvContent += `,Tidak ada aktivitas investasi,0\n`;
    }
    csvContent += `,Kas Bersih dari Aktivitas Investasi,${cashFlow.investingTotal}\n\n`;
    
    // Financing Activities
    csvContent += `ARUS KAS DARI AKTIVITAS PENDANAAN,,\n`;
    if (cashFlow.financingActivities.length > 0) {
      cashFlow.financingActivities.forEach(activity => {
        csvContent += `,${activity.description},${activity.amount}\n`;
      });
    } else {
      csvContent += `,Tidak ada aktivitas pendanaan,0\n`;
    }
    csvContent += `,Kas Bersih dari Aktivitas Pendanaan,${cashFlow.financingTotal}\n\n`;
    
    csvContent += `KENAIKAN (PENURUNAN) BERSIH KAS,,${cashFlow.netCashFlow}\n`;
    
    return csvContent;
  };

  const generateEquityChangesCSV = () => {
    let csvContent = `${getReportTitle()} - ${profile.name}\n`;
    csvContent += `Periode: ${getDateRangeText()}\n`;
    csvContent += `Tanggal Cetak: ${new Date().toLocaleDateString('id-ID')}\n\n`;
    csvContent += `Kategori,Keterangan,Jumlah\n`;
    
    csvContent += `MODAL AWAL PERIODE,,\n`;
    getAccountsByType('Modal').forEach(account => {
      csvContent += `,${account.name},${Math.abs(account.balance)}\n`;
    });
    csvContent += `,Total Modal Awal,${totalEquity}\n\n`;
    
    csvContent += `LABA (RUGI) PERIODE BERJALAN,,\n`;
    csvContent += `,${netIncome >= 0 ? 'Laba Bersih' : 'Rugi Bersih'},${netIncome}\n\n`;
    
    csvContent += `PENAMBAHAN MODAL,,\n`;
    csvContent += `,Tidak ada penambahan modal,0\n\n`;
    
    csvContent += `PENARIKAN MODAL,,\n`;
    csvContent += `,Tidak ada penarikan modal,0\n\n`;
    
    csvContent += `MODAL AKHIR PERIODE,,${finalEquity}\n`;
    
    return csvContent;
  };

  const generateDetailedJournalCSV = () => {
    let csvContent = `${getReportTitle()} - ${profile.name}\n`;
    csvContent += `Periode: ${getDateRangeText()}\n`;
    csvContent += `Tanggal Cetak: ${new Date().toLocaleDateString('id-ID')}\n\n`;
    csvContent += `Tanggal,Keterangan,Referensi,Akun,Debit,Kredit\n`;
    
    filteredJournals.forEach(journal => {
      journal.entries.forEach(entry => {
        csvContent += `${journal.date},"${journal.description}",${journal.reference},"${entry.account_name}",${entry.debit},${entry.credit}\n`;
      });
    });
    
    return csvContent;
  };

  const exportToExcel = () => {
    let htmlContent = '';
    
    switch (reportType) {
      case 'balance_sheet':
        htmlContent = generateBalanceSheetExcel();
        break;
      case 'income_statement':
        htmlContent = generateIncomeStatementExcel();
        break;
      case 'cash_flow':
        htmlContent = generateCashFlowExcel();
        break;
      case 'equity_changes':
        htmlContent = generateEquityChangesExcel();
        break;
      case 'detailed':
        htmlContent = generateDetailedJournalExcel();
        break;
      default:
        htmlContent = generateSummaryExcel();
        break;
    }

    const blob = new Blob([htmlContent], { type: 'application/vnd.ms-excel' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${getReportTitle().toLowerCase().replace(/\s+/g, '-')}-${new Date().toISOString().split('T')[0]}.xls`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const generateSummaryExcel = () => `
    <table>
      <tr><td colspan="2"><b>${getReportTitle()} - ${profile.name}</b></td></tr>
      <tr><td colspan="2">Periode: ${getDateRangeText()}</td></tr>
      <tr><td colspan="2">Tanggal Cetak: ${new Date().toLocaleDateString('id-ID')}</td></tr>
      <tr><td></td><td></td></tr>
      <tr><td><b>Kategori</b></td><td><b>Jumlah</b></td></tr>
      <tr><td>Total Aset</td><td>${totalAssets}</td></tr>
      <tr><td>Total Kewajiban</td><td>${totalLiabilities}</td></tr>
      <tr><td>Total Modal</td><td>${totalEquity}</td></tr>
      <tr><td>Total Pendapatan</td><td>${totalRevenue}</td></tr>
      <tr><td>Total Beban</td><td>${totalExpenses}</td></tr>
      <tr><td><b>Laba Bersih</b></td><td><b>${netIncome}</b></td></tr>
      <tr><td>Total Jurnal</td><td>${filteredJournals.length}</td></tr>
    </table>
  `;

  const generateBalanceSheetExcel = () => `
    <table>
      <tr><td colspan="3"><b>${getReportTitle()} - ${profile.name}</b></td></tr>
      <tr><td colspan="3">Periode: ${getDateRangeText()}</td></tr>
      <tr><td colspan="3">Tanggal Cetak: ${new Date().toLocaleDateString('id-ID')}</td></tr>
      <tr><td></td><td></td><td></td></tr>
      <tr><td><b>Kategori</b></td><td><b>Akun</b></td><td><b>Jumlah</b></td></tr>
      <tr><td><b>ASET</b></td><td></td><td></td></tr>
      ${getAccountsByType('Aset').map(account => `
        <tr><td></td><td>${account.name}</td><td>${Math.abs(account.balance)}</td></tr>
      `).join('')}
      <tr><td></td><td><b>Total Aset</b></td><td><b>${totalAssets}</b></td></tr>
      <tr><td></td><td></td><td></td></tr>
      <tr><td><b>KEWAJIBAN</b></td><td></td><td></td></tr>
      ${getAccountsByType('Kewajiban').map(account => `
        <tr><td></td><td>${account.name}</td><td>${Math.abs(account.balance)}</td></tr>
      `).join('')}
      <tr><td></td><td><b>Total Kewajiban</b></td><td><b>${totalLiabilities}</b></td></tr>
      <tr><td></td><td></td><td></td></tr>
      <tr><td><b>MODAL</b></td><td></td><td></td></tr>
      ${getAccountsByType('Modal').map(account => `
        <tr><td></td><td>${account.name}</td><td>${Math.abs(account.balance)}</td></tr>
      `).join('')}
      <tr><td></td><td>${netIncome >= 0 ? 'Laba Bersih Periode Berjalan' : 'Rugi Bersih Periode Berjalan'}</td><td>${netIncome}</td></tr>
      <tr><td></td><td><b>Total Modal</b></td><td><b>${finalEquity}</b></td></tr>
      <tr><td></td><td></td><td></td></tr>
      <tr><td></td><td><b>Total Kewajiban & Modal</b></td><td><b>${totalLiabilities + finalEquity}</b></td></tr>
    </table>
  `;

  const generateIncomeStatementExcel = () => `
    <table>
      <tr><td colspan="3"><b>${getReportTitle()} - ${profile.name}</b></td></tr>
      <tr><td colspan="3">Periode: ${getDateRangeText()}</td></tr>
      <tr><td colspan="3">Tanggal Cetak: ${new Date().toLocaleDateString('id-ID')}</td></tr>
      <tr><td></td><td></td><td></td></tr>
      <tr><td><b>Kategori</b></td><td><b>Akun</b></td><td><b>Jumlah</b></td></tr>
      <tr><td><b>PENDAPATAN</b></td><td></td><td></td></tr>
      ${getAccountsByType('Pendapatan').map(account => `
        <tr><td></td><td>${account.name}</td><td>${Math.abs(account.balance)}</td></tr>
      `).join('')}
      <tr><td></td><td><b>Total Pendapatan</b></td><td><b>${totalRevenue}</b></td></tr>
      <tr><td></td><td></td><td></td></tr>
      <tr><td><b>BEBAN</b></td><td></td><td></td></tr>
      ${getAccountsByType('Beban').map(account => `
        <tr><td></td><td>${account.name}</td><td>${Math.abs(account.balance)}</td></tr>
      `).join('')}
      <tr><td></td><td><b>Total Beban</b></td><td><b>${totalExpenses}</b></td></tr>
      <tr><td></td><td></td><td></td></tr>
      <tr><td></td><td><b>LABA (RUGI) BERSIH</b></td><td><b>${netIncome}</b></td></tr>
    </table>
  `;

  const generateCashFlowExcel = () => `
    <table>
      <tr><td colspan="3"><b>${getReportTitle()} - ${profile.name}</b></td></tr>
      <tr><td colspan="3">Periode: ${getDateRangeText()}</td></tr>
      <tr><td colspan="3">Tanggal Cetak: ${new Date().toLocaleDateString('id-ID')}</td></tr>
      <tr><td></td><td></td><td></td></tr>
      <tr><td><b>Kategori</b></td><td><b>Aktivitas</b></td><td><b>Jumlah</b></td></tr>
      <tr><td><b>ARUS KAS DARI AKTIVITAS OPERASI</b></td><td></td><td></td></tr>
      ${cashFlow.operatingActivities.map(activity => `
        <tr><td></td><td>${activity.description}</td><td>${activity.amount}</td></tr>
      `).join('')}
      <tr><td></td><td><b>Kas Bersih dari Aktivitas Operasi</b></td><td><b>${cashFlow.operatingTotal}</b></td></tr>
      <tr><td></td><td></td><td></td></tr>
      <tr><td><b>ARUS KAS DARI AKTIVITAS INVESTASI</b></td><td></td><td></td></tr>
      ${cashFlow.investingActivities.length > 0 ? 
        cashFlow.investingActivities.map(activity => `
          <tr><td></td><td>${activity.description}</td><td>${activity.amount}</td></tr>
        `).join('') : 
        '<tr><td></td><td>Tidak ada aktivitas investasi</td><td>0</td></tr>'
      }
      <tr><td></td><td><b>Kas Bersih dari Aktivitas Investasi</b></td><td><b>${cashFlow.investingTotal}</b></td></tr>
      <tr><td></td><td></td><td></td></tr>
      <tr><td><b>ARUS KAS DARI AKTIVITAS PENDANAAN</b></td><td></td><td></td></tr>
      ${cashFlow.financingActivities.length > 0 ? 
        cashFlow.financingActivities.map(activity => `
          <tr><td></td><td>${activity.description}</td><td>${activity.amount}</td></tr>
        `).join('') : 
        '<tr><td></td><td>Tidak ada aktivitas pendanaan</td><td>0</td></tr>'
      }
      <tr><td></td><td><b>Kas Bersih dari Aktivitas Pendanaan</b></td><td><b>${cashFlow.financingTotal}</b></td></tr>
      <tr><td></td><td></td><td></td></tr>
      <tr><td></td><td><b>KENAIKAN (PENURUNAN) BERSIH KAS</b></td><td><b>${cashFlow.netCashFlow}</b></td></tr>
    </table>
  `;

  const generateEquityChangesExcel = () => `
    <table>
      <tr><td colspan="3"><b>${getReportTitle()} - ${profile.name}</b></td></tr>
      <tr><td colspan="3">Periode: ${getDateRangeText()}</td></tr>
      <tr><td colspan="3">Tanggal Cetak: ${new Date().toLocaleDateString('id-ID')}</td></tr>
      <tr><td></td><td></td><td></td></tr>
      <tr><td><b>Kategori</b></td><td><b>Keterangan</b></td><td><b>Jumlah</b></td></tr>
      <tr><td><b>MODAL AWAL PERIODE</b></td><td></td><td></td></tr>
      ${getAccountsByType('Modal').map(account => `
        <tr><td></td><td>${account.name}</td><td>${Math.abs(account.balance)}</td></tr>
      `).join('')}
      <tr><td></td><td><b>Total Modal Awal</b></td><td><b>${totalEquity}</b></td></tr>
      <tr><td></td><td></td><td></td></tr>
      <tr><td><b>LABA (RUGI) PERIODE BERJALAN</b></td><td></td><td></td></tr>
      <tr><td></td><td>${netIncome >= 0 ? 'Laba Bersih' : 'Rugi Bersih'}</td><td>${netIncome}</td></tr>
      <tr><td></td><td></td><td></td></tr>
      <tr><td><b>PENAMBAHAN MODAL</b></td><td></td><td></td></tr>
      <tr><td></td><td>Tidak ada penambahan modal</td><td>0</td></tr>
      <tr><td></td><td></td><td></td></tr>
      <tr><td><b>PENARIKAN MODAL</b></td><td></td><td></td></tr>
      <tr><td></td><td>Tidak ada penarikan modal</td><td>0</td></tr>
      <tr><td></td><td></td><td></td></tr>
      <tr><td></td><td><b>MODAL AKHIR PERIODE</b></td><td><b>${finalEquity}</b></td></tr>
    </table>
  `;

  const generateDetailedJournalExcel = () => `
    <table>
      <tr><td colspan="6"><b>${getReportTitle()} - ${profile.name}</b></td></tr>
      <tr><td colspan="6">Periode: ${getDateRangeText()}</td></tr>
      <tr><td colspan="6">Tanggal Cetak: ${new Date().toLocaleDateString('id-ID')}</td></tr>
      <tr><td></td><td></td><td></td><td></td><td></td><td></td></tr>
      <tr>
        <td><b>Tanggal</b></td>
        <td><b>Keterangan</b></td>
        <td><b>Referensi</b></td>
        <td><b>Akun</b></td>
        <td><b>Debit</b></td>
        <td><b>Kredit</b></td>
      </tr>
      ${filteredJournals.map(journal => 
        journal.entries.map(entry => `
          <tr>
            <td>${journal.date}</td>
            <td>${journal.description}</td>
            <td>${journal.reference}</td>
            <td>${entry.account_name}</td>
            <td>${entry.debit}</td>
            <td>${entry.credit}</td>
          </tr>
        `).join('')
      ).join('')}
    </table>
  `;

  const handleExport = () => {
    if (!exportFormat) {
      alert('Pilih format export terlebih dahulu!');
      return;
    }

    switch (exportFormat) {
      case 'pdf':
        exportToPDF();
        break;
      case 'excel':
        exportToExcel();
        break;
      case 'csv':
        exportToCSV();
        break;
    }

    setOpen(false);
    setExportFormat('');
  };

  const formatOptions = [
    { value: 'pdf', label: 'PDF', icon: FileText },
    { value: 'excel', label: 'Excel (.xls)', icon: FileSpreadsheet },
    { value: 'csv', label: 'CSV', icon: FileX }
  ];

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Download className="h-4 w-4 mr-2" />
          Export
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Export Laporan</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Pilih Format Export</Label>
            <Select value={exportFormat} onValueChange={setExportFormat}>
              <SelectTrigger>
                <SelectValue placeholder="Pilih format file" />
              </SelectTrigger>
              <SelectContent>
                {formatOptions.map((option) => {
                  const IconComponent = option.icon;
                  return (
                    <SelectItem key={option.value} value={option.value}>
                      <div className="flex items-center">
                        <IconComponent className="h-4 w-4 mr-2" />
                        {option.label}
                      </div>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>
          
          <div className="bg-gray-50 p-3 rounded-lg text-sm">
            <p className="font-medium mb-1">Info Export:</p>
            <p>• PDF: Untuk cetak dan tampilan profesional</p>
            <p>• Excel: Untuk analisis data lebih lanjut</p>
            <p>• CSV: Untuk import ke aplikasi lain</p>
          </div>

          <div className="flex gap-2">
            <Button onClick={handleExport} className="flex-1" disabled={!exportFormat}>
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
            <Button variant="outline" onClick={() => setOpen(false)} className="flex-1">
              Batal
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}