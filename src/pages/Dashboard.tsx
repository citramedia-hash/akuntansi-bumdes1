import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  CreditCard,
  Plus,
  FileText,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';
import { Account, JournalEntry } from '@/types/accounting';
import { formatCurrency, getInitialAccounts, calculateAccountBalance } from '@/utils/accounting';
import { useNavigate } from 'react-router-dom';

export default function Dashboard() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [journalEntries, setJournalEntries] = useState<JournalEntry[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    const savedAccounts = localStorage.getItem('bumdes_accounts');
    const savedJournals = localStorage.getItem('bumdes_journals');

    const loadedAccounts = savedAccounts ? JSON.parse(savedAccounts) : getInitialAccounts();
    const loadedJournals = savedJournals ? JSON.parse(savedJournals) : [];

    if (!savedAccounts) {
      localStorage.setItem('bumdes_accounts', JSON.stringify(loadedAccounts));
    }

    setAccounts(loadedAccounts);
    setJournalEntries(loadedJournals);
  };

  const calculateTotalByType = (type: string) => {
    return accounts
      .filter(account => account.type === type)
      .reduce((total, account) => {
        const balance = calculateAccountBalance(account.id, journalEntries);
        return total + balance;
      }, 0);
  };

  const totalAssets = calculateTotalByType('Aset');
  const totalLiabilities = calculateTotalByType('Kewajiban');
  const totalEquity = calculateTotalByType('Modal');
  const totalRevenue = calculateTotalByType('Pendapatan');
  const totalExpenses = calculateTotalByType('Beban');
  const netIncome = totalRevenue - totalExpenses;

  const recentJournals = journalEntries
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5);

  const stats = [
    {
      title: 'Total Aset',
      value: totalAssets,
      icon: DollarSign,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      change: '+12.5%',
      changeType: 'positive'
    },
    {
      title: 'Total Kewajiban',
      value: totalLiabilities,
      icon: CreditCard,
      color: 'text-red-600',
      bgColor: 'bg-red-50',
      change: '-2.1%',
      changeType: 'negative'
    },
    {
      title: 'Pendapatan',
      value: totalRevenue,
      icon: TrendingUp,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      change: '+8.2%',
      changeType: 'positive'
    },
    {
      title: 'Laba Bersih',
      value: netIncome,
      icon: TrendingUp,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      change: '+15.3%',
      changeType: 'positive'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-1">BUMDes Contoh - Desa Contoh</p>
        </div>
        <Button 
          onClick={() => navigate('/journal')}
          className="bg-slate-900 hover:bg-slate-800 w-full sm:w-auto"
        >
          <Plus className="h-4 w-4 mr-2" />
          Tambah Jurnal
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, index) => (
          <Card key={index} className="hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                {stat.title}
              </CardTitle>
              <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                <stat.icon className={`h-4 w-4 ${stat.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className={`text-xl md:text-2xl font-bold ${stat.color}`}>
                  {formatCurrency(stat.value)}
                </div>
                <div className="text-xs text-gray-500">Saldo</div>
                <div className="flex items-center space-x-1">
                  {stat.changeType === 'positive' ? (
                    <ArrowUpRight className="h-3 w-3 text-green-500" />
                  ) : (
                    <ArrowDownRight className="h-3 w-3 text-red-500" />
                  )}
                  <span className={`text-xs ${
                    stat.changeType === 'positive' ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {stat.change}
                  </span>
                  <span className="text-xs text-gray-500">vs bulan lalu</span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent Journals */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg">Jurnal Terbaru</CardTitle>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => navigate('/journal')}
          >
            Lihat Semua
          </Button>
        </CardHeader>
        <CardContent>
          {recentJournals.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 mb-4">Belum ada jurnal</p>
              <Button 
                onClick={() => navigate('/journal')}
                className="bg-slate-900 hover:bg-slate-800"
              >
                Tambah Jurnal Pertama
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {recentJournals.map((journal) => (
                <div key={journal.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="outline" className="text-xs">
                        {journal.reference}
                      </Badge>
                      <span className="text-xs text-gray-500">{journal.date}</span>
                    </div>
                    <p className="font-medium text-gray-900 truncate">{journal.description}</p>
                    <p className="text-sm text-gray-500">
                      {journal.entries.length} entri
                    </p>
                  </div>
                  <div className="text-right ml-4">
                    <p className="font-semibold text-gray-900">
                      {formatCurrency(journal.entries.reduce((sum, entry) => sum + entry.debit, 0))}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => navigate('/journal')}>
          <CardContent className="p-6 text-center">
            <Plus className="h-8 w-8 text-blue-600 mx-auto mb-3" />
            <h3 className="font-semibold text-gray-900 mb-2">Tambah Jurnal</h3>
            <p className="text-sm text-gray-500">Catat transaksi baru</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => navigate('/accounts')}>
          <CardContent className="p-6 text-center">
            <CreditCard className="h-8 w-8 text-green-600 mx-auto mb-3" />
            <h3 className="font-semibold text-gray-900 mb-2">Kelola Akun</h3>
            <p className="text-sm text-gray-500">Atur chart of accounts</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => navigate('/reports')}>
          <CardContent className="p-6 text-center">
            <FileText className="h-8 w-8 text-purple-600 mx-auto mb-3" />
            <h3 className="font-semibold text-gray-900 mb-2">Lihat Laporan</h3>
            <p className="text-sm text-gray-500">Generate laporan keuangan</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}