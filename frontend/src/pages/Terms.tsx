export default function Terms() {
  return (
    <div className="bg-slate-50 min-h-screen pt-10 pb-20">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-4xl font-extrabold text-gray-900 mb-8">Terms & Conditions</h1>
        <div className="bg-white p-8 sm:p-12 rounded-3xl shadow-sm border border-gray-100 space-y-6 text-gray-600 leading-relaxed">
          <p>Last updated: {new Date().toLocaleDateString()}</p>
          
          <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">1. Introduction</h2>
          <p>Welcome to Snad Kitchen. By accessing our platform or placing an order, you agree to be bound by these Terms and Conditions. Our platform is exclusively designed to serve the Joseph Sarwuan Tarka University (JOSTUM) community.</p>

          <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">2. Ordering and Delivery</h2>
          <p>All orders placed through the Snad Kitchen platform are subject to availability and acceptance by our kitchen. Delivery times are estimates and may vary based on demand, weather, and campus security protocols. We only deliver within approved campus zones.</p>

          <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">3. Payment Terms</h2>
          <p>We accept Cash on Delivery and online payments via Paystack. If you choose online payment, you must ensure you have sufficient funds. Fraudulent chargebacks or refusal to pay upon delivery may result in a permanent ban from our platform.</p>

          <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">4. Cancellations and Refunds</h2>
          <p>Orders can only be cancelled before they enter the "Cooking" stage. Once preparation has begun, you are obligated to accept and pay for the order. Refunds for failed deliveries due to our fault will be processed within 3-5 business days to your original payment method.</p>

          <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">5. Modifications</h2>
          <p>Snad Kitchen reserves the right to modify prices, delivery fees, and menu items without prior notice. However, the price shown at checkout is the final price you will pay for that specific order.</p>

          <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">6. Contact Information</h2>
          <p>If you have any questions about these Terms, please contact us at support@snadkitchen.com.</p>
        </div>
      </div>
    </div>
  );
}
