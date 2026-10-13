import { useState } from 'react';
import { ArrowRight, Star, Clock, Truck, ShoppingBag, ChevronDown, Plus, Utensils, CheckCircle2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import FoodCustomizerModal from '@/components/FoodCustomizerModal';
import api from '@/lib/axios';
import { resolveMealImageUrl, resolveLandingImageUrl } from '@/lib/media';

interface Food {
  id: number;
  name: string;
  price: number;
  description: string;
  category: { id: number; name: string };
  image_url: string | null;
}

interface StepItem {
  step: string;
  title: string;
  desc: string;
  href?: string;
  icon?: string;
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

const DEFAULT_HERO_IMAGE = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80';

const DEFAULT_HOW_STEPS: StepItem[] = [
  { step: '1', title: 'Browse Menu', href: '/menu', desc: 'Explore our wide variety of premium meals, drinks, and combos prepared fresh daily.', icon: 'Utensils' },
  { step: '2', title: 'Place Order & Pay', desc: 'Add items to cart, choose delivery or pickup, and pay securely via Paystack or Cash.', icon: 'ShoppingBag' },
  { step: '3', title: 'Get Delivered', desc: 'Track your order in real-time. Our rider brings your food hot and fresh to your door.', icon: 'CheckCircle2' },
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

function renderSectionIcon(iconName?: string, className = 'w-8 h-8') {
  switch (iconName?.toLowerCase()) {
    case 'truck': return <Truck className={className} />;
    case 'star': return <Star className={className} />;
    case 'clock': return <Clock className={className} />;
    case 'utensils': return <Utensils className={className} />;
    case 'shoppingbag': return <ShoppingBag className={className} />;
    case 'checkcircle2':
    case 'checkcircle': return <CheckCircle2 className={className} />;
    default: return <Star className={className} />;
  }
}

function FAQItem({ question, answer }: { question: string; answer: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border border-gray-100 rounded-2xl overflow-hidden bg-white">
      <button onClick={() => setOpen(!open)} className="w-full flex items-center justify-between p-5 text-left hover:bg-gray-50 transition">
        <span className="font-bold text-gray-900">{question}</span>
        <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="px-5 pb-5 text-gray-600 text-sm leading-relaxed">{answer}</div>
      )}
    </div>
  );
}

export default function Home() {
  const [selectedFoodForCustomization, setSelectedFoodForCustomization] = useState<Food | null>(null);

  // Dynamic Landing Page Settings
  const { data: settings } = useQuery({
    queryKey: ['settings'],
    queryFn: async () => {
      const res = await api.get('/settings');
      return res.data;
    }
  });

  const { data: foods } = useQuery({
    queryKey: ['popularFoods'],
    queryFn: async () => {
      const res = await api.get('/foods');
      return (res.data.data as Food[]).slice(0, 4);
    }
  });

  // Hero Fields & Fallbacks
  const heroBadge = settings?.landing_hero_badge || "🚀 JOSTUM's #1 Food Delivery";
  const heroTitle = settings?.landing_hero_title || 'Delicious meals,';
  const heroTitleHighlight = settings?.landing_hero_title_highlight || 'delivered fast.';
  const heroSubtitle = settings?.landing_hero_subtitle || 'Experience the best restaurant quality food right here on campus. Freshly prepared, securely packaged, and delivered to your hostel or office.';
  const heroOrderBtnText = settings?.landing_hero_order_btn_text || 'Order Now';
  const heroTrackBtnText = settings?.landing_hero_track_btn_text || 'Track Order';
  const heroImage = resolveLandingImageUrl(settings?.landing_hero_image, DEFAULT_HERO_IMAGE);
  const heroCardTitle = settings?.landing_hero_card_title || 'Special Fried Rice';
  const heroCardPrice = settings?.landing_hero_card_price || '₦2,500';
  const heroCardRating = settings?.landing_hero_card_rating || '4.8';
  const heroCardBtnText = settings?.landing_hero_card_btn_text || 'Order Now';

  // How it works
  const howTitle = settings?.landing_how_title || 'How It Works';
  const howSubtitle = settings?.landing_how_subtitle || 'Order your favorite meal in 3 simple steps';
  const howSteps: StepItem[] = Array.isArray(settings?.landing_how_steps) && settings.landing_how_steps.length > 0 
    ? settings.landing_how_steps 
    : DEFAULT_HOW_STEPS;

  // Popular
  const popularTitle = settings?.landing_popular_title || 'Popular Meals';
  const popularSubtitle = settings?.landing_popular_subtitle || 'Our most loved dishes by JOSTUM students';

  // Features
  const features: FeatureItem[] = Array.isArray(settings?.landing_features) && settings.landing_features.length > 0
    ? settings.landing_features
    : DEFAULT_FEATURES;

  // Stats
  const stats: StatItem[] = Array.isArray(settings?.landing_stats) && settings.landing_stats.length > 0
    ? settings.landing_stats
    : DEFAULT_STATS;

  // Testimonials
  const testimonialsTitle = settings?.landing_testimonials_title || 'What Our Customers Say';
  const testimonialsSubtitle = settings?.landing_testimonials_subtitle || "Don't just take our word for it. Here is what JOSTUM students are saying.";
  const testimonials: TestimonialItem[] = Array.isArray(settings?.landing_testimonials) && settings.landing_testimonials.length > 0
    ? settings.landing_testimonials
    : DEFAULT_TESTIMONIALS;

  // FAQ
  const faqTitle = settings?.landing_faq_title || 'Frequently Asked Questions';
  const faqSubtitle = settings?.landing_faq_subtitle || "Got questions? We've got answers.";
  const faqs: FaqItemData[] = Array.isArray(settings?.landing_faqs) && settings.landing_faqs.length > 0
    ? settings.landing_faqs
    : DEFAULT_FAQS;

  // CTA
  const ctaTitle = settings?.landing_cta_title || "Hungry? We've got you covered.";
  const ctaSubtitle = settings?.landing_cta_subtitle || 'Browse our premium menu and get your food delivered to your door in minutes.';
  const ctaBtnText = settings?.landing_cta_btn_text || 'Start Your Order';

  // Map
  const mapTitle = settings?.landing_map_title || 'Find Us On Campus';
  const mapSubtitle = settings?.landing_map_subtitle || 'Stop by our premium kitchen at JOSTUM.';
  const mapIframeUrl = settings?.landing_map_iframe_url || 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3952.9672704162585!2d8.61923577500506!3d7.793290092226731!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x1050856bd43e2a31%3A0x809e98b3180176a9!2sSnad%20kitchen!5e0!3m2!1sen!2sng!4v1784515705679!5m2!1sen!2sng';

  return (
    <div>
      {/* Hero Section */}
      <section className="relative bg-white overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-orange-50 to-red-50 opacity-50"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 relative z-10 flex flex-col md:flex-row items-center">
          <div className="md:w-1/2 md:pr-12">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
              <span className="inline-block py-1 px-3 rounded-full bg-orange-100 text-orange-600 font-semibold text-sm mb-3">
                {heroBadge}
              </span>
              <h1 className="text-5xl md:text-7xl font-extrabold text-gray-900 leading-tight mb-4">
                {heroTitle} <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-red-600">
                  {heroTitleHighlight}
                </span>
              </h1>
              <p className="text-lg text-gray-600 mb-5 max-w-lg">
                {heroSubtitle}
              </p>
              <div className="flex items-center space-x-4">
                <Link to="/menu" className="flex items-center space-x-2 bg-gradient-to-r from-orange-500 to-red-600 text-white px-8 py-4 rounded-full font-bold shadow-lg hover:shadow-xl hover:-translate-y-1 transition transform duration-200">
                  <span>{heroOrderBtnText}</span>
                  <ArrowRight className="w-5 h-5" />
                </Link>
                <Link to="/track" className="flex items-center space-x-2 bg-white text-gray-800 border border-gray-200 px-8 py-4 rounded-full font-bold shadow-sm hover:bg-gray-50 transition">
                  {heroTrackBtnText}
                </Link>
              </div>
            </motion.div>
          </div>
          
          <div className="md:w-1/2 mt-8 md:mt-0 relative">
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.7 }}>
              <div className="relative rounded-3xl overflow-hidden shadow-2xl">
                <img 
                  src={heroImage} 
                  alt={heroTitle || "Delicious food"} 
                  className="w-full object-cover h-[300px] sm:h-[360px]"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
                <div className="absolute bottom-6 left-6 right-6">
                  <div className="bg-white/30 backdrop-blur-md rounded-2xl p-4 flex items-center justify-between text-white border border-white/20">
                    <div>
                      <p className="font-bold text-lg">{heroCardTitle}</p>
                      <p className="text-sm opacity-90">{heroCardPrice} • <Star className="inline w-4 h-4 text-yellow-400 fill-current"/> {heroCardRating}</p>
                    </div>
                    <Link to="/menu" className="bg-white text-orange-600 px-4 py-2 rounded-full font-bold text-sm hover:bg-orange-50 transition">
                      {heroCardBtnText}
                    </Link>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="bg-white pt-8 pb-14 border-t border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-extrabold text-gray-900 mb-3">{howTitle}</h2>
            <p className="text-gray-600">{howSubtitle}</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {howSteps.map((item, idx) => {
              const defaultIcons = ['Utensils', 'ShoppingBag', 'CheckCircle2'];
              const iconName = item.icon || defaultIcons[idx % defaultIcons.length];
              const stepContent = (
                <>
                  <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-red-600 text-white rounded-2xl flex items-center justify-center mx-auto mb-5 shadow-lg">
                    {renderSectionIcon(iconName, 'w-8 h-8')}
                  </div>
                  <span className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-2 bg-orange-100 text-orange-600 text-xs font-extrabold w-6 h-6 rounded-full flex items-center justify-center">{item.step || idx + 1}</span>
                  <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-orange-600 group-hover:underline transition-colors">{item.title}</h3>
                </>
              );

              return (
                <motion.div key={idx} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.15 }} className="text-center relative">
                  {item.href ? (
                    <Link to={item.href} className="group block relative rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-2">
                      {stepContent}
                    </Link>
                  ) : stepContent}
                  <p className="text-gray-500 text-sm max-w-xs mx-auto">{item.desc}</p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Popular Meals */}
      {foods && foods.length > 0 && (
        <section className="bg-slate-50 py-14 border-t border-gray-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center mb-8">
              <div>
                <h2 className="text-3xl font-extrabold text-gray-900 mb-1">{popularTitle}</h2>
                <p className="text-gray-600">{popularSubtitle}</p>
              </div>
              <Link to="/menu" className="hidden sm:flex items-center space-x-1 text-orange-600 font-bold hover:text-orange-700 transition">
                <span>View All</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {foods.map((food, idx) => (
                <motion.div
                  key={food.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: idx * 0.1 }}
                  className="bg-white rounded-3xl p-4 shadow-sm border border-gray-100 hover:shadow-xl transition transform hover:-translate-y-1 group flex flex-col"
                >
                  <div className="relative overflow-hidden rounded-2xl h-44 mb-4 bg-orange-100">
                    {food.image_url ? (
                      <img src={resolveMealImageUrl(food.image_url)} alt={food.name} className="w-full h-full object-cover group-hover:scale-105 transition duration-500" />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center text-orange-300"><ShoppingBag className="w-12 h-12" /></div>
                    )}
                    <span className="absolute top-3 left-3 bg-orange-500 text-white text-[10px] font-extrabold px-2.5 py-1 rounded-full uppercase tracking-wider">Popular</span>
                  </div>
                  <div className="flex-grow">
                    <span className="text-xs font-bold uppercase tracking-wider text-orange-500 mb-1 block">{food.category.name}</span>
                    <h3 className="text-lg font-bold text-gray-900 mb-1 leading-tight">{food.name}</h3>
                    <p className="text-sm text-gray-500 line-clamp-2">{food.description}</p>
                  </div>
                  <div className="mt-4 flex items-center justify-between gap-2 border-t border-gray-100 pt-4">
                    <span className="text-xl font-bold text-gray-900">₦{food.price.toLocaleString()}</span>
                    <button
                      type="button"
                      onClick={() => setSelectedFoodForCustomization(food)}
                      className="bg-orange-50 text-orange-600 hover:bg-orange-500 hover:text-white px-3.5 py-2 rounded-full font-bold text-xs transition flex items-center gap-1 shrink-0"
                    >
                      <Plus className="w-4 h-4" />
                      Customize
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
            <div className="text-center mt-8 sm:hidden">
              <Link to="/menu" className="inline-flex items-center space-x-1 text-orange-600 font-bold hover:text-orange-700 transition">
                <span>View Full Menu</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* Features */}
      <section className="bg-white py-12 border-t border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            {features.map((feat, fIdx) => {
              const bgColors = ['bg-orange-100 text-orange-500', 'bg-red-100 text-red-500', 'bg-green-100 text-green-500'];
              const colorClass = bgColors[fIdx % bgColors.length];
              return (
                <div key={fIdx} className="bg-slate-50 p-8 rounded-3xl border border-gray-100 hover:shadow-md transition">
                  <div className={`w-16 h-16 ${colorClass} rounded-2xl flex items-center justify-center mx-auto mb-6`}>
                    {renderSectionIcon(feat.icon, 'w-8 h-8')}
                  </div>
                  <h3 className="text-xl font-bold mb-3 text-gray-900">{feat.title}</h3>
                  <p className="text-gray-600">{feat.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="bg-gradient-to-r from-gray-900 to-gray-800 py-14">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {stats.map((stat, idx) => (
              <motion.div key={idx} initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: idx * 0.1 }}>
                <p className="text-4xl font-extrabold text-white mb-1">{stat.value}</p>
                <p className="text-gray-400 font-medium text-sm">{stat.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="bg-white py-12 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-12 text-center">
          <h2 className="text-3xl font-extrabold text-gray-900 mb-4">{testimonialsTitle}</h2>
          <p className="text-gray-600">{testimonialsSubtitle}</p>
        </div>
        
        <div className="relative w-full overflow-hidden">
          {/* Fading Edges */}
          <div className="absolute top-0 bottom-0 left-0 w-24 bg-gradient-to-r from-white to-transparent z-10"></div>
          <div className="absolute top-0 bottom-0 right-0 w-24 bg-gradient-to-l from-white to-transparent z-10"></div>
          
          <motion.div 
            animate={{ x: ["0%", "-50%"] }}
            transition={{ repeat: Infinity, ease: "linear", duration: 30 }}
            className="flex space-x-6 w-max px-4"
          >
            {[...Array(2)].map((_, i) => (
              <div key={i} className="flex space-x-6">
                {testimonials.map((testi, tIdx) => (
                  <div key={tIdx} className="w-80 sm:w-96 bg-slate-50 p-6 rounded-3xl border border-gray-100 flex-shrink-0">
                    <div className="flex text-yellow-400 mb-4">
                      {[...Array(5)].map((_, starI) => (
                        <Star 
                          key={starI} 
                          className={`w-5 h-5 ${starI < (testi.rating || 5) ? 'fill-current text-yellow-400' : 'text-gray-300'}`} 
                        />
                      ))}
                    </div>
                    <p className="text-gray-700 italic mb-6">"{testi.comment}"</p>
                    <div className="flex items-center space-x-3">
                      <div className={`w-10 h-10 ${testi.avatar_bg || 'bg-orange-100'} rounded-full flex items-center justify-center ${testi.avatar_color || 'text-orange-600'} font-bold`}>
                        {testi.avatar_letter || testi.name?.charAt(0) || 'S'}
                      </div>
                      <div>
                        <p className="font-bold text-gray-900">{testi.name}</p>
                        <p className="text-sm text-gray-500">{testi.location}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* FAQ */}
      <section className="bg-slate-50 py-14 border-t border-gray-100">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-extrabold text-gray-900 mb-3">{faqTitle}</h2>
            <p className="text-gray-600">{faqSubtitle}</p>
          </div>
          <div className="space-y-3">
            {faqs.map((faq, fIdx) => (
              <FAQItem key={fIdx} question={faq.question} answer={faq.answer} />
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-gradient-to-br from-orange-500 to-red-600 py-16">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-4xl font-extrabold text-white mb-6">{ctaTitle}</h2>
          <p className="text-xl text-orange-100 mb-8">{ctaSubtitle}</p>
          <Link to="/menu" className="inline-flex items-center space-x-2 bg-white text-orange-600 px-10 py-5 rounded-full font-extrabold text-lg shadow-2xl hover:scale-105 transition transform duration-200">
            <span>{ctaBtnText}</span>
            <ArrowRight className="w-6 h-6" />
          </Link>
        </div>
      </section>

      {/* Map Section */}
      <section className="bg-white py-12 border-t border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-extrabold text-gray-900 mb-4">{mapTitle}</h2>
            <p className="text-gray-600">{mapSubtitle}</p>
          </div>
          <div className="rounded-3xl overflow-hidden shadow-lg border border-gray-200">
            <iframe 
              src={mapIframeUrl} 
              width="100%" 
              height="450" 
              style={{ border: 0 }} 
              allowFullScreen={true} 
              loading="lazy" 
              referrerPolicy="no-referrer-when-downgrade"
              title="Campus Map Location"
            ></iframe>
          </div>
        </div>
      </section>

      {selectedFoodForCustomization && (
        <FoodCustomizerModal
          food={selectedFoodForCustomization}
          isOpen={true}
          onClose={() => setSelectedFoodForCustomization(null)}
        />
      )}
    </div>
  );
}
