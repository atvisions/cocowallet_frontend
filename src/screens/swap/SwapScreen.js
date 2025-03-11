import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Modal, TouchableOpacity, Animated, Platform, SafeAreaView } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import { useSelector } from 'react-redux';
import BigNumber from 'bignumber.js';
import DeviceManager from '../../services/DeviceManager';

const [messageVisible, setMessageVisible] = useState(false);
const [messageType, setMessageType] = useState('');
const [messageText, setMessageText] = useState('');

const showMessage = (type, text) => {
  setMessageType(type);
  setMessageText(text);
  setMessageVisible(true);
  
  // 3秒后自动隐藏，success 和 error 的情况
  if (type !== 'loading') {
    const timer = setTimeout(() => {
      setMessageVisible(false);
    }, 3000);
  }
};

const MessageBar = () => {
  if (!messageVisible) return null;

  const backgroundColor = messageType === 'success' ? '#1FC595' : '#FF3B30';
  const icon = messageType === 'success' ? 'checkmark-circle' : 'close-circle';

  return (
    <Animated.View style={[styles.messageBar, { backgroundColor }]}>
      <View style={styles.messageContent}>
        <Ionicons name={icon} size={20} color="#FFFFFF" />
        <Text style={styles.messageText}>{messageText}</Text>
      </View>
    </Animated.View>
  );
};

// 在交易状态变化时显示消息
useEffect(() => {
  if (transactionStatus === 'loading') {
    showMessage('loading', '交易处理中...');
  } else if (transactionStatus === 'success') {
    showMessage('success', '交易成功');
    // 重置状态
    setAmount('');
    setQuote(null);
    setFees(null);
  } else if (transactionStatus === 'failed') {
    showMessage('error', '交易失败');
  }

  return () => {
    if (messageTimeout.current) {
      clearTimeout(messageTimeout.current);
    }
  };
}, [transactionStatus]);

// 在 useEffect 中处理路由参数
useEffect(() => {
  const message = route.params?.showMessage;
  if (message) {
    showMessage(message.type, message.text);
    // 清除消息参数
    navigation.setParams({ showMessage: null });
  }
}, [route.params?.showMessage]);

// 监听路由参数变化
useEffect(() => {
  const result = route.params?.swapResult;
  if (result) {
    // 显示消息
    showMessage(result.type, result.message);

    // 如果是成功，刷新余额
    if (result.type === 'success') {
      loadUserTokens();
    }

    // 清除路由参数
    navigation.setParams({ swapResult: null });
  }
}, [route.params?.swapResult]);

// 当前的金额转换逻辑
const amountBN = new BigNumber(amount);
const decimals = fromToken.decimals || 0;
const rawAmount = amountBN.multipliedBy(new BigNumber(10).pow(decimals)).toFixed(0); 

const handleSwap = async (paymentPassword) => {
  try {
    setIsLoading(true);
    setTransactionStatus('loading');
    setTransactionError('');
    
    const deviceId = await DeviceManager.getDeviceId();
    
    // 直接使用 amount，因为它已经是链上数值
    const rawAmount = amount.toString().replace(/,/g, '');
    
    console.log('执行兑换交易 - 金额检查:', {
      输入金额: amount,
      处理后金额: rawAmount,
      代币精度: fromToken.decimals,
      代币符号: fromToken.symbol
    });

    const swapParams = {
      device_id: deviceId,
      from_token: fromToken.token_address,
      to_token: toToken.token_address,
      amount: rawAmount,  // 使用处理后的金额
      slippage: slippage,
      quote_id: JSON.stringify(quote),
      payment_password: paymentPassword
    };

    // ... 其余代码保持不变
  } catch (error) {
    // ... 错误处理
  }
}; 

const getQuoteAndFees = async () => {
  try {
    // ... 其他代码

    // 移除千分位分隔符
    const cleanAmount = amount.replace(/,/g, '');
    
    // 直接使用清理后的金额，不需要再乘以精度
    const rawAmount = cleanAmount;
    
    console.log('获取报价 - 金额检查:', {
      输入金额: amount,
      清理后金额: cleanAmount,
      最终金额: rawAmount,
      代币精度: fromToken.decimals,
      代币符号: fromToken.symbol
    });

    const params = {
      device_id: deviceId,
      from_token: fromToken.token_address,
      to_token: toToken.token_address,
      amount: rawAmount,
      slippage: slippage
    };

    // ... 其余代码保持不变
  } catch (error) {
    // ... 错误处理
  }
}; 

