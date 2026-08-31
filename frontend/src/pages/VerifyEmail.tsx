import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/store/useAuthStore';
import { Mail, KeyRound, Loader2, ArrowRight, RefreshCcw } from 'lucide-react';
import api from '@/lib/axios';
import toast from 'react-hot-toast';

export default function VerifyEmail() {
  const navigate = useNavigate();
  const location = useLocation();
  const login = useAuthStore(state => state.login);
  
  // Get email from router state if available
  const emailParams = new URLSearchParams(location.search);
  const initialEmail = location.state?.email || emailParams.get('email') || '';

  const [email, setEmail] = useState(initialEmail);
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [countdown, setCountdown] = useState(30);
  const [resending, setResending] = useState(false);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    if (countdown > 0) {
      timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [countdown]);

  const handleResend = async () => {
    if (!email) {
      toast.error('Please enter your email address first.');
      return;
    }
    setResending(true);
    try {
      const res = await api.post('/auth/resend-otp', { email });
      toast.success(res.data.message || 'A new OTP has been sent.');
      setCountdown(30);
    } catch (err: any) {
      const msg = err.response?.data?.message;
      if (msg === 'Email is already verified') {
        toast.success('Your email is already verified! Please log in.');
        navigate('/login');
      } else {
        toast.error(msg || 'Failed to resend OTP.');
      }
    } finally {
      setResending(false);
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await api.post('/auth/verify-otp', { email, otp });
      login(response.data.access_token, response.data.user);
      toast.success('Account verified successfully!');
      
      // Route based on role
      if (response.data.user.role === 'admin') navigate('/admin');
      else if (response.data.user.role === 'kitchen') navigate('/kitchen');
      else if (response.data.user.role === 'rider') navigate('/rider');
      else navigate('/dashboard');
      
    } catch (err: any) {
      const msg = err.response?.data?.message || err.response?.data?.errors?.otp?.[0];
      if (msg === 'Email is already verified') {
        toast.success('Your email is already verified! Please log in.');
        navigate('/login');
      } else {
        setError(msg || 'Invalid or expired OTP. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-8 sm:p-10 rounded-3xl shadow-xl">
        <div className="text-center">
          <div className="mx-auto h-16 w-16 bg-orange-100 flex items-center justify-center rounded-full mb-4">
            <Mail className="h-8 w-8 text-orange-600" />
          </div>
          <h2 className="text-3xl font-extrabold text-gray-900">Verify Your Email</h2>
          <p className="mt-2 text-sm text-gray-600">
            We sent a 6-digit verification code via email and SMS to your phone.
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleVerify}>
          {error && (
            <div className="bg-red-50 text-red-600 p-4 rounded-xl text-sm text-center font-medium border border-red-100">
              {error}
            </div>
          )}
          
          <div className="space-y-4">
            <div>
              <label htmlFor="email" className="sr-only">Email address</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="appearance-none rounded-xl relative block w-full px-3 py-3 pl-10 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent sm:text-sm transition"
                  placeholder="Email address"
                  readOnly={!!initialEmail}
                />
              </div>
            </div>
            
            <div>
              <label htmlFor="otp" className="sr-only">6-Digit Code</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <KeyRound className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="otp"
                  name="otp"
                  type="text"
                  required
                  maxLength={6}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))} // Only allow numbers
                  className="appearance-none rounded-xl relative block w-full px-3 py-4 pl-10 border border-gray-300 placeholder-gray-400 text-center text-2xl tracking-[0.5em] font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition"
                  placeholder="000000"
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || otp.length !== 6}
            className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-bold rounded-xl text-white bg-gray-900 hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-900 transition disabled:opacity-50"
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <span className="flex items-center">
                Verify Account
                <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </span>
            )}
          </button>
        </form>

        <div className="text-center mt-6">
          <p className="text-sm text-gray-600">
            Didn't receive the code?{' '}
            {countdown > 0 ? (
              <span className="font-bold text-gray-400">Resend in {countdown}s</span>
            ) : (
              <button 
                type="button" 
                onClick={handleResend}
                disabled={resending}
                className="font-bold text-orange-600 hover:text-orange-500 disabled:opacity-50 inline-flex items-center"
              >
                {resending ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <RefreshCcw className="w-4 h-4 mr-1" />}
                {resending ? 'Resending...' : 'Resend now'}
              </button>
            )}
          </p>
        </div>
      </div>
    </div>
  );
}
