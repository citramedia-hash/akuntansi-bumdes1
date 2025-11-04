import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { X } from 'lucide-react';
import { Account, AccountType } from '@/types/accounting';
import { generateAccountCode } from '@/utils/accounting';

interface AccountFormProps {
  accounts: Account[];
  editingAccount?: Account | null;
  onSave: (account: Omit<Account, 'id' | 'created_date'>) => void;
  onCancel: () => void;
}

const accountTypes: { value: AccountType; label: string }[] = [
  { value: 'Aset', label: 'Aset' },
  { value: 'Kewajiban', label: 'Kewajiban' },
  { value: 'Modal', label: 'Modal' },
  { value: 'Pendapatan', label: 'Pendapatan' },
  { value: 'Beban', label: 'Beban' }
];

export default function AccountForm({ accounts, editingAccount, onSave, onCancel }: AccountFormProps) {
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [type, setType] = useState<AccountType>('Aset');
  const [balance, setBalance] = useState(0);

  useEffect(() => {
    if (editingAccount) {
      setName(editingAccount.name);
      setCode(editingAccount.code);
      setType(editingAccount.type);
      setBalance(editingAccount.balance);
    } else {
      // Generate new account code
      const newCode = generateAccountCode(accounts, type);
      setCode(newCode);
    }
  }, [editingAccount, accounts, type]);

  const handleTypeChange = (newType: AccountType) => {
    setType(newType);
    if (!editingAccount) {
      // Generate new code when type changes
      const newCode = generateAccountCode(accounts, newType);
      setCode(newCode);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim()) {
      alert('Nama akun harus diisi!');
      return;
    }

    if (!code.trim()) {
      alert('Kode akun harus diisi!');
      return;
    }

    // Check if code already exists (except for editing)
    const existingAccount = accounts.find(acc => 
      acc.code === code && acc.id !== editingAccount?.id
    );
    
    if (existingAccount) {
      alert('Kode akun sudah digunakan!');
      return;
    }

    const accountData = {
      name: name.trim(),
      code: code.trim(),
      type,
      balance
    };

    onSave(accountData);
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>
          {editingAccount ? 'Edit Akun' : 'Tambah Akun Baru'}
        </CardTitle>
        <Button variant="ghost" size="icon" onClick={onCancel}>
          <X className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nama Akun *</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Masukkan nama akun"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="type">Jenis Akun *</Label>
            <Select value={type || undefined} onValueChange={handleTypeChange}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {accountTypes.map((accountType) => (
                  <SelectItem key={accountType.value} value={accountType.value}>
                    {accountType.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="code">Kode Akun *</Label>
            <Input
              id="code"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="Contoh: 1101"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="balance">Saldo Awal (Rp)</Label>
            <Input
              id="balance"
              type="number"
              value={balance}
              onChange={(e) => setBalance(parseFloat(e.target.value) || 0)}
              placeholder="0"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <Button type="submit" className="flex-1 bg-slate-900 hover:bg-slate-800">
              {editingAccount ? 'Update Akun' : 'Tambah Akun'}
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