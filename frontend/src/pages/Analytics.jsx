import React, { useEffect, useMemo, useState } from 'react';
import { financeService } from '../services/financeService';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell
} from 'recharts';

// =====================================================
// CONSTANTS
// =====================================================

const COLORS = [
  '#6366f1',
  '#06b6d4',
  '#10b981',
  '#f59e0b',
  '#f43f5e',
  '#8b5cf6',
  '#ec4899',
  '#14b8a6'
];

const PERIOD_OPTIONS = [
  {
    value: 'weekly',
    label: 'Weekly',
    description: 'Day-wise for the latest 7 days'
  },
  {
    value: 'monthly',
    label: 'Monthly',
    description: 'Week-wise for the selected month'
  },
  {
    value: 'quarterly',
    label: 'Quarterly',
    description: 'Month-wise for the current quarter'
  },
  {
    value: 'halfyear',
    label: 'Half Year',
    description: 'Month-wise for the latest 6 months'
  },
  {
    value: 'year',
    label: 'Year',
    description: 'Month-wise for the current year'
  }
];

// =====================================================
// BASIC HELPERS
// =====================================================

const toNumber = (value) => {
  const number = Number(value ?? 0);
  return Number.isFinite(number) ? number : 0;
};

const formatCurrency = (value) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(toNumber(value));
};

const formatCompactCurrency = (value) => {
  const number = toNumber(value);

  if (number >= 10000000) {
    return `₹${(number / 10000000).toFixed(1)}Cr`;
  }

  if (number >= 100000) {
    return `₹${(number / 100000).toFixed(1)}L`;
  }

  if (number >= 1000) {
    return `₹${(number / 1000).toFixed(1)}K`;
  }

  return `₹${number.toFixed(0)}`;
};

const formatFullDate = (date) => {
  if (!date) return '';

  return new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  }).format(date);
};

const formatShortDate = (date) => {
  if (!date) return '';

  return new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: 'short'
  }).format(date);
};

const formatMonth = (date) => {
  if (!date) return '';

  return new Intl.DateTimeFormat('en-IN', {
    month: 'short',
    year: '2-digit'
  }).format(date);
};

const parseDate = (value) => {
  if (!value) return null;

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date;
};

const startOfDay = (date) => {
  const result = new Date(date);
  result.setHours(0, 0, 0, 0);
  return result;
};

const endOfDay = (date) => {
  const result = new Date(date);
  result.setHours(23, 59, 59, 999);
  return result;
};

const addDays = (date, days) => {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
};

const startOfMonth = (date) => {
  return new Date(date.getFullYear(), date.getMonth(), 1);
};

const endOfMonth = (date) => {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0);
};

const getLatestDate = (transactions) => {
  if (!transactions.length) {
    return new Date();
  }

  const sortedDates = transactions
    .map((item) => item.date)
    .filter(Boolean)
    .sort((a, b) => b.getTime() - a.getTime());

  return sortedDates[0] || new Date();
};

// =====================================================
// API DATA EXTRACTION
// =====================================================

const extractArray = (response, possibleKeys = []) => {
  if (Array.isArray(response)) {
    return response;
  }

  if (!response || typeof response !== 'object') {
    return [];
  }

  for (const key of possibleKeys) {
    if (Array.isArray(response[key])) {
      return response[key];
    }
  }

  if (Array.isArray(response.data)) {
    return response.data;
  }

  if (Array.isArray(response.results)) {
    return response.results;
  }

  if (Array.isArray(response.items)) {
    return response.items;
  }

  if (Array.isArray(response.transactions)) {
    return response.transactions;
  }

  return [];
};

// =====================================================
// TRANSACTION NORMALIZATION
// =====================================================

const normalizeTransactions = (rawTransactions) => {
  const transactions = extractArray(rawTransactions, [
    'transactions',
    'items',
    'results'
  ]);

  return transactions
    .map((item, index) => {
      const rawDate =
        item?.date ??
        item?.transaction_date ??
        item?.transactionDate ??
        item?.created_at ??
        item?.createdAt ??
        item?.timestamp;

      const date = parseDate(rawDate);

      const amount = Math.abs(
        toNumber(
          item?.amount ??
            item?.value ??
            item?.transaction_amount ??
            item?.transactionAmount ??
            item?.total
        )
      );

      const rawType = String(
        item?.type ??
          item?.transaction_type ??
          item?.transactionType ??
          item?.entry_type ??
          item?.entryType ??
          item?.kind ??
          ''
      ).toLowerCase();

      const rawCategory =
        item?.category ??
        item?.category_name ??
        item?.categoryName ??
        item?.category?.name ??
        'Other';

      const category =
        typeof rawCategory === 'string'
          ? rawCategory
          : rawCategory?.name || 'Other';

      const isIncome =
        rawType.includes('income') ||
        rawType.includes('credit') ||
        rawType.includes('earning') ||
        rawType.includes('deposit') ||
        item?.is_income === true ||
        item?.isIncome === true;

      const isExpense =
        rawType.includes('expense') ||
        rawType.includes('debit') ||
        rawType.includes('spend') ||
        rawType.includes('payment') ||
        item?.is_expense === true ||
        item?.isExpense === true;

      return {
        id: item?.id ?? item?._id ?? index,
        date,
        amount,
        category,
        type: isIncome && !isExpense ? 'income' : 'expense'
      };
    })
    .filter((item) => item.date && item.amount > 0);
};

// =====================================================
// ANALYTICS API NORMALIZATION
// =====================================================

const normalizeAnalyticsMonthly = (monthly) => {
  if (!Array.isArray(monthly)) return [];

  return monthly
    .map((item, index) => {
      const income = toNumber(
        item?.income ??
          item?.total_income ??
          item?.totalIncome ??
          item?.credit ??
          item?.total_credit
      );

      const expense = toNumber(
        item?.expense ??
          item?.expenses ??
          item?.total_expense ??
          item?.total_expenses ??
          item?.totalExpense ??
          item?.totalExpenses ??
          item?.debit ??
          item?.total_debit
      );

      const name =
        item?.name ??
        item?.month ??
        item?.label ??
        item?.period ??
        item?.date ??
        `Month ${index + 1}`;

      return {
        name: String(name),
        subLabel: '',
        income,
        expense,
        savings: income - expense
      };
    })
    .filter((item) => item.income > 0 || item.expense > 0);
};

