import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Wallet,
  Eye,
  EyeOff,
  Check,
  X,
  ShieldCheck
} from 'lucide-react';

import { authService } from '../services/authService';
import ErrorMessage from '../components/ErrorMessage';

export default function Register() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirm: ''
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const navigate = useNavigate();

  const passwordRules = {
    minLength: formData.password.length >= 8,
    lowercase: /[a-z]/.test(formData.password),
    uppercase: /[A-Z]/.test(formData.password),
    number: /[0-9]/.test(formData.password),
    special: /[^A-Za-z0-9\s]/.test(formData.password)
  };

  const isPasswordValid = Object.values(passwordRules).every(Boolean);

  const passwordsMatch =
    formData.password.length > 0 &&
    formData.password === formData.confirm;

  const getPasswordStrength = () => {
    const score = Object.values(passwordRules).filter(Boolean).length;

    if (!formData.password) {
      return {
        label: '',
        width: '0%',
        textColor: 'text-gray-400',
        barColor: 'bg-gray-200'
      };
    }

    if (score <= 2) {
      return {
        label: 'Weak',
        width: '30%',
        textColor: 'text-red-600',
        barColor: 'bg-red-500'
      };
    }

    if (score <= 4) {
      return {
        label: 'Medium',
        width: '65%',
        textColor: 'text-yellow-600',
        barColor: 'bg-yellow-500'
      };
    }

    return {
      label: 'Strong',
      width: '100%',
      textColor: 'text-green-600',
      barColor: 'bg-green-500'
    };
  };

  const passwordStrength = getPasswordStrength();

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

    if (formData.name.trim().length < 2) {
      setError('Name must be at least 2 characters.');
      return;
    }

    if (!isPasswordValid) {
      setError(
        'Password must contain 8 characters, uppercase, lowercase, number and special character.'
      );
      return;
    }

    if (!passwordsMatch) {
      setError('Passwords do not match.');
      return;
    }

    setIsLoading(true);

    try {
      await authService.register(
        formData.email,
        formData.password,
        formData.name
      );

      navigate('/login');
    } catch (err) {
      console.error('Registration error:', err.response?.data || err);

      setError(
        err.response?.data?.message ||
        err.response?.data?.error?.message ||
        'Registration failed. Please try again.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const Requirement = ({ valid, children }) => (
    <div
      className={`flex items-center gap-2 text-xs ${
        valid ? 'text-green-600' : 'text-gray-500'
      }`}
    >
      {valid ? (
        <Check className="w-3.5 h-3.5" />
      ) : (
        <X className="w-3.5 h-3.5" />
      )}
      <span>{children}</span>
    </div>
  );

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-primary-50 px-4 py-8">
      <div className="w-full max-w-md">

        {/* Brand Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center p-3 bg-primary-600 rounded-2xl shadow-lg shadow-primary-600/20 mb-3">
            <Wallet className="w-8 h-8 text-white" />
          </div>

          <h1 className="text-2xl font-bold text-slate-900">
            Join TrackWise
          </h1>

          <p className="text-sm text-slate-500 mt-1">
            Start managing your finances smarter
          </p>
        </div>

        {/* Registration Card */}
        <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/60 border border-slate-100 p-6 sm:p-8">

          <div className="flex items-center gap-2 mb-6">
            <ShieldCheck className="w-5 h-5 text-primary-600" />
            <div>
              <h2 className="font-semibold text-slate-800">
                Create your account
              </h2>
              <p className="text-xs text-slate-500">
                Your financial journey starts here
              </p>
            </div>
          </div>

          <ErrorMessage message={error} />

          <form onSubmit={handleSubmit} className="space-y-4">

            {/* Name */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Full Name
              </label>

              <input
                type="text"
                name="name"
                required
                value={formData.name}
                onChange={handleChange}
                placeholder="Enter your full name"
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl outline-none transition focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10"
              />
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Email Address
              </label>

              <input
                type="email"
                name="email"
                required
                value={formData.email}
                onChange={handleChange}
                placeholder="you@example.com"
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl outline-none transition focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10"
              />
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Password
              </label>

              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  required
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Create a strong password"
                  className="w-full px-4 py-2.5 pr-12 border border-slate-200 rounded-xl outline-none transition focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10"
                />

                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
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

              {/* Strength Meter */}
              {formData.password && (
                <div className="mt-2">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs text-slate-500">
                      Password strength
                    </span>

                    <span
                      className={`text-xs font-semibold ${passwordStrength.textColor}`}
                    >
                      {passwordStrength.label}
                    </span>
                  </div>

                  <div className="h-1.5 w-full bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${passwordStrength.barColor}`}
                      style={{ width: passwordStrength.width }}
                    />
                  </div>
                </div>
              )}

              {/* Password Requirements */}
              <div className="grid grid-cols-2 gap-x-3 gap-y-2 mt-3 p-3 bg-slate-50 rounded-xl">
                <Requirement valid={passwordRules.minLength}>
                  8+ characters
                </Requirement>

                <Requirement valid={passwordRules.uppercase}>
                  Uppercase letter
                </Requirement>

                <Requirement valid={passwordRules.lowercase}>
                  Lowercase letter
                </Requirement>

                <Requirement valid={passwordRules.number}>
                  Number
                </Requirement>

                <Requirement valid={passwordRules.special}>
                  Special character
                </Requirement>
              </div>
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Confirm Password
              </label>

              <div className="relative">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  name="confirm"
                  required
                  value={formData.confirm}
                  onChange={handleChange}
                  placeholder="Re-enter your password"
                  className={`w-full px-4 py-2.5 pr-12 border rounded-xl outline-none transition focus:ring-4 ${
                    formData.confirm && !passwordsMatch
                      ? 'border-red-300 focus:border-red-500 focus:ring-red-500/10'
                      : formData.confirm && passwordsMatch
                        ? 'border-green-400 focus:border-green-500 focus:ring-green-500/10'
                        : 'border-slate-200 focus:border-primary-500 focus:ring-primary-500/10'
                  }`}
                />

                <button
                  type="button"
                  onClick={() =>
                    setShowConfirmPassword(!showConfirmPassword)
                  }
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
                  aria-label={
                    showConfirmPassword
                      ? 'Hide confirm password'
                      : 'Show confirm password'
                  }
                >
                  {showConfirmPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>

              {formData.confirm && (
                <p
                  className={`text-xs mt-1.5 ${
                    passwordsMatch ? 'text-green-600' : 'text-red-600'
                  }`}
                >
                  {passwordsMatch
                    ? 'Passwords match'
                    : 'Passwords do not match'}
                </p>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-primary-600 hover:bg-primary-700 active:bg-primary-800 text-white font-semibold py-3 rounded-xl transition shadow-lg shadow-primary-600/20 disabled:opacity-60 disabled:cursor-not-allowed mt-2"
            >
              {isLoading ? 'Creating account...' : 'Create Account'}
            </button>
          </form>

          {/* Login Link */}
          <p className="mt-6 text-center text-sm text-slate-500">
            Already have an account?{' '}
            <Link
              to="/login"
              className="text-primary-600 hover:text-primary-700 font-semibold hover:underline"
            >
              Sign in
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