import { Link, useLocation } from 'react-router-dom';
import { Home, Utensils, ShoppingCart, Bike, User } from 'lucide-react';
import { useCartStore } from '@/store/useCartStore';
import { useAuthStore } from '@/store/useAuthStore';

export default function BottomNav() {
  const location = useLocation();
  const totalItems = useCartStore((state) => state.totalItems());
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const user = useAuthStore((state) => state.user);

  const getDashboardPath = () => {
    if (!isAuthenticated) return '/login';
    if (user?.role === 'rider') return '/rider';
    if (user?.role === 'kitchen') return '/kitchen';
    if (user?.role === 'admin') return '/admin';
    return '/dashboard';
  };

  const dashboardPath = getDashboardPath();

  const navItems = [
    { label: 'Home', path: '/', icon: Home },
    { label: 'Menu', path: '/menu', icon: Utensils },
    { label: 'Cart', path: '/checkout', icon: ShoppingCart, badge: totalItems },
    { label: 'Track', path: '/track', icon: Bike },
    { label: isAuthenticated ? 'Dashboard' : 'Login', path: dashboardPath, icon: User },
  ];

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-gray-200 py-1.5 px-3 shadow-[0_-4px_20px_rgba(0,0,0,0.08)]">
      <div className="flex justify-around items-center max-w-md mx-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive =
            location.pathname === item.path ||
            (item.path === '/dashboard' && location.pathname.startsWith('/dashboard'));

          return (
            <Link
              key={item.label}
              to={item.path}
              className={`flex flex-col items-center justify-center py-1 px-3 rounded-2xl transition-all relative ${
                isActive
                  ? 'text-orange-500 font-black scale-105'
                  : 'text-gray-500 hover:text-gray-900 font-bold'
              }`}
            >
              <div className="relative">
                <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.5]' : 'stroke-[1.8]'}`} />
                {item.badge !== undefined && item.badge > 0 && (
                  <span className="absolute -top-1.5 -right-2.5 bg-orange-500 text-white text-[10px] font-black rounded-full h-4 w-4 flex items-center justify-center border border-white">
                    {item.badge}
                  </span>
                )}
              </div>
              <span className="text-[10px] mt-0.5 tracking-tight">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
