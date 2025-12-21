import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ToastProvider } from './contexts/ToastContext';
import ErrorBoundary from './components/ErrorBoundary';
import ToastContainer from './components/ToastContainer';
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
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';

function App() {
  return (
    <ErrorBoundary>
      <Router>
        <ToastProvider>
          <AuthProvider>
            <ToastContainer />
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route
                path="/"
                element={
                  <ProtectedRoute>
                    <Layout>
                      <Dashboard />
                    </Layout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/users"
                element={
                  <ProtectedRoute allowedRoles={['ADMIN']}>
                    <Layout>
                      <UserManagement />
                    </Layout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/batches"
                element={
                  <ProtectedRoute allowedRoles={['ADMIN']}>
                    <Layout>
                      <BatchManagement />
                    </Layout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/sales-orders/create"
                element={
                  <ProtectedRoute allowedRoles={['ADMIN', 'STAFF']}>
                    <Layout>
                      <SalesOrderCreate />
                    </Layout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/sales-orders"
                element={
                  <ProtectedRoute allowedRoles={['ADMIN']}>
                    <Layout>
                      <SalesOrderList />
                    </Layout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/sales-orders/:id"
                element={
                  <ProtectedRoute allowedRoles={['ADMIN']}>
                    <Layout>
                      <SalesOrderDetail />
                    </Layout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/reports/inventory"
                element={
                  <ProtectedRoute allowedRoles={['ADMIN']}>
                    <Layout>
                      <InventoryReport />
                    </Layout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/reports/monthly-profit"
                element={
                  <ProtectedRoute allowedRoles={['ADMIN']}>
                    <Layout>
                      <MonthlyProfitSummary />
                    </Layout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/profit-shares"
                element={
                  <ProtectedRoute allowedRoles={['ADMIN']}>
                    <Layout>
                      <ProfitShareHistory />
                    </Layout>
                  </ProtectedRoute>
                }
              />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </AuthProvider>
        </ToastProvider>
      </Router>
    </ErrorBoundary>
  );
}

export default App;
