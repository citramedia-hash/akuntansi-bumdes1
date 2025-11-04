import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { X, Save } from 'lucide-react';
import { BUMDesProfile } from '@/types/accounting';
import { getInitialProfile } from '@/utils/accounting';

interface ProfileFormProps {
  onSave: (profile: BUMDesProfile) => void;
  onCancel: () => void;
}

export default function ProfileForm({ onSave, onCancel }: ProfileFormProps) {
  const [profile, setProfile] = useState<BUMDesProfile>(getInitialProfile());

  useEffect(() => {
    const savedProfile = localStorage.getItem('bumdes_profile');
    if (savedProfile) {
      setProfile(JSON.parse(savedProfile));
    }
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const updatedProfile = {
      ...profile,
      updated_date: new Date().toISOString()
    };
    onSave(updatedProfile);
  };

  const handleChange = (field: keyof BUMDesProfile, value: string) => {
    setProfile(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Profil BUMDes</CardTitle>
        <Button variant="ghost" size="icon" onClick={onCancel}>
          <X className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nama BUMDes *</Label>
              <Input
                id="name"
                value={profile.name}
                onChange={(e) => handleChange('name', e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={profile.email}
                onChange={(e) => handleChange('email', e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="village">Desa</Label>
              <Input
                id="village"
                value={profile.village}
                onChange={(e) => handleChange('village', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="subdistrict">Kecamatan</Label>
              <Input
                id="subdistrict"
                value={profile.subdistrict}
                onChange={(e) => handleChange('subdistrict', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="district">Kabupaten</Label>
              <Input
                id="district"
                value={profile.district}
                onChange={(e) => handleChange('district', e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="address">Alamat Lengkap</Label>
            <Textarea
              id="address"
              value={profile.address}
              onChange={(e) => handleChange('address', e.target.value)}
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="business_activities">Kegiatan Usaha</Label>
            <Textarea
              id="business_activities"
              value={profile.business_activities}
              onChange={(e) => handleChange('business_activities', e.target.value)}
              rows={2}
            />
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Pengurus BUMDes</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="director_name">Nama Direktur</Label>
                <Input
                  id="director_name"
                  value={profile.director_name}
                  onChange={(e) => handleChange('director_name', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="director_phone">No. WhatsApp/Telp Direktur</Label>
                <Input
                  id="director_phone"
                  value={profile.director_phone}
                  onChange={(e) => handleChange('director_phone', e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="secretary_name">Nama Sekretaris</Label>
                <Input
                  id="secretary_name"
                  value={profile.secretary_name}
                  onChange={(e) => handleChange('secretary_name', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="secretary_phone">No. WhatsApp/Telp Sekretaris</Label>
                <Input
                  id="secretary_phone"
                  value={profile.secretary_phone}
                  onChange={(e) => handleChange('secretary_phone', e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="treasurer_name">Nama Bendahara</Label>
                <Input
                  id="treasurer_name"
                  value={profile.treasurer_name}
                  onChange={(e) => handleChange('treasurer_name', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="treasurer_phone">No. WhatsApp/Telp Bendahara</Label>
                <Input
                  id="treasurer_phone"
                  value={profile.treasurer_phone}
                  onChange={(e) => handleChange('treasurer_phone', e.target.value)}
                />
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-4">
            <Button type="submit" className="flex-1 bg-blue-600 hover:bg-blue-700">
              <Save className="h-4 w-4 mr-2" />
              Simpan Profil
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