import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ShoppingBag,
  Search,
  Printer,
  RefreshCw,
  UtensilsCrossed,
  Check,
  Store,
  Globe,
  Layers,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '@/lib/axios';
import ThermalReceiptModal, { type ThermalOrder } from '@/components/ThermalReceiptModal';
import Pagination from '@/components/common/Pagination';

interface OrderItem {
  id: number;
  quantity: number;
  unit_price?: string;
  food: { name: string };
  customizations?: any;
}

interface Order {
  id: number;
  order_number: string;
  status: string;
  order_source?: string;
  delivery_type?: string;
  table_number?: string | null;
  customer_name?: string | null;
  customer_phone?: string | null;
  subtotal?: string;
  discount_amount?: string;
  delivery_fee?: string;
  total_amount: string;
  payment_method?: string;
  payment_reference?: string | null;
  special_instructions?: string | null;
  created_at: string;
  user?: { name: string; phone: string | null; email?: string; role?: string };
  rider?: { name: string; phone: string | null };
  address?: { campus_zone?: string; specific_location?: string };
  payment?: { payment_method?: string; transaction_reference?: string; status?: string };
  items: OrderItem[];
}

export default function FrontDeskOrders() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;
  // By default, front desk officer dashboard displays orders placed by front desk officers
  const [sourceFilter, setSourceFilter] = useState<'pos' | 'online' | 'all'>('pos');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [printingOrder, setPrintingOrder] = useState<ThermalOrder | null>(null);

  // Helper to determine if an order was placed by Front Desk Officers vs Online
  const isFrontDeskOrder = (order: Order) => {
    if (order.order_source === 'pos') return true;
    if (order.order_source === 'online') return false;
    // Fallback for existing/legacy orders:
    return Boolean(
      order.delivery_type === 'dine_in' ||
      order.table_number ||
      order.customer_name ||
      order.user?.role === 'front_desk'
    );
  };

  // Auto-refresh orders every 5 seconds for live front desk monitoring
  const { data: orders, isLoading, refetch } = useQuery<Order[]>({
    queryKey: ['frontDeskOrders'],
    queryFn: async () => {
      const res = await api.get('/orders');
      return res.data;
    },
    refetchInterval: 5000,
  });

  // Compute live counts for Front Desk vs Online tabs
  const sourceCounts = useMemo(() => {
    if (!orders) return { pos: 0, online: 0, all: 0 };
    let pos = 0;
    let online = 0;
    for (const o of orders) {
      if (isFrontDeskOrder(o)) {
        pos++;
      } else {
        online++;
      }
    }
    return { pos, online, all: orders.length };
  }, [orders]);

  // Status mutation (e.g. Front desk marking order picked up / delivered)
  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) => {
      return api.put(`/orders/${id}`, { status });
    },
    onSuccess: () => {
      toast.success('Order status updated successfully');
      queryClient.invalidateQueries({ queryKey: ['frontDeskOrders'] });
      queryClient.invalidateQueries({ queryKey: ['kitchenOrders'] });
      queryClient.invalidateQueries({ queryKey: ['adminOrders'] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to update order status');
    },
  });

  // Filtered Orders
  const filteredOrders = useMemo(() => {
    if (!orders) return [];

    return orders.filter((order) => {
      // Source filter: pos (default for front desk) vs online vs all
      if (sourceFilter === 'pos' && !isFrontDeskOrder(order)) return false;
      if (sourceFilter === 'online' && isFrontDeskOrder(order)) return false;

      // Status filter
      if (statusFilter === 'active') {
        if (['delivered', 'cancelled'].includes(order.status)) return false;
      } else if (statusFilter !== 'all' && order.status !== statusFilter) {
        return false;
      }

      // Order type filter
      if (typeFilter !== 'all' && order.delivery_type !== typeFilter) {
        return false;
      }

      // Search term
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        const matchesNumber = order.order_number.toLowerCase().includes(term);
        const matchesCustomer =
          (order.customer_name?.toLowerCase().includes(term) ?? false) ||
          (order.user?.name.toLowerCase().includes(term) ?? false);
        const matchesPhone =
          (order.customer_phone?.includes(term) ?? false) ||
          (order.user?.phone?.includes(term) ?? false);
        const matchesTable = order.table_number?.toLowerCase().includes(term) ?? false;
        return matchesNumber || matchesCustomer || matchesPhone || matchesTable;
      }

      return true;
    });
  }, [orders, sourceFilter, statusFilter, typeFilter, searchTerm]);

  // Pagination calculation
  const totalPages = Math.ceil(filteredOrders.length / ITEMS_PER_PAGE) || 1;
  const paginatedOrders = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredOrders.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredOrders, currentPage]);

  // Status badge helper
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-black bg-blue-100 text-blue-800 border border-blue-200">
            ⏳ Pending
          </span>
        );
      case 'confirmed':
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-black bg-indigo-100 text-indigo-800 border border-indigo-200">
            ✓ Confirmed
          </span>
        );
      case 'preparing':
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-black bg-amber-100 text-amber-800 border border-amber-200 animate-pulse">
            🍳 Cooking Now
          </span>
        );
      case 'ready':
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-black bg-emerald-100 text-emerald-800 border border-emerald-300 shadow-sm">
            📦 Ready for Pickup
          </span>
        );
      case 'out_for_delivery':
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-black bg-purple-100 text-purple-800 border border-purple-200">
            🚴 Out on Delivery
          </span>
        );
      case 'delivered':
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-black bg-gray-100 text-gray-700">
            🎉 Completed
          </span>
        );
      case 'cancelled':
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-black bg-red-100 text-red-700">
            ❌ Cancelled
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-black bg-gray-100 text-gray-700 capitalize">
            {status}
          </span>
        );
    }
  };

  const getRelativeTime = (dateString: string) => {
    const diff = Math.floor((new Date().getTime() - new Date(dateString).getTime()) / 60000);
    if (diff < 1) return 'Just now';
    if (diff < 60) return `${diff} min${diff !== 1 ? 's' : ''} ago`;
    const hours = Math.floor(diff / 60);
    return `${hours} hr${hours !== 1 ? 's' : ''} ago`;
  };

  return (
    <div className="space-y-4">
      {/* Top Header */}
      <div className="bg-white p-4 sm:p-5 rounded-3xl border border-gray-150 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-black text-gray-900">Front Desk Live Order Monitor</h1>
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
          </div>
          <p className="text-xs text-gray-500">
            Real-time status updates from kitchen chefs & dispatch riders • Instant receipt reprint
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            to="/front-desk"
            className="flex items-center gap-2 px-4 py-2.5 bg-orange-500 hover:bg-orange-600 text-white rounded-2xl font-black text-xs transition shadow-md shadow-orange-500/20"
          >
            <UtensilsCrossed className="w-4 h-4" />
            <span>Open POS Terminal</span>
          </Link>

          <button
            onClick={() => refetch()}
            className="p-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-2xl transition"
            title="Refresh Orders"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Source Toggler / Tabs (Front Desk Orders vs Online Orders) */}
      <div className="bg-white p-3 sm:p-4 rounded-3xl border border-gray-150 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Toggle buttons */}
        <div className="inline-flex p-1 bg-gray-100 rounded-2xl gap-1">
          <button
            onClick={() => {
              setSourceFilter('pos');
              setCurrentPage(1);
            }}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition ${
              sourceFilter === 'pos'
                ? 'bg-white text-orange-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Store className="w-4 h-4 text-orange-500" />
            <span>Front Desk Orders</span>
            <span
              className={`text-[10px] px-2 py-0.5 rounded-full font-black ${
                sourceFilter === 'pos'
                  ? 'bg-orange-100 text-orange-700'
                  : 'bg-gray-200 text-gray-700'
              }`}
            >
              {sourceCounts.pos}
            </span>
          </button>

          <button
            onClick={() => {
              setSourceFilter('online');
              setCurrentPage(1);
            }}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition ${
              sourceFilter === 'online'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Globe className="w-4 h-4 text-blue-500" />
            <span>Online Orders</span>
            <span
              className={`text-[10px] px-2 py-0.5 rounded-full font-black ${
                sourceFilter === 'online'
                  ? 'bg-blue-100 text-blue-700'
                  : 'bg-gray-200 text-gray-700'
              }`}
            >
              {sourceCounts.online}
            </span>
          </button>

          <button
            onClick={() => {
              setSourceFilter('all');
              setCurrentPage(1);
            }}
            className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold transition ${
              sourceFilter === 'all'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-800'
            }`}
          >
            <Layers className="w-4 h-4 text-gray-400" />
            <span>All Orders</span>
            <span
              className={`text-[10px] px-1.5 py-0.5 rounded-full font-black ${
                sourceFilter === 'all'
                  ? 'bg-gray-200 text-gray-800'
                  : 'bg-gray-200/60 text-gray-600'
              }`}
            >
              {sourceCounts.all}
            </span>
          </button>
        </div>

        {/* Informative indicator badge */}
        <div className="text-xs font-medium px-2 flex items-center gap-2">
          {sourceFilter === 'pos' ? (
            <span className="flex items-center gap-1.5 text-orange-700 bg-orange-50 border border-orange-200 px-3 py-1 rounded-xl">
              <span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse" />
              Viewing Front Desk / Counter Orders (Default)
            </span>
          ) : sourceFilter === 'online' ? (
            <span className="flex items-center gap-1.5 text-blue-700 bg-blue-50 border border-blue-200 px-3 py-1 rounded-xl">
              <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
              Viewing Customer Online Web & App Orders
            </span>
          ) : (
            <span className="flex items-center gap-1.5 text-gray-700 bg-gray-50 border border-gray-200 px-3 py-1 rounded-xl">
              <span className="w-2 h-2 rounded-full bg-gray-400" />
              Viewing All Orders (Front Desk + Online Combined)
            </span>
          )}
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-3xl border border-gray-150 shadow-sm flex flex-wrap items-center justify-between gap-3">
        {/* Search */}
        <div className="relative flex-1 min-w-[240px] max-w-md">
          <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="Search order #, table #, or customer..."
            className="w-full pl-10 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-2xl text-xs font-medium focus:ring-2 focus:ring-orange-500 outline-none"
          />
        </div>

        {/* Status Filters */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {[
            { id: 'all', label: 'All Orders' },
            { id: 'active', label: 'Active Kitchen' },
            { id: 'preparing', label: 'Cooking Now' },
            { id: 'ready', label: 'Ready for Pickup' },
            { id: 'delivered', label: 'Completed' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                setStatusFilter(tab.id);
                setCurrentPage(1);
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition shrink-0 ${
                statusFilter === tab.id
                  ? 'bg-orange-500 text-white shadow-sm'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Order Type Dropdown */}
        <select
          value={typeFilter}
          onChange={(e) => {
            setTypeFilter(e.target.value);
            setCurrentPage(1);
          }}
          className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-2xl text-xs font-bold text-gray-700 outline-none"
        >
          <option value="all">All Types</option>
          <option value="dine_in">🍽️ Dine-In</option>
          <option value="pickup">🛍️ Takeout</option>
          <option value="delivery">🚴 Delivery</option>
        </select>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-3xl border border-gray-150 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-16 flex flex-col items-center justify-center text-gray-400">
            <RefreshCw className="w-8 h-8 animate-spin text-orange-500 mb-2" />
            <p className="text-sm font-semibold">Loading orders...</p>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="p-16 text-center text-gray-400">
            <ShoppingBag className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <h3 className="text-base font-bold text-gray-700">No matching orders found</h3>
            <p className="text-xs text-gray-500 mt-1">Try clearing filters or search term.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50 text-gray-500 uppercase tracking-wider font-extrabold border-b border-gray-150">
                <tr>
                  <th className="px-5 py-3.5">Order #</th>
                  <th className="px-5 py-3.5">Customer & Type</th>
                  <th className="px-5 py-3.5">Items</th>
                  <th className="px-5 py-3.5">Amount & Payment</th>
                  <th className="px-5 py-3.5">Live Status</th>
                  <th className="px-5 py-3.5">Placed At</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {paginatedOrders.map((order) => {
                  const custName = order.customer_name || order.user?.name || 'Walk-in Guest';
                  const custPhone = order.customer_phone || order.user?.phone;
                  const isDineIn = order.delivery_type === 'dine_in';
                  const isReady = order.status === 'ready';

                  return (
                    <tr
                      key={order.id}
                      className={`hover:bg-gray-50/70 transition ${
                        isReady ? 'bg-emerald-50/30' : ''
                      }`}
                    >
                      {/* Order Number */}
                      <td className="px-5 py-4 font-mono font-black text-gray-900">
                        #{order.order_number}
                        {order.table_number && isDineIn && (
                          <span className="block font-sans text-[11px] font-bold text-orange-600">
                            Table #{order.table_number}
                          </span>
                        )}
                      </td>

                      {/* Customer Info & Type */}
                      <td className="px-5 py-4">
                        <div className="font-bold text-gray-900">{custName}</div>
                        {custPhone && <div className="text-[11px] text-gray-500">{custPhone}</div>}
                        <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                          {isFrontDeskOrder(order) ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-200">
                              <Store className="w-3 h-3 text-amber-700" /> Front Desk
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-blue-100 text-blue-900 border border-blue-200">
                              <Globe className="w-3 h-3 text-blue-700" /> Online Order
                            </span>
                          )}
                          <span className="inline-block text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-gray-100 text-gray-700">
                            {isDineIn
                              ? `🍽️ Dine-In`
                              : order.delivery_type === 'delivery'
                              ? `🚴 Delivery`
                              : `🛍️ Takeout`}
                          </span>
                        </div>
                      </td>

                      {/* Items Preview */}
                      <td className="px-5 py-4 max-w-xs">
                        <div className="space-y-0.5">
                          {order.items.slice(0, 2).map((item, idx) => (
                            <p key={idx} className="truncate text-gray-800">
                              <span className="font-black text-gray-900">{item.quantity}x</span>{' '}
                              {item.food?.name}
                            </p>
                          ))}
                          {order.items.length > 2 && (
                            <p className="text-[10px] text-gray-400 font-semibold">
                              +{order.items.length - 2} more item(s)
                            </p>
                          )}
                        </div>
                      </td>

                      {/* Amount & Payment */}
                      <td className="px-5 py-4">
                        <span className="font-black text-sm text-gray-900 block">
                          ₦{Number(order.total_amount).toLocaleString()}
                        </span>
                        <span className="text-[10px] font-bold uppercase text-gray-500">
                          {order.payment_method === 'paystack'
                            ? '⚡ Paid Online'
                            : order.payment_method === 'pos'
                            ? '💳 POS Card'
                            : order.payment_method === 'transfer'
                            ? '🏦 Bank Transfer'
                            : '💵 Cash'}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="px-5 py-4">{getStatusBadge(order.status)}</td>

                      {/* Time */}
                      <td className="px-5 py-4 text-gray-500">
                        <span className="block font-bold text-gray-700">
                          {getRelativeTime(order.created_at)}
                        </span>
                        <span className="text-[10px] text-gray-400">
                          {new Date(order.created_at).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="px-5 py-4 text-right space-x-1.5 whitespace-nowrap">
                        {/* Quick Mark Picked Up if ready */}
                        {isReady && (
                          <button
                            onClick={() =>
                              updateStatusMutation.mutate({ id: order.id, status: 'delivered' })
                            }
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs shadow-sm transition active:scale-95"
                            title="Customer has picked up their order"
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>Mark Picked Up</span>
                          </button>
                        )}

                        {/* Print Thermal Receipt */}
                        <button
                          onClick={() => setPrintingOrder(order as any)}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold text-xs transition"
                          title="Print Thermal POS Receipt or KOT"
                        >
                          <Printer className="w-3.5 h-3.5 text-gray-600" />
                          <span>Print</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={(page) => setCurrentPage(page)}
          totalItems={filteredOrders.length}
          itemsPerPage={ITEMS_PER_PAGE}
        />
      </div>

      {/* Thermal Receipt Modal */}
      <ThermalReceiptModal
        order={printingOrder}
        isOpen={!!printingOrder}
        onClose={() => setPrintingOrder(null)}
        initialMode="customer"
      />
    </div>
  );
}
