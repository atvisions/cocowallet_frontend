import React, { useState, useEffect } from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { api } from '../../services/api';
import { colors } from '../../theme';
import { logger } from '../../utils/logger';
import axios from 'axios';

const TransactionLoading = ({ navigation, route }) => {
  const [retryCount, setRetryCount] = useState(0);
  const [status, setStatus] = useState('loading');
  const [errorMessage, setErrorMessage] = useState('');
  
  const MAX_RETRIES = 10;
  const RETRY_INTERVAL = 2000;
  
  // 从路由参数中提取数据
  const params = route.params || {};
  const {
    transactionType,
    fromToken,
    toToken,
    amount,
    quote,
    slippage,
    deviceId,
    walletId,
    fromSymbol,
    toSymbol,
    fromAmount,
    toAmount,
    payment_password,
    onConfirmed
  } = params;
  
  // 执行交易
  const executeTransaction = async () => {
    try {
      console.log('开始执行兑换交易');
      
      // 检查必要参数
      if (!deviceId) {
        throw new Error('缺少设备ID');
      }
      
      if (!walletId) {
        throw new Error('缺少钱包ID');
      }
      
      if (!fromToken || !fromToken.token_address) {
        throw new Error('缺少源代币信息');
      }
      
      if (!toToken || !toToken.token_address) {
        throw new Error('缺少目标代币信息');
      }
      
      if (!amount) {
        throw new Error('缺少兑换金额');
      }
      
      if (!quote) {
        throw new Error('缺少报价信息');
      }
      
      if (!payment_password) {
        throw new Error('缺少支付密码');
      }
      
      // 构建API请求参数
      const apiParams = {
        device_id: deviceId,
        quote_id: quote,
        from_token: fromToken.token_address,
        to_token: toToken.token_address,
        amount: amount,
        payment_password: payment_password,
        slippage: slippage || '0.5'
      };
      
      console.log('兑换交易参数:', {
        ...apiParams,
        payment_password: '******'
      });
      
      // 执行兑换交易
      console.log(`调用 API: executeSolanaSwap(${deviceId}, ${walletId}, apiParams)`);
      
      // 直接使用 axios 发送请求，绕过 api 对象
      const instance = axios.create({
        baseURL: 'http://192.168.3.16:8000/api/v1',
        timeout: 30000,
        headers: {
          'Content-Type': 'application/json',
        }
      });
      
      const response = await instance.post(
        `/solana/wallets/${walletId}/swap/execute/`,
        apiParams
      );
      
      const responseData = response.data;
      console.log('兑换交易响应:', responseData);
      
      if (responseData.status === 'success') {
        // 如果响应中包含 tx_hash，直接使用它
        if (responseData.data && responseData.data.tx_hash) {
          console.log('交易哈希:', responseData.data.tx_hash);
          // 开始轮询交易状态
          pollTransactionStatus(responseData.data.tx_hash);
        } else if (responseData.data && responseData.data.transaction_id) {
          // 兼容旧版 API
          console.log('交易ID:', responseData.data.transaction_id);
          pollTransactionStatus(responseData.data.transaction_id);
        } else {
          throw new Error('响应中缺少交易哈希或ID');
        }
      } else {
        const errorMsg = responseData.message || '兑换交易失败';
        console.error('交易失败:', errorMsg);
        handleTransactionFailure(errorMsg);
      }
    } catch (error) {
      console.error('执行兑换交易失败:', error);
      const errorMsg = error.message || '兑换交易失败';
      handleTransactionFailure(errorMsg);
    }
  };
  
  // 轮询交易状态
  const pollTransactionStatus = async (transactionId) => {
    try {
      logger.info('查询交易状态:', {
        deviceId,
        walletId,
        transactionId
      });
      
      const response = await api.getSolanaSwapStatus(deviceId, walletId, transactionId);
      logger.info('交易状态响应:', response);
      
      if (response.status === 'success') {
        // 检查交易状态
        // 有些 API 返回 data.status，有些直接返回 data 中的状态
        const txStatus = response.data.status || response.data;
        
        if (txStatus === 'success' || txStatus === 'confirmed') {
          handleTransactionSuccess(response.data);
        } else if (txStatus === 'failed' || txStatus === 'error') {
          const errorMsg = response.data.message || response.message || '交易失败';
          handleTransactionFailure(errorMsg);
        } else if (txStatus === 'pending' || txStatus === 'processing') {
          // 继续轮询，直到达到最大重试次数
          if (retryCount < MAX_RETRIES) {
            setTimeout(() => {
              setRetryCount(prev => prev + 1);
              pollTransactionStatus(transactionId);
            }, RETRY_INTERVAL);
          } else {
            handleTransactionFailure('交易超时');
          }
        } else {
          // 未知状态
          logger.warn('未知交易状态:', txStatus);
          handleTransactionFailure(`未知交易状态: ${txStatus}`);
        }
      } else {
        handleTransactionFailure('获取交易状态失败');
      }
    } catch (error) {
      logger.error('查询交易状态失败:', error);
      handleTransactionFailure(error.message || '查询交易状态失败');
    }
  };
  
  // 处理交易成功
  const handleTransactionSuccess = (data) => {
    logger.info('交易成功:', data);
    
    // 调用成功回调
    if (onConfirmed) {
      onConfirmed();
    }
    
    // 导航到成功页面
    navigation.replace('SwapSuccess', {
      transactionType,
      fromToken,
      toToken,
      fromAmount,
      toAmount,
      fromSymbol,
      toSymbol,
      transactionData: data,
    });
  };
  
  // 处理交易失败
  const handleTransactionFailure = (errorMsg) => {
    logger.error('交易失败:', errorMsg);
    setStatus('failed');
    setErrorMessage(errorMsg);
    
    // 导航到失败页面
    navigation.replace('SwapFailed', {
      transactionType,
      fromToken,
      toToken,
      fromAmount,
      toAmount,
      fromSymbol,
      toSymbol,
      error: errorMsg,
    });
  };
  
  // 组件加载时执行交易
  useEffect(() => {
    logger.info('TransactionLoading 组件加载');
    
    // 检查必要参数
    const missingParams = [];
    if (!transactionType) missingParams.push('transactionType');
    if (!fromToken) missingParams.push('fromToken');
    if (!toToken) missingParams.push('toToken');
    if (!amount) missingParams.push('amount');
    if (!quote) missingParams.push('quote');
    if (!deviceId) missingParams.push('deviceId');
    if (!walletId) missingParams.push('walletId');
    if (!payment_password) missingParams.push('payment_password');
    
    if (missingParams.length > 0) {
      logger.error('缺少必要参数:', missingParams);
      handleTransactionFailure(`缺少必要参数: ${missingParams.join(', ')}`);
      return;
    }
    
    logger.info('交易参数:', {
      transactionType,
      fromToken: fromToken ? { 
        token_address: fromToken.token_address 
      } : null,
      toToken: toToken ? { 
        token_address: toToken.token_address 
      } : null,
      amount,
      quote: quote ? '(已提供)' : '(未提供)',
      slippage,
      deviceId,
      walletId,
      payment_password: '******'
    });
    
    // 延迟执行交易，确保组件完全加载
    const timer = setTimeout(() => {
      if (transactionType === 'swap') {
        executeTransaction();
      }
    }, 500);
    
    return () => clearTimeout(timer);
  }, []);
  
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.title}>处理中</Text>
        <Text style={styles.subtitle}>
          正在处理您的 {fromSymbol} 到 {toSymbol} 的兑换交易
        </Text>
        <Text style={styles.description}>
          请稍候，这可能需要一些时间...
        </Text>
        {status === 'failed' && (
          <Text style={styles.error}>{errorMessage}</Text>
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 20,
    color: colors.text,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginTop: 10,
    color: colors.text,
  },
  description: {
    fontSize: 14,
    textAlign: 'center',
    marginTop: 20,
    color: colors.textSecondary,
  },
  error: {
    fontSize: 14,
    textAlign: 'center',
    marginTop: 20,
    color: colors.error,
  },
});

export default TransactionLoading; 