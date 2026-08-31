import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Loader2, Mail, Lock, Eye, EyeOff, ArrowLeft, CheckCircle2 } from 'lucide-react';
import api from '@/lib/axios';
import toast from 'react-hot-toast';

export default function ForgotPassword() {
  const [step, setStep] = useState<'email' | 'reset' | 'done'>('email');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirmation, setPasswordConfirmation] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [isOtpVerified, setIsOtpVerified] = useState(false);
  const [verifyingOtp, setVerifyingOtp] = useState(false);

  const handleVerifyOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (otp.trim().length !== 6) {
      setError('Please enter a valid 6-digit reset code.');
      return;
    }
    setError('');
    setVerifyingOtp(true);
    try {
      await api.post('/auth/verify-reset-otp', { email, otp });
      setIsOtpVerified(true);
      toast.success('Reset code verified! Please set your new password.');
    } catch (err: any) {
      setIsOtpVerified(false);
      setError(err.response?.data?.message || err.response?.data?.errors?.otp?.[0] || 'Invalid or expired 6-digit reset code.');
    } finally {
      setVerifyingOtp(false);
    }
  };

  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await api.post('/auth/forgot-password', { email });
      toast.success('Reset code sent to your email!');
      setStep('reset');
      setIsOtpVerified(false);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to send reset code.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!isOtpVerified) {
      setError('Please verify your 6-digit code first.');
      return;
    }
    if (password !== passwordConfirmation) {
      setError('Passwords do not match.');
      return;
    }
    setLoading(true);
    try {
      await api.post('/auth/reset-password', {
        email,
        otp,
        password,
        password_confirmation: passwordConfirmation,
      });
      toast.success('Password reset successfully!');
      setStep('done');
    } catch (err: any) {
      setError(err.response?.data?.message || err.response?.data?.errors?.otp?.[0] || 'Failed to reset password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center bg-slate-50 py-10">
      <div className="bg-white p-10 rounded-3xl shadow-sm border border-gray-100 max-w-md w-full">

        {step === 'done' ? (
          <div className="text-center space-y-6">
            <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <h1 className="text-2xl font-extrabold text-gray-900">Password Reset!</h1>
            <p className="text-gray-600">Your password has been successfully changed. You can now login with your new password.</p>
            <Link to="/login" className="block w-full py-4 rounded-full bg-gradient-to-r from-orange-500 to-red-600 text-white font-bold hover:shadow-lg transition text-center">
              Go to Login
            </Link>
          </div>
        ) : (
          <>
            <div className="mb-8">
              <Link to="/login" className="inline-flex items-center text-sm text-gray-500 hover:text-orange-600 transition mb-4">
                <ArrowLeft className="w-4 h-4 mr-1" /> Back to Login
              </Link>
              <h1 className="text-3xl font-extrabold text-gray-900 mb-2">
                {step === 'email' ? 'Forgot Password?' : 'Reset Password'}
              </h1>
              <p className="text-gray-500">
                {step === 'email'
                  ? "Enter your email and we'll send you a 6-digit reset code."
                  : 'Enter the code sent to your email and your new password.'}
              </p>
            </div>

            {error && (
              <div className="bg-red-50 text-red-600 p-4 rounded-xl mb-6 text-sm font-medium">{error}</div>
            )}

            {step === 'email' && (
              <form onSubmit={handleRequestOtp} className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3.5 text-gray-400 w-5 h-5" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  </div>
                </div>
                <button type="submit" disabled={loading} className="w-full py-4 rounded-full bg-gradient-to-r from-orange-500 to-red-600 text-white font-bold hover:shadow-lg transition flex items-center justify-center">
                  {loading ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : null}
                  Send Reset Code
                </button>
              </form>
            )}

            {step === 'reset' && (
              <div className="space-y-5">
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="block text-sm font-medium text-gray-700">6-Digit Reset Code</label>
                    {isOtpVerified && (
                      <span className="text-xs font-bold text-emerald-600 flex items-center gap-1 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Verified
                      </span>
                    )}
                  </div>
                  <input
                    type="text"
                    required
                    maxLength={6}
                    disabled={isOtpVerified}
                    value={otp}
                    onChange={e => {
                      setOtp(e.target.value);
                      setIsOtpVerified(false);
                    }}
                    placeholder="Enter 6-digit code"
                    className={`w-full px-4 py-3 rounded-xl border focus:outline-none text-center text-2xl tracking-[0.5em] font-bold ${
                      isOtpVerified ? 'bg-emerald-50/50 border-emerald-300 text-emerald-900' : 'border-gray-200 focus:ring-2 focus:ring-orange-500'
                    }`}
                  />
                </div>

                {!isOtpVerified ? (
                  <button
                    type="button"
                    onClick={handleVerifyOtp}
                    disabled={verifyingOtp || otp.length !== 6}
                    className="w-full py-4 rounded-full bg-gradient-to-r from-orange-500 to-red-600 text-white font-bold hover:shadow-lg transition flex items-center justify-center disabled:opacity-50"
                  >
                    {verifyingOtp ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : null}
                    Verify 6-Digit Code
                  </button>
                ) : (
                  <form onSubmit={handleResetPassword} className="space-y-5">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">New Password</label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-3.5 text-gray-400 w-5 h-5" />
                        <input
                          type={showPassword ? 'text' : 'password'}
                          required
                          minLength={8}
                          value={password}
                          onChange={e => setPassword(e.target.value)}
                          placeholder="Min 8 characters"
                          className="w-full pl-10 pr-12 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-500"
                        />
                        <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-3.5 text-gray-400">
                          {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Confirm New Password</label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-3.5 text-gray-400 w-5 h-5" />
                        <input
                          type="password"
                          required
                          minLength={8}
                          value={passwordConfirmation}
                          onChange={e => setPasswordConfirmation(e.target.value)}
                          placeholder="Confirm password"
                          className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-500"
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full py-4 rounded-full bg-gradient-to-r from-orange-500 to-red-600 text-white font-bold hover:shadow-lg transition flex items-center justify-center"
                    >
                      {loading ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : null}
                      Reset Password
                    </button>
                  </form>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
