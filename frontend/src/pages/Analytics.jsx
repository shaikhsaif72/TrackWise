import React, {
  useEffect,
  useMemo,
  useState
} from 'react';

import { financeService } from '../services/financeService';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';

const COLORS = [
  '#3b82f6',
  '#10b981',
  '#f59e0b',
  '#ef4444',
  '#8b5cf6',
  '#ec4899',
  '#06b6d4',
  '#84cc16'
];

// ==================================================
// CURRENCY FORMATTER
// ==================================================

const formatCurrency = (amount) => {
  const numericAmount = Number(amount || 0);

  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2
  }).format(numericAmount);
};

// ==================================================
// NUMBER HELPER
// ==================================================

const toNumber = (value) => {
  const number = Number(value || 0);

  return Number.isFinite(number)
    ? number
    : 0;
};

// ==================================================
// NORMALIZE MONTHLY DATA
// ==================================================

const normalizeMonthlyData = (monthlyData) => {
  if (!Array.isArray(monthlyData)) {
    return [];
  }

  return monthlyData.map((item, index) => ({
    name:
      item?.name ||
      item?.month ||
      item?.label ||
      item?.period ||
      `Month ${index + 1}`,

    income: toNumber(
      item?.income ??
        item?.total_income ??
        item?.totalIncome ??
        item?.credit ??
        0
    ),

    expense: toNumber(
      item?.expense ??
        item?.expenses ??
        item?.total_expense ??
        item?.total_expenses ??
        item?.totalExpense ??
        item?.debit ??
        0
    )
  }));
};

// ==================================================
// NORMALIZE CATEGORY DATA
// ==================================================

const normalizeCategoryData = (categoryData) => {
  if (!Array.isArray(categoryData)) {
    return [];
  }

  return categoryData
    .map((item, index) => ({
      name:
        item?.name ||
        item?.category_name ||
        item?.categoryName ||
        item?.label ||
        `Category ${index + 1}`,

      value: toNumber(
        item?.value ??
          item?.amount ??
          item?.total ??
          item?.expense ??
          item?.total_expense ??
          item?.totalExpense ??
          0
      )
    }))
    .filter((item) => item.value > 0);
};

// ==================================================
// MAIN COMPONENT
// ==================================================

