import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Plus, Search, Edit, Trash2, FileText } from 'lucide-react';
import { Account, JournalEntry } from '@/types/accounting';
import { formatCurrency, getInitialAccounts } from '@/utils/accounting';
import JournalForm from '@/components/JournalForm';

export default function Journal() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [journalEntries, setJournalEntries] = useState<JournalEntry[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterAccount, setFilterAccount] = useState('');

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

  const handleSaveJournal = (journalData: Omit<JournalEntry, 'id' | 'created_date'>) => {
    const newJournal: JournalEntry = {
      ...journalData,
      id: `journal_${Date.now()}`,
      created_date: new Date().toISOString()
    };

    const updatedJournals = [...journalEntries, newJournal];
    setJournalEntries(updatedJournals);
    localStorage.setItem('bumdes_journals', JSON.stringify(updatedJournals));
    setShowForm(false);
  };

  const handleDeleteJournal = (journalId: string) => {
    if (confirm('Apakah Anda yakin ingin menghapus jurnal ini?')) {
      const updatedJournals = journalEntries.filter(journal => journal.id !== journalId);
      setJournalEntries(updatedJournals);
      localStorage.setItem('bumdes_journals', JSON.stringify(updatedJournals));
    }
  };

  // Filter journals based on search term and account filter
  const filteredJournals = journalEntries.filter(journal => {
    const matchesSearch = !searchTerm || 
      journal.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      journal.reference.toLowerCase().includes(searchTerm.toLowerCase()) ||
      journal.entries.some(entry => 
        entry.account_name.toLowerCase().includes(searchTerm.toLowerCase())
      );

    const matchesAccount = !filterAccount || 
      journal.entries.some(entry => entry.account_id === filterAccount);

    return matchesSearch && matchesAccount;
  });

  if (showForm) {
    return (
      <JournalForm
        accounts={accounts}
        onSave={handleSaveJournal}
        onCancel={() => setShowForm(false)}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Jurnal Umum</h1>
          <p className="text-gray-600 mt-1">Kelola semua jurnal akuntansi BUMDes</p>
        </div>
        <Button 
          onClick={() => setShowForm(true)}
          className="bg-slate-900 hover:bg-slate-800 w-full sm:w-auto"
        >
          <Plus className="h-4 w-4 mr-2" />
          Tambah Jurnal
        </Button>
      </div>

      {/* Search and Filter */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Daftar Jurnal</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Cari jurnal... (keterangan, referensi, atau nama akun)"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="w-full md:w-64">
              <Select value={filterAccount} onValueChange={setFilterAccount}>
                <SelectTrigger>
                  <SelectValue placeholder="Semua Akun" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Akun</SelectItem>
                  {accounts.map((account) => (
                    <SelectItem key={account.id} value={account.id}>
                      {account.code} - {account.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {filteredJournals.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 mb-4">
                {journalEntries.length === 0 ? 'Belum ada jurnal' : 'Tidak ada jurnal ditemukan'}
              </p>
              {journalEntries.length === 0 && (
                <Button 
                  onClick={() => setShowForm(true)}
                  className="bg-slate-900 hover:bg-slate-800"
                >
                  Tambah Jurnal Pertama
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {filteredJournals
                .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                .map((journal) => (
                <div key={journal.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="outline" className="text-xs">
                          {journal.reference}
                        </Badge>
                        <span className="text-sm text-gray-500">{journal.date}</span>
                      </div>
                      <h3 className="font-medium text-gray-900 mb-2">{journal.description}</h3>
                      <div className="space-y-1">
                        {journal.entries.map((entry, index) => (
                          <div key={index} className="text-sm text-gray-600 flex justify-between">
                            <span>{entry.account_name}</span>
                            <span>
                              {entry.debit > 0 && (
                                <span className="text-blue-600">D: {formatCurrency(entry.debit)}</span>
                              )}
                              {entry.credit > 0 && (
                                <span className="text-green-600">K: {formatCurrency(entry.credit)}</span>
                              )}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="text-right mr-4">
                        <p className="text-sm font-medium">
                          Total: {formatCurrency(
                            journal.entries.reduce((sum, entry) => sum + entry.debit, 0)
                          )}
                        </p>
                        <p className="text-xs text-gray-500">
                          {journal.entries.length} entri
                        </p>
                      </div>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => handleDeleteJournal(journal.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}