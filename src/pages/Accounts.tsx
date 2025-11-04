import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, Search, Edit, Trash2, Users } from 'lucide-react';
import { Account, JournalEntry, AccountType } from '@/types/accounting';
import { formatCurrency, getInitialAccounts, calculateAccountBalance, getAccountsByType } from '@/utils/accounting';
import AccountForm from '@/components/AccountForm';

const accountTypeColors = {
  'Aset': 'bg-blue-100 text-blue-800',
  'Kewajiban': 'bg-red-100 text-red-800',
  'Modal': 'bg-purple-100 text-purple-800',
  'Pendapatan': 'bg-green-100 text-green-800',
  'Beban': 'bg-orange-100 text-orange-800'
};

export default function Accounts() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [journalEntries, setJournalEntries] = useState<JournalEntry[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

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

  const handleSaveAccount = (accountData: Omit<Account, 'id' | 'created_date'>) => {
    let updatedAccounts;
    
    if (editingAccount) {
      // Update existing account
      updatedAccounts = accounts.map(account => 
        account.id === editingAccount.id 
          ? { ...accountData, id: editingAccount.id, created_date: editingAccount.created_date }
          : account
      );
    } else {
      // Add new account
      const newAccount: Account = {
        ...accountData,
        id: Date.now().toString(),
        created_date: new Date().toISOString().split('T')[0]
      };
      updatedAccounts = [...accounts, newAccount];
    }

    setAccounts(updatedAccounts);
    localStorage.setItem('bumdes_accounts', JSON.stringify(updatedAccounts));
    
    setShowForm(false);
    setEditingAccount(null);
  };

  const handleEditAccount = (account: Account) => {
    setEditingAccount(account);
    setShowForm(true);
  };

  const handleDeleteAccount = (accountId: string) => {
    // Check if account is used in any journal entries
    const isUsed = journalEntries.some(journal => 
      journal.entries.some(entry => entry.account_id === accountId)
    );

    if (isUsed) {
      alert('Akun tidak dapat dihapus karena sudah digunakan dalam jurnal!');
      return;
    }

    if (confirm('Apakah Anda yakin ingin menghapus akun ini?')) {
      const updatedAccounts = accounts.filter(account => account.id !== accountId);
      setAccounts(updatedAccounts);
      localStorage.setItem('bumdes_accounts', JSON.stringify(updatedAccounts));
    }
  };

  const filteredAccounts = accounts.filter(account =>
    account.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    account.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const accountsByType = (type: AccountType) => 
    getAccountsByType(filteredAccounts, type).sort((a, b) => a.code.localeCompare(b.code));

  if (showForm) {
    return (
      <AccountForm
        accounts={accounts}
        editingAccount={editingAccount}
        onSave={handleSaveAccount}
        onCancel={() => {
          setShowForm(false);
          setEditingAccount(null);
        }}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Akun</h1>
          <p className="text-gray-600 mt-1">Kelola chart of accounts untuk sistem akuntansi</p>
        </div>
        <Button 
          onClick={() => setShowForm(true)}
          className="bg-slate-900 hover:bg-slate-800"
        >
          <Plus className="h-4 w-4 mr-2" />
          Tambah Akun Baru
        </Button>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Cari akun..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Accounts by Type */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {(['Aset', 'Kewajiban', 'Modal', 'Pendapatan', 'Beban'] as AccountType[]).map((type) => {
          const typeAccounts = accountsByType(type);
          return (
            <Card key={type}>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>{type}</span>
                  <Badge variant="secondary" className={accountTypeColors[type]}>
                    {typeAccounts.length} akun
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {typeAccounts.length === 0 ? (
                  <div className="text-center py-8">
                    <Users className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-gray-500 text-sm">Belum ada akun {type.toLowerCase()}</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {typeAccounts.map((account) => {
                      const currentBalance = calculateAccountBalance(account, journalEntries);
                      return (
                        <div key={account.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-medium text-gray-900">{account.name}</span>
                              <Badge variant="outline" className="text-xs">
                                {account.code}
                              </Badge>
                            </div>
                            <div className="text-sm text-gray-500">
                              <span>Dibuat: {account.created_date}</span>
                              <span className="ml-4">Saldo: </span>
                              <span className="font-medium text-gray-900">
                                {formatCurrency(currentBalance)}
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() => handleEditAccount(account)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() => handleDeleteAccount(account.id)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}