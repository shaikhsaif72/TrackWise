import React, {
  useEffect,
  useMemo,
  useState,
} from 'react';

import { financeService } from '../services/financeService';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';

/* --------------------------------------------------
   CURRENCY FORMATTER
-------------------------------------------------- */

const formatCurrency = (amount) => {
  const numericAmount = Number(amount || 0);

  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
  }).format(numericAmount);
};

/* --------------------------------------------------
   INITIAL FORM
-------------------------------------------------- */

const initialForm = {
  amount: '',
  start_date: '',
  end_date: '',
  category_id: '',
};

/* --------------------------------------------------
   MAIN COMPONENT
-------------------------------------------------- */

function Budgets() {
  const [budgets, setBudgets] = useState([]);
  const [categories, setCategories] = useState([]);
  const [transactions, setTransactions] = useState([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [error, setError] = useState('');

  const [showForm, setShowForm] = useState(false);
  const [editingBudget, setEditingBudget] = useState(null);
  const [form, setForm] = useState(initialForm);

  /* --------------------------------------------------
     CATEGORY HELPERS
  -------------------------------------------------- */

  const getCategoryId = (category) => {
    if (!category) {
      return '';
    }

    return String(
      category.id ??
        category.category_id ??
        category.categoryId ??
        ''
    ).trim();
  };

  const getCategoryName = (category) => {
    if (!category) {
      return '';
    }

    return String(
      category.name ??
        category.category_name ??
        category.categoryName ??
        category.title ??
        ''
    ).trim();
  };

  /* --------------------------------------------------
     DATE HELPER
  -------------------------------------------------- */

  const normalizeDate = (value) => {
    if (!value) {
      return '';
    }

    return String(value).substring(0, 10);
  };

  /* --------------------------------------------------
     TRANSACTION HELPERS
  -------------------------------------------------- */

  const getTransactionAmount = (transaction) => {
    const amount =
      transaction?.amount ??
      transaction?.total_amount ??
      transaction?.transaction_amount ??
      transaction?.value ??
      0;

    const numericAmount = Number(amount);

    if (!Number.isFinite(numericAmount)) {
      return 0;
    }

    return Math.abs(numericAmount);
  };

  const getTransactionDate = (transaction) => {
    return normalizeDate(
      transaction?.transaction_date ??
        transaction?.date ??
        transaction?.transactionDate ??
        transaction?.created_at ??
        transaction?.createdAt
    );
  };

  const getTransactionType = (transaction) => {
    return String(
      transaction?.transaction_type ??
        transaction?.type ??
        transaction?.kind ??
        transaction?.transactionType ??
        ''
    )
      .trim()
      .toLowerCase();
  };

  const getTransactionCategoryId = (transaction) => {
    return String(
      transaction?.category_id ??
        transaction?.categoryId ??
        transaction?.category?.id ??
        transaction?.category?.category_id ??
        ''
    ).trim();
  };

  const getTransactionCategoryName = (transaction) => {
    return String(
      transaction?.category_name ??
        transaction?.categoryName ??
        transaction?.category?.name ??
        transaction?.category?.category_name ??
        ''
    )
      .trim()
      .toLowerCase();
  };

  const isExpenseTransaction = (transaction) => {
    const type = getTransactionType(transaction);

    const incomeTypes = [
      'income',
      'credit',
      'deposit',
      'earning',
      'earnings',
      'received',
      'salary',
    ];

    const expenseTypes = [
      'expense',
      'debit',
      'withdrawal',
      'spend',
      'spent',
    ];

    // Explicit income transaction ko count nahi karna
    if (incomeTypes.includes(type)) {
      return false;
    }

    // Explicit expense transaction ko count karna
    if (expenseTypes.includes(type)) {
      return true;
    }

    /*
      Agar type missing hai, toh amount ke basis par
      negative amount ko expense treat karenge.
    */
    const rawAmount =
      transaction?.amount ??
      transaction?.total_amount ??
      transaction?.transaction_amount ??
      transaction?.value ??
      0;

    return Number(rawAmount) < 0;
  };

  /* --------------------------------------------------
     CATEGORY MAP
  -------------------------------------------------- */

  const categoryMap = useMemo(() => {
    const map = {};

    categories.forEach((category) => {
      const categoryId = getCategoryId(category);
      const categoryName = getCategoryName(category);

      if (categoryId && categoryName) {
        map[categoryId] = categoryName;
      }
    });

    return map;
  }, [categories]);

  /* --------------------------------------------------
     UNIQUE CATEGORIES
  -------------------------------------------------- */

  const uniqueCategories = useMemo(() => {
    const seenNames = new Set();

    return categories.filter((category) => {
      const categoryName = getCategoryName(category)
        .trim()
        .toLowerCase();

      if (!categoryName) {
        return false;
      }

      if (seenNames.has(categoryName)) {
        return false;
      }

      seenNames.add(categoryName);

      return true;
    });
  }, [categories]);

  /* --------------------------------------------------
     LOAD DATA
  -------------------------------------------------- */

  const loadData = async () => {
    try {
      setLoading(true);
      setError('');

      const [
        budgetData,
        categoryData,
        transactionData,
      ] = await Promise.all([
        financeService.getBudgets(),
        financeService.getCategories(),
        financeService.getTransactions(),
      ]);

      setBudgets(
        Array.isArray(budgetData)
          ? budgetData
          : []
      );

      setCategories(
        Array.isArray(categoryData)
          ? categoryData
          : []
      );

      setTransactions(
        Array.isArray(transactionData)
          ? transactionData
          : []
      );
    } catch (err) {
      console.error('BUDGET LOAD ERROR:', err);

      setError(
        err?.response?.data?.error?.message ||
          err?.response?.data?.message ||
          err?.response?.data?.error ||
          'Unable to load budgets. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  /* --------------------------------------------------
     CALCULATE ACTUAL SPENT AMOUNT
  -------------------------------------------------- */

  const calculateSpentAmount = (budget) => {
    const budgetStartDate = normalizeDate(
      budget?.start_date
    );

    const budgetEndDate = normalizeDate(
      budget?.end_date
    );

    const budgetCategoryId = String(
      budget?.category_id || ''
    ).trim();

    const budgetCategoryName = budgetCategoryId
      ? String(
          categoryMap[budgetCategoryId] || ''
        )
          .trim()
          .toLowerCase()
      : '';

    const totalSpent = transactions.reduce(
      (total, transaction) => {
        const transactionDate =
          getTransactionDate(transaction);

        // Date missing hai toh transaction ignore karo
        if (!transactionDate) {
          return total;
        }

        // Budget date range check
        const isWithinDateRange =
          transactionDate >= budgetStartDate &&
          transactionDate <= budgetEndDate;

        if (!isWithinDateRange) {
          return total;
        }

        // Sirf expenses count karo
        if (!isExpenseTransaction(transaction)) {
          return total;
        }

        /*
          Category budget ke liye:
          Transaction category ID ya category name
          budget category se match hona chahiye.
        */
        if (budgetCategoryId) {
          const transactionCategoryId =
            getTransactionCategoryId(transaction);

          const transactionCategoryName =
            getTransactionCategoryName(transaction) ||
            String(
              categoryMap[transactionCategoryId] || ''
            )
              .trim()
              .toLowerCase();

          const matchesById =
            transactionCategoryId === budgetCategoryId;

          const matchesByName =
            budgetCategoryName &&
            transactionCategoryName &&
            transactionCategoryName === budgetCategoryName;

          if (!matchesById && !matchesByName) {
            return total;
          }
        }

        return (
          total + getTransactionAmount(transaction)
        );
      },
      0
    );

    return totalSpent;
  };

  /* --------------------------------------------------
     FORM HANDLERS
  -------------------------------------------------- */

  const handleInputChange = (event) => {
    const { name, value } = event.target;

    setForm((previousForm) => ({
      ...previousForm,
      [name]: value,
    }));
  };

  const openCreateForm = () => {
    setEditingBudget(null);
    setForm(initialForm);
    setError('');
    setShowForm(true);
  };

  const openEditForm = (budget) => {
    setEditingBudget(budget);
    setError('');

    setForm({
      amount: budget?.amount || '',
      start_date: normalizeDate(
        budget?.start_date
      ),
      end_date: normalizeDate(
        budget?.end_date
      ),
      category_id: budget?.category_id || '',
    });

    setShowForm(true);
  };

  const closeForm = () => {
    if (saving) {
      return;
    }

    setShowForm(false);
    setEditingBudget(null);
    setForm(initialForm);
  };

  /* --------------------------------------------------
     CREATE / UPDATE BUDGET
  -------------------------------------------------- */

  const handleSubmit = async (event) => {
    event.preventDefault();

    setError('');

    const amount = Number(form.amount);

    if (
      !form.amount ||
      !Number.isFinite(amount) ||
      amount <= 0
    ) {
      setError(
        'Please enter a valid budget amount greater than 0.'
      );
      return;
    }

    if (!form.start_date || !form.end_date) {
      setError(
        'Please select both start date and end date.'
      );
      return;
    }

    if (form.start_date > form.end_date) {
      setError(
        'Start date cannot be after end date.'
      );
      return;
    }

    try {
      setSaving(true);

      if (editingBudget) {
        const updatePayload = {
          amount: form.amount,
          start_date: form.start_date,
          end_date: form.end_date,
        };

        await financeService.updateBudget(
          editingBudget.id,
          updatePayload
        );
      } else {
        const createPayload = {
          amount: form.amount,
          start_date: form.start_date,
          end_date: form.end_date,
        };

        if (form.category_id) {
          createPayload.category_id =
            form.category_id;
        }

        await financeService.createBudget(
          createPayload
        );
      }

      closeForm();
      await loadData();
    } catch (err) {
      console.error('BUDGET SAVE ERROR:', err);

      setError(
        err?.response?.data?.error?.message ||
          err?.response?.data?.message ||
          err?.response?.data?.error ||
          'Unable to save budget. Please try again.'
      );
    } finally {
      setSaving(false);
    }
  };

  /* --------------------------------------------------
     DELETE BUDGET
  -------------------------------------------------- */

  const handleDelete = async (budgetId) => {
    const shouldDelete = window.confirm(
      'Are you sure you want to delete this budget?'
    );

    if (!shouldDelete) {
      return;
    }

    try {
      setDeletingId(budgetId);
      setError('');

      await financeService.deleteBudget(budgetId);

      await loadData();
    } catch (err) {
      console.error('BUDGET DELETE ERROR:', err);

      setError(
        err?.response?.data?.error?.message ||
          err?.response?.data?.message ||
          err?.response?.data?.error ||
          'Unable to delete budget. Please try again.'
      );
    } finally {
      setDeletingId(null);
    }
  };

  /* --------------------------------------------------
     LOADING STATE
  -------------------------------------------------- */

  if (loading) {
    return (
      <div className="flex min-h-[300px] items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  /* --------------------------------------------------
     PAGE UI
  -------------------------------------------------- */

  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* PAGE HEADER */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Budgets
          </h1>

          <p className="mt-1 text-sm text-gray-500">
            Manage your spending limits and track your expenses.
          </p>
        </div>

        <button
          type="button"
          onClick={openCreateForm}
          className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
        >
          <span className="mr-2 text-lg">+</span>
          Create Budget
        </button>
      </div>

      {/* ERROR MESSAGE */}
      {error && (
        <div>
          <ErrorMessage message={error} />
        </div>
      )}

      {/* EMPTY STATE */}
      {budgets.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-300 bg-white p-10 text-center shadow-sm">
          <h2 className="text-lg font-semibold text-gray-800">
            No budgets created yet
          </h2>

          <p className="mt-2 text-sm text-gray-500">
            Create your first budget to start tracking your spending.
          </p>

          <button
            type="button"
            onClick={openCreateForm}
            className="mt-5 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
          >
            Create Your First Budget
          </button>
        </div>
      ) : (
        /* BUDGET CARDS */
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
          {budgets.map((budget) => {
            const budgetAmount = Number(
              budget?.amount || 0
            );

            const spentAmount =
              calculateSpentAmount(budget);

            const progressPercentage =
              budgetAmount > 0
                ? Math.min(
                    (spentAmount / budgetAmount) * 100,
                    100
                  )
                : 0;

            const categoryId = String(
              budget?.category_id || ''
            );

            const categoryName = categoryId
              ? categoryMap[categoryId] ||
                'Category Budget'
              : 'Overall Budget';

            let progressColor = 'bg-blue-600';

            if (progressPercentage >= 90) {
              progressColor = 'bg-red-600';
            } else if (progressPercentage >= 75) {
              progressColor = 'bg-yellow-500';
            }

            const isOverBudget =
              spentAmount > budgetAmount;

            return (
              <div
                key={budget.id}
                className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm"
              >
                {/* CARD HEADER */}
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h2 className="text-lg font-bold text-gray-900">
                      {categoryName}
                    </h2>

                    <p className="mt-1 text-xs text-gray-500">
                      {normalizeDate(budget.start_date)} to{' '}
                      {normalizeDate(budget.end_date)}
                    </p>
                  </div>

                  <span
                    className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                      budget.is_active === false
                        ? 'bg-gray-100 text-gray-600'
                        : 'bg-green-100 text-green-700'
                    }`}
                  >
                    {budget.is_active === false
                      ? 'Inactive'
                      : 'Active'}
                  </span>
                </div>

                {/* AMOUNT DETAILS */}
                <div className="mt-6 grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-gray-500">
                      Actual Spent
                    </p>

                    <p
                      className={`mt-1 text-xl font-bold ${
                        isOverBudget
                          ? 'text-red-600'
                          : 'text-gray-900'
                      }`}
                    >
                      {formatCurrency(spentAmount)}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-gray-500">
                      Budget Limit
                    </p>

                    <p className="mt-1 text-xl font-bold text-gray-900">
                      {formatCurrency(budgetAmount)}
                    </p>
                  </div>
                </div>

                {/* PROGRESS BAR */}
                <div className="mt-5">
                  <div className="mb-2 flex items-center justify-between text-xs">
                    <span className="font-medium text-gray-600">
                      Progress
                    </span>

                    <span className="font-semibold text-gray-700">
                      {Math.round(progressPercentage)}%
                    </span>
                  </div>

                  <div className="h-3 w-full overflow-hidden rounded-full bg-gray-200">
                    <div
                      className={`h-full rounded-full transition-all ${progressColor}`}
                      style={{
                        width: `${progressPercentage}%`,
                      }}
                    />
                  </div>
                </div>

                {/* OVER BUDGET WARNING */}
                {isOverBudget && (
                  <div className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-700">
                    ⚠️ You are over this budget by{' '}
                    {formatCurrency(
                      spentAmount - budgetAmount
                    )}
                    .
                  </div>
                )}

                {/* ACTION BUTTONS */}
                <div className="mt-6 flex gap-3 border-t border-gray-100 pt-4">
                  <button
                    type="button"
                    onClick={() => openEditForm(budget)}
                    className="flex-1 rounded-lg border border-blue-600 px-3 py-2 text-sm font-semibold text-blue-600 transition hover:bg-blue-50"
                  >
                    Edit
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDelete(budget.id)}
                    disabled={deletingId === budget.id}
                    className="flex-1 rounded-lg border border-red-600 px-3 py-2 text-sm font-semibold text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {deletingId === budget.id
                      ? 'Deleting...'
                      : 'Delete'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* CREATE / EDIT MODAL */}
      {showForm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              closeForm();
            }
          }}
        >
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl">
            {/* MODAL HEADER */}
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">
                {editingBudget
                  ? 'Edit Budget'
                  : 'Create Budget'}
              </h2>

              <button
                type="button"
                onClick={closeForm}
                disabled={saving}
                className="text-2xl leading-none text-gray-400 hover:text-gray-700"
              >
                ×
              </button>
            </div>

            <form
              onSubmit={handleSubmit}
              className="space-y-4"
            >
              {/* AMOUNT */}
              <div>
                <label
                  htmlFor="amount"
                  className="mb-1.5 block text-sm font-medium text-gray-700"
                >
                  Budget Amount
                </label>

                <input
                  id="amount"
                  name="amount"
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.amount}
                  onChange={handleInputChange}
                  placeholder="Enter budget amount"
                  required
                  className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </div>

              {/* CATEGORY */}
              <div>
                <label
                  htmlFor="category_id"
                  className="mb-1.5 block text-sm font-medium text-gray-700"
                >
                  Category
                </label>

                <select
                  id="category_id"
                  name="category_id"
                  value={form.category_id}
                  onChange={handleInputChange}
                  disabled={Boolean(editingBudget)}
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-gray-100"
                >
                  <option value="">
                    Overall Budget
                  </option>

                  {uniqueCategories.map((category) => {
                    const categoryId =
                      getCategoryId(category);

                    const categoryName =
                      getCategoryName(category);

                    return (
                      <option
                        key={categoryId}
                        value={categoryId}
                      >
                        {categoryName}
                      </option>
                    );
                  })}
                </select>

                {editingBudget && (
                  <p className="mt-1 text-xs text-gray-500">
                    Category cannot be changed while editing a budget.
                  </p>
                )}
              </div>

              {/* START DATE */}
              <div>
                <label
                  htmlFor="start_date"
                  className="mb-1.5 block text-sm font-medium text-gray-700"
                >
                  Start Date
                </label>

                <input
                  id="start_date"
                  name="start_date"
                  type="date"
                  value={form.start_date}
                  onChange={handleInputChange}
                  required
                  className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </div>

              {/* END DATE */}
              <div>
                <label
                  htmlFor="end_date"
                  className="mb-1.5 block text-sm font-medium text-gray-700"
                >
                  End Date
                </label>

                <input
                  id="end_date"
                  name="end_date"
                  type="date"
                  value={form.end_date}
                  onChange={handleInputChange}
                  required
                  className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </div>

              {/* FORM BUTTONS */}
              <div className="flex gap-3 pt-3">
                <button
                  type="button"
                  onClick={closeForm}
                  disabled={saving}
                  className="flex-1 rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {saving
                    ? 'Saving...'
                    : editingBudget
                    ? 'Update Budget'
                    : 'Save Budget'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Budgets;