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
      const deviceId = await DeviceManager.getDeviceId();
      const { purpose, chain, privateKey } = route.params || {};
      console.log('Submitting password for purpose:', purpose);
  
      if (purpose === 'import_wallet') {
        console.log('Importing wallet with private key:', privateKey);
        const importResponse = await api.importPrivateKey(deviceId, chain, privateKey, password);
        if (importResponse.status === 'success') {
          console.log('Wallet imported successfully:', importResponse.wallet);
          if (importResponse.wallet) {
            console.log('Processing wallet data...');
            const processedWallet = processWalletData(importResponse.wallet);
            console.log('Updating selected wallet...');
            await updateSelectedWallet(processedWallet);
            console.log('Selected wallet updated successfully');
            
            // 获取钱包余额和代币数据
            try {
              const tokensResponse = await api.getWalletTokens(
                deviceId,
                processedWallet.id,
                processedWallet.chain
              );
              
              if (tokensResponse?.data) {
                // 缓存代币数据
                await AsyncStorage.setItem(
                  `tokens_${processedWallet.id}`,
                  JSON.stringify({
                    data: tokensResponse.data,
                    timestamp: Date.now()
                  })
                );
              }
            } catch (error) {
              console.error('Error fetching wallet tokens:', error);
            }
          }
          
          console.log('Resetting navigation to MainStack...');
          navigation.dispatch(
            CommonActions.reset({
              index: 0,
              routes: [
                { 
                  name: 'MainStack',
                  params: {
                    screen: 'Main',
                    params: {
                      screen: 'Tabs',
                      params: {
                        screen: 'Wallet'
                      }
                    }
                  }
                }
              ]
            })
          );
          console.log('Navigation reset completed');
          return { success: true };
        } else {
          console.error('Import response failed:', importResponse);
          throw new Error(importResponse.message || 'Failed to import wallet');
        }
      } else if (purpose === 'rename_wallet') {
        // 处理重命名钱包的逻辑
        const response = await api.renameWallet(walletId, deviceId, route.params.newName);
        if (response.status === 'success') {
          const updatedWallet = { ...route.params.wallet, name: route.params.newName };
          await updateSelectedWallet(updatedWallet);
          navigation.goBack();
          return { success: true };
        } else {
          throw new Error(response.message || 'Failed to rename wallet');
        }
      } else if (purpose === 'delete_wallet') {
        // 处理删除钱包的逻辑
        const response = await api.deleteWallet(walletId, deviceId, password);
        if (response.status === 'success') {
          await checkAndUpdateWallets();
          navigation.reset({
            index: 0,
            routes: [{ name: 'MainStack' }],
          });
          return { success: true };
        } else {
          throw new Error(response.message || 'Failed to delete wallet');
        }
      } else if (purpose === 'show_private_key') {
        // 处理显示私钥的逻辑
        const response = await api.getPrivateKey(walletId, deviceId, password);
        console.log('Private key response:', response);
        
        if (response.status === 'success' && response.data) {
          const privateKeyData = response.data.private_key || response.data;
          console.log('Navigating to PrivateKeyDisplay with private key data');
          
          navigation.replace('PrivateKeyDisplay', {
            privateKey: privateKeyData
          });
          return { success: true };
        } else {
          console.error('Failed to get private key:', response);
          throw new Error(response.message || '获取私钥失败');
        }
      }
    } catch (error) {
      console.error('Password verification error:', error);
      setError(error.message || 'Incorrect password');
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