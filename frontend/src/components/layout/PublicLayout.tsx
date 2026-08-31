import { Outlet, useLocation } from 'react-router-dom';
import Navbar from './Navbar';
import Footer from './Footer';
import BottomNav from './BottomNav';

export default function PublicLayout() {
  const location = useLocation();

  const hideFooterPaths = [
    '/login',
    '/register',
    '/forgot-password',
    '/reset-password',
    '/verify-email',
    '/cart',
    '/checkout',
    '/admin/login',
  ];

  const shouldHideFooter = hideFooterPaths.some(
    (path) => location.pathname === path || location.pathname.startsWith(path)
  );

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 font-sans pb-16 md:pb-0">
      <Navbar />
      <main className="flex-grow">
        <Outlet />
      </main>
      {!shouldHideFooter && <Footer />}
      <BottomNav />

      {/* WhatsApp Floating Button */}
      <a
        href="https://wa.me/2349042340091?text=Hello%20Snad%20Kitchen%2C%20I%20need%20help"
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Chat with us on WhatsApp"
        className="fixed bottom-20 md:bottom-6 left-4 md:left-6 z-50 w-12 h-12 md:w-14 md:h-14 bg-[#25D366] rounded-full flex items-center justify-center shadow-lg hover:scale-110 hover:shadow-xl transition-all duration-200 group"
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" className="w-7 h-7 fill-white">
          <path d="M16.004 0h-.008C7.174 0 0 7.176 0 16c0 3.5 1.128 6.744 3.046 9.378L1.054 31.29l6.118-1.958A15.907 15.907 0 0016.004 32C24.826 32 32 24.822 32 16S24.826 0 16.004 0zm9.314 22.598c-.39 1.1-1.932 2.014-3.174 2.28-.852.18-1.964.324-5.71-1.228-4.8-1.986-7.886-6.857-8.126-7.176-.23-.318-1.932-2.573-1.932-4.907s1.222-3.48 1.656-3.958c.434-.478.948-.598 1.264-.598.314 0 .63.002.906.016.29.016.68-.11 1.064.812.39.94 1.326 3.234 1.442 3.468s.194.508.038.812c-.154.318-.232.508-.462.786-.232.278-.488.62-.696.832-.232.234-.474.49-.204.96.27.468 1.202 1.98 2.58 3.21 1.774 1.582 3.268 2.072 3.732 2.306.464.232.734.194 1.004-.118.27-.318 1.16-1.35 1.468-1.816.308-.464.618-.39 1.042-.232.424.156 2.702 1.274 3.166 1.506.464.232.774.348.888.54.118.194.118 1.1-.272 2.21z"/>
        </svg>
        {/* Tooltip */}
        <span className="absolute left-16 bg-gray-900 text-white text-xs font-bold px-3 py-2 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
          Chat with us
        </span>
      </a>
    </div>
  );
}
