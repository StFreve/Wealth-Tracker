import { Bell, Sun, Moon, User, Settings, LogOut } from 'lucide-react'
import { useTheme } from '@/contexts/ThemeContext'
import { useAuth } from '@/contexts/AuthContext'
import { useCurrency } from '@/contexts/CurrencyContext'
import { useTranslation } from 'react-i18next'
import { Button } from './ui/Button'
import { CurrencySelector } from './CurrencySelector'
import { 
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from './ui/DropdownMenu'

export function Header() {
  const { theme, setTheme, effectiveTheme } = useTheme()
  const { user, logout } = useAuth()
  const { displayCurrency, setDisplayCurrency, isConverting } = useCurrency()
  const { t } = useTranslation()

  const toggleTheme = () => {
    setTheme(effectiveTheme === 'dark' ? 'light' : 'dark')
  }

  return (
    <header className="bg-card border-b border-border px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <h1 className="text-xl font-semibold text-foreground">
            {t('common.loading')}
          </h1>
        </div>

        <div className="flex items-center space-x-4">
          {/* Currency Selector */}
          <CurrencySelector
            displayCurrency={displayCurrency}
            onCurrencyChange={setDisplayCurrency}
            isConverting={isConverting}
          />

          {/* Theme Toggle */}
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleTheme}
            className="h-9 w-9 p-0"
          >
            {effectiveTheme === 'dark' ? (
              <Sun className="h-4 w-4" />
            ) : (
              <Moon className="h-4 w-4" />
            )}
          </Button>

          {/* Notifications */}
          <Button variant="ghost" size="sm" className="h-9 w-9 p-0">
            <Bell className="h-4 w-4" />
          </Button>

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="flex items-center space-x-2">
                <User className="h-4 w-4" />
                <span className="hidden sm:inline">{user?.name}</span>
              </Button>
            </DropdownMenuTrigger>
            
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>{t('navigation.profile')}</DropdownMenuLabel>
              <DropdownMenuSeparator />
              
              <DropdownMenuItem>
                <Settings className="mr-2 h-4 w-4" />
                <span>{t('navigation.settings')}</span>
              </DropdownMenuItem>
              
              <DropdownMenuSeparator />
              
              <DropdownMenuItem onClick={logout}>
                <LogOut className="mr-2 h-4 w-4" />
                <span>{t('common.logout')}</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
} 