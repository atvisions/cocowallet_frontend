import axios from 'axios';
import { DeviceManager } from '../utils/device';
import { logger } from '../utils/logger';

// 确保 BASE_URL 是正确的
const BASE_URL = 'http://192.168.3.16:8000/api/v1';

// 创建 axios 实例
const instance = axios.create({
  baseURL: BASE_URL,
  timeout: 60000,  // 增加超时时间到60秒
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
            page_size: pageSize
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
    try {
      const response = await instance.get(
        `/${chainPath}/wallets/${walletId}/tokens/manage/`,
        {
          params: { device_id: deviceId }
        }
      );
      
      console.log('API getTokensManagement response:', response.data);
      
      return {
        status: 'success',
        data: response.data
      };
    } catch (error) {
      console.error('API getTokensManagement error:', error);
      throw error;
    }
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

  async getWalletTokens(deviceId, walletId, chain, signal) {
    try {
      const chainPath = chain.toLowerCase() === 'sol' ? 'solana' : 'evm';
      const url = `${BASE_URL}/${chainPath}/wallets/${walletId}/tokens/`;
      
      console.log('发送请求:', {
        url,
        deviceId,
        walletId,
        chain
      });

      const response = await axios.get(url, {
        params: {
          device_id: deviceId
        },
        headers: {
          'Device-ID': deviceId
        },
        signal
      });
      
      console.log('收到响应:', {
        status: response.status,
        data: response.data,
        walletId,
        chain
      });
      
      return response.data;
    } catch (error) {
      // 打印完整的错误信息
      console.error('API 请求失败:', {
        walletId,
        chain,
        deviceId,
        error: error.message,
        status: error.response?.status,
        data: error.response?.data,  // 添加响应数据
        url: error.config?.url,
        headers: error.config?.headers,  // 添加请求头信息
        params: error.config?.params     // 添加请求参数
      });
      throw error;
    }
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

  async sendEvmTransaction(walletId, params) {
    try {
      console.log('Sending EVM transaction:', {
        walletId,
        params
      });
      
      // 确保params中包含device_id
      if (!params.device_id) {
        throw new Error('缺少device_id参数');
      }
      
      const response = await instance.post(`/evm/wallets/${walletId}/transfer/`, {
        device_id: params.device_id,
        to_address: params.to_address,
        amount: params.amount,
        payment_password: params.payment_password,
        token_address: params.token === 'native' ? null : params.token,
        gas_limit: params.gas_limit,
        gas_price: params.gas_price,
        max_priority_fee: params.max_priority_fee,
        max_fee: params.max_fee
      });
      
      return response.data;
    } catch (error) {
      console.log('API Error Response:', error.response?.data);
      throw error.response?.data || error;
    }
  },

  async getTransactionStatus(deviceId, txHash, walletId) {
    try {
      console.log('Requesting transaction status:', {
        deviceId,
        txHash,
        walletId
      });

      const response = await instance.get(
        `/solana/wallets/${walletId}/transaction-status/`,
        {
          params: {
            device_id: deviceId,
            tx_hash: txHash
          }
        }
      );

      console.log('Transaction status response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Transaction status error:', error);
      if (error.response?.status === 404) {
        return {
          status: 'pending',
          message: '交易确认中，请稍后再试'
        };
      }
      return {
        status: 'error',
        message: '网络错误，请检查网络连接'
      };
    }
  },

  async getTokenDetails(deviceId, walletId, symbol) {
    try {
      const response = await instance.get(
        `/solana/wallets/${walletId}/tokens/${symbol}/detail`,
        {
          params: {
            device_id: deviceId
          }
        }
      );
      
      if (response.data?.status === 'success') {
        return {
          status: 'success',
          data: response.data.data
        };
      } else {
        return {
          status: 'error',
          message: response.data?.message || '获取代币详情失败'
        };
      }
    } catch (error) {
      console.error('获取代币详情失败:', error);
      return {
        status: 'error',
        message: error.response?.data?.message || '获取代币详情失败'
      };
    }
  },

  async getTokenDecimals(deviceId, walletId, tokenAddress) {
    try {
      const response = await this.getTokenDetails(deviceId, walletId, tokenAddress);
      return response.status === 'success' ? response.data.decimals : null;
    } catch (error) {
      console.error('获取代币精度失败:', error);
      return null;
    }
  },

  async sendSolanaTransaction(walletId, params) {
    try {
      const response = await instance.post(
        `/solana/wallets/${walletId}/transfer/`,
        {
          ...params,
          // 确保原生 SOL 转账时不传递 token_address
          ...(params.is_native ? {} : { token_address: params.token_address })
        }
      );
      return response.data;
    } catch (error) {
      console.error('Solana transaction error:', error);
      throw error;
    }
  },

  async getSolanaTokenDetail(deviceId, walletId, tokenAddress) {
    try {
      const response = await instance.get(
        `/solana/wallets/${walletId}/tokens/SOL/${tokenAddress}/detail`,
        {
          params: {
            device_id: deviceId
          }
        }
      );
      return response.data;
    } catch (error) {
      console.error('获取代币详情失败:', error);
      throw error;
    }
  },

  async getTransactionHistory(deviceId, walletId, chain, page = 1, pageSize = 20) {
    try {
      const chainPath = getChainPath(chain);
      console.log('[API] Fetching transaction history:', {
        chainPath,
        walletId,
        deviceId,
        page,
        pageSize
      });

      const response = await instance.get(
        `/${chainPath}/wallets/${walletId}/token-transfers/`,
        {
          params: {
            device_id: deviceId,
            page,
            page_size: pageSize
          }
        }
      );

      if (response.data?.status === 'success') {
        return {
          status: 'success',
          data: {
            transactions: response.data.data?.transfers || [],
            total: response.data.data?.total || 0,
            page_size: pageSize
          }
        };
      } else {
        return {
          status: 'error',
          message: response.data?.message || '获取交易记录失败'
        };
      }
    } catch (error) {
      console.error('[API] Transaction history error:', error);
      return {
        status: 'error',
        message: error.response?.data?.message || '网络连接错误，请检查网络状态'
      };
    }
  },

  getRecommendedTokens: async (deviceId, chain, chainPath) => {
    try {
      const response = await instance.get(
        `/${chainPath}/wallets/recommended-tokens/?chain=${chain.toUpperCase()}`
      );
      return response.data;
    } catch (error) {
      console.log('API Error Response:', error.response?.data);
      return { status: 'success', data: { tokens: [] } }; // 返回空数组而不是抛出错误
    }
  },

  async getTokenDetail(deviceId, walletId, symbol, tokenAddress) {
    try {
      const response = await instance.get(
        `/solana/wallets/${walletId}/tokens/${symbol}/${tokenAddress}/detail`,
        {
          params: { device_id: deviceId }
        }
      );
      return response.data;
    } catch (error) {
      console.error('获取代币详情失败:', error);
      throw error;
    }
  },

  /**
   * 获取代币K线数据
   * @param {string} deviceId - 设备ID
   * @param {string} walletId - 钱包ID
   * @param {string} tokenAddress - 代币地址
   * @param {Object} params - 查询参数
   * @param {string} params.timeframe - 时间周期 (1h/4h/1d/1w)
   * @param {string} [params.from_date] - 开始日期 (YYYY-MM-DD)
   * @param {string} [params.to_date] - 结束日期 (YYYY-MM-DD)
   * @returns {Promise<Object>} K线数据
   */
  async getTokenOHLCV(deviceId, walletId, tokenAddress, params) {
    try {
      const queryParams = new URLSearchParams({
        device_id: deviceId,
        timeframe: params.timeframe
      });

      if (params.from_date) {
        queryParams.append('from_date', params.from_date);
      }
      if (params.to_date) {
        queryParams.append('to_date', params.to_date);
      }

      const response = await instance.get(
        `/solana/wallets/${walletId}/tokens/${tokenAddress}/ohlcv/?${queryParams.toString()}`
      );

      return response.data;
    } catch (error) {
      return {
        status: 'error',
        data: { ohlcv: [] }
      };
    }
  },

  // Solana Swap 相关接口
  async getSolanaSwapTokens(deviceId, walletId) {
    try {
      const response = await instance.get(
        `/solana/wallets/${walletId}/swap/tokens`,
        {
          params: {
            device_id: deviceId
          }
        }
      );
      return response.data;
    } catch (error) {
      console.error('获取Swap代币列表失败:', error);
      throw error;
    }
  },

  async getSolanaTokenPrices(deviceId, walletId, tokenAddresses) {
    try {
      const response = await instance.get(
        `/solana/wallets/${walletId}/swap/prices`,
        {
          params: {
            device_id: deviceId,
            token_addresses: Array.isArray(tokenAddresses) ? tokenAddresses.join(',') : tokenAddresses
          }
        }
      );
      return response.data;
    } catch (error) {
      console.error('获取代币价格失败:', error);
      return {
        status: 'error',
        data: { prices: {} }
      };
    }
  },

  async getSolanaSwapQuote(deviceId, walletId, params) {
    try {
      if (!deviceId || !walletId || !params.from_token || !params.to_token || !params.amount) {
        throw {
          status: 'error',
          code: 'MISSING_PARAMS',
          message: '缺少必要参数',
          details: { deviceId, walletId, params }
        };
      }

      console.log('获取兑换报价 - 请求参数:', {
        deviceId,
        walletId,
        params,
        url: `/solana/wallets/${walletId}/swap/quote`
      });
      
      const response = await instance.get(
        `/solana/wallets/${walletId}/swap/quote`,
        {
          params: {
            device_id: deviceId,
            from_token: params.from_token,
            to_token: params.to_token,
            amount: params.amount,
            slippage: params.slippage || '0.5'
          }
        }
      );

      console.log('获取兑换报价 - 原始响应:', response.data);
      
      if (response.data.status === 'success') {
        const { data } = response.data;
        return {
          status: 'success',
          data: {
            ...data,
            estimated_amount: data.to_token.amount,
            rate: (Number(data.to_token.amount) / Number(data.from_token.amount)).toString()
          }
        };
      } else {
        console.error('获取兑换报价 - API 返回错误:', response.data);
        throw response.data;
      }
    } catch (error) {
      console.error('获取兑换报价 - 捕获到错误:', {
        error,
        errorResponse: error.response?.data,
        errorStatus: error.response?.status,
        errorMessage: error.message
      });
      
      // 如果是网络错误或服务器错误，返回更友好的错误信息
      if (error.response?.status === 404) {
        throw {
          status: 'error',
          code: 'API_NOT_FOUND',
          message: '兑换服务暂时不可用，请稍后再试'
        };
      } else if (error.response?.status >= 500) {
        throw {
          status: 'error',
          code: 'SERVER_ERROR',
          message: '服务器暂时无法处理请求，请稍后再试'
        };
      }
      
      throw error?.response?.data || error;
    }
  },

  async estimateSolanaSwapFees(deviceId, walletId, params) {
    try {
      if (!deviceId || !walletId || !params.from_token || !params.to_token || !params.amount) {
        throw {
          status: 'error',
          code: 'MISSING_PARAMS',
          message: '缺少必要参数',
          details: { deviceId, walletId, params }
        };
      }

      console.log('估算费用参数:', {
        deviceId,
        walletId,
        params
      });

      const response = await instance.get(
        `/solana/wallets/${walletId}/swap/estimate_fees`,
        {
          params: {
            device_id: deviceId,
            from_token: params.from_token,
            to_token: params.to_token,
            amount: params.amount
          }
        }
      );

      console.log('估算费用响应:', response.data);
      return response.data;
    } catch (error) {
      console.error('估算交易费用失败:', error);
      throw error?.response?.data || error;
    }
  },

  async executeSolanaSwap(deviceId, walletId, params) {
    try {
      // 确保所有必要的参数都存在
      if (!deviceId) {
        throw new Error('缺少设备ID');
      }
      
      if (!walletId) {
        throw new Error('缺少钱包ID');
      }
      
      if (!params.from_token) {
        throw new Error('缺少源代币地址');
      }
      
      if (!params.to_token) {
        throw new Error('缺少目标代币地址');
      }
      
      if (!params.amount) {
        throw new Error('缺少兑换金额');
      }
      
      if (!params.quote_id) {
        throw new Error('缺少报价ID');
      }
      
      if (!params.payment_password) {
        throw new Error('缺少支付密码');
      }
      
      // 构建请求参数
      const requestData = {
        device_id: deviceId,
        quote_id: params.quote_id,
        from_token: params.from_token,
        to_token: params.to_token,
        amount: params.amount,
        payment_password: params.payment_password,
        slippage: params.slippage || '0.5'
      };
      
      console.log('执行兑换交易请求:', {
        url: `/solana/wallets/${walletId}/swap/execute/`,
        params: {
          ...requestData,
          payment_password: '******'
        }
      });
      
      // 发送请求
      const response = await instance.post(
        `/solana/wallets/${walletId}/swap/execute/`,
        requestData
      );
      
      console.log('兑换交易响应:', response.data);
      return response.data;
    } catch (error) {
      console.error('执行兑换交易失败:', error);
      if (error.response) {
        console.error('错误响应数据:', error.response.data);
      }
      throw error;
    }
  },

  async getSolanaSwapStatus(deviceId, walletId, signature) {
    try {
      logger.info('查询交易状态:', {
        deviceId,
        walletId,
        signature
      });
      
      const response = await instance.get(
        `/solana/wallets/${walletId}/swap/status/${signature}`,
        {
          params: {
            device_id: deviceId
          }
        }
      );
      
      logger.info('交易状态响应:', response.data);
      return response.data;
    } catch (error) {
      logger.error('获取交易状态失败:', error);
      if (error.response) {
        logger.error('错误响应数据:', error.response.data);
      }
      throw error;
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