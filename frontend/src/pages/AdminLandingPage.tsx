import { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { 
  Save, 
  Loader2, 
  Trash2, 
  Plus, 
  Sparkles, 
  Star, 
  HelpCircle, 
  MapPin, 
  ExternalLink, 
  Image as ImageIcon, 
  Truck, 
  Clock, 
  ShoppingBag,
  RefreshCw,
  Eye,
  FileText
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/axios';
import { resolveLandingImageUrl } from '@/lib/media';
import RichTextEditor from '@/components/RichTextEditor';
import { DEFAULT_TERMS } from '@/pages/Terms';
import { DEFAULT_PRIVACY } from '@/pages/Privacy';

interface TestimonialItem {
  name: string;
  location: string;
  rating: number;
  comment: string;
  avatar_letter?: string;
  avatar_bg?: string;
  avatar_color?: string;
}

interface FaqItemData {
  question: string;
  answer: string;
}

interface StepItem {
  step: string;
  title: string;
  desc: string;
  href?: string;
}

interface FeatureItem {
  icon: string;
  title: string;
  desc: string;
}

interface StatItem {
  value: string;
  label: string;
}

const DEFAULT_HERO_IMAGE = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80';

const DEFAULT_HOW_STEPS: StepItem[] = [
  { step: '1', title: 'Browse Menu', desc: 'Explore our wide variety of premium meals, drinks, and combos prepared fresh daily.', href: '/menu' },
  { step: '2', title: 'Place Order & Pay', desc: 'Add items to cart, choose delivery or pickup, and pay securely via Paystack or Cash.' },
  { step: '3', title: 'Get Delivered', desc: 'Track your order in real-time. Our rider brings your food hot and fresh to your door.' },
];

const DEFAULT_FEATURES: FeatureItem[] = [
  { icon: 'Truck', title: 'Campus Delivery', desc: 'Fast delivery directly to any hostel, faculty or office within JOSTUM campus.' },
  { icon: 'Star', title: 'Premium Quality', desc: 'Prepared with the freshest ingredients by our top-rated executive chefs.' },
  { icon: 'Clock', title: 'Live Tracking', desc: 'Know exactly where your food is with our real-time order tracking timeline.' },
];

const DEFAULT_STATS: StatItem[] = [
  { value: '500+', label: 'Orders Delivered' },
  { value: '50+', label: 'Menu Items' },
  { value: '200+', label: 'Happy Customers' },
  { value: '15 min', label: 'Avg. Delivery' },
];

const DEFAULT_TESTIMONIALS: TestimonialItem[] = [
  {
    name: 'Aisha T.',
    location: 'South Core',
    rating: 5,
    comment: 'Absolutely the best food delivery on campus! The Jollof Rice was hot and fresh, and it arrived right at my hostel block in under 20 minutes.',
    avatar_letter: 'A',
    avatar_bg: 'bg-orange-100',
    avatar_color: 'text-orange-600'
  },
  {
    name: 'Emmanuel P.',
    location: 'North Core',
    rating: 5,
    comment: 'Snad Kitchen saved me during exam week. The portions are huge, the quality is premium, and tracking the rider is super convenient.',
    avatar_letter: 'E',
    avatar_bg: 'bg-blue-100',
    avatar_color: 'text-blue-600'
  },
  {
    name: 'Daniel O.',
    location: 'Staff Quarters',
    rating: 4,
    comment: 'Their Fried Rice is top-notch! The app is very smooth and easy to use. I just wish they added more drinks to the menu. Overall, excellent service.',
    avatar_letter: 'D',
    avatar_bg: 'bg-green-100',
    avatar_color: 'text-green-600'
  }
];

const DEFAULT_FAQS: FaqItemData[] = [
  { question: 'Where does Snad Kitchen deliver?', answer: 'We deliver to all hostels (South Core, North Core), faculties, departments, staff quarters, and any landmark within JOSTUM campus.' },
  { question: 'What payment methods do you accept?', answer: 'We accept card payments via Paystack (Visa, Mastercard, Verve), bank transfers, and Cash on Delivery.' },
  { question: 'How long does delivery take?', answer: 'Most orders are delivered within 15-30 minutes depending on your location on campus and order volume.' },
  { question: 'Can I cancel my order?', answer: 'You can cancel your order while it\'s still in \'Pending\' status. Once preparation starts, cancellations are not possible.' },
  { question: 'How do I track my order?', answer: 'After placing your order, you\'ll receive a Tracking ID via SMS and email. Use it on our Track Order page to see real-time updates.' },
  { question: 'Do you offer student discounts?', answer: 'Yes! We frequently run student promotions and combo deals. Follow our WhatsApp or check the app for the latest offers.' }
];

export default function AdminLandingPage() {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [searchParams] = useSearchParams();
  const initialTab = (searchParams.get('tab') as any) || 'hero';
  const [activeTab, setActiveTab] = useState<'hero' | 'stats' | 'how' | 'features' | 'testimonials' | 'faqs' | 'cta_map' | 'legal'>(initialTab);
  const [legalSubTab, setLegalSubTab] = useState<'terms' | 'privacy'>('terms');
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    // Hero
    landing_hero_badge: "🚀 JOSTUM's #1 Food Delivery",
    landing_hero_title: 'Delicious meals,',
    landing_hero_title_highlight: 'delivered fast.',
    landing_hero_subtitle: 'Experience the best restaurant quality food right here on campus. Freshly prepared, securely packaged, and delivered to your hostel or office.',
    landing_hero_order_btn_text: 'Order Now',
    landing_hero_track_btn_text: 'Track Order',
    landing_hero_image: DEFAULT_HERO_IMAGE,
    landing_hero_card_title: 'Special Fried Rice',
    landing_hero_card_price: '₦2,500',
    landing_hero_card_rating: '4.8',
    landing_hero_card_btn_text: 'Order Now',

    // Stats
    landing_stats: DEFAULT_STATS,

    // How it works
    landing_how_title: 'How It Works',
    landing_how_subtitle: 'Order your favorite meal in 3 simple steps',
    landing_how_steps: DEFAULT_HOW_STEPS,

    // Features
    landing_features: DEFAULT_FEATURES,

    // Popular Meals titles
    landing_popular_title: 'Popular Meals',
    landing_popular_subtitle: 'Our most loved dishes by JOSTUM students',

    // Testimonials
    landing_testimonials_title: 'What Our Customers Say',
    landing_testimonials_subtitle: "Don't just take our word for it. Here is what JOSTUM students are saying.",
    landing_testimonials: DEFAULT_TESTIMONIALS,

    // FAQ
    landing_faq_title: 'Frequently Asked Questions',
    landing_faq_subtitle: "Got questions? We've got answers.",
    landing_faqs: DEFAULT_FAQS,

    // CTA
    landing_cta_title: "Hungry? We've got you covered.",
    landing_cta_subtitle: 'Browse our premium menu and get your food delivered to your door in minutes.',
    landing_cta_btn_text: 'Start Your Order',

    // Map
    landing_map_title: 'Find Us On Campus',
    landing_map_subtitle: 'Stop by our premium kitchen at JOSTUM.',
    landing_map_iframe_url: 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3952.9672704162585!2d8.61923577500506!3d7.793290092226731!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x1050856bd43e2a31%3A0x809e98b3180176a9!2sSnad%20kitchen!5e0!3m2!1sen!2sng!4v1784515705679!5m2!1sen!2sng',

    // Legal Pages
    terms_title: 'Terms & Conditions',
    terms_last_updated: '',
    terms_content: DEFAULT_TERMS,

    privacy_title: 'Privacy Policy',
    privacy_last_updated: '',
    privacy_content: DEFAULT_PRIVACY
  });

  const { data: settings, isLoading } = useQuery({
    queryKey: ['settings'],
    queryFn: async () => {
      const res = await api.get('/settings');
      return res.data;
    }
  });

  useEffect(() => {
    if (settings) {
      setFormData(prev => ({
        ...prev,
        landing_hero_badge: settings.landing_hero_badge ?? prev.landing_hero_badge,
        landing_hero_title: settings.landing_hero_title ?? prev.landing_hero_title,
        landing_hero_title_highlight: settings.landing_hero_title_highlight ?? prev.landing_hero_title_highlight,
        landing_hero_subtitle: settings.landing_hero_subtitle ?? prev.landing_hero_subtitle,
        landing_hero_order_btn_text: settings.landing_hero_order_btn_text ?? prev.landing_hero_order_btn_text,
        landing_hero_track_btn_text: settings.landing_hero_track_btn_text ?? prev.landing_hero_track_btn_text,
        landing_hero_image: settings.landing_hero_image || prev.landing_hero_image,
        landing_hero_card_title: settings.landing_hero_card_title ?? prev.landing_hero_card_title,
        landing_hero_card_price: settings.landing_hero_card_price ?? prev.landing_hero_card_price,
        landing_hero_card_rating: settings.landing_hero_card_rating ?? prev.landing_hero_card_rating,
        landing_hero_card_btn_text: settings.landing_hero_card_btn_text ?? prev.landing_hero_card_btn_text,

        landing_stats: Array.isArray(settings.landing_stats) && settings.landing_stats.length > 0 
          ? settings.landing_stats 
          : prev.landing_stats,

        landing_how_title: settings.landing_how_title ?? prev.landing_how_title,
        landing_how_subtitle: settings.landing_how_subtitle ?? prev.landing_how_subtitle,
        landing_how_steps: Array.isArray(settings.landing_how_steps) && settings.landing_how_steps.length > 0 
          ? settings.landing_how_steps 
          : prev.landing_how_steps,

        landing_features: Array.isArray(settings.landing_features) && settings.landing_features.length > 0 
          ? settings.landing_features 
          : prev.landing_features,

        landing_popular_title: settings.landing_popular_title ?? prev.landing_popular_title,
        landing_popular_subtitle: settings.landing_popular_subtitle ?? prev.landing_popular_subtitle,

        landing_testimonials_title: settings.landing_testimonials_title ?? prev.landing_testimonials_title,
        landing_testimonials_subtitle: settings.landing_testimonials_subtitle ?? prev.landing_testimonials_subtitle,
        landing_testimonials: Array.isArray(settings.landing_testimonials) && settings.landing_testimonials.length > 0 
          ? settings.landing_testimonials 
          : prev.landing_testimonials,

        landing_faq_title: settings.landing_faq_title ?? prev.landing_faq_title,
        landing_faq_subtitle: settings.landing_faq_subtitle ?? prev.landing_faq_subtitle,
        landing_faqs: Array.isArray(settings.landing_faqs) && settings.landing_faqs.length > 0 
          ? settings.landing_faqs 
          : prev.landing_faqs,

        landing_cta_title: settings.landing_cta_title ?? prev.landing_cta_title,
        landing_cta_subtitle: settings.landing_cta_subtitle ?? prev.landing_cta_subtitle,
        landing_cta_btn_text: settings.landing_cta_btn_text ?? prev.landing_cta_btn_text,

        landing_map_title: settings.landing_map_title ?? prev.landing_map_title,
        landing_map_subtitle: settings.landing_map_subtitle ?? prev.landing_map_subtitle,
        landing_map_iframe_url: settings.landing_map_iframe_url ?? prev.landing_map_iframe_url,

        terms_title: settings.terms_title ?? prev.terms_title,
        terms_last_updated: settings.terms_last_updated ?? prev.terms_last_updated,
        terms_content: settings.terms_content ?? prev.terms_content,

        privacy_title: settings.privacy_title ?? prev.privacy_title,
        privacy_last_updated: settings.privacy_last_updated ?? prev.privacy_last_updated,
        privacy_content: settings.privacy_content ?? prev.privacy_content
      }));
    }
  }, [settings]);

  const saveMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      return api.post('/settings', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings'] });
      toast.success('Landing page components updated successfully!');
    },
    onError: () => {
      toast.error('Failed to update landing page settings.');
    }
  });

  // Handle uploading image to the disk folder
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please select a valid image file');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size must be less than 5MB');
      return;
    }

    const uploadData = new FormData();
    uploadData.append('image', file);

    setIsUploadingImage(true);
    const toastId = toast.loading('Uploading image to server disk folder...');

    try {
      const res = await api.post('/settings/upload-image', uploadData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (res.data?.path) {
        setFormData(prev => ({
          ...prev,
          landing_hero_image: res.data.path
        }));
        toast.success('Image saved to disk folder! Path recorded.', { id: toastId });
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to upload image.', { id: toastId });
    } finally {
      setIsUploadingImage(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center p-12">
        <Loader2 className="w-10 h-10 animate-spin text-orange-500" />
      </div>
    );
  }

  return (
    <div className="max-w-5xl space-y-6 pb-20">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 bg-orange-100 text-orange-600 rounded-xl">
              <Sparkles className="w-5 h-5" />
            </span>
            <h2 className="text-2xl font-black text-gray-900">Landing Page CMS</h2>
          </div>
          <p className="text-sm text-gray-500 mt-1 font-medium">
            Manage your hero banners, texts, testimonials, and FAQs live without altering code.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <a
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-2xl border border-gray-200 text-gray-700 text-xs font-bold hover:bg-gray-50 transition"
          >
            <Eye className="w-4 h-4 text-gray-500" />
            <span>View Live Site</span>
            <ExternalLink className="w-3.5 h-3.5 text-gray-400" />
          </a>

          <button
            type="button"
            onClick={() => saveMutation.mutate(formData)}
            disabled={saveMutation.isPending || isUploadingImage}
            className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-2.5 rounded-2xl font-bold text-xs transition flex items-center gap-2 shadow-lg shadow-orange-200 disabled:opacity-60"
          >
            {saveMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            <span>Save All Changes</span>
          </button>
        </div>
      </div>

      {/* Tabs Bar */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-gray-100 scrollbar-none">
        {[
          { id: 'hero', label: 'Hero Banner', icon: Sparkles },
          { id: 'stats', label: 'Stats Counter', icon: Clock },
          { id: 'how', label: 'How It Works', icon: ShoppingBag },
          { id: 'features', label: 'Features', icon: Truck },
          { id: 'testimonials', label: 'Testimonials', icon: Star },
          { id: 'faqs', label: 'FAQs', icon: HelpCircle },
          { id: 'cta_map', label: 'CTA & Map', icon: MapPin },
          { id: 'legal', label: 'Terms & Privacy', icon: FileText },
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-5 py-3 rounded-2xl text-xs font-bold shrink-0 transition ${
                isActive 
                  ? 'bg-orange-500 text-white shadow-md shadow-orange-100' 
                  : 'bg-white text-gray-600 border border-gray-100 hover:bg-gray-50'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB CONTENT: HERO */}
      {activeTab === 'hero' && (
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-gray-100 shadow-sm space-y-6">
          <div className="border-b border-gray-100 pb-4">
            <h3 className="text-lg font-black text-gray-900">Hero Section Content</h3>
            <p className="text-xs text-gray-500">Customize the top headline, subtext, badges, and image shown to visitors.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-extrabold uppercase tracking-wider text-gray-700 mb-2">
                Pill Badge Text
              </label>
              <input
                type="text"
                value={formData.landing_hero_badge}
                onChange={e => setFormData({ ...formData, landing_hero_badge: e.target.value })}
                className="w-full px-4 py-3 rounded-2xl border border-gray-200 text-sm font-medium focus:ring-2 focus:ring-orange-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-extrabold uppercase tracking-wider text-gray-700 mb-2">
                Primary Headline (Line 1)
              </label>
              <input
                type="text"
                value={formData.landing_hero_title}
                onChange={e => setFormData({ ...formData, landing_hero_title: e.target.value })}
                className="w-full px-4 py-3 rounded-2xl border border-gray-200 text-sm font-medium focus:ring-2 focus:ring-orange-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-extrabold uppercase tracking-wider text-gray-700 mb-2">
                Gradient Highlight Headline (Line 2)
              </label>
              <input
                type="text"
                value={formData.landing_hero_title_highlight}
                onChange={e => setFormData({ ...formData, landing_hero_title_highlight: e.target.value })}
                className="w-full px-4 py-3 rounded-2xl border border-gray-200 text-sm font-medium focus:ring-2 focus:ring-orange-500 focus:outline-none text-orange-600"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-extrabold uppercase tracking-wider text-gray-700 mb-2">
                Hero Subtitle / Description
              </label>
              <textarea
                rows={3}
                value={formData.landing_hero_subtitle}
                onChange={e => setFormData({ ...formData, landing_hero_subtitle: e.target.value })}
                className="w-full px-4 py-3 rounded-2xl border border-gray-200 text-sm font-medium focus:ring-2 focus:ring-orange-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-extrabold uppercase tracking-wider text-gray-700 mb-2">
                Primary CTA Button Label
              </label>
              <input
                type="text"
                value={formData.landing_hero_order_btn_text}
                onChange={e => setFormData({ ...formData, landing_hero_order_btn_text: e.target.value })}
                className="w-full px-4 py-3 rounded-2xl border border-gray-200 text-sm font-medium focus:ring-2 focus:ring-orange-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-extrabold uppercase tracking-wider text-gray-700 mb-2">
                Secondary CTA Button Label
              </label>
              <input
                type="text"
                value={formData.landing_hero_track_btn_text}
                onChange={e => setFormData({ ...formData, landing_hero_track_btn_text: e.target.value })}
                className="w-full px-4 py-3 rounded-2xl border border-gray-200 text-sm font-medium focus:ring-2 focus:ring-orange-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Hero Image Disk Folder Upload Section */}
          <div className="mt-8 pt-6 border-t border-gray-100">
            <h4 className="text-base font-black text-gray-900 mb-1 flex items-center gap-2">
              <ImageIcon className="w-5 h-5 text-orange-500" />
              <span>Hero Image (Stored in Server Folder)</span>
            </h4>
            <p className="text-xs text-gray-500 mb-4">
              Files uploaded here are saved directly to the server filesystem (<code className="bg-gray-100 px-1 py-0.5 rounded text-orange-600">backend/public/uploads/landing/</code>). Only the relative path is stored in the database.
            </p>

            <div className="flex flex-col sm:flex-row items-start gap-6">
              <div className="relative w-full sm:w-64 h-44 rounded-2xl overflow-hidden border border-gray-200 bg-gray-50 shadow-inner shrink-0 group">
                <img
                  src={resolveLandingImageUrl(formData.landing_hero_image, DEFAULT_HERO_IMAGE)}
                  alt="Hero Preview"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-white text-xs font-bold">
                  Current Hero Image
                </div>
              </div>

              <div className="flex-1 space-y-4 w-full">
                <div>
                  <label className="block text-xs font-extrabold uppercase tracking-wider text-gray-700 mb-2">
                    Upload New Image to Server Disk
                  </label>
                  <input
                    type="file"
                    ref={fileInputRef}
                    accept="image/*"
                    onChange={handleImageUpload}
                    disabled={isUploadingImage}
                    className="block w-full text-xs text-gray-500 file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-orange-50 file:text-orange-700 hover:file:bg-orange-100 cursor-pointer"
                  />
                  {isUploadingImage && (
                    <div className="flex items-center gap-2 text-xs text-orange-600 font-bold mt-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Saving file to server uploads folder...</span>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-extrabold uppercase tracking-wider text-gray-700 mb-1">
                    Or Stored Image Path / External URL
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={formData.landing_hero_image}
                      onChange={e => setFormData({ ...formData, landing_hero_image: e.target.value })}
                      placeholder="/uploads/landing/example.jpg or https://..."
                      className="flex-1 px-4 py-2.5 rounded-2xl border border-gray-200 text-xs font-mono focus:ring-2 focus:ring-orange-500 focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, landing_hero_image: DEFAULT_HERO_IMAGE })}
                      className="px-3 py-2.5 rounded-2xl border border-gray-200 text-xs font-bold text-gray-600 hover:bg-gray-50 flex items-center gap-1 shrink-0"
                      title="Reset to default image"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>Reset</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Floating Card Details */}
          <div className="mt-8 pt-6 border-t border-gray-100">
            <h4 className="text-base font-black text-gray-900 mb-1">Floating Meal Badge on Hero</h4>
            <p className="text-xs text-gray-500 mb-4">The frosted glass card overlay shown over the hero image.</p>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-extrabold uppercase tracking-wider text-gray-700 mb-1">
                  Card Meal Name
                </label>
                <input
                  type="text"
                  value={formData.landing_hero_card_title}
                  onChange={e => setFormData({ ...formData, landing_hero_card_title: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-2xl border border-gray-200 text-sm font-medium focus:ring-2 focus:ring-orange-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-extrabold uppercase tracking-wider text-gray-700 mb-1">
                  Card Price Text
                </label>
                <input
                  type="text"
                  value={formData.landing_hero_card_price}
                  onChange={e => setFormData({ ...formData, landing_hero_card_price: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-2xl border border-gray-200 text-sm font-medium focus:ring-2 focus:ring-orange-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-extrabold uppercase tracking-wider text-gray-700 mb-1">
                  Card Rating (e.g. 4.8)
                </label>
                <input
                  type="text"
                  value={formData.landing_hero_card_rating}
                  onChange={e => setFormData({ ...formData, landing_hero_card_rating: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-2xl border border-gray-200 text-sm font-medium focus:ring-2 focus:ring-orange-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-extrabold uppercase tracking-wider text-gray-700 mb-1">
                  Card Button Text
                </label>
                <input
                  type="text"
                  value={formData.landing_hero_card_btn_text}
                  onChange={e => setFormData({ ...formData, landing_hero_card_btn_text: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-2xl border border-gray-200 text-sm font-medium focus:ring-2 focus:ring-orange-500 focus:outline-none"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT: STATS */}
      {activeTab === 'stats' && (
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-gray-100 shadow-sm space-y-6">
          <div className="border-b border-gray-100 pb-4">
            <h3 className="text-lg font-black text-gray-900">Key Metrics / Counter Bar</h3>
            <p className="text-xs text-gray-500">Edit the 4 achievement counters highlighted on the landing page.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
            {formData.landing_stats.map((stat, idx) => (
              <div key={idx} className="p-5 rounded-2xl bg-gray-50 border border-gray-100 space-y-3">
                <span className="text-[10px] font-black uppercase text-orange-600 tracking-wider">
                  Counter #{idx + 1}
                </span>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Value (e.g. 500+)</label>
                  <input
                    type="text"
                    value={stat.value}
                    onChange={e => {
                      const next = [...formData.landing_stats];
                      next[idx].value = e.target.value;
                      setFormData({ ...formData, landing_stats: next });
                    }}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm font-black focus:ring-2 focus:ring-orange-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Label (e.g. Orders)</label>
                  <input
                    type="text"
                    value={stat.label}
                    onChange={e => {
                      const next = [...formData.landing_stats];
                      next[idx].label = e.target.value;
                      setFormData({ ...formData, landing_stats: next });
                    }}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs font-medium focus:ring-2 focus:ring-orange-500 focus:outline-none"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB CONTENT: HOW IT WORKS */}
      {activeTab === 'how' && (
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-gray-100 shadow-sm space-y-6">
          <div className="border-b border-gray-100 pb-4">
            <h3 className="text-lg font-black text-gray-900">How It Works Section</h3>
            <p className="text-xs text-gray-500">Manage the 3 step process explained to new customers.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
            <div>
              <label className="block text-xs font-extrabold uppercase tracking-wider text-gray-700 mb-2">
                Section Heading
              </label>
              <input
                type="text"
                value={formData.landing_how_title}
                onChange={e => setFormData({ ...formData, landing_how_title: e.target.value })}
                className="w-full px-4 py-3 rounded-2xl border border-gray-200 text-sm font-medium focus:ring-2 focus:ring-orange-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-extrabold uppercase tracking-wider text-gray-700 mb-2">
                Section Subtitle
              </label>
              <input
                type="text"
                value={formData.landing_how_subtitle}
                onChange={e => setFormData({ ...formData, landing_how_subtitle: e.target.value })}
                className="w-full px-4 py-3 rounded-2xl border border-gray-200 text-sm font-medium focus:ring-2 focus:ring-orange-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="space-y-4">
            {formData.landing_how_steps.map((step, idx) => (
              <div key={idx} className="p-5 rounded-2xl bg-gray-50 border border-gray-100 flex flex-col sm:flex-row gap-4 items-start">
                <div className="w-10 h-10 rounded-xl bg-orange-500 text-white flex items-center justify-center font-black text-sm shrink-0">
                  {step.step || idx + 1}
                </div>
                <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Step Title</label>
                    <input
                      type="text"
                      value={step.title}
                      onChange={e => {
                        const next = [...formData.landing_how_steps];
                        next[idx].title = e.target.value;
                        setFormData({ ...formData, landing_how_steps: next });
                      }}
                      className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm font-bold focus:ring-2 focus:ring-orange-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Link (Optional)</label>
                    <input
                      type="text"
                      value={step.href || ''}
                      onChange={e => {
                        const next = [...formData.landing_how_steps];
                        next[idx].href = e.target.value;
                        setFormData({ ...formData, landing_how_steps: next });
                      }}
                      placeholder="/menu"
                      className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs font-medium focus:ring-2 focus:ring-orange-500 focus:outline-none"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-gray-700 mb-1">Step Description</label>
                    <textarea
                      rows={2}
                      value={step.desc}
                      onChange={e => {
                        const next = [...formData.landing_how_steps];
                        next[idx].desc = e.target.value;
                        setFormData({ ...formData, landing_how_steps: next });
                      }}
                      className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs font-medium focus:ring-2 focus:ring-orange-500 focus:outline-none"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB CONTENT: FEATURES */}
      {activeTab === 'features' && (
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-gray-100 shadow-sm space-y-6">
          <div className="border-b border-gray-100 pb-4">
            <h3 className="text-lg font-black text-gray-900">Value Propositions / Features</h3>
            <p className="text-xs text-gray-500">Edit the three highlighted value cards below popular meals.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {formData.landing_features.map((feat, idx) => (
              <div key={idx} className="p-5 rounded-2xl bg-gray-50 border border-gray-100 space-y-4">
                <span className="text-[10px] font-black uppercase text-orange-600 tracking-wider">
                  Feature Card #{idx + 1}
                </span>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Card Title</label>
                  <input
                    type="text"
                    value={feat.title}
                    onChange={e => {
                      const next = [...formData.landing_features];
                      next[idx].title = e.target.value;
                      setFormData({ ...formData, landing_features: next });
                    }}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm font-bold focus:ring-2 focus:ring-orange-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Icon Style</label>
                  <select
                    value={feat.icon}
                    onChange={e => {
                      const next = [...formData.landing_features];
                      next[idx].icon = e.target.value;
                      setFormData({ ...formData, landing_features: next });
                    }}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs font-medium focus:ring-2 focus:ring-orange-500 focus:outline-none"
                  >
                    <option value="Truck">Truck (Campus Delivery)</option>
                    <option value="Star">Star (Premium Quality)</option>
                    <option value="Clock">Clock (Live Tracking)</option>
                    <option value="Utensils">Utensils (Fresh Food)</option>
                    <option value="CheckCircle2">CheckCircle (Safe & Secure)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Description</label>
                  <textarea
                    rows={3}
                    value={feat.desc}
                    onChange={e => {
                      const next = [...formData.landing_features];
                      next[idx].desc = e.target.value;
                      setFormData({ ...formData, landing_features: next });
                    }}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs font-medium focus:ring-2 focus:ring-orange-500 focus:outline-none"
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="pt-6 border-t border-gray-100">
            <h4 className="text-base font-black text-gray-900 mb-1">Popular Meals Section Header</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-3">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Title</label>
                <input
                  type="text"
                  value={formData.landing_popular_title}
                  onChange={e => setFormData({ ...formData, landing_popular_title: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm font-medium focus:ring-2 focus:ring-orange-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Subtitle</label>
                <input
                  type="text"
                  value={formData.landing_popular_subtitle}
                  onChange={e => setFormData({ ...formData, landing_popular_subtitle: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm font-medium focus:ring-2 focus:ring-orange-500 focus:outline-none"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT: TESTIMONIALS */}
      {activeTab === 'testimonials' && (
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-gray-100 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 pb-4">
            <div>
              <h3 className="text-lg font-black text-gray-900">Student Reviews & Testimonials</h3>
              <p className="text-xs text-gray-500">Add or edit customer feedback scrolling on the landing page.</p>
            </div>
            <button
              type="button"
              onClick={() => {
                setFormData(prev => ({
                  ...prev,
                  landing_testimonials: [
                    ...prev.landing_testimonials,
                    {
                      name: 'Student Name',
                      location: 'Campus Hostel',
                      rating: 5,
                      comment: 'Snad Kitchen is fast, convenient, and the food tastes wonderful!',
                      avatar_letter: 'S',
                      avatar_bg: 'bg-orange-100',
                      avatar_color: 'text-orange-600'
                    }
                  ]
                }));
              }}
              className="flex items-center gap-1.5 px-4 py-2 bg-orange-50 text-orange-600 rounded-xl font-bold text-xs hover:bg-orange-100 transition self-start sm:self-auto"
            >
              <Plus className="w-4 h-4" />
              <span>Add Testimonial</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Section Title</label>
              <input
                type="text"
                value={formData.landing_testimonials_title}
                onChange={e => setFormData({ ...formData, landing_testimonials_title: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm font-medium focus:ring-2 focus:ring-orange-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Section Subtitle</label>
              <input
                type="text"
                value={formData.landing_testimonials_subtitle}
                onChange={e => setFormData({ ...formData, landing_testimonials_subtitle: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm font-medium focus:ring-2 focus:ring-orange-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="space-y-4">
            {formData.landing_testimonials.map((t, idx) => (
              <div key={idx} className="p-5 rounded-2xl bg-gray-50 border border-gray-100 space-y-3 relative group">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase text-gray-400">Review #{idx + 1}</span>
                  <button
                    type="button"
                    onClick={() => {
                      const next = formData.landing_testimonials.filter((_, i) => i !== idx);
                      setFormData({ ...formData, landing_testimonials: next });
                    }}
                    className="text-red-500 hover:text-red-700 p-1.5 rounded-lg hover:bg-red-50 transition"
                    title="Delete Review"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Name</label>
                    <input
                      type="text"
                      value={t.name}
                      onChange={e => {
                        const next = [...formData.landing_testimonials];
                        next[idx].name = e.target.value;
                        next[idx].avatar_letter = e.target.value.charAt(0).toUpperCase() || 'S';
                        setFormData({ ...formData, landing_testimonials: next });
                      }}
                      className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs font-bold focus:ring-2 focus:ring-orange-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Hostel / Location</label>
                    <input
                      type="text"
                      value={t.location}
                      onChange={e => {
                        const next = [...formData.landing_testimonials];
                        next[idx].location = e.target.value;
                        setFormData({ ...formData, landing_testimonials: next });
                      }}
                      className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs font-medium focus:ring-2 focus:ring-orange-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Rating (1-5 Stars)</label>
                    <select
                      value={t.rating}
                      onChange={e => {
                        const next = [...formData.landing_testimonials];
                        next[idx].rating = Number(e.target.value);
                        setFormData({ ...formData, landing_testimonials: next });
                      }}
                      className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs font-bold focus:ring-2 focus:ring-orange-500 focus:outline-none"
                    >
                      <option value="5">⭐⭐⭐⭐⭐ (5 Stars)</option>
                      <option value="4">⭐⭐⭐⭐ (4 Stars)</option>
                      <option value="3">⭐⭐⭐ (3 Stars)</option>
                      <option value="2">⭐⭐ (2 Stars)</option>
                      <option value="1">⭐ (1 Star)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Review Quote</label>
                  <textarea
                    rows={2}
                    value={t.comment}
                    onChange={e => {
                      const next = [...formData.landing_testimonials];
                      next[idx].comment = e.target.value;
                      setFormData({ ...formData, landing_testimonials: next });
                    }}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs font-medium focus:ring-2 focus:ring-orange-500 focus:outline-none"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB CONTENT: FAQS */}
      {activeTab === 'faqs' && (
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-gray-100 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 pb-4">
            <div>
              <h3 className="text-lg font-black text-gray-900">Frequently Asked Questions</h3>
              <p className="text-xs text-gray-500">Add, edit, or remove FAQ questions and answers.</p>
            </div>
            <button
              type="button"
              onClick={() => {
                setFormData(prev => ({
                  ...prev,
                  landing_faqs: [
                    ...prev.landing_faqs,
                    { question: 'New Question?', answer: 'Answer here...' }
                  ]
                }));
              }}
              className="flex items-center gap-1.5 px-4 py-2 bg-orange-50 text-orange-600 rounded-xl font-bold text-xs hover:bg-orange-100 transition self-start sm:self-auto"
            >
              <Plus className="w-4 h-4" />
              <span>Add FAQ</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Section Title</label>
              <input
                type="text"
                value={formData.landing_faq_title}
                onChange={e => setFormData({ ...formData, landing_faq_title: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm font-medium focus:ring-2 focus:ring-orange-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Section Subtitle</label>
              <input
                type="text"
                value={formData.landing_faq_subtitle}
                onChange={e => setFormData({ ...formData, landing_faq_subtitle: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm font-medium focus:ring-2 focus:ring-orange-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="space-y-4">
            {formData.landing_faqs.map((faq, idx) => (
              <div key={idx} className="p-5 rounded-2xl bg-gray-50 border border-gray-100 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase text-gray-400">FAQ #{idx + 1}</span>
                  <button
                    type="button"
                    onClick={() => {
                      const next = formData.landing_faqs.filter((_, i) => i !== idx);
                      setFormData({ ...formData, landing_faqs: next });
                    }}
                    className="text-red-500 hover:text-red-700 p-1.5 rounded-lg hover:bg-red-50 transition"
                    title="Delete FAQ"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Question</label>
                  <input
                    type="text"
                    value={faq.question}
                    onChange={e => {
                      const next = [...formData.landing_faqs];
                      next[idx].question = e.target.value;
                      setFormData({ ...formData, landing_faqs: next });
                    }}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs font-bold focus:ring-2 focus:ring-orange-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Answer</label>
                  <textarea
                    rows={2}
                    value={faq.answer}
                    onChange={e => {
                      const next = [...formData.landing_faqs];
                      next[idx].answer = e.target.value;
                      setFormData({ ...formData, landing_faqs: next });
                    }}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs font-medium focus:ring-2 focus:ring-orange-500 focus:outline-none"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB CONTENT: CTA & MAP */}
      {activeTab === 'cta_map' && (
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-gray-100 shadow-sm space-y-8">
          {/* Bottom CTA Banner */}
          <div className="space-y-4">
            <div className="border-b border-gray-100 pb-3">
              <h3 className="text-lg font-black text-gray-900">Bottom Call-to-Action Banner</h3>
              <p className="text-xs text-gray-500">The orange gradient section at the bottom encouraging orders.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Headline</label>
                <input
                  type="text"
                  value={formData.landing_cta_title}
                  onChange={e => setFormData({ ...formData, landing_cta_title: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm font-medium focus:ring-2 focus:ring-orange-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Button Label</label>
                <input
                  type="text"
                  value={formData.landing_cta_btn_text}
                  onChange={e => setFormData({ ...formData, landing_cta_btn_text: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm font-medium focus:ring-2 focus:ring-orange-500 focus:outline-none"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-gray-700 mb-1">Subtext</label>
                <input
                  type="text"
                  value={formData.landing_cta_subtitle}
                  onChange={e => setFormData({ ...formData, landing_cta_subtitle: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm font-medium focus:ring-2 focus:ring-orange-500 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Campus Map Section */}
          <div className="space-y-4 pt-6 border-t border-gray-100">
            <div className="border-b border-gray-100 pb-3">
              <h3 className="text-lg font-black text-gray-900">Campus Map & Location Embed</h3>
              <p className="text-xs text-gray-500">Google Maps embed iframe shown on the homepage.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Section Title</label>
                <input
                  type="text"
                  value={formData.landing_map_title}
                  onChange={e => setFormData({ ...formData, landing_map_title: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm font-medium focus:ring-2 focus:ring-orange-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Section Subtitle</label>
                <input
                  type="text"
                  value={formData.landing_map_subtitle}
                  onChange={e => setFormData({ ...formData, landing_map_subtitle: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm font-medium focus:ring-2 focus:ring-orange-500 focus:outline-none"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Google Maps Embed URL (<code className="text-orange-600 font-mono">https://www.google.com/maps/embed?...</code>)
                </label>
                <input
                  type="text"
                  value={formData.landing_map_iframe_url}
                  onChange={e => setFormData({ ...formData, landing_map_iframe_url: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-xs font-mono focus:ring-2 focus:ring-orange-500 focus:outline-none"
                />
              </div>
            </div>

            {/* Live Map Preview */}
            {formData.landing_map_iframe_url && (
              <div className="mt-4">
                <label className="block text-xs font-bold text-gray-500 mb-2">Live Map Preview:</label>
                <div className="rounded-2xl overflow-hidden border border-gray-200 h-60">
                  <iframe
                    src={formData.landing_map_iframe_url}
                    width="100%"
                    height="100%"
                    style={{ border: 0 }}
                    loading="lazy"
                    title="Map Preview"
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB CONTENT: TERMS & PRIVACY */}
      {activeTab === 'legal' && (
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-gray-100 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 pb-4">
            <div>
              <h3 className="text-lg font-black text-gray-900">Terms & Conditions & Privacy Policy</h3>
              <p className="text-xs text-gray-500">
                Update the official legal policies displayed to customers on the website.
              </p>
            </div>

            {/* Sub-toggle between Terms and Privacy */}
            <div className="flex items-center gap-1.5 p-1 bg-gray-100 rounded-2xl shrink-0 self-start sm:self-auto">
              <button
                type="button"
                onClick={() => setLegalSubTab('terms')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
                  legalSubTab === 'terms'
                    ? 'bg-white text-orange-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Terms & Conditions
              </button>
              <button
                type="button"
                onClick={() => setLegalSubTab('privacy')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
                  legalSubTab === 'privacy'
                    ? 'bg-white text-orange-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Privacy Policy
              </button>
            </div>
          </div>

          {legalSubTab === 'terms' ? (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-extrabold text-base text-gray-900">Edit Terms & Conditions</h4>
                  <p className="text-xs text-gray-500">Shown at <code className="bg-gray-100 px-1 py-0.5 rounded text-orange-600">/terms</code></p>
                </div>
                <div className="flex items-center gap-2">
                  <a
                    href="/terms"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-gray-200 text-gray-700 text-xs font-bold hover:bg-gray-50 transition"
                  >
                    <span>View /terms</span>
                    <ExternalLink className="w-3.5 h-3.5 text-gray-400" />
                  </a>
                  <button
                    type="button"
                    onClick={() => {
                      setFormData(prev => ({ ...prev, terms_content: DEFAULT_TERMS }));
                      toast.success('Reset Terms content to standard defaults');
                    }}
                    className="px-3 py-1.5 rounded-xl border border-gray-200 text-xs font-bold text-gray-600 hover:bg-gray-50 flex items-center gap-1"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Reset Default</span>
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-extrabold uppercase tracking-wider text-gray-700 mb-2">
                    Page Headline Title
                  </label>
                  <input
                    type="text"
                    value={formData.terms_title}
                    onChange={e => setFormData({ ...formData, terms_title: e.target.value })}
                    className="w-full px-4 py-3 rounded-2xl border border-gray-200 text-sm font-medium focus:ring-2 focus:ring-orange-500 focus:outline-none"
                    placeholder="Terms & Conditions"
                  />
                </div>

                <div>
                  <label className="block text-xs font-extrabold uppercase tracking-wider text-gray-700 mb-2">
                    Last Updated Date / Note
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={formData.terms_last_updated}
                      onChange={e => setFormData({ ...formData, terms_last_updated: e.target.value })}
                      placeholder="e.g. October 12, 2026 or leave empty for auto"
                      className="flex-1 px-4 py-3 rounded-2xl border border-gray-200 text-sm font-medium focus:ring-2 focus:ring-orange-500 focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setFormData({
                          ...formData,
                          terms_last_updated: new Date().toLocaleDateString('en-US', {
                            month: 'long',
                            day: 'numeric',
                            year: 'numeric',
                          }),
                        })
                      }
                      className="px-3 py-3 rounded-2xl border border-gray-200 text-xs font-bold text-gray-700 hover:bg-gray-50 shrink-0"
                    >
                      Set Today
                    </button>
                  </div>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-xs font-extrabold uppercase tracking-wider text-gray-700">
                    Terms & Conditions Body Content
                  </label>
                  <span className="text-[11px] text-gray-400">
                    {formData.terms_content.length} characters
                  </span>
                </div>
                <RichTextEditor
                  value={formData.terms_content}
                  onChange={content => setFormData({ ...formData, terms_content: content })}
                  placeholder="Compose full Terms & Conditions with bold, italic, headings, lists, and links..."
                  minHeight="420px"
                />
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-extrabold text-base text-gray-900">Edit Privacy Policy</h4>
                  <p className="text-xs text-gray-500">Shown at <code className="bg-gray-100 px-1 py-0.5 rounded text-orange-600">/privacy</code></p>
                </div>
                <div className="flex items-center gap-2">
                  <a
                    href="/privacy"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-gray-200 text-gray-700 text-xs font-bold hover:bg-gray-50 transition"
                  >
                    <span>View /privacy</span>
                    <ExternalLink className="w-3.5 h-3.5 text-gray-400" />
                  </a>
                  <button
                    type="button"
                    onClick={() => {
                      setFormData(prev => ({ ...prev, privacy_content: DEFAULT_PRIVACY }));
                      toast.success('Reset Privacy Policy content to standard defaults');
                    }}
                    className="px-3 py-1.5 rounded-xl border border-gray-200 text-xs font-bold text-gray-600 hover:bg-gray-50 flex items-center gap-1"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Reset Default</span>
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-extrabold uppercase tracking-wider text-gray-700 mb-2">
                    Page Headline Title
                  </label>
                  <input
                    type="text"
                    value={formData.privacy_title}
                    onChange={e => setFormData({ ...formData, privacy_title: e.target.value })}
                    className="w-full px-4 py-3 rounded-2xl border border-gray-200 text-sm font-medium focus:ring-2 focus:ring-orange-500 focus:outline-none"
                    placeholder="Privacy Policy"
                  />
                </div>

                <div>
                  <label className="block text-xs font-extrabold uppercase tracking-wider text-gray-700 mb-2">
                    Last Updated Date / Note
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={formData.privacy_last_updated}
                      onChange={e => setFormData({ ...formData, privacy_last_updated: e.target.value })}
                      placeholder="e.g. October 12, 2026 or leave empty for auto"
                      className="flex-1 px-4 py-3 rounded-2xl border border-gray-200 text-sm font-medium focus:ring-2 focus:ring-orange-500 focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setFormData({
                          ...formData,
                          privacy_last_updated: new Date().toLocaleDateString('en-US', {
                            month: 'long',
                            day: 'numeric',
                            year: 'numeric',
                          }),
                        })
                      }
                      className="px-3 py-3 rounded-2xl border border-gray-200 text-xs font-bold text-gray-700 hover:bg-gray-50 shrink-0"
                    >
                      Set Today
                    </button>
                  </div>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-xs font-extrabold uppercase tracking-wider text-gray-700">
                    Privacy Policy Body Content
                  </label>
                  <span className="text-[11px] text-gray-400">
                    {formData.privacy_content.length} characters
                  </span>
                </div>
                <RichTextEditor
                  value={formData.privacy_content}
                  onChange={content => setFormData({ ...formData, privacy_content: content })}
                  placeholder="Compose full Privacy Policy with bold, italic, headings, lists, and links..."
                  minHeight="420px"
                />
              </div>
            </div>
          )}
        </div>
      )}

      {/* Sticky Bottom Save Bar */}
      <div className="sticky bottom-4 z-20 bg-white/95 backdrop-blur-md p-4 rounded-2xl border border-gray-200 shadow-xl flex items-center justify-between">
        <div className="text-xs text-gray-500 font-medium hidden sm:block">
          Changes will reflect immediately on the customer landing page after saving.
        </div>
        <button
          type="button"
          onClick={() => saveMutation.mutate(formData)}
          disabled={saveMutation.isPending || isUploadingImage}
          className="bg-orange-500 hover:bg-orange-600 text-white px-8 py-3 rounded-xl font-bold text-xs transition flex items-center gap-2 shadow-lg shadow-orange-200 disabled:opacity-60 ml-auto"
        >
          {saveMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          <span>Save Landing Page</span>
        </button>
      </div>
    </div>
  );
}
