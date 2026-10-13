import { useQuery } from '@tanstack/react-query';
import api from '@/lib/axios';
import { renderLegalContent } from '@/pages/Terms';

export const DEFAULT_PRIVACY = `<h2>1. Information We Collect</h2>
<p>When you register on Snad Kitchen or place an order, we collect personal information such as your <strong>name</strong>, <strong>email address</strong>, <strong>phone number</strong>, and <strong>campus delivery location</strong>. We do not store your credit card information; all online transactions are securely processed by Paystack.</p>

<h2>2. How We Use Your Information</h2>
<p>We use your information exclusively to process and deliver your orders, send order confirmation emails, and improve our services. We may occasionally send promotional offers, which you can opt out of at any time.</p>

<h2>3. Information Sharing</h2>
<p>We <em>do not sell, trade, or rent</em> your personal information to third parties. Your delivery details are shared only with our internal dispatch riders to ensure your food reaches you.</p>

<h2>4. Data Security</h2>
<p>We implement strict security measures to protect your personal data from unauthorized access. Your account is protected by a password, and all communications between your browser and our servers are encrypted using standard web protocols.</p>

<h2>5. Your Rights</h2>
<p>You have the right to access, update, or request the deletion of your personal information at any time. To do so, please contact our support team.</p>

<h2>6. Contact Us</h2>
<p>For any privacy-related concerns, email us at <a href="mailto:privacy@snadkitchen.com">privacy@snadkitchen.com</a>.</p>`;

export default function Privacy() {
  const { data: settings } = useQuery({
    queryKey: ['settings'],
    queryFn: async () => {
      const res = await api.get('/settings');
      return res.data;
    }
  });

  const title = settings?.privacy_title || 'Privacy Policy';
  const lastUpdated = settings?.privacy_last_updated || new Date().toLocaleDateString();
  const content = settings?.privacy_content || DEFAULT_PRIVACY;

  return (
    <div className="bg-slate-50 min-h-screen pt-10 pb-20">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-4xl font-extrabold text-gray-900 mb-8">{title}</h1>
        <div className="bg-white p-8 sm:p-12 rounded-3xl shadow-sm border border-gray-100 space-y-6 text-gray-600 leading-relaxed">
          <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider">
            Last updated: {lastUpdated}
          </p>
          
          <div className="pt-2">
            {renderLegalContent(content)}
          </div>
        </div>
      </div>
    </div>
  );
}
