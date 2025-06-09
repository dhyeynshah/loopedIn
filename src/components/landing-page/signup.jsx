"use client";
import { useState, useEffect } from 'react';
import { loginWithGoogle, signUpWithEmail, signInWithOTP, verifyOTP } from '@/lib/auth';
import { useRouter } from 'next/navigation';
import { useAuth } from "@/context/AuthContext";

export default function SignUp() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [authMethod, setAuthMethod] = useState('google');
  const [otpSent, setOtpSent] = useState(false);
  const router = useRouter();
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      router.push("/profile");
    }
  }, [user, router]);

  const handleGoogleSignUp = async () => {
    try {
      setLoading(true);
      setError(null);
      await loginWithGoogle();
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  const handleEmailSignUp = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError(null);
      await signUpWithEmail(email, password);
      router.push('/login');
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  const handleOTPSignUp = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError(null);
      await signInWithOTP(email);
      setOtpSent(true);
      setAuthMethod('verify-otp');
      setLoading(false);
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError(null);
      await verifyOTP(email, otpCode);
      router.push('/profile');
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-100 px-4 sm:px-0">
      <div className="w-full max-w-md p-8 bg-white shadow-lg rounded-lg">
        <h1 className="text-2xl font-bold text-center mb-6">Join LoopedIn</h1>
        
        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}

        {authMethod === 'google' && (
          <>
            <button
              onClick={handleGoogleSignUp}
              disabled={loading}
              className="w-full flex items-center justify-center gap-3 py-3 px-4 border border-gray-300 rounded-md bg-white hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed mb-4"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              {loading ? "Creating account..." : "Continue with Google"}
            </button>

            <div className="relative mb-4">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">or</span>
              </div>
            </div>

            <div className="space-y-2">
              <button
                onClick={() => setAuthMethod('email')}
                className="w-full py-2 px-4 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors text-sm"
              >
                Sign up with Email & Password
              </button>
              <button
                onClick={() => setAuthMethod('otp')}
                className="w-full py-2 px-4 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors text-sm"
              >
                Sign up with Email OTP
              </button>
            </div>
          </>
        )}

        {authMethod === 'email' && (
          <>
            <form onSubmit={handleEmailSignUp} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#60A5FA]"
                  placeholder="Enter your email"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#60A5FA]"
                  placeholder="Enter your password"
                  required
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full py-2 bg-[#1E3A8A] text-white rounded-md hover:bg-[#1D4ED8] disabled:opacity-50"
              >
                {loading ? "Creating account..." : "Sign Up"}
              </button>
            </form>
            <button
              onClick={() => setAuthMethod('google')}
              className="w-full mt-4 py-2 text-[#60A5FA] hover:text-[#3B82F6] text-sm"
            >
              ← Back to other options
            </button>
          </>
        )}

        {authMethod === 'otp' && (
          <>
            <form onSubmit={handleOTPSignUp} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#60A5FA]"
                  placeholder="Enter your email"
                  required
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full py-2 bg-[#1E3A8A] text-white rounded-md hover:bg-[#1D4ED8] disabled:opacity-50"
              >
                {loading ? "Sending OTP..." : "Send OTP"}
              </button>
            </form>
            <button
              onClick={() => setAuthMethod('google')}
              className="w-full mt-4 py-2 text-[#60A5FA] hover:text-[#3B82F6] text-sm"
            >
              ← Back to other options
            </button>
          </>
        )}

        {authMethod === 'verify-otp' && (
          <>
            <div className="mb-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded text-sm">
              OTP sent to {email}. Check your email and enter the code below.
            </div>
            <form onSubmit={handleVerifyOTP} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Enter OTP Code</label>
                <input
                  type="text"
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#60A5FA] text-center tracking-widest"
                  placeholder="123456"
                  maxLength={6}
                  required
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full py-2 bg-[#1E3A8A] text-white rounded-md hover:bg-[#1D4ED8] disabled:opacity-50"
              >
                {loading ? "Verifying..." : "Verify OTP"}
              </button>
            </form>
            <div className="mt-4 space-y-2">
              <button
                onClick={() => {
                  setAuthMethod('otp');
                  setOtpSent(false);
                  setOtpCode('');
                }}
                className="w-full py-2 text-[#60A5FA] hover:text-[#3B82F6] text-sm"
              >
                Resend OTP
              </button>
              <button
                onClick={() => {
                  setAuthMethod('google');
                  setOtpSent(false);
                  setOtpCode('');
                  setEmail('');
                }}
                className="w-full py-2 text-[#60A5FA] hover:text-[#3B82F6] text-sm"
              >
                ← Back to other options
              </button>
            </div>
          </>
        )}
        
        <div className="mt-6 text-center space-y-3">
          <p className="text-sm text-gray-600">
            Already have an account?{' '}
            <a href="/login" className="text-[#60A5FA] hover:text-[#3B82F6]">Sign in</a>
          </p>
          <p className="text-sm text-gray-600">
            <a href="/" className="text-[#60A5FA] hover:text-[#3B82F6]">Go to Home Page</a>
          </p>
        </div>
        
        <div className="mt-4 text-center">
          <p className="text-sm text-gray-600">
            By continuing, you agree to our Terms of Service and Privacy Policy
          </p>
        </div>
      </div>
    </div>
  );
}