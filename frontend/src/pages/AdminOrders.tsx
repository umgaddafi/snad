import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Search,
  Loader2,
  Bike,
  Phone,
  Volume2,
  Eye,
  X,
  User as UserIcon,
  MapPin,
  CreditCard,
  Calendar,
  ShoppingBag,
  Clock,
  DollarSign,
  CheckCircle2,
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '@/lib/axios';
import { playFemaleVoiceNotification } from '@/lib/sound';
import Pagination from '@/components/common/Pagination';

interface OrderItem {
  id: number;
  quantity: number;
  unit_price?: string;
  customizations?: any;
  food: { id: number; name: string; price?: number; image_url?: string };
}

interface User {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  role: string;
}

interface Order {
  id: number;
  order_number: string;
  user: { name: string; email: string; phone: string | null };
  delivery_type?: string;
  subtotal?: string;
  discount_amount?: string;
  coupon_code?: string | null;
  delivery_fee?: string;
  total_amount: string;
  status: string;
  payment_method?: string;
  payment_reference?: string | null;
  special_instructions?: string | null;
  cancellation_reason?: string | null;
  refund_status?: 'none' | 'requested' | 'approved' | 'refunded' | 'rejected';
  refund_reason?: string | null;
  refund_account_details?: string | null;
  rider_id: number | null;
  rider?: { id: number; name: string; phone: string | null };
  created_at: string;
  items: OrderItem[];
}

const ITEMS_PER_PAGE = 10;

