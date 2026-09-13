import React from 'react';

export default function StatCard({ title, value, icon: Icon, trend }) {
  return (
    <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-gray-500">{title}</h3>
        <div className="p-2 bg-primary-50 rounded-lg text-primary-600">
          <Icon className="w-5 h-5" />
        </div>
      </div>
      <p className="text-2xl font-bold text-slate-800">{value}</p>
      {trend && <p className="text-sm text-gray-500 mt-2">{trend}</p>}
    </div>
  );
}