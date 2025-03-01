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

// 修改响应拦截器
instance.interceptors.response.use(
  response => response,
  error => {
    console.log('API Error Response:', error.response?.data);  // 添加日志
    
    if (error.response) {
      // 直接返回服务器的错误响应
      return Promise.reject(error.response.data || {
        status: 'error',
        message: 'An error occurred'
      });
    } else if (error.request) {
      return Promise.reject({
        status: 'error',
        message: 'Network error, please check your connection'
      });
    } else {
      return Promise.reject({
        status: 'error',
        message: 'Request failed'
      });
    }
  }
);

// 修改链路径配置
const CHAIN_PATHS = {
  sol: 'solana',
  solana: 'solana',
  eth: 'evm',
  evm: 'evm',
  base: 'evm',  // 添加 BASE 链映射
  BASE: 'evm'   // 添加大写映射
};

// 修改获取链路径的辅助函数
const getChainPath = (chain) => {
  const chainKey = chain?.toLowerCase();
  const path = CHAIN_PATHS[chainKey];
  if (!path) {
    console.error('Unsupported chain:', chain);
    return 'evm';  // 默认返回 evm
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
      console.error('Error setting password API:', error);
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

  async verifyMnemonic(deviceId, chain, mnemonic, chainType) {
    const response = await instance.post('/wallets/verify_mnemonic/', {
      device_id: deviceId,
      chain,
      mnemonic
    });
    
    if (!response.data) {
      throw new Error('Failed to verify mnemonic');
    }
    
    return response.data;
  },

  async getWallets(deviceId) {
    try {
      console.log('[API] Fetching wallets for device:', deviceId);
      const response = await instance.get(`/wallets/?device_id=${deviceId}`);
      console.log('[API] Wallets fetched successfully');
      return response.data;
    } catch (error) {
      console.error('[API] Failed to get wallets:', error);
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
      // 不再直接返回错误对象，而是返回标准格式的响应
      return {
        status: 'error',
        message: error.response?.data?.message || 'Incorrect password'
      };
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
      // 返回标准格式的错误响应
      return {
        status: 'error',
        message: error.response?.data?.message || '网络连接错误，请检查网络状态',
        hasPassword: false
      };
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
      console.log(`[API] Fetching tokens for wallet ${walletId} on chain ${chain}`);
      const chainPath = getChainPath(chain);
      const response = await instance.get(`/${chainPath}/wallets/${walletId}/tokens/?device_id=${deviceId}`);
      console.log('[API] Tokens fetched successfully');
      return response.data;
    } catch (error) {
      console.error('[API] Failed to fetch tokens:', error);
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
      const response = await instance.post(`/wallets/${walletId}/show_private_key/`, {
        device_id: deviceId,
        payment_password: password
      });
      return response.data;
    } catch (error) {
      // 不再抛出错误，而是返回错误状态对象
      return {
        status: 'error',
        message: error.response?.data?.message || 'Incorrect password'
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

  getWalletTokens: async (deviceId, walletId, chain) => {
    const chainPath = getChainPath(chain);
    const response = await instance.get(
      `/${chainPath}/wallets/${walletId}/tokens/`,
      {
        params: { device_id: deviceId }
      }
    );
    
    if (!response.data) {
      throw new Error('Failed to get wallet tokens');
    }
    
    return response.data;
  },

  async importPrivateKey(deviceId, chain, privateKey, password) {
    try {
      console.log('[API] Importing private key for chain:', chain);
      const response = await instance.post('/wallets/import_private_key/', {
        device_id: deviceId,
        chain,
        private_key: privateKey,
        payment_password: password
      });
      console.log('[API] Private key imported successfully');
      return response.data;
    } catch (error) {
      console.error('[API] Import private key error:', error);
      return error;
    }
  },

  async sendEvmTransaction(deviceId, params) {
    try {
      const response = await instance.post('/evm/transactions/send/', {
        device_id: deviceId,
        from_address: params.fromAddress,
        to_address: params.toAddress,
        amount: params.amount,
        token: params.token,
        payment_password: params.password,
        gas_limit: params.gas_limit,
        gas_price: params.gas_price,
        max_priority_fee: params.max_priority_fee,
        max_fee: params.max_fee
      });
      return response.data;
    } catch (error) {
      console.error('[API] Send EVM transaction error:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to send transaction'
      };
    }
  },

  async sendSolanaTransaction(deviceId, params) {
    try {
      const response = await instance.post('/solana/transactions/send/', {
        device_id: deviceId,
        from_address: params.fromAddress,
        to_address: params.toAddress,
        amount: params.amount,
        token_address: params.token_address,
        payment_password: params.payment_password
      });
      return response.data;
    } catch (error) {
      console.error('[API] Send Solana transaction error:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to send transaction'
      };
    }
  },
};

export const setPaymentPassword = async (deviceId, password) => {
    try {
        const response = await fetch(`${BASE_URL}/wallets/set_password/`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                device_id: deviceId,
                payment_password: password,
            }),
        });

        const data = await response.json();
        return data; // 确保返回的数据包含 status 和 message
    } catch (error) {
        console.error('Error saving password:', error);
        throw new Error('Failed to save password');
    }
};

export const selectChain = async (deviceId, selectedChain) => {
    const response = await fetch(`${BASE_URL}/select-chain`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            device_id: deviceId,
            chain: selectedChain,
        }),
    });

    if (!response.ok) {
        const errorResponse = await response.json();
        throw new Error(`API Error Response: ${JSON.stringify(errorResponse)}`);
    }

    return await response.json();
};