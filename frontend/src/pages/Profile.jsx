import React, { useState } from 'react';
import {
  User,
  Mail,
  Shield,
  Pencil,
  Lock,
  X,
  Check,
  AlertCircle,
} from 'lucide-react';

import { useAuth } from '../context/AuthContext';

const API_BASE_URL = 'http://127.0.0.1:5000/api/v1/auth';

export default function Profile() {
  const { user, token, login, logout } = useAuth();

  const userName = user?.name || 'TrackWise User';
  const userEmail = user?.email || 'Email not available';

  const initials = userName
    .split(' ')
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

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

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
    setIsChangingPassword(true);
    setIsEditing(false);
  };

  const handleCancel = () => {
    clearMessages();
    setIsEditing(false);
    setIsChangingPassword(false);
  };

  const handleUpdateProfile = async (event) => {
    event.preventDefault();
    clearMessages();

    if (!name.trim() || name.trim().length < 2) {
      setError('Name must be at least 2 characters.');
      return;
    }

    if (!email.trim()) {
      setError('Email cannot be empty.');
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
          name: name.trim(),
          email: email.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Unable to update profile.');
      }

      // Update user data in AuthContext and localStorage
      login(token, data.user);

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

    if (newPassword !== confirmPassword) {
      setError('New password and confirm password do not match.');
      return;
    }

    if (newPassword.length < 8) {
      setError('New password must be at least 8 characters.');
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
      setIsChangingPassword(false);
    } catch (err) {
      setError(err.message || 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-full bg-slate-50 px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-3xl">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-slate-900">My Profile</h1>
          <p className="mt-1 text-sm text-slate-500">
            Manage your personal information and account security.
          </p>
        </div>

        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          {/* Profile Header */}
          <div className="flex flex-col gap-5 border-b border-slate-100 px-6 py-7 sm:flex-row sm:items-center sm:justify-between sm:px-8">
            <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 text-xl font-bold text-slate-900">
                {initials}
              </div>

              <div>
                <h2 className="text-xl font-semibold text-slate-900">
                  {userName}
                </h2>
                <p className="text-sm text-slate-500">Active Member</p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              {!isEditing && !isChangingPassword && (
                <>
                  <button
                    type="button"
                    onClick={handleEditClick}
                    className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                  >
                    <Pencil size={16} />
                    Edit Profile
                  </button>

                  <button
                    type="button"
                    onClick={handlePasswordClick}
                    className="inline-flex items-center justify-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800"
                  >
                    <Lock size={16} />
                    Change Password
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Messages */}
          {(message || error) && (
            <div className="px-6 pt-5 sm:px-8">
              {message && (
                <div className="flex items-center gap-2 rounded-lg bg-green-50 px-4 py-3 text-sm text-green-700">
                  <Check size={18} />
                  {message}
                </div>
              )}

              {error && (
                <div className="flex items-center gap-2 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
                  <AlertCircle size={18} />
                  {error}
                </div>
              )}
            </div>
          )}

          {/* Edit Profile Form */}
          {isEditing && (
            <form
              onSubmit={handleUpdateProfile}
              className="border-b border-slate-100 px-6 py-6 sm:px-8"
            >
              <div className="mb-5 flex items-center justify-between">
                <h3 className="text-lg font-semibold text-slate-900">
                  Edit Profile
                </h3>

                <button
                  type="button"
                  onClick={handleCancel}
                  className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    className="w-full rounded-lg border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-slate-900 focus:ring-1 focus:ring-slate-900"
                    placeholder="Enter your name"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    className="w-full rounded-lg border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-slate-900 focus:ring-1 focus:ring-slate-900"
                    placeholder="Enter your email"
                  />
                </div>
              </div>

              <div className="mt-6 flex flex-wrap gap-3">
                <button
                  type="submit"
                  disabled={loading}
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-slate-900 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <Check size={16} />
                  {loading ? 'Saving...' : 'Save Changes'}
                </button>

                <button
                  type="button"
                  onClick={handleCancel}
                  className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-300 px-5 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
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
              className="border-b border-slate-100 px-6 py-6 sm:px-8"
            >
              <div className="mb-5 flex items-center justify-between">
                <h3 className="text-lg font-semibold text-slate-900">
                  Change Password
                </h3>

                <button
                  type="button"
                  onClick={handleCancel}
                  className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="grid gap-5">
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Current Password
                  </label>
                  <input
                    type="password"
                    value={currentPassword}
                    onChange={(event) =>
                      setCurrentPassword(event.target.value)
                    }
                    className="w-full rounded-lg border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-slate-900 focus:ring-1 focus:ring-slate-900"
                    placeholder="Enter current password"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    New Password
                  </label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(event) => setNewPassword(event.target.value)}
                    className="w-full rounded-lg border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-slate-900 focus:ring-1 focus:ring-slate-900"
                    placeholder="Enter new password"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Confirm New Password
                  </label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(event) =>
                      setConfirmPassword(event.target.value)
                    }
                    className="w-full rounded-lg border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-slate-900 focus:ring-1 focus:ring-slate-900"
                    placeholder="Confirm new password"
                  />
                </div>
              </div>

              <p className="mt-4 text-xs text-slate-500">
                Password must contain at least 8 characters, one uppercase
                letter, one lowercase letter, one number, and one special
                character.
              </p>

              <div className="mt-6 flex flex-wrap gap-3">
                <button
                  type="submit"
                  disabled={loading}
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-slate-900 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <Check size={16} />
                  {loading ? 'Updating...' : 'Update Password'}
                </button>

                <button
                  type="button"
                  onClick={handleCancel}
                  className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-300 px-5 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}

          {/* Profile Information */}
          {!isEditing && !isChangingPassword && (
            <div className="space-y-4 px-6 py-7 sm:px-8">
              <div className="flex items-center gap-4 rounded-xl bg-slate-50 px-5 py-4">
                <User className="text-slate-400" size={24} />

                <div>
                  <p className="text-sm text-slate-500">Full Name</p>
                  <p className="font-semibold text-slate-900">{userName}</p>
                </div>
              </div>

              <div className="flex items-center gap-4 rounded-xl bg-slate-50 px-5 py-4">
                <Mail className="text-slate-400" size={24} />

                <div>
                  <p className="text-sm text-slate-500">Email Address</p>
                  <p className="font-semibold text-slate-900">{userEmail}</p>
                </div>
              </div>

              <div className="flex items-center gap-4 rounded-xl bg-slate-50 px-5 py-4">
                <Shield className="text-slate-400" size={24} />

                <div>
                  <p className="text-sm text-slate-500">Security</p>
                  <p className="font-semibold text-slate-900">
                    Password authenticated
                  </p>
                </div>
              </div>

              <div className="pt-4">
                <button
                  type="button"
                  onClick={logout}
                  className="rounded-lg bg-red-50 px-5 py-3 text-sm font-semibold text-red-600 transition hover:bg-red-100"
                >
                  Sign Out Safely
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}