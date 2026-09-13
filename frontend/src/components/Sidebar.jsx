import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Wallet, ReceiptText, PieChart, User, CheckSquare, X, Target } from 'lucide-react';
import clsx from 'clsx'; // Simple conditional classes, fallback if not installed: use template literals

const links = [
  { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
  { name: 'Wallets', path: '/wallets', icon: Wallet },
  { name: 'Transactions', path: '/transactions', icon: ReceiptText },
  { name: 'Budgets', path: '/budgets', icon: Target },
  { name: 'Analytics', path: '/analytics', icon: PieChart },
  { name: 'Profile', path: '/profile', icon: User },
];

export default function Sidebar({ isOpen, onClose }) {
  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div className="fixed inset-0 bg-gray-900/50 z-40 lg:hidden" onClick={onClose} />
      )}
      
      {/* Sidebar Content */}
      <aside className={`fixed top-0 left-0 z-50 h-screen w-64 bg-white border-r border-gray-100 transition-transform duration-300 ease-in-out lg:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex items-center justify-between h-16 px-6 border-b border-gray-100">
          <h1 className="text-xl font-bold text-primary-600">TrackWise</h1>
          <button onClick={onClose} className="lg:hidden text-gray-400 hover:text-gray-600">
            <X className="w-6 h-6" />
          </button>
        </div>
        
        <nav className="p-4 space-y-1">
          {links.map((link) => (
            <NavLink
              key={link.name}
              to={link.path}
              onClick={() => onClose()}
              className={({ isActive }) => `flex items-center px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                isActive ? 'bg-primary-50 text-primary-700' : 'text-slate-600 hover:bg-gray-50 hover:text-slate-900'
              }`}
            >
              <link.icon className="w-5 h-5 mr-3" />
              {link.name}
            </NavLink>
          ))}
        </nav>
      </aside>
    </>
  );
}