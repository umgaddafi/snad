export default function Privacy() {
  return (
    <div className="bg-slate-50 min-h-screen pt-10 pb-20">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-4xl font-extrabold text-gray-900 mb-8">Privacy Policy</h1>
        <div className="bg-white p-8 sm:p-12 rounded-3xl shadow-sm border border-gray-100 space-y-6 text-gray-600 leading-relaxed">
          <p>Last updated: {new Date().toLocaleDateString()}</p>
          
          <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">1. Information We Collect</h2>
          <p>When you register on Snad Kitchen or place an order, we collect personal information such as your name, email address, phone number, and campus delivery location. We do not store your credit card information; all online transactions are securely processed by Paystack.</p>

          <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">2. How We Use Your Information</h2>
          <p>We use your information exclusively to process and deliver your orders, send order confirmation emails, and improve our services. We may occasionally send promotional offers, which you can opt out of at any time.</p>

          <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">3. Information Sharing</h2>
          <p>We do not sell, trade, or rent your personal information to third parties. Your delivery details are shared only with our internal dispatch riders to ensure your food reaches you.</p>

          <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">4. Data Security</h2>
          <p>We implement strict security measures to protect your personal data from unauthorized access. Your account is protected by a password, and all communications between your browser and our servers are encrypted using standard web protocols.</p>

          <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">5. Your Rights</h2>
          <p>You have the right to access, update, or request the deletion of your personal information at any time. To do so, please contact our support team.</p>

          <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">6. Contact Us</h2>
          <p>For any privacy-related concerns, email us at privacy@snadkitchen.com.</p>
        </div>
      </div>
    </div>
  );
}
