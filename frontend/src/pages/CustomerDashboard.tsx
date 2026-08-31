import { useState, useEffect } from 'react';
import {
  Package,
  Clock,
  Utensils,
  Loader2,
  RotateCcw,
  MapPin,
  Star,
  ArrowRight,
  CheckCircle2,
  MessageSquare,
  XCircle,
  Edit3,
  DollarSign,
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/axios';
import { useAuthStore } from '@/store/useAuthStore';
import { useCartStore } from '@/store/useCartStore';
import toast from 'react-hot-toast';
import Pagination from '@/components/common/Pagination';

interface OrderItem {
  id: number;
  food_id: number;
  quantity: number;
  unit_price: string;
  food: { id: number; name: string };
}

interface Order {
  id: number;
  order_number: string;
  total_amount: string;
  status: string;
  customer_confirmed?: boolean;
  created_at: string;
  items: OrderItem[];
  special_instructions?: string;
  cancellation_reason?: string;
  refund_status?: 'none' | 'requested' | 'approved' | 'refunded' | 'rejected';
  refund_reason?: string;
  refund_account_details?: string;
  payment?: { status: string; payment_method: string };
  rider?: { name: string; phone: string };
}

interface CampusLocation {
  id: string;
  name: string;
  details: string;
  phone: string;
}

const PAST_ITEMS_PER_PAGE = 5;

export default function CustomerDashboard() {
  const user = useAuthStore((state) => state.user);
  const addItem = useCartStore((state) => state.addItem);
  const navigate = useNavigate();
  const [pastPage, setPastPage] = useState(1);
  const queryClient = useQueryClient();

  // Auto-redirect staff roles to their respective dashboards
  useEffect(() => {
    if (user?.role === 'rider') navigate('/rider', { replace: true });
    else if (user?.role === 'kitchen') navigate('/kitchen', { replace: true });
    else if (user?.role === 'admin') navigate('/admin', { replace: true });
  }, [user, navigate]);

  // Saved campus locations
  const [locations, setLocations] = useState<CampusLocation[]>(() => {
    try {
      const saved = localStorage.getItem('snad_saved_locations');
      return saved
        ? JSON.parse(saved)
        : [
            { id: '1', name: 'Hostel Block B', details: 'Room 204, Male Hostel B', phone: user?.phone || '' },
            { id: '2', name: 'Faculty Office', details: 'Faculty of Engineering, Rm 102', phone: user?.phone || '' },
          ];
    } catch {
      return [];
    }
  });

  const [newLocName, setNewLocName] = useState('');
  const [newLocDetails, setNewLocDetails] = useState('');
  const [newLocPhone, setNewLocPhone] = useState('');

  // Modals state
  const [selectedOrderForReview, setSelectedOrderForReview] = useState<Order | null>(null);
  const [reviewFoodId, setReviewFoodId] = useState<number | null>(null);
  const [rating, setRating] = useState<number>(5);
  const [comment, setComment] = useState<string>('');
  const [submittingReview, setSubmittingReview] = useState<boolean>(false);

  // Cancellation Modal state
  const [selectedOrderForCancel, setSelectedOrderForCancel] = useState<Order | null>(null);
  const [cancelReason, setCancelReason] = useState<string>('Changed my mind');
  const [customCancelReason, setCustomCancelReason] = useState<string>('');
  const [bankDetails, setBankDetails] = useState<string>('');
  const [cancelling, setCancelling] = useState<boolean>(false);

  // Refund Modal state
  const [selectedOrderForRefund, setSelectedOrderForRefund] = useState<Order | null>(null);
  const [refundReasonText, setRefundReasonText] = useState<string>('');
  const [refundBankDetailsText, setRefundBankDetailsText] = useState<string>('');
  const [requestingRefund, setRequestingRefund] = useState<boolean>(false);

  // Edit Note Modal state
  const [selectedOrderForNotes, setSelectedOrderForNotes] = useState<Order | null>(null);
  const [notesText, setNotesText] = useState<string>('');
  const [updatingNotes, setUpdatingNotes] = useState<boolean>(false);

  const saveLocation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLocName || !newLocDetails) return;
    const newLoc: CampusLocation = {
      id: Date.now().toString(),
      name: newLocName,
      details: newLocDetails,
      phone: newLocPhone || user?.phone || '',
    };
    const updated = [...locations, newLoc];
    setLocations(updated);
    localStorage.setItem('snad_saved_locations', JSON.stringify(updated));
    setNewLocName('');
    setNewLocDetails('');
    setNewLocPhone('');
    toast.success('Campus location saved!');
  };

  const removeLocation = (id: string) => {
    const updated = locations.filter((l) => l.id !== id);
    setLocations(updated);
    localStorage.setItem('snad_saved_locations', JSON.stringify(updated));
    toast.success('Location removed');
  };

  const handleReorder = (order: Order) => {
    order.items.forEach((item) => {
      addItem({
        food_id: item.food?.id || item.food_id || 0,
        name: item.food?.name || 'Meal Item',
        price: Number(item.unit_price),
        quantity: item.quantity,
      });
    });
    toast.success('1-Click Reorder: All items added to cart!');
    navigate('/checkout');
  };

  const { data: orders, isLoading } = useQuery({
    queryKey: ['myOrders'],
    queryFn: async () => {
      const res = await api.get('/orders');
      return res.data as Order[];
    },
    refetchInterval: 20000,
  });

  const confirmDeliveryMutation = useMutation({
    mutationFn: async (orderId: number) => {
      return api.put(`/orders/${orderId}`, { status: 'delivered' });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myOrders'] });
      toast.success('Order confirmed as received! Enjoy your meal 😋');
    },
    onError: () => {
      toast.error('Failed to confirm delivery receipt');
    },
  });

  // Handle Order Cancellation
  const handleCancelOrderSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrderForCancel) return;

    const finalReason = cancelReason === 'Other' ? customCancelReason : cancelReason;
    if (!finalReason.trim()) {
      toast.error('Please specify a cancellation reason');
      return;
    }

    try {
      setCancelling(true);
      await api.post(`/orders/${selectedOrderForCancel.id}/cancel`, {
        cancellation_reason: finalReason,
        refund_account_details: bankDetails.trim(),
      });

      toast.success('Order cancelled successfully.');
      queryClient.invalidateQueries({ queryKey: ['myOrders'] });
      setSelectedOrderForCancel(null);
      setCustomCancelReason('');
      setBankDetails('');
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to cancel order.');
    } finally {
      setCancelling(false);
    }
  };

  // Handle Refund Request Submit
  const handleRefundSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrderForRefund) return;
    if (!refundReasonText.trim() || !refundBankDetailsText.trim()) {
      toast.error('Please fill in both the refund reason and bank account payout details');
      return;
    }

    try {
      setRequestingRefund(true);
      await api.post(`/orders/${selectedOrderForRefund.id}/refund`, {
        refund_reason: refundReasonText.trim(),
        refund_account_details: refundBankDetailsText.trim(),
      });

      toast.success('Refund request submitted successfully!');
      queryClient.invalidateQueries({ queryKey: ['myOrders'] });
      setSelectedOrderForRefund(null);
      setRefundReasonText('');
      setRefundBankDetailsText('');
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to submit refund request');
    } finally {
      setRequestingRefund(false);
    }
  };

  // Handle Note Update Submit
  const handleNoteUpdateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrderForNotes) return;

    try {
      setUpdatingNotes(true);
      await api.put(`/orders/${selectedOrderForNotes.id}/notes`, {
        special_instructions: notesText.trim(),
      });

      toast.success('Order notes updated!');
      queryClient.invalidateQueries({ queryKey: ['myOrders'] });
      setSelectedOrderForNotes(null);
      setNotesText('');
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to update order notes.');
    } finally {
      setUpdatingNotes(false);
    }
  };

  const submitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrderForReview || !reviewFoodId) return;

    setSubmittingReview(true);
    try {
      await api.post('/reviews', {
        order_id: selectedOrderForReview.id,
        food_id: reviewFoodId,
        rating,
        comment,
      });
      toast.success('Thank you for rating your meal!');
      setSelectedOrderForReview(null);
      setComment('');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to submit review');
    } finally {
      setSubmittingReview(false);
    }
  };

  const activeOrders = orders?.filter((o) => !['cancelled', 'rejected', 'returned'].includes(o.status) && !(o.status === 'delivered' && Boolean(o.customer_confirmed))) || [];
  const pastOrders = orders?.filter((o) => ['cancelled', 'rejected', 'returned'].includes(o.status) || (o.status === 'delivered' && Boolean(o.customer_confirmed))) || [];

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-16">
      {/* Hero Welcome Banner */}
      <div className="bg-gradient-to-r from-orange-500 via-amber-500 to-red-500 rounded-3xl p-5 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10">
          <h2 className="text-2xl sm:text-4xl font-black mb-1.5 pt-1">Welcome back, {user?.name}!</h2>
          <p className="text-orange-100 max-w-xl text-xs sm:text-base mb-5 font-medium">
            {activeOrders.length > 0
              ? `You currently have ${activeOrders.length} active meal order(s) being prepared or delivered on campus.`
              : 'Craving something hot & delicious? Order your favourite campus meals right now.'}
          </p>
          <div className="flex items-center justify-center sm:justify-start gap-3 sm:gap-4 flex-nowrap whitespace-nowrap overflow-x-auto no-scrollbar py-1">
            <Link
              to="/menu"
              className="bg-white text-orange-600 px-5 sm:px-8 py-3 sm:py-4 rounded-2xl font-black shadow-xl hover:bg-orange-50 hover:scale-105 transition-all duration-200 inline-flex items-center space-x-2.5 text-sm sm:text-lg whitespace-nowrap shrink-0"
            >
              <Utensils className="w-5 h-5 sm:w-6 sm:h-6 text-orange-600" />
              <span>Browse Menu</span>
            </Link>
            {activeOrders.length > 0 && (
              <Link
                to={`/track?order_number=${activeOrders[0].order_number}`}
                className="bg-black/30 backdrop-blur-md hover:bg-black/40 text-white px-5 sm:px-8 py-3 sm:py-4 rounded-2xl font-bold border border-white/20 hover:scale-105 transition-all duration-200 inline-flex items-center space-x-2.5 text-sm sm:text-lg whitespace-nowrap shrink-0"
              >
                <Clock className="w-5 h-5 sm:w-6 sm:h-6" />
                <span>Track Order</span>
              </Link>
            )}
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
        </div>
      ) : (
        <>
          {/* Active Orders Section */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-black text-gray-900 flex items-center gap-2">
                <Clock className="w-5 h-5 text-orange-500" /> Active Campus Orders
              </h3>
              {activeOrders.length > 0 && (
                <span className="bg-orange-100 text-orange-700 font-extrabold text-xs px-3 py-1 rounded-full">
                  {activeOrders.length} Live
                </span>
              )}
            </div>

            {activeOrders.length === 0 ? (
              <div className="bg-white rounded-3xl p-8 border border-gray-100 text-center shadow-sm">
                <CheckCircle2 className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                <p className="text-gray-600 font-bold text-base">No active orders right now.</p>
                <p className="text-gray-400 text-xs mt-1">Ready for breakfast, lunch, or dinner? Order from Snad Kitchen.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {activeOrders.map((order) => (
                  <div
                    key={order.id}
                    className="bg-white border-2 border-orange-200 rounded-3xl p-6 shadow-md flex flex-col gap-4"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 pb-4">
                      <div>
                        <span className="text-[10px] text-gray-400 font-extrabold uppercase tracking-wider block">ORDER NUMBER</span>
                        <span className="font-black text-gray-900 text-base sm:text-lg">{order.order_number}</span>
                      </div>
                      <div className="flex items-center gap-1.5 sm:gap-2 flex-nowrap whitespace-nowrap overflow-x-auto no-scrollbar shrink-0 py-0.5">
                        <span className="text-[10px] sm:text-xs font-black bg-orange-500 text-white px-2.5 sm:px-3 py-1.5 rounded-full uppercase tracking-wider whitespace-nowrap shrink-0">
                          {order.status.replace(/_/g, ' ')}
                        </span>

                        {['pending', 'confirmed'].includes(order.status) && (
                          <button
                            onClick={() => setSelectedOrderForCancel(order)}
                            className="bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 px-2.5 sm:px-3 py-1.5 rounded-xl text-[10px] sm:text-xs font-bold transition flex items-center gap-1 whitespace-nowrap shrink-0"
                          >
                            <XCircle className="w-3.5 h-3.5" />
                            <span>Cancel</span>
                          </button>
                        )}

                        <Link
                          to={`/track?order_number=${order.order_number}`}
                          className="bg-gray-900 hover:bg-black text-white px-3 sm:px-4 py-1.5 rounded-xl text-[10px] sm:text-xs font-bold transition flex items-center gap-1 whitespace-nowrap shrink-0"
                        >
                          <span>Live Track</span> <ArrowRight className="w-3.5 h-3.5" />
                        </Link>
                      </div>
                    </div>

                    <ul className="space-y-2">
                      {order.items.map((item, idx) => (
                        <li key={idx} className="flex justify-between items-center text-sm font-medium text-gray-700">
                          <span>
                            <strong className="text-gray-900">{item.quantity}x</strong> {item.food?.name}
                          </span>
                          <span className="font-bold text-gray-900">
                            ₦{(Number(item.unit_price) * item.quantity).toLocaleString()}
                          </span>
                        </li>
                      ))}
                    </ul>

                    {/* Special Instructions Note Display & Edit */}
                    <div className="p-3 bg-gray-50 rounded-2xl text-xs border border-gray-100 flex items-center justify-between">
                      <div className="text-gray-600">
                        <strong className="text-gray-800">Order Note / Special Instructions:</strong>{' '}
                        {order.special_instructions || 'None provided.'}
                      </div>
                      {order.status === 'pending' && (
                        <button
                          onClick={() => {
                            setSelectedOrderForNotes(order);
                            setNotesText(order.special_instructions || '');
                          }}
                          className="text-orange-600 font-bold hover:underline flex items-center gap-1 text-xs shrink-0 ml-2"
                        >
                          <Edit3 className="w-3.5 h-3.5" /> Edit
                        </button>
                      )}
                    </div>

                    {order.rider && (
                      <div className="p-3 bg-blue-50 border border-blue-100 rounded-2xl text-xs flex items-center justify-between">
                        <div>
                          <span className="font-bold text-blue-900 block">Assigned Rider: {order.rider.name}</span>
                          <span className="text-blue-700 font-semibold">{order.rider.phone}</span>
                        </div>
                        <a
                          href={`tel:${order.rider.phone}`}
                          className="bg-blue-600 hover:bg-blue-700 text-white px-3.5 py-1.5 rounded-xl font-bold transition"
                        >
                          Call Rider
                        </a>
                      </div>
                    )}

                    {(order.status === 'out_for_delivery' || order.status === 'delivered') && (
                      <button
                        onClick={() => confirmDeliveryMutation.mutate(order.id)}
                        disabled={order.status !== 'delivered' || confirmDeliveryMutation.isPending}
                        className={`w-full font-bold py-3 rounded-2xl transition flex items-center justify-center gap-2 text-sm ${
                          order.status === 'delivered'
                            ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-200 cursor-pointer'
                            : 'bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200'
                        }`}
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        <span>
                          {order.status === 'delivered'
                            ? 'I Have Received My Meal 😋'
                            : 'Awaiting Rider Delivery (Rider must mark delivered first)'}
                        </span>
                      </button>
                    )}

                    <div className="flex items-center justify-between border-t border-gray-100 pt-3">
                      <span className="text-xs text-gray-500 font-semibold">Total Amount Paid</span>
                      <span className="text-xl font-black text-orange-600">
                        ₦{Number(order.total_amount).toLocaleString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Past Orders Section with 1-Click Reorder, Review & Refund Status */}
          <div>
            <h3 className="text-xl font-black text-gray-900 mb-4 flex items-center gap-2">
              <Package className="w-5 h-5 text-gray-500" /> Past Order History & Refunds
            </h3>
            {pastOrders.length === 0 ? (
              <div className="bg-white rounded-3xl p-6 border border-gray-100 text-center text-gray-500 text-sm">
                No past completed or cancelled orders yet.
              </div>
            ) : (
              <div className="bg-white border border-gray-100 rounded-3xl shadow-sm overflow-hidden divide-y divide-gray-100">
                {pastOrders
                  .slice((pastPage - 1) * PAST_ITEMS_PER_PAGE, pastPage * PAST_ITEMS_PER_PAGE)
                  .map((order) => (
                    <div key={order.id} className="p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-3 flex-wrap">
                          <span className="font-bold text-gray-900">{order.order_number}</span>
                          <span
                            className={`text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-md ${
                              order.status === 'delivered'
                                ? 'bg-green-100 text-green-700'
                                : 'bg-red-100 text-red-700'
                            }`}
                          >
                            {order.status}
                          </span>

                          {/* Refund Status Pill */}
                          {order.refund_status && order.refund_status !== 'none' && (
                            <span
                              className={`text-[10px] font-black uppercase px-2.5 py-0.5 rounded-md flex items-center gap-1 ${
                                order.refund_status === 'refunded'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : order.refund_status === 'requested'
                                  ? 'bg-amber-100 text-amber-800 animate-pulse'
                                  : order.refund_status === 'approved'
                                  ? 'bg-blue-100 text-blue-800'
                                  : 'bg-gray-100 text-gray-600'
                              }`}
                            >
                              <DollarSign className="w-3 h-3" /> Refund: {order.refund_status}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-gray-500">
                          {new Date(order.created_at).toLocaleDateString()} • {order.items.length} item(s)
                        </p>
                        {order.cancellation_reason && (
                          <p className="text-xs text-red-600 font-medium">Reason: {order.cancellation_reason}</p>
                        )}
                      </div>

                      <div className="flex items-center gap-3 justify-between sm:justify-end flex-wrap">
                        <div className="text-right">
                          <span className="text-xs text-gray-400 block font-medium">Total</span>
                          <span className="text-base font-black text-gray-900">
                            ₦{Number(order.total_amount).toLocaleString()}
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          {/* Request Refund button for cancelled/rejected paid orders */}
                          {['cancelled', 'rejected'].includes(order.status) && (
                            <>
                              {(!order.refund_status || order.refund_status === 'none') && (
                                <button
                                  onClick={() => {
                                    setSelectedOrderForRefund(order);
                                    setRefundReasonText(order.cancellation_reason || '');
                                  }}
                                  className="bg-amber-500 hover:bg-amber-600 text-white px-3.5 py-2 rounded-2xl font-bold text-xs flex items-center gap-1 transition shadow-sm"
                                >
                                  <DollarSign className="w-4 h-4" />
                                  <span>Request Refund</span>
                                </button>
                              )}

                              {order.refund_status === 'requested' && (
                                <button
                                  disabled
                                  className="bg-amber-100 text-amber-800 border border-amber-300 font-bold px-3 py-1.5 rounded-2xl text-xs cursor-not-allowed opacity-90 flex items-center gap-1 shrink-0"
                                >
                                  <Clock className="w-3.5 h-3.5 text-amber-600" />
                                  <span>Refund Pending</span>
                                </button>
                              )}

                              {order.refund_status === 'approved' && (
                                <button
                                  disabled
                                  className="bg-blue-100 text-blue-800 border border-blue-300 font-bold px-3 py-1.5 rounded-2xl text-xs cursor-not-allowed opacity-90 flex items-center gap-1 shrink-0"
                                >
                                  <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />
                                  <span>Refund Approved</span>
                                </button>
                              )}

                              {order.refund_status === 'refunded' && (
                                <button
                                  disabled
                                  className="bg-emerald-100 text-emerald-800 border border-emerald-300 font-extrabold px-3 py-1.5 rounded-2xl text-xs cursor-not-allowed flex items-center gap-1 shrink-0"
                                >
                                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                  <span>Refunded 🟢</span>
                                </button>
                              )}
                            </>
                          )}

                          {order.status === 'delivered' && (
                            <>
                              {order.items.length > 0 && (
                                <button
                                  onClick={() => {
                                    setSelectedOrderForReview(order);
                                    setReviewFoodId(order.items[0].food?.id || order.items[0].food_id);
                                  }}
                                  className="p-2.5 bg-amber-50 text-amber-600 hover:bg-amber-100 rounded-2xl font-bold text-xs flex items-center gap-1 transition"
                                  title="Write Review"
                                >
                                  <Star className="w-4 h-4 fill-amber-400" />
                                  <span className="hidden sm:inline">Rate</span>
                                </button>
                              )}

                              <button
                                onClick={() => handleReorder(order)}
                                className="bg-orange-50 hover:bg-orange-500 text-orange-600 hover:text-white px-4 py-2.5 rounded-2xl font-bold text-xs flex items-center gap-2 transition"
                              >
                                <RotateCcw className="w-4 h-4" />
                                <span>1-Click Reorder</span>
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                <Pagination
                  currentPage={pastPage}
                  totalPages={Math.ceil(pastOrders.length / PAST_ITEMS_PER_PAGE)}
                  onPageChange={(page) => setPastPage(page)}
                  totalItems={pastOrders.length}
                  itemsPerPage={PAST_ITEMS_PER_PAGE}
                />
              </div>
            )}
          </div>

          {/* Saved Campus Locations */}
          <div>
            <h3 className="text-xl font-black text-gray-900 mb-4 flex items-center gap-2">
              <MapPin className="w-5 h-5 text-orange-500" /> Saved Campus Locations
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              {locations.map((loc) => (
                <div key={loc.id} className="bg-white border border-gray-200 rounded-3xl p-5 shadow-sm relative group">
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-xs font-extrabold text-orange-600 uppercase tracking-wider block mb-1">
                        {loc.name}
                      </span>
                      <p className="text-sm font-bold text-gray-900">{loc.details}</p>
                      {loc.phone && <p className="text-xs text-gray-500 mt-1 font-medium">Contact: {loc.phone}</p>}
                    </div>
                    <button
                      onClick={() => removeLocation(loc.id)}
                      className="text-xs text-gray-400 hover:text-red-500 font-bold p-1"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Add New Location Form */}
            <form onSubmit={saveLocation} className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm space-y-4">
              <h4 className="text-sm font-bold text-gray-900 uppercase tracking-wider">Add New JOSTUM Location</h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <input
                  type="text"
                  placeholder="Location Tag (e.g. Hostel B, Dean Office)"
                  value={newLocName}
                  onChange={(e) => setNewLocName(e.target.value)}
                  className="p-3 rounded-2xl border border-gray-200 text-sm focus:ring-2 focus:ring-orange-500 focus:outline-none"
                  required
                />
                <input
                  type="text"
                  placeholder="Full Address / Building / Room Number"
                  value={newLocDetails}
                  onChange={(e) => setNewLocDetails(e.target.value)}
                  className="p-3 rounded-2xl border border-gray-200 text-sm focus:ring-2 focus:ring-orange-500 focus:outline-none"
                  required
                />
                <input
                  type="tel"
                  placeholder="Contact Phone Number"
                  value={newLocPhone}
                  onChange={(e) => setNewLocPhone(e.target.value)}
                  className="p-3 rounded-2xl border border-gray-200 text-sm focus:ring-2 focus:ring-orange-500 focus:outline-none"
                />
              </div>
              <button
                type="submit"
                className="bg-gray-900 hover:bg-black text-white px-6 py-3 rounded-2xl font-bold text-sm transition"
              >
                Save Location
              </button>
            </form>
          </div>
        </>
      )}

      {/* Cancel Order Modal */}
      {selectedOrderForCancel && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h3 className="text-lg font-black text-red-600 flex items-center gap-2">
                <XCircle className="w-5 h-5" /> Cancel Order #{selectedOrderForCancel.order_number}
              </h3>
              <button onClick={() => setSelectedOrderForCancel(null)} className="text-gray-400 hover:text-gray-600 font-bold">
                ✕
              </button>
            </div>

            <form onSubmit={handleCancelOrderSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                  Select Reason for Cancellation
                </label>
                <select
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  className="w-full p-3 rounded-2xl border border-gray-200 font-semibold text-sm focus:ring-2 focus:ring-red-500 focus:outline-none"
                >
                  <option value="Changed my mind">Changed my mind</option>
                  <option value="Ordered wrong meal by mistake">Ordered wrong meal by mistake</option>
                  <option value="Delivery duration is too long">Delivery duration is too long</option>
                  <option value="Emergency on campus">Emergency on campus</option>
                  <option value="Other">Other (Specify below)</option>
                </select>
              </div>

              {cancelReason === 'Other' && (
                <div>
                  <textarea
                    rows={2}
                    value={customCancelReason}
                    onChange={(e) => setCustomCancelReason(e.target.value)}
                    placeholder="Specify why you are cancelling..."
                    className="w-full p-3 rounded-2xl border border-gray-200 text-sm focus:ring-2 focus:ring-red-500 focus:outline-none"
                    required
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1 flex items-center gap-1">
                  <DollarSign className="w-4 h-4 text-emerald-600" /> Refund Account Payout Details
                </label>
                <p className="text-[11px] text-gray-400 mb-2">
                  If you paid online via Paystack/Card, provide your Bank Name, Account Number & Account Name for refund transfer.
                </p>
                <input
                  type="text"
                  placeholder="E.g. GTBank, 0123456789, John Doe"
                  value={bankDetails}
                  onChange={(e) => setBankDetails(e.target.value)}
                  className="w-full p-3 rounded-2xl border border-gray-200 text-sm focus:ring-2 focus:ring-red-500 focus:outline-none font-medium"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedOrderForCancel(null)}
                  className="px-5 py-2.5 rounded-2xl font-bold text-gray-500 hover:bg-gray-100 text-sm"
                >
                  Keep Order
                </button>
                <button
                  type="submit"
                  disabled={cancelling}
                  className="bg-red-600 hover:bg-red-700 text-white px-6 py-2.5 rounded-2xl font-bold text-sm shadow-md transition flex items-center gap-2"
                >
                  {cancelling && <Loader2 className="w-4 h-4 animate-spin" />}
                  <span>Confirm Cancellation</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Request Refund Modal */}
      {selectedOrderForRefund && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h3 className="text-lg font-black text-amber-600 flex items-center gap-2">
                <DollarSign className="w-5 h-5" /> Request Refund for #{selectedOrderForRefund.order_number}
              </h3>
              <button onClick={() => setSelectedOrderForRefund(null)} className="text-gray-400 hover:text-gray-600 font-bold">
                ✕
              </button>
            </div>

            <form onSubmit={handleRefundSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Reason for Refund</label>
                <textarea
                  rows={2}
                  value={refundReasonText}
                  onChange={(e) => setRefundReasonText(e.target.value)}
                  placeholder="Explain why a refund is requested..."
                  className="w-full p-3 rounded-2xl border border-gray-200 text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                  Bank Account Payout Details
                </label>
                <input
                  type="text"
                  value={refundBankDetailsText}
                  onChange={(e) => setRefundBankDetailsText(e.target.value)}
                  placeholder="E.g., Zenith Bank, 2211004455, Yakubu Musa"
                  className="w-full p-3 rounded-2xl border border-gray-200 text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none font-medium"
                  required
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedOrderForRefund(null)}
                  className="px-5 py-2.5 rounded-2xl font-bold text-gray-500 hover:bg-gray-100 text-sm"
                >
                  Close
                </button>
                <button
                  type="submit"
                  disabled={requestingRefund}
                  className="bg-amber-500 hover:bg-amber-600 text-white px-6 py-2.5 rounded-2xl font-bold text-sm shadow-md transition flex items-center gap-2"
                >
                  {requestingRefund && <Loader2 className="w-4 h-4 animate-spin" />}
                  <span>Submit Refund Request</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Order Note Modal */}
      {selectedOrderForNotes && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h3 className="text-lg font-black text-gray-900 flex items-center gap-2">
                <Edit3 className="w-5 h-5 text-orange-500" /> Edit Order Instructions
              </h3>
              <button onClick={() => setSelectedOrderForNotes(null)} className="text-gray-400 hover:text-gray-600 font-bold">
                ✕
              </button>
            </div>

            <form onSubmit={handleNoteUpdateSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                  Special Instructions / Kitchen Notes
                </label>
                <textarea
                  rows={3}
                  value={notesText}
                  onChange={(e) => setNotesText(e.target.value)}
                  placeholder="E.g., Please make pepper soup extra spicy, deliver at Male Hostel B entrance..."
                  className="w-full p-3 rounded-2xl border border-gray-200 text-sm focus:ring-2 focus:ring-orange-500 focus:outline-none"
                  required
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedOrderForNotes(null)}
                  className="px-5 py-2.5 rounded-2xl font-bold text-gray-500 hover:bg-gray-100 text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updatingNotes}
                  className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-2.5 rounded-2xl font-bold text-sm shadow-md transition flex items-center gap-2"
                >
                  {updatingNotes && <Loader2 className="w-4 h-4 animate-spin" />}
                  <span>Save Notes</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Review Modal */}
      {selectedOrderForReview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h3 className="text-lg font-black text-gray-900 flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-amber-500" /> Rate Meal
              </h3>
              <button onClick={() => setSelectedOrderForReview(null)} className="text-gray-400 hover:text-gray-600 font-bold">
                ✕
              </button>
            </div>

            <form onSubmit={submitReview} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                  Select Meal to Review
                </label>
                <select
                  value={reviewFoodId || ''}
                  onChange={(e) => setReviewFoodId(Number(e.target.value))}
                  className="w-full p-3 rounded-2xl border border-gray-200 text-sm font-semibold focus:ring-2 focus:ring-orange-500 focus:outline-none"
                >
                  {selectedOrderForReview.items.map((item) => (
                    <option key={item.id} value={item.food?.id || item.food_id}>
                      {item.food?.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Rating</label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      className={`p-3 rounded-2xl border flex-1 flex items-center justify-center ${
                        rating >= star ? 'bg-amber-50 border-amber-400 text-amber-500' : 'border-gray-200 text-gray-300'
                      }`}
                    >
                      <Star className="w-5 h-5 fill-current" />
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                  Your Feedback (Optional)
                </label>
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="How was the food quality, packaging and speed?"
                  rows={3}
                  className="w-full p-3 rounded-2xl border border-gray-200 text-sm focus:ring-2 focus:ring-orange-500 focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedOrderForReview(null)}
                  className="px-5 py-2.5 rounded-2xl font-bold text-gray-500 hover:bg-gray-100 text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingReview}
                  className="bg-amber-500 hover:bg-amber-600 text-white px-6 py-2.5 rounded-2xl font-bold text-sm shadow-md transition"
                >
                  {submittingReview ? 'Submitting...' : 'Submit Review'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