// =====================================================
// PERIOD BUILDERS
// =====================================================

const createPeriod = ({
  name,
  subLabel = '',
  startDate = null,
  endDate = null
}) => {
  return {
    name,
    subLabel,
    startDate,
    endDate,
    income: 0,
    expense: 0,
    savings: 0
  };
};

const addTransactionToPeriod = (period, transaction) => {
  if (transaction.type === 'income') {
    period.income += transaction.amount;
  } else {
    period.expense += transaction.amount;
  }

  period.savings = period.income - period.expense;
};

// -----------------------------------------------------
// WEEKLY: Last 7 days, day-wise
// -----------------------------------------------------

const buildWeeklyData = (transactions, latestDate) => {
  const latest = startOfDay(latestDate);
  const firstDay = addDays(latest, -6);

  const periods = [];

  for (let index = 0; index < 7; index += 1) {
    const currentDate = addDays(firstDay, index);

    periods.push(
      createPeriod({
        name: formatShortDate(currentDate),
        subLabel: formatFullDate(currentDate),
        startDate: startOfDay(currentDate),
        endDate: endOfDay(currentDate)
      })
    );
  }

  transactions.forEach((transaction) => {
    const index = periods.findIndex(
      (period) =>
        transaction.date >= period.startDate &&
        transaction.date <= period.endDate
    );

    if (index !== -1) {
      addTransactionToPeriod(periods[index], transaction);
    }
  });

  return periods;
};

// -----------------------------------------------------
// MONTHLY: Week-wise for current/latest month
// -----------------------------------------------------

const buildMonthlyData = (transactions, latestDate) => {
  const monthStart = startOfMonth(latestDate);
  const monthEnd = endOfMonth(latestDate);

  const periods = [];

  let weekStart = new Date(monthStart);
  let weekNumber = 1;

  while (weekStart <= monthEnd) {
    let weekEnd = addDays(weekStart, 6);

    if (weekEnd > monthEnd) {
      weekEnd = monthEnd;
    }

    periods.push(
      createPeriod({
        name: `Week ${weekNumber}`,
        subLabel: `${formatShortDate(weekStart)} - ${formatShortDate(
          weekEnd
        )}`,
        startDate: startOfDay(weekStart),
        endDate: endOfDay(weekEnd)
      })
    );

    weekStart = addDays(weekEnd, 1);
    weekNumber += 1;
  }

  transactions.forEach((transaction) => {
    const index = periods.findIndex(
      (period) =>
        transaction.date >= period.startDate &&
        transaction.date <= period.endDate
    );

    if (index !== -1) {
      addTransactionToPeriod(periods[index], transaction);
    }
  });

  return periods;
};

// -----------------------------------------------------
// QUARTERLY: 3 months month-wise
// -----------------------------------------------------

const buildQuarterlyData = (transactions, latestDate) => {
  const currentMonth = latestDate.getMonth();
  const quarterStartMonth = Math.floor(currentMonth / 3) * 3;

  const periods = [];

  for (let index = 0; index < 3; index += 1) {
    const monthDate = new Date(
      latestDate.getFullYear(),
      quarterStartMonth + index,
      1
    );

    const monthStart = startOfMonth(monthDate);
    const monthEnd = endOfMonth(monthDate);

    periods.push(
      createPeriod({
        name: formatMonth(monthDate),
        subLabel: `${formatShortDate(monthStart)} - ${formatShortDate(
          monthEnd
        )}`,
        startDate: startOfDay(monthStart),
        endDate: endOfDay(monthEnd)
      })
    );
  }

  transactions.forEach((transaction) => {
    const index = periods.findIndex(
      (period) =>
        transaction.date >= period.startDate &&
        transaction.date <= period.endDate
    );

    if (index !== -1) {
      addTransactionToPeriod(periods[index], transaction);
    }
  });

  return periods;
};

// -----------------------------------------------------
// HALF YEAR: Last 6 months month-wise
// -----------------------------------------------------

const buildHalfYearData = (transactions, latestDate) => {
  const periods = [];

  for (let index = 5; index >= 0; index -= 1) {
    const monthDate = new Date(
      latestDate.getFullYear(),
      latestDate.getMonth() - index,
      1
    );

    const monthStart = startOfMonth(monthDate);
    const monthEnd = endOfMonth(monthDate);

    periods.push(
      createPeriod({
        name: formatMonth(monthDate),
        subLabel: `${formatShortDate(monthStart)} - ${formatShortDate(
          monthEnd
        )}`,
        startDate: startOfDay(monthStart),
        endDate: endOfDay(monthEnd)
      })
    );
  }

  transactions.forEach((transaction) => {
    const index = periods.findIndex(
      (period) =>
        transaction.date >= period.startDate &&
        transaction.date <= period.endDate
    );

    if (index !== -1) {
      addTransactionToPeriod(periods[index], transaction);
    }
  });

  return periods;
};

// -----------------------------------------------------
// YEAR: 12 months month-wise
// -----------------------------------------------------

const buildYearData = (transactions, latestDate) => {
  const periods = [];

  for (let index = 0; index < 12; index += 1) {
    const monthDate = new Date(
      latestDate.getFullYear(),
      index,
      1
    );

    const monthStart = startOfMonth(monthDate);
    const monthEnd = endOfMonth(monthDate);

    periods.push(
      createPeriod({
        name: formatMonth(monthDate),
        subLabel: `${formatShortDate(monthStart)} - ${formatShortDate(
          monthEnd
        )}`,
        startDate: startOfDay(monthStart),
        endDate: endOfDay(monthEnd)
      })
    );
  }

  transactions.forEach((transaction) => {
    const index = periods.findIndex(
      (period) =>
        transaction.date >= period.startDate &&
        transaction.date <= period.endDate
    );

    if (index !== -1) {
      addTransactionToPeriod(periods[index], transaction);
    }
  });

  return periods;
};

