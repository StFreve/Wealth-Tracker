import { NavLink } from 'react-router-dom'
import { 
  LayoutDashboard, 
  Wallet, 
  BarChart3, 
  Settings, 
  TrendingUp,
  DollarSign
} from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/utils'
import { usePortfolioMetrics } from '../contexts/PortfolioMetricsContext';
import { useCurrency } from '../contexts/CurrencyContext';
import { LoadingSpinner } from './ui/LoadingSpinner';

const navigation = [
  {
    name: 'dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
  },
  {
    name: 'assets',
    href: '/assets',
    icon: Wallet,
  },
  {
    name: 'settings',
    href: '/settings',
    icon: Settings,
  },
]

export function Sidebar() {
  const { t } = useTranslation()
  const { portfolioMetrics, loading } = usePortfolioMetrics();
  const { displayCurrency } = useCurrency();
  const formatCurrencyWithSymbol = (amount: number, currency: string = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency
    }).format(amount);
  };

  return (
    <div className="w-64 bg-card border-r border-border">
      <div className="p-6">
        <div className="flex items-center space-x-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
            <TrendingUp className="h-5 w-5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-foreground">
              Wealth Tracker
            </h1>
          </div>
        </div>
      </div>

      <nav className="px-3 pb-6">
        <ul className="space-y-1">
          {navigation.map((item) => (
            <li key={item.name}>
              <NavLink
                to={item.href}
                className={({ isActive }) =>
                  cn(
                    'group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors',
                    isActive
                      ? 'bg-accent text-accent-foreground'
                      : 'text-muted-foreground hover:text-foreground hover:bg-accent/50'
                  )
                }
              >
                <item.icon className="mr-3 h-5 w-5 flex-shrink-0" />
                {t(`navigation.${item.name}`)}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      <div className="px-3">
        <div className="rounded-lg bg-gradient-to-br from-primary/10 to-primary/5 p-4">
          <div className="flex items-center">
            <DollarSign className="h-8 w-8 text-primary" />
            <div className="ml-3">
              <p className="text-sm font-medium text-foreground">
                {t('dashboard.totalNetWorth')}
              </p>
              <p className="text-xs text-muted-foreground">
                {loading ? (
                  <span className="inline-block align-middle"><LoadingSpinner size="sm" /></span>
                ) : portfolioMetrics ? (
                  formatCurrencyWithSymbol(portfolioMetrics.totalValue, displayCurrency)
                ) : (
                  '--'
                )}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 