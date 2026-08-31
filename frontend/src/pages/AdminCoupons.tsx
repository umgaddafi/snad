import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Tag, Plus, Trash2, CheckCircle2, XCircle, Loader2, Sparkles } from 'lucide-react';
import api from '@/lib/axios';
import toast from 'react-hot-toast';

interface Coupon {
  id: number;
  code: string;
  discount_type: 'percent' | 'fixed';
  discount_value: number;
  min_spend: number;
  is_active: boolean;
  used_count: number;
  expires_at?: string;
}

export default function AdminCoupons() {
  const queryClient = useQueryClient();
  const [showCreateModal, setShowCreateModal] = useState(false);

  const [code, setCode] = useState('');
  const [discountType, setDiscountType] = useState<'percent' | 'fixed'>('percent');
  const [discountValue, setDiscountValue] = useState<number>(10);
  const [minSpend, setMinSpend] = useState<number>(1000);
  const [expiresAt, setExpiresAt] = useState('');

  const { data: coupons, isLoading } = useQuery({
    queryKey: ['adminCoupons'],
    queryFn: async () => {
      const res = await api.get('/coupons');
      return res.data as Coupon[];
    },
  });

  const createMutation = useMutation({
    mutationFn: async (payload: any) => {
      const res = await api.post('/coupons', payload);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminCoupons'] });
      toast.success('Promo Coupon created successfully!');
      setShowCreateModal(false);
      setCode('');
      setDiscountValue(10);
      setMinSpend(1000);
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to create coupon');
    },
  });

  const toggleStatusMutation = useMutation({
    mutationFn: async ({ id, is_active }: { id: number; is_active: boolean }) => {
      await api.put(`/coupons/${id}`, { is_active });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminCoupons'] });
      toast.success('Coupon status updated');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await api.delete(`/coupons/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminCoupons'] });
      toast.success('Coupon deleted');
    },
  });

  const handleCreateCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    if (!code) return;

    createMutation.mutate({
      code,
      discount_type: discountType,
      discount_value: Number(discountValue),
      min_spend: Number(minSpend),
      is_active: true,
      expires_at: expiresAt || null,
    });
  };

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="bg-orange-100 text-orange-700 font-extrabold text-xs uppercase px-3 py-1 rounded-full inline-block mb-1">
            Marketing & Promotions
          </span>
          <h1 className="text-3xl font-black text-gray-900">Manage Coupons & Promo Codes</h1>
          <p className="text-gray-500 text-sm mt-1">
            Create discount codes for JOSTUM campus students, staff flash sales, and special offers.
          </p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-black px-6 py-3.5 rounded-2xl shadow-lg transition flex items-center justify-center gap-2 text-sm"
        >
          <Plus className="w-5 h-5" /> Create New Coupon
        </button>
      </div>

      {/* Coupons Table */}
      {isLoading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 text-gray-700 font-bold border-b border-gray-100 text-xs uppercase tracking-wider">
                <tr>
                  <th className="p-4 pl-6">Code</th>
                  <th className="p-4">Discount</th>
                  <th className="p-4">Min Spend</th>
                  <th className="p-4">Uses</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 pr-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 font-medium text-gray-800">
                {coupons?.map((c) => (
                  <tr key={c.id} className="hover:bg-gray-50/50 transition">
                    <td className="p-4 pl-6">
                      <div className="flex items-center gap-2">
                        <Tag className="w-4 h-4 text-orange-500" />
                        <span className="font-black text-gray-900 bg-orange-50 text-orange-800 px-3 py-1 rounded-xl text-sm uppercase">
                          {c.code}
                        </span>
                      </div>
                    </td>
                    <td className="p-4 font-bold text-gray-900">
                      {c.discount_type === 'percent' ? `${c.discount_value}% OFF` : `₦${c.discount_value.toLocaleString()} OFF`}
                    </td>
                    <td className="p-4 text-gray-600">₦{Number(c.min_spend).toLocaleString()}</td>
                    <td className="p-4 font-bold text-gray-700">{c.used_count || 0} times</td>
                    <td className="p-4">
                      <button
                        onClick={() => toggleStatusMutation.mutate({ id: c.id, is_active: !c.is_active })}
                        className={`inline-flex items-center gap-1 text-xs font-extrabold px-3 py-1 rounded-full ${
                          c.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                        }`}
                      >
                        {c.is_active ? <CheckCircle2 className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                        {c.is_active ? 'Active' : 'Inactive'}
                      </button>
                    </td>
                    <td className="p-4 pr-6 text-right">
                      <button
                        onClick={() => deleteMutation.mutate(c.id)}
                        className="p-2 text-gray-400 hover:text-red-600 rounded-xl transition"
                        title="Delete Coupon"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Create Coupon Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h3 className="text-lg font-black text-gray-900 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-orange-500" /> Create Promo Coupon
              </h3>
              <button onClick={() => setShowCreateModal(false)} className="text-gray-400 hover:text-gray-600 font-bold">
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateCoupon} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Coupon Code</label>
                <input
                  type="text"
                  placeholder="E.g., JOSTUM2026"
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  className="w-full p-3 rounded-2xl border border-gray-200 text-sm font-bold uppercase tracking-wider focus:ring-2 focus:ring-orange-500 focus:outline-none"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Discount Type</label>
                  <select
                    value={discountType}
                    onChange={(e) => setDiscountType(e.target.value as any)}
                    className="w-full p-3 rounded-2xl border border-gray-200 text-sm font-bold focus:ring-2 focus:ring-orange-500 focus:outline-none"
                  >
                    <option value="percent">Percentage (%)</option>
                    <option value="fixed">Fixed Amount (₦)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Discount Value</label>
                  <input
                    type="number"
                    value={discountValue}
                    onChange={(e) => setDiscountValue(Number(e.target.value))}
                    className="w-full p-3 rounded-2xl border border-gray-200 text-sm font-bold focus:ring-2 focus:ring-orange-500 focus:outline-none"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
                  Minimum Order Spend (₦)
                </label>
                <input
                  type="number"
                  value={minSpend}
                  onChange={(e) => setMinSpend(Number(e.target.value))}
                  className="w-full p-3 rounded-2xl border border-gray-200 text-sm font-bold focus:ring-2 focus:ring-orange-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
                  Expiration Date (Optional)
                </label>
                <input
                  type="date"
                  value={expiresAt}
                  onChange={(e) => setExpiresAt(e.target.value)}
                  className="w-full p-3 rounded-2xl border border-gray-200 text-sm font-bold focus:ring-2 focus:ring-orange-500 focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-5 py-2.5 rounded-2xl font-bold text-gray-500 hover:bg-gray-100 text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createMutation.isPending}
                  className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-2.5 rounded-2xl font-bold text-sm shadow-md transition"
                >
                  {createMutation.isPending ? 'Saving...' : 'Save Coupon'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
