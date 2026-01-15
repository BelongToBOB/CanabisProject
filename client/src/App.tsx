import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { ToastProvider } from './contexts/CustomToastContext';
import { ToastContainer } from './components/CustomToastContainer';
import ErrorBoundary from './components/ErrorBoundary';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import UserManagement from './pages/UserManagement';
import BatchManagement from './pages/BatchManagement';
import SalesOrderCreate from './pages/SalesOrderCreate';
import SalesOrderList from './pages/SalesOrderList';
import SalesOrderDetail from './pages/SalesOrderDetail';
import InventoryReport from './pages/InventoryReport';
import MonthlyProfitSummary from './pages/MonthlyProfitSummary';
import ProfitShareHistory from './pages/ProfitShareHistory';
import ComponentShowcase from './pages/ComponentShowcase';
import ProtectedRoute from './components/ProtectedRoute';
import AppLayout from './components/layout/AppLayout';

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <ToastProvider>
          <AuthProvider>
            <Router>
              <ToastContainer />
              <Routes>
                <Route path="/login" element={<Login />} />
                <Route
                  path="/"
                  element={
                    <ProtectedRoute>
                      <AppLayout>
                        <Dashboard />
                      </AppLayout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/users"
                  element={
                    <ProtectedRoute allowedRoles={['ADMIN']}>
                      <AppLayout>
                        <UserManagement />
                      </AppLayout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/batches"
                  element={
                    <ProtectedRoute allowedRoles={['ADMIN']}>
                      <AppLayout>
                        <BatchManagement />
                      </AppLayout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/sales-orders/create"
                  element={
                    <ProtectedRoute allowedRoles={['ADMIN', 'STAFF']}>
                      <AppLayout>
                        <SalesOrderCreate />
                      </AppLayout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/sales-orders"
                  element={
                    <ProtectedRoute allowedRoles={['ADMIN']}>
                      <AppLayout>
                        <SalesOrderList />
                      </AppLayout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/sales-orders/:id"
                  element={
                    <ProtectedRoute allowedRoles={['ADMIN']}>
                      <AppLayout>
                        <SalesOrderDetail />
                      </AppLayout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/reports/inventory"
                  element={
                    <ProtectedRoute allowedRoles={['ADMIN']}>
                      <AppLayout>
                        <InventoryReport />
                      </AppLayout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/reports/monthly-profit"
                  element={
                    <ProtectedRoute allowedRoles={['ADMIN']}>
                      <AppLayout>
                        <MonthlyProfitSummary />
                      </AppLayout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/profit-shares"
                  element={
                    <ProtectedRoute allowedRoles={['ADMIN']}>
                      <AppLayout>
                        <ProfitShareHistory />
                      </AppLayout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/component-showcase"
                  element={
                    <ProtectedRoute>
                      <AppLayout>
                        <ComponentShowcase />
                      </AppLayout>
                    </ProtectedRoute>
                  }
                />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </Router>
          </AuthProvider>
        </ToastProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
