import React from 'react';
import { AlertCircle } from 'lucide-react';

export default function ErrorMessage({ message }) {
  if (!message) return null;
  return (
    <div className="bg-red-50 text-red-600 p-4 rounded-lg flex items-center mb-6 border border-red-100">
      <AlertCircle className="w-5 h-5 mr-3 flex-shrink-0" />
      <p className="text-sm">{message}</p>
    </div>
  );
}