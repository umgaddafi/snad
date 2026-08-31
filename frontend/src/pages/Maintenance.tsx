import { Wrench, Lock, RefreshCw, ChefHat, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';

interface MaintenanceProps {
  message?: string;
  onRefresh?: () => void;
}

export default function Maintenance({ message, onRefresh }: MaintenanceProps) {
  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-6 relative overflow-hidden selection:bg-orange-500 selection:text-white">
      {/* Background Animated Gradient Blobs */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-orange-600/20 rounded-full blur-[140px] pointer-events-none animate-pulse"></div>
      <div className="absolute bottom-10 right-10 w-96 h-96 bg-red-600/15 rounded-full blur-[120px] pointer-events-none"></div>

      <div className="max-w-xl w-full text-center space-y-8 relative z-10">
        {/* Animated Icon Container */}
        <div className="relative inline-block">
          <div className="w-28 h-28 sm:w-32 sm:h-32 bg-gradient-to-br from-orange-500 via-amber-500 to-red-600 rounded-3xl p-0.5 shadow-2xl shadow-orange-500/30 transform -rotate-3 hover:rotate-0 transition duration-500 mx-auto">
            <div className="w-full h-full bg-slate-900 rounded-[22px] flex items-center justify-center relative overflow-hidden">
              <ChefHat className="w-14 h-14 text-orange-500 animate-bounce" />
              <div className="absolute top-2 right-2">
                <Wrench className="w-5 h-5 text-amber-400 animate-spin" style={{ animationDuration: '4s' }} />
              </div>
            </div>
          </div>
          <span className="absolute -bottom-2 -right-2 bg-gradient-to-r from-orange-500 to-amber-500 text-slate-950 text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full shadow-lg border border-slate-900 flex items-center gap-1">
            <Sparkles className="w-3 h-3" /> Maintenance
          </span>
        </div>

        {/* Heading & Notice */}
        <div className="space-y-3">
          <span className="bg-orange-500/10 border border-orange-500/30 text-orange-400 text-xs font-black uppercase tracking-widest px-4 py-1.5 rounded-full inline-block">
            JOSTUM Campus Food Portal
          </span>
          <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-white leading-tight">
            We're Cooking Up <br />
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-orange-400 via-amber-400 to-red-500">
              Something Better!
            </span>
          </h1>
          <p className="text-slate-300 text-sm sm:text-base max-w-lg mx-auto font-medium leading-relaxed">
            {message ||
              'Snad Kitchen is currently undergoing scheduled platform upgrades to make your food ordering experience faster and smoother.'}
          </p>
        </div>

        {/* Live Status Pill */}
        <div className="bg-slate-900/80 backdrop-blur-md border border-slate-800 p-4 rounded-2xl max-w-md mx-auto flex items-center justify-between text-xs text-slate-400 shadow-inner">
          <div className="flex items-center space-x-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500"></span>
            </span>
            <span className="font-bold text-slate-200">Status: Platform Maintenance</span>
          </div>
          <span className="font-mono text-amber-400 font-bold">Back Online Soon 🚀</span>
        </div>

        {/* Quick Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          {onRefresh && (
            <button
              onClick={onRefresh}
              className="w-full sm:w-auto bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-slate-950 font-black px-6 py-3.5 rounded-2xl text-sm transition shadow-lg shadow-orange-500/25 flex items-center justify-center space-x-2"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Check If We're Live</span>
            </button>
          )}

          <Link
            to="/login"
            className="w-full sm:w-auto bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 font-bold px-6 py-3.5 rounded-2xl text-sm transition flex items-center justify-center space-x-2"
          >
            <Lock className="w-4 h-4 text-orange-400" />
            <span>Admin & Staff Portal</span>
          </Link>
        </div>

        {/* Footer info */}
        <p className="text-xs text-slate-500 pt-4">
          Need urgent campus catering assistance? Contact Snad Kitchen support desk.
        </p>
      </div>
    </div>
  );
}
