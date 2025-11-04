import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Edit, Building2, MapPin, Mail, Phone, Users } from 'lucide-react';
import { BUMDesProfile } from '@/types/accounting';
import { getInitialProfile } from '@/utils/accounting';
import ProfileForm from '@/components/ProfileForm';

export default function Profile() {
  const [profile, setProfile] = useState<BUMDesProfile>(getInitialProfile());
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = () => {
    const savedProfile = localStorage.getItem('bumdes_profile');
    if (savedProfile) {
      setProfile(JSON.parse(savedProfile));
    } else {
      const initialProfile = getInitialProfile();
      localStorage.setItem('bumdes_profile', JSON.stringify(initialProfile));
      setProfile(initialProfile);
    }
  };

  const handleSaveProfile = (updatedProfile: BUMDesProfile) => {
    localStorage.setItem('bumdes_profile', JSON.stringify(updatedProfile));
    setProfile(updatedProfile);
    setShowForm(false);
  };

  if (showForm) {
    return (
      <ProfileForm
        onSave={handleSaveProfile}
        onCancel={() => setShowForm(false)}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Profil BUMDes</h1>
          <p className="text-gray-600 mt-1">Informasi dan data BUMDes</p>
        </div>
        <Button 
          onClick={() => setShowForm(true)}
          className="bg-blue-600 hover:bg-blue-700 w-full sm:w-auto"
        >
          <Edit className="h-4 w-4 mr-2" />
          Edit Profil
        </Button>
      </div>

      {/* Profile Information */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-blue-600" />
              Informasi Dasar
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-500">Nama BUMDes</label>
              <p className="text-lg font-semibold text-gray-900">{profile.name}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Kegiatan Usaha</label>
              <p className="text-gray-900">{profile.business_activities}</p>
            </div>
            <div className="flex items-start gap-2">
              <Mail className="h-4 w-4 text-gray-400 mt-1" />
              <div>
                <label className="text-sm font-medium text-gray-500">Email</label>
                <p className="text-gray-900">{profile.email}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Location Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5 text-green-600" />
              Lokasi
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-500">Desa</label>
              <p className="text-gray-900">{profile.village}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Kecamatan</label>
              <p className="text-gray-900">{profile.subdistrict}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Kabupaten</label>
              <p className="text-gray-900">{profile.district}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Alamat Lengkap</label>
              <p className="text-gray-900">{profile.address}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Management Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-purple-600" />
            Pengurus BUMDes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Director */}
            <div className="space-y-3">
              <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                Direktur
              </Badge>
              <div>
                <p className="font-semibold text-gray-900">{profile.director_name}</p>
                <div className="flex items-center gap-1 mt-1">
                  <Phone className="h-3 w-3 text-gray-400" />
                  <p className="text-sm text-gray-600">{profile.director_phone}</p>
                </div>
              </div>
            </div>

            {/* Secretary */}
            <div className="space-y-3">
              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                Sekretaris
              </Badge>
              <div>
                <p className="font-semibold text-gray-900">{profile.secretary_name}</p>
                <div className="flex items-center gap-1 mt-1">
                  <Phone className="h-3 w-3 text-gray-400" />
                  <p className="text-sm text-gray-600">{profile.secretary_phone}</p>
                </div>
              </div>
            </div>

            {/* Treasurer */}
            <div className="space-y-3">
              <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
                Bendahara
              </Badge>
              <div>
                <p className="font-semibold text-gray-900">{profile.treasurer_name}</p>
                <div className="flex items-center gap-1 mt-1">
                  <Phone className="h-3 w-3 text-gray-400" />
                  <p className="text-sm text-gray-600">{profile.treasurer_phone}</p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Last Updated */}
      <Card>
        <CardContent className="pt-6">
          <p className="text-sm text-gray-500 text-center">
            Terakhir diperbarui: {new Date(profile.updated_date).toLocaleString('id-ID')}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}