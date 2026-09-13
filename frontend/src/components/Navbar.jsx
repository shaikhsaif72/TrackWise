import React, { useContext } from 'react';
import { Menu, Bell, LogOut } from 'lucide-react';
import { AuthContext } from '../context/AuthContext';
import { useLocation } from 'react-router-dom';

export default function Navbar({ onMenuClick }) {
  const { logout } = useContext(AuthContext);
  const location = useLocation();
  const pageName = location.pathname.split('/')[1] || 'Dashboard';

  return (
    <header className="h-16 bg-white border-b border-gray-100 flex items-center justify-between px-4 lg:px-8 sticky top-0 z-30">
      <div className="flex items-center">
        <button onClick={onMenuClick} className="lg:hidden p-2 -ml-2 mr-2 text-gray-500 hover:bg-gray-50 rounded-lg">
          <Menu className="w-6 h-6" />
        </button>
        <h2 className="text-xl font-semibold text-slate-800 capitalize">{pageName}</h2>
      </div>
      
      <div className="flex items-center space-x-4">
        <button className="p-2 text-gray-400 hover:text-primary-600 transition-colors">
          <Bell className="w-5 h-5" />
        </button>
        <div className="h-8 w-8 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-bold text-sm">
          TW
        </div>
        <button onClick={logout} className="p-2 text-gray-400 hover:text-red-600 transition-colors hidden sm:block">
          <LogOut className="w-5 h-5" />
        </button>
      </div>
    </header>
  );
}