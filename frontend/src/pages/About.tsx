import { Users, Target, ShieldCheck, Heart } from 'lucide-react';
import { motion } from 'framer-motion';

export default function About() {
  return (
    <div className="bg-slate-50 min-h-screen pt-10 pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header Section */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl sm:text-5xl font-extrabold text-gray-900 mb-6"
          >
            Revolutionizing Campus Dining at <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-red-600">JOSTUM</span>
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-lg text-gray-600 leading-relaxed"
          >
            Snad Kitchen was founded with a single mission: to provide the students and staff of Joseph Sarwuan Tarka University with premium, affordable, and lightning-fast food delivery, directly to their hostels and offices.
          </motion.p>
        </div>

        {/* Image Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-20">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="rounded-3xl overflow-hidden h-80 sm:h-96 shadow-xl relative group"
          >
            <img 
              src="/images/snad.png" 
              alt="Snad Kitchen Hub" 
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent flex items-end p-6">
              <div>
                <span className="bg-amber-500 text-white text-xs font-black uppercase px-3 py-1 rounded-full mb-2 inline-block">Snad Hub</span>
                <h3 className="text-xl font-bold text-white">Our Campus Headquarters</h3>
              </div>
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="rounded-3xl overflow-hidden h-80 sm:h-96 shadow-xl relative group"
          >
            <img 
              src="https://images.unsplash.com/photo-1504674900247-0877df9cc836?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80" 
              alt="Delicious Campus Meal" 
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent flex items-end p-6">
              <div>
                <span className="bg-emerald-500 text-white text-xs font-black uppercase px-3 py-1 rounded-full mb-2 inline-block">Fresh Meals</span>
                <h3 className="text-xl font-bold text-white">Chef Crafted Delicacies</h3>
              </div>
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
            className="rounded-3xl overflow-hidden h-80 sm:h-96 shadow-xl relative group"
          >
            <img 
              src="/images/internal.png" 
              alt="Snad Kitchen Internal Operations" 
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent flex items-end p-6">
              <div>
                <span className="bg-orange-500 text-white text-xs font-black uppercase px-3 py-1 rounded-full mb-2 inline-block">Kitchen Excellence</span>
                <h3 className="text-xl font-bold text-white">Hygiene & Quality Standard</h3>
              </div>
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 }}
            className="rounded-3xl overflow-hidden h-80 sm:h-96 shadow-xl relative group"
          >
            <img 
              src="/images/delivery_ride.png" 
              alt="Snad Kitchen Delivery Fleet" 
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent flex items-end p-6">
              <div>
                <span className="bg-red-500 text-white text-xs font-black uppercase px-3 py-1 rounded-full mb-2 inline-block">Express Logistics</span>
                <h3 className="text-xl font-bold text-white">Fast Campus Delivery Fleet</h3>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Core Values */}
        <div className="mb-20">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">Our Core Values</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { icon: Target, title: 'Quality First', desc: 'We never compromise on the quality of ingredients we use.', color: 'text-orange-500', bg: 'bg-orange-50' },
              { icon: Users, title: 'Student Centric', desc: 'Built by students, for students. We understand campus life.', color: 'text-blue-500', bg: 'bg-blue-50' },
              { icon: ShieldCheck, title: 'Food Safety', desc: 'Strict hygiene protocols in our kitchen at all times.', color: 'text-green-500', bg: 'bg-green-50' },
              { icon: Heart, title: 'Made with Love', desc: 'Every meal is prepared with passion and dedication.', color: 'text-red-500', bg: 'bg-red-50' }
            ].map((value, idx) => {
              const Icon = value.icon;
              return (
                <motion.div 
                  key={value.title}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 + (idx * 0.1) }}
                  className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 text-center hover:shadow-md transition"
                >
                  <div className={`w-16 h-16 ${value.bg} ${value.color} rounded-2xl flex items-center justify-center mx-auto mb-6`}>
                    <Icon className="w-8 h-8" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3">{value.title}</h3>
                  <p className="text-gray-600">{value.desc}</p>
                </motion.div>
              )
            })}
          </div>
        </div>

        {/* Contact CTA */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="bg-gray-900 rounded-3xl p-10 text-center text-white"
        >
          <h2 className="text-3xl font-bold mb-4">Want to reach out?</h2>
          <p className="text-gray-400 mb-8 max-w-2xl mx-auto">Whether you have feedback on our meals, want to partner with us, or have any questions, our support team is always ready to help.</p>
          <a href="mailto:support@snadkitchen.com" className="inline-block bg-orange-600 hover:bg-orange-700 text-white font-bold py-4 px-8 rounded-full transition">
            Contact Support
          </a>
        </motion.div>

      </div>
    </div>
  );
}
