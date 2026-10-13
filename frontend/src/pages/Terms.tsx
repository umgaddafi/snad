import { useQuery } from '@tanstack/react-query';
import api from '@/lib/axios';

export const DEFAULT_TERMS = `<h2>1. Introduction</h2>
<p>Welcome to <strong>Snad Kitchen</strong>. By accessing our platform or placing an order, you agree to be bound by these Terms and Conditions. Our platform is exclusively designed to serve the Joseph Sarwuan Tarka University (JOSTUM) community.</p>

<h2>2. Ordering and Delivery</h2>
<p>All orders placed through the Snad Kitchen platform are subject to availability and acceptance by our kitchen. Delivery times are estimates and may vary based on demand, weather, and campus security protocols. We only deliver within approved campus zones.</p>

<h2>3. Payment Terms</h2>
<p>We accept <strong>Cash on Delivery</strong> and <strong>online payments via Paystack</strong>. If you choose online payment, you must ensure you have sufficient funds. Fraudulent chargebacks or refusal to pay upon delivery may result in a permanent ban from our platform.</p>

<h2>4. Cancellations and Refunds</h2>
<p>Orders can only be cancelled before they enter the <em>Cooking</em> stage. Once preparation has begun, you are obligated to accept and pay for the order. Refunds for failed deliveries due to our fault will be processed within 3-5 business days to your original payment method.</p>

<h2>5. Modifications</h2>
<p>Snad Kitchen reserves the right to modify prices, delivery fees, and menu items without prior notice. However, the price shown at checkout is the final price you will pay for that specific order.</p>

<h2>6. Contact Information</h2>
<p>If you have any questions about these Terms, please contact us at <a href="mailto:support@snadkitchen.com">support@snadkitchen.com</a>.</p>`;

export function renderLegalContent(content: string) {
  if (!content) return null;

  // HTML content check (from CKEditor)
  if (/<[a-z][\s\S]*>/i.test(content)) {
    return (
      <div 
        className="legal-prose text-gray-600 leading-relaxed" 
        dangerouslySetInnerHTML={{ __html: content }} 
      />
    );
  }

  // Fallback for plain text format
  const blocks = content.split(/\n\s*\n/);
  return (
    <div className="space-y-6">
      {blocks.map((block, idx) => {
        const trimmed = block.trim();
        if (!trimmed) return null;

        if (trimmed.startsWith('# ') || trimmed.startsWith('## ') || trimmed.startsWith('### ')) {
          const headingText = trimmed.replace(/^#+\s*/, '');
          return (
            <h2 key={idx} className="text-2xl font-bold text-gray-900 mt-8 mb-4">
              {headingText}
            </h2>
          );
        }

        const lines = trimmed.split('\n');
        if (lines.length > 1 && /^(\d+\.|\bSection\b)/i.test(lines[0])) {
          return (
            <div key={idx} className="space-y-3">
              <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-3">{lines[0]}</h2>
              {lines.slice(1).map((line, lIdx) => (
                <p key={lIdx} className="leading-relaxed">{line}</p>
              ))}
            </div>
          );
        }

        if (/^(\d+\.|\bSection\b)/i.test(trimmed) && trimmed.length < 90) {
          return (
            <h2 key={idx} className="text-2xl font-bold text-gray-900 mt-8 mb-4">
              {trimmed}
            </h2>
          );
        }

        return (
          <p key={idx} className="leading-relaxed">
            {trimmed}
          </p>
        );
      })}
    </div>
  );
}

export default function Terms() {
  const { data: settings } = useQuery({
    queryKey: ['settings'],
    queryFn: async () => {
      const res = await api.get('/settings');
      return res.data;
    }
  });

  const title = settings?.terms_title || 'Terms & Conditions';
  const lastUpdated = settings?.terms_last_updated || new Date().toLocaleDateString();
  const content = settings?.terms_content || DEFAULT_TERMS;

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
