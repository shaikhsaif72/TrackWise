import React, { useEffect, useState } from 'react';
import { financeService } from '../services/financeService';
import StatCard from '../components/StatCard';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';
import { formatCurrency, formatDate } from '../utils/formatters';
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  PiggyBank,
  ArrowUpRight,
  ArrowDownRight,
  ReceiptText,
  Sparkles
} from 'lucide-react';

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [txns, setTxns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError('');

        const [summary, transactions] = await Promise.all([
          financeService.getDashboardSummary(),
          financeService.getTransactions()
        ]);

        setData({
          totalBalance: Number(summary?.totalBalance || 0),
          income: Number(summary?.income || 0),
          expenses: Number(summary?.expenses || 0),
          savings: Number(summary?.savings || 0),
          currency: 'INR',
          isDemo: summary?.isDemo || false
        });

        setTxns(
          Array.isArray(transactions)
            ? transactions.slice(0, 5)
            : []
        );
      } catch (err) {
        console.error(
          'Failed to load dashboard:',
          err.response?.data || err.message || err
        );

        setError('Failed to load dashboard data.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return <ErrorMessage message={error} />;
  }

  if (!data) {
    return null;
  }

  return (
    <div className="min-h-full space-y-7 bg-slate-50/70 p-1 sm:p-2">

      {/* Page Heading */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="mb-2 flex items-center gap-2">
            <span className="rounded-full bg-indigo-100 px-3 py-1 text-xs font-semibold text-indigo-700">
              Financial Overview
            </span>
          </div>

          <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            Welcome back 👋
          </h1>

          <p className="mt-1 text-sm text-slate-500 sm:text-base">
            Here’s a quick overview of your financial activity.
          </p>
        </div>

        <div className="hidden items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-600 shadow-sm sm:flex">
          <Sparkles className="h-4 w-4 text-indigo-500" />
          Stay on top of your finances
        </div>
      </div>

      {/* Demo Alert */}
      {data.isDemo && (
        <div className="flex items-center gap-3 rounded-2xl border border-blue-100 bg-gradient-to-r from-blue-50 to-indigo-50 px-4 py-3 text-sm text-blue-700 shadow-sm">
          <div className="rounded-full bg-blue-100 p-2">
            <Sparkles className="h-4 w-4 text-blue-600" />
          </div>

          <div>
            <p className="font-semibold">Demo data is being displayed</p>
            <p className="text-xs text-blue-600">
              Add your own transactions to view your personal financial summary.
            </p>
          </div>
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">

        <div className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">
                Total Balance
              </p>

              <h2 className="mt-3 text-2xl font-bold tracking-tight text-slate-900">
                {formatCurrency(data.totalBalance, 'INR')}
              </h2>

              <p className="mt-2 text-xs text-slate-400">
                Available balance
              </p>
            </div>

            <div className="rounded-xl bg-indigo-50 p-3 text-indigo-600 transition-colors group-hover:bg-indigo-600 group-hover:text-white">
              <Wallet className="h-5 w-5" />
            </div>
          </div>
        </div>

        <div className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">
                Total Income
              </p>

              <h2 className="mt-3 text-2xl font-bold tracking-tight text-slate-900">
                {formatCurrency(data.income, 'INR')}
              </h2>

              <p className="mt-2 flex items-center gap-1 text-xs font-medium text-emerald-600">
                <ArrowUpRight className="h-3.5 w-3.5" />
                Money received
              </p>
            </div>

            <div className="rounded-xl bg-emerald-50 p-3 text-emerald-600 transition-colors group-hover:bg-emerald-600 group-hover:text-white">
              <TrendingUp className="h-5 w-5" />
            </div>
          </div>
        </div>

        <div className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">
                Total Expenses
              </p>

              <h2 className="mt-3 text-2xl font-bold tracking-tight text-slate-900">
                {formatCurrency(data.expenses, 'INR')}
              </h2>

              <p className="mt-2 flex items-center gap-1 text-xs font-medium text-rose-600">
                <ArrowDownRight className="h-3.5 w-3.5" />
                Money spent
              </p>
            </div>

            <div className="rounded-xl bg-rose-50 p-3 text-rose-600 transition-colors group-hover:bg-rose-600 group-hover:text-white">
              <TrendingDown className="h-5 w-5" />
            </div>
          </div>
        </div>

        <div className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">
                Net Savings
              </p>

              <h2 className="mt-3 text-2xl font-bold tracking-tight text-slate-900">
                {formatCurrency(data.savings, 'INR')}
              </h2>

              <p className="mt-2 flex items-center gap-1 text-xs font-medium text-violet-600">
                <PiggyBank className="h-3.5 w-3.5" />
                Income minus expenses
              </p>
            </div>

            <div className="rounded-xl bg-violet-50 p-3 text-violet-600 transition-colors group-hover:bg-violet-600 group-hover:text-white">
              <PiggyBank className="h-5 w-5" />
            </div>
          </div>
        </div>

      </div>

      {/* Recent Transactions */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

        {/* Section Header */}
        <div className="flex flex-col gap-3 border-b border-slate-100 px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              Recent Transactions
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Your latest income and expenses
            </p>
          </div>

          <div className="flex w-fit items-center gap-2 rounded-lg bg-slate-50 px-3 py-2 text-xs font-medium text-slate-500">
            <ReceiptText className="h-4 w-4" />
            Latest 5 records
          </div>
        </div>

        <div className="divide-y divide-slate-100">
          {txns.length === 0 ? (
            <div className="flex flex-col items-center justify-center px-6 py-14 text-center">
              <div className="mb-4 rounded-full bg-slate-100 p-4">
                <ReceiptText className="h-7 w-7 text-slate-400" />
              </div>

              <h3 className="font-semibold text-slate-700">
                No recent transactions
              </h3>

              <p className="mt-1 max-w-sm text-sm text-slate-500">
                Your latest income and expenses will appear here once you add a transaction.
              </p>
            </div>
          ) : (
            txns.map((txn) => {
              const transactionType = String(
                txn.type || ''
              ).toUpperCase();

              const isIncome = transactionType === 'INCOME';

              return (
                <div
                  key={txn.id}
                  className="group flex items-center justify-between gap-4 px-5 py-4 transition-colors hover:bg-slate-50 sm:px-6"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <div
                      className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${
                        isIncome
                          ? 'bg-emerald-50 text-emerald-600'
                          : 'bg-rose-50 text-rose-600'
                      }`}
                    >
                      {isIncome ? (
                        <ArrowUpRight className="h-5 w-5" />
                      ) : (
                        <ArrowDownRight className="h-5 w-5" />
                      )}
                    </div>

                    <div className="min-w-0">
                      <p className="truncate font-semibold text-slate-800">
                        {txn.description || 'Unknown'}
                      </p>

                      <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                        <span>
                          {txn.transaction_date
                            ? formatDate(txn.transaction_date)
                            : 'No date'}
                        </span>

                        <span className="text-slate-300">•</span>

                        <span
                          className={`font-medium ${
                            isIncome
                              ? 'text-emerald-600'
                              : 'text-rose-600'
                          }`}
                        >
                          {isIncome ? 'Income' : 'Expense'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div
                    className={`shrink-0 text-sm font-bold sm:text-base ${
                      isIncome
                        ? 'text-emerald-600'
                        : 'text-rose-600'
                    }`}
                  >
                    {isIncome ? '+' : '-'}
                    {formatCurrency(txn.amount || 0, 'INR')}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {txns.length > 0 && (
          <div className="border-t border-slate-100 bg-slate-50/60 px-5 py-3 sm:px-6">
            <p className="text-center text-xs text-slate-500">
              Showing your most recent transactions
            </p>
          </div>
        )}
      </div>
    </div>
  );
}