import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Wallet,
  Eye,
  EyeOff,
  LockKeyhole,
  Mail,
  ShieldCheck
} from 'lucide-react';

import { authService } from '../services/authService';
import ErrorMessage from '../components/ErrorMessage';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
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
      [name]: value
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

      // AuthContext handles token and user storage
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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-blue-50 px-4 py-8">
      <div className="w-full max-w-md">

        {/* Brand Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center p-3 bg-blue-600 rounded-2xl shadow-lg shadow-blue-600/20 mb-3">
            <Wallet className="w-8 h-8 text-white" />
          </div>

          <h1 className="text-2xl font-bold text-slate-900">
            Welcome Back
          </h1>

          <p className="text-sm text-slate-500 mt-1">
            Sign in to continue to TrackWise
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/60 border border-slate-100 p-6 sm:p-8">

          {/* Card Heading */}
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2.5 bg-blue-50 rounded-xl">
              <ShieldCheck className="w-5 h-5 text-blue-600" />
            </div>

            <div>
              <h2 className="font-semibold text-slate-800">
                Sign in to your account
              </h2>

              <p className="text-xs text-slate-500">
                Access your personal finance dashboard
              </p>
            </div>
          </div>

          <ErrorMessage message={error} />

          <form onSubmit={handleSubmit} className="space-y-5">

            {/* Email */}
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-slate-700 mb-1.5"
              >
                Email Address
              </label>

              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />

                <input
                  id="email"
                  type="email"
                  name="email"
                  required
                  autoComplete="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="you@example.com"
                  className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label
                  htmlFor="password"
                  className="block text-sm font-medium text-slate-700"
                >
                  Password
                </label>

                <button
                  type="button"
                  onClick={handleForgotPassword}
                  className="text-xs font-medium text-blue-600 hover:text-blue-700 hover:underline"
                >
                  Forgot password?
                </button>
              </div>

              <div className="relative">
                <LockKeyhole className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />

                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  required
                  autoComplete="current-password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Enter your password"
                  className="w-full pl-10 pr-12 py-3 border border-slate-200 rounded-xl outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                />

                <button
                  type="button"
                  onClick={() => setShowPassword((previous) => !previous)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
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
                className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              />

              <label
                htmlFor="rememberMe"
                className="text-sm text-slate-500 cursor-pointer"
              >
                Remember me
              </label>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold py-3 rounded-xl transition shadow-lg shadow-blue-600/20 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Signing in...' : 'Sign In'}
            </button>

          </form>

          {/* Register Link */}
          <p className="mt-6 text-center text-sm text-slate-500">
            Don't have an account?{' '}
            <Link
              to="/register"
              className="text-blue-600 hover:text-blue-700 font-semibold hover:underline"
            >
              Create an account
            </Link>
          </p>
        </div>

        <p className="text-center text-xs text-slate-400 mt-5">
          Your account information is securely protected.
        </p>
      </div>
    </div>
  );
}