export default function Analytics() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const [reportLoading, setReportLoading] = useState(false);
  const [reportError, setReportError] = useState('');
  const [reportSuccess, setReportSuccess] = useState('');

  // ==================================================
  // LOAD ANALYTICS
  // ==================================================

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      setError('');

      const analyticsData =
        await financeService.getAnalytics();

      setData(analyticsData || {});
    } catch (err) {
      console.error(
        'ANALYTICS LOAD ERROR:',
        err
      );

      setError(
        err?.response?.data?.message ||
          err?.response?.data?.error?.message ||
          err?.response?.data?.error ||
          'Failed to load analytics.'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAnalytics();
  }, []);

  // ==================================================
  // NORMALIZED DATA
  // ==================================================

  const monthlyData = useMemo(() => {
    return normalizeMonthlyData(data?.monthly);
  }, [data]);

  const categoryData = useMemo(() => {
    return normalizeCategoryData(data?.categories);
  }, [data]);

  // ==================================================
  // CALCULATE SUMMARY
  // ==================================================

  const summary = useMemo(() => {
    const directIncome =
      data?.total_income ??
      data?.totalIncome ??
      data?.summary?.total_income ??
      data?.summary?.totalIncome;

    const directExpense =
      data?.total_expense ??
      data?.total_expenses ??
      data?.totalExpense ??
      data?.totalExpenses ??
      data?.summary?.total_expense ??
      data?.summary?.total_expenses ??
      data?.summary?.totalExpense ??
      data?.summary?.totalExpenses;

    const calculatedIncome = monthlyData.reduce(
      (total, item) => total + item.income,
      0
    );

    const calculatedExpense = monthlyData.reduce(
      (total, item) => total + item.expense,
      0
    );

    const categoryExpense = categoryData.reduce(
      (total, item) => total + item.value,
      0
    );

    const totalIncome =
      directIncome !== undefined
        ? toNumber(directIncome)
        : calculatedIncome;

    const totalExpense =
      directExpense !== undefined
        ? toNumber(directExpense)
        : calculatedExpense || categoryExpense;

    const netBalance = totalIncome - totalExpense;

    const savingsRate =
      totalIncome > 0
        ? ((netBalance / totalIncome) * 100).toFixed(1)
        : 0;

    return {
      totalIncome,
      totalExpense,
      netBalance,
      savingsRate
    };
  }, [
    data,
    monthlyData,
    categoryData
  ]);

  // ==================================================
  // DOWNLOAD PDF REPORT
  // ==================================================

  const handleDownloadReport = async () => {
    setReportError('');
    setReportSuccess('');

    if (!startDate || !endDate) {
      setReportError(
        'Please select both start date and end date.'
      );
      return;
    }

    if (startDate > endDate) {
      setReportError(
        'Start date cannot be greater than end date.'
      );
      return;
    }

    try {
      setReportLoading(true);

      const pdfBlob =
        await financeService.downloadReportPdf(
          startDate,
          endDate
        );

      const blobUrl = window.URL.createObjectURL(
        pdfBlob
      );

      const downloadLink =
        document.createElement('a');

      downloadLink.href = blobUrl;
      downloadLink.download =
        `trackwise_report_${startDate}_${endDate}.pdf`;

      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);

      window.URL.revokeObjectURL(blobUrl);

      setReportSuccess(
        'Financial PDF report downloaded successfully.'
      );
    } catch (err) {
      console.error(
        'PDF REPORT ERROR:',
        err
      );

      setReportError(
        'Unable to generate PDF report. Please try again.'
      );
    } finally {
      setReportLoading(false);
    }
  };

  // ==================================================
  // LOADING STATE
  // ==================================================

  if (loading) {
    return (
      <div className="flex min-h-[300px] items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  // ==================================================
  // ERROR STATE
  // ==================================================

  if (error) {
    return (
      <div className="p-4 md:p-6">
        <ErrorMessage message={error} />

        <button
          onClick={loadAnalytics}
          className="mt-4 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="p-4 text-center text-gray-500">
        No analytics data available.
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 md:p-6">

      {/* ================================================== */}
      {/* PAGE HEADER */}
      {/* ================================================== */}

      <div>
        <h1 className="text-2xl font-bold text-slate-900">
          Financial Analytics
        </h1>

        <p className="mt-1 text-sm text-gray-500">
          Understand your income, expenses and spending habits.
        </p>
      </div>

      {/* ================================================== */}
      {/* DEMO DATA MESSAGE */}
      {/* ================================================== */}

      {data.isDemo && (
        <div className="rounded-lg border border-blue-100 bg-blue-50 p-3 text-sm text-blue-700">
          Showing demo data. Integrate the analytics backend
          endpoint to view real financial metrics.
        </div>
      )}

      {/* ================================================== */}
      {/* PDF REPORT CARD */}
      {/* ================================================== */}

      <div className="rounded-xl border border-purple-100 bg-white p-5 shadow-sm md:p-6">
        <div className="mb-5">
          <h2 className="text-lg font-semibold text-slate-800">
            Generate Financial PDF Report
          </h2>

          <p className="mt-1 text-sm text-gray-500">
            Select a date range to download your transaction report.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div>
            <label
              htmlFor="startDate"
              className="mb-2 block text-sm font-medium text-gray-700"
            >
              Start Date
            </label>

            <input
              id="startDate"
              type="date"
              value={startDate}
              onChange={(event) => {
                setStartDate(event.target.value);
                setReportError('');
                setReportSuccess('');
              }}
              className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </div>

          <div>
            <label
              htmlFor="endDate"
              className="mb-2 block text-sm font-medium text-gray-700"
            >
              End Date
            </label>

            <input
              id="endDate"
              type="date"
              value={endDate}
              onChange={(event) => {
                setEndDate(event.target.value);
                setReportError('');
                setReportSuccess('');
              }}
              className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </div>

          <div className="flex items-end">
            <button
              onClick={handleDownloadReport}
              disabled={reportLoading}
              className="w-full rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {reportLoading
                ? 'Generating PDF...'
                : 'Download PDF'}
            </button>
          </div>
        </div>

        {reportError && (
          <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {reportError}
          </div>
        )}

        {reportSuccess && (
          <div className="mt-4 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
            {reportSuccess}
          </div>
        )}
      </div>

      {/* ================================================== */}
      {/* SUMMARY CARDS */}
      {/* ================================================== */}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">

        {/* TOTAL INCOME */}
        <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-gray-500">
              Total Income
            </p>

            <span className="rounded-lg bg-green-100 px-2 py-1 text-lg">
              ↑
            </span>
          </div>

          <h2 className="mt-3 text-2xl font-bold text-green-600">
            {formatCurrency(summary.totalIncome)}
          </h2>

          <p className="mt-1 text-xs text-gray-500">
            Total money received
          </p>
        </div>

        {/* TOTAL EXPENSE */}
        <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-gray-500">
              Total Expenses
            </p>

            <span className="rounded-lg bg-red-100 px-2 py-1 text-lg">
              ↓
            </span>
          </div>

          <h2 className="mt-3 text-2xl font-bold text-red-600">
            {formatCurrency(summary.totalExpense)}
          </h2>

          <p className="mt-1 text-xs text-gray-500">
            Total money spent
          </p>
        </div>

        {/* NET BALANCE */}
        <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-gray-500">
              Net Balance
            </p>

            <span
              className={`rounded-lg px-2 py-1 text-lg ${
                summary.netBalance >= 0
                  ? 'bg-blue-100'
                  : 'bg-red-100'
              }`}
            >
              ₹
            </span>
          </div>

          <h2
            className={`mt-3 text-2xl font-bold ${
              summary.netBalance >= 0
                ? 'text-blue-600'
                : 'text-red-600'
            }`}
          >
            {formatCurrency(summary.netBalance)}
          </h2>

          <p className="mt-1 text-xs text-gray-500">
            Income minus expenses
          </p>
        </div>

        {/* SAVINGS RATE */}
        <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-gray-500">
              Savings Rate
            </p>

            <span className="rounded-lg bg-purple-100 px-2 py-1 text-lg">
              %
            </span>
          </div>

          <h2 className="mt-3 text-2xl font-bold text-purple-600">
            {summary.savingsRate}%
          </h2>

          <p className="mt-1 text-xs text-gray-500">
            Percentage of income saved
          </p>
        </div>
      </div>

      {/* ================================================== */}
      {/* CHARTS */}
      {/* ================================================== */}

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">

        {/* MONTHLY INCOME VS EXPENSES */}
        <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm md:p-6">
          <h2 className="mb-6 text-lg font-semibold text-slate-800">
            Income vs Expenses
          </h2>

          {monthlyData.length > 0 ? (
            <div className="h-80 w-full">
              <ResponsiveContainer
                width="100%"
                height="100%"
              >
                <BarChart
                  data={monthlyData}
                  margin={{
                    top: 5,
                    right: 10,
                    left: -15,
                    bottom: 5
                  }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="#f3f4f6"
                  />

                  <XAxis
                    dataKey="name"
                    axisLine={false}
                    tickLine={false}
                    tick={{
                      fill: '#6b7280',
                      fontSize: 12
                    }}
                  />

                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{
                      fill: '#6b7280',
                      fontSize: 12
                    }}
                  />

                  <Tooltip
                    formatter={(value) =>
                      formatCurrency(value)
                    }
                    cursor={{
                      fill: '#f9fafb'
                    }}
                    contentStyle={{
                      borderRadius: '8px',
                      border: 'none',
                      boxShadow:
                        '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                    }}
                  />

                  <Legend />

                  <Bar
                    dataKey="income"
                    name="Income"
                    fill="#10b981"
                    radius={[4, 4, 0, 0]}
                    maxBarSize={40}
                  />

                  <Bar
                    dataKey="expense"
                    name="Expenses"
                    fill="#ef4444"
                    radius={[4, 4, 0, 0]}
                    maxBarSize={40}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="flex h-80 items-center justify-center text-sm text-gray-400">
              No monthly data available.
            </div>
          )}
        </div>

        {/* CATEGORY PIE CHART */}
        <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm md:p-6">
          <h2 className="mb-6 text-lg font-semibold text-slate-800">
            Spending by Category
          </h2>

          {categoryData.length > 0 ? (
            <div className="h-80 w-full">
              <ResponsiveContainer
                width="100%"
                height="100%"
              >
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="45%"
                    innerRadius={60}
                    outerRadius={95}
                    paddingAngle={4}
                    dataKey="value"
                    nameKey="name"
                  >
                    {categoryData.map((entry, index) => (
                      <Cell
                        key={`category-cell-${index}`}
                        fill={
                          COLORS[index % COLORS.length]
                        }
                      />
                    ))}
                  </Pie>

                  <Tooltip
                    formatter={(value) =>
                      formatCurrency(value)
                    }
                    contentStyle={{
                      borderRadius: '8px',
                      border: 'none',
                      boxShadow:
                        '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                    }}
                  />

                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="flex h-80 items-center justify-center text-sm text-gray-400">
              No category data available.
            </div>
          )}
        </div>
      </div>

      {/* ================================================== */}
      {/* CATEGORY-WISE SPENDING LIST */}
      {/* ================================================== */}

      <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm md:p-6">
        <div className="mb-5 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-800">
              Category-wise Spending
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              See where most of your money is going.
            </p>
          </div>

          <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-600">
            {categoryData.length} Categories
          </span>
        </div>

        {categoryData.length > 0 ? (
          <div className="space-y-4">
            {categoryData
              .slice()
              .sort((a, b) => b.value - a.value)
              .map((category, index) => {
                const percentage =
                  summary.totalExpense > 0
                    ? (category.value /
                        summary.totalExpense) *
                      100
                    : 0;

                return (
                  <div
                    key={`${category.name}-${index}`}
                    className="space-y-2"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex min-w-0 items-center gap-2">
                        <span
                          className="h-3 w-3 shrink-0 rounded-full"
                          style={{
                            backgroundColor:
                              COLORS[index % COLORS.length]
                          }}
                        />

                        <span className="truncate text-sm font-medium text-gray-700">
                          {category.name}
                        </span>
                      </div>

                      <div className="flex shrink-0 items-center gap-3">
                        <span className="text-xs text-gray-500">
                          {percentage.toFixed(1)}%
                        </span>

                        <span className="text-sm font-semibold text-gray-800">
                          {formatCurrency(category.value)}
                        </span>
                      </div>
                    </div>

                    <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: `${Math.min(
                            percentage,
                            100
                          )}%`,
                          backgroundColor:
                            COLORS[index % COLORS.length]
                        }}
                      />
                    </div>
                  </div>
                );
              })}
          </div>
        ) : (
          <div className="py-8 text-center text-sm text-gray-400">
            No spending category data available.
          </div>
        )}
      </div>
    </div>
  );
}