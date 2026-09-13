import React, { useEffect, useState } from 'react';
import { financeService } from '../services/financeService';
import { formatCurrency } from '../utils/formatters';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';
import { Wallet, Plus, X, Trash2 } from 'lucide-react';

export default function Wallets() {
  const [wallets, setWallets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const [form, setForm] = useState({
    name: '',
    balance: ''
  });

  const fetchWallets = async () => {
    try {
      setLoading(true);
      setError('');

      const data = await financeService.getWallets();
      setWallets(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to load wallets:', err);
      setError('Failed to load wallets.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWallets();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm((previous) => ({
      ...previous,
      [name]: value
    }));
  };

  const handleCreateWallet = async (e) => {
    e.preventDefault();

    if (!form.name.trim() || form.balance === '') {
      setError('Please enter wallet name and balance.');
      return;
    }

    if (Number(form.balance) < 0) {
      setError('Balance cannot be negative.');
      return;
    }

    try {
      setSaving(true);
      setError('');

      await financeService.createWallet({
        name: form.name.trim(),
        balance: Number(form.balance),
        currency: 'INR'
      });

      setForm({
        name: '',
        balance: ''
      });

      setShowForm(false);
      await fetchWallets();
    } catch (err) {
      console.error('Failed to create wallet:', err);

      const message =
        err.response?.data?.message ||
        'Failed to create wallet. Please try again.';

      setError(message);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteWallet = async (walletId, walletName) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete "${walletName}"?`
    );

    if (!confirmed) return;

    try {
      setDeletingId(walletId);
      setError('');

      await financeService.deleteWallet(walletId);

      setWallets((previousWallets) =>
        previousWallets.filter((wallet) => wallet.id !== walletId)
      );
    } catch (err) {
      console.error('Failed to delete wallet:', err);

      const message =
        err.response?.data?.message ||
        'Failed to delete wallet. Please try again.';

      setError(message);
    } finally {
      setDeletingId(null);
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-slate-800">
          My Wallets
        </h2>

        <button
          onClick={() => {
            setError('');
            setShowForm(true);
          }}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Wallet
        </button>
      </div>

      <ErrorMessage message={error} />

      {showForm && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <div className="flex justify-between items-center mb-5">
            <h3 className="text-lg font-semibold text-slate-800">
              Create New Wallet
            </h3>

            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="text-gray-500 hover:text-gray-800"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleCreateWallet} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Wallet Name
              </label>

              <input
                type="text"
                name="name"
                value={form.name}
                onChange={handleChange}
                placeholder="e.g. Bank Account"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Opening Balance (₹)
              </label>

              <input
                type="number"
                name="balance"
                value={form.balance}
                onChange={handleChange}
                placeholder="e.g. 10000"
                min="0"
                step="0.01"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
                required
              />

              <p className="text-xs text-gray-500 mt-1">
                All wallets use Indian Rupees (INR).
              </p>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="submit"
                disabled={saving}
                className="bg-blue-600 text-white px-5 py-2 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-60"
              >
                {saving ? 'Creating...' : 'Create Wallet'}
              </button>

              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="border border-gray-300 text-slate-700 px-5 py-2 rounded-lg font-medium hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {wallets.length === 0 && !error ? (
        <div className="bg-white p-8 rounded-xl border border-gray-100 text-center text-gray-500">
          No wallets found. Create one to get started.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {wallets.map((wallet) => (
            <div
              key={wallet.id}
              className="bg-white p-6 rounded-xl shadow-sm border border-gray-100"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
                    <Wallet className="w-5 h-5" />
                  </div>

                  <h3 className="font-semibold text-slate-800 text-lg">
                    {wallet.name}
                  </h3>
                </div>

                <button
                  onClick={() =>
                    handleDeleteWallet(wallet.id, wallet.name)
                  }
                  disabled={deletingId === wallet.id}
                  title="Delete wallet"
                  className="text-red-500 hover:text-red-700 hover:bg-red-50 p-2 rounded-lg transition-colors disabled:opacity-50"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              <p className="text-gray-500 text-sm mb-1">
                Current Balance
              </p>

              <p className="text-2xl font-bold text-slate-800">
                {formatCurrency(wallet.balance, 'INR')}
              </p>

              <p className="text-xs text-gray-500 mt-2">
                Currency: INR
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}