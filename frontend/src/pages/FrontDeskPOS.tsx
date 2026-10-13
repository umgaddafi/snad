import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  UtensilsCrossed,
  Search,
  Plus,
  Minus,
  Trash2,
  User,
  Phone,
  MapPin,
  ChefHat,
  X,
  RefreshCw,
  ShoppingBag,
  Clock,
  SlidersHorizontal,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { Link } from 'react-router-dom';
import api from '@/lib/axios';
import { resolveMealImageUrl } from '@/lib/media';
import { playPosChime } from '@/lib/sound';
import { useAuthStore } from '@/store/useAuthStore';
import ThermalReceiptModal, { type ThermalOrder } from '@/components/ThermalReceiptModal';

interface FoodItem {
  id: number;
  name: string;
  price: number;
  discount_price?: number | null;
  description?: string;
  is_available: boolean;
  image_url: string | null;
  category?: {
    id: number;
    name: string;
  };
}

interface Category {
  id: number;
  name: string;
}

interface DeliveryLocation {
  id: number;
  name: string;
  delivery_fee: number;
}

interface POSTicketItem {
  food_id: number;
  name: string;
  base_price: number;
  unit_price: number;
  quantity: number;
  customizations: string[];
  image_url?: string | null;
}

const COMMON_ADDONS = [
  { name: 'Extra Beef', price: 500 },
  { name: 'Extra Fried Chicken', price: 700 },
  { name: 'Fried Plantain (Dodo)', price: 300 },
  { name: 'Boiled / Fried Egg', price: 200 },
  { name: 'Extra Pepper / Sauce', price: 100 },
  { name: 'Chilled Zobo Drink', price: 350 },
  { name: 'Bottled Water', price: 200 },
];

const SPICE_PREFERENCES = ['Not Spicy', 'Mild', 'Medium Spicy', 'Extra Hot'];