const buildPeriodData = (transactions, selectedPeriod) => {
  const latestDate = getLatestDate(transactions);

  switch (selectedPeriod) {
    case 'weekly':
      return buildWeeklyData(transactions, latestDate);

    case 'monthly':
      return buildMonthlyData(transactions, latestDate);

    case 'quarterly':
      return buildQuarterlyData(transactions, latestDate);

    case 'halfyear':
      return buildHalfYearData(transactions, latestDate);

    case 'year':
      return buildYearData(transactions, latestDate);

    default:
      return buildMonthlyData(transactions, latestDate);
  }
};

// =====================================================
// UI COMPONENTS
// =====================================================

function StatCard({
  title,
  value,
  description,
  icon,
  iconClass,
  valueClass
}) {
  return (
    <div className="group relative overflow-hidden rounded-3xl border border-slate-200 bg-white p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
      <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-slate-50 transition-transform duration-300 group-hover:scale-125" />

      <div className="relative flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-slate-500">
            {title}
          </p>

          <h3
            className={`mt-3 break-words text-2xl font-black ${valueClass}`}
          >
            {value}
          </h3>

          <p className="mt-2 text-xs text-slate-400">
            {description}
          </p>
        </div>

        <div
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl text-xl ${iconClass}`}
        >
          {icon}
        </div>
      </div>
    </div>
  );
}

function SectionTitle({
  eyebrow,
  title,
  description,
  action
}) {
  return (
    <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
      <div>
        {eyebrow && (
          <p className="mb-1 text-[11px] font-black uppercase tracking-[0.18em] text-indigo-500">
            {eyebrow}
          </p>
        )}

        <h2 className="text-xl font-black tracking-tight text-slate-900">
          {title}
        </h2>

        {description && (
          <p className="mt-1 text-sm text-slate-500">
            {description}
          </p>
        )}
      </div>

      {action}
    </div>
  );
}

function EmptyState({ message }) {
  return (
    <div className="flex h-80 flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50">
      <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-2xl shadow-sm">
        📊
      </div>

      <p className="max-w-md text-center text-sm font-semibold text-slate-400">
        {message}
      </p>
    </div>
  );
}

function HealthBadge({ score }) {
  if (score >= 75) {
    return (
      <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-700">
        Excellent
      </span>
    );
  }

  if (score >= 50) {
    return (
      <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-700">
        Fair
      </span>
    );
  }

  return (
    <span className="rounded-full bg-rose-100 px-3 py-1 text-xs font-bold text-rose-700">
      Needs Attention
    </span>
  );
}

// =====================================================
// MAIN COMPONENT
// =====================================================

export default function Analytics() {
  const [analytics, setAnalytics] = useState({});
  const [transactions, setTransactions] = useState([]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const [selectedPeriod, setSelectedPeriod] = useState('monthly');
  const [chartMode, setChartMode] = useState('bar');

  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const [reportLoading, setReportLoading] = useState(false);
  const [reportError, setReportError] = useState('');
  const [reportSuccess, setReportSuccess] = useState('');

  // =====================================================
  // FETCH ANALYTICS AND TRANSACTIONS
  // =====================================================

  const loadAnalytics = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError('');

      const results = await Promise.allSettled([
        financeService.getAnalytics(),
        financeService.getTransactions()
      ]);

      const analyticsResult = results[0];
      const transactionsResult = results[1];

      if (analyticsResult.status === 'fulfilled') {
        setAnalytics(analyticsResult.value || {});
      } else {
        console.error(
          'Analytics API error:',
          analyticsResult.reason
        );
      }

      if (transactionsResult.status === 'fulfilled') {
        const transactionResponse =
          transactionsResult.value;

        const transactionArray = extractArray(
          transactionResponse,
          ['transactions', 'items', 'results']
        );

        const normalized = normalizeTransactions(
          transactionArray
        );

        setTransactions(normalized);

        console.log(
          'Normalized Transactions:',
          normalized
        );
      } else {
        console.warn(
          'Transactions API unavailable:',
          transactionsResult.reason
        );

        setTransactions([]);
      }
    } catch (err) {
      console.error('Analytics loading error:', err);

      setError(
        err?.response?.data?.message ||
          err?.response?.data?.error ||
          'Unable to load analytics data.'
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadAnalytics();
  }, []);

  // =====================================================
  // PREPARE CHART DATA
  // =====================================================

  const fallbackMonthlyData = useMemo(() => {
    return normalizeAnalyticsMonthly(analytics?.monthly);
  }, [analytics]);

  const periodData = useMemo(() => {
    // Best option: use actual transactions
    if (transactions.length > 0) {
      return buildPeriodData(
        transactions,
        selectedPeriod
      );
    }

    // Fallback when transaction API returns no data
    if (
      selectedPeriod === 'monthly' ||
      selectedPeriod === 'quarterly' ||
      selectedPeriod === 'halfyear' ||
      selectedPeriod === 'year'
    ) {
      return fallbackMonthlyData;
    }

    return [];
  }, [
    transactions,
    selectedPeriod,
    fallbackMonthlyData
  ]);

  const hasChartData = periodData.length > 0;

  const selectedPeriodDetails = PERIOD_OPTIONS.find(
    (item) => item.value === selectedPeriod
  );

  // =====================================================
  // CATEGORY DATA
  // =====================================================

  const categoryData = useMemo(() => {
    const rawCategories = Array.isArray(
      analytics?.categories
    )
      ? analytics.categories
      : [];

    // If API categories are available, use them
    if (rawCategories.length > 0) {
      return rawCategories
        .map((item, index) => {
          const name =
            item?.name ??
            item?.category ??
            item?.category_name ??
            item?.categoryName ??
            item?.label ??
            `Category ${index + 1}`;

          const value = toNumber(
            item?.value ??
              item?.amount ??
              item?.total ??
              item?.expense ??
              item?.expenses ??
              item?.total_expense ??
              item?.totalExpense
          );

          return {
            name,
            value
          };
        })
        .filter((item) => item.value > 0);
    }

    // Otherwise calculate categories from transactions
    const categoryMap = {};

    transactions.forEach((transaction) => {
      if (transaction.type !== 'expense') return;

      const category = transaction.category || 'Other';

      categoryMap[category] =
        (categoryMap[category] || 0) + transaction.amount;
    });

    return Object.entries(categoryMap)
      .map(([name, value]) => ({
        name,
        value
      }))
      .filter((item) => item.value > 0);
  }, [analytics, transactions]);

  const sortedCategories = useMemo(() => {
    return [...categoryData].sort(
      (a, b) => b.value - a.value
    );
  }, [categoryData]);

  // =====================================================
  // SUMMARY
  // =====================================================

  const summary = useMemo(() => {
    const chartIncome = periodData.reduce(
      (sum, item) => sum + toNumber(item.income),
      0
    );

    const chartExpense = periodData.reduce(
      (sum, item) => sum + toNumber(item.expense),
      0
    );

    const directIncome =
      analytics?.total_income ??
      analytics?.totalIncome ??
      analytics?.income ??
      analytics?.summary?.total_income ??
      analytics?.summary?.totalIncome;

    const directExpense =
      analytics?.total_expense ??
      analytics?.total_expenses ??
      analytics?.totalExpense ??
      analytics?.totalExpenses ??
      analytics?.expense ??
      analytics?.summary?.total_expense ??
      analytics?.summary?.total_expenses ??
      analytics?.summary?.totalExpense ??
      analytics?.summary?.totalExpenses;

    const totalIncome =
      transactions.length > 0 || chartIncome > 0
        ? chartIncome
        : toNumber(directIncome);

    const categoryTotal = categoryData.reduce(
      (sum, item) => sum + item.value,
      0
    );

    const totalExpense =
      transactions.length > 0 || chartExpense > 0
        ? chartExpense
        : toNumber(directExpense) || categoryTotal;

    const netBalance = totalIncome - totalExpense;

    const savingsRate =
      totalIncome > 0
        ? (netBalance / totalIncome) * 100
        : 0;

    const expenseRatio =
      totalIncome > 0
        ? (totalExpense / totalIncome) * 100
        : 0;

    const topCategory =
      sortedCategories.length > 0
        ? sortedCategories[0]
        : null;

    let healthScore = 0;

    if (totalIncome > 0) {
      if (savingsRate >= 35) {
        healthScore = 95;
      } else if (savingsRate >= 25) {
        healthScore = 85;
      } else if (savingsRate >= 15) {
        healthScore = 72;
      } else if (savingsRate >= 5) {
        healthScore = 58;
      } else if (savingsRate >= 0) {
        healthScore = 42;
      } else {
        healthScore = 20;
      }
    }

    return {
      totalIncome,
      totalExpense,
      netBalance,
      savingsRate,
      expenseRatio,
      topCategory,
      healthScore
    };
  }, [
    periodData,
    transactions,
    analytics,
    categoryData,
    sortedCategories
  ]);

  // =====================================================
  // INSIGHTS
  // =====================================================

  const insights = useMemo(() => {
    const result = [];

    if (summary.netBalance < 0) {
      result.push({
        icon: '⚠️',
        title: 'Expenses exceed income',
        text:
          'Your spending is higher than your income. Review your biggest expense categories.',
        className:
          'border-rose-200 bg-rose-50 text-rose-800'
      });
    } else if (summary.savingsRate >= 25) {
      result.push({
        icon: '🎯',
        title: 'Strong savings rate',
        text: `You are saving ${summary.savingsRate.toFixed(
          1
        )}% of your income.`,
        className:
          'border-emerald-200 bg-emerald-50 text-emerald-800'
      });
    } else {
      result.push({
        icon: '💡',
        title: 'Build your savings',
        text:
          'Try saving a fixed amount immediately after receiving income.',
        className:
          'border-indigo-200 bg-indigo-50 text-indigo-800'
      });
    }

    if (summary.topCategory) {
      result.push({
        icon: '📌',
        title: 'Top spending category',
        text: `${summary.topCategory.name} is your largest expense.`,
        className:
          'border-amber-200 bg-amber-50 text-amber-800'
      });
    } else {
      result.push({
        icon: '📌',
        title: 'No category data',
        text:
          'Add categorized expenses to see your biggest spending area.',
        className:
          'border-amber-200 bg-amber-50 text-amber-800'
      });
    }

    if (summary.expenseRatio > 80) {
      result.push({
        icon: '📉',
        title: 'High spending ratio',
        text:
          'More than 80% of your income is being spent.',
        className:
          'border-rose-200 bg-rose-50 text-rose-800'
      });
    } else {
      result.push({
        icon: '🛡️',
        title: 'Spending is manageable',
        text: `${summary.expenseRatio.toFixed(
          1
        )}% of your income is currently being used.`,
        className:
          'border-emerald-200 bg-emerald-50 text-emerald-800'
      });
    }

    return result.slice(0, 3);
  }, [summary]);

  // =====================================================
  // PDF REPORT
  // =====================================================

  const handleDownloadReport = async () => {
    setReportError('');
    setReportSuccess('');

    if (!startDate || !endDate) {
      setReportError(
        'Please select both start and end dates.'
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

      const blobUrl = window.URL.createObjectURL(pdfBlob);
      const link = document.createElement('a');

      link.href = blobUrl;
      link.download = `trackwise_report_${startDate}_${endDate}.pdf`;

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      window.URL.revokeObjectURL(blobUrl);

      setReportSuccess(
        'Financial report downloaded successfully.'
      );
    } catch (err) {
      console.error('PDF download error:', err);

      setReportError(
        'Unable to generate PDF report. Please try again.'
      );
    } finally {
      setReportLoading(false);
    }
  };

  // =====================================================
  // LOADING
  // =====================================================

  if (loading) {
    return (
      <div className="flex min-h-[500px] items-center justify-center bg-[#f6f7fb]">
        <LoadingSpinner />
      </div>
    );
  }

  // =====================================================
  // ERROR
  // =====================================================

  if (error) {
    return (
      <div className="min-h-[500px] bg-[#f6f7fb] p-6">
        <ErrorMessage message={error} />

        <button
          type="button"
          onClick={() => loadAnalytics()}
          className="mt-4 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-bold text-white hover:bg-indigo-700"
        >
          Try Again
        </button>
      </div>
    );
  }

  // =====================================================
  // MAIN UI
  // =====================================================

  return (
    <main className="min-h-screen bg-[#f6f7fb] px-4 py-5 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[1600px] space-y-6">

        {/* HEADER */}

        <header className="flex flex-col justify-between gap-5 lg:flex-row lg:items-center">
          <div>
            <div className="mb-2 flex items-center gap-2 text-xs font-semibold text-slate-400">
              <span>TrackWise</span>
              <span>/</span>
              <span className="text-indigo-500">
                Analytics
              </span>
            </div>

            <h1 className="text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
              Financial Analytics
            </h1>

            <p className="mt-2 max-w-2xl text-sm text-slate-500 sm:text-base">
              Understand your financial habits, monitor your
              cash flow and make better money decisions.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => loadAnalytics(true)}
              disabled={refreshing}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-700 shadow-sm transition hover:border-indigo-300 hover:text-indigo-600 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <span
                className={refreshing ? 'animate-spin' : ''}
              >
                ↻
              </span>

              {refreshing ? 'Refreshing...' : 'Refresh'}
            </button>

            <a
              href="#pdf-report"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-3 text-sm font-bold text-white shadow-lg shadow-indigo-200 transition hover:bg-indigo-700"
            >
              ↓ Export Report
            </a>
          </div>
        </header>

        {/* DEMO BANNER */}

        {analytics?.isDemo && (
          <div className="rounded-2xl border border-blue-200 bg-blue-50 px-5 py-4 text-blue-800">
            <p className="text-sm font-bold">
              Demo data is being displayed
            </p>

            <p className="mt-1 text-xs text-blue-600">
              Add real transactions to view actual analytics.
            </p>
          </div>
        )}

        {/* HERO */}

        <section className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-[#111827] via-[#312e81] to-[#4f46e5] p-6 text-white shadow-2xl sm:p-8 lg:p-10">
          <div className="absolute -right-24 -top-24 h-80 w-80 rounded-full bg-indigo-300/20 blur-3xl" />
          <div className="absolute -bottom-32 left-1/3 h-80 w-80 rounded-full bg-cyan-300/10 blur-3xl" />

          <div className="relative grid grid-cols-1 gap-8 xl:grid-cols-[1.4fr_0.8fr] xl:items-center">
            <div>
              <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-semibold text-indigo-100">
                <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-400" />
                Your financial snapshot
              </div>

              <p className="text-sm font-medium text-indigo-200">
                Net financial position
              </p>

              <h2
                className={`mt-3 break-words text-4xl font-black sm:text-5xl ${
                  summary.netBalance < 0
                    ? 'text-rose-200'
                    : 'text-white'
                }`}
              >
                {formatCurrency(summary.netBalance)}
              </h2>

              <p className="mt-3 max-w-xl text-sm leading-6 text-indigo-100">
                This is the difference between your total
                income and total expenses for the selected
                analytics view.
              </p>

              <div className="mt-8 grid max-w-2xl grid-cols-1 gap-3 sm:grid-cols-3">
                <div className="rounded-2xl border border-white/10 bg-white/10 p-4">
                  <p className="text-xs text-indigo-200">
                    Total income
                  </p>

                  <p className="mt-2 text-xl font-extrabold">
                    {formatCompactCurrency(
                      summary.totalIncome
                    )}
                  </p>
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/10 p-4">
                  <p className="text-xs text-indigo-200">
                    Total expenses
                  </p>

                  <p className="mt-2 text-xl font-extrabold">
                    {formatCompactCurrency(
                      summary.totalExpense
                    )}
                  </p>
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/10 p-4">
                  <p className="text-xs text-indigo-200">
                    Savings rate
                  </p>

                  <p className="mt-2 text-xl font-extrabold">
                    {summary.savingsRate.toFixed(1)}%
                  </p>
                </div>
              </div>
            </div>

            {/* SELECTED PERIOD CARD */}

            <div className="rounded-3xl border border-white/10 bg-white/10 p-6 backdrop-blur-xl">
              <p className="text-sm font-bold text-indigo-100">
                Current analytics view
              </p>

              <p className="mt-2 text-3xl font-black">
                {selectedPeriodDetails?.label}
              </p>

              <p className="mt-2 text-sm leading-6 text-indigo-200">
                {selectedPeriodDetails?.description}
              </p>

              <div className="mt-6 rounded-2xl border border-white/10 bg-black/10 p-4">
                <p className="text-xs text-indigo-200">
                  Chart periods
                </p>

                <p className="mt-1 text-2xl font-black">
                  {periodData.length}
                </p>

                <p className="mt-1 text-xs text-indigo-200">
                  {transactions.length > 0
                    ? `${transactions.length} transactions loaded`
                    : 'Using available analytics data'}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* STAT CARDS */}

        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            title="Total Income"
            value={formatCurrency(summary.totalIncome)}
            description="Money received in selected view"
            icon="↗"
            iconClass="bg-emerald-100 text-emerald-600"
            valueClass="text-emerald-600"
          />

          <StatCard
            title="Total Expenses"
            value={formatCurrency(summary.totalExpense)}
            description="Money spent in selected view"
            icon="↘"
            iconClass="bg-rose-100 text-rose-600"
            valueClass="text-rose-600"
          />

          <StatCard
            title="Net Savings"
            value={formatCurrency(summary.netBalance)}
            description="Income minus expenses"
            icon="₹"
            iconClass="bg-indigo-100 text-indigo-600"
            valueClass={
              summary.netBalance >= 0
                ? 'text-indigo-600'
                : 'text-rose-600'
            }
          />

          <StatCard
            title="Largest Expense"
            value={
              summary.topCategory
                ? summary.topCategory.name
                : 'No data'
            }
            description={
              summary.topCategory
                ? formatCurrency(
                    summary.topCategory.value
                  )
                : 'No category available'
            }
            icon="★"
            iconClass="bg-amber-100 text-amber-600"
            valueClass="text-amber-600"
          />
        </section>

        {/* CASH FLOW CHART */}

        <section className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
          <SectionTitle
            eyebrow="Cash flow"
            title="Income vs Expenses"
            description="Change the period to view your financial movement in a different format"
            action={
              <div className="flex flex-col gap-2 sm:items-end">
                {/* PERIOD DROPDOWN */}

                <select
                  value={selectedPeriod}
                  onChange={(event) => {
                    setSelectedPeriod(event.target.value);
                  }}
                  className="min-w-[180px] rounded-xl border border-indigo-200 bg-indigo-50 px-4 py-3 text-sm font-bold text-indigo-700 outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100"
                >
                  {PERIOD_OPTIONS.map((option) => (
                    <option
                      key={option.value}
                      value={option.value}
                    >
                      {option.label}
                    </option>
                  ))}
                </select>

                {/* CHART MODE */}

                <div className="flex rounded-xl bg-slate-100 p-1">
                  <button
                    type="button"
                    onClick={() => setChartMode('bar')}
                    className={`rounded-lg px-4 py-2 text-xs font-bold transition ${
                      chartMode === 'bar'
                        ? 'bg-white text-indigo-600 shadow-sm'
                        : 'text-slate-500 hover:text-slate-700'
                    }`}
                  >
                    Bar
                  </button>

                  <button
                    type="button"
                    onClick={() => setChartMode('line')}
                    className={`rounded-lg px-4 py-2 text-xs font-bold transition ${
                      chartMode === 'line'
                        ? 'bg-white text-indigo-600 shadow-sm'
                        : 'text-slate-500 hover:text-slate-700'
                    }`}
                  >
                    Line
                  </button>
                </div>
              </div>
            }
          />

          {/* PERIOD DESCRIPTION */}

          <div className="mb-5 rounded-2xl border border-indigo-100 bg-indigo-50 px-4 py-4">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-bold text-indigo-800">
                  {selectedPeriodDetails?.label} breakdown
                </p>

                <p className="mt-1 text-xs text-indigo-600">
                  {selectedPeriod === 'weekly' &&
                    'Each bar or point represents one day from the latest 7 days.'}

                  {selectedPeriod === 'monthly' &&
                    'Each bar or point represents one week of the latest transaction month. The date range is shown below each period.'}

                  {selectedPeriod === 'quarterly' &&
                    'Each bar or point represents one month of the current quarter.'}

                  {selectedPeriod === 'halfyear' &&
                    'Each bar or point represents one month from the latest 6 months.'}

                  {selectedPeriod === 'year' &&
                    'Each bar or point represents one month of the current year.'}
                </p>
              </div>

              <span className="w-fit rounded-full bg-white px-3 py-1.5 text-xs font-bold text-indigo-600 shadow-sm">
                {periodData.length} periods
              </span>
            </div>
          </div>

          {hasChartData ? (
            <div className="h-[430px] w-full">
              <ResponsiveContainer
                width="100%"
                height="100%"
              >
                {chartMode === 'bar' ? (
                  <BarChart
                    data={periodData}
                    margin={{
                      top: 15,
                      right: 20,
                      left: 5,
                      bottom: 50
                    }}
                  >
                    <CartesianGrid
                      stroke="#e5e7eb"
                      strokeDasharray="4 4"
                      vertical={false}
                    />

                    <XAxis
                      dataKey="name"
                      axisLine={false}
                      tickLine={false}
                      interval={0}
                      angle={
                        selectedPeriod === 'weekly'
                          ? -25
                          : 0
                      }
                      textAnchor={
                        selectedPeriod === 'weekly'
                          ? 'end'
                          : 'middle'
                      }
                      height={
                        selectedPeriod === 'weekly'
                          ? 65
                          : 45
                      }
                      tick={{
                        fill: '#64748b',
                        fontSize: 11,
                        fontWeight: 600
                      }}
                    />

                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tick={{
                        fill: '#94a3b8',
                        fontSize: 11
                      }}
                      tickFormatter={formatCompactCurrency}
                    />

                    <Tooltip
                      cursor={{
                        fill: '#f8fafc'
                      }}
                      formatter={(value, name) => [
                        formatCurrency(value),
                        name
                      ]}
                      labelFormatter={(label, payload) => {
                        const item = payload?.[0]?.payload;

                        if (item?.subLabel) {
                          return `${label} (${item.subLabel})`;
                        }

                        return label;
                      }}
                      contentStyle={{
                        borderRadius: '16px',
                        border: '1px solid #e2e8f0',
                        boxShadow:
                          '0 12px 35px rgba(15,23,42,0.12)'
                      }}
                    />

                    <Legend
                      verticalAlign="top"
                      align="right"
                      wrapperStyle={{
                        fontSize: '12px',
                        paddingBottom: '25px'
                      }}
                    />

                    <Bar
                      dataKey="income"
                      name="Income"
                      fill="#10b981"
                      radius={[8, 8, 0, 0]}
                      barSize={
                        selectedPeriod === 'weekly'
                          ? 16
                          : 30
                      }
                    />

                    <Bar
                      dataKey="expense"
                      name="Expenses"
                      fill="#f43f5e"
                      radius={[8, 8, 0, 0]}
                      barSize={
                        selectedPeriod === 'weekly'
                          ? 16
                          : 30
                      }
                    />

                    <Bar
                      dataKey="savings"
                      name="Savings"
                      fill="#6366f1"
                      radius={[8, 8, 0, 0]}
                      barSize={
                        selectedPeriod === 'weekly'
                          ? 16
                          : 30
                      }
                    />
                  </BarChart>
                ) : (
                  <LineChart
                    data={periodData}
                    margin={{
                      top: 15,
                      right: 20,
                      left: 5,
                      bottom: 50
                    }}
                  >
                    <CartesianGrid
                      stroke="#e5e7eb"
                      strokeDasharray="4 4"
                      vertical={false}
                    />

                    <XAxis
                      dataKey="name"
                      axisLine={false}
                      tickLine={false}
                      interval={0}
                      angle={
                        selectedPeriod === 'weekly'
                          ? -25
                          : 0
                      }
                      textAnchor={
                        selectedPeriod === 'weekly'
                          ? 'end'
                          : 'middle'
                      }
                      height={
                        selectedPeriod === 'weekly'
                          ? 65
                          : 45
                      }
                      tick={{
                        fill: '#64748b',
                        fontSize: 11,
                        fontWeight: 600
                      }}
                    />

                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tick={{
                        fill: '#94a3b8',
                        fontSize: 11
                      }}
                      tickFormatter={formatCompactCurrency}
                    />

                    <Tooltip
                      formatter={(value, name) => [
                        formatCurrency(value),
                        name
                      ]}
                      labelFormatter={(label, payload) => {
                        const item = payload?.[0]?.payload;

                        if (item?.subLabel) {
                          return `${label} (${item.subLabel})`;
                        }

                        return label;
                      }}
                      contentStyle={{
                        borderRadius: '16px',
                        border: '1px solid #e2e8f0',
                        boxShadow:
                          '0 12px 35px rgba(15,23,42,0.12)'
                      }}
                    />

                    <Legend
                      verticalAlign="top"
                      align="right"
                      wrapperStyle={{
                        fontSize: '12px',
                        paddingBottom: '25px'
                      }}
                    />

                    <Line
                      type="monotone"
                      dataKey="income"
                      name="Income"
                      stroke="#10b981"
                      strokeWidth={3}
                      dot={{
                        r: 4,
                        fill: '#10b981',
                        stroke: '#ffffff',
                        strokeWidth: 2
                      }}
                      activeDot={{ r: 7 }}
                    />

                    <Line
                      type="monotone"
                      dataKey="expense"
                      name="Expenses"
                      stroke="#f43f5e"
                      strokeWidth={3}
                      dot={{
                        r: 4,
                        fill: '#f43f5e',
                        stroke: '#ffffff',
                        strokeWidth: 2
                      }}
                      activeDot={{ r: 7 }}
                    />

                    <Line
                      type="monotone"
                      dataKey="savings"
                      name="Savings"
                      stroke="#6366f1"
                      strokeWidth={3}
                      dot={{
                        r: 4,
                        fill: '#6366f1',
                        stroke: '#ffffff',
                        strokeWidth: 2
                      }}
                      activeDot={{ r: 7 }}
                    />
                  </LineChart>
                )}
              </ResponsiveContainer>
            </div>
          ) : (
            <EmptyState message="No transaction data available for this period. Add transactions with valid dates to see the chart." />
          )}

          {/* PERIOD TABLE */}

          {periodData.length > 0 && (
            <div className="mt-6 overflow-hidden rounded-2xl border border-slate-200">
              <div className="border-b border-slate-200 bg-slate-50 px-4 py-3">
                <p className="text-sm font-black text-slate-800">
                  Period-wise details
                </p>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full min-w-[620px] text-left">
                  <thead className="bg-white">
                    <tr className="border-b border-slate-100 text-xs uppercase tracking-wide text-slate-400">
                      <th className="px-4 py-3 font-bold">
                        Period
                      </th>
                      <th className="px-4 py-3 font-bold">
                        Date Range
                      </th>
                      <th className="px-4 py-3 font-bold">
                        Income
                      </th>
                      <th className="px-4 py-3 font-bold">
                        Expenses
                      </th>
                      <th className="px-4 py-3 font-bold">
                        Savings
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {periodData.map((item, index) => (
                      <tr
                        key={`${item.name}-${index}`}
                        className="border-b border-slate-100 last:border-0 hover:bg-slate-50"
                      >
                        <td className="px-4 py-3 text-sm font-bold text-slate-800">
                          {item.name}
                        </td>

                        <td className="px-4 py-3 text-xs text-slate-500">
                          {item.subLabel || '—'}
                        </td>

                        <td className="px-4 py-3 text-sm font-bold text-emerald-600">
                          {formatCurrency(item.income)}
                        </td>

                        <td className="px-4 py-3 text-sm font-bold text-rose-600">
                          {formatCurrency(item.expense)}
                        </td>

                        <td
                          className={`px-4 py-3 text-sm font-bold ${
                            item.savings >= 0
                              ? 'text-indigo-600'
                              : 'text-rose-600'
                          }`}
                        >
                          {formatCurrency(item.savings)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </section>

        {/* EXPENSE DISTRIBUTION + TOP CATEGORIES */}

        <section className="grid grid-cols-1 gap-6 xl:grid-cols-[0.9fr_1.1fr]">
          {/* PIE CHART */}

          <div className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
            <SectionTitle
              eyebrow="Spending pulse"
              title="Expense Distribution"
              description="Where your money is going"
            />

            {categoryData.length > 0 ? (
              <>
                <div className="relative h-[280px]">
                  <ResponsiveContainer
                    width="100%"
                    height="100%"
                  >
                    <PieChart>
                      <Pie
                        data={categoryData}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        innerRadius={70}
                        outerRadius={105}
                        paddingAngle={4}
                        stroke="#ffffff"
                        strokeWidth={4}
                      >
                        {categoryData.map((item, index) => (
                          <Cell
                            key={`pie-${index}`}
                            fill={
                              COLORS[index % COLORS.length]
                            }
                          />
                        ))}
                      </Pie>

                      <Tooltip
                        formatter={(value) => [
                          formatCurrency(value),
                          'Spent'
                        ]}
                        contentStyle={{
                          borderRadius: '14px',
                          border: '1px solid #e2e8f0'
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                <div className="space-y-3">
                  {sortedCategories
                    .slice(0, 6)
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
                          className="flex items-center justify-between gap-3"
                        >
                          <div className="flex min-w-0 items-center gap-2">
                            <span
                              className="h-2.5 w-2.5 shrink-0 rounded-full"
                              style={{
                                backgroundColor:
                                  COLORS[
                                    index % COLORS.length
                                  ]
                              }}
                            />

                            <span className="truncate text-xs font-semibold text-slate-600">
                              {category.name}
                            </span>
                          </div>

                          <span className="shrink-0 text-xs font-bold text-slate-800">
                            {percentage.toFixed(1)}%
                          </span>
                        </div>
                      );
                    })}
                </div>
              </>
            ) : (
              <EmptyState message="No category data available." />
            )}
          </div>

          {/* TOP CATEGORIES */}

          <div className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
            <SectionTitle
              eyebrow="Category analysis"
              title="Top Spending Areas"
              description="Your highest expense categories"
            />

            {sortedCategories.length > 0 ? (
              <div className="space-y-5">
                {sortedCategories
                  .slice(0, 6)
                  .map((category, index) => {
                    const percentage =
                      summary.totalExpense > 0
                        ? (category.value /
                            summary.totalExpense) *
                          100
                        : 0;

                    return (
                      <div key={`${category.name}-${index}`}>
                        <div className="mb-2 flex items-center justify-between gap-3">
                          <div className="flex min-w-0 items-center gap-3">
                            <div
                              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-xs font-black text-white"
                              style={{
                                backgroundColor:
                                  COLORS[
                                    index % COLORS.length
                                  ]
                              }}
                            >
                              {index + 1}
                            </div>

                            <div className="min-w-0">
                              <p className="truncate text-sm font-bold text-slate-800">
                                {category.name}
                              </p>

                              <p className="text-xs text-slate-400">
                                {percentage.toFixed(1)}% of total
                              </p>
                            </div>
                          </div>

                          <p className="shrink-0 text-sm font-extrabold text-slate-800">
                            {formatCurrency(category.value)}
                          </p>
                        </div>

                        <div className="h-2.5 overflow-hidden rounded-full bg-slate-100">
                          <div
                            className="h-full rounded-full transition-all duration-700"
                            style={{
                              width: `${Math.min(
                                percentage,
                                100
                              )}%`,
                              backgroundColor:
                                COLORS[
                                  index % COLORS.length
                                ]
                            }}
                          />
                        </div>
                      </div>
                    );
                  })}
              </div>
            ) : (
              <EmptyState message="No spending categories available." />
            )}
          </div>
        </section>

        {/* HEALTH + INSIGHTS */}

        <section className="grid grid-cols-1 gap-6 xl:grid-cols-[0.7fr_1.3fr]">
          {/* FINANCIAL HEALTH */}

          <div className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
            <SectionTitle
              eyebrow="Financial health"
              title="Your Health Score"
              description="Based on income, expenses and savings"
            />

            <div className="flex justify-center">
              <div
                className="relative flex h-52 w-52 items-center justify-center rounded-full"
                style={{
                  background: `conic-gradient(
                    #10b981 ${
                      summary.healthScore * 3.6
                    }deg,
                    #e2e8f0 ${
                      summary.healthScore * 3.6
                    }deg
                  )`
                }}
              >
                <div className="flex h-40 w-40 flex-col items-center justify-center rounded-full bg-white">
                  <span className="text-5xl font-black text-slate-900">
                    {summary.healthScore}
                  </span>

                  <span className="mt-1 text-xs font-bold tracking-widest text-slate-400">
                    OUT OF 100
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-6 text-center">
              <HealthBadge score={summary.healthScore} />

              <p className="mt-3 text-lg font-black text-slate-800">
                {summary.healthScore >= 75
                  ? 'You are doing great!'
                  : summary.healthScore >= 50
                  ? 'There is room to improve'
                  : 'Your finances need attention'}
              </p>

              <p className="mt-2 text-sm leading-6 text-slate-500">
                {summary.healthScore >= 75
                  ? 'Your income and savings are well balanced.'
                  : 'Focus on reducing unnecessary expenses and saving consistently.'}
              </p>
            </div>
          </div>

          {/* INSIGHTS */}

          <div className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
            <SectionTitle
              eyebrow="Recommendations"
              title="Smart Financial Insights"
              description="Simple observations based on your financial data"
            />

            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              {insights.map((insight, index) => (
                <div
                  key={`${insight.title}-${index}`}
                  className={`rounded-2xl border p-5 ${insight.className}`}
                >
                  <div className="text-2xl">
                    {insight.icon}
                  </div>

                  <h3 className="mt-4 text-sm font-extrabold">
                    {insight.title}
                  </h3>

                  <p className="mt-2 text-sm leading-6 opacity-80">
                    {insight.text}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* PDF REPORT */}

        <section
          id="pdf-report"
          className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm"
        >
          <div className="bg-gradient-to-r from-[#312e81] to-[#6366f1] p-6 text-white sm:p-8">
            <div className="flex flex-col justify-between gap-5 md:flex-row md:items-center">
              <div>
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15 text-2xl">
                  📄
                </div>

                <h2 className="text-2xl font-black">
                  Generate Financial Report
                </h2>

                <p className="mt-2 max-w-xl text-sm text-indigo-100">
                  Select a date range and download your financial report as a PDF document.
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/10 px-5 py-4 text-sm text-indigo-100 backdrop-blur">
                Secure report generation
              </div>
            </div>
          </div>

          <div className="p-6 sm:p-8">
            <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
              <div>
                <label
                  htmlFor="startDate"
                  className="mb-2 block text-sm font-bold text-slate-700"
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
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-100"
                />
              </div>

              <div>
                <label
                  htmlFor="endDate"
                  className="mb-2 block text-sm font-bold text-slate-700"
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
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-100"
                />
              </div>

              <div className="flex items-end">
                <button
                  type="button"
                  onClick={handleDownloadReport}
                  disabled={reportLoading}
                  className="w-full rounded-xl bg-indigo-600 px-4 py-3 text-sm font-extrabold text-white shadow-lg shadow-indigo-200 transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {reportLoading
                    ? 'Generating Report...'
                    : 'Download PDF'}
                </button>
              </div>
            </div>

            {reportError && (
              <div className="mt-5 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">
                {reportError}
              </div>
            )}

            {reportSuccess && (
              <div className="mt-5 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">
                {reportSuccess}
              </div>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}