import { useState, useEffect } from 'react';
import { useCartStore } from '@/store/useCartStore';
import { useAuthStore } from '@/store/useAuthStore';
import { Minus, Plus, Trash2, ArrowRight, Loader2, CheckCircle2, Tag } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import PaystackPop from '@paystack/inline-js';
import api from '@/lib/axios';
import toast from 'react-hot-toast';

interface CampusLocation {
  id: number;
  name: string;
  delivery_fee: number;
}

export default function Checkout() {
  const { items, updateQuantity, removeItem, totalPrice, totalItems, clearCart } = useCartStore();
  const user = useAuthStore((state) => state.user);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('paystack');
  const [deliveryType, setDeliveryType] = useState<'delivery' | 'pickup'>('delivery');
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [placedOrder, setPlacedOrder] = useState<any>(null);
  const navigate = useNavigate();

  // Coupon state
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<{
    code: string;
    discount_amount: number;
    message: string;
  } | null>(null);
  const [validatingCoupon, setValidatingCoupon] = useState(false);

  // Campus location state
  const [locations, setLocations] = useState<CampusLocation[]>([]);
  const [selectedLocationId, setSelectedLocationId] = useState<string>('');
  const [selectedLocationFee, setSelectedLocationFee] = useState<number>(500);
  const [specificLocation, setSpecificLocation] = useState('');
  const [deliveryNotes, setDeliveryNotes] = useState('');

  useEffect(() => {
    // Fetch active locations from backend API
    api.get('/locations')
      .then((res) => {
        setLocations(res.data);
      })
      .catch((e) => console.error('Failed to load campus locations', e));
  }, []);

  useEffect(() => {
    if (showSuccessModal) {
      const timer = setTimeout(() => {
        setShowSuccessModal(false);
        navigate('/dashboard');
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [showSuccessModal, navigate]);

  const rawSubtotal = totalPrice();
  const discountAmount = appliedCoupon ? appliedCoupon.discount_amount : 0;
  const taxableSubtotal = Math.max(0, rawSubtotal - discountAmount);
  const deliveryFee = deliveryType === 'delivery' ? selectedLocationFee : 0;
  const finalTotal = Math.round(taxableSubtotal + deliveryFee);

  const handleApplyCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponCode.trim()) return;

    setValidatingCoupon(true);
    try {
      const res = await api.post('/coupons/validate', {
        code: couponCode,
        subtotal: rawSubtotal,
      });

      setAppliedCoupon({
        code: res.data.code,
        discount_amount: res.data.discount_amount,
        message: res.data.message,
      });
      toast.success(`Promo code ${res.data.code} applied! Saved ₦${res.data.discount_amount.toLocaleString()}`);
    } catch (err: any) {
      setAppliedCoupon(null);
      toast.error(err.response?.data?.message || 'Invalid coupon code');
    } finally {
      setValidatingCoupon(false);
    }
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
    setCouponCode('');
    toast.success('Coupon removed');
  };

  const submitOrder = async (reference: string | null = null) => {
    try {
      let finalInstructions = deliveryNotes;
      if (specificLocation) {
        finalInstructions = `[Campus Location: ${specificLocation}] ${finalInstructions}`;
      }

      const payload = {
        items: items.map((item) => ({
          food_id: item.food_id,
          quantity: item.quantity,
          customizations: item.customizations,
        })),
        delivery_type: deliveryType,
        delivery_fee: deliveryFee,
        payment_method: paymentMethod,
        payment_reference: reference,
        coupon_code: appliedCoupon ? appliedCoupon.code : null,
        special_instructions: finalInstructions || null,
      };

      const response = await api.post('/orders', payload);

      setPlacedOrder(response.data);
      clearCart();
      setShowSuccessModal(true);
    } catch (error) {
      console.error('Order failed', error);
      toast.error('Failed to place order. Please make sure you are logged in.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePlaceOrder = () => {
    if (!isAuthenticated || !user) {
      toast.error('Please login to continue with your payment.');
      navigate('/login?redirect=/checkout');
      return;
    }

    setIsSubmitting(true);

    if (paymentMethod === 'paystack') {
      const paystack = new PaystackPop();
      paystack.newTransaction({
        key: import.meta.env.VITE_PAYSTACK_PUBLIC_KEY,
        email: user?.email || 'customer@snadkitchen.com',
        amount: Math.round(finalTotal * 100), // Kobo
        onSuccess: (transaction: any) => {
          submitOrder(transaction.reference);
        },
        onCancel: () => {
          setIsSubmitting(false);
        },
      });
    } else {
      submitOrder();
    }
  };

  if (items.length === 0) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center bg-slate-50">
        <div className="bg-white p-10 rounded-3xl shadow-sm text-center max-w-md w-full">
          <div className="w-20 h-20 bg-orange-100 text-orange-500 rounded-full flex items-center justify-center mx-auto mb-6">
            <Trash2 className="w-10 h-10" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Your cart is empty</h2>
          <p className="text-gray-500 mb-8">Looks like you haven't added any meals to your cart yet.</p>
          <Link
            to="/menu"
            className="block w-full py-4 rounded-full bg-gradient-to-r from-orange-500 to-red-600 text-white font-bold hover:shadow-lg transition"
          >
            Browse Menu
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-slate-50 min-h-screen pt-10 pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-black text-gray-900 mb-8">Checkout & Payment</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          {/* Left Column: Cart items & Delivery Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Order Items List */}
            <div className="bg-white rounded-3xl shadow-sm p-6 sm:p-8 border border-gray-100">
              <h2 className="text-xl font-bold text-gray-900 border-b border-gray-100 pb-4 mb-6">
                Order Summary ({totalItems()} items)
              </h2>

              <div className="space-y-6">
                {items.map((item, idx) => (
                  <div
                    key={item.id || idx}
                    className="flex items-center justify-between border-b border-gray-50 pb-6 last:border-0 last:pb-0"
                  >
                    <div className="flex items-center space-x-4">
                      <div className="w-16 h-16 bg-orange-100 rounded-2xl flex items-center justify-center flex-shrink-0">
                        {item.image ? (
                          <img src={item.image} alt={item.name} className="w-full h-full object-cover rounded-2xl" />
                        ) : (
                          <span className="text-2xl">🍲</span>
                        )}
                      </div>
                      <div>
                        <h3 className="font-bold text-gray-900">{item.name}</h3>
                        {item.customizations && item.customizations.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1">
                            {item.customizations.map((c, i) => (
                              <span
                                key={i}
                                className="bg-orange-50 text-orange-700 text-[10px] font-bold px-2 py-0.5 rounded-md"
                              >
                                {c}
                              </span>
                            ))}
                          </div>
                        )}
                        {item.instructions && (
                          <p className="text-xs text-gray-400 italic mt-0.5">Note: "{item.instructions}"</p>
                        )}
                        <p className="text-orange-600 font-bold mt-1">₦{item.price.toLocaleString()}</p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-4">
                      <div className="flex items-center bg-gray-100 rounded-full">
                        <button
                          onClick={() => updateQuantity(item.id || item.food_id, Math.max(1, item.quantity - 1))}
                          className="p-2 text-gray-600 hover:text-gray-900 transition"
                        >
                          <Minus className="w-4 h-4" />
                        </button>
                        <span className="w-8 text-center font-bold text-gray-900 text-sm">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.id || item.food_id, item.quantity + 1)}
                          className="p-2 text-gray-600 hover:text-gray-900 transition"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>
                      <button
                        onClick={() => removeItem(item.id || item.food_id)}
                        className="p-2 text-red-500 hover:bg-red-50 rounded-full transition"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Delivery Type Selection */}
            <div className="bg-white rounded-3xl shadow-sm p-6 sm:p-8 border border-gray-100">
              <h2 className="text-xl font-bold text-gray-900 border-b border-gray-100 pb-4 mb-6">Delivery Method</h2>
              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => setDeliveryType('delivery')}
                  className={`p-4 rounded-2xl border-2 text-center font-bold transition ${deliveryType === 'delivery'
                      ? 'border-orange-500 bg-orange-50 text-orange-600'
                      : 'border-gray-200 text-gray-600 hover:border-gray-300'
                    }`}
                >
                  🚴 Campus Delivery
                  <span className="block text-xs font-medium mt-1 opacity-70">₦500 flat fee to JOSTUM campus</span>
                </button>
                <button
                  type="button"
                  onClick={() => setDeliveryType('pickup')}
                  className={`p-4 rounded-2xl border-2 text-center font-bold transition ${deliveryType === 'pickup'
                      ? 'border-orange-500 bg-orange-50 text-orange-600'
                      : 'border-gray-200 text-gray-600 hover:border-gray-300'
                    }`}
                >
                  🏪 Self Pickup
                  <span className="block text-xs font-medium mt-1 opacity-70">Free — Pick up at Snad Kitchen counter</span>
                </button>
              </div>
            </div>

            {/* Campus Delivery Location */}
            {deliveryType === 'delivery' && (
              <div className="bg-white rounded-3xl shadow-sm p-6 sm:p-8 border border-gray-100 space-y-4">
                <h2 className="text-xl font-bold text-gray-900 border-b border-gray-100 pb-4">Campus Delivery Address</h2>

                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                    Select JOSTUM Campus Delivery Spot / Landmark
                  </label>
                  <select
                    value={selectedLocationId}
                    onChange={(e) => {
                      const locId = e.target.value;
                      setSelectedLocationId(locId);
                      const foundLoc = locations.find((l) => String(l.id) === locId);
                      if (foundLoc) {
                        setSpecificLocation(foundLoc.name);
                        setSelectedLocationFee(foundLoc.delivery_fee);
                      }
                    }}
                    className="w-full p-3 rounded-2xl border border-gray-200 text-sm font-semibold focus:ring-2 focus:ring-orange-500 focus:outline-none bg-orange-50/50 text-orange-950"
                  >
                    <option value="">-- Choose a campus delivery spot --</option>
                    {locations.map((loc) => (
                      <option key={loc.id} value={loc.id}>
                        {loc.name} — ₦{loc.delivery_fee.toLocaleString()} delivery fee
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                    Specific Hostel / Building / Room Number
                  </label>
                  <input
                    type="text"
                    placeholder="E.g., Female Hostel Block C, Room 104 or Dean Office, Faculty of Science"
                    value={specificLocation}
                    onChange={(e) => setSpecificLocation(e.target.value)}
                    className="w-full p-3 rounded-2xl border border-gray-200 text-sm focus:ring-2 focus:ring-orange-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                    Delivery Instructions for Rider
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Call when arriving at main gate, leave at front desk, etc."
                    value={deliveryNotes}
                    onChange={(e) => setDeliveryNotes(e.target.value)}
                    className="w-full p-3 rounded-2xl border border-gray-200 text-sm focus:ring-2 focus:ring-orange-500 focus:outline-none"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Order Summary & Coupon */}
          <div className="lg:col-span-1 space-y-6">
            {/* Promo Code Input Card */}
            <div className="bg-white rounded-3xl shadow-sm p-6 border border-gray-100">
              <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-3 flex items-center gap-2">
                <Tag className="w-4 h-4 text-orange-500" /> Have a Promo Code?
              </h3>

              {appliedCoupon ? (
                <div className="bg-green-50 border border-green-200 rounded-2xl p-4 flex items-center justify-between">
                  <div>
                    <span className="bg-green-600 text-white font-extrabold text-xs px-2.5 py-0.5 rounded-full uppercase">
                      {appliedCoupon.code}
                    </span>
                    <p className="text-xs text-green-700 font-semibold mt-1">
                      Saving ₦{appliedCoupon.discount_amount.toLocaleString()}!
                    </p>
                  </div>
                  <button onClick={removeCoupon} className="text-xs font-bold text-red-500 hover:underline">
                    Remove
                  </button>
                </div>
              ) : (
                <form onSubmit={handleApplyCoupon} className="flex gap-2">
                  <input
                    type="text"
                    placeholder="E.g. JOSTUM2026, SNAD10"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value)}
                    className="flex-1 px-4 py-2.5 rounded-2xl border border-gray-200 text-sm font-bold uppercase tracking-wider focus:ring-2 focus:ring-orange-500 focus:outline-none"
                  />
                  <button
                    type="submit"
                    disabled={validatingCoupon}
                    className="bg-gray-900 hover:bg-black text-white px-5 py-2.5 rounded-2xl text-xs font-bold transition disabled:opacity-50"
                  >
                    {validatingCoupon ? 'Checking...' : 'Apply'}
                  </button>
                </form>
              )}
            </div>

            {/* Payment Summary */}
            <div className="bg-white rounded-3xl shadow-sm p-6 sm:p-8 border border-gray-100 sticky top-28 space-y-6">
              <h2 className="text-xl font-bold text-gray-900 border-b border-gray-100 pb-4">Payment Summary</h2>

              <div className="space-y-3 text-sm">
                <div className="flex justify-between text-gray-600">
                  <span>Subtotal</span>
                  <span className="font-bold text-gray-900">₦{rawSubtotal.toLocaleString()}</span>
                </div>

                {appliedCoupon && (
                  <div className="flex justify-between text-green-600 font-bold">
                    <span>Discount ({appliedCoupon.code})</span>
                    <span>-₦{appliedCoupon.discount_amount.toLocaleString()}</span>
                  </div>
                )}

                <div className="flex justify-between text-gray-600">
                  <span>Delivery Fee</span>
                  <span className="font-bold text-gray-900">₦{deliveryFee.toLocaleString()}</span>
                </div>
              </div>

              <div className="border-t border-gray-100 pt-4">
                <div className="flex justify-between items-center">
                  <span className="text-base font-bold text-gray-900">Total Payable</span>
                  <span className="text-2xl font-black text-orange-600">₦{finalTotal.toLocaleString()}</span>
                </div>
              </div>

              <div className="space-y-3">
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Select Payment Method</p>
                <label className="flex items-center p-3.5 border border-gray-200 rounded-2xl cursor-pointer hover:border-orange-500 transition">
                  <input
                    type="radio"
                    name="payment"
                    value="paystack"
                    checked={paymentMethod === 'paystack'}
                    onChange={() => setPaymentMethod('paystack')}
                    className="w-4 h-4 text-orange-600 focus:ring-orange-500 border-gray-300"
                  />
                  <span className="ml-3 text-sm font-bold text-gray-900">Paystack (Instant Card / Transfer)</span>
                </label>
                <label className="flex items-center p-3.5 border border-gray-200 rounded-2xl cursor-pointer hover:border-orange-500 transition">
                  <input
                    type="radio"
                    name="payment"
                    value="cod"
                    checked={paymentMethod === 'cod'}
                    onChange={() => setPaymentMethod('cod')}
                    className="w-4 h-4 text-orange-600 focus:ring-orange-500 border-gray-300"
                  />
                  <span className="ml-3 text-sm font-bold text-gray-900">Cash on Campus Delivery</span>
                </label>
              </div>

              <button
                onClick={handlePlaceOrder}
                disabled={isSubmitting}
                className="w-full flex items-center justify-center space-x-2 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white py-4 rounded-2xl font-black shadow-lg hover:shadow-xl transition transform active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Processing Order...</span>
                  </>
                ) : (
                  <>
                    <span>Confirm Order • ₦{finalTotal.toLocaleString()}</span>
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Order Success Modal */}
      {showSuccessModal && placedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-8 max-w-lg w-full text-center relative shadow-2xl">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-10 h-10 text-green-500 animate-bounce" />
            </div>
            <h2 className="text-2xl font-black text-gray-900 mb-1">Order Placed Successfully!</h2>
            <p className="text-gray-500 text-sm mb-6">
              Order <strong className="text-gray-900">#{placedOrder.order_number}</strong> received.
            </p>

            <div className="text-left mb-6 overflow-hidden rounded-2xl border border-gray-200">
              <table className="w-full text-xs">
                <thead className="bg-gray-50 text-gray-700 border-b border-gray-200 font-bold">
                  <tr>
                    <th className="px-3 py-2.5 text-left">Item</th>
                    <th className="px-3 py-2.5 text-center">Qty</th>
                    <th className="px-3 py-2.5 text-right">Price</th>
                  </tr>
                </thead>
                <tbody>
                  {placedOrder.items.map((item: any, index: number) => (
                    <tr key={index} className="border-b last:border-0 border-gray-100">
                      <td className="px-3 py-2.5 font-semibold text-gray-900">{item.food?.name}</td>
                      <td className="px-3 py-2.5 text-center text-gray-600">{item.quantity}</td>
                      <td className="px-3 py-2.5 text-right text-gray-900 font-bold">
                        ₦{Number(item.unit_price).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-orange-50 border-t border-orange-100">
                  <tr>
                    <td colSpan={2} className="px-3 py-2.5 font-black text-gray-900 text-right">
                      Total Paid:
                    </td>
                    <td className="px-3 py-2.5 font-black text-orange-600 text-right">
                      ₦{Number(placedOrder.total_amount).toLocaleString()}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>

            <div className="flex gap-3 justify-center items-center">
              <button
                onClick={() => {
                  setShowSuccessModal(false);
                  navigate(`/track?order_number=${placedOrder.order_number}`);
                }}
                className="flex-1 bg-gray-900 hover:bg-black text-white font-extrabold py-3.5 rounded-2xl text-sm sm:text-base transition text-center flex justify-center items-center"
              >
                Track Order
              </button>
              <button
                onClick={() => {
                  setShowSuccessModal(false);
                  navigate('/dashboard');
                }}
                className="flex-1 bg-orange-500 hover:bg-orange-600 text-white font-extrabold py-3.5 rounded-2xl text-sm sm:text-base transition text-center flex justify-center items-center"
              >
                Go to Dashboard
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
