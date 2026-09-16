import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Wallet,
  ReceiptText,
  PieChart,
  User,
  X,
  Target,
  ChevronRight
} from 'lucide-react';

const links = [
  {
    name: 'Dashboard',
    path: '/dashboard',
    icon: LayoutDashboard
  },
  {
    name: 'Wallets',
    path: '/wallets',
    icon: Wallet
  },
  {
    name: 'Transactions',
    path: '/transactions',
    icon: ReceiptText
  },
  {
    name: 'Budgets',
    path: '/budgets',
    icon: Target
  },
  {
    name: 'Analytics',
    path: '/analytics',
    icon: PieChart
  },
  {
    name: 'Profile',
    path: '/profile',
    icon: User
  }
];

export default function Sidebar({ isOpen, onClose }) {
  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-950/50 backdrop-blur-sm lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed left-0 top-0 z-50 flex h-screen w-64 flex-col border-r border-slate-200 bg-white transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Logo Section */}
        <div className="flex h-16 items-center justify-between border-b border-slate-100 px-5">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 shadow-sm">
              <Wallet className="h-5 w-5 text-white" />
            </div>

            <div>
              <h1 className="text-lg font-bold tracking-tight text-slate-900">
                Track<span className="text-indigo-600">Wise</span>
              </h1>

              <p className="text-[10px] font-medium uppercase tracking-wider text-slate-400">
                Finance Manager
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 lg:hidden"
            aria-label="Close sidebar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation Label */}
        <div className="px-5 pb-2 pt-6">
          <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400">
            Main Menu
          </p>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 px-3">
          {links.map((link) => {
            const Icon = link.icon;

            return (
              <NavLink
                key={link.name}
                to={link.path}
                onClick={onClose}
                className={({ isActive }) =>
                  `group flex items-center justify-between rounded-xl px-3.5 py-3 text-sm font-semibold transition-all duration-200 ${
                    isActive
                      ? 'bg-indigo-50 text-indigo-700 shadow-sm'
                      : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <div className="flex items-center gap-3">
                      <Icon
                        className={`h-5 w-5 transition-colors ${
                          isActive
                            ? 'text-indigo-600'
                            : 'text-slate-400 group-hover:text-slate-700'
                        }`}
                      />

                      <span>{link.name}</span>
                    </div>

                    <ChevronRight
                      className={`h-4 w-4 transition-all ${
                        isActive
                          ? 'translate-x-0 text-indigo-500 opacity-100'
                          : '-translate-x-1 text-slate-300 opacity-0 group-hover:translate-x-0 group-hover:opacity-100'
                      }`}
                    />
                  </>
                )}
              </NavLink>
            );
          })}
        </nav>


        {/* Footer */}
        <div className="border-t border-slate-100 px-5 py-3">
          <p className="text-center text-[11px] text-slate-400">
            TrackWise • Personal Finance
          </p>
        </div>
      </aside>
    </>
  );
}