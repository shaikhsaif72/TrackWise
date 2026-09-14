import React, { useContext } from 'react';
import { Menu, Bell, LogOut } from 'lucide-react';
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

  return (
    <header className="h-16 bg-white border-b border-gray-100 flex items-center justify-between px-4 lg:px-8 sticky top-0 z-30">
      {/* Left Section */}
      <div className="flex items-center">
        <button
          onClick={onMenuClick}
          className="lg:hidden p-2 -ml-2 mr-2 text-gray-500 hover:bg-gray-50 rounded-lg"
          aria-label="Open sidebar"
        >
          <Menu className="w-6 h-6" />
        </button>

        <h2 className="text-xl font-semibold text-slate-800">
          {pageName}
        </h2>
      </div>

      {/* Right Section */}
      <div className="flex items-center space-x-4">
        <button
          className="p-2 text-gray-400 hover:text-primary-600 transition-colors"
          aria-label="Notifications"
        >
          <Bell className="w-5 h-5" />
        </button>

        <div
          className="h-8 w-8 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-bold text-sm"
          title={user?.name || user?.email || 'TrackWise User'}
        >
          {getInitials()}
        </div>

        <button
          onClick={logout}
          className="p-2 text-gray-400 hover:text-red-600 transition-colors hidden sm:block"
          aria-label="Logout"
          title="Logout"
        >
          <LogOut className="w-5 h-5" />
        </button>
      </div>
    </header>
  );
}