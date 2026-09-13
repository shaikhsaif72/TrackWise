// ---------------------------------------------
// FORMAT CURRENCY - INR
// ---------------------------------------------
export const formatCurrency = (amount) => {
  const numericAmount = Number(amount || 0);

  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(numericAmount);
};

// ---------------------------------------------
// FORMAT DATE
// ---------------------------------------------
export const formatDate = (dateValue) => {
  if (!dateValue) {
    return '-';
  }

  const date = new Date(dateValue);

  if (Number.isNaN(date.getTime())) {
    return '-';
  }

  return date.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });
};