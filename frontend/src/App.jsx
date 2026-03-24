import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Header from './components/Header';
import Footer from './components/Footer';
import ChatWidget from './components/ChatWidget';
import CookieBanner from './components/CookieBanner';
import ErrorBoundary from './components/ErrorBoundary';

/* Pages chargées immédiatement (above the fold) */
import Home from './pages/Home';
import Menus from './pages/Menus';
import Login from './pages/Login';

/* Pages chargées en lazy loading (code-splitting) */
const MenuDetail = lazy(() => import('./pages/MenuDetail'));
const Contact = lazy(() => import('./pages/Contact'));
const Register = lazy(() => import('./pages/Register'));
const ForgotPassword = lazy(() => import('./pages/ForgotPassword'));
const ResetPassword = lazy(() => import('./pages/ResetPassword'));
const LegalPage = lazy(() => import('./pages/LegalPage'));
const OrderPage = lazy(() => import('./pages/OrderPage'));
const RequestQuote = lazy(() => import('./pages/RequestQuote'));
const Prestations = lazy(() => import('./pages/Prestations'));
const Boissons = lazy(() => import('./pages/Boissons'));
const UserDashboard = lazy(() => import('./pages/dashboard/UserDashboard'));
const EmployeeDashboard = lazy(() => import('./pages/dashboard/EmployeeDashboard'));
const AdminDashboard = lazy(() => import('./pages/dashboard/AdminDashboard'));
const OrderDetail = lazy(() => import('./pages/dashboard/OrderDetail'));
const NotFound = lazy(() => import('./pages/NotFound'));

function ProtectedRoute({ children, roles }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="loading">Chargement...</div>;
  if (!user) return <Navigate to="/login" />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/" />;
  return children;
}

export default function App() {
  return (
    <ErrorBoundary>
      <a href="#main-content" className="skip-link">Aller au contenu principal</a>
      <Header />
      <main id="main-content">
        <Suspense fallback={<div className="loading">Chargement...</div>}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/menus" element={<Menus />} />
          <Route path="/menus/:id" element={<MenuDetail />} />
          <Route path="/prestations" element={<Prestations />} />
          <Route path="/boissons" element={<Boissons />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/legal/:type" element={<LegalPage />} />
          <Route path="/order/:menuId" element={
            <ProtectedRoute><OrderPage /></ProtectedRoute>
          } />
          <Route path="/request-quote" element={
            <ProtectedRoute><RequestQuote /></ProtectedRoute>
          } />
          <Route path="/dashboard/*" element={
            <ProtectedRoute><DashboardRouter /></ProtectedRoute>
          } />
          <Route path="*" element={<NotFound />} />
        </Routes>
        </Suspense>
      </main>
      <Footer />
      <ChatWidget />
      <CookieBanner />
    </ErrorBoundary>
  );
}

function DashboardRouter() {
  const { user } = useAuth();
  if (user.role === 'admin') return <AdminDashboard />;
  if (user.role === 'employee') return <EmployeeDashboard />;
  return <UserDashboard />;
}
