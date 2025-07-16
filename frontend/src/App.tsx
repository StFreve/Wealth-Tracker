import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from 'react-query'
import { Suspense } from 'react'
import { ThemeProvider } from '@/contexts/ThemeContext'
import { AuthProvider } from '@/contexts/AuthContext'
import { CurrencyProvider } from '@/contexts/CurrencyContext'
import { Layout } from '@/components/Layout'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { PortfolioMetricsProvider } from './contexts/PortfolioMetricsContext';

// Page imports
import Dashboard from '@/pages/Dashboard'
import Login from '@/pages/Login'
import Register from '@/pages/Register'
import Assets from '@/pages/Assets'
import Settings from '@/pages/Settings'
import Widget from '@/pages/Widget'

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
})

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <Router>
          <AuthProvider>
            <CurrencyProvider>
              <PortfolioMetricsProvider>
                <div className="min-h-screen bg-background">
                  <Suspense fallback={<LoadingSpinner />}>
                    <Routes>
                      {/* Public routes */}
                      <Route path="/login" element={<Login />} />
                      <Route path="/register" element={<Register />} />
                      <Route path="/widget/:widgetId" element={<Widget />} />
                      
                      {/* Protected routes */}
                      <Route path="/" element={<Layout />}>
                        <Route index element={<Dashboard />} />
                        <Route path="/dashboard" element={<Dashboard />} />
                        <Route path="/assets" element={<Assets />} />
                        <Route path="/settings" element={<Settings />} />
                      </Route>
                    </Routes>
                  </Suspense>
                </div>
              </PortfolioMetricsProvider>
            </CurrencyProvider>
          </AuthProvider>
        </Router>
      </ThemeProvider>
    </QueryClientProvider>
  )
}

export default App 