/**
 * 格式化地址显示
 * @param {string} address - 完整地址
 * @returns {string} - 格式化后的地址
 */
export const formatAddress = (address) => {
  if (!address) return '';
  if (address.length <= 12) return address;
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
};

/**
 * 格式化金额显示
 * @param {string|number} amount - 金额
 * @param {number} decimals - 小数位数
 * @returns {string} - 格式化后的金额
 */
export const formatAmount = (amount, decimals = 4) => {
  if (!amount) return '0';
  const num = parseFloat(amount);
  if (isNaN(num)) return '0';
  
  if (num >= 1000000) {
    return num.toLocaleString('en-US', { maximumFractionDigits: 2 });
  }
  return num.toFixed(Math.min(decimals, 8));
};

/**
 * 格式化 USD 价值显示
 * @param {string|number} value - USD 价值
 * @returns {string} - 格式化后的 USD 价值
 */
export const formatUSDValue = (value) => {
  if (!value) return '$0.00';
  const num = parseFloat(value);
  if (isNaN(num)) return '$0.00';
  return `$${num.toFixed(2)}`;
}; 