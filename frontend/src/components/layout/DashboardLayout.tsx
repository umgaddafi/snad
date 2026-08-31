import { useState, useEffect, useRef } from 'react';
import { Outlet, Link, useLocation, Navigate, useNavigate } from 'react-router-dom';
import { LayoutDashboard, ShoppingBag, Users, UtensilsCrossed, Settings, LogOut, Bell, Menu, X, Tag, Star, TrendingUp, MapPin, Loader2, MessageSquare, Clock, User, ChevronDown, Search, CheckCheck } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '@/store/useAuthStore';
import api from '@/lib/axios';
import { playFemaleVoiceNotification } from '@/lib/sound';
import { resolveAvatarUrl } from '@/lib/media';
import BottomNav from './BottomNav';

interface UserNotification {
  id: number;
  title: string;
  message: string;
  type: string;
  is_read: boolean;
  created_at: string;
}

export default function DashboardLayout() {
  const location = useLocation();
  const user = useAuthStore(state => state.user);
  const isAuthenticated = useAuthStore(state => state.isAuthenticated);
  const checkAuth = useAuthStore(state => state.checkAuth);
  const logout = useAuthStore(state => state.logout);
  const navigate = useNavigate();

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [dashSearchQuery, setDashSearchQuery] = useState('');
  const dashSearchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isSearchOpen) {
      setTimeout(() => dashSearchInputRef.current?.focus(), 50);
    }
  }, [isSearchOpen]);

  const token = localStorage.getItem('auth_token');

  useEffect(() => {
    if (token && !user) {
      checkAuth();
    }
  }, [token, user, checkAuth]);

  // Fetch real-time notifications for the logged-in user
  const { data: notifications, refetch: refetchNotifications } = useQuery<UserNotification[]>({
    queryKey: ['userNotifications'],
    queryFn: async () => {
      if (!token) return [];
      const res = await api.get('/notifications');
      return res.data;
    },
    enabled: !!token && !!user,
    refetchInterval: 10000,
  });

  const unreadCount = notifications?.filter(n => !n.is_read).length || 0;
  const prevUnreadCountRef = useRef<number | null>(null);

  // Play voice notification immediately when new unread notification arrives
  useEffect(() => {
    if (notifications) {
      const currentUnread = notifications.filter(n => !n.is_read).length;
      if (prevUnreadCountRef.current !== null && currentUnread > prevUnreadCountRef.current) {
        const latestUnread = notifications.find(n => !n.is_read);
        const messageToSpeak = latestUnread ? latestUnread.title : 'You have a new notification.';
        playFemaleVoiceNotification(messageToSpeak);
      }
      prevUnreadCountRef.current = currentUnread;
    }
  }, [notifications]);

  const toggleNotifications = async () => {
    const nextState = !showNotifications;
    setShowNotifications(nextState);

    if (nextState && unreadCount > 0) {
      try {
        await api.post('/notifications/mark-as-read');
        refetchNotifications();
      } catch (e) {
        console.error(e);
      }
    }
  };

  // Auth Guard: Redirect unauthenticated guests to login
  if (!token || !isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Show sleek loading state while verifying user session
  if (!user) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center space-y-4">
        <Loader2 className="w-10 h-10 text-orange-500 animate-spin" />
        <p className="text-sm font-bold text-gray-600">Verifying session & loading profile...</p>
      </div>
    );
  }

  const userRole = user.role || 'customer';
  const isAdmin = userRole === 'admin' || location.pathname.startsWith('/admin');
  const isKitchen = userRole === 'kitchen' || location.pathname.startsWith('/kitchen');
  const isRider = userRole === 'rider' || location.pathname.startsWith('/rider');

  const navItems = isAdmin ? [
    { name: 'Overview', path: '/admin', icon: LayoutDashboard },
    { name: 'Orders', path: '/admin/orders', icon: ShoppingBag },
    { name: 'Menu & Inventory', path: '/admin/menu', icon: UtensilsCrossed },
    { name: 'Categories', path: '/admin/categories', icon: UtensilsCrossed },
    { name: 'Delivery Locations', path: '/admin/locations', icon: MapPin },
    { name: 'Coupons & Promos', path: '/admin/coupons', icon: Tag },
    { name: 'Customer Reviews', path: '/admin/reviews', icon: Star },
    { name: 'Customers', path: '/admin/customers', icon: Users },
    { name: 'Snad Staff', path: '/admin/staff', icon: Users },
    { name: 'Settings', path: '/admin/settings', icon: Settings },
  ] : isKitchen ? [
    { name: 'Live Queue', path: '/kitchen', icon: LayoutDashboard },
    { name: 'Inventory Alerts', path: '/kitchen/inventory', icon: UtensilsCrossed },
  ] : isRider ? [
    { name: 'Deliveries Queue', path: '/rider', icon: LayoutDashboard },
    { name: 'My Performance', path: '/rider/performance', icon: TrendingUp },
    { name: 'My Profile', path: '/dashboard/profile', icon: Users },
  ] : [
    { name: 'My Orders', path: '/dashboard', icon: ShoppingBag },
    { name: 'Explore Food Menu', path: '/menu', icon: UtensilsCrossed },
    { name: 'Track Active Order', path: '/track', icon: Clock },
    { name: 'Account Profile', path: '/dashboard/profile', icon: User },
  ];

  return (
    <div className="flex h-screen bg-slate-50 font-sans overflow-hidden">
      {/* Mobile overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`fixed top-0 bottom-16 md:bottom-0 left-0 w-64 bg-white border-r border-gray-100 flex flex-col z-50 shadow-xl transform transition-transform duration-300 md:relative md:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="h-16 flex items-center justify-between px-6 border-b border-gray-100 shrink-0">
          <Link to="/" className="text-xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-orange-500 to-red-600">
            Snad Kitchen
          </Link>
          <button className="md:hidden text-gray-500 hover:bg-gray-100 p-1 rounded-lg" onClick={() => setIsSidebarOpen(false)}>
            <X className="w-6 h-6" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {navItems.map(item => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path || (location.pathname === '/' && item.path === '/dashboard');
            return (
              <Link
                key={item.name}
                to={item.path}
                onClick={() => setIsSidebarOpen(false)}
                className={`flex items-center space-x-3 px-4 py-3 rounded-xl transition font-medium ${
                  isActive 
                    ? 'bg-orange-50 text-orange-600' 
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span>{item.name}</span>
              </Link>
            )
          })}

          <div className="pt-3 mt-3 border-t border-gray-100">
            <button 
              onClick={() => { logout(); navigate('/login'); }}
              className="flex items-center space-x-3 px-4 py-3 w-full rounded-xl text-red-500 hover:bg-red-50 transition font-medium"
            >
              <LogOut className="w-5 h-5" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden w-full">
        <header className="h-20 bg-white/70 backdrop-blur-md border-b border-gray-100 flex items-center justify-between px-4 sm:px-8 z-10 w-full relative">
          <div className="flex items-center space-x-4">
            <button 
              className="md:hidden p-2 text-gray-500 hover:bg-gray-100 rounded-xl"
              onClick={() => setIsSidebarOpen(true)}
            >
              <Menu className="w-6 h-6" />
            </button>
            <h2 className="text-lg sm:text-xl font-bold text-gray-800 capitalize truncate max-w-[150px] sm:max-w-none">
              {navItems.find(i => i.path === location.pathname)?.name || 'Dashboard'}
            </h2>
          </div>
          <div className="flex items-center space-x-2 sm:space-x-4">
            <div className="flex items-center">
              <div className={`flex items-center overflow-hidden transition-all duration-300 ease-in-out ${isSearchOpen ? 'w-44 sm:w-64 opacity-100 mr-2' : 'w-0 opacity-0 pointer-events-none'}`}>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (dashSearchQuery.trim()) {
                      navigate(`/menu?q=${encodeURIComponent(dashSearchQuery.trim())}`);
                      setIsSearchOpen(false);
                      setDashSearchQuery('');
                    }
                  }}
                  className="w-full relative"
                >
                  <input
                    ref={dashSearchInputRef}
                    type="text"
                    placeholder="Search menu..."
                    value={dashSearchQuery}
                    onChange={(e) => setDashSearchQuery(e.target.value)}
                    className="w-full py-1.5 pl-8 pr-3 text-xs bg-gray-100 border border-gray-200 rounded-full focus:outline-none focus:ring-2 focus:ring-orange-500 font-medium text-gray-800"
                  />
                  <Search className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                </form>
              </div>

              <button
                onClick={() => {
                  setIsSearchOpen(!isSearchOpen);
                  if (showNotifications) setShowNotifications(false);
                }}
                className={`p-2 rounded-full transition-all duration-300 cursor-pointer ${
                  isSearchOpen
                    ? 'bg-orange-500 text-white shadow-sm rotate-90 scale-105'
                    : 'text-gray-500 hover:bg-gray-100 hover:text-orange-500'
                }`}
                title="Search"
              >
                {isSearchOpen ? <X className="w-5 h-5" /> : <Search className="w-5 h-5" />}
              </button>
            </div>

            <div className="relative">
              <button 
                onClick={toggleNotifications}
                className="relative p-2 text-gray-500 hover:bg-gray-100 rounded-full transition focus:outline-none cursor-pointer"
              >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 px-1.5 py-0.5 text-[10px] font-black leading-none text-white bg-red-500 rounded-full border border-white">
                    {unreadCount}
                  </span>
                )}
              </button>
              
              {showNotifications && (
                <>
                  {/* Fixed Backdrop overlay */}
                  <div 
                    className="fixed inset-0 bg-black/40 backdrop-blur-xs z-[99]" 
                    onClick={() => setShowNotifications(false)}
                  ></div>

                  {/* Responsive Notification Container (Mobile Sheet / Desktop Popover) */}
                  <div className="fixed inset-x-4 top-20 max-w-md mx-auto sm:absolute sm:inset-auto sm:right-0 sm:top-full sm:mt-3 sm:w-96 bg-white rounded-3xl shadow-2xl border border-gray-100 z-[100] overflow-hidden flex flex-col max-h-[80vh] sm:max-h-[32rem] animate-in fade-in slide-in-from-top-2 duration-200">
                    
                    {/* Header */}
                    <div className="px-5 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/90 shrink-0">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center text-orange-600">
                          <Bell className="w-4 h-4" />
                        </div>
                        <div>
                          <h3 className="font-extrabold text-gray-900 text-sm leading-none flex items-center gap-2">
                            Notifications
                            {unreadCount > 0 && (
                              <span className="bg-orange-500 text-white text-[10px] px-2 py-0.5 rounded-full font-black">
                                {unreadCount} new
                              </span>
                            )}
                          </h3>
                          <p className="text-[11px] text-gray-500 mt-0.5">Stay updated with your orders</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-1">
                        {unreadCount > 0 && (
                          <button
                            onClick={async () => {
                              try {
                                await api.post('/notifications/mark-as-read');
                                refetchNotifications();
                              } catch (e) {}
                            }}
                            className="text-[11px] font-bold text-orange-600 hover:text-orange-700 hover:bg-orange-50 px-2 py-1 rounded-lg transition flex items-center gap-1 cursor-pointer"
                            title="Mark all as read"
                          >
                            <CheckCheck className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">Mark read</span>
                          </button>
                        )}
                        <button 
                          onClick={() => setShowNotifications(false)} 
                          className="text-gray-400 hover:text-gray-600 p-1.5 rounded-full hover:bg-gray-200/60 transition cursor-pointer"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Notification Items List */}
                    <div className="overflow-y-auto flex-1 divide-y divide-gray-50 bg-white">
                      {notifications && notifications.length > 0 ? (
                        notifications.map((item) => {
                          const isOrderRelated = item.title.toLowerCase().includes('order') || item.title.toLowerCase().includes('delivery') || item.title.toLowerCase().includes('meal');
                          
                          return (
                            <div
                              key={item.id}
                              className={`p-4 transition relative ${
                                item.is_read 
                                  ? 'bg-white hover:bg-gray-50/80' 
                                  : 'bg-orange-50/60 hover:bg-orange-50 border-l-4 border-l-orange-500 pl-3.5'
                              }`}
                            >
                              <div className="flex items-start gap-3">
                                <div className={`w-8 h-8 rounded-2xl flex items-center justify-center shrink-0 mt-0.5 ${
                                  isOrderRelated 
                                    ? 'bg-orange-100 text-orange-600' 
                                    : 'bg-blue-100 text-blue-600'
                                }`}>
                                  {isOrderRelated ? <ShoppingBag className="w-4 h-4" /> : <MessageSquare className="w-4 h-4" />}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center justify-between gap-2">
                                    <p className="text-xs font-bold text-gray-900 truncate flex items-center gap-1.5">
                                      {item.title}
                                      {!item.is_read && (
                                        <span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse shrink-0"></span>
                                      )}
                                    </p>
                                    <span className="text-[10px] font-semibold text-gray-400 shrink-0">
                                      {new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                  </div>
                                  <p className="text-xs text-gray-600 mt-1 leading-relaxed break-words">{item.message}</p>
                                </div>
                              </div>
                            </div>
                          );
                        })
                      ) : (
                        <div className="p-8 text-center flex flex-col items-center justify-center">
                          <div className="w-12 h-12 rounded-full bg-orange-50 text-orange-400 flex items-center justify-center mb-3 shadow-inner">
                            <Bell className="w-6 h-6" />
                          </div>
                          <p className="text-sm font-bold text-gray-800">You're all caught up!</p>
                          <p className="text-xs text-gray-400 mt-1 max-w-[200px]">No new notifications. Real-time updates will appear here.</p>
                        </div>
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>
            <div className="relative pl-2 sm:pl-4 border-l border-gray-200">
              <button
                onClick={() => setShowProfileMenu(!showProfileMenu)}
                className="flex items-center space-x-2 p-1 rounded-2xl hover:bg-gray-100/80 transition focus:outline-none cursor-pointer group"
              >
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-orange-400 to-red-500 rounded-full flex items-center justify-center text-white font-bold text-sm sm:text-base overflow-hidden shrink-0 border border-orange-200 shadow-sm">
                  {user.avatar ? (
                    <img src={resolveAvatarUrl(user.avatar)} alt={user.name} className="w-full h-full object-cover" />
                  ) : (
                    user.name.charAt(0).toUpperCase()
                  )}
                </div>
                <div className="hidden sm:block text-left">
                  <p className="text-sm font-bold text-gray-900 leading-tight">{user.name}</p>
                  <p className="text-[11px] text-gray-500 capitalize leading-tight">
                    {isRider ? 'Delivery Rider' : isKitchen ? 'Kitchen Staff' : isAdmin ? 'Administrator' : 'Customer'}
                  </p>
                </div>
                <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform duration-200 group-hover:text-orange-500 ${showProfileMenu ? 'rotate-180 text-orange-500' : ''}`} />
              </button>

              {showProfileMenu && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowProfileMenu(false)}></div>
                  <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-2xl shadow-xl border border-gray-100 z-50 overflow-hidden py-1.5 animate-in fade-in slide-in-from-top-2 duration-150">
                    <div className="px-4 py-2.5 border-b border-gray-100 bg-gray-50/70">
                      <p className="text-xs font-bold text-gray-900 truncate">{user.name}</p>
                      <p className="text-[11px] text-gray-500 truncate">{user.email}</p>
                    </div>

                    <div className="py-1">
                      <button
                        onClick={() => {
                          setShowProfileMenu(false);
                          navigate('/dashboard/profile');
                        }}
                        className="flex items-center space-x-3 px-4 py-2.5 w-full text-left text-sm font-semibold text-gray-700 hover:bg-orange-50 hover:text-orange-600 transition cursor-pointer"
                      >
                        <User className="w-4 h-4 text-orange-500" />
                        <span>Account Profile</span>
                      </button>

                      <button
                        onClick={() => {
                          setShowProfileMenu(false);
                          logout();
                          navigate('/login');
                        }}
                        className="flex items-center space-x-3 px-4 py-2.5 w-full text-left text-sm font-semibold text-red-500 hover:bg-red-50 transition cursor-pointer"
                      >
                        <LogOut className="w-4 h-4" />
                        <span>Logout</span>
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto p-4 sm:p-8 w-full pb-20 md:pb-8">
          <Outlet />
        </main>
        <BottomNav />
      </div>
    </div>
  );
}
