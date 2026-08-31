import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, CheckCircle, Loader2, CreditCard, DollarSign, Printer, Volume2, VolumeX } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/axios';

interface OrderItem {
  id: number;
  quantity: number;
  unit_price?: string;
  food: { name: string };
  customizations?: string[];
}

interface Order {
  id: number;
  order_number: string;
  status: string;
  delivery_type?: string;
  payment_method?: string;
  total_amount?: string | number;
  created_at: string;
  items: OrderItem[];
  special_instructions?: string;
  user?: { name: string; phone: string | null };
  rider?: { name: string; phone: string | null };
}

export default function KitchenDashboard() {
  const queryClient = useQueryClient();
  const [printingOrder, setPrintingOrder] = useState<Order | null>(null);
  const [audioEnabled, setAudioEnabled] = useState<boolean>(true);
  const prevIncomingCount = useRef<number>(0);

  // Play synthesized kitchen audio bell chime
  const playKitchenChime = () => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();

      const playTone = (freq: number, start: number, duration: number) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, ctx.currentTime + start);
        gain.gain.setValueAtTime(0.3, ctx.currentTime + start);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + start + duration);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime + start);
        osc.stop(ctx.currentTime + start + duration);
      };

      playTone(880, 0, 0.2); // A5
      playTone(1174.66, 0.2, 0.4); // D6
    } catch (e) {
      console.error('Audio play failed', e);
    }
  };

  const { data: orders, isLoading } = useQuery({
    queryKey: ['kitchenOrders'],
    queryFn: async () => {
      const res = await api.get('/orders');
      return res.data as Order[];
    },
    refetchInterval: 5000 // auto refresh every 5 seconds for live kitchen view
  });

  // Sound trigger when incoming order count increases
  useEffect(() => {
    if (!orders) return;
    const incomingCount = orders.filter((o) => ['pending', 'confirmed'].includes(o.status)).length;
    if (incomingCount > prevIncomingCount.current && prevIncomingCount.current > 0 && audioEnabled) {
      playKitchenChime();
    }
    prevIncomingCount.current = incomingCount;
  }, [orders, audioEnabled]);

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) => {
      return api.put(`/orders/${id}`, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['kitchenOrders'] });
    },
  });

  const moveOrder = (id: number, newStatus: string) => {
    updateStatusMutation.mutate({ id, status: newStatus });
  };

  const isIncoming = (status: string) => ['pending', 'confirmed'].includes(status);

  const getFilteredOrders = (colId: string) => {
    if (!orders) return [];
    if (colId === 'incoming') {
      return orders.filter((o) => isIncoming(o.status));
    }
    return orders.filter((o) => o.status === colId);
  };

  const columns = [
    { id: 'incoming', title: 'Incoming (New)', color: 'bg-blue-50 border-blue-100 text-blue-800' },
    { id: 'preparing', title: 'Cooking Now', color: 'bg-orange-50 border-orange-100 text-orange-800' },
    { id: 'ready', title: 'Ready for Pickup', color: 'bg-green-50 border-green-100 text-green-800' },
  ];

  const handlePrintTicket = (order: Order) => {
    setPrintingOrder(order);
    setTimeout(() => {
      window.print();
    }, 300);
  };

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center py-20">
        <Loader2 className="w-10 h-10 animate-spin text-orange-500" />
      </div>
    );
  }

  const getRelativeTime = (dateString: string) => {
    const diff = Math.floor((new Date().getTime() - new Date(dateString).getTime()) / 60000);
    if (diff < 1) return 'Just now';
    return `${diff} min${diff !== 1 ? 's' : ''} ago`;
  };

  return (
    <div className="space-y-4">
      {/* Kitchen Controls Header */}
      <div className="bg-white p-4 rounded-3xl border border-gray-100 flex flex-wrap items-center justify-between gap-4 shadow-sm">
        <div>
          <h2 className="text-xl font-black text-gray-900">Snad Kitchen Executive Display</h2>
          <p className="text-xs text-gray-500">Live order queue with instant chef alerts and thermal POS printing.</p>
        </div>

        <button
          onClick={() => {
            setAudioEnabled(!audioEnabled);
            if (!audioEnabled) playKitchenChime();
          }}
          className={`flex items-center gap-2 px-4 py-2 rounded-2xl text-xs font-black transition ${
            audioEnabled
              ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
              : 'bg-gray-100 text-gray-600 border border-gray-200'
          }`}
        >
          {audioEnabled ? <Volume2 className="w-4 h-4 text-emerald-600" /> : <VolumeX className="w-4 h-4" />}
          <span>{audioEnabled ? 'Kitchen Sound Alert ON 🔔' : 'Sound Muted'}</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-full">
        {columns.map((col) => {
          const colOrders = getFilteredOrders(col.id);
          return (
            <div
              key={col.id}
              className="rounded-3xl border border-gray-100 p-4 flex flex-col h-[60vh] md:h-[calc(100vh-200px)] bg-white shadow-sm"
            >
              <div className={`px-4 py-3 rounded-2xl mb-4 font-bold text-sm flex items-center justify-between ${col.color}`}>
                <span>{col.title}</span>
                <span className="bg-white/80 px-2.5 py-0.5 rounded-full text-xs font-black">{colOrders.length}</span>
              </div>

              <div className="flex-1 overflow-y-auto space-y-4 pr-2">
                <AnimatePresence>
                  {colOrders.map((order) => (
                    <motion.div
                      key={order.id}
                      layout
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      className="bg-white border border-gray-200 shadow-sm rounded-2xl p-5 space-y-3 relative group"
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-extrabold text-gray-900 text-base">{order.order_number}</span>
                            <button
                              onClick={() => handlePrintTicket(order)}
                              title="Print Kitchen Ticket"
                              className="p-1 text-gray-500 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition"
                            >
                              <Printer className="w-4 h-4" />
                            </button>
                          </div>
                          <div className="flex items-center gap-1.5 mt-1">
                            {order.status === 'confirmed' ? (
                              <span className="bg-green-100 text-green-800 text-[10px] font-extrabold px-2 py-0.5 rounded-md flex items-center gap-1">
                                <CreditCard className="w-3 h-3" /> Paid (Paystack)
                              </span>
                            ) : (
                              <span className="bg-yellow-100 text-yellow-800 text-[10px] font-extrabold px-2 py-0.5 rounded-md flex items-center gap-1">
                                <DollarSign className="w-3 h-3" /> Cash on Delivery
                              </span>
                            )}
                          </div>
                        </div>

                        <span className="flex items-center text-xs font-medium text-gray-500 bg-gray-50 px-2 py-1 rounded-md">
                          <Clock className="w-3 h-3 mr-1" /> {getRelativeTime(order.created_at)}
                        </span>
                      </div>

                      <ul className="space-y-2 border-t border-b border-gray-100 py-3">
                        {order.items?.map((item, i) => (
                          <li key={i} className="text-gray-800 font-semibold text-sm">
                            <span className="text-orange-600 font-extrabold">{item.quantity}x</span> {item.food?.name}
                            {item.customizations && item.customizations.length > 0 && (
                              <div className="text-[11px] text-gray-500 font-normal pl-4">
                                {item.customizations.join(', ')}
                              </div>
                            )}
                          </li>
                        ))}
                      </ul>

                      {order.special_instructions && (
                        <p className="text-xs text-amber-800 bg-amber-50 p-2.5 rounded-xl border border-amber-200 font-medium">
                          📝 {order.special_instructions}
                        </p>
                      )}

                      {col.id === 'incoming' && (
                        <button
                          onClick={() => moveOrder(order.id, 'preparing')}
                          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl transition text-sm shadow-md"
                        >
                          Start Cooking 🍳
                        </button>
                      )}
                      {col.id === 'preparing' && (
                        <button
                          onClick={() => moveOrder(order.id, 'ready')}
                          className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 rounded-xl transition text-sm shadow-md"
                        >
                          Mark as Ready 🍱
                        </button>
                      )}
                      {col.id === 'ready' && (
                        <div className="space-y-2">
                          {order.delivery_type === 'pickup' ? (
                            <button
                              onClick={() => moveOrder(order.id, 'delivered')}
                              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-xl transition flex items-center justify-center space-x-2 text-sm shadow-md"
                            >
                              <CheckCircle className="w-4 h-4" />
                              <span>Handed to Customer (Self-Pickup) 🛍️</span>
                            </button>
                          ) : (
                            <div className="w-full bg-amber-50 border border-amber-200 text-amber-900 font-bold p-3 rounded-xl text-center text-xs flex flex-col items-center justify-center gap-1 shadow-sm">
                              <span className="flex items-center gap-1 text-sm font-extrabold text-amber-700">
                                <CheckCircle className="w-4 h-4 text-amber-600" /> Ready for Rider Pickup 🚴
                              </span>
                              <span className="text-[11px] text-amber-700 font-medium">
                                {order.rider ? `Assigned to Rider: ${order.rider.name}` : 'Awaiting Rider to accept on Rider Portal'}
                              </span>
                            </div>
                          )}
                        </div>
                      )}
                    </motion.div>
                  ))}
                </AnimatePresence>

                {colOrders.length === 0 && (
                  <div className="h-full flex items-center justify-center text-gray-400 font-medium text-sm py-12">
                    No orders here
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Thermal POS Receipt Modal for Printing */}
      {printingOrder && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 print:p-0 print:bg-white print:static">
          <div className="bg-white rounded-3xl p-6 w-full max-w-xs shadow-2xl border border-gray-200 font-mono text-xs space-y-4 print:shadow-none print:border-none print:w-full">
            <div className="text-center border-b border-dashed border-gray-300 pb-3">
              <h2 className="font-black text-base text-gray-900">SNAD KITCHEN</h2>
              <p className="text-[10px] text-gray-600">JOSTUM Campus, Makurdi</p>
              <p className="text-[10px] text-gray-600">Order: #{printingOrder.order_number}</p>
              <p className="text-[10px] text-gray-500">{new Date(printingOrder.created_at).toLocaleString()}</p>
            </div>

            {printingOrder.user && (
              <div className="border-b border-dashed border-gray-300 pb-2">
                <p className="font-bold text-gray-900">Customer: {printingOrder.user.name}</p>
                <p className="text-gray-600">Phone: {printingOrder.user.phone || 'N/A'}</p>
              </div>
            )}

            <div className="border-b border-dashed border-gray-300 pb-3 space-y-2">
              <p className="font-bold text-gray-900 uppercase">KITCHEN TICKET ITEMS:</p>
              {printingOrder.items?.map((item, idx) => (
                <div key={idx} className="flex justify-between items-start">
                  <div>
                    <span className="font-black text-gray-900">{item.quantity}x</span> {item.food?.name}
                    {item.customizations && item.customizations.length > 0 && (
                      <p className="text-[10px] text-gray-500">[{item.customizations.join(', ')}]</p>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {printingOrder.special_instructions && (
              <div className="border-b border-dashed border-gray-300 pb-2">
                <p className="font-bold text-gray-900">NOTES:</p>
                <p className="text-gray-700 italic">{printingOrder.special_instructions}</p>
              </div>
            )}

            <div className="text-center pt-2">
              <p className="font-bold uppercase text-gray-900">
                Payment: {printingOrder.payment_method === 'paystack' ? 'PAID ONLINE (PAYSTACK)' : 'CASH ON DELIVERY'}
              </p>
              <p className="text-[10px] text-gray-500 mt-2">Thank you for dining with Snad Kitchen!</p>
            </div>

            <div className="flex gap-2 pt-3 print:hidden">
              <button
                onClick={() => setPrintingOrder(null)}
                className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold py-2 rounded-xl text-xs transition"
              >
                Close
              </button>
              <button
                onClick={() => window.print()}
                className="flex-1 bg-orange-500 hover:bg-orange-600 text-white font-bold py-2 rounded-xl text-xs transition flex items-center justify-center gap-1"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print Ticket</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
