import api from './api';

/* --------------------------------------------------
   RESPONSE DATA HELPER
-------------------------------------------------- */

const extractData = (response) => {
  const responseData = response?.data;

  /*
    Supports responses like:

    1. { data: [...] }
    2. { data: { monthly: [], categories: [] } }
    3. [...]
    4. { monthly: [], categories: [] }
  */

  if (
    responseData &&
    typeof responseData === 'object' &&
    !Array.isArray(responseData) &&
    responseData.data !== undefined
  ) {
    return responseData.data;
  }

  return responseData ?? [];
};

/* --------------------------------------------------
   FINANCE SERVICE
-------------------------------------------------- */

export const financeService = {
  // ---------------------------------------------
  // WALLETS
  // ---------------------------------------------

  getWallets: async () => {
    const response = await api.get(
      '/api/v1/finance/wallets'
    );

    return extractData(response);
  },

  createWallet: async (walletData) => {
    const response = await api.post(
      '/api/v1/finance/wallets',
      {
        ...walletData,
        currency: 'INR',
      }
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

  // ---------------------------------------------
  // CATEGORIES
  // ---------------------------------------------

  getCategories: async () => {
    const response = await api.get(
      '/api/v1/finance/categories'
    );

    return extractData(response);
  },

  createCategory: async (categoryData) => {
    const response = await api.post(
      '/api/v1/finance/categories',
      categoryData
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

  // ---------------------------------------------
  // TRANSACTIONS
  // ---------------------------------------------

  getTransactions: async () => {
    const response = await api.get(
      '/api/v1/finance/transactions'
    );

    return extractData(response);
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

  // ---------------------------------------------
  // DASHBOARD
  // ---------------------------------------------

  getDashboardSummary: async () => {
    const response = await api.get(
      '/api/v1/finance/summary'
    );

    return extractData(response);
  },

  // ---------------------------------------------
  // BUDGETS
  // ---------------------------------------------

  getBudgets: async () => {
    const response = await api.get(
      '/api/v1/finance/budgets'
    );

    return extractData(response);
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

  // ---------------------------------------------
  // ANALYTICS
  // ---------------------------------------------

  getAnalytics: async () => {
    try {
      const response = await api.get(
        '/api/v1/finance/analytics'
      );

      const result = extractData(response);

      console.log('ANALYTICS API RESPONSE:', result);

      /*
        Always return an object for Analytics.jsx.
      */

      return {
        ...(result || {}),
        monthly: Array.isArray(result?.monthly)
          ? result.monthly
          : [],
        categories: Array.isArray(result?.categories)
          ? result.categories
          : [],
      };
    } catch (error) {
      console.error(
        'ANALYTICS API ERROR:',
        error?.response?.data || error.message
      );

      /*
        Throw the error instead of silently returning
        empty arrays. This allows Analytics.jsx to show
        the actual error.
      */

      throw error;
    }
  },
};