import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Download } from 'lucide-react';
import { Account, JournalEntry, AccountType } from '@/types/accounting';
import { formatCurrency, calculateAccountBalance, calculateFinancialSummary, getAccountsByType } from '@/utils/accounting';

interface ReportViewerProps {
  accounts: Account[];
  journalEntries: JournalEntry[];
}

type ReportType = 'summary' | 'detailed' | 'trial_balance';
type PeriodType = 'all' | 'last_month' | 'last_3_months' | 'last_year';

export default function ReportViewer({ accounts, journalEntries }: ReportViewerProps) {
  const [reportType, setReportType] = useState<ReportType>('summary');
  const [period, setPeriod] = useState<PeriodType>('all');

  const filterJournalsByPeriod = (journals: JournalEntry[], periodType: PeriodType): JournalEntry[] => {
    if (periodType === 'all') return journals;

    const now = new Date();
    const cutoffDate = new Date();

    switch (periodType) {
      case 'last_month':
        cutoffDate.setMonth(now.getMonth() - 1);
        break;
      case 'last_3_months':
        cutoffDate.setMonth(now.getMonth() - 3);
        break;
      case 'last_year':
        cutoffDate.setFullYear(now.getFullYear() - 1);
        break;
    }

    return journals.filter(journal => new Date(journal.date) >= cutoffDate);
  };

  const filteredJournals = filterJournalsByPeriod(journalEntries, period);
  const summary = calculateFinancialSummary(accounts, filteredJournals);

  const handlePrint = () => {
    window.print();
  };

  const renderSummaryReport = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900">Ringkasan Keuangan</h2>
        <p className="text-gray-600">BUMDes - Laporan Keuangan</p>
        <p className="text-sm text-gray-500">
          Periode: {period === 'all' ? 'Semua Periode' : 
                   period === 'last_month' ? '1 Bulan Terakhir' :
                   period === 'last_3_months' ? '3 Bulan Terakhir' : '1 Tahun Terakhir'}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg text-blue-600">Total Aset</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-blue-600">
              {formatCurrency(summary.total_assets)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg text-red-600">Total Kewajiban</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-red-600">
              {formatCurrency(summary.total_liabilities)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg text-purple-600">Total Modal</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-purple-600">
              {formatCurrency(summary.total_equity)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg text-green-600">Pendapatan</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-green-600">
              {formatCurrency(summary.total_revenue)}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Laba Bersih</CardTitle>
        </CardHeader>
        <CardContent>
          <p className={`text-4xl font-bold ${summary.net_income >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {formatCurrency(summary.net_income)}
          </p>
          <p className="text-sm text-gray-500 mt-2">
            Pendapatan - Beban = {formatCurrency(summary.total_revenue)} - {formatCurrency(summary.total_expenses)}
          </p>
        </CardContent>
      </Card>
    </div>
  );

  const renderDetailedReport = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900">Laporan Detail</h2>
        <p className="text-gray-600">BUMDes - Laporan Keuangan Detail</p>
      </div>

      {(['Aset', 'Kewajiban', 'Modal', 'Pendapatan', 'Beban'] as AccountType[]).map((type) => {
        const typeAccounts = getAccountsByType(accounts, type);
        const totalBalance = typeAccounts.reduce((sum, account) => 
          sum + calculateAccountBalance(account, filteredJournals), 0
        );

        return (
          <Card key={type}>
            <CardHeader>
              <CardTitle className="flex justify-between items-center">
                <span>{type}</span>
                <span className="text-lg font-bold">
                  {formatCurrency(totalBalance)}
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {typeAccounts.map((account) => {
                  const balance = calculateAccountBalance(account, filteredJournals);
                  return (
                    <div key={account.id} className="flex justify-between items-center py-2 border-b">
                      <div>
                        <span className="font-medium">{account.name}</span>
                        <span className="text-sm text-gray-500 ml-2">({account.code})</span>
                      </div>
                      <span className="font-medium">
                        {formatCurrency(balance)}
                      </span>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );

  const renderTrialBalance = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900">Neraca Saldo</h2>
        <p className="text-gray-600">BUMDes - Neraca Saldo</p>
      </div>

      {(['Aset', 'Kewajiban', 'Modal', 'Pendapatan'] as AccountType[]).map((type) => {
        const typeAccounts = getAccountsByType(accounts, type);
        
        return (
          <Card key={type}>
            <CardHeader>
              <CardTitle>{type}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {typeAccounts.map((account) => {
                  const balance = calculateAccountBalance(account, filteredJournals);
                  return (
                    <div key={account.id} className="flex justify-between items-center py-2">
                      <div>
                        <span className="font-medium">- {account.name}</span>
                      </div>
                      <span className="font-medium text-green-600">
                        {formatCurrency(balance)}
                      </span>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 print:hidden">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Laporan</h1>
          <p className="text-gray-600 mt-1">Laporan keuangan dan analisis BUMDes</p>
        </div>
        <Button onClick={handlePrint} className="bg-slate-900 hover:bg-slate-800">
          <Download className="h-4 w-4 mr-2" />
          Cetak Laporan
        </Button>
      </div>

      <Card className="print:hidden">
        <CardHeader>
          <CardTitle>Pengaturan Laporan</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Jenis Laporan</label>
              <Select value={reportType || undefined} onValueChange={(value: ReportType) => setReportType(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="summary">Ringkasan Keuangan</SelectItem>
                  <SelectItem value="detailed">Laporan Detail</SelectItem>
                  <SelectItem value="trial_balance">Neraca Saldo</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Periode</label>
              <Select value={period || undefined} onValueChange={(value: PeriodType) => setPeriod(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Periode</SelectItem>
                  <SelectItem value="last_month">1 Bulan Terakhir</SelectItem>
                  <SelectItem value="last_3_months">3 Bulan Terakhir</SelectItem>
                  <SelectItem value="last_year">1 Tahun Terakhir</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Separator className="print:hidden" />

      <div className="print:mt-0">
        {reportType === 'summary' && renderSummaryReport()}
        {reportType === 'detailed' && renderDetailedReport()}
        {reportType === 'trial_balance' && renderTrialBalance()}
      </div>
    </div>
  );
}