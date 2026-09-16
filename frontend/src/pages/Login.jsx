import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Wallet,
  Eye,
  EyeOff,
  LockKeyhole,
  Mail,
  ShieldCheck,
  ArrowRight,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';

import { authService } from '../services/authService';
import ErrorMessage from '../components/ErrorMessage';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const navigate = useNavigate();
  const { login } = useAuth();

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((previousData) => ({
      ...previousData,
      [name]: value,
    }));

    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const email = formData.email.trim().toLowerCase();
    const password = formData.password;

    if (!email) {
      setError('Please enter your email address.');
      return;
    }

    if (!password) {
      setError('Please enter your password.');
      return;
    }

    setIsLoading(true);

    try {
      const response = await authService.login(email, password);

      console.log('Login response:', response);

      const authToken = response?.access_token || response?.token;
      const userData = response?.user || null;

      if (!authToken) {
        setError('Authentication token was not received from the server.');
        return;
      }

      // Existing authentication logic preserved
      login(authToken, userData);

      console.log('Login successful. Redirecting to dashboard...');

      navigate('/dashboard', { replace: true });
    } catch (err) {
      console.error('Login error:', err.response?.data || err);

      setError(
        err.response?.data?.message ||
          err.response?.data?.error?.message ||
          'Invalid email or password.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = () => {
    setError('Forgot password feature is coming soon.');
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-950">
      {/* Background Decorations */}
      <div className="pointer-events-none absolute -left-32 -top-32 h-96 w-96 rounded-full bg-indigo-600/20 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-40 -right-32 h-[30rem] w-[30rem] rounded-full bg-violet-600/20 blur-3xl" />

      <div className="relative mx-auto flex min-h-screen max-w-7xl items-center px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid w-full overflow-hidden rounded-3xl border border-white/10 bg-white shadow-2xl shadow-black/30 lg:grid-cols-2">
          {/* Left Branding Section */}
          <div className="relative hidden overflow-hidden bg-gradient-to-br from-indigo-600 via-indigo-700 to-violet-800 p-10 text-white lg:flex lg:flex-col lg:justify-between xl:p-14">
            <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full border-[35px] border-white/10" />
            <div className="absolute -bottom-32 -left-20 h-80 w-80 rounded-full border-[45px] border-white/10" />

            <div className="relative">
              {/* Logo */}
              <div className="mb-12 flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15 shadow-lg backdrop-blur-sm">
                  <Wallet className="h-6 w-6 text-white" />
                </div>

                <div>
                  <h1 className="text-2xl font-bold tracking-tight">
                    TrackWise
                  </h1>
                  <p className="text-xs text-indigo-100">
                    Smart Finance Management
                  </p>
                </div>
              </div>

              <div className="max-w-md">
                <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-medium text-indigo-100 backdrop-blur-sm">
                  <Sparkles className="h-3.5 w-3.5" />
                  Take control of your money
                </div>

                <h2 className="text-4xl font-bold leading-tight xl:text-5xl">
                  Your finances.
                  <br />
                  Your future.
                  <br />
                  <span className="text-indigo-200">Your control.</span>
                </h2>

                <p className="mt-6 max-w-sm text-sm leading-6 text-indigo-100/85">
                  Track expenses, manage budgets and understand your spending
                  habits with one simple financial workspace.
                </p>
              </div>
            </div>

            {/* Benefits */}
            <div className="relative mt-12 space-y-4">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="h-5 w-5 text-indigo-200" />
                <span className="text-sm text-indigo-50">
                  Organize your daily expenses
                </span>
              </div>

              <div className="flex items-center gap-3">
                <CheckCircle2 className="h-5 w-5 text-indigo-200" />
                <span className="text-sm text-indigo-50">
                  Monitor your financial progress
                </span>
              </div>

              <div className="flex items-center gap-3">
                <CheckCircle2 className="h-5 w-5 text-indigo-200" />
                <span className="text-sm text-indigo-50">
                  Make smarter money decisions
                </span>
              </div>
            </div>
          </div>

          {/* Right Login Section */}
          <div className="bg-white px-6 py-8 sm:px-10 sm:py-12 lg:px-12 xl:px-16">
            {/* Mobile Brand */}
            <div className="mb-8 flex items-center gap-3 lg:hidden">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 shadow-lg shadow-indigo-500/20">
                <Wallet className="h-5 w-5 text-white" />
              </div>

              <div>
                <h1 className="text-xl font-bold text-slate-900">
                  TrackWise
                </h1>
                <p className="text-xs text-slate-500">
                  Smart Finance Management
                </p>
              </div>
            </div>

            {/* Heading */}
            <div className="mb-8">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50">
                <ShieldCheck className="h-6 w-6 text-indigo-600" />
              </div>

              <h2 className="text-3xl font-bold tracking-tight text-slate-900">
                Welcome back
              </h2>

              <p className="mt-2 text-sm text-slate-500">
                Sign in to continue to your financial dashboard.
              </p>
            </div>

            <ErrorMessage message={error} />

            <form onSubmit={handleSubmit} className="mt-6 space-y-5">
              {/* Email */}
              <div>
                <label
                  htmlFor="email"
                  className="mb-2 block text-sm font-semibold text-slate-700"
                >
                  Email Address
                </label>

                <div className="group relative">
                  <Mail className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 transition group-focus-within:text-indigo-600" />

                  <input
                    id="email"
                    type="email"
                    name="email"
                    required
                    autoComplete="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="you@example.com"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3.5 pl-11 pr-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 hover:border-slate-300 focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <div className="mb-2 flex items-center justify-between">
                  <label
                    htmlFor="password"
                    className="block text-sm font-semibold text-slate-700"
                  >
                    Password
                  </label>

                  <button
                    type="button"
                    onClick={handleForgotPassword}
                    className="text-xs font-semibold text-indigo-600 transition hover:text-indigo-700 hover:underline"
                  >
                    Forgot password?
                  </button>
                </div>

                <div className="group relative">
                  <LockKeyhole className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 transition group-focus-within:text-indigo-600" />

                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    required
                    autoComplete="current-password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="Enter your password"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3.5 pl-11 pr-12 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 hover:border-slate-300 focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10"
                  />

                  <button
                    type="button"
                    onClick={() => setShowPassword((previous) => !previous)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}
                  </button>
                </div>
              </div>

              {/* Remember Me */}
              <div className="flex items-center gap-2">
                <input
                  id="rememberMe"
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                />

                <label
                  htmlFor="rememberMe"
                  className="cursor-pointer text-sm text-slate-500"
                >
                  Remember me
                </label>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={isLoading}
                className="group flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 py-3.5 text-sm font-bold text-white shadow-lg shadow-indigo-500/25 transition hover:from-indigo-700 hover:to-violet-700 hover:shadow-indigo-500/35 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isLoading ? 'Signing in...' : 'Sign In'}

                {!isLoading && (
                  <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
                )}
              </button>
            </form>

            {/* Register Link */}
            <p className="mt-8 text-center text-sm text-slate-500">
              Don't have an account?{' '}
              <Link
                to="/register"
                className="font-bold text-indigo-600 transition hover:text-indigo-700 hover:underline"
              >
                Create an account
              </Link>
            </p>

            {/* Security Note */}
            <div className="mt-8 flex items-center justify-center gap-2 text-xs text-slate-400">
              <ShieldCheck className="h-4 w-4" />
              Your account information is securely protected.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}