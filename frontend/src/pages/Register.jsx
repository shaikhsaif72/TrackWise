import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Wallet,
  Eye,
  EyeOff,
  Check,
  X,
  ShieldCheck,
  TrendingUp,
  ArrowUpRight,
  BarChart3,
  PieChart,
  Sparkles,
  User,
  Mail,
  LockKeyhole,
  CheckCircle2,
} from 'lucide-react';

import { authService } from '../services/authService';
import ErrorMessage from '../components/ErrorMessage';

export default function Register() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirm: '',
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
    special: /[^A-Za-z0-9\s]/.test(formData.password),
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
        textColor: 'text-slate-400',
        barColor: 'bg-slate-200',
      };
    }

    if (score <= 2) {
      return {
        label: 'Weak',
        width: '30%',
        textColor: 'text-red-500',
        barColor: 'bg-red-500',
      };
    }

    if (score <= 4) {
      return {
        label: 'Medium',
        width: '65%',
        textColor: 'text-amber-500',
        barColor: 'bg-amber-500',
      };
    }

    return {
      label: 'Strong',
      width: '100%',
      textColor: 'text-emerald-600',
      barColor: 'bg-emerald-500',
    };
  };

  const passwordStrength = getPasswordStrength();

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
        valid ? 'text-emerald-600' : 'text-slate-500'
      }`}
    >
      {valid ? (
        <Check className="h-3.5 w-3.5 shrink-0" />
      ) : (
        <X className="h-3.5 w-3.5 shrink-0" />
      )}

      <span>{children}</span>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-950 p-0 sm:p-3 lg:p-5">
      <div className="mx-auto flex min-h-screen max-w-[1500px] overflow-hidden bg-white shadow-2xl sm:min-h-[calc(100vh-40px)] sm:rounded-3xl">
        {/* =====================================================
            LEFT BRAND / FINANCIAL VISUAL PANEL
        ====================================================== */}
        <section className="relative hidden w-[48%] overflow-hidden bg-gradient-to-br from-indigo-700 via-violet-700 to-purple-900 px-8 py-10 text-white lg:block xl:px-14">
          {/* Decorative Background Circles */}
          <div className="absolute -right-28 -top-28 h-80 w-80 rounded-full border-[45px] border-white/5" />
          <div className="absolute -bottom-40 -left-40 h-96 w-96 rounded-full border-[55px] border-white/5" />
          <div className="absolute right-20 top-1/3 h-32 w-32 rounded-full bg-fuchsia-400/10 blur-3xl" />

          <div className="relative z-10 flex h-full flex-col">
            {/* Brand */}
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/15 shadow-lg ring-1 ring-white/20 backdrop-blur-sm">
                <Wallet className="h-6 w-6 text-white" />
              </div>

              <div>
                <h1 className="text-xl font-bold tracking-tight">TrackWise</h1>
                <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-indigo-200">
                  Smart Finance Management
                </p>
              </div>
            </div>

            {/* Small Badge */}
            <div className="mt-14 inline-flex w-fit items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs font-medium text-indigo-100 backdrop-blur-sm">
              <Sparkles className="h-4 w-4 text-indigo-200" />
              Build better financial habits
            </div>

            {/* Main Heading */}
            <div className="mt-7 max-w-xl">
              <h2 className="text-4xl font-extrabold leading-[1.12] tracking-tight xl:text-5xl">
                Start your
                <br />
                smarter money
                <br />
                <span className="text-indigo-200">journey today.</span>
              </h2>

              <p className="mt-6 max-w-md text-sm leading-7 text-indigo-100 xl:text-base">
                Create your TrackWise account and bring your expenses,
                budgets and financial insights together in one place.
              </p>
            </div>

            {/* Financial Graph Illustration */}
            <div className="relative mt-12">
              <div className="rounded-2xl border border-white/15 bg-white/10 p-5 shadow-2xl backdrop-blur-md">
                {/* Graph Header */}
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs font-medium text-indigo-200">
                      Monthly overview
                    </p>

                    <div className="mt-2 flex items-center gap-3">
                      <p className="text-2xl font-bold">₹24,850</p>

                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-400/20 px-2 py-1 text-[10px] font-semibold text-emerald-200">
                        <TrendingUp className="h-3 w-3" />
                        12.5%
                      </span>
                    </div>
                  </div>

                  <div className="rounded-lg bg-white/10 px-3 py-1.5 text-[10px] text-indigo-100">
                    This month
                  </div>
                </div>

                {/* Bar Chart */}
                <div className="mt-8 flex h-36 items-end justify-between gap-3 border-b border-white/15 px-1">
                  {[
                    { month: 'Jan', height: '45%' },
                    { month: 'Feb', height: '62%' },
                    { month: 'Mar', height: '38%' },
                    { month: 'Apr', height: '73%' },
                    { month: 'May', height: '94%', active: true },
                    { month: 'Jun', height: '58%' },
                  ].map((item) => (
                    <div
                      key={item.month}
                      className="flex h-full flex-1 flex-col items-center justify-end gap-2"
                    >
                      <div
                        className={`w-full max-w-8 rounded-t-lg transition ${
                          item.active
                            ? 'bg-white shadow-lg shadow-white/20'
                            : 'bg-indigo-300/35'
                        }`}
                        style={{ height: item.height }}
                      />

                      <span
                        className={`mb-2 text-[10px] ${
                          item.active
                            ? 'font-bold text-white'
                            : 'text-indigo-200'
                        }`}
                      >
                        {item.month}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Graph Label */}
                <div className="mt-4 flex items-center justify-between text-[10px] text-indigo-200">
                  <span>Spending activity</span>
                  <span className="flex items-center gap-1 text-emerald-200">
                    <ArrowUpRight className="h-3 w-3" />
                    Improving
                  </span>
                </div>
              </div>

              {/* Floating Stats Cards */}
              <div className="absolute -right-5 -top-5 hidden w-36 rounded-xl border border-white/15 bg-white/15 p-3 shadow-xl backdrop-blur-md xl:block">
                <div className="flex items-center gap-2">
                  <div className="rounded-lg bg-emerald-400/20 p-2">
                    <ArrowUpRight className="h-4 w-4 text-emerald-200" />
                  </div>

                  <div>
                    <p className="text-[10px] text-indigo-200">Income</p>
                    <p className="text-sm font-bold">₹45,000</p>
                  </div>
                </div>

                <p className="mt-2 text-[10px] text-emerald-200">+8.2% this month</p>
              </div>

              <div className="absolute -bottom-5 -right-5 hidden w-36 rounded-xl border border-white/15 bg-white/15 p-3 shadow-xl backdrop-blur-md xl:block">
                <div className="flex items-center gap-2">
                  <div className="rounded-lg bg-blue-400/20 p-2">
                    <PieChart className="h-4 w-4 text-blue-200" />
                  </div>

                  <div>
                    <p className="text-[10px] text-indigo-200">Savings</p>
                    <p className="text-sm font-bold">₹20,150</p>
                  </div>
                </div>

                <p className="mt-2 text-[10px] text-blue-200">+15.3% saved</p>
              </div>
            </div>

            {/* Benefits */}
            <div className="mt-auto pt-12">
              <div className="space-y-4">
                <div className="flex items-center gap-3 text-sm text-indigo-50">
                  <CheckCircle2 className="h-5 w-5 text-indigo-200" />
                  <span>Simple and organized expense tracking</span>
                </div>

                <div className="flex items-center gap-3 text-sm text-indigo-50">
                  <CheckCircle2 className="h-5 w-5 text-indigo-200" />
                  <span>Personalized financial dashboard</span>
                </div>

                <div className="flex items-center gap-3 text-sm text-indigo-50">
                  <CheckCircle2 className="h-5 w-5 text-indigo-200" />
                  <span>Make smarter money decisions</span>
                </div>
              </div>

              <div className="mt-8 flex items-center gap-2 text-xs text-indigo-200">
                <ShieldCheck className="h-4 w-4" />
                Your financial data stays safe and secure.
              </div>
            </div>
          </div>
        </section>

        {/* =====================================================
            RIGHT REGISTRATION FORM
        ====================================================== */}
        <section className="flex flex-1 items-center justify-center overflow-y-auto bg-white px-5 py-8 sm:px-10 lg:px-12 xl:px-20">
          <div className="w-full max-w-lg">
            {/* Mobile Brand */}
            <div className="mb-8 flex items-center gap-3 lg:hidden">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 shadow-lg shadow-indigo-500/20">
                <Wallet className="h-6 w-6 text-white" />
              </div>

              <div>
                <h1 className="text-xl font-bold text-slate-900">
                  TrackWise
                </h1>

                <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-slate-400">
                  Smart Finance Management
                </p>
              </div>
            </div>

            {/* Form Header */}
            <div className="mb-8">
              <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50">
                <User className="h-6 w-6 text-indigo-600" />
              </div>

              <h2 className="text-3xl font-extrabold tracking-tight text-slate-900">
                Create your account
              </h2>

              <p className="mt-2 text-sm leading-6 text-slate-500">
                Begin managing your finances with TrackWise.
              </p>
            </div>

            {/* Error Message */}
            <ErrorMessage message={error} />

            {/* Registration Form */}
            <form onSubmit={handleSubmit} className="mt-6 space-y-5">
              {/* Full Name */}
              <div>
                <label
                  htmlFor="name"
                  className="mb-2 block text-sm font-semibold text-slate-700"
                >
                  Full Name
                </label>

                <div className="relative">
                  <User className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

                  <input
                    id="name"
                    type="text"
                    name="name"
                    required
                    autoComplete="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="Enter your full name"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-3.5 pl-11 pr-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 hover:border-slate-300 focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10"
                  />
                </div>
              </div>

              {/* Email */}
              <div>
                <label
                  htmlFor="email"
                  className="mb-2 block text-sm font-semibold text-slate-700"
                >
                  Email Address
                </label>

                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

                  <input
                    id="email"
                    type="email"
                    name="email"
                    required
                    autoComplete="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="you@example.com"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-3.5 pl-11 pr-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 hover:border-slate-300 focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label
                  htmlFor="password"
                  className="mb-2 block text-sm font-semibold text-slate-700"
                >
                  Password
                </label>

                <div className="relative">
                  <LockKeyhole className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    required
                    autoComplete="new-password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="Create a strong password"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-3.5 pl-11 pr-12 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 hover:border-slate-300 focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10"
                  />

                  <button
                    type="button"
                    onClick={() => setShowPassword((previous) => !previous)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                    aria-label={
                      showPassword ? 'Hide password' : 'Show password'
                    }
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}
                  </button>
                </div>

                {/* Password Strength */}
                {formData.password && (
                  <div className="mt-3">
                    <div className="mb-1.5 flex items-center justify-between">
                      <span className="text-xs text-slate-500">
                        Password strength
                      </span>

                      <span
                        className={`text-xs font-semibold ${passwordStrength.textColor}`}
                      >
                        {passwordStrength.label}
                      </span>
                    </div>

                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                      <div
                        className={`h-full rounded-full transition-all duration-300 ${passwordStrength.barColor}`}
                        style={{ width: passwordStrength.width }}
                      />
                    </div>
                  </div>
                )}

                {/* Password Requirements */}
                <div className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2.5 rounded-xl border border-slate-100 bg-slate-50 p-4">
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
                <label
                  htmlFor="confirm"
                  className="mb-2 block text-sm font-semibold text-slate-700"
                >
                  Confirm Password
                </label>

                <div className="relative">
                  <LockKeyhole className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

                  <input
                    id="confirm"
                    type={showConfirmPassword ? 'text' : 'password'}
                    name="confirm"
                    required
                    autoComplete="new-password"
                    value={formData.confirm}
                    onChange={handleChange}
                    placeholder="Re-enter your password"
                    className={`w-full rounded-xl bg-slate-50/50 py-3.5 pl-11 pr-12 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:bg-white focus:ring-4 ${
                      formData.confirm && !passwordsMatch
                        ? 'border border-red-300 focus:border-red-500 focus:ring-red-500/10'
                        : formData.confirm && passwordsMatch
                          ? 'border border-emerald-400 focus:border-emerald-500 focus:ring-emerald-500/10'
                          : 'border border-slate-200 hover:border-slate-300 focus:border-indigo-500 focus:ring-indigo-500/10'
                    }`}
                  />

                  <button
                    type="button"
                    onClick={() =>
                      setShowConfirmPassword((previous) => !previous)
                    }
                    className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                    aria-label={
                      showConfirmPassword
                        ? 'Hide confirm password'
                        : 'Show confirm password'
                    }
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}
                  </button>
                </div>

                {formData.confirm && (
                  <p
                    className={`mt-2 flex items-center gap-1.5 text-xs font-medium ${
                      passwordsMatch ? 'text-emerald-600' : 'text-red-600'
                    }`}
                  >
                    {passwordsMatch ? (
                      <Check className="h-3.5 w-3.5" />
                    ) : (
                      <X className="h-3.5 w-3.5" />
                    )}

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
                className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 py-3.5 text-sm font-bold text-white shadow-lg shadow-indigo-500/20 transition hover:from-indigo-700 hover:to-violet-700 hover:shadow-xl hover:shadow-indigo-500/25 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isLoading ? (
                  'Creating account...'
                ) : (
                  <>
                    Create Account
                    <ArrowUpRight className="h-4 w-4" />
                  </>
                )}
              </button>
            </form>

            {/* Login Link */}
            <p className="mt-7 text-center text-sm text-slate-500">
              Already have an account?{' '}
              <Link
                to="/login"
                className="font-bold text-indigo-600 transition hover:text-indigo-700 hover:underline"
              >
                Sign in
              </Link>
            </p>

            {/* Security Note */}
            <div className="mt-8 flex items-center justify-center gap-2 text-xs text-slate-400">
              <ShieldCheck className="h-4 w-4" />
              <span>Your account information is securely protected.</span>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}