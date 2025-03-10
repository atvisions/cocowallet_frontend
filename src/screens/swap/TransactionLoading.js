import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  SafeAreaView,
  StatusBar,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useWallet } from '../../contexts/WalletContext';
import { api } from '../../services/api';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const TransactionLoading = ({ navigation, route }) => {
  const { backgroundGradient } = useWallet();
  const insets = useSafeAreaInsets();
  const [status, setStatus] = useState('processing');
  const [retryCount, setRetryCount] = useState(0);
  const MAX_RETRIES = 10;
  const RETRY_INTERVAL = 2000;

  const {
    transactionType,
    fromToken,
    toToken,
    amount,
    quote,
    slippage,
    deviceId,
    walletId,
    chain,
    fromSymbol,
    toSymbol,
    fromAmount,
    toAmount,
    payment_password,
    onConfirmed,
  } = route.params;

  useEffect(() => {
    executeTransaction();
  }, []);

  const executeTransaction = async () => {
    try {
      console.log('Executing swap with params:', {
        quote_id: quote,
        from_token: fromToken.address || fromToken.token_address,
        to_token: toToken.address || toToken.token_address,
        amount,
        payment_password,
        slippage,
        wallet_id: walletId,
        device_id: deviceId,
      });

      // Execute swap transaction
      const response = await api.executeSolanaSwap(deviceId, walletId, {
        quote_id: quote,
        from_token: fromToken.address || fromToken.token_address,
        to_token: toToken.address || toToken.token_address,
        amount: amount,
        payment_password: payment_password,
        slippage: slippage,
      });

      console.log('Swap execution response:', response);

      if (response.status === 'success') {
        // Start polling for transaction status
        pollTransactionStatus(response.data.transaction_id);
      } else {
        handleTransactionFailure('Failed to execute swap');
      }
    } catch (error) {
      console.error('Transaction execution failed:', error);
      handleTransactionFailure(error.message || 'Transaction failed');
    }
  };

  const pollTransactionStatus = async (transactionId) => {
    try {
      const response = await api.getSolanaSwapStatus(deviceId, walletId, transactionId);
      console.log('Poll status response:', response);

      if (response.status === 'success') {
        const txStatus = response.data.status;

        if (txStatus === 'success') {
          handleTransactionSuccess(response.data);
        } else if (txStatus === 'failed') {
          handleTransactionFailure(response.data.message || 'Transaction failed');
        } else if (txStatus === 'pending') {
          // Continue polling if under max retries
          if (retryCount < MAX_RETRIES) {
            setTimeout(() => {
              setRetryCount(prev => prev + 1);
              pollTransactionStatus(transactionId);
            }, RETRY_INTERVAL);
          } else {
            handleTransactionFailure('Transaction timeout');
          }
        }
      } else {
        handleTransactionFailure('Failed to get transaction status');
      }
    } catch (error) {
      console.error('Status check failed:', error);
      handleTransactionFailure(error.message || 'Failed to check transaction status');
    }
  };

  const handleTransactionSuccess = (data) => {
    // Call the onConfirmed callback if provided
    if (onConfirmed) {
      onConfirmed();
    }

    // Navigate to success screen
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

  const handleTransactionFailure = (errorMessage) => {
    navigation.replace('SwapFailed', {
      transactionType,
      fromToken,
      toToken,
      fromAmount,
      toAmount,
      fromSymbol,
      toSymbol,
      error: errorMessage,
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={[backgroundGradient, '#171C32']}
        style={styles.backgroundGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 0.6 }}
      />
      <StatusBar
        barStyle="light-content"
        backgroundColor="transparent"
        translucent
      />
      <View style={[styles.content, { paddingTop: Platform.OS === 'android' ? insets.top : 0 }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#1FC595" style={styles.spinner} />
          <Text style={styles.title}>Processing Swap</Text>
          <Text style={styles.description}>
            Please wait while we process your swap transaction. This may take a few moments.
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#171C32',
  },
  backgroundGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  loadingContainer: {
    alignItems: 'center',
  },
  spinner: {
    marginBottom: 24,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '600',
    marginTop: 24,
    textAlign: 'center',
  },
  description: {
    color: '#8E8E8E',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 12,
    marginHorizontal: 24,
  },
});

export default TransactionLoading; 