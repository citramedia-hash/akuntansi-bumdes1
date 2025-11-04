import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { X, Plus, Trash2, Check, ChevronsUpDown } from 'lucide-react';
import { Account, JournalEntry, JournalEntryItem } from '@/types/accounting';
import { formatCurrency, validateJournalEntry } from '@/utils/accounting';
import { cn } from '@/lib/utils';

interface JournalFormProps {
  accounts: Account[];
  onSave: (journal: Omit<JournalEntry, 'id' | 'created_date'>) => void;
  onCancel: () => void;
}

export default function JournalForm({ accounts, onSave, onCancel }: JournalFormProps) {
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [reference, setReference] = useState('');
  const [description, setDescription] = useState('');
  const [entries, setEntries] = useState<Omit<JournalEntryItem, 'id'>[]>([
    { account_id: '', account_name: '', debit: 0, credit: 0 },
    { account_id: '', account_name: '', debit: 0, credit: 0 }
  ]);
  const [openPopovers, setOpenPopovers] = useState<boolean[]>([false, false]);

  useEffect(() => {
    // Generate reference number
    const now = new Date();
    const refNumber = `JRN${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}-${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}`;
    setReference(refNumber);
  }, []);

  const handleAccountChange = (index: number, accountId: string) => {
    const account = accounts.find(acc => acc.id === accountId);
    if (account) {
      const newEntries = [...entries];
      newEntries[index] = {
        ...newEntries[index],
        account_id: accountId,
        account_name: account.name
      };
      setEntries(newEntries);
      
      // Close the popover
      const newOpenPopovers = [...openPopovers];
      newOpenPopovers[index] = false;
      setOpenPopovers(newOpenPopovers);
    }
  };

  const handlePopoverChange = (index: number, open: boolean) => {
    const newOpenPopovers = [...openPopovers];
    newOpenPopovers[index] = open;
    setOpenPopovers(newOpenPopovers);
  };

  const handleAmountChange = (index: number, field: 'debit' | 'credit', value: string) => {
    const numValue = parseFloat(value) || 0;
    const newEntries = [...entries];
    newEntries[index] = {
      ...newEntries[index],
      [field]: numValue,
      [field === 'debit' ? 'credit' : 'debit']: 0 // Reset the other field
    };
    setEntries(newEntries);
  };

  const addEntry = () => {
    setEntries([...entries, { account_id: '', account_name: '', debit: 0, credit: 0 }]);
    setOpenPopovers([...openPopovers, false]);
  };

  const removeEntry = (index: number) => {
    if (entries.length > 2) {
      setEntries(entries.filter((_, i) => i !== index));
      setOpenPopovers(openPopovers.filter((_, i) => i !== index));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!description.trim()) {
      alert('Keterangan harus diisi!');
      return;
    }

    const validEntries = entries.filter(entry => 
      entry.account_id && (entry.debit > 0 || entry.credit > 0)
    );

    if (validEntries.length < 2) {
      alert('Minimal harus ada 2 entri jurnal!');
      return;
    }

    if (!validateJournalEntry(validEntries)) {
      alert('Total debit dan kredit harus seimbang!');
      return;
    }

    const journalData = {
      date,
      reference,
      description: description.trim(),
      entries: validEntries.map((entry, index) => ({
        ...entry,
        id: `entry_${Date.now()}_${index}`
      }))
    };

    onSave(journalData);
  };

  const totalDebit = entries.reduce((sum, entry) => sum + entry.debit, 0);
  const totalCredit = entries.reduce((sum, entry) => sum + entry.credit, 0);
  const isBalanced = Math.abs(totalDebit - totalCredit) < 0.01;

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Tambah Jurnal Baru</CardTitle>
        <Button variant="ghost" size="icon" onClick={onCancel}>
          <X className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="date">Tanggal *</Label>
              <Input
                id="date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="reference">No. Referensi *</Label>
              <Input
                id="reference"
                value={reference}
                onChange={(e) => setReference(e.target.value)}
                placeholder="JRN202411020001"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Keterangan *</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Masukkan keterangan transaksi"
              rows={3}
              required
            />
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-base font-semibold">Entri Jurnal</Label>
              <Button type="button" onClick={addEntry} size="sm" variant="outline">
                <Plus className="h-4 w-4 mr-2" />
                Tambah Entri
              </Button>
            </div>

            <div className="space-y-3">
              {entries.map((entry, index) => (
                <div key={index} className="grid grid-cols-1 md:grid-cols-12 gap-3 p-3 border rounded-lg">
                  <div className="md:col-span-5">
                    <Label className="text-sm">Akun</Label>
                    <Popover open={openPopovers[index]} onOpenChange={(open) => handlePopoverChange(index, open)}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          role="combobox"
                          aria-expanded={openPopovers[index]}
                          className="w-full justify-between"
                        >
                          {entry.account_name || "Pilih akun"}
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-full p-0" align="start">
                        <Command>
                          <CommandInput placeholder="Cari akun..." />
                          <CommandList>
                            <CommandEmpty>Tidak ada akun ditemukan.</CommandEmpty>
                            <CommandGroup>
                              {accounts.map((account) => (
                                <CommandItem
                                  key={account.id}
                                  value={`${account.code} ${account.name}`}
                                  onSelect={() => handleAccountChange(index, account.id)}
                                >
                                  <Check
                                    className={cn(
                                      "mr-2 h-4 w-4",
                                      entry.account_id === account.id ? "opacity-100" : "opacity-0"
                                    )}
                                  />
                                  {account.code} - {account.name}
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                  </div>
                  
                  <div className="md:col-span-3">
                    <Label className="text-sm">Debit (Rp)</Label>
                    <Input
                      type="number"
                      value={entry.debit || ''}
                      onChange={(e) => handleAmountChange(index, 'debit', e.target.value)}
                      placeholder="0"
                      min="0"
                      step="0.01"
                    />
                  </div>
                  
                  <div className="md:col-span-3">
                    <Label className="text-sm">Kredit (Rp)</Label>
                    <Input
                      type="number"
                      value={entry.credit || ''}
                      onChange={(e) => handleAmountChange(index, 'credit', e.target.value)}
                      placeholder="0"
                      min="0"
                      step="0.01"
                    />
                  </div>
                  
                  <div className="md:col-span-1 flex items-end">
                    {entries.length > 2 && (
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={() => removeEntry(index)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Summary */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium">Total Debit: </span>
                  <span className="text-blue-600">{formatCurrency(totalDebit)}</span>
                </div>
                <div>
                  <span className="font-medium">Total Kredit: </span>
                  <span className="text-green-600">{formatCurrency(totalCredit)}</span>
                </div>
              </div>
              <div className="mt-2">
                <span className="font-medium">Status: </span>
                <span className={isBalanced ? 'text-green-600' : 'text-red-600'}>
                  {isBalanced ? '✓ Seimbang' : '✗ Tidak Seimbang'}
                </span>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-4">
            <Button 
              type="submit" 
              className="flex-1 bg-slate-900 hover:bg-slate-800"
              disabled={!isBalanced}
            >
              Simpan Jurnal
            </Button>
            <Button type="button" variant="outline" onClick={onCancel} className="flex-1">
              Batal
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}