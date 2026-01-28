"use client";
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Save, Loader2, Building2 } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { apiService } from '@/lib/api';
import { useLanguage } from '@/context/LanguageContext';
import { useAuth } from '@/context/AuthContext';
import { switchToOrganizationPortal, isOrganizationOwner } from '@/lib/portalSwitch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export const ProfileInfo = () => {
  const { language, changeLanguage, t } = useLanguage();
  const { user } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [userData, setUserData] = useState({
    email: '',
    full_name: '',
    username: '',
    organization_role: '',
  });
  const [formData, setFormData] = useState({
    full_name: '',
    username: '',
  });

  useEffect(() => {
    fetchUserProfile();
  }, []);

  const fetchUserProfile = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      if (!token) {
        toast.error(t('profile.pleaseLogin'));
        return;
      }

      const response = await apiService.getUserProfile(token);
      if (response && response.success) {
        const userProfile = response.user;
        setUserData(userProfile);
        setFormData({
          full_name: userProfile.full_name || '',
          username: userProfile.username || '',
        });
      } else {
        toast.error(t('profile.failedToLoad'));
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      toast.error(t('profile.failedToLoad'));
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { id, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [id]: value
    }));
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const token = localStorage.getItem('token');
      if (!token) {
        toast.error(t('profile.pleaseLoginUpdate'));
        return;
      }

      const response = await apiService.updateUserProfile(formData, token);
      if (response && response.success) {
        setUserData(response.user);
        setIsEditing(false);
        toast.success(t('profile.profileUpdated'));
      } else {
        toast.error(response?.error || t('profile.failedToUpdate'));
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error(error?.message || t('profile.failedToUpdate'));
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      full_name: userData.full_name || '',
      username: userData.username || '',
    });
    setIsEditing(false);
  };

  const getInitials = () => {
    if (userData.full_name) {
      const names = userData.full_name.split(' ');
      if (names.length >= 2) {
        return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase();
      }
      return userData.full_name.substring(0, 2).toUpperCase();
    }
    if (userData.username) {
      return userData.username.substring(0, 2).toUpperCase();
    }
    if (userData.email) {
      return userData.email.substring(0, 2).toUpperCase();
    }
    return 'U';
  };


  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-[#884cff]" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">{t('profile.title')}</h1>
          <p className="text-muted-foreground">{t('profile.subtitle')}</p>
        </div>
        {!isEditing ? (
          <Button onClick={() => setIsEditing(true)} className="bg-[#884cff] hover:bg-[#884cff]/90">
            {t('profile.editProfile')}
          </Button>
        ) : (
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleCancel} disabled={saving}>
              {t('common.cancel')}
            </Button>
            <Button onClick={handleSave} disabled={saving} className="bg-[#884cff] hover:bg-[#884cff]/90">
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {t('profile.saving')}
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  {t('profile.saveChanges')}
                </>
              )}
            </Button>
          </div>
        )}
      </div>

      <Card className="shadow-elegant">
        <CardHeader>
          <CardTitle>{t('profile.profileInformation')}</CardTitle>
          <CardDescription>{t('profile.accountDetails')}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center gap-6">
            <Avatar className="w-24 h-24">
              <AvatarFallback className="bg-[#884cff] text-white text-2xl">
                {getInitials()}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="text-sm text-muted-foreground">{t('profile.profilePicture')}</p>
              <p className="text-xs text-muted-foreground mt-1">{t('profile.initialsGenerated')}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="full_name">{t('profile.fullName')}</Label>
              <Input
                id="full_name"
                value={formData.full_name}
                onChange={handleInputChange}
                disabled={!isEditing}
                placeholder={t('profile.enterFullName')}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="username">{t('profile.username')}</Label>
              <Input
                id="username"
                value={formData.username}
                onChange={handleInputChange}
                disabled={!isEditing}
                placeholder={t('profile.enterUsername')}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">{t('profile.emailAddress')}</Label>
            <Input
              id="email"
              type="email"
              value={userData.email}
              disabled
              className="bg-muted"
            />
            <p className="text-xs text-muted-foreground">{t('profile.emailCannotBeChanged')}</p>
          </div>

          {/* Language Settings - Only visible when editing */}
          {isEditing && (
            <div className="space-y-2 pt-4 border-t">
              <Label htmlFor="language">{t('profile.currentLanguage')}</Label>
              <Select value={language} onValueChange={changeLanguage}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder={t('profile.currentLanguage')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="en">{t('common.english')}</SelectItem>
                  <SelectItem value="es">{t('common.spanish')}</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">{t('profile.changeLanguage')}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Switch User Button - Only visible to organization owners */}
      {(isOrganizationOwner(user) || isOrganizationOwner(userData)) && (
        <Card className="shadow-elegant">
          <CardHeader>
            <CardTitle>{t('profile.organizationAccess')}</CardTitle>
            <CardDescription>{t('profile.switchToOrganizationPortal')}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={switchToOrganizationPortal}
              className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white"
            >
              <Building2 className="w-4 h-4 mr-2" />
              {t('profile.switchToOrganizationPortal')}
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ProfileInfo;
