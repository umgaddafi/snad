import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { Home, UtensilsCrossed, ArrowLeft, Clock, Sparkles, AlertCircle } from 'lucide-react';

export default function NotFound() {
  const navigate = useNavigate();

  return (
    <div className="min-h-[85vh] bg-gradient-to-b from-slate-900 via-slate-950 to-black text-white flex items-center justify-center px-4 py-16 relative overflow-hidden font-sans">
      {/* Dynamic Animated Background Glow Gradients */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-orange-500/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-80 h-80 bg-red-600/15 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute top-10 left-10 w-72 h-72 bg-amber-500/15 rounded-full blur-[90px] pointer-events-none" />

      {/* Floating Decorative Elements */}
      <motion.div
        animate={{ y: [0, -15, 0], rotate: [0, 5, 0] }}
        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute top-20 left-12 hidden lg:flex items-center gap-2 bg-white/10 backdrop-blur-md px-4 py-2 rounded-2xl border border-white/10 shadow-2xl text-xs font-bold text-orange-300"
      >
        <Sparkles className="w-4 h-4 text-amber-400" />
        <span>Fresh Amala & Ewedu</span>
      </motion.div>

      <motion.div
        animate={{ y: [0, 15, 0], rotate: [0, -5, 0] }}
        transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
        className="absolute bottom-24 right-16 hidden lg:flex items-center gap-2 bg-white/10 backdrop-blur-md px-4 py-2 rounded-2xl border border-white/10 shadow-2xl text-xs font-bold text-red-300"
      >
        <Clock className="w-4 h-4 text-orange-400" />
        <span>Express Campus Delivery</span>
      </motion.div>

      <div className="max-w-2xl w-full text-center relative z-10 space-y-8">
        {/* Animated 404 Hero Display */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="relative inline-block"
        >
          <div className="text-8xl sm:text-9xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-orange-400 via-amber-400 to-red-500 drop-shadow-2xl select-none">
            404
          </div>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="absolute -bottom-2 right-2 sm:right-6 bg-orange-500 text-white text-[11px] sm:text-xs font-black uppercase tracking-wider px-3 py-1 rounded-full shadow-lg border border-orange-300/40 flex items-center gap-1.5"
          >
            <AlertCircle className="w-3.5 h-3.5" />
            <span>Recipe Not Found</span>
          </motion.div>
        </motion.div>

        {/* Text Message */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="space-y-3"
        >
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white">
            Oops! This page got cooked away.
          </h1>
          <p className="text-gray-400 text-sm sm:text-base max-w-md mx-auto leading-relaxed font-medium">
            The page or dish you are searching for doesn’t exist or has been relocated on the Snad Kitchen portal.
          </p>
        </motion.div>

        {/* Interactive Action Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2"
        >
          <button
            onClick={() => navigate(-1)}
            className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-extrabold text-sm transition-all duration-200 backdrop-blur-md border border-white/15 flex items-center justify-center gap-2 hover:scale-105"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Go Back</span>
          </button>

          <Link
            to="/"
            className="w-full sm:w-auto px-7 py-3.5 rounded-2xl bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white font-extrabold text-sm shadow-xl shadow-orange-500/25 transition-all duration-200 flex items-center justify-center gap-2 hover:scale-105"
          >
            <Home className="w-4 h-4" />
            <span>Return to Homepage</span>
          </Link>

          <Link
            to="/menu"
            className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 font-extrabold text-sm transition-all duration-200 border border-amber-500/30 flex items-center justify-center gap-2 hover:scale-105"
          >
            <UtensilsCrossed className="w-4 h-4" />
            <span>Explore Food Menu</span>
          </Link>
        </motion.div>

        {/* Popular Quick Links */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="pt-8 border-t border-white/10"
        >
          <p className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-3">Popular Snad Destinations</p>
          <div className="flex flex-wrap items-center justify-center gap-2">
            <Link
              to="/dashboard"
              className="text-xs font-bold text-gray-400 hover:text-orange-400 bg-white/5 hover:bg-white/10 px-3.5 py-1.5 rounded-full border border-white/10 transition"
            >
              My Customer Dashboard
            </Link>
            <Link
              to="/track"
              className="text-xs font-bold text-gray-400 hover:text-orange-400 bg-white/5 hover:bg-white/10 px-3.5 py-1.5 rounded-full border border-white/10 transition"
            >
              Track Active Order
            </Link>
            <Link
              to="/about"
              className="text-xs font-bold text-gray-400 hover:text-orange-400 bg-white/5 hover:bg-white/10 px-3.5 py-1.5 rounded-full border border-white/10 transition"
            >
              About Snad Kitchen
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
