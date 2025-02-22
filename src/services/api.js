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
      // 服务器返回错误
      console.error('Server Error:', error.response.data);
      return Promise.reject(error.response.data);
    } else if (error.request) {
      // 请求发出但没有收到响应
      console.error('Network Error:', error.request);
      return Promise.reject({ message: 'Network error, please check your connection' });
    } else {
      // 请求配置出错
      console.error('Request Error:', error.message);
      return Promise.reject({ message: error.message });
    }
  }
);

export const api = {
  async setPaymentPassword(deviceId, password, confirmPassword) {
    try {
      const response = await instance.post('/wallets/set_password/', {
        device_id: deviceId,
        payment_password: password,
        payment_password_confirm: confirmPassword
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
      throw error;
    }
  },

  async getWallets(deviceId) {
    try {
      const response = await instance.get(`/wallets/?device_id=${deviceId}`);
      return response.data;
    } catch (error) {
      throw error;
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
      // 将服务器返回的错误信息传递出去
      if (error.response?.data) {
        throw error.response.data;
      }
      throw error;
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
      if (error.response?.data) {
        throw error.response.data;
      }
      throw error;
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
      // 直接返回 response.data，让调用方处理具体的验证结果
      return response.data;
    } catch (error) {
      if (error.response?.data) {
        throw error.response.data;
      }
      throw error;
    }
  },

  async getTokens(deviceId, chain, walletId) {
    try {
      // 根据链类型选择不同的路径
      const chainPath = chain === 'sol' ? 'solana' : 'evm';
      const response = await instance.get(`/${chainPath}/wallets/${walletId}/tokens/?device_id=${deviceId}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  async getTokenTransfers(deviceId, chain, walletId, page = 1, pageSize = 20) {
    try {
      const chainPath = chain === 'sol' ? 'solana' : 'evm';
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
      const chainPath = chain === 'sol' ? 'solana' : 'evm';
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
      const chainPath = chain === 'sol' ? 'solana' : 'evm';
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
    const chainPath = chain === 'sol' ? 'solana' : 'evm';
    const response = await instance.post(
      `/${chainPath}/wallets/${walletId}/tokens/toggle-visibility/?device_id=${deviceId}`,
      {
        token_address: tokenAddress,
      }
    );
    return response.data;
  },

  async getTokensManagement(walletId, deviceId, chain) {
    const chainPath = chain === 'sol' ? 'solana' : 'evm';
    const response = await instance.get(`/${chainPath}/wallets/${walletId}/tokens/manage/?device_id=${deviceId}`);
    return response.data;
  },

  toggleTokenVisibility: async (walletId, tokenAddress, deviceId, chain) => {
    const chainPath = chain === 'sol' ? 'solana' : 'evm';
    const response = await instance.post(
      `/${chainPath}/wallets/${walletId}/tokens/toggle-visibility/?device_id=${deviceId}`,
      {
        token_address: tokenAddress, // 确保请求体包含 token_address
      }
    );
    return response.data;
  },
}; 