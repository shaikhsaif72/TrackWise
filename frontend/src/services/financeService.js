import api from './api';

// Helper to extract data envelopes safely
const extractData = (res) => {
  return res.data?.data || res.data || [];
};

export const financeService = {
  // ==================================================
  // WALLETS
  // ==================================================

  getWallets: async () => {
    return extractData(
      await api.get('/api/v1/finance/wallets')
    );
  },

  createWallet: async (walletData) => {
    const response = await api.post(
      '/api/v1/finance/wallets',
      walletData
    );

    return extractData(response);
  },

  updateWallet: async (walletId, walletData) => {
    const response = await api.patch(
      `/api/v1/finance/wallets/${walletId}`,
      walletData
    );

    return extractData(response);
  },

  deleteWallet: async (walletId) => {
    const response = await api.delete(
      `/api/v1/finance/wallets/${walletId}`
    );

    return extractData(response);
  },

  // ==================================================
  // CATEGORIES
  // ==================================================

  getCategories: async () => {
    return extractData(
      await api.get('/api/v1/finance/categories')
    );
  },

  createCategory: async (categoryData) => {
    const response = await api.post(
      '/api/v1/finance/categories',
      categoryData
    );

    return extractData(response);
  },

  getCategory: async (categoryId) => {
    const response = await api.get(
      `/api/v1/finance/categories/${categoryId}`
    );

    return extractData(response);
  },

  updateCategory: async (categoryId, categoryData) => {
    const response = await api.patch(
      `/api/v1/finance/categories/${categoryId}`,
      categoryData
    );

    return extractData(response);
  },

  deleteCategory: async (categoryId) => {
    const response = await api.delete(
      `/api/v1/finance/categories/${categoryId}`
    );

    return extractData(response);
  },

  // ==================================================
  // DASHBOARD SUMMARY
  // ==================================================

  getDashboardSummary: async () => {
    try {
      return extractData(
        await api.get('/api/v1/finance/summary')
      );
    } catch (err) {
      console.warn(
        'Dashboard summary endpoint missing, using demo data'
      );

      return {
        totalBalance: "12500.50",
        income: "4500.00",
        expenses: "2100.00",
        savings: "2400.00",
        isDemo: true
      };
    }
  },

  // ==================================================
  // ANALYTICS
  // ==================================================

  getAnalytics: async () => {
    try {
      return extractData(
        await api.get('/api/v1/finance/analytics')
      );
    } catch (err) {
      console.warn(
        'Analytics endpoint missing, using demo data'
      );

      return {
        monthly: [
          {
            name: 'Jan',
            income: 4000,
            expense: 2400
          },
          {
            name: 'Feb',
            income: 3000,
            expense: 1398
          },
          {
            name: 'Mar',
            income: 2000,
            expense: 9800
          },
          {
            name: 'Apr',
            income: 2780,
            expense: 3908
          }
        ],
        categories: [
          {
            name: 'Food',
            value: 400
          },
          {
            name: 'Rent',
            value: 1200
          },
          {
            name: 'Transport',
            value: 300
          }
        ],
        isDemo: true
      };
    }
  },

  // ==================================================
  // TRANSACTIONS
  // ==================================================

  getTransactions: async () => {
    return extractData(
      await api.get('/api/v1/finance/transactions')
    );
  },

  createTransaction: async (transactionData) => {
    const response = await api.post(
      '/api/v1/finance/transactions',
      transactionData
    );

    return extractData(response);
  },

  updateTransaction: async (
    transactionId,
    transactionData
  ) => {
    const response = await api.patch(
      `/api/v1/finance/transactions/${transactionId}`,
      transactionData
    );

    return extractData(response);
  },

  deleteTransaction: async (transactionId) => {
    const response = await api.delete(
      `/api/v1/finance/transactions/${transactionId}`
    );

    return extractData(response);
  },

  // ==================================================
  // BUDGETS
  // ==================================================

  getBudgets: async () => {
    return extractData(
      await api.get('/api/v1/finance/budgets')
    );
  },

  createBudget: async (budgetData) => {
    const response = await api.post(
      '/api/v1/finance/budgets',
      budgetData
    );

    return extractData(response);
  },

  updateBudget: async (budgetId, budgetData) => {
    const response = await api.patch(
      `/api/v1/finance/budgets/${budgetId}`,
      budgetData
    );

    return extractData(response);
  },

  deleteBudget: async (budgetId) => {
    const response = await api.delete(
      `/api/v1/finance/budgets/${budgetId}`
    );

    return extractData(response);
  },

  // ==================================================
  // PDF FINANCIAL REPORT
  // ==================================================

  downloadReportPdf: async (startDate, endDate) => {
    const response = await api.get(
      '/api/v1/finance/reports/transactions/pdf',
      {
        params: {
          start_date: startDate,
          end_date: endDate
        },
        responseType: 'blob'
      }
    );

    return response.data;
  }
};

export default financeService;