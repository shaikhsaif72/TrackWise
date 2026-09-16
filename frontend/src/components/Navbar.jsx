import React, { useContext } from 'react';
import { Menu, LogOut, Sparkles } from 'lucide-react';
import { AuthContext } from '../context/AuthContext';
import { useLocation } from 'react-router-dom';

export default function Navbar({ onMenuClick }) {
  const { logout, user } = useContext(AuthContext);
  const location = useLocation();

  const currentPath = location.pathname.split('/')[1];

  const pageName =
    currentPath
      ? currentPath.charAt(0).toUpperCase() + currentPath.slice(1)
      : 'Dashboard';

  const getInitials = () => {
    if (!user) return 'TW';

    const name = user.name || '';

    if (name.trim()) {
      return name
        .trim()
        .split(' ')
        .map((word) => word.charAt(0))
        .join('')
        .slice(0, 2)
        .toUpperCase();
    }

    if (user.email) {
      return user.email.charAt(0).toUpperCase();
    }

    return 'TW';
  };

  const displayName =
    user?.name?.trim() ||
    user?.email?.split('@')[0] ||
    'TrackWise User';

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-slate-200/80 bg-white/95 px-4 backdrop-blur-md sm:px-6 lg:px-8">

      {/* Left Section */}
      <div className="flex min-w-0 items-center gap-3">
        <button
          onClick={onMenuClick}
          className="rounded-xl p-2 text-slate-500 transition-colors hover:bg-slate-100 hover:text-indigo-600 lg:hidden"
          aria-label="Open sidebar"
        >
          <Menu className="h-5 w-5" />
        </button>

        <div className="min-w-0">
          <h2 className="truncate text-lg font-bold tracking-tight text-slate-900 sm:text-xl">
            {pageName}
          </h2>

          <p className="hidden text-xs text-slate-400 sm:block">
            Manage your finances smartly
          </p>
        </div>
      </div>

      {/* Right Section */}
      <div className="flex items-center gap-2 sm:gap-4">

        {/* Small Status Message */}
        <div className="hidden items-center gap-2 rounded-xl bg-indigo-50 px-3 py-2 text-xs font-medium text-indigo-600 xl:flex">
          <Sparkles className="h-4 w-4" />
          Smart financial tracking
        </div>

        {/* User Profile */}
        <div
          className="flex items-center gap-2 rounded-xl px-1.5 py-1.5 sm:gap-3 sm:px-2"
          title={user?.name || user?.email || 'TrackWise User'}
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 text-xs font-bold text-white shadow-sm">
            {getInitials()}
          </div>

          <div className="hidden max-w-28 sm:block">
            <p className="truncate text-sm font-semibold text-slate-800">
              {displayName}
            </p>

            <p className="text-xs text-slate-400">
              Personal account
            </p>
          </div>
        </div>

        {/* Logout Button */}
        <button
          onClick={logout}
          className="rounded-xl p-2.5 text-slate-400 transition-all hover:bg-rose-50 hover:text-rose-600"
          aria-label="Logout"
          title="Logout"
        >
          <LogOut className="h-5 w-5" />
        </button>
      </div>
    </header>
  );
}