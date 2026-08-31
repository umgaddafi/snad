import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Package,
  MapPin,
  Phone,
  CheckCircle,
  Loader2,
  Eye,
  X,
  TrendingUp,
  RotateCcw,
  Calendar,
  Award,
  AlertTriangle,
  Search,
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/axios';
import { useAuthStore } from '@/store/useAuthStore';
import toast from 'react-hot-toast';

interface Order {
  id: number;
  order_number: string;
  status: string;
  delivery_type?: string;
  rider_id: number | null;
  total_amount: number;
  payment_method?: string;
  address_id: number | null;
  special_instructions: string | null;
  created_at: string;
  updated_at?: string;
  user: { name: string; phone: string | null };
  items: { quantity: number; food: { name: string } }[];
}

interface RiderDashboardProps {
  defaultTab?: 'deliveries' | 'performance';
}

export default function RiderDashboard({ defaultTab = 'deliveries' }: RiderDashboardProps) {
  const queryClient = useQueryClient();
  const user = useAuthStore((state) => state.user);

  const [activeTab, setActiveTab] = useState<'deliveries' | 'performance'>(defaultTab);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  // Return meal state
  const [returningOrder, setReturningOrder] = useState<Order | null>(null);
  const [returnReason, setReturnReason] = useState<string>('Client rejected order');

  useEffect(() => {
    setActiveTab(defaultTab);
  }, [defaultTab]);

  const { data: orders, isLoading } = useQuery({
    queryKey: ['riderOrders'],
    queryFn: async () => {
      const res = await api.get('/orders');
      return res.data as Order[];
    },
    refetchInterval: 5000, // Live polling every 5 seconds
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) => {
      return api.put(`/orders/${id}`, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['riderOrders'] });
    },
    onError: () => {
      toast.error('Failed to update order status');
    },
  });

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-orange-500" />
      </div>
    );
  }

  // Filter orders
  const filteredOrders =
    orders?.filter(
      (o) =>
        o.order_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (o.user?.name || '').toLowerCase().includes(searchTerm.toLowerCase())
    ) || [];

  const availablePickups = filteredOrders.filter(
    (o) =>
      (o.status === 'ready' || (o.status === 'out_for_delivery' && !o.rider_id)) &&
      o.delivery_type !== 'pickup'
  );
  const myDeliveries = filteredOrders.filter(
    (o) => o.status === 'out_for_delivery' && o.rider_id === user?.id
  );
  const pastDeliveries = filteredOrders.filter(
    (o) => o.status === 'delivered' && o.rider_id === user?.id
  );

  const handlePickup = (id: number) => {
    updateStatusMutation.mutate(
      { id, status: 'out_for_delivery' },
      {
        onSuccess: () => toast.success('Order picked up! Now in transit.'),
      }
    );
  };

  const handleDelivered = (id: number) => {
    updateStatusMutation.mutate(
      { id, status: 'delivered' },
      {
        onSuccess: () => toast.success('Order marked as successfully delivered! 🎉'),
      }
    );
  };

  const handleConfirmReturnMeal = () => {
    if (!returningOrder) return;
    updateStatusMutation.mutate(
      { id: returningOrder.id, status: 'ready' },
      {
        onSuccess: () => {
          toast.success(
            `Meal returned to Kitchen queue. Reason: ${returnReason}`
          );
          setReturningOrder(null);
          setSelectedOrder(null);
        },
      }
    );
  };

  // Performance calculations
  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  
  const tempDate = new Date(now);
  const dayOfWeek = tempDate.getDay();
  const diffToMonday = tempDate.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
  const startOfWeek = new Date(tempDate.setDate(diffToMonday)).setHours(0, 0, 0, 0);

  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
  const startOfYear = new Date(now.getFullYear(), 0, 1).getTime();

  const allMyCompleted = (orders || []).filter(
    (o) => o.rider_id === user?.id && o.status === 'delivered'
  );

  const deliveriesToday = allMyCompleted.filter(
    (o) => new Date(o.updated_at || o.created_at).getTime() >= startOfDay
  ).length;

  const deliveriesWeek = allMyCompleted.filter(
    (o) => new Date(o.updated_at || o.created_at).getTime() >= startOfWeek
  ).length;

  const deliveriesMonth = allMyCompleted.filter(
    (o) => new Date(o.updated_at || o.created_at).getTime() >= startOfMonth
  ).length;

  const deliveriesYear = allMyCompleted.filter(
    (o) => new Date(o.updated_at || o.created_at).getTime() >= startOfYear
  ).length;

  const totalSuccessful = allMyCompleted.length;
  // Returned or cancelled during rider assignment
  const totalUnableToDeliver = (orders || []).filter(
    (o) =>
      o.rider_id === user?.id &&
      ['rejected', 'cancelled', 'returned'].includes(o.status)
  ).length;

  const totalAssigned = totalSuccessful + totalUnableToDeliver;
  const successRate =
    totalAssigned > 0 ? Math.round((totalSuccessful / totalAssigned) * 100) : 100;

  return (
    <div className="h-full flex flex-col space-y-4">
      {/* Navigation Tabs Header */}
      <div className="bg-white p-4 rounded-3xl shadow-sm border border-gray-100 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center space-x-2 bg-gray-100 p-1.5 rounded-2xl">
          <button
            onClick={() => setActiveTab('deliveries')}
            className={`flex items-center space-x-2 px-5 py-2.5 rounded-xl font-bold text-sm transition ${
              activeTab === 'deliveries'
                ? 'bg-white text-orange-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Package className="w-4 h-4" />
            <span>Deliveries Queue</span>
            {myDeliveries.length > 0 && (
              <span className="bg-orange-500 text-white text-xs px-2 py-0.5 rounded-full font-black">
                {myDeliveries.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('performance')}
            className={`flex items-center space-x-2 px-5 py-2.5 rounded-xl font-bold text-sm transition ${
              activeTab === 'performance'
                ? 'bg-white text-orange-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <TrendingUp className="w-4 h-4" />
            <span>My Performance</span>
          </button>
        </div>

        {activeTab === 'deliveries' && (
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3.5 top-3.5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by Order ID or Customer Name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm font-medium"
            />
          </div>
        )}
      </div>

      {/* PERFORMANCE VIEW */}
      {activeTab === 'performance' ? (
        <div className="space-y-6 flex-1 overflow-y-auto pb-10">
          {/* Header Card */}
          <div className="bg-gradient-to-r from-orange-500 via-amber-500 to-red-500 rounded-3xl p-6 sm:p-8 text-white shadow-lg relative overflow-hidden">
            <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
              <div>
                <span className="bg-white/20 backdrop-blur-md px-3 py-1 rounded-full text-xs font-extrabold uppercase tracking-wider mb-3 inline-block">
                  Delivery Agent Analytics
                </span>
                <h2 className="text-3xl font-black mb-1">
                  Rider Performance Summary
                </h2>
                <p className="text-orange-100 text-sm max-w-xl">
                  Track your daily, weekly, monthly, and yearly delivery metrics along with your fulfillment rating.
                </p>
              </div>
              <div className="bg-white/15 backdrop-blur-md border border-white/20 rounded-2xl p-4 text-center min-w-[140px]">
                <span className="text-xs font-bold uppercase tracking-wider text-orange-100 block">
                  Success Rate
                </span>
                <span className="text-4xl font-black">{successRate}%</span>
              </div>
            </div>
          </div>

          {/* Timeframe Delivery Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm flex flex-col justify-between">
              <div className="flex items-center justify-between text-orange-500 mb-3">
                <span className="text-xs font-extrabold uppercase tracking-wider text-gray-400">
                  Today
                </span>
                <Calendar className="w-5 h-5" />
              </div>
              <div>
                <span className="text-3xl font-black text-gray-900 block">
                  {deliveriesToday}
                </span>
                <span className="text-xs font-bold text-gray-500">Deliveries Completed</span>
              </div>
            </div>

            <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm flex flex-col justify-between">
              <div className="flex items-center justify-between text-blue-500 mb-3">
                <span className="text-xs font-extrabold uppercase tracking-wider text-gray-400">
                  This Week
                </span>
                <Calendar className="w-5 h-5" />
              </div>
              <div>
                <span className="text-3xl font-black text-gray-900 block">
                  {deliveriesWeek}
                </span>
                <span className="text-xs font-bold text-gray-500">Deliveries Completed</span>
              </div>
            </div>

            <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm flex flex-col justify-between">
              <div className="flex items-center justify-between text-purple-500 mb-3">
                <span className="text-xs font-extrabold uppercase tracking-wider text-gray-400">
                  This Month
                </span>
                <Calendar className="w-5 h-5" />
              </div>
              <div>
                <span className="text-3xl font-black text-gray-900 block">
                  {deliveriesMonth}
                </span>
                <span className="text-xs font-bold text-gray-500">Deliveries Completed</span>
              </div>
            </div>

            <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm flex flex-col justify-between">
              <div className="flex items-center justify-between text-emerald-500 mb-3">
                <span className="text-xs font-extrabold uppercase tracking-wider text-gray-400">
                  This Year
                </span>
                <Calendar className="w-5 h-5" />
              </div>
              <div>
                <span className="text-3xl font-black text-gray-900 block">
                  {deliveriesYear}
                </span>
                <span className="text-xs font-bold text-gray-500">Deliveries Completed</span>
              </div>
            </div>
          </div>

          {/* Detailed Fulfillment Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex items-center space-x-4">
              <div className="w-14 h-14 bg-green-100 text-green-600 rounded-2xl flex items-center justify-center shrink-0">
                <Award className="w-8 h-8" />
              </div>
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-gray-400 block">
                  Total Successful Deliveries
                </span>
                <span className="text-3xl font-black text-gray-900">
                  {totalSuccessful}
                </span>
                <p className="text-xs text-gray-500 mt-0.5">
                  Meals safely delivered to JOSTUM campus clients.
                </p>
              </div>
            </div>

            <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex items-center space-x-4">
              <div className="w-14 h-14 bg-amber-100 text-amber-600 rounded-2xl flex items-center justify-center shrink-0">
                <AlertTriangle className="w-8 h-8" />
              </div>
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-gray-400 block">
                  Unable to Deliver / Returned Meals
                </span>
                <span className="text-3xl font-black text-gray-900">
                  {totalUnableToDeliver}
                </span>
                <p className="text-xs text-gray-500 mt-0.5">
                  Orders rejected by client or returned to kitchen.
                </p>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* DELIVERIES QUEUE VIEW */
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 flex-1 overflow-y-auto">
          {/* Available Pickups */}
          <div className="rounded-3xl border p-4 flex flex-col bg-white shadow-sm h-[65vh] md:h-full">
            <div className="px-4 py-3 rounded-2xl mb-4 font-bold text-sm bg-blue-50 border-blue-100 text-blue-800 flex justify-between items-center">
              <span>Available for Pickup</span>
              <span className="bg-blue-200 text-blue-900 px-2 py-0.5 rounded-md text-xs">
                {availablePickups.length}
              </span>
            </div>

            <div className="flex-1 overflow-y-auto space-y-4 pr-1">
              <AnimatePresence>
                {availablePickups.map((order) => (
                  <motion.div
                    key={order.id}
                    layout
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="bg-white border border-gray-100 shadow-sm rounded-2xl p-5"
                  >
                    <div className="flex justify-between items-start mb-3">
                      <span className="font-extrabold text-gray-900">
                        {order.order_number}
                      </span>
                      <span className="text-xs font-bold text-blue-700 bg-blue-50 px-2 py-1 rounded">
                        Ready in Kitchen
                      </span>
                    </div>

                    <div className="space-y-1.5 mb-4 text-xs text-gray-600">
                      <p className="flex items-center font-bold text-gray-800">
                        <MapPin className="w-3.5 h-3.5 mr-1.5 text-orange-500" />
                        {order.user?.name}
                      </p>
                      <p className="line-clamp-2 text-gray-500">
                        {order.special_instructions || 'Standard Campus Delivery'}
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => setSelectedOrder(order)}
                        className="w-full bg-gray-50 hover:bg-gray-100 text-gray-700 font-bold py-2.5 rounded-xl transition text-xs flex items-center justify-center"
                      >
                        <Eye className="w-3.5 h-3.5 mr-1" />
                        <span>View</span>
                      </button>
                      <button
                        onClick={() => handlePickup(order.id)}
                        disabled={updateStatusMutation.isPending}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 rounded-xl transition text-xs flex items-center justify-center disabled:opacity-70"
                      >
                        <Package className="w-3.5 h-3.5 mr-1" />
                        <span>Pickup</span>
                      </button>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
              {availablePickups.length === 0 && (
                <div className="h-full flex items-center justify-center text-gray-400 font-medium text-xs text-center py-10">
                  No orders waiting for pickup
                </div>
              )}
            </div>
          </div>

          {/* My Active Deliveries */}
          <div className="rounded-3xl border p-4 flex flex-col bg-white shadow-sm h-[65vh] md:h-full">
            <div className="px-4 py-3 rounded-2xl mb-4 font-bold text-sm bg-orange-50 border-orange-100 text-orange-800 flex justify-between items-center">
              <span>My Active Deliveries</span>
              <span className="bg-orange-200 text-orange-900 px-2 py-0.5 rounded-md text-xs">
                {myDeliveries.length}
              </span>
            </div>

            <div className="flex-1 overflow-y-auto space-y-4 pr-1">
              <AnimatePresence>
                {myDeliveries.map((order) => (
                  <motion.div
                    key={order.id}
                    layout
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="bg-white border border-orange-100 shadow-sm rounded-2xl p-5 relative"
                  >
                    <div className="flex justify-between items-start mb-3">
                      <span className="font-extrabold text-gray-900">
                        {order.order_number}
                      </span>
                      <span className="text-[10px] font-extrabold text-orange-600 bg-orange-50 px-2 py-0.5 rounded border border-orange-100 uppercase">
                        In Transit
                      </span>
                    </div>

                    <div className="bg-gray-50 rounded-xl p-3 mb-3 space-y-1.5 text-xs">
                      <p className="font-bold text-gray-800">{order.user?.name}</p>
                      <p className="flex items-center text-gray-600">
                        <Phone className="w-3.5 h-3.5 mr-1 text-gray-400" />
                        {order.user?.phone || 'No phone provided'}
                      </p>
                      <p className="flex items-center text-gray-600">
                        <MapPin className="w-3.5 h-3.5 mr-1 text-gray-400" />
                        {order.special_instructions || 'Standard Campus Delivery'}
                      </p>
                    </div>

                    <div className="flex justify-between items-center mb-3 p-2.5 rounded-xl bg-gray-50 border border-gray-100 text-xs">
                      <span className="font-bold text-gray-500">Total:</span>
                      <span className="font-black text-gray-900 text-sm">
                        ₦{Number(order.total_amount).toLocaleString()}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 mb-2">
                      <button
                        onClick={() => setSelectedOrder(order)}
                        className="bg-orange-50 text-orange-700 hover:bg-orange-100 font-bold py-2.5 rounded-xl transition text-xs flex items-center justify-center"
                      >
                        <Eye className="w-3.5 h-3.5 mr-1" />
                        <span>Details</span>
                      </button>

                      <button
                        onClick={() => handleDelivered(order.id)}
                        disabled={updateStatusMutation.isPending}
                        className="bg-green-500 hover:bg-green-600 text-white font-bold py-2.5 rounded-xl transition text-xs flex items-center justify-center disabled:opacity-70 shadow-sm"
                      >
                        <CheckCircle className="w-3.5 h-3.5 mr-1" />
                        <span>Deliver</span>
                      </button>
                    </div>

                    {/* Meal Return / Rollback Button */}
                    <button
                      onClick={() => setReturningOrder(order)}
                      className="w-full bg-red-50 hover:bg-red-100 text-red-600 font-bold py-2 rounded-xl transition text-xs flex items-center justify-center border border-red-100"
                    >
                      <RotateCcw className="w-3.5 h-3.5 mr-1.5" />
                      <span>Return Meal (Client Rejected)</span>
                    </button>
                  </motion.div>
                ))}
              </AnimatePresence>
              {myDeliveries.length === 0 && (
                <div className="h-full flex items-center justify-center text-gray-400 font-medium text-xs text-center py-10">
                  You have no active deliveries in transit
                </div>
              )}
            </div>
          </div>

          {/* Past Deliveries */}
          <div className="rounded-3xl border p-4 flex flex-col bg-white shadow-sm h-[65vh] md:h-full opacity-90">
            <div className="px-4 py-3 rounded-2xl mb-4 font-bold text-sm bg-gray-100 border-gray-200 text-gray-700 flex justify-between items-center">
              <span>Completed Deliveries</span>
              <span className="bg-gray-200 text-gray-800 px-2 py-0.5 rounded-md text-xs">
                {pastDeliveries.length}
              </span>
            </div>

            <div className="flex-1 overflow-y-auto space-y-4 pr-1">
              <AnimatePresence>
                {pastDeliveries.map((order) => (
                  <motion.div
                    key={order.id}
                    layout
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="bg-gray-50 border border-gray-200 shadow-sm rounded-2xl p-4"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <span className="font-extrabold text-gray-600 line-through">
                        {order.order_number}
                      </span>
                      <span className="text-[10px] font-bold text-green-700 bg-green-100 px-2 py-0.5 rounded">
                        Delivered
                      </span>
                    </div>

                    <div className="space-y-1 mb-3 text-xs">
                      <p className="font-bold text-gray-700">{order.user?.name}</p>
                      <p className="text-gray-500 truncate">
                        {order.special_instructions || 'Standard Campus Delivery'}
                      </p>
                    </div>

                    <div className="flex justify-between items-center pt-2 border-t border-gray-200 text-xs">
                      <span className="text-gray-500 font-medium">Collected:</span>
                      <span className="font-bold text-gray-900">
                        ₦{Number(order.total_amount).toLocaleString()}
                      </span>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
              {pastDeliveries.length === 0 && (
                <div className="h-full flex items-center justify-center text-gray-400 font-medium text-xs text-center py-10">
                  No completed deliveries yet today.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Return Meal / Rollback Modal */}
      <AnimatePresence>
        {returningOrder && (
          <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white w-full max-w-md rounded-3xl overflow-hidden shadow-2xl flex flex-col"
            >
              <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-red-50">
                <h3 className="font-extrabold text-red-900 text-base flex items-center gap-2">
                  <RotateCcw className="w-5 h-5 text-red-600" />
                  Return Meal to Kitchen State
                </h3>
                <button
                  onClick={() => setReturningOrder(null)}
                  className="p-1.5 hover:bg-red-100 rounded-full transition"
                >
                  <X className="w-5 h-5 text-red-700" />
                </button>
              </div>

              <div className="p-6 space-y-4">
                <p className="text-sm text-gray-600">
                  Returning order <strong className="text-gray-900">{returningOrder.order_number}</strong> will unassign you and return the order back to the Kitchen Ready queue.
                </p>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-2">
                    Select Rejection / Return Reason
                  </label>
                  <select
                    value={returnReason}
                    onChange={(e) => setReturnReason(e.target.value)}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 text-sm font-bold text-gray-800"
                  >
                    <option value="Client rejected order">Client rejected order at door</option>
                    <option value="Client unreachable by phone">Client unreachable by phone</option>
                    <option value="Incorrect delivery address provided">Incorrect delivery address provided</option>
                    <option value="Client cancelled on arrival">Client cancelled on arrival</option>
                  </select>
                </div>

                <div className="pt-2 flex items-center space-x-3">
                  <button
                    onClick={() => setReturningOrder(null)}
                    className="w-1/2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-3 rounded-xl transition text-sm"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleConfirmReturnMeal}
                    disabled={updateStatusMutation.isPending}
                    className="w-1/2 bg-red-600 hover:bg-red-700 text-white font-bold py-3 rounded-xl transition text-sm flex items-center justify-center space-x-1 shadow-md shadow-red-200"
                  >
                    {updateStatusMutation.isPending ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <span>Confirm Return</span>
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* View Order Modal */}
      <AnimatePresence>
        {selectedOrder && !returningOrder && (
          <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white w-full max-w-md rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]"
            >
              <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                <h3 className="font-bold text-gray-900 text-lg">
                  Order {selectedOrder.order_number}
                </h3>
                <button
                  onClick={() => setSelectedOrder(null)}
                  className="p-2 hover:bg-gray-200 rounded-full transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 overflow-y-auto flex-1 space-y-6">
                <div>
                  <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                    Customer Details
                  </h4>
                  <div className="bg-gray-50 rounded-xl p-4 space-y-2 text-sm">
                    <p className="font-bold text-gray-900">
                      {selectedOrder.user?.name}
                    </p>
                    <p className="flex items-center text-gray-700">
                      <Phone className="w-4 h-4 mr-2 text-gray-400" />
                      {selectedOrder.user?.phone || 'No phone provided'}
                    </p>
                    <p className="flex items-start text-gray-700">
                      <MapPin className="w-4 h-4 mr-2 text-gray-400 mt-0.5" />
                      {selectedOrder.special_instructions ||
                        'Standard Campus Delivery'}
                    </p>
                  </div>
                </div>

                <div>
                  <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                    Order Items
                  </h4>
                  <div className="bg-gray-50 rounded-xl p-4 space-y-2 border border-gray-100 text-sm">
                    {selectedOrder.items.map((item, idx) => (
                      <div
                        key={idx}
                        className="flex justify-between items-center border-b border-gray-100 pb-2 last:border-0 last:pb-0"
                      >
                        <span className="font-medium text-gray-800">
                          {item.quantity}x {item.food.name}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex justify-between items-center bg-orange-50 p-4 rounded-xl border border-orange-100">
                  <span className="font-bold text-orange-900 text-sm">
                    Total Amount
                  </span>
                  <span className="text-xl font-extrabold text-orange-600">
                    ₦{Number(selectedOrder.total_amount).toLocaleString()}
                  </span>
                </div>
              </div>

              <div className="p-5 border-t border-gray-100 bg-gray-50 space-y-2">
                {selectedOrder.status === 'out_for_delivery' ? (
                  <>
                    <button
                      onClick={() => {
                        handleDelivered(selectedOrder.id);
                        setSelectedOrder(null);
                      }}
                      disabled={updateStatusMutation.isPending}
                      className="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-3.5 rounded-xl transition flex items-center justify-center space-x-2 text-base disabled:opacity-70 shadow-lg shadow-green-200"
                    >
                      <CheckCircle className="w-5 h-5" />
                      <span>Mark as Delivered</span>
                    </button>

                    <button
                      onClick={() => setReturningOrder(selectedOrder)}
                      className="w-full bg-red-50 hover:bg-red-100 text-red-600 font-bold py-3 rounded-xl transition text-sm flex items-center justify-center border border-red-100"
                    >
                      <RotateCcw className="w-4 h-4 mr-2" />
                      <span>Return Meal to Kitchen</span>
                    </button>
                  </>
                ) : selectedOrder.status === 'ready' ? (
                  <button
                    onClick={() => {
                      handlePickup(selectedOrder.id);
                      setSelectedOrder(null);
                    }}
                    disabled={updateStatusMutation.isPending}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 rounded-xl transition flex items-center justify-center space-x-2 text-base disabled:opacity-70 shadow-lg shadow-blue-200"
                  >
                    <Package className="w-5 h-5" />
                    <span>Accept & Pickup Order</span>
                  </button>
                ) : (
                  <button
                    onClick={() => setSelectedOrder(null)}
                    className="w-full bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-3 rounded-xl transition text-sm"
                  >
                    Close
                  </button>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
