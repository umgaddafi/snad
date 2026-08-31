import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import ScrollToTop from '@/components/layout/ScrollToTop';
import PublicLayout from '@/components/layout/PublicLayout';
import DashboardLayout from '@/components/layout/DashboardLayout';
import BackToTop from '@/components/layout/BackToTop';
import { Toaster } from 'react-hot-toast';
import { useAuthStore } from '@/store/useAuthStore';
import api from '@/lib/axios';

import Home from '@/pages/Home';
import Menu from '@/pages/Menu';
import Checkout from '@/pages/Checkout';
import Login from '@/pages/Login';
import Register from '@/pages/Register';
import VerifyEmail from '@/pages/VerifyEmail';
import About from '@/pages/About';
import Terms from '@/pages/Terms';
import Privacy from '@/pages/Privacy';
import Track from '@/pages/Track';
import ForgotPassword from '@/pages/ForgotPassword';
import AdminLogin from '@/pages/AdminLogin';
import Maintenance from '@/pages/Maintenance';
import NotFound from '@/pages/NotFound';

import AdminDashboard from '@/pages/AdminDashboard';
import AdminOrders from '@/pages/AdminOrders';
import AdminMenu from '@/pages/AdminMenu';
import AdminCustomers from '@/pages/AdminCustomers';
import AdminStaff from '@/pages/AdminStaff';
import AdminSettings from '@/pages/AdminSettings';
import AdminCategories from '@/pages/AdminCategories';
import AdminCoupons from '@/pages/AdminCoupons';
import AdminReviews from '@/pages/AdminReviews';
import AdminLocations from '@/pages/AdminLocations';

import KitchenDashboard from '@/pages/KitchenDashboard';
import KitchenInventory from '@/pages/KitchenInventory';

import RiderDashboard from '@/pages/RiderDashboard';

import CustomerDashboard from '@/pages/CustomerDashboard';
import CustomerProfile from '@/pages/CustomerProfile';

function AppContent() {
  const user = useAuthStore((state) => state.user);
  const location = useLocation();

  const { data: settings, refetch: refetchSettings } = useQuery({
    queryKey: ['publicSettings'],
    queryFn: async () => {
      const res = await api.get('/settings');
      return res.data;
    },
    refetchInterval: 20000,
  });

  const isMaintenanceMode = settings?.maintenance_mode === 'true';
  const isAdminUser = user?.role === 'admin';
  const isAdminOrLoginPath =
    location.pathname.startsWith('/admin') ||
    location.pathname === '/login' ||
    location.pathname === '/admin/login';

  // Enforce Maintenance Mode for all public & customer pages if enabled
  if (isMaintenanceMode && !isAdminUser && !isAdminOrLoginPath) {
    return <Maintenance message={settings?.maintenance_message} onRefresh={() => refetchSettings()} />;
  }

  return (
    <Routes>
      <Route element={<PublicLayout />}>
        <Route path="/" element={<Home />} />
        <Route path="/menu" element={<Menu />} />
        <Route path="/about" element={<About />} />
        <Route path="/terms" element={<Terms />} />
        <Route path="/privacy" element={<Privacy />} />
        <Route path="/checkout" element={<Checkout />} />
        <Route path="/cart" element={<Checkout />} />
        <Route path="/track" element={<Track />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/verify-email" element={<VerifyEmail />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="*" element={<NotFound />} />
      </Route>

      <Route path="/admin/login" element={<AdminLogin />} />

      {/* Dashboards */}
      <Route element={<DashboardLayout />}>
        <Route path="/dashboard" element={<CustomerDashboard />} />
        <Route path="/dashboard/profile" element={<CustomerProfile />} />

        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/admin/orders" element={<AdminOrders />} />
        <Route path="/admin/menu" element={<AdminMenu />} />
        <Route path="/admin/customers" element={<AdminCustomers />} />
        <Route path="/admin/staff" element={<AdminStaff />} />
        <Route path="/admin/settings" element={<AdminSettings />} />
        <Route path="/admin/categories" element={<AdminCategories />} />
        <Route path="/admin/locations" element={<AdminLocations />} />
        <Route path="/admin/coupons" element={<AdminCoupons />} />
        <Route path="/admin/reviews" element={<AdminReviews />} />

        <Route path="/kitchen" element={<KitchenDashboard />} />
        <Route path="/kitchen/inventory" element={<KitchenInventory />} />

        <Route path="/rider" element={<RiderDashboard />} />
        <Route path="/rider/performance" element={<RiderDashboard defaultTab="performance" />} />
      </Route>
    </Routes>
  );
}

export default function App() {
  return (
    <Router>
      <ScrollToTop />
      <AppContent />
      <BackToTop />
      <Toaster position="top-right" />
    </Router>
  );
}
