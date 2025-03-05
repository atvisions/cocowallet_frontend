import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Platform,
  Animated,
  Alert,
} from 'react-native';

import { Ionicons } from '@expo/vector-icons';
import Header from '../../components/common/Header';
import PasswordDots from '../../components/common/PasswordDots';
import { DeviceManager } from '../../utils/device';
import { api } from '../../services/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { CommonActions } from '@react-navigation/native';
import { useWallet } from '../../contexts/WalletContext';
import { processWalletData } from '../../utils/walletUtils';

export default function PaymentPasswordScreen({ route, navigation }) {
  const { title = 'Enter Password', action, walletId, onSuccess } = route.params || {};
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const fadeAnim = useState(new Animated.Value(0))[0];
  const { updateSelectedWallet, checkAndUpdateWallets } = useWallet();
  const [isProcessing, setIsProcessing] = useState(false);
  const [deviceId, setDeviceId] = useState(null);

  useEffect(() => {
    console.log('Password length:', password.length);
    if (password.length === 6) {
      console.log('Password complete, submitting...');
      handlePasswordComplete(password);
    }
  }, [password]);

  useEffect(() => {
    if (error) {
      Animated.sequence([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.delay(3000),
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        })
      ]).start(() => setError(''));
    }
  }, [error]);

  useEffect(() => {
    const getDeviceId = async () => {
      const id = await DeviceManager.getDeviceId();
      setDeviceId(id);
    };
    getDeviceId();
  }, []);

  const handleNumberPress = (number) => {
    if (password.length < 6) {
      setPassword(prev => prev + number);
    }
  };

  const handleDelete = () => {
    setPassword(prev => prev.slice(0, -1));
  };

  const handlePasswordComplete = async (password) => {
    try {
      setIsProcessing(true);
      console.log('Submitting password verification...', { deviceId });
      const response = await api.verifyPaymentPassword(deviceId, password);
      console.log('Password verification response:', response);

      if (response.status === 'success') {
        console.log('Password verification successful, executing callback...');
        handlePasswordVerified(password);
      } else {
        Alert.alert('Error', response.message || 'Password verification failed');
        setPassword('');
      }
    } catch (error) {
      console.error('Password verification error:', error);
      Alert.alert('Error', 'Failed to verify password');
      setPassword('');
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePasswordVerified = async (password) => {
    console.log('Password verification successful, executing callback...');
    
    try {
      if (route.params?.onSuccess) {
        // 直接执行回调函数，传递密码
        await route.params.onSuccess(password);
      } else if (route.params?.purpose === 'send_transaction') {
        const { transactionData, nextScreen } = route.params;
        
        // 确保 transactionData 包含所有必要的信息
        console.log('Transaction data:', {
          ...transactionData,
          token_address: transactionData.token_address
        });
        
        // 导航到交易加载页面
        navigation.navigate(nextScreen || 'TransactionLoading', {
          ...transactionData,
          payment_password: password // 使用 payment_password 而不是 password
        });
      } else {
        // 默认行为
        navigation.goBack();
      }
    } catch (error) {
      console.error('Error in password verification callback:', error);
      Alert.alert('错误', error?.message || '交易失败，请重试');
    }
  };

  const renderNumberPad = () => {
    const numbers = [
      [1, 2, 3],
      [4, 5, 6],
      [7, 8, 9],
      ['', 0, 'delete']
    ];

    return (
      <View style={styles.numberPad}>
        {numbers.map((row, i) => (
          <View key={i} style={styles.row}>
            {row.map((num, j) => (
              <TouchableOpacity
                key={j}
                style={[
                  styles.numberButton,
                  num === '' && styles.emptyButton
                ]}
                onPress={() => {
                  if (num === 'delete') {
                    handleDelete();
                  } else if (num !== '') {
                    handleNumberPress(num);
                  }
                }}
                disabled={num === ''}
              >
                {num === 'delete' ? (
                  <Ionicons name="backspace-outline" size={24} color="#FFFFFF" />
                ) : (
                  <Text style={styles.numberText}>{num}</Text>
                )}
              </TouchableOpacity>
            ))}
          </View>
        ))}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <Header 
        title={title}
        onBack={() => navigation.goBack()}
      />

      <View style={styles.content}>
        <Text style={styles.description}>
          Enter payment password to continue
        </Text>

        <View style={styles.passwordSection}>
          <PasswordDots
            length={6}
            filledCount={password.length}
          />

          <Animated.View 
            style={[
              styles.errorContainer,
              { opacity: fadeAnim }
            ]}
          >
            <Ionicons name="alert-circle" size={16} color="#FF4B55" />
            <Text style={styles.errorText}>
              {error}
            </Text>
          </Animated.View>
        </View>

        {renderNumberPad()}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#171C32',
  },
  content: {
    flex: 1,
    padding: 24,
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingTop: 80,
  },
  description: {
    color: '#8E8E8E',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 32,
  },
  numberPad: {
    width: '100%',
    paddingHorizontal: 16,
    marginBottom: 40,
    marginTop: 40,
    alignItems: 'center',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 20,
    width: '100%',
  },
  numberButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#272C52',
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 6,
  },
  emptyButton: {
    backgroundColor: 'transparent',
  },
  numberText: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '600',
  },
  passwordSection: {
    alignItems: 'center',
    marginBottom: 40,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 75, 85, 0.1)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    marginTop: 16,
    position: 'absolute',
    top: 80,
  },
  errorText: {
    color: '#FF4B55',
    fontSize: 14,
    marginLeft: 8,
    fontWeight: '500',
  },
});