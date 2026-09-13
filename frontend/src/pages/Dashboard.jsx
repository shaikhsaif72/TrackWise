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
  PiggyBank
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
    <div className="space-y-6">
      {data.isDemo && (
        <div className="bg-blue-50 text-blue-700 p-3 rounded-lg text-sm border border-blue-100">
          Displaying demonstration data.
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Balance"
          value={formatCurrency(data.totalBalance, 'INR')}
          icon={Wallet}
        />

        <StatCard
          title="Total Income"
          value={formatCurrency(data.income, 'INR')}
          icon={TrendingUp}
        />

        <StatCard
          title="Total Expenses"
          value={formatCurrency(data.expenses, 'INR')}
          icon={TrendingDown}
        />

        <StatCard
          title="Net Savings"
          value={formatCurrency(data.savings, 'INR')}
          icon={PiggyBank}
        />
      </div>

      {/* Recent Transactions */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-slate-800">
            Recent Transactions
          </h2>
        </div>

        <div className="divide-y divide-gray-100">
          {txns.length === 0 ? (
            <p className="p-6 text-gray-500 text-center">
              No recent transactions found.
            </p>
          ) : (
            txns.map((txn) => {
              const transactionType = String(
                txn.type || ''
              ).toUpperCase();

              return (
                <div
                  key={txn.id}
                  className="px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
                >
                  <div>
                    <p className="font-medium text-slate-800">
                      {txn.description || 'Unknown'}
                    </p>

                    <p className="text-sm text-gray-500">
                      {txn.transaction_date
                        ? formatDate(txn.transaction_date)
                        : 'No date'}
                    </p>
                  </div>

                  <div
                    className={`font-semibold ${
                      transactionType === 'INCOME'
                        ? 'text-emerald-600'
                        : 'text-slate-800'
                    }`}
                  >
                    {transactionType === 'INCOME' ? '+' : '-'}
                    {formatCurrency(txn.amount || 0, 'INR')}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}