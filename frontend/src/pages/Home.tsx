import { useState } from 'react';
import { ArrowRight, Star, Clock, Truck, ShoppingBag, ChevronDown, Plus, Utensils, CheckCircle2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { useCartStore } from '@/store/useCartStore';
import api from '@/lib/axios';

import { resolveMealImageUrl } from '@/lib/media';

interface Food {
  id: number;
  name: string;
  price: number;
  description: string;
  category: { id: number; name: string };
  image_url: string | null;
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
  const addItem = useCartStore(state => state.addItem);

  const { data: foods } = useQuery({
    queryKey: ['popularFoods'],
    queryFn: async () => {
      const res = await api.get('/foods');
      return (res.data.data as Food[]).slice(0, 4);
    }
  });

  return (
    <div>
      {/* Hero Section */}
      <section className="relative bg-white overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-orange-50 to-red-50 opacity-50"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-16 relative z-10 flex flex-col md:flex-row items-center">
          <div className="md:w-1/2 md:pr-12">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
              <span className="inline-block py-1 px-3 rounded-full bg-orange-100 text-orange-600 font-semibold text-sm mb-4">
                🚀 JOSTUM's #1 Food Delivery
              </span>
              <h1 className="text-5xl md:text-7xl font-extrabold text-gray-900 leading-tight mb-6">
                Qaulity meals, <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-red-600">delivered fast.</span>
              </h1>
              <p className="text-lg text-gray-600 mb-8 max-w-lg">
                Experience the best restaurant quality food right here on campus. Freshly prepared, securely packaged, and delivered to your hostel or office.
              </p>
              <div className="flex items-center space-x-4">
                <Link to="/menu" className="flex items-center space-x-2 bg-gradient-to-r from-orange-500 to-red-600 text-white px-8 py-4 rounded-full font-bold shadow-lg hover:shadow-xl hover:-translate-y-1 transition transform duration-200">
                  <span>Order Now</span>
                  <ArrowRight className="w-5 h-5" />
                </Link>
                <Link to="/track" className="flex items-center space-x-2 bg-white text-gray-800 border border-gray-200 px-8 py-4 rounded-full font-bold shadow-sm hover:bg-gray-50 transition">
                  Track Order
                </Link>
              </div>
            </motion.div>
          </div>
          
          <div className="md:w-1/2 mt-16 md:mt-0 relative">
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.7 }}>
              <div className="relative rounded-3xl overflow-hidden shadow-2xl">
                <img 
                  src="https://images.unsplash.com/photo-1546069901-ba9599a7e63c?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80" 
                  alt="Delicious premium bowl" 
                  className="w-full object-cover h-[300px] sm:h-[360px]"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
                <div className="absolute bottom-6 left-6 right-6">
                  <div className="bg-white/30 backdrop-blur-md rounded-2xl p-4 flex items-center justify-between text-white border border-white/20">
                    <div>
                      <p className="font-bold text-lg">Special Fried Rice</p>
                      <p className="text-sm opacity-90">₦2,500 • <Star className="inline w-4 h-4 text-yellow-400 fill-current"/> 4.8</p>
                    </div>
                    <Link to="/menu" className="bg-white text-orange-600 px-4 py-2 rounded-full font-bold text-sm hover:bg-orange-50 transition">
                      Order Now
                    </Link>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="bg-white py-14 border-t border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-extrabold text-gray-900 mb-3">How It Works</h2>
            <p className="text-gray-600">Order your favorite meal in 3 simple steps</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { step: '1', icon: Utensils, title: 'Browse Menu', desc: 'Explore our wide variety of premium meals, drinks, and combos prepared fresh daily.' },
              { step: '2', icon: ShoppingBag, title: 'Place Order & Pay', desc: 'Add items to cart, choose delivery or pickup, and pay securely via Paystack or Cash.' },
              { step: '3', icon: CheckCircle2, title: 'Get Delivered', desc: 'Track your order in real-time. Our rider brings your food hot and fresh to your door.' },
            ].map((item, idx) => (
              <motion.div key={idx} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.15 }} className="text-center relative">
                <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-red-600 text-white rounded-2xl flex items-center justify-center mx-auto mb-5 shadow-lg">
                  <item.icon className="w-8 h-8" />
                </div>
                <span className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-2 bg-orange-100 text-orange-600 text-xs font-extrabold w-6 h-6 rounded-full flex items-center justify-center">{item.step}</span>
                <h3 className="text-xl font-bold text-gray-900 mb-2">{item.title}</h3>
                <p className="text-gray-500 text-sm max-w-xs mx-auto">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Popular Meals */}
      {foods && foods.length > 0 && (
        <section className="bg-slate-50 py-14 border-t border-gray-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center mb-8">
              <div>
                <h2 className="text-3xl font-extrabold text-gray-900 mb-1">Popular Meals</h2>
                <p className="text-gray-600">Our most loved dishes by JOSTUM students</p>
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
                  <div className="mt-4 flex items-center justify-between border-t border-gray-100 pt-4">
                    <span className="text-xl font-bold text-gray-900">₦{food.price.toLocaleString()}</span>
                    <button
                      onClick={() => addItem({ food_id: food.id, name: food.name, price: food.price, quantity: 1 })}
                      className="bg-orange-50 text-orange-600 hover:bg-orange-500 hover:text-white p-3 rounded-full transition"
                    >
                      <Plus className="w-5 h-5" />
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
            <div className="bg-slate-50 p-8 rounded-3xl border border-gray-100 hover:shadow-md transition">
              <div className="w-16 h-16 bg-orange-100 text-orange-500 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Truck className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold mb-3 text-gray-900">Campus Delivery</h3>
              <p className="text-gray-600">Fast delivery directly to any hostel, faculty or office within JOSTUM campus.</p>
            </div>
            <div className="bg-slate-50 p-8 rounded-3xl border border-gray-100 hover:shadow-md transition">
              <div className="w-16 h-16 bg-red-100 text-red-500 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Star className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold mb-3 text-gray-900">Premium Quality</h3>
              <p className="text-gray-600">Prepared with the freshest ingredients by our top-rated executive chefs.</p>
            </div>
            <div className="bg-slate-50 p-8 rounded-3xl border border-gray-100 hover:shadow-md transition">
              <div className="w-16 h-16 bg-green-100 text-green-500 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Clock className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold mb-3 text-gray-900">Live Tracking</h3>
              <p className="text-gray-600">Know exactly where your food is with our real-time order tracking timeline.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="bg-gradient-to-r from-gray-900 to-gray-800 py-14">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {[
              { value: '500+', label: 'Orders Delivered' },
              { value: '50+', label: 'Menu Items' },
              { value: '200+', label: 'Happy Customers' },
              { value: '15 min', label: 'Avg. Delivery' },
            ].map((stat, idx) => (
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
          <h2 className="text-3xl font-extrabold text-gray-900 mb-4">What Our Customers Say</h2>
          <p className="text-gray-600">Don't just take our word for it. Here is what JOSTUM students are saying.</p>
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
                <div className="w-80 sm:w-96 bg-slate-50 p-6 rounded-3xl border border-gray-100 flex-shrink-0">
                  <div className="flex text-yellow-400 mb-4">
                    <Star className="w-5 h-5 fill-current"/><Star className="w-5 h-5 fill-current"/><Star className="w-5 h-5 fill-current"/><Star className="w-5 h-5 fill-current"/><Star className="w-5 h-5 fill-current"/>
                  </div>
                  <p className="text-gray-700 italic mb-6">"Absolutely the best food delivery on campus! The Jollof Rice was hot and fresh, and it arrived right at my hostel block in under 20 minutes."</p>
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center text-orange-600 font-bold">A</div>
                    <div>
                      <p className="font-bold text-gray-900">Aisha T.</p>
                      <p className="text-sm text-gray-500">South Core</p>
                    </div>
                  </div>
                </div>

                <div className="w-80 sm:w-96 bg-slate-50 p-6 rounded-3xl border border-gray-100 flex-shrink-0">
                  <div className="flex text-yellow-400 mb-4">
                    <Star className="w-5 h-5 fill-current"/><Star className="w-5 h-5 fill-current"/><Star className="w-5 h-5 fill-current"/><Star className="w-5 h-5 fill-current"/><Star className="w-5 h-5 fill-current"/>
                  </div>
                  <p className="text-gray-700 italic mb-6">"Snad Kitchen saved me during exam week. The portions are huge, the quality is premium, and tracking the rider is super convenient."</p>
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold">E</div>
                    <div>
                      <p className="font-bold text-gray-900">Emmanuel P.</p>
                      <p className="text-sm text-gray-500">North Core</p>
                    </div>
                  </div>
                </div>

                <div className="w-80 sm:w-96 bg-slate-50 p-6 rounded-3xl border border-gray-100 flex-shrink-0">
                  <div className="flex text-yellow-400 mb-4">
                    <Star className="w-5 h-5 fill-current"/><Star className="w-5 h-5 fill-current"/><Star className="w-5 h-5 fill-current"/><Star className="w-5 h-5 fill-current"/><Star className="w-5 h-5 text-gray-300 fill-current"/>
                  </div>
                  <p className="text-gray-700 italic mb-6">"Their Fried Rice is top-notch! The app is very smooth and easy to use. I just wish they added more drinks to the menu. Overall, excellent service."</p>
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center text-green-600 font-bold">D</div>
                    <div>
                      <p className="font-bold text-gray-900">Daniel O.</p>
                      <p className="text-sm text-gray-500">Staff Quarters</p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* FAQ */}
      <section className="bg-slate-50 py-14 border-t border-gray-100">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-extrabold text-gray-900 mb-3">Frequently Asked Questions</h2>
            <p className="text-gray-600">Got questions? We've got answers.</p>
          </div>
          <div className="space-y-3">
            <FAQItem question="Where does Snad Kitchen deliver?" answer="We deliver to all hostels (South Core, North Core), faculties, departments, staff quarters, and any landmark within JOSTUM campus." />
            <FAQItem question="What payment methods do you accept?" answer="We accept card payments via Paystack (Visa, Mastercard, Verve), bank transfers, and Cash on Delivery." />
            <FAQItem question="How long does delivery take?" answer="Most orders are delivered within 15-30 minutes depending on your location on campus and order volume." />
            <FAQItem question="Can I cancel my order?" answer="You can cancel your order while it's still in 'Pending' status. Once preparation starts, cancellations are not possible." />
            <FAQItem question="How do I track my order?" answer="After placing your order, you'll receive a Tracking ID via SMS and email. Use it on our Track Order page to see real-time updates." />
            <FAQItem question="Do you offer student discounts?" answer="Yes! We frequently run student promotions and combo deals. Follow our WhatsApp or check the app for the latest offers." />
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-gradient-to-br from-orange-500 to-red-600 py-16">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-4xl font-extrabold text-white mb-6">Hungry? We've got you covered.</h2>
          <p className="text-xl text-orange-100 mb-8">Browse our premium menu and get your food delivered to your door in minutes.</p>
          <Link to="/menu" className="inline-flex items-center space-x-2 bg-white text-orange-600 px-10 py-5 rounded-full font-extrabold text-lg shadow-2xl hover:scale-105 transition transform duration-200">
            <span>Start Your Order</span>
            <ArrowRight className="w-6 h-6" />
          </Link>
        </div>
      </section>

      {/* Map Section */}
      <section className="bg-white py-12 border-t border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-extrabold text-gray-900 mb-4">Find Us On Campus</h2>
            <p className="text-gray-600">Stop by our premium kitchen at JOSTUM.</p>
          </div>
          <div className="rounded-3xl overflow-hidden shadow-lg border border-gray-200">
            <iframe 
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3952.9672704162585!2d8.61923577500506!3d7.793290092226731!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x1050856bd43e2a31%3A0x809e98b3180176a9!2sSnad%20kitchen!5e0!3m2!1sen!2sng!4v1784515705679!5m2!1sen!2sng" 
              width="100%" 
              height="450" 
              style={{ border: 0 }} 
              allowFullScreen={true} 
              loading="lazy" 
              referrerPolicy="no-referrer-when-downgrade"
            ></iframe>
          </div>
        </div>
      </section>
    </div>
  );
}