export default function AdminOrders() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  const { data: orders, isLoading } = useQuery({
    queryKey: ['adminOrders'],
    queryFn: async () => {
      const res = await api.get('/orders');
      return res.data as Order[];
    },
    refetchInterval: 30000,
  });

  const { data: users } = useQuery({
    queryKey: ['adminUsers'],
    queryFn: async () => {
      const res = await api.get('/users');
      return res.data as User[];
    },
  });

  const registeredRiders = users?.filter((u) => u.role === 'rider') || [];

  const updateOrderMutation = useMutation({
    mutationFn: async ({
      id,
      status,
      rider_id,
    }: {
      id: number;
      status?: string;
      rider_id?: number | null;
    }) => {
      return api.put(`/orders/${id}`, { status, rider_id });
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['adminOrders'] });
      toast.success('Order updated successfully!');

      if (selectedOrder && selectedOrder.id === variables.id) {
        setSelectedOrder((prev) =>
          prev
            ? {
                ...prev,
                status: variables.status !== undefined ? variables.status : prev.status,
                rider_id: variables.rider_id !== undefined ? variables.rider_id : prev.rider_id,
                rider:
                  variables.rider_id !== undefined
                    ? registeredRiders.find((r) => r.id === variables.rider_id)
                    : prev.rider,
              }
            : null
        );
      }

      if (variables.status === 'out_for_delivery') {
        playFemaleVoiceNotification('Order is now out for delivery with the assigned rider.');
      } else if (variables.status === 'delivered') {
        playFemaleVoiceNotification('Order has been successfully delivered to the customer.');
      }
    },
    onError: () => {
      toast.error('Failed to update order status');
    },
  });

  const processRefundMutation = useMutation({
    mutationFn: async ({ id, refund_status }: { id: number; refund_status: string }) => {
      return api.post(`/orders/${id}/process-refund`, { refund_status });
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['adminOrders'] });
      toast.success('Refund status updated successfully!');
      if (selectedOrder && selectedOrder.id === variables.id) {
        setSelectedOrder((prev) => (prev ? { ...prev, refund_status: variables.refund_status as any } : null));
      }
    },
    onError: () => {
      toast.error('Failed to update refund status');
    },
  });

  const filteredOrders =
    orders?.filter(
      (order) =>
        order.order_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (order.user?.name || '').toLowerCase().includes(searchTerm.toLowerCase())
    ) || [];

  const totalPages = Math.ceil(filteredOrders.length / ITEMS_PER_PAGE);
  const paginatedOrders = filteredOrders.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  return (
    <div className="space-y-6 pb-12">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-black text-gray-900">All Orders & Rider Handover</h2>
          <p className="text-sm text-gray-500 font-medium">
            Manage live orders, inspect detailed receipts, assign riders, and update progress
          </p>
        </div>
        <div className="flex items-center space-x-3 w-full sm:w-auto">
          <button
            onClick={() =>
              playFemaleVoiceNotification('Testing voice notification for Snad Kitchen dashboards.')
            }
            className="flex items-center space-x-2 text-xs bg-orange-100 hover:bg-orange-200 text-orange-800 font-bold px-3.5 py-2.5 rounded-2xl transition shrink-0"
            title="Test Voice Alert"
          >
            <Volume2 className="w-4 h-4 text-orange-600" />
            <span>Test Voice</span>
          </button>
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-3.5 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search order ID or customer..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-2xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white"
            />
          </div>
        </div>
      </div>

      {/* Orders Table Card */}
      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-gray-50 border-b border-gray-100 text-xs font-extrabold uppercase tracking-wider text-gray-500">
              <tr>
                <th className="px-6 py-4">Order ID</th>
                <th className="px-6 py-4">Customer</th>
                <th className="px-6 py-4">Ordered Items</th>
                <th className="px-6 py-4">Total Amount</th>
                <th className="px-6 py-4">Assigned Rider</th>
                {/* Generous min-width for Status column so it's not squeezed */}
                <th className="px-6 py-4 min-w-[180px]">Order Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 text-sm font-medium">
              {isLoading && (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-gray-500">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-orange-500" /> Loading orders...
                  </td>
                </tr>
              )}
              {paginatedOrders?.map((order) => (
                <tr key={order.id} className="hover:bg-gray-50/70 transition">
                  <td className="px-6 py-4 font-black text-gray-900">{order.order_number}</td>
                  <td className="px-6 py-4 text-gray-900">
                    <div className="font-bold">{order.user?.name || 'Guest'}</div>
                    <div className="text-xs text-gray-400 font-normal">{order.user?.phone || 'No phone'}</div>
                  </td>
                  <td className="px-6 py-4 text-gray-600 text-xs max-w-xs truncate">
                    {order.items?.map((i) => `${i.quantity}x ${i.food?.name}`).join(', ')}
                  </td>
                  <td className="px-6 py-4 font-black text-orange-600">
                    ₦{Number(order.total_amount).toLocaleString()}
                  </td>

                  {/* Rider Handover Dropdown */}
                  <td className="px-6 py-4">
                    <div className="flex flex-col space-y-1">
                      <select
                        value={order.rider_id || ''}
                        onChange={(e) =>
                          updateOrderMutation.mutate({
                            id: order.id,
                            status: order.status,
                            rider_id: e.target.value ? Number(e.target.value) : null,
                          })
                        }
                        className="px-3 py-1.5 rounded-xl border border-gray-200 text-xs font-bold text-gray-700 bg-white focus:ring-2 focus:ring-orange-500 outline-none cursor-pointer"
                      >
                        <option value="">-- Assign Rider --</option>
                        {registeredRiders.map((rider) => (
                          <option key={rider.id} value={rider.id}>
                            🚴 {rider.name} ({rider.phone || 'No phone'})
                          </option>
                        ))}
                      </select>
                      {order.rider && (
                        <div className="flex items-center space-x-1.5 text-xs text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-md w-fit">
                          <Bike className="w-3.5 h-3.5" />
                          <span>{order.rider.name}</span>
                          {order.rider.phone && (
                            <a
                              href={`tel:${order.rider.phone}`}
                              className="text-emerald-800 hover:underline flex items-center gap-0.5 ml-1"
                            >
                              <Phone className="w-3 h-3" /> {order.rider.phone}
                            </a>
                          )}
                        </div>
                      )}
                    </div>
                  </td>

                  {/* Status Dropdown (Spacious & Not Reduced) */}
                  <td className="px-6 py-4 min-w-[180px]">
                    <div className="relative">
                      <select
                        value={order.status}
                        onChange={(e) =>
                          updateOrderMutation.mutate({
                            id: order.id,
                            status: e.target.value,
                            rider_id: order.rider_id,
                          })
                        }
                        className={`w-full px-3.5 py-2 rounded-2xl text-xs font-extrabold outline-none border cursor-pointer transition shadow-xs ${
                          order.status === 'delivered'
                            ? 'bg-green-50 text-green-700 border-green-200'
                            : order.status === 'out_for_delivery'
                            ? 'bg-purple-50 text-purple-700 border-purple-200'
                            : order.status === 'ready'
                            ? 'bg-blue-50 text-blue-700 border-blue-200'
                            : order.status === 'preparing'
                            ? 'bg-amber-50 text-amber-700 border-amber-200'
                            : order.status === 'cancelled'
                            ? 'bg-red-50 text-red-700 border-red-200'
                            : 'bg-orange-50 text-orange-700 border-orange-200'
                        }`}
                      >
                        <option value="pending">⏳ Pending</option>
                        <option value="confirmed">✅ Confirmed</option>
                        <option value="preparing">🍳 Preparing</option>
                        <option value="ready">📦 Ready for Pickup</option>
                        <option value="out_for_delivery">🚴 Out for Delivery</option>
                        <option value="delivered">🎉 Delivered</option>
                        <option value="cancelled">❌ Cancelled</option>
                      </select>
                    </div>
                  </td>

                  {/* Action: View Order Details */}
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => setSelectedOrder(order)}
                      className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-xl bg-orange-50 text-orange-600 hover:bg-orange-100 font-bold text-xs transition"
                      title="View Full Order Details"
                    >
                      <Eye className="w-4 h-4" />
                      <span>Details</span>
                    </button>
                  </td>
                </tr>
              ))}
              {filteredOrders?.length === 0 && !isLoading && (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-gray-400 font-medium">
                    No matching orders found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={(page) => setCurrentPage(page)}
          totalItems={filteredOrders.length}
          itemsPerPage={ITEMS_PER_PAGE}
        />
      </div>

      {/* FULL ORDER DETAILS MODAL */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden my-8 animate-in fade-in zoom-in duration-200 border border-gray-100">
            {/* Modal Header */}
            <div className="p-6 bg-gradient-to-r from-orange-500 to-red-500 text-white flex justify-between items-center">
              <div>
                <span className="bg-white/20 backdrop-blur-md px-2.5 py-0.5 rounded-full text-[11px] font-black uppercase tracking-wider mb-1 inline-block">
                  Snad Order Inspection
                </span>
                <h3 className="text-xl font-black">{selectedOrder.order_number}</h3>
                <p className="text-xs text-orange-100 flex items-center gap-1 mt-0.5">
                  <Calendar className="w-3.5 h-3.5" />
                  {new Date(selectedOrder.created_at).toLocaleString('en-US', {
                    dateStyle: 'medium',
                    timeStyle: 'short',
                  })}
                </p>
              </div>
              <button
                onClick={() => setSelectedOrder(null)}
                className="p-2 hover:bg-white/20 rounded-full transition text-white"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto text-sm">
              {/* Order Status & Quick Selector */}
              <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <span className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-1">
                    Current Order Status
                  </span>
                  <span className="text-sm font-black capitalize text-gray-900 flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-orange-500" />
                    {selectedOrder.status.replace(/_/g, ' ')}
                  </span>
                </div>

                <div className="sm:w-56">
                  <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block mb-1">
                    Update Progress Status
                  </label>
                  <select
                    value={selectedOrder.status}
                    onChange={(e) =>
                      updateOrderMutation.mutate({
                        id: selectedOrder.id,
                        status: e.target.value,
                        rider_id: selectedOrder.rider_id,
                      })
                    }
                    className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs font-extrabold text-gray-800 focus:ring-2 focus:ring-orange-500 outline-none"
                  >
                    <option value="pending">⏳ Pending</option>
                    <option value="confirmed">✅ Confirmed</option>
                    <option value="preparing">🍳 Preparing</option>
                    <option value="ready">📦 Ready for Pickup</option>
                    <option value="out_for_delivery">🚴 Out for Delivery</option>
                    <option value="delivered">🎉 Delivered</option>
                    <option value="cancelled">❌ Cancelled</option>
                  </select>
                </div>
              </div>

              {/* Grid: Customer & Delivery Details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Customer Box */}
                <div className="bg-gray-50/70 p-4 rounded-2xl border border-gray-100 space-y-2">
                  <h4 className="font-extrabold text-gray-900 text-xs uppercase tracking-wider flex items-center gap-1.5">
                    <UserIcon className="w-4 h-4 text-orange-500" /> Customer Info
                  </h4>
                  <div>
                    <p className="font-bold text-gray-900">{selectedOrder.user?.name || 'Guest User'}</p>
                    <p className="text-xs text-gray-500">{selectedOrder.user?.email}</p>
                    {selectedOrder.user?.phone ? (
                      <a
                        href={`tel:${selectedOrder.user.phone}`}
                        className="text-xs font-bold text-orange-600 hover:underline inline-flex items-center gap-1 mt-1"
                      >
                        <Phone className="w-3 h-3" /> {selectedOrder.user.phone}
                      </a>
                    ) : (
                      <p className="text-xs text-gray-400 italic">No phone number registered</p>
                    )}
                  </div>
                </div>

                {/* Delivery Spot Box */}
                <div className="bg-gray-50/70 p-4 rounded-2xl border border-gray-100 space-y-2">
                  <h4 className="font-extrabold text-gray-900 text-xs uppercase tracking-wider flex items-center gap-1.5">
                    <MapPin className="w-4 h-4 text-orange-500" /> Delivery Details
                  </h4>
                  <div>
                    <p className="font-bold text-gray-900 capitalize">
                      {selectedOrder.delivery_type === 'pickup' ? '🏪 Self Pickup at Counter' : '🚴 Campus Delivery'}
                    </p>
                    {selectedOrder.special_instructions && (
                      <div className="mt-1.5 p-2 bg-white rounded-xl border border-gray-200 text-xs text-gray-700">
                        <span className="font-bold text-gray-900 block">Instructions / Spot:</span>
                        {selectedOrder.special_instructions}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Rider Handover Section */}
              <div className="bg-orange-50/50 p-4 rounded-2xl border border-orange-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h4 className="font-extrabold text-orange-950 text-xs uppercase tracking-wider flex items-center gap-1.5 mb-1">
                    <Bike className="w-4 h-4 text-orange-600" /> Handover Rider
                  </h4>
                  {selectedOrder.rider ? (
                    <div className="text-xs">
                      <span className="font-bold text-gray-900">{selectedOrder.rider.name}</span>
                      {selectedOrder.rider.phone && (
                        <a
                          href={`tel:${selectedOrder.rider.phone}`}
                          className="ml-2 font-bold text-orange-600 hover:underline"
                        >
                          ({selectedOrder.rider.phone})
                        </a>
                      )}
                    </div>
                  ) : (
                    <span className="text-xs text-gray-500 italic">No rider assigned yet</span>
                  )}
                </div>

                <div className="sm:w-56">
                  <select
                    value={selectedOrder.rider_id || ''}
                    onChange={(e) =>
                      updateOrderMutation.mutate({
                        id: selectedOrder.id,
                        status: selectedOrder.status,
                        rider_id: e.target.value ? Number(e.target.value) : null,
                      })
                    }
                    className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs font-bold text-gray-800 focus:ring-2 focus:ring-orange-500 outline-none"
                  >
                    <option value="">-- Handover to Rider --</option>
                    {registeredRiders.map((rider) => (
                      <option key={rider.id} value={rider.id}>
                        🚴 {rider.name} ({rider.phone || 'No phone'})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Itemized Order Items */}
              <div>
                <h4 className="font-extrabold text-gray-900 text-xs uppercase tracking-wider mb-3 flex items-center gap-1.5">
                  <ShoppingBag className="w-4 h-4 text-orange-500" /> Ordered Items ({selectedOrder.items?.length || 0})
                </h4>
                <div className="divide-y divide-gray-100 border border-gray-100 rounded-2xl overflow-hidden bg-white">
                  {selectedOrder.items?.map((item) => (
                    <div key={item.id} className="p-3.5 flex justify-between items-center hover:bg-gray-50 transition">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-orange-100 text-orange-600 rounded-xl flex items-center justify-center font-black text-xs">
                          {item.quantity}x
                        </div>
                        <div>
                          <p className="font-bold text-gray-900">{item.food?.name}</p>
                          {item.customizations && (
                            <p className="text-xs text-gray-400">
                              {typeof item.customizations === 'string'
                                ? item.customizations
                                : JSON.stringify(item.customizations)}
                            </p>
                          )}
                        </div>
                      </div>
                      <span className="font-bold text-gray-900 text-sm">
                        ₦{(Number(item.unit_price || item.food?.price || 0) * item.quantity).toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Cancellation & Refund Request Inspection Box */}
              {(selectedOrder.cancellation_reason || (selectedOrder.refund_status && selectedOrder.refund_status !== 'none')) && (
                <div className="bg-amber-50/80 p-4 rounded-2xl border border-amber-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-extrabold text-amber-950 text-xs uppercase tracking-wider flex items-center gap-1.5">
                      <DollarSign className="w-4 h-4 text-amber-600" /> Cancellation & Refund Request
                    </h4>
                    <span className="text-xs font-black uppercase px-2.5 py-0.5 rounded-full bg-amber-200 text-amber-900">
                      Status: {selectedOrder.refund_status || 'none'}
                    </span>
                  </div>

                  {selectedOrder.cancellation_reason && (
                    <div className="text-xs text-gray-800">
                      <strong className="text-amber-950 block">Cancellation Reason:</strong>
                      {selectedOrder.cancellation_reason}
                    </div>
                  )}

                  {selectedOrder.refund_account_details && (
                    <div className="text-xs text-gray-800 bg-white p-3 rounded-xl border border-amber-200">
                      <strong className="text-amber-950 block mb-1">Bank Account Payout Details:</strong>
                      <p className="font-mono text-gray-900 font-bold">{selectedOrder.refund_account_details}</p>
                    </div>
                  )}

                  <div className="flex items-center gap-2 pt-2 border-t border-amber-200/60 flex-wrap">
                    {selectedOrder.refund_status === 'refunded' ? (
                      <button
                        disabled
                        className="bg-emerald-100 text-emerald-800 border border-emerald-300 font-extrabold px-4 py-2 rounded-xl text-xs flex items-center gap-1.5 cursor-not-allowed"
                      >
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        <span>Refund Processed & Completed 🟢</span>
                      </button>
                    ) : (
                      <>
                        <button
                          onClick={() => processRefundMutation.mutate({ id: selectedOrder.id, refund_status: 'refunded' })}
                          disabled={processRefundMutation.isPending}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-3.5 py-2 rounded-xl text-xs transition flex items-center gap-1 shadow-sm disabled:opacity-50"
                        >
                          <DollarSign className="w-3.5 h-3.5" /> Mark as Refunded 💸
                        </button>

                        <button
                          onClick={() => processRefundMutation.mutate({ id: selectedOrder.id, refund_status: 'approved' })}
                          disabled={processRefundMutation.isPending}
                          className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-3.5 py-2 rounded-xl text-xs transition shadow-sm disabled:opacity-50"
                        >
                          Approve Refund
                        </button>

                        <button
                          onClick={() => processRefundMutation.mutate({ id: selectedOrder.id, refund_status: 'rejected' })}
                          disabled={processRefundMutation.isPending}
                          className="bg-red-100 hover:bg-red-200 text-red-700 font-bold px-3.5 py-2 rounded-xl text-xs transition disabled:opacity-50"
                        >
                          Reject Refund
                        </button>
                      </>
                    )}
                  </div>
                </div>
              )}

              {/* Payment & Receipt Summary */}
              <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100 space-y-2">
                <div className="flex justify-between items-center text-xs text-gray-600">
                  <span>Payment Method:</span>
                  <span className="font-extrabold uppercase text-gray-900 flex items-center gap-1">
                    <CreditCard className="w-3.5 h-3.5 text-orange-500" />
                    {selectedOrder.payment_method === 'paystack'
                      ? 'Paystack (Online Card/Transfer)'
                      : 'Cash on Delivery (COD)'}
                  </span>
                </div>

                {selectedOrder.payment_reference && (
                  <div className="flex justify-between items-center text-xs text-gray-600">
                    <span>Paystack Ref:</span>
                    <span className="font-mono text-gray-700 bg-white px-2 py-0.5 rounded border border-gray-200 text-[11px]">
                      {selectedOrder.payment_reference}
                    </span>
                  </div>
                )}

                {selectedOrder.subtotal && (
                  <div className="flex justify-between text-xs text-gray-600 pt-1">
                    <span>Subtotal:</span>
                    <span className="font-bold text-gray-900">
                      ₦{Number(selectedOrder.subtotal).toLocaleString()}
                    </span>
                  </div>
                )}

                {selectedOrder.discount_amount && Number(selectedOrder.discount_amount) > 0 && (
                  <div className="flex justify-between text-xs text-green-600 font-bold">
                    <span>Discount ({selectedOrder.coupon_code || 'Promo'}):</span>
                    <span>-₦{Number(selectedOrder.discount_amount).toLocaleString()}</span>
                  </div>
                )}

                {selectedOrder.delivery_fee && (
                  <div className="flex justify-between text-xs text-gray-600">
                    <span>Delivery Fee:</span>
                    <span className="font-bold text-gray-900">
                      ₦{Number(selectedOrder.delivery_fee).toLocaleString()}
                    </span>
                  </div>
                )}

                <div className="flex justify-between items-center pt-2 border-t border-gray-200 text-base font-black">
                  <span className="text-gray-900">Total Amount Paid</span>
                  <span className="text-orange-600">
                    ₦{Number(selectedOrder.total_amount).toLocaleString()}
                  </span>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-gray-50 border-t border-gray-100 flex justify-end">
              <button
                onClick={() => setSelectedOrder(null)}
                className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold px-6 py-2.5 rounded-2xl text-sm transition"
              >
                Close Inspection
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
