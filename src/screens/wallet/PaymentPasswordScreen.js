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
        navigation.replace('LoadingWallet', {
          purpose,
          chain,
          privateKey,
          password
        });
        return { success: true };
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
          // 先清除当前选中的钱包
          await updateSelectedWallet(null);
          // 获取最新的钱包列表
          const walletsResponse = await api.getWallets(deviceId);
          const walletsArray = Array.isArray(walletsResponse) ? walletsResponse : [];
          
          if (walletsArray.length === 0) {
            // 如果没有钱包了，设置钱包创建状态为false并导航到引导页
            await DeviceManager.setWalletCreated(false);
            navigation.dispatch(
              CommonActions.reset({
                index: 0,
                routes: [{ name: 'Onboarding' }]
              })
            );
          } else {
            // 如果还有其他钱包，将第一个钱包设置为当前选中钱包
            await updateSelectedWallet(walletsArray[0]);
            navigation.dispatch(
              CommonActions.reset({
                index: 0,
                routes: [{ name: 'MainStack' }]
              })
            );
          }
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