import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ActivityIndicator,
  Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { DeviceManager } from '../../utils/device';
import { api } from '../../services/api';

export default function TransactionLoadingScreen({ navigation, route }) {
  const { recipientAddress, amount, token, tokenInfo, selectedWallet, password } = route.params;
  const [status, setStatus] = useState('sending');

  const processSendTransaction = async () => {
    try {
      console.log('=== Starting transaction processing ===');
      const deviceId = await DeviceManager.getDeviceId();
      
      // 检查代币信息
      console.log('Token info:', tokenInfo);
      
      // 处理代币精度
      let amountWithDecimals;
      if (tokenInfo.contract_address) {
        // 如果是代币转账，使用代币精度
        amountWithDecimals = (parseFloat(amount) * Math.pow(10, tokenInfo.decimals)).toFixed(0);
      } else {
        // 如果是 SOL 原生代币转账，不需要处理精度
        amountWithDecimals = amount;
      }
      
      console.log('Transaction details:', {
        originalAmount: amount,
        tokenDecimals: tokenInfo.decimals,
        amountWithDecimals,
        tokenInfo,
        isToken: !!tokenInfo.contract_address
      });

      const chainType = (tokenInfo.chain || selectedWallet.chain || '').toUpperCase();
      const params = {
        device_id: deviceId,
        to_address: recipientAddress,
        amount: amountWithDecimals,
        payment_password: password,
        token_address: tokenInfo.contract_address || null
      };

      console.log('Sending transaction with params:', params);

      let response;
      try {
        if (chainType === 'SOL' || chainType === 'SOLANA') {
          response = await api.sendSolanaTransaction(selectedWallet.id, params);
        } else {
          params.token = params.token_address;
          delete params.token_address;
          response = await api.sendEvmTransaction(selectedWallet.id, params);
        }

        if (response?.data?.transaction_hash) {
          navigation.replace('TransactionSuccess', {
            hash: response.data.transaction_hash,
            amount,
            token: tokenInfo.symbol,
            recipientAddress
          });
        } else {
          throw new Error(response?.message || 'Failed to send transaction');
        }
      } catch (error) {
        console.error('Transaction API error:', error);
        throw error;
      }

    } catch (error) {
      console.error('Send transaction error:', error);
      navigation.replace('TransactionFailed', {
        error: error.message || 'Failed to send transaction'
      });
    }
  };

  useEffect(() => {
    processSendTransaction();
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <ActivityIndicator size="large" color="#1FC595" style={styles.spinner} />
        <Text style={styles.loadingText}>Processing Transaction</Text>
        <Text style={styles.subText}>Please wait while we process your transaction</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#171C32',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  spinner: {
    marginBottom: 24,
  },
  loadingText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  subText: {
    fontSize: 14,
    color: '#8E8E8E',
    textAlign: 'center',
  },
});