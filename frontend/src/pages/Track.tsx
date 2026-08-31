import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, Package, MapPin, Clock, CheckCircle2, Bike, ChefHat, Check } from 'lucide-react';
import { motion } from 'framer-motion';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/axios';

const TRACKING_STAGES = [
  { key: 'pending', label: 'Order Received', icon: Clock },
  { key: 'confirmed', label: 'Payment Confirmed', icon: CheckCircle2 },
  { key: 'preparing', label: 'Kitchen Cooking', icon: ChefHat },
  { key: 'ready', label: 'Packaging Ready', icon: Package },
  { key: 'out_for_delivery', label: 'Out for Delivery', icon: Bike },
  { key: 'delivered', label: 'Delivered', icon: CheckCircle2 },
];

export default function Track() {
  const [searchParams] = useSearchParams();
  const [trackingInput, setTrackingInput] = useState(searchParams.get('order_number') || '');
  const [activeId, setActiveId] = useState(searchParams.get('order_number') || '');
  const [confirming, setConfirming] = useState(false);
  const queryClient = useQueryClient();

  useEffect(() => {
    const param = searchParams.get('order_number');
    if (param) {
      setTrackingInput(param);
      setActiveId(param);
    }
  }, [searchParams]);

  const { data: order, isLoading: loading, isError, error: queryErr } = useQuery({
    queryKey: ['trackOrder', activeId],
    queryFn: async () => {
      if (!activeId.trim()) return null;
      const response = await api.get(`/orders/track/${activeId.trim()}`);
      return response.data;
    },
    enabled: !!activeId.trim(),
    refetchInterval: 15000, // Background status update every 15-30 seconds seamlessly
  });

  const errorMessage = isError ? ((queryErr as any)?.response?.data?.message || 'Order not found. Please verify your tracking ID.') : '';

  const handleConfirmReceipt = async () => {
    if (!order) return;
    setConfirming(true);
    try {
      await api.put(`/orders/${order.id}`, { status: 'delivered' });
      queryClient.invalidateQueries({ queryKey: ['trackOrder', activeId] });
    } catch (e) {
      console.error(e);
    } finally {
      setConfirming(false);
    }
  };

  const handleTrack = (e: React.FormEvent) => {
    e.preventDefault();
    if (trackingInput.trim()) {
      setActiveId(trackingInput.trim());
    }
  };

  const getStageIndex = (status: string) => {
    switch (status) {
      case 'pending': return 0;
      case 'confirmed': return 1;
      case 'preparing': return 2;
      case 'ready': return 3;
      case 'out_for_delivery': return 4;
      case 'delivered': return 5;
      default: return 0;
    }
  };

  const currentStageIndex = order ? getStageIndex(order.status) : 0;

  return (
    <div className="min-h-screen bg-slate-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10">
          <span className="bg-orange-100 text-orange-700 font-extrabold text-xs uppercase px-4 py-1.5 rounded-full inline-block mb-3">
            Real-Time Campus Order Tracking
          </span>
          <h1 className="text-4xl font-black text-gray-900 mb-3">Track Your Meal</h1>
          <p className="text-gray-600 max-w-xl mx-auto text-sm sm:text-base">
            Enter your order tracking number (e.g. ORD-XXXXXX) to monitor kitchen progress and live rider location.
          </p>
        </div>

        {/* Search Bar */}
        <div className="bg-white rounded-3xl shadow-md p-6 border border-gray-100 mb-8">
          <form onSubmit={handleTrack} className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-3.5 text-gray-400 w-5 h-5" />
              <input
                type="text"
                value={trackingInput}
                onChange={(e) => setTrackingInput(e.target.value)}
                placeholder="Enter Tracking ID (e.g. ORD-8X9Y2Z...)"
                className="w-full pl-12 pr-4 py-3.5 rounded-2xl border border-gray-200 focus:ring-2 focus:ring-orange-500 focus:outline-none text-sm font-bold uppercase tracking-wider"
                required
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="bg-gray-900 hover:bg-black text-white px-8 py-3.5 rounded-2xl font-black shadow-lg transition disabled:opacity-50 text-sm"
            >
              {loading ? 'Searching...' : 'Track Order'}
            </button>
          </form>

          {errorMessage && (
            <div className="mt-4 p-4 bg-red-50 text-red-600 rounded-2xl text-center text-sm font-bold">
              {errorMessage}
            </div>
          )}
        </div>

        {order && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden space-y-8 p-6 sm:p-8"
          >
            {/* Order Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 pb-6">
              <div>
                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Tracking Order</span>
                <h2 className="text-2xl font-black text-gray-900">{order.order_number}</h2>
                <p className="text-xs text-gray-500 mt-1">Placed on {new Date(order.created_at).toLocaleString()}</p>
              </div>

              <div className="flex items-center gap-2">
                <span className="bg-orange-500 text-white font-black text-xs px-4 py-2 rounded-full uppercase tracking-wider shadow-md shadow-orange-500/25">
                  {order.status.replace(/_/g, ' ')}
                </span>
                <span className={`text-[10px] font-extrabold px-3 py-1.5 rounded-full border uppercase tracking-wider ${
                  order.payment_method === 'cod' || order.payment_method === 'cash'
                    ? 'bg-amber-50 text-amber-800 border-amber-200'
                    : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                }`}>
                  {order.payment_method === 'cod' || order.payment_method === 'cash' ? 'Pay on Delivery (COD)' : 'Paid Online (Paystack)'}
                </span>
              </div>
            </div>

            {/* Compact Horizontal Stepper Timeline - Fully Fitted for Mobile & Desktop */}
            <div className="bg-slate-50/70 border border-gray-100 rounded-3xl p-3.5 sm:p-6">
              <h3 className="text-xs sm:text-sm font-black text-gray-900 uppercase tracking-wider mb-5">
                Order Status Timeline
              </h3>

              <div className="w-full">
                <div className="flex items-start justify-between w-full">
                  {TRACKING_STAGES.map((stage, idx) => {
                    const isPassed = idx < currentStageIndex;
                    const isCurrent = idx === currentStageIndex;
                    const isCod = order.payment_method === 'cod' || order.payment_method === 'cash';
                    const stageLabel = stage.key === 'confirmed' && isCod ? 'Order Confirmed' : stage.label;

                    return (
                      <div key={stage.key} className="flex-1 flex flex-col items-center relative min-w-0">
                        {/* Connecting Horizontal Line + Circle Node */}
                        <div className="w-full flex items-center mb-2.5">
                          <div
                            className={`h-[2px] flex-1 ${
                              idx === 0 ? 'invisible' : idx <= currentStageIndex ? 'bg-emerald-600' : 'bg-gray-200'
                            }`}
                          />

                          <div
                            className={`w-7 h-7 sm:w-9 sm:h-9 rounded-full flex items-center justify-center font-black text-[10px] sm:text-xs shrink-0 z-10 transition-all duration-300 ${
                              isPassed
                                ? 'bg-emerald-600 text-white shadow-sm'
                                : isCurrent
                                ? 'bg-orange-500 text-white shadow-md shadow-orange-500/30 ring-2 sm:ring-4 ring-orange-200/90 scale-105 sm:scale-110'
                                : 'bg-gray-200 text-gray-500'
                            }`}
                          >
                            {isPassed ? (
                              <Check className="w-3.5 h-3.5 sm:w-4 sm:h-4 stroke-[3]" />
                            ) : (
                              <span>{idx + 1}</span>
                            )}
                          </div>

                          <div
                            className={`h-[2px] flex-1 ${
                              idx === TRACKING_STAGES.length - 1
                                ? 'invisible'
                                : idx < currentStageIndex
                                ? 'bg-emerald-600'
                                : 'bg-gray-200'
                            }`}
                          />
                        </div>

                        {/* Stage Label */}
                        <span
                          className={`text-[8.5px] xs:text-[9.5px] sm:text-xs text-center leading-[1.1] max-w-[48px] xs:max-w-[64px] sm:max-w-[90px] font-bold ${
                            isCurrent
                              ? 'font-black text-gray-900'
                              : isPassed
                              ? 'font-extrabold text-gray-800'
                              : 'text-gray-400'
                          }`}
                        >
                          {stageLabel}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Rider Card if Out for Delivery */}
            {order.rider && (
              <div className="bg-blue-50 border-2 border-blue-200 rounded-3xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-blue-600 text-white rounded-2xl flex items-center justify-center shrink-0 shadow-md">
                    <Bike className="w-8 h-8" />
                  </div>
                  <div>
                    <span className="text-[10px] font-extrabold uppercase text-blue-600 tracking-wider">
                      Assigned Campus Rider
                    </span>
                    <h4 className="text-lg font-black text-blue-950">{order.rider.name}</h4>
                    <p className="text-xs text-blue-700 font-semibold">{order.rider.phone}</p>
                  </div>
                </div>

                <a
                  href={`tel:${order.rider.phone}`}
                  className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white font-black px-6 py-3 rounded-2xl text-xs transition text-center shadow-md"
                >
                  Call Rider Now
                </a>
              </div>
            )}

            {/* Confirm Received Section for Customer */}
            {(order.status === 'out_for_delivery' || order.status === 'delivered') && (
              <div className={`rounded-3xl p-6 text-center space-y-3 border transition-all ${
                order.customer_confirmed
                  ? 'bg-emerald-100/70 border-emerald-300'
                  : order.status === 'delivered'
                  ? 'bg-emerald-50 border-emerald-200 shadow-md ring-2 ring-emerald-300'
                  : 'bg-amber-50/70 border-amber-200'
              }`}>
                <h4 className={`font-extrabold text-base ${
                  order.customer_confirmed || order.status === 'delivered' ? 'text-emerald-950' : 'text-amber-950'
                }`}>
                  {order.customer_confirmed
                    ? 'Meal Receipt Confirmed 🎉'
                    : order.status === 'delivered'
                    ? 'Has your meal arrived?'
                    : 'Rider is en route to your campus location 🚴'}
                </h4>
                <p className={`text-xs max-w-md mx-auto font-medium ${
                  order.customer_confirmed || order.status === 'delivered' ? 'text-emerald-700' : 'text-amber-800'
                }`}>
                  {order.customer_confirmed
                    ? 'Thank you for confirming receipt! Enjoy your delicious Snad Kitchen meal.'
                    : order.status === 'delivered'
                    ? 'Your rider has arrived and marked the meal delivered! Click below to confirm receipt.'
                    : 'Your rider is currently delivering your meal. Once the rider marks the order as delivered at your door, this confirmation button will activate.'}
                </p>
                {!order.customer_confirmed && (
                  <button
                    onClick={handleConfirmReceipt}
                    disabled={order.status !== 'delivered' || confirming}
                    className={`font-black px-8 py-3.5 rounded-2xl text-sm transition inline-flex items-center gap-2 ${
                      order.status === 'delivered'
                        ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-200 cursor-pointer scale-105 animate-pulse'
                        : 'bg-gray-200 text-gray-400 cursor-not-allowed opacity-75'
                    }`}
                  >
                    <CheckCircle2 className="w-5 h-5" />
                    <span>
                      {confirming
                        ? 'Updating Status...'
                        : order.status === 'delivered'
                        ? 'Confirm I Received My Meal 😋'
                        : 'Awaiting Rider Delivery...'}
                    </span>
                  </button>
                )}
              </div>
            )}

            {/* Customer & Address Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-gray-50 rounded-2xl p-4 text-xs font-semibold">
              <div>
                <span className="text-gray-400 uppercase tracking-wider block mb-1">Customer Name</span>
                <span className="text-gray-900 text-sm font-bold">{order.user?.name || 'Campus Student/Staff'}</span>
              </div>
              <div>
                <span className="text-gray-400 uppercase tracking-wider block mb-1">Delivery / Pickup Spot</span>
                <div className="flex items-center gap-1.5 text-gray-900 text-sm font-bold">
                  <MapPin className="w-4 h-4 text-orange-500 shrink-0" />
                  <span>
                    {order.delivery_type === 'pickup'
                      ? 'Self Pickup at Snad Kitchen Counter'
                      : order.special_instructions || 'JOSTUM Campus Delivery'}
                  </span>
                </div>
              </div>
            </div>

            {/* Items Summary */}
            <div>
              <h3 className="text-sm font-black text-gray-900 uppercase tracking-wider mb-4 flex items-center gap-2">
                <Package className="w-4 h-4 text-orange-500" /> Meal Items
              </h3>
              <div className="space-y-3 divide-y divide-gray-50">
                {order.items?.map((item: any) => (
                  <div key={item.id} className="pt-3 flex justify-between items-center text-sm">
                    <div>
                      <span className="font-black text-gray-900">{item.quantity}x</span>{' '}
                      <span className="font-semibold text-gray-800">{item.food?.name}</span>
                    </div>
                    <span className="font-black text-gray-900">
                      ₦{(parseFloat(item.unit_price) * item.quantity).toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>

              <div className="mt-6 border-t border-gray-100 pt-4 space-y-2 text-xs font-semibold">
                <div className="flex justify-between text-gray-500">
                  <span>Subtotal</span>
                  <span>₦{parseFloat(order.subtotal || 0).toLocaleString()}</span>
                </div>

                {order.discount_amount > 0 && (
                  <div className="flex justify-between text-green-600 font-bold">
                    <span>Discount ({order.coupon_code})</span>
                    <span>-₦{parseFloat(order.discount_amount).toLocaleString()}</span>
                  </div>
                )}

                <div className="flex justify-between text-gray-500">
                  <span>Delivery Fee</span>
                  <span>₦{parseFloat(order.delivery_fee || 0).toLocaleString()}</span>
                </div>

                <div className="flex justify-between text-base font-black text-orange-600 pt-2 border-t border-gray-100">
                  <span>Total Amount Paid</span>
                  <span>₦{parseFloat(order.total_amount).toLocaleString()}</span>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
