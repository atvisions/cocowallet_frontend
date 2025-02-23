import axios from 'axios';
import { DeviceManager } from '../utils/device';

// 确保 BASE_URL 是正确的
const BASE_URL = 'http://192.168.3.16:8000/api/v1';

// 创建 axios 实例
const instance = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  }
});

// 响应拦截器
instance.interceptors.response.use(
  response => response,
  error => {
    // 更详细的错误处理
    if (error.response) {
      // 服务器返回错误，但不直接显示错误信息
      return Promise.reject({
        status: 'error',
        message: 'An error occurred'  // 使用通用的英文错误信息
      });
    } else if (error.request) {
      // 请求发出但没有收到响应
      return Promise.reject({
        status: 'error',
        message: 'Network error, please check your connection'
      });
    } else {
      // 请求配置出错
      return Promise.reject({
        status: 'error',
        message: 'Request failed'
      });
    }
  }
);

// 添加链路径配置
const CHAIN_PATHS = {
  sol: 'solana',
  solana: 'solana',
  eth: 'evm',
  evm: 'evm'
};

// 获取链路径的辅助函数
const getChainPath = (chain) => {
  const chainKey = chain?.toLowerCase();
  const path = CHAIN_PATHS[chainKey];
  if (!path) {
    console.error('Unsupported chain:', chain);
  }
  return path;
};

// 统一的错误处理函数
const handleApiError = (error, defaultMessage) => {
  if (error.status === 'error') {
    return error;  // 如果已经是格式化的错误，直接返回
  }
  return {
    status: 'error',
    message: defaultMessage
  };
};

