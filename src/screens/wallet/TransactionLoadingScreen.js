import React, { useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { DeviceManager } from '../../utils/device';
import { api } from '../../services/api';
import { getWalletChainType, isEVMChain } from '../../utils/walletUtils';

export default function TransactionLoadingScreen({ navigation, route }) {
  const { recipientAddress, amount, token, tokenInfo, selectedWallet, password } = route.params;

  useEffect(() => {
    processSendTransaction();
  }, []);

  const processSendTransaction = async () => {
    try {
      console.log('=== Starting transaction processing ===')
      const deviceId = await DeviceManager.getDeviceId();
      
      // 确保使用正确的链类型判断
      const chainType = (tokenInfo.chain || selectedWallet.chain || '').toUpperCase();
      const isEVM = chainType === 'ETH' || chainType === 'EVM' || chainType === 'BASE';

      let response;
      const params = {
        device_id: deviceId,
        to_address: recipientAddress,
        amount: amount.toString(),
        payment_password: password
      };

      if (isEVM) {
        // EVM 链的参数
        params.token = tokenInfo.address;
        params.gas_limit = "100000";
        params.gas_price = "20000000000";
        params.max_priority_fee = "1500000000";
        params.max_fee = "25000000000";

        response = await api.sendEvmTransaction(selectedWallet.id, params);
      } else {
        // Solana 链的参数
        params.token_address = tokenInfo.address;
        response = await api.sendSolanaTransaction(selectedWallet.id, params);
      }

      if (response.success) {
        navigation.navigate('TransactionSuccess', {
          hash: response.hash,
          amount,
          token: tokenInfo.symbol,
          recipientAddress
        });
      } else {
        throw new Error(response.message || 'Failed to send transaction');
      }
    } catch (error) {
      console.error('Send transaction error:', error);
      navigation.navigate('TransactionFailed', {
        error: error.message || 'Failed to send transaction'
      });
    }
  };

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