import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShoppingCart, Menu, User, Search, X, ArrowRight, Utensils, Megaphone } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { useCartStore } from '@/store/useCartStore';
import { useAuthStore } from '@/store/useAuthStore';
import api from '@/lib/axios';
import { resolveMealImageUrl } from '@/lib/media';

interface FoodItem {
  id: number;
  name: string;
  price: number;
  description: string;
  category: { id: number; name: string };
  image_url: string | null;
}

export default function Navbar() {
  const totalItems = useCartStore(state => state.totalItems());
  const isAuthenticated = useAuthStore(state => state.isAuthenticated);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isSearchOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isSearchOpen]);

  const { data: settings } = useQuery({
    queryKey: ['settings'],
    queryFn: async () => {
      const res = await api.get('/settings');
      return res.data;
    },
    refetchInterval: 30000,
  });

  const { data: foods } = useQuery({
    queryKey: ['foods'],
    queryFn: async () => {
      const res = await api.get('/foods');
      return res.data.data as FoodItem[];
    },
    enabled: isSearchOpen,
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      const q = searchQuery.trim();
      setIsSearchOpen(false);
      setIsMobileMenuOpen(false);
      setSearchQuery('');
      navigate(`/menu?q=${encodeURIComponent(q)}`);
    }
  };

  const matchingFoods = searchQuery.trim() && foods ? foods.filter(food =>
    food.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    food.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    food.category.name.toLowerCase().includes(searchQuery.toLowerCase())
  ).slice(0, 5) : [];

  return (
    <>
      {settings?.announcement_text && (
        <div className="bg-gradient-to-r from-orange-600 via-amber-500 to-red-600 text-white text-xs font-extrabold py-2 shadow-md flex items-center relative z-50 overflow-hidden">
          <div className="bg-orange-800/90 px-3 py-1 z-10 flex items-center gap-1.5 shrink-0 shadow-lg font-black uppercase tracking-wider text-[10px]">
            <Megaphone className="w-3.5 h-3.5 animate-pulse text-yellow-300" />
            <span>Campus Notice</span>
          </div>
          <div className="flex-1 overflow-hidden relative flex items-center">
            <div className="animate-marquee-rtl font-black text-sm tracking-wide text-white drop-shadow-sm">
              📢 {settings.announcement_text} &nbsp;&nbsp;&bull;&nbsp;&nbsp; 🍔 Snad Kitchen JOSTUM Campus &nbsp;&nbsp;&bull;&nbsp;&nbsp; ⚡ Quick Delivery &nbsp;&nbsp;&bull;&nbsp;&nbsp; 📢 {settings.announcement_text}
            </div>
          </div>
        </div>
      )}
      <nav className="sticky top-0 z-50 w-full backdrop-blur-md bg-white/70 border-b border-gray-100 shadow-sm transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          
          <div className="flex-shrink-0 flex items-center">
            <Link to="/" className="flex items-center space-x-2 relative -left-2">
              <img src="/logo.png" alt="Snad Kitchen" className="h-12 md:h-16 w-auto scale-110 origin-left object-contain" />
            </Link>
          </div>

          <div className="hidden md:flex space-x-8 items-center">
            <Link to="/" className="text-gray-800 font-medium hover:text-orange-500 transition">Home</Link>
            <Link to="/menu" className="text-gray-800 font-medium hover:text-orange-500 transition">Menu</Link>
            <Link to="/about" className="text-gray-800 font-medium hover:text-orange-500 transition">About</Link>
          </div>

          <div className="flex items-center space-x-6">
            <button 
              onClick={() => setIsSearchOpen(!isSearchOpen)}
              className={`p-2 rounded-full transition-all duration-300 transform active:scale-95 cursor-pointer ${
                isSearchOpen 
                  ? 'bg-orange-500 text-white shadow-md rotate-90 scale-105' 
                  : 'text-gray-700 hover:text-orange-500 hover:bg-orange-50'
              }`}
              aria-label="Search meals"
              title="Search Meals"
            >
              {isSearchOpen ? <X className="w-5 h-5" /> : <Search className="w-5 h-5" />}
            </button>
            <Link to="/checkout" className="relative text-gray-700 hover:text-orange-500 transition">
              <ShoppingCart className="w-5 h-5" />
              {totalItems > 0 && (
                <span className="absolute -top-2 -right-2 bg-orange-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                  {totalItems}
                </span>
              )}
            </Link>
            {isAuthenticated ? (
              <Link 
                to="/dashboard" 
                className="flex items-center space-x-1.5 bg-orange-500 hover:bg-orange-600 text-white px-3 py-1.5 sm:px-4 sm:py-2 rounded-full transition shadow-sm"
                title="Go to Dashboard"
              >
                <User className="w-4 h-4" />
                <span className="font-extrabold text-xs sm:text-sm">Dashboard</span>
              </Link>
            ) : (
              <Link 
                to="/login" 
                className="flex items-center space-x-1.5 bg-gray-900 hover:bg-gray-800 text-white px-3 py-1.5 sm:px-4 sm:py-2 rounded-full transition shadow-sm"
              >
                <User className="w-4 h-4" />
                <span className="font-bold text-xs sm:text-sm">Login</span>
              </Link>
            )}
            <button 
              className="md:hidden text-gray-700"
              onClick={() => {
                setIsMobileMenuOpen(!isMobileMenuOpen);
                setIsSearchOpen(false);
              }}
            >
              {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Live Animated Search Field & Dropdown */}
      <div 
        className={`bg-white/95 backdrop-blur-md border-b border-gray-100 shadow-2xl absolute w-full left-0 z-50 transition-all duration-300 ease-in-out transform origin-top ${
          isSearchOpen 
            ? 'opacity-100 translate-y-0 max-h-[800px] p-4 pointer-events-auto' 
            : 'opacity-0 -translate-y-4 max-h-0 p-0 overflow-hidden pointer-events-none border-b-0 shadow-none'
        }`}
      >
        <div className="max-w-3xl mx-auto">
          <form onSubmit={handleSearch} className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-orange-500 w-5 h-5" />
            <input 
              ref={inputRef}
              type="text" 
              placeholder="Search for meals, drinks, swallow..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-10 py-3.5 bg-gray-50/80 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:bg-white font-medium text-gray-800 text-sm sm:text-base transition-all duration-200 shadow-inner"
            />
            {searchQuery ? (
              <button 
                type="button" 
                onClick={() => setSearchQuery('')}
                className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition"
              >
                <X className="w-5 h-5" />
              </button>
            ) : (
              <button 
                type="button" 
                onClick={() => setIsSearchOpen(false)}
                className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </form>

            {/* Instant Live Matches Card */}
            {searchQuery.trim().length > 0 && (
              <div className="mt-3 bg-white rounded-2xl border border-gray-100 shadow-lg overflow-hidden divide-y divide-gray-50">
                {matchingFoods.length > 0 ? (
                  <>
                    <div className="px-4 py-2 bg-orange-50/50 text-[11px] font-bold uppercase tracking-wider text-orange-600">
                      Live Matching Meals ({matchingFoods.length})
                    </div>
                    {matchingFoods.map((food) => (
                      <div
                        key={food.id}
                        onClick={() => {
                          setIsSearchOpen(false);
                          setSearchQuery('');
                          navigate(`/menu?q=${encodeURIComponent(food.name)}`);
                        }}
                        className="px-4 py-3 flex items-center justify-between hover:bg-gray-50 cursor-pointer transition group"
                      >
                        <div className="flex items-center space-x-3">
                          {food.image_url ? (
                            <img src={resolveMealImageUrl(food.image_url)} alt={food.name} className="w-10 h-10 rounded-xl object-cover" />
                          ) : (
                            <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center text-orange-500">
                              <Utensils className="w-5 h-5" />
                            </div>
                          )}
                          <div>
                            <p className="font-bold text-sm text-gray-900 group-hover:text-orange-600 transition">{food.name}</p>
                            <span className="text-[10px] font-bold text-gray-400 uppercase">{food.category.name}</span>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="font-extrabold text-sm text-gray-900">₦{food.price.toLocaleString()}</span>
                          <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-orange-500 group-hover:translate-x-1 transition transform" />
                        </div>
                      </div>
                    ))}
                    <button
                      onClick={handleSearch}
                      className="w-full text-center py-3 bg-gray-900 hover:bg-gray-800 text-white text-xs font-bold transition flex items-center justify-center space-x-2"
                    >
                      <span>View all results for "{searchQuery}"</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </>
                ) : (
                  <div className="p-6 text-center text-gray-500">
                    <p className="text-sm font-medium">No meals found matching "{searchQuery}"</p>
                    <p className="text-xs text-gray-400 mt-1">Try typing another dish or category</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-white border-b border-gray-100 px-4 py-4 space-y-4 absolute w-full left-0 shadow-lg z-50">
          <Link to="/" onClick={() => setIsMobileMenuOpen(false)} className="block text-gray-800 font-medium hover:text-orange-500 transition p-2 bg-gray-50 rounded-lg">Home</Link>
          <Link to="/menu" onClick={() => setIsMobileMenuOpen(false)} className="block text-gray-800 font-medium hover:text-orange-500 transition p-2 bg-gray-50 rounded-lg">Menu</Link>
          <Link to="/about" onClick={() => setIsMobileMenuOpen(false)} className="block text-gray-800 font-medium hover:text-orange-500 transition p-2 bg-gray-50 rounded-lg">About</Link>
          <div className="pt-4 border-t border-gray-100">
            {isAuthenticated ? (
              <Link to="/dashboard" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center justify-center space-x-2 bg-gray-900 text-white px-4 py-3 rounded-xl hover:bg-gray-800 transition">
                <User className="w-4 h-4" />
                <span className="font-bold">Dashboard</span>
              </Link>
            ) : (
              <Link to="/login" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center justify-center space-x-2 bg-gray-900 text-white px-4 py-3 rounded-xl hover:bg-gray-800 transition">
                <User className="w-4 h-4" />
                <span className="font-bold">Login / Register</span>
              </Link>
            )}
          </div>
        </div>
      )}
    </nav>
    </>
  );
}