export default function FrontDeskPOS() {
  const queryClient = useQueryClient();
  const currentUser = useAuthStore((state) => state.user);

  // POS State
  const [ticketItems, setTicketItems] = useState<POSTicketItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Order Details
  const [orderType, setOrderType] = useState<'dine_in' | 'pickup' | 'delivery'>('dine_in');
  const [tableNumber, setTableNumber] = useState<string>('1');
  const [customerName, setCustomerName] = useState<string>('Walk-in Guest');
  const [customerPhone, setCustomerPhone] = useState<string>('');
  const [selectedLocationId, setSelectedLocationId] = useState<number | null>(null);
  const [specificAddress, setSpecificAddress] = useState<string>('');
  const [specialInstructions, setSpecialInstructions] = useState<string>('');

  // Payment State
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'pos' | 'transfer' | 'paystack'>('cash');
  const [amountTendered, setAmountTendered] = useState<string>('');
  const [paymentReference, setPaymentReference] = useState<string>('');

  // Coupon
  const [couponInput, setCouponInput] = useState<string>('');
  const [appliedCoupon, setAppliedCoupon] = useState<{ code: string; discount: number } | null>(null);
  const [validatingCoupon, setValidatingCoupon] = useState<boolean>(false);

  // Customization Modal State
  const [customizingFood, setCustomizingFood] = useState<FoodItem | null>(null);
  const [modalAddons, setModalAddons] = useState<string[]>([]);
  const [modalSpice, setModalSpice] = useState<string>('Medium Spicy');
  const [modalQuantity, setModalQuantity] = useState<number>(1);

  // Post-order Thermal Printing
  const [printedOrder, setPrintedOrder] = useState<ThermalOrder | null>(null);

  // 1. Fetch Food Catalog
  const { data: foodsData, isLoading: foodsLoading } = useQuery({
    queryKey: ['posFoods'],
    queryFn: async () => {
      const res = await api.get('/foods?all=1');
      if (Array.isArray(res.data)) return res.data as FoodItem[];
      if (Array.isArray(res.data?.data)) return res.data.data as FoodItem[];
      return [] as FoodItem[];
    },
    refetchInterval: 30000,
  });

  // 2. Fetch Categories
  const { data: categories } = useQuery<Category[]>({
    queryKey: ['posCategories'],
    queryFn: async () => {
      const res = await api.get('/categories');
      return res.data;
    },
  });

  // 3. Fetch Delivery Locations
  const { data: locations } = useQuery<DeliveryLocation[]>({
    queryKey: ['posLocations'],
    queryFn: async () => {
      const res = await api.get('/locations');
      return res.data;
    },
  });

  const foods = foodsData || [];

  // Filtered Food Menu
  const filteredFoods = useMemo(() => {
    return foods.filter((food) => {
      const matchesCategory =
        selectedCategory === 'All' || food.category?.name === selectedCategory;
      const matchesSearch =
        !searchTerm.trim() ||
        food.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        food.description?.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [foods, selectedCategory, searchTerm]);

  // Calculations
  const subtotal = useMemo(() => {
    return ticketItems.reduce((acc, item) => acc + item.unit_price * item.quantity, 0);
  }, [ticketItems]);

  const deliveryFee = useMemo(() => {
    if (orderType !== 'delivery') return 0;
    if (selectedLocationId && locations) {
      const loc = locations.find((l) => l.id === selectedLocationId);
      return loc ? Number(loc.delivery_fee) : 500;
    }
    return 500;
  }, [orderType, selectedLocationId, locations]);

  const discountAmount = appliedCoupon ? appliedCoupon.discount : 0;
  const grandTotal = Math.max(0, subtotal - discountAmount) + deliveryFee;

  // Change Calculation for Cash
  const changeDue = useMemo(() => {
    if (paymentMethod !== 'cash' || !amountTendered) return 0;
    const tendered = Number(amountTendered);
    if (isNaN(tendered)) return 0;
    return Math.max(0, tendered - grandTotal);
  }, [paymentMethod, amountTendered, grandTotal]);

  // Cart Operations
  const handleQuickAdd = (food: FoodItem) => {
    if (!food.is_available) {
      toast.error(`${food.name} is currently out of stock`);
      return;
    }

    const price = food.discount_price ?? food.price;
    setTicketItems((prev) => {
      const existingIdx = prev.findIndex(
        (i) => i.food_id === food.id && i.customizations.length === 0
      );
      if (existingIdx >= 0) {
        const next = [...prev];
        next[existingIdx].quantity += 1;
        return next;
      }
      return [
        ...prev,
        {
          food_id: food.id,
          name: food.name,
          base_price: price,
          unit_price: price,
          quantity: 1,
          customizations: [],
          image_url: food.image_url,
        },
      ];
    });
    toast.success(`Added ${food.name}`, { duration: 1200 });
  };

  const handleOpenCustomizer = (food: FoodItem) => {
    if (!food.is_available) {
      toast.error(`${food.name} is out of stock`);
      return;
    }
    setCustomizingFood(food);
    setModalAddons([]);
    setModalSpice('Medium Spicy');
    setModalQuantity(1);
  };

  const handleAddCustomizedToTicket = () => {
    if (!customizingFood) return;

    const basePrice = customizingFood.discount_price ?? customizingFood.price;
    const addonsCost = modalAddons.reduce((sum, addonName) => {
      const addon = COMMON_ADDONS.find((a) => a.name === addonName);
      return sum + (addon ? addon.price : 0);
    }, 0);

    const unitPrice = basePrice + addonsCost;
    const finalCustomizations = [...modalAddons];
    if (modalSpice && modalSpice !== 'Not Spicy') {
      finalCustomizations.unshift(modalSpice);
    }

    setTicketItems((prev) => [
      ...prev,
      {
        food_id: customizingFood.id,
        name: customizingFood.name,
        base_price: basePrice,
        unit_price: unitPrice,
        quantity: modalQuantity,
        customizations: finalCustomizations,
        image_url: customizingFood.image_url,
      },
    ]);

    toast.success(`Customized ${customizingFood.name} added!`);
    setCustomizingFood(null);
  };

  const updateQuantity = (idx: number, delta: number) => {
    setTicketItems((prev) => {
      const next = [...prev];
      const newQty = next[idx].quantity + delta;
      if (newQty <= 0) {
        return next.filter((_, i) => i !== idx);
      }
      next[idx].quantity = newQty;
      return next;
    });
  };

  const removeItem = (idx: number) => {
    setTicketItems((prev) => prev.filter((_, i) => i !== idx));
  };

  const clearTicket = () => {
    setTicketItems([]);
    setAppliedCoupon(null);
    setCouponInput('');
    setAmountTendered('');
    setPaymentReference('');
    setSpecialInstructions('');
    toast('Ticket cleared', { icon: '🧹' });
  };

  // Coupon Validation
  const handleApplyCoupon = async () => {
    if (!couponInput.trim()) return;
    setValidatingCoupon(true);
    try {
      const res = await api.get('/coupons');
      const allCoupons = res.data;
      const matched = Array.isArray(allCoupons)
        ? allCoupons.find(
            (c: any) => c.code.toUpperCase() === couponInput.trim().toUpperCase() && c.is_active
          )
        : null;

      if (!matched) {
        toast.error('Invalid or inactive coupon code');
        setAppliedCoupon(null);
        return;
      }

      if (subtotal < Number(matched.min_spend || 0)) {
        toast.error(`Minimum order of ₦${Number(matched.min_spend).toLocaleString()} required`);
        return;
      }

      let discountVal = 0;
      if (matched.discount_type === 'percent') {
        discountVal = Math.round((subtotal * Number(matched.discount_value)) / 100);
      } else {
        discountVal = Math.min(Number(matched.discount_value), subtotal);
      }

      setAppliedCoupon({ code: matched.code, discount: discountVal });
      toast.success(`Applied ${matched.code}! Saved ₦${discountVal.toLocaleString()}`);
    } catch {
      toast.error('Could not validate coupon.');
    } finally {
      setValidatingCoupon(false);
    }
  };

  // Order Submission Mutation
  const createOrderMutation = useMutation({
    mutationFn: async () => {
      if (ticketItems.length === 0) {
        throw new Error('Ticket is empty! Please select at least one item.');
      }

      const payload: any = {
        items: ticketItems.map((item) => ({
          food_id: item.food_id,
          quantity: item.quantity,
          customizations: item.customizations,
        })),
        delivery_type: orderType,
        customer_name: customerName.trim() || 'Walk-in Guest',
        customer_phone: customerPhone.trim() || null,
        table_number: orderType === 'dine_in' ? tableNumber.trim() || '1' : null,
        special_instructions: specialInstructions.trim() || null,
        coupon_code: appliedCoupon ? appliedCoupon.code : null,
        delivery_fee: deliveryFee,
        payment_method: paymentMethod,
        payment_reference:
          paymentReference.trim() ||
          (paymentMethod === 'pos'
            ? 'POS-' + Math.floor(100000 + Math.random() * 900000)
            : paymentMethod === 'transfer'
            ? 'TRF-' + Math.floor(100000 + Math.random() * 900000)
            : 'CASH-' + Math.floor(100000 + Math.random() * 900000)),
        status: 'confirmed', // Instantly dispatched to kitchen
        order_source: 'pos',
      };

      const res = await api.post('/orders', payload);
      return res.data;
    },
    onSuccess: (newOrder) => {
      // Audio feedback & notification
      playPosChime();
      toast.success(`Order #${newOrder.order_number} sent to Kitchen!`, {
        icon: '🍳',
        duration: 4000,
      });

      // Refresh live orders in kitchen and admin dashboards
      queryClient.invalidateQueries({ queryKey: ['kitchenOrders'] });
      queryClient.invalidateQueries({ queryKey: ['adminOrders'] });
      queryClient.invalidateQueries({ queryKey: ['frontDeskOrders'] });

      // Automatically launch Thermal Receipt Modal for printing KOT or Receipt
      setPrintedOrder(newOrder);

      // Reset ticket for the next customer
      setTicketItems([]);
      setAppliedCoupon(null);
      setCouponInput('');
      setAmountTendered('');
      setPaymentReference('');
      setSpecialInstructions('');
      if (orderType === 'dine_in') {
        setCustomerName('Walk-in Guest');
      }
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || err.message || 'Failed to place order');
    },
  });

  return (
    <div className="space-y-4">
      {/* Top Banner / Front Desk Bar */}
      <div className="bg-white p-4 sm:p-5 rounded-3xl border border-gray-150 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-orange-500 to-amber-500 text-white flex items-center justify-center shadow-md shadow-orange-500/20">
            <UtensilsCrossed className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-black text-gray-900 tracking-tight">Front Desk POS</h1>
              <span className="text-[11px] font-black px-2.5 py-0.5 rounded-full bg-teal-100 text-teal-800 border border-teal-200">
                Order Taker Active
              </span>
            </div>
            <p className="text-xs text-gray-500">
              Staff: <span className="font-bold text-gray-700">{currentUser?.name || 'Front Desk'}</span> • Live Orders automatically dispatched to kitchen
            </p>
          </div>
        </div>

        {/* Navigation & Actions */}
        <div className="flex items-center gap-2">
          <Link
            to="/front-desk/orders"
            className="flex items-center gap-2 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-2xl font-bold text-xs transition"
          >
            <Clock className="w-4 h-4 text-orange-500" />
            <span>Track Live Orders</span>
          </Link>

          <Link
            to="/kitchen"
            target="_blank"
            className="flex items-center gap-2 px-4 py-2.5 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 rounded-2xl font-bold text-xs transition"
          >
            <ChefHat className="w-4 h-4 text-amber-600" />
            <span>Kitchen Display</span>
          </Link>

          {ticketItems.length > 0 && (
            <button
              onClick={clearTicket}
              className="px-3.5 py-2.5 bg-red-50 hover:bg-red-100 text-red-700 rounded-2xl font-bold text-xs transition flex items-center gap-1.5"
              title="Clear Active Ticket"
            >
              <Trash2 className="w-4 h-4" />
              <span className="hidden sm:inline">Clear</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Split Grid: Left Menu Browser (60%), Right Ticket Summary (40%) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* ===================================================================
            LEFT SECTION: Food Catalog, Category Tabs & Quick Search (7 cols)
           =================================================================== */}
        <div className="lg:col-span-7 xl:col-span-8 space-y-4">
          {/* Search & Category Filter */}
          <div className="bg-white p-4 rounded-3xl border border-gray-150 shadow-sm space-y-3">
            {/* Search Input */}
            <div className="relative">
              <Search className="w-5 h-5 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search food by name, stew, combo, drink..."
                className="w-full pl-11 pr-10 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-sm font-medium focus:ring-2 focus:ring-orange-500 focus:bg-white outline-none transition"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Category Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
              <button
                onClick={() => setSelectedCategory('All')}
                className={`px-4 py-2 rounded-xl text-xs font-bold shrink-0 transition ${
                  selectedCategory === 'All'
                    ? 'bg-orange-500 text-white shadow-md shadow-orange-500/20'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                All Dishes ({foods.length})
              </button>
              {categories?.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.name)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold shrink-0 transition ${
                    selectedCategory === cat.name
                      ? 'bg-orange-500 text-white shadow-md shadow-orange-500/20'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          </div>

          {/* Foods Grid */}
          {foodsLoading ? (
            <div className="bg-white p-16 rounded-3xl border border-gray-150 flex flex-col items-center justify-center text-gray-400">
              <RefreshCw className="w-8 h-8 animate-spin text-orange-500 mb-2" />
              <p className="text-sm font-semibold">Loading menu items...</p>
            </div>
          ) : filteredFoods.length === 0 ? (
            <div className="bg-white p-16 rounded-3xl border border-gray-150 text-center text-gray-400">
              <ShoppingBag className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <h3 className="text-base font-bold text-gray-700">No dishes found</h3>
              <p className="text-xs text-gray-500 mt-1">Try another category or clear your search term.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3.5">
              {filteredFoods.map((food) => {
                const currentPrice = food.discount_price ?? food.price;
                const hasDiscount = !!food.discount_price && food.discount_price < food.price;
                const isOutOfStock = !food.is_available;

                return (
                  <div
                    key={food.id}
                    className={`bg-white rounded-3xl border border-gray-150 shadow-sm overflow-hidden flex flex-col justify-between transition group hover:shadow-md ${
                      isOutOfStock ? 'opacity-60 grayscale' : 'hover:border-orange-300'
                    }`}
                  >
                    {/* Food Image */}
                    <div className="relative h-28 bg-gray-100 overflow-hidden">
                      {food.image_url ? (
                        <img
                          src={resolveMealImageUrl(food.image_url)}
                          alt={food.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-300">
                          <UtensilsCrossed className="w-8 h-8" />
                        </div>
                      )}

                      {/* Stock badge */}
                      {isOutOfStock ? (
                        <span className="absolute top-2 left-2 bg-red-600/90 text-white text-[10px] font-black uppercase px-2 py-0.5 rounded-full shadow">
                          Sold Out
                        </span>
                      ) : food.category?.name ? (
                        <span className="absolute top-2 left-2 bg-black/60 backdrop-blur-sm text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                          {food.category.name}
                        </span>
                      ) : null}

                      {hasDiscount && !isOutOfStock && (
                        <span className="absolute top-2 right-2 bg-orange-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full shadow">
                          SALE
                        </span>
                      )}
                    </div>

                    {/* Food Info */}
                    <div className="p-3 flex-1 flex flex-col justify-between">
                      <div>
                        <h4 className="font-extrabold text-sm text-gray-900 leading-tight line-clamp-1">
                          {food.name}
                        </h4>
                        <div className="flex items-baseline gap-1.5 mt-1">
                          <span className="text-sm font-black text-orange-600">
                            ₦{Number(currentPrice).toLocaleString()}
                          </span>
                          {hasDiscount && (
                            <span className="text-[11px] text-gray-400 line-through">
                              ₦{Number(food.price).toLocaleString()}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Add Buttons */}
                      <div className="flex gap-1.5 mt-3 pt-2 border-t border-gray-100">
                        <button
                          type="button"
                          disabled={isOutOfStock}
                          onClick={() => handleQuickAdd(food)}
                          className="flex-1 bg-orange-500 hover:bg-orange-600 disabled:bg-gray-200 text-white font-bold py-2 px-2 rounded-xl text-xs flex items-center justify-center gap-1 transition shadow-sm active:scale-95"
                          title="Quick Add to Ticket"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Add</span>
                        </button>

                        <button
                          type="button"
                          disabled={isOutOfStock}
                          onClick={() => handleOpenCustomizer(food)}
                          className="p-2 bg-gray-100 hover:bg-gray-200 disabled:opacity-50 text-gray-700 rounded-xl transition"
                          title="Add with Custom Add-ons & Spice"
                        >
                          <SlidersHorizontal className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ===================================================================
            RIGHT SECTION: Order Ticket & Settlement Panel (5 cols)
           =================================================================== */}
        <div className="lg:col-span-5 xl:col-span-4 space-y-4 sticky top-4">
          <div className="bg-white rounded-3xl border border-gray-150 shadow-sm p-5 space-y-4">
            {/* Ticket Header & Order Type Switcher */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <ShoppingBag className="w-5 h-5 text-orange-500" />
                  <h3 className="font-black text-gray-900 text-base">Current Ticket</h3>
                </div>
                <span className="text-xs font-bold px-2 py-0.5 rounded-lg bg-orange-50 text-orange-700">
                  {ticketItems.reduce((acc, i) => acc + i.quantity, 0)} Items
                </span>
              </div>

              {/* Order Type Tabs */}
              <div className="grid grid-cols-3 gap-1.5 p-1 bg-gray-100 rounded-2xl">
                <button
                  type="button"
                  onClick={() => setOrderType('dine_in')}
                  className={`py-2 text-xs font-black rounded-xl transition flex flex-col items-center gap-0.5 ${
                    orderType === 'dine_in'
                      ? 'bg-white text-orange-600 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <span>🍽️ Dine-In</span>
                </button>
                <button
                  type="button"
                  onClick={() => setOrderType('pickup')}
                  className={`py-2 text-xs font-black rounded-xl transition flex flex-col items-center gap-0.5 ${
                    orderType === 'pickup'
                      ? 'bg-white text-orange-600 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <span>🛍️ Takeout</span>
                </button>
                <button
                  type="button"
                  onClick={() => setOrderType('delivery')}
                  className={`py-2 text-xs font-black rounded-xl transition flex flex-col items-center gap-0.5 ${
                    orderType === 'delivery'
                      ? 'bg-white text-orange-600 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <span>🚴 Delivery</span>
                </button>
              </div>
            </div>

            {/* Dynamic Customer / Table Inputs */}
            <div className="space-y-2.5 pt-1 border-t border-gray-100">
              {/* If Dine-In: Table Number Selector */}
              {orderType === 'dine_in' && (
                <div className="flex items-center gap-2 bg-orange-50/70 p-2.5 rounded-2xl border border-orange-200">
                  <span className="text-xs font-black text-orange-800 uppercase tracking-wide">
                    Table #:
                  </span>
                  <input
                    type="text"
                    value={tableNumber}
                    onChange={(e) => setTableNumber(e.target.value)}
                    placeholder="e.g. 1, 2, VIP"
                    className="flex-1 px-3 py-1 bg-white border border-orange-300 rounded-xl text-xs font-black text-gray-900 outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
              )}

              {/* Customer Name & Phone */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1">
                    Customer Name
                  </label>
                  <div className="relative">
                    <User className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      placeholder="Walk-in Guest"
                      className="w-full pl-8 pr-2 py-1.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-800 outline-none focus:bg-white focus:ring-1 focus:ring-orange-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1">
                    Phone (Optional)
                  </label>
                  <div className="relative">
                    <Phone className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      placeholder="080XXXXXXXX"
                      className="w-full pl-8 pr-2 py-1.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium text-gray-800 outline-none focus:bg-white focus:ring-1 focus:ring-orange-500"
                    />
                  </div>
                </div>
              </div>

              {/* If Delivery: Location dropdown & notes */}
              {orderType === 'delivery' && (
                <div className="space-y-2 bg-blue-50/70 p-3 rounded-2xl border border-blue-200 animate-in fade-in">
                  <div className="flex items-center gap-1.5 text-xs font-black text-blue-900">
                    <MapPin className="w-3.5 h-3.5 text-blue-600" />
                    <span>Campus Drop-off Location</span>
                  </div>

                  <select
                    value={selectedLocationId || ''}
                    onChange={(e) => setSelectedLocationId(Number(e.target.value) || null)}
                    className="w-full p-2 bg-white border border-blue-300 rounded-xl text-xs font-bold text-gray-800 outline-none"
                  >
                    <option value="">Select Delivery Zone (Default: ₦500)</option>
                    {locations?.map((loc) => (
                      <option key={loc.id} value={loc.id}>
                        {loc.name} (+₦{Number(loc.delivery_fee).toLocaleString()})
                      </option>
                    ))}
                  </select>

                  <input
                    type="text"
                    value={specificAddress}
                    onChange={(e) => setSpecificAddress(e.target.value)}
                    placeholder="Hostel Room / Block / Exact spot..."
                    className="w-full px-3 py-1.5 bg-white border border-blue-300 rounded-xl text-xs font-medium text-gray-800 outline-none"
                  />
                </div>
              )}
            </div>

            {/* Ticket Line Items List */}
            <div className="space-y-2 border-t border-b border-gray-150 py-3 max-h-56 overflow-y-auto">
              {ticketItems.length === 0 ? (
                <div className="py-8 text-center text-gray-400">
                  <UtensilsCrossed className="w-8 h-8 mx-auto mb-2 opacity-30" />
                  <p className="text-xs font-bold">Ticket is empty</p>
                  <p className="text-[11px] text-gray-400">Select items from menu to start order.</p>
                </div>
              ) : (
                ticketItems.map((item, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between gap-2 p-2 bg-gray-50 rounded-2xl border border-gray-100"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-black text-gray-900 truncate">{item.name}</p>
                      {item.customizations.length > 0 && (
                        <p className="text-[10px] text-gray-500 truncate">
                          [{item.customizations.join(', ')}]
                        </p>
                      )}
                      <p className="text-[11px] font-bold text-orange-600">
                        ₦{(item.unit_price * item.quantity).toLocaleString()}{' '}
                        <span className="text-[9px] text-gray-400 font-normal">
                          (@₦{item.unit_price.toLocaleString()})
                        </span>
                      </p>
                    </div>

                    {/* Quantity Stepper */}
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => updateQuantity(idx, -1)}
                        className="w-6 h-6 rounded-lg bg-white border border-gray-200 flex items-center justify-center text-gray-600 hover:bg-gray-100 active:scale-95"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="w-5 text-center text-xs font-black text-gray-900">
                        {item.quantity}
                      </span>
                      <button
                        type="button"
                        onClick={() => updateQuantity(idx, 1)}
                        className="w-6 h-6 rounded-lg bg-white border border-gray-200 flex items-center justify-center text-gray-600 hover:bg-gray-100 active:scale-95"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                      <button
                        type="button"
                        onClick={() => removeItem(idx)}
                        className="w-6 h-6 rounded-lg text-red-500 hover:bg-red-50 flex items-center justify-center ml-1"
                        title="Remove item"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Special Instructions / Chef Notes */}
            <div>
              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1">
                Special Requests / Chef Instructions
              </label>
              <input
                type="text"
                value={specialInstructions}
                onChange={(e) => setSpecialInstructions(e.target.value)}
                placeholder="e.g. Extra pepper, separate sauce, pack cutlery..."
                className="w-full px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-800 outline-none focus:bg-white focus:ring-1 focus:ring-orange-500"
              />
            </div>

            {/* Coupon Code Section */}
            <div className="flex gap-1.5">
              <input
                type="text"
                value={couponInput}
                onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                placeholder="Promo Code (Optional)"
                className="flex-1 px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-mono uppercase font-bold text-gray-800 outline-none"
              />
              <button
                type="button"
                onClick={handleApplyCoupon}
                disabled={validatingCoupon || !couponInput.trim()}
                className="px-3 py-1.5 bg-gray-800 hover:bg-black disabled:opacity-50 text-white rounded-xl text-xs font-bold transition"
              >
                {validatingCoupon ? 'Checking...' : 'Apply'}
              </button>
            </div>

            {/* Bill Summary */}
            <div className="space-y-1.5 text-xs text-gray-600 pt-1">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span className="font-bold text-gray-900">₦{subtotal.toLocaleString()}</span>
              </div>

              {discountAmount > 0 && (
                <div className="flex justify-between text-emerald-600 font-bold">
                  <span>Discount ({appliedCoupon?.code}):</span>
                  <span>-₦{discountAmount.toLocaleString()}</span>
                </div>
              )}

              {deliveryFee > 0 && (
                <div className="flex justify-between">
                  <span>Delivery Fee:</span>
                  <span className="font-bold text-gray-900">₦{deliveryFee.toLocaleString()}</span>
                </div>
              )}

              <div className="flex justify-between items-center text-base font-black text-gray-900 border-t border-gray-200 pt-2">
                <span>Total Amount:</span>
                <span className="text-orange-600 text-lg">₦{grandTotal.toLocaleString()}</span>
              </div>
            </div>

            {/* Payment Method Selector */}
            <div className="space-y-2 pt-2 border-t border-gray-150">
              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">
                Payment Method
              </label>
              <div className="grid grid-cols-4 gap-1">
                <button
                  type="button"
                  onClick={() => setPaymentMethod('cash')}
                  className={`py-2 text-[11px] font-black rounded-xl transition ${
                    paymentMethod === 'cash'
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  💵 Cash
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentMethod('pos')}
                  className={`py-2 text-[11px] font-black rounded-xl transition ${
                    paymentMethod === 'pos'
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  💳 POS Card
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentMethod('transfer')}
                  className={`py-2 text-[11px] font-black rounded-xl transition ${
                    paymentMethod === 'transfer'
                      ? 'bg-purple-600 text-white shadow-sm'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  🏦 Transfer
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentMethod('paystack')}
                  className={`py-2 text-[11px] font-black rounded-xl transition ${
                    paymentMethod === 'paystack'
                      ? 'bg-cyan-600 text-white shadow-sm'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  ⚡ Online
                </button>
              </div>

              {/* If Cash: Change Calculator */}
              {paymentMethod === 'cash' && (
                <div className="bg-emerald-50/80 p-3 rounded-2xl border border-emerald-200 space-y-2 animate-in fade-in">
                  <div className="flex items-center justify-between text-xs font-bold text-emerald-950">
                    <span>Cash Tendered:</span>
                    <input
                      type="number"
                      value={amountTendered}
                      onChange={(e) => setAmountTendered(e.target.value)}
                      placeholder="Amount given"
                      className="w-28 px-2 py-1 bg-white border border-emerald-300 rounded-xl text-right font-black text-xs text-gray-900 outline-none focus:ring-1 focus:ring-emerald-500"
                    />
                  </div>

                  {/* Quick cash denomination buttons */}
                  <div className="flex gap-1 overflow-x-auto pb-0.5">
                    {[grandTotal, 1000, 2000, 5000, 10000, 20000].map((amt, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setAmountTendered(String(amt))}
                        className="px-2 py-0.5 rounded-lg bg-white border border-emerald-200 text-[10px] font-bold text-emerald-800 hover:bg-emerald-100 shrink-0"
                      >
                        {idx === 0 ? 'Exact' : `₦${amt.toLocaleString()}`}
                      </button>
                    ))}
                  </div>

                  {changeDue > 0 && (
                    <div className="flex justify-between items-center pt-1 border-t border-emerald-200/60 text-xs font-black text-emerald-900">
                      <span>Change to Return:</span>
                      <span className="text-emerald-700 text-sm">₦{changeDue.toLocaleString()}</span>
                    </div>
                  )}
                </div>
              )}

              {/* If POS / Transfer: Reference field */}
              {(paymentMethod === 'pos' || paymentMethod === 'transfer') && (
                <div className="space-y-1">
                  <input
                    type="text"
                    value={paymentReference}
                    onChange={(e) => setPaymentReference(e.target.value)}
                    placeholder={paymentMethod === 'pos' ? 'POS Approval Code / Ref' : 'Bank Session / Transfer ID'}
                    className="w-full px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium text-gray-800 outline-none"
                  />
                </div>
              )}
            </div>

            {/* SEND ORDER TO KITCHEN BUTTON */}
            <button
              type="button"
              disabled={ticketItems.length === 0 || createOrderMutation.isPending}
              onClick={() => createOrderMutation.mutate()}
              className="w-full bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 disabled:opacity-50 text-white font-black py-3.5 px-4 rounded-2xl text-sm shadow-xl shadow-orange-500/25 flex items-center justify-center gap-2 transition active:scale-98"
            >
              {createOrderMutation.isPending ? (
                <>
                  <RefreshCw className="w-5 h-5 animate-spin" />
                  <span>Dispatching to Kitchen...</span>
                </>
              ) : (
                <>
                  <ChefHat className="w-5 h-5" />
                  <span>Send Order to Kitchen (₦{grandTotal.toLocaleString()})</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* ===================================================================
          CUSTOMIZATION MODAL (Add-ons & Spice Level)
         =================================================================== */}
      {customizingFood && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl border border-gray-150 space-y-4 animate-in fade-in zoom-in duration-150">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-orange-600 bg-orange-50 px-2 py-0.5 rounded-full">
                  Dish Customizer
                </span>
                <h3 className="text-lg font-black text-gray-900 mt-1">{customizingFood.name}</h3>
                <p className="text-xs text-gray-500">
                  Base Price: ₦{(customizingFood.discount_price ?? customizingFood.price).toLocaleString()}
                </p>
              </div>
              <button
                onClick={() => setCustomizingFood(null)}
                className="p-1.5 text-gray-400 hover:text-gray-700 rounded-full"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Spice Level */}
            <div>
              <label className="text-xs font-bold text-gray-700 block mb-1.5">Spice Preference</label>
              <div className="grid grid-cols-4 gap-1.5">
                {SPICE_PREFERENCES.map((spice) => (
                  <button
                    key={spice}
                    type="button"
                    onClick={() => setModalSpice(spice)}
                    className={`py-1.5 text-[11px] font-bold rounded-xl border transition ${
                      modalSpice === spice
                        ? 'bg-orange-500 text-white border-orange-500 shadow-sm'
                        : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
                    }`}
                  >
                    {spice}
                  </button>
                ))}
              </div>
            </div>

            {/* Extra Addons */}
            <div>
              <label className="text-xs font-bold text-gray-700 block mb-1.5">Extra Add-ons</label>
              <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                {COMMON_ADDONS.map((addon) => {
                  const isSelected = modalAddons.includes(addon.name);
                  return (
                    <button
                      key={addon.name}
                      type="button"
                      onClick={() =>
                        setModalAddons((prev) =>
                          isSelected ? prev.filter((a) => a !== addon.name) : [...prev, addon.name]
                        )
                      }
                      className={`w-full p-2.5 rounded-xl border flex items-center justify-between text-xs font-bold transition text-left ${
                        isSelected
                          ? 'bg-orange-50 border-orange-400 text-orange-950'
                          : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      <span>{addon.name}</span>
                      <span className="text-orange-600 font-extrabold">+₦{addon.price.toLocaleString()}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Modal Quantity */}
            <div className="flex items-center justify-between pt-2 border-t border-gray-150">
              <span className="text-xs font-bold text-gray-700">Portions:</span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setModalQuantity((q) => Math.max(1, q - 1))}
                  className="w-8 h-8 rounded-xl bg-gray-100 border border-gray-200 flex items-center justify-center font-bold text-gray-700"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <span className="w-6 text-center font-black text-sm">{modalQuantity}</span>
                <button
                  type="button"
                  onClick={() => setModalQuantity((q) => q + 1)}
                  className="w-8 h-8 rounded-xl bg-gray-100 border border-gray-200 flex items-center justify-center font-bold text-gray-700"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Add customized button */}
            <button
              type="button"
              onClick={handleAddCustomizedToTicket}
              className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 rounded-2xl text-xs transition shadow-md shadow-orange-500/20"
            >
              Add to Ticket
            </button>
          </div>
        </div>
      )}

      {/* ===================================================================
          THERMAL RECEIPT MODAL (Customer & Kitchen KOT Printing)
         =================================================================== */}
      <ThermalReceiptModal
        order={printedOrder}
        isOpen={!!printedOrder}
        onClose={() => setPrintedOrder(null)}
        initialMode="customer"
      />
    </div>
  );
}
