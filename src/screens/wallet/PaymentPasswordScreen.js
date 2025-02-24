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
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Header from '../../components/common/Header';
import PasswordDots from '../../components/common/PasswordDots';
import { DeviceManager } from '../../utils/device';
import { api } from '../../services/api';
import { CommonActions } from '@react-navigation/native';
import { useWallet } from '../../contexts/WalletContext';

export default function PaymentPasswordScreen({ route, navigation }) {
  const { title = 'Enter Password', action, walletId, onSuccess } = route.params || {};
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const fadeAnim = useState(new Animated.Value(0))[0];
  const { updateSelectedWallet, checkAndUpdateWallets } = useWallet();

  useEffect(() => {
    console.log('Password length:', password.length);
    if (password.length === 6) {
      console.log('Password complete, submitting...');
      handleSubmit();
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

  const handleNumberPress = (number) => {
    if (password.length < 6) {
      setPassword(prev => prev + number);
    }
  };

  const handleDelete = () => {
    setPassword(prev => prev.slice(0, -1));
  };

  const handleSubmit = async () => {
    try {
      console.log('Handling submit with route params:', route.params);
      const { purpose, action, chain, privateKey, walletId, onSuccess, fromWalletList } = route.params || {};
      const deviceId = await DeviceManager.getDeviceId();

      const actionType = purpose || action;
      console.log('Action type:', actionType);

      switch (actionType) {
        case 'import_wallet':
          console.log('Handling import wallet...', { chain, privateKey, password });
          try {
            const importResponse = await api.importPrivateKey(deviceId, chain, privateKey, password);
            if (importResponse.status === 'success' && importResponse.wallet) {
              // 根据来源决定导航行为
              if (fromWalletList) {
                // 从钱包列表来的，返回列表页
                await checkAndUpdateWallets();
                navigation.goBack();
              } else {
                // 从其他地方来的（如引导页），直接进入主页
                await updateSelectedWallet(importResponse.wallet);
                navigation.dispatch(
                  CommonActions.reset({
                    index: 0,
                    routes: [
                      {
                        name: 'MainStack'
                      }
                    ]
                  })
                );
              }
            } else {
              throw new Error(importResponse.message || 'Failed to import wallet');
            }
          } catch (error) {
            console.error('Import wallet error:', error);
            setError(error.message || 'Failed to import wallet');
            setPassword('');
          }
          break;

        case 'show_private_key':
          console.log('Handling show private key...');
          const keyResponse = await api.getPrivateKey(walletId, deviceId, password);
          
          if (keyResponse.status === 'success' && keyResponse.data?.private_key) {
            navigation.replace('VerificationResult', {
              privateKey: keyResponse.data.private_key
            });
          } else {
            setError(keyResponse.message || 'Incorrect password');
            setPassword('');
          }
          break;

        case 'delete_wallet':
          console.log('=== Delete Wallet Process Start ===');
          try {
            // 先删除钱包
            console.log('Attempting to delete wallet...');
            const result = await onSuccess(password);
            console.log('Delete wallet result:', result);

            if (result?.success) {
              // 删除成功后，获取最新的钱包列表
              console.log('Getting updated wallet list...');
              const response = await api.getWallets(deviceId);
              const walletsArray = Array.isArray(response) ? response : [];
              console.log('Updated wallets array:', walletsArray);
              
              if (walletsArray.length === 0) {
                console.log('No wallets remaining, navigating to Onboarding...');
                // 如果没有钱包了，设置状态并导航到引导页
                await DeviceManager.setWalletCreated(false);
                await updateSelectedWallet(null);
                navigation.dispatch(
                  CommonActions.reset({
                    index: 0,
                    routes: [{ name: 'Onboarding' }]
                  })
                );
              } else {
                console.log('Wallets remaining, updating selected wallet:', walletsArray[0]);
                // 如果还有其他钱包，选择第一个钱包并导航到主页面
                await updateSelectedWallet(walletsArray[0]);
                navigation.dispatch(
                  CommonActions.reset({
                    index: 0,
                    routes: [{ name: 'MainStack' }]
                  })
                );
              }
            } else {
              console.log('Failed to delete wallet:', result);
              setError('Failed to delete wallet');
              setPassword('');
            }
          } catch (error) {
            console.error('Delete wallet error:', error);
            setError(error.message || 'Failed to delete wallet');
            setPassword('');
          }
          console.log('=== Delete Wallet Process End ===');
          break;

        default:
          console.log('Handling default case...');
          if (onSuccess) {
            await onSuccess(password);
            navigation.goBack();
          }
          break;
      }
    } catch (error) {
      console.error('Password verification error:', error);
      setError(error.message || 'Incorrect password');
      setPassword('');
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
    <SafeAreaView 
      style={styles.container}
      edges={['top', 'right', 'left']}
    >
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
    paddingHorizontal: 16,
    paddingTop: 24,
  },
  description: {
    color: '#8E8E8E',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 32,
  },
  numberPad: {
    flex: 1,
    justifyContent: 'flex-end',
    marginBottom: 40,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
  },
  numberButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#272C52',
    justifyContent: 'center',
    alignItems: 'center',
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