export const api = {
  async setPaymentPassword(deviceId, password, confirmPassword, useBiometric = false) {
    try {
      const response = await instance.post('/wallets/set_password/', {
        device_id: deviceId,
        payment_password: password,
        payment_password_confirm: confirmPassword,
        use_biometric: useBiometric
      });
      // 设置密码成功后，更新本地状态
      await DeviceManager.setPaymentPasswordStatus(true);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  async getSupportedChains() {
    try {
      const response = await instance.get('/wallets/get_supported_chains/');
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  async selectChain(deviceId, chain) {
    try {
      const response = await instance.post('/wallets/select_chain/', {
        device_id: deviceId,
        chain
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  async verifyMnemonic(deviceId, chain, mnemonic) {
    try {
      const response = await instance.post('/wallets/verify_mnemonic/', {
        device_id: deviceId,
        chain,
        mnemonic
      });
      return response.data;
    } catch (error) {
      return handleApiError(error, 'Failed to verify mnemonic');
    }
  },

  async getWallets(deviceId) {
    try {
      const response = await instance.get(`/wallets/?device_id=${deviceId}`);
      return response.data;
    } catch (error) {
      return handleApiError(error, 'Failed to get wallets');
    }
  },

  async renameWallet(walletId, deviceId, newName) {
    try {
      const response = await instance.post(`/wallets/${walletId}/rename_wallet/`, {
        device_id: deviceId,
        new_name: newName
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  async deleteWallet(walletId, deviceId, paymentPassword) {
    try {
      const response = await instance.post(`/wallets/${walletId}/delete_wallet/`, {
        device_id: deviceId,
        payment_password: paymentPassword
      });
      return response.data;
    } catch (error) {
      return handleApiError(error, 'Failed to delete wallet');
    }
  },

  async changePaymentPassword(deviceId, oldPassword, newPassword, confirmPassword) {
    try {
      const response = await instance.post('/wallets/change_password/', {
        device_id: deviceId,
        old_password: oldPassword,
        new_password: newPassword,
        confirm_password: confirmPassword
      });
      return response.data;
    } catch (error) {
      // 不再抛出错误，而是返回错误状态
      return {
        status: 'error',
        message: error.response?.data?.message || 'Failed to change password'
      };
    }
  },

  async checkPaymentPasswordStatus(deviceId) {
    try {
      const response = await instance.get(`/wallets/payment_password/status/${deviceId}/`);
      return response.data?.data?.has_payment_password || false;
    } catch (error) {
      console.error('Check payment password status error:', error);
      return false;
    }
  },

  async verifyPaymentPassword(deviceId, password) {
    try {
      const response = await instance.post('/wallets/verify_password/', {
        device_id: deviceId,
        payment_password: password
      });
      return response.data;
    } catch (error) {
      // 不再抛出错误，而是返回错误状态
      return {
        status: 'error',
        message: error.response?.data?.message || 'Current password is incorrect'
      };
    }
  },

  async getTokens(deviceId, chain, walletId) {
    try {
      // 根据链类型选择不同的路径
      const chainPath = getChainPath(chain);
      const response = await instance.get(`/${chainPath}/wallets/${walletId}/tokens/?device_id=${deviceId}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  async getTokenTransfers(deviceId, chain, walletId, page = 1, pageSize = 20) {
    try {
      const chainPath = getChainPath(chain);
      const response = await instance.get(
        `/${chainPath}/wallets/${walletId}/token-transfers/`,
        {
          params: {
            device_id: deviceId,
            page,
            page_size: pageSize,
          }
        }
      );
      return response.data;
    } catch (error) {
      console.error('API Error - getTokenTransfers:', error);
      throw error;
    }
  },

  async getNFTCollections(deviceId, chain, walletId) {
    try {
      const chainPath = getChainPath(chain);
      const response = await instance.get(
        `/${chainPath}/nfts/collections/${walletId}/`,
        {
          params: {
            device_id: deviceId,
          }
        }
      );
      return response.data;
    } catch (error) {
      console.error('API Error - getNFTCollections:', error);
      throw error;
    }
  },

  async getNFTsByCollection(deviceId, chain, walletId, collectionAddress) {
    try {
      const chainPath = getChainPath(chain);
      let url;
      
      if (chain === 'sol') {
        url = `/${chainPath}/nfts/collections/${walletId}/${collectionAddress}/nfts/`;
      } else {
        url = `/${chainPath}/nfts/${walletId}/list/?device_id=${deviceId}&collection_address=${collectionAddress}`;
      }
      
      console.log('Making NFT collection request:', {
        deviceId,
        chain,
        walletId,
        collectionAddress,
        url
      });

      if (chain === 'sol') {
        const response = await instance.get(url, {
          params: {
            device_id: deviceId
          }
        });
        return response.data;
      } else {
        const response = await instance.get(url);
        return response.data;
      }
    } catch (error) {
      console.error('Error fetching NFTs:', {
        error,
        deviceId,
        chain,
        walletId,
        collectionAddress
      });
      throw error;
    }
  },

  toggleTokenVisibility: async (walletId, tokenAddress, deviceId, chain) => {
    try {
      const chainPath = getChainPath(chain);
      if (!chainPath) {
        console.error('Invalid chain path for:', chain);
        return null;
      }

      console.log('Toggle visibility request:', {
        chainPath,
        walletId,
        tokenAddress,
        deviceId
      });

      const response = await instance.post(
        `/${chainPath}/wallets/${walletId}/tokens/toggle-visibility/`,
        {
          token_address: tokenAddress
        },
        {
          params: {
            device_id: deviceId
          }
        }
      );

      return response.data;
    } catch (error) {
      console.error('Toggle visibility API error:', error);
      throw error;
    }
  },

  getTokensManagement: async (walletId, deviceId, chain) => {
    const chainPath = getChainPath(chain);
    if (!chainPath) return null;
    
    const response = await instance.get(`/${chainPath}/wallets/${walletId}/tokens/manage/?device_id=${deviceId}`);
    return response.data;
  },

  async getPrivateKey(walletId, deviceId, password) {
    try {
      const response = await instance.post(`/wallets/${walletId}/private_key/`, {
        device_id: deviceId,
        payment_password: password
      });
      return response.data;
    } catch (error) {
      return {
        status: 'error',
        message: error.response?.data?.message || 'Failed to get private key'
      };
    }
  },

  getPrivateKeyWithBiometric: async (walletId, deviceId) => {
    try {
      const response = await instance.post(
        `/wallets/${walletId}/show_private_key/biometric/`,
        {
          device_id: deviceId,
        }
      );

      if (response.data?.status === 'success') {
        return response.data.data;
      } else {
        throw new Error(response.data?.message || 'Failed to get private key');
      }
    } catch (error) {
      console.error('Get private key with biometric error:', error);
      throw error;
    }
  },

  enableBiometric: async (deviceId, paymentPassword) => {
    try {
      const response = await instance.post('/wallets/biometric/enable/', {
        device_id: deviceId,
        payment_password: paymentPassword
      });

      if (response.data?.code === 200) {
        return response.data.data;
      } else {
        throw new Error(response.data?.message || 'Failed to enable biometric');
      }
    } catch (error) {
      console.error('Enable biometric error:', error);
      throw error;
    }
  },

  disableBiometric: async (deviceId) => {
    try {
      const response = await instance.post('/wallets/biometric/disable/', {
        device_id: deviceId
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  },
}; 