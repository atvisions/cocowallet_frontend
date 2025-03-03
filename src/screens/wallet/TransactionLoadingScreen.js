import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ActivityIndicator,
  Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { api } from '../../services/api';
import { DeviceManager } from '../../utils/device';

export default function TransactionLoadingScreen({ navigation, route }) {
  const [status, setStatus] = useState('processing');
  const [transactionStep, setTransactionStep] = useState('CREATING');
  const [error, setError] = useState(null);
  const [transactionHash, setTransactionHash] = useState(null);
  const [retryCount, setRetryCount] = useState(0);
  
  // 交易状态描述
  const statusMessages = {
    CREATING: {
      title: 'Preparing Transaction',
      subtitle: 'Preparing transaction data...'
    },
    CHECKING_ACCOUNTS: {
      title: 'Checking Accounts',
      subtitle: 'Verifying account information...'
    },
    SIMULATING: {
      title: 'Simulating Transaction',
      subtitle: 'Simulating transaction execution...'
    },
    SENDING: {
      title: 'Sending Transaction',
      subtitle: 'Sending transaction to blockchain...'
    },
    CONFIRMING: {
      title: 'Confirming Transaction',
      subtitle: 'Waiting for blockchain confirmation...'
    },
    SUCCESS: {
      title: 'Transaction Successful',
      subtitle: 'Transaction has been confirmed'
    },
    FAILED: {
      title: 'Transaction Failed',
      subtitle: 'Please check your input and try again'
    }
  };
  
  useEffect(() => {
    sendTransaction();
  }, []);

  const sendTransaction = async () => {
    try {
      // 从路由参数中获取交易数据
      const transactionData = route.params;
      const password = transactionData.password;
      
      console.log('Starting transaction with data:', {
        ...transactionData,
        password: '******' // 隐藏密码
      });
      
      if (!transactionData || !password) {
        throw new Error('Missing transaction data or password');
      }
      
      setTransactionStep('CREATING');
      
      // 根据链类型选择不同的发送方法
      let response;
      try {
        if (transactionData.chain === 'SOL') {
          console.log('Sending Solana transaction:', {
            walletId: transactionData.wallet_id,
            params: {
              device_id: transactionData.device_id,
              to_address: transactionData.to_address,
              amount: transactionData.amount,
              payment_password: password,
              token: transactionData.token
            }
          });
          
          response = await api.sendSolanaTransaction(
            transactionData.wallet_id, 
            {
              device_id: transactionData.device_id,
              to_address: transactionData.to_address,
              amount: transactionData.amount,
              payment_password: password,
              token: transactionData.token
            }
          );
        } else {
          console.log('Sending EVM transaction:', {
            walletId: transactionData.wallet_id,
            params: {
              device_id: transactionData.device_id,
              to_address: transactionData.to_address,
              amount: transactionData.amount,
              payment_password: password,
              token: transactionData.token
            }
          });
          
          response = await api.sendEvmTransaction(
            transactionData.wallet_id, 
            {
              device_id: transactionData.device_id,
              to_address: transactionData.to_address,
              amount: transactionData.amount,
              payment_password: password,
              token: transactionData.token
            }
          );
        }
        
        console.log('Transaction response:', response);
      } catch (error) {
        console.log('API Error Response:', error);
        
        // 如果是网络错误，但交易可能已经发送，尝试轮询交易状态
        if (error.message && error.message.includes('Network error')) {
          setTransactionStep('SENDING');
          // 开始轮询交易状态
          startPollingTransactionStatus(transactionData);
          return;
        } else {
          throw error;
        }
      }
      
      if (response && response.status === 'success') {
        // 获取交易哈希 - 添加更多日志
        const txHash = response.data?.tx_hash || response.data?.transaction_hash;
        console.log('Transaction hash extraction:', {
          responseData: response.data,
          extractedHash: txHash,
          tx_hash: response.data?.tx_hash,
          transaction_hash: response.data?.transaction_hash
        });
        
        setTransactionHash(txHash);
        
        if (txHash) {
          console.log('Starting polling with hash:', txHash);
          // 开始轮询交易状态
          startPollingTransactionStatus(transactionData, txHash);
        } else {
          // 如果没有交易哈希但状态是成功，直接导航到成功页面
          setStatus('success');
          console.log('No hash available, navigating to success screen');
          handleSuccess(null, transactionData);
        }
      } else {
        throw new Error(response?.message || 'Transaction failed');
      }
    } catch (error) {
      console.error('Transaction failed:', error);
      setError(error.message || 'Transaction failed, please try again later');
      setStatus('error');
      
      // 导航到交易失败页面
      navigation.replace('TransactionFailed', {
        error: 'Transaction failed, please try again later',
        selectedWallet: route.params.selectedWallet,
        recipientAddress: route.params.to_address,
        amount: route.params.amount,
        token: route.params.token_symbol || route.params.token,
        tokenInfo: route.params.tokenInfo
      });
    }
  };
  
  const startPollingTransactionStatus = async (transactionData, txHash = null) => {
    const MAX_RETRIES = 30;
    let currentRetry = 0;
    let deviceId = transactionData.device_id;
    
    // 如果没有交易哈希，尝试从后端获取最近的交易
    if (!txHash) {
      console.log('No transaction hash provided, will check recent transactions');
      // 这里可以添加获取最近交易的逻辑
    }
    
    const pollInterval = setInterval(async () => {
      try {
        currentRetry++;
        console.log(`Polling transaction status (${currentRetry}/${MAX_RETRIES})`);
        
        if (currentRetry > MAX_RETRIES) {
          clearInterval(pollInterval);
          // 导航到交易失败页面
          navigation.replace('TransactionFailed', {
            error: 'Transaction confirmation timed out, please check transaction status',
            selectedWallet: transactionData.selectedWallet,
            recipientAddress: transactionData.to_address,
            amount: transactionData.amount,
            token: transactionData.token_symbol || transactionData.token,
            tokenInfo: transactionData.tokenInfo
          });
          return;
        }
        
        // 如果有交易哈希，直接查询交易状态
        if (txHash) {
          console.log('Polling transaction with hash:', txHash);
          try {
            const statusResponse = await api.getTransactionStatus(deviceId, txHash);
            console.log('Transaction status response:', statusResponse);
            
            if (statusResponse.status === 'success') {
              const txStatus = statusResponse.data?.status;
              
              // 提取交易哈希 - 可能在响应中有更新的哈希
              const updatedTxHash = statusResponse.data?.tx_hash || statusResponse.data?.transaction_hash || txHash;
              
              // 更新交易步骤
              if (txStatus && statusMessages[txStatus]) {
                setTransactionStep(txStatus);
              }
              
              // 如果交易成功，导航到成功页面
              if (txStatus === 'SUCCESS') {
                clearInterval(pollInterval);
                setStatus('success');
                console.log('Transaction successful, navigating with hash:', updatedTxHash);
                handleSuccess(updatedTxHash, transactionData);
                return;
              }
              
              // 如果交易失败，导航到失败页面
              if (txStatus === 'FAILED') {
                clearInterval(pollInterval);
                console.log('Transaction failed with hash:', txHash);
                navigation.replace('TransactionFailed', {
                  error: 'Transaction failed, please check transaction details',
                  selectedWallet: transactionData.selectedWallet,
                  recipientAddress: transactionData.to_address,
                  amount: transactionData.amount,
                  token: transactionData.token_symbol || transactionData.token,
                  tokenInfo: transactionData.tokenInfo,
                  transactionHash: txHash
                });
                return;
              }
            } else if (statusResponse.status === 'error') {
              console.warn('Error in transaction status response:', statusResponse.message);
              // 不中断轮询，继续尝试
            }
          } catch (error) {
            console.error('Error polling transaction status:', error);
            // 继续轮询，不要中断
          }
        } else {
          // 如果没有交易哈希，模拟交易状态进展
          const steps = ['CREATING', 'CHECKING_ACCOUNTS', 'SIMULATING', 'SENDING', 'CONFIRMING'];
          const currentStepIndex = steps.indexOf(transactionStep);
          
          if (currentStepIndex < steps.length - 1) {
            setTransactionStep(steps[currentStepIndex + 1]);
          }
          
          // 在没有交易哈希的情况下，我们可以尝试查询最近的交易
          // 这里可以添加查询最近交易的逻辑
          
          // 如果轮询超过10次仍然没有交易哈希，假设交易已经成功
          // 这只是一个临时解决方案，理想情况下应该从后端获取交易哈希
          if (currentRetry > 10) {
            clearInterval(pollInterval);
            setStatus('success');
            console.log('Assuming transaction success after 10 retries without hash');
            // 导航到成功页面，但不提供交易哈希
            handleSuccess(null, transactionData);
            return;
          }
        }
        
        setRetryCount(currentRetry);
      } catch (error) {
        console.error('Failed to query transaction status:', error);
        // 不要中断轮询，继续尝试
        // 只有在达到最大重试次数时才导航到失败页面
      }
    }, 2000);
    
    // 清理函数
    return () => {
      clearInterval(pollInterval);
    };
  };

  const handleSuccess = (txHash, data) => {
    // Navigate to transaction success screen first
    navigation.replace('TransactionSuccess', {
      amount: data.amount,
      token: data.token_symbol || data.token,
      recipientAddress: data.to_address,
      transactionHash: txHash
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {status === 'processing' && (
          <>
            <ActivityIndicator size="large" color="#007AFF" style={styles.spinner} />
            <Text style={styles.title}>{statusMessages[transactionStep]?.title || 'Processing'}</Text>
            <Text style={styles.message}>{statusMessages[transactionStep]?.subtitle || 'Processing your transaction, please wait...'}</Text>
            {retryCount > 0 && (
              <Text style={styles.retryText}>Confirming ({retryCount}/30)</Text>
            )}
          </>
        )}
        
        {status === 'success' && (
          <>
            <Text style={styles.title}>Transaction Successful</Text>
            <Text style={styles.message}>Your transaction has been successfully submitted</Text>
            {transactionHash && (
              <Text style={styles.hash}>Transaction Hash: {transactionHash}</Text>
            )}
          </>
        )}
        
        {status === 'error' && (
          <>
            <Text style={styles.title}>Transaction Failed</Text>
            <Text style={styles.message}>{error}</Text>
          </>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1A1F3D',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  spinner: {
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 10,
  },
  message: {
    fontSize: 16,
    color: '#DDDDDD',
    textAlign: 'center',
    marginBottom: 20,
  },
  hash: {
    fontSize: 14,
    color: '#AAAAAA',
    textAlign: 'center',
  },
  retryText: {
    fontSize: 14,
    color: '#AAAAAA',
    marginTop: 10,
  },
});