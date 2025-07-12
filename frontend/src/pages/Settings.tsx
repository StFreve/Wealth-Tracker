import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useAuth } from '@/contexts/AuthContext'
import { useTheme } from '@/contexts/ThemeContext'
import { User, Globe, Palette, Shield, Bell, Download } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'

export default function Settings() {
  const { t, i18n } = useTranslation()
  const { user, updateUser } = useAuth()
  const { theme, setTheme } = useTheme()
  
  // Form state for profile settings
  const [profileForm, setProfileForm] = useState({
    name: user?.name || '',
    email: user?.email || ''
  })
  
  // Form state for password change
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })



  // Update form when user data changes
  useEffect(() => {
    if (user) {
      setProfileForm({
        name: user.name || '',
        email: user.email || ''
      })

    }
  }, [user])

  const handleLanguageChange = (language: string) => {
    i18n.changeLanguage(language)
    if (user) {
      updateUser({
        ...user,
        preferences: {
          ...user.preferences,
          language
        }
      })
    }
  }

  const handleProfileChange = (field: keyof typeof profileForm, value: string) => {
    setProfileForm(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handlePasswordChange = (field: keyof typeof passwordForm, value: string) => {
    setPasswordForm(prev => ({
      ...prev,
      [field]: value
    }))
  }



  const handleProfileSave = () => {
    // In a real app, this would make an API call
    if (user) {
      updateUser({
        ...user,
        name: profileForm.name
      })
    }
  }



  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">
          {t('settings.title')}
        </h1>
        <p className="text-muted-foreground mt-1">
          Manage your account and preferences
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Settings */}
        <Card className="lg:col-span-2 p-6">
          <div className="flex items-center space-x-2 mb-6">
            <User className="h-5 w-5" />
            <h2 className="text-xl font-semibold">{t('settings.profile')}</h2>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                {t('common.name')}
              </label>
              <Input
                value={profileForm.name}
                onChange={(e) => handleProfileChange('name', e.target.value)}
                placeholder="Enter your name"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                {t('common.email')}
              </label>
              <Input
                value={profileForm.email}
                placeholder="Enter your email"
                readOnly
              />
            </div>
            
            <Button className="w-full" onClick={handleProfileSave}>
              {t('settings.profileUpdated')}
            </Button>
          </div>
        </Card>

        {/* Quick Settings */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-6">{t('settings.preferences')}</h2>
          
          <div className="space-y-6">
            {/* Language */}
            <div>
              <div className="flex items-center space-x-2 mb-3">
                <Globe className="h-4 w-4" />
                <span className="text-sm font-medium">{t('settings.language')}</span>
              </div>
              <div className="space-y-2">
                <Button
                  variant={i18n.language === 'en' ? 'default' : 'outline'}
                  size="sm"
                  className="w-full justify-start"
                  onClick={() => handleLanguageChange('en')}
                >
                  English
                </Button>
                <Button
                  variant={i18n.language === 'ru' ? 'default' : 'outline'}
                  size="sm"
                  className="w-full justify-start"
                  onClick={() => handleLanguageChange('ru')}
                >
                  Русский
                </Button>
              </div>
            </div>

            {/* Theme */}
            <div>
              <div className="flex items-center space-x-2 mb-3">
                <Palette className="h-4 w-4" />
                <span className="text-sm font-medium">{t('settings.theme')}</span>
              </div>
              <div className="space-y-2">
                <Button
                  variant={theme === 'light' ? 'default' : 'outline'}
                  size="sm"
                  className="w-full justify-start"
                  onClick={() => setTheme('light')}
                >
                  {t('settings.lightTheme')}
                </Button>
                <Button
                  variant={theme === 'dark' ? 'default' : 'outline'}
                  size="sm"
                  className="w-full justify-start"
                  onClick={() => setTheme('dark')}
                >
                  {t('settings.darkTheme')}
                </Button>
                <Button
                  variant={theme === 'system' ? 'default' : 'outline'}
                  size="sm"
                  className="w-full justify-start"
                  onClick={() => setTheme('system')}
                >
                  {t('settings.systemTheme')}
                </Button>
              </div>
            </div>
          </div>
        </Card>
      </div>



      {/* Security Settings */}
      <Card className="p-6">
        <div className="flex items-center space-x-2 mb-6">
          <Shield className="h-5 w-5" />
          <h2 className="text-xl font-semibold">{t('settings.security')}</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="font-medium mb-3">{t('settings.changePassword')}</h3>
            <div className="space-y-3">
              <Input
                type="password"
                value={passwordForm.currentPassword}
                onChange={(e) => handlePasswordChange('currentPassword', e.target.value)}
                placeholder={t('settings.currentPassword')}
              />
              <Input
                type="password"
                value={passwordForm.newPassword}
                onChange={(e) => handlePasswordChange('newPassword', e.target.value)}
                placeholder={t('settings.newPassword')}
              />
              <Input
                type="password"
                value={passwordForm.confirmPassword}
                onChange={(e) => handlePasswordChange('confirmPassword', e.target.value)}
                placeholder={t('settings.confirmNewPassword')}
              />
              <Button variant="outline">
                {t('settings.changePassword')}
              </Button>
            </div>
          </div>
          
          <div>
            <h3 className="font-medium mb-3">{t('settings.twoFactorAuth')}</h3>
            <p className="text-sm text-muted-foreground mb-3">
              Add an extra layer of security to your account
            </p>
            <Button variant="outline">
              {t('settings.enable')}
            </Button>
          </div>
        </div>
      </Card>

      {/* Notifications */}
      <Card className="p-6">
        <div className="flex items-center space-x-2 mb-6">
          <Bell className="h-5 w-5" />
          <h2 className="text-xl font-semibold">{t('settings.notifications')}</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm">{t('settings.emailNotifications')}</span>
              <Button variant="outline" size="sm">
                {t('settings.enable')}
              </Button>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">{t('settings.portfolioUpdates')}</span>
              <Button variant="outline" size="sm">
                {t('settings.enable')}
              </Button>
            </div>
          </div>
          
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm">{t('settings.priceAlerts')}</span>
              <Button variant="outline" size="sm">
                {t('settings.enable')}
              </Button>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">{t('settings.weeklyReports')}</span>
              <Button variant="outline" size="sm">
                {t('settings.enable')}
              </Button>
            </div>
          </div>
        </div>
      </Card>

      {/* Data Management */}
      <Card className="p-6">
        <div className="flex items-center space-x-2 mb-6">
          <Download className="h-5 w-5" />
          <h2 className="text-xl font-semibold">{t('settings.data')}</h2>
        </div>
        
        <div className="flex space-x-4">
          <Button variant="outline">
            {t('settings.exportData')}
          </Button>
          <Button variant="outline">
            {t('settings.importData')}
          </Button>
          <Button variant="destructive">
            {t('settings.deleteAccount')}
          </Button>
        </div>
      </Card>
    </div>
  )
} 