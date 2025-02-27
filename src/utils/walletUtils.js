import { Image } from 'react-native';
import { api } from '../services/api';

/**
 * 处理钱包数据，确保头像URL格式正确
 * @param {Object} wallet - 钱包对象
 * @returns {Object} - 处理后的钱包对象
 */
export const processWalletData = (wallet) => {
  if (!wallet) return wallet;
  
  const processedWallet = { ...wallet };
  
  // 检查avatar是否为相对路径，如果是则添加baseURL前缀
  if (processedWallet.avatar && !processedWallet.avatar.startsWith('http')) {
    processedWallet.avatar = `http://192.168.3.16:8000${processedWallet.avatar}`;
  }
  
  return processedWallet;
};

/**
 * 处理钱包列表数据
 * @param {Array} wallets - 钱包列表
 * @returns {Array} - 处理后的钱包列表
 */
export const processWalletList = (wallets) => {
  if (!Array.isArray(wallets)) return [];
  return wallets.map(processWalletData);
};

/**
 * 预加载钱包头像
 * @param {Object} wallet - 钱包对象
 */
export const preloadWalletAvatar = async (wallet) => {
  if (!wallet?.avatar) return;
  
  try {
    await Image.prefetch(wallet.avatar);
  } catch (err) {
    console.warn(`Failed to prefetch wallet avatar for ${wallet.id}:`, err);
  }
};