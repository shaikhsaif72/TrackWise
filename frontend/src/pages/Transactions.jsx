import React, { useEffect, useState } from 'react';
import { financeService } from '../services/financeService';
import { formatCurrency, formatDate } from '../utils/formatters';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';

export default function Transactions() {
  const [transactions, setTransactions] = useState([]);
  const [wallets, setWallets] = useState([]);
  const [categories, setCategories] = useState([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState('');
  const [formError, setFormError] = useState('');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);

  const [editingTransaction, setEditingTransaction] = useState(null);
  const [selectedTransaction, setSelectedTransaction] = useState(null);

  const getDefaultDate = () => {
    const now = new Date();
    const offset = now.getTimezoneOffset();
    const localDate = new Date(now.getTime() - offset * 60000);

    return localDate.toISOString().slice(0, 16);
  };

  const [form, setForm] = useState({
    wallet_id: '',
    category_id: '',
    type: 'EXPENSE',
    amount: '',
    transaction_date: getDefaultDate(),
    description: '',
  });

  // ---------------------------------------------
  // CATEGORY HELPERS
  // ---------------------------------------------

  const getCategoryLabel = (category) => {
    return String(
      category?.name ||
        category?.title ||
        category?.category_name ||
        ''
    ).trim();
  };

  const normalizeCategoryKey = (categoryName) => {
    return String(categoryName || '')
      .normalize('NFKC')
      .replace(/[\u200B-\u200D\uFEFF]/g, '')
      .replace(/\s+/g, ' ')
      .trim()
      .toLowerCase();
  };

  const getUniqueCategories = (categoryList) => {
    if (!Array.isArray(categoryList)) {
      return [];
    }

    const uniqueMap = new Map();

    categoryList.forEach((category) => {
      const categoryLabel = getCategoryLabel(category);
      const categoryKey = normalizeCategoryKey(categoryLabel);

      // Ignore categories without a valid name
      if (!categoryKey) {
        return;
      }

      // Keep only the first category with the same normalized name
      if (!uniqueMap.has(categoryKey)) {
        uniqueMap.set(categoryKey, category);
      }
    });

    return Array.from(uniqueMap.values());
  };

  // ---------------------------------------------
  // LOAD DATA
  // ---------------------------------------------

  const loadData = async () => {
    try {
      setLoading(true);
      setError('');

      const [
        transactionData,
        walletData,
        categoryData,
      ] = await Promise.all([
        financeService.getTransactions(),
        financeService.getWallets(),
        financeService.getCategories(),
      ]);

      setTransactions(
        Array.isArray(transactionData)
          ? transactionData
          : []
      );

      setWallets(
        Array.isArray(walletData)
          ? walletData
          : []
      );

      // Strong duplicate removal for categories
      const uniqueCategories = getUniqueCategories(categoryData);

      setCategories(uniqueCategories);
    } catch (err) {
      console.error('LOAD TRANSACTION DATA ERROR:', err);

      setError(
        err?.response?.data?.error?.message ||
          'Failed to load transaction data.'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // ---------------------------------------------
  // INPUT CHANGE
  // ---------------------------------------------

  const handleChange = (event) => {
    const { name, value } = event.target;

    setForm((previousForm) => ({
      ...previousForm,
      [name]: value,
    }));
  };

  // ---------------------------------------------
  // OPEN ADD MODAL
  // ---------------------------------------------

  const handleOpenAddModal = () => {
    setEditingTransaction(null);
    setFormError('');

    setForm({
      wallet_id: wallets.length > 0 ? wallets[0].id : '',
      category_id: categories.length > 0 ? categories[0].id : '',
      type: 'EXPENSE',
      amount: '',
      transaction_date: getDefaultDate(),
      description: '',
    });

    setIsModalOpen(true);
  };

  // ---------------------------------------------
  // OPEN EDIT MODAL
  // ---------------------------------------------

  const handleOpenEditModal = (transaction) => {
    setEditingTransaction(transaction);
    setFormError('');

    let formattedDate = getDefaultDate();

    if (transaction.transaction_date) {
      const transactionDate = new Date(
        transaction.transaction_date
      );

      if (!Number.isNaN(transactionDate.getTime())) {
        const offset = transactionDate.getTimezoneOffset();

        const localDate = new Date(
          transactionDate.getTime() - offset * 60000
        );

        formattedDate = localDate.toISOString().slice(0, 16);
      }
    }

    setForm({
      wallet_id: transaction.wallet_id || '',
      category_id: transaction.category_id || '',
      type: transaction.type || 'EXPENSE',
      amount: transaction.amount || '',
      transaction_date: formattedDate,
      description: transaction.description || '',
    });

    setIsModalOpen(true);
  };

  // ---------------------------------------------
  // CLOSE ADD/EDIT MODAL
  // ---------------------------------------------

  const handleCloseModal = () => {
    if (!saving) {
      setIsModalOpen(false);
      setEditingTransaction(null);
      setFormError('');
    }
  };

  // ---------------------------------------------
  // CREATE OR UPDATE TRANSACTION
  // ---------------------------------------------

  const handleSubmit = async (event) => {
    event.preventDefault();
    setFormError('');

    if (!form.wallet_id) {
      setFormError('Please select a wallet.');
      return;
    }

    if (!form.category_id) {
      setFormError('Please select a category.');
      return;
    }

    if (!form.amount || Number(form.amount) <= 0) {
      setFormError('Please enter a valid amount greater than zero.');
      return;
    }

    if (!form.transaction_date) {
      setFormError('Please select a transaction date.');
      return;
    }

    try {
      setSaving(true);

      const transactionPayload = {
        wallet_id: form.wallet_id,
        category_id: form.category_id,
        type: form.type,
        amount: form.amount,
        transaction_date: new Date(
          form.transaction_date
        ).toISOString(),
        description: form.description.trim() || null,
      };

      if (editingTransaction) {
        await financeService.updateTransaction(
          editingTransaction.id,
          transactionPayload
        );
      } else {
        await financeService.createTransaction(
          transactionPayload
        );
      }

      setIsModalOpen(false);
      setEditingTransaction(null);
      setFormError('');

      await loadData();
    } catch (err) {
      console.error('SAVE TRANSACTION ERROR:', err);

      setFormError(
        err?.response?.data?.error?.message ||
          'Failed to save transaction.'
      );
    } finally {
      setSaving(false);
    }
  };

  // ---------------------------------------------
  // DELETE TRANSACTION
  // ---------------------------------------------

  const handleDelete = async (transactionId) => {
    const confirmed = window.confirm(
      'Are you sure you want to delete this transaction?'
    );

    if (!confirmed) {
      return;
    }

    try {
      setError('');

      await financeService.deleteTransaction(transactionId);
      await loadData();
    } catch (err) {
      console.error('DELETE TRANSACTION ERROR:', err);

      setError(
        err?.response?.data?.error?.message ||
          'Failed to delete transaction.'
      );
    }
  };

  // ---------------------------------------------
  // VIEW TRANSACTION DETAILS
  // ---------------------------------------------

  const handleViewDetails = (transaction) => {
    setSelectedTransaction(transaction);
    setIsViewModalOpen(true);
  };

  const handleCloseViewModal = () => {
    setSelectedTransaction(null);
    setIsViewModalOpen(false);
  };

  // ---------------------------------------------
  // GET CATEGORY NAME
  // ---------------------------------------------

  const getCategoryName = (categoryId) => {
    const category = categories.find(
      (item) => String(item.id) === String(categoryId)
    );

    return getCategoryLabel(category) || '-';
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="space-y-6">
      {/* PAGE HEADER */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-slate-800">
          Transactions
        </h2>

        <button
          type="button"
          onClick={handleOpenAddModal}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
        >
          + Add Transaction
        </button>
      </div>

      <ErrorMessage message={error} />

      {/* TRANSACTION TABLE */}
      <div className="overflow-hidden overflow-x-auto rounded-xl border border-gray-100 bg-white shadow-sm">
        <table className="w-full border-collapse text-left">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50 text-sm text-gray-500">
              <th className="px-6 py-3 font-medium">
                Date
              </th>

              <th className="px-6 py-3 font-medium">
                Description
              </th>

              <th className="px-6 py-3 font-medium">
                Category
              </th>

              <th className="px-6 py-3 font-medium">
                Type
              </th>

              <th className="px-6 py-3 font-medium">
                Amount
              </th>

              <th className="px-6 py-3 font-medium">
                Action
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-gray-100">
            {transactions.length === 0 ? (
              <tr>
                <td
                  colSpan="6"
                  className="px-6 py-10 text-center text-gray-500"
                >
                  No transactions available.
                </td>
              </tr>
            ) : (
              transactions.map((transaction) => {
                const isIncome =
                  transaction.type === 'INCOME';

                return (
                  <tr
                    key={transaction.id}
                    className="transition hover:bg-gray-50"
                  >
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {formatDate(
                        transaction.transaction_date
                      )}
                    </td>

                    <td className="px-6 py-4 font-medium text-slate-800">
                      {transaction.description || '-'}
                    </td>

                    <td className="px-6 py-4 text-sm text-gray-600">
                      {transaction.category_name ||
                        getCategoryName(transaction.category_id)}
                    </td>

                    <td className="px-6 py-4">
                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                          isIncome
                            ? 'bg-emerald-50 text-emerald-700'
                            : 'bg-red-50 text-red-700'
                        }`}
                      >
                        {transaction.type}
                      </span>
                    </td>

                    <td
                      className={`px-6 py-4 font-semibold ${
                        isIncome
                          ? 'text-emerald-600'
                          : 'text-red-600'
                      }`}
                    >
                      {isIncome ? '+' : '-'}
                      {formatCurrency(transaction.amount)}
                    </td>

                    <td className="px-6 py-4">
                      <div className="flex flex-wrap items-center gap-3">
                        {/* EDIT */}
                        <button
                          type="button"
                          onClick={() =>
                            handleOpenEditModal(transaction)
                          }
                          className="text-sm font-medium text-blue-600 hover:text-blue-800"
                        >
                          Edit
                        </button>

                        {/* DELETE */}
                        <button
                          type="button"
                          onClick={() =>
                            handleDelete(transaction.id)
                          }
                          className="text-sm font-medium text-red-600 hover:text-red-800"
                        >
                          Delete
                        </button>

                        {/* VIEW DETAILS */}
                        <button
                          type="button"
                          onClick={() =>
                            handleViewDetails(transaction)
                          }
                          className="text-sm font-medium text-gray-600 hover:text-gray-900"
                        >
                          View Details
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* ADD / EDIT TRANSACTION MODAL */}
      {isModalOpen && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 px-4"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              handleCloseModal();
            }
          }}
        >
          <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl">
            {/* MODAL HEADER */}
            <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
              <div>
                <h3 className="text-lg font-bold text-slate-800">
                  {editingTransaction
                    ? 'Edit Transaction'
                    : 'Add Transaction'}
                </h3>

                <p className="mt-1 text-xs text-gray-500">
                  Enter the details of your financial activity.
                </p>
              </div>

              <button
                type="button"
                onClick={handleCloseModal}
                disabled={saving}
                className="text-2xl leading-none text-gray-400 hover:text-gray-700 disabled:opacity-50"
              >
                ×
              </button>
            </div>

            {/* FORM */}
            <form
              onSubmit={handleSubmit}
              className="space-y-4 p-6"
            >
              {formError && (
                <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {formError}
                </div>
              )}

              {/* TYPE */}
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Transaction Type
                </label>

                <select
                  name="type"
                  value={form.type}
                  onChange={handleChange}
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                >
                  <option value="EXPENSE">
                    Expense
                  </option>

                  <option value="INCOME">
                    Income
                  </option>
                </select>
              </div>

              {/* WALLET */}
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Wallet
                </label>

                <select
                  name="wallet_id"
                  value={form.wallet_id}
                  onChange={handleChange}
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                >
                  <option value="">
                    Select Wallet
                  </option>

                  {wallets.map((wallet) => (
                    <option
                      key={wallet.id}
                      value={wallet.id}
                    >
                      {wallet.name} - ₹{wallet.balance}
                    </option>
                  ))}
                </select>

                {wallets.length === 0 && (
                  <p className="mt-1 text-xs text-red-600">
                    No wallet found. Please create a wallet first.
                  </p>
                )}
              </div>

              {/* CATEGORY */}
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Category
                </label>

                <select
                  name="category_id"
                  value={form.category_id}
                  onChange={handleChange}
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                >
                  <option value="">
                    Select Category
                  </option>

                  {/* Extra safety: remove duplicates during rendering too */}
                  {getUniqueCategories(categories).map((category) => (
                    <option
                      key={category.id}
                      value={category.id}
                    >
                      {getCategoryLabel(category)}
                    </option>
                  ))}
                </select>

                {categories.length === 0 && (
                  <p className="mt-1 text-xs text-red-600">
                    No category found. Please create a category first.
                  </p>
                )}
              </div>

              {/* AMOUNT */}
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Amount
                </label>

                <input
                  type="number"
                  name="amount"
                  value={form.amount}
                  onChange={handleChange}
                  placeholder="Enter amount"
                  min="0.01"
                  step="0.01"
                  required
                  className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </div>

              {/* DATE */}
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Date and Time
                </label>

                <input
                  type="datetime-local"
                  name="transaction_date"
                  value={form.transaction_date}
                  onChange={handleChange}
                  required
                  className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </div>

              {/* DESCRIPTION */}
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Description
                </label>

                <input
                  type="text"
                  name="description"
                  value={form.description}
                  onChange={handleChange}
                  placeholder="e.g. Grocery shopping"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </div>

              {/* BUTTONS */}
              <div className="flex justify-end gap-3 border-t border-gray-100 pt-4">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  disabled={saving}
                  className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={
                    saving ||
                    wallets.length === 0 ||
                    categories.length === 0
                  }
                  className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {saving
                    ? 'Saving...'
                    : editingTransaction
                    ? 'Update Transaction'
                    : 'Save Transaction'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* VIEW DETAILS MODAL */}
      {isViewModalOpen && selectedTransaction && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 px-4"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              handleCloseViewModal();
            }
          }}
        >
          <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl">
            {/* HEADER */}
            <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
              <h3 className="text-lg font-bold text-slate-800">
                Transaction Details
              </h3>

              <button
                type="button"
                onClick={handleCloseViewModal}
                className="text-2xl leading-none text-gray-400 hover:text-gray-700"
              >
                ×
              </button>
            </div>

            {/* DETAILS */}
            <div className="space-y-4 p-6">
              {/* DESCRIPTION */}
              <div className="flex justify-between gap-4">
                <span className="text-sm text-gray-500">
                  Description
                </span>

                <span className="text-right text-sm font-semibold text-slate-800">
                  {selectedTransaction.description || '-'}
                </span>
              </div>

              {/* CATEGORY */}
              <div className="flex justify-between gap-4">
                <span className="text-sm text-gray-500">
                  Category
                </span>

                <span className="text-right text-sm font-semibold text-slate-800">
                  {selectedTransaction.category_name ||
                    getCategoryName(selectedTransaction.category_id)}
                </span>
              </div>

              {/* TYPE */}
              <div className="flex justify-between gap-4">
                <span className="text-sm text-gray-500">
                  Type
                </span>

                <span
                  className={`text-sm font-semibold ${
                    selectedTransaction.type === 'INCOME'
                      ? 'text-emerald-600'
                      : 'text-red-600'
                  }`}
                >
                  {selectedTransaction.type}
                </span>
              </div>

              {/* AMOUNT */}
              <div className="flex justify-between gap-4">
                <span className="text-sm text-gray-500">
                  Amount
                </span>

                <span className="text-sm font-bold text-slate-800">
                  {formatCurrency(
                    selectedTransaction.amount
                  )}
                </span>
              </div>

              {/* DATE */}
              <div className="flex justify-between gap-4">
                <span className="text-sm text-gray-500">
                  Date
                </span>

                <span className="text-right text-sm font-semibold text-slate-800">
                  {formatDate(
                    selectedTransaction.transaction_date
                  )}
                </span>
              </div>

              {/* WALLET ID */}
              <div className="flex justify-between gap-4">
                <span className="text-sm text-gray-500">
                  Wallet ID
                </span>

                <span className="max-w-[220px] break-all text-right text-xs text-gray-700">
                  {selectedTransaction.wallet_id || '-'}
                </span>
              </div>

              {/* CLOSE BUTTON */}
              <div className="flex justify-end border-t border-gray-100 pt-4">
                <button
                  type="button"
                  onClick={handleCloseViewModal}
                  className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}