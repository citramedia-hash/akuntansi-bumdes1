import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Printer, Calendar } from 'lucide-react';
import { Account, JournalEntry, BUMDesProfile } from '@/types/accounting';
import { formatCurrency, getInitialAccounts, calculateAccountBalance, getInitialProfile } from '@/utils/accounting';
import ExportDialog from '@/components/ExportDialog';

export default function Reports() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [journalEntries, setJournalEntries] = useState<JournalEntry[]>([]);
  const [profile, setProfile] = useState<BUMDesProfile>(getInitialProfile());
  const [reportType, setReportType] = useState('summary');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    const savedAccounts = localStorage.getItem('bumdes_accounts');
    const savedJournals = localStorage.getItem('bumdes_journals');
    const savedProfile = localStorage.getItem('bumdes_profile');

    const loadedAccounts = savedAccounts ? JSON.parse(savedAccounts) : getInitialAccounts();
    const loadedJournals = savedJournals ? JSON.parse(savedJournals) : [];
    const loadedProfile = savedProfile ? JSON.parse(savedProfile) : getInitialProfile();

    setAccounts(loadedAccounts);
    setJournalEntries(loadedJournals);
    setProfile(loadedProfile);

    // Set default date range (current month)
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    
    setDateFrom(firstDay.toISOString().split('T')[0]);
    setDateTo(lastDay.toISOString().split('T')[0]);
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
  const totalEquity = calculateTotalByType('Modal');
  const totalRevenue = calculateTotalByType('Pendapatan');
  const totalExpenses = calculateTotalByType('Beban');
  const netIncome = totalRevenue - totalExpenses;

  // PERBAIKAN FINAL: Perhitungan Modal Akhir yang BENAR
  // Modal Akhir = |Modal Awal| + Laba/Rugi Bersih
  // Jika Modal Awal = 81.360.000 dan Rugi Bersih = -7.452.000
  // Maka Modal Akhir = 81.360.000 + (-7.452.000) = 73.908.000
  const initialEquity = Math.abs(totalEquity); // Pastikan modal awal positif
  const finalEquity = initialEquity + netIncome; // Tambah laba atau kurang rugi

  const handlePrint = () => {
    window.print();
  };

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

  // Cash flow calculation
  const calculateCashFlow = () => {
    const operatingActivities = [];
    const investingActivities = [];
    const financingActivities = [];

    // Operating activities (from revenue and expense accounts)
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

    // Investing activities (from asset accounts - excluding cash)
    const assetAccounts = getAccountsByType('Aset').filter(account => 
      !account.name.toLowerCase().includes('kas') && 
      !account.name.toLowerCase().includes('bank')
    );

    assetAccounts.forEach(account => {
      if (Math.abs(account.balance) > 0) {
        investingActivities.push({
          description: `Perubahan ${account.name}`,
          amount: -account.balance // Increase in assets is cash outflow
        });
      }
    });

    // Financing activities (from liability and equity accounts)
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

  return (
    <div className="space-y-6">
      {/* Controls - Hide on print */}
      <div className="print:hidden">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Laporan Keuangan</h1>
            <p className="text-gray-600 mt-1">Generate dan cetak laporan keuangan</p>
          </div>
          <div className="flex gap-2">
            <ExportDialog
              journalEntries={journalEntries}
              accounts={accounts}
              profile={profile}
              reportType={reportType}
              dateFrom={dateFrom}
              dateTo={dateTo}
            />
            <Button onClick={handlePrint} variant="outline">
              <Printer className="h-4 w-4 mr-2" />
              Cetak
            </Button>
          </div>
        </div>

        {/* Filter Controls */}
        <Card>
          <CardHeader>
            <CardTitle>Filter Laporan</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Jenis Laporan</Label>
                <Select value={reportType} onValueChange={setReportType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="summary">Ringkasan Keuangan</SelectItem>
                    <SelectItem value="detailed">Detail Jurnal</SelectItem>
                    <SelectItem value="balance_sheet">Neraca</SelectItem>
                    <SelectItem value="income_statement">Laporan Rugi Laba</SelectItem>
                    <SelectItem value="cash_flow">Laporan Arus Kas</SelectItem>
                    <SelectItem value="equity_changes">Laporan Perubahan Modal</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Dari Tanggal</Label>
                <Input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Sampai Tanggal</Label>
                <Input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Report Content */}
      <div className="bg-white print:shadow-none">
        {/* Report Header */}
        <div className="text-center border-b-2 border-gray-800 pb-4 mb-6">
          <h1 className="text-xl font-bold text-gray-900">{profile.name}</h1>
          <p className="text-sm text-gray-600">{profile.address}</p>
          <p className="text-sm text-gray-600">
            Telp: {profile.director_phone} | Email: {profile.email}
          </p>
          <h2 className="text-lg font-semibold text-gray-900 mt-4">{getReportTitle()}</h2>
          <p className="text-sm text-gray-600">Periode: {getDateRangeText()}</p>
          <p className="text-sm text-gray-600">Tanggal Cetak: {new Date().toLocaleDateString('id-ID', {
            day: '2-digit',
            month: 'long', 
            year: 'numeric'
          })}</p>
        </div>

        {/* Report Content Based on Type */}
        {reportType === 'summary' && (
          /* Summary Report */
          <div className="space-y-6">
            <div>
              <h3 className="text-base font-semibold text-gray-900 mb-3">Ringkasan Keuangan</h3>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between py-1">
                  <span>Total Aset:</span>
                  <span className="font-medium text-green-600">{formatCurrency(totalAssets)}</span>
                </div>
                <div className="flex justify-between py-1">
                  <span>Total Kewajiban:</span>
                  <span className="font-medium text-red-600">{formatCurrency(totalLiabilities)}</span>
                </div>
                <div className="flex justify-between py-1">
                  <span>Total Modal:</span>
                  <span className="font-medium text-blue-600">{formatCurrency(totalEquity)}</span>
                </div>
                <div className="flex justify-between py-1">
                  <span>Total Pendapatan:</span>
                  <span className="font-medium text-green-600">{formatCurrency(totalRevenue)}</span>
                </div>
                <div className="flex justify-between py-1">
                  <span>Total Beban:</span>
                  <span className="font-medium text-red-600">{formatCurrency(totalExpenses)}</span>
                </div>
                <div className="flex justify-between py-1 border-t border-gray-300 font-semibold">
                  <span>Laba Bersih:</span>
                  <span className={netIncome >= 0 ? "text-green-600" : "text-red-600"}>{formatCurrency(netIncome)}</span>
                </div>
                <div className="flex justify-between py-1">
                  <span>Total Jurnal:</span>
                  <span className="font-medium">{filteredJournals.length}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {reportType === 'balance_sheet' && (
          /* Balance Sheet */
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Assets */}
              <div>
                <h3 className="text-base font-semibold text-gray-900 mb-3 border-b border-gray-300 pb-1">ASET</h3>
                <div className="space-y-1 text-sm">
                  {getAccountsByType('Aset').map(account => (
                    <div key={account.id} className="flex justify-between py-1">
                      <span>{account.name}</span>
                      <span>{formatCurrency(Math.abs(account.balance))}</span>
                    </div>
                  ))}
                  <div className="flex justify-between py-1 border-t border-gray-300 font-semibold">
                    <span>Total Aset</span>
                    <span>{formatCurrency(totalAssets)}</span>
                  </div>
                </div>
              </div>

              {/* Liabilities and Equity */}
              <div>
                <h3 className="text-base font-semibold text-gray-900 mb-3 border-b border-gray-300 pb-1">KEWAJIBAN & MODAL</h3>
                
                {/* Liabilities */}
                <div className="mb-4">
                  <h4 className="text-sm font-medium text-gray-800 mb-2">Kewajiban:</h4>
                  <div className="space-y-1 text-sm ml-2">
                    {getAccountsByType('Kewajiban').map(account => (
                      <div key={account.id} className="flex justify-between py-1">
                        <span>{account.name}</span>
                        <span>{formatCurrency(Math.abs(account.balance))}</span>
                      </div>
                    ))}
                    <div className="flex justify-between py-1 border-t border-gray-200 font-medium">
                      <span>Total Kewajiban</span>
                      <span>{formatCurrency(totalLiabilities)}</span>
                    </div>
                  </div>
                </div>

                {/* Equity */}
                <div>
                  <h4 className="text-sm font-medium text-gray-800 mb-2">Modal:</h4>
                  <div className="space-y-1 text-sm ml-2">
                    {getAccountsByType('Modal').map(account => (
                      <div key={account.id} className="flex justify-between py-1">
                        <span>{account.name}</span>
                        <span>{formatCurrency(Math.abs(account.balance))}</span>
                      </div>
                    ))}
                    <div className="flex justify-between py-1">
                      <span>{netIncome >= 0 ? 'Laba Bersih Periode Berjalan' : 'Rugi Bersih Periode Berjalan'}</span>
                      <span className={netIncome >= 0 ? "text-green-600" : "text-red-600"}>
                        {formatCurrency(netIncome)}
                      </span>
                    </div>
                    <div className="flex justify-between py-1 border-t border-gray-200 font-medium">
                      <span>Total Modal</span>
                      <span>{formatCurrency(finalEquity)}</span>
                    </div>
                  </div>
                </div>

                <div className="flex justify-between py-1 border-t border-gray-300 font-semibold mt-4">
                  <span>Total Kewajiban & Modal</span>
                  <span>{formatCurrency(totalLiabilities + finalEquity)}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {reportType === 'income_statement' && (
          /* Income Statement */
          <div className="space-y-6">
            <div>
              {/* Revenue */}
              <div className="mb-6">
                <h3 className="text-base font-semibold text-gray-900 mb-3 border-b border-gray-300 pb-1">PENDAPATAN</h3>
                <div className="space-y-1 text-sm">
                  {getAccountsByType('Pendapatan').map(account => (
                    <div key={account.id} className="flex justify-between py-1">
                      <span>{account.name}</span>
                      <span>{formatCurrency(Math.abs(account.balance))}</span>
                    </div>
                  ))}
                  <div className="flex justify-between py-1 border-t border-gray-300 font-semibold">
                    <span>Total Pendapatan</span>
                    <span>{formatCurrency(totalRevenue)}</span>
                  </div>
                </div>
              </div>

              {/* Expenses */}
              <div className="mb-6">
                <h3 className="text-base font-semibold text-gray-900 mb-3 border-b border-gray-300 pb-1">BEBAN</h3>
                <div className="space-y-1 text-sm">
                  {getAccountsByType('Beban').map(account => (
                    <div key={account.id} className="flex justify-between py-1">
                      <span>{account.name}</span>
                      <span>{formatCurrency(Math.abs(account.balance))}</span>
                    </div>
                  ))}
                  <div className="flex justify-between py-1 border-t border-gray-300 font-semibold">
                    <span>Total Beban</span>
                    <span>{formatCurrency(totalExpenses)}</span>
                  </div>
                </div>
              </div>

              {/* Net Income */}
              <div className="border-t-2 border-gray-800 pt-3">
                <div className="flex justify-between py-2 text-base font-bold">
                  <span>LABA (RUGI) BERSIH</span>
                  <span className={netIncome >= 0 ? "text-green-600" : "text-red-600"}>
                    {formatCurrency(netIncome)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {reportType === 'cash_flow' && (
          /* Cash Flow Statement */
          <div className="space-y-6">
            <div>
              {/* Operating Activities */}
              <div className="mb-6">
                <h3 className="text-base font-semibold text-gray-900 mb-3 border-b border-gray-300 pb-1">ARUS KAS DARI AKTIVITAS OPERASI</h3>
                <div className="space-y-1 text-sm">
                  {cashFlow.operatingActivities.map((activity, index) => (
                    <div key={index} className="flex justify-between py-1">
                      <span>{activity.description}</span>
                      <span className={activity.amount >= 0 ? "text-green-600" : "text-red-600"}>
                        {formatCurrency(activity.amount)}
                      </span>
                    </div>
                  ))}
                  <div className="flex justify-between py-1 border-t border-gray-300 font-semibold">
                    <span>Kas Bersih dari Aktivitas Operasi</span>
                    <span className={cashFlow.operatingTotal >= 0 ? "text-green-600" : "text-red-600"}>
                      {formatCurrency(cashFlow.operatingTotal)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Investing Activities */}
              <div className="mb-6">
                <h3 className="text-base font-semibold text-gray-900 mb-3 border-b border-gray-300 pb-1">ARUS KAS DARI AKTIVITAS INVESTASI</h3>
                <div className="space-y-1 text-sm">
                  {cashFlow.investingActivities.length > 0 ? (
                    cashFlow.investingActivities.map((activity, index) => (
                      <div key={index} className="flex justify-between py-1">
                        <span>{activity.description}</span>
                        <span className={activity.amount >= 0 ? "text-green-600" : "text-red-600"}>
                          {formatCurrency(activity.amount)}
                        </span>
                      </div>
                    ))
                  ) : (
                    <div className="flex justify-between py-1 text-gray-500">
                      <span>Tidak ada aktivitas investasi</span>
                      <span>-</span>
                    </div>
                  )}
                  <div className="flex justify-between py-1 border-t border-gray-300 font-semibold">
                    <span>Kas Bersih dari Aktivitas Investasi</span>
                    <span className={cashFlow.investingTotal >= 0 ? "text-green-600" : "text-red-600"}>
                      {formatCurrency(cashFlow.investingTotal)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Financing Activities */}
              <div className="mb-6">
                <h3 className="text-base font-semibold text-gray-900 mb-3 border-b border-gray-300 pb-1">ARUS KAS DARI AKTIVITAS PENDANAAN</h3>
                <div className="space-y-1 text-sm">
                  {cashFlow.financingActivities.length > 0 ? (
                    cashFlow.financingActivities.map((activity, index) => (
                      <div key={index} className="flex justify-between py-1">
                        <span>{activity.description}</span>
                        <span className={activity.amount >= 0 ? "text-green-600" : "text-red-600"}>
                          {formatCurrency(activity.amount)}
                        </span>
                      </div>
                    ))
                  ) : (
                    <div className="flex justify-between py-1 text-gray-500">
                      <span>Tidak ada aktivitas pendanaan</span>
                      <span>-</span>
                    </div>
                  )}
                  <div className="flex justify-between py-1 border-t border-gray-300 font-semibold">
                    <span>Kas Bersih dari Aktivitas Pendanaan</span>
                    <span className={cashFlow.financingTotal >= 0 ? "text-green-600" : "text-red-600"}>
                      {formatCurrency(cashFlow.financingTotal)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Net Cash Flow */}
              <div className="border-t-2 border-gray-800 pt-3">
                <div className="flex justify-between py-2 text-base font-bold">
                  <span>KENAIKAN (PENURUNAN) BERSIH KAS</span>
                  <span className={cashFlow.netCashFlow >= 0 ? "text-green-600" : "text-red-600"}>
                    {formatCurrency(cashFlow.netCashFlow)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {reportType === 'equity_changes' && (
          /* Statement of Changes in Equity */
          <div className="space-y-6">
            <div>
              <h3 className="text-base font-semibold text-gray-900 mb-3 border-b border-gray-300 pb-1">PERUBAHAN MODAL</h3>
              <div className="space-y-4 text-sm">
                {/* Initial Capital */}
                <div>
                  <h4 className="font-medium text-gray-800 mb-2">Modal Awal Periode:</h4>
                  <div className="ml-4 space-y-1">
                    {getAccountsByType('Modal').map(account => (
                      <div key={account.id} className="flex justify-between py-1">
                        <span>{account.name}</span>
                        <span>{formatCurrency(Math.abs(account.balance))}</span>
                      </div>
                    ))}
                    <div className="flex justify-between py-1 border-t border-gray-200 font-medium">
                      <span>Total Modal Awal</span>
                      <span>{formatCurrency(initialEquity)}</span>
                    </div>
                  </div>
                </div>

                {/* Net Income */}
                <div>
                  <h4 className="font-medium text-gray-800 mb-2">Laba (Rugi) Periode Berjalan:</h4>
                  <div className="ml-4">
                    <div className="flex justify-between py-1">
                      <span>{netIncome >= 0 ? 'Laba Bersih' : 'Rugi Bersih'}</span>
                      <span className={netIncome >= 0 ? "text-green-600" : "text-red-600"}>
                        {formatCurrency(netIncome)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Additional Capital (if any) */}
                <div>
                  <h4 className="font-medium text-gray-800 mb-2">Penambahan Modal:</h4>
                  <div className="ml-4">
                    <div className="flex justify-between py-1 text-gray-500">
                      <span>Tidak ada penambahan modal</span>
                      <span>-</span>
                    </div>
                  </div>
                </div>

                {/* Withdrawals (if any) */}
                <div>
                  <h4 className="font-medium text-gray-800 mb-2">Penarikan Modal:</h4>
                  <div className="ml-4">
                    <div className="flex justify-between py-1 text-gray-500">
                      <span>Tidak ada penarikan modal</span>
                      <span>-</span>
                    </div>
                  </div>
                </div>

                {/* Final Capital */}
                <div className="border-t-2 border-gray-800 pt-3">
                  <div className="flex justify-between py-2 text-base font-bold">
                    <span>MODAL AKHIR PERIODE</span>
                    <span className="text-blue-600">{formatCurrency(finalEquity)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {reportType === 'detailed' && (
          /* Detailed Journal Report */
          <div className="space-y-4">
            <h3 className="text-base font-semibold text-gray-900">Detail Jurnal</h3>
            
            {filteredJournals.length === 0 ? (
              <p className="text-center text-gray-500 py-8">Tidak ada jurnal ditemukan</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs border-collapse">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="border border-gray-300 px-2 py-1 text-left font-medium">Tanggal</th>
                      <th className="border border-gray-300 px-2 py-1 text-left font-medium">Keterangan</th>
                      <th className="border border-gray-300 px-2 py-1 text-left font-medium">Referensi</th>
                      <th className="border border-gray-300 px-2 py-1 text-left font-medium">Akun</th>
                      <th className="border border-gray-300 px-2 py-1 text-right font-medium">Debit</th>
                      <th className="border border-gray-300 px-2 py-1 text-right font-medium">Kredit</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredJournals.map((journal) => (
                      journal.entries.map((entry, entryIndex) => (
                        <tr key={`${journal.id}-${entryIndex}`}>
                          {entryIndex === 0 && (
                            <>
                              <td className="border border-gray-300 px-2 py-1" rowSpan={journal.entries.length}>
                                {new Date(journal.date).toLocaleDateString('id-ID')}
                              </td>
                              <td className="border border-gray-300 px-2 py-1" rowSpan={journal.entries.length}>
                                {journal.description}
                              </td>
                              <td className="border border-gray-300 px-2 py-1" rowSpan={journal.entries.length}>
                                {journal.reference}
                              </td>
                            </>
                          )}
                          <td className="border border-gray-300 px-2 py-1">{entry.account_name}</td>
                          <td className="border border-gray-300 px-2 py-1 text-right">
                            {entry.debit > 0 ? formatCurrency(entry.debit) : '-'}
                          </td>
                          <td className="border border-gray-300 px-2 py-1 text-right">
                            {entry.credit > 0 ? formatCurrency(entry.credit) : '-'}
                          </td>
                        </tr>
                      ))
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Report Footer */}
        <div className="mt-8 pt-4 border-t border-gray-300">
          <div className="flex justify-between">
            <div className="text-center text-xs">
              <p className="mb-16">Bendahara BUMDes</p>
              <p className="border-b border-gray-800 inline-block px-8"></p>
              <p className="mt-1">{profile.treasurer_name || 'Bendahara'}</p>
            </div>
            <div className="text-center text-xs">
              <p className="mb-16">Direktur BUMDes</p>
              <p className="border-b border-gray-800 inline-block px-8"></p>
              <p className="mt-1">{profile.director_name}</p>
            </div>
          </div>
          <div className="text-right text-xs text-gray-500 mt-4">
            Dicetak pada: {new Date().toLocaleString('id-ID')}
          </div>
        </div>
      </div>
    </div>
  );
}