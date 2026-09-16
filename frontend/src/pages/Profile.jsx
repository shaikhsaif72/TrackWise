import React, { useEffect, useState } from 'react';
import {
  User,
  Mail,
  ShieldCheck,
  Pencil,
  Lock,
  X,
  Check,
  AlertCircle,
  Eye,
  EyeOff,
  LogOut,
  CheckCircle2,
} from 'lucide-react';

import { useAuth } from '../context/AuthContext';

const API_BASE_URL = 'http://127.0.0.1:5000/api/v1/auth';

export default function Profile() {
  const { user, token, login, logout } = useAuth();

  const userName = user?.name || 'TrackWise User';
  const userEmail = user?.email || 'Email not available';

  const initials = userName
    .trim()
    .split(/\s+/)
    .map((word) => word[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  const [isEditing, setIsEditing] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  const [name, setName] = useState(userName);
  const [email, setEmail] = useState(userEmail);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    setName(userName);
    setEmail(userEmail);
  }, [userName, userEmail]);

  const clearMessages = () => {
    setMessage('');
    setError('');
  };

  const handleEditClick = () => {
    clearMessages();
    setName(userName);
    setEmail(userEmail);
    setIsEditing(true);
    setIsChangingPassword(false);
  };

  const handlePasswordClick = () => {
    clearMessages();

    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');

    setShowCurrentPassword(false);
    setShowNewPassword(false);
    setShowConfirmPassword(false);

    setIsChangingPassword(true);
    setIsEditing(false);
  };

  const handleCancel = () => {
    clearMessages();
    setIsEditing(false);
    setIsChangingPassword(false);

    setName(userName);
    setEmail(userEmail);

    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
  };

  const handleUpdateProfile = async (event) => {
    event.preventDefault();
    clearMessages();

    const trimmedName = name.trim();
    const trimmedEmail = email.trim();

    if (!trimmedName || trimmedName.length < 2) {
      setError('Name must be at least 2 characters.');
      return;
    }

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!trimmedEmail || !emailPattern.test(trimmedEmail)) {
      setError('Please enter a valid email address.');
      return;
    }

    try {
      setLoading(true);

      const response = await fetch(`${API_BASE_URL}/profile`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: trimmedName,
          email: trimmedEmail,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Unable to update profile.');
      }

      if (data.user) {
        login(token, data.user);
      } else {
        login(token, {
          ...user,
          name: trimmedName,
          email: trimmedEmail,
        });
      }

      setMessage('Profile updated successfully.');
      setIsEditing(false);
    } catch (err) {
      setError(err.message || 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async (event) => {
    event.preventDefault();
    clearMessages();

    if (!currentPassword || !newPassword || !confirmPassword) {
      setError('Please fill in all password fields.');
      return;
    }

    if (newPassword.length < 8) {
      setError('New password must be at least 8 characters.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('New password and confirm password do not match.');
      return;
    }

    if (currentPassword === newPassword) {
      setError('New password must be different from current password.');
      return;
    }

    try {
      setLoading(true);

      const response = await fetch(`${API_BASE_URL}/change-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          current_password: currentPassword,
          new_password: newPassword,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Unable to change password.');
      }

      setMessage('Password changed successfully.');

      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');

      setShowCurrentPassword(false);
      setShowNewPassword(false);
      setShowConfirmPassword(false);

      setIsChangingPassword(false);
    } catch (err) {
      setError(err.message || 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  const getPasswordStrength = () => {
    if (!newPassword) {
      return {
        label: 'Enter a password',
        width: '0%',
        color: 'bg-slate-200',
      };
    }

    let score = 0;

    if (newPassword.length >= 8) score++;
    if (/[A-Z]/.test(newPassword)) score++;
    if (/[a-z]/.test(newPassword)) score++;
    if (/[0-9]/.test(newPassword)) score++;
    if (/[^A-Za-z0-9]/.test(newPassword)) score++;

    if (score <= 2) {
      return {
        label: 'Weak password',
        width: '35%',
        color: 'bg-red-500',
      };
    }

    if (score <= 4) {
      return {
        label: 'Moderate password',
        width: '70%',
        color: 'bg-amber-500',
      };
    }

    return {
      label: 'Strong password',
      width: '100%',
      color: 'bg-emerald-500',
    };
  };

  const passwordStrength = getPasswordStrength();

  const inputClass =
    'w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-violet-500 focus:ring-4 focus:ring-violet-100';

  const primaryButtonClass =
    'inline-flex items-center justify-center gap-2 rounded-xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-60';

  const secondaryButtonClass =
    'inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:border-violet-300 hover:bg-violet-50';

  return (
    <div className="min-h-full bg-slate-50 px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl">
        {/* Page Heading */}
        <div className="mb-7">
          <span className="inline-flex items-center rounded-full bg-violet-100 px-3 py-1 text-xs font-semibold text-violet-700">
            Account Settings
          </span>

          <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-950">
            My Profile
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            Manage your personal information and account security.
          </p>
        </div>

        {/* Main Card */}
        <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-[0_10px_40px_rgba(15,23,42,0.06)]">
          {/* Profile Header */}
          <div className="relative overflow-hidden border-b border-slate-100 px-6 py-7 sm:px-9 sm:py-8">
            <div className="absolute right-0 top-0 h-40 w-40 rounded-full bg-violet-100/60 blur-3xl" />

            <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex items-center gap-4">
                <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-600 text-2xl font-bold text-white shadow-lg shadow-violet-200">
                  {initials}
                </div>

                <div>
                  <h2 className="text-2xl font-bold text-slate-950">
                    {userName}
                  </h2>

                  <p className="mt-1 text-sm text-slate-500">
                    {userEmail}
                  </p>

                  <div className="mt-2 inline-flex items-center gap-2 text-xs font-semibold text-emerald-600">
                    <span className="h-2 w-2 rounded-full bg-emerald-500" />
                    Active Member
                  </div>
                </div>
              </div>

              {!isEditing && !isChangingPassword && (
                <div className="flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={handleEditClick}
                    className={secondaryButtonClass}
                  >
                    <Pencil size={16} />
                    Edit Profile
                  </button>

                  <button
                    type="button"
                    onClick={handlePasswordClick}
                    className={primaryButtonClass}
                  >
                    <Lock size={16} />
                    Change Password
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Alert Messages */}
          {(message || error) && (
            <div className="px-6 pt-6 sm:px-9">
              {message && (
                <div className="flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
                  <CheckCircle2 className="mt-0.5 shrink-0" size={18} />
                  <span>{message}</span>
                </div>
              )}

              {error && (
                <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                  <AlertCircle className="mt-0.5 shrink-0" size={18} />
                  <span>{error}</span>
                </div>
              )}
            </div>
          )}

          {/* Edit Profile Form */}
          {isEditing && (
            <form
              onSubmit={handleUpdateProfile}
              className="border-b border-slate-100 px-6 py-7 sm:px-9"
            >
              <div className="mb-6 flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold text-slate-950">
                    Edit Profile
                  </h3>
                  <p className="mt-1 text-sm text-slate-500">
                    Update your personal account details.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleCancel}
                  className="rounded-xl p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                  aria-label="Close edit profile"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="grid gap-5 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Full Name
                  </label>

                  <div className="relative">
                    <User
                      size={18}
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                    />

                    <input
                      type="text"
                      value={name}
                      onChange={(event) => setName(event.target.value)}
                      className={`${inputClass} pl-11`}
                      placeholder="Enter your full name"
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Email Address
                  </label>

                  <div className="relative">
                    <Mail
                      size={18}
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                    />

                    <input
                      type="email"
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                      className={`${inputClass} pl-11`}
                      placeholder="Enter your email address"
                    />
                  </div>
                </div>
              </div>

              <div className="mt-7 flex flex-wrap gap-3">
                <button
                  type="submit"
                  disabled={loading}
                  className={primaryButtonClass}
                >
                  <Check size={17} />
                  {loading ? 'Saving Changes...' : 'Save Changes'}
                </button>

                <button
                  type="button"
                  onClick={handleCancel}
                  className={secondaryButtonClass}
                >
                  Cancel
                </button>
              </div>
            </form>
          )}

          {/* Change Password Form */}
          {isChangingPassword && (
            <form
              onSubmit={handleChangePassword}
              className="border-b border-slate-100 px-6 py-7 sm:px-9"
            >
              <div className="mb-6 flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold text-slate-950">
                    Change Password
                  </h3>
                  <p className="mt-1 text-sm text-slate-500">
                    Keep your account secure with a strong password.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleCancel}
                  className="rounded-xl p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                  aria-label="Close change password"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="grid gap-5">
                {/* Current Password */}
                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Current Password
                  </label>

                  <div className="relative">
                    <Lock
                      size={18}
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                    />

                    <input
                      type={showCurrentPassword ? 'text' : 'password'}
                      value={currentPassword}
                      onChange={(event) =>
                        setCurrentPassword(event.target.value)
                      }
                      className={`${inputClass} pl-11 pr-12`}
                      placeholder="Enter your current password"
                    />

                    <button
                      type="button"
                      onClick={() =>
                        setShowCurrentPassword(!showCurrentPassword)
                      }
                      className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                      aria-label={
                        showCurrentPassword
                          ? 'Hide current password'
                          : 'Show current password'
                      }
                    >
                      {showCurrentPassword ? (
                        <EyeOff size={18} />
                      ) : (
                        <Eye size={18} />
                      )}
                    </button>
                  </div>
                </div>

                {/* New Password */}
                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    New Password
                  </label>

                  <div className="relative">
                    <Lock
                      size={18}
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                    />

                    <input
                      type={showNewPassword ? 'text' : 'password'}
                      value={newPassword}
                      onChange={(event) => setNewPassword(event.target.value)}
                      className={`${inputClass} pl-11 pr-12`}
                      placeholder="Enter your new password"
                    />

                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                      aria-label={
                        showNewPassword
                          ? 'Hide new password'
                          : 'Show new password'
                      }
                    >
                      {showNewPassword ? (
                        <EyeOff size={18} />
                      ) : (
                        <Eye size={18} />
                      )}
                    </button>
                  </div>

                  {/* Password Strength */}
                  <div className="mt-3">
                    <div className="mb-1.5 flex items-center justify-between">
                      <span className="text-xs text-slate-500">
                        Password strength
                      </span>

                      <span className="text-xs font-semibold text-slate-600">
                        {passwordStrength.label}
                      </span>
                    </div>

                    <div className="h-1.5 overflow-hidden rounded-full bg-slate-100">
                      <div
                        className={`h-full rounded-full transition-all duration-300 ${passwordStrength.color}`}
                        style={{ width: passwordStrength.width }}
                      />
                    </div>
                  </div>
                </div>

                {/* Confirm Password */}
                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Confirm New Password
                  </label>

                  <div className="relative">
                    <ShieldCheck
                      size={18}
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                    />

                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(event) =>
                        setConfirmPassword(event.target.value)
                      }
                      className={`${inputClass} pl-11 pr-12`}
                      placeholder="Confirm your new password"
                    />

                    <button
                      type="button"
                      onClick={() =>
                        setShowConfirmPassword(!showConfirmPassword)
                      }
                      className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                      aria-label={
                        showConfirmPassword
                          ? 'Hide confirm password'
                          : 'Show confirm password'
                      }
                    >
                      {showConfirmPassword ? (
                        <EyeOff size={18} />
                      ) : (
                        <Eye size={18} />
                      )}
                    </button>
                  </div>
                </div>
              </div>

              <div className="mt-5 rounded-xl bg-slate-50 px-4 py-3 text-xs leading-5 text-slate-500">
                Use at least 8 characters. For better security, include
                uppercase and lowercase letters, numbers, and special
                characters.
              </div>

              <div className="mt-7 flex flex-wrap gap-3">
                <button
                  type="submit"
                  disabled={loading}
                  className={primaryButtonClass}
                >
                  <Check size={17} />
                  {loading ? 'Updating Password...' : 'Update Password'}
                </button>

                <button
                  type="button"
                  onClick={handleCancel}
                  className={secondaryButtonClass}
                >
                  Cancel
                </button>
              </div>
            </form>
          )}

          {/* Profile Information */}
          {!isEditing && !isChangingPassword && (
            <div className="px-6 py-8 sm:px-9">
              <div className="mb-6">
                <h3 className="text-xl font-bold text-slate-950">
                  Personal Information
                </h3>

                <p className="mt-1 text-sm text-slate-500">
                  Your account details are shown below.
                </p>
              </div>

              <div className="space-y-4">
                {/* Full Name */}
                <div className="flex items-center gap-4 rounded-2xl border border-slate-100 bg-slate-50/80 px-5 py-4 transition hover:border-violet-100 hover:bg-violet-50/40">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white text-violet-600 shadow-sm ring-1 ring-slate-100">
                    <User size={20} />
                  </div>

                  <div className="min-w-0">
                    <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
                      Full Name
                    </p>

                    <p className="mt-1 truncate text-sm font-semibold text-slate-950">
                      {userName}
                    </p>
                  </div>
                </div>

                {/* Email */}
                <div className="flex items-center gap-4 rounded-2xl border border-slate-100 bg-slate-50/80 px-5 py-4 transition hover:border-violet-100 hover:bg-violet-50/40">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white text-violet-600 shadow-sm ring-1 ring-slate-100">
                    <Mail size={20} />
                  </div>

                  <div className="min-w-0">
                    <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
                      Email Address
                    </p>

                    <p className="mt-1 truncate text-sm font-semibold text-slate-950">
                      {userEmail}
                    </p>
                  </div>
                </div>

                {/* Security */}
                <div className="flex items-center gap-4 rounded-2xl border border-slate-100 bg-slate-50/80 px-5 py-4 transition hover:border-emerald-100 hover:bg-emerald-50/40">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white text-emerald-600 shadow-sm ring-1 ring-slate-100">
                    <ShieldCheck size={20} />
                  </div>

                  <div className="min-w-0">
                    <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
                      Security
                    </p>

                    <div className="mt-1 flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-emerald-500" />

                      <p className="text-sm font-semibold text-slate-950">
                        Password authenticated
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Sign Out Section */}
              <div className="mt-8 flex flex-col gap-5 rounded-2xl border border-red-100 bg-red-50/60 p-5 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <LogOut size={17} className="text-red-600" />

                    <h4 className="text-sm font-bold text-slate-950">
                      Sign out of your account
                    </h4>
                  </div>

                  <p className="mt-1 text-xs text-slate-500">
                    You can sign in again anytime using your credentials.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={logout}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-red-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-red-700"
                >
                  <LogOut size={16} />
                  Sign Out Safely
                </button>
              </div>
            </div>
          )}
        </div>

        <p className="mt-5 text-center text-xs text-slate-400">
          Your personal information is managed securely through TrackWise.
        </p>
      </div>
    </div>
  );
}