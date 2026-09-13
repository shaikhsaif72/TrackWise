import React, { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { User, Mail, Shield } from 'lucide-react';

export default function Profile() {
  const { logout } = useContext(AuthContext);

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h2 className="text-xl font-bold text-slate-800">My Profile</h2>
      
      <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100">
        <div className="flex items-center space-x-6 mb-8">
          <div className="w-20 h-20 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center text-2xl font-bold">
            TW
          </div>
          <div>
            <h3 className="text-xl font-semibold text-slate-800">TrackWise User</h3>
            <p className="text-gray-500">Active Member</p>
          </div>
        </div>

        <div className="space-y-4 mb-8">
          <div className="flex items-center p-4 bg-gray-50 rounded-lg">
            <User className="w-5 h-5 text-gray-400 mr-4" />
            <div>
              <p className="text-sm text-gray-500">Full Name</p>
              <p className="font-medium text-slate-800">Not configured</p>
            </div>
          </div>
          <div className="flex items-center p-4 bg-gray-50 rounded-lg">
            <Mail className="w-5 h-5 text-gray-400 mr-4" />
            <div>
              <p className="text-sm text-gray-500">Email Address</p>
              <p className="font-medium text-slate-800">user@example.com (Pending Auth API Sync)</p>
            </div>
          </div>
          <div className="flex items-center p-4 bg-gray-50 rounded-lg">
            <Shield className="w-5 h-5 text-gray-400 mr-4" />
            <div>
              <p className="text-sm text-gray-500">Security</p>
              <p className="font-medium text-slate-800">Password authenticated</p>
            </div>
          </div>
        </div>

        <button 
          onClick={logout}
          className="w-full sm:w-auto px-6 py-2.5 bg-red-50 text-red-600 font-medium rounded-lg hover:bg-red-100 transition-colors"
        >
          Sign Out Safely
        </button>
      </div>
    </div>
  );
}