const handleAmountChange = (value) => {
  try {
    // 如果输入为空，直接返回
    if (!value) {
      setAmount('');
      setQuote(null);
      setFees(null);
      return;
    }

    // 移除非数字和小数点
    value = value.replace(/[^0-9.]/g, '');

    // 确保只有一个小数点
    const parts = value.split('.');
    if (parts.length > 2) {
      value = parts[0] + '.' + parts[1];
    }

    // 获取代币精度
    const tokenDecimals = fromToken?.decimals || 0;
    console.log('金额输入处理:', {
      原始输入: value,
      代币: fromToken?.symbol,
      代币精度: tokenDecimals
    });

    // 如果有小数部分，限制小数位数为代币精度
    if (parts.length === 2) {
      parts[1] = parts[1].slice(0, tokenDecimals);
      value = parts[0] + '.' + parts[1];
    }

    // 如果以小数点开始，添加前导零
    if (value.startsWith('.')) {
      value = '0' + value;
    }

    // 转换为链上数值
    const valueBN = new BigNumber(value);
    const chainAmount = valueBN.multipliedBy(new BigNumber(10).pow(tokenDecimals)).toFixed(0);

    console.log('金额转换结果:', {
      输入金额: value,
      链上金额: chainAmount,
      代币精度: tokenDecimals
    });

    // 设置金额为链上数值
    setAmount(chainAmount);

  } catch (error) {
    console.error('金额输入处理错误:', error);
    setAmount('');
    setQuote(null);
    setFees(null);
  }
}; 

const renderTransactionModal = () => {
  return (
    <Modal
      visible={transactionStatus !== 'idle'}
      transparent
      animationType="fade"
    >
      <View style={styles.modalContainer}>
        <View style={[styles.modalContent, {
          backgroundColor: transactionStatus === 'success' ? '#1C2135' : '#1C2135',
          borderRadius: 16,
          padding: 24,
        }]}>
          {transactionStatus === 'loading' && (
            <>
              <View style={styles.loadingIconContainer}>
                <ActivityIndicator size="large" color="#1FC595" />
              </View>
              <Text style={styles.modalTitle}>交易处理中</Text>
              <Text style={styles.modalText}>
                正在将 {formatTokenAmount(currentTransaction?.amount, fromToken?.decimals)} {currentTransaction?.fromSymbol} 
                兑换为 {currentTransaction?.toSymbol}
              </Text>
              <Text style={styles.modalSubText}>
                请耐心等待，交易确认可能需要一些时间
              </Text>
              <View style={styles.tipContainer}>
                <Ionicons name="information-circle-outline" size={16} color="#8E8E8E" />
                <Text style={styles.tipText}>交易完成后将自动刷新余额</Text>
              </View>
            </>
          )}

          {transactionStatus === 'success' && (
            <>
              <View style={styles.successIconContainer}>
                <Ionicons name="checkmark-circle" size={60} color="#1FC595" />
              </View>
              <Text style={styles.modalTitle}>交易成功</Text>
              <Text style={styles.modalText}>
                已成功将 {formatTokenAmount(currentTransaction?.amount, fromToken?.decimals)} {currentTransaction?.fromSymbol} 
                兑换为 {currentTransaction?.toSymbol}
              </Text>
              <TouchableOpacity
                style={styles.modalButton}
                onPress={() => {
                  setTransactionStatus('idle');
                  setCurrentTransaction(null);
                }}
              >
                <Text style={styles.modalButtonText}>完成</Text>
              </TouchableOpacity>
            </>
          )}

          {transactionStatus === 'failed' && (
            <>
              <View style={styles.failedIconContainer}>
                <Ionicons name="close-circle" size={60} color="#FF3B30" />
              </View>
              <Text style={styles.modalTitle}>交易失败</Text>
              <Text style={styles.modalText}>{transactionError}</Text>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonFailed]}
                onPress={() => {
                  setTransactionStatus('idle');
                  setCurrentTransaction(null);
                  setTransactionError('');
                }}
              >
                <Text style={styles.modalButtonText}>关闭</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>
    </Modal>
  );
};

// 添加新的样式
const styles = StyleSheet.create({
  // ... 现有样式 ...
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  modalContent: {
    width: '85%',
    maxWidth: 340,
    alignItems: 'center',
  },
  loadingIconContainer: {
    width: 60,
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  successIconContainer: {
    marginBottom: 16,
  },
  failedIconContainer: {
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 12,
    textAlign: 'center',
  },
  modalText: {
    fontSize: 15,
    color: '#FFFFFF',
    marginBottom: 16,
    textAlign: 'center',
    lineHeight: 22,
  },
  modalSubText: {
    fontSize: 13,
    color: '#8E8E8E',
    marginBottom: 16,
    textAlign: 'center',
  },
  tipContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(31, 197, 149, 0.1)',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  tipText: {
    fontSize: 13,
    color: '#8E8E8E',
    marginLeft: 6,
  },
  modalButton: {
    backgroundColor: '#1FC595',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    marginTop: 16,
    width: '100%',
  },
  modalButtonFailed: {
    backgroundColor: '#FF3B30',
  },
  modalButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  messageBar: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 50 : 30,
    left: 20,
    right: 20,
    zIndex: 999,
    borderRadius: 8,
    elevation: 5,
  },
  messageContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  messageText: {
    color: '#FFFFFF',
    marginLeft: 8,
    fontSize: 14,
    fontWeight: '500',
  }
}); 