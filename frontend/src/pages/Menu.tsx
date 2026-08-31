import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Search, ShoppingBag, Plus, Heart, SlidersHorizontal, Star, Sparkles } from 'lucide-react';
import FoodCustomizerModal from '@/components/FoodCustomizerModal';
import api from '@/lib/axios';
import { resolveMealImageUrl } from '@/lib/media';

interface Food {
  id: number;
  name: string;
  price: number;
  description: string;
  category: { id: number; name: string };
  image_url: string | null;
}

interface Category {
  id: number;
  name: string;
}

const fetchFoods = async () => {
  const response = await api.get('/foods');
  return response.data.data;
};

export default function Menu() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchTerm, setSearchTerm] = useState(searchParams.get('q') || '');
  const [activeCategory, setActiveCategory] = useState<string>('All');
  const [selectedFoodForCustomization, setSelectedFoodForCustomization] = useState<Food | null>(null);
  const [favorites, setFavorites] = useState<number[]>(() => {
    try {
      const saved = localStorage.getItem('snad_favorites');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [onlyFavorites, setOnlyFavorites] = useState<boolean>(false);
  const [sortBy, setSortBy] = useState<'default' | 'price-low' | 'price-high' | 'name'>('default');

  useEffect(() => {
    const q = searchParams.get('q');
    if (q !== null) setSearchTerm(q);
  }, [searchParams]);

  useEffect(() => {
    localStorage.setItem('snad_favorites', JSON.stringify(favorites));
  }, [favorites]);

  const toggleFavorite = (foodId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setFavorites((prev) =>
      prev.includes(foodId) ? prev.filter((id) => id !== foodId) : [...prev, foodId]
    );
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSearchTerm(val);
    setSearchParams(val ? { q: val } : {});
  };

  const { data: foods, isLoading } = useQuery({
    queryKey: ['foods'],
    queryFn: fetchFoods,
  });

  const { data: categories } = useQuery({
    queryKey: ['menuCategories'],
    queryFn: async () => {
      const res = await api.get('/categories');
      return res.data as Category[];
    },
  });

  const categoryNames = ['All', ...(categories?.map((c) => c.name) || [])];

  let filteredFoods = foods?.filter((food: Food) => {
    const matchesSearch = food.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          food.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = activeCategory === 'All' || food.category.name === activeCategory;
    const matchesFav = !onlyFavorites || favorites.includes(food.id);
    return matchesSearch && matchesCategory && matchesFav;
  }) || [];

  if (sortBy === 'price-low') {
    filteredFoods = [...filteredFoods].sort((a, b) => a.price - b.price);
  } else if (sortBy === 'price-high') {
    filteredFoods = [...filteredFoods].sort((a, b) => b.price - a.price);
  } else if (sortBy === 'name') {
    filteredFoods = [...filteredFoods].sort((a, b) => a.name.localeCompare(b.name));
  }

  return (
    <div className="bg-slate-50 min-h-screen pt-10 pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header Banner */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 bg-orange-100 text-orange-700 font-bold px-4 py-1.5 rounded-full text-xs uppercase tracking-wider mb-4">
            <Sparkles className="w-4 h-4" /> JOSTUM Campus Fresh Menu
          </div>
          <h1 className="text-xl sm:text-3xl md:text-5xl font-black text-gray-900 tracking-tight mb-3 whitespace-nowrap">
            Explore Snad Kitchen Menu
          </h1>
          <p className="text-gray-600 max-w-2xl mx-auto text-base sm:text-lg">
            Delicious university meals, freshly cooked daily with premium ingredients and fast campus delivery.
          </p>
        </div>

        {/* Search & Sort Bar */}
        <div className="bg-white rounded-3xl p-4 shadow-sm border border-gray-100 mb-8 space-y-4 md:space-y-0 md:flex md:items-center md:justify-between gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-3.5 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search meals, rice, swallow, drinks..."
              value={searchTerm}
              onChange={handleSearchChange}
              className="w-full pl-12 pr-4 py-3 rounded-2xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm"
            />
          </div>

          <div className="flex items-center gap-3">
            {/* Favorites Toggle Button */}
            <button
              onClick={() => setOnlyFavorites(!onlyFavorites)}
              className={`flex items-center gap-2 px-4 py-3 rounded-2xl border text-sm font-bold transition ${
                onlyFavorites
                  ? 'bg-rose-50 border-rose-300 text-rose-600'
                  : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100'
              }`}
            >
              <Heart className={`w-4 h-4 ${onlyFavorites ? 'fill-rose-500 text-rose-500' : ''}`} />
              Saved ({favorites.length})
            </button>

            {/* Sort Selector */}
            <div className="relative flex items-center gap-2 bg-gray-50 border border-gray-200 px-4 py-3 rounded-2xl text-sm font-medium text-gray-700">
              <SlidersHorizontal className="w-4 h-4 text-gray-500" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="bg-transparent focus:outline-none cursor-pointer text-sm font-semibold"
              >
                <option value="default">Sort by: Default</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
                <option value="name">Name: A - Z</option>
              </select>
            </div>
          </div>
        </div>

        {/* Categories Pills */}
        <div className="flex space-x-2 overflow-x-auto pb-4 mb-8 hide-scrollbar">
          {categoryNames.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-6 py-2.5 rounded-full font-bold text-sm whitespace-nowrap transition transform active:scale-95 ${
                activeCategory === cat
                  ? 'bg-gray-900 text-white shadow-md'
                  : 'bg-white text-gray-700 border border-gray-200 hover:border-gray-900 shadow-sm'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Food Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
              <div key={n} className="bg-white rounded-3xl p-4 shadow-sm animate-pulse h-[350px]">
                <div className="bg-gray-200 h-44 rounded-2xl mb-4"></div>
                <div className="bg-gray-200 h-6 w-3/4 rounded mb-2"></div>
                <div className="bg-gray-200 h-4 w-1/2 rounded"></div>
              </div>
            ))}
          </div>
        ) : filteredFoods.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-3xl border border-gray-100 p-8">
            <ShoppingBag className="w-16 h-16 mx-auto text-gray-300 mb-4" />
            <h3 className="text-xl font-bold text-gray-800">No meals found</h3>
            <p className="text-gray-500 text-sm mt-1">Try adjusting your search query or active category filters.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredFoods.map((food: Food, idx: number) => {
              const isFav = favorites.includes(food.id);

              return (
                <motion.div
                  key={food.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: idx * 0.05 }}
                  onClick={() => setSelectedFoodForCustomization(food)}
                  className="bg-white rounded-3xl p-4 shadow-sm border border-gray-100 hover:shadow-xl transition transform hover:-translate-y-1 group flex flex-col h-full cursor-pointer relative"
                >
                  {/* Image Container */}
                  <div className="relative overflow-hidden rounded-2xl h-48 mb-4 bg-orange-100">
                    {food.image_url ? (
                      <img
                        src={resolveMealImageUrl(food.image_url)}
                        alt={food.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center text-orange-300">
                        <ShoppingBag className="w-12 h-12" />
                      </div>
                    )}

                    {/* Category & Rating Badges */}
                    <span className="absolute top-3 left-3 bg-black/60 backdrop-blur-md text-white text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-1 rounded-full">
                      {food.category.name}
                    </span>

                    {/* Favorite Button */}
                    <button
                      onClick={(e) => toggleFavorite(food.id, e)}
                      className={`absolute top-3 right-3 p-2 rounded-full backdrop-blur-md transition ${
                        isFav
                          ? 'bg-rose-500 text-white shadow-lg'
                          : 'bg-white/80 hover:bg-white text-gray-600 hover:text-rose-500'
                      }`}
                    >
                      <Heart className={`w-4 h-4 ${isFav ? 'fill-white' : ''}`} />
                    </button>
                  </div>

                  {/* Body Content */}
                  <div className="flex-grow">
                    <div className="flex items-center gap-1 text-amber-500 mb-1">
                      <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                      <span className="text-xs font-bold text-gray-700">4.8</span>
                      <span className="text-[11px] text-gray-400">(45+)</span>
                    </div>

                    <h3 className="text-base font-bold text-gray-900 mb-1.5 leading-tight group-hover:text-orange-600 transition">
                      {food.name}
                    </h3>
                    <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed">{food.description}</p>
                  </div>

                  {/* Pricing and Action */}
                  <div className="mt-4 flex items-center justify-between border-t border-gray-100 pt-3">
                    <div>
                      <span className="text-xs font-semibold text-gray-400 block">Price</span>
                      <span className="text-lg font-black text-gray-900">₦{food.price.toLocaleString()}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedFoodForCustomization(food);
                        }}
                        className="bg-orange-50 text-orange-600 hover:bg-orange-500 hover:text-white px-3.5 py-2 rounded-full font-bold text-xs transition flex items-center gap-1"
                      >
                        <Plus className="w-4 h-4" />
                        Customize
                      </button>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* Food Customizer Modal */}
      <FoodCustomizerModal
        food={selectedFoodForCustomization}
        isOpen={!!selectedFoodForCustomization}
        onClose={() => setSelectedFoodForCustomization(null)}
      />
    </div>
  );
}
