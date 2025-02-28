import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../../services/api';
import { DeviceManager } from '../../utils/device';
import Header from '../../components/common/Header';
import Loading from '../../components/common/Loading';
import { CommonActions } from '@react-navigation/native';
import { useWallet } from '../../contexts/WalletContext';
import { processWalletData } from '../../utils/walletUtils';

export default function ImportWallet({ navigation, route }) {
  const { updateSelectedWallet } = useWallet();
  const [privateKey, setPrivateKey] = useState('');
  const [loading, setLoading] = useState(false);
  const { chain } = route.params || {};

  const handleImport = async () => {
    if (!privateKey.trim()) {
      Alert.alert('Error', 'Please enter private key');
      return;
    }

    navigation.navigate('PasswordVerification', {
      screen: 'PasswordInput',
      params: {
        purpose: 'import_wallet',
        title: 'Import Wallet',
        chain,
        privateKey,
        onSuccess: async (password) => {
          navigation.navigate('LoadingWallet', {
            chain,
            privateKey,
            password
          });
          return true;
        }
      }
    });
  };

  const importWallet = async (password) => {
    try {
      const deviceId = await DeviceManager.getDeviceId();
      const response = await api.importPrivateKey(deviceId, chain, privateKey, password);
      
      if (response?.status === 'success') {
        // 处理钱包数据，确保头像URL正确
        if (response.wallet) {
          const processedWallet = processWalletData(response.wallet);
          await updateSelectedWallet(processedWallet);
        }
        
        // 直接使用 CommonActions.reset 重置导航栈并进入主页面
        navigation.dispatch(
          CommonActions.reset({
            index: 0,
            routes: [{ name: 'MainStack' }]
          })
        );
      }
    } catch (error) {
      console.error('Import wallet error:', error);
      Alert.alert('Error', 'Failed to import wallet');
    }
  };

  const fetchWalletBalance = async (deviceId) => {
    try {
      const balanceResponse = await api.getWalletBalance(deviceId);
      // 处理余额数据
    } catch (error) {
      console.error('Error fetching wallet balance:', error);
      Alert.alert('Error', 'Failed to fetch wallet balance');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'right', 'left']}>
      <Header 
        title="Import Wallet"
        onBack={() => navigation.goBack()}
      />
      
      <View style={styles.content}>
        <Text style={styles.label}>Enter Private Key</Text>
        <TextInput
          style={styles.input}
          value={privateKey}
          onChangeText={setPrivateKey}
          placeholder="Enter your private key"
          placeholderTextColor="#8E8E8E"
          secureTextEntry
          multiline
        />

        <TouchableOpacity 
          style={[
            styles.button,
            !privateKey.trim() && styles.buttonDisabled
          ]}
          onPress={handleImport}
          disabled={!privateKey.trim()}
        >
          <Text style={styles.buttonText}>Import</Text>
        </TouchableOpacity>
      </View>

      {loading && <Loading />}
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
    padding: 20,
  },
  label: {
    fontSize: 16,
    color: '#FFFFFF',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#272C52',
    borderRadius: 12,
    padding: 16,
    color: '#FFFFFF',
    fontSize: 16,
    minHeight: 120,
    textAlignVertical: 'top',
  },
  button: {
    backgroundColor: '#1FC595',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 24,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  option: {
    backgroundColor: '#1FC595',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 24,
  },
  optionTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});